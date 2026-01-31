/**
 * Fuzz target for chordPalette
 *
 * Tests chord palette generation with various key and option combinations.
 */
const { chordPalette } = require("../dist/index.js");

const LETTERS = ["A", "B", "C", "D", "E", "F", "G"];
const ACCIDENTALS = [-2, -1, 0, 1, 2];
const MODES = ["major", "minor"];
const COLORS = ["triad", "seventh", "extended"];
const EXTENSIONS = [7, 9, 11, 13];

function makeKey(data) {
  if (data.length < 3) return null;

  return {
    root: {
      letter: LETTERS[data[0] % LETTERS.length],
      accidental: ACCIDENTALS[data[1] % ACCIDENTALS.length],
    },
    mode: MODES[data[2] % MODES.length],
  };
}

function makeOptions(data) {
  if (data.length < 7) return undefined;

  return {
    color: COLORS[data[3] % COLORS.length],
    maxExtension: EXTENSIONS[data[4] % EXTENSIONS.length],
    includeDominants: data[5] > 128,
    includeBorrowed: data[6] > 128,
  };
}

module.exports.fuzz = function(data) {
  const key = makeKey(data);
  if (!key) return;

  const opts = makeOptions(data);
  const palette = chordPalette(key, opts);

  if (!Array.isArray(palette)) {
    throw new Error("chordPalette did not return an array");
  }

  if (palette.length === 0) {
    throw new Error("chordPalette returned empty array");
  }

  for (const spec of palette) {
    if (!spec.root || !spec.quality) {
      throw new Error("ChordSpec missing required fields");
    }
    if (!LETTERS.includes(spec.root.letter)) {
      throw new Error(`Invalid letter in generated spec: ${spec.root.letter}`);
    }
  }
};
