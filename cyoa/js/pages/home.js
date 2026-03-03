/**
 * Home page - displays list of stories
 */

export async function renderHome() {
  const stories = [
    { number: 1, title: "The Mysterious Forest", emoji: "🌲" },
    { number: 2, title: "Midnight at Hollow Moon Museum", emoji: "🏺" },
    { number: 3, title: "The Last Broadcast", emoji: "🛰️" },
    { number: 4, title: "The Clockwork Carnival", emoji: "🎠" },
    { number: 5, title: "The Sunken Library", emoji: "📚" },
  ];

  const storiesHtml = stories
    .map(
      (story) => `
        <article class="story-card" data-story="${story.number}" role="button" tabindex="0" aria-label="Open ${story.title}">
          <div class="story-card-title">
            <span class="story-card-emoji" aria-hidden="true">${story.emoji}</span>
            <span>${story.title}</span>
          </div>
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
    document.querySelectorAll(".story-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const storyNum = e.currentTarget.dataset.story;
        window.location.hash = `#/story/${storyNum}`;
      });

      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const storyNum = e.currentTarget.dataset.story;
          window.location.hash = `#/story/${storyNum}`;
        }
      });
    });
  }, 0);

  return html;
}
