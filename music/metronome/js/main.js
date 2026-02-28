/**
 * main.js
 * -------
 * Application entry point and orchestration layer
 * for the Metronome App.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Wires together the three core modules:
 *     • MetronomeAudio   (sound synthesis)
 *     • MetronomeEngine  (timing + scheduling)
 *     • MetronomeUI      (DOM interaction + rendering)
 *
 * - Manages application state:
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
 * - Synchronizes UI with scheduled audio beats.
 *
 * ARCHITECTURE OVERVIEW
 * ---------------------
 * UI  ──► main.js ──► Engine ──► Audio
 *
 * - UI emits user intent (button events).
 * - Engine schedules beats using high-precision lookahead timing.
 * - Audio produces deterministic woodblock ticks.
 * - main.js coordinates state transitions and ensures strict
 *   separation of concerns between layers.
 *
 * UI SYNCHRONIZATION MODEL
 * ------------------------
 * The Engine schedules beats ahead of time (AudioContext time).
 * main.js translates scheduled beat times into performance.now()
 * callbacks for DOM updates.
 *
 * To prevent race conditions when changing BPM or Beats dynamically,
 * a UI "epoch" counter invalidates stale scheduled UI callbacks.
 * This guarantees visual highlights never drift or double-trigger.
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
 * ensureStarted() must be called from a user-triggered event.
 * Keyboard activation intentionally avoids awaiting the promise
 * to preserve gesture context in stricter browser environments.
 *
 */

import { MetronomeAudio } from "./audio/MetronomeAudio.js";
import { MetronomeUI } from "./ui/MetronomeUI.js";
import { MetronomeEngine } from "./core/MetronomeEngine.js";

const clampInt = (n, min, max) => Math.max(min, Math.min(max, n | 0));

const BPM_MIN = 30;
const BPM_MAX = 280;

const BEATS_MIN = 2;
const BEATS_MAX = 6;

let uiEpoch = 0;
const bumpUiEpoch = () => { uiEpoch += 1; };

const audio = new MetronomeAudio();
const ui = new MetronomeUI();
const engine = new MetronomeEngine(audio);

let bpm = 120;
let beatsPerBar = 4;

// Initial render
ui.setBpm(bpm);
ui.setBeats(beatsPerBar);
ui.setRunning(false);

engine.setBpm(bpm);
engine.setBeatsPerBar(beatsPerBar);

/* ---------------------------
   Beat -> DOTS ONLY
--------------------------- */
engine.onBeat((dotIdx, _isAccent, whenPerfMs) => {
  const scheduledEpoch = uiEpoch;

  const delayMs = Math.max(0, whenPerfMs - performance.now());

  window.setTimeout(() => {
    // Ignore stale callbacks after beats change / stop / restart
    if (scheduledEpoch !== uiEpoch) return;

    // Guard against edge cases (e.g., dots re-rendered to fewer beats)
    ui.setActiveDot(dotIdx);

    // Clear near end of beat (BPM can change live)
    const beatMs = 60000 / engine.bpm;
    window.setTimeout(() => {
      if (scheduledEpoch !== uiEpoch) return;
      if (engine.isRunning) ui.resetDots();
    }, Math.max(0, beatMs - 10));

  }, delayMs);
});

/* ---------------------------
   BPM controls
--------------------------- */
const applyBpm = (next) => {
  bpm = clampInt(next, BPM_MIN, BPM_MAX);
  ui.setBpm(bpm);
  engine.setBpm(bpm);
};

ui.onMinus10(() => applyBpm(bpm - 10));
ui.onMinus(()   => applyBpm(bpm - 1));
ui.onPlus(()    => applyBpm(bpm + 1));
ui.onPlus10(()  => applyBpm(bpm + 10));

/* ---------------------------
   Beats controls
--------------------------- */
const applyBeats = (next) => {
  bumpUiEpoch(); // invalidate pending UI timeouts

  beatsPerBar = clampInt(next, BEATS_MIN, BEATS_MAX);

  // UI: update value + re-render dots
  ui.setBeats(beatsPerBar);

  // Engine: update cycle length + reset to beat 1 for clarity
  engine.setBeatsPerBar(beatsPerBar, { resetPhase: true });

  // Also clear dots so it doesn't show an out-of-range active idx
  ui.resetDots();
};

ui.onBeatsMinus(() => applyBeats(beatsPerBar - 1));
ui.onBeatsPlus(()  => applyBeats(beatsPerBar + 1));

/* ---------------------------
   Start / Stop
--------------------------- */
const start = async () => {
  bumpUiEpoch();

  await audio.ensureStarted();
  engine.start();
  ui.setRunning(true);
};

const stop = () => {
  bumpUiEpoch(); // invalidate pending UI timeouts

  engine.stop();
  ui.setRunning(false);
  ui.resetDots();
};

ui.onPlay(start);
ui.onStop(stop);
