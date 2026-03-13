import test from "node:test";
import assert from "node:assert/strict";

import { JSDOM } from "jsdom";

import { createSequencer } from "../../js/core/sequencer-core.js";
import { createGridView } from "../../js/ui/grid-view.js";
import { SOUND_COLORS } from "../../js/core/sound-metadata.js";

test("newly set cell suppresses remove cue until mouse leaves", async () => {
  const dom = new JSDOM(
    `<!doctype html><div id="grid"></div><div id="beatGuides"></div>`,
  );
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;

  try {
    const gridEl = document.getElementById("grid");
    const beatGuidesEl = document.getElementById("beatGuides");
    const sequencer = createSequencer({ columns: 4, octaves: 1 });

    let selectedSound = "sine";
    const gridView = createGridView({
      gridEl,
      beatGuidesEl,
      sequencer,
      audio: { ensureRunning: async () => {} },
      getSelectedSound: () => selectedSound,
      soundColors: SOUND_COLORS,
    });

    sequencer.on("grid", gridView.renderGrid);

    const state = sequencer.getState();
    gridView.renderGrid({
      grid: sequencer.getGrid(),
      notes: state.notes,
      cols: state.cols,
    });

    const firstCellBeforeClick = gridEl.children[0].children[1]; // +1 note label
    firstCellBeforeClick.dispatchEvent(
      new window.Event("click", { bubbles: true }),
    );

    // Wait for async click handler continuation after ensureRunning.
    await Promise.resolve();

    // Re-render creates a new element instance at the same position.
    const firstCellAfterClick = gridEl.children[0].children[1];
    assert.equal(firstCellAfterClick.classList.contains("active"), true);
    assert.equal(
      firstCellAfterClick.classList.contains("suppress-remove-cue"),
      true,
    );

    firstCellAfterClick.dispatchEvent(
      new window.Event("mouseleave", { bubbles: true }),
    );
    assert.equal(
      firstCellAfterClick.classList.contains("suppress-remove-cue"),
      false,
    );

    // Keep selectedSound referenced to avoid accidental optimizer removal in some runtimes.
    selectedSound = "sine";
  } finally {
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
  }
});
