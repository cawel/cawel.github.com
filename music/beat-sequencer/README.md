# 🎵 Beat Sequencer

A lightweight, dependency-free, browser-based step sequencer inspired by classic music-box and grid-based sequencers.

👉 [Open Beat Sequencer](https://cawel.github.io/music/beat-sequencer/index.html)

The project emphasizes **clarity of architecture**, **deterministic musical logic**, and **clean separation of concerns** between sequencing, timing, audio synthesis, and UI.


## ✨ Features

- Grid-based step sequencer (16 / 32 / 64 columns)
- Pentatonic scale with configurable octave range
- Per-cell sound assignment
- Smooth, click-free audio (attack/release envelopes + per-row staggering)
- Keyboard shortcuts (space = play/stop)
- Deterministic sequencer core (export-friendly)
- No external dependencies


## 🧠 Architecture Overview

The codebase is intentionally split into small, focused modules.  
Each module has **one responsibility** and no unnecessary coupling.

- index.html → application wiring & markup
- css/main.css → visuals entrypoint
- js/app-ui.js → UI orchestration
- js/core/sequencer-core.js → deterministic musical logic
- js/core/transport-clock.js → real-time scheduling (clock)
- js/core/audio-engine.js → sound synthesis (Web Audio)
- js/core/sound-metadata.js → sound labels, order, markers, and colors
- js/ui/* → view and control modules


**Design principle**

> Musical logic is deterministic.  
> Time is injected.  
> Audio is a side effect.


## 📦 Module Responsibilities

### `js/core/sequencer-core.js` — Deterministic Sequencer Core

Responsible for all **musical state**:

- Grid state (rows × columns)
- Note generation (pentatonic scale + octave range)
- Playhead position
- Tempo as *data* (not time)

Exposes:

- `stepOnce()` — advance exactly one step
- `getCell()`
- `setCell()`
- `clearCell()`
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


### `js/core/transport-clock.js` — Timing & Scheduling

Responsible for **when** steps happen.

- Uses a drift-corrected scheduler
- Relies on `AudioContext.currentTime` as the master clock
- Calls `sequencer.stepOnce()` at musical intervals (16th notes)
- Supports smooth tempo changes without restarting playback

Why this exists:

- JavaScript timers (`setInterval`) are jittery
- Separating timing preserves sequencer determinism
- The transport can be swapped or improved independently


### `js/core/audio-engine.js` — Sound Engine

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

### `js/app-ui.js` — Rendering & Interaction

Responsible for:

- Rendering the grid, playhead, and controls
- Handling mouse and keyboard input
- Button animations and visual feedback

Acts as the bridge between:

- Sequencer → Audio (on `step` events)
- Sequencer → DOM (on `grid` / `state` events)
- UI controls → Sequencer / Transport

Contains **no musical logic** and **no audio synthesis**.

## ⏱️ Timing Model

- **Sequencer**: step-based, timeless
- **Transport**: real-time scheduler
- **Audio**: note synthesis with envelopes

Tempo changes:
- Take effect immediately
- Do not restart playback
- Do not reset the playhead

## 🎼 Why This Architecture?

This structure enables:

- Predictable playback
- Smooth audio without clicks
- Deterministic exports (MIDI, WAV)
- Offline rendering
- Clean extensibility (patterns, tracks, instruments)

Each concern is isolated and replaceable.

## Tests

Regression tests are included for core logic, scheduler behavior, and UI contracts.

- Run all tests: `npm test`
- Watch mode: `npm run test:watch`

Current test coverage focuses on:

- Sequencer step wrap behavior and deterministic stepping
- Grid/state invariants when columns/octaves change
- Transport start/stop lifecycle and scheduler interaction
- Sound metadata and dropdown contract
- Hover suppression behavior via JSDOM integration test
