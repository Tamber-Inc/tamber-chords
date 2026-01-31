import type { NoteName, Letter, Accidental } from "./noteName";
import { N, toPitchClass } from "./noteName";

// ============================================================================
// Types
// ============================================================================

export type ChordQuality =
  | "maj" | "min" | "dim" | "aug"
  | "7" | "maj7" | "min7" | "m7b5" | "dim7"
  | "9" | "maj9" | "min9"
  | "11" | "maj11" | "min11"
  | "13" | "maj13" | "min13";

export type Tension = "b9" | "#9" | "#11" | "b13";
export type OmitDegree = "3" | "5";

export type ChordSpec = {
  root: NoteName;
  quality: ChordQuality;
  tensions?: Tension[];
  omit?: OmitDegree[];
  bass?: NoteName;
};

export type Key = {
  root: NoteName;
  mode: "major" | "minor";
};

export type PaletteOptions = {
  color?: "triad" | "seventh" | "extended";
  maxExtension?: 7 | 9 | 11 | 13;
  includeDominants?: boolean;
  includeBorrowed?: boolean;
};

export type Chord = {
  symbol: string;
  tones: NoteName[];
  bass?: NoteName;
};

export type ChordError = {
  code: string;
  message: string;
};

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: ChordError };

// ============================================================================
// Constants
// ============================================================================

const LETTERS: Letter[] = ["C", "D", "E", "F", "G", "A", "B"];

const LETTER_SEMITONES: Record<Letter, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

// Base semitone values for each interval degree
const BASE_INTERVAL_SEMITONES: Record<number, number> = {
  1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11,
  9: 2, 11: 5, 13: 9,
};

// Letter offset from root for each interval degree
const INTERVAL_LETTER_OFFSET: Record<number, number> = {
  1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6,
  9: 1, 11: 3, 13: 5,
};

// Quality definitions: [degree, accidental offset from major/perfect]
type IntervalDef = [number, Accidental];

const QUALITY_INTERVALS: Record<ChordQuality, IntervalDef[]> = {
  // Triads
  maj:   [[1, 0], [3, 0], [5, 0]],
  min:   [[1, 0], [3, -1], [5, 0]],
  dim:   [[1, 0], [3, -1], [5, -1]],
  aug:   [[1, 0], [3, 0], [5, 1]],
  // Sevenths
  "7":     [[1, 0], [3, 0], [5, 0], [7, -1]],
  maj7:    [[1, 0], [3, 0], [5, 0], [7, 0]],
  min7:    [[1, 0], [3, -1], [5, 0], [7, -1]],
  m7b5:    [[1, 0], [3, -1], [5, -1], [7, -1]],
  dim7:    [[1, 0], [3, -1], [5, -1], [7, -2]],
  // Ninths
  "9":     [[1, 0], [3, 0], [5, 0], [7, -1], [9, 0]],
  maj9:    [[1, 0], [3, 0], [5, 0], [7, 0], [9, 0]],
  min9:    [[1, 0], [3, -1], [5, 0], [7, -1], [9, 0]],
  // Elevenths
  "11":    [[1, 0], [3, 0], [5, 0], [7, -1], [9, 0], [11, 0]],
  maj11:   [[1, 0], [3, 0], [5, 0], [7, 0], [9, 0], [11, 0]],
  min11:   [[1, 0], [3, -1], [5, 0], [7, -1], [9, 0], [11, 0]],
  // Thirteenths
  "13":    [[1, 0], [3, 0], [5, 0], [7, -1], [9, 0], [11, 0], [13, 0]],
  maj13:   [[1, 0], [3, 0], [5, 0], [7, 0], [9, 0], [11, 0], [13, 0]],
  min13:   [[1, 0], [3, -1], [5, 0], [7, -1], [9, 0], [11, 0], [13, 0]],
};

// Which degrees are present in each quality (for tension conflict checking)
const QUALITY_DEGREES: Record<ChordQuality, Set<number>> = Object.fromEntries(
  Object.entries(QUALITY_INTERVALS).map(([q, intervals]) => [
    q,
    new Set(intervals.map(([deg]) => deg)),
  ])
) as Record<ChordQuality, Set<number>>;

