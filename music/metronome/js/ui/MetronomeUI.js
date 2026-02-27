/**
 * MetronomeUI
 * -----------
 * Presentation layer for the Metronome App.
 *
 * PURPOSE
 * -------
 * Encapsulates all DOM interaction and visual updates.
 * This module is strictly responsible for:
 *
 * - Rendering BPM values
 * - Managing button event bindings
 * - Updating beat indicator dots
 * - Reflecting running/stopped state in the UI
 *
 * It does NOT:
 * - Generate audio
 * - Manage timing
 * - Contain business logic
 *
 * ARCHITECTURE ROLE
 * -----------------
 * main.js  ──►  MetronomeUI
 *
 * - main.js wires event handlers to UI callbacks
 * - UI emits user intent via provided listeners
 * - Engine drives visual beat updates through setActiveDot()
 *
 * DESIGN PRINCIPLES
 * -----------------
 * - No global variables
 * - No direct knowledge of AudioContext or timing logic
 * - DOM elements resolved once in constructor
 * - Public methods expose controlled state updates
 * - Idempotent visual updates (safe repeated calls)
 *
 * BEAT INDICATOR MODEL
 * --------------------
 * - Four-dot visual representation (0..3)
 * - Only one dot active at a time
 * - setActiveDot(index) handles activation
 * - resetDots() clears state safely
 *
 * ACCESSIBILITY NOTES
 * -------------------
 * - BPM value uses aria-live for screen reader updates
 * - Buttons use aria-label attributes
 * - Running state disables Play/Stop appropriately
 */

export class MetronomeUI {
  #dom;
  #dots;
  #activeIdx = -1;

  constructor() {
    const bpmNumber = document.getElementById("bpmNumber");
    const bpmMinus10 = document.getElementById("bpmMinus10");
    const bpmMinus = document.getElementById("bpmMinus");
    const bpmPlus = document.getElementById("bpmPlus");
    const bpmPlus10 = document.getElementById("bpmPlus10");
    const playBtn = document.getElementById("playBtn");
    const stopBtn = document.getElementById("stopBtn");
    const dots = Array.from(document.querySelectorAll(".dot"));

    if (
      !bpmNumber ||
      !bpmMinus10 || !bpmMinus || !bpmPlus || !bpmPlus10 ||
      !playBtn || !stopBtn ||
      dots.length !== 4
    ) {
      throw new Error("UI: missing required DOM elements.");
    }

    this.#dom = { bpmNumber, bpmMinus10, bpmMinus, bpmPlus, bpmPlus10, playBtn, stopBtn };
    this.#dots = dots;
  }

  onMinus10(handler) { this.#dom.bpmMinus10.addEventListener("click", handler); }
  onMinus(handler)   { this.#dom.bpmMinus.addEventListener("click", handler); }
  onPlus(handler)    { this.#dom.bpmPlus.addEventListener("click", handler); }
  onPlus10(handler)  { this.#dom.bpmPlus10.addEventListener("click", handler); }

  onPlay(handler) { this.#dom.playBtn.addEventListener("click", handler); }
  onStop(handler) { this.#dom.stopBtn.addEventListener("click", handler); }

  setBpm(bpm) {
    this.#dom.bpmNumber.textContent = String(bpm);
  }

  setRunning(isRunning) {
    this.#dom.playBtn.disabled = isRunning;
    this.#dom.stopBtn.disabled = !isRunning;
  }

  setActiveDot(idx) {
    if (idx === this.#activeIdx) return;
    for (let i = 0; i < this.#dots.length; i++) {
      this.#dots[i].classList.toggle("is-active", i === idx);
    }
    this.#activeIdx = idx;
  }

  resetDots() {
    for (const d of this.#dots) d.classList.remove("is-active");
    this.#activeIdx = -1;
  }
}
