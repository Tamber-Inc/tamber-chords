import { toPitchClass } from "../noteName";
import type { ChordQuality, ChordSpec, Key, KeyMode, NoteName } from "../schemas";

// ============================================================================
// Pitch-class level theory helpers for Compass.
//
// Everything here works on pitch classes (0-11) so that all scoring is
// transposition-invariant by construction. Spelling is only reintroduced at
// the API boundary (candidate roots use the same sharp spellings as the
// gestures edit menu; key roots use conventional key spellings).
// ============================================================================

export const mod12 = (n: number): number => ((n % 12) + 12) % 12;

/** Interval class between two pitch classes: 0..6 semitones. */
export function intervalClass(a: number, b: number): number {
  const d = mod12(a - b);
  return Math.min(d, 12 - d);
}

// ----------------------------------------------------------------------------
// Chord tones
// ----------------------------------------------------------------------------

// Semitone stacks per quality, root-relative. Mirrors QUALITY_INTERVALS in
// buildChord.ts and the native engine's Chords.cpp — all 18 qualities are
// plain tertian stacks, so degree k lives at TERTIAN_DEGREES[k].
export const QUALITY_SEMITONES: Record<ChordQuality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  "9": [0, 4, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  min9: [0, 3, 7, 10, 14],
  "11": [0, 4, 7, 10, 14, 17],
  maj11: [0, 4, 7, 11, 14, 17],
  min11: [0, 3, 7, 10, 14, 17],
  "13": [0, 4, 7, 10, 14, 17, 21],
  maj13: [0, 4, 7, 11, 14, 17, 21],
  min13: [0, 3, 7, 10, 14, 17, 21],
};

export const ALL_QUALITIES = Object.keys(QUALITY_SEMITONES) as ChordQuality[];

const TERTIAN_DEGREES = [1, 3, 5, 7, 9, 11, 13];

// Matches DEFAULT_TONE_PRIORITY in renderMidi.ts and the native engine: when
// a chord has more tones than voices, this is the keep-order.
const TONE_PRIORITY_DEGREES = [1, 3, 7, 13, 11, 9, 5];

/** Voice budget of the gestures MIDI renderer (voiceLead maxVoices). */
export const GESTURES_MAX_VOICES = 4;

/** Full theoretical pitch-class set of a chord. */
export function chordPitchClasses(rootPc: number, quality: ChordQuality): number[] {
  return QUALITY_SEMITONES[quality].map((s) => mod12(rootPc + s));
}

/**
 * The pitch classes that actually sound in the gestures engine: tone
 * selection keeps at most GESTURES_MAX_VOICES tones by the engine's priority
 * (root, 3, 7, 13, 11, 9, 5). This is what voice-leading, common-tone, and
 * consonance features must be computed on — e.g. a "13" chord sounds as
 * {1, 3, b7, 13} with no 11th at all.
 */
export function soundedPitchClasses(rootPc: number, quality: ChordQuality): number[] {
  const semitones = QUALITY_SEMITONES[quality];
  if (semitones.length <= GESTURES_MAX_VOICES) {
    return semitones.map((s) => mod12(rootPc + s));
  }
  const byDegree = new Map<number, number>();
  semitones.forEach((s, i) => byDegree.set(TERTIAN_DEGREES[i]!, s));
  const kept = TONE_PRIORITY_DEGREES.filter((d) => byDegree.has(d)).slice(
    0,
    GESTURES_MAX_VOICES
  );
  // Preserve tertian order for readability; set membership is what matters.
  return TERTIAN_DEGREES.filter((d) => kept.includes(d)).map((d) =>
    mod12(rootPc + byDegree.get(d)!)
  );
}

// ----------------------------------------------------------------------------
// Quality families / metadata
// ----------------------------------------------------------------------------

export type QualityFamily = "maj" | "min" | "dom" | "dim" | "aug";

export const QUALITY_FAMILY: Record<ChordQuality, QualityFamily> = {
  maj: "maj", maj7: "maj", maj9: "maj", maj11: "maj", maj13: "maj",
  min: "min", min7: "min", min9: "min", min11: "min", min13: "min",
  "7": "dom", "9": "dom", "11": "dom", "13": "dom",
  dim: "dim", dim7: "dim", m7b5: "dim",
  aug: "aug",
};

