"use strict";

/**
 * Module: Transport Controls
 *
 * Binds transport buttons and keyboard shortcuts to transport actions.
 * Owns transport button enabled/disabled state and click animations.
 */

export function bindTransportControls({
  playBtn,
  stopBtn,
  clearBtn,
  memoryBtn,
  recallBtn,
  audio,
  sequencer,
  transport,
  hasStoredPattern,
  matchesStoredPattern,
  onMemory,
  onRecall,
}) {
  const setTransportState = (playing) => {
    playBtn.disabled = playing;
    stopBtn.disabled = !playing;
  };

  const syncStorageButtons = () => {
    const hasStored = hasStoredPattern();
    recallBtn.disabled = !hasStored;
    memoryBtn.disabled = hasStored && matchesStoredPattern();
  };

  // Initial state: stopped
  setTransportState(false);
  syncStorageButtons();

  const animateButton = (btn) => {
    if (btn.disabled) return;
    btn.classList.add("anticipate");
    setTimeout(() => btn.classList.remove("anticipate"), 150);
  };

  playBtn.addEventListener("click", async () => {
    await audio.ensureRunning();
    animateButton(playBtn);
    transport.start();
    setTransportState(true);
  });

  stopBtn.addEventListener("click", () => {
    animateButton(stopBtn);
    transport.stop();
    setTransportState(false);
  });

  clearBtn.addEventListener("click", () => {
    animateButton(clearBtn);
    sequencer.clearGrid();
  });

  memoryBtn.addEventListener("click", () => {
    animateButton(memoryBtn);
    const saved = onMemory();
    if (saved) syncStorageButtons();
  });

  recallBtn.addEventListener("click", () => {
    if (recallBtn.disabled) return;
    animateButton(recallBtn);
    const recalled = onRecall();
    if (!recalled) {
      recallBtn.disabled = true;
      return;
    }
    syncStorageButtons();
  });

  document.addEventListener("keydown", async (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      await audio.ensureRunning();
      animateButton(transport.isPlaying() ? stopBtn : playBtn);
      transport.toggle();
      setTransportState(transport.isPlaying());
    }

    if (e.code === "KeyP") {
      await audio.ensureRunning();
      animateButton(playBtn);
      transport.start();
      setTransportState(true);
    }

    if (e.code === "KeyS") {
      animateButton(stopBtn);
      transport.stop();
      setTransportState(false);
    }

    if (e.code === "KeyC") {
      animateButton(clearBtn);
      sequencer.clearGrid();
    }
  });

  return { setTransportState, syncStorageButtons };
}
