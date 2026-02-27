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

const STEP_1 = 1;
const STEP_10 = 10;

const audio = new MetronomeAudio();
const ui = new MetronomeUI();
const engine = new MetronomeEngine(audio);

let bpm = 120;

ui.setBpm(bpm);
ui.setRunning(false);
engine.setBpm(bpm);

/* ---------------------------
   Beat lighting
--------------------------- */
engine.onBeat((dotIdx, _accent, whenPerfMs) => {
  const beatMs = 60000 / engine.bpm;
  const delayOn = Math.max(0, whenPerfMs - performance.now());

  window.setTimeout(() => {
    ui.setActiveDot(dotIdx);

    window.setTimeout(() => {
      if (engine.isRunning) ui.resetDots();
    }, Math.max(0, beatMs - 10));
  }, delayOn);
});

/* ---------------------------
   BPM Controls
--------------------------- */
const applyBpm = (nextBpm) => {
  bpm = clampInt(nextBpm, BPM_MIN, BPM_MAX);
  ui.setBpm(bpm);
  engine.setBpm(bpm);
};

ui.onMinus10(() => applyBpm(bpm - STEP_10));
ui.onMinus(() => applyBpm(bpm - STEP_1));
ui.onPlus(() => applyBpm(bpm + STEP_1));
ui.onPlus10(() => applyBpm(bpm + STEP_10));

/* ---------------------------
   Start / Stop Logic
--------------------------- */
const startFromClick = async () => {
  await audio.ensureStarted();
  engine.start();
  ui.setRunning(true);
};

const startFromKey = () => {
  // IMPORTANT: do not await; keeps this inside the key gesture in picky browsers
  void audio.ensureStarted();
  engine.start();
  ui.setRunning(true);
};

const stop = () => {
  engine.stop();
  ui.setRunning(false);
  ui.resetDots();
};

ui.onPlay(startFromClick);
ui.onStop(stop);

/* ---------------------------
   Keyboard Shortcut (Space)
   Toggle Play / Stop
--------------------------- */
const isEditableTarget = (target) => {
  if (!target) return false;
  const el = target;
  const tag = el.tagName?.toLowerCase?.() || "";
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    el.isContentEditable
  );
};

document.addEventListener(
  "keydown",
  (e) => {
    const isSpace = e.code === "Space" || e.key === " " || e.key === "Spacebar";
    if (!isSpace) return;
    if (e.repeat) return;
    if (isEditableTarget(e.target)) return;

    e.preventDefault();
    e.stopPropagation();

    if (engine.isRunning) {
      stop();
    } else {
      startFromKey();
    }
  },
  { capture: true }
);
