/**
 * Home page view adapter: DOM querying and event binding.
 */

/**
 * @param {HTMLElement|Document|Element} rootElement
 * @param {(storyNum: string) => void} onSelectStory
 */
export function bindHomeStoryCardNavigation(rootElement, onSelectStory) {
  rootElement.querySelectorAll(".story-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      const storyNum = event.currentTarget?.dataset?.story;
      if (storyNum) {
        onSelectStory(storyNum);
      }
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const storyNum = event.currentTarget?.dataset?.story;
      if (storyNum) {
        onSelectStory(storyNum);
      }
    });
  });
}
