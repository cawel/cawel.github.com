import { withBasePath } from "../utils/pathResolver.js";
import {
  getStoryContentPath,
  getStoriesImageMetadataPath,
} from "../utils/storyPaths.js";
import { getOrCreateCachedRequest } from "../utils/requestCache.js";

/** @typedef {import("../types.js").StoryMetadata} StoryMetadata */

const requestCache = new Map();
const storyContentPromiseById = new Map();

/**
 * @returns {Promise<StoryMetadata[]>}
 */
export async function getStoriesMetadata() {
  return getOrCreateCachedRequest(
    requestCache,
    "storiesMetadata",
    async () => {
      const response = await fetch(
        withBasePath("/assets/stories/metadata-stories.json"),
      );
      if (!response.ok) {
        throw new Error("Failed to load stories metadata");
      }
      return response.json();
    },
    {
      onError: (error) => {
        console.error("[home] Unable to load stories metadata:", error);
        return [];
      },
    },
  );
}

/**
 * @param {string|number} storyId
 * @returns {Promise<string>}
 */
export async function getStoryContent(storyId) {
  const key = String(storyId);
  return getOrCreateCachedRequest(storyContentPromiseById, key, async () => {
    const response = await fetch(getStoryContentPath(storyId));
    if (!response.ok) {
      throw new Error(`Failed to load story ${storyId}`);
    }
    return response.text();
  });
}

/**
 * @returns {Promise<{imageSpec: object|null, stories: any[]}>}
 */
export async function getStoriesImageMetadata() {
  return getOrCreateCachedRequest(
    requestCache,
    "storiesImageMetadata",
    async () => {
      const response = await fetch(getStoriesImageMetadataPath());
      if (!response.ok) {
        throw new Error("Failed to load stories image metadata");
      }
      return response.json();
    },
    {
      onError: (error) => {
        console.error("[story] Unable to load stories image metadata:", error);
        return { imageSpec: null, stories: [] };
      },
    },
  );
}
