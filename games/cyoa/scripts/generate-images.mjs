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
const REQUEST_TIMEOUT_MS = Number(process.env.IMAGE_REQUEST_TIMEOUT_MS || 180000);
const MAX_RETRIES = Number(process.env.IMAGE_MAX_RETRIES || 2);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    const timeoutHandle = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    let response;
    try {
      apiCalls += 1;
      response = await fetch("https://api.openai.com/v1/images/generations", {
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
    } catch (error) {
      clearTimeout(timeoutHandle);
      lastError = error;

      if (attempt < MAX_RETRIES) {
        await sleep(1000 * (attempt + 1));
        continue;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Image API request failed after retries: ${message}`);
    }

    clearTimeout(timeoutHandle);

    if (!response.ok) {
      const details = await response.text();
      lastError = new Error(
        `Image API request failed (${response.status}): ${details}`,
      );

      if (attempt < MAX_RETRIES && isRetryableStatus(response.status)) {
        await sleep(1000 * (attempt + 1));
        continue;
      }

      throw lastError;
    }

    const payload = await response.json();
    const data = payload?.data?.[0];
    const modelVersionUsed = payload?.model || data?.model || model;

    if (!data?.b64_json) {
      throw new Error("Image API response missing b64_json image data.");
    }

    const pngBuffer = Buffer.from(data.b64_json, "base64");
    const imageBuffer = await sharp(pngBuffer)
      .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
        fit: "cover",
        position: "attention",
      })
      .toColourspace(IMAGE_COLOR_SPACE)
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    return {
      imageBuffer,
      modelVersionUsed,
      apiCalls,
    };
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
    size: `${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}`,
    apiRequestedSize: size,
    sourceMetadata: inputPath,
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
