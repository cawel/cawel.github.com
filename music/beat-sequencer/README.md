# 🎵 Music Box Sequencer

A lightweight, dependency-free, browser-based step sequencer inspired by classic music-box and grid-based sequencers.

The project emphasizes **clarity of architecture**, **deterministic musical logic**, and **clean separation of concerns** between sequencing, timing, audio synthesis, and UI.

---

## ✨ Features

- Grid-based step sequencer (16 / 32 / 64 columns)
- Pentatonic scale with configurable octave range
- Per-cell sound assignment
- Smooth, click-free audio (attack/release envelopes + per-row staggering)
- Keyboard shortcuts (space = play/stop)
- Deterministic sequencer core (export-friendly)
- No external dependencies

---

## 🧠 Architecture Overview

The codebase is intentionally split into small, focused modules.  
Each module has **one responsibility** and no unnecessary coupling.

- index.html → application wiring & markup
- style.css → visuals only
- ui.js → DOM rendering & user interaction
- sequencer.js → deterministic musical logic
- transport.js → real-time scheduling (clock)
- audio.js → sound synthesis (Web Audio)


**Design principle**

> Musical logic is deterministic.  
> Time is injected.  
> Audio is a side effect.

---

## 📦 Module Responsibilities

### `sequencer.js` — Deterministic Sequencer Core

Responsible for all **musical state**:

- Grid state (rows × columns)
- Note generation (pentatonic scale + octave range)
- Playhead position
- Tempo as *data* (not time)

Exposes:

- `stepOnce()` — advance exactly one step
- `toggleCell()`
- `setTempo()`
- `setColumns()`
- `setOctaves()`
- `reset()`

Emits events:

- `step` → notes to be played at the current step
- `grid` → structural state changes
- `state` → playhead position updates

Does **not**:

- Use timers
- Reference the DOM
- Use Web Audio
- Depend on real time

This makes the sequencer **fully deterministic**, predictable, and suitable for export or offline rendering.

---

### `transport.js` — Timing & Scheduling

Responsible for **when** steps happen.

- Uses a drift-corrected scheduler
- Relies on `AudioContext.currentTime` as the master clock
- Calls `sequencer.stepOnce()` at musical intervals (16th notes)
- Supports smooth tempo changes without restarting playback

Why this exists:

- JavaScript timers (`setInterval`) are jittery
- Separating timing preserves sequencer determinism
- The transport can be swapped or improved independently

---

### `audio.js` — Sound Engine

Responsible for **sound synthesis only**:

- Owns `AudioContext`
- Creates oscillators and gain nodes
- Applies attack/release envelopes
- Adds per-row staggering (≈1 ms) to reduce clicks

Exposes:

- `playNote({ note, type, rowIndex })`
- `ensureRunning()` (browser gesture compliance)
- `ctx` (AudioContext, used by the transport)

All click-reduction logic lives here, isolated from sequencing and UI.

---

### `ui.js` — Rendering & Interaction

Responsible for:

- Rendering the grid, playhead, and controls
- Handling mouse and keyboard input
- Button animations and visual feedback

Acts as the bridge between:

- Sequencer → Audio (on `step` events)
- Sequencer → DOM (on `grid` / `state` events)
- UI controls → Sequencer / Transport

Contains **no musical logic** and **no audio synthesis**.

---

## ⏱️ Timing Model

- **Sequencer**: step-based, timeless
- **Transport**: real-time scheduler
- **Audio**: note synthesis with envelopes

Tempo changes:
- Take effect immediately
- Do not restart playback
- Do not reset the playhead

---

## 🎼 Why This Architecture?

This structure enables:

- Predictable playback
- Smooth audio without clicks
- Deterministic exports (MIDI, WAV)
- Offline rendering
- Clean extensibility (patterns, tracks, instruments)

Each concern is isolated and replaceable.
