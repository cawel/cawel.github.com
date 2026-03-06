import {
  buildRecipeIndex,
  findRecipeResult,
  splitRecipeKey,
} from "./recipe-index.js";

export { splitRecipeKey };

function toRecipeIndex(recipesOrIndex) {
  if (
    recipesOrIndex &&
    typeof recipesOrIndex === "object" &&
    recipesOrIndex.byPair instanceof Map &&
    Array.isArray(recipesOrIndex.entries)
  ) {
    return recipesOrIndex;
  }

  return buildRecipeIndex(recipesOrIndex);
}

export function getAllElements(starting, recipesOrIndex) {
  const recipeIndex = toRecipeIndex(recipesOrIndex);
  const elements = new Set(starting);

  recipeIndex.entries.forEach(({ result }) => elements.add(result));

  return elements;
}

export function getReachableElements(starting, recipesOrIndex) {
  const recipeIndex = toRecipeIndex(recipesOrIndex);
  const known = new Set(starting);
  let changed = true;

  while (changed) {
    changed = false;

    recipeIndex.entries.forEach(({ first, second, result }) => {
      if (known.has(first) && known.has(second) && !known.has(result)) {
        known.add(result);
        changed = true;
      }
    });
  }

  return known;
}

export function validateRecipes(starting, recipesOrIndex) {
  const recipeIndex = toRecipeIndex(recipesOrIndex);

  const invalidSelfCombos = recipeIndex.entries
    .filter(({ first, second }) => first === second)
    .map(({ key }) => key);

  if (invalidSelfCombos.length > 0) {
    throw new Error(
      `Invalid self-combination recipes: ${invalidSelfCombos.join(", ")}. Recipes must use two different elements.`,
    );
  }

  const discoverableTargets = getAllElements(starting, recipeIndex);
  const reachable = getReachableElements(starting, recipeIndex);
  const unreachable = [...discoverableTargets].filter(
    (element) => !reachable.has(element),
  );

  if (unreachable.length > 0) {
    throw new Error(
      `Unreachable elements detected: ${unreachable.join(", ")}.`,
    );
  }
}

export function getAvailableDiscoveries(discoveredSet, recipesOrIndex) {
  const recipeIndex = toRecipeIndex(recipesOrIndex);
  const words = [...discoveredSet];
  const discoveries = [];

  for (let firstIndex = 0; firstIndex < words.length; firstIndex++) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < words.length;
      secondIndex++
    ) {
      const first = words[firstIndex];
      const second = words[secondIndex];
      const result = findRecipeResult(recipeIndex, first, second);

      if (result && !discoveredSet.has(result)) {
        discoveries.push({ first, second, result });
      }
    }
  }

  return discoveries;
}

function serializeState(setValue) {
  return [...setValue].sort().join("|");
}

export function findStuckStates(starting, recipes) {
  const recipeIndex = buildRecipeIndex(recipes);
  validateRecipes(starting, recipeIndex);

  const allElements = getAllElements(starting, recipeIndex);
  const startState = new Set(starting);
  const queue = [startState];
  const visited = new Set([serializeState(startState)]);
  const stuckStates = [];

  while (queue.length > 0) {
    const current = queue.shift();
    const discoveries = getAvailableDiscoveries(current, recipeIndex);

    if (discoveries.length === 0 && current.size < allElements.size) {
      stuckStates.push([...current].sort());
      continue;
    }

    discoveries.forEach((discovery) => {
      const next = new Set(current);
      next.add(discovery.result);
      const key = serializeState(next);

      if (!visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    });
  }

  return stuckStates;
}

export function createGameState(starting, recipes) {
  const recipeIndex = buildRecipeIndex(recipes);
  validateRecipes(starting, recipeIndex);
  const totalElementCount = getAllElements(starting, recipeIndex).size;

  const discovered = new Set(starting);
  let selected = [];
  let discoveries = 0;
  let failedCombines = 0;
  let currentDiscoveryStreak = 0;
  let bestDiscoveryStreak = 0;
  let hintsUsed = 0;

  function combine(first, second) {
    const result = findRecipeResult(recipeIndex, first, second);

    if (!result) {
      failedCombines += 1;
      currentDiscoveryStreak = 0;

      return {
        kind: "combine",
        first,
        second,
        result: null,
        isNew: false,
      };
    }

    const isNew = !discovered.has(result);
    failedCombines = 0;

    if (isNew) {
      discovered.add(result);
      discoveries += 1;
      currentDiscoveryStreak += 1;
      bestDiscoveryStreak = Math.max(
        bestDiscoveryStreak,
        currentDiscoveryStreak,
      );
    } else {
      currentDiscoveryStreak = 0;
    }

    return {
      kind: "combine",
      first,
      second,
      result,
      isNew,
    };
  }

  return {
    select(word) {
      if (!discovered.has(word)) {
        return { kind: "selection" };
      }

      if (selected.includes(word)) {
        selected = selected.filter((item) => item !== word);
        return { kind: "selection" };
      }

      selected.push(word);

      if (selected.length < 2) {
        return { kind: "selection" };
      }

      const [first, second] = selected;
      selected = [];
      return combine(first, second);
    },

    getDiscoveredWords() {
      return [...discovered];
    },

    getSelectedWords() {
      return [...selected];
    },

    getExhaustedPartnersForSelection() {
      if (selected.length !== 1) {
        return [];
      }

      const selectedWord = selected[0];
      const exhaustedPartners = [];

      discovered.forEach((candidate) => {
        if (candidate === selectedWord) {
          return;
        }

        const result = findRecipeResult(recipeIndex, selectedWord, candidate);

        if (result && discovered.has(result)) {
          exhaustedPartners.push(candidate);
        }
      });

      return exhaustedPartners;
    },

    getDiscoveredCount() {
      return discovered.size;
    },

    getTotalElementCount() {
      return totalElementCount;
    },

    getDiscoveryEventsCount() {
      return discoveries;
    },

    getCurrentDiscoveryStreak() {
      return currentDiscoveryStreak;
    },

    getBestDiscoveryStreak() {
      return bestDiscoveryStreak;
    },

    getHintsUsedCount() {
      return hintsUsed;
    },

    getHintForFailure(minFailedCombinesBeforeHint) {
      const hint = this.getHint();

      if (!hint || failedCombines < minFailedCombinesBeforeHint) {
        return null;
      }

      hintsUsed += 1;
      return hint;
    },

    getHint() {
      const discoveriesAvailable = getAvailableDiscoveries(
        discovered,
        recipeIndex,
      );
      return discoveriesAvailable[0] || null;
    },
  };
}