// Tension to degree mapping
const TENSION_DEGREE: Record<Tension, number> = {
  "b9": 9, "#9": 9, "#11": 11, "b13": 13,
};

// Tension to accidental mapping
const TENSION_ACCIDENTAL: Record<Tension, Accidental> = {
  "b9": -1, "#9": 1, "#11": 1, "b13": -1,
};

// Qualities that define the chord by specific intervals
const DIMINISHED_QUALITIES: ChordQuality[] = ["dim", "dim7", "m7b5"];
const AUGMENTED_QUALITIES: ChordQuality[] = ["aug"];

// ============================================================================
// Tone Calculation
// ============================================================================

function getIntervalLetter(rootLetter: Letter, intervalDegree: number): Letter {
  const rootIndex = LETTERS.indexOf(rootLetter);
  const offset = INTERVAL_LETTER_OFFSET[intervalDegree];
  if (offset === undefined) {
    throw new Error(`Unknown interval degree: ${intervalDegree}`);
  }
  const letter = LETTERS[(rootIndex + offset) % 7];
  if (letter === undefined) {
    throw new Error(`Invalid letter index calculation`);
  }
  return letter;
}

function calculateTone(
  root: NoteName,
  intervalDegree: number,
  intervalAccidental: Accidental
): NoteName {
  const targetLetter = getIntervalLetter(root.letter, intervalDegree);
  const baseSemitones = BASE_INTERVAL_SEMITONES[intervalDegree];
  if (baseSemitones === undefined) {
    throw new Error(`Unknown interval degree: ${intervalDegree}`);
  }
  const targetSemitonesFromRoot = baseSemitones + intervalAccidental;

  const rootPitchClass = toPitchClass(root);
  const targetPitchClass = (rootPitchClass + targetSemitonesFromRoot + 12) % 12;

  const naturalPitchClass = LETTER_SEMITONES[targetLetter];

  let accidental = targetPitchClass - naturalPitchClass;
  if (accidental > 2) accidental -= 12;
  if (accidental < -2) accidental += 12;

  return N(targetLetter, accidental as Accidental);
}

function noteEquals(a: NoteName, b: NoteName): boolean {
  return a.letter === b.letter && a.accidental === b.accidental;
}

// ============================================================================
// Validation
// ============================================================================

function err(code: string, message: string): { ok: false; error: ChordError } {
  return { ok: false, error: { code, message } };
}

export function validateChordSpec(spec: ChordSpec): Result<void> {
  const { quality, tensions, omit, bass, root } = spec;

  // Check for duplicate tensions
  if (tensions && tensions.length > 0) {
    const seen = new Set<Tension>();
    for (const t of tensions) {
      if (seen.has(t)) {
        return err("DUPLICATE_TENSION", `Duplicate tension: ${t}`);
      }
      seen.add(t);
    }
  }

  // Check for duplicate omissions
  if (omit && omit.length > 0) {
    const seen = new Set<OmitDegree>();
    for (const o of omit) {
      if (seen.has(o)) {
        return err("DUPLICATE_OMIT", `Duplicate omit: ${o}`);
      }
      seen.add(o);
    }
  }

  // Check bass != root
  if (bass && noteEquals(bass, root)) {
    return err("BASS_EQUALS_ROOT", "Bass note cannot be the same as root");
  }

  // Check tensions don't conflict with chord tones
  if (tensions) {
    const degrees = QUALITY_DEGREES[quality];
    for (const tension of tensions) {
      const tensionDegree = TENSION_DEGREE[tension];
      if (degrees.has(tensionDegree)) {
        return err(
          "TENSION_DUPLICATES_CHORD_TONE",
          `Tension ${tension} conflicts with existing ${tensionDegree} in ${quality} chord`
        );
      }
    }
  }

  // Check tensions not allowed on diminished
  if (tensions && tensions.length > 0) {
    if (DIMINISHED_QUALITIES.includes(quality)) {
      return err(
        "INVALID_TENSION_FOR_QUALITY",
        `Tensions not allowed on ${quality} chords`
      );
    }
  }

  // Check omit restrictions
  if (omit) {
    // Cannot omit 3 on dim (defines the quality)
    if (omit.includes("3") && DIMINISHED_QUALITIES.includes(quality)) {
      return err(
        "CANNOT_OMIT_DEFINING_TONE",
        `Cannot omit 3rd from ${quality} chord - it defines the quality`
      );
    }

    // Cannot omit 5 on aug or dim (defines the quality)
    if (omit.includes("5")) {
      if (AUGMENTED_QUALITIES.includes(quality)) {
        return err(
          "CANNOT_OMIT_DEFINING_TONE",
          `Cannot omit 5th from augmented chord - it defines the quality`
        );
      }
      if (DIMINISHED_QUALITIES.includes(quality)) {
        return err(
          "CANNOT_OMIT_DEFINING_TONE",
          `Cannot omit 5th from ${quality} chord - it defines the quality`
        );
      }
    }
  }

  return { ok: true, value: undefined };
}

