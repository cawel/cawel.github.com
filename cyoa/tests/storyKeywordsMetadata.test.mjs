import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const STORIES_DIR = path.resolve("assets/stories");
const METADATA_PATH = path.resolve("assets/stories/metadata.json");

function getStoryNumber(fileName) {
  const match = fileName.match(/^story-(\d+)\.md$/);
  return match ? Number(match[1]) : null;
}

function extractStoryKeywords(markdown, storyFile) {
  const lines = markdown.split("\n");
  const keywordsHeadingIndex = lines.findIndex(
    (line) => line.trim().toLowerCase() === "## keywords",
  );

  assert.ok(
    keywordsHeadingIndex >= 0,
    `${storyFile}: missing '## Keywords' heading`,
  );

  const keywords = [];
  for (let i = keywordsHeadingIndex + 1; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("## ")) {
      break;
    }

    if (trimmed.startsWith("- ")) {
      keywords.push(trimmed.slice(2).trim().toLowerCase());
    }
  }

  assert.equal(
    keywords.length,
    3,
    `${storyFile}: expected exactly 3 keywords, got ${keywords.length}`,
  );

  return keywords;
}

test("stories: metadata keywords match markdown keywords", () => {
  const metadata = JSON.parse(readFileSync(METADATA_PATH, "utf8"));
  const metadataByNumber = new Map(metadata.map((entry) => [entry.number, entry]));

  const storyFiles = readdirSync(STORIES_DIR)
    .filter((file) => /^story-\d+\.md$/.test(file))
    .sort((left, right) => getStoryNumber(left) - getStoryNumber(right));

  assert.ok(storyFiles.length > 0, "No story markdown files found");

  for (const storyFile of storyFiles) {
    const storyNumber = getStoryNumber(storyFile);
    assert.ok(storyNumber !== null, `Invalid story file name: ${storyFile}`);

    const metadataEntry = metadataByNumber.get(storyNumber);
    assert.ok(
      metadataEntry,
      `${storyFile}: missing metadata entry for number ${storyNumber}`,
    );

    const markdown = readFileSync(path.join(STORIES_DIR, storyFile), "utf8");
    const storyKeywords = extractStoryKeywords(markdown, storyFile);
    const metadataKeywords = (metadataEntry.keywords || []).map((keyword) =>
      String(keyword).trim().toLowerCase(),
    );

    assert.deepEqual(
      metadataKeywords,
      storyKeywords,
      `${storyFile}: metadata keywords ${JSON.stringify(metadataKeywords)} do not match markdown keywords ${JSON.stringify(storyKeywords)}`,
    );
  }
});
