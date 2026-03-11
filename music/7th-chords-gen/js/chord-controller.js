(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.ChordController = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const HarmonyEngine =
    typeof window !== "undefined"
      ? window.HarmonyEngine
      : require("./harmony-engine.js");

  /**
   * ChordController — orchestrates the harmony engine and manages progression state.
   * App-agnostic: no DOM, no audio, just state management and chord generation.
   */
  const create = () => {
    const state = HarmonyEngine.createState();

    return Object.freeze({
      /**
       * Get the current application state snapshot.
       * @returns {Object} Current state (readonly snapshot)
       */
      getState() {
        return Object.freeze({
          currentMode: state.currentMode,
          currentKey: state.currentKey,
          currentChord: state.currentChord
            ? Object.freeze({ ...state.currentChord })
            : null,
          chordCount: state.chordCount,
          stepIndex: state.stepIndex,
          cycleIndex: state.cycleIndex,
        });
      },

      /**
       * Get the next chord based on current mode and options.
       * Updates internal state and returns the result.
       * @param {Object} options - Generation options
       * @param {boolean} options.includeHalfDim - Include ø7 chords
       * @param {boolean} options.includeDim - Include o7 chords
       * @returns {Object} {chord, prog} for progressions or chord for random/cycle
       */
      nextChord(options = {}) {
        const result = HarmonyEngine.generateChord(state, options);

        // Handle progression result
        if (result.chord) {
          state.currentChord = result.chord;
          state.currentKey = state.currentKey; // Already set by generateChord
          return result;
        }

        // Handle random / cycle result
        state.currentChord = result;
        return { chord: result, prog: null };
      },

      /**
       * Change the active mode and reset progression state.
       * @param {string} newMode - Mode name (random, cycle, maj251, min251)
       */
      setMode(newMode) {
        if (state.currentMode === newMode) return;

        state.currentMode = newMode;
        state.stepIndex = 0;
        state.currentKey = null;
        state.currentChord = null;
      },

      /**
       * Increment the chord counter.
       */
      incrementChordCount() {
        state.chordCount++;
      },

      /**
       * Reset all state (for testing or hard reset).
       */
      reset() {
        const fresh = HarmonyEngine.createState();
        state.currentMode = fresh.currentMode;
        state.stepIndex = fresh.stepIndex;
        state.currentKey = fresh.currentKey;
        state.currentChord = fresh.currentChord;
        state.chordCount = fresh.chordCount;
        state.cycleIndex = fresh.cycleIndex;
      },
    });
  };

  return Object.freeze({
    create,
  });
});
