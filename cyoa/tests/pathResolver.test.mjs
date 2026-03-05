import test from "node:test";
import assert from "node:assert/strict";

import { createPathResolver, withBasePath } from "../js/utils/pathResolver.js";

test("path: createPathResolver(basePath?) normalizes empty and root base paths", () => {
  assert.equal(
    createPathResolver("").withBasePath("/assets/stories/metadata.json"),
    "/assets/stories/metadata.json",
  );
  assert.equal(
    createPathResolver("/").withBasePath("/assets/stories/metadata.json"),
    "/assets/stories/metadata.json",
  );
});

test("path: createPathResolver(basePath?) normalizes leading and trailing slashes", () => {
  const resolver = createPathResolver("cyoa///");
  assert.equal(
    resolver.withBasePath("/assets/stories/metadata.json"),
    "/cyoa/assets/stories/metadata.json",
  );
});

test("path: createPathResolver(basePath?) withBasePath(path) treats relative and absolute paths consistently", () => {
  const resolver = createPathResolver("/any-base");
  assert.equal(
    resolver.withBasePath("assets/music/tracks.json"),
    resolver.withBasePath("/assets/music/tracks.json"),
  );
});

test("path: withBasePath(path) delegates to createPathResolver() with configured APP_BASE_PATH", () => {
  const resolver = createPathResolver();
  assert.equal(
    withBasePath("/assets/music/tracks.json"),
    resolver.withBasePath("/assets/music/tracks.json"),
  );
});
