import test from "node:test";
import assert from "node:assert/strict";

import { JSDOM } from "jsdom";

import { bindTransportControls } from "../js/ui/transport-controls.js";

test("recall button is disabled by default and enables after successful memory save", () => {
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
    const playBtn = document.getElementById("play");
    const stopBtn = document.getElementById("stop");
    const clearBtn = document.getElementById("clear");
    const memoryBtn = document.getElementById("memory");
    const recallBtn = document.getElementById("recall");

    bindTransportControls({
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
      hasStoredPattern: () => false,
      onMemory: () => true,
      onRecall: () => true,
    });

    assert.equal(recallBtn.disabled, true);

    memoryBtn.dispatchEvent(new window.Event("click", { bubbles: true }));
    assert.equal(recallBtn.disabled, false);
  } finally {
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
  }
});
