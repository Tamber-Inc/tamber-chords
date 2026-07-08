import { describe, expect, it } from "vitest";

import {
  type ChordQuality,
  type ChordSpec,
  type CompassRequest,
  N,
  recommendCompassChords,
  toPitchClass,
  transposeChords,
} from "../src/index";
import {
  chordPitchClasses,
  inferKey,
  soundedPitchClasses,
  voiceLeadingDistance,
} from "../src/compass/theory";

function chord(letter: ChordSpec["root"]["letter"], accidental: -1 | 0 | 1, quality: ChordQuality): ChordSpec {
  return { root: N(letter, accidental), quality };
}

// The default gestures progression: I–V–vi–IV in C.
const C_G_Am_F: ChordSpec[] = [
  chord("C", 0, "maj"),
  chord("G", 0, "maj"),
  chord("A", 0, "min"),
  chord("F", 0, "maj"),
];

const JAZZ_251: ChordSpec[] = [
  chord("D", 0, "min7"),
  chord("G", 0, "7"),
  chord("C", 0, "maj7"),
  chord("A", 0, "min7"),
];

function request(
  chords: ChordSpec[],
  targetIndex: number,
  genre: "pop" | "jazz",
  overrides?: Partial<CompassRequest>
): CompassRequest {
  return {
    zones: chords.map((c) => ({ chord: c })),
    targetIndex,
    genre,
    ...overrides,
  };
}

describe("compass theory helpers", () => {
  it("computes sounded pitch classes with the engine's 4-voice tone selection", () => {
    // C13 keeps root, 3, b7, 13 — the 5th, 9th and 11th are dropped.
    expect(soundedPitchClasses(0, "13").sort((a, b) => a - b)).toEqual([0, 4, 9, 10]);
    // Cmaj sounds complete.
    expect(soundedPitchClasses(0, "maj").sort((a, b) => a - b)).toEqual([0, 4, 7]);
    // C11 keeps the 3-vs-11 clash (root, 3, b7, 11).
    expect(soundedPitchClasses(0, "11").sort((a, b) => a - b)).toEqual([0, 4, 5, 10]);
    // Full theoretical set is untouched by voicing.
    expect(chordPitchClasses(0, "13")).toHaveLength(7);
  });

  it("measures minimal voice-leading distance between sets", () => {
    // C -> C: no motion.
    expect(voiceLeadingDistance([0, 4, 7], [0, 4, 7])).toBe(0);
    // C -> Am: single semitone-neighbour motion set (G->A is 2, others 0).
    expect(voiceLeadingDistance([0, 4, 7], [9, 0, 4])).toBe(2);
    // C -> F#: distant.
    expect(voiceLeadingDistance([0, 4, 7], [6, 10, 1])).toBeGreaterThan(3);
  });

  it("infers C major from the default pop progression", () => {
    const zones = C_G_Am_F.map((c, index) => ({
      rootPc: toPitchClass(c.root),
      quality: c.quality,
      isNote: false,
      index,
    }));
    const inferred = inferKey(zones);
    expect(inferred.key).not.toBeNull();
    expect(inferred.key!.tonicPc).toBe(0);
    expect(inferred.key!.mode).toBe("major");
    expect(inferred.confidence).toBeGreaterThan(0.1);
  });

  it("prefers the relative minor when the tonic evidence points there", () => {
    const progression = [
      chord("A", 0, "min"),
      chord("F", 0, "maj"),
      chord("E", 0, "7"),
      chord("A", 0, "min"),
    ];
    const zones = progression.map((c, index) => ({
      rootPc: toPitchClass(c.root),
      quality: c.quality,
      isNote: false,
      index,
    }));
    const inferred = inferKey(zones);
    expect(inferred.key!.tonicPc).toBe(9);
    expect(inferred.key!.mode).toBe("minor");
  });
});

