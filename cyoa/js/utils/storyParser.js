/**
 * Story parser for markdown format
 * Expects format:
 * ## Chapter N
 * ### Title
 * Title text
 * ### Content
 * Chapter content text
 * ### Choices
 * 1. Choice text -> N
 * 2. Another choice -> M
 */

const REGEX = {
  storyTitleHeading: /^#\s+.+$/,
  chapterHeading: /##\s+Chapter\s+(\d+)/i,
  sectionHeading: /###\s+(\w+)/i,
  choiceLine: /^\d+\.\s+(.+?)\s*->\s*(\d+)$/,
};

const CHAPTER_SECTION_NAMES = {
  title: "title",
  content: "content",
  choices: "choices",
};

const ALLOWED_SECTIONS = Object.freeze([
  CHAPTER_SECTION_NAMES.title,
  CHAPTER_SECTION_NAMES.content,
  CHAPTER_SECTION_NAMES.choices,
]);

export const PARSER_RULES = Object.freeze({
  STORY_TITLE_HEADING:
    "Story must begin with a top-level title in format: # Story Title",
  CHAPTER_HEADING_FORMAT: "Each chapter heading must follow: ## Chapter N",
  UNIQUE_CHAPTER_NUMBERS: "Chapter numbers must be unique",
  VALID_SECTION_HEADINGS:
    "Section headings must be one of: Title, Content, Choices",
  CHOICE_LINE_FORMAT:
    "Each choice line must follow: 1. Choice text -> ChapterNumber",
  CHAPTER_REQUIRED_FIELDS:
    "Every chapter must include title, content, and choices",
  CHOICE_TARGET_EXISTS: "Choice targets must reference existing chapters",
  CHOICE_NOT_SELF_REFERENTIAL:
    "Choice targets must not reference the same chapter they are in",
  FIRST_CHAPTER_IS_ONE: "First chapter must be Chapter 1",
  AT_LEAST_ONE_CHAPTER:
    "No chapters found. Add at least one chapter in format: ## Chapter N",
});

function buildRuleError(ruleName, details) {
  const base = PARSER_RULES[ruleName] || "Unknown parser rule";
  return `[${ruleName}] ${base}${details ? `\n${details}` : ""}`;
}

export function parseStory(markdown) {
  const lines = markdown.split("\n");

  const firstNonEmptyLine = lines.find((line) => line.trim());
  if (
    !firstNonEmptyLine ||
    !REGEX.storyTitleHeading.test(firstNonEmptyLine.trim())
  ) {
    throw new Error(buildRuleError("STORY_TITLE_HEADING"));
  }

  const chapters = {};
  let currentChapter = null;
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect chapter heading
    if (trimmed.startsWith("## ")) {
      // Save previous content (including parsing choices if necessary)
      if (currentChapter && currentSection && currentContent.length > 0) {
        const text = currentContent.join("\n").trim();
        if (currentSection === "choices") {
          currentChapter.choices = parseChoices(text);
        } else {
          currentChapter[currentSection] = text;
        }
      }

      const chapterMatch = trimmed.match(REGEX.chapterHeading);
      if (!chapterMatch) {
        throw new Error(
          buildRuleError(
            "CHAPTER_HEADING_FORMAT",
            `Invalid chapter format: "${trimmed}".`,
          ),
        );
      }

      const chapterNum = chapterMatch[1];
      if (chapters[chapterNum]) {
        throw new Error(
          buildRuleError(
            "UNIQUE_CHAPTER_NUMBERS",
            `Duplicate chapter number found: Chapter ${chapterNum}.`,
          ),
        );
      }

      currentChapter = {
        number: parseInt(chapterNum),
        title: "",
        content: "",
        choices: [],
      };
      chapters[chapterNum] = currentChapter;
      currentSection = null;
      currentContent = [];
    }
    // Detect section heading
    else if (trimmed.startsWith("### ")) {
      // Save previous section content
      if (currentChapter && currentSection && currentContent.length > 0) {
        const text = currentContent.join("\n").trim();
        if (currentSection === "choices") {
          currentChapter.choices = parseChoices(text);
        } else {
          currentChapter[currentSection] = text;
        }
      }

      const sectionMatch = trimmed.match(REGEX.sectionHeading);
      if (!sectionMatch) {
        throw new Error(
          buildRuleError(
            "VALID_SECTION_HEADINGS",
            `Invalid section format: "${trimmed}".`,
          ),
        );
      }

      currentSection = sectionMatch[1].toLowerCase();
      if (!ALLOWED_SECTIONS.includes(currentSection)) {
        throw new Error(
          buildRuleError(
            "VALID_SECTION_HEADINGS",
            `Invalid section name: "${currentSection}".`,
          ),
        );
      }
      currentContent = [];
    }
    // Accumulate content
    else if (currentChapter && currentSection && trimmed) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentChapter && currentSection && currentContent.length > 0) {
    const text = currentContent.join("\n").trim();
    if (currentSection === "choices") {
      currentChapter.choices = parseChoices(text);
    } else {
      currentChapter[currentSection] = text;
    }
  }

  // Validate structure
  validateStory(chapters);

  return chapters;
}

