import test from "node:test";
import assert from "node:assert/strict";
import { getFreshModuleUrl } from "./testHelpers.mjs";

function getFreshStoriesRepositoryModuleUrl() {
  return getFreshModuleUrl("../js/services/storiesRepository.js", import.meta.url);
}

test("repo: getStoriesMetadata caches successful metadata fetch", async () => {
  const previousFetch = globalThis.fetch;
  let fetchCount = 0;

  globalThis.fetch = async () => {
    fetchCount += 1;
    return {
      ok: true,
      async json() {
        return [{ number: 1, title: "One" }];
      },
    };
  };

  try {
    const { getStoriesMetadata } = await import(getFreshStoriesRepositoryModuleUrl());

    const first = await getStoriesMetadata();
    const second = await getStoriesMetadata();

    assert.equal(fetchCount, 1);
    assert.deepEqual(first, [{ number: 1, title: "One" }]);
    assert.deepEqual(second, [{ number: 1, title: "One" }]);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("repo: getStoriesMetadata returns empty array when metadata fetch fails", async () => {
  const previousFetch = globalThis.fetch;
  const previousConsoleError = console.error;
  let fetchCount = 0;

  globalThis.fetch = async () => {
    fetchCount += 1;
    return {
      ok: false,
      async json() {
        return [];
      },
    };
  };
  console.error = () => {};

  try {
    const { getStoriesMetadata } = await import(getFreshStoriesRepositoryModuleUrl());

    const first = await getStoriesMetadata();
    const second = await getStoriesMetadata();

    assert.equal(fetchCount, 1);
    assert.deepEqual(first, []);
    assert.deepEqual(second, []);
  } finally {
    globalThis.fetch = previousFetch;
    console.error = previousConsoleError;
  }
});

test("repo: getStoryMarkdown caches by story id and reuses promise per key", async () => {
  const previousFetch = globalThis.fetch;
  let fetchCount = 0;

  globalThis.fetch = async (url) => {
    fetchCount += 1;
    return {
      ok: true,
      async text() {
        return `content:${url}`;
      },
    };
  };

  try {
    const { getStoryMarkdown } = await import(getFreshStoriesRepositoryModuleUrl());

    const firstStoryA = await getStoryMarkdown(1);
    const secondStoryA = await getStoryMarkdown("1");
    const storyB = await getStoryMarkdown(2);

    assert.equal(fetchCount, 2);
    assert.equal(firstStoryA, secondStoryA);
    assert.match(firstStoryA, /story-1\.md/);
    assert.match(storyB, /story-2\.md/);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("repo: getStoryMarkdown throws when story fetch is not ok", async () => {
  const previousFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: false,
    async text() {
      return "";
    },
  });

  try {
    const { getStoryMarkdown } = await import(getFreshStoriesRepositoryModuleUrl());

    await assert.rejects(
      () => getStoryMarkdown(123),
      /Failed to load story 123/,
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});
