/**
 * Home page - displays list of stories
 */

import { getStoriesMetadata } from "../services/storiesRepository.js";
import {
  escapeHtml,
  renderPageContainer,
} from "../utils/viewHelpers.js";

/** @typedef {import("../types.js").StoryMetadata} StoryMetadata */
/** @typedef {import("../types.js").PageContract} PageContract */

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
 * @param {string|number} storyNum
 */
function navigateToStory(storyNum) {
  window.location.hash = `#/story/${storyNum}`;
}

/**
 * @param {HTMLElement|Document|Element} rootElement
 */
function bindStoryCardEvents(rootElement) {
  rootElement.querySelectorAll(".story-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      const storyNum = event.currentTarget.dataset.story;
      navigateToStory(storyNum);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const storyNum = event.currentTarget.dataset.story;
      navigateToStory(storyNum);
    });
  });
}

function renderHomeTemplate(storiesHtml) {
  return renderPageContainer({
    mainClass: "home-main",
    containerClass: "home-container",
    content: `
      <h1 class="home-title">Where Will You Begin?</h1>
      <div class="stories-grid" role="list">
        ${storiesHtml}
      </div>
      <footer class="home-footer">Choose Your Own Adventure | 2026</footer>
    `,
  });
}

/**
 * @returns {Promise<{ stories: StoryMetadata[] }>}
 */
export async function loadHomePageData() {
  /** @type {StoryMetadata[]} */
  const stories = await getStoriesMetadata();
  return { stories };
}

/**
 * @param {{ stories?: StoryMetadata[] }} [model]
 * @returns {Promise<string>}
 */
export async function renderHomePage(model = { stories: [] }) {
  const stories = Array.isArray(model.stories) ? model.stories : [];
  const storiesHtml = renderStoriesGrid(stories);

  return renderHomeTemplate(storiesHtml);
}

/**
 * @param {HTMLElement|{ querySelectorAll: (selector: string) => NodeListOf<Element>|Element[] }} container
 * @returns {Promise<null>}
 */
export async function bindHomePage(container) {
  bindStoryCardEvents(container);
  return null;
}

/** @type {PageContract} */
export const homePage = {
  load: loadHomePageData,
  render: renderHomePage,
  bind: bindHomePage,
};
