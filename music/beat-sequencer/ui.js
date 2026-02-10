"use strict";

import { createSequencer } from "./sequencer.js";
import { createTransport } from "./transport.js";
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
const transport = createTransport({ sequencer: seq, audioCtx: audio.ctx });

// ----- Rendering -----
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
        await audio.ensureRunning();

        const newVal = seq.toggleCell({ row, col, soundType: selectedSound });
        if (newVal) {
          cell.style.background = SOUND_COLORS[newVal];
          cell.classList.add("active");
        } else {
          cell.style.background = "";
          cell.classList.remove("active");
        }
      });

      cell.addEventListener("mouseenter", () => {
        cell.style.cursor = seq.getGrid()[row][col] ? "crosshair" : "pointer";
      });

      rowDiv.appendChild(cell);
    }

    dom.grid.appendChild(rowDiv);
  }
};

const positionPlayhead = (stepIndex) => {
  // Use the first row as reference.
  const firstRow = dom.grid.children[0];
  if (!firstRow) return;

  // children[0] is the note label, so step cells start at index 1
  const cell = firstRow.children[stepIndex + 1];
  if (!cell) return;

  dom.vBar.style.left = `${cell.offsetLeft}px`;
  dom.vBar.style.width = `${cell.offsetWidth}px`;
};

const renderPlayhead = ({ stepIndex }) => {
  if (!transport.isPlaying()) {
    dom.vBar.style.display = "none";
    return;
  }

  dom.vBar.style.display = "block";
  positionPlayhead(stepIndex);
};

// ----- Sequencer events -----
seq.on("grid", renderGrid);
seq.on("state", renderPlayhead);

seq.on("step", ({ stepIndex, hits }) => {
  for (const hit of hits) {
    // IMPORTANT: your click-reduction envelope/stagger is still applied here
    audio.playNote({ note: hit.note, type: hit.soundType, rowIndex: hit.row });

    const rowEl = dom.grid.children[hit.row];
    const cellEl = rowEl?.children[stepIndex + 1]; // +1 label
    if (cellEl) {
      cellEl.style.filter = "brightness(1.3)";
      setTimeout(() => (cellEl.style.filter = ""), 100);
    }
  }
});

// ----- Initial render (now required) -----
{
  const s = seq.getState();
  renderGrid({ grid: seq.getGrid(), notes: s.notes, cols: s.cols });
  renderPlayhead({ stepIndex: s.stepIndex });
}

// ----- Controls -----
dom.tempoSlider.addEventListener("input", (e) => {
  const v = Number(e.target.value);
  dom.tempoLabel.textContent = v;
  seq.setTempo(v);
  transport.onTempoChange(); // optional, safe, future-proof
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

// ----- Buttons -----
dom.playBtn.addEventListener("click", async () => {
  await audio.ensureRunning();
  animateButton(dom.playBtn);
  transport.start();
});

dom.stopBtn.addEventListener("click", () => {
  animateButton(dom.stopBtn);
  transport.stop();
});

// ----- Keyboard -----
document.addEventListener("keydown", async (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    await audio.ensureRunning();
    animateButton(transport.isPlaying() ? dom.stopBtn : dom.playBtn);
    transport.toggle();
  }
  if (e.code === "KeyP") {
    await audio.ensureRunning();
    animateButton(dom.playBtn);
    transport.start();
  }
  if (e.code === "KeyS") {
    animateButton(dom.stopBtn);
    transport.stop();
  }
});

window.addEventListener("resize", () => {
  if (!transport.isPlaying()) return;
  positionPlayhead(seq.getState().stepIndex);
});


