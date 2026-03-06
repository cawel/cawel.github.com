/**
 * Shared story path helpers
 */

import { withBasePath } from "./pathResolver.js";

const CHAPTER_IMAGE_EXTENSIONS = ["webp"];

export function getStoryMarkdownPath(storyId) {
  return withBasePath(`/assets/stories/${storyId}/story.md`);
}

export function getStoryChapterImagePaths(storyId, chapterNumber) {
  return CHAPTER_IMAGE_EXTENSIONS.map((extension) =>
    withBasePath(`/assets/stories/${storyId}/${chapterNumber}.${extension}`),
  );
}
