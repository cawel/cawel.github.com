"use strict";

/**
 * Drift-corrected transport.
 *
 * Strategy:
 * - Use AudioContext time as the master clock (stable, high-resolution).
 * - Run a small JS "pump" (setTimeout) that schedules steps ahead.
 * - If the browser lags, we "catch up" by emitting multiple steps.
 *
 * Determinism is preserved because:
 * - Sequencer is still driven by explicit stepOnce() calls only.
 * - The step order is always the same; only real-time spacing improves.
 */
export function createTransport({ sequencer, audioCtx }) {
  let playing = false;

  // How often we wake up to schedule work (ms)
  const tickMs = 25;

  // How far ahead we try to stay scheduled (seconds)
  const lookaheadSec = 0.10;

  let timeoutId = null;

  // Next step time on the audio clock
  let nextStepTime = 0;

  const stepSec = () => {
    const { tempo } = sequencer.getState();
    return (60 / tempo) / 4; // 16th notes
  };

  const pump = () => {
    if (!playing) return;

    const now = audioCtx.currentTime;

    // Schedule steps until we're "lookaheadSec" ahead of now
    while (nextStepTime < now + lookaheadSec) {
      // Fire the deterministic tick
      sequencer.stepOnce();

      // Advance the audio-clock schedule
      nextStepTime += stepSec();
    }

    timeoutId = window.setTimeout(pump, tickMs);
  };

  const start = () => {
    if (playing) return;
    playing = true;

    // Start scheduling from "now" on the audio clock.
    // Using a tiny offset avoids edge cases when now is exactly on a boundary.
    nextStepTime = audioCtx.currentTime + 0.01;

    pump();
  };

  const stop = () => {
    if (!playing) return;
    playing = false;

    if (timeoutId != null) window.clearTimeout(timeoutId);
    timeoutId = null;

    sequencer.reset();
  };

  const toggle = () => (playing ? stop() : start());
  const isPlaying = () => playing;

  /**
   * If tempo changes while playing, we want a smooth transition.
   * Minimal approach: keep `nextStepTime` as-is and the new stepSec() will apply.
   * That means tempo takes effect immediately on the next scheduled steps.
   */
  const onTempoChange = () => {
    // No need to stop/start: stepSec() is computed dynamically in pump loop.
    // We keep this hook in case you want a "quantized" tempo change later.
  };

  return { start, stop, toggle, isPlaying, onTempoChange };
}

