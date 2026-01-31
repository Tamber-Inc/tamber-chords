import { test, expect, describe } from "bun:test";
import {
  renderChordSequence,
  noteToMidi,
  midiToSpelling,
  voiceLead,
} from "./renderMidi";
import { Note } from "./noteName";
import type { ChordSpec } from "./buildChord";
import type { MidiChord, MidiSpelling, SpellingStrategy } from "./renderMidi";

// ============================================================================
// noteToMidi - pitch conversion (NoteName + octave → MIDI number)
// ============================================================================

describe("noteToMidi", () => {
  describe("middle octave (4)", () => {
    test("C4 = 60", () => {
      expect(noteToMidi(Note.C, 4)).toBe(60);
    });

    test("D4 = 62", () => {
      expect(noteToMidi(Note.D, 4)).toBe(62);
    });

    test("E4 = 64", () => {
      expect(noteToMidi(Note.E, 4)).toBe(64);
    });

    test("F4 = 65", () => {
      expect(noteToMidi(Note.F, 4)).toBe(65);
    });

    test("G4 = 67", () => {
      expect(noteToMidi(Note.G, 4)).toBe(67);
    });

    test("A4 = 69", () => {
      expect(noteToMidi(Note.A, 4)).toBe(69);
    });

    test("B4 = 71", () => {
      expect(noteToMidi(Note.B, 4)).toBe(71);
    });
  });

  describe("accidentals", () => {
    test("C#4 = 61", () => {
      expect(noteToMidi(Note.C_SHARP, 4)).toBe(61);
    });

    test("Db4 = 61 (enharmonic)", () => {
      expect(noteToMidi(Note.D_FLAT, 4)).toBe(61);
    });

    test("F#4 = 66", () => {
      expect(noteToMidi(Note.F_SHARP, 4)).toBe(66);
    });

    test("Bb4 = 70", () => {
      expect(noteToMidi(Note.B_FLAT, 4)).toBe(70);
    });

    test("E#4 = 65 (enharmonic with F)", () => {
      expect(noteToMidi(Note.E_SHARP, 4)).toBe(65);
    });

    test("Cb4 = 59 (enharmonic with B3)", () => {
      expect(noteToMidi(Note.C_FLAT, 4)).toBe(59);
    });

    test("C##4 = 62 (double sharp)", () => {
      expect(noteToMidi(Note.C_DOUBLE_SHARP, 4)).toBe(62);
    });

    test("Bbb4 = 69 (double flat)", () => {
      expect(noteToMidi(Note.B_DOUBLE_FLAT, 4)).toBe(69);
    });
  });

  describe("octave spanning", () => {
    test("C0 = 12", () => {
      expect(noteToMidi(Note.C, 0)).toBe(12);
    });

    test("C3 = 48", () => {
      expect(noteToMidi(Note.C, 3)).toBe(48);
    });

    test("C5 = 72", () => {
      expect(noteToMidi(Note.C, 5)).toBe(72);
    });

    test("A0 = 21 (lowest piano note)", () => {
      expect(noteToMidi(Note.A, 0)).toBe(21);
    });

    test("C8 = 108 (highest piano C)", () => {
      expect(noteToMidi(Note.C, 8)).toBe(108);
    });
  });
});

// ============================================================================
// midiToSpelling - MIDI number → spelling (NOT a true inverse of noteToMidi)
//
// This is a "pretty printer" that produces a canonical spelling for display.
// It does NOT preserve original enharmonic spellings (E# becomes F, Cb becomes B).
// ============================================================================

