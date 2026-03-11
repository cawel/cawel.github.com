"use strict";

/**
 * Audio engine: owns AudioContext + note playback.
 * No DOM, no knowledge of grid, no scheduling except per-note.
 */
export function createAudioEngine({
  attackSec = 0.01,
  releaseSec = 0.25,
  rowStaggerSec = 0.001,
} = {}) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  const noteToFreq = (note) => {
    // note like "C3" or "G#4" (we only use natural notes in pentatonic today)
    const A4 = 440;
    const semitoneMap = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

    const m = note.match(/([A-G])(#?)(\d)/);
    if (!m) return A4;

    const [, letter, sharp, octaveStr] = m;
    const octave = Number(octaveStr);

    const semitone = semitoneMap[letter] + (sharp ? 1 : 0) + (octave - 4) * 12;
    return A4 * Math.pow(2, semitone / 12);
  };

  /**
   * Plays a note using a type ("sine" | "square" | "sawtooth" | "triangle" | "bell")
   * Uses a small envelope to reduce clicks + stagger to avoid simultaneous start artifacts.
   */
  const playNote = ({ note, type, rowIndex = 0, velocity = 1 }) => {
    const now = ctx.currentTime;
    const startAt = now + rowIndex * rowStaggerSec;
    const stopAt = startAt + releaseSec;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = noteToFreq(note);

    // Envelope: start at 0 to avoid click, ramp to target, then ramp down.
    gain.gain.setValueAtTime(0, startAt);

    if (type === "bell") {
      osc.type = "sine";
      const peak = 0.30 * velocity;
      gain.gain.linearRampToValueAtTime(peak, startAt + attackSec);
      // exponential feels more "bell-like", but must never hit 0 exactly
      gain.gain.exponentialRampToValueAtTime(0.001, stopAt);
    } else {
      osc.type = type;
      const peak = 0.20 * velocity;
      gain.gain.linearRampToValueAtTime(peak, startAt + attackSec);
      gain.gain.linearRampToValueAtTime(0, stopAt);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startAt);
    osc.stop(stopAt);
  };

  /**
   * Browsers often require a user gesture before audio starts.
   * Calling this on Play click makes behavior predictable.
   */
  const ensureRunning = async () => {
    if (ctx.state !== "running") {
      await ctx.resume();
    }
  };

  return { playNote, ensureRunning, ctx };
}

