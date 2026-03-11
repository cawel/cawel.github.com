"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const AudioEngine = require("../audio-engine.js");

class MockOscillator {
  constructor() {
    this.frequency = { value: 0 };
    this.connected = null;
    this.startTime = null;
    this.stopTime = null;
  }

  connect(node) {
    this.connected = node;
    return node;
  }

  start(time) {
    this.startTime = time;
  }

  stop(time) {
    this.stopTime = time;
  }
}

class MockGain {
  constructor() {
    this.gain = {
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
    };
    this.connected = null;
  }

  connect(node) {
    this.connected = node;
    return this;
  }
}

class MockDestination {}

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = new MockDestination();
    this.oscillators = [];
    this.gainNodes = [];
  }

  createOscillator() {
    const osc = new MockOscillator();
    this.oscillators.push(osc);
    return osc;
  }

  createGain() {
    const gain = new MockGain();
    this.gainNodes.push(gain);
    return gain;
  }
}

test("AudioEngine creates with a valid AudioContext", () => {
  const mockCtx = new MockAudioContext();
  const engine = AudioEngine.create(mockCtx);
  assert.ok(engine);
  assert.ok(engine.playChord);
  assert.ok(engine.playNote);
});

test("AudioEngine throws when created without AudioContext", () => {
  assert.throws(() => {
    AudioEngine.create(null);
  }, /AudioContext is required/);
});

test("playChord ignores empty note arrays", () => {
  const mockCtx = new MockAudioContext();
  const engine = AudioEngine.create(mockCtx);

  engine.playChord([]);
  assert.equal(mockCtx.oscillators.length, 0);
});

test("playChord creates oscillators for arpeggio and block voicing", () => {
  const mockCtx = new MockAudioContext();
  const engine = AudioEngine.create(mockCtx);
  const midiNotes = [60, 64, 67]; // C, E, G

  engine.playChord(midiNotes);

  // 3 notes for arpeggio + 3 notes for block = 6 oscillators
  assert.equal(mockCtx.oscillators.length, 6);
  assert.equal(mockCtx.gainNodes.length, 6);
});

test("playChord sets correct MIDI frequencies", () => {
  const mockCtx = new MockAudioContext();
  const engine = AudioEngine.create(mockCtx);

  engine.playChord([60]); // C4 = 261.63 Hz

  // Should create 2 oscillators: one for arpeggio, one for block
  assert.equal(mockCtx.oscillators.length, 2);

  // Both should have the same frequency (C4)
  const expectedFreq = 440 * Math.pow(2, (60 - 69) / 12); // ~261.63 Hz
  assert.ok(
    Math.abs(mockCtx.oscillators[0].frequency.value - expectedFreq) < 0.1,
  );
  assert.ok(
    Math.abs(mockCtx.oscillators[1].frequency.value - expectedFreq) < 0.1,
  );
});

test("playNote starts and stops oscillators at correct times", () => {
  const mockCtx = new MockAudioContext();
  const engine = AudioEngine.create(mockCtx);
  const startTime = 0.5;
  const duration = 0.5;

  engine.playNote(60, startTime, duration);

  assert.equal(mockCtx.oscillators.length, 1);
  const osc = mockCtx.oscillators[0];
  assert.equal(osc.startTime, startTime);
  assert.equal(osc.stopTime, startTime + duration);
});

test("playChord respects custom arpeggio step timing", () => {
  const mockCtx = new MockAudioContext();
  mockCtx.currentTime = 0;
  const engine = AudioEngine.create(mockCtx);
  const midiNotes = [60, 64, 67]; // 3 notes

  engine.playChord(midiNotes, { arpeggioStep: 0.1 });

  const oscs = mockCtx.oscillators;
  // Arpeggio: notes at 0, 0.1, 0.2
  assert.equal(oscs[0].startTime, 0);
  assert.equal(oscs[1].startTime, 0.1);
  assert.equal(oscs[2].startTime, 0.2);

  // Block: all at 0 + (3 * 0.1) + (2 * 0.1) = 0.5
  const blockTime = 0 + 3 * 0.1 + 2 * 0.1;
  assert.equal(oscs[3].startTime, blockTime);
  assert.equal(oscs[4].startTime, blockTime);
  assert.equal(oscs[5].startTime, blockTime);
});
