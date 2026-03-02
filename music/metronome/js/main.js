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
 *
 * - Runs side-effects declared by the pure reducer (metronomeState.js):
 *     • engine.configure(...)
 *     • scheduler.stopAndClear()
 *     • ui rendering
 *
 * - Implements transport commands (effectful):
 *     • audio.ensureStarted()
 *     • engine.start()/stop()
 *     • scheduler.invalidate()/stopAndClear()
 *
 * ARCHITECTURE OVERVIEW
 * ---------------------
 * UI  ──► bindControls ──► dispatch(action) ──► reducer ──► effects[]
 *                                     │
 *                                     └─► runEffects(effects)
 *
 * Engine beat events:
 * Engine ──► BeatHighlightScheduler ──► UI dots
 */

import { MetronomeAudio } from "./audio/MetronomeAudio.js";
import { MetronomeUI } from "./ui/MetronomeUI.js";
import { MetronomeEngine } from "./core/MetronomeEngine.js";
import { TapTempoTracker } from "./core/TapTempoTracker.js";
import { BeatHighlightScheduler } from "./ui/BeatHighlightScheduler.js";
import { bindControls } from "./ui/bindControls.js";

import {
  initialState,
  reducer,
  actions,
  BPM_MIN,
  BPM_MAX,
} from "./core/metronomeState.js";

const audio = new MetronomeAudio();
const ui = new MetronomeUI();
const engine = new MetronomeEngine(audio);
const tapTempoTracker = new TapTempoTracker({
  minBpm: BPM_MIN,
  maxBpm: BPM_MAX,
});

let state = { ...initialState };

const scheduler = new BeatHighlightScheduler({
  ui,
  getAudioNowSec: () => audio.currentTime,
  isRunning: () => state.running,
});

/* ---------------------------
   Render + Engine sync
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
   Effects runner
--------------------------- */

const runEffects = (effects) => {
  for (const effect of effects) {
    switch (effect.type) {
      case "ENGINE_CONFIG":
        syncEngine({ resetPhase: effect.resetPhase });
        break;

      case "SCHEDULER_CLEAR":
        scheduler.stopAndClear();
        break;

      case "RENDER":
        render();
        break;

      default:
        // Unknown effect types are ignored by design.
        break;
    }
  }
};

/* ---------------------------
   Dispatch (pure -> effects)
--------------------------- */

const dispatch = (action) => {
  const result = reducer(state, action);
  if (result.state === state && result.effects.length === 0) return;

  state = result.state;
  runEffects(result.effects);
};

/* ---------------------------
   Transport commands (side-effects)
--------------------------- */

const start = async () => {
  if (state.running) return;

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

const onTapTempo = () => {
  const tappedBpm = tapTempoTracker.tap(performance.now());
  if (tappedBpm === null) return;
  if (tappedBpm === state.bpm) return;

  dispatch(actions.bpmDelta(tappedBpm - state.bpm));
};

/* ---------------------------
   Bind inputs
--------------------------- */

const unbind = bindControls({
  ui,
  isRunning: () => state.running,

  onBpmDelta: (delta) => dispatch(actions.bpmDelta(delta)),
  onBeatsDelta: (delta) => dispatch(actions.beatsDelta(delta)),

  onStart: start,
  onStop: stop,
  onToggle: toggleTransport,
  onTapTempo,
});

/* ---------------------------
   Teardown
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
