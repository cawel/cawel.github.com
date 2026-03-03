/**
 * Simple hash-based router for single-page applications
 */

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
      container.innerHTML = "<main><p>404 - Page not found</p></main>";
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
