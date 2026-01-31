/**
 * Fuzz target for buildChord and validateChordSpec
 *
 * This fuzzes the chord building logic by generating structured ChordSpec
 * objects from raw bytes. Tests:
 * - Validation logic correctness
 * - Interval calculation edge cases
 * - Tone calculation with extreme accidentals
 */
import { buildChord, validateChordSpec, type ChordSpec, type ChordQuality, type Tension, type OmitDegree } from "../src/buildChord";
import type { NoteName, Letter, Accidental } from "../src/noteName";

const LETTERS: Letter[] = ["A", "B", "C", "D", "E", "F", "G"];
const ACCIDENTALS: Accidental[] = [-2, -1, 0, 1, 2];
const QUALITIES: ChordQuality[] = [
  "maj", "min", "dim", "aug",
  "7", "maj7", "min7", "m7b5", "dim7",
  "9", "maj9", "min9",
  "11", "maj11", "min11",
  "13", "maj13", "min13",
];
const TENSIONS: Tension[] = ["b9", "#9", "#11", "b13"];
const OMITS: OmitDegree[] = ["3", "5"];

function makeNote(byte1: number, byte2: number): NoteName {
  return {
    letter: LETTERS[byte1 % LETTERS.length]!,
    accidental: ACCIDENTALS[byte2 % ACCIDENTALS.length]!,
  };
}

function makeSpec(data: Buffer): ChordSpec | null {
  if (data.length < 5) return null;

  const spec: ChordSpec = {
    root: makeNote(data[0]!, data[1]!),
    quality: QUALITIES[data[2]! % QUALITIES.length]!,
  };

  // Optional: add tensions based on byte 3
  if (data.length > 3 && data[3]! > 0) {
    const tensionCount = (data[3]! % 4) + 1;
    spec.tensions = [];
    for (let i = 0; i < tensionCount && i + 4 < data.length; i++) {
      const tension = TENSIONS[data[4 + i]! % TENSIONS.length]!;
      if (!spec.tensions.includes(tension)) {
        spec.tensions.push(tension);
      }
    }
  }

  // Optional: add omissions
  const omitOffset = 4 + (spec.tensions?.length ?? 0);
  if (data.length > omitOffset && data[omitOffset]! > 128) {
    spec.omit = [];
    const omitCount = (data[omitOffset]! % 2) + 1;
    for (let i = 0; i < omitCount && omitOffset + 1 + i < data.length; i++) {
      const omit = OMITS[data[omitOffset + 1 + i]! % OMITS.length]!;
      if (!spec.omit.includes(omit)) {
        spec.omit.push(omit);
      }
    }
  }

  // Optional: add bass note
  const bassOffset = omitOffset + 1 + (spec.omit?.length ?? 0);
  if (data.length > bassOffset + 1 && data[bassOffset]! > 200) {
    spec.bass = makeNote(data[bassOffset + 1]!, data[bassOffset + 2] ?? 0);
  }

  return spec;
}

module.exports.fuzz = function(data: Buffer) {
  const spec = makeSpec(data);
  if (!spec) return;

  // Test validation
  const validationResult = validateChordSpec(spec);

  // Test building (which also validates internally)
  const buildResult = buildChord(spec);

  // If validation says ok, build should also succeed
  if (validationResult.ok && !buildResult.ok) {
    throw new Error(
      `Validation passed but build failed: ${buildResult.error.message}`
    );
  }
};
