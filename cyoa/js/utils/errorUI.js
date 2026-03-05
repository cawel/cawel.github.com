/**
 * Centralized error and message UI helpers
 */

import { escapeHtml, renderPageContainer } from "./viewHelpers.js";

function renderMessage({ title, details = "", tone = "error" }) {
  const safeTitle = escapeHtml(title || "Error");
  const safeDetails = escapeHtml(details || "");
  const hasDetails = safeDetails.trim().length > 0;

  return `
    <section class="app-message app-message-${tone}" role="alert" aria-live="polite">
      <h2 class="app-message-title">${safeTitle}</h2>
      ${hasDetails ? `<p class="app-message-details">${safeDetails}</p>` : ""}
    </section>
  `;
}

export function renderNotFoundPage({
  title = "Page not found",
  details = "The page you requested does not exist.",
} = {}) {
  return renderPageContainer({
    content: renderMessage({ title, details, tone: "not-found" }),
  });
}

export function renderLoadErrorPage({
  title = "Unable to load content",
  details = "",
  mainClass = "",
  containerClass = "",
} = {}) {
  return renderPageContainer({
    mainClass,
    containerClass,
    content: renderMessage({ title, details, tone: "error" }),
  });
}

export function renderInlineError({
  title = "An error occurred",
  details = "",
} = {}) {
  return renderMessage({ title, details, tone: "error" });
}
