/**
 * Admin page - story editor with markdown validation
 */

import { parseStory, getValidationExample } from "../utils/storyParser.js";

export async function renderAdmin() {
  const example = getValidationExample();

  const html = `
    <main>
      <div class="admin-container">
        <h1 class="admin-title">Story Editor</h1>
        
        <div class="editor-section">
          <div class="story-select-row">
            <label class="editor-label" for="story-select">Story to Edit:</label>
            <select class="story-select" id="story-select">
              <option value="">New Story</option>
              <option value="1">Story 1</option>
              <option value="2">Story 2</option>
              <option value="3">Story 3</option>
            </select>
          </div>
          <div class="editor-actions">
            <button class="btn btn-primary" id="load-btn">Load Story</button>
          </div>
        </div>

        <div class="editor-section">
          <details class="expected-format">
            <summary class="editor-label"><span class="expected-format-emoji" aria-hidden="true">ℹ️</span><span>Expected Format</span></summary>
            <div class="example-block">${escapeHtml(example)}</div>
          </details>
        </div>

        <div class="editor-section">
          <label class="editor-label">Story Content (Markdown):</label>
          <textarea class="editor-textarea" id="story-editor" placeholder="Paste or write your story here..."></textarea>
          
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
    document.getElementById("story-editor").value = "";
    document.getElementById("validation-result").innerHTML = "";
    return;
  }

  try {
    const response = await fetch(`/stories/story${storyNum}/chapters.md`);
    if (!response.ok) {
      throw new Error(`Failed to load story ${storyNum}`);
    }
    const content = await response.text();
    document.getElementById("story-editor").value = content;
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
