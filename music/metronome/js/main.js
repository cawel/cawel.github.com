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
 * - Owns the single source of truth for application state:
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
 * - Synchronizes UI highlights with scheduled audio beats.
 *
 * ARCHITECTURE OVERVIEW
 * ---------------------
 * UI  ──► main.js ──► Engine ──► Audio
 *
 * - UI emits user intent (button events).
 * - Engine schedules beats using high-precision lookahead timing.
 * - Audio produces deterministic woodblock ticks.
 * - main.js coordinates state transitions and keeps module boundaries strict:
 *     • UI renders state
 *     • Engine executes timing based on configuration
 *     • Audio synthesizes sound
 *
 * UI SYNCHRONIZATION MODEL
 * ------------------------
 * The Engine schedules beats ahead of time (AudioContext time).
 * main.js converts scheduled beat times into performance.now()-based callbacks
 * for DOM updates.
 *
 * To prevent race conditions when changing BPM/Beats or stopping/restarting,
 * a UI "epoch" counter invalidates stale scheduled UI callbacks.
 *
 * KEYBOARD SHORTCUT
 * -----------------
 * Space bar toggles playback.
 * - If stopped → starts the metronome
 * - If running → stops the metronome
 * - Prevents default scroll behavior
 * - Ignores input/textarea/contenteditable targets
 *
 * AUDIO POLICY NOTE
 * -----------------
 * Web Audio requires a user gesture to start.
 * ensureStarted() must be called from a user-triggered event. For keyboard
 * activation, start() is invoked directly (not via .click()) to avoid coupling
 * to disabled button state.
 */

import { MetronomeAudio } from "./audio/MetronomeAudio.js";
import { MetronomeUI } from "./ui/MetronomeUI.js";
import { MetronomeEngine } from "./core/MetronomeEngine.js";

const clampInt = (n, min, max) => Math.max(min, Math.min(max, n | 0));

const BPM_MIN = 30;
const BPM_MAX = 280;

const BEATS_MIN = 2;
const BEATS_MAX = 6;

// UI callback invalidation (prevents stale highlight/clear timeouts)
let uiEpoch = 0;
const bumpUiEpoch = () => { uiEpoch += 1; };

const audio = new MetronomeAudio();
const ui = new MetronomeUI();
const engine = new MetronomeEngine(audio);

// Single Source of Truth (SSOT)
const state = {
  bpm: 120,
  beatsPerBar: 4,
  running: false,
};

/* ---------------------------
   Rendering / synchronization
--------------------------- */

const render = () => {
  ui.setBpm(state.bpm);
  ui.setBeats(state.beatsPerBar);
  ui.setRunning(state.running);
};

const syncEngineConfig = ({ resetPhase = false } = {}) => {
  engine.setBpm(state.bpm);
  engine.setBeatsPerBar(state.beatsPerBar, { resetPhase });
};

// Initial render + engine config
render();
syncEngineConfig({ resetPhase: true });

/* ---------------------------
   Beat -> DOTS ONLY
--------------------------- */
const unsubscribeBeat = engine.subscribeBeat((dotIdx, _isAccent, whenPerfMs) => {
  const scheduledEpoch = uiEpoch;
  const delayMs = Math.max(0, whenPerfMs - performance.now());

  window.setTimeout(() => {
    if (scheduledEpoch !== uiEpoch) return;

    ui.setActiveDot(dotIdx);

    // Clear near end of beat (BPM can change while running)
    const beatMs = 60000 / state.bpm;
    window.setTimeout(() => {
      if (scheduledEpoch !== uiEpoch) return;
      if (state.running) ui.resetDots();
    }, Math.max(0, beatMs - 10));
  }, delayMs);
});

/* ---------------------------
   State transitions (SSOT)
--------------------------- */

const setBpm = (next) => {
  state.bpm = clampInt(next, BPM_MIN, BPM_MAX);
  engine.setBpm(state.bpm);
  ui.setBpm(state.bpm);
};

const setBeatsPerBar = (next) => {
  bumpUiEpoch(); // invalidate pending UI timeouts (dot indices / cycle changes)

  state.beatsPerBar = clampInt(next, BEATS_MIN, BEATS_MAX);

  // UI first (re-renders dots)
  ui.setBeats(state.beatsPerBar);
  ui.resetDots();

  // Engine reconfig: reset phase for clarity/coherence
  engine.setBeatsPerBar(state.beatsPerBar, { resetPhase: true });
};

const start = async () => {
  if (state.running) return;

  bumpUiEpoch();

  await audio.ensureStarted();

  engine.start();
  state.running = true;

  ui.setRunning(true);
};

const stop = () => {
  if (!state.running) return;

  bumpUiEpoch();

  engine.stop();
  state.running = false;

  ui.setRunning(false);
  ui.resetDots();
};

const toggleTransport = () => {
  if (state.running) stop();
  else start();
};

/* ---------------------------
   BPM controls
--------------------------- */
ui.onMinus10(() => setBpm(state.bpm - 10));
ui.onMinus(()   => setBpm(state.bpm - 1));
ui.onPlus(()    => setBpm(state.bpm + 1));
ui.onPlus10(()  => setBpm(state.bpm + 10));

/* ---------------------------
   Beats controls
--------------------------- */
ui.onBeatsMinus(() => setBeatsPerBar(state.beatsPerBar - 1));
ui.onBeatsPlus(()  => setBeatsPerBar(state.beatsPerBar + 1));

/* ---------------------------
   Transport controls
--------------------------- */
ui.onPlay(start);
ui.onStop(stop);

/* ---------------------------
   Keyboard shortcut
--------------------------- */
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space") return;
  if (e.repeat) return;

  const t = e.target;
  const isTypingTarget =
    t instanceof HTMLElement &&
    (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
  if (isTypingTarget) return;

  e.preventDefault();
  toggleTransport();
});