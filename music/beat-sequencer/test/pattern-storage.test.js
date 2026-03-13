import test from "node:test";
import assert from "node:assert/strict";

import {
  createPatternStorage,
  STORAGE_KEY,
} from "../js/core/pattern-storage.js";

const createMemoryStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
};

test("pattern storage saves and loads valid pattern", () => {
  const storage = createMemoryStorage();
  const patternStorage = createPatternStorage({ storage });

  const saved = patternStorage.savePattern({
    cols: 16,
    octaves: 2,
    tempo: 120,
    grid: [
      ["sine", null],
      [null, "square"],
    ],
  });

  assert.equal(saved, true);
  assert.equal(patternStorage.hasPattern(), true);

  const loaded = patternStorage.loadPattern();
  assert.deepEqual(loaded, {
    cols: 16,
    octaves: 2,
    tempo: 120,
    grid: [
      ["sine", null],
      [null, "square"],
    ],
  });
});

test("pattern storage rejects invalid pattern payloads", () => {
  const storage = createMemoryStorage();
  const patternStorage = createPatternStorage({ storage });

  const saved = patternStorage.savePattern({
    cols: 0,
    octaves: 2,
    tempo: 120,
    grid: [["sine"]],
  });

  assert.equal(saved, false);
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(patternStorage.hasPattern(), false);
});

test("pattern storage returns null for corrupt data", () => {
  const storage = createMemoryStorage();
  storage.setItem(STORAGE_KEY, "{bad-json}");

  const patternStorage = createPatternStorage({ storage });
  assert.equal(patternStorage.hasPattern(), false);
  assert.equal(patternStorage.loadPattern(), null);
});
