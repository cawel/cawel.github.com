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
 * - Maintain tempo state (BPM)
 * - Maintain musical cycle state (beats per bar, beat index)
 * - Schedule beats in AudioContext time using a high-precision lookahead loop
 * - Trigger audio ticks via MetronomeAudio.tickAt(timeSec, { accent })
 * - Emit beat callbacks for UI synchronization:
 *     onBeat(dotIndex, isAccent, whenPerfMs)
 *
 * It does NOT:
 * - Touch the DOM
 * - Handle user input
 * - Format UI state
 * - Own application-level state transitions (main.js does that)
 *
 * ARCHITECTURE ROLE
 * -----------------
 * main.js  ──►  MetronomeEngine  ──►  MetronomeAudio
 *
 * - main.js owns the app state and calls Engine methods (start/stop/config).
 * - Engine schedules future beats and triggers Audio ticks at precise times.
 * - Engine optionally reports beat events for UI rendering.
 *
 * SCHEDULING MODEL
 * ---------------
 * The engine uses a standard "lookahead" strategy:
 * - A short interval timer (lookaheadMs) wakes regularly.
 * - Each wake schedules beats up to scheduleAheadSec into the future.
 * - Scheduled beat timestamps are expressed in AudioContext time (seconds).
 *
 * This approach minimizes drift and avoids relying on a single long timer.
 * 
 * DETERMINISM
 * -----------
 * Beat times are computed as a mathematical progression in
 * AudioContext time (t₀ + nΔ, where Δ = 60 / BPM).
 * 
 * Because scheduling occurs in the audio clock domain,
 * beat timing is independent of JavaScript timer jitter,
 * layout cost, or UI rendering delays.
 *
 * TIME DOMAINS
 * ------------
 * - Audio timing uses AudioContext time: audio.currentTime (seconds).
 * - UI timing uses performance.now() (milliseconds).
 * - When emitting onBeat callbacks, the engine converts the scheduled audio
 *   time to an approximate performance timestamp (whenPerfMs) so main.js can
 *   update the DOM close to the audio tick without blocking the scheduler.
 *
 * MUSICAL MODEL
 * -------------
 * - beatsPerBar is configurable (2–6 in the app UX).
 * - beatIndex advances modulo beatsPerBar.
 * - Accent is applied on the first beat of each bar:
 *     isAccent = (dotIndex === 0)
 *
 * RUNTIME BEHAVIOR
 * ----------------
 * - start():
 *     • resets phase to beat 1
 *     • primes nextNoteTime slightly in the future
 *     • begins the scheduler interval loop
 * - stop():
 *     • stops the interval loop
 *     • leaves audio context management to MetronomeAudio
 * - setBeatsPerBar(n):
 *     • updates cycle length
 *     • may reset phase and realign nextNoteTime for a coherent restart
 *
 * EXTENSIBILITY NOTES
 * -------------------
 * - Accent behavior can be extended (e.g., custom patterns) without touching UI.
 * - Timing parameters (lookaheadMs / scheduleAheadSec) are isolated and can be
 *   tuned for different devices.
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
