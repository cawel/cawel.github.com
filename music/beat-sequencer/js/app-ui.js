"use strict";

/**
 * Module: App UI Orchestrator
 *
 * Wires core engine modules to UI modules and DOM controls.
 * Owns startup sequencing, event subscriptions, and cross-module coordination.
 */

import { createSequencer } from "./core/sequencer-core.js";
import { createTransport } from "./core/transport-clock.js";
import { createAudioEngine } from "./core/audio-engine.js";
import { createPatternStorage } from "./core/pattern-storage.js";
import { DEFAULT_SOUND, SOUNDS, SOUND_COLORS } from "./core/sound-metadata.js";
import { createGridView } from "./ui/grid-view.js";
import { createPlayheadView } from "./ui/playhead-view.js";
import { bindTransportControls } from "./ui/transport-controls.js";

const dom = {
  grid: document.getElementById("grid"),
  gridWrapper: document.getElementById("gridWrapper"),
  buttons: document.getElementById("buttons"),
  primaryButtons: document.querySelector(".primary-buttons"),
  storageButtons: document.getElementById("storageButtons"),
  beatGuides: document.getElementById("beatGuides"),
  vBar: document.getElementById("vBar"),
  playBtn: document.getElementById("playBtn"),
  stopBtn: document.getElementById("stopBtn"),
  clearBtn: document.getElementById("clearBtn"),
  memoryBtn: document.getElementById("memoryBtn"),
  recallBtn: document.getElementById("recallBtn"),
  tempoSlider: document.getElementById("tempoSlider"),
  tempoLabel: document.getElementById("tempoLabel"),
  colSelect: document.getElementById("colSelect"),
  octSelect: document.getElementById("octSelect"),
  soundSelect: document.getElementById("soundSelect"),
  footerYear: document.getElementById("footerYear"),
};

const initializeSoundSelect = () => {
  dom.soundSelect.innerHTML = "";
  for (const sound of SOUNDS) {
    const option = document.createElement("option");
    option.value = sound.value;
    option.textContent = `${sound.marker}\u00a0\u00a0\u00a0\u00a0${sound.label}`;
    option.selected = sound.value === DEFAULT_SOUND;
    dom.soundSelect.appendChild(option);
  }
};

const GRID_LAYOUT = {
  maxCellSize: 32,
  minCellSize: 4,
  maxGap: 2,
  minGap: 1,
  labelWidthWide: 30,
  labelWidthNarrow: 24,
};

const updateResponsiveGridMetrics = () => {
  if (!dom.gridWrapper) return;

  const { cols } = sequencer.getState();
  if (!cols) return;

  const viewportWidth = document.documentElement.clientWidth;
  const bodyStyles = window.getComputedStyle(document.body);
  const bodyPaddingX =
    Number.parseFloat(bodyStyles.paddingLeft || "0") +
    Number.parseFloat(bodyStyles.paddingRight || "0");
  const availableWidth = Math.max(0, viewportWidth - bodyPaddingX);
  if (!availableWidth) return;

  const labelWidth =
    availableWidth < 520
      ? GRID_LAYOUT.labelWidthNarrow
      : GRID_LAYOUT.labelWidthWide;
  const gap = availableWidth < 520 ? GRID_LAYOUT.minGap : GRID_LAYOUT.maxGap;
  const rawCellSize = (availableWidth - labelWidth - cols * gap) / cols;
  const cellSize = Math.min(
    GRID_LAYOUT.maxCellSize,
    Math.max(GRID_LAYOUT.minCellSize, rawCellSize),
  );

  dom.gridWrapper.style.setProperty("--note-label-width", `${labelWidth}px`);
  dom.gridWrapper.style.setProperty("--grid-gap", `${gap}px`);
  dom.gridWrapper.style.setProperty("--grid-cell-size", `${cellSize}px`);
};

const updateButtonWrapState = () => {
  if (!dom.buttons || !dom.primaryButtons || !dom.storageButtons) return;

  const primaryRect = dom.primaryButtons.getBoundingClientRect();
  const storageRect = dom.storageButtons.getBoundingClientRect();
  const topDelta = storageRect.top - primaryRect.top;
  const currentlyWrapped = dom.buttons.classList.contains("is-wrapped");
  const wrapThreshold = currentlyWrapped ? 2 : 6;
  const wrapped = topDelta > wrapThreshold;
  dom.buttons.classList.toggle("is-wrapped", wrapped);
};

