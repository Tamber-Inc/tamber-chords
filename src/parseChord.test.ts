import { test, expect, describe } from "bun:test";
import { parseChord } from "./parseChord";

// Pitch classes: C=0, C#/Db=1, D=2, D#/Eb=3, E=4, F=5, F#/Gb=6, G=7, G#/Ab=8, A=9, A#/Bb=10, B=11

describe("parseChord", () => {
  describe("major triads", () => {
    test("Cmaj returns C major triad", () => {
      const result = parseChord("Cmaj");
      expect(result.bassNote).toBe(0); // C
      expect(result.pitchClasses).toEqual([0, 4, 7]); // C E G
    });

    test("C returns C major triad (implicit major)", () => {
      const result = parseChord("C");
      expect(result.bassNote).toBe(0);
      expect(result.pitchClasses).toEqual([0, 4, 7]);
    });

    test("Dmaj returns D major triad", () => {
      const result = parseChord("Dmaj");
      expect(result.bassNote).toBe(2); // D
      expect(result.pitchClasses).toEqual([2, 6, 9]); // D F# A
    });

    test("F#maj returns F# major triad", () => {
      const result = parseChord("F#maj");
      expect(result.bassNote).toBe(6); // F#
      expect(result.pitchClasses).toEqual([6, 10, 1]); // F# A# C#
    });

    test("Bbmaj returns Bb major triad", () => {
      const result = parseChord("Bbmaj");
      expect(result.bassNote).toBe(10); // Bb
      expect(result.pitchClasses).toEqual([10, 2, 5]); // Bb D F
    });

    test("Dbmaj returns Db major triad", () => {
      const result = parseChord("Dbmaj");
      expect(result.bassNote).toBe(1); // Db
      expect(result.pitchClasses).toEqual([1, 5, 8]); // Db F Ab
    });
  });

  describe("minor triads", () => {
    test("Cm returns C minor triad", () => {
      const result = parseChord("Cm");
      expect(result.bassNote).toBe(0);
      expect(result.pitchClasses).toEqual([0, 3, 7]); // C Eb G
    });

    test("Cmin returns C minor triad", () => {
      const result = parseChord("Cmin");
      expect(result.bassNote).toBe(0);
      expect(result.pitchClasses).toEqual([0, 3, 7]);
    });

    test("C#m returns C# minor triad", () => {
      const result = parseChord("C#m");
      expect(result.bassNote).toBe(1);
      expect(result.pitchClasses).toEqual([1, 4, 8]); // C# E G#
    });

    test("Am returns A minor triad", () => {
      const result = parseChord("Am");
      expect(result.bassNote).toBe(9);
      expect(result.pitchClasses).toEqual([9, 0, 4]); // A C E
    });
  });

  describe("diminished triads", () => {
    test("Cdim returns C diminished triad", () => {
      const result = parseChord("Cdim");
      expect(result.bassNote).toBe(0);
      expect(result.pitchClasses).toEqual([0, 3, 6]); // C Eb Gb
    });

    test("Dbdim returns Db diminished triad", () => {
      const result = parseChord("Dbdim");
      expect(result.bassNote).toBe(1);
      expect(result.pitchClasses).toEqual([1, 4, 7]); // Db Fb(E) Abb(G)
    });

    test("Bdim returns B diminished triad", () => {
      const result = parseChord("Bdim");
      expect(result.bassNote).toBe(11);
      expect(result.pitchClasses).toEqual([11, 2, 5]); // B D F
    });
  });

  describe("augmented triads", () => {
    test("Caug returns C augmented triad", () => {
      const result = parseChord("Caug");
      expect(result.bassNote).toBe(0);
      expect(result.pitchClasses).toEqual([0, 4, 8]); // C E G#
    });

    test("C+ returns C augmented triad", () => {
      const result = parseChord("C+");
      expect(result.bassNote).toBe(0);
      expect(result.pitchClasses).toEqual([0, 4, 8]);
    });

    test("Ebaug returns Eb augmented triad", () => {
      const result = parseChord("Ebaug");
      expect(result.bassNote).toBe(3);
      expect(result.pitchClasses).toEqual([3, 7, 11]); // Eb G B
    });
  });

  describe("slash chords (inversions/alternate bass)", () => {
    test("C/E returns C major with E bass", () => {
      const result = parseChord("C/E");
      expect(result.bassNote).toBe(4); // E
      expect(result.pitchClasses).toEqual([0, 4, 7]); // C E G
    });

    test("C/G returns C major with G bass", () => {
      const result = parseChord("C/G");
      expect(result.bassNote).toBe(7); // G
      expect(result.pitchClasses).toEqual([0, 4, 7]);
    });

    test("Dm/A returns D minor with A bass", () => {
      const result = parseChord("Dm/A");
      expect(result.bassNote).toBe(9); // A
      expect(result.pitchClasses).toEqual([2, 5, 9]); // D F A
    });

    test("Dbdim/G returns Db diminished with G bass", () => {
      const result = parseChord("Dbdim/G");
      expect(result.bassNote).toBe(7); // G
      expect(result.pitchClasses).toEqual([1, 4, 7]); // Db Fb(E) Abb(G)
    });

    test("F#m/C# returns F# minor with C# bass", () => {
      const result = parseChord("F#m/C#");
      expect(result.bassNote).toBe(1); // C#
      expect(result.pitchClasses).toEqual([6, 9, 1]); // F# A C#
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
