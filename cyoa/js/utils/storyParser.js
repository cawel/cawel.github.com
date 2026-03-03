/**
 * Story parser for markdown format.
 *
 * Validation rules:
 * 1) Story must begin with a top-level heading: # Story Title
 * 2) Chapter heading format: ## Chapter N
 *    - Chapter numbers must be unique
 *    - First chapter must be Chapter 1
 *    - A blank line is required above each chapter heading
 * 3) Chapter section headings must be exactly:
 *    - ### Title
 *    - ### Content
 *    - ### Choices
 * 4) Every chapter must include non-empty title, content, and choices
 * 5) Choice line format: N. Choice text -> ChapterNumber
 *    - Choice list must be ascending and start at 1 (1, 2, 3, ...)
 * 6) Choice targets:
 *    - Must reference an existing chapter
 *    - Must not reference the same chapter
 */

const REGEX = {
  storyTitleHeading: /^#\s+.+$/,
  chapterHeading: /##\s+Chapter\s+(\d+)/i,
  chapterSectionHeading: /###\s+(\w+)/i,
  choiceLine: /^(\d+)\.\s+(.+?)\s*->\s*(\d+)$/,
};

const CHAPTER_SECTION_HEADING_NAMES = {
  title: "title",
  content: "content",
  choices: "choices",
};

const CHAPTER_SECTIONS = Object.freeze([
  CHAPTER_SECTION_HEADING_NAMES.title,
  CHAPTER_SECTION_HEADING_NAMES.content,
  CHAPTER_SECTION_HEADING_NAMES.choices,
]);

export const PARSER_RULES = Object.freeze({
  STORY_TITLE_HEADING:
    "Story must begin with a top-level title in format: # Story Title",
  CHAPTER_HEADING_FORMAT: "Each chapter heading must follow: ## Chapter N",
  CHAPTER_HEADING_BLANK_LINE:
    "Each chapter heading must have a blank line above it",
  UNIQUE_CHAPTER_NUMBERS: "Chapter numbers must be unique",
  VALID_SECTION_HEADINGS:
    "Section headings must be one of: Title, Content, Choices",
  CHOICE_LINE_FORMAT:
    "Each choice line must follow: 1. Choice text -> ChapterNumber",
  CHOICE_LIST_ORDER: "Choices must be an ascending ordered list starting at 1",
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

function flushCurrentChapterSection(state) {
  const {
    chapters,
    currentChapter,
    currentChapterKey,
    currentChapterSection,
    currentChapterContent,
  } = state;

  if (
    !currentChapter ||
    !currentChapterSection ||
    currentChapterContent.length === 0
  ) {
    return state;
  }

  const text = currentChapterContent.join("\n").trim();
  const updatedChapter =
    currentChapterSection === CHAPTER_SECTION_HEADING_NAMES.choices
      ? { ...currentChapter, choices: parseChoices(text) }
      : { ...currentChapter, [currentChapterSection]: text };

  return {
    ...state,
    chapters: {
      ...chapters,
      [currentChapterKey]: updatedChapter,
    },
    currentChapter: updatedChapter,
    currentChapterContent: [],
  };
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

  const initialState = {
    chapters: {},
    currentChapter: null,
    currentChapterKey: null,
    currentChapterSection: null,
    currentChapterContent: [],
  };

  const finalState = lines.entries().reduce((state, [lineIndex, line]) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      const flushedState = flushCurrentChapterSection(state);
      const chapterMatch = trimmed.match(REGEX.chapterHeading);
      if (!chapterMatch) {
        throw new Error(
          buildRuleError(
            "CHAPTER_HEADING_FORMAT",
            `Invalid chapter format: "${trimmed}".`,
          ),
        );
      }

      if (lineIndex > 0 && lines[lineIndex - 1].trim() !== "") {
        throw new Error(
          buildRuleError(
            "CHAPTER_HEADING_BLANK_LINE",
            `Chapter heading must be preceded by an empty line: "${trimmed}".`,
          ),
        );
      }

      const chapterKey = chapterMatch[1];
      if (flushedState.chapters[chapterKey]) {
        throw new Error(
          buildRuleError(
            "UNIQUE_CHAPTER_NUMBERS",
            `Duplicate chapter number found: Chapter ${chapterKey}.`,
          ),
        );
      }

      const newChapter = {
        number: parseInt(chapterKey),
        title: "",
        content: "",
        choices: [],
      };

      return {
        ...flushedState,
        chapters: {
          ...flushedState.chapters,
          [chapterKey]: newChapter,
        },
        currentChapter: newChapter,
        currentChapterKey: chapterKey,
        currentChapterSection: null,
        currentChapterContent: [],
      };
    }

    if (trimmed.startsWith("### ")) {
      const flushedState = flushCurrentChapterSection(state);
      const sectionMatch = trimmed.match(REGEX.chapterSectionHeading);
      if (!sectionMatch) {
        throw new Error(
          buildRuleError(
            "VALID_SECTION_HEADINGS",
            `Invalid section format: "${trimmed}".`,
          ),
        );
      }

      const sectionName = sectionMatch[1].toLowerCase();
      if (!CHAPTER_SECTIONS.includes(sectionName)) {
        throw new Error(
          buildRuleError(
            "VALID_SECTION_HEADINGS",
            `Invalid section name: "${sectionName}".`,
          ),
        );
      }

      return {
        ...flushedState,
        currentChapterSection: sectionName,
        currentChapterContent: [],
      };
    }

    if (state.currentChapter && state.currentChapterSection && trimmed) {
      return {
        ...state,
        currentChapterContent: [...state.currentChapterContent, line],
      };
    }

    return state;
  }, initialState);

  const chapters = flushCurrentChapterSection(finalState).chapters;

  // Validate structure
  validateStory(chapters);

  return chapters;
}

