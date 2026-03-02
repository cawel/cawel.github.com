# ⏱️ Metronome

A high-precision, dependency-free web metronome built with modern JavaScript and the Web Audio API.

👉 [Open Metronome](https://cawel.github.io/music/metronome/index.html)

This project emphasizes:
- Clean separation of concerns
- Deterministic audio output
- Accurate timing via lookahead scheduling
- Minimal dependencies
- Responsive UI

## Features

- 🎵 Deterministic woodblock-style tick
- 🔊 Very high output volume with soft clipping
- 🥁 Beat 1 slightly brighter (accent)
- 🎯 Sample-accurate scheduling
- ⌨️ Space bar toggles Play / Stop
- 👆 Tap Tempo button (rolling average, idle reset, BPM clamped)
- ➕ BPM ±1 and ±10 controls
- 🧮 Beats-per-bar controls (2–6)
- 📏 BPM range: 30–280
- 📱 Responsive layout
- 📱 Mobile-safe tap handling
- ♻️ No global namespace pollution
- 🚫 No external libraries

## Architecture

The application is split into focused modules with `main.js` as the
composition root:

### 1. `MetronomeAudio`

Responsible for:
- Generating the tick sound
- Managing the AudioContext
- Controlling master gain and soft clipping
- Producing deterministic audio (identical beats except accent)

Audio Graph (per tick):

```
Noise (click) ──► Bandpass ──► Gain ┐
                                    ├──► Per-Tick Gain ──► Master Gain ──► Soft Clip ──► Output
Noise (body)  ──► Bandpass ──► Gain ┘
```

### 2. `MetronomeEngine`
Responsible for:
- Beat timing
- Lookahead scheduling
- Emitting beat events in audio time
- Managing configurable beat cycles (`beatsPerBar`)
- Supporting live BPM changes

Uses a lookahead scheduler pattern:
- Runs every ~25ms
- Schedules beats ~120ms ahead
- Maintains stable tempo even under UI load

### 3. `MetronomeUI`
Responsible for:
- DOM updates
- Beat dot activation
- BPM display
- Beats-per-bar display
- Button interaction
- Accessibility attributes

No audio or timing logic lives here.

### 4. `BeatHighlightScheduler`
Responsible for:
- Translating Engine audio-time beats to UI-time highlights
- Scheduling and clearing active beat dots
- Invalidating stale timers after reconfiguration/transport changes

### 5. `TapTempoTracker`
Responsible for:
- Converting tap timestamp sequences into BPM values
- Smoothing with a rolling interval average
- Resetting stale tap history after idle time
- Clamping inferred BPM to valid bounds

### 6. `metronomeState`
Responsible for:
- Pure state transitions (`bpm`, `beatsPerBar`, `running`)
- Declaring side-effect intents (`ENGINE_CONFIG`, `SCHEDULER_CLEAR`, `RENDER`)
- Keeping state logic deterministic and testable

### 7. `bindControls`
Responsible for:
- Wiring UI controls to intention-level callbacks
- Keyboard handling (`Space` toggles transport)
- Keeping DOM event details out of orchestration code

### Entry Point: `main.js`

Coordinates:
- Wiring UI ↔ state reducer ↔ engine/audio/scheduler
- Effect execution declared by `metronomeState`
- Transport side effects (start/stop + AudioContext start)
- Tap Tempo integration
- Gesture-safe AudioContext activation


## Audio Design

- Deterministic noise buffers (no per-beat randomness)
- Beat 1 accent via higher bandpass frequency
- Soft clipping to increase perceived loudness
- Absolute-time scheduling for sample accuracy

Beats 2, 3, 4 are identical in waveform.

## Design Principles

- Deterministic behavior
- Strict modular boundaries
- No framework overhead
- Minimal runtime allocations
- Clean and readable modern JS
- Responsive layout
