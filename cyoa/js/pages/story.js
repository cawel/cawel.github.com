/**
 * Story page - displays a story with chapters and choices
 */

import { parseStory } from "../utils/storyParser.js";
import { chooseAudioSource } from "../utils/audioResolver.js";

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
          <button class="choice-link" data-chapter="${choice.chapterNumber}" data-story="${storyNum}">
            <span class="choice-emoji" aria-hidden="true">✨</span><span class="choice-text">${choice.text}</span>
          </button>
        </li>
      `,
    )
    .join("");

  const html = `
    <audio id="story-music" loop style="display: none;"></audio>
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
  setTimeout(async () => {
    if (window.cyoaAudioControl && window.cyoaAudioControl.muteAndStopAll) {
      window.cyoaAudioControl.muteAndStopAll();
    }

    document.querySelectorAll(".choice-link").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const nextChapter = e.currentTarget.dataset.chapter;
        const storyNum = e.currentTarget.dataset.story;
        currentChapter = parseInt(nextChapter);
        // Update the page content
        updateStoryPage(storyNum);
      });
    });

    // Resolve story music from this story folder and auto-play if unmuted
    const audio = document.getElementById("story-music");
    const storyMusicFolder = `stories/story${storyNum}/music/`;
    const source = await chooseAudioSource(storyMusicFolder, [
      `${storyMusicFolder}bg-music.mp3`,
    ]);

    if (audio && source) {
      audio.src = source;

      if (!(window.cyoaAudioControl && window.cyoaAudioControl.isMuted())) {
        audio.play().catch(() => {
          // Autoplay may fail, user can click button to play
        });
      }
    } else if (audio && !source) {
      console.warn(
        `[audio] No playable story music found in ${storyMusicFolder}`,
      );
    }
  }, 0);

  return html;
}

async function updateStoryPage(storyNum) {
  const content = renderChapter(storyNum);
  const main = document.querySelector("main");
  if (main) {
    main.innerHTML = content
      .replace(/^.*?<main[^>]*>/, "")
      .replace(/<\/main>.*?$/, "");
  }
}
