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
import { homePage } from "./pages/home.page.js";
import { storyPage } from "./pages/story.page.js";
import { adminPage } from "./pages/admin.page.js";
import { ENABLE_APP_STATE_DEBUG } from "./appConfig.js";
import { getAppState, subscribeToAppState } from "./state/appStore.js";

function createAppRouter() {
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
