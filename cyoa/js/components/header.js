/**
 * Header component - shared across all pages
 */

import { createAudioController } from "./audioController.js";
import { createFontController } from "./fontController.js";
import { createThemeController } from "./themeController.js";

export function createHeader(onNavigateHome) {
  let mounted = false;
  let headerHidden = false;
  let waitForRevealZoneExit = false;
  let keydownBound = false;
  const audioController = createAudioController();
  const fontController = createFontController();
  const themeController = createThemeController();

  const setHeaderHidden = (hidden) => {
    const header = document.querySelector("header");
    if (!header) return;

    headerHidden = hidden;
    header.classList.toggle("header-collapsed", hidden);
  };

  const hideHeader = () => {
    waitForRevealZoneExit = true;
    setHeaderHidden(true);
  };

  const syncState = () => {
    audioController.syncState();
  };

  const updateAudioButton = () => {
    audioController.updateAudioButton();
  };

  const getHtml = () => {
    return `
      <header>
        <button class="header-title" id="home-link">
          <span class="header-emoji">📖</span>
          <span>Choose Your Own Adventure</span>
        </button>
        <div class="header-controls">
          <select class="audio-track-select" id="audio-track-select" title="Select music track"></select>
          <button class="audio-control" id="audio-btn" title="Toggle background music">
            <span class="speaker-wrap">
              <span class="speaker-icon">🔊</span>
              <span class="mute-cross" style="visibility:hidden"></span>
            </span>
          </button>
          <button class="font-control" id="font-btn" title="Change chapter font">
            <span class="font-style-icon" aria-hidden="true">A</span>
          </button>
          <button class="theme-control" id="theme-btn" title="Change theme">
            <span class="theme-icon" aria-hidden="true">🎨</span>
          </button>
          <button class="admin-control" id="admin-btn" title="Open admin">
            <span class="admin-icon" aria-hidden="true">⚙️</span>
          </button>
          <button class="header-toggle" id="header-toggle-btn" title="Hide header">
            <svg class="header-toggle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 9l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              <rect x="4" y="14" width="16" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="2"></rect>
            </svg>
          </button>
        </div>
      </header>
    `;
  };

  const mount = () => {
    if (mounted) {
      syncState();
      return;
    }

    const header =
      document.querySelector("header") ||
      (() => {
        const el = document.createElement("header");
        document.body.insertBefore(el, document.body.firstChild);
        return el;
      })();

    header.innerHTML = getHtml();

    themeController.initialize();
    // expose a simple getter globally so other modules (e.g. story.js) can
    // respect the user’s mute preference before auto-playing audio
    window.cyoaAudioControl = {
      isMuted: audioController.isMuted,
      muteAndStopAll: audioController.muteAndStopAll,
      stopAudioWithoutMuting: audioController.stopAudioWithoutMuting,
    };

    // Setup event listeners
    document.getElementById("home-link").addEventListener("click", () => {
      onNavigateHome();
    });

    const audioBtn = document.getElementById("audio-btn");
    const audioTrackSelect = document.getElementById("audio-track-select");
    audioController.setControls({
      button: audioBtn,
      trackSelect: audioTrackSelect,
    });

    const fontBtn = document.getElementById("font-btn");
    fontController.setControl(fontBtn);

    const themeBtn = document.getElementById("theme-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        themeController.cycleTheme();
      });
    }

    const adminBtn = document.getElementById("admin-btn");
    if (adminBtn) {
      adminBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        window.location.hash = "#/admin";
      });
    }

    const headerToggleBtn = document.getElementById("header-toggle-btn");
    if (headerToggleBtn) {
      headerToggleBtn.addEventListener("click", () => {
        hideHeader();
      });
    }

    if (!keydownBound) {
      document.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        if (key !== "f" && key !== "m" && key !== "t") return;
        if (event.metaKey || event.ctrlKey || event.altKey) return;

        const target = event.target;
        const tagName =
          target && target.tagName ? target.tagName.toLowerCase() : "";
        const isEditable =
          tagName === "input" ||
          tagName === "textarea" ||
          (target && target.isContentEditable);

        if (isEditable) return;

        event.preventDefault();
        if (key === "f") {
          if (headerHidden) {
            waitForRevealZoneExit = false;
            setHeaderHidden(false);
          } else {
            hideHeader();
          }
          return;
        }

        if (key === "t") {
          themeController.cycleTheme();
          return;
        }

        audioController.toggleAudio();
      });

      keydownBound = true;
    }

    document.addEventListener("mousemove", (event) => {
      if (waitForRevealZoneExit && event.clientY > 75) {
        waitForRevealZoneExit = false;
      }

      if (headerHidden && !waitForRevealZoneExit && event.clientY <= 75) {
        setHeaderHidden(false);
      }
    });

    audioController.initialize();

    // Setup audio tracking once we have the correct main audio URL
    audioController.whenReady().then(() => {
      fontController.initialize();
      syncState();
    });

    mounted = true;
  };

  return {
    mount,
    syncState,
    updateAudioButton,
  };
}
