/**
 * Simple hash-based router for single-page applications
 *
 * -------------------- Comments Section --------------------
 * Route map format:
 * - Keys are route patterns (e.g. "/", "/admin", "/story/:storyId/:chapterId")
 * - Values are async/sync handler functions that return HTML strings
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
 * - If matched, the route handler is called with extracted params
 * - Returned HTML is injected into the provided container
 */

import { renderNotFoundPage } from "./utils/errorUI.js";

export function createRouter(routes) {
  const getCurrentRoute = () => {
    const hash = window.location.hash ? window.location.hash.slice(1) : "/";
    return hash || "/";
  };

  const navigate = (path) => {
    window.location.hash = `#${path}`;
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
      container.innerHTML = renderNotFoundPage();
      return;
    }

    const handler = routes[routeData.route];
    const content = await handler(routeData.params);
    container.innerHTML = content;
  };

  return {
    navigate,
    render,
    getCurrentRoute,
  };
}
