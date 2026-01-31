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

// Helper to create NoteName - keeps tests readable
export function N(letter: Letter, accidental: Accidental = 0): NoteName {
  return { letter, accidental };
}

// Pre-built constants for common notes (test convenience)
export const Note = {
  C: N("C"),
  C_SHARP: N("C", 1),
  D_FLAT: N("D", -1),
  D: N("D"),
  D_SHARP: N("D", 1),
  E_FLAT: N("E", -1),
  E: N("E"),
  E_SHARP: N("E", 1),
  F_FLAT: N("F", -1),
  F: N("F"),
  F_SHARP: N("F", 1),
  G_FLAT: N("G", -1),
  G: N("G"),
  G_SHARP: N("G", 1),
  A_FLAT: N("A", -1),
  A: N("A"),
  A_SHARP: N("A", 1),
  B_FLAT: N("B", -1),
  B: N("B"),
  B_SHARP: N("B", 1),
  C_FLAT: N("C", -1),
  // Double accidentals
  C_DOUBLE_SHARP: N("C", 2),
  D_DOUBLE_FLAT: N("D", -2),
  F_DOUBLE_SHARP: N("F", 2),
  B_DOUBLE_FLAT: N("B", -2),
  A_DOUBLE_FLAT: N("A", -2),
  G_DOUBLE_SHARP: N("G", 2),
} as const;

export type ChordQuality = "major" | "minor" | "diminished" | "augmented";

export interface ParsedChord {
  root: NoteName;
  bass: NoteName;
  quality: ChordQuality;
  chordTones: NoteName[]; // tertian stacking: root, 3rd, 5th, (7th), (9th), (11th), (13th)
}
