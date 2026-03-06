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
  const totalElementCount = state.getTotalElementCount();

  function updateProgress() {
    const discoveredCount = state.getDiscoveredCount();
    const completionPercentage = Math.round(
      (discoveredCount / totalElementCount) * 100,
    );

    renderer.renderStats({
      discoveredCount,
      totalCount: totalElementCount,
      completionPercentage,
      currentStreak: state.getCurrentDiscoveryStreak(),
      bestStreak: state.getBestDiscoveryStreak(),
      hintsUsedCount: state.getHintsUsedCount(),
    });
  }

  function getRandomNoEffectMessage() {
    const source =
      noEffectMessages.length > 0 ? noEffectMessages : NO_EFFECT_MESSAGES;
    const randomIndex = Math.floor(Math.random() * source.length);
    return source[randomIndex];
  }

  function refreshElements() {
    const words = state.getDiscoveredWords();
    const selectedWords = state.getSelectedWords();
    const selectedSet = new Set(selectedWords);
    const exhaustedSet = new Set(state.getExhaustedPartnersForSelection());
    const hasSingleSelection = selectedWords.length === 1;
    const selectedWord = selectedWords[0] || null;

    const elementViewModels = words.map((word) => ({
      label: word,
      isSelected: selectedSet.has(word),
      isExhausted:
        hasSingleSelection && word !== selectedWord && exhaustedSet.has(word),
      onSelect: () => onSelectElement(word),
    }));

    renderer.renderElements(elementViewModels);
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
