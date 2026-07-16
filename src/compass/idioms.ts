import type { ChordQuality } from "../schemas";
import type { CompassGenre } from "./types";
import {
  type InternalKey,
  QUALITY_FAMILY,
  isDiatonicInKey,
  isDominantFamily,
  isTonicChord,
  matchBorrowed,
  mod12,
  scaleDegreeOf,
} from "./theory";

// ============================================================================
// Genre idiom detectors — small pattern rules that reward candidates for
// completing progressions musicians actually reach for (ii–V, tritone sub,
// borrowed iv into I…). Each fired rule contributes a bonus scaled by how
// close the involved neighbour sits on the circle, plus a human-readable tag
// used by the UI and the tuning harness.
//
// Detectors look ONLY at the neighbouring zones and the inferred key — never
// at the chord currently occupying the target zone. Compass recommends for
// the slot, not for the occupant.
// ============================================================================

export interface IdiomNeighbor {
  rootPc: number;
  quality: ChordQuality;
  symbol: string;
  /** Raw circle proximity: 1 for adjacent petals, less for further zones. */
  proximity: number;
  isNote: boolean;
  index: number;
}

export interface IdiomContext {
  genre: CompassGenre;
  key: InternalKey | null;
  /** All committed chord-mode zones other than the target. */
  neighbors: IdiomNeighbor[];
  /** The physically adjacent committed neighbours [previous, next], if any. */
  adjacentPair: [IdiomNeighbor | null, IdiomNeighbor | null];
}

interface Fired {
  bonus: number;
  tag: string;
}

const MINOR_SEVENTH_QUALITIES: ChordQuality[] = ["min7", "min9", "min11"];

function jazzIdioms(rootPc: number, quality: ChordQuality, ctx: IdiomContext): Fired[] {
  const fired: Fired[] = [];

  for (const n of ctx.neighbors) {
    if (n.isNote) continue;

    // Become the ii of a dominant neighbour: Dm7 next to G7.
    if (
      isDominantFamily(n.quality) &&
      MINOR_SEVENTH_QUALITIES.includes(quality) &&
      rootPc === mod12(n.rootPc + 7)
    ) {
      fired.push({ bonus: 1.0 * n.proximity, tag: `ii–V into ${n.symbol}` });
    }

    // Become the V of a neighbour (secondary dominant pointing at it).
    if (isDominantFamily(quality) && mod12(rootPc + 5) === n.rootPc) {
      fired.push({ bonus: 0.85 * n.proximity, tag: `V of ${n.symbol}` });
    }

    // Tritone substitution: dominant resolving down a half step onto a
    // stable neighbour (Db7 -> Cmaj7).
    if (
      isDominantFamily(quality) &&
      mod12(rootPc - 1) === n.rootPc &&
      (QUALITY_FAMILY[n.quality] === "maj" || QUALITY_FAMILY[n.quality] === "min")
    ) {
      fired.push({ bonus: 0.75 * n.proximity, tag: `tritone sub → ${n.symbol}` });
    }

    // Minor ii–V: m7b5 a fourth below a dominant neighbour (Bm7b5 | E7).
    if (
      quality === "m7b5" &&
      isDominantFamily(n.quality) &&
      n.rootPc === mod12(rootPc + 5)
    ) {
      fired.push({ bonus: 0.75 * n.proximity, tag: `minor ii–V with ${n.symbol}` });
    }

    // Backdoor dominant: bVII7 sliding into a tonic neighbour.
    if (
      ctx.key &&
      ctx.key.mode === "major" &&
      isDominantFamily(quality) &&
      rootPc === mod12(ctx.key.tonicPc + 10) &&
      isTonicChord(n.rootPc, n.quality, ctx.key)
    ) {
      fired.push({ bonus: 0.75 * n.proximity, tag: "backdoor bVII7" });
    }
  }

  // Chromatic passing dim7 between the two adjacent petals (C | C#dim7 | Dm7).
  const [prev, next] = ctx.adjacentPair;
  if (quality === "dim7" && prev && next && !prev.isNote && !next.isNote) {
    const between =
      (mod12(prev.rootPc + 1) === rootPc && mod12(prev.rootPc + 2) === next.rootPc) ||
      (mod12(next.rootPc + 1) === rootPc && mod12(next.rootPc + 2) === prev.rootPc);
    if (between) fired.push({ bonus: 0.7, tag: "passing dim7" });
  }

  return fired;
}

function popIdioms(rootPc: number, quality: ChordQuality, ctx: IdiomContext): Fired[] {
  const fired: Fired[] = [];

  if (ctx.key && ctx.key.mode === "major") {
    // Axis progression membership (I, IV, V, vi family).
    const degree = scaleDegreeOf(rootPc, ctx.key);
    if (
      isDiatonicInKey(rootPc, quality, ctx.key) &&
      (degree === 0 || degree === 3 || degree === 4 || degree === 5)
    ) {
      fired.push({ bonus: 0.5, tag: "axis" });
    }
  }

  // Relative pairing with a neighbour: the relative minor/major of an
  // adjacent chord is pop's most natural companion move (C | Am, Am | C).
  for (const n of ctx.neighbors) {
    if (n.isNote) continue;
    if (
      QUALITY_FAMILY[quality] === "min" &&
      QUALITY_FAMILY[n.quality] === "maj" &&
      rootPc === mod12(n.rootPc + 9)
    ) {
      fired.push({ bonus: 0.4 * n.proximity, tag: `relative of ${n.symbol}` });
    }
    if (
      QUALITY_FAMILY[quality] === "maj" &&
      QUALITY_FAMILY[n.quality] === "min" &&
      rootPc === mod12(n.rootPc + 3)
    ) {
      fired.push({ bonus: 0.4 * n.proximity, tag: `relative of ${n.symbol}` });
    }
  }

  // Borrowed colour resolving home (Fm -> C, Bb -> C).
  if (ctx.key && !isDiatonicInKey(rootPc, quality, ctx.key)) {
    const borrowed = matchBorrowed(rootPc, quality, ctx.key);
    if (borrowed?.core) {
      for (const n of ctx.neighbors) {
        if (!n.isNote && isTonicChord(n.rootPc, n.quality, ctx.key)) {
          fired.push({ bonus: 0.8 * n.proximity, tag: borrowed.label });
          break;
        }
      }
    }
  }

  return fired;
}

/**
 * Sum of fired idiom bonuses, clamped to [0, 1], with the tags that fired.
 * Tags are deduplicated and capped to keep the UI readable.
 */
export function detectIdioms(
  rootPc: number,
  quality: ChordQuality,
  ctx: IdiomContext
): { score: number; tags: string[] } {
  const fired = ctx.genre === "jazz"
    ? jazzIdioms(rootPc, quality, ctx)
    : popIdioms(rootPc, quality, ctx);
  const score = Math.min(1, fired.reduce((sum, f) => sum + f.bonus, 0));
  const tags: string[] = [];
  for (const f of fired.sort((a, b) => b.bonus - a.bonus)) {
    if (!tags.includes(f.tag)) tags.push(f.tag);
    if (tags.length >= 3) break;
  }
  return { score, tags };
}
