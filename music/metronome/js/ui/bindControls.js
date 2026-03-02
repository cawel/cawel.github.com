/**
 * bindControls.js
 * ---------------
 * Input wiring for the Metronome App.
 *
 * PURPOSE
 * -------
 * Centralizes all control bindings:
 * - UI button callbacks (BPM, Beats, Tap Tempo, Play/Stop)
 * - Keyboard shortcut (Space = toggle)
 *
 * This module does NOT:
 * - Mutate application state directly
 * - Call Engine/Audio methods
 * - Schedule UI highlights
 *
 * Instead it receives intention-level callbacks from main.js.
 *
 * CONTRACT
 * --------
 * bindControls({ ui, ...handlers }) returns an unbind() function
 * that removes the key listener. (UI callback unbinding is not exposed
 * by MetronomeUI, so those remain attached for the page lifetime.)
 *
 * Space-key behavior:
 * - Uses onToggle() for transport state transition.
 * - When toggling from stopped -> running, focus is moved to Play to keep
 *   keyboard-visible focus aligned with the control the shortcut maps to.
 */

export function bindControls({
  ui,
  isRunning,
  onBpmDelta,
  onBeatsDelta,
  onStart,
  onStop,
  onToggle,
  onTapTempo,
}) {
  // BPM
  ui.onMinus10(() => onBpmDelta(-10));
  ui.onMinus(() => onBpmDelta(-1));
  ui.onPlus(() => onBpmDelta(+1));
  ui.onPlus10(() => onBpmDelta(+10));

  // Beats
  ui.onBeatsMinus(() => onBeatsDelta(-1));
  ui.onBeatsPlus(() => onBeatsDelta(+1));

  // Transport buttons
  ui.onPlay(onStart);
  ui.onStop(onStop);
  ui.onTapTempo(onTapTempo);

  // Keyboard: Space toggles transport
  const onKeyDown = (e) => {
    if (e.code !== "Space") return;
    if (e.repeat) return;

    const t = e.target;
    const isTypingTarget =
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable);
    if (isTypingTarget) return;

    const wasRunning = isRunning();
    e.preventDefault();
    onToggle();
    if (!wasRunning) ui.focusPlay();
  };

  document.addEventListener("keydown", onKeyDown);

  return function unbind() {
    document.removeEventListener("keydown", onKeyDown);
  };
}
