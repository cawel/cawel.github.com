/**
 * MetronomeAudio
 * --------------
 * Deterministic Web Audio metronome sound engine.
 *
 * PURPOSE
 * -------
 * Generates a loud, woodblock-style tick using the Web Audio API.
 * All beats are sample-identical except beat 1, which is slightly
 * brighter via filter frequency adjustment (not amplitude variation).
 *
 * DESIGN GOALS
 * ------------
 * - No external dependencies
 * - No global namespace pollution
 * - Deterministic audio (no per-beat randomness)
 * - High perceived loudness without hard clipping
 * - Clean separation from UI and timing engine
 *
 * ARCHITECTURE
 * ------------
 * Audio graph per tick:
 *
 *   Noise Buffer (click) ──► Bandpass ──► Gain ┐
 *                                               ├──► Per-Tick Gain ──► Master Gain ──► Output
 *   Noise Buffer (body)  ──► Bandpass ──► Gain ┘
 *
 * - Two precomputed noise buffers are created once at initialization.
 * - These buffers are reused for every beat to ensure identical sound.
 * - Beat 1 accent is achieved by increasing the click filter frequency.
 * - A dedicated master gain node controls overall loudness.
 *
 * TIMING
 * ------
 * Sounds are scheduled using absolute AudioContext time (seconds),
 * allowing sample-accurate playback when driven by the metronome engine.
 *
 * PERFORMANCE NOTES
 * -----------------
 * - Noise buffers are generated once to avoid per-beat allocations.
 * - Uses short envelopes and exponential ramps to avoid clicks.
 * - Designed to remain stable at high BPM values.
 *
 */

export class MetronomeAudio {
  #ctx = null;
  #masterGain = null;
  #clickBuffer = null;
  #bodyBuffer = null;

  async ensureStarted() {
    if (!this.#ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.#ctx = new AudioCtx();

      this.#masterGain = this.#ctx.createGain();
      this.#masterGain.gain.value = 4.5;

      const softClip = this.#ctx.createWaveShaper();
      softClip.curve = this.#makeSoftClipCurve(1024);
      softClip.oversample = "4x";

      this.#masterGain.connect(softClip);
      softClip.connect(this.#ctx.destination);

      this.#clickBuffer = this.#buildNoiseBuffer(0.012, 10);
      this.#bodyBuffer = this.#buildNoiseBuffer(0.035, 10);
    }

    if (this.#ctx.state !== "running") {
      await this.#ctx.resume();
    }
  }

  close() {
    if (this.#ctx) {
      this.#ctx.close();
      this.#ctx = null;
      this.#masterGain = null;
      this.#clickBuffer = null;
      this.#bodyBuffer = null;
    }
  }

  get currentTime() {
    return this.#ctx ? this.#ctx.currentTime : 0;
  }

  tickAt(timeSec, opts = {}) {
    if (!this.#ctx) return;

    const ctx = this.#ctx;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, timeSec);
    g.gain.exponentialRampToValueAtTime(1.6, timeSec + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, timeSec + 0.06);
    g.connect(this.#masterGain);

    const clickSrc = this.#bufferSource(this.#clickBuffer, timeSec);
    const clickBP = ctx.createBiquadFilter();
    clickBP.type = "bandpass";
    clickBP.frequency.setValueAtTime(opts.accent ? 4200 : 3600, timeSec);
    clickBP.Q.setValueAtTime(9, timeSec);
    clickSrc.connect(clickBP);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.0, timeSec);
    clickGain.gain.linearRampToValueAtTime(0.85, timeSec + 0.002);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, timeSec + 0.014);
    clickBP.connect(clickGain);
    clickGain.connect(g);

    const bodySrc = this.#bufferSource(this.#bodyBuffer, timeSec);
    const bodyBP = ctx.createBiquadFilter();
    bodyBP.type = "bandpass";
    bodyBP.frequency.setValueAtTime(1200, timeSec);
    bodyBP.Q.setValueAtTime(14, timeSec);
    bodySrc.connect(bodyBP);

    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.0, timeSec);
    bodyGain.gain.linearRampToValueAtTime(1.2, timeSec + 0.004);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, timeSec + 0.06);
    bodyBP.connect(bodyGain);
    bodyGain.connect(g);
  }

  #bufferSource(buffer, startTimeSec) {
    const src = this.#ctx.createBufferSource();
    src.buffer = buffer;
    src.start(startTimeSec);
    return src;
  }

  #buildNoiseBuffer(durationSec, decayStrength = 10) {
    const ctx = this.#ctx;
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    let seed = 0x12345678;
    const rand = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };

    for (let i = 0; i < frameCount; i++) {
      const t = i / frameCount;
      const env = Math.exp(-decayStrength * t);
      data[i] = ((rand() * 2) - 1) * env;
    }

    return buffer;
  }

  #makeSoftClipCurve(samples) {
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      curve[i] = (3 + 20) * x * 57 * deg / (Math.PI + 20 * Math.abs(x));
    }

    return curve;
  }
}
