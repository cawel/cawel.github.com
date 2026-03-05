/**
 * Main application entry point
 * Single Page Application with hash-based routing.
 *
 * Bootstrap responsibilities:
 * - Resolve and validate the main app container (`#app`)
 * - Register route handlers for home, story, and admin pages
 * - Mount shared header once at startup
 * - Render the active route and re-render on hash changes
 *
 * Data-loading responsibilities:
 * - Delegated to page-level `load` stages
 * - Route wiring composes page contracts, not fetch logic
 *
 * Routing behavior:
 * - Uses hash-based navigation (e.g. `#/story/2/4`)
 * - Supports route params through `router.js`
 * - Page modules return HTML strings rendered into `#app`
 */

import { createRouter } from "./router.js";
import { createHeader } from "./components/header.js";
import { ENABLE_APP_STATE_DEBUG } from "./appConfig.js";
import { getAppState, subscribeToAppState } from "./state/appStore.js";

function createLazyPage(moduleLoader, exportName) {
  let pagePromise = null;

  const getPage = async () => {
    if (!pagePromise) {
      pagePromise = moduleLoader().then((module) => {
        const page = module?.[exportName];
        if (!page || typeof page.render !== "function") {
          throw new Error(
            `Lazy page export '${exportName}' must provide a render function`,
          );
        }
        return page;
      });
    }

    return pagePromise;
  };

  return {
    load: async (params) => {
      const page = await getPage();
      if (typeof page.load === "function") {
        return page.load(params);
      }
      return params;
    },
    render: async (model, params) => {
      const page = await getPage();
      return page.render(model, params);
    },
    bind: async (container, model, params) => {
      const page = await getPage();
      if (typeof page.bind === "function") {
        return page.bind(container, model, params);
      }
      return null;
    },
  };
}

function createAppRouter() {
  const homePage = createLazyPage(
    () => import("./pages/home.page.js"),
    "homePage",
  );
  const storyPage = createLazyPage(
    () => import("./pages/story.page.js"),
    "storyPage",
  );
  const adminPage = createLazyPage(
    () => import("./pages/admin.page.js"),
    "adminPage",
  );

  return createRouter({
    "/": homePage,
    "/story/:storyId/:chapterId": storyPage,
    "/story/:storyId": storyPage,
    "/admin": adminPage,
  });
}

function resolveAppContainer() {
  return document.getElementById("app");
}

function setupAppStateDebugging() {
  if (!ENABLE_APP_STATE_DEBUG) {
    return () => null;
  }

  console.log("[app-state] Initial:", getAppState());
  return subscribeToAppState((state) => {
    console.log("[app-state] Updated:", state);
  });
}

function bootstrapApp() {
  const appContainer = resolveAppContainer();
  if (!appContainer) {
    throw new Error("App container '#app' was not found");
  }

  setupAppStateDebugging();

  const router = createAppRouter();
  const header = createHeader(() => router.navigate("/"));

  const renderPage = async () => {
    await router.render(appContainer);
  };

  header.mount();
  window.addEventListener("hashchange", renderPage);
  renderPage();
}

bootstrapApp();
