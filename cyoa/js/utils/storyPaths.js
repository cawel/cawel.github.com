/**
 * Shared story path helpers
 */

import { withBasePath } from "./pathResolver.js";

export function getStoryMarkdownPath(storyId) {
  return withBasePath(`/assets/stories/${storyId}/story.md`);
}

export function getStoryChapterImagePaths(storyId, chapterNumber) {
  const fileExtensions = ["webp", "png", "jpg", "jpeg", "avif"];
  return fileExtensions.map((extension) =>
    withBasePath(`/assets/stories/${storyId}/${chapterNumber}.${extension}`),
  );
}
