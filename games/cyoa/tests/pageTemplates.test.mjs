import test from "node:test";
import assert from "node:assert/strict";

import { renderHomePageTemplate } from "../js/pages/home.template.js";
import {
  renderStoryChapter,
  renderStoryErrorState,
  renderStoryMissingChapterState,
} from "../js/pages/story.template.js";
import { renderAdminPageTemplate } from "../js/pages/admin.template.js";
import { withDomEnvironment } from "./testHelpers.mjs";

test("template: home.template renders key structural hooks", async () => {
  await withDomEnvironment(async () => {
    const html = renderHomePageTemplate([
      {
        number: 7,
        title: "The <Cave>",
        emoji: "🕯️",
        approxTime: "10 min",
        keywords: ["dark", "echo"],
      },
    ]);

    assert.match(html, /home-main/);
    assert.match(html, /home-container/);
    assert.match(html, /story-card/);
    assert.match(html, /data-story="7"/);
    assert.match(html, /&lt;Cave&gt;/);
  });
});

test("template: story.template renders choices and ending states", async () => {
  await withDomEnvironment(async () => {
    const chapterHtml = renderStoryChapter("2", {
      title: "Fork",
      content: "Left\n\nRight",
      choices: [
        { text: "Go left", chapterNumber: 3 },
        { text: "Go right", chapterNumber: 4 },
      ],
    });

    assert.match(chapterHtml, /chapter-title/);
    assert.match(chapterHtml, /choices-list/);
    assert.match(chapterHtml, /#\/story\/2\/3/);
    assert.match(chapterHtml, /#\/story\/2\/4/);

    const chapterWithImageHtml = renderStoryChapter(
      "2",
      {
        title: "Fork",
        content: "Left\n\nRight",
        choices: [{ text: "Go left", chapterNumber: 3 }],
      },
      "/assets/stories/2/1.webp",
    );
    assert.match(chapterWithImageHtml, /chapter-illustration/);
    assert.match(chapterWithImageHtml, /assets\/stories\/2\/1\.webp/);

    const endingHtml = renderStoryChapter("2", {
      title: "End",
      content: "Done",
      choicesEndingText: "The End",
    });
    assert.match(endingHtml, /choices-ending-text/);
    assert.match(endingHtml, /The End/);

    assert.match(renderStoryErrorState("oops"), /Error loading story/);
    assert.match(renderStoryMissingChapterState(), /Chapter not found/);
  });
});

test("template: admin.template renders required ids and controls", async () => {
  await withDomEnvironment(async () => {
    const html = renderAdminPageTemplate("# Story\n## Keywords\n- a\n- b\n- c");

    assert.match(html, /admin-container/);
    assert.match(html, /id="story-select"/);
    assert.match(html, /id="load-btn"/);
    assert.match(html, /id="markdown-toggle-btn"/);
    assert.match(html, /id="story-editor-highlight"/);
    assert.match(html, /id="story-editor"/);
    assert.match(html, /id="validate-btn"/);
    assert.match(html, /id="validation-result"/);
  });
});
