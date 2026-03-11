/**
 * synth-engine.js — Web Audio API synthesis engine.
 *
 * Provides arpeggio + block chord playback via the Web Audio API.
 * Created via SynthEngine.create(audioContext).
 * No DOM, no music theory — audio rendering only.
 */
"use strict";

(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SynthEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const create = (audioContext) => {
    if (!audioContext) {
      throw new Error("AudioContext is required");
    }

    const ctx = audioContext;

    /**
     * Play a chord using arpeggio followed by block voicing.
     * @param {number[]} midiNotes - Array of MIDI note numbers (60 = C4)
     * @param {Object} options - Configuration
     * @param {number} options.arpeggioStep - Milliseconds between note attacks (default: 300)
     * @param {number} options.noteDuration - Milliseconds each note sustains (default: 500)
     * @returns {void}
     */
    const playChord = (
      midiNotes,
      { arpeggioStep = 0.3, noteDuration = 0.5 } = {},
    ) => {
      if (!Array.isArray(midiNotes) || midiNotes.length === 0) {
        return;
      }

      const t0 = ctx.currentTime;

      // Arpeggio: notes enter sequentially
      midiNotes.forEach((midiNote, index) => {
        const noteStartTime = t0 + index * arpeggioStep;
        playNote(midiNote, noteStartTime, noteDuration);
      });

      // Block chord: all notes together after the arpeggio
      const blockStartTime =
        t0 + midiNotes.length * arpeggioStep + 2 * arpeggioStep;
      midiNotes.forEach((midiNote) => {
        playNote(midiNote, blockStartTime, noteDuration);
      });
    };

    /**
     * Play a single MIDI note.
     * @param {number} midiNote - MIDI note number
     * @param {number} startTime - Web Audio API time (seconds, relative to ctx.currentTime)
     * @param {number} duration - Duration in seconds
     */
    const playNote = (midiNote, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Convert MIDI note to frequency: 440 Hz = A4 (MIDI 69)
      osc.frequency.value = 440 * Math.pow(2, (midiNote - 69) / 12);

      // Envelope: fade in, then fade out
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    return Object.freeze({
      playChord,
      playNote,
    });
  };

  return Object.freeze({
    create,
  });
});