describe("midiToSpelling", () => {
  describe("returns NoteName AND octave", () => {
    test("60 -> C4", () => {
      const spelling = midiToSpelling(60);
      expect(spelling.note.letter).toBe("C");
      expect(spelling.note.accidental).toBe(0);
      expect(spelling.octave).toBe(4);
    });

    test("69 -> A4", () => {
      const spelling = midiToSpelling(69);
      expect(spelling.note.letter).toBe("A");
      expect(spelling.note.accidental).toBe(0);
      expect(spelling.octave).toBe(4);
    });

    test("48 -> C3", () => {
      const spelling = midiToSpelling(48);
      expect(spelling.note.letter).toBe("C");
      expect(spelling.octave).toBe(3);
    });

    test("71 -> B4", () => {
      const spelling = midiToSpelling(71);
      expect(spelling.note.letter).toBe("B");
      expect(spelling.octave).toBe(4);
    });

    test("72 -> C5 (octave boundary)", () => {
      const spelling = midiToSpelling(72);
      expect(spelling.note.letter).toBe("C");
      expect(spelling.octave).toBe(5);
    });
  });

  describe("spelling strategies", () => {
    test("sharps strategy: 61 -> C#4", () => {
      const spelling = midiToSpelling(61, "sharps");
      expect(spelling.note.letter).toBe("C");
      expect(spelling.note.accidental).toBe(1);
      expect(spelling.octave).toBe(4);
    });

    test("flats strategy: 61 -> Db4", () => {
      const spelling = midiToSpelling(61, "flats");
      expect(spelling.note.letter).toBe("D");
      expect(spelling.note.accidental).toBe(-1);
      expect(spelling.octave).toBe(4);
    });

    test("sharps strategy: 70 -> A#4", () => {
      const spelling = midiToSpelling(70, "sharps");
      expect(spelling.note.letter).toBe("A");
      expect(spelling.note.accidental).toBe(1);
    });

    test("flats strategy: 70 -> Bb4", () => {
      const spelling = midiToSpelling(70, "flats");
      expect(spelling.note.letter).toBe("B");
      expect(spelling.note.accidental).toBe(-1);
    });

    test("naturals are unchanged regardless of strategy", () => {
      expect(midiToSpelling(60, "sharps").note.letter).toBe("C");
      expect(midiToSpelling(60, "flats").note.letter).toBe("C");
      expect(midiToSpelling(64, "sharps").note.letter).toBe("E");
      expect(midiToSpelling(64, "flats").note.letter).toBe("E");
    });
  });

  describe("is NOT an inverse of noteToMidi (by design)", () => {
    test("E#4 (65) spells as F4, not E#4", () => {
      const midi = noteToMidi(Note.E_SHARP, 4); // 65
      const spelling = midiToSpelling(midi);
      expect(spelling.note.letter).toBe("F"); // NOT E#
      expect(spelling.note.accidental).toBe(0);
    });

    test("Cb4 (59) spells as B3, not Cb4", () => {
      const midi = noteToMidi(Note.C_FLAT, 4); // 59
      const spelling = midiToSpelling(midi);
      expect(spelling.note.letter).toBe("B");
      expect(spelling.octave).toBe(3); // Octave shifts too
    });
  });
});

// ============================================================================
// MidiChord structure - flat array for synthesizer
//
// OUTPUT: number[] sorted low-to-high, bass note included at index 0
// This is the final output format for sending to a DAW/synthesizer.
// ============================================================================

describe("MidiChord structure", () => {
  test("notes is a flat number[] sorted low-to-high", () => {
    const chords: ChordSpec[] = [{ root: Note.C, quality: "maj7" }];
    const result = renderChordSequence(chords, { baseOctave: 4 });

    expect(Array.isArray(result[0].notes)).toBe(true);
    expect(result[0].notes.every((n) => typeof n === "number")).toBe(true);

    // Sorted low to high
    for (let i = 0; i < result[0].notes.length - 1; i++) {
      expect(result[0].notes[i]).toBeLessThan(result[0].notes[i + 1]!);
    }
  });

  test("bass note is included in notes array (lowest note)", () => {
    const chords: ChordSpec[] = [{ root: Note.C, quality: "maj" }];
    const result = renderChordSequence(chords, { baseOctave: 4 });

    // Bass is the first (lowest) note
    expect(result[0].notes[0]).toBe(48); // C3 bass
    expect(result[0].notes).toEqual([48, 60, 64, 67]); // C3, C4, E4, G4
  });

  test("slash chord bass is included at correct position", () => {
    const chords: ChordSpec[] = [{ root: Note.C, quality: "maj", bass: Note.E }];
    const result = renderChordSequence(chords, { baseOctave: 4 });

    // E3 bass, then C4, E4, G4
    expect(result[0].notes[0]).toBe(52); // E3
    expect(result[0].notes).toEqual([52, 60, 64, 67]);
  });

  test("spec reference is preserved for debugging", () => {
    const spec: ChordSpec = { root: Note.C, quality: "maj" };
    const result = renderChordSequence([spec], { baseOctave: 4 });
    expect(result[0].spec).toEqual(spec);
  });
});

// ============================================================================
// renderChordSequence - basic rendering (no voice leading optimization)
// ============================================================================

