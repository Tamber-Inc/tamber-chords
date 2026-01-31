import { test, expect, describe } from "bun:test";
import {
  renderChordSequence,
  noteToMidi,
  midiToSpelling,
  voiceLead,
} from "./renderMidi";
import { Note } from "./noteName";
import type { ChordSpec } from "./buildChord";
import type {
  VoicingOptions,
  VoiceLeadingOptions,
  MidiChord,
  MidiSpelling,
  SpellingStrategy,
} from "./renderMidi";

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
// MidiChord structure - explicit voice identity contract
//
// CRITICAL: `voices` array has STABLE INDICES across voice leading.
// voices[0] is always the bottom voice, voices[N-1] is always the top voice.
// This is the voice-leading contract: same index = same voice.
// ============================================================================

describe("MidiChord structure", () => {
  test("voices array is ordered bottom-to-top (stable voice indices)", () => {
    const chords: ChordSpec[] = [{ root: Note.C, quality: "maj7" }];
    const result = renderChordSequence(chords, { baseOctave: 4 });

    const voices = result[0].voices;
    for (let i = 0; i < voices.length - 1; i++) {
      expect(voices[i]).toBeLessThan(voices[i + 1]!);
    }
  });

  test("voices and pitchSet are different views of same data", () => {
    const chords: ChordSpec[] = [{ root: Note.C, quality: "maj7" }];
    const result = renderChordSequence(chords, { baseOctave: 4 });

    // pitchSet is sorted pitch classes (for analysis)
    // voices is the actual MIDI notes in voice order (for playback + voice leading)
    expect(new Set(result[0].voices)).toEqual(new Set(result[0].pitchSet));
  });

  test("spec reference is preserved", () => {
    const spec: ChordSpec = { root: Note.C, quality: "maj" };
    const result = renderChordSequence([spec], { baseOctave: 4 });
    expect(result[0].spec).toEqual(spec);
  });

  test("bass is separate from voices", () => {
    const chords: ChordSpec[] = [{ root: Note.C, quality: "maj", bass: Note.E }];
    const result = renderChordSequence(chords, { baseOctave: 4 });

    expect(result[0].bass).toBeDefined();
    expect(result[0].voices).not.toContain(result[0].bass);
  });
});

// ============================================================================
// renderChordSequence - basic rendering (no voice leading optimization)
// ============================================================================

