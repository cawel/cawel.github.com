/**
 * Story page - displays a story with chapters and choices
 */

import { parseStory } from "../utils/storyParser.js";
import { getStoryMarkdown } from "../services/storiesRepository.js";
import { getStoryChapterImagePaths } from "../utils/storyPaths.js";
import {
  renderStoryChapter,
  renderStoryErrorState,
  renderStoryMissingChapterState,
} from "./story.template.js";

/** @typedef {import("../types.js").StoryChapter} StoryChapter */
/** @typedef {import("../types.js").PageContract} PageContract */

const parsedStoryPromiseById = new Map();

function clearParsedStoryCache() {
  parsedStoryPromiseById.clear();
}

function getParsedStoryCacheSize() {
  return parsedStoryPromiseById.size;
}

/**
 * @typedef {object} StoryPageModel
 * @property {string} storyId
 * @property {number} chapterNumber
 * @property {StoryChapter|null} chapter
 * @property {string[]|null} chapterImagePaths
 * @property {string|null} error
 */

function parseChapterNumber(chapterParam) {
  const requestedChapter = Number.parseInt(chapterParam || "1", 10);
  return Number.isNaN(requestedChapter) ? 1 : requestedChapter;
}

/**
 * @param {string} storyId
 * @returns {Promise<Record<number, StoryChapter>>}
 */
async function loadStoryData(storyId) {
  const key = String(storyId);
  if (!parsedStoryPromiseById.has(key)) {
    const parsedPromise = getStoryMarkdown(storyId)
      .then((markdownText) => parseStory(markdownText))
      .catch((error) => {
        parsedStoryPromiseById.delete(key);
        throw error;
      });

    parsedStoryPromiseById.set(key, parsedPromise);
  }

  return parsedStoryPromiseById.get(key);
}

/**
 * @param {{ storyId: string, chapterId?: string }} params
 * @returns {Promise<StoryPageModel>}
 */
export async function loadStoryPageData(params) {
  const storyId = params.storyId;
  const chapterNumber = parseChapterNumber(params.chapterId);

  try {
    const storyData = await loadStoryData(storyId);
    return {
      storyId,
      chapterNumber,
      chapter: storyData ? storyData[chapterNumber] : null,
      chapterImagePaths: storyData?.[chapterNumber]
        ? getStoryChapterImagePaths(storyId, chapterNumber)
        : null,
      error: null,
    };
  } catch (error) {
    return {
      storyId,
      chapterNumber,
      chapter: null,
      chapterImagePaths: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
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
export const storyPage = {
  load: loadStoryPageData,
  render: renderStoryPage,
};

export const __storyPageTestHooks = {
  clearParsedStoryCache,
  getParsedStoryCacheSize,
};
