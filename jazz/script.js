"use strict";

document.addEventListener("DOMContentLoaded", () => {

  // --- DATA ---
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

  const pick = arr => arr[Math.floor(Math.random()*arr.length)];

  // --- AUDIO ---
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  const MIN_MIDI = 60; // C4
  const INTERVALS = { maj7:[0,4,7,11], m7:[0,3,7,10], 7:[0,4,7,10], ø7:[0,3,6,10], o7:[0,3,6,9] };
  const SEMI = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];

  // --- STATE ---
  let currentMode="random", stepIndex=0, currentKey=null, currentChord=null, chordCount=0;
  let cycleIndex = Math.floor(Math.random()*CYCLE_FIFTHS.length);

  // --- DOM ELEMENTS ---
  const chordEl = document.getElementById("chordDisplay");
  const playBtn = document.getElementById("playBtn");
  const nextBtn = document.getElementById("nextBtn");
  const statsBtn = document.getElementById("statsBtn");
  const statsLine = document.getElementById("statsLine");
  const statsCount = document.getElementById("statsCount");
  const infoBox = document.getElementById("infoBox");
  const keyLabel = document.getElementById("keyLabel");
  const stepLabel = document.getElementById("stepLabel");
  const randomHalfDim = document.getElementById("randomHalfDim");
  const randomDim = document.getElementById("randomDim");
  const randomOptions = document.querySelector(".random-options");
  const modeRadios = [...document.querySelectorAll("input[name='mode']")];

  // --- HELPERS ---
  const animateButton = btn => {
    if(!btn) return;
    btn.classList.add("anticipate");
    setTimeout(()=>btn.classList.remove("anticipate"),150);
  };

  const fmt = s => s.replace(/#/g,"<sup>♯</sup>").replace(/b/g,"<sup>♭</sup>");
  const renderChord = chord => fmt(chord.root) +
    (chord.quality==="maj7" ? "<span class='qual'>maj</span><sup>7</sup>" :
     chord.quality==="m7"   ? "<span class='qual'>m</span><sup>7</sup>" :
     chord.quality==="ø7"   ? "<sup>ø</sup><sup>7</sup>" :
     chord.quality==="o7"   ? "<sup>o</sup><sup>7</sup>" :
                               "<sup>7</sup>");

  const playChordAudio = chord => {
    if(!chord) return;
    const base=MIN_MIDI + SEMI.indexOf(chord.root);
    let notes=INTERVALS[chord.quality].map(i=>base+i);
    if(chord.harmonic && chord.quality==="7") notes[1]+=1;
    notes.sort((a,b)=>a-b);
    const step = 0.3, dur = 0.5;
    const t0 = ctx.currentTime;

    // Arpeggio
    notes.forEach((m,i)=>{
      const o=ctx.createOscillator();
      const g=ctx.createGain();
      o.frequency.value=440*Math.pow(2,(m-69)/12);
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
      const o=ctx.createOscillator();
      const g=ctx.createGain();
      o.frequency.value=440*Math.pow(2,(m-69)/12);
      g.gain.setValueAtTime(0, blockTime);
      g.gain.linearRampToValueAtTime(0.25, blockTime+0.05);
      g.gain.linearRampToValueAtTime(0, blockTime+dur);
      o.connect(g).connect(ctx.destination);
      o.start(blockTime);
      o.stop(blockTime+dur);
    });
  };

  const getRandomQualities = () => {
    const qualities = ["maj7","m7","7"];
    // read checkboxes **at the moment of chord generation**
    if(randomHalfDim?.checked) qualities.push("ø7");
    if(randomDim?.checked) qualities.push("o7");
    return qualities;
  };

  const updateRandomOptionsVisibility = () => {
    if(randomOptions)
      randomOptions.style.display = currentMode==="random" ? "flex" : "none";
  };

  // --- CHORD GENERATION ---
  const nextChord = () => {
    if(currentMode==="random"){
      const k = pick(Object.keys(KEYS));
      const qualities = getRandomQualities();
      currentChord = { root: pick(KEYS[k]), quality: pick(qualities) };
      infoBox.style.display="none";
    } else if(currentMode==="cycle"){
      cycleIndex=(cycleIndex+1)%CYCLE_FIFTHS.length;
      const k = CYCLE_FIFTHS[cycleIndex];
      currentChord = { root: KEYS[k][0], quality: "7" };
      infoBox.style.display="none";
    } else { // maj251 or min251
      if(stepIndex===0) currentKey=pick(Object.keys(KEYS));
      const prog=PROGS[currentMode][stepIndex];
      currentChord={root:KEYS[currentKey][prog.deg], quality:prog.quality};
      if(prog.harmonic && currentMode==="min251") currentChord.harmonic=true;
      keyLabel.innerHTML=fmt(currentKey) + (currentMode==="maj251"?"":"m");
      stepLabel.textContent=prog.step;
      infoBox.style.display="flex";
      stepIndex=(stepIndex+1)%3;
    }

    chordEl.innerHTML=renderChord(currentChord);
    playBtn.disabled=false;
    chordCount++;
    statsCount.textContent = chordCount; // update counter
  };

  // --- EVENTS ---
  nextBtn.addEventListener("mousedown",()=>{ animateButton(nextBtn); nextChord(); });
  playBtn.addEventListener("mousedown",()=>{ animateButton(playBtn); playChordAudio(currentChord); });
  statsBtn.addEventListener("mousedown",()=>{ animateButton(statsBtn); statsLine.style.display = (statsLine.offsetParent!==null)?"none":"block"; });

  document.addEventListener("keydown", e=>{
    if(e.repeat) return;
    switch(e.code){
      case "Space":
        e.preventDefault();
        animateButton(nextBtn);
        nextChord();
        break;
      case "KeyP":
        animateButton(playBtn);
        playChordAudio(currentChord);
        break;
      case "KeyS":
        animateButton(statsBtn);
        statsLine.style.display = (statsLine.offsetParent!==null)?"none":"block";
        break;
    }
  });

  modeRadios.forEach(radio=>{
    radio.addEventListener("change", ()=>{
      currentMode=radio.value;
      stepIndex=0;
      currentChord=null;
      chordEl.textContent="";
      playBtn.disabled=true;
      updateRandomOptionsVisibility();
      infoBox.style.display="none";
    });
  });

  // --- INIT ---
  updateRandomOptionsVisibility();
  playBtn.disabled=true;

});