// ============================================================================
// Symbol Generation
// ============================================================================

function formatAccidental(accidental: Accidental): string {
  switch (accidental) {
    case -2: return "bb";
    case -1: return "b";
    case 0: return "";
    case 1: return "#";
    case 2: return "##";
  }
}

function formatNote(note: NoteName): string {
  return note.letter + formatAccidental(note.accidental);
}

function formatQuality(quality: ChordQuality): string {
  switch (quality) {
    case "maj": return "";
    case "min": return "m";
    case "dim": return "dim";
    case "aug": return "aug";
    case "7": return "7";
    case "maj7": return "maj7";
    case "min7": return "m7";
    case "m7b5": return "m7b5";
    case "dim7": return "dim7";
    case "9": return "9";
    case "maj9": return "maj9";
    case "min9": return "m9";
    case "11": return "11";
    case "maj11": return "maj11";
    case "min11": return "m11";
    case "13": return "13";
    case "maj13": return "maj13";
    case "min13": return "m13";
  }
}

function formatSymbol(spec: ChordSpec): string {
  let symbol = formatNote(spec.root);
  symbol += formatQuality(spec.quality);

  // Add tensions in order
  if (spec.tensions && spec.tensions.length > 0) {
    const sortedTensions = [...spec.tensions].sort((a, b) => {
      const order: Tension[] = ["b9", "#9", "#11", "b13"];
      return order.indexOf(a) - order.indexOf(b);
    });
    symbol += sortedTensions.join("");
  }

  // Add omissions
  if (spec.omit && spec.omit.length > 0) {
    for (const o of spec.omit) {
      symbol += `(no${o})`;
    }
  }

  // Add bass
  if (spec.bass) {
    symbol += "/" + formatNote(spec.bass);
  }

  return symbol;
}

// ============================================================================
// buildChord
// ============================================================================

export function buildChord(spec: ChordSpec): Result<Chord> {
  // Validate first
  const validation = validateChordSpec(spec);
  if (!validation.ok) {
    return validation;
  }

  const { root, quality, tensions, omit, bass } = spec;

  // Get base intervals for quality
  const baseIntervals = QUALITY_INTERVALS[quality];
  const intervalMap = new Map<number, Accidental>(baseIntervals);

  // Add tensions
  if (tensions) {
    for (const tension of tensions) {
      const degree = TENSION_DEGREE[tension];
      const accidental = TENSION_ACCIDENTAL[tension];
      intervalMap.set(degree, accidental);
    }
  }

  // Remove omitted degrees
  if (omit) {
    for (const o of omit) {
      const degree = parseInt(o, 10);
      intervalMap.delete(degree);
    }
  }

  // Calculate tones in tertian order
  const sortOrder = [1, 3, 5, 7, 9, 11, 13];
  const sortedDegrees = [...intervalMap.keys()].sort(
    (a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b)
  );

  const tones = sortedDegrees.map((degree) =>
    calculateTone(root, degree, intervalMap.get(degree)!)
  );

  const symbol = formatSymbol(spec);

  const chord: Chord = { symbol, tones };
  if (bass) {
    chord.bass = bass;
  }

  return { ok: true, value: chord };
}

