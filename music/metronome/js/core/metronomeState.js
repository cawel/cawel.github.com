/**
 * metronomeState.js
 * -----------------
 * Pure state management for the Metronome App.
 *
 * PURPOSE
 * -------
 * Provides:
 * - A single initialState object
 * - A pure reducer(state, action) for deterministic state transitions
 * - Action creators for readability at call sites
 *
 * This module intentionally contains:
 * - No DOM access
 * - No Web Audio / Engine interaction
 * - No timers
 *
 * It is the "policy" layer for:
 * - BPM clamping
 * - Beats-per-bar clamping
 */

const clampInt = (n, min, max) => Math.max(min, Math.min(max, n | 0));

export const BPM_MIN = 30;
export const BPM_MAX = 280;

export const BEATS_MIN = 2;
export const BEATS_MAX = 6;

export const initialState = Object.freeze({
  bpm: 120,
  beatsPerBar: 4,
  running: false,
});

export const actions = Object.freeze({
  bpmDelta: (delta) => ({ type: "BPM_DELTA", delta }),
  beatsDelta: (delta) => ({ type: "BEATS_DELTA", delta }),

  // Transport actions are still pure state transitions.
  // Side-effects (audio.ensureStarted, engine.start/stop, scheduler invalidation)
  // belong in main.js.
  transportStart: () => ({ type: "TRANSPORT_START" }),
  transportStop: () => ({ type: "TRANSPORT_STOP" }),
});

export function reducer(state, action) {
  switch (action.type) {
    case "BPM_DELTA": {
      const bpm = clampInt(state.bpm + action.delta, BPM_MIN, BPM_MAX);
      if (bpm === state.bpm) return state;
      return { ...state, bpm };
    }

    case "BEATS_DELTA": {
      const beatsPerBar = clampInt(
        state.beatsPerBar + action.delta,
        BEATS_MIN,
        BEATS_MAX,
      );
      if (beatsPerBar === state.beatsPerBar) return state;
      return { ...state, beatsPerBar };
    }

    case "TRANSPORT_START": {
      if (state.running) return state;
      return { ...state, running: true };
    }

    case "TRANSPORT_STOP": {
      if (!state.running) return state;
      return { ...state, running: false };
    }

    default:
      return state;
  }
}
