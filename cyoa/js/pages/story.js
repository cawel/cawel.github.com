/**
 * Story page - displays a story with chapters and choices
 */

import { parseStory } from "../utils/storyParser.js";
import { withBasePath } from "../utils/pathResolver.js";

function formatChapterContent(content) {
  return content
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export async function renderStory(params) {
  const storyNum = params.storyId;
  const chapterParam = params.chapterId;
  let storyData = null;

  try {
    // Fetch story data from markdown file
    const response = await fetch(
      withBasePath(`/js/data/stories/story-${storyNum}.md`),
    );
    if (!response.ok) {
      throw new Error(`Failed to load story ${storyNum}`);
    }
    const markdownText = await response.text();
    storyData = parseStory(markdownText);
  } catch (error) {
    return `
      <main class="story-main">
        <div class="story-container">
          <p style="color: red;">Error loading story: ${error.message}</p>
        </div>
      </main>
    `;
  }

  const requestedChapter = Number.parseInt(chapterParam || "1", 10);
  const chapterNumber = Number.isNaN(requestedChapter) ? 1 : requestedChapter;

  if (!storyData || !storyData[chapterNumber]) {
    return `
      <main class="story-main">
        <div class="story-container">
          <p>Chapter not found</p>
        </div>
      </main>
    `;
  }

  const chapter = storyData[chapterNumber];
  const chapterContentHtml = formatChapterContent(chapter.content);

  const choicesHtml = chapter.choices
    .map(
      (choice) => `
        <li class="choice-item">
          <span class="choice-emoji" aria-hidden="true">✨</span>
          <a class="choice-link" href="#/story/${storyNum}/${choice.chapterNumber}">
            <span class="choice-text">${choice.text}</span>
          </a>
        </li>
      `,
    )
    .join("");

  const html = `
    <main class="story-main">
      <div class="story-container">
        <h2 class="chapter-title">${chapter.title}</h2>
        <div class="chapter-content">${chapterContentHtml}</div>
        ${
          chapter.choices.length > 0
            ? `
          <h3 class="chapter-section-title">What do you do?</h3>
          <ul class="choices-list">
            ${choicesHtml}
          </ul>
        `
            : ""
        }
      </div>
    </main>
  `;

  return html;
}