function parseChoices(choicesText) {
  const lines = choicesText.split("\n").filter((l) => l.trim());
  const choices = [];

  for (const line of lines) {
    const match = line.trim().match(REGEX.choiceLine);
    if (!match) {
      throw new Error(
        buildRuleError(
          "CHOICE_LINE_FORMAT",
          `Invalid choice format: "${line.trim()}".`,
        ),
      );
    }

    choices.push({
      text: match[1],
      chapterNumber: parseInt(match[2]),
    });
  }

  return choices;
}

function validateStory(chapters) {
  const errors = [];

  // Check if any chapters exist
  if (Object.keys(chapters).length === 0) {
    errors.push(buildRuleError("AT_LEAST_ONE_CHAPTER"));
    throw new Error(errors.join("\n"));
  }

  // Validate each chapter
  for (const [num, chapter] of Object.entries(chapters)) {
    if (!chapter.title) {
      errors.push(
        buildRuleError(
          "CHAPTER_REQUIRED_FIELDS",
          `Chapter ${num} missing ### Title section.`,
        ),
      );
    }
    if (!chapter.content) {
      errors.push(
        buildRuleError(
          "CHAPTER_REQUIRED_FIELDS",
          `Chapter ${num} missing ### Content section.`,
        ),
      );
    }
    if (!chapter.choices || chapter.choices.length === 0) {
      errors.push(
        buildRuleError(
          "CHAPTER_REQUIRED_FIELDS",
          `Chapter ${num} missing ### Choices section or has no choices.`,
        ),
      );
    }

    // Validate choice references
    for (const choice of chapter.choices) {
      const refChapter = chapters[choice.chapterNumber.toString()];
      if (!refChapter) {
        errors.push(
          buildRuleError(
            "CHOICE_TARGET_EXISTS",
            `Chapter ${num}: Choice refers to non-existent Chapter ${choice.chapterNumber}.`,
          ),
        );
      }

      if (choice.chapterNumber === parseInt(num)) {
        errors.push(
          buildRuleError(
            "CHOICE_NOT_SELF_REFERENTIAL",
            `Chapter ${num}: Choice cannot reference Chapter ${num}.`,
          ),
        );
      }
    }
  }

  // Check that chapter numbers are sequential starting from 1
  const chapterNums = Object.keys(chapters)
    .map(Number)
    .sort((a, b) => a - b);
  if (chapterNums[0] !== 1) {
    errors.push(buildRuleError("FIRST_CHAPTER_IS_ONE"));
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

export function getValidationExample() {
  return `# Story Title

## Chapter 1
### Title
The Beginning

### Content
You wake up in a mysterious forest. The air is thick with fog and you hear strange sounds all around you.

### Choices
1. Explore the forest -> 2
2. Find shelter -> 3

## Chapter 2
### Title
Lost in the Woods

### Content
You venture deeper into the forest...

### Choices
1. Continue forward -> 4
2. Go back -> 1

## Chapter 3
### Title
Safe Haven

### Content
You find an old cabin...

### Choices
1. Enter the cabin -> 4
2. Move on -> 2

## Chapter 4
### Title
The End

### Content
After many adventures, your journey ends here.

### Choices
1. Start over -> 1`;
}
