/**
 * Story parser for markdown format.
 *
 * Validation rules:
 * 1) Story must begin with a top-level heading: # Story Title
 * 2) Story must include a keywords section before chapters:
 *    - ## Keywords
 *    - Exactly 3 bullet items in format: - keyword
 * 3) Chapter heading format: ## Chapter N
 *    - Chapter numbers must be unique
 *    - Chapter headings must be listed in ascending numeric order
 *    - First chapter must be Chapter 1
 *    - A blank line is required above each chapter heading
 * 4) Chapter section headings must be exactly:
 *    - ### Title
 *    - ### Content
 *    - ### Choices
 *    - Each section may appear at most once per chapter
 * 5) Every chapter must include non-empty title, content, and choices
 * 6) Choices section format:
 *    - Either an ascending list: N. Choice text -> ChapterNumber
 *    - Or a single line: The End (any case)
 *    - Choice list must be ascending and start at 1 (1, 2, 3, ...)
 * 7) Choice targets:
 *    - Must reference an existing chapter
 *    - Must not reference the same chapter
 */

const REGEX = {
  storyTitleHeading: /^#\s+.+$/,
  keywordsHeading: /^##\s+Keywords\s*$/i,
  chapterHeading: /##\s+Chapter\s+(\d+)/i,
  chapterSectionHeading: /###\s+(\w+)/i,
  keywordBullet: /^-\s+.+$/,
  choiceLine: /^(\d+)\.\s+(.+?)\s*->\s*(\d+)$/,
  theEndLine: /^the\s+end$/i,
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
  SINGLE_STORY_TITLE: "Story must contain only one top-level title heading",
  KEYWORDS_SECTION_REQUIRED:
    "Story must include a keywords section before chapters: ## Keywords",
  KEYWORDS_SECTION_POSITION:
    "Keywords section (## Keywords) must appear before the first chapter",
  KEYWORDS_FORMAT:
    "Keywords section must contain exactly 3 bullet items in format: - keyword",
  CHAPTER_HEADING_FORMAT: "Each chapter heading must follow: ## Chapter N",
  CHAPTER_ASCENDING_ORDER:
    "Chapter headings must be listed in ascending numeric order",
  CHAPTER_HEADING_BLANK_LINE:
    "Each chapter heading must have a blank line above it",
  UNIQUE_CHAPTER_NUMBERS: "Chapter numbers must be unique",
  VALID_SECTION_HEADINGS:
    "Section headings must be one of: Title, Content, Choices",
  DUPLICATE_CHAPTER_SECTION:
    "Each chapter section (Title, Content, Choices) may appear only once",
  CHOICE_LINE_FORMAT:
    "Each choice line must follow: 1. Choice text -> ChapterNumber",
  CHOICES_SECTION_FORMAT:
    'Choices section must be either a numbered choice list or exactly "The End"',
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

function parseInteger(value) {
  return Number.parseInt(value, 10);
}

function capitalizeFirstLetter(text) {
  return `${text[0].toUpperCase()}${text.slice(1)}`;
}

function applyChapterSectionContent(chapter, sectionName, text) {
  if (sectionName !== CHAPTER_SECTION_HEADING_NAMES.choices) {
    return { ...chapter, [sectionName]: text };
  }

  const parsedChoices = parseChoicesSection(text);
  return {
    ...chapter,
    choices: parsedChoices.choices,
    choicesEndingText: parsedChoices.choicesEndingText,
  };
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
  const updatedChapter = applyChapterSectionContent(
    currentChapter,
    currentChapterSection,
    text,
  );

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

function assertStoryTitleHeading(lines) {
  const firstNonEmptyLineIndex = lines.findIndex((line) => line.trim());
  if (firstNonEmptyLineIndex < 0) {
    throw new Error(buildRuleError("STORY_TITLE_HEADING"));
  }

  const firstNonEmptyLine = lines[firstNonEmptyLineIndex].trim();
  if (!REGEX.storyTitleHeading.test(firstNonEmptyLine)) {
    throw new Error(buildRuleError("STORY_TITLE_HEADING"));
  }

  const extraStoryTitleLineIndex = lines.findIndex(
    (line, index) =>
      index > firstNonEmptyLineIndex &&
      REGEX.storyTitleHeading.test(line.trim()),
  );

  if (extraStoryTitleLineIndex >= 0) {
    throw new Error(
      buildRuleError(
        "SINGLE_STORY_TITLE",
        `Duplicate top-level title found at line ${extraStoryTitleLineIndex + 1}.`,
      ),
    );
  }
}

function assertKeywordsSection(lines) {
  const keywordsHeadingIndex = lines.findIndex((line) =>
    REGEX.keywordsHeading.test(line.trim()),
  );

  if (keywordsHeadingIndex < 0) {
    throw new Error(buildRuleError("KEYWORDS_SECTION_REQUIRED"));
  }

  const firstChapterIndex = lines.findIndex((line) =>
    /^##\s+Chapter\s+\d+/i.test(line.trim()),
  );

  if (firstChapterIndex >= 0 && keywordsHeadingIndex > firstChapterIndex) {
    throw new Error(buildRuleError("KEYWORDS_SECTION_POSITION"));
  }

  const sectionLines = [];
  for (let index = keywordsHeadingIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (trimmed.startsWith("## ")) {
      break;
    }

    if (trimmed) {
      sectionLines.push(trimmed);
    }
  }

  if (
    sectionLines.length !== 3 ||
    sectionLines.some((line) => !REGEX.keywordBullet.test(line))
  ) {
    throw new Error(buildRuleError("KEYWORDS_FORMAT"));
  }
}

function createInitialParserState() {
  return {
    chapters: {},
    chapterSectionsSeen: {},
    lastChapterNumberSeen: null,
    currentChapter: null,
    currentChapterKey: null,
    currentChapterSection: null,
    currentChapterContent: [],
  };
}

function createEmptyChapter(chapterKey) {
  return {
    number: parseInteger(chapterKey),
    title: "",
    content: "",
    choices: [],
    choicesEndingText: "",
  };
}

function extractChapterKey(trimmed) {
  const chapterMatch = trimmed.match(REGEX.chapterHeading);
  if (!chapterMatch) {
    throw new Error(
      buildRuleError(
        "CHAPTER_HEADING_FORMAT",
        `Invalid chapter format: "${trimmed}".`,
      ),
    );
  }

  return chapterMatch[1];
}

function assertBlankLineBeforeChapterHeading(lines, lineIndex, trimmed) {
  if (lineIndex > 0 && lines[lineIndex - 1].trim() !== "") {
    throw new Error(
      buildRuleError(
        "CHAPTER_HEADING_BLANK_LINE",
        `Chapter heading must be preceded by an empty line: "${trimmed}".`,
      ),
    );
  }
}

function extractChapterSectionName(trimmed) {
  const sectionMatch = trimmed.match(REGEX.chapterSectionHeading);
  if (!sectionMatch) {
    throw new Error(
      buildRuleError(
        "VALID_SECTION_HEADINGS",
        `Invalid section format: "${trimmed}".`,
      ),
    );
  }

  const chapterSectionName = sectionMatch[1].toLowerCase();
  if (!CHAPTER_SECTIONS.includes(chapterSectionName)) {
    throw new Error(
      buildRuleError(
        "VALID_SECTION_HEADINGS",
        `Invalid section name: "${chapterSectionName}".`,
      ),
    );
  }

  return chapterSectionName;
}

function handleChapterHeading(state, trimmed, lineIndex, lines) {
  const flushedState = flushCurrentChapterSection(state);
  assertBlankLineBeforeChapterHeading(lines, lineIndex, trimmed);

  const chapterKey = extractChapterKey(trimmed);
  const chapterNumber = parseInteger(chapterKey);

  if (
    typeof flushedState.lastChapterNumberSeen === "number" &&
    chapterNumber <= flushedState.lastChapterNumberSeen
  ) {
    throw new Error(
      buildRuleError(
        "CHAPTER_ASCENDING_ORDER",
        `Chapter ${chapterNumber} appears after Chapter ${flushedState.lastChapterNumberSeen}.`,
      ),
    );
  }

  if (flushedState.chapters[chapterKey]) {
    throw new Error(
      buildRuleError(
        "UNIQUE_CHAPTER_NUMBERS",
        `Duplicate chapter number found: Chapter ${chapterKey}.`,
      ),
    );
  }

  const newChapter = createEmptyChapter(chapterKey);
  return {
    ...flushedState,
    chapters: {
      ...flushedState.chapters,
      [chapterKey]: newChapter,
    },
    chapterSectionsSeen: {
      ...flushedState.chapterSectionsSeen,
      [chapterKey]: new Set(),
    },
    lastChapterNumberSeen: chapterNumber,
    currentChapter: newChapter,
    currentChapterKey: chapterKey,
    currentChapterSection: null,
    currentChapterContent: [],
  };
}

function handleChapterSectionHeading(state, trimmed) {
  const flushedState = flushCurrentChapterSection(state);
  const chapterSectionName = extractChapterSectionName(trimmed);

  if (!flushedState.currentChapterKey) {
    throw new Error(
      buildRuleError(
        "CHAPTER_HEADING_FORMAT",
        `Section found before chapter heading: "${trimmed}".`,
      ),
    );
  }

  const chapterKey = flushedState.currentChapterKey;
  const seenSections =
    flushedState.chapterSectionsSeen[chapterKey] || new Set();

  if (seenSections.has(chapterSectionName)) {
    throw new Error(
      buildRuleError(
        "DUPLICATE_CHAPTER_SECTION",
        `Chapter ${chapterKey} has duplicate ### ${capitalizeFirstLetter(chapterSectionName)} section.`,
      ),
    );
  }

  const updatedSeenSections = new Set(seenSections);
  updatedSeenSections.add(chapterSectionName);

  return {
    ...flushedState,
    chapterSectionsSeen: {
      ...flushedState.chapterSectionsSeen,
      [chapterKey]: updatedSeenSections,
    },
    currentChapterSection: chapterSectionName,
    currentChapterContent: [],
  };
}

function appendChapterSectionContent(state, line, trimmed) {
  if (!state.currentChapter || !state.currentChapterSection) {
    return state;
  }

  const shouldPreserveLine =
    state.currentChapterSection === CHAPTER_SECTION_HEADING_NAMES.content;

  if (!trimmed && !shouldPreserveLine) {
    return state;
  }

  return {
    ...state,
    currentChapterContent: [...state.currentChapterContent, line],
  };
}

function reduceStoryLine(state, lineIndex, line, lines) {
  const trimmed = line.trim();

  if (REGEX.keywordsHeading.test(trimmed)) {
    return state;
  }

  if (trimmed.startsWith("## ")) {
    return handleChapterHeading(state, trimmed, lineIndex, lines);
  }

  if (trimmed.startsWith("### ")) {
    return handleChapterSectionHeading(state, trimmed);
  }

  return appendChapterSectionContent(state, line, trimmed);
}

export function parseStory(markdown) {
  const lines = markdown.split("\n");
  assertStoryTitleHeading(lines);
  assertKeywordsSection(lines);

  const finalState = lines
    .entries()
    .reduce(
      (state, [lineIndex, line]) =>
        reduceStoryLine(state, lineIndex, line, lines),
      createInitialParserState(),
    );

  const chapters = flushCurrentChapterSection(finalState).chapters;

  // Validate structure
  validateStory(chapters);

  return chapters;
}

function parseChoicesSection(choicesText) {
  const lines = choicesText.split("\n").filter((l) => l.trim());

  if (lines.length === 1 && REGEX.theEndLine.test(lines[0].trim())) {
    return {
      choices: [],
      choicesEndingText: "The End",
    };
  }

  return {
    choices: parseChoicesList(lines),
    choicesEndingText: "",
  };
}

function parseChoicesList(lines) {
  return lines.reduce((choices, line, index) => {
    const trimmedLine = line.trim();
    const match = trimmedLine.match(REGEX.choiceLine);
    if (!match) {
      throw new Error(
        buildRuleError(
          "CHOICES_SECTION_FORMAT",
          `Invalid choices section content: "${trimmedLine}".`,
        ),
      );
    }

    const choiceNumber = parseInteger(match[1]);
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
        chapterNumber: parseInteger(match[3]),
      },
    ];
  }, []);
}

