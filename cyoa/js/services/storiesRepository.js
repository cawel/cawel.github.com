import { withBasePath } from "../utils/pathResolver.js";
import { getStoryMarkdownPath } from "../utils/storyPaths.js";

/** @typedef {import("../types.js").StoryMetadata} StoryMetadata */

let storiesMetadataPromise = null;
const storyMarkdownPromiseById = new Map();

/**
 * @returns {Promise<StoryMetadata[]>}
 */
export async function getStoriesMetadata() {
  if (!storiesMetadataPromise) {
    storiesMetadataPromise = fetch(
      withBasePath("/assets/stories/metadata.json"),
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
export async function getStoryMarkdown(storyId) {
  const key = String(storyId);
  if (!storyMarkdownPromiseById.has(key)) {
    const request = fetch(getStoryMarkdownPath(storyId)).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load story ${storyId}`);
      }
      return response.text();
    });

    storyMarkdownPromiseById.set(key, request);
  }

  return storyMarkdownPromiseById.get(key);
}
