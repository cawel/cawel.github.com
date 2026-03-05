/**
 * Simple hash-based router for single-page applications
 *
 * -------------------- Comments Section --------------------
 * Route map format:
 * - Keys are route patterns (e.g. "/", "/admin", "/story/:storyId/:chapterId")
 * - Values can be either:
 *   1) async/sync handler functions that return HTML strings (legacy)
 *   2) lifecycle objects: { load, render, bind }
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

  const normalizeRouteHandler = (handler) => {
    if (typeof handler === "function") {
      return {
        load: async (params) => params,
        render: async (params) => handler(params),
        bind: async () => null,
      };
    }

    if (!handler || typeof handler.render !== "function") {
      throw new Error("Route handler must be a function or lifecycle object");
    }

    return {
      load: handler.load || (async (params) => params),
      render: handler.render,
      bind: handler.bind || (async () => null),
    };
  };

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
