import test from "node:test";
import assert from "node:assert/strict";
import { getFreshModuleUrl } from "./testHelpers.mjs";

function getFreshStoriesRepositoryModuleUrl() {
  return getFreshModuleUrl(
    "../js/services/storiesRepository.js",
    import.meta.url,
  );
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
    const { getStoriesMetadata } = await import(
      getFreshStoriesRepositoryModuleUrl()
    );

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
    const { getStoriesMetadata } = await import(
      getFreshStoriesRepositoryModuleUrl()
    );

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

test("repo: getStoryContent caches by story id and reuses promise per key", async () => {
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
    const { getStoryContent } = await import(
      getFreshStoriesRepositoryModuleUrl()
    );

    const firstStoryA = await getStoryContent(1);
    const secondStoryA = await getStoryContent("1");
    const storyB = await getStoryContent(2);

    assert.equal(fetchCount, 2);
    assert.equal(firstStoryA, secondStoryA);
    assert.match(firstStoryA, /\/1\/story\.md/);
    assert.match(storyB, /\/2\/story\.md/);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("repo: getStoryContent throws when story fetch is not ok", async () => {
  const previousFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: false,
    async text() {
      return "";
    },
  });

  try {
    const { getStoryContent } = await import(
      getFreshStoriesRepositoryModuleUrl()
    );

    await assert.rejects(
      () => getStoryContent(123),
      /Failed to load story 123/,
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("repo: getStoriesImageMetadata caches successful image metadata fetch", async () => {
  const previousFetch = globalThis.fetch;
  let fetchCount = 0;

  globalThis.fetch = async (url) => {
    fetchCount += 1;
    return {
      ok: true,
      async json() {
        return {
          imageSpec: null,
          stories: [{ number: 1, chapters: [{ number: 1 }] }],
        };
      },
      url,
    };
  };

  try {
    const { getStoriesImageMetadata } = await import(
      getFreshStoriesRepositoryModuleUrl()
    );

    const first = await getStoriesImageMetadata();
    const second = await getStoriesImageMetadata();

    assert.equal(fetchCount, 1);
    assert.deepEqual(first, {
      imageSpec: null,
      stories: [{ number: 1, chapters: [{ number: 1 }] }],
    });
    assert.deepEqual(second, {
      imageSpec: null,
      stories: [{ number: 1, chapters: [{ number: 1 }] }],
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("repo: getStoriesImageMetadata returns empty array when image metadata fetch fails", async () => {
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
    const { getStoriesImageMetadata } = await import(
      getFreshStoriesRepositoryModuleUrl()
    );

    const first = await getStoriesImageMetadata();
    const second = await getStoriesImageMetadata();

    assert.equal(fetchCount, 1);
    assert.deepEqual(first, { imageSpec: null, stories: [] });
    assert.deepEqual(second, { imageSpec: null, stories: [] });
  } finally {
    globalThis.fetch = previousFetch;
    console.error = previousConsoleError;
  }
});
