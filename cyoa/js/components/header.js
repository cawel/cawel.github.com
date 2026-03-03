/**
 * Header component - shared across all pages
 */

export function createHeader(onNavigateHome, onAudioToggle) {
  let isPlaying = false;
  let audioElement = null;
  let muted = false; // user-requested mute state (controls red x)
  let mainAudioReady = Promise.resolve(); // resolves when main audio src is chosen

  const ensureMainAudioExists = () => {
    // Always add a main audio element so the control has something to toggle.
    // We attempt to pick a sensible MP3 file from the `/music` directory.  By
    // default the README mentions `bg-music.mp3`, but a custom filename like
    // the one currently present should be handled as well.  We prefer the
    // first candidate that actually responds with a successful HEAD request.
    if (!document.getElementById("main-audio")) {
      const a = document.createElement("audio");
      a.id = "main-audio";
      a.loop = true;
      a.style.display = "none";
      document.body.appendChild(a);

      // list of filenames we know about; update if you add more later
      const candidates = [
        "music/nakaradaalexander-woods-of-imagination-139004.mp3", // actual file present
        "music/bg-music.mp3",                                   // fallback
      ];

      // check each url asynchronously and set the first one that works
      mainAudioReady = candidates
        .reduce((p, url) => {
          return p.then((found) => {
            if (found) return found;
            return fetch(url, { method: "HEAD" })
              .then((res) => (res.ok ? url : null))
              .catch(() => null);
          });
        }, Promise.resolve(null))
        .then((chosen) => {
          a.src = chosen || candidates[0];
          return a;
        });
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
