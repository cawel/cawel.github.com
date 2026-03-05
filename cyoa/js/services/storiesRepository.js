import { withBasePath } from "../utils/pathResolver.js";

let storiesMetadataPromise = null;
const storyMarkdownPromiseById = new Map();

function getStoryMarkdownPath(storyId) {
  return withBasePath(`/assets/stories/story-${storyId}.md`);
}

export async function getStoriesMetadata() {
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
