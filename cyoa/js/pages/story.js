/**
 * Story page - displays a story with chapters and choices
 */

import { parseStory } from "../utils/storyParser.js";
import { renderPageContainer } from "../utils/viewHelpers.js";
import { renderLoadErrorPage, renderNotFoundPage } from "../utils/errorUI.js";
import { getStoryMarkdown } from "../services/storiesRepository.js";

function renderStoryLayout(content) {
  return renderPageContainer({
    content,
    mainClass: "story-main",
    containerClass: "story-container",
  });
}

function renderErrorState(message) {
  return renderLoadErrorPage({
    title: "Error loading story",
    details: message,
    mainClass: "story-main",
    containerClass: "story-container",
  });
}

function renderMissingChapterState() {
  return renderNotFoundPage({
    title: "Chapter not found",
    details: "The requested chapter does not exist in this story.",
  });
}

function parseChapterNumber(chapterParam) {
  const requestedChapter = Number.parseInt(chapterParam || "1", 10);
  return Number.isNaN(requestedChapter) ? 1 : requestedChapter;
}

async function loadStoryData(storyId) {
  const markdownText = await getStoryMarkdown(storyId);
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

export async function loadStoryPageData(params) {
  const storyId = params.storyId;
  const chapterNumber = parseChapterNumber(params.chapterId);

  try {
    const storyData = await loadStoryData(storyId);
    return {
      storyId,
      chapterNumber,
      chapter: storyData ? storyData[chapterNumber] : null,
      error: null,
    };
  } catch (error) {
    return {
      storyId,
      chapterNumber,
      chapter: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function renderStoryPage(model) {
  if (model.error) {
    return renderErrorState(model.error);
  }

  if (!model.chapter) {
    return renderMissingChapterState();
  }

  return renderChapter(model.storyId, model.chapter);
}

export const storyPage = {
  load: loadStoryPageData,
  render: renderStoryPage,
};
