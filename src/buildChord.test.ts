import { test, expect, describe } from "bun:test";
import { buildChord, validateChordSpec, chordPalette } from "./buildChord";
import { Note } from "./noteName";
import type { ChordSpec, ChordQuality, Key } from "./buildChord";

describe("buildChord", () => {
  describe("major triads", () => {
    test("C major triad", () => {
      const result = buildChord({ root: Note.C, quality: "maj" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("C");
      expect(result.value.tones).toEqual([Note.C, Note.E, Note.G]);
    });

    test("F# major triad", () => {
      const result = buildChord({ root: Note.F_SHARP, quality: "maj" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("F#");
      expect(result.value.tones).toEqual([Note.F_SHARP, Note.A_SHARP, Note.C_SHARP]);
    });

    test("Bb major triad", () => {
      const result = buildChord({ root: Note.B_FLAT, quality: "maj" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Bb");
      expect(result.value.tones).toEqual([Note.B_FLAT, Note.D, Note.F]);
    });
  });

  describe("minor triads", () => {
    test("A minor triad", () => {
      const result = buildChord({ root: Note.A, quality: "min" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Am");
      expect(result.value.tones).toEqual([Note.A, Note.C, Note.E]);
    });

    test("C# minor triad", () => {
      const result = buildChord({ root: Note.C_SHARP, quality: "min" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("C#m");
      expect(result.value.tones).toEqual([Note.C_SHARP, Note.E, Note.G_SHARP]);
    });
  });

  describe("diminished triads", () => {
    test("B diminished triad", () => {
      const result = buildChord({ root: Note.B, quality: "dim" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Bdim");
      expect(result.value.tones).toEqual([Note.B, Note.D, Note.F]);
    });

    test("Db diminished triad preserves spellings", () => {
      const result = buildChord({ root: Note.D_FLAT, quality: "dim" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Dbdim");
      expect(result.value.tones).toEqual([Note.D_FLAT, Note.F_FLAT, Note.A_DOUBLE_FLAT]);
    });
  });

  describe("augmented triads", () => {
    test("C augmented triad", () => {
      const result = buildChord({ root: Note.C, quality: "aug" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Caug");
      expect(result.value.tones).toEqual([Note.C, Note.E, Note.G_SHARP]);
    });
  });

  describe("seventh chords", () => {
    test("G dominant 7", () => {
      const result = buildChord({ root: Note.G, quality: "7" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("G7");
      expect(result.value.tones).toEqual([Note.G, Note.B, Note.D, Note.F]);
    });

    test("C major 7", () => {
      const result = buildChord({ root: Note.C, quality: "maj7" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Cmaj7");
      expect(result.value.tones).toEqual([Note.C, Note.E, Note.G, Note.B]);
    });

    test("D minor 7", () => {
      const result = buildChord({ root: Note.D, quality: "min7" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Dm7");
      expect(result.value.tones).toEqual([Note.D, Note.F, Note.A, Note.C]);
    });

    test("C half-diminished (m7b5)", () => {
      const result = buildChord({ root: Note.C, quality: "m7b5" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Cm7b5");
      expect(result.value.tones).toEqual([Note.C, Note.E_FLAT, Note.G_FLAT, Note.B_FLAT]);
    });

    test("C diminished 7", () => {
      const result = buildChord({ root: Note.C, quality: "dim7" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Cdim7");
      expect(result.value.tones).toEqual([Note.C, Note.E_FLAT, Note.G_FLAT, Note.B_DOUBLE_FLAT]);
    });

    test("F# major 7 preserves E# spelling", () => {
      const result = buildChord({ root: Note.F_SHARP, quality: "maj7" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.tones[3]).toEqual(Note.E_SHARP);
    });
  });

  describe("ninth chords", () => {
    test("C dominant 9", () => {
      const result = buildChord({ root: Note.C, quality: "9" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("C9");
      expect(result.value.tones).toEqual([Note.C, Note.E, Note.G, Note.B_FLAT, Note.D]);
    });

    test("C major 9", () => {
      const result = buildChord({ root: Note.C, quality: "maj9" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Cmaj9");
      expect(result.value.tones).toEqual([Note.C, Note.E, Note.G, Note.B, Note.D]);
    });

    test("C minor 9", () => {
      const result = buildChord({ root: Note.C, quality: "min9" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Cm9");
      expect(result.value.tones).toEqual([Note.C, Note.E_FLAT, Note.G, Note.B_FLAT, Note.D]);
    });
  });

  describe("eleventh chords", () => {
    test("C dominant 11", () => {
      const result = buildChord({ root: Note.C, quality: "11" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("C11");
      expect(result.value.tones).toEqual([Note.C, Note.E, Note.G, Note.B_FLAT, Note.D, Note.F]);
    });

    test("C major 11", () => {
      const result = buildChord({ root: Note.C, quality: "maj11" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Cmaj11");
      expect(result.value.tones).toEqual([Note.C, Note.E, Note.G, Note.B, Note.D, Note.F]);
    });

    test("G minor 11", () => {
      const result = buildChord({ root: Note.G, quality: "min11" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Gm11");
      expect(result.value.tones).toEqual([Note.G, Note.B_FLAT, Note.D, Note.F, Note.A, Note.C]);
    });
  });

  describe("thirteenth chords", () => {
    test("C dominant 13", () => {
      const result = buildChord({ root: Note.C, quality: "13" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("C13");
      expect(result.value.tones).toEqual([
        Note.C, Note.E, Note.G, Note.B_FLAT, Note.D, Note.F, Note.A
      ]);
    });

    test("C major 13", () => {
      const result = buildChord({ root: Note.C, quality: "maj13" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Cmaj13");
      expect(result.value.tones).toEqual([
        Note.C, Note.E, Note.G, Note.B, Note.D, Note.F, Note.A
      ]);
    });

    test("C minor 13", () => {
      const result = buildChord({ root: Note.C, quality: "min13" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Cm13");
      expect(result.value.tones).toEqual([
        Note.C, Note.E_FLAT, Note.G, Note.B_FLAT, Note.D, Note.F, Note.A
      ]);
    });
  });

  describe("slash chords (alternate bass)", () => {
    test("C/E (first inversion)", () => {
      const result = buildChord({ root: Note.C, quality: "maj", bass: Note.E });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("C/E");
      expect(result.value.tones).toEqual([Note.C, Note.E, Note.G]);
      expect(result.value.bass).toEqual(Note.E);
    });

    test("Dm7/A", () => {
      const result = buildChord({ root: Note.D, quality: "min7", bass: Note.A });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Dm7/A");
      expect(result.value.bass).toEqual(Note.A);
    });

    test("F#m/C#", () => {
      const result = buildChord({ root: Note.F_SHARP, quality: "min", bass: Note.C_SHARP });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("F#m/C#");
    });
  });

  describe("tensions", () => {
    test("C7b9", () => {
      const result = buildChord({ root: Note.C, quality: "7", tensions: ["b9"] });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("C7b9");
      expect(result.value.tones).toEqual([Note.C, Note.E, Note.G, Note.B_FLAT, Note.D_FLAT]);
    });

    test("C7#9", () => {
      const result = buildChord({ root: Note.C, quality: "7", tensions: ["#9"] });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("C7#9");
      expect(result.value.tones).toEqual([Note.C, Note.E, Note.G, Note.B_FLAT, Note.D_SHARP]);
    });

    test("Cmaj7#11", () => {
      const result = buildChord({ root: Note.C, quality: "maj7", tensions: ["#11"] });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Cmaj7#11");
      expect(result.value.tones).toEqual([Note.C, Note.E, Note.G, Note.B, Note.F_SHARP]);
    });

    test("C7b13", () => {
      const result = buildChord({ root: Note.C, quality: "7", tensions: ["b13"] });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("C7b13");
      expect(result.value.tones).toEqual([Note.C, Note.E, Note.G, Note.B_FLAT, Note.A_FLAT]);
    });

    test("C7#9b13 (multiple tensions)", () => {
      const result = buildChord({ root: Note.C, quality: "7", tensions: ["#9", "b13"] });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("C7#9b13");
    });

    test("G7b9#9 (both b9 and #9 - the Hendrix chord)", () => {
      const result = buildChord({ root: Note.G, quality: "7", tensions: ["b9", "#9"] });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("G7b9#9");
    });
  });

  describe("omissions", () => {
    test("C7 omit 5", () => {
      const result = buildChord({ root: Note.C, quality: "7", omit: ["5"] });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("C7(no5)");
      expect(result.value.tones).toEqual([Note.C, Note.E, Note.B_FLAT]);
    });

    test("Cmaj7 omit 3 (sus-like)", () => {
      const result = buildChord({ root: Note.C, quality: "maj7", omit: ["3"] });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Cmaj7(no3)");
      expect(result.value.tones).toEqual([Note.C, Note.G, Note.B]);
    });

    test("C9 omit 3 and 5", () => {
      const result = buildChord({ root: Note.C, quality: "9", omit: ["3", "5"] });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("C9(no3)(no5)");
      expect(result.value.tones).toEqual([Note.C, Note.B_FLAT, Note.D]);
    });
  });

  describe("combined tensions and omissions", () => {
    test("C7#9 omit 5", () => {
      const result = buildChord({
        root: Note.C,
        quality: "7",
        tensions: ["#9"],
        omit: ["5"],
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("C7#9(no5)");
    });

    test("Cmaj9#11/E", () => {
      const result = buildChord({
        root: Note.C,
        quality: "maj9",
        tensions: ["#11"],
        bass: Note.E,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.symbol).toBe("Cmaj9#11/E");
    });
  });
});

describe("validateChordSpec", () => {
  describe("valid specs", () => {
    test("simple major triad is valid", () => {
      const result = validateChordSpec({ root: Note.C, quality: "maj" });
      expect(result.ok).toBe(true);
    });

    test("complex chord with tensions is valid", () => {
      const result = validateChordSpec({
        root: Note.G,
        quality: "7",
        tensions: ["b9", "#9"],
        bass: Note.D,
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("invalid specs - tension conflicts", () => {
    test("rejects #11 on maj11 (already has natural 11)", () => {
      const result = validateChordSpec({
        root: Note.C,
        quality: "maj11",
        tensions: ["#11"],
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("TENSION_DUPLICATES_CHORD_TONE");
    });

    test("rejects b9 on 9 chord (already has natural 9)", () => {
      const result = validateChordSpec({
        root: Note.C,
        quality: "9",
        tensions: ["b9"],
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("TENSION_DUPLICATES_CHORD_TONE");
    });

    test("rejects #9 on min9 (already has natural 9)", () => {
      const result = validateChordSpec({
        root: Note.C,
        quality: "min9",
        tensions: ["#9"],
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("TENSION_DUPLICATES_CHORD_TONE");
    });

    test("rejects b13 on 13 chord (already has natural 13)", () => {
      const result = validateChordSpec({
        root: Note.C,
        quality: "13",
        tensions: ["b13"],
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("TENSION_DUPLICATES_CHORD_TONE");
    });
  });

  describe("invalid specs - diminished restrictions", () => {
    test("rejects b9 on dim7 (creates minor 9th against root)", () => {
      const result = validateChordSpec({
        root: Note.C,
        quality: "dim7",
        tensions: ["b9"],
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_TENSION_FOR_QUALITY");
    });

    test("rejects tensions on dim triad", () => {
      const result = validateChordSpec({
        root: Note.C,
        quality: "dim",
        tensions: ["b9"],
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_TENSION_FOR_QUALITY");
    });
  });

  describe("invalid specs - bass note", () => {
    test("rejects bass same as root", () => {
      const result = validateChordSpec({
        root: Note.C,
        quality: "maj",
        bass: Note.C,
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("BASS_EQUALS_ROOT");
    });
  });

  describe("invalid specs - omit restrictions", () => {
    test("rejects omit 3 on dim (3rd defines diminished quality)", () => {
      const result = validateChordSpec({
        root: Note.C,
        quality: "dim",
        omit: ["3"],
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("CANNOT_OMIT_DEFINING_TONE");
    });

    test("rejects omit 5 on aug (5th defines augmented quality)", () => {
      const result = validateChordSpec({
        root: Note.C,
        quality: "aug",
        omit: ["5"],
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("CANNOT_OMIT_DEFINING_TONE");
    });

    test("rejects omit 5 on dim (5th defines diminished quality)", () => {
      const result = validateChordSpec({
        root: Note.C,
        quality: "dim",
        omit: ["5"],
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("CANNOT_OMIT_DEFINING_TONE");
    });
  });

  describe("invalid specs - duplicate tensions", () => {
    test("rejects duplicate tension entries", () => {
      const result = validateChordSpec({
        root: Note.C,
        quality: "7",
        tensions: ["b9", "b9"],
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("DUPLICATE_TENSION");
    });
  });

  describe("invalid specs - duplicate omissions", () => {
    test("rejects duplicate omit entries", () => {
      const result = validateChordSpec({
        root: Note.C,
        quality: "7",
        omit: ["5", "5"],
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("DUPLICATE_OMIT");
    });
  });
});

describe("chordPalette", () => {
  describe("basic key palettes", () => {
    test("C major triads", () => {
      const palette = chordPalette({ root: Note.C, mode: "major" }, { color: "triad" });
      expect(palette).toHaveLength(7);

      // I = C
      expect(palette[0]).toEqual({ root: Note.C, quality: "maj" });
      // ii = Dm
      expect(palette[1]).toEqual({ root: Note.D, quality: "min" });
      // iii = Em
      expect(palette[2]).toEqual({ root: Note.E, quality: "min" });
      // IV = F
      expect(palette[3]).toEqual({ root: Note.F, quality: "maj" });
      // V = G
      expect(palette[4]).toEqual({ root: Note.G, quality: "maj" });
      // vi = Am
      expect(palette[5]).toEqual({ root: Note.A, quality: "min" });
      // vii° = Bdim
      expect(palette[6]).toEqual({ root: Note.B, quality: "dim" });
    });

    test("A minor triads", () => {
      const palette = chordPalette({ root: Note.A, mode: "minor" }, { color: "triad" });
      expect(palette).toHaveLength(7);

      // i = Am
      expect(palette[0]).toEqual({ root: Note.A, quality: "min" });
      // ii° = Bdim
      expect(palette[1]).toEqual({ root: Note.B, quality: "dim" });
      // III = C
      expect(palette[2]).toEqual({ root: Note.C, quality: "maj" });
      // iv = Dm
      expect(palette[3]).toEqual({ root: Note.D, quality: "min" });
      // v = Em
      expect(palette[4]).toEqual({ root: Note.E, quality: "min" });
      // VI = F
      expect(palette[5]).toEqual({ root: Note.F, quality: "maj" });
      // VII = G
      expect(palette[6]).toEqual({ root: Note.G, quality: "maj" });
    });

    test("G major triads", () => {
      const palette = chordPalette({ root: Note.G, mode: "major" }, { color: "triad" });

      expect(palette[0]).toEqual({ root: Note.G, quality: "maj" });
      expect(palette[1]).toEqual({ root: Note.A, quality: "min" });
      expect(palette[2]).toEqual({ root: Note.B, quality: "min" });
      expect(palette[3]).toEqual({ root: Note.C, quality: "maj" });
      expect(palette[4]).toEqual({ root: Note.D, quality: "maj" });
      expect(palette[5]).toEqual({ root: Note.E, quality: "min" });
      expect(palette[6]).toEqual({ root: Note.F_SHARP, quality: "dim" });
    });
  });

  describe("seventh chord palettes", () => {
    test("C major sevenths", () => {
      const palette = chordPalette({ root: Note.C, mode: "major" }, { color: "seventh" });
      expect(palette).toHaveLength(7);

      // Imaj7 = Cmaj7
      expect(palette[0]).toEqual({ root: Note.C, quality: "maj7" });
      // ii7 = Dm7
      expect(palette[1]).toEqual({ root: Note.D, quality: "min7" });
      // iii7 = Em7
      expect(palette[2]).toEqual({ root: Note.E, quality: "min7" });
      // IVmaj7 = Fmaj7
      expect(palette[3]).toEqual({ root: Note.F, quality: "maj7" });
      // V7 = G7
      expect(palette[4]).toEqual({ root: Note.G, quality: "7" });
      // vi7 = Am7
      expect(palette[5]).toEqual({ root: Note.A, quality: "min7" });
      // viiø7 = Bm7b5
      expect(palette[6]).toEqual({ root: Note.B, quality: "m7b5" });
    });

    test("A minor sevenths (natural minor)", () => {
      const palette = chordPalette({ root: Note.A, mode: "minor" }, { color: "seventh" });

      // i7 = Am7
      expect(palette[0]).toEqual({ root: Note.A, quality: "min7" });
      // iiø7 = Bm7b5
      expect(palette[1]).toEqual({ root: Note.B, quality: "m7b5" });
      // IIImaj7 = Cmaj7
      expect(palette[2]).toEqual({ root: Note.C, quality: "maj7" });
      // iv7 = Dm7
      expect(palette[3]).toEqual({ root: Note.D, quality: "min7" });
      // v7 = Em7 (natural minor)
      expect(palette[4]).toEqual({ root: Note.E, quality: "min7" });
      // VImaj7 = Fmaj7
      expect(palette[5]).toEqual({ root: Note.F, quality: "maj7" });
      // VII7 = G7
      expect(palette[6]).toEqual({ root: Note.G, quality: "7" });
    });
  });

  describe("extended chord palettes", () => {
    test("C major extended (9ths)", () => {
      const palette = chordPalette(
        { root: Note.C, mode: "major" },
        { color: "extended", maxExtension: 9 }
      );

      expect(palette[0]).toEqual({ root: Note.C, quality: "maj9" });
      expect(palette[1]).toEqual({ root: Note.D, quality: "min9" });
      expect(palette[4]).toEqual({ root: Note.G, quality: "9" });
    });

    test("C major extended (11ths)", () => {
      const palette = chordPalette(
        { root: Note.C, mode: "major" },
        { color: "extended", maxExtension: 11 }
      );

      expect(palette[0]).toEqual({ root: Note.C, quality: "maj11" });
      expect(palette[1]).toEqual({ root: Note.D, quality: "min11" });
      expect(palette[4]).toEqual({ root: Note.G, quality: "11" });
    });

    test("C major extended (13ths)", () => {
      const palette = chordPalette(
        { root: Note.C, mode: "major" },
        { color: "extended", maxExtension: 13 }
      );

      expect(palette[0]).toEqual({ root: Note.C, quality: "maj13" });
      expect(palette[1]).toEqual({ root: Note.D, quality: "min13" });
      expect(palette[4]).toEqual({ root: Note.G, quality: "13" });
    });
  });

  describe("palette options", () => {
    test("includeDominants adds secondary dominants", () => {
      const palette = chordPalette(
        { root: Note.C, mode: "major" },
        { color: "seventh", includeDominants: true }
      );

      // Should include V7/V (D7), V7/ii (A7), etc.
      const dominantRoots = palette
        .filter((spec) => spec.quality === "7")
        .map((spec) => spec.root);

      expect(dominantRoots).toContainEqual(Note.G); // V7
      expect(dominantRoots).toContainEqual(Note.D); // V7/V
      expect(dominantRoots).toContainEqual(Note.A); // V7/ii
      expect(dominantRoots).toContainEqual(Note.E); // V7/vi
      expect(dominantRoots).toContainEqual(Note.B); // V7/iii
    });

    test("includeBorrowed adds borrowed chords from parallel mode", () => {
      const palette = chordPalette(
        { root: Note.C, mode: "major" },
        { color: "triad", includeBorrowed: true }
      );

      // Should include bVII (Bb), bVI (Ab), bIII (Eb), iv (Fm)
      const roots = palette.map((spec) => spec.root);
      expect(roots).toContainEqual(Note.B_FLAT); // bVII
      expect(roots).toContainEqual(Note.A_FLAT); // bVI
      expect(roots).toContainEqual(Note.E_FLAT); // bIII

      // Should include Fm (borrowed iv)
      const fMinor = palette.find(
        (spec) => spec.root.letter === "F" && spec.quality === "min"
      );
      expect(fMinor).toBeDefined();
    });
  });

  describe("sharp key palettes", () => {
    test("F# major triads", () => {
      const palette = chordPalette({ root: Note.F_SHARP, mode: "major" }, { color: "triad" });

      expect(palette[0]).toEqual({ root: Note.F_SHARP, quality: "maj" });
      expect(palette[1]).toEqual({ root: Note.G_SHARP, quality: "min" });
      expect(palette[2]).toEqual({ root: Note.A_SHARP, quality: "min" });
      expect(palette[3]).toEqual({ root: Note.B, quality: "maj" });
      expect(palette[4]).toEqual({ root: Note.C_SHARP, quality: "maj" });
      expect(palette[5]).toEqual({ root: Note.D_SHARP, quality: "min" });
      expect(palette[6]).toEqual({ root: Note.E_SHARP, quality: "dim" });
    });
  });

  describe("flat key palettes", () => {
    test("Bb major triads", () => {
      const palette = chordPalette({ root: Note.B_FLAT, mode: "major" }, { color: "triad" });

      expect(palette[0]).toEqual({ root: Note.B_FLAT, quality: "maj" });
      expect(palette[1]).toEqual({ root: Note.C, quality: "min" });
      expect(palette[2]).toEqual({ root: Note.D, quality: "min" });
      expect(palette[3]).toEqual({ root: Note.E_FLAT, quality: "maj" });
      expect(palette[4]).toEqual({ root: Note.F, quality: "maj" });
      expect(palette[5]).toEqual({ root: Note.G, quality: "min" });
      expect(palette[6]).toEqual({ root: Note.A, quality: "dim" });
    });

    test("Eb minor triads", () => {
      const palette = chordPalette({ root: Note.E_FLAT, mode: "minor" }, { color: "triad" });

      expect(palette[0]).toEqual({ root: Note.E_FLAT, quality: "min" });
      expect(palette[1]).toEqual({ root: Note.F, quality: "dim" });
      expect(palette[2]).toEqual({ root: Note.G_FLAT, quality: "maj" });
      expect(palette[3]).toEqual({ root: Note.A_FLAT, quality: "min" });
      expect(palette[4]).toEqual({ root: Note.B_FLAT, quality: "min" });
      expect(palette[5]).toEqual({ root: Note.C_FLAT, quality: "maj" });
      expect(palette[6]).toEqual({ root: Note.D_FLAT, quality: "maj" });
    });
  });

  describe("default options", () => {
    test("defaults to triads when no color specified", () => {
      const palette = chordPalette({ root: Note.C, mode: "major" });
      expect(palette[0].quality).toBe("maj");
      expect(palette[1].quality).toBe("min");
    });

    test("defaults to 9 when extended but no maxExtension", () => {
      const palette = chordPalette({ root: Note.C, mode: "major" }, { color: "extended" });
      expect(palette[0].quality).toBe("maj9");
    });
  });
});

describe("Result type behavior", () => {
  test("buildChord returns ok: true with value on success", () => {
    const result = buildChord({ root: Note.C, quality: "maj" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeDefined();
      expect(result.value.symbol).toBeDefined();
      expect(result.value.tones).toBeDefined();
    }
  });

  test("buildChord returns ok: false with error on failure", () => {
    const result = buildChord({
      root: Note.C,
      quality: "maj11",
      tensions: ["#11"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeDefined();
      expect(result.error.code).toBeDefined();
      expect(result.error.message).toBeDefined();
    }
  });

  test("validateChordSpec returns ok: true on valid spec", () => {
    const result = validateChordSpec({ root: Note.C, quality: "maj" });
    expect(result.ok).toBe(true);
  });

  test("validateChordSpec returns ok: false with structured error on invalid", () => {
    const result = validateChordSpec({
      root: Note.C,
      quality: "dim",
      omit: ["3"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CANNOT_OMIT_DEFINING_TONE");
      expect(typeof result.error.message).toBe("string");
    }
  });
});