describe("renderChordSequence", () => {
  describe("triads with bass", () => {
    test("C major: bass + triad", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );

      // Bass C3, then C4, E4, G4
      expect(result[0].notes).toEqual([48, 60, 64, 67]);
    });

    test("Am triad with bass", () => {
      const result = renderChordSequence(
        [{ root: Note.A, quality: "min" }],
        { baseOctave: 4 }
      );

      // Bass A3, then A4, C5, E5
      expect(result[0].notes).toEqual([57, 69, 72, 76]);
    });

    test("F#m triad with bass", () => {
      const result = renderChordSequence(
        [{ root: Note.F_SHARP, quality: "min" }],
        { baseOctave: 4 }
      );

      // Bass F#3, then F#4, A4, C#5
      expect(result[0].notes).toEqual([54, 66, 69, 73]);
    });
  });

  describe("seventh chords", () => {
    test("Cmaj7: bass + 4 upper voices", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4 }
      );

      // Bass C3, then C4, E4, G4, B4
      expect(result[0].notes).toEqual([48, 60, 64, 67, 71]);
    });

    test("G7 chord", () => {
      const result = renderChordSequence(
        [{ root: Note.G, quality: "7" }],
        { baseOctave: 3 }
      );

      // Bass G2, then G3, B3, D4, F4
      expect(result[0].notes).toEqual([43, 55, 59, 62, 65]);
    });
  });

  describe("extended chords", () => {
    test("Dm9: bass + 5 upper voices", () => {
      const result = renderChordSequence(
        [{ root: Note.D, quality: "min9" }],
        { baseOctave: 3 }
      );

      // Bass D2, then D3, F3, A3, C4, E4
      expect(result[0].notes).toEqual([38, 50, 53, 57, 60, 64]);
    });

    test("C13: bass + 7 upper voices", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "13" }],
        { baseOctave: 3 }
      );

      // 1 bass + 7 chord tones = 8 notes
      expect(result[0].notes).toHaveLength(8);
    });
  });

  describe("voicing modes", () => {
    test("close voicing: upper voices within octave", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4, voicing: "close" }
      );

      // Bass C3 (48), then close: C4(60), E4(64), G4(67), B4(71)
      expect(result[0].notes).toEqual([48, 60, 64, 67, 71]);
    });

    test("drop2 voicing: 2nd-from-top drops an octave", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4, voicing: "drop2" }
      );

      // Bass C3 (48), then drop2: G3(55), C4(60), E4(64), B4(71)
      expect(result[0].notes).toEqual([48, 55, 60, 64, 71]);
    });

    test("drop3 voicing: 3rd-from-top drops an octave", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4, voicing: "drop3" }
      );

      // Bass C3 (48), then drop3: E3(52), C4(60), G4(67), B4(71)
      expect(result[0].notes).toEqual([48, 52, 60, 67, 71]);
    });

    test("drop2 on triad: unchanged (not enough voices)", () => {
      const close = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4, voicing: "close" }
      );
      const drop2 = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4, voicing: "drop2" }
      );

      expect(drop2[0].notes).toEqual(close[0].notes);
    });

    test("spread voicing: wider range", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 3, voicing: "spread" }
      );

      const upperVoices = result[0].notes.slice(1); // exclude bass
      const range = upperVoices[upperVoices.length - 1]! - upperVoices[0]!;
      expect(range).toBeGreaterThan(12);
    });
  });

  describe("bass configuration", () => {
    test("default bass is one octave below voicing", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );

      expect(result[0].notes[0]).toBe(48); // C3
    });

    test("slash chord uses specified bass note", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj", bass: Note.E }],
        { baseOctave: 4 }
      );

      expect(result[0].notes[0]).toBe(52); // E3
    });

    test("bassOctave configures bass register", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4, bassOctave: 2 }
      );

      expect(result[0].notes[0]).toBe(36); // C2
    });

    test("bass is always the lowest note", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );

      const bass = result[0].notes[0]!;
      const upperVoices = result[0].notes.slice(1);
      expect(bass).toBeLessThan(Math.min(...upperVoices));
    });
  });
});

// ============================================================================
// voiceLead - sequence optimization
//
// OUTPUT: flat number[] with bass included, optimized for smooth voice leading
// CONTRACT:
// - note count is constant across sequence (1 bass + maxVoices upper)
// - upper voices maintain stable identity for voice leading
// - if chord has fewer tones than maxVoices, tones are doubled
// - if chord has more tones than maxVoices, tonePriority determines omissions
// ============================================================================

