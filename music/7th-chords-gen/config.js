(function (root) {
  "use strict";

  const Config = {
    // DOM selectors
    selectors: {
      chord: "#chordDisplay",
      playBtn: "#playBtn",
      statusLine: "#statusLine",
      listenBtn: "#listenBtn",
      nextBtn: "#nextBtn",
      statsBtn: "#statsBtn",
      statsLine: "#statsLine",
      statsCount: "#statsCount",
      infoBox: "#infoBox",
      keyLabel: "#keyLabel",
      stepLabel: "#stepLabel",
      randomHalfDim: "#randomHalfDim",
      randomDim: "#randomDim",
      randomOptions: ".random-options",
      modeRadios: "input[name='mode']",
    },

    // Audio synthesis parameters
    audio: {
      arpeggioStep: 0.3,
      noteDuration: 0.5,
    },

    // UI animation timings (milliseconds)
    ui: {
      buttonAnimationDuration: 150,
    },

    // Speech recognition
    speech: {
      language: "en-US",
      debug: true,
    },

    // Error messages
    errors: {
      engineNotLoaded: "HarmonyEngine failed to load.",
      audioEngineNotLoaded: "AudioEngine failed to load.",
      "no-speech": "no speech detected",
      "audio-capture": "microphone unavailable",
      "not-allowed": "microphone permission denied",
      network: "network error",
    },

    // Get localized error message
    getErrorMessage(code) {
      return this.errors[code] || code;
    },
  };

  root.Config = Object.freeze(Config);
})(typeof globalThis !== "undefined" ? globalThis : this);