// ============================================================================
// chordPalette
// ============================================================================

// Scale degree intervals for major scale (semitones from root)
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
// Scale degree intervals for natural minor scale
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

// Diatonic qualities for major key by scale degree (0-indexed)
const MAJOR_TRIAD_QUALITIES: ChordQuality[] = ["maj", "min", "min", "maj", "maj", "min", "dim"];
const MAJOR_SEVENTH_QUALITIES: ChordQuality[] = ["maj7", "min7", "min7", "maj7", "7", "min7", "m7b5"];
const MAJOR_NINTH_QUALITIES: ChordQuality[] = ["maj9", "min9", "min9", "maj9", "9", "min9", "m7b5"];
const MAJOR_ELEVENTH_QUALITIES: ChordQuality[] = ["maj11", "min11", "min11", "maj11", "11", "min11", "m7b5"];
const MAJOR_THIRTEENTH_QUALITIES: ChordQuality[] = ["maj13", "min13", "min13", "maj13", "13", "min13", "m7b5"];

// Diatonic qualities for minor key by scale degree (0-indexed, natural minor)
const MINOR_TRIAD_QUALITIES: ChordQuality[] = ["min", "dim", "maj", "min", "min", "maj", "maj"];
const MINOR_SEVENTH_QUALITIES: ChordQuality[] = ["min7", "m7b5", "maj7", "min7", "min7", "maj7", "7"];
const MINOR_NINTH_QUALITIES: ChordQuality[] = ["min9", "m7b5", "maj9", "min9", "min9", "maj9", "9"];
const MINOR_ELEVENTH_QUALITIES: ChordQuality[] = ["min11", "m7b5", "maj11", "min11", "min11", "maj11", "11"];
const MINOR_THIRTEENTH_QUALITIES: ChordQuality[] = ["min13", "m7b5", "maj13", "min13", "min13", "maj13", "13"];

function getScaleDegreeTone(root: NoteName, scaleDegree: number, scale: number[]): NoteName {
  // scaleDegree is 0-indexed (0 = root, 1 = 2nd, etc.)
  const semitones = scale[scaleDegree];
  if (semitones === undefined) {
    throw new Error(`Invalid scale degree: ${scaleDegree}`);
  }

  // Get the letter for this scale degree
  const rootIndex = LETTERS.indexOf(root.letter);
  const targetLetter = LETTERS[(rootIndex + scaleDegree) % 7];
  if (targetLetter === undefined) {
    throw new Error(`Invalid letter calculation`);
  }

  // Calculate the accidental needed
  const rootPitchClass = toPitchClass(root);
  const targetPitchClass = (rootPitchClass + semitones) % 12;
  const naturalPitchClass = LETTER_SEMITONES[targetLetter];

  let accidental = targetPitchClass - naturalPitchClass;
  if (accidental > 2) accidental -= 12;
  if (accidental < -2) accidental += 12;

  return N(targetLetter, accidental as Accidental);
}

function getDiatonicChords(
  key: Key,
  qualities: ChordQuality[]
): ChordSpec[] {
  const scale = key.mode === "major" ? MAJOR_SCALE : MINOR_SCALE;
  const specs: ChordSpec[] = [];

  for (let degree = 0; degree < 7; degree++) {
    const chordRoot = getScaleDegreeTone(key.root, degree, scale);
    const quality = qualities[degree];
    if (quality === undefined) {
      throw new Error(`Missing quality for degree ${degree}`);
    }
    specs.push({ root: chordRoot, quality });
  }

  return specs;
}

