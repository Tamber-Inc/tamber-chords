export type Letter = "A" | "B" | "C" | "D" | "E" | "F" | "G";

// -2 = double flat, -1 = flat, 0 = natural, 1 = sharp, 2 = double sharp
export type Accidental = -2 | -1 | 0 | 1 | 2;

export interface NoteName {
  letter: Letter;
  accidental: Accidental;
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

export type TriadQuality = "major" | "minor" | "diminished" | "augmented" | "sus2" | "sus4" | "power";

export type ChordType =
  | "maj"
  | "min"
  | "dim"
  | "aug"
  | "5"
  | "7"
  | "maj7"
  | "min7"
  | "dim7"
  | "m7b5"
  | "9"
  | "maj9"
  | "min9"
  | "11"
  | "maj11"
  | "min11";

// Interval degrees and their accidentals
// e.g., Map { 1 => 0, 3 => 0, 5 => 0 } for major triad
// e.g., Map { 1 => 0, 3 => -1, 5 => 0, 7 => -1 } for minor 7th
export type Intervals = Map<number, Accidental>;

export interface ParsedChord {
  input: string;
  root: NoteName;
  bass: NoteName;
  triadQuality: TriadQuality;
  chordType: ChordType;
  intervals: Intervals;
  tones: NoteName[]; // tertian stacking: root, 3rd, 5th, (7th), (9th), (11th), (13th)
}

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
