import test from "node:test";
import assert from "node:assert/strict";

import { renderHomePage } from "../js/pages/home.page.js";
import { withBasePath } from "../js/utils/pathResolver.js";
import {
  __storyPageTestHooks,
  bindStoryPage,
  loadStoryPageData,
  renderStoryPage,
} from "../js/pages/story.page.js";
import { renderAdminPage } from "../js/pages/admin.page.js";
import { withDomEnvironment } from "./testHelpers.mjs";

test("page: home.page renderHomePage renders stories and escapes html", async () => {
  await withDomEnvironment(async () => {
    const html = await renderHomePage({
      stories: [
        {
          number: 1,
          title: "<Danger>",
          emoji: "📘",
          approxTime: "5 min",
          keywords: ["mystery", "forest"],
        },
      ],
    });

    assert.match(html, /home-title/);
    assert.match(html, /stories-grid/);
    assert.match(html, /&lt;Danger&gt;/);
    assert.match(html, /data-story="1"/);
  });
});

test("page: story.page renderStoryPage handles error, missing, and success branches", async () => {
  await withDomEnvironment(async () => {
    const errorHtml = await renderStoryPage({
      storyId: "1",
      chapterNumber: 1,
      chapter: null,
      error: "boom",
    });
    assert.match(errorHtml, /Error loading story/);
    assert.match(errorHtml, /boom/);

    const missingHtml = await renderStoryPage({
      storyId: "1",
      chapterNumber: 99,
      chapter: null,
      error: null,
    });
    assert.match(missingHtml, /Chapter not found/);

    const successHtml = await renderStoryPage({
      storyId: "1",
      chapterNumber: 1,
      chapter: {
        title: "Arrival",
        content: "Line one\n\nLine two",
        choices: [{ text: "Open the door", chapterNumber: 2 }],
      },
      error: null,
    });
    assert.match(successHtml, /Arrival/);
    assert.match(successHtml, /What do you do\?/);
    assert.match(successHtml, /#\/story\/1\/2/);
  });
});

test("page: admin.page renderAdminPage renders expected editor structure", async () => {
  await withDomEnvironment(async () => {
    const html = await renderAdminPage({
      example: "# Title\n## Keywords\n- a\n- b\n- c",
    });

    assert.match(html, /admin-title/);
    assert.match(html, /id="story-select"/);
    assert.match(html, /id="story-editor"/);
    assert.match(html, /id="validate-btn"/);
    assert.match(html, /Expected Markdown Format/);
  });
});

test("page: story.page loadStoryPageData reuses parsed cache per story id", async () => {
  const previousFetch = globalThis.fetch;
  let fetchCount = 0;

  const storyContent = `# Cached Story

## Keywords
- one
- two
- three

## Chapter 1
### Title
Start

### Content
Hello

### Choices
1. Continue -> 2

## Chapter 2
### Title
End

### Content
Done

### Choices
1. Continue -> 3

## Chapter 3
### Title
No Image Chapter

### Content
Still part of the story.

### Choices
The End`;

  globalThis.fetch = async (url) => {
    fetchCount += 1;

    if (String(url).includes("/assets/stories/metadata-images.json")) {
      return {
        ok: true,
        async json() {
          return {
            imageSpec: null,
            stories: [
              {
                number: 901,
                chapters: [{ number: 1 }, { number: 2 }],
              },
            ],
          };
        },
      };
    }

    return {
      ok: true,
      async text() {
        return storyContent;
      },
    };
  };

  try {
    __storyPageTestHooks.clearParsedStoryCache();

    const first = await loadStoryPageData({ storyId: "901", chapterId: "1" });
    const second = await loadStoryPageData({ storyId: "901", chapterId: "2" });
    const third = await loadStoryPageData({ storyId: "901", chapterId: "3" });

    assert.equal(fetchCount, 2);
    assert.equal(__storyPageTestHooks.getParsedStoryCacheSize(), 1);
    assert.equal(first.chapter?.title, "Start");
    assert.equal(second.chapter?.title, "End");
    assert.equal(third.chapter?.title, "No Image Chapter");
    assert.deepEqual(first.chapterImagePaths, [
      withBasePath("/assets/stories/901/1.webp"),
    ]);
    assert.deepEqual(second.chapterImagePaths, [
      withBasePath("/assets/stories/901/2.webp"),
    ]);
    assert.equal(third.chapterImagePaths, null);
  } finally {
    __storyPageTestHooks.clearParsedStoryCache();
    globalThis.fetch = previousFetch;
  }
});

test("page: story.page parsed-story cache evicts least-recently-used entries", async () => {
  const previousFetch = globalThis.fetch;

  globalThis.fetch = async (url) => {
    const asString = String(url);
    if (asString.includes("/assets/stories/metadata-images.json")) {
      return {
        ok: true,
        async json() {
          return { imageSpec: null, stories: [] };
        },
      };
    }

    const storyIdMatch = asString.match(/\/assets\/stories\/(\d+)\/story\.md/);
    const storyId = storyIdMatch ? storyIdMatch[1] : "0";

    return {
      ok: true,
      async text() {
        return `# Story ${storyId}\n\n## Keywords\n- one\n- two\n- three\n\n## Chapter 1\n### Title\nStory ${storyId}\n\n### Content\nHello ${storyId}\n\n### Choices\nThe End`;
      },
    };
  };

  try {
    __storyPageTestHooks.clearParsedStoryCache();

    const ids = ["1201", "1202", "1203", "1204", "1205", "1206"];
    for (const storyId of ids) {
      await loadStoryPageData({ storyId, chapterId: "1" });
    }

    assert.equal(__storyPageTestHooks.getParsedStoryCacheSize(), 5);
    assert.deepEqual(__storyPageTestHooks.getParsedStoryCacheKeys(), [
      "1202",
      "1203",
      "1204",
      "1205",
      "1206",
    ]);
  } finally {
    __storyPageTestHooks.clearParsedStoryCache();
    globalThis.fetch = previousFetch;
  }
});

test("page: story.page bindStoryPage handles illustration fallback chain", async () => {
  let onLoad = null;
  let onError = null;

  const figureClassSet = new Set();
  const figure = {
    dataset: {
      fallbackSources:
        "/assets/stories/2/fallback-2.webp|/assets/stories/2/fallback-3.webp",
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    removeAttribute(name) {
      delete this[name];
    },
    classList: {
      add(name) {
        figureClassSet.add(name);
      },
    },
  };

  const image = {
    src: "/assets/stories/2/fallback-1.webp",
    complete: false,
    naturalWidth: 0,
    classList: {
      contains(name) {
        return name === "chapter-illustration-image";
      },
    },
    closest(selector) {
      if (selector === ".chapter-illustration") {
        return figure;
      }
      return null;
    },
  };

  const container = {
    addEventListener(type, handler) {
      if (type === "load") {
        onLoad = handler;
      }
      if (type === "error") {
        onError = handler;
      }
    },
    removeEventListener() {},
    querySelectorAll(selector) {
      if (selector === ".chapter-illustration-image") {
        return [image];
      }
      return [];
    },
  };

  const cleanup = await bindStoryPage(container);

  onError({ target: image });
  assert.equal(image.src, "/assets/stories/2/fallback-2.webp");
  assert.equal(
    figure.dataset.fallbackSources,
    "/assets/stories/2/fallback-3.webp",
  );

  onError({ target: image });
  assert.equal(image.src, "/assets/stories/2/fallback-3.webp");
  assert.equal(figure.dataset.fallbackSources, "");

  onError({ target: image });
  assert.equal(figure.hidden, "hidden");

  onLoad({ target: image });
  assert.equal(figureClassSet.has("chapter-illustration-loaded"), true);

  if (typeof cleanup === "function") {
    cleanup();
  }
});
