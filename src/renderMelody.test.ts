import { test, expect, describe } from "vitest";
import { renderMelodicLine } from "./renderMelody";
import { N } from "./noteName";

describe("renderMelodicLine", () => {
  test("converts note strings to MIDI pitches", () => {
    const result = renderMelodicLine({
      notes: [
        { note: "C4", start_time: 0, duration: 1 },
        { note: "E4", start_time: 1, duration: 1 },
        { note: "G4", start_time: 2, duration: 1 },
      ],
    });

    expect(result.notes).toEqual([
      { pitch: 60, start_time: 0, duration: 1, velocity: 100 },
      { pitch: 64, start_time: 1, duration: 1, velocity: 100 },
      { pitch: 67, start_time: 2, duration: 1, velocity: 100 },
    ]);
    expect(result.totalBeats).toBe(3);
    expect(result.warnings).toEqual([]);
  });

  test("respects custom velocity", () => {
    const result = renderMelodicLine({
      notes: [{ note: "F#3", start_time: 0, duration: 0.5, velocity: 110 }],
    });
    expect(result.notes[0]!.velocity).toBe(110);
    expect(result.notes[0]!.pitch).toBe(54); // F#3
  });

  test("produces warnings for out-of-scale notes", () => {
    const result = renderMelodicLine({
      notes: [
        { note: "C4", start_time: 0, duration: 1 },
        { note: "F#4", start_time: 1, duration: 1 }, // not in C major
        { note: "G4", start_time: 2, duration: 1 },
      ],
      scale: { root: N("C", 0), type: "major" },
    });

    expect(result.notes).toHaveLength(3);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("not in C major");
  });

  test("no warnings for in-key notes", () => {
    const result = renderMelodicLine({
      notes: [
        { note: "F2", start_time: 0, duration: 1 },
        { note: "Ab2", start_time: 1, duration: 1 },
        { note: "C3", start_time: 2, duration: 1 },
      ],
      scale: { root: N("F", 0), type: "minor" },
    });

    expect(result.warnings).toEqual([]);
  });

  test("throws on empty notes", () => {
    expect(() => renderMelodicLine({ notes: [] })).toThrow(
      "notes array must not be empty",
    );
  });

  test("throws on invalid note string", () => {
    expect(() =>
      renderMelodicLine({
        notes: [{ note: "X4", start_time: 0, duration: 1 }],
      }),
    ).toThrow("Invalid note string");
  });

  test("totalBeats is end of last note", () => {
    const result = renderMelodicLine({
      notes: [
        { note: "C4", start_time: 0, duration: 1 },
        { note: "D4", start_time: 3, duration: 2 }, // ends at beat 5
      ],
    });
    expect(result.totalBeats).toBe(5);
  });

  test("handles bass range correctly", () => {
    const result = renderMelodicLine({
      notes: [{ note: "C1", start_time: 0, duration: 1 }],
    });
    expect(result.notes[0]!.pitch).toBe(24); // C1 = MIDI 24
  });

  test("handles flats correctly", () => {
    const result = renderMelodicLine({
      notes: [{ note: "Bb2", start_time: 0, duration: 1 }],
    });
    expect(result.notes[0]!.pitch).toBe(46); // Bb2 = MIDI 46
  });
});
