import { withBasePath } from "../utils/pathResolver.js";
import {
  getStoryContentPath,
  getStoriesImageMetadataPath,
} from "../utils/storyPaths.js";

/** @typedef {import("../types.js").StoryMetadata} StoryMetadata */

let storiesMetadataPromise = null;
let storiesImageMetadataPromise = null;
const storyContentPromiseById = new Map();

/**
 * @returns {Promise<StoryMetadata[]>}
 */
export async function getStoriesMetadata() {
  if (!storiesMetadataPromise) {
    storiesMetadataPromise = fetch(
      withBasePath("/assets/stories/metadata-stories.json"),
    )
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

/**
 * @param {string|number} storyId
 * @returns {Promise<string>}
 */
export async function getStoryContent(storyId) {
  const key = String(storyId);
  if (!storyContentPromiseById.has(key)) {
    const request = fetch(getStoryContentPath(storyId)).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load story ${storyId}`);
      }
      return response.text();
    });

    storyContentPromiseById.set(key, request);
  }

  return storyContentPromiseById.get(key);
}

/**
 * @returns {Promise<any[]>}
 */
export async function getStoriesImageMetadata() {
  if (!storiesImageMetadataPromise) {
    storiesImageMetadataPromise = fetch(getStoriesImageMetadataPath())
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load stories image metadata");
        }
        return response.json();
      })
      .catch((error) => {
        console.error("[story] Unable to load stories image metadata:", error);
        return [];
      });
  }

  return storiesImageMetadataPromise;
}
