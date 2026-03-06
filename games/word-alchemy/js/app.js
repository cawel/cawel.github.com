import { starting, recipes } from "./game/data/recipes.js";
import { createGameState } from "./game/state/index.js";
import { createRenderer } from "./ui/renderer.js";
import { createGameController } from "./game/controller.js";

const timings = {
  DISCOVERY_ANIMATION_MS: 2000,
};

const grid = document.getElementById("elements");
const resultDiv = document.getElementById("result");
const reactionIntro = document.getElementById("reactionIntro");
const log = document.getElementById("log");
const counter = document.getElementById("counter");
const completionRate = document.getElementById("completionRate");
const discoveryStreak = document.getElementById("discoveryStreak");
const bestDiscoveryStreak = document.getElementById("bestDiscoveryStreak");
const hintsUsed = document.getElementById("hintsUsed");
const laboratoryPanel = document.querySelector(".laboratory");

const requiredNodes = {
  elements: grid,
  result: resultDiv,
  reactionIntro,
  log,
  counter,
  completionRate,
  discoveryStreak,
  bestDiscoveryStreak,
  hintsUsed,
  laboratory: laboratoryPanel,
};

const missingIds = Object.entries(requiredNodes)
  .filter(([, node]) => !node)
  .map(([id]) => id);

if (missingIds.length > 0) {
  const message = `UI failed to initialize. Missing DOM nodes: ${missingIds.join(", ")}.`;
  console.error(message);

  const errorBanner = document.createElement("div");
  errorBanner.textContent = message;
  errorBanner.style.margin = "12px";
  errorBanner.style.padding = "10px 12px";
  errorBanner.style.borderRadius = "8px";
  errorBanner.style.background = "#5c1f1f";
  errorBanner.style.color = "#ffd6d6";
  document.body.prepend(errorBanner);

  throw new Error(message);
}

document.documentElement.style.setProperty(
  "--discovery-animation-duration",
  `${timings.DISCOVERY_ANIMATION_MS}ms`,
);

const state = createGameState(starting, recipes);
const renderer = createRenderer({
  grid,
  resultDiv,
  reactionIntro,
  log,
  counter,
  completionRate,
  discoveryStreak,
  bestDiscoveryStreak,
  hintsUsed,
  laboratoryPanel,
});

const controller = createGameController({
  state,
  renderer,
  starting,
  timings,
  failedCombinesBeforeHint: 3,
});

controller.start();
