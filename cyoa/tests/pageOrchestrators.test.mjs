import test from "node:test";
import assert from "node:assert/strict";

import { renderHomePage } from "../js/pages/home.page.js";
import { renderStoryPage } from "../js/pages/story.page.js";
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
