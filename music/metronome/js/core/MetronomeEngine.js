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

  #beatsPerBar = 4;
  #beatIndex = 0;

  #isRunning = false;

  // Scheduling
  #intervalId = null;
  #lookaheadMs = 25;
  #scheduleAheadSec = 0.12;
  #nextNoteTime = 0;

  #onBeat = null;

  constructor(audio) {
    this.#audio = audio;
  }

  get bpm() { return this.#bpm; }
  get isRunning() { return this.#isRunning; }
  get beatsPerBar() { return this.#beatsPerBar; }

  setBpm(bpm) {
    this.#bpm = bpm;
  }

  setBeatsPerBar(n, { resetPhase = true } = {}) {
    this.#beatsPerBar = n;

    if (resetPhase) {
      this.#beatIndex = 0;

      // If currently running, realign scheduling so UI/audio feels coherent.
      if (this.#isRunning) {
        const now = this.#audio.currentTime;
        this.#nextNoteTime = now + 0.02;
      }
    }
  }

  onBeat(fn) {
    this.#onBeat = fn;
  }

  start() {
    if (this.#isRunning) return;

    this.#isRunning = true;
    this.#beatIndex = 0;

    const now = this.#audio.currentTime;
    this.#nextNoteTime = now + 0.05;

    this.#intervalId = window.setInterval(() => this.#scheduler(), this.#lookaheadMs);
  }

  stop() {
    if (!this.#isRunning) return;

    this.#isRunning = false;

    if (this.#intervalId !== null) {
      window.clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
  }

  #scheduler() {
    if (!this.#isRunning) return;

    const now = this.#audio.currentTime;

    while (this.#nextNoteTime < now + this.#scheduleAheadSec) {
      this.#scheduleBeat(this.#nextNoteTime);

      const secondsPerBeat = 60.0 / this.#bpm;
      this.#nextNoteTime += secondsPerBeat;
    }
  }

  #scheduleBeat(timeSec) {
    const dotIdx = this.#beatIndex % this.#beatsPerBar;
    const isAccent = dotIdx === 0;

    // Schedule audio tick
    this.#audio.tickAt(timeSec, { accent: isAccent });

    // Schedule UI callback time in performance.now() space
    if (this.#onBeat) {
      const whenPerfMs = performance.now() + (timeSec - this.#audio.currentTime) * 1000;
      this.#onBeat(dotIdx, isAccent, whenPerfMs);
    }

    this.#beatIndex = (this.#beatIndex + 1) % this.#beatsPerBar;
  }
}
