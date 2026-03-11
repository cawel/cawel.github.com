import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_SOUND,
  SOUNDS,
  SOUND_COLORS,
} from "../js/core/sound-metadata.js";

const indexHtml = readFileSync(join(process.cwd(), "index.html"), "utf8");

test("sound metadata is listed alphabetically by value", () => {
  const options = SOUNDS.map((sound) => sound.value);
  assert.deepEqual(options, ["bell", "sawtooth", "sine", "square", "triangle"]);
});

test("sound metadata includes marker and color map", () => {
  assert.equal(SOUNDS.length, 5);
  for (const sound of SOUNDS) {
    assert.match(sound.marker, /^\S+$/u);
    assert.match(sound.color, /^#[0-9a-fA-F]{6}$/);
    assert.equal(SOUND_COLORS[sound.value], sound.color);
  }
});

test("default sound exists in metadata", () => {
  assert.ok(SOUNDS.some((sound) => sound.value === DEFAULT_SOUND));
});

test("index keeps sound select placeholder for JS-populated metadata", () => {
  assert.match(indexHtml, /<select id="soundSelect"><\/select>/);
});
