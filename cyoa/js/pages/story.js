/**
 * Story page - displays a story with chapters and choices
 */

import { parseStory } from "../utils/storyParser.js";

export async function renderStory(params) {
  const storyNum = params.storyId;
  const chapterParam = params.chapterId;
  let storyData = null;

  try {
    // Fetch story data from markdown file
    const response = await fetch(`/stories/story${storyNum}/chapters.md`);
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
        <div class="chapter-content">${chapter.content}</div>
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
