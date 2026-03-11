"use strict";

/**
 * Module: Sound Metadata
 *
 * Single source of truth for sound options, labels, markers, and colors.
 * UI and tests should consume this module instead of hardcoding values.
 */

export const SOUNDS = Object.freeze([
  { value: "bell", label: "Bell", marker: "🟪", color: "#c77dff" },
  { value: "sawtooth", label: "Sawtooth", marker: "🟨", color: "#ffe066" },
  { value: "sine", label: "Sine", marker: "🟧", color: "#ff8c42" },
  { value: "square", label: "Square", marker: "🟥", color: "#ff4c42" },
  { value: "triangle", label: "Triangle", marker: "🟦", color: "#4361ee" },
]);

export const DEFAULT_SOUND = "sine";

export const SOUND_COLORS = Object.freeze(
  Object.fromEntries(SOUNDS.map((sound) => [sound.value, sound.color])),
);
