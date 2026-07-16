import type { ChordQuality, ChordSpec, Key } from "../schemas";

// ============================================================================
// Compass — chord recommendation for the Gestures radial zone layout.
//
// A "zone" is one petal of the gestures circle; zones are adjacent in array
// order and wrap around (zone 0 borders zone N-1). Given the zone being
// edited, Compass ranks every reachable chord (12 roots x 18 qualities) as a
// replacement, scoring how well it plays with the neighbouring zones under a
// hand-tuned, genre-specific weight profile.
// ============================================================================

export type CompassGenre = "pop" | "jazz";

export const COMPASS_GENRES: CompassGenre[] = ["pop", "jazz"];

/** Playback mode of a zone: full chord, or just the root note. */
export type CompassZonePlaybackMode = "chord" | "note";

export interface CompassZoneInput {
  chord: ChordSpec;
  /** Defaults to "chord". "note" zones contribute only their root pitch. */
  playbackMode?: CompassZonePlaybackMode;
  /**
   * False for freshly-inserted placeholder zones the user hasn't edited yet.
   * Uncommitted zones are excluded from key inference and context analysis so
   * a default Cmaj placeholder can't skew recommendations. Defaults to true.
   */
  committed?: boolean;
}

export interface CompassRequest {
  /** All zones of the active section, in circle order. */
  zones: CompassZoneInput[];
  /** Index of the zone being edited (the one to recommend replacements for). */
  targetIndex: number;
  genre: CompassGenre;
  /** Number of ranked suggestions to return. Defaults to 8. */
  limit?: number;
}

/** Per-feature scores, each normalized to [0, 1] (higher = better fit). */
export interface CompassFeatureScores {
  /** Minimal-motion voice leading against neighbouring zones. */
  voiceLeading: number;
  /** Shared pitch classes with neighbours (sustained tones in glide mode). */
  commonTones: number;
  /** Functional-harmony grammar fit (tonic/subdominant/dominant syntax). */
  harmonicFunction: number;
  /** Membership in the inferred key, with credit for recognized borrowings. */
  diatonicity: number;
  /** Root-motion strength to neighbours (circle-of-fifths flavoured). */
  rootMotion: number;
  /** Hand-tuned genre idiomaticity of the chord quality. */
  qualityPrior: number;
  /** Extension-level match with the rest of the section. */
  texture: number;
  /** Intrinsic consonance of the tones that actually sound (post voicing). */
  consonance: number;
  /** Genre idiom bonuses (ii–V, tritone sub, borrowed iv, relative swap…). */
  idiom: number;
  /** Penalty for duplicating other zones / neighbouring roots. */
  variety: number;
  /** Section-level key stability and function coverage after the swap. */
  coherence: number;
}

export type CompassFeatureId = keyof CompassFeatureScores;

export interface CompassCandidate {
  chord: ChordSpec;
  /** Display symbol, e.g. "F#m7b5". */
  symbol: string;
  /** Weighted total in [0, 1]. */
  score: number;
  features: CompassFeatureScores;
  /** Human-readable idiom tags, e.g. "ii–V into G7", "borrowed iv". */
  tags: string[];
  /** Null when no key could be inferred. */
  isDiatonic: boolean | null;
}

export interface CompassRecommendation {
  /** Inferred key of the committed zones (excluding the target), if any. */
  key: Key | null;
  /** 0 = no tonal centre detected, 1 = unambiguous. */
  keyConfidence: number;
  /**
   * True when the neighbouring zones contain no tonic ("root") chord for the
   * inferred key — the palette has no home base. The best root-chord
   * candidates are then pinned to the front of `candidates` and tagged
   * "root chord"; surface this to the user as advice to anchor the key first.
   */
  needsRootChord: boolean;
  /** Ranked, diversity-adjusted suggestions (length <= limit). */
  candidates: CompassCandidate[];
}

/** Weight profile over the feature set; weights sum to 1. */
export type CompassFeatureWeights = Record<CompassFeatureId, number>;

export type CompassQualityTable = Record<ChordQuality, number>;
