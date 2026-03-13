"use strict";

/**
 * Module: Pattern Storage
 *
 * Small localStorage adapter for persisting/restoring sequencer patterns.
 */

const STORAGE_KEY = "beat-sequencer.pattern.v1";
const STORAGE_VERSION = 1;

const isPositiveInteger = (n) => Number.isInteger(n) && n > 0;

const isValidGrid = (grid) =>
  Array.isArray(grid) &&
  grid.every(
    (row) => Array.isArray(row) && row.every((cell) => cell == null || typeof cell === "string"),
  );

const isValidPattern = (pattern) => {
  if (!pattern || typeof pattern !== "object") return false;
  if (pattern.version !== STORAGE_VERSION) return false;
  if (!isPositiveInteger(pattern.cols)) return false;
  if (!isPositiveInteger(pattern.octaves)) return false;
  if (typeof pattern.tempo !== "number" || !Number.isFinite(pattern.tempo) || pattern.tempo <= 0) {
    return false;
  }
  if (!isValidGrid(pattern.grid)) return false;
  return true;
};

export function createPatternStorage({ storage }) {
  const savePattern = ({ cols, octaves, tempo, grid }) => {
    const pattern = {
      version: STORAGE_VERSION,
      cols,
      octaves,
      tempo,
      grid,
    };

    if (!isValidPattern(pattern)) return false;

    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(pattern));
      return true;
    } catch {
      return false;
    }
  };

  const loadPattern = () => {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!isValidPattern(parsed)) return null;

      return {
        cols: parsed.cols,
        octaves: parsed.octaves,
        tempo: parsed.tempo,
        grid: parsed.grid,
      };
    } catch {
      return null;
    }
  };

  const hasPattern = () => loadPattern() != null;

  return {
    savePattern,
    loadPattern,
    hasPattern,
  };
}

export { STORAGE_KEY, STORAGE_VERSION };
