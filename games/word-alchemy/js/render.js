export function createRenderer({ grid, resultDiv, log, counter, info, lab }) {
  return {
    renderElements(words, selectedWords, onSelect) {
      grid.innerHTML = "";

      words.forEach((word) => {
        const el = document.createElement("div");
        el.className = "element";

        if (selectedWords.includes(word)) {
          el.classList.add("selected");
        }

        el.textContent = word;
        el.onclick = () => onSelect(word);
        grid.appendChild(el);
      });
    },

    showCombination(first, second, result) {
      resultDiv.innerHTML = `${first} + ${second} → <b>${result}</b>`;
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
