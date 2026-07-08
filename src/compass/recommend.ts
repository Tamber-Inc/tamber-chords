import { buildChordSymbol } from "../buildChord";
import type { ChordQuality, ChordSpec } from "../schemas";
import { detectIdioms, type IdiomNeighbor } from "./idioms";
import { COMPASS_PROFILES, type CompassGenreProfile } from "./profiles";
import {
  ALL_QUALITIES,
  EXTENSION_LEVEL,
  type HarmonicFunction,
  type InternalKey,
  type KeyZone,
  QUALITY_CONSONANCE,
  QUALITY_FAMILY,
  SHARP_ROOTS,
  chordSpecRootPc,
  classifyFunction,
  commonToneRatio,
  inferKey,
  internalKeyToKey,
  intervalClass,
  isDiatonicInKey,
  isDominantFamily,
  isTonicChord,
  matchBorrowed,
  mod12,
  scalePitchClasses,
  secondaryDominantTarget,
  soundedPitchClasses,
  voiceLeadingScore,
} from "./theory";
import type {
  CompassCandidate,
  CompassFeatureId,
  CompassFeatureScores,
  CompassFeatureWeights,
  CompassRecommendation,
  CompassRequest,
} from "./types";

const DEFAULT_LIMIT = 8;

// Root-chord promotion: how many tonic-family candidates get pinned to the
// front when the palette has no root chord, and the minimum key confidence
// before we trust the inference enough to advise one. The floor is
// deliberately low: rootless palettes can never earn the tonic-presence
// prior, so their confidence is systematically compressed by the relative
// major/minor shadow (~0.19 for a clear ii–V) while genuinely ambiguous
// palettes (e.g. D-dorian-flavoured ones) sit near 0.04.
const ROOT_CHORD_PIN_COUNT = 2;
const ROOT_CHORD_MIN_CONFIDENCE = 0.12;

interface AnalyzedZone {
  index: number;
  rootPc: number;
  quality: ChordQuality;
  isNote: boolean;
  committed: boolean;
  /** Pitch classes that actually sound (engine tone selection applied). */
  soundedPcs: number[];
  symbol: string;
}

interface ContextZone extends AnalyzedZone {
  /** Normalized pairwise weight (sums to 1 across context zones). */
  weight: number;
  /** Raw circle proximity: 1 adjacent, 0.35 two petals away, 0.15 beyond. */
  proximity: number;
}

interface ScoredCandidate {
  rootIndex: number;
  qualityIndex: number;
  rootPc: number;
  quality: ChordQuality;
  soundedPcs: number[];
  score: number;
  features: CompassFeatureScores;
  tags: string[];
  isDiatonic: boolean | null;
}

function circularDistance(a: number, b: number, size: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, size - d);
}

function proximityForDistance(d: number): number {
  if (d <= 1) return 1;
  if (d === 2) return 0.35;
  return 0.15;
}

/**
 * Directed function-grammar strength blended for the bidirectional circle:
 * the player sweeps both ways, so a pair that works in at least one direction
 * is good, and one that works in both is better.
 */
function functionPairScore(
  profile: CompassGenreProfile,
  candFn: HarmonicFunction,
  candRootPc: number,
  candQuality: ChordQuality,
  zone: ContextZone,
  key: InternalKey
): number {
  if (zone.isNote) return 0.6;
  const zoneFn = classifyFunction(zone.rootPc, zone.quality, key);
  const forward = profile.functionTransition[candFn][zoneFn];
  const backward = profile.functionTransition[zoneFn][candFn];
  let score = 0.7 * Math.max(forward, backward) + 0.3 * Math.min(forward, backward);

  // Applied-dominant resolutions override the coarse T/S/D grammar: a V
  // pointing straight at a neighbour is as strong as syntax gets.
  const candTarget = secondaryDominantTarget(candRootPc, candQuality, key);
  if (candTarget !== null && candTarget === zone.rootPc) {
    score = Math.max(score, 0.95);
  }
  if (isDominantFamily(zone.quality) && mod12(zone.rootPc + 5) === candRootPc) {
    score = Math.max(score, 0.9);
  }
  return score;
}

function diatonicityScore(
  profile: CompassGenreProfile,
  rootPc: number,
  quality: ChordQuality,
  key: InternalKey
): number {
  if (isDiatonicInKey(rootPc, quality, key)) return 1;
  const borrowed = matchBorrowed(rootPc, quality, key);
  if (borrowed) return borrowed.core ? profile.coreBorrowedCredit : profile.borrowedCredit;
  if (secondaryDominantTarget(rootPc, quality, key) !== null) return 0.55;
  if (scalePitchClasses(key).has(rootPc)) return 0.3;
  return 0.08;
}