function getSecondaryDominants(key: Key, baseQuality: "7" | "9" | "11" | "13"): ChordSpec[] {
  const scale = key.mode === "major" ? MAJOR_SCALE : MINOR_SCALE;
  const dominants: ChordSpec[] = [];

  // Secondary dominants for degrees 2, 3, 4, 5, 6 (V7/ii, V7/iii, V7/IV, V7/V, V7/vi)
  // In major: targets are D, E, F, G, A (degrees 1, 2, 3, 4, 5)
  const targetDegrees = key.mode === "major" ? [1, 2, 3, 4, 5] : [2, 3, 4, 5, 6];

  for (const targetDeg of targetDegrees) {
    const targetRoot = getScaleDegreeTone(key.root, targetDeg, scale);
    // V7 of target = perfect 5th above target
    const dominantRoot = calculateTone(targetRoot, 5, 0);
    dominants.push({ root: dominantRoot, quality: baseQuality });
  }

  return dominants;
}

function getBorrowedChords(key: Key, color: "triad" | "seventh"): ChordSpec[] {
  if (key.mode !== "major") {
    // Borrowed chords typically discussed in major context
    return [];
  }

  const borrowed: ChordSpec[] = [];

  // bVII (Bb in C major)
  const bVII = calculateTone(key.root, 7, -1);
  borrowed.push({ root: bVII, quality: color === "seventh" ? "7" : "maj" });

  // bVI (Ab in C major)
  const bVI = calculateTone(key.root, 6, -1);
  borrowed.push({ root: bVI, quality: color === "seventh" ? "maj7" : "maj" });

  // bIII (Eb in C major)
  const bIII = calculateTone(key.root, 3, -1);
  borrowed.push({ root: bIII, quality: color === "seventh" ? "maj7" : "maj" });

  // iv (Fm in C major)
  const iv = calculateTone(key.root, 4, 0);
  borrowed.push({ root: iv, quality: color === "seventh" ? "min7" : "min" });

  return borrowed;
}

export function chordPalette(key: Key, opts?: PaletteOptions): ChordSpec[] {
  const color = opts?.color ?? "triad";
  const maxExtension = opts?.maxExtension ?? 9;
  const includeDominants = opts?.includeDominants ?? false;
  const includeBorrowed = opts?.includeBorrowed ?? false;

  let qualities: ChordQuality[];

  if (key.mode === "major") {
    switch (color) {
      case "triad":
        qualities = MAJOR_TRIAD_QUALITIES;
        break;
      case "seventh":
        qualities = MAJOR_SEVENTH_QUALITIES;
        break;
      case "extended":
        switch (maxExtension) {
          case 7: qualities = MAJOR_SEVENTH_QUALITIES; break;
          case 9: qualities = MAJOR_NINTH_QUALITIES; break;
          case 11: qualities = MAJOR_ELEVENTH_QUALITIES; break;
          case 13: qualities = MAJOR_THIRTEENTH_QUALITIES; break;
          default: qualities = MAJOR_NINTH_QUALITIES;
        }
        break;
    }
  } else {
    switch (color) {
      case "triad":
        qualities = MINOR_TRIAD_QUALITIES;
        break;
      case "seventh":
        qualities = MINOR_SEVENTH_QUALITIES;
        break;
      case "extended":
        switch (maxExtension) {
          case 7: qualities = MINOR_SEVENTH_QUALITIES; break;
          case 9: qualities = MINOR_NINTH_QUALITIES; break;
          case 11: qualities = MINOR_ELEVENTH_QUALITIES; break;
          case 13: qualities = MINOR_THIRTEENTH_QUALITIES; break;
          default: qualities = MINOR_NINTH_QUALITIES;
        }
        break;
    }
  }

  let palette = getDiatonicChords(key, qualities);

  if (includeDominants) {
    const domQuality = color === "triad" ? "7" :
      color === "seventh" ? "7" :
      maxExtension === 11 ? "11" :
      maxExtension === 13 ? "13" : "9";
    const dominants = getSecondaryDominants(key, domQuality as "7" | "9" | "11" | "13");
    palette = [...palette, ...dominants];
  }

  if (includeBorrowed) {
    const borrowedColor = color === "extended" ? "seventh" : color;
    const borrowed = getBorrowedChords(key, borrowedColor as "triad" | "seventh");
    palette = [...palette, ...borrowed];
  }

  return palette;
}
