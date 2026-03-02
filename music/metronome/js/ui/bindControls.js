/**
 * bindControls.js
 * ---------------
 * Input wiring for the Metronome App.
 *
 * PURPOSE
 * -------
 * Centralizes all control bindings:
 * - UI button callbacks (BPM, Beats, Tap Tempo, Play/Stop)
 * - Keyboard shortcuts (Space/T/?/Esc)
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
  ui.onShortcutsToggle(() => ui.toggleShortcuts());
  ui.onShortcutsClose(() => ui.closeShortcuts());

  // Keyboard shortcuts
  const onKeyDown = (e) => {
    if (e.repeat) return;

    const t = e.target;
    const isTypingTarget =
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable);

    const isShortcutsToggleKey =
      e.key === "?" || (e.code === "Slash" && e.shiftKey);
    if (isShortcutsToggleKey && !isTypingTarget && ui.isShortcutsAvailable()) {
      e.preventDefault();
      ui.toggleShortcuts();
      return;
    }

    if (e.code === "Escape" && ui.isShortcutsOpen()) {
      e.preventDefault();
      ui.closeShortcuts();
      return;
    }

    if (ui.isShortcutsOpen()) {
      if (e.code === "Space" || e.code === "KeyT") e.preventDefault();
      return;
    }
    if (isTypingTarget) return;

    if (e.code === "KeyT") {
      e.preventDefault();
      ui.animateTapTempoPress();
      onTapTempo();
      return;
    }

    if (e.code !== "Space") return;

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
