export function createRenderer({
  grid,
  resultDiv,
  reactionIntro,
  log,
  counter,
  completionRate,
  lab,
}) {
  return {
    renderElements(words, selectedWords, exhaustedPartners, onSelect) {
      const hasSingleSelection = selectedWords.length === 1;
      const selectedWord = selectedWords[0];
      const exhaustedSet = new Set(exhaustedPartners);

      grid.innerHTML = "";

      words.forEach((word) => {
        const el = document.createElement("div");
        el.className = "element";

        if (selectedWords.includes(word)) {
          el.classList.add("selected");
        }

        if (hasSingleSelection && word !== selectedWord && exhaustedSet.has(word)) {
          el.classList.add("exhausted-partner");
        }

        el.textContent = word;
        el.onclick = () => onSelect(word);
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

    updateCounter(discoveredCount, totalCount) {
      counter.textContent = `${discoveredCount} / ${totalCount}`;
    },

    updateCompletion(percentage) {
      completionRate.textContent = `${percentage}%`;
    },

    hideReactionIntro() {
      if (reactionIntro) {
        reactionIntro.classList.add("hidden");
      }
    },

    animateDiscovery(durationMs) {
      lab.classList.add("discovery");

      setTimeout(() => {
        lab.classList.remove("discovery");
      }, durationMs);
    },
  };
}
