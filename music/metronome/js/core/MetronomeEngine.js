/**
 * MetronomeEngine
 * ----------------
 * High-precision timing and scheduling engine for the Metronome App.
 *
 * PURPOSE
 * -------
 * Responsible for beat timing, scheduling audio events ahead of time,
 * and notifying the UI layer when a beat occurs.
 *
 * The engine does NOT generate sound and does NOT manipulate the DOM.
 * It coordinates timing only, preserving separation of concerns.
 *
 * ARCHITECTURE
 * ------------
 * main.js  ──►  MetronomeEngine  ──►  MetronomeAudio
 *                       │
 *                       └──► UI callback (beat notifications)
 *
 * TIMING STRATEGY
 * ---------------
 * Uses a "lookahead scheduler" pattern:
 *
 * - A short interval timer (e.g. every 25ms) runs a scheduler loop.
 * - The scheduler checks AudioContext currentTime.
 * - It schedules upcoming beats slightly ahead in time
 *   (e.g. ~120ms into the future).
 *
 * This approach:
 * - Avoids jitter caused by the JS event loop
 * - Maintains stable tempo even under UI load
 * - Enables sample-accurate playback
 *
 * BEAT CYCLE
 * ----------
 * - 4-beat repeating cycle (0..3)
 * - Beat 0 is treated as the "accent" beat
 * - After beat 3, cycle resets to beat 0
 *
 * BPM HANDLING
 * ------------
 * - BPM can be changed while running.
 * - The next scheduled beats use the updated tempo.
 * - No reset of timing state is required.
 *
 * UI SYNCHRONIZATION
 * ------------------
 * When a beat is scheduled:
 * - Audio is scheduled at absolute audio time.
 * - A corresponding UI callback is emitted.
 * - The engine converts audio time to performance.now()
 *   so visual updates align closely with sound playback.
 *
 * DESIGN PRINCIPLES
 * -----------------
 * - Deterministic scheduling
 * - No DOM dependencies
 * - No global state
 * - Minimal allocations during runtime
 * - Safe to start/stop repeatedly
 */

export class MetronomeEngine {
  #audio;
  #bpm = 120;
  #isRunning = false;

  #beatIndex = 0;

  #nextNoteTime = 0;
  #timerId = null;
  #lookaheadMs = 25;
  #scheduleAheadSec = 0.12;

  #uiCallback = null;

  constructor(audio) {
    this.#audio = audio;
  }

  setBpm(bpm) {
    this.#bpm = bpm;
  }

  get bpm() { return this.#bpm; }
  get isRunning() { return this.#isRunning; }

  onBeat(callback) {
    this.#uiCallback = callback; // (dotIndex, accent, whenPerfMs) => void
  }

  start() {
    if (this.#isRunning) return;

    this.#isRunning = true;
    this.#beatIndex = 0;

    const now = this.#audio.currentTime;
    this.#nextNoteTime = now + 0.03;

    this.#timerId = window.setInterval(() => this.#schedulerTick(), this.#lookaheadMs);
  }

  stop() {
    if (!this.#isRunning) return;

    this.#isRunning = false;
    if (this.#timerId !== null) {
      window.clearInterval(this.#timerId);
      this.#timerId = null;
    }
  }

  #secondsPerBeat() {
    return 60 / this.#bpm;
  }

  #schedulerTick() {
    if (!this.#isRunning) return;

    const now = this.#audio.currentTime;
    while (this.#nextNoteTime < now + this.#scheduleAheadSec) {
      this.#scheduleBeatAt(this.#nextNoteTime, this.#beatIndex);
      this.#nextNoteTime += this.#secondsPerBeat();
      this.#beatIndex = (this.#beatIndex + 1) % 4;
    }
  }

  #scheduleBeatAt(audioTimeSec, beatIdx) {
    const dotIdx = beatIdx; // 0..3
    const accent = beatIdx === 0; // only beat 1 brighter

    this.#audio.tickAt(audioTimeSec, { accent });

    const perfNow = performance.now();
    const audioNow = this.#audio.currentTime;
    const deltaMs = (audioTimeSec - audioNow) * 1000;
    const whenPerfMs = perfNow + Math.max(0, deltaMs);

    this.#uiCallback?.(dotIdx, accent, whenPerfMs);
  }
}
