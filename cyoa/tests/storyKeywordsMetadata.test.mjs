import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const STORIES_DIR = path.resolve("assets/stories");
const METADATA_PATH = path.resolve("assets/stories/metadata-stories.json");

function getStoryNumber(fileName) {
  return /^\d+$/.test(fileName) ? Number(fileName) : null;
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

  const storyFolders = readdirSync(STORIES_DIR)
    .filter((entry) => /^\d+$/.test(entry))
    .sort((left, right) => getStoryNumber(left) - getStoryNumber(right));

  assert.ok(storyFolders.length > 0, "No story markdown folders found");

  for (const storyFolder of storyFolders) {
    const storyNumber = getStoryNumber(storyFolder);
    assert.ok(storyNumber !== null, `Invalid story folder name: ${storyFolder}`);
    const storyFile = `${storyFolder}/story.md`;

    const metadataEntry = metadataByNumber.get(storyNumber);
    assert.ok(
      metadataEntry,
      `${storyFile}: missing metadata entry for number ${storyNumber}`,
    );

    const markdown = readFileSync(
      path.join(STORIES_DIR, storyFolder, "story.md"),
      "utf8",
    );
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
