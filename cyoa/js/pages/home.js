/**
 * Home page - displays list of stories
 */

import {
  escapeHtml,
  renderPageContainer,
} from "../utils/viewHelpers.js";
import { withBasePath } from "../utils/pathResolver.js";

let storiesMetadataPromise = null;

async function loadStoriesMetadata() {
  if (!storiesMetadataPromise) {
    storiesMetadataPromise = fetch(withBasePath("/assets/stories/metadata.json"))
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load stories metadata");
        }
        return response.json();
      })
      .catch((error) => {
        console.error("[home] Unable to load stories metadata:", error);
        return [];
      });
  }

  return storiesMetadataPromise;
}

function formatKeywords(keywords) {
  if (!Array.isArray(keywords)) return "";
  return keywords.filter(Boolean).join(", ");
}

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

function renderStoriesGrid(stories) {
  return stories.map((story) => renderStoryCard(story)).join("");
}

function navigateToStory(storyNum) {
  window.location.hash = `#/story/${storyNum}`;
}

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

export async function loadHomePageData() {
  const stories = await loadStoriesMetadata();
  return { stories };
}

export async function renderHomePage(model = { stories: [] }) {
  const stories = Array.isArray(model.stories) ? model.stories : [];
  const storiesHtml = renderStoriesGrid(stories);

  return renderHomeTemplate(storiesHtml);
}

export async function bindHomePage(container) {
  bindStoryCardEvents(container);
  return null;
}

export const homePage = {
  load: loadHomePageData,
  render: renderHomePage,
  bind: bindHomePage,
};
