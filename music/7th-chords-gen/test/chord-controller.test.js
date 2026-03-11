"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const ChordController = require("../js/chord-controller.js");

test("ChordController creates successfully", () => {
  const controller = ChordController.create();
  assert.ok(controller);
  assert.ok(controller.getState);
  assert.ok(controller.nextChord);
  assert.ok(controller.setMode);
});

test("initial state has random mode and no chord", () => {
  const controller = ChordController.create();
  const state = controller.getState();

  assert.equal(state.currentMode, "random");
  assert.equal(state.currentChord, null);
  assert.equal(state.chordCount, 0);
  assert.equal(state.currentKey, null);
});

test("nextChord generates a random chord in random mode", () => {
  const controller = ChordController.create();
  const result = controller.nextChord({
    includeHalfDim: false,
    includeDim: false,
  });

  assert.ok(result.chord);
  assert.ok(result.chord.root);
  assert.ok(result.chord.quality);

  const state = controller.getState();
  assert.deepEqual(state.currentChord, result.chord);
});

test("setMode changes the mode and clears progression state", () => {
  const controller = ChordController.create();

  // Generate a random chord first
  controller.nextChord();
  let state = controller.getState();
  assert.ok(state.currentChord);

  // Switch to maj251
  controller.setMode("maj251");
  state = controller.getState();

  assert.equal(state.currentMode, "maj251");
  assert.equal(state.currentChord, null);
  assert.equal(state.stepIndex, 0);
  assert.equal(state.currentKey, null);
});

test("maj251 mode maintains the same key for all three chords", () => {
  const controller = ChordController.create();
  controller.setMode("maj251");

  const ii = controller.nextChord();
  const v = controller.nextChord();
  const i = controller.nextChord();

  const state = controller.getState();

  // All three should share the same key
  assert.ok(state.currentKey);
  assert.equal(ii.progression.step, "ii");
  assert.equal(v.progression.step, "V");
  assert.equal(i.progression.step, "I");

  // After the third chord, stepIndex should be 0 for next cycle
  assert.equal(state.stepIndex, 0);
});

test("min251 mode marks the dominant as harmonic", () => {
  const controller = ChordController.create();
  controller.setMode("min251");

  const iiø = controller.nextChord();
  const v = controller.nextChord();

  assert.equal(iiø.progression.step, "iiø");
  assert.ok(v.chord.harmonic);
  assert.equal(v.progression.harmonic, true);
});

test("nextChord auto-increments the chord count", () => {
  const controller = ChordController.create();

  let state = controller.getState();
  assert.equal(state.chordCount, 0);

  controller.nextChord();
  state = controller.getState();
  assert.equal(state.chordCount, 1);

  controller.nextChord();
  state = controller.getState();
  assert.equal(state.chordCount, 2);
});

test("getState returns a frozen snapshot", () => {
  const controller = ChordController.create();
  const state = controller.getState();

  assert.throws(() => {
    state.chordCount = 999;
  }, TypeError);

  assert.throws(() => {
    state.currentMode = "invalid";
  }, TypeError);
});

test("cycle mode advances through the fifths", () => {
  const controller = ChordController.create();
  controller.setMode("cycle");

  // Get the first three chords in sequence
  const first = controller.nextChord();
  const second = controller.nextChord();
  const third = controller.nextChord();

  // All should be 7th chords
  assert.equal(first.chord.quality, "7");
  assert.equal(second.chord.quality, "7");
  assert.equal(third.chord.quality, "7");

  // The harmony engine cycles through a fixed sequence: C, F, Bb, Eb, Ab, Db, Gb, B, E, A, D, G
  // Verify that the second is one step ahead of the first
  const cycleOfFifths = [
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

  const firstIdx = cycleOfFifths.indexOf(first.chord.root);
  const secondIdx = cycleOfFifths.indexOf(second.chord.root);
  const thirdIdx = cycleOfFifths.indexOf(third.chord.root);

  // Each should be one step ahead (wrapping around)
  assert.equal((firstIdx + 1) % 12, secondIdx);
  assert.equal((secondIdx + 1) % 12, thirdIdx);
});

test("reset clears all state to initial defaults", () => {
  const controller = ChordController.create();

  // Modify state
  controller.setMode("maj251");
  controller.nextChord();
  controller.nextChord();

  let state = controller.getState();
  assert.equal(state.currentMode, "maj251");
  assert.equal(state.chordCount, 2);
  assert.ok(state.currentChord);

  // Reset
  controller.reset();

  state = controller.getState();
  assert.equal(state.currentMode, "random");
  assert.equal(state.chordCount, 0);
  assert.equal(state.currentChord, null);
});
