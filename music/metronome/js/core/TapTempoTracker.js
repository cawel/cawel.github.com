/**
 * TapTempoTracker
 * ---------------
 * Stateless-from-the-outside helper for translating user taps into BPM.
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

  tap(nowMs) {
    const lastTapMs = this.#tapTimesMs[this.#tapTimesMs.length - 1];

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

    const avgIntervalMs = sumIntervalsMs / (this.#tapTimesMs.length - 1);
    if (avgIntervalMs <= 0) return null;

    return clampInt(
      Math.round(60_000 / avgIntervalMs),
      this.#minBpm,
      this.#maxBpm,
    );
  }
}
