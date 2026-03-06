export function createRenderer({ grid, resultDiv, log, counter, info, lab }) {
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

    addLog(text) {
      const li = document.createElement("li");
      li.textContent = text;
      log.prepend(li);
    },

    updateCounter(discoveredCount) {
      counter.textContent = `Discovered ${discoveredCount} elements`;
    },

    hideInfo() {
      info.classList.add("hidden");
    },

    animateDiscovery(durationMs) {
      lab.classList.add("discovery");

      setTimeout(() => {
        lab.classList.remove("discovery");
      }, durationMs);
    },
  };
}
