/**
 * Path resolver with a single configurable app base path.
 *
 * Set `APP_BASE_PATH` once (in `/appConfig.js`) and all
 * `withBasePath(...)` calls in the app will use it.
 *
 * Example:
 * - APP_BASE_PATH = "/cyoa"
 * - withBasePath("/assets/stories/metadata.json")
 * - Result: /cyoa/assets/stories/metadata.json
 */
import { APP_BASE_PATH } from "../../appConfig.js";

function normalizeBasePath(basePath) {
  if (!basePath || basePath === "/") return "";
  const trimmed = String(basePath).trim();
  if (!trimmed) return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

export function getAppBasePath() {
  return normalizeBasePath(APP_BASE_PATH);
}

export function withBasePath(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAppBasePath()}${normalizedPath}`;
}
