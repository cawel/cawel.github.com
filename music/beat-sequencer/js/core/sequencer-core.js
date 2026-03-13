"use strict";

/**
 * Module: Sequencer Core
 *
 * Deterministic musical state machine.
 * Owns grid, notes, playhead, and tempo-as-data.
 * No timers, no AudioContext calls, no DOM dependencies.
 *
 * External code drives time by calling `stepOnce()`.
 */
export function createSequencer({
  pentatonic = ["C", "D", "E", "G", "A"],
  startOctave = 3,
  octaves = 4,
  columns = 16,
  tempo = 120,
} = {}) {
  // --------- internal state ----------
  let numCols = columns;
  let numOctaves = octaves;
  let bpm = tempo;
  let stepIndex = 0;

  const buildNotes = () => {
    const out = [];
    for (let oct = startOctave; oct < startOctave + numOctaves; oct++) {
      for (const n of pentatonic) out.push(`${n}${oct}`);
    }
    return out;
  };

  let notes = buildNotes();
  let grid = makeEmptyGrid(notes.length, numCols);

  // --------- events ----------
  const listeners = {
    step: new Set(), // ({ stepIndex, hits }) => void
    state: new Set(), // ({ stepIndex }) => void
    grid: new Set(), // ({ grid, notes, cols }) => void
  };

  const emit = (type, payload) => {
    for (const fn of listeners[type]) fn(payload);
  };

  // --------- helpers ----------
  function makeEmptyGrid(rows, cols) {
    return Array.from({ length: rows }, () => Array(cols).fill(null));
  }

  function snapshotGrid() {
    return grid.map((row) => row.slice());
  }

  function snapshotNotes() {
    return notes.slice();
  }

  // --------- public API ----------
  const on = (type, fn) => {
    listeners[type].add(fn);
    return () => listeners[type].delete(fn);
  };

  const getState = () => ({
    tempo: bpm,
    cols: numCols,
    octaves: numOctaves,
    stepIndex,
    notes: snapshotNotes(),
  });

  const getGrid = () => snapshotGrid();

  const getCell = ({ row, col }) => grid[row]?.[col] ?? null;

  const setTempo = (newTempo) => {
    bpm = newTempo;
    // deterministic: no scheduling side effects here
  };

  const setColumns = (newCols) => {
    numCols = newCols;

    // resize grid, preserving existing contents
    grid = grid.map((row) => {
      const next = row.slice(0, numCols);
      while (next.length < numCols) next.push(null);
      return next;
    });

    stepIndex = 0;

    emit("grid", {
      grid: snapshotGrid(),
      notes: snapshotNotes(),
      cols: numCols,
    });
    emit("state", { stepIndex });
  };

  const setOctaves = (newOctaves) => {
    numOctaves = newOctaves;
    notes = buildNotes();
    grid = makeEmptyGrid(notes.length, numCols);
    stepIndex = 0;

    emit("grid", {
      grid: snapshotGrid(),
      notes: snapshotNotes(),
      cols: numCols,
    });
    emit("state", { stepIndex });
  };

  const setCell = ({ row, col, soundType }) => {
    if (!grid[row]) return null;
    grid[row][col] = soundType;

    emit("grid", {
      grid: snapshotGrid(),
      notes: snapshotNotes(),
      cols: numCols,
    });
    return grid[row][col];
  };

  const clearCell = ({ row, col }) => {
    if (!grid[row]) return null;
    grid[row][col] = null;

    emit("grid", {
      grid: snapshotGrid(),
      notes: snapshotNotes(),
      cols: numCols,
    });
    return grid[row][col];
  };

  const clearGrid = () => {
    grid = makeEmptyGrid(notes.length, numCols);

    emit("grid", {
      grid: snapshotGrid(),
      notes: snapshotNotes(),
      cols: numCols,
    });
  };

  const exportPattern = () => ({
    cols: numCols,
    octaves: numOctaves,
    tempo: bpm,
    grid: snapshotGrid(),
  });

  const applyPattern = ({
    cols,
    octaves: nextOctaves,
    tempo: nextTempo,
    grid: nextGrid,
  }) => {
    if (!Number.isInteger(cols) || cols <= 0) return false;
    if (!Number.isInteger(nextOctaves) || nextOctaves <= 0) return false;
    if (
      typeof nextTempo !== "number" ||
      !Number.isFinite(nextTempo) ||
      nextTempo <= 0
    ) {
      return false;
    }
    if (!Array.isArray(nextGrid)) return false;

    numCols = cols;
    numOctaves = nextOctaves;
    bpm = nextTempo;
    notes = buildNotes();
    stepIndex = 0;

    const rebuilt = makeEmptyGrid(notes.length, numCols);
    for (let row = 0; row < rebuilt.length; row++) {
      const sourceRow = Array.isArray(nextGrid[row]) ? nextGrid[row] : null;
      if (!sourceRow) continue;

      for (let col = 0; col < numCols; col++) {
        const sourceVal = sourceRow[col] ?? null;
        rebuilt[row][col] = sourceVal == null ? null : String(sourceVal);
      }
    }

    grid = rebuilt;

    emit("grid", {
      grid: snapshotGrid(),
      notes: snapshotNotes(),
      cols: numCols,
    });
    emit("state", { stepIndex });
    return true;
  };

  /**
   * Deterministic tick: advances exactly one step.
   * Emits hits for the current column, then advances playhead.
   */
  const stepOnce = () => {
    const hits = [];
    for (let row = 0; row < notes.length; row++) {
      const soundType = grid[row][stepIndex];
      if (soundType) hits.push({ row, note: notes[row], soundType });
    }

    emit("step", { stepIndex, hits });

    stepIndex = (stepIndex + 1) % numCols;
    emit("state", { stepIndex });
  };

  const reset = () => {
    stepIndex = 0;
    emit("state", { stepIndex });
  };

  // NOTE: No initial emit here (UI should render once after subscribing)
  return {
    on,
    getState,
    getGrid,
    getCell,
    setTempo,
    setColumns,
    setOctaves,
    setCell,
    clearCell,
    clearGrid,
    exportPattern,
    applyPattern,
    stepOnce,
    reset,
  };
}
