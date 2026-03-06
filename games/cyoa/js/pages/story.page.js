/**
 * Story page - displays a story with chapters and choices
 */

import { parseStory } from "../utils/storyParser.js";
import {
  getStoryContent,
  getStoriesImageMetadata,
} from "../services/storiesRepository.js";
import { getStoryChapterImagePaths } from "../utils/storyPaths.js";
import {
  renderStoryChapter,
  renderStoryErrorState,
  renderStoryMissingChapterState,
} from "./story.template.js";

/** @typedef {import("../types.js").StoryChapter} StoryChapter */
/** @typedef {import("../types.js").PageContract} PageContract */

const parsedStoryPromiseById = new Map();
const storyImageChapterNumbersPromiseById = new Map();
const DEBUG_STORY_IMAGE_ELIGIBILITY = false;

function clearParsedStoryCache() {
  parsedStoryPromiseById.clear();
  storyImageChapterNumbersPromiseById.clear();
}

function getParsedStoryCacheSize() {
  return parsedStoryPromiseById.size;
}

function logImageEligibility({
  storyId,
  chapterNumber,
  hasChapter,
  hasImageMetadata,
}) {
  if (!DEBUG_STORY_IMAGE_ELIGIBILITY) {
    return;
  }

  console.debug(
    `[story:image] story=${storyId} chapter=${chapterNumber} hasChapter=${hasChapter} hasImageMetadata=${hasImageMetadata}`,
  );
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
    const parsedPromise = getStoryContent(storyId)
      .then((storyContentText) => parseStory(storyContentText))
      .catch((error) => {
        parsedStoryPromiseById.delete(key);
        throw error;
      });

    parsedStoryPromiseById.set(key, parsedPromise);
  }

  return parsedStoryPromiseById.get(key);
}

function normalizeChapterNumber(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getStoryImageChapterNumbers(imageMetadata, storyId) {
  const storyIdAsString = String(storyId);
  const storyIdAsNumber = Number.parseInt(storyIdAsString, 10);
  const entry = imageMetadata.find((storyImageEntry) => {
    const number = storyImageEntry?.storyNumber;
    return (
      String(number) === storyIdAsString ||
      (!Number.isNaN(storyIdAsNumber) && Number(number) === storyIdAsNumber)
    );
  });

  if (!entry) {
    return new Set();
  }

  const chapterNumbers = new Set();
  const firstChapterNumber = normalizeChapterNumber(
    entry?.firstChapter?.chapterNumber,
  );
  if (firstChapterNumber !== null) {
    chapterNumbers.add(firstChapterNumber);
  }

  for (const ending of Array.isArray(entry?.endings) ? entry.endings : []) {
    const endingChapterNumber = normalizeChapterNumber(ending?.chapterNumber);
    if (endingChapterNumber !== null) {
      chapterNumbers.add(endingChapterNumber);
    }
  }

  return chapterNumbers;
}

/**
 * @param {string} storyId
 * @returns {Promise<Set<number>>}
 */
async function loadStoryImageChapterNumbers(storyId) {
  const key = String(storyId);
  if (!storyImageChapterNumbersPromiseById.has(key)) {
    const chapterNumbersPromise = getStoriesImageMetadata()
      .then((imageMetadata) => getStoryImageChapterNumbers(imageMetadata, key))
      .catch(() => new Set());

    storyImageChapterNumbersPromiseById.set(key, chapterNumbersPromise);
  }

  return storyImageChapterNumbersPromiseById.get(key);
}

/**
 * @param {{ storyId: string, chapterId?: string }} params
 * @returns {Promise<StoryPageModel>}
 */
export async function loadStoryPageData(params) {
  const storyId = params.storyId;
  const chapterNumber = parseChapterNumber(params.chapterId);

  try {
    const [storyData, imageChapterNumbers] = await Promise.all([
      loadStoryData(storyId),
      loadStoryImageChapterNumbers(storyId),
    ]);
    const hasChapter = Boolean(storyData?.[chapterNumber]);
    const hasImageMetadata = imageChapterNumbers.has(chapterNumber);

    logImageEligibility({
      storyId,
      chapterNumber,
      hasChapter,
      hasImageMetadata,
    });

    return {
      storyId,
      chapterNumber,
      chapter: storyData ? storyData[chapterNumber] : null,
      chapterImagePaths: hasChapter && hasImageMetadata
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
