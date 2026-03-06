/**
 * Path resolver with a single configurable app base path.
 *
 * Set `APP_BASE_PATH` once (in `/js/appConfig.js`) and use
 * `withBasePath(...)` for app assets/routes.
 *
 * Exposed API:
 * - `createPathResolver(basePath?)` for injected/testable behavior.
 * - `withBasePath(path)` as the default app-level helper.
 *
 * Example:
 * - APP_BASE_PATH = "/cyoa"
 * - withBasePath("/assets/stories/metadata-stories.json")
 * - Result: /cyoa/assets/stories/metadata-stories.json
 */
import { APP_BASE_PATH } from "../appConfig.js";

function normalizeBasePath(basePath) {
  if (!basePath || basePath === "/") return "";
  const trimmed = String(basePath).trim();
  if (!trimmed) return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

export function createPathResolver(basePath = APP_BASE_PATH) {
  const normalizedBasePath = normalizeBasePath(basePath);

  return {
    withBasePath(path) {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      return `${normalizedBasePath}${normalizedPath}`;
    },
  };
}

export function withBasePath(path) {
  return createPathResolver().withBasePath(path);
}
