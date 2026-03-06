/**
 * Admin editor enhancement helpers (highlight layer + toggle + scroll sync)
 */

import { highlightMarkdown } from "./markdownHighlighter.js";

function getHighlightingElements() {
  return {
    textarea: document.getElementById("story-editor"),
    highlightLayer: document.getElementById("story-editor-highlight"),
    toggleButton: document.getElementById("markdown-toggle-btn"),
    textareaWrapper: document.querySelector(".editor-textarea-wrapper"),
  };
}

export function setupAdminMarkdownHighlighting() {
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
