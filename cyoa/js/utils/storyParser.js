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

export function parseStory(markdown) {
  const lines = markdown.split("\n");
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

      const chapterMatch = trimmed.match(/##\s+Chapter\s+(\d+)/i);
      if (!chapterMatch) {
        throw new Error(
          `Invalid chapter format: "${trimmed}". Expected "## Chapter N"`,
        );
      }

      const chapterNum = chapterMatch[1];
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

      const sectionMatch = trimmed.match(/###\s+(\w+)/i);
      if (!sectionMatch) {
        throw new Error(`Invalid section format: "${trimmed}"`);
      }

      currentSection = sectionMatch[1].toLowerCase();
      if (!["title", "content", "choices"].includes(currentSection)) {
        throw new Error(
          `Invalid section name: "${currentSection}". Expected one of: Title, Content, Choices`,
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
    const match = line.trim().match(/^\d+\.\s+(.+?)\s*->\s*(\d+)$/);
    if (!match) {
      throw new Error(
        `Invalid choice format: "${line.trim()}". Expected "1. Choice text -> ChapterNumber"`,
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
  // Check if any chapters exist
  if (Object.keys(chapters).length === 0) {
    throw new Error(
      "No chapters found. Add at least one chapter in format: ## Chapter N",
    );
  }

  // Validate each chapter
  for (const [num, chapter] of Object.entries(chapters)) {
    if (!chapter.title) {
      throw new Error(`Chapter ${num} missing ### Title section`);
    }
    if (!chapter.content) {
      throw new Error(`Chapter ${num} missing ### Content section`);
    }
    if (!chapter.choices || chapter.choices.length === 0) {
      throw new Error(
        `Chapter ${num} missing ### Choices section or has no choices`,
      );
    }

    // Validate choice references
    for (const choice of chapter.choices) {
      const refChapter = chapters[choice.chapterNumber.toString()];
      if (!refChapter) {
        throw new Error(
          `Chapter ${num}: Choice refers to non-existent Chapter ${choice.chapterNumber}`,
        );
      }
    }
  }

  // Check that chapter numbers are sequential starting from 1
  const chapterNums = Object.keys(chapters)
    .map(Number)
    .sort((a, b) => a - b);
  if (chapterNums[0] !== 1) {
    throw new Error("First chapter must be Chapter 1");
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
