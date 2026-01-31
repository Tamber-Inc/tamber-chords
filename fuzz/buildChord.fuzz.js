/**
 * Fuzz target for buildChord and validateChordSpec
 *
 * Generates structured ChordSpec objects from raw bytes.
 */
const { buildChord, validateChordSpec } = require("../dist/index.js");

const LETTERS = ["A", "B", "C", "D", "E", "F", "G"];
const ACCIDENTALS = [-2, -1, 0, 1, 2];
const QUALITIES = [
  "maj", "min", "dim", "aug",
  "7", "maj7", "min7", "m7b5", "dim7",
  "9", "maj9", "min9",
  "11", "maj11", "min11",
  "13", "maj13", "min13",
];
const TENSIONS = ["b9", "#9", "#11", "b13"];
const OMITS = ["3", "5"];

function makeNote(byte1, byte2) {
  return {
    letter: LETTERS[byte1 % LETTERS.length],
    accidental: ACCIDENTALS[byte2 % ACCIDENTALS.length],
  };
}

function makeSpec(data) {
  if (data.length < 5) return null;

  const spec = {
    root: makeNote(data[0], data[1]),
    quality: QUALITIES[data[2] % QUALITIES.length],
  };

  // Optional: add tensions
  if (data.length > 3 && data[3] > 0) {
    const tensionCount = (data[3] % 4) + 1;
    spec.tensions = [];
    for (let i = 0; i < tensionCount && i + 4 < data.length; i++) {
      const tension = TENSIONS[data[4 + i] % TENSIONS.length];
      if (!spec.tensions.includes(tension)) {
        spec.tensions.push(tension);
      }
    }
  }

  // Optional: add omissions
  const omitOffset = 4 + (spec.tensions?.length ?? 0);
  if (data.length > omitOffset && data[omitOffset] > 128) {
    spec.omit = [];
    const omitCount = (data[omitOffset] % 2) + 1;
    for (let i = 0; i < omitCount && omitOffset + 1 + i < data.length; i++) {
      const omit = OMITS[data[omitOffset + 1 + i] % OMITS.length];
      if (!spec.omit.includes(omit)) {
        spec.omit.push(omit);
      }
    }
  }

  // Optional: add bass note
  const bassOffset = omitOffset + 1 + (spec.omit?.length ?? 0);
  if (data.length > bassOffset + 1 && data[bassOffset] > 200) {
    spec.bass = makeNote(data[bassOffset + 1], data[bassOffset + 2] ?? 0);
  }

  return spec;
}

module.exports.fuzz = function(data) {
  const spec = makeSpec(data);
  if (!spec) return;

  const validationResult = validateChordSpec(spec);
  const buildResult = buildChord(spec);

  // If validation passes but build fails, that's a bug
  if (validationResult.ok && !buildResult.ok) {
    throw new Error(
      `Validation passed but build failed: ${buildResult.error.message}`
    );
  }
};
