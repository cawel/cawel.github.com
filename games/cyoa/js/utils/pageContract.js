/** @typedef {import("../types.js").PageContract} PageContract */

/**
 * Normalizes a page lifecycle contract to always expose load/render/bind.
 *
 * @param {PageContract} page
 * @returns {PageContract}
 */
export function normalizePageContract(page) {
  if (!page || typeof page.render !== "function") {
    throw new Error("Page contract must provide a render function");
  }

  return {
    load: page.load || (async (params) => params),
    render: page.render,
    bind: page.bind || (async () => null),
  };
}

/**
 * Creates a normalized page contract with defaults for optional lifecycle steps.
 *
 * @param {PageContract} lifecycle
 * @returns {PageContract}
 */
export function createPage(lifecycle) {
  return normalizePageContract(lifecycle);
}