if (dom.buttons && typeof ResizeObserver !== "undefined") {
  const buttonLayoutObserver = new ResizeObserver(() => {
    updateButtonWrapState();
  });
  buttonLayoutObserver.observe(dom.buttons);
}

initializeSoundSelect();

if (dom.footerYear) {
  dom.footerYear.textContent = String(new Date().getFullYear());
}

let selectedSound = dom.soundSelect.value || DEFAULT_SOUND;

const audio = createAudioEngine();
const sequencer = createSequencer();
const transport = createTransport({ sequencer, audioCtx: audio.ctx });
const patternStorage = createPatternStorage({ storage: window.localStorage });

const gridView = createGridView({
  gridEl: dom.grid,
  beatGuidesEl: dom.beatGuides,
  sequencer,
  audio,
  getSelectedSound: () => selectedSound,
  soundColors: SOUND_COLORS,
});

const playheadView = createPlayheadView({
  vBarEl: dom.vBar,
  getReferenceCell: gridView.getReferenceCell,
  isPlaying: transport.isPlaying,
});

bindTransportControls({
  playBtn: dom.playBtn,
  stopBtn: dom.stopBtn,
  clearBtn: dom.clearBtn,
  memoryBtn: dom.memoryBtn,
  recallBtn: dom.recallBtn,
  audio,
  sequencer,
  transport,
  hasStoredPattern: () => patternStorage.hasPattern(),
  onMemory: () => {
    const pattern = sequencer.exportPattern();
    return patternStorage.savePattern(pattern);
  },
  onRecall: () => {
    const pattern = patternStorage.loadPattern();
    if (!pattern) return false;

    const restored = sequencer.applyPattern(pattern);
    if (!restored) return false;

    dom.colSelect.value = String(pattern.cols);
    dom.octSelect.value = String(pattern.octaves);
    dom.tempoSlider.value = String(pattern.tempo);
    dom.tempoLabel.textContent = String(pattern.tempo);
    transport.onTempoChange();
    return true;
  },
});

// ----- Sequencer events -----
sequencer.on("grid", (nextGridState) => {
  gridView.renderGrid(nextGridState);
  updateResponsiveGridMetrics();
  gridView.renderBeatGuides(nextGridState.cols);
});
sequencer.on("state", ({ stepIndex }) => {
  // State emits the *next* step index after tick. Use it only for stopped state.
  if (!transport.isPlaying()) playheadView.renderPlayhead({ stepIndex });
});

sequencer.on("step", ({ stepIndex, hits }) => {
  // Follow the currently sounding step for stable visual timing.
  dom.vBar.style.display = "block";
  playheadView.positionPlayhead(stepIndex);

  for (const hit of hits) {
    audio.playNote({ note: hit.note, type: hit.soundType, rowIndex: hit.row });
    gridView.flashStepHit(hit.row, stepIndex);
  }
});

// ----- Initial render -----
{
  const s = sequencer.getState();
  gridView.renderGrid({
    grid: sequencer.getGrid(),
    notes: s.notes,
    cols: s.cols,
  });
  updateResponsiveGridMetrics();
  updateButtonWrapState();
  gridView.renderBeatGuides(s.cols);
  playheadView.renderPlayhead({ stepIndex: s.stepIndex });
}

// ----- Controls -----
dom.tempoSlider.addEventListener("input", (e) => {
  const v = Number(e.target.value);
  dom.tempoLabel.textContent = v;
  sequencer.setTempo(v);
  transport.onTempoChange();
});

dom.colSelect.addEventListener("change", (e) => {
  sequencer.setColumns(Number(e.target.value));
});

dom.octSelect.addEventListener("change", (e) => {
  sequencer.setOctaves(Number(e.target.value));
});

dom.soundSelect.addEventListener("change", (e) => {
  selectedSound = e.target.value;
  gridView.syncCellIntents();
});

window.addEventListener("resize", () => {
  const { cols, stepIndex } = sequencer.getState();
  updateResponsiveGridMetrics();
  updateButtonWrapState();
  gridView.renderBeatGuides(cols);
  if (!transport.isPlaying()) return;
  playheadView.positionPlayhead(
    playheadView.getLastPlayheadStep() ?? stepIndex,
  );
});
