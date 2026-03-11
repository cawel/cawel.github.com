/**
 * harmony-engine.js — Pure music theory engine.
 *
 * App-agnostic: no DOM, no audio context, no state.
 * Exports constants and pure functions for chord generation,
 * MIDI note mapping, and HTML rendering.
 */
"use strict";

(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.HarmonyEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const KEYS = {
    C: ["C", "D", "E", "F", "G", "A", "B"],
    Db: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
    D: ["D", "E", "F#", "G", "A", "B", "C#"],
    Eb: ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
    E: ["E", "F#", "G#", "A", "B", "C#", "D#"],
    F: ["F", "G", "A", "Bb", "C", "D", "E"],
    Gb: ["Gb", "Ab", "Bb", "Cb", "Db", "Eb", "F"],
    G: ["G", "A", "B", "C", "D", "E", "F#"],
    Ab: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
    A: ["A", "B", "C#", "D", "E", "F#", "G#"],
    Bb: ["Bb", "C", "D", "Eb", "F", "G", "A"],
    B: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
  };

  const CYCLE_FIFTHS = [
    "C",
    "F",
    "Bb",
    "Eb",
    "Ab",
    "Db",
    "Gb",
    "B",
    "E",
    "A",
    "D",
    "G",
  ];
  const PROGRESSIONS = {
    maj251: [
      { step: "ii", quality: "m7", deg: 1 },
      { step: "V", quality: "7", deg: 4 },
      { step: "I", quality: "maj7", deg: 0 },
    ],
    min251: [
      { step: "iiø", quality: "ø7", deg: 1 },
      { step: "V", quality: "7", deg: 4, harmonic: true },
      { step: "i", quality: "m7", deg: 0 },
    ],
  };

  const INTERVALS = {
    maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10],
    7: [0, 4, 7, 10],
    ø7: [0, 3, 6, 10],
    o7: [0, 3, 6, 9],
  };
  const SEMI = [
    "C",
    "C#",
    "D",
    "Eb",
    "E",
    "F",
    "F#",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
  ];
  const MIN_MIDI = 60;

  // Map enharmonic equivalents to SEMI chromatic scale
  const ENHARMONIC_MAP = {
    Db: "C#",
    "D#": "Eb",
    Gb: "F#",
    "G#": "Ab",
    "A#": "Bb",
    Cb: "B",
    "E#": "F",
    "B#": "C",
  };

  const normalizeRoot = (root) => {
    return ENHARMONIC_MAP[root] || root;
  };

  const pick = (arr, random = Math.random) =>
    arr[Math.floor(random() * arr.length)];

  const formatAccidentals = (value) =>
    String(value).replace(/#/g, "<sup>♯</sup>").replace(/b/g, "<sup>♭</sup>");

  const getRandomQualities = ({
    includeHalfDim = false,
    includeDim = false,
  } = {}) => {
    const qualities = ["maj7", "m7", "7"];
    if (includeHalfDim) qualities.push("ø7");
    if (includeDim) qualities.push("o7");
    return qualities;
  };

  const createState = ({ random = Math.random } = {}) => ({
    currentMode: "random",
    stepIndex: 0,
    currentKey: null,
    currentChord: null,
    chordCount: 0,
    cycleIndex: Math.floor(random() * CYCLE_FIFTHS.length),
  });

  const generateChord = (
    state,
    { includeHalfDim = false, includeDim = false, random = Math.random } = {},
  ) => {
    switch (state.currentMode) {
      case "random": {
        const key = pick(Object.keys(KEYS), random);
        return {
          root: pick(KEYS[key], random),
          quality: pick(
            getRandomQualities({ includeHalfDim, includeDim }),
            random,
          ),
        };
      }
      case "cycle": {
        state.cycleIndex = (state.cycleIndex + 1) % CYCLE_FIFTHS.length;
        const key = CYCLE_FIFTHS[state.cycleIndex];
        return { root: KEYS[key][0], quality: "7" };
      }
      case "maj251":
      case "min251": {
        if (state.stepIndex === 0)
          state.currentKey = pick(Object.keys(KEYS), random);
        const progression = {
          ...PROGRESSIONS[state.currentMode][state.stepIndex],
        };
        const chord = {
          root: KEYS[state.currentKey][progression.deg],
          quality: progression.quality,
        };

        if (progression.harmonic) {
          chord.harmonic = true;
        }

        state.stepIndex = (state.stepIndex + 1) % 3;
        return { chord, progression };
      }
      default:
        throw new Error("Unsupported mode: " + state.currentMode);
    }
  };

  const renderChordHTML = (chord) => {
    if (!chord) return "";

    return (
      formatAccidentals(chord.root) +
      (chord.quality === "maj7"
        ? "<span class='qual'>maj</span><sup>7</sup>"
        : chord.quality === "m7"
          ? "<span class='qual'>m</span><sup>7</sup>"
          : chord.quality === "ø7"
            ? "<sup>ø</sup><sup>7</sup>"
            : chord.quality === "o7"
              ? "<sup>o</sup><sup>7</sup>"
              : "<sup>7</sup>")
    );
  };

  const getChordMidiNotes = (chord, { minMidi = MIN_MIDI } = {}) => {
    if (!chord) return [];

    const normalizedRoot = normalizeRoot(chord.root);
    const index = SEMI.indexOf(normalizedRoot);
    if (index === -1) {
      throw new Error("Unsupported root for MIDI playback: " + chord.root);
    }

    const notes = INTERVALS[chord.quality]
      .map((interval) => minMidi + index + interval)
      .sort((a, b) => a - b);
    return notes;
  };

  return Object.freeze({
    KEYS,
    CYCLE_FIFTHS,
    PROGRESSIONS,
    INTERVALS,
    SEMI,
    MIN_MIDI,
    pick,
    formatAccidentals,
    getRandomQualities,
    createState,
    generateChord,
    renderChordHTML,
    getChordMidiNotes,
  });
});
