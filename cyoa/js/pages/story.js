/**
 * Story page - displays a story with chapters and choices
 */

import { parseStory } from "../utils/storyParser.js";

let currentChapter = 1;
let storyData = null;

export async function renderStory(params) {
  const storyNum = params.storyId;

  try {
    // Fetch story data from markdown file
    const response = await fetch(`/stories/story${storyNum}/chapters.md`);
    if (!response.ok) {
      throw new Error(`Failed to load story ${storyNum}`);
    }
    const markdownText = await response.text();
    storyData = parseStory(markdownText);

    // Reset to first chapter
    currentChapter = 1;
  } catch (error) {
    return `
      <main class="story-main">
        <div class="story-container">
          <p style="color: red;">Error loading story: ${error.message}</p>
        </div>
      </main>
    `;
  }

  return renderChapter(storyNum);
}

function renderChapter(storyNum) {
  if (!storyData || !storyData[currentChapter]) {
    return `
      <main class="story-main">
        <div class="story-container">
          <p>Chapter not found</p>
        </div>
      </main>
    `;
  }

  const chapter = storyData[currentChapter];

  const choicesHtml = chapter.choices
    .map(
      (choice) => `
        <li class="choice-item">
          <span class="choice-emoji" aria-hidden="true">✨</span>
          <button class="choice-link" data-chapter="${choice.chapterNumber}" data-story="${storyNum}">
            <span class="choice-text">${choice.text}</span>
          </button>
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

  // Setup event delegation after rendering
  setTimeout(() => {
    document.querySelectorAll(".choice-link").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const nextChapter = e.currentTarget.dataset.chapter;
        const storyNum = e.currentTarget.dataset.story;
        currentChapter = parseInt(nextChapter);
        // Update the page content
        updateStoryPage(storyNum);
      });
    });
  }, 0);

  return html;
}

async function updateStoryPage(storyNum) {
  const content = renderChapter(storyNum);
  const main = document.querySelector("main");
  if (main) {
    // Extract just the story-container div from the HTML and update it
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const newContainer = tempDiv.querySelector(".story-container");
    const oldContainer = main.querySelector(".story-container");
    if (newContainer && oldContainer) {
      oldContainer.replaceWith(newContainer);
    }
  }
}
