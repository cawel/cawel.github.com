/**
 * Story page - displays a story with chapters and choices
 */

import {
  clearStoryPageDataCache,
  getParsedStoryCacheSize,
  loadStoryPageModel,
} from "../services/storyPageDataService.js";
import { createPage } from "../utils/pageContract.js";
import {
  renderStoryChapter,
  renderStoryErrorState,
  renderStoryMissingChapterState,
} from "./story.template.js";

/** @typedef {import("../types.js").StoryChapter} StoryChapter */
/** @typedef {import("../types.js").PageContract} PageContract */

/**
 * @typedef {object} StoryPageModel
 * @property {string} storyId
 * @property {number} chapterNumber
 * @property {StoryChapter|null} chapter
 * @property {string[]|null} chapterImagePaths
 * @property {string|null} error
 */

/**
 * @param {{ storyId: string, chapterId?: string }} params
 * @returns {Promise<StoryPageModel>}
 */
export async function loadStoryPageData(params) {
  return loadStoryPageModel(params);
}

/**
 * @param {StoryPageModel} model
 * @returns {Promise<string>}
 */
export async function renderStoryPage(model) {
  if (model.error) {
    return renderStoryErrorState(model.error);
  }

  if (!model.chapter) {
    return renderStoryMissingChapterState();
  }

  return renderStoryChapter(
    model.storyId,
    model.chapter,
    model.chapterImagePaths,
  );
}

/** @type {PageContract} */
export const storyPage = createPage({
  load: loadStoryPageData,
  render: renderStoryPage,
});

export const __storyPageTestHooks = {
  clearParsedStoryCache: clearStoryPageDataCache,
  getParsedStoryCacheSize,
};
