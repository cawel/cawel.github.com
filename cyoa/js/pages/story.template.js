import { renderLoadErrorPage, renderNotFoundPage } from "../utils/errorUI.js";
import { renderPageContainer } from "../utils/viewHelpers.js";

/** @typedef {import("../types.js").StoryChapter} StoryChapter */

function renderStoryLayout(content) {
  return renderPageContainer({
    content,
    mainClass: "story-main",
    containerClass: "story-container",
  });
}

/**
 * @param {string} message
 * @returns {string}
 */
export function renderStoryErrorState(message) {
  return renderLoadErrorPage({
    title: "Error loading story",
    details: message,
    mainClass: "story-main",
    containerClass: "story-container",
  });
}

/**
 * @returns {string}
 */
export function renderStoryMissingChapterState() {
  return renderNotFoundPage({
    title: "Chapter not found",
    details: "The requested chapter does not exist in this story.",
  });
}

/**
 * @param {string} content
 * @returns {string}
 */
function formatChapterContent(content) {
  return content
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * @param {string} storyId
 * @param {{ chapterNumber: number, text: string }} choice
 * @returns {string}
 */
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

/**
 * @param {string} storyId
 * @param {StoryChapter} chapter
 * @returns {string}
 */
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

/**
 * @param {string} storyId
 * @param {StoryChapter} chapter
 * @returns {string}
 */
export function renderStoryChapter(storyId, chapter) {
  const chapterContentHtml = formatChapterContent(chapter.content);
  const choicesSectionHtml = renderChoicesSection(storyId, chapter);

  return renderStoryLayout(`
    <h2 class="chapter-title">${chapter.title}</h2>
    <div class="chapter-content">${chapterContentHtml}</div>
    ${choicesSectionHtml}
  `);
}
