import { toPitchClass } from "./noteName";
import type { NoteName } from "./schemas";

/**
 * Scale interval patterns as semitone offsets from root.
 * Each array represents the pitch classes present in the scale
 * relative to the root (0 = root).
 */
export const SCALE_INTERVALS: Record<string, readonly number[]> = {
  major:          [0, 2, 4, 5, 7, 9, 11],
  minor:          [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor:  [0, 2, 3, 5, 7, 9, 11],
  dorian:         [0, 2, 3, 5, 7, 9, 10],
  mixolydian:     [0, 2, 4, 5, 7, 9, 10],
  phrygian:       [0, 1, 3, 5, 7, 8, 10],
  lydian:         [0, 2, 4, 6, 7, 9, 11],
  locrian:        [0, 1, 3, 5, 6, 8, 10],
} as const;

export const SCALE_TYPE_VALUES = Object.keys(SCALE_INTERVALS) as [string, ...string[]];

/**
 * Get the set of pitch classes (0-11) for a given root + scale type.
 */
export function getScalePitchClasses(root: NoteName, scaleType: string): Set<number> {
  const intervals = SCALE_INTERVALS[scaleType];
  if (!intervals) {
    throw new Error(`Unknown scale type: "${scaleType}". Valid: ${Object.keys(SCALE_INTERVALS).join(", ")}`);
  }

  const rootPc = toPitchClass(root);
  return new Set(intervals.map((offset) => (rootPc + offset) % 12));
}

/**
 * Check whether a note (as NoteName) belongs to a given scale.
 */
export function isNoteInScale(note: NoteName, root: NoteName, scaleType: string): boolean {
  const scalePcs = getScalePitchClasses(root, scaleType);
  return scalePcs.has(toPitchClass(note));
}
