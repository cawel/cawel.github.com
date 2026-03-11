"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const Engine = window.HarmonyEngine;
  const SynthEngine = window.SynthEngine;
  const Controller = window.ChordController;
  const Cfg = window.Config;

  if (!Engine) throw new Error(Cfg.errors.engineNotLoaded);
  if (!SynthEngine) throw new Error(Cfg.errors.synthEngineNotLoaded);
  if (!Controller) throw new Error("ChordController failed to load.");
  if (!Cfg) throw new Error("Config failed to load.");

  // --- CONTROLLER ---
  const controller = Controller.create();

  // --- DOM ELEMENTS (using config selectors) ---
  const DOM = {
    chordEl: document.querySelector(Cfg.selectors.chord),
    playBtn: document.querySelector(Cfg.selectors.playBtn),
    statusLine: document.querySelector(Cfg.selectors.statusLine),
    listenBtn: document.querySelector(Cfg.selectors.listenBtn),
    nextBtn: document.querySelector(Cfg.selectors.nextBtn),
    statsBtn: document.querySelector(Cfg.selectors.statsBtn),
    statsLine: document.querySelector(Cfg.selectors.statsLine),
    statsCount: document.querySelector(Cfg.selectors.statsCount),
    infoBox: document.querySelector(Cfg.selectors.infoBox),
    keyLabel: document.querySelector(Cfg.selectors.keyLabel),
    stepLabel: document.querySelector(Cfg.selectors.stepLabel),
    randomHalfDim: document.querySelector(Cfg.selectors.randomHalfDim),
    randomDim: document.querySelector(Cfg.selectors.randomDim),
    randomOptions: document.querySelector(Cfg.selectors.randomOptions),
    modeRadios: [...document.querySelectorAll(Cfg.selectors.modeRadios)],
  };

  // --- AUDIO LAYER ---
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const synth = SynthEngine.create(ctx);

  const playChordAudio = (chord) => {
    if (!chord) return;
    const notes = Engine.getChordMidiNotes(chord);
    synth.playChord(notes, {
      arpeggioStep: Cfg.audio.arpeggioStep,
      noteDuration: Cfg.audio.noteDuration,
    });
  };

  const getGenerationOptions = () => ({
    includeHalfDim: Boolean(DOM.randomHalfDim?.checked),
    includeDim: Boolean(DOM.randomDim?.checked),
  });

  // --- UI / RENDERING LAYER ---
  const renderChord = (chord) => {
    if (DOM.chordEl) {
      DOM.chordEl.innerHTML = Engine.renderChordHTML(chord);
    }
  };

  const updateInfoBox = (prog) => {
    if (!DOM.infoBox) return;

    if (!prog) {
      DOM.infoBox.style.display = "none";
      return;
    }

    const state = controller.getState();
    if (DOM.keyLabel) {
      DOM.keyLabel.innerHTML =
        Engine.formatAccidentals(state.currentKey) +
        (state.currentMode === "maj251" ? "" : "m");
    }
    if (DOM.stepLabel) {
      DOM.stepLabel.textContent = prog.step;
    }
    DOM.infoBox.style.display = "flex";
  };

  const updateRandomOptionsVisibility = () => {
    if (DOM.randomOptions) {
      const state = controller.getState();
      DOM.randomOptions.style.display =
        state.currentMode === "random" ? "flex" : "none";
    }
  };

  const updateStatsDisplay = () => {
    const state = controller.getState();
    if (DOM.statsCount) {
      DOM.statsCount.textContent = state.chordCount;
    }
  };

  const showError = (err) => {
    if (!DOM.statusLine) return;
    DOM.statusLine.hidden = false;
    DOM.statusLine.textContent = `Error: ${err}`;
  };

  const clearStatus = () => {
    if (!DOM.statusLine) return;
    DOM.statusLine.hidden = true;
    DOM.statusLine.textContent = "";
  };

  // --- UI STATE & RENDERING ---
  const triggerNext = () => {
    if (DOM.nextBtn?.disabled) return;

    animateButton(DOM.nextBtn);

    // Controller handles progression logic
    const result = controller.nextChord(getGenerationOptions());
    controller.incrementChordCount();

    // Extract chord and prog from result
    const chord = result.chord || result;
    const prog = result.prog || null;

    // Update UI
    renderChord(chord);
    updateInfoBox(prog);
    updateStatsDisplay();
    if (DOM.playBtn) {
      DOM.playBtn.disabled = false;
    }

    if (DOM.nextBtn) {
      DOM.nextBtn.focus();
    }
  };

  const animateButton = (btn) => {
    if (!btn) return;
    btn.classList.add("anticipate");
    setTimeout(
      () => btn.classList.remove("anticipate"),
      Cfg.ui.buttonAnimationDuration,
    );
  };

  // --- EVENT LISTENERS ---
  if (DOM.nextBtn) {
    DOM.nextBtn.addEventListener("mousedown", () => {
      animateButton(DOM.nextBtn);
      triggerNext();
    });
  }

  if (DOM.playBtn) {
    DOM.playBtn.addEventListener("mousedown", () => {
      animateButton(DOM.playBtn);
      const state = controller.getState();
      playChordAudio(state.currentChord);
    });
  }

  if (DOM.statsBtn) {
    DOM.statsBtn.addEventListener("mousedown", () => {
      animateButton(DOM.statsBtn);
      if (DOM.statsLine) {
        DOM.statsLine.style.display =
          DOM.statsLine.offsetParent !== null ? "none" : "block";
      }
    });
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    switch (e.code) {
      case "Space":
        e.preventDefault();
        triggerNext();
        break;
      case "KeyP":
        if (!DOM.playBtn?.disabled) {
          animateButton(DOM.playBtn);
          const state = controller.getState();
          playChordAudio(state.currentChord);
        }
        break;
      case "KeyS":
        if (!DOM.statsBtn?.disabled) {
          animateButton(DOM.statsBtn);
          if (DOM.statsLine) {
            DOM.statsLine.style.display =
              DOM.statsLine.offsetParent !== null ? "none" : "block";
          }
        }
        break;
    }
  });

  // Mode change
  DOM.modeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      controller.setMode(radio.value);

      // Update UI
      DOM.chordEl.textContent = "";
      if (DOM.playBtn) {
        DOM.playBtn.disabled = true;
      }
      updateRandomOptionsVisibility();
      if (DOM.infoBox) {
        DOM.infoBox.style.display = "none";
      }
    });
  });

  // --- SPEECH INTEGRATION ---
  let speech = null;

  const setButtonContent = (button, icon, label) => {
    if (!button) return;
    const iconEl = button.querySelector(".btn-icon");
    const labelEl = button.querySelector(".btn-label");
    if (iconEl) iconEl.textContent = icon;
    if (labelEl) labelEl.textContent = label;
  };

  const setListeningUI = (isListening) => {
    if (!DOM.listenBtn) return;
    DOM.listenBtn.setAttribute("aria-pressed", String(isListening));
    setButtonContent(
      DOM.listenBtn,
      "🎤",
      isListening ? "Listening…" : "Listen",
    );
  };

  const setListenAvailable = () => {
    const ok =
      window.SpeechController &&
      window.SpeechController.isSupported &&
      window.SpeechController.isSupported();
    if (!DOM.listenBtn) return;
    DOM.listenBtn.disabled = !ok;
    if (!ok) setButtonContent(DOM.listenBtn, "🎤", "Unavailable");
  };

  setListenAvailable();

  if (
    window.SpeechController &&
    window.SpeechController.isSupported &&
    window.SpeechController.isSupported()
  ) {
    speech = window.SpeechController.create({
      lang: Cfg.speech.language,
      debug: Cfg.speech.debug,
      onCommand: (cmd) => {
        if (cmd === "next") {
          triggerNext();
          return;
        }

        if (cmd === "stop-listening") {
          console.log("[speech] user said 'stop listening'");
          speech.stop();
          clearStatus();
          return;
        }
      },
      onState: (isListening) => {
        setListeningUI(isListening);
        if (isListening) clearStatus();
      },
      onSession: (status, detail) => {
        if (status !== "error") return;

        if (detail === "no-speech") return;

        console.warn("Speech session:", detail);
        speech.stop();
        showError(Cfg.getErrorMessage(detail));
      },
      onError: (err) => {
        console.warn("Speech:", err);
      },
    });

    if (DOM.listenBtn) {
      DOM.listenBtn.addEventListener("mousedown", () => {
        animateButton(DOM.listenBtn);
        speech.toggle();
      });
    }
  }

  // --- INIT ---
  updateRandomOptionsVisibility();
  if (DOM.playBtn) {
    DOM.playBtn.disabled = true;
  }
});
