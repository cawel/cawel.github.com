/**
 * main.js
 * -------
 * Application entry point for the Metronome App.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Wires together the three core modules:
 *     • MetronomeAudio  (sound synthesis)
 *     • MetronomeEngine (timing + scheduling)
 *     • MetronomeUI     (DOM interaction + rendering)
 * - Manages BPM state
 * - Handles transport controls (Play / Stop)
 * - Implements keyboard shortcuts (Space = toggle)
 *
 * ARCHITECTURE OVERVIEW
 * ---------------------
 * UI  ──► main.js ──► Engine ──► Audio
 *
 * - UI emits user intent (buttons)
 * - Engine schedules beat timing using high-precision lookahead
 * - Audio generates deterministic woodblock ticks
 * - main.js coordinates state and ensures separation of concerns
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
 * For keyboard activation, ensureStarted() is intentionally
 * not awaited to preserve gesture context in stricter browsers.
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
  const delayMs = Math.max(0, whenPerfMs - performance.now());

  window.setTimeout(() => {
    ui.setActiveDot(dotIdx);

    // Clear near end of beat (BPM can change live)
    const beatMs = 60000 / engine.bpm;
    window.setTimeout(() => {
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
  await audio.ensureStarted();
  engine.start();
  ui.setRunning(true);
};

const stop = () => {
  engine.stop();
  ui.setRunning(false);
  ui.resetDots();
};

ui.onPlay(start);
ui.onStop(stop);
