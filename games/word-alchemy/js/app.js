import { starting, recipes } from "./recipes.js";
import { createGameState } from "./state.js";
import { createRenderer } from "./render.js";

const timings = {
  DISCOVERY_ANIMATION_MS: 2000,
};

const FAILED_COMBINES_BEFORE_HINT = 3;
const NO_EFFECT_MESSAGES = [
  "The potion yawns and goes back to sleep.",
  "The lab politely declines this experiment.",
  "Science looked at that and took a coffee break.",
  "Your beakers made eye contact and did nothing.",
  "A dramatic fizz was scheduled, then canceled.",
  "The universe says: nice try, alchemist.",
  "The ingredients filed a motion to remain separate.",
  "A tiny goblin shook its head and vanished.",
  "That combo has the charisma of wet cardboard.",
  "Your reaction produced premium-grade disappointment.",
];

const grid = document.getElementById("elements");
const resultDiv = document.getElementById("result");
const reactionIntro = document.getElementById("reactionIntro");
const log = document.getElementById("log");
const counter = document.getElementById("counter");
const completionRate = document.getElementById("completionRate");
const discoveryStreak = document.getElementById("discoveryStreak");
const bestDiscoveryStreak = document.getElementById("bestDiscoveryStreak");
const hintsUsed = document.getElementById("hintsUsed");
const lab = document.querySelector(".laboratory");

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
  lab,
});
let failedCombines = 0;
let currentDiscoveryStreak = 0;
let bestStreakReached = 0;
let usedHintsCount = 0;
const totalElementCount = state.getTotalElementCount();

function updateProgress() {
  const discoveredCount = state.getDiscoveredCount();
  const completionPercentage = Math.round(
    (discoveredCount / totalElementCount) * 100,
  );

  renderer.updateCounter(discoveredCount, totalElementCount);
  renderer.updateCompletion(completionPercentage);
  renderer.updateDiscoveryStreak(currentDiscoveryStreak);
  renderer.updateBestDiscoveryStreak(bestStreakReached);
  renderer.updateHintsUsed(usedHintsCount);
}

function getRandomNoEffectMessage() {
  const randomIndex = Math.floor(Math.random() * NO_EFFECT_MESSAGES.length);
  return NO_EFFECT_MESSAGES[randomIndex];
}

function refreshElements() {
  renderer.renderElements(
    state.getDiscoveredWords(),
    state.getSelectedWords(),
    state.getExhaustedPartnersForSelection(),
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
    failedCombines = 0;
    renderer.showCombination(outcome.first, outcome.second, outcome.result);

    if (outcome.isNew) {
      currentDiscoveryStreak += 1;
      bestStreakReached = Math.max(bestStreakReached, currentDiscoveryStreak);
      renderer.hideReactionIntro();
      renderer.animateDiscovery(timings.DISCOVERY_ANIMATION_MS);
      renderer.addLog(
        `${outcome.first} + ${outcome.second} → ${outcome.result}`,
      );
      updateProgress();
    } else {
      currentDiscoveryStreak = 0;
      updateProgress();
    }
  } else {
    failedCombines += 1;
    currentDiscoveryStreak = 0;
    const hint = state.getHint();
    const noEffectMessage = getRandomNoEffectMessage();

    if (hint && failedCombines >= FAILED_COMBINES_BEFORE_HINT) {
      usedHintsCount += 1;
      renderer.showMessageWithHint(
        noEffectMessage,
        `Hint: try ${hint.first} + ${hint.second}.`,
      );
      updateProgress();
    } else if (hint) {
      renderer.showMessage(noEffectMessage);
      updateProgress();
    } else {
      renderer.showMessage(
        `${noEffectMessage} No new combinations are currently possible with discovered elements.`,
      );
      updateProgress();
    }
  }

  refreshElements();
}

starting.forEach((word) => {
  renderer.addLog(`${word} (starting element)`);
});

updateProgress();
refreshElements();
