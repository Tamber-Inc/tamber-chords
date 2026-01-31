import type {
  NoteName,
  Letter,
  Accidental,
  TriadQuality,
  ChordType,
  Intervals,
  ParsedChord,
} from "./noteName";
import { N, toPitchClass, ChordParseError } from "./noteName";

// Letter sequence for interval calculation
const LETTERS: Letter[] = ["C", "D", "E", "F", "G", "A", "B"];

// Semitone offsets for natural letters
const LETTER_SEMITONES: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

// Base semitone values for each interval degree (before accidental modification)
// These represent the "default" interval quality (major for 2,3,6,7,9,13; perfect for 1,4,5,11)
const BASE_INTERVAL_SEMITONES: Record<number, number> = {
  1: 0,
  2: 2, // major 2nd
  3: 4, // major 3rd
  4: 5, // perfect 4th
  5: 7, // perfect 5th
  6: 9, // major 6th
  7: 11, // major 7th
  9: 2, // major 9th (same as 2nd, octave displaced)
  11: 5, // perfect 11th (same as 4th)
  13: 9, // major 13th (same as 6th)
};

// Letter offset from root for each interval degree
const INTERVAL_LETTER_OFFSET: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  9: 1, // 9th = 2nd
  11: 3, // 11th = 4th
  13: 5, // 13th = 6th
};

/**
 * Get the letter for a given interval degree from a root note
 */
function getIntervalLetter(rootLetter: Letter, intervalDegree: number): Letter {
  const rootIndex = LETTERS.indexOf(rootLetter);
  const offset = INTERVAL_LETTER_OFFSET[intervalDegree];
  return LETTERS[(rootIndex + offset) % 7];
}

/**
 * Calculate a note from a root and interval specification
 */
function calculateTone(
  root: NoteName,
  intervalDegree: number,
  intervalAccidental: Accidental
): NoteName {
  const targetLetter = getIntervalLetter(root.letter, intervalDegree);
  const baseSemitones = BASE_INTERVAL_SEMITONES[intervalDegree];
  const targetSemitonesFromRoot = baseSemitones + intervalAccidental;

  // Calculate actual pitch class we're aiming for
  const rootPitchClass = toPitchClass(root);
  const targetPitchClass = (rootPitchClass + targetSemitonesFromRoot + 12) % 12;

  // Calculate what pitch class the natural target letter gives us
  const naturalPitchClass = LETTER_SEMITONES[targetLetter];

  // Calculate required accidental
  let accidental = targetPitchClass - naturalPitchClass;

  // Normalize to -2..2 range
  if (accidental > 2) accidental -= 12;
  if (accidental < -2) accidental += 12;

  return N(targetLetter, accidental as Accidental);
}

/**
 * Calculate tones from root and intervals map
 */
function calculateTones(root: NoteName, intervals: Intervals): NoteName[] {
  // Sort intervals in tertian order: 1, 3, 5, 7, 9, 11, 13
  const sortOrder = [1, 3, 5, 7, 9, 11, 13];
  const sortedDegrees = [...intervals.keys()].sort(
    (a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b)
  );

  return sortedDegrees.map((degree) =>
    calculateTone(root, degree, intervals.get(degree)!)
  );
}

// Chord type definitions: what intervals each chord type contains
interface ChordTypeDefinition {
  triadQuality: TriadQuality;
  intervals: [number, Accidental][];
}

