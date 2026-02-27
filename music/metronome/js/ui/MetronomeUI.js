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
    const bpmValue = document.getElementById("bpmValue");
    const minus10Btn = document.getElementById("minus10Btn");
    const minusBtn = document.getElementById("minusBtn");
    const plusBtn = document.getElementById("plusBtn");
    const plus10Btn = document.getElementById("plus10Btn");

    const playBtn = document.getElementById("playBtn");
    const stopBtn = document.getElementById("stopBtn");

    const dots = Array.from(document.querySelectorAll(".dot"));

    if (
      !bpmValue ||
      !minus10Btn || !minusBtn || !plusBtn || !plus10Btn ||
      !playBtn || !stopBtn ||
      dots.length !== 4
    ) {
      throw new Error("UI: missing required DOM elements.");
    }

    this.#dom = {
      bpmValue,
      minus10Btn,
      minusBtn,
      plusBtn,
      plus10Btn,
      playBtn,
      stopBtn,
    };

    this.#dots = dots;
  }

  onMinus10(handler) { this.#dom.minus10Btn.addEventListener("click", handler); }
  onMinus(handler)   { this.#dom.minusBtn.addEventListener("click", handler); }
  onPlus(handler)    { this.#dom.plusBtn.addEventListener("click", handler); }
  onPlus10(handler)  { this.#dom.plus10Btn.addEventListener("click", handler); }

  onPlay(handler) { this.#dom.playBtn.addEventListener("click", handler); }
  onStop(handler) { this.#dom.stopBtn.addEventListener("click", handler); }

  setBpm(bpm) {
    this.#dom.bpmValue.textContent = String(bpm);
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
