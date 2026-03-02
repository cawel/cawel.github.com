/**
 * main.js
 * -------
 * Application entry point and orchestration layer for the Metronome App.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Wires together the three core modules:
 *     • MetronomeAudio   (sound synthesis)
 *     • MetronomeEngine  (timing + scheduling)
 *     • MetronomeUI      (DOM interaction + rendering)
 *
 * - Owns the single source of truth for all mutable application state:
 *     • BPM (tempo)
 *     • Beats per bar (2–6)
 *     • Transport state (running / stopped)
 *
 * - Handles user interactions:
 *     • BPM step controls
 *     • Beats step controls
 *     • Play / Stop buttons
 *     • Keyboard shortcut (Space = toggle)
 *
 * - Delegates beat highlight scheduling to BeatHighlightScheduler.
 *
 * ARCHITECTURE OVERVIEW
 * ---------------------
 * UI  ──► main.js ──► Engine ──► Audio
 *                 └─► BeatHighlightScheduler ──► UI highlights
 *
 * - UI emits user intent (button events).
 * - main.js mutates state (SSOT), renders UI, and configures the Engine.
 * - Engine schedules beats strictly in AudioContext time and emits beat events
 *   in that same time domain.
 * - BeatHighlightScheduler maps AudioContext timestamps to DOM update timing
 *   and handles invalidation of pending callbacks on reconfig/transport changes.
 *
 * AUDIO POLICY NOTE
 * -----------------
 * Web Audio requires a user gesture to start.
 * ensureStarted() must be called from a user-triggered event.
 */

import { MetronomeAudio } from "./audio/MetronomeAudio.js";
import { MetronomeUI } from "./ui/MetronomeUI.js";
import { MetronomeEngine } from "./core/MetronomeEngine.js";
import { BeatHighlightScheduler } from "./ui/BeatHighlightScheduler.js";

const clampInt = (n, min, max) => Math.max(min, Math.min(max, n | 0));

const BPM_MIN = 30;
const BPM_MAX = 280;

const BEATS_MIN = 2;
const BEATS_MAX = 6;

const audio = new MetronomeAudio();
const ui = new MetronomeUI();
const engine = new MetronomeEngine(audio);

// Single Source of Truth (SSOT)
const state = {
  bpm: 120,
  beatsPerBar: 4,
  running: false,
};

const scheduler = new BeatHighlightScheduler({
  ui,
  getAudioNowSec: () => audio.currentTime,
  isRunning: () => state.running,
});

/* ---------------------------
   Rendering / engine sync
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

// initial
render();
syncEngine({ resetPhase: true });

/* ---------------------------
   Beat -> DOTS ONLY
--------------------------- */

const unsubscribeBeat = engine.subscribeBeat((event) => {
  scheduler.onBeatEvent(event);
});

/* ---------------------------
   State mutations (SSOT)
--------------------------- */

const setBpm = (next) => {
  state.bpm = clampInt(next, BPM_MIN, BPM_MAX);
  syncEngine();
  render();
};

const setBeatsPerBar = (next) => {
  scheduler.stopAndClear();

  state.beatsPerBar = clampInt(next, BEATS_MIN, BEATS_MAX);

  syncEngine({ resetPhase: true });
  render();
};

const start = async () => {
  if (state.running) return;

  scheduler.invalidate();

  await audio.ensureStarted();

  engine.start();
  state.running = true;

  render();
};

const stop = () => {
  if (!state.running) return;

  engine.stop();
  state.running = false;

  scheduler.stopAndClear();
  render();
};

const toggleTransport = () => {
  if (state.running) stop();
  else start();
};

/* ---------------------------
   UI bindings
--------------------------- */

// BPM controls
ui.onMinus10(() => setBpm(state.bpm - 10));
ui.onMinus(() => setBpm(state.bpm - 1));
ui.onPlus(() => setBpm(state.bpm + 1));
ui.onPlus10(() => setBpm(state.bpm + 10));

// Beats controls
ui.onBeatsMinus(() => setBeatsPerBar(state.beatsPerBar - 1));
ui.onBeatsPlus(() => setBeatsPerBar(state.beatsPerBar + 1));

// Transport buttons
ui.onPlay(start);
ui.onStop(stop);

/* ---------------------------
   Keyboard shortcut
--------------------------- */

const onKeyDown = (e) => {
  if (e.code !== "Space") return;
  if (e.repeat) return;

  const t = e.target;
  const isTypingTarget =
    t instanceof HTMLElement &&
    (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
  if (isTypingTarget) return;

  e.preventDefault();
  toggleTransport();
};

document.addEventListener("keydown", onKeyDown);

/* ---------------------------
   Teardown (explicit shutdown)
--------------------------- */

/**
 * Clean shutdown hook (useful for tests, hot reload, or embedding).
 * Not called automatically in normal static-page usage.
 */
export const teardown = () => {
  try {
    unsubscribeBeat();
  } catch {}
  try {
    engine.clearBeatListeners();
  } catch {}

  // Ensures engine stopped + scheduler invalidated + UI cleared
  try {
    stop();
  } catch {}

  try {
    document.removeEventListener("keydown", onKeyDown);
  } catch {}
  try {
    audio.close();
  } catch {}
};
