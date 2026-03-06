/**
 * Shared story path helpers
 */

import { withBasePath } from "./pathResolver.js";

const CHAPTER_IMAGE_EXTENSIONS = ["webp"];

export function getStoryContentPath(storyId) {
  return withBasePath(`/assets/stories/${storyId}/story.md`);
}

export function getStoriesImageMetadataPath() {
  return withBasePath("/assets/stories/images/metadata-images.json");
}

export function getStoryChapterImagePaths(storyId, chapterNumber) {
  return CHAPTER_IMAGE_EXTENSIONS.map((extension) =>
    withBasePath(`/assets/stories/${storyId}/${chapterNumber}.${extension}`),
  );
}
