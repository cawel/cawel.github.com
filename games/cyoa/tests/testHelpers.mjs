export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Provides a minimal DOM mock compatible with `escapeHtml(...)` usage in UI helpers.
 * Optionally includes a minimal `window.location.hash` mock.
 *
 * @param {() => Promise<void>|void} run
 * @param {{ includeWindow?: boolean, hash?: string }} [options]
 */
export async function withDomEnvironment(run, options = {}) {
  const { includeWindow = false, hash = "" } = options;

  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;

  if (includeWindow) {
    globalThis.window = {
      location: {
        hash,
      },
    };
  }

  globalThis.document = {
    createElement() {
      let value = "";
      return {
        set textContent(next) {
          value = next;
        },
        get innerHTML() {
          return escapeHtml(value);
        },
      };
    },
  };

  try {
    await run();
  } finally {
    if (includeWindow) {
      globalThis.window = previousWindow;
    }
    globalThis.document = previousDocument;
  }
}

/**
 * @param {string} relativePath
 * @param {string} importMetaUrl
 * @returns {string}
 */
export function getFreshModuleUrl(relativePath, importMetaUrl) {
  const baseUrl = new URL(relativePath, importMetaUrl).href;
  return `${baseUrl}?t=${Date.now()}-${Math.random()}`;
}
