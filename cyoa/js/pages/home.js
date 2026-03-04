/**
 * Home page - displays list of stories
 */

export async function renderHome() {
  const stories = [
    {
      number: 1,
      title: "The Mysterious Forest",
      emoji: "🌲",
      chapters: 30,
      approxTime: "20-30 min",
    },
    {
      number: 2,
      title: "Midnight at Hollow Moon Museum",
      emoji: "🏺",
      chapters: 47,
      approxTime: "30-45 min",
    },
    {
      number: 3,
      title: "The Last Broadcast",
      emoji: "🛰️",
      chapters: 45,
      approxTime: "30-45 min",
    },
    {
      number: 4,
      title: "The Clockwork Carnival",
      emoji: "🎠",
      chapters: 6,
      approxTime: "5-10 min",
    },
    {
      number: 5,
      title: "The Sunken Library",
      emoji: "📚",
      chapters: 6,
      approxTime: "5-10 min",
    },
    {
      number: 6,
      title: "Echoes of the Perseid Gate",
      emoji: "🚀",
      chapters: 10,
      approxTime: "25-35 min",
    },
    {
      number: 7,
      title: "Whiskers and the Midnight Key",
      emoji: "🐈",
      chapters: 4,
      approxTime: "5-10 min",
    },
  ];

  const storiesHtml = stories
    .map(
      (story) => `
        <article class="story-card" data-story="${story.number}" role="button" tabindex="0" aria-label="Open ${story.title}">
          <div class="story-card-title">
            <span class="story-card-emoji" aria-hidden="true">${story.emoji}</span>
            <span>${story.title}</span>
          </div>
          <div class="story-card-meta">
            <div class="story-card-meta-line">
              <span class="story-card-meta-icon" aria-hidden="true">📖</span>
              <span>${story.chapters} ${story.chapters === 1 ? "chapter" : "chapters"}</span>
            </div>
            <div class="story-card-meta-line">
              <span class="story-card-meta-icon" aria-hidden="true">⏱️</span>
              <span>${story.approxTime}</span>
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  const html = `
    <main>
      <div class="home-container">
        <h1 class="home-title">Where Will You Begin?</h1>
        <div class="stories-grid" role="list">
          ${storiesHtml}
        </div>
        <footer class="home-footer">Choose Your Own Adventure</footer>
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