/**
 * Key-dependent features are only as reliable as the key inference, so their
 * weights fade with confidence and the vector is renormalized. With no key at
 * all, ranking is driven purely by the local (pairwise + intrinsic) features.
 */
function effectiveWeights(
  profile: CompassGenreProfile,
  keyConfidence: number
): CompassFeatureWeights {
  const scaled: CompassFeatureWeights = { ...profile.weights };
  const keyDependent: CompassFeatureId[] = [
    "harmonicFunction",
    "diatonicity",
    "coherence",
  ];
  for (const id of keyDependent) scaled[id] *= keyConfidence;
  const total = Object.values(scaled).reduce((a, b) => a + b, 0);
  for (const id of Object.keys(scaled) as CompassFeatureId[]) scaled[id] /= total;
  return scaled;
}

function jaccard(a: number[], b: number[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const pc of setA) if (setB.has(pc)) shared++;
  return shared / (setA.size + setB.size - shared);
}

/**
 * Presentation similarity for the diversity re-rank. Deliberately softer
 * than raw pitch-class overlap: a same-root chord of a different family
 * (D7 vs Dm9) or a subset-related chord (Em inside Cmaj7) is a genuinely
 * different musical offer, so neither should be crushed as a "duplicate".
 */
function presentationSimilarity(a: ScoredCandidate, b: ScoredCandidate): number {
  if (a.rootPc === b.rootPc) {
    return QUALITY_FAMILY[a.quality] === QUALITY_FAMILY[b.quality] ? 0.9 : 0.6;
  }
  return Math.min(jaccard(a.soundedPcs, b.soundedPcs), 0.6);
}

/**
 * Greedy maximal-marginal-relevance pick: trade raw score against similarity
 * to already-picked suggestions, cap suggestions per root, then guarantee the
 * colour quota (at least N non-diatonic picks when they clear the floor) so
 * heavily diatonic genres still surface a borrowed/chromatic direction.
 */
function pickDiverse(
  sorted: ScoredCandidate[],
  profile: CompassGenreProfile,
  hasKey: boolean,
  limit: number
): ScoredCandidate[] {
  const { lambda, maxPerRoot } = profile.mmr;
  const picked: ScoredCandidate[] = [];
  const remaining = [...sorted];

  while (picked.length < limit && remaining.length > 0) {
    let bestIdx = -1;
    let bestValue = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i]!;
      const sameRoot = picked.filter((p) => p.rootPc === c.rootPc).length;
      if (sameRoot >= maxPerRoot) continue;
      let sim = 0;
      for (const p of picked) {
        sim = Math.max(sim, presentationSimilarity(p, c));
      }
      const value = lambda * c.score - (1 - lambda) * sim;
      if (value > bestValue) {
        bestValue = value;
        bestIdx = i;
      }
    }
    if (bestIdx < 0) break;
    picked.push(remaining.splice(bestIdx, 1)[0]!);
  }

  // The colour quota only makes sense for a list — with a single slot the
  // caller wants the outright best candidate (e.g. seeding a new zone).
  if (hasKey && picked.length > 1) {
    const { count, floor } = profile.colorQuota;
    const colorPicked = () => picked.filter((p) => p.isDiatonic === false).length;
    const candidates = sorted.filter(
      (c) => c.isDiatonic === false && c.score >= floor && !picked.includes(c)
    );
    let ci = 0;
    while (colorPicked() < count && ci < candidates.length && picked.length > 0) {
      // Replace the weakest diatonic pick with the strongest colour candidate.
      let weakest = -1;
      for (let i = picked.length - 1; i >= 0; i--) {
        if (picked[i]!.isDiatonic !== false) {
          weakest = i;
          break;
        }
      }
      if (weakest < 0) break;
      picked.splice(weakest, 1);
      picked.push(candidates[ci]!);
      ci++;
    }
  }

  return picked.sort(
    (a, b) =>
      b.score - a.score ||
      a.rootIndex - b.rootIndex ||
      a.qualityIndex - b.qualityIndex
  );
}

/**
 * Rank every chord in the gestures vocabulary (12 roots x 18 qualities) as a
 * replacement for the target zone, scored against the neighbouring zones of
 * the radial layout under the requested genre profile.
 *
 * The chord currently occupying the target zone plays NO role whatsoever —
 * recommendations describe what fits the slot's surroundings, not the
 * occupant. Changing the zone's chord therefore never changes this list;
 * when the occupant is itself among the best fits it simply appears (and the
 * UI highlights it as the current selection).
 *
 * Deterministic, transposition-invariant, and cheap (~200 candidates, pitch-
 * class math only) — safe to run on every render of the edit menu.
 */
