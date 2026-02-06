"use strict";

document.addEventListener("DOMContentLoaded", () => {

  // --- DATA / BUSINESS LOGIC LAYER ---
  const KEYS = {
    C:  ["C","D","E","F","G","A","B"],
    Db: ["Db","Eb","F","Gb","Ab","Bb","C"],
    D:  ["D","E","F#","G","A","B","C#"],
    Eb: ["Eb","F","G","Ab","Bb","C","D"],
    E:  ["E","F#","G#","A","B","C#","D#"],
    F:  ["F","G","A","Bb","C","D","E"],
    Gb: ["Gb","Ab","Bb","Cb","Db","Eb","F"],
    G:  ["G","A","B","C","D","E","F#"],
    Ab: ["Ab","Bb","C","Db","Eb","F","G"],
    A:  ["A","B","C#","D","E","F#","G#"],
    Bb: ["Bb","C","D","Eb","F","G","A"],
    B:  ["B","C#","D#","E","F#","G#","A#"]
  };

  const CYCLE_FIFTHS = ["C","F","Bb","Eb","Ab","Db","Gb","B","E","A","D","G"];
  const PROGS = {
    maj251:[
      {step:"ii", quality:"m7", deg:1},
      {step:"V",  quality:"7",  deg:4},
      {step:"I",  quality:"maj7",deg:0}
    ],
    min251:[
      {step:"iiø", quality:"ø7", deg:1},
      {step:"V",  quality:"7",  deg:4, harmonic:true},
      {step:"i",  quality:"m7", deg:0}
    ]
  };

  const INTERVALS = { maj7:[0,4,7,11], m7:[0,3,7,10], 7:[0,4,7,10], ø7:[0,3,6,10], o7:[0,3,6,9] };
  const SEMI = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
  const MIN_MIDI = 60; // C4

  const pick = arr => arr[Math.floor(Math.random()*arr.length)];

  const formatAccidentals = s => s.replace(/#/g,"<sup>♯</sup>").replace(/b/g,"<sup>♭</sup>");

  // --- APPLICATION STATE ---
  const state = {
    currentMode: "random",
    stepIndex: 0,
    currentKey: null,
    currentChord: null,
    chordCount: 0,
    cycleIndex: Math.floor(Math.random()*CYCLE_FIFTHS.length)
  };

  // --- DOM ELEMENTS ---
  const DOM = {
    chordEl: document.getElementById("chordDisplay"),
    playBtn: document.getElementById("playBtn"),
    statusLine: document.getElementById("statusLine"),
    listenBtn: document.getElementById("listenBtn"),
    nextBtn: document.getElementById("nextBtn"),
    statsBtn: document.getElementById("statsBtn"),
    statsLine: document.getElementById("statsLine"),
    statsCount: document.getElementById("statsCount"),
    infoBox: document.getElementById("infoBox"),
    keyLabel: document.getElementById("keyLabel"),
    stepLabel: document.getElementById("stepLabel"),
    randomHalfDim: document.getElementById("randomHalfDim"),
    randomDim: document.getElementById("randomDim"),
    randomOptions: document.querySelector(".random-options"),
    modeRadios: [...document.querySelectorAll("input[name='mode']")]
  };

  // --- AUDIO LAYER ---
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  const playChordAudio = chord => {
    if(!chord) return;
    const base = MIN_MIDI + SEMI.indexOf(chord.root);
    const notes = INTERVALS[chord.quality].map(i=>base+i).sort((a,b)=>a-b);
    if(chord.harmonic && chord.quality==="7") notes[1]+=1;

    const step = 0.3, dur = 0.5;
    const t0 = ctx.currentTime;

    // Arpeggio
    notes.forEach((m,i)=>{
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 440*Math.pow(2,(m-69)/12);
      g.gain.setValueAtTime(0, t0+i*step);
      g.gain.linearRampToValueAtTime(0.25, t0+i*step+0.05);
      g.gain.linearRampToValueAtTime(0, t0+i*step+dur);
      o.connect(g).connect(ctx.destination);
      o.start(t0+i*step);
      o.stop(t0+i*step+dur);
    });

    // Block chord
    const blockTime = t0 + notes.length*step + 2*step;
    notes.forEach(m=>{
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 440*Math.pow(2,(m-69)/12);
      g.gain.setValueAtTime(0, blockTime);
      g.gain.linearRampToValueAtTime(0.25, blockTime+0.05);
      g.gain.linearRampToValueAtTime(0, blockTime+dur);
      o.connect(g).connect(ctx.destination);
      o.start(blockTime);
      o.stop(blockTime+dur);
    });
  };

  // --- BUSINESS LOGIC LAYER ---
  const getRandomQualities = () => {
    const qualities = ["maj7","m7","7"];
    if(DOM.randomHalfDim?.checked) qualities.push("ø7");
    if(DOM.randomDim?.checked) qualities.push("o7");
    return qualities;
  };

  const generateChord = () => {
    switch(state.currentMode) {
      case "random": {
        const k = pick(Object.keys(KEYS));
        return { root: pick(KEYS[k]), quality: pick(getRandomQualities()) };
      }
      case "cycle": {
        state.cycleIndex = (state.cycleIndex+1) % CYCLE_FIFTHS.length;
        const k = CYCLE_FIFTHS[state.cycleIndex];
        return { root: KEYS[k][0], quality: "7" };
      }
      case "maj251":
      case "min251": {
        if(state.stepIndex===0) state.currentKey = pick(Object.keys(KEYS));
        const prog = PROGS[state.currentMode][state.stepIndex];
        const chord = { root: KEYS[state.currentKey][prog.deg], quality: prog.quality };
        if(prog.harmonic && state.currentMode==="min251") chord.harmonic = true;
        state.stepIndex = (state.stepIndex + 1) % 3;
        return { chord, prog };
      }
    }
  };

  // --- UI / RENDERING LAYER ---
  const renderChord = chord => {
    const html = chord ? formatAccidentals(chord.root) +
      (chord.quality==="maj7" ? "<span class='qual'>maj</span><sup>7</sup>" :
        chord.quality==="m7"   ? "<span class='qual'>m</span><sup>7</sup>" :
        chord.quality==="ø7"   ? "<sup>ø</sup><sup>7</sup>" :
        chord.quality==="o7"   ? "<sup>o</sup><sup>7</sup>" :
        "<sup>7</sup>") : "";
    DOM.chordEl.innerHTML = html;
  };

  const updateInfoBox = (prog) => {
    if(!prog) {
      DOM.infoBox.style.display = "none";
      return;
    }
    DOM.keyLabel.innerHTML = formatAccidentals(state.currentKey) + (state.currentMode==="maj251"?"":"m");
    DOM.stepLabel.textContent = prog.step;
    DOM.infoBox.style.display = "flex";
  };

  const updateRandomOptionsVisibility = () => {
    if(DOM.randomOptions)
      DOM.randomOptions.style.display = state.currentMode==="random" ? "flex" : "none";
  };

  const incrementCounter = () => {
    state.chordCount++;
    DOM.statsCount.textContent = state.chordCount;
  };

  const prettySpeechError = (code) => ({
    "no-speech": "no speech detected",
    "audio-capture": "microphone unavailable",
    "not-allowed": "microphone permission denied",
    "network": "network error"
  }[code] || code);


  const showError = (err) => {
    if (!DOM.statusLine) return;
    DOM.statusLine.hidden = false;
    DOM.statusLine.textContent = `Error: ${err}`;
  };

  const clearStatus = () => {
    if (!DOM.statusLine) return;
    DOM.statusLine.hidden = true;
    DOM.statusLine.textContent = "";
  };

  // --- CONTROLLER / EVENT LAYER ---
  const triggerNext = () => {
    if (DOM.nextBtn.disabled) return;
    animateButton(DOM.nextBtn);
    nextChordHandler();
    DOM.nextBtn.focus();
  };

  const nextChordHandler = () => {
    const result = generateChord();
    let chord, prog;
    if(result.chord) { // 251 progression
      chord = result.chord;
      prog = result.prog;
    } else {
      chord = result;
    }
    state.currentChord = chord;
    renderChord(chord);
    updateInfoBox(prog);
    DOM.playBtn.disabled = false;
    incrementCounter();
  };

  const animateButton = btn => {
    if(!btn) return;
    btn.classList.add("anticipate");
    setTimeout(()=>btn.classList.remove("anticipate"),150);
  };

  // Button events
  DOM.nextBtn.addEventListener("mousedown", ()=>{ animateButton(DOM.nextBtn); triggerNext(); });
  DOM.playBtn.addEventListener("mousedown", ()=>{ animateButton(DOM.playBtn); playChordAudio(state.currentChord); });
  DOM.statsBtn.addEventListener("mousedown", ()=>{ animateButton(DOM.statsBtn); DOM.statsLine.style.display = (DOM.statsLine.offsetParent!==null)?"none":"block"; });

  // Keyboard shortcuts
  document.addEventListener("keydown", e => {
    if(e.repeat) return;
    switch(e.code) {
      case "Space":
        e.preventDefault();
        triggerNext();
        break;
      case "KeyP":
        if(!DOM.playBtn.disabled) {
          animateButton(DOM.playBtn);
          playChordAudio(state.currentChord);
        }
        break;
      case "KeyS":
        if(!DOM.statsBtn.disabled) {
          animateButton(DOM.statsBtn);
          DOM.statsLine.style.display = (DOM.statsLine.offsetParent!==null)?"none":"block";
        }
        break;
    }
  });

  // Mode change
  DOM.modeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      state.currentMode = radio.value;
      state.stepIndex = 0;
      state.currentChord = null;
      DOM.chordEl.textContent = "";
      DOM.playBtn.disabled = true;
      updateRandomOptionsVisibility();
      DOM.infoBox.style.display = "none";
    });
  });

  // --- SPEECH INTEGRATION (UI stays here, business logic in speech.js) ---
  let speech = null;

  const setListeningUI = (isListening) => {
    if (!DOM.listenBtn) return;
    DOM.listenBtn.setAttribute("aria-pressed", String(isListening));
    DOM.listenBtn.textContent = isListening ? "🎤 Listening…" : "🎤 Listen";
  };


  const setListenAvailable = () => {
    const ok = window.SpeechController && window.SpeechController.isSupported && window.SpeechController.isSupported();
    if (!DOM.listenBtn) return;
    DOM.listenBtn.disabled = !ok;
    if (!ok) DOM.listenBtn.textContent = "🎤 Unavailable";
  };

  // --- SPEECH hookup
  setListenAvailable();

  if (window.SpeechController && window.SpeechController.isSupported && window.SpeechController.isSupported()) {
    speech = window.SpeechController.create({
      lang: "en-US",
      debug: true,
      onCommand: (cmd) => {
        if (cmd === "next") {
          triggerNext();
          return;
        }

        if (cmd === "stop-listening") {
          console.log("[speech] user said 'stop listening'");
          speech.stop();     // disables listening + updates button
          clearStatus();     // optional: clear error/status line
          return;
        }
      },
      onState: (isListening) => {
        setListeningUI(isListening);
        if (isListening) clearStatus();
      },
      onSession: (status, detail) => {
        if (status !== "error") return;

        // Don't stop listening on benign silence.
        if (detail === "no-speech") return;

        console.warn("Speech session:", detail);

        // revert button to Listen
        speech.stop();     

        // status line "Error: ..."
        showError(prettySpeechError(detail)); 
      },
      onError: (err) => {
        // Keep this for raw logging if you want
        console.warn("Speech:", err);
      }
    });

    DOM.listenBtn.addEventListener("mousedown", () => {
      animateButton(DOM.listenBtn);
      speech.toggle();
    });
  }



  // --- INIT ---
  updateRandomOptionsVisibility();
  DOM.playBtn.disabled = true;
});

