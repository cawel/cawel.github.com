"use strict";

/**
 * Transport = real-time scheduler.
 * - non-deterministic by nature (uses timers)
 * - calls `sequencer.stepOnce()` at the desired cadence
 *
 * IMPORTANT: This does NOT change audio envelopes or staggering.
 * Those remain in audio.js and are applied per note.
 */
export function createTransport({ sequencer }) {
  let timerId = null;
  let playing = false;

  const stepMs = () => {
    const { tempo } = sequencer.getState();
    return ((60 / tempo) / 4) * 1000; // 16th notes
  };

  const start = () => {
    if (playing) return;
    playing = true;

    timerId = window.setInterval(() => {
      sequencer.stepOnce();
    }, stepMs());
  };

  const stop = () => {
    if (!playing) return;
    playing = false;

    window.clearInterval(timerId);
    timerId = null;

    sequencer.reset();
  };

  const toggle = () => (playing ? stop() : start());

  const isPlaying = () => playing;

  /**
   * When tempo changes while playing, call `resync()` to keep cadence correct.
   * (Same behavior you had: stop & restart at new interval duration.)
   */
  const resync = () => {
    if (!playing) return;
    stop();
    start();
  };

  return { start, stop, toggle, isPlaying, resync };
}

