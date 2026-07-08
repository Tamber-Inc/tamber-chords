import type { CompassFeatureWeights, CompassGenre, CompassQualityTable } from "./types";
import type { HarmonicFunction } from "./theory";

// ============================================================================
// Hand-tuned genre profiles. These are DATA, not code: tuning a genre (or
// adding one) means editing tables here and nothing else. Values are starting
// points calibrated by ear against the golden tests — expect them to move.
// ============================================================================

export interface CompassGenreProfile {
  /** Feature weights; must sum to 1. Key-dependent features (harmonicFunction,
   * diatonicity, coherence) are additionally scaled by key confidence at
   * scoring time, then the whole vector is renormalized. */
  weights: CompassFeatureWeights;
  /** Idiomaticity of each chord quality in the genre, 0..1. */
  qualityPrior: CompassQualityTable;
  /** Root-motion strength by interval class (index 0..6 semitones).
   * ic5 = fourth/fifth, ic6 = tritone, ic0 = same root (recolor). */
  rootMotion: [number, number, number, number, number, number, number];
  /** Directed transition strength between tonal functions. */
  functionTransition: Record<HarmonicFunction, Record<HarmonicFunction, number>>;
  /** Diatonicity credit for recognized modal-interchange chords. */
  borrowedCredit: number;
  /** Extra credit when the borrowing is one of the core set (iv, bVII…). */
  coreBorrowedCredit: number;
  /** Presentation quota: guarantee this many non-diatonic picks when at
   * least that many clear the score floor. */
  colorQuota: { count: number; floor: number };
  /** Diversity re-rank settings. */
  mmr: { lambda: number; maxPerRoot: number };
}

const POP_PROFILE: CompassGenreProfile = {
  weights: {
    voiceLeading: 0.12,
    commonTones: 0.1,
    harmonicFunction: 0.16,
    diatonicity: 0.2,
    rootMotion: 0.12,
    qualityPrior: 0.1,
    texture: 0.05,
    consonance: 0.07,
    idiom: 0.04,
    variety: 0.02,
    coherence: 0.02,
  },
  qualityPrior: {
    maj: 1.0, min: 1.0,
    dim: 0.25, aug: 0.15,
    "7": 0.5, maj7: 0.6, min7: 0.65, m7b5: 0.2, dim7: 0.15,
    "9": 0.35, maj9: 0.45, min9: 0.45,
    "11": 0.1, maj11: 0.05, min11: 0.25,
    "13": 0.15, maj13: 0.1, min13: 0.1,
  },
  // Pop: fourths/fifths strongest, steps close behind (IV->V, V->vi),
  // thirds solid (I->vi, vi->IV), tritone jumps rare.
  rootMotion: [0.45, 0.5, 0.65, 0.7, 0.7, 1.0, 0.3],
  functionTransition: {
    T: { T: 0.7, S: 0.9, D: 0.8, X: 0.4 },
    S: { T: 0.8, S: 0.65, D: 1.0, X: 0.4 },
    D: { T: 1.0, S: 0.5, D: 0.6, X: 0.35 },
    X: { T: 0.6, S: 0.5, D: 0.5, X: 0.35 },
  },
  borrowedCredit: 0.45,
  coreBorrowedCredit: 0.6,
  colorQuota: { count: 1, floor: 0.42 },
  mmr: { lambda: 0.85, maxPerRoot: 2 },
};

const JAZZ_PROFILE: CompassGenreProfile = {
  weights: {
    voiceLeading: 0.16,
    commonTones: 0.07,
    harmonicFunction: 0.12,
    diatonicity: 0.06,
    rootMotion: 0.1,
    qualityPrior: 0.15,
    texture: 0.06,
    consonance: 0.03,
    idiom: 0.15,
    variety: 0.05,
    coherence: 0.05,
  },
  qualityPrior: {
    maj: 0.4, min: 0.45,
    dim: 0.3, aug: 0.35,
    "7": 0.95, maj7: 0.95, min7: 1.0, m7b5: 0.7, dim7: 0.55,
    "9": 0.75, maj9: 0.8, min9: 0.85,
    "11": 0.35, maj11: 0.2, min11: 0.65,
    "13": 0.8, maj13: 0.6, min13: 0.5,
  },
  // Jazz: descending-fifth engine, chromatic approach welcome, tritone OK
  // (substitution territory).
  rootMotion: [0.45, 0.65, 0.7, 0.7, 0.7, 1.0, 0.55],
  functionTransition: {
    T: { T: 0.7, S: 0.9, D: 0.8, X: 0.5 },
    S: { T: 0.75, S: 0.7, D: 1.0, X: 0.5 },
    D: { T: 1.0, S: 0.55, D: 0.8, X: 0.5 },
    X: { T: 0.6, S: 0.55, D: 0.6, X: 0.45 },
  },
  borrowedCredit: 0.6,
  coreBorrowedCredit: 0.7,
  colorQuota: { count: 1, floor: 0.5 },
  mmr: { lambda: 0.85, maxPerRoot: 2 },
};

export const COMPASS_PROFILES: Record<CompassGenre, CompassGenreProfile> = {
  pop: POP_PROFILE,
  jazz: JAZZ_PROFILE,
};