describe("voiceLead", () => {
  describe("output format", () => {
    test("returns flat number[] with bass + upper voices", () => {
      const chords: ChordSpec[] = [{ root: Note.C, quality: "maj" }];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 3 });

      // 1 bass + 3 upper voices = 4 notes
      expect(result[0].notes).toHaveLength(4);
      expect(result[0].notes.every((n) => typeof n === "number")).toBe(true);
    });

    test("note count is constant across sequence", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },   // 3 tones
        { root: Note.G, quality: "7" },     // 4 tones
        { root: Note.C, quality: "maj7" },  // 4 tones
      ];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 4 });

      // All should have 1 bass + 4 upper = 5 notes
      expect(result[0].notes).toHaveLength(5);
      expect(result[1].notes).toHaveLength(5);
      expect(result[2].notes).toHaveLength(5);
    });

    test("notes are sorted low to high", () => {
      const chords: ChordSpec[] = [{ root: Note.C, quality: "maj7" }];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 4 });

      for (let i = 0; i < result[0].notes.length - 1; i++) {
        expect(result[0].notes[i]).toBeLessThan(result[0].notes[i + 1]!);
      }
    });
  });

  describe("common tone retention", () => {
    test("C to Am: common tones (C, E) stay in similar positions", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.A, quality: "min" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        keepCommonTones: true,
      });

      // Both chords should contain C and E at similar MIDI positions
      const chord1PitchClasses = result[0].notes.map((n) => n % 12);
      const chord2PitchClasses = result[1].notes.map((n) => n % 12);

      expect(chord1PitchClasses).toContain(0); // C
      expect(chord1PitchClasses).toContain(4); // E
      expect(chord2PitchClasses).toContain(0); // C
      expect(chord2PitchClasses).toContain(4); // E
    });

    test("C to G: G stays in place", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        keepCommonTones: true,
      });

      // Find G in both chords - should be same MIDI note
      const g1 = result[0].notes.find((n) => n % 12 === 7);
      const g2 = result[1].notes.find((n) => n % 12 === 7);
      expect(g1).toBe(g2);
    });
  });

  describe("minimal motion", () => {
    test("total movement is minimized", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.F, quality: "maj" },
      ];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 3 });

      // Compare upper voices (skip bass at index 0)
      const upper1 = result[0].notes.slice(1);
      const upper2 = result[1].notes.slice(1);

      const totalMovement = upper1.reduce(
        (sum, v, i) => sum + Math.abs(upper2[i]! - v),
        0
      );

      // C-E-G to F-A-C should have minimal movement
      expect(totalMovement).toBeLessThanOrEqual(6);
    });

    test("no voice jumps more than a 5th", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.D, quality: "min" },
      ];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 3 });

      const upper1 = result[0].notes.slice(1);
      const upper2 = result[1].notes.slice(1);

      const movements = upper1.map((v, i) => Math.abs(upper2[i]! - v));
      expect(Math.max(...movements)).toBeLessThanOrEqual(7); // P5
    });
  });

  describe("voice crossing prevention", () => {
    test("notes remain sorted (no crossing) by default", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
        { root: Note.A, quality: "min" },
        { root: Note.F, quality: "maj" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        allowVoiceCrossing: false,
      });

      for (const chord of result) {
        for (let i = 0; i < chord.notes.length - 1; i++) {
          expect(chord.notes[i]).toBeLessThan(chord.notes[i + 1]!);
        }
      }
    });
  });

  describe("tonePriority - tone selection when reducing voices", () => {
    test("default: keeps 3rd and 7th over 5th", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj7" }, // C E G B
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3, // Must omit one tone from upper voices
      });

      const pitchClasses = result[0].notes.map((n) => n % 12);
      expect(pitchClasses).toContain(4);  // E (3rd) kept
      expect(pitchClasses).toContain(11); // B (7th) kept
      expect(pitchClasses).not.toContain(7); // G (5th) omitted
    });

    test("custom: keep root and 5th (power chord style)", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj7" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 2,
        tonePriority: ["root", "5", "3", "7"],
      });

      const pitchClasses = result[0].notes.map((n) => n % 12);
      expect(pitchClasses).toContain(0); // C (root)
      expect(pitchClasses).toContain(7); // G (5th)
    });
  });

  describe("range constraints", () => {
    test("minNote respected for upper voices", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        minNote: 60,
      });

      for (const chord of result) {
        const upperVoices = chord.notes.slice(1);
        for (const note of upperVoices) {
          expect(note).toBeGreaterThanOrEqual(60);
        }
      }
    });

    test("maxNote respected for upper voices", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        maxNote: 72,
      });

      for (const chord of result) {
        const upperVoices = chord.notes.slice(1);
        for (const note of upperVoices) {
          expect(note).toBeLessThanOrEqual(72);
        }
      }
    });
  });

  describe("bass handling", () => {
    test("bass follows root by default", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
        { root: Note.A, quality: "min" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        bassStrategy: "followRoot",
      });

      expect(result[0].notes[0]! % 12).toBe(0); // C
      expect(result[1].notes[0]! % 12).toBe(7); // G
      expect(result[2].notes[0]! % 12).toBe(9); // A
    });

    test("bassStrategy: minimalMotion", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.A, quality: "min" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        bassStrategy: "minimalMotion",
      });

      const bassMovement = Math.abs(result[1].notes[0]! - result[0].notes[0]!);
      expect(bassMovement).toBeLessThanOrEqual(5);
    });

    test("slash chord bass overrides strategy", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.C, quality: "maj", bass: Note.E },
        { root: Note.C, quality: "maj", bass: Note.G },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        bassStrategy: "followRoot",
      });

      expect(result[0].notes[0]! % 12).toBe(0); // C
      expect(result[1].notes[0]! % 12).toBe(4); // E (slash)
      expect(result[2].notes[0]! % 12).toBe(7); // G (slash)
    });

    test("bass is always the lowest note", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 3 });

      for (const chord of result) {
        expect(chord.notes[0]).toBe(Math.min(...chord.notes));
      }
    });
  });

  describe("classic progressions", () => {
    test("ii-V-I: Dm7 - G7 - Cmaj7", () => {
      const chords: ChordSpec[] = [
        { root: Note.D, quality: "min7" },
        { root: Note.G, quality: "7" },
        { root: Note.C, quality: "maj7" },
      ];
      const result = voiceLead(chords, { baseOctave: 3, maxVoices: 4 });

      expect(result).toHaveLength(3);
      // 1 bass + 4 upper = 5 notes each
      expect(result.every((c) => c.notes.length === 5)).toBe(true);
    });

    test("I-IV-V-I cycles back smoothly", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.F, quality: "maj" },
        { root: Note.G, quality: "maj" },
        { root: Note.C, quality: "maj" },
      ];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 3 });

      // First and last C should be identical or very close
      const drift = result[0].notes.reduce(
        (sum, v, i) => sum + Math.abs(result[3].notes[i]! - v),
        0
      );
      expect(drift).toBeLessThanOrEqual(6);
    });

    test("I-vi-IV-V (50s progression) - smooth throughout", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.A, quality: "min" },
        { root: Note.F, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 3 });

      for (let i = 0; i < result.length - 1; i++) {
        const upper1 = result[i].notes.slice(1);
        const upper2 = result[i + 1].notes.slice(1);
        const avgMovement = upper1.reduce(
          (sum, v, j) => sum + Math.abs(upper2[j]! - v),
          0
        ) / upper1.length;
        expect(avgMovement).toBeLessThan(4);
      }
    });
  });
});