describe("recommendCompassChords — shape and determinism", () => {
  it("returns the requested number of valid, deduplicated candidates", () => {
    const result = recommendCompassChords(request(C_G_Am_F, 2, "pop"));
    expect(result.candidates).toHaveLength(8);
    const seen = new Set(result.candidates.map((c) => c.symbol));
    expect(seen.size).toBe(8);
    for (const candidate of result.candidates) {
      expect(candidate.symbol).toBeTruthy();
      expect(candidate.score).toBeGreaterThan(0);
      expect(candidate.score).toBeLessThanOrEqual(1);
      for (const value of Object.values(candidate.features)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it("excludes duplicates of the other zones, but the occupant has no special status", () => {
    const result = recommendCompassChords(request(C_G_Am_F, 2, "pop", { limit: 24 }));
    // Chords already on other petals would be dead duplicates.
    const otherZones = new Set(["C", "G", "F"]);
    for (const candidate of result.candidates) {
      expect(otherZones.has(candidate.symbol)).toBe(false);
    }
    // The zone's current chord is NOT filtered out: it's a legitimate fit
    // for its own slot and the UI shows it as the active selection.
    expect(result.candidates.some((c) => c.symbol === "Am")).toBe(true);
  });

  it("is deterministic", () => {
    const a = recommendCompassChords(request(JAZZ_251, 3, "jazz"));
    const b = recommendCompassChords(request(JAZZ_251, 3, "jazz"));
    expect(a).toEqual(b);
  });

  it("is fully independent of the chord occupying the target zone", () => {
    // Same neighbours, different occupants — including prominent ones that
    // rank high themselves: the recommendations must be byte-identical.
    // Compass scores the slot's surroundings, never the occupant, so the
    // list stays perfectly stable while the user changes the zone's chord.
    const withOccupant = (occupant: ChordSpec) =>
      recommendCompassChords({
        zones: [
          { chord: chord("C", 0, "maj") },
          { chord: chord("G", 0, "maj") },
          { chord: occupant },
          { chord: chord("F", 0, "maj") },
        ],
        targetIndex: 2,
        genre: "pop",
        limit: 12,
      });
    const asAm = withOccupant(chord("A", 0, "min"));
    const asEm = withOccupant(chord("E", 0, "min"));
    const asJunk = withOccupant(chord("C", 1, "11"));
    expect(asEm).toEqual(asAm);
    expect(asJunk).toEqual(asAm);
  });

  it("is transposition-invariant", () => {
    for (const semitones of [2, 5, 9]) {
      const base = recommendCompassChords(request(C_G_Am_F, 1, "pop"));
      const transposed = recommendCompassChords(
        request(transposeChords(C_G_Am_F, semitones), 1, "pop")
      );
      const basePcs = base.candidates.map(
        (c) => `${(toPitchClass(c.chord.root) + semitones) % 12}:${c.chord.quality}`
      );
      const transposedPcs = transposed.candidates.map(
        (c) => `${toPitchClass(c.chord.root)}:${c.chord.quality}`
      );
      expect(transposedPcs).toEqual(basePcs);
    }
  });
});

describe("recommendCompassChords — pop musicianship", () => {
  it("detects C major and keeps pop suggestions mostly diatonic", () => {
    const result = recommendCompassChords(request(C_G_Am_F, 2, "pop"));
    expect(result.key).not.toBeNull();
    expect(toPitchClass(result.key!.root)).toBe(0);
    expect(result.key!.mode).toBe("major");
    const diatonic = result.candidates.filter((c) => c.isDiatonic === true);
    expect(diatonic.length).toBeGreaterThanOrEqual(5);
  });

  it("surfaces classic pop substitutes for the vi slot", () => {
    const result = recommendCompassChords(request(C_G_Am_F, 2, "pop", { limit: 8 }));
    const symbols = result.candidates.map((c) => c.symbol);
    // Em (iii), Dm (ii), or an Am-family recolor should be in reach.
    const expected = ["Em", "Dm", "Am7", "Em7", "Dm7"];
    expect(symbols.some((s) => expected.includes(s))).toBe(true);
  });

  it("keeps heavy extensions out of a pop triad progression's top picks", () => {
    const result = recommendCompassChords(request(C_G_Am_F, 2, "pop"));
    for (const candidate of result.candidates) {
      expect(["11", "maj11", "maj13", "min13", "13"]).not.toContain(
        candidate.chord.quality
      );
    }
  });

  it("honours the colour quota: at least one non-diatonic suggestion", () => {
    const result = recommendCompassChords(request(C_G_Am_F, 3, "pop"));
    const color = result.candidates.filter((c) => c.isDiatonic === false);
    expect(color.length).toBeGreaterThanOrEqual(1);
  });

  it("tags borrowed chords when they resolve to the tonic", () => {
    const result = recommendCompassChords(request(C_G_Am_F, 3, "pop", { limit: 24 }));
    const borrowed = result.candidates.filter((c) =>
      c.tags.some((t) => t.startsWith("borrowed"))
    );
    expect(borrowed.length).toBeGreaterThanOrEqual(1);
  });
});

describe("recommendCompassChords — jazz musicianship", () => {
  it("prefers seventh-and-up qualities in a jazz context", () => {
    const result = recommendCompassChords(request(JAZZ_251, 3, "jazz"));
    const extended = result.candidates.filter(
      (c) => !["maj", "min", "dim", "aug"].includes(c.chord.quality)
    );
    expect(extended.length).toBeGreaterThanOrEqual(6);
  });

  it("finds the applied dominant pointing at the next zone (A7 -> Dm7)", () => {
    // Target index 3 (Am7) wraps: its clockwise neighbour is zone 0 (Dm7).
    const result = recommendCompassChords(request(JAZZ_251, 3, "jazz", { limit: 12 }));
    const applied = result.candidates.find((c) =>
      c.tags.some((t) => t === "V of Dm7")
    );
    expect(applied).toBeDefined();
  });

  it("tags ii–V completion when replacing the zone before a dominant", () => {
    // Replacing zone 0 (Dm7), neighbour G7: Dm-family candidates a fifth up
    // re-create the ii–V. Since Dm7 itself is excluded, expect e.g. Dm9.
    const result = recommendCompassChords(request(JAZZ_251, 0, "jazz", { limit: 12 }));
    const twoFive = result.candidates.find((c) =>
      c.tags.some((t) => t.startsWith("ii–V into G7"))
    );
    expect(twoFive).toBeDefined();
  });
});

describe("recommendCompassChords — root-chord promotion", () => {
  // Diatonic to C major with its dominant present, but no C chord anywhere:
  // the palette has no anchor. (Neighbours of the target are F, G, Em.)
  const ROOTLESS: ChordSpec[] = [
    chord("F", 0, "maj"),
    chord("G", 0, "maj"),
    chord("E", 0, "min"),
    chord("D", 0, "min"),
  ];

  it("flags a rootless palette and pins root-chord candidates first", () => {
    const result = recommendCompassChords(request(ROOTLESS, 3, "pop"));
    expect(result.needsRootChord).toBe(true);
    const majFamily = ["maj", "maj7", "maj9", "maj11", "maj13"];
    const [first, second] = result.candidates;
    expect(toPitchClass(first!.chord.root)).toBe(0);
    expect(majFamily).toContain(first!.chord.quality);
    expect(first!.tags).toContain("root chord");
    expect(toPitchClass(second!.chord.root)).toBe(0);
    expect(second!.tags).toContain("root chord");
  });

  it("does not fire when the palette already has its root chord", () => {
    const result = recommendCompassChords(request(C_G_Am_F, 2, "pop"));
    expect(result.needsRootChord).toBe(false);
    for (const candidate of result.candidates) {
      expect(candidate.tags).not.toContain("root chord");
    }
  });

  it("seeds the root chord for a rootless palette (jazz ii–V without its I)", () => {
    const zones = [
      { chord: chord("D", 0, "min7") },
      { chord: chord("G", 0, "7") },
      { chord: chord("C", 0, "maj"), committed: false },
    ];
    const result = recommendCompassChords({
      zones,
      targetIndex: 2,
      genre: "jazz",
      limit: 1,
    });
    expect(result.needsRootChord).toBe(true);
    expect(toPitchClass(result.candidates[0]!.chord.root)).toBe(0);
    expect(result.candidates[0]!.tags).toContain("root chord");
  });
});

describe("recommendCompassChords — incremental building", () => {
  it("works with a single zone (no neighbours, low key confidence)", () => {
    const result = recommendCompassChords(
      request([chord("C", 0, "maj")], 0, "pop")
    );
    expect(result.candidates).toHaveLength(8);
    expect(result.keyConfidence).toBeLessThan(0.6);
  });

  it("ignores uncommitted placeholder zones in the analysis", () => {
    // E-major context with a fresh default-Cmaj placeholder: the placeholder
    // must not drag key inference toward C.
    const zones = [
      { chord: chord("E", 0, "maj") },
      { chord: chord("B", 0, "maj") },
      { chord: chord("C", 1, "min") },
      { chord: chord("C", 0, "maj"), committed: false },
    ];
    const result = recommendCompassChords({ zones, targetIndex: 3, genre: "pop" });
    expect(result.key).not.toBeNull();
    expect(toPitchClass(result.key!.root)).toBe(4);
    expect(result.key!.mode).toBe("major");
  });

  it("suggests sensible companions for a lone C major zone when a second zone is added", () => {
    const zones = [
      { chord: chord("C", 0, "maj") },
      { chord: chord("C", 0, "maj"), committed: false },
    ];
    const result = recommendCompassChords({ zones, targetIndex: 1, genre: "pop" });
    const symbols = result.candidates.map((c) => c.symbol);
    const friendly = ["G", "F", "Am", "Em", "Dm", "G7", "Am7"];
    const hits = symbols.filter((s) => friendly.includes(s));
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });

  it("returns the outright best candidate when asked for a single suggestion", () => {
    // This is the zone-seeding path: limit 1 must yield the global argmax,
    // never a colour-quota substitute.
    const full = recommendCompassChords(request(C_G_Am_F, 2, "pop", { limit: 8 }));
    const single = recommendCompassChords(request(C_G_Am_F, 2, "pop", { limit: 1 }));
    expect(single.candidates).toHaveLength(1);
    expect(single.candidates[0]!.symbol).toBe(full.candidates[0]!.symbol);
    expect(single.candidates[0]!.isDiatonic).toBe(true);
  });

  it("seeds a new zone with a palette-fitting, non-duplicate chord", () => {
    // Mirrors the app's add-zone flow: a fresh petal (uncommitted
    // placeholder) inserted between Am and F in C–G–Am–F, pop profile.
    const zones = [
      { chord: chord("C", 0, "maj") },
      { chord: chord("G", 0, "maj") },
      { chord: chord("A", 0, "min") },
      { chord: chord("C", 0, "maj"), committed: false },
      { chord: chord("F", 0, "maj") },
    ];
    const result = recommendCompassChords({
      zones,
      targetIndex: 3,
      genre: "pop",
      limit: 1,
    });
    const seed = result.candidates[0]!;
    expect(seed.isDiatonic).toBe(true);
    expect(["C", "G", "Am", "F"]).not.toContain(seed.symbol);
  });

  it("treats note-mode zones as single pitches", () => {
    const zones = [
      { chord: chord("C", 0, "maj") },
      { chord: chord("G", 0, "maj"), playbackMode: "note" as const },
      { chord: chord("A", 0, "min") },
    ];
    const result = recommendCompassChords({ zones, targetIndex: 2, genre: "pop" });
    expect(result.candidates).toHaveLength(8);
  });

  it("throws on an out-of-range target", () => {
    expect(() =>
      recommendCompassChords(request(C_G_Am_F, 4, "pop"))
    ).toThrow(/out of range/);
  });
});
