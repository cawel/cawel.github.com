export const MAX_DISCOVERY_STEPS = 12;
export const MIN_REUSABLE_RESULT_RATIO = 0.65;

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
];
