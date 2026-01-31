import { test, expect, describe } from "bun:test";
import { parseChord } from "./parseChord";
import { PC } from "./pitchClass";

// Pitch classes ordered by harmonic relevance: root, fifth, third, (seventh), (ninth), (eleventh)

describe("parseChord", () => {
  describe("major triads", () => {
    test("Cmaj returns C major triad", () => {
      const result = parseChord("Cmaj");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E]); // root, fifth, third
    });

    test("C returns C major triad (implicit major)", () => {
      const result = parseChord("C");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E]);
    });

    test("Dmaj returns D major triad", () => {
      const result = parseChord("Dmaj");
      expect(result.bassNote).toBe(PC.D);
      expect(result.pitchClasses).toEqual([PC.D, PC.A, PC.F_SHARP]); // D, A, F#
    });

    test("F#maj returns F# major triad", () => {
      const result = parseChord("F#maj");
      expect(result.bassNote).toBe(PC.F_SHARP);
      expect(result.pitchClasses).toEqual([PC.F_SHARP, PC.C_SHARP, PC.A_SHARP]); // F#, C#, A#
    });

    test("Bbmaj returns Bb major triad", () => {
      const result = parseChord("Bbmaj");
      expect(result.bassNote).toBe(PC.B_FLAT);
      expect(result.pitchClasses).toEqual([PC.B_FLAT, PC.F, PC.D]); // Bb, F, D
    });

    test("Dbmaj returns Db major triad", () => {
      const result = parseChord("Dbmaj");
      expect(result.bassNote).toBe(PC.D_FLAT);
      expect(result.pitchClasses).toEqual([PC.D_FLAT, PC.A_FLAT, PC.F]); // Db, Ab, F
    });
  });

  describe("minor triads", () => {
    test("Cm returns C minor triad", () => {
      const result = parseChord("Cm");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E_FLAT]); // root, fifth, minor third
    });

    test("Cmin returns C minor triad", () => {
      const result = parseChord("Cmin");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E_FLAT]);
    });

    test("C#m returns C# minor triad", () => {
      const result = parseChord("C#m");
      expect(result.bassNote).toBe(PC.C_SHARP);
      expect(result.pitchClasses).toEqual([PC.C_SHARP, PC.G_SHARP, PC.E]); // C#, G#, E
    });

    test("Am returns A minor triad", () => {
      const result = parseChord("Am");
      expect(result.bassNote).toBe(PC.A);
      expect(result.pitchClasses).toEqual([PC.A, PC.E, PC.C]); // A, E, C
    });
  });

  describe("diminished triads", () => {
    test("Cdim returns C diminished triad", () => {
      const result = parseChord("Cdim");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G_FLAT, PC.E_FLAT]); // root, dim fifth, minor third
    });

    test("Dbdim returns Db diminished triad", () => {
      const result = parseChord("Dbdim");
      expect(result.bassNote).toBe(PC.D_FLAT);
      expect(result.pitchClasses).toEqual([PC.D_FLAT, PC.G, PC.E]); // Db, G (dim5), E (Fb)
    });

    test("Bdim returns B diminished triad", () => {
      const result = parseChord("Bdim");
      expect(result.bassNote).toBe(PC.B);
      expect(result.pitchClasses).toEqual([PC.B, PC.F, PC.D]); // B, F, D
    });
  });

  describe("augmented triads", () => {
    test("Caug returns C augmented triad", () => {
      const result = parseChord("Caug");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G_SHARP, PC.E]); // root, aug fifth, major third
    });

    test("C+ returns C augmented triad", () => {
      const result = parseChord("C+");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G_SHARP, PC.E]);
    });

    test("Ebaug returns Eb augmented triad", () => {
      const result = parseChord("Ebaug");
      expect(result.bassNote).toBe(PC.E_FLAT);
      expect(result.pitchClasses).toEqual([PC.E_FLAT, PC.B, PC.G]); // Eb, B, G
    });
  });

  describe("slash chords (inversions/alternate bass)", () => {
    test("C/E returns C major with E bass", () => {
      const result = parseChord("C/E");
      expect(result.bassNote).toBe(PC.E);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E]);
    });

    test("C/G returns C major with G bass", () => {
      const result = parseChord("C/G");
      expect(result.bassNote).toBe(PC.G);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E]);
    });

    test("Dm/A returns D minor with A bass", () => {
      const result = parseChord("Dm/A");
      expect(result.bassNote).toBe(PC.A);
      expect(result.pitchClasses).toEqual([PC.D, PC.A, PC.F]); // D, A, F
    });

    test("Dbdim/G returns Db diminished with G bass", () => {
      const result = parseChord("Dbdim/G");
      expect(result.bassNote).toBe(PC.G);
      expect(result.pitchClasses).toEqual([PC.D_FLAT, PC.G, PC.E]); // Db, G (dim5), E (Fb)
    });

    test("F#m/C# returns F# minor with C# bass", () => {
      const result = parseChord("F#m/C#");
      expect(result.bassNote).toBe(PC.C_SHARP);
      expect(result.pitchClasses).toEqual([PC.F_SHARP, PC.C_SHARP, PC.A]); // F#, C#, A
    });
  });

  describe("seventh chords", () => {
    test("Cmaj7 returns C major seventh", () => {
      const result = parseChord("Cmaj7");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E, PC.B]); // root, fifth, third, seventh
    });

    test("CM7 returns C major seventh", () => {
      const result = parseChord("CM7");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E, PC.B]);
    });

    test("Dm7 returns D minor seventh", () => {
      const result = parseChord("Dm7");
      expect(result.bassNote).toBe(PC.D);
      expect(result.pitchClasses).toEqual([PC.D, PC.A, PC.F, PC.C]); // D, A, F, C
    });

    test("Dmin7 returns D minor seventh", () => {
      const result = parseChord("Dmin7");
      expect(result.bassNote).toBe(PC.D);
      expect(result.pitchClasses).toEqual([PC.D, PC.A, PC.F, PC.C]);
    });

    test("G7 returns G dominant seventh", () => {
      const result = parseChord("G7");
      expect(result.bassNote).toBe(PC.G);
      expect(result.pitchClasses).toEqual([PC.G, PC.D, PC.B, PC.F]); // G, D, B, F
    });

    test("Bb7 returns Bb dominant seventh", () => {
      const result = parseChord("Bb7");
      expect(result.bassNote).toBe(PC.B_FLAT);
      expect(result.pitchClasses).toEqual([PC.B_FLAT, PC.F, PC.D, PC.A_FLAT]); // Bb, F, D, Ab
    });

    test("Cdim7 returns C diminished seventh", () => {
      const result = parseChord("Cdim7");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G_FLAT, PC.E_FLAT, PC.A]); // root, dim5, min3, dim7
    });

    test("Cm7b5 returns C half-diminished seventh", () => {
      const result = parseChord("Cm7b5");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G_FLAT, PC.E_FLAT, PC.B_FLAT]); // root, dim5, min3, min7
    });

    test("F#maj7 returns F# major seventh", () => {
      const result = parseChord("F#maj7");
      expect(result.bassNote).toBe(PC.F_SHARP);
      expect(result.pitchClasses).toEqual([PC.F_SHARP, PC.C_SHARP, PC.A_SHARP, PC.F]); // F#, C#, A#, E# (F)
    });

    test("Abm7 returns Ab minor seventh", () => {
      const result = parseChord("Abm7");
      expect(result.bassNote).toBe(PC.A_FLAT);
      expect(result.pitchClasses).toEqual([PC.A_FLAT, PC.E_FLAT, PC.B, PC.G_FLAT]); // Ab, Eb, Cb (B), Gb
    });
  });

  describe("ninth chords", () => {
    test("C9 returns C dominant ninth", () => {
      const result = parseChord("C9");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E, PC.B_FLAT, PC.D]); // root, 5, 3, 7, 9
    });

    test("Cmaj9 returns C major ninth", () => {
      const result = parseChord("Cmaj9");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E, PC.B, PC.D]);
    });

    test("Cm9 returns C minor ninth", () => {
      const result = parseChord("Cm9");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E_FLAT, PC.B_FLAT, PC.D]);
    });

    test("Dm9 returns D minor ninth", () => {
      const result = parseChord("Dm9");
      expect(result.bassNote).toBe(PC.D);
      expect(result.pitchClasses).toEqual([PC.D, PC.A, PC.F, PC.C, PC.E]); // D, A, F, C, E
    });

    test("F#9 returns F# dominant ninth", () => {
      const result = parseChord("F#9");
      expect(result.bassNote).toBe(PC.F_SHARP);
      expect(result.pitchClasses).toEqual([PC.F_SHARP, PC.C_SHARP, PC.A_SHARP, PC.E, PC.G_SHARP]); // F#, C#, A#, E, G#
    });
  });

  describe("eleventh chords", () => {
    test("C11 returns C dominant eleventh", () => {
      const result = parseChord("C11");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E, PC.B_FLAT, PC.D, PC.F]); // root, 5, 3, 7, 9, 11
    });

    test("Cmaj11 returns C major eleventh", () => {
      const result = parseChord("Cmaj11");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E, PC.B, PC.D, PC.F]);
    });

    test("Cm11 returns C minor eleventh", () => {
      const result = parseChord("Cm11");
      expect(result.bassNote).toBe(PC.C);
      expect(result.pitchClasses).toEqual([PC.C, PC.G, PC.E_FLAT, PC.B_FLAT, PC.D, PC.F]);
    });

    test("Gm11 returns G minor eleventh", () => {
      const result = parseChord("Gm11");
      expect(result.bassNote).toBe(PC.G);
      expect(result.pitchClasses).toEqual([PC.G, PC.D, PC.B_FLAT, PC.F, PC.A, PC.C]); // G, D, Bb, F, A, C
    });

    test("Bb11 returns Bb dominant eleventh", () => {
      const result = parseChord("Bb11");
      expect(result.bassNote).toBe(PC.B_FLAT);
      expect(result.pitchClasses).toEqual([PC.B_FLAT, PC.F, PC.D, PC.A_FLAT, PC.C, PC.E_FLAT]); // Bb, F, D, Ab, C, Eb
    });
  });

  describe("error handling", () => {
    test("throws on invalid chord", () => {
      expect(() => parseChord("XYZ")).toThrow();
    });

    test("throws on empty string", () => {
      expect(() => parseChord("")).toThrow();
    });

    test("throws on invalid root note", () => {
      expect(() => parseChord("Hmaj")).toThrow();
    });
  });
});
