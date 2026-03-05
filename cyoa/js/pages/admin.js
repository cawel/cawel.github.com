/**
 * Admin page - story editor with markdown validation
 */

import { parseStory, getValidationExample } from "../utils/storyParser.js";
import { withBasePath } from "../utils/pathResolver.js";
import { escapeHtml, renderPageContainer } from "../utils/viewHelpers.js";
import { highlightMarkdown } from "../utils/markdownHighlighter.js";

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
  const typeClass =
    type === "success" ? "validation-success" : "validation-error";
  const content =
    type === "success"
      ? "✓ Story syntax is valid!"
      : type === "empty"
        ? "Please enter story content"
        : message;

  return `<div class="validation-result ${typeClass}">${content}</div>`;
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
        
        <div class="editor-section">
          <div class="story-select-row">
            <label class="editor-label" for="story-select">Story to Edit</label>
            <select class="story-select" id="story-select">
              <option value="">New Story</option>
              ${getStoryOptionsHtml()}
            </select>
          </div>
          <div class="editor-actions">
            <button class="btn btn-primary" id="load-btn">Load Story</button>
          </div>
        </div>

        <div class="editor-section">
          <details class="expected-format">
            <summary class="editor-label"><span class="expected-format-emoji" aria-hidden="true">ℹ️</span><span>Expected Format</span></summary>
            <div class="example-block markdown-highlight">${highlightMarkdown(example)}</div>
          </details>
        </div>

        <div class="editor-section">
          <div class="editor-label-row">
            <label class="editor-label" for="story-editor">Story Content (Markdown)</label>
            <button type="button" class="markdown-toggle-link" id="markdown-toggle-btn" aria-pressed="true">Disable syntax highlighting</button>
          </div>
          <div class="editor-textarea-wrapper">
            <pre class="editor-textarea-highlight markdown-highlight" id="story-editor-highlight" aria-hidden="true"></pre>
            <textarea class="editor-textarea editor-textarea-overlay" id="story-editor" placeholder="Paste or write your story here..." spellcheck="false"></textarea>
          </div>
          
          <div class="editor-actions">
            <button class="btn btn-primary" id="validate-btn">Validate Syntax</button>
          </div>

          <div id="validation-result"></div>
        </div>
    `,
  });
}

function bindAdminEvents() {
  const { validateButton, loadButton, storySelect } = getAdminElements();
  validateButton?.addEventListener("click", validateContent);
  loadButton?.addEventListener("click", loadStory);
  storySelect?.addEventListener("change", onStorySelectChange);

  setupMarkdownHighlighting();
}

export async function renderAdmin() {
  const example = getValidationExample();

  // Setup event listeners after rendering
  setTimeout(() => {
    bindAdminEvents();
  }, 0);

  return renderAdminTemplate(example);
}

function validateContent() {
  const { textarea } = getAdminElements();
  if (!textarea) return;

  const content = textarea.value.trim();

  if (!content) {
    setValidationResult("empty");
    return;
  }

  try {
    parseStory(content);
    setValidationResult("success");
  } catch (error) {
    setValidationResult(
      "error",
      `
        ✗ Validation Error:
        <div class="error-details">${escapeHtml(error.message)}</div>
      `,
    );
  }
}

function setEditorContent(content) {
  const { textarea } = getAdminElements();
  if (!textarea) return;

  textarea.value = content;
  textarea.dispatchEvent(new Event("input"));
}

function getStoryPath(storyId) {
  return withBasePath(`/assets/stories/story-${storyId}.md`);
}

async function loadStory() {
  const { storySelect } = getAdminElements();
  if (!storySelect) return;

  const select = storySelect;
  const storyNum = select.value;

  if (!storyNum) {
    setEditorContent("");
    clearValidationResult();
    return;
  }

  try {
    const response = await fetch(getStoryPath(storyNum));
    if (!response.ok) {
      throw new Error(`Failed to load story ${storyNum}`);
    }

    const content = await response.text();
    setEditorContent(content);
    clearValidationResult();
  } catch (error) {
    setValidationResult(
      "error",
      `Error loading story: ${escapeHtml(error.message)}`,
    );
  }
}

function onStorySelectChange() {
  clearValidationResult();
}

function getHighlightingElements() {
  return {
    textarea: document.getElementById("story-editor"),
    highlightLayer: document.getElementById("story-editor-highlight"),
    toggleButton: document.getElementById("markdown-toggle-btn"),
    textareaWrapper: document.querySelector(".editor-textarea-wrapper"),
  };
}

function setupMarkdownHighlighting() {
  const { textarea, highlightLayer, toggleButton, textareaWrapper } =
    getHighlightingElements();
  if (!textarea || !highlightLayer || !toggleButton || !textareaWrapper) return;

  let highlightingEnabled = true;

  const renderHighlight = () => {
    const source = textarea.value || " ";
    highlightLayer.innerHTML = `${highlightMarkdown(source)}\n`;
  };

  const syncScroll = () => {
    highlightLayer.scrollTop = textarea.scrollTop;
    highlightLayer.scrollLeft = textarea.scrollLeft;
  };

  const applyHighlightingState = () => {
    textareaWrapper.classList.toggle("markdown-off", !highlightingEnabled);
    toggleButton.textContent = highlightingEnabled
      ? "Disable syntax highlighting"
      : "Enable syntax highlighting";
    toggleButton.setAttribute("aria-pressed", String(highlightingEnabled));
  };

  textarea.addEventListener("input", () => {
    renderHighlight();
    syncScroll();
  });

  textarea.addEventListener("scroll", syncScroll);

  toggleButton.addEventListener("click", () => {
    highlightingEnabled = !highlightingEnabled;
    applyHighlightingState();
  });

  renderHighlight();
  applyHighlightingState();
}
