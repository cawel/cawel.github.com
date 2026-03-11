"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const HarmonyEngine = require("../harmony-engine.js");

const sequenceRandom = (...values) => {
  let index = 0;
  return () => {
    const value = values[index];
    index += 1;
    return value;
  };
};

test("getRandomQualities defaults to the three core seventh-chord qualities", () => {
  assert.deepEqual(HarmonyEngine.getRandomQualities(), ["maj7", "m7", "7"]);
});

test("getRandomQualities includes optional diminished colors when enabled", () => {
  assert.deepEqual(
    HarmonyEngine.getRandomQualities({
      includeHalfDim: true,
      includeDim: true,
    }),
    ["maj7", "m7", "7", "ø7", "o7"],
  );
});

test("random mode selects from the configured keys and enabled qualities", () => {
  const state = HarmonyEngine.createState({ random: () => 0 });
  state.currentMode = "random";

  const chord = HarmonyEngine.generateChord(state, {
    includeHalfDim: true,
    includeDim: false,
    random: sequenceRandom(0.0, 0.15, 0.8),
  });

  assert.deepEqual(chord, { root: "D", quality: "ø7" });
});

test("cycle mode advances through the jazz-standard descending fifths order", () => {
  const state = HarmonyEngine.createState({ random: () => 0 });
  state.currentMode = "cycle";
  state.cycleIndex = 0;

  const first = HarmonyEngine.generateChord(state);
  const second = HarmonyEngine.generateChord(state);

  assert.deepEqual(first, { root: "F", quality: "7" });
  assert.deepEqual(second, { root: "Bb", quality: "7" });
});

test("major ii-V-I keeps one key for the full three-chord cycle and resets step index", () => {
  const state = HarmonyEngine.createState({ random: () => 0 });
  state.currentMode = "maj251";

  const ii = HarmonyEngine.generateChord(state, { random: () => 0 });
  const v = HarmonyEngine.generateChord(state, { random: () => 0.99 });
  const i = HarmonyEngine.generateChord(state, { random: () => 0.42 });

  assert.equal(state.currentKey, "C");
  assert.deepEqual(ii, {
    chord: { root: "D", quality: "m7" },
    prog: { step: "ii", quality: "m7", deg: 1 },
  });
  assert.deepEqual(v, {
    chord: { root: "G", quality: "7" },
    prog: { step: "V", quality: "7", deg: 4 },
  });
  assert.deepEqual(i, {
    chord: { root: "C", quality: "maj7" },
    prog: { step: "I", quality: "maj7", deg: 0 },
  });
  assert.equal(state.stepIndex, 0);
});

test("minor iiø-V-i marks the dominant chord as harmonic", () => {
  const state = HarmonyEngine.createState({ random: () => 0 });
  state.currentMode = "min251";

  HarmonyEngine.generateChord(state, { random: () => 0 });
  const dominant = HarmonyEngine.generateChord(state, { random: () => 0.9 });

  assert.deepEqual(dominant, {
    chord: { root: "G", quality: "7", harmonic: true },
    prog: { step: "V", quality: "7", deg: 4, harmonic: true },
  });
});

test("renderChordHTML formats accidentals and quality markup for display", () => {
  assert.equal(
    HarmonyEngine.renderChordHTML({ root: "F#", quality: "maj7" }),
    "F<sup>♯</sup><span class='qual'>maj</span><sup>7</sup>",
  );
});

test("getChordMidiNotes sharpens the third on harmonic minor dominants", () => {
  assert.deepEqual(
    HarmonyEngine.getChordMidiNotes({
      root: "G",
      quality: "7",
      harmonic: true,
    }),
    [67, 72, 74, 77],
  );
});

test("getChordMidiNotes handles enharmonic equivalents (Gb = F#)", () => {
  const gbMidi = HarmonyEngine.getChordMidiNotes({
    root: "Gb",
    quality: "maj7",
  });
  const fSharpMidi = HarmonyEngine.getChordMidiNotes({
    root: "F#",
    quality: "maj7",
  });
  assert.deepEqual(gbMidi, fSharpMidi);
});