function collectChapterRequiredFieldErrors(chapterNumber, chapter) {
  const hasChoicesList =
    Array.isArray(chapter.choices) && chapter.choices.length > 0;
  const hasChoicesEndingText =
    typeof chapter.choicesEndingText === "string" &&
    chapter.choicesEndingText.trim().length > 0;

  return [
    ...(!chapter.title
      ? [
          buildRuleError(
            "CHAPTER_REQUIRED_FIELDS",
            `Chapter ${chapterNumber} missing ### Title section.`,
          ),
        ]
      : []),
    ...(!chapter.content
      ? [
          buildRuleError(
            "CHAPTER_REQUIRED_FIELDS",
            `Chapter ${chapterNumber} missing ### Content section.`,
          ),
        ]
      : []),
    ...(!hasChoicesList && !hasChoicesEndingText
      ? [
          buildRuleError(
            "CHAPTER_REQUIRED_FIELDS",
            `Chapter ${chapterNumber} missing ### Choices section or has invalid choices content.`,
          ),
        ]
      : []),
  ];
}

function collectChapterChoiceReferenceErrors(chapterNumber, chapter, chapters) {
  return chapter.choices.flatMap((choice) => {
    const chapterNumberValue = parseInteger(chapterNumber);

    const missingTargetError = !chapters[choice.chapterNumber.toString()]
      ? [
          buildRuleError(
            "CHOICE_TARGET_EXISTS",
            `Chapter ${chapterNumber}: Choice refers to non-existent Chapter ${choice.chapterNumber}.`,
          ),
        ]
      : [];

    const selfReferenceError =
      choice.chapterNumber === chapterNumberValue
        ? [
            buildRuleError(
              "CHOICE_NOT_SELF_REFERENTIAL",
              `Chapter ${chapterNumber}: Choice cannot reference Chapter ${chapterNumber}.`,
            ),
          ]
        : [];

    return [...missingTargetError, ...selfReferenceError];
  });
}