function parseChoices(choicesText) {
  const lines = choicesText.split("\n").filter((l) => l.trim());

  return lines.reduce((choices, line, index) => {
    const trimmedLine = line.trim();
    const match = trimmedLine.match(REGEX.choiceLine);
    if (!match) {
      throw new Error(
        buildRuleError(
          "CHOICE_LINE_FORMAT",
          `Invalid choice format: "${trimmedLine}".`,
        ),
      );
    }

    const choiceNumber = parseInt(match[1]);
    const expectedChoiceNumber = index + 1;
    if (choiceNumber !== expectedChoiceNumber) {
      throw new Error(
        buildRuleError(
          "CHOICE_LIST_ORDER",
          `Expected choice number ${expectedChoiceNumber}, but found ${choiceNumber}.`,
        ),
      );
    }

    return [
      ...choices,
      {
        text: match[2],
        chapterNumber: parseInt(match[3]),
      },
    ];
  }, []);
}

function validateStory(chapters) {
  const chapterEntries = Object.entries(chapters);
  if (chapterEntries.length === 0) {
    throw new Error(buildRuleError("AT_LEAST_ONE_CHAPTER"));
  }

  const requiredFieldErrors = chapterEntries.flatMap(([num, chapter]) => [
    ...(!chapter.title
      ? [
          buildRuleError(
            "CHAPTER_REQUIRED_FIELDS",
            `Chapter ${num} missing ### Title section.`,
          ),
        ]
      : []),
    ...(!chapter.content
      ? [
          buildRuleError(
            "CHAPTER_REQUIRED_FIELDS",
            `Chapter ${num} missing ### Content section.`,
          ),
        ]
      : []),
    ...(!chapter.choices || chapter.choices.length === 0
      ? [
          buildRuleError(
            "CHAPTER_REQUIRED_FIELDS",
            `Chapter ${num} missing ### Choices section or has no choices.`,
          ),
        ]
      : []),
  ]);

  const choiceReferenceErrors = chapterEntries.flatMap(([num, chapter]) =>
    chapter.choices.flatMap((choice) => {
      const missingTargetError = !chapters[choice.chapterNumber.toString()]
        ? [
            buildRuleError(
              "CHOICE_TARGET_EXISTS",
              `Chapter ${num}: Choice refers to non-existent Chapter ${choice.chapterNumber}.`,
            ),
          ]
        : [];

      const selfReferenceError =
        choice.chapterNumber === parseInt(num)
          ? [
              buildRuleError(
                "CHOICE_NOT_SELF_REFERENTIAL",
                `Chapter ${num}: Choice cannot reference Chapter ${num}.`,
              ),
            ]
          : [];

      return [...missingTargetError, ...selfReferenceError];
    }),
  );

  const chapterNums = chapterEntries
    .map(([num]) => Number(num))
    .sort((a, b) => a - b);

  const firstChapterError =
    chapterNums[0] !== 1 ? [buildRuleError("FIRST_CHAPTER_IS_ONE")] : [];

  const errors = [
    ...requiredFieldErrors,
    ...choiceReferenceErrors,
    ...firstChapterError,
  ];

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
