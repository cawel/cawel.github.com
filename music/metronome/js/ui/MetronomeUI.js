/**
 * MetronomeUI
 * -----------
 * Presentation layer for the Metronome App.
 *
 * PURPOSE
 * -------
 * Encapsulates all DOM interaction and visual rendering.
 * This module is strictly responsible for:
 *
 * - Rendering BPM values
 * - Rendering Beats-per-bar values (2–6)
 * - Managing button event bindings (BPM, Beats, Transport)
 * - Dynamically creating and updating beat indicator dots
 * - Reflecting running/stopped state in the UI
 *
 * It does NOT:
 * - Generate audio
 * - Manage timing or scheduling
 * - Contain business logic
 *
 * ARCHITECTURE ROLE
 * -----------------
 * main.js  ──►  MetronomeUI
 *
 * - main.js wires event handlers to UI callbacks.
 * - UI emits user intent via registered listeners.
 * - Engine drives visual beat updates via setActiveDot().
 *
 * DESIGN PRINCIPLES
 * -----------------
 * - No global variables
 * - No direct knowledge of AudioContext or scheduler logic
 * - DOM elements resolved once in constructor
 * - Public methods expose controlled state updates
 * - Idempotent visual updates (safe repeated calls)
 * - Rendering is deterministic and side-effect free
 *
 * BEAT INDICATOR MODEL
 * --------------------
 * - Beat count is dynamic (2–6)
 * - Dots are re-rendered whenever beats change
 * - First dot represents the accented beat
 * - Only one dot may be active at a time
 * - setActiveDot(index) handles activation
 * - resetDots() clears visual state safely
 *
 * STATE BOUNDARIES
 * ----------------
 * - UI does not track time progression.
 * - UI does not schedule animations.
 * - UI reacts only to explicit state updates from main.js.
 *
 * ACCESSIBILITY NOTES
 * -------------------
 * - BPM and Beats values use aria-live for screen reader updates
 * - Buttons use aria-label attributes
 * - Running state disables Play/Stop appropriately
 *
 */

export class MetronomeUI {
  #dom;
  #dots = [];
  #activeIdx = -1;

  constructor() {
    // BPM controls
    const bpmValue = document.getElementById("bpmValue");
    const minus10Btn = document.getElementById("minus10Btn");
    const minusBtn = document.getElementById("minusBtn");
    const plusBtn = document.getElementById("plusBtn");
    const plus10Btn = document.getElementById("plus10Btn");

    // Beats controls
    const beatsValue = document.getElementById("beatsValue");
    const beatsMinusBtn = document.getElementById("beatsMinusBtn");
    const beatsPlusBtn = document.getElementById("beatsPlusBtn");

    // Transport
    const playBtn = document.getElementById("playBtn");
    const stopBtn = document.getElementById("stopBtn");

    // Dots container (must exist)
    const dotsEl = document.querySelector(".dots");

    if (
      !bpmValue ||
      !minus10Btn || !minusBtn || !plusBtn || !plus10Btn ||
      !beatsValue || !beatsMinusBtn || !beatsPlusBtn ||
      !playBtn || !stopBtn ||
      !dotsEl
    ) {
      throw new Error("UI: missing required DOM elements.");
    }

    this.#dom = {
      bpmValue,
      minus10Btn,
      minusBtn,
      plusBtn,
      plus10Btn,

      beatsValue,
      beatsMinusBtn,
      beatsPlusBtn,

      playBtn,
      stopBtn,

      dotsEl,
    };

    // Initial states
    this.setRunning(false);
  }

  /* ---------------------------
     Wiring
  --------------------------- */
  onMinus10(handler) { this.#dom.minus10Btn.addEventListener("click", handler); }
  onMinus(handler)   { this.#dom.minusBtn.addEventListener("click", handler); }
  onPlus(handler)    { this.#dom.plusBtn.addEventListener("click", handler); }
  onPlus10(handler)  { this.#dom.plus10Btn.addEventListener("click", handler); }

  onBeatsMinus(handler) { this.#dom.beatsMinusBtn.addEventListener("click", handler); }
  onBeatsPlus(handler)  { this.#dom.beatsPlusBtn.addEventListener("click", handler); }

  onPlay(handler) { this.#dom.playBtn.addEventListener("click", handler); }
  onStop(handler) { this.#dom.stopBtn.addEventListener("click", handler); }

  /* ---------------------------
     Rendering
  --------------------------- */
  setBpm(bpm) {
    this.#dom.bpmValue.textContent = String(bpm);
  }

  setBeats(n) {
    this.#dom.beatsValue.textContent = String(n);
    this.#renderDots(n);
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

  /* ---------------------------
     Private
  --------------------------- */
  #renderDots(count) {
    // Clear
    this.#dom.dotsEl.innerHTML = "";
    this.#dots = [];
    this.#activeIdx = -1;

    // Create dots: beat 1 red, others orange
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = `dot ${i === 0 ? "dot--red" : "dot--orange"}`;
      this.#dom.dotsEl.appendChild(el);
      this.#dots.push(el);
    }
  }
}
