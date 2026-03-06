import assert from "node:assert/strict";
import test from "node:test";

import { createGameState } from "../js/game/state/index.js";

function combine(state, first, second) {
  state.select(first);
  return state.select(second);
}

test("state metrics track streak progression and reset rules", () => {
  const starting = ["a", "b", "c"];
  const recipes = {
    "a+b": "x",
    "b+c": "y",
  };
  const state = createGameState(starting, recipes);

  combine(state, "a", "b");
  assert.equal(state.getCurrentDiscoveryStreak(), 1);
  assert.equal(state.getBestDiscoveryStreak(), 1);

  combine(state, "b", "c");
  assert.equal(state.getCurrentDiscoveryStreak(), 2);
  assert.equal(state.getBestDiscoveryStreak(), 2);

  combine(state, "a", "b");
  assert.equal(state.getCurrentDiscoveryStreak(), 0);
  assert.equal(state.getBestDiscoveryStreak(), 2);

  combine(state, "a", "c");
  assert.equal(state.getCurrentDiscoveryStreak(), 0);
  assert.equal(state.getBestDiscoveryStreak(), 2);
});

test("hint threshold is enforced and hint usage increments only when shown", () => {
  const starting = ["a", "b", "c"];
  const recipes = {
    "a+b": "x",
  };
  const state = createGameState(starting, recipes);

  assert.equal(state.getHintForFailure(2), null);
  assert.equal(state.getHintsUsedCount(), 0);

  combine(state, "a", "c");
  assert.equal(state.getHintForFailure(2), null);
  assert.equal(state.getHintsUsedCount(), 0);

  combine(state, "b", "c");
  const hintAtThreshold = state.getHintForFailure(2);
  assert.deepEqual(hintAtThreshold, { first: "a", second: "b", result: "x" });
  assert.equal(state.getHintsUsedCount(), 1);

  combine(state, "a", "b");
  combine(state, "a", "c");
  assert.equal(state.getHintForFailure(2), null);
  assert.equal(state.getHintsUsedCount(), 1);
});

test("exhausted partners are empty without a single valid selection", () => {
  const starting = ["a", "b", "c"];
  const recipes = {
    "a+b": "x",
  };
  const state = createGameState(starting, recipes);

  assert.deepEqual(state.getExhaustedPartnersForSelection(), []);

  state.select("x");
  assert.deepEqual(state.getExhaustedPartnersForSelection(), []);

  state.select("a");
  state.select("a");
  assert.deepEqual(state.getExhaustedPartnersForSelection(), []);
});

test("exhausted partners include only discovered-result recipes", () => {
  const starting = ["a", "b", "c"];
  const recipes = {
    "a+b": "x",
    "a+c": "y",
  };
  const state = createGameState(starting, recipes);

  state.select("a");
  assert.deepEqual(state.getExhaustedPartnersForSelection(), []);
  state.select("a");

  combine(state, "a", "b");

  state.select("a");
  assert.deepEqual(state.getExhaustedPartnersForSelection(), ["b"]);
  state.select("a");

  combine(state, "a", "c");

  state.select("a");
  assert.deepEqual(state.getExhaustedPartnersForSelection().sort(), ["b", "c"]);
});
