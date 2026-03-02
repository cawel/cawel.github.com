/**
 * BeatHighlightScheduler
 * ----------------------
 * Presentation-time scheduler for the Metronome App.
 *
 * PURPOSE
 * -------
 * Bridges the timing domains between:
 *   - Audio scheduling time (AudioContext time, seconds)
 *   - UI updates (DOM timing via setTimeout, milliseconds)
 *
 * This module is responsible for:
 * - Scheduling "active dot" UI highlights at the correct moment
 *   relative to an AudioContext timestamp (timeSec).
 * - Clearing the highlight near the end of the beat duration (beatMs).
 * - Preventing race conditions when the app reconfigures or restarts
 *   by invalidating previously scheduled UI callbacks.
 *
 * It does NOT:
 * - Own application state (BPM, beats per bar, running)
 * - Generate beats or manage musical phase
 * - Generate audio
 * - Decide transport behavior (start/stop)
 *
 * INPUT MODEL
 * -----------
 * handleBeat(event) accepts Engine beat events in the audio time domain:
 *   {
 *     dotIdx: number,
 *     isAccent: boolean,
 *     timeSec: number,        // AudioContext time
 *     secondsPerBeat: number  // beat duration in seconds
 *   }
 *
 * INVALIDATION MODEL
 * ------------------
 * invalidate() increments an internal epoch and clears pending timeouts.
 * Any callbacks scheduled under prior epochs will not run.
 */

export class BeatHighlightScheduler {
  #ui;
  #getAudioNowSec;
  #isRunning;

  #epoch = 0;
  #timers = new Set();

  constructor({ ui, getAudioNowSec, isRunning }) {
    this.#ui = ui;
    this.#getAudioNowSec = getAudioNowSec; // () => audio.currentTime
    this.#isRunning = isRunning; // () => boolean
  }

  invalidate() {
    this.#epoch += 1;

    for (const id of this.#timers) {
      window.clearTimeout(id);
    }
    this.#timers.clear();
  }

  stopAndClear() {
    this.invalidate();
    this.#ui.resetDots();
  }

  /**
   * Intention-revealing API:
   * consume an Engine "beat" event and schedule the corresponding UI highlight.
   */
  onBeatEvent(event) {
    const { dotIdx, timeSec, secondsPerBeat } = event;
    const beatMs = secondsPerBeat * 1000;

    this.#schedule({ dotIdx, timeSec, beatMs });
  }

  #schedule({ dotIdx, timeSec, beatMs }) {
    const epoch = this.#epoch;
    const delayMs = Math.max(0, (timeSec - this.#getAudioNowSec()) * 1000);

    const id1 = window.setTimeout(() => {
      this.#timers.delete(id1);
      if (epoch !== this.#epoch) return;

      this.#ui.setActiveDot(dotIdx);

      const id2 = window.setTimeout(
        () => {
          this.#timers.delete(id2);
          if (epoch !== this.#epoch) return;
          if (this.#isRunning()) this.#ui.resetDots();
        },
        Math.max(0, beatMs - 10),
      );

      this.#timers.add(id2);
    }, delayMs);

    this.#timers.add(id1);
  }
}
