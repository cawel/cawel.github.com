/**
 * Admin page - story editor with markdown validation
 */

import { parseStory, getValidationExample } from "../utils/storyParser.js";
import { withBasePath } from "../utils/pathResolver.js";

export async function renderAdmin() {
  const example = getValidationExample();

  const html = `
    <main>
      <div class="admin-container">
        <h1 class="admin-title">Story Editor</h1>
        
        <div class="editor-section">
          <div class="story-select-row">
            <label class="editor-label" for="story-select">Story to Edit</label>
            <select class="story-select" id="story-select">
              <option value="">New Story</option>
              <option value="1">Story 1</option>
              <option value="2">Story 2</option>
              <option value="3">Story 3</option>
              <option value="4">Story 4</option>
              <option value="5">Story 5</option>
              <option value="6">Story 6</option>
              <option value="7">Story 7</option>
              <option value="8">Story 8</option>
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
      </div>
    </main>
  `;

  // Setup event listeners after rendering
  setTimeout(() => {
    document
      .getElementById("validate-btn")
      .addEventListener("click", validateContent);
    document.getElementById("load-btn").addEventListener("click", loadStory);
    document
      .getElementById("story-select")
      .addEventListener("change", onStorySelectChange);

    setupMarkdownHighlighting();
  }, 0);

  return html;
}

function validateContent() {
  const textarea = document.getElementById("story-editor");
  const resultDiv = document.getElementById("validation-result");
  const content = textarea.value.trim();

  if (!content) {
    resultDiv.innerHTML =
      '<div class="validation-result validation-error">Please enter story content</div>';
    return;
  }

  try {
    parseStory(content);
    resultDiv.innerHTML =
      '<div class="validation-result validation-success">✓ Story syntax is valid!</div>';
  } catch (error) {
    resultDiv.innerHTML = `
      <div class="validation-result validation-error">
        ✗ Validation Error:
        <div class="error-details">${escapeHtml(error.message)}</div>
      </div>
    `;
  }
}

async function loadStory() {
  const select = document.getElementById("story-select");
  const storyNum = select.value;

  if (!storyNum) {
    const textarea = document.getElementById("story-editor");
    textarea.value = "";
    textarea.dispatchEvent(new Event("input"));
    document.getElementById("validation-result").innerHTML = "";
    return;
  }

  try {
    const response = await fetch(
      withBasePath(`/assets/stories/story-${storyNum}.md`),
    );
    if (!response.ok) {
      throw new Error(`Failed to load story ${storyNum}`);
    }
    const content = await response.text();
    const textarea = document.getElementById("story-editor");
    textarea.value = content;
    textarea.dispatchEvent(new Event("input"));
    document.getElementById("validation-result").innerHTML = "";
  } catch (error) {
    document.getElementById("validation-result").innerHTML = `
      <div class="validation-result validation-error">
        Error loading story: ${escapeHtml(error.message)}
      </div>
    `;
  }
}

function onStorySelectChange() {
  document.getElementById("validation-result").innerHTML = "";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function highlightMarkdown(text) {
  const escaped = escapeHtml(text || "");
  const lines = escaped.split("\n");

  return lines
    .map((line) => {
      if (/^###\s+/.test(line)) {
        return `<span class="md-token md-h3">${line}</span>`;
      }

      if (/^##\s+/.test(line)) {
        return `<span class="md-token md-h2">${line}</span>`;
      }

      if (/^#\s+/.test(line)) {
        return `<span class="md-token md-h1">${line}</span>`;
      }

      const choiceMatch = line.match(/^(\d+\.\s+)(.+?)(\s*-&gt;\s*\d+)$/);
      if (choiceMatch) {
        return `<span class="md-token md-choice-number">${choiceMatch[1]}</span><span class="md-token md-choice-text">${choiceMatch[2]}</span><span class="md-token md-choice-target">${choiceMatch[3]}</span>`;
      }

      if (/^the\s+end$/i.test(line.trim())) {
        return `<span class="md-token md-end">${line}</span>`;
      }

      return line;
    })
    .join("\n");
}

function setupMarkdownHighlighting() {
  const textarea = document.getElementById("story-editor");
  const highlightLayer = document.getElementById("story-editor-highlight");
  const toggleButton = document.getElementById("markdown-toggle-btn");
  const textareaWrapper = document.querySelector(".editor-textarea-wrapper");
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
