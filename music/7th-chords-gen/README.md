# 🎷 7th Chords Generator

A lightweight, framework-free web app for practicing jazz harmony and 7th chords.  
Designed for piano jazz players, educators, and improvisers who want fast, focused chord prompts — with optional voice control.

👉 [Open Beat Sequencer](https://cawel.github.io/music/7th-chords-gen/index.html)

## Features

### 🎼 Chord Generation
- **Random 7th chords**
  - maj7, m7, 7
  - Optional: ø7 (half-diminished), o7 (diminished)
- **ii–V–I (major)** progressions  
  Diatonically correct, all chords from the same key
- **iiø–V–i (minor)** progressions  
  Proper harmonic minor spelling
- **Cycle of Fifths**  
  Moves **down a fifth** (jazz-standard direction)

### 🎹 Chord Display
- Large, centered, non-wrapping chord symbol
- Jazz lead-sheet formatting:
  - `maj`, `m` inline (not superscript)
  - superscript `7`, `ø`, `o`
- Responsive scaling with window size

### 🔊 Audio Playback
- Uses the **Web Audio API**
- Arpeggiated playback (bass → top)
- Followed by full block chord
- Click-free envelopes

### 🎙 Voice Control (Optional)
- Powered by the **Web Speech API**
- Say:
  - **“next”** → generate next chord
  - **“stop listening”** → disable voice mode
- Low-latency triggering using interim results
- Automatic restart after silence
- No framework, no server code

### ⌨️ Keyboard Shortcuts
- **Space** → Next chord
- **P** → Play chord
- **S** → Toggle stats

### 📊 Stats
- Counts all generated chords across all modes
- Toggleable stats line


## Accessibility & UX
- Fully keyboard-operable
- No focus outlines (intentional, minimal UI)
- Clear visual grouping
- Dark mode by default
- Responsive layout for small and large screens


## Tech Stack (Zero Dependencies)

- **HTML5**
- **Modern JavaScript (ES2023, strict mode)**
- **CSS (Flex/Grid + `clamp()` for responsiveness)**
- **Web Audio API**
- **Web Speech API**

No frameworks. No build step. No bundler.

## Privacy Notes (Speech Recognition)

Speech recognition is handled **by the browser**, not by this app.

- Chrome (desktop): audio is processed by Google’s speech service
- Safari / iOS browsers: audio is processed by Apple
- Behavior depends on the browser and platform
- This app does **not** send or store audio itself


## Project Structure

```
/
├─ index.html # App structure
├─ style.css # Styling & layout
├─ script.js # App logic (chords, UI, audio)
├─ speech.js # Speech recognition logic (isolated, reusable)
└─ README.md
```

## Design Principles

- **Deterministic musical logic**
- **True diatonic spelling**
- **Fast interaction** (minimal latency)
- **Separation of concerns**
  - UI rendering
  - musical logic
  - audio
  - speech recognition


## Browser Support

- ✅ Chrome (desktop) — best speech support
- ⚠️ Safari / iOS — speech behavior varies
- ❌ Firefox — no Web Speech API


## Feedback

Suggestions, musical edge cases, and UX feedback are welcome.
This app is intentionally small, readable, and hackable.

