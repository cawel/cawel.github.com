import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const DEFAULT_INPUT = "story-pipeline/output/06-metadata.json";
const DEFAULT_OUTPUT_DIR = "story-pipeline/output/07-images";
const DEFAULT_MODEL = "gpt-image-1";
const API_IMAGE_SIZE = "1536x1024";
const OUTPUT_WIDTH = 1536;
const OUTPUT_HEIGHT = 864;
const WEBP_QUALITY = 90;
const IMAGE_COLOR_SPACE = "srgb";
const DISABLE_CROP = process.env.IMAGE_DISABLE_CROP === "1";

function readPositiveIntEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${name}: expected non-negative number, got '${raw}'.`);
  }

  return Math.floor(value);
}

const REQUEST_TIMEOUT_MS = readPositiveIntEnv("IMAGE_REQUEST_TIMEOUT_MS", 240000);
const MAX_RETRIES = readPositiveIntEnv("IMAGE_MAX_RETRIES", 1);
const RETRY_BASE_DELAY_MS = readPositiveIntEnv("IMAGE_RETRY_BASE_DELAY_MS", 1000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(attempt) {
  return RETRY_BASE_DELAY_MS * (attempt + 1);
}

function isRetryableStatus(status) {
  return [408, 409, 429, 500, 502, 503, 504].includes(status);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function chapterFilename(chapter) {
  return `${chapter.number}.webp`;
}

function parseImagePayload(payload, fallbackModel) {
  const data = payload?.data?.[0];
  const modelVersionUsed = payload?.model || data?.model || fallbackModel;

  if (!data?.b64_json) {
    throw new Error("Image API response missing b64_json image data.");
  }

  return {
    pngBuffer: Buffer.from(data.b64_json, "base64"),
    modelVersionUsed,
  };
}

async function renderWebp(pngBuffer) {
  const imagePipeline = sharp(pngBuffer);

  if (!DISABLE_CROP) {
    imagePipeline.resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
      fit: "cover",
      position: "attention",
    });
  }

  return imagePipeline
    .toColourspace(IMAGE_COLOR_SPACE)
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

function pickTargetChapters(chapters) {
  const selected = new Map();

  for (const chapter of chapters) {
    if (chapter.number === 1) {
      selected.set(chapter.number, chapter);
    }
  }

  for (const chapter of chapters) {
    if (chapter.endingType !== null && chapter.endingType !== undefined) {
      selected.set(chapter.number, chapter);
    }
  }

  return [...selected.values()].sort((a, b) => a.number - b.number);
}

async function generateImage({ apiKey, model, size, prompt }) {
  let apiCalls = 0;
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      apiCalls += 1;
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          prompt,
          size,
          quality: "high",
        }),
      });
      if (!response.ok) {
        const details = await response.text();
        const statusError = new Error(
          `Image API request failed (${response.status}): ${details}`,
        );

        if (attempt < MAX_RETRIES && isRetryableStatus(response.status)) {
          lastError = statusError;
          await sleep(retryDelay(attempt));
          continue;
        }

        throw statusError;
      }

      const payload = await response.json();
      const { pngBuffer, modelVersionUsed } = parseImagePayload(payload, model);
      const imageBuffer = await renderWebp(pngBuffer);

      return {
        imageBuffer,
        modelVersionUsed,
        apiCalls,
      };
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      lastError = isAbort
        ? new Error(`Image API request timed out after ${REQUEST_TIMEOUT_MS}ms.`)
        : error;

      if (attempt < MAX_RETRIES) {
        await sleep(retryDelay(attempt));
        continue;
      }

      const message =
        lastError instanceof Error ? lastError.message : String(lastError);
      throw new Error(`Image API request failed after retries: ${message}`);
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  throw lastError || new Error("Image generation failed.");
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const inputPath = process.env.IMAGE_INPUT || DEFAULT_INPUT;
  const outputDir = process.env.IMAGE_OUTPUT_DIR || DEFAULT_OUTPUT_DIR;
  const model = process.env.IMAGE_MODEL || DEFAULT_MODEL;
  const size = API_IMAGE_SIZE;

  const raw = await readFile(inputPath, "utf8");
  const metadata = JSON.parse(raw);

  const storyMeta = metadata?.storyMeta;
  const chapters = metadata?.imageMeta?.chapters;

  if (!storyMeta || !Array.isArray(chapters)) {
    throw new Error(
      `Invalid Step 6 metadata at ${inputPath}. Expected storyMeta and imageMeta.chapters[].`,
    );
  }

  const targets = pickTargetChapters(chapters);

  if (targets.length === 0) {
    throw new Error(
      "No target chapters found. Need Chapter 1 and ending chapters.",
    );
  }

  await mkdir(outputDir, { recursive: true });

  const manifest = {
    storyNumber: storyMeta.number,
    storyTitle: storyMeta.title,
    generatedAt: new Date().toISOString(),
    imageModelRequested: model,
    imageModelVersionsUsed: [],
    apiCallsMade: 0,
    size: DISABLE_CROP ? "source" : `${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}`,
    apiRequestedSize: size,
    sourceMetadata: inputPath,
    config: {
      disableCrop: DISABLE_CROP,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
      retryBaseDelayMs: RETRY_BASE_DELAY_MS,
    },
    images: [],
  };

  const startTime = Date.now();
  const forceRegenerate = process.env.IMAGE_FORCE_REGENERATE === "1";
  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const usedModelVersions = new Set();

  for (const chapter of targets) {
    const file = chapterFilename(chapter);
    const outputPath = path.join(outputDir, file);
    const tempPath = `${outputPath}.tmp`;

    if (!forceRegenerate && (await fileExists(outputPath))) {
      manifest.images.push({
        chapter: chapter.number,
        title: chapter.title,
        endingType: chapter.endingType ?? null,
        file,
        prompt: chapter.llmPrompt,
        apiCalls: 0,
        modelVersionUsed: null,
        status: "skipped_existing",
      });
      skippedCount += 1;
      console.log(`Skipped (already exists): ${outputPath}`);
      continue;
    }

    try {
      const { imageBuffer, modelVersionUsed, apiCalls } = await generateImage({
        apiKey,
        model,
        size,
        prompt: chapter.llmPrompt,
      });
      manifest.apiCallsMade += apiCalls;

      usedModelVersions.add(modelVersionUsed);

      await writeFile(tempPath, imageBuffer);
      await rename(tempPath, outputPath);

      manifest.images.push({
        chapter: chapter.number,
        title: chapter.title,
        endingType: chapter.endingType ?? null,
        file,
        prompt: chapter.llmPrompt,
        apiCalls,
        modelVersionUsed,
        status: "ok",
      });

      successCount += 1;
      console.log(`Generated: ${outputPath}`);
    } catch (error) {
      manifest.images.push({
        chapter: chapter.number,
        title: chapter.title,
        endingType: chapter.endingType ?? null,
        file,
        prompt: chapter.llmPrompt,
        apiCalls: 0,
        modelVersionUsed: null,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
      failedCount += 1;

      console.error(`Failed chapter ${chapter.number}:`, error);
    }
  }

  manifest.imageModelVersionsUsed = [...usedModelVersions];
  manifest.summary = {
    targets: targets.length,
    succeeded: successCount,
    skippedExisting: skippedCount,
    failed: failedCount,
    durationMs: Date.now() - startTime,
  };

  const manifestPath = path.join(outputDir, "manifest.json");
  await writeFile(
    manifestPath,
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8",
  );
  console.log(`Wrote manifest: ${manifestPath}`);

  if (successCount === 0 && skippedCount === 0) {
    process.exitCode = 1;
    throw new Error("Step 7 finished with zero successful image generations.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  if (!process.exitCode) {
    process.exitCode = 1;
  }
});
