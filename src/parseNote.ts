import { N } from "./noteName";
import type { NoteName } from "./schemas";

export type ParsedNoteString = { note: NoteName; octave: number };

const NOTE_REGEX = /^([A-G])([#b]?)([0-8])$/;

/**
 * Parse a note string like "C4", "F#3", "Bb2" into a NoteName + octave.
 * Only supports single sharps/flats (no double accidentals) — this keeps
 * LLM output simple and unambiguous.
 */
export function parseNoteString(input: string): ParsedNoteString {
  const match = NOTE_REGEX.exec(input.trim());
  if (!match) {
    throw new Error(
      `Invalid note string: "${input}". Expected format: C4, F#3, Bb2 (letter + optional #/b + octave 0-8)`,
    );
  }

  const letter = match[1] as "A" | "B" | "C" | "D" | "E" | "F" | "G";
  const accidentalStr = match[2]!;
  const octave = parseInt(match[3]!, 10);

  const accidental = accidentalStr === "#" ? 1 : accidentalStr === "b" ? -1 : 0;

  return {
    note: N(letter, accidental),
    octave,
  };
}
