import { test, expect, describe } from "vitest";
import { renderChordProgression } from "./renderProgression";
import type { ChordEvent, Activation, ChordSpec } from "./schemas";

// Helpers for concise chord specs
const chord = (
  letter: "A" | "B" | "C" | "D" | "E" | "F" | "G",
  accidental: -2 | -1 | 0 | 1 | 2,
  quality: ChordSpec["quality"],
): ChordSpec => ({
  root: { letter, accidental },
  quality,
});

const ce = (spec: ChordSpec, onset_time: number): ChordEvent => ({
  chord: spec,
  onset_time,
});

const act = (onset_time: number, duration: number): Activation => ({
  onset_time,
  duration,
});

// Fm - Db - Ab - Eb progression
const FM_PROGRESSION: ChordEvent[] = [
  ce(chord("F", 0, "min"), 0),
  ce(chord("D", -1, "maj"), 4),
  ce(chord("A", -1, "maj"), 8),
  ce(chord("E", -1, "maj"), 12),
];

describe("renderChordProgression", () => {
  describe("sustained pad (4 chords, 4 activations)", () => {
    const activations = [act(0, 4), act(4, 4), act(8, 4), act(12, 4)];

    test("produces notes for each activation", () => {
      const { notes } = renderChordProgression({
        chords: FM_PROGRESSION,
        activations,
      });
      // Each chord has bass + voices (default maxVoices=4), deduplicated
      // Should have at least 4 activations * some notes each
      expect(notes.length).toBeGreaterThanOrEqual(4);
    });

    test("totalBeats is 16", () => {
      const { totalBeats } = renderChordProgression({
        chords: FM_PROGRESSION,
        activations,
      });
      expect(totalBeats).toBe(16);
    });

    test("notes have correct start_time and duration", () => {
      const { notes } = renderChordProgression({
        chords: FM_PROGRESSION,
        activations,
      });
      // Group by start_time
      const byStart = new Map<number, typeof notes>();
      for (const n of notes) {
        const group = byStart.get(n.start_time) ?? [];
        group.push(n);
        byStart.set(n.start_time, group);
      }
      // Should have notes at exactly these 4 start times
      expect([...byStart.keys()].sort((a, b) => a - b)).toEqual([
        0, 4, 8, 12,
      ]);
      // Every note in each group has duration=4
      for (const group of byStart.values()) {
        for (const n of group) {
          expect(n.duration).toBe(4);
        }
      }
    });
  });

  describe("rave stabs (4 chords, 12 short activations)", () => {
    const activations = [
      act(0, 0.25),
      act(1.5, 0.25),
      act(3, 0.25),
      act(4, 0.25),
      act(5.5, 0.25),
      act(7, 0.25),
      act(8, 0.25),
      act(9.5, 0.25),
      act(11, 0.25),
      act(12, 0.25),
      act(13.5, 0.25),
      act(15, 0.25),
    ];

    test("produces 12 groups of notes", () => {
      const { notes } = renderChordProgression({
        chords: FM_PROGRESSION,
        activations,
        velocity: 120,
        baseOctave: 5,
      });
      const startTimes = new Set(notes.map((n) => n.start_time));
      expect(startTimes.size).toBe(12);
    });

    test("activations in bar 1 use Fm voicing, bar 2 uses Db", () => {
      const { notes } = renderChordProgression({
        chords: FM_PROGRESSION,
        activations,
        baseOctave: 5,
      });

      // Notes at onset_time=0 should be Fm pitches
      const bar1Notes = notes.filter((n) => n.start_time === 0);
      const bar1PitchClasses = bar1Notes.map((n) => n.pitch % 12).sort();

      // F minor = F(5), Ab(8), C(0) — pitch classes
      // Should contain these pitch classes
      expect(bar1PitchClasses).toContain(5); // F
      expect(bar1PitchClasses).toContain(8); // Ab
      expect(bar1PitchClasses).toContain(0); // C

      // Notes at onset_time=4 should be Db major pitches
      const bar2Notes = notes.filter((n) => n.start_time === 4);
      const bar2PitchClasses = bar2Notes.map((n) => n.pitch % 12).sort();

      // Db major = Db(1), F(5), Ab(8) — pitch classes
      expect(bar2PitchClasses).toContain(1); // Db
      expect(bar2PitchClasses).toContain(5); // F
      expect(bar2PitchClasses).toContain(8); // Ab
    });

    test("velocity is applied to all notes", () => {
      const { notes } = renderChordProgression({
        chords: FM_PROGRESSION,
        activations,
        velocity: 120,
      });
      for (const n of notes) {
        expect(n.velocity).toBe(120);
      }
    });

    test("totalBeats is max of last activation end (15.25) and last chord onset (12)", () => {
      const { totalBeats } = renderChordProgression({
        chords: FM_PROGRESSION,
        activations,
      });
      expect(totalBeats).toBe(15.25);
    });
  });

  describe("single chord, many activations", () => {
    const singleChord = [ce(chord("C", 0, "maj"), 0)];
    const activations = [
      act(0, 1),
      act(1, 1),
      act(2, 1),
      act(3, 1),
    ];

    test("all activations get the same pitches", () => {
      const { notes } = renderChordProgression({
        chords: singleChord,
        activations,
      });

      const byStart = new Map<number, number[]>();
      for (const n of notes) {
        const group = byStart.get(n.start_time) ?? [];
        group.push(n.pitch);
        byStart.set(n.start_time, group);
      }

      const groups = [...byStart.values()];
      // All groups should have the same set of pitches
      const firstSorted = groups[0]!.sort((a, b) => a - b);
      for (const group of groups.slice(1)) {
        expect(group.sort((a, b) => a - b)).toEqual(firstSorted);
      }
    });
  });

  describe("activation at exact chord boundary", () => {
    test("uses the new chord", () => {
      const chords = [
        ce(chord("C", 0, "maj"), 0),
        ce(chord("A", 0, "min"), 4),
      ];
      const activations = [act(4, 1)]; // exactly at chord 2

      const { notes } = renderChordProgression({ chords, activations });
      const pitchClasses = notes.map((n) => n.pitch % 12).sort();

      // A minor = A(9), C(0), E(4)
      expect(pitchClasses).toContain(9); // A
      expect(pitchClasses).toContain(0); // C
      expect(pitchClasses).toContain(4); // E
    });
  });

  describe("voice leading consistency", () => {
    test("voices move minimally between chord changes", () => {
      const { notes } = renderChordProgression({
        chords: FM_PROGRESSION,
        activations: [act(0, 4), act(4, 4), act(8, 4), act(12, 4)],
        baseOctave: 4,
      });

      // Group by start_time and get average pitch
      const byStart = new Map<number, number[]>();
      for (const n of notes) {
        const group = byStart.get(n.start_time) ?? [];
        group.push(n.pitch);
        byStart.set(n.start_time, group);
      }

      const averages = [...byStart.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, pitches]) => pitches.reduce((a, b) => a + b, 0) / pitches.length);

      // Average pitch shouldn't jump wildly between chords (voice leading)
      for (let i = 1; i < averages.length; i++) {
        const jump = Math.abs(averages[i]! - averages[i - 1]!);
        // Voice-led chords should typically stay within an octave
        expect(jump).toBeLessThan(12);
      }
    });
  });

  describe("error cases", () => {
    test("empty chords throws", () => {
      expect(() =>
        renderChordProgression({
          chords: [],
          activations: [act(0, 1)],
        }),
      ).toThrow("chords array must not be empty");
    });

    test("empty activations throws", () => {
      expect(() =>
        renderChordProgression({
          chords: [ce(chord("C", 0, "maj"), 0)],
          activations: [],
        }),
      ).toThrow("activations array must not be empty");
    });

    test("activation before first chord throws", () => {
      expect(() =>
        renderChordProgression({
          chords: [ce(chord("C", 0, "maj"), 2)],
          activations: [act(1, 1)],
        }),
      ).toThrow("no chord is active");
    });

    test("duplicate chord onset_time throws", () => {
      expect(() =>
        renderChordProgression({
          chords: [
            ce(chord("C", 0, "maj"), 0),
            ce(chord("D", 0, "min"), 0),
          ],
          activations: [act(0, 1)],
        }),
      ).toThrow("Duplicate chord onset_time");
    });
  });

  describe("defaults", () => {
    test("default velocity is 100", () => {
      const { notes } = renderChordProgression({
        chords: [ce(chord("C", 0, "maj"), 0)],
        activations: [act(0, 1)],
      });
      for (const n of notes) {
        expect(n.velocity).toBe(100);
      }
    });

    test("baseOctave changes pitch range", () => {
      const low = renderChordProgression({
        chords: [ce(chord("C", 0, "maj"), 0)],
        activations: [act(0, 1)],
        baseOctave: 3,
      });
      const high = renderChordProgression({
        chords: [ce(chord("C", 0, "maj"), 0)],
        activations: [act(0, 1)],
        baseOctave: 5,
      });

      const avgLow =
        low.notes.reduce((a, n) => a + n.pitch, 0) / low.notes.length;
      const avgHigh =
        high.notes.reduce((a, n) => a + n.pitch, 0) / high.notes.length;

      // Higher octave should produce higher average pitch
      expect(avgHigh).toBeGreaterThan(avgLow);
    });
  });
});
