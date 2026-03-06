import {
  formatHintText,
  NO_DISCOVERIES_LEFT_MESSAGE,
  NO_EFFECT_MESSAGES,
} from "../content/messages.js";

export function createGameController({
  state,
  renderer,
  starting,
  timings,
  failedCombinesBeforeHint = 3,
  noEffectMessages = NO_EFFECT_MESSAGES,
}) {
  function updateProgress() {
    renderer.renderStats(state.getStats());
  }

  function getRandomNoEffectMessage() {
    const source =
      noEffectMessages.length > 0 ? noEffectMessages : NO_EFFECT_MESSAGES;
    const randomIndex = Math.floor(Math.random() * source.length);
    return source[randomIndex];
  }

  function refreshElements() {
    const elementViewModels = state.getElementViewState();

    renderer.renderElements(elementViewModels, onSelectElement);
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
        renderer.hideReactionIntro();
        renderer.animateDiscovery(timings.DISCOVERY_ANIMATION_MS);
        renderer.addLog(
          `${outcome.first} + ${outcome.second} → ${outcome.result}`,
        );
      }

      updateProgress();
      refreshElements();
      return;
    }

    const hint = state.getHintForFailure(failedCombinesBeforeHint);
    const noEffectMessage = getRandomNoEffectMessage();

    if (hint) {
      renderer.showMessageWithHint(noEffectMessage, formatHintText(hint));
    } else if (state.getHint()) {
      renderer.showMessage(noEffectMessage);
    } else {
      renderer.showMessage(`${noEffectMessage} ${NO_DISCOVERIES_LEFT_MESSAGE}`);
    }

    updateProgress();
    refreshElements();
  }

  function start() {
    starting.forEach((word) => {
      renderer.addLog(`${word} (starting element)`);
    });

    updateProgress();
    refreshElements();
  }

  return { start };
}
