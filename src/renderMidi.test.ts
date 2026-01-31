import { test, expect, describe } from "bun:test";
import {
  renderChordSequence,
  noteToMidi,
  midiToNoteName,
  voiceLead,
} from "./renderMidi";
import { Note } from "./noteName";
import type { ChordSpec } from "./buildChord";
import type { VoicingOptions, MidiChord, VoiceLeadingOptions } from "./renderMidi";

// ============================================================================
// noteToMidi / midiToNoteName - pitch conversion
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

    test("Db4 = 61", () => {
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

    test("double sharps: C##4 = 62", () => {
      expect(noteToMidi(Note.C_DOUBLE_SHARP, 4)).toBe(62);
    });

    test("double flats: Bbb4 = 69", () => {
      expect(noteToMidi(Note.B_DOUBLE_FLAT, 4)).toBe(69);
    });
  });

  describe("different octaves", () => {
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

describe("midiToNoteName", () => {
  test("60 -> C (prefer naturals)", () => {
    const note = midiToNoteName(60);
    expect(note.letter).toBe("C");
    expect(note.accidental).toBe(0);
  });

  test("61 -> C# (prefer sharps by default)", () => {
    const note = midiToNoteName(61);
    expect(note.letter).toBe("C");
    expect(note.accidental).toBe(1);
  });

  test("61 -> Db (prefer flats option)", () => {
    const note = midiToNoteName(61, { preferFlats: true });
    expect(note.letter).toBe("D");
    expect(note.accidental).toBe(-1);
  });

  test("69 -> A", () => {
    const note = midiToNoteName(69);
    expect(note.letter).toBe("A");
    expect(note.accidental).toBe(0);
  });
});

// ============================================================================
// renderChordSequence - basic rendering without voice leading
// ============================================================================

describe("renderChordSequence", () => {
  describe("single chord rendering", () => {
    test("C major triad in root position", () => {
      const chords: ChordSpec[] = [{ root: Note.C, quality: "maj" }];
      const result = renderChordSequence(chords, { baseOctave: 4 });

      expect(result).toHaveLength(1);
      expect(result[0].notes).toEqual([60, 64, 67]); // C4, E4, G4
    });

    test("C major triad in octave 3", () => {
      const chords: ChordSpec[] = [{ root: Note.C, quality: "maj" }];
      const result = renderChordSequence(chords, { baseOctave: 3 });

      expect(result).toHaveLength(1);
      expect(result[0].notes).toEqual([48, 52, 55]); // C3, E3, G3
    });

    test("Am triad", () => {
      const chords: ChordSpec[] = [{ root: Note.A, quality: "min" }];
      const result = renderChordSequence(chords, { baseOctave: 4 });

      expect(result[0].notes).toEqual([69, 72, 76]); // A4, C5, E5
    });

    test("F#m triad", () => {
      const chords: ChordSpec[] = [{ root: Note.F_SHARP, quality: "min" }];
      const result = renderChordSequence(chords, { baseOctave: 4 });

      expect(result[0].notes).toEqual([66, 69, 73]); // F#4, A4, C#5
    });

    test("Cmaj7 chord", () => {
      const chords: ChordSpec[] = [{ root: Note.C, quality: "maj7" }];
      const result = renderChordSequence(chords, { baseOctave: 4 });

      expect(result[0].notes).toEqual([60, 64, 67, 71]); // C4, E4, G4, B4
    });

    test("G7 chord", () => {
      const chords: ChordSpec[] = [{ root: Note.G, quality: "7" }];
      const result = renderChordSequence(chords, { baseOctave: 3 });

      expect(result[0].notes).toEqual([55, 59, 62, 65]); // G3, B3, D4, F4
    });

    test("Dm9 chord", () => {
      const chords: ChordSpec[] = [{ root: Note.D, quality: "min9" }];
      const result = renderChordSequence(chords, { baseOctave: 3 });

      // D3, F3, A3, C4, E4
      expect(result[0].notes).toEqual([50, 53, 57, 60, 64]);
    });
  });

  describe("slash chord bass notes", () => {
    test("C/E has E in bass", () => {
      const chords: ChordSpec[] = [{ root: Note.C, quality: "maj", bass: Note.E }];
      const result = renderChordSequence(chords, { baseOctave: 4 });

      // Bass E should be below the chord voicing
      expect(result[0].bass).toBe(52); // E3 (one octave below)
      expect(result[0].notes).toEqual([60, 64, 67]); // C4, E4, G4
    });

    test("Dm7/A has A in bass", () => {
      const chords: ChordSpec[] = [{ root: Note.D, quality: "min7", bass: Note.A }];
      const result = renderChordSequence(chords, { baseOctave: 4 });

      expect(result[0].bass).toBe(57); // A3
    });

    test("bass note is always below chord voicing", () => {
      const chords: ChordSpec[] = [{ root: Note.C, quality: "maj", bass: Note.G }];
      const result = renderChordSequence(chords, { baseOctave: 4 });

      const lowestChordNote = Math.min(...result[0].notes);
      expect(result[0].bass).toBeLessThan(lowestChordNote);
    });
  });

  describe("voicing options", () => {
    test("spread voicing spaces notes across octaves", () => {
      const chords: ChordSpec[] = [{ root: Note.C, quality: "maj" }];
      const result = renderChordSequence(chords, {
        baseOctave: 3,
        voicing: "spread",
      });

      // Notes should span more than one octave
      const range = Math.max(...result[0].notes) - Math.min(...result[0].notes);
      expect(range).toBeGreaterThan(12);
    });

    test("close voicing keeps notes within octave", () => {
      const chords: ChordSpec[] = [{ root: Note.C, quality: "maj7" }];
      const result = renderChordSequence(chords, {
        baseOctave: 4,
        voicing: "close",
      });

      const range = Math.max(...result[0].notes) - Math.min(...result[0].notes);
      expect(range).toBeLessThanOrEqual(12);
    });

    test("drop2 voicing drops second voice down an octave", () => {
      const chords: ChordSpec[] = [{ root: Note.C, quality: "maj7" }];
      const close = renderChordSequence(chords, { baseOctave: 4, voicing: "close" });
      const drop2 = renderChordSequence(chords, { baseOctave: 4, voicing: "drop2" });

      // Drop2 should have a wider spread than close
      const closeRange = Math.max(...close[0].notes) - Math.min(...close[0].notes);
      const drop2Range = Math.max(...drop2[0].notes) - Math.min(...drop2[0].notes);
      expect(drop2Range).toBeGreaterThan(closeRange);
    });

    test("drop3 voicing drops third voice down an octave", () => {
      const chords: ChordSpec[] = [{ root: Note.C, quality: "maj7" }];
      const drop3 = renderChordSequence(chords, { baseOctave: 4, voicing: "drop3" });

      // Should have characteristic drop3 spacing
      const range = Math.max(...drop3[0].notes) - Math.min(...drop3[0].notes);
      expect(range).toBeGreaterThan(12);
    });
  });

  describe("sequence of chords", () => {
    test("renders multiple chords in sequence", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.F, quality: "maj" },
        { root: Note.G, quality: "maj" },
        { root: Note.C, quality: "maj" },
      ];
      const result = renderChordSequence(chords, { baseOctave: 4 });

      expect(result).toHaveLength(4);
      expect(result[0].notes).toEqual([60, 64, 67]); // C
      expect(result[1].notes).toEqual([65, 69, 72]); // F
      expect(result[2].notes).toEqual([67, 71, 74]); // G
      expect(result[3].notes).toEqual([60, 64, 67]); // C
    });
  });
});

