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
- ➕ BPM ±1 and ±10 controls
- 📱 Responsive layout
- ♻️ No global namespace pollution
- 🚫 No external libraries

## Architecture

The application is split into three core modules:

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
- Converting audio time to UI time
- Managing 4-beat cycle logic
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
- Button interaction
- Accessibility attributes

No audio or timing logic lives here.

### Entry Point: `main.js`

Coordinates:
- Wiring UI → Engine → Audio
- Start / Stop state
- BPM state
- Keyboard shortcut (Space toggles playback)
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