export function isDominantFamily(quality: ChordQuality): boolean {
  return QUALITY_FAMILY[quality] === "dom";
}

/** 0 = triad, 1 = seventh, 2 = ninth, 3 = eleventh, 4 = thirteenth. */
export const EXTENSION_LEVEL: Record<ChordQuality, number> = {
  maj: 0, min: 0, dim: 0, aug: 0,
  "7": 1, maj7: 1, min7: 1, m7b5: 1, dim7: 1,
  "9": 2, maj9: 2, min9: 2,
  "11": 3, maj11: 3, min11: 3,
  "13": 4, maj13: 4, min13: 4,
};

/**
 * Intrinsic consonance of what actually sounds, hand-tuned per quality for
 * the fixed 18-quality vocabulary against the engine's real 4-voice tone
 * selection. Notably: "11"/"maj11" keep the natural 11 clashing against the
 * major 3rd (harsh); "13" chords drop the 11 entirely (mellow); "min11" is
 * an open quartal colour (consonant).
 */
export const QUALITY_CONSONANCE: Record<ChordQuality, number> = {
  maj: 1.0, min: 1.0,
  dim: 0.6, aug: 0.55,
  "7": 0.8, maj7: 0.85, min7: 0.9, m7b5: 0.65, dim7: 0.55,
  "9": 0.8, maj9: 0.85, min9: 0.85,
  "11": 0.35, maj11: 0.2, min11: 0.8,
  "13": 0.7, maj13: 0.6, min13: 0.65,
};

// ----------------------------------------------------------------------------
// Voice leading / common tones
// ----------------------------------------------------------------------------

/**
 * Minimal total semitone motion mapping set `a` onto set `b` (order-free
 * Tymoczko-style taxicab distance between pitch-class sets). Handles unequal
 * sizes by charging unmatched tones of the larger set their distance to the
 * nearest tone of the smaller set (a voice that splits/merges).
 */
export function voiceLeadingDistance(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const [small, large] = a.length <= b.length ? [a, b] : [b, a];

  let best = Infinity;
  const used = new Array<boolean>(large.length).fill(false);

  const assign = (i: number, cost: number) => {
    if (cost >= best) return;
    if (i === small.length) {
      let total = cost;
      for (let j = 0; j < large.length; j++) {
        if (!used[j]) {
          let nearest = Infinity;
          for (const s of small) nearest = Math.min(nearest, intervalClass(large[j]!, s));
          total += nearest;
        }
      }
      best = Math.min(best, total);
      return;
    }
    for (let j = 0; j < large.length; j++) {
      if (used[j]) continue;
      used[j] = true;
      assign(i + 1, cost + intervalClass(small[i]!, large[j]!));
      used[j] = false;
    }
  };
  assign(0, 0);
  return best;
}

/** Voice-leading smoothness in [0, 1]: 1 = identical sets, 0 = maximally far. */
export function voiceLeadingScore(a: number[], b: number[]): number {
  const size = Math.max(a.length, b.length, 1);
  const dist = voiceLeadingDistance(a, b);
  return Math.max(0, 1 - dist / (3 * size));
}

/** Shared pitch classes relative to the smaller set, in [0, 1]. */
export function commonToneRatio(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let shared = 0;
  for (const pc of new Set(a)) if (setB.has(pc)) shared++;
  return shared / Math.min(new Set(a).size, new Set(b).size);
}

// ----------------------------------------------------------------------------
// Keys, scales, diatonicity
// ----------------------------------------------------------------------------

export interface InternalKey {
  tonicPc: number;
  mode: KeyMode;
}

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const NATURAL_MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];
const HARMONIC_MINOR_SCALE = [0, 2, 3, 5, 7, 8, 11];

export function scalePitchClasses(key: InternalKey): Set<number> {
  const scale = key.mode === "major" ? MAJOR_SCALE : NATURAL_MINOR_SCALE;
  return new Set(scale.map((s) => mod12(key.tonicPc + s)));
}

