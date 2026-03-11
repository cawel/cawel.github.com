import test from "node:test";
import assert from "node:assert/strict";

import { createSequencer } from "../js/sequencer-core.js";

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

  seq.toggleCell({ row: 0, col: 0, soundType: "sine" });
  seq.toggleCell({ row: 0, col: 3, soundType: "square" });
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

  seq.toggleCell({ row: 2, col: 5, soundType: "triangle" });
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
