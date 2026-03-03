/**
 * Header component - shared across all pages
 */

export function createHeader(onNavigateHome, onAudioToggle) {
  let isPlaying = false;
  let audioElement = null;

  const setupAudio = () => {
    // Check if there's a story-specific music playing
    const currentStoryMusic = document.getElementById("story-music");
    if (currentStoryMusic) {
      audioElement = currentStoryMusic;
      isPlaying = currentStoryMusic.paused === false;
    } else {
      // Look for main audio
      audioElement = document.getElementById("main-audio");
      isPlaying = audioElement && audioElement.paused === false;
    }
  };

  const toggleAudio = () => {
    setupAudio();
    if (!audioElement) return;

    if (audioElement.paused) {
      audioElement.play();
      isPlaying = true;
    } else {
      audioElement.pause();
      isPlaying = false;
    }
    updateAudioButton();
  };

  const updateAudioButton = () => {
    const btn = document.querySelector(".audio-control");
    if (btn) {
      btn.textContent = isPlaying ? "🔊" : "🔇";
    }
  };

  const getHtml = () => {
    return `
      <header>
        <button class="header-title" id="home-link">
          <span class="header-emoji">📖</span>
          <span>Choose Your Own Adventure</span>
        </button>
        <button class="audio-control" id="audio-btn" title="Toggle background music">
          🔇
        </button>
      </header>
    `;
  };

  const mount = () => {
    const header =
      document.querySelector("header") ||
      (() => {
        const el = document.createElement("header");
        document.body.insertBefore(el, document.body.firstChild);
        return el;
      })();

    header.innerHTML = getHtml();

    // Setup event listeners
    document
      .getElementById("home-link")
      .addEventListener("click", onNavigateHome);
    document.getElementById("audio-btn").addEventListener("click", toggleAudio);

    // Setup audio tracking
    setTimeout(() => {
      setupAudio();
      updateAudioButton();
    }, 100);
  };

  return {
    mount,
    updateAudioButton,
  };
}
