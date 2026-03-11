"use strict";

/**
 * Module: Playhead View
 *
 * Positions and animates the vertical playhead overlay.
 * Includes wrap-around behavior that avoids sweeping across the full grid.
 */

export function createPlayheadView({ vBarEl, getReferenceCell, isPlaying }) {
  const PLAYHEAD_TRANSITION = "left 0.05s linear, width 0.05s linear";
  let lastPlayheadStep = null;

  const positionPlayhead = (stepIndex) => {
    const cell = getReferenceCell(stepIndex);
    if (!cell) return;

    const wrappedToStart =
      lastPlayheadStep != null && stepIndex < lastPlayheadStep;
    if (wrappedToStart) {
      vBarEl.style.transition = "none";
      const firstRow = cell.parentElement;
      const rowStyles = window.getComputedStyle(firstRow);
      const rowGap =
        Number.parseFloat(rowStyles.columnGap || rowStyles.gap || "0") || 0;

      // Keep wrap animation inside the step-grid area (never over note labels).
      const fromLeft = Math.max(
        cell.offsetLeft - (cell.offsetWidth + rowGap),
        cell.offsetLeft - rowGap,
      );

      vBarEl.style.left = `${fromLeft}px`;
      vBarEl.style.width = `${cell.offsetWidth}px`;

      // Force style flush so the next write transitions.
      void vBarEl.offsetWidth;

      vBarEl.style.transition = PLAYHEAD_TRANSITION;
    } else {
      vBarEl.style.transition = PLAYHEAD_TRANSITION;
    }

    vBarEl.style.left = `${cell.offsetLeft}px`;
    vBarEl.style.width = `${cell.offsetWidth}px`;

    lastPlayheadStep = stepIndex;
  };

  const renderPlayhead = ({ stepIndex }) => {
    if (!isPlaying()) {
      vBarEl.style.display = "none";
      lastPlayheadStep = null;
      return;
    }

    vBarEl.style.display = "block";
    positionPlayhead(stepIndex);
  };

  const getLastPlayheadStep = () => lastPlayheadStep;

  return { positionPlayhead, renderPlayhead, getLastPlayheadStep };
}
