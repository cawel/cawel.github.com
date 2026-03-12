/**
 * Admin page - story editor with story-content validation
 */

import { getValidationExample } from "../utils/storyParser.js";
import { getStoryContent } from "../services/storiesRepository.js";
import { createPage } from "../utils/pageContract.js";
import {
  bindAdminPageEvents,
  clearValidationResultHtml,
  getAdminElements,
  setEditorTextareaContent,
  setValidationResultHtml,
} from "./admin.view.js";
import { renderAdminPageTemplate } from "./admin.template.js";
import {
  renderAdminStoryLoadError,
  renderAdminValidationResult,
  validateAdminStoryContent,
} from "../utils/adminValidationUI.js";

/** @typedef {import("../types.js").PageContract} PageContract */
/** @typedef {import("../types.js").ValidationResult} ValidationResult */

/**
 * @param {ValidationResult["status"]} type
 * @param {string} message
 * @returns {string}
 */
function getValidationResultHtml(type, message) {
  return renderAdminValidationResult({
    status: type,
    message,
  });
}

function setValidationResult(type, message = "") {
  const { validationResult } = getAdminElements();
  setValidationResultHtml(
    validationResult,
    getValidationResultHtml(type, message),
  );
}

function clearValidationResult() {
  const { validationResult } = getAdminElements();
  clearValidationResultHtml(validationResult);
}

function bindAdminEvents() {
  const elements = getAdminElements();
  bindAdminPageEvents(elements, {
    onValidate: validateContent,
    onLoad: loadStory,
    onStorySelectChange,
  });
}

export async function loadAdminPageData() {
  return {
    example: getValidationExample(),
  };
}

/**
 * @param {{ example: string }} model
 * @returns {Promise<string>}
 */
export async function renderAdminPage(model) {
  return renderAdminPageTemplate(model.example);
}

export async function bindAdminPage() {
  bindAdminEvents();
  return null;
}

function validateContent() {
  const { textarea } = getAdminElements();
  if (!textarea) return;

  const result = validateAdminStoryContent(textarea.value);
  setValidationResult(result.status, result.message || "");
}

function setEditorContent(content) {
  const { textarea } = getAdminElements();
  setEditorTextareaContent(textarea, content);
}

async function loadStory() {
  const { storySelect } = getAdminElements();
  if (!storySelect) return;

  const storyNum = storySelect.value;

  if (!storyNum) {
    setEditorContent("");
    clearValidationResult();
    return;
  }

  try {
    const content = await getStoryContent(storyNum);
    setEditorContent(content);
    clearValidationResult();
  } catch (error) {
    setValidationResult("error", renderAdminStoryLoadError(error));
  }
}

function onStorySelectChange() {
  clearValidationResult();
}

/** @type {PageContract} */
export const adminPage = createPage({
  load: loadAdminPageData,
  render: renderAdminPage,
  bind: bindAdminPage,
});
