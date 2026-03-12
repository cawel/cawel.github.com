/**
 * Simple hash-based router for single-page applications
 *
 * -------------------- Comments Section --------------------
 * Route map format:
 * - Keys are route patterns (e.g. "/", "/admin", "/story/:storyId/:chapterId")
 * - Values are lifecycle objects: { load, render, bind }
 *
 * Matching behavior:
 * - The router reads the current location hash and strips the leading '#'
 * - Dynamic route segments use ":param" syntax
 * - Route patterns are converted to regex for matching
 *
 * Param extraction:
 * - Matched ":param" names become keys in the params object
 * - Captured URL segment values are assigned in order
 *
 * Rendering:
 * - If no route matches, a simple 404 page is rendered
 * - If matched, the lifecycle executes in order: load -> render -> bind
 * - Returned HTML is injected into the provided container
 */

import { renderLoadErrorPage, renderNotFoundPage } from "./utils/errorUI.js";
import { normalizePageContract } from "./utils/pageContract.js";

/** @typedef {import("./types.js").RouteParams} RouteParams */
/** @typedef {import("./types.js").PageContract} PageContract */
/** @typedef {import("./types.js").MatchedRoute} MatchedRoute */
/** @typedef {import("./types.js").RouterApi} RouterApi */

/**
 * @param {Record<string, PageContract>} routes
 * @returns {RouterApi}
 */
export function createRouter(routes) {
  let currentCleanup = null;

  const getCurrentRoute = () => {
    const hash = window.location.hash ? window.location.hash.slice(1) : "/";
    return hash || "/";
  };

  const navigate = (path) => {
    window.location.hash = `#${path}`;
  };

  const clearCurrentRouteBindings = () => {
    if (typeof currentCleanup === "function") {
      currentCleanup();
    }
    currentCleanup = null;
  };

  /**
   * @param {PageContract} handler
   * @returns {PageContract}
   */
  const normalizeRouteHandler = (handler) => {
    try {
      return normalizePageContract(handler);
    } catch {
      throw new Error(
        "Route handler must be a lifecycle object with a render function",
      );
    }
  };

  /**
   * @param {string} pathname
   * @returns {MatchedRoute|null}
   */
  const getRouteParams = (pathname) => {
    const matchedRoute = Object.keys(routes).find((route) => {
      const routePattern = route.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(pathname);
    });

    if (!matchedRoute) return null;

    const paramNames = (matchedRoute.match(/:[^/]+/g) || []).map((p) =>
      p.slice(1),
    );
    const routePattern = matchedRoute.replace(/:[^/]+/g, "([^/]+)");
    const regex = new RegExp(`^${routePattern}$`);
    const matches = pathname.match(regex);

    const params = {};
    if (matches) {
      paramNames.forEach((name, index) => {
        params[name] = matches[index + 1];
      });
    }

    return { params, route: matchedRoute };
  };

  /**
   * @param {HTMLElement|{ innerHTML: string }} container
   * @returns {Promise<void>}
   */
  const render = async (container) => {
    const path = getCurrentRoute();
    const routeData = getRouteParams(path);

    if (!routeData) {
      clearCurrentRouteBindings();
      container.innerHTML = renderNotFoundPage();
      return;
    }

    try {
      const lifecycle = normalizeRouteHandler(routes[routeData.route]);
      const model = await lifecycle.load(routeData.params);
      const content = await lifecycle.render(model, routeData.params);

      clearCurrentRouteBindings();
      container.innerHTML = content;

      const cleanup = await lifecycle.bind(container, model, routeData.params);
      currentCleanup = typeof cleanup === "function" ? cleanup : null;
    } catch (error) {
      clearCurrentRouteBindings();
      container.innerHTML = renderLoadErrorPage({
        title: "Error rendering page",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return {
    navigate,
    render,
    getCurrentRoute,
  };
}
