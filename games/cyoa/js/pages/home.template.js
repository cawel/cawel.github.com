import { escapeHtml, renderPageContainer } from "../utils/viewHelpers.js";

/** @typedef {import("../types.js").StoryMetadata} StoryMetadata */

/**
 * @param {string[]|unknown} keywords
 * @returns {string}
 */
function formatKeywords(keywords) {
  if (!Array.isArray(keywords)) return "";
  return keywords.filter(Boolean).join(", ");
}

/**
 * @param {StoryMetadata} story
 * @returns {string}
 */
function renderStoryCard(story) {
  const storyNumber = escapeHtml(story.number);
  const title = escapeHtml(story.title);
  const emoji = escapeHtml(story.emoji);
  const approxTime = escapeHtml(story.approxTime);
  const keywords = escapeHtml(formatKeywords(story.keywords));

  return `
    <article class="story-card" data-story="${storyNumber}" role="button" tabindex="0" aria-label="Open ${title}">
      <div class="story-card-title">
        <span class="story-card-emoji" aria-hidden="true">${emoji}</span>
        <span>${title}</span>
      </div>
      <div class="story-card-meta">
        <div class="story-card-meta-line">
          <span class="story-card-meta-icon" aria-hidden="true">⏱️</span>
          <span>${approxTime}</span>
        </div>
        <div class="story-card-meta-line story-card-meta-line-keywords">
          <span class="story-card-meta-icon" aria-hidden="true">🔑</span>
          <span>${keywords}</span>
        </div>
      </div>
    </article>
  `;
}

/**
 * @param {StoryMetadata[]} stories
 * @returns {string}
 */
function renderStoriesGrid(stories) {
  return stories.map((story) => renderStoryCard(story)).join("");
}

/**
 * @param {StoryMetadata[]} stories
 * @returns {string}
 */
export function renderHomePageTemplate(stories) {
  const storiesHtml = renderStoriesGrid(stories);
  const currentYear = new Date().getFullYear();

  return renderPageContainer({
    mainClass: "home-main",
    containerClass: "home-container",
    content: `
      <h1 class="home-title">Where Will You Begin?</h1>
      <div class="stories-grid" role="list">
        ${storiesHtml}
      </div>
      <footer class="home-footer">Choose Your Own Adventure | ${currentYear}</footer>
    `,
  });
}
