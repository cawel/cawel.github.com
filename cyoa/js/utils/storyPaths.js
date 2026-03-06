/**
 * Shared story path helpers
 */

import { withBasePath } from "./pathResolver.js";

export function getStoryMarkdownPath(storyId) {
  return withBasePath(`/assets/stories/${storyId}/story.md`);
}
