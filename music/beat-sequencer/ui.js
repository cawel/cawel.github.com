"use strict";

import { createSequencer } from "./sequencer.js";
import { createAudioEngine } from "./audio.js";

const SOUND_COLORS = {
  sine: "#ff8c42",
  square: "#ff4c42",
  sawtooth: "#ffe066",
  triangle: "#4361ee",
  bell: "#c77dff",
};

const dom = {
  grid: document.getElementById("grid"),
  vBar: document.getElementById("vBar"),
  playBtn: document.getElementById("playBtn"),
  stopBtn: document.getElementById("stopBtn"),
  tempoSlider: document.getElementById("tempoSlider"),
  tempoLabel: document.getElementById("tempoLabel"),
  colSelect: document.getElementById("colSelect"),
  octSelect: document.getElementById("octSelect"),
  soundSelect: document.getElementById("soundSelect"),
};

let selectedSound = dom.soundSelect.value;

const animateButton = (btn) => {
  if (btn.disabled) return;
  btn.classList.add("anticipate");
  setTimeout(() => btn.classList.remove("anticipate"), 150);
};

const audio = createAudioEngine();
const seq = createSequencer();

const renderGrid = ({ grid, notes, cols }) => {
  dom.grid.innerHTML = "";

  for (let row = 0; row < notes.length; row++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";

    const label = document.createElement("div");
    label.className = "noteLabel" + (notes[row].startsWith("C") ? " tonic" : "");
    label.textContent = notes[row];
    rowDiv.appendChild(label);

    for (let col = 0; col < cols; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      const sound = grid[row][col];
      if (sound) {
        cell.style.background = SOUND_COLORS[sound];
        cell.classList.add("active");
      }

      cell.addEventListener("click", async () => {
        // ensure audio is allowed to play in browsers
        await audio.ensureRunning();

        const newValue = seq.toggleCell({ row, col, soundType: selectedSound });

        if (newValue) {
          cell.style.background = SOUND_COLORS[newValue];
          cell.classList.add("active");
        } else {
          cell.style.background = "";
          cell.classList.remove("active");
        }
      });

      cell.addEventListener("mouseenter", () => {
        cell.style.cursor = grid[row][col] ? "crosshair" : "pointer";
      });

      rowDiv.appendChild(cell);
    }

    dom.grid.appendChild(rowDiv);
  }
};

const renderTransport = ({ playing, stepIndex }) => {
  // playhead visible only when playing
  dom.vBar.style.display = playing ? "block" : "none";
  if (!playing) return;

  // 30px label + 34px per cell (32 + 2 gap) matches existing layout
  dom.vBar.style.left = `${30 + stepIndex * 34}px`;
};

// Sequencer events
seq.on("grid", renderGrid);
seq.on("state", renderTransport);

seq.on("step", ({ stepIndex, hits }) => {
  // cell flash effect + audio playback
  for (const hit of hits) {
    audio.playNote({ note: hit.note, type: hit.soundType, rowIndex: hit.row });

    // flash the cell at (row, stepIndex)
    const rowEl = dom.grid.children[hit.row];
    const cellEl = rowEl?.children[stepIndex + 1]; // +1 for label
    if (cellEl) {
      cellEl.style.filter = "brightness(1.3)";
      setTimeout(() => { cellEl.style.filter = ""; }, 100);
    }
  }
});

// --- Initial render ---
{
  const state = seq.getState();
  renderGrid({ grid: seq.getGrid(), notes: state.notes, cols: state.cols });
  renderTransport({ playing: state.playing, stepIndex: state.stepIndex });
}

// Controls
dom.tempoSlider.addEventListener("input", (e) => {
  const v = Number(e.target.value);
  dom.tempoLabel.textContent = v;
  seq.setTempo(v);
});

dom.colSelect.addEventListener("change", (e) => {
  seq.setColumns(Number(e.target.value));
});

dom.octSelect.addEventListener("change", (e) => {
  seq.setOctaves(Number(e.target.value));
});

dom.soundSelect.addEventListener("change", (e) => {
  selectedSound = e.target.value;
});

// Buttons
dom.playBtn.addEventListener("click", async () => {
  await audio.ensureRunning();
  animateButton(dom.playBtn);
  seq.start();
});

dom.stopBtn.addEventListener("click", () => {
  animateButton(dom.stopBtn);
  seq.stop();
});

// Keyboard shortcuts
document.addEventListener("keydown", async (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    await audio.ensureRunning();
    animateButton(seq.getState().playing ? dom.stopBtn : dom.playBtn);
    seq.togglePlay();
  }
  if (e.code === "KeyP") {
    await audio.ensureRunning();
    animateButton(dom.playBtn);
    seq.start();
  }
  if (e.code === "KeyS") {
    animateButton(dom.stopBtn);
    seq.stop();
  }
});

