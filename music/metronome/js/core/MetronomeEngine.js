/**
 * MetronomeEngine
 * ---------------
 * Timing + scheduling core for the Metronome App.
 *
 * PURPOSE
 * -------
 * Generates a steady beat stream at the configured BPM and beats-per-bar.
 * Uses a lookahead scheduler to achieve stable timing in the browser, and
 * delegates sound generation to MetronomeAudio.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Maintain internal timing configuration (BPM, beats per bar)
 * - Schedule beats in AudioContext time using a high-precision lookahead loop
 * - Trigger audio ticks via MetronomeAudio.tickAt(timeSec, { accent })
 * - Emit beat events in the *audio time domain* for subscribers
 *
 * It does NOT:
 * - Touch the DOM
 * - Handle user input
 * - Translate audio time to UI time (performance.now)
 * - Perform UI scheduling/animations
 *
 * ARCHITECTURE ROLE
 * -----------------
 * main.js  ──►  MetronomeEngine  ──►  MetronomeAudio
 *
 * - main.js owns app state and calls Engine methods (start/stop/configure).
 * - Engine schedules beats in AudioContext time and triggers Audio ticks.
 * - Engine emits beat events ({ timeSec, ... }) for main.js to map to UI.
 *
 * SCHEDULING MODEL
 * ---------------
 * Lookahead strategy:
 * - A short interval (lookaheadMs) wakes regularly.
 * - Each wake schedules beats up to scheduleAheadSec into the future.
 * - Beat timestamps are expressed in AudioContext time (seconds).
 *
 * EVENT MODEL
 * -----------
 * subscribeBeat(listener) emits an object in the audio time domain:
 *   {
 *     dotIdx: number,
 *     isAccent: boolean,
 *     timeSec: number,        // AudioContext time
 *     secondsPerBeat: number  // derived from current BPM
 *   }
 *
 * The orchestrator (main.js) is responsible for mapping timeSec to UI timing.
 */

export class MetronomeEngine {
  #audio;

  // Internal timing state
  #bpm = 120;
  #beatsPerBar = 4;
  #beatIndex = 0;

  #isRunning = false;

  // Scheduling
  #intervalId = null;
  #lookaheadMs = 25;
  #scheduleAheadSec = 0.12;
  #nextNoteTime = 0;

  // Beat listeners
  #beatListeners = new Set();

  constructor(audio) {
    this.#audio = audio;
  }

  /**
   * Atomic configuration update.
   * This is the only configuration entrypoint the orchestrator should use.
   */
  configure({ bpm, beatsPerBar } = {}, { resetPhase = false } = {}) {
    if (typeof bpm === "number") this.#bpm = bpm;
    if (typeof beatsPerBar === "number") this.#beatsPerBar = beatsPerBar;

    if (resetPhase) {
      this.#beatIndex = 0;

      if (this.#isRunning) {
        const now = this.#audio.currentTime;
        this.#nextNoteTime = now + 0.02;
      }
    }
  }

  /**
   * Subscribe to beat events (audio time domain).
   * Returns an unsubscribe function.
   *
   * Listener signature:
   *   (event: {
   *     dotIdx: number,
   *     isAccent: boolean,
   *     timeSec: number,
   *     secondsPerBeat: number
   *   }) => void
   */
  subscribeBeat(listener) {
    if (typeof listener !== "function") {
      throw new TypeError(
        "MetronomeEngine.subscribeBeat(listener): listener must be a function"
      );
    }

    this.#beatListeners.add(listener);

    let isActive = true;
    return () => {
      if (!isActive) return;
      isActive = false;
      this.#beatListeners.delete(listener);
    };
  }

  clearBeatListeners() {
    this.#beatListeners.clear();
  }

  start() {
    if (this.#isRunning) return false;

    this.#isRunning = true;
    this.#beatIndex = 0;

    const now = this.#audio.currentTime;
    this.#nextNoteTime = now + 0.05;

    this.#intervalId = window.setInterval(
      () => this.#scheduler(),
      this.#lookaheadMs
    );

    return true;
  }

  stop() {
    if (!this.#isRunning) return false;

    this.#isRunning = false;

    if (this.#intervalId !== null) {
      window.clearInterval(this.#intervalId);
      this.#intervalId = null;
    }

    return true;
  }

  /**
   * Optional debug inspection hook.
   * Not intended for production logic.
   */
  getDebugState() {
    return {
      bpm: this.#bpm,
      beatsPerBar: this.#beatsPerBar,
      isRunning: this.#isRunning,
      beatIndex: this.#beatIndex,
      nextNoteTime: this.#nextNoteTime,
    };
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

    const secondsPerBeat = 60.0 / this.#bpm;

    // Schedule audio tick in AudioContext time
    this.#audio.tickAt(timeSec, { accent: isAccent });

    // Emit beat event (audio time domain only)
    if (this.#beatListeners.size > 0) {
      const evt = { dotIdx, isAccent, timeSec, secondsPerBeat };

      for (const fn of this.#beatListeners) {
        try {
          fn(evt);
        } catch {
          // Listener errors must never break scheduling.
        }
      }
    }

    this.#beatIndex = (this.#beatIndex + 1) % this.#beatsPerBar;
  }
}