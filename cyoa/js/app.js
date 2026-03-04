/**
 * Main application entry point
 * Single Page Application with hash-based routing
 *
 * Bootstrap responsibilities:
 * - Register route handlers for home, story, and admin pages
 * - Mount shared header once at startup
 * - Render the current route into the #app container
 *
 * Routing behavior:
 * - Uses hash-based navigation (e.g. #/story/2/4)
 * - Re-renders whenever the hash changes
 *
 * Render lifecycle:
 * - router.render() injects route HTML
 * - header state is initialized on mount
 */

import { createRouter } from "./router.js";
import { createHeader } from "./components/header.js";
import { renderHome } from "./pages/home.js";
import { renderStory } from "./pages/story.js";
import { renderAdmin } from "./pages/admin.js";
import { stories } from "./data/stories.js";

// Create router with all routes
const router = createRouter({
  "/": () => renderHome(stories),
  "/story/:storyId/:chapterId": renderStory,
  "/story/:storyId": renderStory,
  "/admin": renderAdmin,
});

// Create header
const header = createHeader(() => router.navigate("/"));

// Main app container
const appContainer = document.getElementById("app");

// Mount header once at startup
header.mount();

// Initial render
const renderPage = async () => {
  await router.render(appContainer);
};

// Render on hash change
window.addEventListener("hashchange", renderPage);

// Initial render
renderPage();
