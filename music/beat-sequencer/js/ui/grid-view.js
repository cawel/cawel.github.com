"use strict";

/**
 * Module: Grid View
 *
 * Renders grid rows/cells, beat guides, and per-cell intent cues.
 * Handles grid cell interactions and visual feedback hooks.
 */

export function createGridView({
  gridEl,
  beatGuidesEl,
  sequencer,
  audio,
  getSelectedSound,
  soundColors,
}) {
  const removeCueSuppressedCells = new Set();

  const cellKey = (row, col) => `${row}:${col}`;

  const getCellElement = (row, col) => {
    const rowEl = gridEl.children[row];
    return rowEl?.children[col + 1] ?? null; // +1 note label
  };

  const getReferenceCell = (stepIndex) => {
    const firstRow = gridEl.children[0];
    return firstRow?.children[stepIndex + 1] ?? null; // +1 note label
  };

  const syncCellIntents = () => {
    const grid = sequencer.getGrid();
    const selectedSound = getSelectedSound();

    for (let row = 0; row < gridEl.children.length; row++) {
      const rowEl = gridEl.children[row];
      if (!rowEl) continue;

      for (let col = 0; col < grid[row].length; col++) {
        const cellEl = getCellElement(row, col);
        if (!cellEl) continue;

        const sound = grid[row][col];
        const removable = sound != null && sound === selectedSound;
        cellEl.classList.toggle("removable", removable);
        cellEl.classList.toggle(
          "suppress-remove-cue",
          removeCueSuppressedCells.has(cellKey(row, col)),
        );
      }
    }
  };

  const renderBeatGuides = (cols) => {
    if (!beatGuidesEl) return;
    beatGuidesEl.innerHTML = "";

    const firstRow = gridEl.children[0];
    if (!firstRow) return;

    const rowStyles = window.getComputedStyle(firstRow);
    const rowGap =
      Number.parseFloat(rowStyles.columnGap || rowStyles.gap || "0") || 2;
    const lineWidth = Math.max(1, Math.round(rowGap));

    // Draw a guide every 4 steps at the exact gap before each beat group.
    for (let col = 4; col < cols; col += 4) {
      const cell = firstRow.children[col + 1]; // +1 for note label
      if (!cell) continue;

      const line = document.createElement("div");
      line.className = "beat-guide-line";
      line.style.left = `${Math.max(0, cell.offsetLeft - lineWidth)}px`;
      line.style.width = `${lineWidth}px`;
      beatGuidesEl.appendChild(line);
    }
  };

  const flashStepHit = (row, stepIndex) => {
    const cellEl = getCellElement(row, stepIndex);
    if (!cellEl) return;

    cellEl.style.filter = "brightness(1.3)";
    setTimeout(() => {
      cellEl.style.filter = "";
    }, 100);
  };

  const renderGrid = ({ grid, notes, cols }) => {
    gridEl.innerHTML = "";

    for (let row = 0; row < notes.length; row++) {
      const rowDiv = document.createElement("div");
      rowDiv.className = "row";

      const label = document.createElement("div");
      label.className =
        "noteLabel" + (notes[row].startsWith("C") ? " tonic" : "");
      label.textContent = notes[row];
      rowDiv.appendChild(label);

      for (let col = 0; col < cols; col++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        const key = cellKey(row, col);

        const sound = grid[row][col];
        if (sound) {
          cell.style.background = soundColors[sound];
          cell.classList.add("active");
          cell.classList.toggle("removable", sound === getSelectedSound());
          cell.classList.toggle(
            "suppress-remove-cue",
            removeCueSuppressedCells.has(key),
          );
        }

        cell.addEventListener("mouseleave", () => {
          if (!removeCueSuppressedCells.has(key)) return;
          removeCueSuppressedCells.delete(key);
          cell.classList.remove("suppress-remove-cue");
        });

        cell.addEventListener("click", async () => {
          await audio.ensureRunning();

          const selectedSound = getSelectedSound();
          const prevVal = sequencer.getCell({ row, col });
          const willSetSound = prevVal !== selectedSound;

          if (willSetSound) {
            // Apply suppression before grid re-render so the new cell inherits it.
            removeCueSuppressedCells.add(key);
          } else {
            removeCueSuppressedCells.delete(key);
          }

          const newVal = willSetSound
            ? sequencer.setCell({ row, col, soundType: selectedSound })
            : sequencer.clearCell({ row, col });

          if (!newVal) removeCueSuppressedCells.delete(key);
        });

        rowDiv.appendChild(cell);
      }

      gridEl.appendChild(rowDiv);
    }

    renderBeatGuides(cols);
  };

  return {
    renderGrid,
    renderBeatGuides,
    syncCellIntents,
    flashStepHit,
    getReferenceCell,
  };
}
