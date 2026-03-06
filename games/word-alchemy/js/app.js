import { starting, recipes } from "./recipes.js";
import { createGameState } from "./state.js";
import { createRenderer } from "./render.js";

const timings = {
  INFO_FADE_DURATION_MS: 1000,
  DISCOVERY_ANIMATION_MS: 2000,
};

const grid = document.getElementById("elements");
const resultDiv = document.getElementById("result");
const log = document.getElementById("log");
const counter = document.getElementById("counter");
const info = document.getElementById("infoBox");
const lab = document.querySelector(".laboratory");

const requiredNodes = {
  elements: grid,
  result: resultDiv,
  log,
  counter,
  infoBox: info,
  laboratory: lab,
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
  "--info-fade-duration",
  `${timings.INFO_FADE_DURATION_MS}ms`,
);
document.documentElement.style.setProperty(
  "--discovery-animation-duration",
  `${timings.DISCOVERY_ANIMATION_MS}ms`,
);

const state = createGameState(starting, recipes);
const renderer = createRenderer({ grid, resultDiv, log, counter, info, lab });

function refreshElements() {
  renderer.renderElements(
    state.getDiscoveredWords(),
    state.getSelectedWords(),
    onSelectElement,
  );
}

function onSelectElement(word) {
  const outcome = state.select(word);

  if (outcome.kind !== "combine") {
    refreshElements();
    return;
  }

  if (outcome.result) {
    renderer.showCombination(outcome.first, outcome.second, outcome.result);

    if (outcome.isNew) {
      renderer.animateDiscovery(timings.DISCOVERY_ANIMATION_MS);
      renderer.addLog(
        `${outcome.first} + ${outcome.second} → ${outcome.result}`,
      );
      renderer.updateCounter(state.getDiscoveredCount());

      if (state.getDiscoveryEventsCount() >= 2) {
        renderer.hideInfo();
      }
    }
  } else {
    const hint = state.getHint();

    if (hint) {
      renderer.showMessage(
        `Nothing happens. Hint: try ${hint.first} + ${hint.second}.`,
      );
    } else {
      renderer.showMessage(
        "Nothing happens. No new combinations are currently possible with discovered elements.",
      );
    }
  }

  refreshElements();
}

starting.forEach((word) => {
  renderer.addLog(`${word} (starting element)`);
});

renderer.updateCounter(state.getDiscoveredCount());
refreshElements();
