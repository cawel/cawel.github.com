/**
 * main.js
 * -------
 * Application entry point and composition root for the Metronome App.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Instantiates modules and wires dependencies:
 *     • MetronomeAudio           (sound synthesis)
 *     • MetronomeEngine          (timing + scheduling)
 *     • MetronomeUI              (DOM interaction + rendering)
 *     • BeatHighlightScheduler   (UI highlight scheduling boundary)
 *
 * - Owns the Single Source of Truth (SSOT) state object.
 * - Applies side-effects in response to state transitions:
 *     • engine.configure(...)
 *     • engine.start()/stop()
 *     • audio.ensureStarted()
 *     • scheduler.invalidate()/stopAndClear()
 *     • ui rendering
 *
 * ARCHITECTURE OVERVIEW
 * ---------------------
 * UI  ──► bindControls ──► main.js ──► Engine ──► Audio
 *                            └──────► BeatHighlightScheduler ──► UI dots
 *
 * - MetronomeState.js is pure policy: reducer + clamping.
 * - main.js is the effectful orchestrator: applies audio/engine/UI effects.
 */

import { MetronomeAudio } from "./audio/MetronomeAudio.js";
import { MetronomeUI } from "./ui/MetronomeUI.js";
import { MetronomeEngine } from "./core/MetronomeEngine.js";
import { BeatHighlightScheduler } from "./ui/BeatHighlightScheduler.js";

import { bindControls } from "./ui/bindControls.js";
import { initialState, reducer, actions } from "./core/metronomeState.js";

const audio = new MetronomeAudio();
const ui = new MetronomeUI();
const engine = new MetronomeEngine(audio);

let state = { ...initialState };

const scheduler = new BeatHighlightScheduler({
  ui,
  getAudioNowSec: () => audio.currentTime,
  isRunning: () => state.running,
});

/* ---------------------------
   Render + Engine sync helpers
--------------------------- */

const render = () => {
  ui.setBpm(state.bpm);
  ui.setBeats(state.beatsPerBar);
  ui.setRunning(state.running);
};

const syncEngine = ({ resetPhase = false } = {}) => {
  engine.configure(
    { bpm: state.bpm, beatsPerBar: state.beatsPerBar },
    { resetPhase },
  );
};

// Initial render/config
render();
syncEngine({ resetPhase: true });

/* ---------------------------
   Engine beat subscription
--------------------------- */

const unsubscribeBeat = engine.subscribeBeat((event) => {
  scheduler.onBeatEvent(event);
});

/* ---------------------------
   Dispatch (pure state -> side effects)
--------------------------- */

const dispatch = (action) => {
  const prev = state;
  const next = reducer(prev, action);
  if (next === prev) return;

  state = next;
  onStateChanged(prev, next, action);
};

const onStateChanged = (prev, next, action) => {
  // BPM affects scheduling math; no phase reset.
  if (next.bpm !== prev.bpm) {
    syncEngine();
  }

  // Beats-per-bar changes affect dot mapping; reset phase for coherence.
  if (next.beatsPerBar !== prev.beatsPerBar) {
    scheduler.stopAndClear();
    syncEngine({ resetPhase: true });
  }

  // Running state changes are handled by transport commands (below),
  // but we still render whenever state changes.
  render();
};

/* ---------------------------
   Transport commands (side-effects)
--------------------------- */

const start = async () => {
  if (state.running) return;

  // Invalidate any pending UI highlights from a previous run.
  scheduler.invalidate();

  await audio.ensureStarted();

  engine.start();
  dispatch(actions.transportStart());
};

const stop = () => {
  if (!state.running) return;

  engine.stop();
  scheduler.stopAndClear();
  dispatch(actions.transportStop());
};

const toggleTransport = () => {
  if (state.running) stop();
  else start();
};

/* ---------------------------
   Bind inputs
--------------------------- */

const unbind = bindControls({
  ui,

  onBpmDelta: (delta) => dispatch(actions.bpmDelta(delta)),
  onBeatsDelta: (delta) => dispatch(actions.beatsDelta(delta)),

  onStart: start,
  onStop: stop,
  onToggle: toggleTransport,
});

/* ---------------------------
   Teardown (explicit shutdown)
--------------------------- */

export const teardown = () => {
  try {
    unbind();
  } catch {}
  try {
    unsubscribeBeat();
  } catch {}
  try {
    engine.clearBeatListeners();
  } catch {}

  try {
    stop();
  } catch {}
  try {
    audio.close();
  } catch {}
};