// ============================================================================
// Edge cases and error handling
// ============================================================================

describe("edge cases", () => {
  test("empty chord array returns empty result", () => {
    const result = renderChordSequence([], { baseOctave: 4 });
    expect(result).toEqual([]);
  });

  test("single chord sequence works", () => {
    const result = voiceLead(
      [{ root: Note.C, quality: "maj" }],
      { baseOctave: 4, maxVoices: 3 }
    );
    expect(result).toHaveLength(1);
    expect(result[0].notes).toHaveLength(4); // 1 bass + 3 upper
  });

  test("diminished chord with double flats renders correctly", () => {
    const result = renderChordSequence(
      [{ root: Note.D_FLAT, quality: "dim7" }],
      { baseOctave: 4 }
    );

    // 1 bass + 4 chord tones = 5 notes
    expect(result[0].notes).toHaveLength(5);
    expect(result[0].notes.every((n) => n >= 0 && n <= 127)).toBe(true);
  });

  test("extreme octaves", () => {
    const low = renderChordSequence(
      [{ root: Note.C, quality: "maj" }],
      { baseOctave: 1 }
    );
    // Bass at C0, upper voices start at C1
    expect(low[0].notes[0]).toBe(12); // C0 bass
    expect(low[0].notes[1]).toBe(24); // C1 root

    const high = renderChordSequence(
      [{ root: Note.C, quality: "maj" }],
      { baseOctave: 7 }
    );
    expect(high[0].notes[1]).toBe(96); // C7 root
  });

  test("maxVoices greater than chord tones: doubles notes", () => {
    const result = voiceLead(
      [{ root: Note.C, quality: "maj" }], // 3 tones
      { baseOctave: 4, maxVoices: 4 }
    );

    // 1 bass + 4 upper = 5 notes
    expect(result[0].notes).toHaveLength(5);
    // One tone should be doubled
    const pitchClasses = result[0].notes.map((n) => n % 12);
    const uniquePitchClasses = new Set(pitchClasses);
    expect(uniquePitchClasses.size).toBe(3); // Still 3 unique pitch classes
  });
});
