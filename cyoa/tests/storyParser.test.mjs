import test from "node:test";
import assert from "node:assert/strict";

import { getValidationExample, parseStory } from "../js/utils/storyParser.js";

test("parseStory parses the bundled validation example", () => {
  const parsed = parseStory(getValidationExample());

  assert.ok(parsed[1]);
  assert.equal(parsed[1].title, "The Beginning");
  assert.equal(parsed[4].choicesEndingText, "The End");
});

test("parseStory fails when keywords section is missing", () => {
  const markdown = `# Story Title

## Chapter 1
### Title
Start

### Content
Hello

### Choices
The End`;

  assert.throws(
    () => parseStory(markdown),
    (error) =>
      error instanceof Error &&
      error.message.includes("[KEYWORDS_SECTION_REQUIRED]"),
  );
});

test("parseStory fails when choice numbering is not sequential", () => {
  const markdown = `# Story Title

## Keywords
- mystery
- adventure
- discovery

## Chapter 1
### Title
Start

### Content
Hello

### Choices
2. Jump ahead -> 2

## Chapter 2
### Title
End

### Content
Done

### Choices
The End`;

  assert.throws(
    () => parseStory(markdown),
    (error) =>
      error instanceof Error && error.message.includes("[CHOICE_LIST_ORDER]"),
  );
});

test("parseStory fails when chapter choice references itself", () => {
  const markdown = `# Story Title

## Keywords
- mystery
- adventure
- discovery

## Chapter 1
### Title
Start

### Content
Hello

### Choices
1. Stay here -> 1`;

  assert.throws(
    () => parseStory(markdown),
    (error) =>
      error instanceof Error &&
      error.message.includes("[CHOICE_NOT_SELF_REFERENTIAL]"),
  );
});
