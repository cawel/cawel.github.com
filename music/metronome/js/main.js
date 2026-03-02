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
 *     • UI synchronization epoch (internal)
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
 * - main.js mutates state (SSOT), renders UI, and configures the Engine.
 * - Engine schedules beats in AudioContext time using lookahead timing.
 * - Audio synthesizes ticks at scheduled timestamps.
 *
 * UI SYNCHRONIZATION MODEL
 * ------------------------
 * Engine emits beat events with an approximate performance.now() timestamp.
 * main.js schedules DOM updates accordingly.
 *
 * A UI "epoch" value invalidates stale scheduled callbacks whenever configuration
 * changes or transport stops/starts, preventing highlight drift and race bugs.
 *
 * AUDIO POLICY NOTE
 * -----------------
 * Web Audio requires a user gesture to start.
 * ensureStarted() must be called from a user-triggered event.
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

// Single Source of Truth (all mutable state lives here)
const state = {
  bpm: 120,
  beatsPerBar: 4,
  running: false,

  // UI callback invalidation (internal synchronization state)
  uiEpoch: 0,
};

const bumpUiEpoch = () => { state.uiEpoch += 1; };

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
    { resetPhase }
  );
};

// initial
render();
syncEngine({ resetPhase: true });

/* ---------------------------
   Beat -> DOTS ONLY
--------------------------- */

const unsubscribeBeat = engine.subscribeBeat((dotIdx, _isAccent, whenPerfMs) => {
  const scheduledEpoch = state.uiEpoch;
  const delayMs = Math.max(0, whenPerfMs - performance.now());

  window.setTimeout(() => {
    if (scheduledEpoch !== state.uiEpoch) return;

    ui.setActiveDot(dotIdx);

    // clear near the end of the beat (use SSOT bpm, not engine getter)
    const beatMs = 60000 / state.bpm;

    window.setTimeout(() => {
      if (scheduledEpoch !== state.uiEpoch) return;
      if (state.running) ui.resetDots();
    }, Math.max(0, beatMs - 10));
  }, delayMs);
});

/* ---------------------------
   State mutations (SSOT)
--------------------------- */

const setBpm = (next) => {
  state.bpm = clampInt(next, BPM_MIN, BPM_MAX);
  syncEngine();     // atomic config update
  render();         // consistent state->UI rendering
};

const setBeatsPerBar = (next) => {
  bumpUiEpoch(); // invalidate pending UI callbacks (dot mapping changes)

  state.beatsPerBar = clampInt(next, BEATS_MIN, BEATS_MAX);

  // beats change should reset phase for coherence
  syncEngine({ resetPhase: true });

  // avoid showing stale active dot index after re-render
  ui.resetDots();

  render();
};

const start = async () => {
  if (state.running) return;

  bumpUiEpoch();

  await audio.ensureStarted();

  engine.start();
  state.running = true;

  render();
};

const stop = () => {
  if (!state.running) return;

  bumpUiEpoch();

  engine.stop();
  state.running = false;

  ui.resetDots();
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
ui.onMinus(()   => setBpm(state.bpm - 1));
ui.onPlus(()    => setBpm(state.bpm + 1));
ui.onPlus10(()  => setBpm(state.bpm + 10));

// Beats controls
ui.onBeatsMinus(() => setBeatsPerBar(state.beatsPerBar - 1));
ui.onBeatsPlus(()  => setBeatsPerBar(state.beatsPerBar + 1));

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
  try { unsubscribeBeat(); } catch {}

  stop(); // ensures engine stopped + UI cleared + epoch bumped

  try { document.removeEventListener("keydown", onKeyDown); } catch {}
  try { audio.close(); } catch {}
};