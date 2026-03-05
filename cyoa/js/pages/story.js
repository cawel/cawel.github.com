/**
 * Story page - displays a story with chapters and choices
 */

import { parseStory } from "../utils/storyParser.js";
import { renderPageContainer } from "../utils/viewHelpers.js";
import { getStoryMarkdownPath } from "../utils/storyPaths.js";

function renderStoryLayout(content) {
  return renderPageContainer({
    content,
    mainClass: "story-main",
    containerClass: "story-container",
  });
}

function renderErrorState(message) {
  return renderStoryLayout(
    `<p style="color: red;">Error loading story: ${message}</p>`,
  );
}

function renderMissingChapterState() {
  return renderStoryLayout("<p>Chapter not found</p>");
}

function parseChapterNumber(chapterParam) {
  const requestedChapter = Number.parseInt(chapterParam || "1", 10);
  return Number.isNaN(requestedChapter) ? 1 : requestedChapter;
}

function getStoryPath(storyId) {
  return getStoryMarkdownPath(storyId);
}

async function loadStoryData(storyId) {
  const response = await fetch(getStoryPath(storyId));
  if (!response.ok) {
    throw new Error(`Failed to load story ${storyId}`);
  }

  const markdownText = await response.text();
  return parseStory(markdownText);
}

function formatChapterContent(content) {
  return content
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function renderChoiceItem(storyId, choice) {
  return `
    <li class="choice-item">
      <span class="choice-emoji" aria-hidden="true">✨</span>
      <a class="choice-link" href="#/story/${storyId}/${choice.chapterNumber}">
        <span class="choice-text">${choice.text}</span>
      </a>
    </li>
  `;
}

function renderChoicesSection(storyId, chapter) {
  const hasChoicesList =
    Array.isArray(chapter.choices) && chapter.choices.length > 0;
  if (hasChoicesList) {
    const choicesHtml = chapter.choices
      .map((choice) => renderChoiceItem(storyId, choice))
      .join("");

    return `
      <h3 class="chapter-section-title">What do you do?</h3>
      <ul class="choices-list">
        ${choicesHtml}
      </ul>
    `;
  }

  const hasChoicesEndingText =
    typeof chapter.choicesEndingText === "string" &&
    chapter.choicesEndingText.trim().length > 0;

  return hasChoicesEndingText
    ? `<p class="choices-ending-text">${chapter.choicesEndingText}</p>`
    : "";
}

function renderChapter(storyId, chapter) {
  const chapterContentHtml = formatChapterContent(chapter.content);
  const choicesSectionHtml = renderChoicesSection(storyId, chapter);

  return renderStoryLayout(`
    <h2 class="chapter-title">${chapter.title}</h2>
    <div class="chapter-content">${chapterContentHtml}</div>
    ${choicesSectionHtml}
  `);
}

export async function renderStory(params) {
  const storyId = params.storyId;
  const chapterNumber = parseChapterNumber(params.chapterId);
  let storyData;

  try {
    storyData = await loadStoryData(storyId);
  } catch (error) {
    return renderErrorState(error.message);
  }

  if (!storyData || !storyData[chapterNumber]) {
    return renderMissingChapterState();
  }

  return renderChapter(storyId, storyData[chapterNumber]);
}
