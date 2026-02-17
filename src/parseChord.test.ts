import { test, expect, describe } from "vitest";
import { parseChord, formatChord } from "./parseChord";
import { Note, ChordParseError } from "./noteName";
import type { Accidental } from "./noteName";

// Helper to create interval maps concisely
const I = (entries: [number, Accidental][]): Map<number, Accidental> => new Map(entries);

// Tertian stacking order: root, 3rd, 5th, (7th), (9th), (11th), (13th)
// Spellings are preserved for round-trippability (E# !== F, Cb !== B)

describe("parseChord", () => {
  describe("major triads", () => {
    test("Cmaj returns C major triad", () => {
      const result = parseChord("Cmaj");
      expect(result.input).toBe("Cmaj");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.triadQuality).toBe("major");
      expect(result.chordType).toBe("maj");
      expect(result.intervals).toEqual(I([[1, 0], [3, 0], [5, 0]]));
      expect(result.tones).toEqual([Note.C, Note.E, Note.G]);
    });

    test("C returns C major triad (implicit major)", () => {
      const result = parseChord("C");
      expect(result.input).toBe("C");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.triadQuality).toBe("major");
      expect(result.chordType).toBe("maj");
      expect(result.intervals).toEqual(I([[1, 0], [3, 0], [5, 0]]));
      expect(result.tones).toEqual([Note.C, Note.E, Note.G]);
    });

    test("Dmaj returns D major triad", () => {
      const result = parseChord("Dmaj");
      expect(result.root).toEqual(Note.D);
      expect(result.triadQuality).toBe("major");
      expect(result.chordType).toBe("maj");
      expect(result.tones).toEqual([Note.D, Note.F_SHARP, Note.A]);
    });

    test("F#maj returns F# major triad", () => {
      const result = parseChord("F#maj");
      expect(result.root).toEqual(Note.F_SHARP);
      expect(result.triadQuality).toBe("major");
      expect(result.tones).toEqual([Note.F_SHARP, Note.A_SHARP, Note.C_SHARP]);
    });

    test("Bbmaj returns Bb major triad", () => {
      const result = parseChord("Bbmaj");
      expect(result.root).toEqual(Note.B_FLAT);
      expect(result.triadQuality).toBe("major");
      expect(result.tones).toEqual([Note.B_FLAT, Note.D, Note.F]);
    });

    test("Dbmaj returns Db major triad", () => {
      const result = parseChord("Dbmaj");
      expect(result.root).toEqual(Note.D_FLAT);
      expect(result.triadQuality).toBe("major");
      expect(result.tones).toEqual([Note.D_FLAT, Note.F, Note.A_FLAT]);
    });
  });

  describe("minor triads", () => {
    test("Cm returns C minor triad", () => {
      const result = parseChord("Cm");
      expect(result.input).toBe("Cm");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.triadQuality).toBe("minor");
      expect(result.chordType).toBe("min");
      expect(result.intervals).toEqual(I([[1, 0], [3, -1], [5, 0]]));
      expect(result.tones).toEqual([Note.C, Note.E_FLAT, Note.G]);
    });

    test("Cmin returns C minor triad", () => {
      const result = parseChord("Cmin");
      expect(result.triadQuality).toBe("minor");
      expect(result.chordType).toBe("min");
      expect(result.tones).toEqual([Note.C, Note.E_FLAT, Note.G]);
    });

    test("C#m returns C# minor triad", () => {
      const result = parseChord("C#m");
      expect(result.root).toEqual(Note.C_SHARP);
      expect(result.triadQuality).toBe("minor");
      expect(result.tones).toEqual([Note.C_SHARP, Note.E, Note.G_SHARP]);
    });

    test("Am returns A minor triad", () => {
      const result = parseChord("Am");
      expect(result.root).toEqual(Note.A);
      expect(result.triadQuality).toBe("minor");
      expect(result.tones).toEqual([Note.A, Note.C, Note.E]);
    });
  });

  describe("diminished triads", () => {
    test("Cdim returns C diminished triad", () => {
      const result = parseChord("Cdim");
      expect(result.root).toEqual(Note.C);
      expect(result.triadQuality).toBe("diminished");
      expect(result.chordType).toBe("dim");
      expect(result.intervals).toEqual(I([[1, 0], [3, -1], [5, -1]]));
      expect(result.tones).toEqual([Note.C, Note.E_FLAT, Note.G_FLAT]);
    });

    test("Dbdim returns Db diminished triad with correct spellings", () => {
      const result = parseChord("Dbdim");
      expect(result.root).toEqual(Note.D_FLAT);
      expect(result.triadQuality).toBe("diminished");
      // Db dim = Db, Fb, Abb (correct theory spelling)
      expect(result.tones).toEqual([
        Note.D_FLAT,
        Note.F_FLAT,
        Note.A_DOUBLE_FLAT,
      ]);
    });

    test("Bdim returns B diminished triad", () => {
      const result = parseChord("Bdim");
      expect(result.root).toEqual(Note.B);
      expect(result.triadQuality).toBe("diminished");
      expect(result.tones).toEqual([Note.B, Note.D, Note.F]);
    });

    test("F#dim returns F# diminished triad", () => {
      const result = parseChord("F#dim");
      expect(result.root).toEqual(Note.F_SHARP);
      expect(result.triadQuality).toBe("diminished");
      expect(result.tones).toEqual([Note.F_SHARP, Note.A, Note.C]);
    });
  });

  describe("augmented triads", () => {
    test("Caug returns C augmented triad", () => {
      const result = parseChord("Caug");
      expect(result.root).toEqual(Note.C);
      expect(result.triadQuality).toBe("augmented");
      expect(result.chordType).toBe("aug");
      expect(result.intervals).toEqual(I([[1, 0], [3, 0], [5, 1]]));
      expect(result.tones).toEqual([Note.C, Note.E, Note.G_SHARP]);
    });

    test("C+ returns C augmented triad", () => {
      const result = parseChord("C+");
      expect(result.triadQuality).toBe("augmented");
      expect(result.chordType).toBe("aug");
      expect(result.tones).toEqual([Note.C, Note.E, Note.G_SHARP]);
    });

    test("Ebaug returns Eb augmented triad", () => {
      const result = parseChord("Ebaug");
      expect(result.root).toEqual(Note.E_FLAT);
      expect(result.triadQuality).toBe("augmented");
      expect(result.tones).toEqual([Note.E_FLAT, Note.G, Note.B]);
    });

    test("Faug returns F augmented triad", () => {
      const result = parseChord("Faug");
      expect(result.root).toEqual(Note.F);
      expect(result.triadQuality).toBe("augmented");
      expect(result.tones).toEqual([Note.F, Note.A, Note.C_SHARP]);
    });
  });

  describe("power chords", () => {
    test("C5 returns C power chord", () => {
      const result = parseChord("C5");
      expect(result.input).toBe("C5");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.C);
      expect(result.triadQuality).toBe("power");
      expect(result.chordType).toBe("5");
      expect(result.intervals).toEqual(I([[1, 0], [5, 0]]));
      expect(result.tones).toEqual([Note.C, Note.G]);
    });

    test("F#5 returns F# power chord", () => {
      const result = parseChord("F#5");
      expect(result.root).toEqual(Note.F_SHARP);
      expect(result.triadQuality).toBe("power");
      expect(result.tones).toEqual([Note.F_SHARP, Note.C_SHARP]);
    });
  });

  describe("slash chords (alternate bass)", () => {
    test("C/E returns C major with E bass", () => {
      const result = parseChord("C/E");
      expect(result.input).toBe("C/E");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.E);
      expect(result.triadQuality).toBe("major");
      expect(result.tones).toEqual([Note.C, Note.E, Note.G]);
    });

    test("C/G returns C major with G bass", () => {
      const result = parseChord("C/G");
      expect(result.root).toEqual(Note.C);
      expect(result.bass).toEqual(Note.G);
      expect(result.tones).toEqual([Note.C, Note.E, Note.G]);
    });

    test("Dm/A returns D minor with A bass", () => {
      const result = parseChord("Dm/A");
      expect(result.root).toEqual(Note.D);
      expect(result.bass).toEqual(Note.A);
      expect(result.triadQuality).toBe("minor");
      expect(result.tones).toEqual([Note.D, Note.F, Note.A]);
    });

    test("Dbdim/G returns Db diminished with G bass", () => {
      const result = parseChord("Dbdim/G");
      expect(result.root).toEqual(Note.D_FLAT);
      expect(result.bass).toEqual(Note.G);
      expect(result.triadQuality).toBe("diminished");
      expect(result.tones).toEqual([Note.D_FLAT, Note.F_FLAT, Note.A_DOUBLE_FLAT]);
    });

    test("F#m/C# returns F# minor with C# bass", () => {
      const result = parseChord("F#m/C#");
      expect(result.root).toEqual(Note.F_SHARP);
      expect(result.bass).toEqual(Note.C_SHARP);
      expect(result.triadQuality).toBe("minor");
      expect(result.tones).toEqual([Note.F_SHARP, Note.A, Note.C_SHARP]);
    });
  });

  describe("seventh chords", () => {
    test("Cmaj7 returns C major seventh", () => {
      const result = parseChord("Cmaj7");
      expect(result.input).toBe("Cmaj7");
      expect(result.root).toEqual(Note.C);
      expect(result.triadQuality).toBe("major");
      expect(result.chordType).toBe("maj7");
      expect(result.intervals).toEqual(I([[1, 0], [3, 0], [5, 0], [7, 0]]));
      expect(result.tones).toEqual([Note.C, Note.E, Note.G, Note.B]);
    });

    test("CM7 returns C major seventh", () => {
      const result = parseChord("CM7");
      expect(result.chordType).toBe("maj7");
      expect(result.tones).toEqual([Note.C, Note.E, Note.G, Note.B]);
    });

    test("Dm7 returns D minor seventh", () => {
      const result = parseChord("Dm7");
      expect(result.root).toEqual(Note.D);
      expect(result.triadQuality).toBe("minor");
      expect(result.chordType).toBe("min7");
      expect(result.intervals).toEqual(I([[1, 0], [3, -1], [5, 0], [7, -1]]));
      expect(result.tones).toEqual([Note.D, Note.F, Note.A, Note.C]);
    });

    test("Dmin7 returns D minor seventh", () => {
      const result = parseChord("Dmin7");
      expect(result.chordType).toBe("min7");
      expect(result.tones).toEqual([Note.D, Note.F, Note.A, Note.C]);
    });

    test("G7 returns G dominant seventh", () => {
      const result = parseChord("G7");
      expect(result.root).toEqual(Note.G);
      expect(result.triadQuality).toBe("major");
      expect(result.chordType).toBe("7");
      expect(result.intervals).toEqual(I([[1, 0], [3, 0], [5, 0], [7, -1]]));
      expect(result.tones).toEqual([Note.G, Note.B, Note.D, Note.F]);
    });

    test("Bb7 returns Bb dominant seventh", () => {
      const result = parseChord("Bb7");
      expect(result.root).toEqual(Note.B_FLAT);
      expect(result.chordType).toBe("7");
      expect(result.tones).toEqual([Note.B_FLAT, Note.D, Note.F, Note.A_FLAT]);
    });

    test("Cdim7 returns C diminished seventh", () => {
      const result = parseChord("Cdim7");
      expect(result.root).toEqual(Note.C);
      expect(result.triadQuality).toBe("diminished");
      expect(result.chordType).toBe("dim7");
      expect(result.intervals).toEqual(I([[1, 0], [3, -1], [5, -1], [7, -2]]));
      expect(result.tones).toEqual([
        Note.C,
        Note.E_FLAT,
        Note.G_FLAT,
        Note.B_DOUBLE_FLAT,
      ]);
    });

    test("Cm7b5 returns C half-diminished seventh", () => {
      const result = parseChord("Cm7b5");
      expect(result.root).toEqual(Note.C);
      expect(result.triadQuality).toBe("diminished");
      expect(result.chordType).toBe("m7b5");
      expect(result.intervals).toEqual(I([[1, 0], [3, -1], [5, -1], [7, -1]]));
      expect(result.tones).toEqual([Note.C, Note.E_FLAT, Note.G_FLAT, Note.B_FLAT]);
    });

    test("F#maj7 returns F# major seventh with E# spelling", () => {
      const result = parseChord("F#maj7");
      expect(result.root).toEqual(Note.F_SHARP);
      expect(result.chordType).toBe("maj7");
      expect(result.tones).toEqual([
        Note.F_SHARP,
        Note.A_SHARP,
        Note.C_SHARP,
        Note.E_SHARP,
      ]);
    });

    test("Abm7 returns Ab minor seventh with Cb spelling", () => {
      const result = parseChord("Abm7");
      expect(result.root).toEqual(Note.A_FLAT);
      expect(result.chordType).toBe("min7");
      expect(result.tones).toEqual([
        Note.A_FLAT,
        Note.C_FLAT,
        Note.E_FLAT,
        Note.G_FLAT,
      ]);
    });
  });

  describe("ninth chords", () => {
    test("C9 returns C dominant ninth", () => {
      const result = parseChord("C9");
      expect(result.root).toEqual(Note.C);
      expect(result.triadQuality).toBe("major");
      expect(result.chordType).toBe("9");
      expect(result.intervals).toEqual(I([[1, 0], [3, 0], [5, 0], [7, -1], [9, 0]]));
      expect(result.tones).toEqual([Note.C, Note.E, Note.G, Note.B_FLAT, Note.D]);
    });

    test("Cmaj9 returns C major ninth", () => {
      const result = parseChord("Cmaj9");
      expect(result.chordType).toBe("maj9");
      expect(result.intervals).toEqual(I([[1, 0], [3, 0], [5, 0], [7, 0], [9, 0]]));
      expect(result.tones).toEqual([Note.C, Note.E, Note.G, Note.B, Note.D]);
    });

    test("Cm9 returns C minor ninth", () => {
      const result = parseChord("Cm9");
      expect(result.triadQuality).toBe("minor");
      expect(result.chordType).toBe("min9");
      expect(result.tones).toEqual([Note.C, Note.E_FLAT, Note.G, Note.B_FLAT, Note.D]);
    });

    test("Dm9 returns D minor ninth", () => {
      const result = parseChord("Dm9");
      expect(result.root).toEqual(Note.D);
      expect(result.chordType).toBe("min9");
      expect(result.tones).toEqual([Note.D, Note.F, Note.A, Note.C, Note.E]);
    });

    test("F#9 returns F# dominant ninth", () => {
      const result = parseChord("F#9");
      expect(result.root).toEqual(Note.F_SHARP);
      expect(result.chordType).toBe("9");
      expect(result.tones).toEqual([
        Note.F_SHARP,
        Note.A_SHARP,
        Note.C_SHARP,
        Note.E,
        Note.G_SHARP,
      ]);
    });
  });

  describe("eleventh chords", () => {
    test("C11 returns C dominant eleventh", () => {
      const result = parseChord("C11");
      expect(result.root).toEqual(Note.C);
      expect(result.triadQuality).toBe("major");
      expect(result.chordType).toBe("11");
      expect(result.intervals).toEqual(I([[1, 0], [3, 0], [5, 0], [7, -1], [9, 0], [11, 0]]));
      expect(result.tones).toEqual([Note.C, Note.E, Note.G, Note.B_FLAT, Note.D, Note.F]);
    });

    test("Cmaj11 returns C major eleventh", () => {
      const result = parseChord("Cmaj11");
      expect(result.chordType).toBe("maj11");
      expect(result.tones).toEqual([Note.C, Note.E, Note.G, Note.B, Note.D, Note.F]);
    });

    test("Cm11 returns C minor eleventh", () => {
      const result = parseChord("Cm11");
      expect(result.triadQuality).toBe("minor");
      expect(result.chordType).toBe("min11");
      expect(result.tones).toEqual([Note.C, Note.E_FLAT, Note.G, Note.B_FLAT, Note.D, Note.F]);
    });

    test("Gm11 returns G minor eleventh", () => {
      const result = parseChord("Gm11");
      expect(result.root).toEqual(Note.G);
      expect(result.chordType).toBe("min11");
      expect(result.tones).toEqual([Note.G, Note.B_FLAT, Note.D, Note.F, Note.A, Note.C]);
    });

    test("Bb11 returns Bb dominant eleventh", () => {
      const result = parseChord("Bb11");
      expect(result.root).toEqual(Note.B_FLAT);
      expect(result.chordType).toBe("11");
      expect(result.tones).toEqual([
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
    test("throws ChordParseError on invalid chord", () => {
      expect(() => parseChord("XYZ")).toThrow(ChordParseError);
    });

    test("throws ChordParseError on empty string", () => {
      expect(() => parseChord("")).toThrow(ChordParseError);
    });

    test("throws ChordParseError on invalid root note", () => {
      expect(() => parseChord("Hmaj")).toThrow(ChordParseError);
    });

    test("error includes code and message", () => {
      try {
        parseChord("XYZ");
      } catch (e) {
        expect(e).toBeInstanceOf(ChordParseError);
        expect((e as ChordParseError).code).toBeDefined();
        expect((e as ChordParseError).message).toBeDefined();
      }
    });
  });
});

describe("formatChord", () => {
  describe("formats ParsedChord back to string", () => {
    test("formats C major triad", () => {
      const parsed = parseChord("C");
      expect(formatChord(parsed)).toBe("C");
    });

    test("formats C minor triad", () => {
      const parsed = parseChord("Cm");
      expect(formatChord(parsed)).toBe("Cm");
    });

    test("formats sharp root", () => {
      const parsed = parseChord("F#m");
      expect(formatChord(parsed)).toBe("F#m");
    });

    test("formats flat root", () => {
      const parsed = parseChord("Bbmaj7");
      expect(formatChord(parsed)).toBe("Bbmaj7");
    });

    test("formats slash chord", () => {
      const parsed = parseChord("C/E");
      expect(formatChord(parsed)).toBe("C/E");
    });

    test("formats power chord", () => {
      const parsed = parseChord("G5");
      expect(formatChord(parsed)).toBe("G5");
    });
  });
});

describe("round-trip: parse → format → parse", () => {
  const testCases = [
    // Triads
    "C", "Cm", "Cdim", "Caug",
    "F#", "F#m", "F#dim", "F#aug",
    "Bb", "Bbm", "Bbdim", "Bbaug",
    "Db", "Dbm", "Dbdim",
    // Power chords
    "C5", "F#5", "Bb5",
    // Seventh chords
    "Cmaj7", "Cm7", "C7", "Cdim7", "Cm7b5",
    "F#maj7", "F#m7", "F#7",
    "Bbmaj7", "Bbm7", "Bb7",
    // Extended chords
    "C9", "Cmaj9", "Cm9",
    "C11", "Cmaj11", "Cm11",
    // Slash chords
    "C/E", "C/G", "Dm/A", "F#m/C#",
    "Cmaj7/E", "Dm7/A",
  ];

  for (const symbol of testCases) {
    test(`round-trips "${symbol}"`, () => {
      const parsed = parseChord(symbol);
      const formatted = formatChord(parsed);
      const reparsed = parseChord(formatted);

      // Structural equality (same chord)
      expect(reparsed.root).toEqual(parsed.root);
      expect(reparsed.bass).toEqual(parsed.bass);
      expect(reparsed.triadQuality).toBe(parsed.triadQuality);
      expect(reparsed.chordType).toBe(parsed.chordType);
      expect(reparsed.tones).toEqual(parsed.tones);
      expect(reparsed.intervals).toEqual(parsed.intervals);
    });
  }
});

describe("round-trip: normalizes equivalent spellings", () => {
  test("C and Cmaj normalize to same output", () => {
    const c = parseChord("C");
    const cmaj = parseChord("Cmaj");
    expect(formatChord(c)).toBe(formatChord(cmaj));
  });

  test("Cm and Cmin normalize to same output", () => {
    const cm = parseChord("Cm");
    const cmin = parseChord("Cmin");
    expect(formatChord(cm)).toBe(formatChord(cmin));
  });

  test("CM7 and Cmaj7 normalize to same output", () => {
    const cm7 = parseChord("CM7");
    const cmaj7 = parseChord("Cmaj7");
    expect(formatChord(cm7)).toBe(formatChord(cmaj7));
  });

  test("Dm7 and Dmin7 normalize to same output", () => {
    const dm7 = parseChord("Dm7");
    const dmin7 = parseChord("Dmin7");
    expect(formatChord(dm7)).toBe(formatChord(dmin7));
  });

  test("C+ and Caug normalize to same output", () => {
    const cplus = parseChord("C+");
    const caug = parseChord("Caug");
    expect(formatChord(cplus)).toBe(formatChord(caug));
  });
});

describe("round-trip: preserves note spellings in tones", () => {
  test("F#maj7 preserves E# spelling after round-trip", () => {
    const parsed = parseChord("F#maj7");
    const formatted = formatChord(parsed);
    const reparsed = parseChord(formatted);

    // The 7th should still be E#, not F
    expect(reparsed.tones[3]).toEqual(Note.E_SHARP);
  });

  test("Abm7 preserves Cb spelling after round-trip", () => {
    const parsed = parseChord("Abm7");
    const formatted = formatChord(parsed);
    const reparsed = parseChord(formatted);

    // The 3rd should still be Cb, not B
    expect(reparsed.tones[1]).toEqual(Note.C_FLAT);
  });

  test("Dbdim preserves Fb and Abb spellings after round-trip", () => {
    const parsed = parseChord("Dbdim");
    const formatted = formatChord(parsed);
    const reparsed = parseChord(formatted);

    expect(reparsed.tones[1]).toEqual(Note.F_FLAT);
    expect(reparsed.tones[2]).toEqual(Note.A_DOUBLE_FLAT);
  });

  test("Cdim7 preserves Bbb spelling after round-trip", () => {
    const parsed = parseChord("Cdim7");
    const formatted = formatChord(parsed);
    const reparsed = parseChord(formatted);

    // The 7th should still be Bbb
    expect(reparsed.tones[3]).toEqual(Note.B_DOUBLE_FLAT);
  });
});
