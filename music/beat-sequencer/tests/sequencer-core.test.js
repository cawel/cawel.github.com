import test from "node:test";
import assert from "node:assert/strict";

import { createSequencer } from "../js/core/sequencer-core.js";

test("stepOnce emits deterministic step sequence with wrap-around", () => {
  const seq = createSequencer({ columns: 4 });
  const steps = [];

  seq.on("step", ({ stepIndex }) => steps.push(stepIndex));

  seq.stepOnce();
  seq.stepOnce();
  seq.stepOnce();
  seq.stepOnce();
  seq.stepOnce();

  assert.deepEqual(steps, [0, 1, 2, 3, 0]);
});

test("setColumns preserves existing cells and resets playhead", () => {
  const seq = createSequencer({ columns: 4 });

  seq.setCell({ row: 0, col: 0, soundType: "sine" });
  seq.setCell({ row: 0, col: 3, soundType: "square" });
  seq.stepOnce();

  seq.setColumns(6);

  const grid = seq.getGrid();
  const state = seq.getState();

  assert.equal(state.cols, 6);
  assert.equal(state.stepIndex, 0);
  assert.equal(grid[0][0], "sine");
  assert.equal(grid[0][3], "square");
  assert.equal(grid[0][4], null);
  assert.equal(grid[0][5], null);
});

test("setOctaves rebuilds note rows and clears grid", () => {
  const seq = createSequencer({ octaves: 4, columns: 8 });

  seq.setCell({ row: 2, col: 5, soundType: "triangle" });
  seq.setOctaves(2);

  const grid = seq.getGrid();
  const state = seq.getState();

  assert.equal(state.octaves, 2);
  assert.equal(state.notes.length, 10);
  assert.equal(grid.length, 10);
  assert.equal(grid[0].length, 8);

  const anyActive = grid.some((row) => row.some((cell) => cell !== null));
  assert.equal(anyActive, false);
});

test("setCell overrides and clearCell removes", () => {
  const seq = createSequencer({ columns: 8 });

  let next = seq.setCell({ row: 0, col: 0, soundType: "sine" });
  assert.equal(next, "sine");

  next = seq.setCell({ row: 0, col: 0, soundType: "square" });
  assert.equal(next, "square");
  assert.equal(seq.getGrid()[0][0], "square");

  next = seq.clearCell({ row: 0, col: 0 });
  assert.equal(next, null);
  assert.equal(seq.getGrid()[0][0], null);
});

test("step emits overridden sound type at playback time", () => {
  const seq = createSequencer({ columns: 4 });
  const hitTypes = [];

  // Place a sound, then override it before stepping.
  seq.setCell({ row: 0, col: 0, soundType: "sine" });
  seq.setCell({ row: 0, col: 0, soundType: "triangle" });

  seq.on("step", ({ hits }) => {
    hitTypes.push(...hits.map((h) => h.soundType));
  });

  seq.stepOnce();

  assert.deepEqual(hitTypes, ["triangle"]);
});

test("setCell/getCell/clearCell explicit APIs work as expected", () => {
  const seq = createSequencer({ columns: 4 });

  assert.equal(seq.getCell({ row: 0, col: 1 }), null);

  const setVal = seq.setCell({ row: 0, col: 1, soundType: "bell" });
  assert.equal(setVal, "bell");
  assert.equal(seq.getCell({ row: 0, col: 1 }), "bell");

  const cleared = seq.clearCell({ row: 0, col: 1 });
  assert.equal(cleared, null);
  assert.equal(seq.getCell({ row: 0, col: 1 }), null);
});
