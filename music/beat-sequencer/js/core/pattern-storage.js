"use strict";

/**
 * Module: Pattern Storage
 *
 * Small localStorage adapter for persisting/restoring sequencer patterns.
 */

const STORAGE_KEY = "beat-sequencer.v1";
const STORAGE_VERSION = 1;

const isPositiveInteger = (n) => Number.isInteger(n) && n > 0;

const isValidGrid = (grid) =>
  Array.isArray(grid) &&
  grid.every(
    (row) =>
      Array.isArray(row) &&
      row.every((cell) => cell == null || typeof cell === "string"),
  );

const isValidPattern = (pattern) => {
  if (!pattern || typeof pattern !== "object") return false;
  if (pattern.version !== STORAGE_VERSION) return false;
  if (!isPositiveInteger(pattern.cols)) return false;
  if (!isPositiveInteger(pattern.octaves)) return false;
  if (
    typeof pattern.tempo !== "number" ||
    !Number.isFinite(pattern.tempo) ||
    pattern.tempo <= 0
  ) {
    return false;
  }
  if (!isValidGrid(pattern.grid)) return false;
  return true;
};

const normalizePattern = (pattern) => {
  if (!pattern || typeof pattern !== "object") return null;

  const candidate = {
    version: STORAGE_VERSION,
    cols: pattern.cols,
    octaves: pattern.octaves,
    tempo: pattern.tempo,
    grid: pattern.grid,
  };

  if (!isValidPattern(candidate)) return null;
  return {
    cols: candidate.cols,
    octaves: candidate.octaves,
    tempo: candidate.tempo,
    grid: candidate.grid,
  };
};

const arePatternsEqual = (a, b) => {
  if (!a || !b) return false;
  if (a.cols !== b.cols || a.octaves !== b.octaves || a.tempo !== b.tempo) {
    return false;
  }
  if (a.grid.length !== b.grid.length) return false;

  for (let row = 0; row < a.grid.length; row++) {
    const rowA = a.grid[row];
    const rowB = b.grid[row];
    if (!Array.isArray(rowA) || !Array.isArray(rowB)) return false;
    if (rowA.length !== rowB.length) return false;

    for (let col = 0; col < rowA.length; col++) {
      if (rowA[col] !== rowB[col]) return false;
    }
  }

  return true;
};

const clonePattern = (pattern) => ({
  cols: pattern.cols,
  octaves: pattern.octaves,
  tempo: pattern.tempo,
  grid: pattern.grid.map((row) => row.slice()),
});

export function createPatternStorage({ storage }) {
  let cachedPattern = undefined;

  const readStoredPattern = () => {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      return normalizePattern(parsed);
    } catch {
      return null;
    }
  };

  const ensureCache = () => {
    if (cachedPattern !== undefined) return;
    cachedPattern = readStoredPattern();
  };

  const savePattern = ({ cols, octaves, tempo, grid }) => {
    const pattern = normalizePattern({ cols, octaves, tempo, grid });
    if (!pattern) return false;

    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(pattern));
      cachedPattern = clonePattern(pattern);
      return true;
    } catch {
      return false;
    }
  };

  const loadPattern = () => {
    ensureCache();
    return cachedPattern ? clonePattern(cachedPattern) : null;
  };

  const hasPattern = () => loadPattern() != null;

  const matchesStoredPattern = (pattern) => {
    ensureCache();
    const normalized = normalizePattern(pattern);
    if (!normalized) return false;

    if (!cachedPattern) return false;

    return arePatternsEqual(normalized, cachedPattern);
  };

  return {
    savePattern,
    loadPattern,
    hasPattern,
    matchesStoredPattern,
  };
}

export { STORAGE_KEY, STORAGE_VERSION };
