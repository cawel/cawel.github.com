/**
 * Home page - displays list of stories
 */

export async function renderHome(stories = []) {
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
        <footer class="home-footer">Choose Your Own Adventure | 2026</footer>
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
