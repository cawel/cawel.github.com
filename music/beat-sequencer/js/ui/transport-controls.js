"use strict";

/**
 * Module: Transport Controls
 *
 * Binds transport buttons and keyboard shortcuts to transport actions.
 * Owns transport button enabled/disabled state and click animations.
 */

export function bindTransportControls({ playBtn, stopBtn, audio, transport }) {
  const setTransportState = (playing) => {
    playBtn.disabled = playing;
    stopBtn.disabled = !playing;
  };

  // Initial state: stopped
  setTransportState(false);

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
  });

  return { setTransportState };
}