/** Scale degree (0-6) of a pitch class within the key, or -1 if chromatic. */
export function scaleDegreeOf(pc: number, key: InternalKey): number {
  const scale = key.mode === "major" ? MAJOR_SCALE : NATURAL_MINOR_SCALE;
  return scale.findIndex((s) => mod12(key.tonicPc + s) === pc);
}

/**
 * A chord is diatonic when every pitch class fits the key scale. Minor keys
 * additionally accept the harmonic-minor dominant (major/dominant chord on
 * the 5th degree with the raised leading tone).
 */
export function isDiatonicInKey(
  rootPc: number,
  quality: ChordQuality,
  key: InternalKey
): boolean {
  const pcs = chordPitchClasses(rootPc, quality);
  const scale = scalePitchClasses(key);
  if (pcs.every((pc) => scale.has(pc))) return true;
  if (
    key.mode === "minor" &&
    rootPc === mod12(key.tonicPc + 7) &&
    (QUALITY_FAMILY[quality] === "maj" || QUALITY_FAMILY[quality] === "dom")
  ) {
    const harmonic = new Set(
      HARMONIC_MINOR_SCALE.map((s) => mod12(key.tonicPc + s))
    );
    return pcs.every((pc) => harmonic.has(pc));
  }
  return false;
}

// ----------------------------------------------------------------------------
// Borrowed chords (modal interchange)
// ----------------------------------------------------------------------------

export interface BorrowedMatch {
  /** Roman-ish display label, e.g. "borrowed iv", "backdoor bVII7". */
  label: string;
  /** True for the classic pop set (iv, bVII, bVI, bIII). */
  core: boolean;
}

interface BorrowedRule {
  offset: number;
  families: QualityFamily[];
  label: string;
  core: boolean;
  /** Restrict to specific qualities (overrides families) when present. */
  qualities?: ChordQuality[];
}

const MAJOR_KEY_BORROWED: BorrowedRule[] = [
  { offset: 5, families: ["min"], label: "borrowed iv", core: true },
  { offset: 10, families: ["maj", "dom"], label: "borrowed bVII", core: true },
  { offset: 8, families: ["maj"], label: "borrowed bVI", core: true },
  { offset: 3, families: ["maj"], label: "borrowed bIII", core: true },
  { offset: 1, families: ["maj"], label: "borrowed bII", core: false },
  { offset: 7, families: ["min"], label: "borrowed v", core: false },
  { offset: 2, families: [], qualities: ["m7b5", "dim"], label: "borrowed iio", core: false },
  { offset: 6, families: [], qualities: ["m7b5"], label: "#iv m7b5", core: false },
];

const MINOR_KEY_BORROWED: BorrowedRule[] = [
  { offset: 0, families: ["maj"], label: "picardy I", core: true },
  { offset: 5, families: ["maj", "dom"], label: "dorian IV", core: true },
  { offset: 1, families: ["maj"], label: "neapolitan bII", core: false },
  { offset: 2, families: ["min"], label: "dorian ii", core: false },
];

/**
 * Recognized modal-interchange chords for the key. Only meaningful for
 * chords that are NOT already diatonic (callers check diatonicity first).
 */
export function matchBorrowed(
  rootPc: number,
  quality: ChordQuality,
  key: InternalKey
): BorrowedMatch | null {
  const rules = key.mode === "major" ? MAJOR_KEY_BORROWED : MINOR_KEY_BORROWED;
  for (const rule of rules) {
    if (mod12(key.tonicPc + rule.offset) !== rootPc) continue;
    const familyOk = rule.qualities
      ? rule.qualities.includes(quality)
      : rule.families.includes(QUALITY_FAMILY[quality]);
    if (familyOk) return { label: rule.label, core: rule.core };
  }
  return null;
}

/**
 * If the chord is a dominant-family chord resolving down a fifth onto a
 * scale degree that hosts a major/minor diatonic chord, return that target
 * pitch class (secondary dominant). The primary V is diatonic, not "applied".
 */
export function secondaryDominantTarget(
  rootPc: number,
  quality: ChordQuality,
  key: InternalKey
): number | null {
  if (!isDominantFamily(quality) && QUALITY_FAMILY[quality] !== "maj") return null;
  if (rootPc === mod12(key.tonicPc + 7)) return null; // primary dominant
  const target = mod12(rootPc + 5);
  const degree = scaleDegreeOf(target, key);
  if (degree < 0) return null;
  // Don't call a dominant "applied" at the tonic — that's just V of nothing
  // useful here (it IS diatonic function via the scale test elsewhere).
  const diminishedDegree = key.mode === "major" ? 6 : 1;
  if (degree === diminishedDegree) return null;
  return target;
}

