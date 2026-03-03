/**
 * Home page - displays list of stories
 */

export async function renderHome() {
  const stories = [
    { number: 1, title: "Story 1" },
    { number: 2, title: "Story 2" },
    { number: 3, title: "Story 3" },
  ];

  const storiesHtml = stories
    .map(
      (story) => `
        <tr class="story-row">
          <td class="story-cell">
            <button class="launch-button" data-story="${story.number}">
              Launch<span class="launch-emoji">🚀</span>
            </button>
          </td>
          <td class="story-cell">${story.title}</td>
        </tr>
      `,
    )
    .join("");

  const html = `
    <main>
      <div class="home-container">
        <h1 class="home-title">Welcome to Choose Your Own Adventure</h1>
        <table class="stories-grid">
          ${storiesHtml}
        </table>
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
