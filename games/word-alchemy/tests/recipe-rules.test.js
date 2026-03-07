import assert from "node:assert/strict";
import test from "node:test";

import { recipes, starting } from "../js/game/data/recipes.js";
import { findStuckStates } from "../js/game/state/index.js";
import {
  MAX_DISCOVERY_STEPS,
  MIN_REUSABLE_RESULT_RATIO,
  RECIPE_TEST_RULES,
} from "../js/game/data/recipe-rules.js";

function parseRecipes(recipeMap) {
  return Object.entries(recipeMap).map(([key, result]) => {
    const [first, second] = key.split("+");
    return { key, first, second, result };
  });
}

function getReachableElements(startElements, entries) {
  const known = new Set(startElements);
  let changed = true;

  while (changed) {
    changed = false;

    entries.forEach(({ first, second, result }) => {
      if (known.has(first) && known.has(second) && !known.has(result)) {
        known.add(result);
        changed = true;
      }
    });
  }

  return known;
}

function getMinStepsFromStarting(startElements, entries) {
  const distance = new Map();

  startElements.forEach((element) => {
    distance.set(element, 0);
  });

  let changed = true;

  while (changed) {
    changed = false;

    entries.forEach(({ first, second, result }) => {
      const firstDistance = distance.get(first);
      const secondDistance = distance.get(second);

      if (firstDistance == null || secondDistance == null) {
        return;
      }

      const candidate = Math.max(firstDistance, secondDistance) + 1;
      const current = distance.get(result);

      if (current == null || candidate < current) {
        distance.set(result, candidate);
        changed = true;
      }
    });
  }

  return distance;
}

function canonicalPairKey(first, second) {
  return first < second ? `${first}|${second}` : `${second}|${first}`;
}

test("recipe rule catalog is explicit and complete", () => {
  assert.deepEqual(
    RECIPE_TEST_RULES.map((rule) => rule.id),
    ["R01", "R02", "R03", "R04", "R05", "R06"],
  );
});

test("all listed recipe rules pass", () => {
  const entries = parseRecipes(recipes);
  const reachable = getReachableElements(starting, entries);

  const produced = new Set(entries.map((entry) => entry.result));
  const usedAsIngredient = new Set(
    entries.flatMap((entry) => [entry.first, entry.second]),
  );

  // R01: No Self Combination
  const invalidSelfCombos = entries
    .filter((entry) => entry.first === entry.second)
    .map((entry) => entry.key);
  assert.deepEqual(invalidSelfCombos, [], "R01 failed: self-combo recipes found");

  // R02: All Results Reachable
  const unreachable = [...produced].filter((element) => !reachable.has(element));
  assert.deepEqual(unreachable, [], "R02 failed: unreachable elements detected");

  // R03: Canonical Pair Uniqueness
  const byPair = new Map();
  const pairConflicts = [];

  entries.forEach((entry) => {
    const pairKey = canonicalPairKey(entry.first, entry.second);
    const existing = byPair.get(pairKey);

    if (existing && existing.result !== entry.result) {
      pairConflicts.push({
        pair: pairKey,
        firstResult: existing.result,
        secondResult: entry.result,
      });
      return;
    }

    if (!existing) {
      byPair.set(pairKey, entry);
    }
  });

  assert.deepEqual(pairConflicts, [], "R03 failed: canonical pair conflicts found");

  // R04: Reusable Results Ratio
  const reusableCount = [...produced].filter((element) =>
    usedAsIngredient.has(element),
  ).length;
  const reusableRatio = produced.size === 0 ? 1 : reusableCount / produced.size;

  assert.ok(
    reusableRatio >= MIN_REUSABLE_RESULT_RATIO,
    `R04 failed: reusable ratio ${reusableRatio.toFixed(2)} is below ${MIN_REUSABLE_RESULT_RATIO}`,
  );

  // R05: Discovery Depth Limit
  const minSteps = getMinStepsFromStarting(starting, entries);
  const tooDeep = [...produced].filter((element) => {
    const steps = minSteps.get(element);
    return steps == null || steps > MAX_DISCOVERY_STEPS;
  });

  assert.deepEqual(
    tooDeep,
    [],
    `R05 failed: elements exceed ${MAX_DISCOVERY_STEPS} steps or are unreachable`,
  );

  // R06: No Stuck Discovery States
  const stuckStates = findStuckStates(starting, recipes);
  assert.deepEqual(stuckStates, [], "R06 failed: stuck discovery states detected");
});
