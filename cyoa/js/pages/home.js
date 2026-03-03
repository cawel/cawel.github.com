/**
 * Home page - displays list of stories
 */

export async function renderHome() {
  const stories = [
    { number: 1, title: "The Mysterious Forest", emoji: "🌲" },
    { number: 2, title: "Midnight at Hollow Moon Museum", emoji: "🏺" },
    { number: 3, title: "The Last Broadcast", emoji: "🛰️" },
  ];

  const storiesHtml = stories
    .map(
      (story) => `
        <article class="story-card">
          <div class="story-card-title">
            <span class="story-card-emoji" aria-hidden="true">${story.emoji}</span>
            <span>${story.title}</span>
          </div>
          <button class="launch-button" data-story="${story.number}">
            Start Adventure<span class="launch-emoji">✨</span>
          </button>
        </article>
      `,
    )
    .join("");

  const html = `
    <main>
      <div class="home-container">
        <div class="stories-grid" role="list">
          ${storiesHtml}
        </div>
      </div>
    </main>
  `;

  // Add event delegation after rendering
  setTimeout(() => {
    document.querySelectorAll(".launch-button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const storyNum = e.currentTarget.dataset.story;
        window.location.hash = `#/story/${storyNum}`;
      });
    });
  }, 0);

  return html;
}
