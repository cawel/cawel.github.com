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
 * @typedef {{
 *   route: string,
 *   matcher: RegExp,
 *   paramNames: string[],
 * }} CompiledRoute
 */

/**
 * @param {string} route
 * @returns {CompiledRoute}
 */
function compileRoute(route) {
  const paramNames = (route.match(/:[^/]+/g) || []).map((segment) =>
    segment.slice(1),
  );
  const routePattern = route.replace(/:[^/]+/g, "([^/]+)");

  return {
    route,
    matcher: new RegExp(`^${routePattern}$`),
    paramNames,
  };
}

/**
 * @param {Record<string, PageContract>} routes
 * @returns {RouterApi}
 */
export function createRouter(routes) {
  let currentCleanup = null;
  let activeRenderId = 0;
  let activeRoute = null;
  let activeModel = null;
  let activeParams = null;
  const compiledRoutes = Object.keys(routes).map(compileRoute);

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
    const matchedRoute = compiledRoutes.find((route) => route.matcher.test(pathname));

    if (!matchedRoute) {
      return null;
    }

    const matches = pathname.match(matchedRoute.matcher);

    const params = {};
    if (matches) {
      matchedRoute.paramNames.forEach((name, index) => {
        params[name] = matches[index + 1];
      });
    }

    return { params, route: matchedRoute.route };
  };

  /**
   * @param {HTMLElement|{ innerHTML: string }} container
   * @returns {Promise<void>}
   */
  const render = async (container) => {
    const renderId = ++activeRenderId;
    const path = getCurrentRoute();
    const routeData = getRouteParams(path);

    if (!routeData) {
      if (renderId !== activeRenderId) {
        return;
      }
      clearCurrentRouteBindings();
      activeRoute = null;
      activeModel = null;
      activeParams = null;
      container.innerHTML = renderNotFoundPage();
      return;
    }

    try {
      const lifecycle = normalizeRouteHandler(routes[routeData.route]);
      const model = await lifecycle.load(routeData.params);
      if (renderId !== activeRenderId) {
        return;
      }

      const canUpdateInPlace =
        activeRoute === routeData.route && typeof lifecycle.update === "function";
      if (canUpdateInPlace) {
        const didUpdate = await lifecycle.update(
          container,
          model,
          routeData.params,
          {
            model: activeModel,
            params: activeParams,
            route: activeRoute,
          },
        );
        if (renderId !== activeRenderId) {
          return;
        }

        if (didUpdate) {
          activeModel = model;
          activeParams = routeData.params;
          return;
        }
      }

      const content = await lifecycle.render(model, routeData.params);
      if (renderId !== activeRenderId) {
        return;
      }

      clearCurrentRouteBindings();
      container.innerHTML = content;

      const cleanup = await lifecycle.bind(container, model, routeData.params);
      if (renderId !== activeRenderId) {
        return;
      }
      currentCleanup = typeof cleanup === "function" ? cleanup : null;
      activeRoute = routeData.route;
      activeModel = model;
      activeParams = routeData.params;
    } catch (error) {
      if (renderId !== activeRenderId) {
        return;
      }
      clearCurrentRouteBindings();
      activeRoute = null;
      activeModel = null;
      activeParams = null;
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
