/**
 * Header component - shared across all pages
 */

export function createHeader(onNavigateHome, onAudioToggle) {
  let isPlaying = false;
  let audioElement = null;
  let muted = false; // user-requested mute state (controls red x)

  const ensureMainAudioExists = () => {
    // Always add a main audio element so the control has something to toggle,
    // even if there is no file in place yet.  The README instructs users to
    // drop `music/bg-music.mp3` in the repo – if the file isn't present this
    // element will still exist but playback will simply fail silently.
    if (!document.getElementById("main-audio")) {
      const a = document.createElement("audio");
      a.id = "main-audio";
      a.loop = true;
      a.style.display = "none";
      a.src = "/music/bg-music.mp3";
      document.body.appendChild(a);
    }
  };

  const setupAudio = () => {
    // make sure homepage music element is created ahead of time
    ensureMainAudioExists();

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
    // flip mute request
    muted = !muted;

    if (audioElement) {
      if (muted) {
        audioElement.pause();
      } else {
        audioElement.play().catch(() => {
          /* ignore errors; UI still uncontrolled by actual playback */
        });
      }
    }
    // track play state if audio is present
    isPlaying = audioElement ? !audioElement.paused : false;

    updateAudioButton();
  };

  const updateAudioButton = () => {
    const btn = document.querySelector(".audio-control");
    if (btn) {
      const cross = btn.querySelector('.mute-cross');
      const speaker = btn.querySelector('.speaker-icon');
      // speaker always remains visible; the cross overlays when muted.
      if (speaker) speaker.style.visibility = 'visible';
      if (cross) cross.style.visibility = muted ? 'visible' : 'hidden';
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
          <span class="speaker-icon">🔊</span>
          <span class="mute-cross" style="visibility:hidden"></span>
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
    const audioBtn = document.getElementById("audio-btn");
    if (audioBtn) {
      audioBtn.addEventListener("click", () => {
        toggleAudio();
      });
    }

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
