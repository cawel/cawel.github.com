import { mkdir, readFile, writeFile } from "node:fs/promises";
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
const REQUEST_TIMEOUT_MS = 120000;

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
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response;
  try {
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
  } finally {
    clearTimeout(timeoutHandle);
  }

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Image API request failed (${response.status}): ${details}`,
    );
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
  };
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

  let successCount = 0;
  const usedModelVersions = new Set();

  for (const chapter of targets) {
    const file = chapterFilename(chapter);
    const outputPath = path.join(outputDir, file);

    try {
      manifest.apiCallsMade += 1;

      const { imageBuffer, modelVersionUsed } = await generateImage({
        apiKey,
        model,
        size,
        prompt: chapter.llmPrompt,
      });

      usedModelVersions.add(modelVersionUsed);

      await writeFile(outputPath, imageBuffer);

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

      console.error(`Failed chapter ${chapter.number}:`, error);
    }
  }

  manifest.imageModelVersionsUsed = [...usedModelVersions];

  const manifestPath = path.join(outputDir, "manifest.json");
  await writeFile(
    manifestPath,
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8",
  );
  console.log(`Wrote manifest: ${manifestPath}`);

  if (successCount === 0) {
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
