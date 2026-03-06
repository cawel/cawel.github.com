import assert from "node:assert/strict";
import test from "node:test";

import { recipes, starting } from "../js/recipes.js";
import { findStuckStates, validateRecipes } from "../js/state.js";

test("recipes are valid for gameplay", () => {
  assert.doesNotThrow(() => validateRecipes(starting, recipes));
});

test("all reachable discovery branches avoid stuck states", () => {
  const stuckStates = findStuckStates(starting, recipes);
  assert.equal(
    stuckStates.length,
    0,
    `Found stuck states: ${JSON.stringify(stuckStates)}`,
  );
});
