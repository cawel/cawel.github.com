export const MAX_DISCOVERY_STEPS = 12;
export const MIN_REUSABLE_RESULT_RATIO = 0.65;
export const MAX_SAME_TIER_FAN_IN_PER_RESULT = 1;
export const MAX_FAN_IN_PER_RESULT = 2;
export const MAX_FAN_OUT_PER_INGREDIENT = 8;
export const MAX_REDUNDANT_RECIPE_RATIO = 0.45;

// This is the source-of-truth list of recipe-design rules covered by tests.
export const RECIPE_TEST_RULES = [
  {
    id: "R01",
    title: "No Self Combination",
    description: "A recipe cannot combine the same element with itself.",
  },
  {
    id: "R02",
    title: "All Results Reachable",
    description:
      "Every produced element must be discoverable from the 4 starting elements.",
  },
  {
    id: "R03",
    title: "Canonical Pair Uniqueness",
    description:
      "A canonical ingredient pair can map to only one result (order-independent).",
  },
  {
    id: "R04",
    title: "Reusable Results Ratio",
    description:
      "A healthy portion of produced elements should be reusable as ingredients.",
  },
  {
    id: "R05",
    title: "Discovery Depth Limit",
    description:
      "All produced elements must be discoverable within a bounded number of recipe steps.",
  },
  {
    id: "R06",
    title: "No Stuck Discovery States",
    description:
      "There must be no reachable game state where progress is impossible before all elements are discovered.",
  },
  {
    id: "R07",
    title: "Canonical Pair Key Order",
    description:
      "Every recipe key must store ingredient pairs in canonical lexical order (first < second).",
  },
  {
    id: "R08",
    title: "Same-Tier Fan-In Cap",
    description:
      "A result may not have multiple parent pairs from the same discovery tier.",
  },
  {
    id: "R11",
    title: "Global Fan-In Cap",
    description:
      "A result may be produced by only a limited number of distinct ingredient pairs.",
  },
  {
    id: "R12",
    title: "Ingredient Fan-Out Cap",
    description:
      "Any one ingredient may appear in only a limited number of recipes.",
  },
  {
    id: "R16",
    title: "Redundancy Ratio Cap",
    description:
      "Too many recipes should not be redundant relative to shortest-path discovery.",
  },
];
