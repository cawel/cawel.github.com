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

// Defers work until after HTML returned by a page renderer has been inserted
// into the DOM. `setTimeout(..., 0)` queues a macrotask for the next event-loop
// turn, so the current synchronous render/update work finishes first.
export function deferAfterRender(callback) {
  setTimeout(() => {
    callback();
  }, 0);
}
