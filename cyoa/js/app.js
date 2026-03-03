/**
 * Main application entry point
 * Single Page Application with hash-based routing
 */

import { createRouter } from "./router.js";
import { createHeader } from "./components/header.js";
import { renderHome } from "./pages/home.js";
import { renderStory } from "./pages/story.js";
import { renderAdmin } from "./pages/admin.js";

// Create router with all routes
const router = createRouter({
  "/": renderHome,
  "/story/:storyId/:chapterId": renderStory,
  "/story/:storyId": renderStory,
  "/admin": renderAdmin,
});

// Create header
const header = createHeader(
  () => router.navigate("/"),
  () => {}, // Audio toggle is handled in header component
);

// Main app container
const appContainer = document.getElementById("app");

// Mount header once at startup
header.mount();

// Initial render
const renderPage = async () => {
  await router.render(appContainer);
  header.syncState();
};

// Render on hash change
window.addEventListener("hashchange", renderPage);

// Initial render
renderPage();
