import test from "node:test";
import assert from "node:assert/strict";

import { JSDOM } from "jsdom";

import { bindTransportControls } from "../../js/ui/transport-controls.js";

const createHarness = ({
  initialHasStored = false,
  initialMatchesStored = false,
  onRecall = () => true,
} = {}) => {
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

  let hasStored = initialHasStored;
  let matchesStored = initialMatchesStored;

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
    onRecall: () =>
      onRecall({
        setHasStored: (v) => {
          hasStored = v;
        },
        setMatchesStored: (v) => {
          matchesStored = v;
        },
      }),
  });

  return {
    window,
    memoryBtn,
    recallBtn,
    controls,
    setHasStored: (v) => {
      hasStored = v;
    },
    setMatchesStored: (v) => {
      matchesStored = v;
    },
    cleanup: () => {
      globalThis.window = oldWindow;
      globalThis.document = oldDocument;
    },
  };
};

test("recall is disabled by default and save disables when stored state matches", () => {
  const harness = createHarness();

  try {
    assert.equal(harness.recallBtn.disabled, true);
    assert.equal(harness.memoryBtn.disabled, false);

    harness.memoryBtn.dispatchEvent(
      new harness.window.Event("click", { bubbles: true }),
    );
    assert.equal(harness.recallBtn.disabled, false);
    assert.equal(harness.memoryBtn.disabled, true);

    harness.setMatchesStored(false);
    harness.controls.syncStorageButtons();
    assert.equal(harness.memoryBtn.disabled, false);
  } finally {
    harness.cleanup();
  }
});

test("recall success disables save when current state matches stored data", () => {
  const harness = createHarness({
    initialHasStored: true,
    initialMatchesStored: false,
    onRecall: ({ setMatchesStored }) => {
      setMatchesStored(true);
      return true;
    },
  });

  try {
    assert.equal(harness.recallBtn.disabled, false);
    assert.equal(harness.memoryBtn.disabled, false);

    harness.recallBtn.dispatchEvent(
      new harness.window.Event("click", { bubbles: true }),
    );

    assert.equal(harness.recallBtn.disabled, false);
    assert.equal(harness.memoryBtn.disabled, true);
  } finally {
    harness.cleanup();
  }
});

test("recall failure disables recall button", () => {
  const harness = createHarness({
    initialHasStored: true,
    initialMatchesStored: false,
    onRecall: () => false,
  });

  try {
    assert.equal(harness.recallBtn.disabled, false);

    harness.recallBtn.dispatchEvent(
      new harness.window.Event("click", { bubbles: true }),
    );

    assert.equal(harness.recallBtn.disabled, true);
    assert.equal(harness.memoryBtn.disabled, false);
  } finally {
    harness.cleanup();
  }
});

test("recall failure can be recovered after storage state sync", () => {
  const harness = createHarness({
    initialHasStored: true,
    initialMatchesStored: false,
    onRecall: () => false,
  });

  try {
    harness.recallBtn.dispatchEvent(
      new harness.window.Event("click", { bubbles: true }),
    );
    assert.equal(harness.recallBtn.disabled, true);

    harness.setHasStored(true);
    harness.controls.syncStorageButtons();
    assert.equal(harness.recallBtn.disabled, false);
  } finally {
    harness.cleanup();
  }
});
