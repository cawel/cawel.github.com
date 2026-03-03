/**
 * Header component - shared across all pages
 */

import { createAudioController } from "./audioController.js";

const CHAPTER_FONT_CANDIDATES = [
  { name: "Merriweather", stack: "'Merriweather', Georgia, serif" },
  { name: "Crimson Text", stack: "'Crimson Text', 'Times New Roman', serif" },
  { name: "Garamond", stack: "Garamond, 'Times New Roman', serif" },
  { name: "Palatino", stack: "'Palatino Linotype', Palatino, serif" },
  { name: "Book Antiqua", stack: "'Book Antiqua', Palatino, serif" },
  { name: "Baskerville", stack: "Baskerville, Georgia, serif" },
  { name: "Goudy Old Style", stack: "'Goudy Old Style', Garamond, serif" },
  { name: "Cambria", stack: "Cambria, Georgia, serif" },
  { name: "Georgia", stack: "Georgia, serif" },
  { name: "Times New Roman", stack: "'Times New Roman', serif" },
  { name: "Perpetua", stack: "Perpetua, Georgia, serif" },
  { name: "Hoefler Text", stack: "'Hoefler Text', Garamond, serif" },
  { name: "Didot", stack: "Didot, 'Times New Roman', serif" },
  { name: "Bodoni MT", stack: "'Bodoni MT', Didot, serif" },
  { name: "Cochin", stack: "Cochin, Georgia, serif" },
  { name: "Lucida Bright", stack: "'Lucida Bright', Georgia, serif" },
  { name: "Bookman", stack: "Bookman, Georgia, serif" },
  { name: "Constantia", stack: "Constantia, Georgia, serif" },
  {
    name: "Cormorant Garamond",
    stack: "'Cormorant Garamond', Garamond, serif",
  },
  { name: "Cinzel", stack: "Cinzel, 'Times New Roman', serif" },
  {
    name: "Iowan Old Style",
    stack: "'Iowan Old Style', 'Palatino Linotype', serif",
  },
  {
    name: "American Typewriter",
    stack: "'American Typewriter', Georgia, serif",
  },
  { name: "Alegreya", stack: "Alegreya, 'Times New Roman', serif" },
  {
    name: "Libre Baskerville",
    stack: "'Libre Baskerville', Baskerville, serif",
  },
  {
    name: "Sorts Mill Goudy",
    stack: "'Sorts Mill Goudy', 'Goudy Old Style', serif",
  },
  { name: "Cardo", stack: "Cardo, 'Times New Roman', serif" },
  { name: "EB Garamond", stack: "'EB Garamond', Garamond, serif" },
  { name: "Lora", stack: "Lora, Georgia, serif" },
  { name: "IM Fell English", stack: "'IM Fell English', Garamond, serif" },
  { name: "Vollkorn", stack: "Vollkorn, Georgia, serif" },
];

export function createHeader(onNavigateHome, onAudioToggle) {
  let mounted = false;
  let headerHidden = false;
  let waitForRevealZoneExit = false;
  let keydownBound = false;
  let chapterFontIndex = 0;
  let currentTheme = localStorage.getItem("cyoaTheme") || "yellow";
  const audioController = createAudioController();

  const applyTheme = (theme) => {
    const html = document.documentElement;
    if (theme === "minimalistic") {
      html.classList.add("theme-minimalistic");
    } else {
      html.classList.remove("theme-minimalistic");
    }
    currentTheme = theme;
    localStorage.setItem("cyoaTheme", theme);
    console.log(`[theme] Switched to: ${theme}`);
  };

  const cycleTheme = () => {
    const nextTheme = currentTheme === "yellow" ? "minimalistic" : "yellow";
    applyTheme(nextTheme);
  };
  const applyChapterFont = () => {
    const font = CHAPTER_FONT_CANDIDATES[chapterFontIndex];
    document.documentElement.style.setProperty(
      "--chapter-content-font",
      font.stack,
    );
    console.log(
      `[font] Chapter content font: ${font.name} (${chapterFontIndex + 1}/${CHAPTER_FONT_CANDIDATES.length})`,
    );
  };

  const cycleChapterFont = () => {
    chapterFontIndex = (chapterFontIndex + 1) % CHAPTER_FONT_CANDIDATES.length;
    applyChapterFont();
  };

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

    applyTheme(currentTheme);
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
    audioController.setControls({ button: audioBtn, trackSelect: audioTrackSelect });

    const fontBtn = document.getElementById("font-btn");
    if (fontBtn) {
      fontBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        cycleChapterFont();
      });
    }

    const themeBtn = document.getElementById("theme-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        cycleTheme();
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
          cycleTheme();
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
      applyChapterFont();
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
