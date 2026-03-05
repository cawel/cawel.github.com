/**
 * Admin page view adapter: DOM getters and event binding.
 */

import { setupAdminMarkdownHighlighting } from "../utils/adminEditorEnhancer.js";

/**
 * @returns {{
 *   validateButton: HTMLButtonElement|null,
 *   loadButton: HTMLButtonElement|null,
 *   storySelect: HTMLSelectElement|null,
 *   textarea: HTMLTextAreaElement|null,
 *   validationResult: HTMLElement|null,
 * }}
 */
export function getAdminElements() {
  return {
    validateButton: document.getElementById("validate-btn"),
    loadButton: document.getElementById("load-btn"),
    storySelect: document.getElementById("story-select"),
    textarea: document.getElementById("story-editor"),
    validationResult: document.getElementById("validation-result"),
  };
}

/**
 * @param {HTMLElement|null} validationResultElement
 * @param {string} html
 */
export function setValidationResultHtml(validationResultElement, html) {
  if (!validationResultElement) return;
  validationResultElement.innerHTML = html;
}

/**
 * @param {HTMLElement|null} validationResultElement
 */
export function clearValidationResultHtml(validationResultElement) {
  if (!validationResultElement) return;
  validationResultElement.innerHTML = "";
}

/**
 * @param {HTMLTextAreaElement|null} textareaElement
 * @param {string} content
 */
export function setEditorTextareaContent(textareaElement, content) {
  if (!textareaElement) return;
  textareaElement.value = content;
  textareaElement.dispatchEvent(new Event("input"));
}

/**
 * @param {{
 *   validateButton: HTMLButtonElement|null,
 *   loadButton: HTMLButtonElement|null,
 *   storySelect: HTMLSelectElement|null,
 * }} elements
 * @param {{
 *   onValidate: () => void,
 *   onLoad: () => void,
 *   onStorySelectChange: () => void,
 * }} handlers
 */
export function bindAdminPageEvents(elements, handlers) {
  elements.validateButton?.addEventListener("click", handlers.onValidate);
  elements.loadButton?.addEventListener("click", handlers.onLoad);
  elements.storySelect?.addEventListener("change", handlers.onStorySelectChange);

  setupAdminMarkdownHighlighting();
}
