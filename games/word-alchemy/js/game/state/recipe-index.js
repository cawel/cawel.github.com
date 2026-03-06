export function splitRecipeKey(key) {
  const parts = key.split("+");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid recipe key format: ${key}. Expected 'first+second'.`,
    );
  }

  return parts;
}

export function canonicalPairKey(first, second) {
  return first < second ? `${first}|${second}` : `${second}|${first}`;
}

export function buildRecipeIndex(recipes) {
  const byPair = new Map();
  const entries = [];

  Object.entries(recipes).forEach(([key, result]) => {
    const [first, second] = splitRecipeKey(key);
    const pairKey = canonicalPairKey(first, second);
    const existing = byPair.get(pairKey);

    if (existing && existing.result !== result) {
      throw new Error(
        `Conflicting recipes for pair '${first}+${second}': '${existing.result}' vs '${result}'.`,
      );
    }

    if (!existing) {
      byPair.set(pairKey, { first, second, result, key });
    }

    entries.push({ key, first, second, result, pairKey });
  });

  return { byPair, entries };
}

export function findRecipeResult(recipeIndex, first, second) {
  const recipe = recipeIndex.byPair.get(canonicalPairKey(first, second));
  return recipe ? recipe.result : null;
}
