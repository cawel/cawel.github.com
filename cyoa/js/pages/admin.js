/**
 * Admin page - story editor with markdown validation
 */

import { getValidationExample } from "../utils/storyParser.js";
import { renderPageContainer } from "../utils/viewHelpers.js";
import { highlightMarkdown } from "../utils/markdownHighlighter.js";
import { getStoryMarkdown } from "../services/storiesRepository.js";
import { setupAdminMarkdownHighlighting } from "../utils/adminEditorEnhancer.js";
import {
  renderAdminStoryLoadError,
  renderAdminValidationResult,
  validateAdminStoryContent,
} from "../utils/adminValidationUI.js";

const STORY_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

function getStoryOptionsHtml() {
  return STORY_IDS.map(
    (storyId) => `<option value="${storyId}">Story ${storyId}</option>`,
  ).join("");
}

function getAdminElements() {
  return {
    validateButton: document.getElementById("validate-btn"),
    loadButton: document.getElementById("load-btn"),
    storySelect: document.getElementById("story-select"),
    textarea: document.getElementById("story-editor"),
    validationResult: document.getElementById("validation-result"),
  };
}

function getValidationResultHtml(type, message) {
  return renderAdminValidationResult({
    status: type,
    message,
  });
}

function setValidationResult(type, message = "") {
  const { validationResult } = getAdminElements();
  if (!validationResult) return;
  validationResult.innerHTML = getValidationResultHtml(type, message);
}

function clearValidationResult() {
  const { validationResult } = getAdminElements();
  if (!validationResult) return;
  validationResult.innerHTML = "";
}

function renderAdminTemplate(example) {
  return renderPageContainer({
    containerClass: "admin-container",
    content: `
        <h1 class="admin-title">Story Editor</h1>

        <section class="admin-section-group">
          <h2 class="admin-section-title">Story to Edit</h2>
          <div class="editor-section">
            <div class="story-select-row">
              <select class="story-select" id="story-select" aria-label="Story to edit">
                <option value="">New Story</option>
                ${getStoryOptionsHtml()}
              </select>
            </div>
            <div class="editor-actions">
              <button class="btn btn-primary" id="load-btn">Load Story</button>
            </div>
          </div>
        </section>

        <section class="admin-section-group">
          <h2 class="admin-section-title">Story Content</h2>
          <div class="editor-section">
            <details class="expected-format">
              <summary class="editor-label"><span>Expected Markdown Format</span></summary>
              <div class="example-block markdown-highlight">${highlightMarkdown(example)}</div>
            </details>

            <div class="editor-tools-row">
              <button type="button" class="markdown-toggle-link" id="markdown-toggle-btn" aria-pressed="true">Disable syntax highlighting</button>
            </div>
            <div class="editor-textarea-wrapper">
              <pre class="editor-textarea-highlight markdown-highlight" id="story-editor-highlight" aria-hidden="true"></pre>
              <textarea class="editor-textarea editor-textarea-overlay" id="story-editor" placeholder="Paste or write your story here..." spellcheck="false" aria-label="Story content in markdown"></textarea>
            </div>

            <div class="editor-actions">
              <button class="btn btn-primary" id="validate-btn">Validate Syntax</button>
            </div>

            <div id="validation-result"></div>
          </div>
        </section>
    `,
  });
}

function bindAdminEvents() {
  const { validateButton, loadButton, storySelect } = getAdminElements();
  validateButton?.addEventListener("click", validateContent);
  loadButton?.addEventListener("click", loadStory);
  storySelect?.addEventListener("change", onStorySelectChange);

  setupAdminMarkdownHighlighting();
}

export async function loadAdminPageData() {
  return {
    example: getValidationExample(),
  };
}

export async function renderAdminPage(model) {
  return renderAdminTemplate(model.example);
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
  if (!textarea) return;

  textarea.value = content;
  textarea.dispatchEvent(new Event("input"));
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
    const content = await getStoryMarkdown(storyNum);
    setEditorContent(content);
    clearValidationResult();
  } catch (error) {
    setValidationResult("error", renderAdminStoryLoadError(error));
  }
}

function onStorySelectChange() {
  clearValidationResult();
}

export const adminPage = {
  load: loadAdminPageData,
  render: renderAdminPage,
  bind: bindAdminPage,
};
