import { test, expect, describe } from "vitest";
import { parseNoteString } from "./parseNote";

describe("parseNoteString", () => {
  test("parses natural notes", () => {
    expect(parseNoteString("C4")).toEqual({
      note: { letter: "C", accidental: 0 },
      octave: 4,
    });
    expect(parseNoteString("A0")).toEqual({
      note: { letter: "A", accidental: 0 },
      octave: 0,
    });
    expect(parseNoteString("G8")).toEqual({
      note: { letter: "G", accidental: 0 },
      octave: 8,
    });
  });

  test("parses sharps", () => {
    expect(parseNoteString("F#3")).toEqual({
      note: { letter: "F", accidental: 1 },
      octave: 3,
    });
    expect(parseNoteString("C#5")).toEqual({
      note: { letter: "C", accidental: 1 },
      octave: 5,
    });
  });

  test("parses flats", () => {
    expect(parseNoteString("Bb2")).toEqual({
      note: { letter: "B", accidental: -1 },
      octave: 2,
    });
    expect(parseNoteString("Eb4")).toEqual({
      note: { letter: "E", accidental: -1 },
      octave: 4,
    });
  });

  test("trims whitespace", () => {
    expect(parseNoteString("  C4  ")).toEqual({
      note: { letter: "C", accidental: 0 },
      octave: 4,
    });
  });

  test("throws on invalid input", () => {
    expect(() => parseNoteString("")).toThrow("Invalid note string");
    expect(() => parseNoteString("X4")).toThrow("Invalid note string");
    expect(() => parseNoteString("C")).toThrow("Invalid note string");
    expect(() => parseNoteString("C9")).toThrow("Invalid note string");
    expect(() => parseNoteString("C##4")).toThrow("Invalid note string");
    expect(() => parseNoteString("Cbb4")).toThrow("Invalid note string");
    expect(() => parseNoteString("c4")).toThrow("Invalid note string");
  });
});
