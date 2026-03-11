# 🎷 7th Chords Generator

A lightweight, framework-free web app for practicing jazz harmony and 7th chords.  
Designed for piano jazz players, educators, and improvisers who want fast, focused chord prompts — with optional voice control.

👉 [Open 7th Chords Gen](https://cawel.github.io/music/7th-chords-gen/index.html)

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

## Development

- Run tests: `npm test`
- Tests use Node's built-in test runner, so no extra packages are required.

## Privacy Notes (Speech Recognition)

Speech recognition is handled **by the browser**, not by this app.

- Chrome (desktop): audio is processed by Google’s speech service
- Safari / iOS browsers: audio is processed by Apple
- Behavior depends on the browser and platform
- This app does **not** send or store audio itself


## Project Structure

```
/
├─ index.html # App markup
├─ style.css # Main stylesheet (imports CSS modules)
├─ css/ # Modular stylesheets
│  ├─ variables.css # Theme colors, fonts, sizing
│  ├─ base.css # Reset, body, typography
│  ├─ layout.css # Page structure and layout
│  └─ components.css # UI components (buttons, pills, etc.)
├─ harmony-engine.js # Music theory logic
├─ audio-engine.js # Web Audio API synthesis
├─ script.js # UI controller
├─ speech.js # Speech recognition
├─ package.json
├─ test/ # Regression tests
│  ├─ harmony-engine.test.js
│  └─ audio-engine.test.js
└─ README.md
```

## Design Principles

- **Deterministic musical logic**
- **True diatonic spelling**
- **Fast interaction** (minimal latency)
- **Modular architecture**
  - Separated concerns: harmony theory, audio synthesis, UI, speech recognition
  - Modular CSS: variables, base, layout, components
  - Testable business logic (Node tests via npm)


## Browser Support

- ✅ Chrome (desktop) — best speech support
- ⚠️ Safari / iOS — speech behavior varies
- ❌ Firefox — no Web Speech API


## Feedback

Suggestions, musical edge cases, and UX feedback are welcome.
This app is intentionally small, readable, and hackable.