const CHORD_TYPES: Record<ChordType, ChordTypeDefinition> = {
  maj: {
    triadQuality: "major",
    intervals: [
      [1, 0],
      [3, 0],
      [5, 0],
    ],
  },
  min: {
    triadQuality: "minor",
    intervals: [
      [1, 0],
      [3, -1],
      [5, 0],
    ],
  },
  dim: {
    triadQuality: "diminished",
    intervals: [
      [1, 0],
      [3, -1],
      [5, -1],
    ],
  },
  aug: {
    triadQuality: "augmented",
    intervals: [
      [1, 0],
      [3, 0],
      [5, 1],
    ],
  },
  "5": {
    triadQuality: "power",
    intervals: [
      [1, 0],
      [5, 0],
    ],
  },
  "7": {
    triadQuality: "major",
    intervals: [
      [1, 0],
      [3, 0],
      [5, 0],
      [7, -1],
    ],
  },
  maj7: {
    triadQuality: "major",
    intervals: [
      [1, 0],
      [3, 0],
      [5, 0],
      [7, 0],
    ],
  },
  min7: {
    triadQuality: "minor",
    intervals: [
      [1, 0],
      [3, -1],
      [5, 0],
      [7, -1],
    ],
  },
  dim7: {
    triadQuality: "diminished",
    intervals: [
      [1, 0],
      [3, -1],
      [5, -1],
      [7, -2],
    ],
  },
  m7b5: {
    triadQuality: "diminished",
    intervals: [
      [1, 0],
      [3, -1],
      [5, -1],
      [7, -1],
    ],
  },
  "9": {
    triadQuality: "major",
    intervals: [
      [1, 0],
      [3, 0],
      [5, 0],
      [7, -1],
      [9, 0],
    ],
  },
  maj9: {
    triadQuality: "major",
    intervals: [
      [1, 0],
      [3, 0],
      [5, 0],
      [7, 0],
      [9, 0],
    ],
  },
  min9: {
    triadQuality: "minor",
    intervals: [
      [1, 0],
      [3, -1],
      [5, 0],
      [7, -1],
      [9, 0],
    ],
  },
  "11": {
    triadQuality: "major",
    intervals: [
      [1, 0],
      [3, 0],
      [5, 0],
      [7, -1],
      [9, 0],
      [11, 0],
    ],
  },
  maj11: {
    triadQuality: "major",
    intervals: [
      [1, 0],
      [3, 0],
      [5, 0],
      [7, 0],
      [9, 0],
      [11, 0],
    ],
  },
  min11: {
    triadQuality: "minor",
    intervals: [
      [1, 0],
      [3, -1],
      [5, 0],
      [7, -1],
      [9, 0],
      [11, 0],
    ],
  },
};

/**
 * Parse a root note from the beginning of a chord string
 * Returns the NoteName and the remaining string
 */
function parseRootNote(input: string): { root: NoteName; rest: string } {
  if (input.length === 0) {
    throw new ChordParseError("Empty chord string", "EMPTY_INPUT");
  }

  const letter = input[0].toUpperCase();
  if (!LETTERS.includes(letter as Letter)) {
    throw new ChordParseError(
      `Invalid root note: ${input[0]}`,
      "INVALID_ROOT",
      0
    );
  }

  let accidental: Accidental = 0;
  let consumed = 1;

  // Check for accidentals
  if (input.length > 1) {
    if (input[1] === "#") {
      accidental = 1;
      consumed = 2;
      // Check for double sharp
      if (input.length > 2 && input[2] === "#") {
        accidental = 2;
        consumed = 3;
      }
    } else if (input[1] === "b") {
      accidental = -1;
      consumed = 2;
      // Check for double flat
      if (input.length > 2 && input[2] === "b") {
        accidental = -2;
        consumed = 3;
      }
    }
  }

  return {
    root: N(letter as Letter, accidental),
    rest: input.slice(consumed),
  };
}

/**
 * Parse the chord quality/type from the remaining string after root note
 * Returns the ChordType and the remaining string (for slash chords)
 */
