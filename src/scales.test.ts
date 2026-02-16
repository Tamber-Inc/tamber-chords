import { test, expect, describe } from "bun:test";
import { getScalePitchClasses, isNoteInScale } from "./scales";
import { N } from "./noteName";

describe("getScalePitchClasses", () => {
  test("C major = {0,2,4,5,7,9,11}", () => {
    const pcs = getScalePitchClasses(N("C", 0), "major");
    expect(pcs).toEqual(new Set([0, 2, 4, 5, 7, 9, 11]));
  });

  test("F minor = {5,7,8,10,0,1,3}", () => {
    // F=5, G=7, Ab=8, Bb=10, C=0, Db=1, Eb=3
    const pcs = getScalePitchClasses(N("F", 0), "minor");
    expect(pcs).toEqual(new Set([5, 7, 8, 10, 0, 1, 3]));
  });

  test("D dorian = {2,4,5,7,9,11,0}", () => {
    // D=2, E=4, F=5, G=7, A=9, B=11, C=0
    const pcs = getScalePitchClasses(N("D", 0), "dorian");
    expect(pcs).toEqual(new Set([2, 4, 5, 7, 9, 11, 0]));
  });

  test("throws on unknown scale type", () => {
    expect(() => getScalePitchClasses(N("C", 0), "pentatonic")).toThrow(
      "Unknown scale type",
    );
  });
});

describe("isNoteInScale", () => {
  test("C is in C major", () => {
    expect(isNoteInScale(N("C", 0), N("C", 0), "major")).toBe(true);
  });

  test("F# is not in C major", () => {
    expect(isNoteInScale(N("F", 1), N("C", 0), "major")).toBe(false);
  });

  test("Ab is in F minor", () => {
    expect(isNoteInScale(N("A", -1), N("F", 0), "minor")).toBe(true);
  });

  test("A natural is not in F minor", () => {
    expect(isNoteInScale(N("A", 0), N("F", 0), "minor")).toBe(false);
  });

  test("Bb is in Bb mixolydian", () => {
    expect(isNoteInScale(N("B", -1), N("B", -1), "mixolydian")).toBe(true);
  });
});
