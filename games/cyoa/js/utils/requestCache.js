/**
 * Shared promise-cache helper for memoized async requests.
 *
 * This stores the promise immediately to dedupe concurrent callers,
 * and optionally converts failures to a fallback value.
 *
 * @template T
 * @param {Map<string, Promise<T>>} cache
 * @param {string} key
 * @param {() => Promise<T>|T} loader
 * @param {{ onError?: (error: unknown) => T|Promise<T> }} [options]
 * @returns {Promise<T>}
 */
export function getOrCreateCachedRequest(cache, key, loader, options = {}) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const request = Promise.resolve()
    .then(() => loader())
    .catch((error) => {
      if (typeof options.onError === "function") {
        return options.onError(error);
      }
      throw error;
    });

  cache.set(key, request);
  return request;
}
