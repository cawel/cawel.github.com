/**
 * Shared rendering and view utility helpers
 */

export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");
  return div.innerHTML;
}

export function renderPageContainer({
  content,
  mainClass = "",
  containerClass = "",
}) {
  const mainClassAttr = mainClass ? ` class="${mainClass}"` : "";
  const containerClassAttr = containerClass ? ` class="${containerClass}"` : "";

  return `
    <main${mainClassAttr}>
      <div${containerClassAttr}>
        ${content}
      </div>
    </main>
  `;
}
