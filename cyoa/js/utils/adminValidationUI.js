/**
 * Admin validation and validation-result UI helpers
 */

import { parseStory } from "./storyParser.js";

export function validateAdminStoryContent(content) {
  const normalizedContent = typeof content === "string" ? content.trim() : "";

  if (!normalizedContent) {
    return { status: "empty" };
  }

  try {
    parseStory(normalizedContent);
    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export function renderAdminValidationResult(result) {
  if (!result || result.status === "empty") {
    return '<div class="validation-result validation-error">Please enter story content</div>';
  }

  if (result.status === "success") {
    return '<div class="validation-result validation-success">✓ Story syntax is valid!</div>';
  }

  const details = result.message || "Unknown validation error.";
  return `
    <div class="validation-result validation-error">
      ✗ Validation Error:
      <div class="error-details">${details}</div>
    </div>
  `;
}

export function renderAdminStoryLoadError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return `
    <div class="validation-result validation-error">
      Error loading story: ${message}
    </div>
  `;
}
