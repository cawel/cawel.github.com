import test from "node:test";
import assert from "node:assert/strict";

import { JSDOM } from "jsdom";

import { bindTransportControls } from "../js/ui/transport-controls.js";

test("recall is disabled by default and save disables when stored state matches", () => {
  const dom = new JSDOM(`<!doctype html><body>
    <button id="play"></button>
    <button id="stop"></button>
    <button id="clear"></button>
    <button id="memory"></button>
    <button id="recall"></button>
  </body>`);

  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;

  try {
    let hasStored = false;
    let matchesStored = false;

    const playBtn = document.getElementById("play");
    const stopBtn = document.getElementById("stop");
    const clearBtn = document.getElementById("clear");
    const memoryBtn = document.getElementById("memory");
    const recallBtn = document.getElementById("recall");

    const controls = bindTransportControls({
      playBtn,
      stopBtn,
      clearBtn,
      memoryBtn,
      recallBtn,
      audio: { ensureRunning: async () => {} },
      sequencer: { clearGrid: () => {} },
      transport: {
        start: () => {},
        stop: () => {},
        toggle: () => {},
        isPlaying: () => false,
      },
      hasStoredPattern: () => hasStored,
      matchesStoredPattern: () => matchesStored,
      onMemory: () => {
        hasStored = true;
        matchesStored = true;
        return true;
      },
      onRecall: () => true,
    });

    assert.equal(recallBtn.disabled, true);
    assert.equal(memoryBtn.disabled, false);

    memoryBtn.dispatchEvent(new window.Event("click", { bubbles: true }));
    assert.equal(recallBtn.disabled, false);
    assert.equal(memoryBtn.disabled, true);

    matchesStored = false;
    controls.syncStorageButtons();
    assert.equal(memoryBtn.disabled, false);
  } finally {
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
  }
});
