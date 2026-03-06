#!/usr/bin/env node
/**
 * png-to-webp.mjs
 *
 * Converts PNG images to WEBP format using sharp.
 * Designed for batch conversion in the current directory.
 *
 * Features
 * --------
 * • Converts PNG → WEBP
 * • Removes metadata
 * • Preserves original filename (only extension changes)
 * • Supports converting a single file or an entire directory
 * • Configurable quality and resolution parameters
 * • Logs progress to console
 *
 * Usage
 * -----
 * Install dependency:
 *
 *   npm install sharp
 *
 * Run script:
 *
 *   node png-to-webp.mjs
 *
 * Bash equivalent (ImageMagick example):
 *
 *   for f in *.png; do
 *     convert "$f" -strip -quality 90 "${f%.png}.webp"
 *   done
 *
 */

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

////////////////////////////////////////////////////////////
// CONFIGURATION
////////////////////////////////////////////////////////////

const QUALITY = 90;
const TARGET_WIDTH = 1536;
const TARGET_HEIGHT = 864;
const ASPECT_RATIO = "16:9";
const COLOR_PROFILE = "sRGB";

const AUTO_CONVERT_DIRECTORY = true;

const INPUT_DIR = process.cwd();
const OUTPUT_DIR = process.cwd();

////////////////////////////////////////////////////////////
// START LOG
////////////////////////////////////////////////////////////

console.log("--------------------------------------------------");
console.log("PNG → WEBP conversion started");
console.log(`Directory: ${INPUT_DIR}`);
console.log(`Quality: ${QUALITY}`);
console.log(`Target resolution: ${TARGET_WIDTH}x${TARGET_HEIGHT}`);
console.log(`Aspect ratio: ${ASPECT_RATIO}`);
console.log("Metadata: stripped");
console.log("--------------------------------------------------");

////////////////////////////////////////////////////////////
// CORE CONVERSION FUNCTION
////////////////////////////////////////////////////////////

async function convertImage(file) {
  const inputPath = path.join(INPUT_DIR, file);
  const outputName = path.parse(file).name + ".webp";
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    await sharp(inputPath)
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: "fill",
      })
      .webp({
        quality: QUALITY,
      })
      .toFile(outputPath);

    console.log(`✔ Converted: ${file} → ${outputName}`);
  } catch (err) {
    console.error(`✖ Failed: ${file}`, err.message);
  }
}

////////////////////////////////////////////////////////////
// DIRECTORY PROCESSING
////////////////////////////////////////////////////////////

async function processDirectory() {
  const files = await fs.readdir(INPUT_DIR);

  const pngFiles = files.filter((f) => f.toLowerCase().endsWith(".png"));

  if (pngFiles.length === 0) {
    console.log("No PNG files found.");
    return;
  }

  for (const file of pngFiles) {
    await convertImage(file);
  }

  console.log("--------------------------------------------------");
  console.log("Conversion complete.");
  console.log("--------------------------------------------------");
}

////////////////////////////////////////////////////////////
// ENTRY POINT
////////////////////////////////////////////////////////////

if (AUTO_CONVERT_DIRECTORY) {
  processDirectory();
}
