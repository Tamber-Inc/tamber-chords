/**
 * Fuzz target for chordPalette
 *
 * Tests chord palette generation with various key and option combinations.
 * Looking for:
 * - Edge cases in scale degree calculations
 * - Invalid mode/option combinations
 * - Crashes in secondary dominant or borrowed chord generation
 */
import { chordPalette, type Key, type PaletteOptions } from "../src/buildChord";
import type { NoteName, Letter, Accidental } from "../src/noteName";

const LETTERS: Letter[] = ["A", "B", "C", "D", "E", "F", "G"];
const ACCIDENTALS: Accidental[] = [-2, -1, 0, 1, 2];
const MODES: ("major" | "minor")[] = ["major", "minor"];
const COLORS: ("triad" | "seventh" | "extended")[] = ["triad", "seventh", "extended"];
const EXTENSIONS: (7 | 9 | 11 | 13)[] = [7, 9, 11, 13];

function makeKey(data: Buffer): Key | null {
  if (data.length < 3) return null;

  const root: NoteName = {
    letter: LETTERS[data[0]! % LETTERS.length]!,
    accidental: ACCIDENTALS[data[1]! % ACCIDENTALS.length]!,
  };

  return {
    root,
    mode: MODES[data[2]! % MODES.length]!,
  };
}

function makeOptions(data: Buffer): PaletteOptions | undefined {
  if (data.length < 7) return undefined;

  return {
    color: COLORS[data[3]! % COLORS.length],
    maxExtension: EXTENSIONS[data[4]! % EXTENSIONS.length],
    includeDominants: data[5]! > 128,
    includeBorrowed: data[6]! > 128,
  };
}

module.exports.fuzz = function(data: Buffer) {
  const key = makeKey(data);
  if (!key) return;

  const opts = makeOptions(data);

  // Generate the palette - should never throw
  const palette = chordPalette(key, opts);

  // Sanity checks
  if (!Array.isArray(palette)) {
    throw new Error("chordPalette did not return an array");
  }

  if (palette.length === 0) {
    throw new Error("chordPalette returned empty array");
  }

  // Each spec should have required fields
  for (const spec of palette) {
    if (!spec.root || !spec.quality) {
      throw new Error("ChordSpec missing required fields");
    }
    if (!LETTERS.includes(spec.root.letter)) {
      throw new Error(`Invalid letter in generated spec: ${spec.root.letter}`);
    }
  }
};