// ----------------------------------------------------------------------------
// Harmonic function
// ----------------------------------------------------------------------------

export type HarmonicFunction = "T" | "S" | "D" | "X";

const MAJOR_DEGREE_FUNCTION: HarmonicFunction[] = ["T", "S", "T", "S", "D", "T", "D"];
const MINOR_DEGREE_FUNCTION: HarmonicFunction[] = ["T", "S", "T", "S", "D", "T", "D"];

const BORROWED_FUNCTION: Record<string, HarmonicFunction> = {
  "borrowed iv": "S",
  "borrowed bVII": "D",
  "borrowed bVI": "S",
  "borrowed bIII": "T",
  "borrowed bII": "S",
  "borrowed v": "D",
  "borrowed iio": "S",
  "#iv m7b5": "S",
  "picardy I": "T",
  "dorian IV": "S",
  "neapolitan bII": "S",
  "dorian ii": "S",
};

/**
 * Coarse tonal function of a chord in a key. Applied dominants are "D";
 * recognized borrowings keep their conventional function; everything else
 * chromatic is "X".
 */
export function classifyFunction(
  rootPc: number,
  quality: ChordQuality,
  key: InternalKey
): HarmonicFunction {
  if (isDiatonicInKey(rootPc, quality, key)) {
    const degree = scaleDegreeOf(rootPc, key);
    if (degree >= 0) {
      const table = key.mode === "major" ? MAJOR_DEGREE_FUNCTION : MINOR_DEGREE_FUNCTION;
      return table[degree]!;
    }
  }
  if (secondaryDominantTarget(rootPc, quality, key) !== null) return "D";
  const borrowed = matchBorrowed(rootPc, quality, key);
  if (borrowed) return BORROWED_FUNCTION[borrowed.label] ?? "X";
  return "X";
}

/** True for chords that read as a stable tonic sonority in the key. */
export function isTonicChord(rootPc: number, quality: ChordQuality, key: InternalKey): boolean {
  if (rootPc !== key.tonicPc) return false;
  const family = QUALITY_FAMILY[quality];
  return key.mode === "major" ? family === "maj" : family === "min";
}

// ----------------------------------------------------------------------------
// Key inference
// ----------------------------------------------------------------------------

export interface KeyZone {
  rootPc: number;
  quality: ChordQuality;
  /** "note" zones contribute only their root. */
  isNote: boolean;
  /** Zone index in the section, used for the first-zone tonic prior. */
  index: number;
}

export interface InferredKey {
  key: InternalKey | null;
  /** 0..1 — margin-based; low for ambiguous or chromatic sections. */
  confidence: number;
}

function chordFitInKey(zone: KeyZone, key: InternalKey): number {
  const scale = scalePitchClasses(key);
  if (zone.isNote) {
    return scale.has(zone.rootPc) ? 0.8 : 0.05;
  }
  if (isDiatonicInKey(zone.rootPc, zone.quality, key)) return 1.0;
  if (secondaryDominantTarget(zone.rootPc, zone.quality, key) !== null) return 0.55;
  if (matchBorrowed(zone.rootPc, zone.quality, key)) return 0.55;
  if (scale.has(zone.rootPc)) return 0.25;
  return 0.05;
}

function keyScore(zones: KeyZone[], key: InternalKey): number {
  if (zones.length === 0) return 0;
  let total = 0;
  for (const zone of zones) total += chordFitInKey(zone, key);
  let score = total / zones.length;

  // Tie-breaking priors — these are what separate a key from its relative
  // major/minor, which share every pitch class.
  const hasTonic = zones.some(
    (z) => !z.isNote && isTonicChord(z.rootPc, z.quality, key)
  );
  const dominantPc = mod12(key.tonicPc + 7);
  const hasDominant = zones.some(
    (z) =>
      !z.isNote &&
      z.rootPc === dominantPc &&
      (QUALITY_FAMILY[z.quality] === "maj" || QUALITY_FAMILY[z.quality] === "dom")
  );
  const firstZone = zones.reduce((a, b) => (a.index <= b.index ? a : b));
  const firstIsTonic =
    !firstZone.isNote && isTonicChord(firstZone.rootPc, firstZone.quality, key);

  if (hasTonic) score += 0.12;
  if (hasDominant) score += 0.06;
  if (firstIsTonic) score += 0.08;
  return score;
}

