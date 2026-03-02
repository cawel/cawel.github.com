/**
 * TapTempoTracker
 * ---------------
 * Converts a sequence of tap timestamps (ms) into a stable BPM estimate.
 *
 * Behavior summary:
 * - Returns `null` until at least 2 taps exist (first interval).
 * - Resets tap history after inactivity (`resetMs`) so old taps do not skew
 *   a new tempo intent.
 * - Uses a rolling average over recent intervals for smoother updates.
 * - Clamps final BPM to configured min/max bounds.
 *
 * This class intentionally has no clock dependency; caller provides `nowMs`.
 */

const DEFAULT_RESET_MS = 2000;
const DEFAULT_MAX_TAPS = 8;

const clampInt = (n, min, max) => Math.max(min, Math.min(max, n | 0));

export class TapTempoTracker {
  #resetMs;
  #maxTaps;
  #minBpm;
  #maxBpm;
  #tapTimesMs = [];

  /**
   * @param {object} options
   * @param {number} [options.resetMs=2000]
   *   Max time gap between taps before history resets.
   * @param {number} [options.maxTaps=8]
   *   Number of most recent taps retained in the rolling window.
   * @param {number} options.minBpm
   *   Lower BPM clamp bound.
   * @param {number} options.maxBpm
   *   Upper BPM clamp bound.
   */
  constructor({
    resetMs = DEFAULT_RESET_MS,
    maxTaps = DEFAULT_MAX_TAPS,
    minBpm,
    maxBpm,
  } = {}) {
    if (typeof minBpm !== "number" || typeof maxBpm !== "number") {
      throw new TypeError(
        "TapTempoTracker: minBpm and maxBpm are required numbers",
      );
    }

    this.#resetMs = resetMs;
    this.#maxTaps = maxTaps;
    this.#minBpm = minBpm;
    this.#maxBpm = maxBpm;
  }

  /**
   * Register a tap and return next BPM estimate.
   *
   * @param {number} nowMs
   *   Monotonic timestamp in milliseconds (e.g. `performance.now()`).
   * @returns {number | null}
   *   Clamped BPM when enough data exists; otherwise `null`.
   */
  tap(nowMs) {
    const lastTapMs = this.#tapTimesMs[this.#tapTimesMs.length - 1];

    // A long gap means user likely starts a new tempo.
    if (lastTapMs !== undefined && nowMs - lastTapMs > this.#resetMs) {
      this.#tapTimesMs = [];
    }

    this.#tapTimesMs.push(nowMs);

    if (this.#tapTimesMs.length > this.#maxTaps) {
      this.#tapTimesMs.shift();
    }

    if (this.#tapTimesMs.length < 2) return null;

    let sumIntervalsMs = 0;
    for (let i = 1; i < this.#tapTimesMs.length; i++) {
      sumIntervalsMs += this.#tapTimesMs[i] - this.#tapTimesMs[i - 1];
    }

    // Average interval produces a smoother BPM than using only the last tap gap.
    const avgIntervalMs = sumIntervalsMs / (this.#tapTimesMs.length - 1);
    if (avgIntervalMs <= 0) return null;

    return clampInt(
      Math.round(60_000 / avgIntervalMs),
      this.#minBpm,
      this.#maxBpm,
    );
  }
}
