/**
 * Home page - displays list of stories
 */

import { getStoriesMetadata } from "../services/storiesRepository.js";
import { createPage } from "../utils/pageContract.js";
import { bindHomeStoryCardNavigation } from "./home.view.js";
import { renderHomePageTemplate } from "./home.template.js";

/** @typedef {import("../types.js").StoryMetadata} StoryMetadata */
/** @typedef {import("../types.js").PageContract} PageContract */

/**
 * @param {string|number} storyNum
 */
function navigateToStory(storyNum) {
  window.location.hash = `#/story/${storyNum}`;
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
  return renderHomePageTemplate(stories);
}

/**
 * @param {HTMLElement|{ querySelectorAll: (selector: string) => NodeListOf<Element>|Element[] }} container
 * @returns {Promise<null>}
 */
export async function bindHomePage(container) {
  bindHomeStoryCardNavigation(container, navigateToStory);
  return null;
}

/** @type {PageContract} */
export const homePage = createPage({
  load: loadHomePageData,
  render: renderHomePage,
  bind: bindHomePage,
});
