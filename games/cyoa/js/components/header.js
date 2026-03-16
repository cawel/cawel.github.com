/**
 * Header component - shared across all pages
 */

import { createAudioController } from "./audioController.js";
import { createFontController } from "./fontController.js";
import { createThemeController } from "./themeController.js";
import { setAppState } from "../state/appStore.js";

export function createHeader(onNavigateHome) {
  let mounted = false;
  let headerHidden = false;
  let mobileMenuOpen = false;
  let waitForRevealZoneExit = false;
  let keydownBound = false;
  const audioController = createAudioController();
  const fontController = createFontController();
  const themeController = createThemeController();

  const setMobileMenuOpen = (open) => {
    const header = document.querySelector("header");
    const menuButton = document.getElementById("mobile-menu-btn");
    if (!header || !menuButton) return;

    mobileMenuOpen = open;
    header.classList.toggle("mobile-menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const setHeaderHidden = (hidden) => {
    const header = document.querySelector("header");
    if (!header) return;

    headerHidden = hidden;
    header.classList.toggle("header-collapsed", hidden);
    setAppState({
      header: {
        hidden,
      },
    });
  };

  const hideHeader = () => {
    waitForRevealZoneExit = true;
    setHeaderHidden(true);
  };

  const refreshAudioState = () => {
    audioController.refreshAudioState();
  };

  const formatThemeLabel = (themeKey) => {
    return themeKey
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
      .join(" ");
  };

  const updateAudioButton = () => {
    audioController.updateAudioButton();
  };

  const getHtml = () => {
    return `
      <button class="header-title" id="home-link">
        <span class="header-emoji">📖</span>
        <span class="header-title-full">Choose Your Own Adventure</span>
        <span class="header-title-short">CYOA</span>
      </button>
      <button class="mobile-menu-btn" id="mobile-menu-btn" title="Open menu" aria-label="Open menu" aria-expanded="false">
        <span class="mobile-menu-icon" aria-hidden="true">☰</span>
      </button>
      <div class="header-controls">
        <div class="audio-controls-row">
          <button class="audio-control" id="audio-btn" title="Toggle background music">
            <span class="speaker-wrap">
              <span class="speaker-icon">🔊</span>
              <span class="mute-cross" style="visibility:hidden"></span>
            </span>
          </button>
          <select class="audio-track-select" id="audio-track-select" title="Select music track"></select>
        </div>
        <div class="theme-controls-row">
          <button class="theme-control" id="theme-btn" title="Change theme">
            <span class="theme-icon" aria-hidden="true">🎨</span>
          </button>
          <select class="audio-track-select theme-select" id="theme-select" title="Select theme"></select>
        </div>
        <div class="font-controls-row">
          <button class="font-control" id="font-btn" title="Change chapter font">
            <span class="font-style-icon" aria-hidden="true">A</span>
          </button>
          <select class="audio-track-select font-select" id="font-select" title="Select font"></select>
        </div>
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
    `;
  };

  const ensureHeaderElement = () => {
    return (
      document.querySelector("header") ||
      (() => {
        const el = document.createElement("header");
        document.body.insertBefore(el, document.body.firstChild);
        return el;
      })()
    );
  };

  const exposeAudioControl = () => {
    window.cyoaAudioControl = {
      isMuted: audioController.isMuted,
      muteAndStopAll: audioController.muteAndStopAll,
      stopAudioWithoutMuting: audioController.stopAudioWithoutMuting,
    };
  };

  const bindHeaderControls = () => {
    document.getElementById("home-link").addEventListener("click", () => {
      closeMobileMenu();
      onNavigateHome();
    });

    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener("click", () => {
        setMobileMenuOpen(!mobileMenuOpen);
      });
    }

    const audioBtn = document.getElementById("audio-btn");
    const audioTrackSelect = document.getElementById("audio-track-select");
    audioController.setControls({
      button: audioBtn,
      trackSelect: audioTrackSelect,
    });

    const fontBtn = document.getElementById("font-btn");
    const fontSelect = document.getElementById("font-select");
    if (fontSelect) {
      const fontOptions = fontController.getAvailableFonts();
      fontSelect.innerHTML = fontOptions
        .map(({ index, label }) => `<option value="${index}">${label}</option>`)
        .join("");
      fontSelect.value = String(fontController.getCurrentFontIndex());

      fontSelect.addEventListener("change", (event) => {
        fontController.applyFontByIndex(event.target.value);
      });
    }

    if (fontBtn) {
      fontBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (window.innerWidth <= 768 && fontSelect) {
          fontController.applyFontByIndex(fontSelect.value);
          return;
        }

        fontController.cycleChapterFont();
        if (fontSelect) {
          fontSelect.value = String(fontController.getCurrentFontIndex());
        }
      });
    }

    const themeBtn = document.getElementById("theme-btn");
    const themeSelect = document.getElementById("theme-select");
    if (themeSelect) {
      const themeOptions = themeController.getAvailableThemes();
      themeSelect.innerHTML = themeOptions
        .map(
          (themeKey) =>
            `<option value="${themeKey}">${formatThemeLabel(themeKey)}</option>`,
        )
        .join("");
      themeSelect.value = themeController.getCurrentTheme();

      themeSelect.addEventListener("change", (event) => {
        themeController.applyTheme(event.target.value);
      });
    }

    if (themeBtn) {
      themeBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (window.innerWidth <= 768 && themeSelect) {
          themeController.applyTheme(themeSelect.value);
          return;
        }

        themeController.cycleTheme();
        if (themeSelect) {
          themeSelect.value = themeController.getCurrentTheme();
        }
      });
    }

    const adminBtn = document.getElementById("admin-btn");
    if (adminBtn) {
      adminBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeMobileMenu();
        window.location.hash = "#/admin";
      });
    }

    const headerToggleBtn = document.getElementById("header-toggle-btn");
    if (headerToggleBtn) {
      headerToggleBtn.addEventListener("click", () => {
        closeMobileMenu();
        hideHeader();
      });
    }

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        closeMobileMenu();
      }
    });
  };

  const bindKeyboardShortcuts = () => {
    if (keydownBound) return;

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
  };

  const bindHeaderRevealZone = () => {
    const handleRevealZone = (clientY) => {
      if (typeof clientY !== "number") return;

      if (waitForRevealZoneExit && clientY > 75) {
        waitForRevealZoneExit = false;
      }

      if (headerHidden && !waitForRevealZoneExit && clientY <= 75) {
        setHeaderHidden(false);
      }
    };

    document.addEventListener("mousemove", (event) => {
      handleRevealZone(event.clientY);
    });

    document.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.touches && event.touches[0];
        if (!touch) return;
        handleRevealZone(touch.clientY);
      },
      { passive: true },
    );

    document.addEventListener(
      "touchmove",
      (event) => {
        const touch = event.touches && event.touches[0];
        if (!touch) return;
        handleRevealZone(touch.clientY);
      },
      { passive: true },
    );
  };

  const scheduleNonCriticalWork = (work) => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => {
        if (!mounted) return;
        work();
      });
      return;
    }

    setTimeout(() => {
      if (!mounted) return;
      work();
    }, 0);
  };

  const mount = () => {
    if (mounted) return;

    const header = ensureHeaderElement();

    header.innerHTML = getHtml();

    themeController.initialize();
    exposeAudioControl();
    bindHeaderControls();

    audioController.initialize();

    // Defer keyboard and edge-reveal listeners until idle so first route paint is less contested.
    scheduleNonCriticalWork(() => {
      bindKeyboardShortcuts();
      bindHeaderRevealZone();
    });

    // Setup audio tracking once we have the correct main audio URL
    audioController.whenReady().then(() => {
      fontController.initialize();
      refreshAudioState();
    });

    mounted = true;
  };

  return {
    mount,
    updateAudioButton,
  };
}
