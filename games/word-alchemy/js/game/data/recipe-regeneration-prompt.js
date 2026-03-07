import { starting } from "./recipes.js";
import {
  MAX_FAN_IN_PER_RESULT,
  MAX_FAN_OUT_PER_INGREDIENT,
  MAX_DISCOVERY_STEPS,
  MAX_REDUNDANT_RECIPE_RATIO,
  MAX_SAME_TIER_FAN_IN_PER_RESULT,
  MIN_REUSABLE_RESULT_RATIO,
  RECIPE_TEST_RULES,
} from "./recipe-rules.js";

function formatRuleLine(rule) {
  return `- ${rule.id} (${rule.title}): ${rule.description}`;
}

/**
 * Builds a reusable prompt for an LLM to regenerate the recipes list.
 * The prompt is derived from live rule metadata so it stays in sync with tests.
 */
export function buildRecipeRegenerationPrompt(options = {}) {
  const startElements = options.startingElements ?? starting;
  const ruleLines = RECIPE_TEST_RULES.map(formatRuleLine).join("\n");
  const extraConstraints = options.extraConstraints ?? [];
  const extraConstraintLines = extraConstraints
    .map((line) => `- ${line}`)
    .join("\n");

  return `You are redesigning the recipe graph for the Word Alchemy game.

Goal priority:
1. Maximize intuition for human players.
2. Satisfy all hard validation rules.
3. Keep progression rich and interesting.

Starting elements (must remain exactly these 4 and must not be changed):
${JSON.stringify(startElements)}

Hard rules that MUST be satisfied:
${ruleLines}

Numeric rule thresholds:
- Discovery depth limit (R05): <= ${MAX_DISCOVERY_STEPS} steps from starting elements for every produced element.
- Reusable results ratio (R04): >= ${MIN_REUSABLE_RESULT_RATIO}.
- Same-tier fan-in cap (R08): <= ${MAX_SAME_TIER_FAN_IN_PER_RESULT} pair(s) per result per tier.
- Global fan-in cap (R11): <= ${MAX_FAN_IN_PER_RESULT} pair(s) per result.
- Ingredient fan-out cap (R12): <= ${MAX_FAN_OUT_PER_INGREDIENT} usages per ingredient.
- Redundancy ratio cap (R16): <= ${MAX_REDUNDANT_RECIPE_RATIO}.

Intuition requirements (critical):
- Prefer cause-and-effect combinations that feel obvious in the real world.
- Avoid symbolic or "magic" jumps (for example: abstract concept from unrelated physical ingredients).
- Use clear intermediate concepts before advanced social/technology concepts.
- Keep recipes guessable: a player should often be able to infer outcomes without trial-and-error.

Implementation/output requirements:
- Output only JavaScript code for: export const recipes = { ... };
- Keep key format exactly "first+second": "result".
- Do not include self combinations (x+x).
- Do not create canonical pair conflicts (a+b and b+a mapping to different results).
- Do not modify the starting elements declaration.
- Include short section comments inside the recipes object to keep it readable.

Self-check before final answer:
- Ensure every produced element is reachable from starting elements.
- Ensure there are no stuck discovery states before full completion.
- Ensure the graph is intuitive end-to-end, not just valid.
${extraConstraintLines ? `\nAdditional constraints:\n${extraConstraintLines}` : ""}
`;
}

export const RECIPE_REGENERATION_PROMPT = buildRecipeRegenerationPrompt();
