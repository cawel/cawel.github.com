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
 * - Load story metadata from `/assets/stories/metadata.json`
 * - Cache metadata fetch promise to prevent duplicate requests
 * - Return a safe empty list on load failures
 *
 * Routing behavior:
 * - Uses hash-based navigation (e.g. `#/story/2/4`)
 * - Supports route params through `router.js`
 * - Page modules return HTML strings rendered into `#app`
 */

import { createRouter } from "./router.js";
import { createHeader } from "./components/header.js";
import { renderHome } from "./pages/home.js";
import { renderStory } from "./pages/story.js";
import { renderAdmin } from "./pages/admin.js";
import { withBasePath } from "./utils/pathResolver.js";

let storiesMetadataPromise = null;

async function loadStoriesMetadata() {
  if (!storiesMetadataPromise) {
    storiesMetadataPromise = fetch(
      withBasePath("/assets/stories/metadata.json"),
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load stories metadata");
        }
        return response.json();
      })
      .catch((error) => {
        console.error("[home] Unable to load stories metadata:", error);
        return [];
      });
  }

  return storiesMetadataPromise;
}

function createAppRouter() {
  return createRouter({
    "/": async () => renderHome(await loadStoriesMetadata()),
    "/story/:storyId/:chapterId": renderStory,
    "/story/:storyId": renderStory,
    "/admin": renderAdmin,
  });
}

function resolveAppContainer() {
  return document.getElementById("app");
}

function bootstrapApp() {
  const appContainer = resolveAppContainer();
  if (!appContainer) {
    throw new Error("App container '#app' was not found");
  }

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
