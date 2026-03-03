/**
 * Header component - shared across all pages
 */

import { chooseAudioSource } from "../utils/audioResolver.js";

export function createHeader(onNavigateHome, onAudioToggle) {
  let isPlaying = false;
  let audioElement = null;
  let muted = true; // start muted so red x shows; user must click to unmute
  let mainAudioReady = Promise.resolve(); // resolves when main audio src is chosen
  let headerHidden = false;
  let waitForRevealZoneExit = false;

  const setHeaderHidden = (hidden) => {
    const header = document.querySelector("header");
    if (!header) return;

    headerHidden = hidden;
    header.classList.toggle("header-collapsed", hidden);
  };

  const stopAllAudio = () => {
    const mainAudio = document.getElementById("main-audio");
    const storyAudio = document.getElementById("story-music");

    if (mainAudio && !mainAudio.paused) mainAudio.pause();
    if (storyAudio && !storyAudio.paused) storyAudio.pause();
  };

  const ensureMainAudioExists = () => {
    // Always add a main audio element so the control has something to toggle.
    // We first try to auto-discover whatever MP3 is present in `/music/`.
    // If directory listing is unavailable, we fall back to known filenames.
    if (!document.getElementById("main-audio")) {
      const a = document.createElement("audio");
      a.id = "main-audio";
      a.loop = true;
      a.style.display = "none";
      document.body.appendChild(a);

      // list of filenames we know about; update if you add more later
      const candidates = [
        "music/bg-music.mp3", // fallback
      ];

      // prefer any MP3 found in the folder listing, then fallback candidates
      mainAudioReady = chooseAudioSource("music/", candidates).then(
        (chosen) => {
          a.src = chosen || candidates[0];
          return a;
        },
      );
    } else {
      const existing = document.getElementById("main-audio");
      mainAudioReady = Promise.resolve(existing);
    }
  };
  const setupAudio = () => {
    // make sure homepage music element is created ahead of time
    ensureMainAudioExists();

    // Check if there's a story-specific music playing
    const currentStoryMusic = document.getElementById("story-music");
    if (currentStoryMusic) {
      const mainAudio = document.getElementById("main-audio");
      if (mainAudio && !mainAudio.paused) {
        mainAudio.pause();
      }
      audioElement = currentStoryMusic;
      isPlaying = currentStoryMusic.paused === false;
    } else {
      // Look for main audio
      audioElement = document.getElementById("main-audio");
      isPlaying = audioElement && audioElement.paused === false;
    }

    // if we're muted, make sure any active element is paused so audio
    // doesn't start without an explicit click
    if (muted && audioElement && !audioElement.paused) {
      audioElement.pause();
      isPlaying = false;
    }
  };

  const muteAndStopAll = () => {
    muted = true;
    stopAllAudio();
    isPlaying = false;
    updateAudioButton();
  };

  const toggleAudio = async () => {
    // wait for main audio to have a valid src before trying to use it
    await mainAudioReady;
    setupAudio();
    // flip mute request
    muted = !muted;

    if (audioElement) {
      if (muted) {
        audioElement.pause();
      } else {
        audioElement.play().catch((error) => {
          console.warn(
            "[audio] Unable to play music. Check that an MP3 exists in /music and the file is accessible.",
            error,
          );
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
      const cross = btn.querySelector(".mute-cross");
      const speaker = btn.querySelector(".speaker-icon");
      // speaker always remains visible; the cross overlays when muted.
      if (speaker) speaker.style.visibility = "visible";
      if (cross) cross.style.visibility = muted ? "visible" : "hidden";
    }
  };

  const getHtml = () => {
    return `
      <header>
        <button class="header-title" id="home-link">
          <span class="header-emoji">📖</span>
          <span>Choose Your Own Adventure</span>
        </button>
        <div class="header-controls">
          <button class="header-toggle" id="header-toggle-btn" title="Hide header">
            <svg class="header-toggle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 9l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              <rect x="4" y="14" width="16" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="2"></rect>
            </svg>
          </button>
          <button class="audio-control" id="audio-btn" title="Toggle background music">
            <span class="speaker-icon">🔊</span>
            <span class="mute-cross" style="visibility:hidden"></span>
          </button>
        </div>
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

    // expose a simple getter globally so other modules (e.g. story.js) can
    // respect the user’s mute preference before auto-playing audio
    window.cyoaAudioControl = {
      isMuted: () => muted,
      muteAndStopAll,
    };

    // Setup event listeners
    document.getElementById("home-link").addEventListener("click", () => {
      muteAndStopAll();
      onNavigateHome();
    });
    const audioBtn = document.getElementById("audio-btn");
    if (audioBtn) {
      audioBtn.addEventListener("click", () => {
        toggleAudio();
      });
    }

    const headerToggleBtn = document.getElementById("header-toggle-btn");
    if (headerToggleBtn) {
      headerToggleBtn.addEventListener("click", () => {
        waitForRevealZoneExit = true;
        setHeaderHidden(true);
      });
    }

    document.addEventListener("mousemove", (event) => {
      if (waitForRevealZoneExit && event.clientY > 75) {
        waitForRevealZoneExit = false;
      }

      if (headerHidden && !waitForRevealZoneExit && event.clientY <= 75) {
        setHeaderHidden(false);
      }
    });

    // Setup audio tracking once we have the correct main audio URL
    mainAudioReady.then(() => {
      setupAudio();
      updateAudioButton();
    });
  };

  return {
    mount,
    updateAudioButton,
  };
}
