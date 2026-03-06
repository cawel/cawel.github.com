import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { parseStory } from "../js/utils/storyParser.js";

const STORIES_DIR = path.resolve("assets/stories");

const DISCOVERY_TERMS = [
  "discover",
  "discovery",
  "reveal",
  "truth",
  "secret",
  "evidence",
  "map",
  "archive",
  "ledger",
  "signal",
  "beacon",
  "inscription",
  "codex",
  "warning",
];

const DANGER_TERMS = [
  "danger",
  "threat",
  "risk",
  "collapse",
  "intruder",
  "lockdown",
  "black-market",
  "ambush",
  "compromised",
  "raid",
  "weapon",
  "failing",
  "emergency",
  "forced",
  "unstable",
  "crisis",
  "deadlock",
  "mandatory",
  "storm",
  "shadow",
  "wyrm",
  "radiation",
  "flood",
  "panic",
  "hostile",
  "sabotage",
  "trap",
  "fatal",
  "burn",
  "detonate",
];

const SUCCESS_ENDING_TERMS = [
  "alive",
  "saved",
  "survive",
  "hope",
  "peace",
  "restored",
  "safe",
  "victory",
  "reopens",
  "lived",
  "accord",
  "dawn",
  "home",
  "stabil",
  "clear",
  "smile",
];

const VERY_BAD_ENDING_TERMS = [
  "you die",
  "you are gone",
  "your watch ends forever",
  "last breath",
  "flatline",
  "takes you",
  "burns",
  "collapse",
  "fatal",
  "over",
  "never return",
  "ends forever",
  "scorched",
  "ash",
  "drown",
  "drifts silent",
  "gone",
];

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function getStoryFiles() {
  return readdirSync(STORIES_DIR)
    .filter((entry) => /^\d+$/.test(entry))
    .sort((left, right) => Number(left) - Number(right));
}

function asChapterList(parsedChapters) {
  return Object.values(parsedChapters).sort(
    (left, right) => left.number - right.number,
  );
}

test("storytelling: stories follow structural storytelling guidelines", () => {
  const storyFiles = getStoryFiles();
  assert.ok(storyFiles.length > 0, "No story files found under assets/stories");

  for (const storyFolder of storyFiles) {
    const storyFile = `${storyFolder}/story.md`;
    const markdown = readFileSync(
      path.join(STORIES_DIR, storyFolder, "story.md"),
      "utf8",
    );
    const parsed = parseStory(markdown);
    const chapters = asChapterList(parsed);

    const endingChapters = chapters.filter(
      (chapter) => chapter.choicesEndingText === "The End",
    );
    const nonEndingChapters = chapters.filter(
      (chapter) => chapter.choicesEndingText !== "The End",
    );

    assert.ok(
      endingChapters.length >= 2 && endingChapters.length <= 5,
      `${storyFile}: expected 2-5 endings, found ${endingChapters.length}`,
    );

    const veryBadEndingChapters = endingChapters.filter((chapter) =>
      includesAny(
        `${chapter.title}\n${chapter.content}`.toLowerCase(),
        VERY_BAD_ENDING_TERMS,
      ),
    );

    const successfulEndingChapters = endingChapters.filter((chapter) =>
      includesAny(
        `${chapter.title}\n${chapter.content}`.toLowerCase(),
        SUCCESS_ENDING_TERMS,
      ),
    );

    const nonEndingText = nonEndingChapters
      .map((chapter) => `${chapter.title}\n${chapter.content}`.toLowerCase())
      .join("\n");

    assert.ok(
      includesAny(nonEndingText, DISCOVERY_TERMS),
      `${storyFile}: missing a clear discovery-oriented path signal`,
    );

    const veryBadEndingNumbers = new Set(
      veryBadEndingChapters.map((chapter) => chapter.number),
    );
    const hasExplicitDangerPath = nonEndingChapters.some((chapter) =>
      chapter.choices.some((choice) =>
        veryBadEndingNumbers.has(choice.chapterNumber),
      ),
    );
    const hasDangerSignal = includesAny(nonEndingText, DANGER_TERMS);

    assert.ok(
      hasDangerSignal || hasExplicitDangerPath,
      `${storyFile}: missing a clear danger-oriented path signal`,
    );

    for (const chapter of nonEndingChapters) {
      assert.ok(
        chapter.choices.length >= 2,
        `${storyFile} chapter ${chapter.number}: expected at least 2 choices for meaningful branching`,
      );

      const uniqueTargets = new Set(
        chapter.choices.map((choice) => choice.chapterNumber),
      );
      assert.equal(
        uniqueTargets.size,
        chapter.choices.length,
        `${storyFile} chapter ${chapter.number}: choices should branch to distinct targets`,
      );
    }

    assert.ok(
      successfulEndingChapters.length >= 1,
      `${storyFile}: expected at least one successful/pleasant ending`,
    );

    assert.ok(
      veryBadEndingChapters.length >= 1,
      `${storyFile}: expected at least one very bad ending`,
    );
  }
});
