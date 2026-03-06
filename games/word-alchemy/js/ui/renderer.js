export function createRenderer({
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
}) {
  return {
    renderElements(elements) {
      grid.innerHTML = "";

      elements.forEach((element) => {
        const el = document.createElement("div");
        el.className = "element";

        if (element.isSelected) {
          el.classList.add("selected");
        }

        if (element.isExhausted) {
          el.classList.add("exhausted-partner");
        }

        el.textContent = element.label;
        el.onclick = element.onSelect;
        grid.appendChild(el);
      });
    },

    showCombination(first, second, result) {
      resultDiv.innerHTML = `${first} + ${second}&nbsp;&nbsp;&nbsp;→&nbsp;&nbsp;&nbsp;<b>${result}</b>`;
    },

    showMessage(text) {
      resultDiv.textContent = text;
    },

    showMessageWithHint(text, hintText) {
      resultDiv.innerHTML = `${text}<span class="hint-line">${hintText}</span>`;
    },

    addLog(text) {
      const li = document.createElement("li");
      li.textContent = text;
      log.prepend(li);
    },

    renderStats(stats) {
      counter.textContent = `${stats.discoveredCount} / ${stats.totalCount}`;
      completionRate.textContent = `${stats.completionPercentage}%`;
      discoveryStreak.textContent = `${stats.currentStreak}`;
      bestDiscoveryStreak.textContent = `Best: ${stats.bestStreak}`;
      hintsUsed.textContent = `${stats.hintsUsedCount}`;
    },

    hideReactionIntro() {
      if (reactionIntro) {
        reactionIntro.classList.add("hidden");
      }
    },

    animateDiscovery(durationMs) {
      laboratoryPanel.classList.add("discovery");

      setTimeout(() => {
        laboratoryPanel.classList.remove("discovery");
      }, durationMs);
    },
  };
}
