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
  const elementNodesByLabel = new Map();
  let hasBoundGridClick = false;
  let discoveryTimeoutId = null;

  function bindGridClick(onSelectElement) {
    if (hasBoundGridClick) {
      return;
    }

    grid.addEventListener("click", (event) => {
      const elementNode = event.target.closest(".element");
      if (!elementNode || !grid.contains(elementNode)) {
        return;
      }

      if (elementNode.classList.contains("exhausted-partner")) {
        return;
      }

      const label = elementNode.dataset.label;
      if (label) {
        onSelectElement(label);
      }
    });

    hasBoundGridClick = true;
  }

  return {
    renderElements(elements, onSelectElement) {
      bindGridClick(onSelectElement);
      const fragment = document.createDocumentFragment();
      const activeLabels = new Set();

      elements.forEach((element) => {
        const label = element.label;
        activeLabels.add(label);

        let el = elementNodesByLabel.get(label);
        if (!el) {
          el = document.createElement("div");
          el.className = "element";
          el.dataset.label = label;
          el.textContent = label;
          elementNodesByLabel.set(label, el);
        }

        el.classList.toggle("selected", Boolean(element.isSelected));
        el.classList.toggle("exhausted-partner", Boolean(element.isExhausted));
        fragment.appendChild(el);
      });

      elementNodesByLabel.forEach((node, label) => {
        if (!activeLabels.has(label)) {
          elementNodesByLabel.delete(label);
          node.remove();
        }
      });

      grid.replaceChildren(fragment);
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

      const maxEntries = 120;
      while (log.children.length > maxEntries) {
        log.removeChild(log.lastElementChild);
      }
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
      if (durationMs <= 0) {
        return;
      }

      if (discoveryTimeoutId !== null) {
        clearTimeout(discoveryTimeoutId);
      }

      laboratoryPanel.classList.remove("discovery");
      // Force reflow so rapid discoveries replay the highlight animation.
      void laboratoryPanel.offsetWidth;
      laboratoryPanel.classList.add("discovery");

      discoveryTimeoutId = setTimeout(() => {
        laboratoryPanel.classList.remove("discovery");
        discoveryTimeoutId = null;
      }, durationMs);
    },
  };
}
