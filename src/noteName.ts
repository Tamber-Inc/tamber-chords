// Types derived from Zod schemas - see schemas.ts
import type { Letter, Accidental, NoteName, TriadQuality, ChordType } from "./schemas";
export type { Letter, Accidental, NoteName, TriadQuality, ChordType } from "./schemas";

// Intervals is a Map type - can't be represented in Zod/JSON directly
// Keep this here for runtime use
export type Intervals = Map<number, Accidental>;

// ParsedChord uses Intervals (Map) so we keep the full interface here
// For JSON serialization, see ParsedChordJson in schemas.ts
export interface ParsedChord {
  input: string;
  root: NoteName;
  bass: NoteName;
  triadQuality: TriadQuality;
  chordType: ChordType;
  intervals: Intervals;
  tones: NoteName[];
}

// Convert NoteName to pitch class (0-11)
export function toPitchClass(note: NoteName): number {
  const letterToSemitone: Record<Letter, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  return (letterToSemitone[note.letter] + note.accidental + 12) % 12;
}

// Helper to create NoteName
export function N(letter: Letter, accidental: Accidental = 0): NoteName {
  return { letter, accidental };
}

// All note constants
export const Note = {
  // Naturals
  C: N("C"),
  D: N("D"),
  E: N("E"),
  F: N("F"),
  G: N("G"),
  A: N("A"),
  B: N("B"),
  // Sharps
  C_SHARP: N("C", 1),
  D_SHARP: N("D", 1),
  E_SHARP: N("E", 1),
  F_SHARP: N("F", 1),
  G_SHARP: N("G", 1),
  A_SHARP: N("A", 1),
  B_SHARP: N("B", 1),
  // Flats
  C_FLAT: N("C", -1),
  D_FLAT: N("D", -1),
  E_FLAT: N("E", -1),
  F_FLAT: N("F", -1),
  G_FLAT: N("G", -1),
  A_FLAT: N("A", -1),
  B_FLAT: N("B", -1),
  // Double sharps
  C_DOUBLE_SHARP: N("C", 2),
  D_DOUBLE_SHARP: N("D", 2),
  E_DOUBLE_SHARP: N("E", 2),
  F_DOUBLE_SHARP: N("F", 2),
  G_DOUBLE_SHARP: N("G", 2),
  A_DOUBLE_SHARP: N("A", 2),
  B_DOUBLE_SHARP: N("B", 2),
  // Double flats
  C_DOUBLE_FLAT: N("C", -2),
  D_DOUBLE_FLAT: N("D", -2),
  E_DOUBLE_FLAT: N("E", -2),
  F_DOUBLE_FLAT: N("F", -2),
  G_DOUBLE_FLAT: N("G", -2),
  A_DOUBLE_FLAT: N("A", -2),
  B_DOUBLE_FLAT: N("B", -2),
} as const;

export class ChordParseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly position?: number
  ) {
    super(message);
    this.name = "ChordParseError";
  }
}
