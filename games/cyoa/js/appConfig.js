/**
 * Global app configuration.
 *
 * The app base path is resolved automatically from the folder that serves
 * this module (e.g. "/games/cyoa").
 */
function normalizeBasePath(basePath) {
  if (!basePath || basePath === "/") return "";
  const trimmed = String(basePath).trim();
  if (!trimmed) return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

function resolveBasePathFromModuleUrl() {
  const moduleDirectoryPathname = new URL("..", import.meta.url).pathname;
  return normalizeBasePath(moduleDirectoryPathname);
}

export const APP_BASE_PATH = resolveBasePathFromModuleUrl();

/**
 * Enables console logging for app-level shared state updates.
 * Keep disabled by default.
 */
export const ENABLE_APP_STATE_DEBUG = false;