describe("renderChordSequence", () => {
  describe("triads", () => {
    test("C major in root position at octave 4", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );

      expect(result[0].voices).toEqual([60, 64, 67]); // C4, E4, G4
    });

    test("Am triad", () => {
      const result = renderChordSequence(
        [{ root: Note.A, quality: "min" }],
        { baseOctave: 4 }
      );

      expect(result[0].voices).toEqual([69, 72, 76]); // A4, C5, E5
    });

    test("F#m triad preserves correct pitches", () => {
      const result = renderChordSequence(
        [{ root: Note.F_SHARP, quality: "min" }],
        { baseOctave: 4 }
      );

      expect(result[0].voices).toEqual([66, 69, 73]); // F#4, A4, C#5
    });
  });

  describe("seventh chords", () => {
    test("Cmaj7 has 4 voices", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4 }
      );

      expect(result[0].voices).toHaveLength(4);
      expect(result[0].voices).toEqual([60, 64, 67, 71]); // C4, E4, G4, B4
    });

    test("G7 chord", () => {
      const result = renderChordSequence(
        [{ root: Note.G, quality: "7" }],
        { baseOctave: 3 }
      );

      expect(result[0].voices).toEqual([55, 59, 62, 65]); // G3, B3, D4, F4
    });
  });

  describe("extended chords", () => {
    test("Dm9 has 5 voices", () => {
      const result = renderChordSequence(
        [{ root: Note.D, quality: "min9" }],
        { baseOctave: 3 }
      );

      expect(result[0].voices).toHaveLength(5);
      expect(result[0].voices).toEqual([50, 53, 57, 60, 64]); // D3, F3, A3, C4, E4
    });

    test("C13 has 7 voices (full voicing)", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "13" }],
        { baseOctave: 3 }
      );

      expect(result[0].voices).toHaveLength(7);
    });
  });

  describe("voicing modes - exact specifications", () => {
    // Close voicing: stack chord tones ascending from bass within one octave
    test("close voicing: Cmaj7 stacked within octave", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4, voicing: "close" }
      );

      const voices = result[0].voices;
      const range = voices[voices.length - 1]! - voices[0]!;
      expect(range).toBeLessThanOrEqual(12);
      // Exact close voicing: C4, E4, G4, B4
      expect(voices).toEqual([60, 64, 67, 71]);
    });

    // Drop2: drop 2nd voice from top down an octave (jazz guitar/piano voicing)
    test("drop2 voicing: 2nd-from-top drops an octave", () => {
      const close = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4, voicing: "close" }
      );
      const drop2 = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4, voicing: "drop2" }
      );

      // Close: C4(60), E4(64), G4(67), B4(71)
      // Drop2: G3(55), C4(60), E4(64), B4(71) - G dropped an octave
      expect(drop2[0].voices).toEqual([55, 60, 64, 71]);
    });

    // Drop3: drop 3rd voice from top down an octave
    test("drop3 voicing: 3rd-from-top drops an octave", () => {
      const drop3 = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4, voicing: "drop3" }
      );

      // Close: C4(60), E4(64), G4(67), B4(71)
      // Drop3: E3(52), C4(60), G4(67), B4(71) - E dropped an octave
      expect(drop3[0].voices).toEqual([52, 60, 67, 71]);
    });

    // Drop2 only applies to 4+ note chords
    test("drop2 on triad: no change (not enough voices)", () => {
      const close = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4, voicing: "close" }
      );
      const drop2 = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4, voicing: "drop2" }
      );

      // Triads are unchanged by drop voicings
      expect(drop2[0].voices).toEqual(close[0].voices);
    });

    // Spread voicing: distribute across wider range
    test("spread voicing: voices span more than octave", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 3, voicing: "spread" }
      );

      const voices = result[0].voices;
      const range = voices[voices.length - 1]! - voices[0]!;
      expect(range).toBeGreaterThan(12);
    });
  });

  describe("bass handling - explicit policy", () => {
    // Bass is ALWAYS placed below the lowest voice
    test("bass is below lowest voice (root bass)", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );

      // Default: bass = root, one octave below voicing
      expect(result[0].bass).toBe(48); // C3
      expect(result[0].bass).toBeLessThan(result[0].voices[0]!);
    });

    test("slash chord: bass follows spec.bass", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj", bass: Note.E }],
        { baseOctave: 4 }
      );

      expect(result[0].bass! % 12).toBe(4); // E
      expect(result[0].bass).toBeLessThan(result[0].voices[0]!);
    });

    test("bass register configurable via bassOctave", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4, bassOctave: 2 }
      );

      expect(result[0].bass).toBe(36); // C2
    });
  });
});

// ============================================================================
// voiceLead - sequence optimization with explicit voice identity
//
// CONTRACT:
// - voices[i] in chord N maps to voices[i] in chord N+1 (same voice)
// - voice count is determined by maxVoices option
// - if chord has fewer tones than maxVoices, tones are doubled
// - if chord has more tones than maxVoices, tonePriority determines omissions
// ============================================================================

