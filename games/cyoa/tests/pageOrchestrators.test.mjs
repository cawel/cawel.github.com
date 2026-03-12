import test from "node:test";
import assert from "node:assert/strict";

import { renderHomePage } from "../js/pages/home.page.js";
import { withBasePath } from "../js/utils/pathResolver.js";
import {
  __storyPageTestHooks,
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