export function recommendCompassChords(req: CompassRequest): CompassRecommendation {
  const { zones, targetIndex, genre } = req;
  const limit = req.limit ?? DEFAULT_LIMIT;
  if (zones.length === 0) {
    throw new Error("Compass needs at least one zone.");
  }
  if (targetIndex < 0 || targetIndex >= zones.length) {
    throw new Error(`Compass target index ${targetIndex} is out of range.`);
  }
  const profile = COMPASS_PROFILES[genre];
  const size = zones.length;

  const analyzed: AnalyzedZone[] = zones.map((zone, index) => {
    const rootPc = chordSpecRootPc(zone.chord);
    const isNote = zone.playbackMode === "note";
    return {
      index,
      rootPc,
      quality: zone.chord.quality,
      isNote,
      committed: zone.committed ?? true,
      soundedPcs: isNote ? [rootPc] : soundedPitchClasses(rootPc, zone.chord.quality),
      symbol: buildChordSymbol(zone.chord),
    };
  });
  // Context = committed zones other than the target. Uncommitted placeholder
  // zones are invisible to the analysis so a default Cmaj can't skew it.
  const contextRaw = analyzed.filter((z) => z.index !== targetIndex && z.committed);
  const proximityTotal = contextRaw.reduce(
    (sum, z) => sum + proximityForDistance(circularDistance(z.index, targetIndex, size)),
    0
  );
  const context: ContextZone[] = contextRaw.map((z) => {
    const proximity = proximityForDistance(
      circularDistance(z.index, targetIndex, size)
    );
    return {
      ...z,
      proximity,
      weight: proximityTotal > 0 ? proximity / proximityTotal : 0,
    };
  });

  const keyZones: KeyZone[] = context.map((z) => ({
    rootPc: z.rootPc,
    quality: z.quality,
    isNote: z.isNote,
    index: z.index,
  }));
  const { key, confidence: keyConfidence } = inferKey(keyZones);
  const weights = effectiveWeights(profile, key ? keyConfidence : 0);

  // Texture baseline: mean extension level of the committed chord zones.
  const textureZones = context.filter((z) => !z.isNote);
  const textureMean =
    textureZones.length > 0
      ? textureZones.reduce((sum, z) => sum + EXTENSION_LEVEL[z.quality], 0) /
        textureZones.length
      : null;

  // Function coverage of the neighbouring zones. The target's current chord
  // is deliberately NOT consulted — Compass recommends for the slot based on
  // what surrounds it, never on what happens to occupy it. A candidate that
  // supplies a function the neighbours are missing glues the section
  // together (coherence feature below).
  const contextFunctions: HarmonicFunction[] = key
    ? context.filter((z) => !z.isNote).map((z) => classifyFunction(z.rootPc, z.quality, key))
    : [];
  const missingTonic = key ? !contextFunctions.includes("T") : false;
  const missingDominant = key ? !contextFunctions.includes("D") : false;

  const idiomNeighbors: IdiomNeighbor[] = context
    .filter((z) => !z.isNote)
    .map((z) => ({
      rootPc: z.rootPc,
      quality: z.quality,
      symbol: z.symbol,
      proximity: z.proximity,
      isNote: z.isNote,
      index: z.index,
    }));
  const adjacentOf = (offset: number): IdiomNeighbor | null => {
    if (size < 2) return null;
    const zone = analyzed[(((targetIndex + offset) % size) + size) % size]!;
    if (zone.index === targetIndex || !zone.committed || zone.isNote) return null;
    return {
      rootPc: zone.rootPc,
      quality: zone.quality,
      symbol: zone.symbol,
      proximity: 1,
      isNote: zone.isNote,
      index: zone.index,
    };
  };
  const adjacentPair: [IdiomNeighbor | null, IdiomNeighbor | null] = [
    adjacentOf(-1),
    adjacentOf(1),
  ];

  // Chords already used by the OTHER committed chord-mode zones are excluded
  // outright: with identical pitch content they would win voice-leading /
  // common-tone scoring while adding a dead duplicate petal. The target's own
  // chord is NOT excluded — it has no special status at all, so the list is
  // perfectly stable while the user changes the zone's chord (it simply shows
  // up highlighted in the UI when it's among the best fits).
  const usedChords = new Set<string>();
  for (const z of context) {
    if (!z.isNote) usedChords.add(`${z.rootPc}:${z.quality}`);
  }

  const scored: ScoredCandidate[] = [];
  for (let rootIndex = 0; rootIndex < 12; rootIndex++) {
    for (let qualityIndex = 0; qualityIndex < ALL_QUALITIES.length; qualityIndex++) {
      const quality = ALL_QUALITIES[qualityIndex]!;
      const rootPc = rootIndex;
      if (usedChords.has(`${rootPc}:${quality}`)) continue;

      const soundedPcs = soundedPitchClasses(rootPc, quality);
      const candFn = key ? classifyFunction(rootPc, quality, key) : "X";

      let voiceLeading = 0.5;
      let commonTones = 0.5;
      let rootMotion = 0.5;
      let harmonicFunction = 0.5;
      if (context.length > 0) {
        voiceLeading = 0;
        commonTones = 0;
        rootMotion = 0;
        harmonicFunction = key ? 0 : 0.5;
        for (const zone of context) {
          voiceLeading += zone.weight * voiceLeadingScore(soundedPcs, zone.soundedPcs);
          commonTones += zone.weight * commonToneRatio(soundedPcs, zone.soundedPcs);
          rootMotion +=
            zone.weight * profile.rootMotion[intervalClass(rootPc, zone.rootPc)]!;
          if (key) {
            harmonicFunction +=
              zone.weight *
              functionPairScore(profile, candFn, rootPc, quality, zone, key);
          }
        }
      }

      const diatonicity = key ? diatonicityScore(profile, rootPc, quality, key) : 0.5;

      const texture =
        textureMean === null
          ? 0.5
          : 1 - Math.abs(EXTENSION_LEVEL[quality] - textureMean) / 4;

      const idiom = detectIdioms(rootPc, quality, {
        genre,
        key,
        neighbors: idiomNeighbors,
        adjacentPair,
      });

      let variety = 1;
      for (const zone of context) {
        if (zone.isNote || zone.proximity < 1) continue;
        const sameSet =
          zone.soundedPcs.length === soundedPcs.length &&
          zone.soundedPcs.every((pc) => soundedPcs.includes(pc));
        if (sameSet) variety = Math.min(variety, 0.2);
        else if (zone.rootPc === rootPc) variety = Math.min(variety, 0.55);
      }

      // Gap-filling: reward candidates that supply a tonal function the
      // neighbours lack. With full coverage the feature is flat (0.75) — no
      // gap to fill means nothing to discriminate on.
      let coherence = 0.5;
      if (key) {
        if (!missingTonic && !missingDominant) {
          coherence = 0.75;
        } else if (
          (missingTonic && candFn === "T") ||
          (missingDominant && candFn === "D")
        ) {
          coherence = 1;
        }
      }

      const features: CompassFeatureScores = {
        voiceLeading,
        commonTones,
        harmonicFunction,
        diatonicity,
        rootMotion,
        qualityPrior: profile.qualityPrior[quality],
        texture,
        consonance: QUALITY_CONSONANCE[quality],
        idiom: idiom.score,
        variety,
        coherence,
      };

      let score = 0;
      for (const id of Object.keys(features) as CompassFeatureId[]) {
        score += weights[id] * features[id];
      }

      scored.push({
        rootIndex,
        qualityIndex,
        rootPc,
        quality,
        soundedPcs,
        score,
        features,
        tags: idiom.tags,
        isDiatonic: key ? isDiatonicInKey(rootPc, quality, key) : null,
      });
    }
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.rootIndex - b.rootIndex ||
      a.qualityIndex - b.qualityIndex
  );

  let picked = pickDiverse(scored, profile, key !== null, limit);

  // Root-chord promotion: a palette without its literal root chord (the I of
  // the key — not a tonic-function stand-in like iii or vi) has no home base,
  // so the highest-scoring root-chord candidates are pinned to the front —
  // choose the anchor first, the other options follow. This also drives
  // zone seeding (limit 1): a rootless palette gets its root chord next.
  const hasRootChord =
    key !== null &&
    context.some((z) => !z.isNote && isTonicChord(z.rootPc, z.quality, key));
  const needsRootChord =
    key !== null && keyConfidence >= ROOT_CHORD_MIN_CONFIDENCE && !hasRootChord;
  if (needsRootChord && key) {
    const rootCandidates = scored
      .filter((c) => isTonicChord(c.rootPc, c.quality, key))
      .slice(0, ROOT_CHORD_PIN_COUNT);
    for (const c of rootCandidates) {
      if (!c.tags.includes("root chord")) c.tags.unshift("root chord");
    }
    const pinned = new Set(rootCandidates.map((c) => `${c.rootPc}:${c.quality}`));
    const rest = picked.filter((c) => !pinned.has(`${c.rootPc}:${c.quality}`));
    picked = [...rootCandidates, ...rest].slice(0, limit);
  }

  const candidates: CompassCandidate[] = picked.map((c) => {
    const chord: ChordSpec = {
      root: { ...SHARP_ROOTS[c.rootIndex]! },
      quality: c.quality,
    };
    return {
      chord,
      symbol: buildChordSymbol(chord),
      score: c.score,
      features: c.features,
      tags: c.tags,
      isDiatonic: c.isDiatonic,
    };
  });

  return {
    key: key ? internalKeyToKey(key) : null,
    keyConfidence: key ? keyConfidence : 0,
    needsRootChord,
    candidates,
  };
}
