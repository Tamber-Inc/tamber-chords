import { test, expect, describe } from "bun:test";
import { parseChord } from "./parseChord";
import { Note, N } from "./noteName";

// Tertian stacking order: root, 3rd, 5th, (7th), (9th), (11th), (13th)
// Spellings are preserved for round-trippability (E# !== F, Cb !== B)

describe("parseChord", () => {
  describe("major triads", () => {
    test("Cmaj returns C major triad", () => {
      const result = parseChord("Cmaj");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.C, Note.E, Note.G]); // root, 3rd, 5th
    });

    test("C returns C major triad (implicit major)", () => {
      const result = parseChord("C");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.C, Note.E, Note.G]);
    });

    test("Dmaj returns D major triad", () => {
      const result = parseChord("Dmaj");
      expect(result.root).toEqual(Note.D);
      expect(result.bass).toEqual(Note.D);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.D, Note.F_SHARP, Note.A]);
    });

    test("F#maj returns F# major triad", () => {
      const result = parseChord("F#maj");
      expect(result.root).toEqual(Note.F_SHARP);
      expect(result.bass).toEqual(Note.F_SHARP);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.F_SHARP, Note.A_SHARP, Note.C_SHARP]);
    });

    test("Bbmaj returns Bb major triad", () => {
      const result = parseChord("Bbmaj");
      expect(result.root).toEqual(Note.B_FLAT);
      expect(result.bass).toEqual(Note.B_FLAT);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.B_FLAT, Note.D, Note.F]);
    });

    test("Dbmaj returns Db major triad", () => {
      const result = parseChord("Dbmaj");
      expect(result.root).toEqual(Note.D_FLAT);
      expect(result.bass).toEqual(Note.D_FLAT);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.D_FLAT, Note.F, Note.A_FLAT]);
    });
  });

  describe("minor triads", () => {
    test("Cm returns C minor triad", () => {
      const result = parseChord("Cm");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("minor");
      expect(result.chordTones).toEqual([Note.C, Note.E_FLAT, Note.G]);
    });

    test("Cmin returns C minor triad", () => {
      const result = parseChord("Cmin");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("minor");
      expect(result.chordTones).toEqual([Note.C, Note.E_FLAT, Note.G]);
    });

    test("C#m returns C# minor triad", () => {
      const result = parseChord("C#m");
      expect(result.root).toEqual(Note.C_SHARP);
      expect(result.bass).toEqual(Note.C_SHARP);
      expect(result.quality).toBe("minor");
      expect(result.chordTones).toEqual([Note.C_SHARP, Note.E, Note.G_SHARP]);
    });

    test("Am returns A minor triad", () => {
      const result = parseChord("Am");
      expect(result.root).toEqual(Note.A);
      expect(result.bass).toEqual(Note.A);
      expect(result.quality).toBe("minor");
      expect(result.chordTones).toEqual([Note.A, Note.C, Note.E]);
    });
  });

  describe("diminished triads", () => {
    test("Cdim returns C diminished triad", () => {
      const result = parseChord("Cdim");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("diminished");
      expect(result.chordTones).toEqual([Note.C, Note.E_FLAT, Note.G_FLAT]);
    });

    test("Dbdim returns Db diminished triad with correct spellings", () => {
      const result = parseChord("Dbdim");
      expect(result.root).toEqual(Note.D_FLAT);
      expect(result.bass).toEqual(Note.D_FLAT);
      expect(result.quality).toBe("diminished");
      // Db dim = Db, Fb, Abb (correct theory spelling)
      expect(result.chordTones).toEqual([
        Note.D_FLAT,
        Note.F_FLAT, // NOT E
        N("A", -2),  // Abb, NOT G
      ]);
    });

    test("Bdim returns B diminished triad", () => {
      const result = parseChord("Bdim");
      expect(result.root).toEqual(Note.B);
      expect(result.bass).toEqual(Note.B);
      expect(result.quality).toBe("diminished");
      expect(result.chordTones).toEqual([Note.B, Note.D, Note.F]);
    });

    test("F#dim returns F# diminished triad", () => {
      const result = parseChord("F#dim");
      expect(result.root).toEqual(Note.F_SHARP);
      expect(result.bass).toEqual(Note.F_SHARP);
      expect(result.quality).toBe("diminished");
      expect(result.chordTones).toEqual([Note.F_SHARP, Note.A, Note.C]);
    });
  });

  describe("augmented triads", () => {
    test("Caug returns C augmented triad", () => {
      const result = parseChord("Caug");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("augmented");
      expect(result.chordTones).toEqual([Note.C, Note.E, Note.G_SHARP]);
    });

    test("C+ returns C augmented triad", () => {
      const result = parseChord("C+");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("augmented");
      expect(result.chordTones).toEqual([Note.C, Note.E, Note.G_SHARP]);
    });

    test("Ebaug returns Eb augmented triad", () => {
      const result = parseChord("Ebaug");
      expect(result.root).toEqual(Note.E_FLAT);
      expect(result.bass).toEqual(Note.E_FLAT);
      expect(result.quality).toBe("augmented");
      expect(result.chordTones).toEqual([Note.E_FLAT, Note.G, Note.B]);
    });

    test("Faug returns F augmented triad", () => {
      const result = parseChord("Faug");
      expect(result.root).toEqual(Note.F);
      expect(result.bass).toEqual(Note.F);
      expect(result.quality).toBe("augmented");
      // F aug = F, A, C# (augmented fifth is raised, spelled as sharp)
      expect(result.chordTones).toEqual([Note.F, Note.A, Note.C_SHARP]);
    });
  });

  describe("slash chords (alternate bass)", () => {
    test("C/E returns C major with E bass", () => {
      const result = parseChord("C/E");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.E);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.C, Note.E, Note.G]);
    });

    test("C/G returns C major with G bass", () => {
      const result = parseChord("C/G");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.G);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.C, Note.E, Note.G]);
    });

    test("Dm/A returns D minor with A bass", () => {
      const result = parseChord("Dm/A");
      expect(result.root).toEqual(Note.D);
      expect(result.bass).toEqual(Note.A);
      expect(result.quality).toBe("minor");
      expect(result.chordTones).toEqual([Note.D, Note.F, Note.A]);
    });

    test("Dbdim/G returns Db diminished with G bass", () => {
      const result = parseChord("Dbdim/G");
      expect(result.root).toEqual(Note.D_FLAT);
      expect(result.bass).toEqual(Note.G);
      expect(result.quality).toBe("diminished");
      expect(result.chordTones).toEqual([Note.D_FLAT, Note.F_FLAT, N("A", -2)]);
    });

    test("F#m/C# returns F# minor with C# bass", () => {
      const result = parseChord("F#m/C#");
      expect(result.root).toEqual(Note.F_SHARP);
      expect(result.bass).toEqual(Note.C_SHARP);
      expect(result.quality).toBe("minor");
      expect(result.chordTones).toEqual([Note.F_SHARP, Note.A, Note.C_SHARP]);
    });
  });

  describe("seventh chords", () => {
    test("Cmaj7 returns C major seventh", () => {
      const result = parseChord("Cmaj7");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.C, Note.E, Note.G, Note.B]);
    });

    test("CM7 returns C major seventh", () => {
      const result = parseChord("CM7");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.C, Note.E, Note.G, Note.B]);
    });

    test("Dm7 returns D minor seventh", () => {
      const result = parseChord("Dm7");
      expect(result.root).toEqual(Note.D);
      expect(result.bass).toEqual(Note.D);
      expect(result.quality).toBe("minor");
      expect(result.chordTones).toEqual([Note.D, Note.F, Note.A, Note.C]);
    });

    test("Dmin7 returns D minor seventh", () => {
      const result = parseChord("Dmin7");
      expect(result.root).toEqual(Note.D);
      expect(result.bass).toEqual(Note.D);
      expect(result.quality).toBe("minor");
      expect(result.chordTones).toEqual([Note.D, Note.F, Note.A, Note.C]);
    });

    test("G7 returns G dominant seventh", () => {
      const result = parseChord("G7");
      expect(result.root).toEqual(Note.G);
      expect(result.bass).toEqual(Note.G);
      expect(result.quality).toBe("major"); // dominant 7 has major triad
      expect(result.chordTones).toEqual([Note.G, Note.B, Note.D, Note.F]);
    });

    test("Bb7 returns Bb dominant seventh", () => {
      const result = parseChord("Bb7");
      expect(result.root).toEqual(Note.B_FLAT);
      expect(result.bass).toEqual(Note.B_FLAT);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.B_FLAT, Note.D, Note.F, Note.A_FLAT]);
    });

    test("Cdim7 returns C diminished seventh", () => {
      const result = parseChord("Cdim7");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("diminished");
      // dim7 = root, m3, d5, d7 (which is a whole step below the root)
      expect(result.chordTones).toEqual([
        Note.C,
        Note.E_FLAT,
        Note.G_FLAT,
        N("B", -2), // Bbb (diminished 7th)
      ]);
    });

    test("Cm7b5 returns C half-diminished seventh", () => {
      const result = parseChord("Cm7b5");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("diminished"); // half-dim has dim triad
      expect(result.chordTones).toEqual([Note.C, Note.E_FLAT, Note.G_FLAT, Note.B_FLAT]);
    });

    test("F#maj7 returns F# major seventh with E# spelling", () => {
      const result = parseChord("F#maj7");
      expect(result.root).toEqual(Note.F_SHARP);
      expect(result.bass).toEqual(Note.F_SHARP);
      expect(result.quality).toBe("major");
      // F#maj7 = F#, A#, C#, E# (NOT F!)
      expect(result.chordTones).toEqual([
        Note.F_SHARP,
        Note.A_SHARP,
        Note.C_SHARP,
        Note.E_SHARP, // E#, preserving spelling
      ]);
    });

    test("Abm7 returns Ab minor seventh with Cb spelling", () => {
      const result = parseChord("Abm7");
      expect(result.root).toEqual(Note.A_FLAT);
      expect(result.bass).toEqual(Note.A_FLAT);
      expect(result.quality).toBe("minor");
      // Abm7 = Ab, Cb, Eb, Gb (Cb NOT B!)
      expect(result.chordTones).toEqual([
        Note.A_FLAT,
        Note.C_FLAT, // Cb, preserving spelling
        Note.E_FLAT,
        Note.G_FLAT,
      ]);
    });
  });

  describe("ninth chords", () => {
    test("C9 returns C dominant ninth", () => {
      const result = parseChord("C9");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.C, Note.E, Note.G, Note.B_FLAT, Note.D]);
    });

    test("Cmaj9 returns C major ninth", () => {
      const result = parseChord("Cmaj9");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.C, Note.E, Note.G, Note.B, Note.D]);
    });

    test("Cm9 returns C minor ninth", () => {
      const result = parseChord("Cm9");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("minor");
      expect(result.chordTones).toEqual([Note.C, Note.E_FLAT, Note.G, Note.B_FLAT, Note.D]);
    });

    test("Dm9 returns D minor ninth", () => {
      const result = parseChord("Dm9");
      expect(result.root).toEqual(Note.D);
      expect(result.bass).toEqual(Note.D);
      expect(result.quality).toBe("minor");
      expect(result.chordTones).toEqual([Note.D, Note.F, Note.A, Note.C, Note.E]);
    });

    test("F#9 returns F# dominant ninth", () => {
      const result = parseChord("F#9");
      expect(result.root).toEqual(Note.F_SHARP);
      expect(result.bass).toEqual(Note.F_SHARP);
      expect(result.quality).toBe("major");
      // F#9 = F#, A#, C#, E, G#
      expect(result.chordTones).toEqual([
        Note.F_SHARP,
        Note.A_SHARP,
        Note.C_SHARP,
        Note.E, // dominant 7 is minor 7th interval
        Note.G_SHARP,
      ]);
    });
  });

  describe("eleventh chords", () => {
    test("C11 returns C dominant eleventh", () => {
      const result = parseChord("C11");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.C, Note.E, Note.G, Note.B_FLAT, Note.D, Note.F]);
    });

    test("Cmaj11 returns C major eleventh", () => {
      const result = parseChord("Cmaj11");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([Note.C, Note.E, Note.G, Note.B, Note.D, Note.F]);
    });

    test("Cm11 returns C minor eleventh", () => {
      const result = parseChord("Cm11");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.quality).toBe("minor");
      expect(result.chordTones).toEqual([Note.C, Note.E_FLAT, Note.G, Note.B_FLAT, Note.D, Note.F]);
    });

    test("Gm11 returns G minor eleventh", () => {
      const result = parseChord("Gm11");
      expect(result.root).toEqual(Note.G);
      expect(result.bass).toEqual(Note.G);
      expect(result.quality).toBe("minor");
      expect(result.chordTones).toEqual([Note.G, Note.B_FLAT, Note.D, Note.F, Note.A, Note.C]);
    });

    test("Bb11 returns Bb dominant eleventh", () => {
      const result = parseChord("Bb11");
      expect(result.root).toEqual(Note.B_FLAT);
      expect(result.bass).toEqual(Note.B_FLAT);
      expect(result.quality).toBe("major");
      expect(result.chordTones).toEqual([
        Note.B_FLAT,
        Note.D,
        Note.F,
        Note.A_FLAT,
        Note.C,
        Note.E_FLAT,
      ]);
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