/**
 * Score all 24 major/minor keys against the committed zones and return the
 * winner with a margin-based confidence. Sections without a clear centre
 * (chromatic, or too few chords) come back with low confidence — callers
 * should fade key-dependent features accordingly.
 */
export function inferKey(zones: KeyZone[]): InferredKey {
  if (zones.length === 0) return { key: null, confidence: 0 };

  let best: { key: InternalKey; score: number } | null = null;
  let second = 0;
  for (const mode of ["major", "minor"] as KeyMode[]) {
    for (let tonicPc = 0; tonicPc < 12; tonicPc++) {
      const key = { tonicPc, mode };
      const score = keyScore(zones, key);
      if (!best || score > best.score) {
        second = best?.score ?? 0;
        best = { key, score };
      } else if (score > second) {
        second = score;
      }
    }
  }
  if (!best || best.score <= 0) return { key: null, confidence: 0 };

  // Absolute quality gate x relative margin. A lone chord fits many keys
  // perfectly, so also dampen by sample size.
  const margin = Math.max(0, best.score - second);
  const quality = Math.min(1, Math.max(0, (best.score - 0.45) / 0.55));
  const sizeFactor = Math.min(1, zones.length / 3);
  const confidence = Math.min(1, margin * 4) * quality * (0.4 + 0.6 * sizeFactor);
  return { key: best.key, confidence };
}

// ----------------------------------------------------------------------------
// Spelling (API boundary only)
// ----------------------------------------------------------------------------

/** Sharp spellings matching the gestures edit-menu root options. */
export const SHARP_ROOTS: NoteName[] = [
  { letter: "C", accidental: 0 },
  { letter: "C", accidental: 1 },
  { letter: "D", accidental: 0 },
  { letter: "D", accidental: 1 },
  { letter: "E", accidental: 0 },
  { letter: "F", accidental: 0 },
  { letter: "F", accidental: 1 },
  { letter: "G", accidental: 0 },
  { letter: "G", accidental: 1 },
  { letter: "A", accidental: 0 },
  { letter: "A", accidental: 1 },
  { letter: "B", accidental: 0 },
];

// Conventional key spellings (fewest accidentals in the signature).
const MAJOR_KEY_SPELLING: NoteName[] = [
  { letter: "C", accidental: 0 },
  { letter: "D", accidental: -1 },
  { letter: "D", accidental: 0 },
  { letter: "E", accidental: -1 },
  { letter: "E", accidental: 0 },
  { letter: "F", accidental: 0 },
  { letter: "F", accidental: 1 },
  { letter: "G", accidental: 0 },
  { letter: "A", accidental: -1 },
  { letter: "A", accidental: 0 },
  { letter: "B", accidental: -1 },
  { letter: "B", accidental: 0 },
];

const MINOR_KEY_SPELLING: NoteName[] = [
  { letter: "C", accidental: 0 },
  { letter: "C", accidental: 1 },
  { letter: "D", accidental: 0 },
  { letter: "E", accidental: -1 },
  { letter: "E", accidental: 0 },
  { letter: "F", accidental: 0 },
  { letter: "F", accidental: 1 },
  { letter: "G", accidental: 0 },
  { letter: "G", accidental: 1 },
  { letter: "A", accidental: 0 },
  { letter: "B", accidental: -1 },
  { letter: "B", accidental: 0 },
];

export function internalKeyToKey(key: InternalKey): Key {
  const spelling =
    key.mode === "major"
      ? MAJOR_KEY_SPELLING[key.tonicPc]!
      : MINOR_KEY_SPELLING[key.tonicPc]!;
  return { root: { ...spelling }, mode: key.mode };
}

export function chordSpecRootPc(spec: ChordSpec): number {
  return toPitchClass(spec.root);
}