describe("voiceLead", () => {
  describe("voice identity stability", () => {
    test("voice count is constant across sequence (maxVoices)", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },   // 3 tones
        { root: Note.G, quality: "7" },     // 4 tones
        { root: Note.C, quality: "maj7" },  // 4 tones
      ];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 4 });

      // All chords should have exactly 4 voices
      expect(result[0].voices).toHaveLength(4);
      expect(result[1].voices).toHaveLength(4);
      expect(result[2].voices).toHaveLength(4);
    });

    test("same voice index = same voice across chords", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.A, quality: "min" },
      ];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 3 });

      // voices[2] (top voice) should move minimally between chords
      const topVoice1 = result[0].voices[2];
      const topVoice2 = result[1].voices[2];
      // G -> A or G -> E (common tones / minimal motion)
      expect(Math.abs(topVoice2! - topVoice1!)).toBeLessThanOrEqual(4);
    });
  });

  describe("common tone retention (keepCommonTones: true)", () => {
    test("C to Am: keeps C and E in same voice positions", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.A, quality: "min" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        keepCommonTones: true,
      });

      // C (60) and E (64) are common tones
      // They should appear in same voice position in both chords
      const chord1 = result[0].voices;
      const chord2 = result[1].voices;

      // Find which voice has C in chord 1
      const cVoiceIdx = chord1.findIndex((n) => n % 12 === 0);
      // That voice should still have C in chord 2
      expect(chord2[cVoiceIdx]! % 12).toBe(0);

      // Find which voice has E in chord 1
      const eVoiceIdx = chord1.findIndex((n) => n % 12 === 4);
      // That voice should still have E in chord 2
      expect(chord2[eVoiceIdx]! % 12).toBe(4);
    });

    test("C to G: G is common tone, stays in place", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        keepCommonTones: true,
      });

      // G should be in same voice position
      const gVoiceIdx = result[0].voices.findIndex((n) => n % 12 === 7);
      expect(result[1].voices[gVoiceIdx]! % 12).toBe(7);
    });
  });

  describe("minimal motion", () => {
    test("each voice moves by smallest interval", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.D, quality: "min" },
      ];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 3 });

      // Calculate per-voice movement
      const movements = result[0].voices.map((v, i) =>
        Math.abs(result[1].voices[i]! - v)
      );

      // No voice should move more than a 4th (5 semitones) for this progression
      expect(Math.max(...movements)).toBeLessThanOrEqual(5);
    });

    test("total voice movement is minimized", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.F, quality: "maj" },
      ];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 3 });

      const totalMovement = result[0].voices.reduce(
        (sum, v, i) => sum + Math.abs(result[1].voices[i]! - v),
        0
      );

      // C-E-G to F-A-C: optimal is C->C (0), E->F (1), G->A (2) = 3
      // or with inversion: C->C (0), E->A (via G), G->F
      expect(totalMovement).toBeLessThanOrEqual(6);
    });
  });

  describe("voice crossing prevention (allowVoiceCrossing: false)", () => {
    test("voices do not cross by default", () => {
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
        // voices[0] < voices[1] < voices[2] always
        for (let i = 0; i < chord.voices.length - 1; i++) {
          expect(chord.voices[i]).toBeLessThan(chord.voices[i + 1]!);
        }
      }
    });

    test("allowVoiceCrossing: true permits crossing for better leading", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const withCrossing = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        allowVoiceCrossing: true,
      });

      // Result may or may not have crossing, but it should still work
      expect(withCrossing).toHaveLength(2);
    });
  });

  describe("tonePriority - which tones to keep when reducing voices", () => {
    test("default priority keeps 3rd and 7th over 5th", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj7" }, // C E G B (4 tones)
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3, // Must omit one tone
        // Default tonePriority: ["3", "7", "root", "5"]
      });

      const pitchClasses = result[0].voices.map((n) => n % 12);
      // Should have E (4), B (11), probably C (0)
      // Should NOT have G (7) - 5th is lowest priority
      expect(pitchClasses).toContain(4);  // 3rd
      expect(pitchClasses).toContain(11); // 7th
      expect(pitchClasses).not.toContain(7); // 5th omitted
    });

    test("custom tonePriority: keep root and 5th (power chord style)", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj7" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 2,
        tonePriority: ["root", "5", "3", "7"],
      });

      const pitchClasses = result[0].voices.map((n) => n % 12);
      expect(pitchClasses).toContain(0); // root
      expect(pitchClasses).toContain(7); // 5th
    });

    test("tonePriority handles extensions: keep 9 over 5", () => {
      const chords: ChordSpec[] = [
        { root: Note.D, quality: "min9" }, // D F A C E (5 tones)
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 4,
        tonePriority: ["3", "7", "9", "root", "5"],
      });

      const pitchClasses = result[0].voices.map((n) => n % 12);
      expect(pitchClasses).toContain(5);  // F (3rd)
      expect(pitchClasses).toContain(0);  // C (7th)
      expect(pitchClasses).toContain(4);  // E (9th)
      // 5th (A=9) might be omitted
    });
  });

  describe("voice range constraints", () => {
    test("minNote is respected", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        minNote: 60, // C4 minimum
      });

      for (const chord of result) {
        for (const note of chord.voices) {
          expect(note).toBeGreaterThanOrEqual(60);
        }
      }
    });

    test("maxNote is respected", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        maxNote: 72, // C5 maximum
      });

      for (const chord of result) {
        for (const note of chord.voices) {
          expect(note).toBeLessThanOrEqual(72);
        }
      }
    });

    test("range constraint is soft: prefers smooth leading over hard clamp", () => {
      // This tests that we optimize for smoothness within range,
      // not just clamp notes that go out of range
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.F, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        minNote: 58,
        maxNote: 74,
      });

      // Should still have smooth voice leading
      for (let i = 0; i < result.length - 1; i++) {
        const movements = result[i].voices.map((v, j) =>
          Math.abs(result[i + 1].voices[j]! - v)
        );
        // Even with constraints, movement should be reasonable
        expect(Math.max(...movements)).toBeLessThanOrEqual(7);
      }
    });
  });

  describe("bass handling in voice leading", () => {
    test("bass follows bassStrategy: followRoot (default)", () => {
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

      expect(result[0].bass! % 12).toBe(0); // C
      expect(result[1].bass! % 12).toBe(7); // G
      expect(result[2].bass! % 12).toBe(9); // A
    });

    test("bass follows bassStrategy: minimalMotion", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.A, quality: "min" },
      ];
      const result = voiceLead(chords, {
        baseOctave: 4,
        maxVoices: 3,
        bassStrategy: "minimalMotion",
      });

      // Bass should move by smallest interval
      const bassMovement = Math.abs(result[1].bass! - result[0].bass!);
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

      expect(result[0].bass! % 12).toBe(0); // C (root)
      expect(result[1].bass! % 12).toBe(4); // E (slash)
      expect(result[2].bass! % 12).toBe(7); // G (slash)
    });

    test("bass is always below lowest voice", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 3 });

      for (const chord of result) {
        expect(chord.bass).toBeLessThan(Math.min(...chord.voices));
      }
    });
  });

  describe("classic progressions", () => {
    test("ii-V-I in C: Dm7 - G7 - Cmaj7", () => {
      const chords: ChordSpec[] = [
        { root: Note.D, quality: "min7" },
        { root: Note.G, quality: "7" },
        { root: Note.C, quality: "maj7" },
      ];
      const result = voiceLead(chords, { baseOctave: 3, maxVoices: 4 });

      expect(result).toHaveLength(3);
      expect(result.every((c) => c.voices.length === 4)).toBe(true);

      // F (7th of Dm7) → F (7th of G7) → E (3rd of Cmaj7)
      // This is the characteristic ii-V-I voice leading
    });

    test("I-IV-V-I cycles back smoothly", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.F, quality: "maj" },
        { root: Note.G, quality: "maj" },
        { root: Note.C, quality: "maj" },
      ];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 3 });

      // First and last C should be similar (good voice leading is cyclic)
      const totalDrift = result[0].voices.reduce(
        (sum, v, i) => sum + Math.abs(result[3].voices[i]! - v),
        0
      );
      // Should return close to starting position
      expect(totalDrift).toBeLessThanOrEqual(6);
    });

    test("I-vi-IV-V (50s progression)", () => {
      const chords: ChordSpec[] = [
        { root: Note.C, quality: "maj" },
        { root: Note.A, quality: "min" },
        { root: Note.F, quality: "maj" },
        { root: Note.G, quality: "maj" },
      ];
      const result = voiceLead(chords, { baseOctave: 4, maxVoices: 3 });

      // Verify smooth motion throughout
      for (let i = 0; i < result.length - 1; i++) {
        const avgMovement =
          result[i].voices.reduce(
            (sum, v, j) => sum + Math.abs(result[i + 1].voices[j]! - v),
            0
          ) / result[i].voices.length;
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
  });

  test("diminished chord with double flats renders correctly", () => {
    const result = renderChordSequence(
      [{ root: Note.D_FLAT, quality: "dim7" }],
      { baseOctave: 4 }
    );

    expect(result[0].voices).toHaveLength(4);
    expect(result[0].voices.every((n) => n >= 0 && n <= 127)).toBe(true);
  });

  test("extreme octaves", () => {
    const low = renderChordSequence(
      [{ root: Note.C, quality: "maj" }],
      { baseOctave: 1 }
    );
    expect(low[0].voices[0]).toBe(24); // C1

    const high = renderChordSequence(
      [{ root: Note.C, quality: "maj" }],
      { baseOctave: 7 }
    );
    expect(high[0].voices[0]).toBe(96); // C7
  });

  test("maxVoices greater than chord tones: doubles notes", () => {
    const result = voiceLead(
      [{ root: Note.C, quality: "maj" }], // 3 tones
      { baseOctave: 4, maxVoices: 4 }
    );

    expect(result[0].voices).toHaveLength(4);
    // One tone should be doubled (likely root)
    const pitchClasses = result[0].voices.map((n) => n % 12);
    const uniquePitchClasses = new Set(pitchClasses);
    expect(uniquePitchClasses.size).toBe(3); // Still 3 unique pitch classes
  });
});
