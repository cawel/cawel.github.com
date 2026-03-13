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
import { DEFAULT_SOUND, SOUNDS, SOUND_COLORS } from "./core/sound-metadata.js";
import { createGridView } from "./ui/grid-view.js";
import { createPlayheadView } from "./ui/playhead-view.js";
import { bindTransportControls } from "./ui/transport-controls.js";

const dom = {
  grid: document.getElementById("grid"),
  beatGuides: document.getElementById("beatGuides"),
  vBar: document.getElementById("vBar"),
  playBtn: document.getElementById("playBtn"),
  stopBtn: document.getElementById("stopBtn"),
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
    option.textContent = `${sound.marker}  ${sound.label}`;
    option.selected = sound.value === DEFAULT_SOUND;
    dom.soundSelect.appendChild(option);
  }
};

initializeSoundSelect();

if (dom.footerYear) {
  dom.footerYear.textContent = String(new Date().getFullYear());
}

let selectedSound = dom.soundSelect.value || DEFAULT_SOUND;

const audio = createAudioEngine();
const sequencer = createSequencer();
const transport = createTransport({ sequencer, audioCtx: audio.ctx });

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
  audio,
  transport,
});

// ----- Sequencer events -----
sequencer.on("grid", gridView.renderGrid);
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
  gridView.renderBeatGuides(cols);
  if (!transport.isPlaying()) return;
  playheadView.positionPlayhead(
    playheadView.getLastPlayheadStep() ?? stepIndex,
  );
});