// ============================================================================
// voiceLead - intelligent voice leading between chords
// ============================================================================

describe("voiceLead", () => {
  describe("common tone retention", () => {
    test("C to Am keeps C and E, moves G to A", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.A, quality: "min" },
      ];
      const result = voiceLead(chords, { baseOctave: 4 });

      // First chord: C4, E4, G4
      expect(result[0].notes).toContain(60); // C4
      expect(result[0].notes).toContain(64); // E4
      expect(result[0].notes).toContain(67); // G4

      // Second chord should keep C and E in same position
      expect(result[1].notes).toContain(60); // C4 (common tone)
      expect(result[1].notes).toContain(64); // E4 (common tone)
      // A should be close to where G was
      expect(result[1].notes).toContain(69); // A4 (moved from G4)
    });

    test("C to G keeps G, moves other voices minimally", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, { baseOctave: 4 });

      // G should be retained as common tone
      const firstG = result[0].notes.find((n) => n % 12 === 7);
      const secondG = result[1].notes.find((n) => n % 12 === 7);
      expect(firstG).toBe(secondG);
    });
  });

  describe("minimal motion", () => {
    test("voices move by smallest interval possible", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.D, quality: "min" },
      ];
      const result = voiceLead(chords, { baseOctave: 4 });

      // Calculate total voice movement
      let totalMovement = 0;
      for (let i = 0; i < result[0].notes.length; i++) {
        const note1 = result[0].notes[i];
        const note2 = result[1].notes[i];
        if (note1 !== undefined && note2 !== undefined) {
          totalMovement += Math.abs(note2 - note1);
        }
      }

      // Movement from C-E-G to D-F-A should be minimal
      // C->D = 2, E->F = 1, G->A = 2 = 5 total (or less with inversions)
      expect(totalMovement).toBeLessThanOrEqual(6);
    });

    test("avoids large jumps (>6 semitones) when possible", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.F, quality: "maj" },
        { root: Note.G, quality: "maj" },
        { root: Note.C, quality: "maj" },
      ];
      const result = voiceLead(chords, { baseOctave: 4 });

      for (let i = 0; i < result.length - 1; i++) {
        for (let v = 0; v < result[i].notes.length; v++) {
          const curr = result[i].notes[v];
          const next = result[i + 1].notes[v];
          if (curr !== undefined && next !== undefined) {
            const movement = Math.abs(next - curr);
            expect(movement).toBeLessThanOrEqual(7); // Perfect fifth max
          }
        }
      }
    });
  });

  describe("ii-V-I progression", () => {
    test("Dm7 - G7 - Cmaj7 voice leads smoothly", () => {
      const chords: ChordSpec[] = [
        { root: Note.D, quality: "min7" },
        { root: Note.G, quality: "7" },
        { root: Note.C, quality: "maj7" },
      ];
      const result = voiceLead(chords, { baseOctave: 3 });

      expect(result).toHaveLength(3);

      // Check that each chord has 4 notes
      expect(result[0].notes).toHaveLength(4);
      expect(result[1].notes).toHaveLength(4);
      expect(result[2].notes).toHaveLength(4);

      // F in Dm7 should resolve down to F in G7, then to E in Cmaj7
      // C in Dm7 should stay as C in Cmaj7
      // These are characteristic ii-V-I voice leading moves
    });

    test("seventh resolves down by step in V-I", () => {
      const chords: ChordSpec[] = [
        { root: Note.G, quality: "7" },
        { root: Note.C, quality: "maj7" },
      ];
      const result = voiceLead(chords, { baseOctave: 4 });

      // F (7th of G7) should resolve to E (3rd of Cmaj7)
      const g7Notes = result[0].notes;
      const cmaj7Notes = result[1].notes;

      // Find F in G7 and E in Cmaj7
      const fInG7 = g7Notes.find((n) => n % 12 === 5);
      const eInCmaj7 = cmaj7Notes.find((n) => n % 12 === 4);

      expect(fInG7).toBeDefined();
      expect(eInCmaj7).toBeDefined();

      // F should resolve down to nearest E (1 semitone)
      if (fInG7 && eInCmaj7) {
        expect(Math.abs(fInG7 - eInCmaj7)).toBeLessThanOrEqual(2);
      }
    });
  });

  describe("voice range constraints", () => {
    test("respects minNote constraint", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        minNote: 55, // G3
      });

      for (const chord of result) {
        for (const note of chord.notes) {
          expect(note).toBeGreaterThanOrEqual(55);
        }
      }
    });

    test("respects maxNote constraint", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxNote: 79, // G5
      });

      for (const chord of result) {
        for (const note of chord.notes) {
          expect(note).toBeLessThanOrEqual(79);
        }
      }
    });
  });

  describe("bass handling", () => {
    test("bass moves independently of upper voices", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj", bass: Note.C },
        { root: Note.A, quality: "min", bass: Note.A },
      ];
      const result = voiceLead(chords, { baseOctave: 4 });

      // Bass should follow root motion
      expect(result[0].bass).toBeDefined();
      expect(result[1].bass).toBeDefined();

      // Bass should be in lower register
      if (result[0].bass && result[1].bass) {
        expect(result[0].bass).toBeLessThan(Math.min(...result[0].notes));
        expect(result[1].bass).toBeLessThan(Math.min(...result[1].notes));
      }
    });

    test("slash chord bass is placed correctly", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.C, quality: "maj", bass: Note.E },
        { root: Note.C, quality: "maj", bass: Note.G },
      ];
      const result = voiceLead(chords, { baseOctave: 4 });

      // First chord bass = C
      expect(result[0].bass! % 12).toBe(0); // C
      // Second chord bass = E
      expect(result[1].bass! % 12).toBe(4); // E
      // Third chord bass = G
      expect(result[2].bass! % 12).toBe(7); // G
    });
  });

  describe("full progressions", () => {
    test("I - IV - V - I in C major", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.F, quality: "maj" },
        { root: Note.G, quality: "maj" },
        { root: Note.C, quality: "maj" },
      ];
      const result = voiceLead(chords, { baseOctave: 4 });

      expect(result).toHaveLength(4);

      // Final C should be close to initial C (good voice leading cycles back)
      const firstCNotes = result[0].notes;
      const lastCNotes = result[3].notes;

      // At least some notes should be in same position
      const samePositionCount = firstCNotes.filter((n) =>
        lastCNotes.includes(n)
      ).length;
      expect(samePositionCount).toBeGreaterThanOrEqual(1);
    });

    test("I - vi - IV - V in C major (50s progression)", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.A, quality: "min" },
        { root: Note.F, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, { baseOctave: 4 });

      expect(result).toHaveLength(4);

      // Verify smooth voice leading throughout
      for (let i = 0; i < result.length - 1; i++) {
        let totalMovement = 0;
        for (let v = 0; v < Math.min(result[i].notes.length, result[i+1].notes.length); v++) {
          const curr = result[i].notes[v];
          const next = result[i + 1].notes[v];
          if (curr !== undefined && next !== undefined) {
            totalMovement += Math.abs(next - curr);
          }
        }
        // Average movement per voice should be small
        expect(totalMovement / result[i].notes.length).toBeLessThan(5);
      }
    });

    test("jazz ii-V-I with extensions", () => {
      const chords: ChordSpec[] = [
        { root: Note.D, quality: "min9" },
        { root: Note.G, quality: "13" },
        { root: Note.C, quality: "maj9" },
      ];
      const result = voiceLead(chords, { baseOctave: 3 });

      expect(result).toHaveLength(3);

      // Extended chords should still voice lead smoothly
      // Check that we're not making giant leaps
      for (let i = 0; i < result.length - 1; i++) {
        const maxMovement = Math.max(
          ...result[i].notes.map((n, idx) => {
            const next = result[i + 1].notes[idx];
            return next !== undefined ? Math.abs(next - n) : 0;
          })
        );
        expect(maxMovement).toBeLessThanOrEqual(12); // Octave max
      }
    });
  });
});

