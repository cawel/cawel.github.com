"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const Engine = window.HarmonyEngine;
  const AudioEngine = window.AudioEngine;
  if (!Engine) throw new Error("HarmonyEngine failed to load.");
  if (!AudioEngine) throw new Error("AudioEngine failed to load.");

  // --- APPLICATION STATE ---
  const state = Engine.createState();

  // --- DOM ELEMENTS ---
  const DOM = {
    chordEl: document.getElementById("chordDisplay"),
    playBtn: document.getElementById("playBtn"),
    statusLine: document.getElementById("statusLine"),
    listenBtn: document.getElementById("listenBtn"),
    nextBtn: document.getElementById("nextBtn"),
    statsBtn: document.getElementById("statsBtn"),
    statsLine: document.getElementById("statsLine"),
    statsCount: document.getElementById("statsCount"),
    infoBox: document.getElementById("infoBox"),
    keyLabel: document.getElementById("keyLabel"),
    stepLabel: document.getElementById("stepLabel"),
    randomHalfDim: document.getElementById("randomHalfDim"),
    randomDim: document.getElementById("randomDim"),
    randomOptions: document.querySelector(".random-options"),
    modeRadios: [...document.querySelectorAll("input[name='mode']")],
  };

  // --- AUDIO LAYER ---
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const audio = AudioEngine.create(ctx);

  const playChordAudio = (chord) => {
    if (!chord) return;
    const notes = Engine.getChordMidiNotes(chord);
    audio.playChord(notes);
  };

  const getGenerationOptions = () => ({
    includeHalfDim: Boolean(DOM.randomHalfDim?.checked),
    includeDim: Boolean(DOM.randomDim?.checked),
  });

  // --- UI / RENDERING LAYER ---
  const renderChord = (chord) => {
    DOM.chordEl.innerHTML = Engine.renderChordHTML(chord);
  };

  const updateInfoBox = (prog) => {
    if (!prog) {
      DOM.infoBox.style.display = "none";
      return;
    }
    DOM.keyLabel.innerHTML =
      Engine.formatAccidentals(state.currentKey) +
      (state.currentMode === "maj251" ? "" : "m");
    DOM.stepLabel.textContent = prog.step;
    DOM.infoBox.style.display = "flex";
  };

  const updateRandomOptionsVisibility = () => {
    if (DOM.randomOptions)
      DOM.randomOptions.style.display =
        state.currentMode === "random" ? "flex" : "none";
  };

  const incrementCounter = () => {
    state.chordCount++;
    DOM.statsCount.textContent = state.chordCount;
  };

  const prettySpeechError = (code) =>
    ({
      "no-speech": "no speech detected",
      "audio-capture": "microphone unavailable",
      "not-allowed": "microphone permission denied",
      network: "network error",
    })[code] || code;

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

  // --- CONTROLLER / EVENT LAYER ---
  const triggerNext = () => {
    if (DOM.nextBtn.disabled) return;
    animateButton(DOM.nextBtn);
    nextChordHandler();
    DOM.nextBtn.focus();
  };

  const nextChordHandler = () => {
    const result = Engine.generateChord(state, getGenerationOptions());
    let chord, prog;
    if (result.chord) {
      // 251 progression
      chord = result.chord;
      prog = result.prog;
    } else {
      chord = result;
    }
    state.currentChord = chord;
    renderChord(chord);
    updateInfoBox(prog);
    DOM.playBtn.disabled = false;
    incrementCounter();
  };

  const animateButton = (btn) => {
    if (!btn) return;
    btn.classList.add("anticipate");
    setTimeout(() => btn.classList.remove("anticipate"), 150);
  };

  // Button events
  DOM.nextBtn.addEventListener("mousedown", () => {
    animateButton(DOM.nextBtn);
    triggerNext();
  });
  DOM.playBtn.addEventListener("mousedown", () => {
    animateButton(DOM.playBtn);
    playChordAudio(state.currentChord);
  });
  DOM.statsBtn.addEventListener("mousedown", () => {
    animateButton(DOM.statsBtn);
    DOM.statsLine.style.display =
      DOM.statsLine.offsetParent !== null ? "none" : "block";
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    switch (e.code) {
      case "Space":
        e.preventDefault();
        triggerNext();
        break;
      case "KeyP":
        if (!DOM.playBtn.disabled) {
          animateButton(DOM.playBtn);
          playChordAudio(state.currentChord);
        }
        break;
      case "KeyS":
        if (!DOM.statsBtn.disabled) {
          animateButton(DOM.statsBtn);
          DOM.statsLine.style.display =
            DOM.statsLine.offsetParent !== null ? "none" : "block";
        }
        break;
    }
  });

  // Mode change
  DOM.modeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      state.currentMode = radio.value;
      state.stepIndex = 0;
      state.currentChord = null;
      DOM.chordEl.textContent = "";
      DOM.playBtn.disabled = true;
      updateRandomOptionsVisibility();
      DOM.infoBox.style.display = "none";
    });
  });

  // --- SPEECH INTEGRATION (UI stays here, business logic in speech.js) ---
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

  // --- SPEECH hookup
  setListenAvailable();

  if (
    window.SpeechController &&
    window.SpeechController.isSupported &&
    window.SpeechController.isSupported()
  ) {
    speech = window.SpeechController.create({
      lang: "en-US",
      debug: true,
      onCommand: (cmd) => {
        if (cmd === "next") {
          triggerNext();
          return;
        }

        if (cmd === "stop-listening") {
          console.log("[speech] user said 'stop listening'");
          speech.stop(); // disables listening + updates button
          clearStatus(); // optional: clear error/status line
          return;
        }
      },
      onState: (isListening) => {
        setListeningUI(isListening);
        if (isListening) clearStatus();
      },
      onSession: (status, detail) => {
        if (status !== "error") return;

        // Don't stop listening on benign silence.
        if (detail === "no-speech") return;

        console.warn("Speech session:", detail);

        // revert button to Listen
        speech.stop();

        // status line "Error: ..."
        showError(prettySpeechError(detail));
      },
      onError: (err) => {
        // Keep this for raw logging if you want
        console.warn("Speech:", err);
      },
    });

    DOM.listenBtn.addEventListener("mousedown", () => {
      animateButton(DOM.listenBtn);
      speech.toggle();
    });
  }

  // --- INIT ---
  updateRandomOptionsVisibility();
  DOM.playBtn.disabled = true;
});
