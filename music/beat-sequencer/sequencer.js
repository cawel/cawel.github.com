"use strict";

/**
 * Sequencer business logic:
 * - grid model (rows x cols, each cell is null or soundType string)
 * - notes list based on pentatonic + octave range
 * - playhead stepping + timing
 *
 * It emits "events" (callbacks) so UI can render and audio can play.
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
  let currentStep = 0;
  let playing = false;
  let timerId = null;

  const buildNotes = () => {
    const notes = [];
    for (let oct = startOctave; oct < startOctave + numOctaves; oct++) {
      for (const n of pentatonic) notes.push(`${n}${oct}`);
    }
    return notes;
  };

  let notes = buildNotes();
  let grid = makeEmptyGrid(notes.length, numCols);

  // --------- events ----------
  const listeners = {
    step: new Set(),      // ({ stepIndex, hits }) => void
    state: new Set(),     // ({ playing, stepIndex }) => void
    grid: new Set(),      // ({ grid, notes, cols }) => void
  };

  const emit = (type, payload) => {
    for (const fn of listeners[type]) fn(payload);
  };

  // --------- helpers ----------
  function makeEmptyGrid(rows, cols) {
    return Array.from({ length: rows }, () => Array(cols).fill(null));
  }

  function stepMs() {
    // 16th note grid = quarter note / 4
    return ((60 / bpm) / 4) * 1000;
  }

  // --------- public API ----------
  const getState = () => ({
    playing,
    stepIndex: currentStep,
    tempo: bpm,
    cols: numCols,
    octaves: numOctaves,
    notes: [...notes],
  });

  const getGrid = () => grid.map((row) => [...row]); // snapshot copy for UI safety

  const on = (type, fn) => {
    listeners[type].add(fn);
    return () => listeners[type].delete(fn);
  };

  const setTempo = (newTempo) => {
    bpm = newTempo;
    if (playing) {
      stop();
      start(); // restart with new interval
    }
  };

  const setColumns = (newCols) => {
    numCols = newCols;

    // resize existing grid, preserving contents as much as possible
    grid = grid.map((row) => {
      const next = row.slice(0, numCols);
      while (next.length < numCols) next.push(null);
      return next;
    });

    currentStep = 0;
    emit("grid", { grid: getGrid(), notes: [...notes], cols: numCols });
    emit("state", { playing, stepIndex: currentStep });
  };

  const setOctaves = (newOctaves) => {
    numOctaves = newOctaves;
    notes = buildNotes();
    grid = makeEmptyGrid(notes.length, numCols);
    currentStep = 0;
    emit("grid", { grid: getGrid(), notes: [...notes], cols: numCols });
    emit("state", { playing, stepIndex: currentStep });
  };

  const toggleCell = ({ row, col, soundType }) => {
    const prev = grid[row]?.[col] ?? null;
    grid[row][col] = prev ? null : soundType;
    emit("grid", { grid: getGrid(), notes: [...notes], cols: numCols });
    return grid[row][col];
  };

  const stepOnce = () => {
    // collect hits for this column (business result)
    const hits = [];
    for (let row = 0; row < notes.length; row++) {
      const soundType = grid[row][currentStep];
      if (soundType) hits.push({ row, note: notes[row], soundType });
    }

    emit("step", { stepIndex: currentStep, hits });
    currentStep = (currentStep + 1) % numCols;
    emit("state", { playing, stepIndex: currentStep });
  };

  const start = () => {
    if (playing) return;
    playing = true;
    emit("state", { playing, stepIndex: currentStep });

    timerId = window.setInterval(stepOnce, stepMs());
  };

  const stop = () => {
    if (!playing) return;
    playing = false;
    window.clearInterval(timerId);
    timerId = null;
    currentStep = 0;
    emit("state", { playing, stepIndex: currentStep });
  };

  const togglePlay = () => (playing ? stop() : start());

  // initial emit so UI can render once
  emit("grid", { grid: getGrid(), notes: [...notes], cols: numCols });
  emit("state", { playing, stepIndex: currentStep });

  return {
    // events
    on,

    // state snapshots
    getState,
    getGrid,

    // mutators
    setTempo,
    setColumns,
    setOctaves,
    toggleCell,

    // transport
    start,
    stop,
    togglePlay,
  };
}

