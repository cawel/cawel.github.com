/**
 * metronomeState.js
 * -----------------
 * Pure state + effect declaration for the Metronome App.
 *
 * PURPOSE
 * -------
 * Provides:
 * - A single initialState object
 * - A pure reducer(state, action) that returns:
 *     { state: nextState, effects: Effect[] }
 * - Action creators for readability at call sites
 *
 * IMPORTANT
 * ---------
 * Effects are *declarations only*. This module never performs side-effects.
 * main.js is the sole effects runner (engine/audio/ui/scheduler interactions).
 *
 * EFFECT MODEL
 * ------------
 * The reducer may declare effects such as:
 * - ENGINE_CONFIG      { resetPhase: boolean }
 * - SCHEDULER_CLEAR    (stop and clear highlights, invalidate pending)
 * - RENDER             (render current state into UI)
 *
 * Transport actions (start/stop) remain pure state changes here; the actual
 * engine/audio start/stop is performed by main.js transport commands.
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

  transportStart: () => ({ type: "TRANSPORT_START" }),
  transportStop: () => ({ type: "TRANSPORT_STOP" }),
});

// Effect helpers (internal)
const fx = Object.freeze({
  render: () => ({ type: "RENDER" }),
  engineConfig: ({ resetPhase }) => ({
    type: "ENGINE_CONFIG",
    resetPhase: !!resetPhase,
  }),
  schedulerClear: () => ({ type: "SCHEDULER_CLEAR" }),
});

export function reducer(state, action) {
  switch (action.type) {
    case "BPM_DELTA": {
      const bpm = clampInt(state.bpm + action.delta, BPM_MIN, BPM_MAX);
      if (bpm === state.bpm) return { state, effects: [] };

      const next = { ...state, bpm };

      // BPM affects scheduling math; no phase reset.
      return {
        state: next,
        effects: [fx.engineConfig({ resetPhase: false }), fx.render()],
      };
    }

    case "BEATS_DELTA": {
      const beatsPerBar = clampInt(
        state.beatsPerBar + action.delta,
        BEATS_MIN,
        BEATS_MAX,
      );
      if (beatsPerBar === state.beatsPerBar) return { state, effects: [] };

      const next = { ...state, beatsPerBar };

      // Beats-per-bar changes affect dot mapping; clear highlights and reset phase.
      return {
        state: next,
        effects: [
          fx.schedulerClear(),
          fx.engineConfig({ resetPhase: true }),
          fx.render(),
        ],
      };
    }

    case "TRANSPORT_START": {
      if (state.running) return { state, effects: [] };
      const next = { ...state, running: true };
      return { state: next, effects: [fx.render()] };
    }

    case "TRANSPORT_STOP": {
      if (!state.running) return { state, effects: [] };
      const next = { ...state, running: false };
      return { state: next, effects: [fx.render()] };
    }

    default:
      return { state, effects: [] };
  }
}
