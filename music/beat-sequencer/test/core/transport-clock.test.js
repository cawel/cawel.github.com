import test from "node:test";
import assert from "node:assert/strict";

import { createTransport } from "../../js/core/transport-clock.js";

test("transport start/stop drives sequencer and lifecycle deterministically", () => {
  let stepCalls = 0;
  let resetCalls = 0;
  let scheduledCalls = 0;
  let clearedId = null;

  const oldWindow = globalThis.window;

  globalThis.window = {
    setTimeout: () => {
      scheduledCalls += 1;
      return 42;
    },
    clearTimeout: (id) => {
      clearedId = id;
    },
  };

  const sequencer = {
    getState: () => ({ tempo: 120 }),
    stepOnce: () => {
      stepCalls += 1;
    },
    reset: () => {
      resetCalls += 1;
    },
  };

  const audioCtx = { currentTime: 0 };
  const transport = createTransport({ sequencer, audioCtx });

  try {
    assert.equal(transport.isPlaying(), false);

    transport.start();
    assert.equal(transport.isPlaying(), true);
    assert.equal(stepCalls, 1);
    assert.equal(scheduledCalls, 1);

    transport.start();
    assert.equal(stepCalls, 1);
    assert.equal(scheduledCalls, 1);

    transport.stop();
    assert.equal(transport.isPlaying(), false);
    assert.equal(resetCalls, 1);
    assert.equal(clearedId, 42);
  } finally {
    globalThis.window = oldWindow;
  }
});