// ============================================================================
// MidiChord structure
// ============================================================================

describe("MidiChord structure", () => {
  test("contains notes array", () => {
    const chords: ChordSpec[] = [{ root: Note.C, quality: "maj" }];
    const result = renderChordSequence(chords, { baseOctave: 4 });

    expect(Array.isArray(result[0].notes)).toBe(true);
    expect(result[0].notes.every((n) => typeof n === "number")).toBe(true);
  });

  test("contains optional bass", () => {
    const chords: ChordSpec[] = [{ root: Note.C, quality: "maj", bass: Note.E }];
    const result = renderChordSequence(chords, { baseOctave: 4 });

    expect(typeof result[0].bass).toBe("number");
  });

  test("contains chord spec reference", () => {
    const spec: ChordSpec = { root: Note.C, quality: "maj" };
    const chords: ChordSpec[] = [spec];
    const result = renderChordSequence(chords, { baseOctave: 4 });

    expect(result[0].spec).toEqual(spec);
  });

  test("notes are sorted low to high", () => {
    const chords: ChordSpec[] = [{ root: Note.C, quality: "maj13" }];
    const result = renderChordSequence(chords, { baseOctave: 4 });

    const notes = result[0].notes;
    for (let i = 0; i < notes.length - 1; i++) {
      expect(notes[i]).toBeLessThanOrEqual(notes[i + 1]!);
    }
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe("edge cases", () => {
  test("empty chord array returns empty result", () => {
    const result = renderChordSequence([], { baseOctave: 4 });
    expect(result).toEqual([]);
  });

  test("single note power chord", () => {
    const chords: ChordSpec[] = [{ root: Note.E, quality: "maj", omit: ["3"] }];
    const result = renderChordSequence(chords, { baseOctave: 2 });

    // Should have root and 5th only
    expect(result[0].notes).toHaveLength(2);
  });

  test("handles extreme octaves", () => {
    const chords: ChordSpec[] = [{ root: Note.C, quality: "maj" }];

    const low = renderChordSequence(chords, { baseOctave: 1 });
    expect(low[0].notes[0]).toBe(24); // C1

    const high = renderChordSequence(chords, { baseOctave: 7 });
    expect(high[0].notes[0]).toBe(96); // C7
  });

  test("diminished chord with double flats renders correctly", () => {
    const chords: ChordSpec[] = [{ root: Note.D_FLAT, quality: "dim7" }];
    const result = renderChordSequence(chords, { baseOctave: 4 });

    // Db dim7 = Db, Fb, Abb, Cbb
    // MIDI: 61, 64, 67, 70
    expect(result[0].notes).toHaveLength(4);
    // All should be valid MIDI numbers
    expect(result[0].notes.every((n) => n >= 0 && n <= 127)).toBe(true);
  });
});
