export function splitRecipeKey(key) {
  const parts = key.split("+");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid recipe key format: ${key}. Expected 'first+second'.`,
    );
  }

  return parts;
}

export function getAllElements(starting, recipes) {
  const elements = new Set(starting);

  Object.values(recipes).forEach((result) => elements.add(result));

  return elements;
}

export function getReachableElements(starting, recipes) {
  const known = new Set(starting);
  let changed = true;

  while (changed) {
    changed = false;

    Object.entries(recipes).forEach(([key, result]) => {
      const [first, second] = splitRecipeKey(key);

      if (known.has(first) && known.has(second) && !known.has(result)) {
        known.add(result);
        changed = true;
      }
    });
  }

  return known;
}

export function validateRecipes(starting, recipes) {
  const invalidSelfCombos = Object.keys(recipes).filter((key) => {
    const [first, second] = splitRecipeKey(key);
    return first === second;
  });

  if (invalidSelfCombos.length > 0) {
    throw new Error(
      `Invalid self-combination recipes: ${invalidSelfCombos.join(", ")}. Recipes must use two different elements.`,
    );
  }

  const discoverableTargets = getAllElements(starting, recipes);
  const reachable = getReachableElements(starting, recipes);
  const unreachable = [...discoverableTargets].filter(
    (element) => !reachable.has(element),
  );

  if (unreachable.length > 0) {
    throw new Error(
      `Unreachable elements detected: ${unreachable.join(", ")}.`,
    );
  }
}

export function getAvailableDiscoveries(discoveredSet, recipes) {
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
      const key1 = `${first}+${second}`;
      const key2 = `${second}+${first}`;
      const result = recipes[key1] || recipes[key2];

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
  validateRecipes(starting, recipes);

  const allElements = getAllElements(starting, recipes);
  const startState = new Set(starting);
  const queue = [startState];
  const visited = new Set([serializeState(startState)]);
  const stuckStates = [];

  while (queue.length > 0) {
    const current = queue.shift();
    const discoveries = getAvailableDiscoveries(current, recipes);

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
  validateRecipes(starting, recipes);

  const discovered = new Set(starting);
  let selected = [];
  let discoveries = 0;

  function combine(first, second) {
    const key1 = `${first}+${second}`;
    const key2 = `${second}+${first}`;
    const result = recipes[key1] || recipes[key2] || null;

    if (!result) {
      return {
        kind: "combine",
        first,
        second,
        result: null,
        isNew: false,
      };
    }

    const isNew = !discovered.has(result);

    if (isNew) {
      discovered.add(result);
      discoveries += 1;
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

    getDiscoveredCount() {
      return discovered.size;
    },

    getDiscoveryEventsCount() {
      return discoveries;
    },

    getHint() {
      const discoveriesAvailable = getAvailableDiscoveries(discovered, recipes);
      return discoveriesAvailable[0] || null;
    },
  };
}