function collectRequiredFieldErrors(chapterEntries) {
  return chapterEntries.flatMap(([chapterNumber, chapter]) =>
    collectChapterRequiredFieldErrors(chapterNumber, chapter),
  );
}

function collectChoiceReferenceErrors(chapterEntries, chapters) {
  return chapterEntries.flatMap(([chapterNumber, chapter]) =>
    collectChapterChoiceReferenceErrors(chapterNumber, chapter, chapters),
  );
}

function collectFirstChapterError(chapterEntries) {
  const chapterNumbers = chapterEntries
    .map(([chapterNumber]) => Number(chapterNumber))
    .sort((a, b) => a - b);

  return chapterNumbers[0] !== 1
    ? [buildRuleError("FIRST_CHAPTER_IS_ONE")]
    : [];
}

function validateStory(chapters) {
  const chapterEntries = Object.entries(chapters);
  if (chapterEntries.length === 0) {
    throw new Error(buildRuleError("AT_LEAST_ONE_CHAPTER"));
  }

  const errors = [
    ...collectRequiredFieldErrors(chapterEntries),
    ...collectChoiceReferenceErrors(chapterEntries, chapters),
    ...collectFirstChapterError(chapterEntries),
  ];

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

export function getValidationExample() {
  return `# Story Title

## Keywords
- mystery
- adventure
- discovery

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
The End`;
}
