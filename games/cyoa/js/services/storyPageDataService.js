import { parseStory } from "../utils/storyParser.js";
import {
  getStoryContent,
  getStoriesImageMetadata,
} from "./storiesRepository.js";
import { getStoryChapterImagePaths } from "../utils/storyPaths.js";

/** @typedef {import("../types.js").StoryChapter} StoryChapter */

const parsedStoryPromiseById = new Map();
const storyImageChapterNumbersPromiseById = new Map();
const MAX_STORY_CACHE_ENTRIES = 5;
const DEBUG_STORY_IMAGE_ELIGIBILITY = false;

function touchLruEntry(cache, key) {
  if (!cache.has(key)) {
    return null;
  }

  const value = cache.get(key);
  cache.delete(key);
  cache.set(key, value);
  return value;
}

function setLruEntry(cache, key, value, maxEntries) {
  if (cache.has(key)) {
    cache.delete(key);
  }
  cache.set(key, value);

  while (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
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

function normalizeChapterNumber(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * @param {string} storyId
 * @returns {Promise<Record<number, StoryChapter>>}
 */
async function loadStoryData(storyId) {
  const key = String(storyId);
  const cachedStory = touchLruEntry(parsedStoryPromiseById, key);
  if (cachedStory) {
    return cachedStory;
  }

  const parsedPromise = getStoryContent(storyId)
    .then((storyContentText) => parseStory(storyContentText))
    .catch((error) => {
      parsedStoryPromiseById.delete(key);
      throw error;
    });

  setLruEntry(
    parsedStoryPromiseById,
    key,
    parsedPromise,
    MAX_STORY_CACHE_ENTRIES,
  );

  return parsedPromise;
}

function getStoryImageChapterNumbers(imageMetadata, storyId) {
  const storyIdAsString = String(storyId);
  const storyIdAsNumber = Number.parseInt(storyIdAsString, 10);
  const stories = Array.isArray(imageMetadata?.stories)
    ? imageMetadata.stories
    : [];
  const entry = stories.find((storyImageEntry) => {
    const number = storyImageEntry?.number;
    return (
      String(number) === storyIdAsString ||
      (!Number.isNaN(storyIdAsNumber) && Number(number) === storyIdAsNumber)
    );
  });

  if (!entry) {
    return new Set();
  }

  const chapterNumbers = new Set();
  for (const chapter of Array.isArray(entry?.chapters) ? entry.chapters : []) {
    const chapterNumber = normalizeChapterNumber(chapter?.number);
    if (chapterNumber !== null) {
      chapterNumbers.add(chapterNumber);
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
  const cachedImageMetadata = touchLruEntry(
    storyImageChapterNumbersPromiseById,
    key,
  );
  if (cachedImageMetadata) {
    return cachedImageMetadata;
  }

  const chapterNumbersPromise = getStoriesImageMetadata()
    .then((imageMetadata) => getStoryImageChapterNumbers(imageMetadata, key))
    .catch(() => new Set());

  setLruEntry(
    storyImageChapterNumbersPromiseById,
    key,
    chapterNumbersPromise,
    MAX_STORY_CACHE_ENTRIES,
  );

  return chapterNumbersPromise;
}

function parseChapterNumber(chapterParam) {
  const requestedChapter = Number.parseInt(chapterParam || "1", 10);
  return Number.isNaN(requestedChapter) ? 1 : requestedChapter;
}

/**
 * @param {{ storyId: string, chapterId?: string }} params
 * @returns {Promise<{ storyId: string, chapterNumber: number, chapter: StoryChapter|null, chapterImagePaths: string[]|null, error: string|null }>}
 */
export async function loadStoryPageModel(params) {
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
      chapterImagePaths:
        hasChapter && hasImageMetadata
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

export function clearStoryPageDataCache() {
  parsedStoryPromiseById.clear();
  storyImageChapterNumbersPromiseById.clear();
}

export function getParsedStoryCacheSize() {
  return parsedStoryPromiseById.size;
}

export function getParsedStoryCacheKeys() {
  return Array.from(parsedStoryPromiseById.keys());
}
