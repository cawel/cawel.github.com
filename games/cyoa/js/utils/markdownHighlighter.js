/**
 * Markdown highlighting helpers for admin editor previews
 */

import { escapeHtml } from "./viewHelpers.js";

function highlightMarkdownLine(line) {
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
}

export function highlightMarkdown(text) {
  const escaped = escapeHtml(text || "");
  return escaped
    .split("\n")
    .map((line) => highlightMarkdownLine(line))
    .join("\n");
}