function parseChordType(input: string): { chordType: ChordType; rest: string } {
  // Handle slash chord - extract bass note portion first
  const slashIndex = input.indexOf("/");
  const qualityPart = slashIndex >= 0 ? input.slice(0, slashIndex) : input;
  const rest = slashIndex >= 0 ? input.slice(slashIndex) : "";

  // Check each possible chord type pattern (longest first to avoid partial matches)
  const patterns: [RegExp, ChordType][] = [
    // Extended chords (must come before simpler ones)
    [/^maj11/i, "maj11"],
    [/^min11/i, "min11"],
    [/^m11/, "min11"],
    [/^maj9/i, "maj9"],
    [/^min9/i, "min9"],
    [/^m9/, "min9"],
    [/^11/, "11"],
    [/^9/, "9"],
    // Seventh chords
    [/^maj7/i, "maj7"],
    [/^M7/, "maj7"],
    [/^min7/i, "min7"],
    [/^m7b5/, "m7b5"],
    [/^m7/, "min7"],
    [/^dim7/i, "dim7"],
    [/^7/, "7"],
    // Triads
    [/^maj/i, "maj"],
    [/^min/i, "min"],
    [/^m/, "min"],
    [/^dim/i, "dim"],
    [/^aug/i, "aug"],
    [/^\+/, "aug"],
    [/^5/, "5"],
  ];

  for (const [pattern, chordType] of patterns) {
    const match = qualityPart.match(pattern);
    if (match) {
      const remainder = qualityPart.slice(match[0].length);
      if (remainder.length === 0) {
        return { chordType, rest };
      }
    }
  }

  // Default: empty string after root = major triad
  if (qualityPart === "") {
    return { chordType: "maj", rest };
  }

  throw new ChordParseError(
    `Unknown chord quality: ${qualityPart}`,
    "INVALID_QUALITY"
  );
}

/**
 * Parse a chord string into its components
 */
export function parseChord(input: string): ParsedChord {
  if (!input || input.trim() === "") {
    throw new ChordParseError("Empty chord string", "EMPTY_INPUT");
  }

  const trimmed = input.trim();

  // Parse root note
  const { root, rest: afterRoot } = parseRootNote(trimmed);

  // Parse chord type
  const { chordType, rest: afterType } = parseChordType(afterRoot);

  // Parse bass note if present (slash chord)
  let bass = root;
  if (afterType.startsWith("/")) {
    const bassInput = afterType.slice(1);
    if (bassInput.length === 0) {
      throw new ChordParseError(
        "Missing bass note after /",
        "MISSING_BASS_NOTE"
      );
    }
    const { root: bassNote, rest: remaining } = parseRootNote(bassInput);
    if (remaining.length > 0) {
      throw new ChordParseError(
        `Unexpected characters after bass note: ${remaining}`,
        "INVALID_BASS_NOTE"
      );
    }
    bass = bassNote;
  }

  // Get chord definition
  const definition = CHORD_TYPES[chordType];
  const intervals: Intervals = new Map(definition.intervals);
  const tones = calculateTones(root, intervals);

  return {
    input,
    root,
    bass,
    triadQuality: definition.triadQuality,
    chordType,
    intervals,
    tones,
  };
}

/**
 * Format accidental to string
 */
function formatAccidental(accidental: Accidental): string {
  switch (accidental) {
    case -2:
      return "bb";
    case -1:
      return "b";
    case 0:
      return "";
    case 1:
      return "#";
    case 2:
      return "##";
  }
}

/**
 * Format a NoteName to string
 */
function formatNote(note: NoteName): string {
  return note.letter + formatAccidental(note.accidental);
}

/**
 * Format chord type to canonical string representation
 */
function formatChordType(chordType: ChordType): string {
  // Use canonical representations
  switch (chordType) {
    case "maj":
      return "";
    case "min":
      return "m";
    case "dim":
      return "dim";
    case "aug":
      return "aug";
    case "5":
      return "5";
    case "7":
      return "7";
    case "maj7":
      return "maj7";
    case "min7":
      return "m7";
    case "dim7":
      return "dim7";
    case "m7b5":
      return "m7b5";
    case "9":
      return "9";
    case "maj9":
      return "maj9";
    case "min9":
      return "m9";
    case "11":
      return "11";
    case "maj11":
      return "maj11";
    case "min11":
      return "m11";
  }
}

/**
 * Format a ParsedChord back to a chord symbol string
 */
export function formatChord(chord: ParsedChord): string {
  let result = formatNote(chord.root);
  result += formatChordType(chord.chordType);

  // Add bass note if different from root
  if (
    chord.bass.letter !== chord.root.letter ||
    chord.bass.accidental !== chord.root.accidental
  ) {
    result += "/" + formatNote(chord.bass);
  }

  return result;
}
