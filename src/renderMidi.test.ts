import { test, expect, describe } from "bun:test";
import {
  renderChordSequence,
  noteToMidi,
  midiToSpelling,
  voiceLead,
  toPerformanceOutput,
} from "./renderMidi";
import { Note } from "./noteName";
import type { ChordSpec } from "./buildChord";
import type {
  MidiChord,
  MidiSpelling,
  SpellingStrategy,
  PerformanceChord,
  PerformanceOutput,
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
// midiToSpelling - MIDI → canonical spelling (pretty printer, NOT inverse)
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

    test("72 -> C5 (octave boundary)", () => {
      const spelling = midiToSpelling(72);
      expect(spelling.note.letter).toBe("C");
      expect(spelling.octave).toBe(5);
    });
  });

  describe("spelling strategies", () => {
    test("sharps: 61 -> C#4", () => {
      const spelling = midiToSpelling(61, "sharps");
      expect(spelling.note.letter).toBe("C");
      expect(spelling.note.accidental).toBe(1);
    });

    test("flats: 61 -> Db4", () => {
      const spelling = midiToSpelling(61, "flats");
      expect(spelling.note.letter).toBe("D");
      expect(spelling.note.accidental).toBe(-1);
    });
  });

  describe("is NOT inverse of noteToMidi (by design)", () => {
    test("E#4 (65) spells as F4", () => {
      const midi = noteToMidi(Note.E_SHARP, 4);
      const spelling = midiToSpelling(midi);
      expect(spelling.note.letter).toBe("F");
    });

    test("Cb4 (59) spells as B3", () => {
      const midi = noteToMidi(Note.C_FLAT, 4);
      const spelling = midiToSpelling(midi);
      expect(spelling.note.letter).toBe("B");
      expect(spelling.octave).toBe(3);
    });
  });
});

// ============================================================================
// MidiChord - HARMONIC representation (stable voice slots, analysis metadata)
//
// This is the internal representation for voice leading analysis.
// Voices maintain stable identity across chord sequence.
// Use toPerformanceOutput() to get synth-ready format.
// ============================================================================

describe("MidiChord (harmonic representation)", () => {
  test("bass is separate from voices", () => {
    const result = renderChordSequence(
      [{ root: Note.C, quality: "maj" }],
      { baseOctave: 4 }
    );

    expect(typeof result[0].bass).toBe("number");
    expect(Array.isArray(result[0].voices)).toBe(true);
  });

  test("voices are stable slots (not necessarily sorted)", () => {
    const result = renderChordSequence(
      [{ root: Note.C, quality: "maj7" }],
      { baseOctave: 4, voicing: "close" }
    );

    // 4 voices for maj7
    expect(result[0].voices).toHaveLength(4);
  });

  test("spec reference preserved for debugging", () => {
    const spec: ChordSpec = { root: Note.C, quality: "maj" };
    const result = renderChordSequence([spec], { baseOctave: 4 });
    expect(result[0].spec).toEqual(spec);
  });

  test("analysis shows omitted tones when maxVoices < chord tones", () => {
    const result = voiceLead(
      [{ root: Note.C, quality: "maj7" }], // 4 tones
      { baseOctave: 4, maxVoices: 3 }
    );

    expect(result[0].analysis).toBeDefined();
    expect(result[0].analysis!.omitted).toContain("5"); // 5th typically omitted
  });

  test("analysis shows doubled tones when maxVoices > chord tones", () => {
    const result = voiceLead(
      [{ root: Note.C, quality: "maj" }], // 3 tones
      { baseOctave: 4, maxVoices: 4 }
    );

    expect(result[0].analysis).toBeDefined();
    expect(result[0].analysis!.doubled).toBeDefined();
    expect(result[0].analysis!.doubled!.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// toPerformanceOutput - convert harmonic → synth-ready format
//
// This is the MAIN OUTPUT for driving a synthesizer.
// Returns flat number[] sorted low→high, ready to send as note-ons.
// ============================================================================

describe("toPerformanceOutput", () => {
  describe("basic output format", () => {
    test("returns notes as flat number[] sorted low to high", () => {
      const harmonic = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );
      const perf = toPerformanceOutput(harmonic);

      expect(perf).toHaveLength(1);
      expect(Array.isArray(perf[0].notes)).toBe(true);

      // Sorted low to high
      for (let i = 0; i < perf[0].notes.length - 1; i++) {
        expect(perf[0].notes[i]).toBeLessThan(perf[0].notes[i + 1]!);
      }
    });

    test("bass is included as lowest note", () => {
      const harmonic = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );
      const perf = toPerformanceOutput(harmonic);

      // C3 bass + C4, E4, G4
      expect(perf[0].notes).toEqual([48, 60, 64, 67]);
    });

    test("slash chord bass included correctly", () => {
      const harmonic = renderChordSequence(
        [{ root: Note.C, quality: "maj", bass: Note.E }],
        { baseOctave: 4 }
      );
      const perf = toPerformanceOutput(harmonic);

      // E3 bass + C4, E4, G4
      expect(perf[0].notes).toEqual([52, 60, 64, 67]);
    });
  });

  describe("chord voicings", () => {
    test("close voicing", () => {
      const harmonic = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4, voicing: "close" }
      );
      const perf = toPerformanceOutput(harmonic);

      // Bass C3 + close voicing C4, E4, G4, B4
      expect(perf[0].notes).toEqual([48, 60, 64, 67, 71]);
    });

    test("drop2 voicing", () => {
      const harmonic = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4, voicing: "drop2" }
      );
      const perf = toPerformanceOutput(harmonic);

      // Bass C3 + drop2: G3, C4, E4, B4 (sorted)
      expect(perf[0].notes).toEqual([48, 55, 60, 64, 71]);
    });

    test("drop3 voicing", () => {
      const harmonic = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4, voicing: "drop3" }
      );
      const perf = toPerformanceOutput(harmonic);

      // Bass C3 + drop3: E3, C4, G4, B4 (sorted)
      expect(perf[0].notes).toEqual([48, 52, 60, 67, 71]);
    });
  });

  describe("velocity support", () => {
    test("default velocity is 100", () => {
      const harmonic = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );
      const perf = toPerformanceOutput(harmonic);

      expect(perf[0].velocity).toBe(100);
    });

    test("custom velocity per chord", () => {
      const harmonic = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );
      const perf = toPerformanceOutput(harmonic, { velocity: 80 });

      expect(perf[0].velocity).toBe(80);
    });

    test("velocity array for per-note control", () => {
      const harmonic = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );
      const perf = toPerformanceOutput(harmonic, {
        velocities: [60, 80, 90, 100], // bass, root, 3rd, 5th
      });

      expect(perf[0].velocities).toEqual([60, 80, 90, 100]);
    });
  });

  describe("timing support", () => {
    test("chords get sequential indices by default", () => {
      const harmonic = renderChordSequence(
        [
          { root: Note.C, quality: "maj" },
          { root: Note.F, quality: "maj" },
          { root: Note.G, quality: "maj" },
        ],
        { baseOctave: 4 }
      );
      const perf = toPerformanceOutput(harmonic);

      expect(perf[0].index).toBe(0);
      expect(perf[1].index).toBe(1);
      expect(perf[2].index).toBe(2);
    });

    test("custom start times (beats)", () => {
      const harmonic = renderChordSequence(
        [
          { root: Note.C, quality: "maj" },
          { root: Note.F, quality: "maj" },
        ],
        { baseOctave: 4 }
      );
      const perf = toPerformanceOutput(harmonic, {
        startTimes: [0, 2.5], // beats
      });

      expect(perf[0].startBeat).toBe(0);
      expect(perf[1].startBeat).toBe(2.5);
    });

    test("custom durations (beats)", () => {
      const harmonic = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );
      const perf = toPerformanceOutput(harmonic, { duration: 2 });

      expect(perf[0].durationBeats).toBe(2);
    });
  });

  describe("MIDI channel", () => {
    test("default channel is 1", () => {
      const harmonic = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );
      const perf = toPerformanceOutput(harmonic);

      expect(perf[0].channel).toBe(1);
    });

    test("custom channel", () => {
      const harmonic = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );
      const perf = toPerformanceOutput(harmonic, { channel: 10 });

      expect(perf[0].channel).toBe(10);
    });
  });
});

// ============================================================================
// renderChordSequence - basic voicing (no voice leading optimization)
// ============================================================================

describe("renderChordSequence", () => {
  describe("triads", () => {
    test("C major", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4 }
      );

      expect(result[0].bass).toBe(48); // C3
      expect(result[0].voices).toEqual([60, 64, 67]); // C4, E4, G4
    });

    test("Am", () => {
      const result = renderChordSequence(
        [{ root: Note.A, quality: "min" }],
        { baseOctave: 4 }
      );

      expect(result[0].bass).toBe(57); // A3
      expect(result[0].voices).toEqual([69, 72, 76]); // A4, C5, E5
    });

    test("F#m", () => {
      const result = renderChordSequence(
        [{ root: Note.F_SHARP, quality: "min" }],
        { baseOctave: 4 }
      );

      expect(result[0].bass).toBe(54); // F#3
      expect(result[0].voices).toEqual([66, 69, 73]); // F#4, A4, C#5
    });
  });

  describe("seventh chords", () => {
    test("Cmaj7", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4 }
      );

      expect(result[0].voices).toHaveLength(4);
      expect(result[0].voices).toEqual([60, 64, 67, 71]);
    });

    test("G7", () => {
      const result = renderChordSequence(
        [{ root: Note.G, quality: "7" }],
        { baseOctave: 3 }
      );

      expect(result[0].bass).toBe(43); // G2
      expect(result[0].voices).toEqual([55, 59, 62, 65]);
    });
  });

  describe("extended chords", () => {
    test("Dm9", () => {
      const result = renderChordSequence(
        [{ root: Note.D, quality: "min9" }],
        { baseOctave: 3 }
      );

      expect(result[0].voices).toHaveLength(5);
    });

    test("C13", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "13" }],
        { baseOctave: 3 }
      );

      expect(result[0].voices).toHaveLength(7);
    });
  });

  describe("bass configuration", () => {
    test("bassOctave option", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4, bassOctave: 2 }
      );

      expect(result[0].bass).toBe(36); // C2
    });

    test("slash chord bass", () => {
      const result = renderChordSequence(
        [{ root: Note.C, quality: "maj", bass: Note.E }],
        { baseOctave: 4 }
      );

      expect(result[0].bass).toBe(52); // E3
    });
  });
});

// ============================================================================
// voiceLead - sequence-aware voicing with stable voice identity
// ============================================================================

describe("voiceLead", () => {
  describe("voice stability", () => {
    test("voice count is constant (maxVoices)", () => {
      const result = voiceLead(
        [
          { root: Note.C, quality: "maj" },
          { root: Note.G, quality: "7" },
          { root: Note.C, quality: "maj7" },
        ],
        { baseOctave: 4, maxVoices: 4 }
      );

      expect(result[0].voices).toHaveLength(4);
      expect(result[1].voices).toHaveLength(4);
      expect(result[2].voices).toHaveLength(4);
    });

    test("voice indices represent same voice across chords", () => {
      const result = voiceLead(
        [
          { root: Note.C, quality: "maj" },
          { root: Note.A, quality: "min" },
        ],
        { baseOctave: 4, maxVoices: 3, keepCommonTones: true }
      );

      // Voice 0 (lowest upper voice) should move minimally
      const movement = Math.abs(result[1].voices[0]! - result[0].voices[0]!);
      expect(movement).toBeLessThanOrEqual(4);
    });
  });

  describe("common tone retention", () => {
    test("C to Am: C and E stay put", () => {
      const result = voiceLead(
        [
          { root: Note.C, quality: "maj" },
          { root: Note.A, quality: "min" },
        ],
        { baseOctave: 4, maxVoices: 3, keepCommonTones: true }
      );

      // Find C in chord 1
      const cIdx = result[0].voices.findIndex((n) => n % 12 === 0);
      // Same voice should have C in chord 2
      expect(result[1].voices[cIdx]! % 12).toBe(0);

      // Find E in chord 1
      const eIdx = result[0].voices.findIndex((n) => n % 12 === 4);
      // Same voice should have E in chord 2
      expect(result[1].voices[eIdx]! % 12).toBe(4);
    });
  });

  describe("minimal motion", () => {
    test("total voice movement is minimized", () => {
      const result = voiceLead(
        [
          { root: Note.C, quality: "maj" },
          { root: Note.F, quality: "maj" },
        ],
        { baseOctave: 4, maxVoices: 3 }
      );

      const totalMovement = result[0].voices.reduce(
        (sum, v, i) => sum + Math.abs(result[1].voices[i]! - v),
        0
      );

      expect(totalMovement).toBeLessThanOrEqual(6);
    });

    test("no voice jumps more than P5", () => {
      const result = voiceLead(
        [
          { root: Note.C, quality: "maj" },
          { root: Note.D, quality: "min" },
        ],
        { baseOctave: 4, maxVoices: 3 }
      );

      const maxJump = Math.max(
        ...result[0].voices.map((v, i) => Math.abs(result[1].voices[i]! - v))
      );
      expect(maxJump).toBeLessThanOrEqual(7);
    });
  });

  describe("tonePriority", () => {
    test("default: keeps 3rd and 7th, omits 5th", () => {
      const result = voiceLead(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4, maxVoices: 3 }
      );

      const pitchClasses = result[0].voices.map((n) => n % 12);
      expect(pitchClasses).toContain(4);  // E (3rd)
      expect(pitchClasses).toContain(11); // B (7th)
      expect(pitchClasses).not.toContain(7); // G (5th) omitted
    });

    test("custom: root + 5th (power chord)", () => {
      const result = voiceLead(
        [{ root: Note.C, quality: "maj7" }],
        { baseOctave: 4, maxVoices: 2, tonePriority: ["root", "5", "3", "7"] }
      );

      const pitchClasses = result[0].voices.map((n) => n % 12);
      expect(pitchClasses).toContain(0); // C
      expect(pitchClasses).toContain(7); // G
    });
  });

  describe("range constraints (upper voices only)", () => {
    test("minNote respected", () => {
      const result = voiceLead(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4, maxVoices: 3, minNote: 60 }
      );

      for (const note of result[0].voices) {
        expect(note).toBeGreaterThanOrEqual(60);
      }
    });

    test("maxNote respected", () => {
      const result = voiceLead(
        [{ root: Note.C, quality: "maj" }],
        { baseOctave: 4, maxVoices: 3, maxNote: 72 }
      );

      for (const note of result[0].voices) {
        expect(note).toBeLessThanOrEqual(72);
      }
    });
  });

  describe("bass strategies", () => {
    test("followRoot (default)", () => {
      const result = voiceLead(
        [
          { root: Note.C, quality: "maj" },
          { root: Note.G, quality: "maj" },
        ],
        { baseOctave: 4, maxVoices: 3, bassStrategy: "followRoot" }
      );

      expect(result[0].bass % 12).toBe(0); // C
      expect(result[1].bass % 12).toBe(7); // G
    });

    test("minimalMotion", () => {
      const result = voiceLead(
        [
          { root: Note.C, quality: "maj" },
          { root: Note.A, quality: "min" },
        ],
        { baseOctave: 4, maxVoices: 3, bassStrategy: "minimalMotion" }
      );

      const bassMovement = Math.abs(result[1].bass - result[0].bass);
      expect(bassMovement).toBeLessThanOrEqual(5);
    });

    test("slash chord overrides strategy", () => {
      const result = voiceLead(
        [
          { root: Note.C, quality: "maj" },
          { root: Note.C, quality: "maj", bass: Note.E },
        ],
        { baseOctave: 4, maxVoices: 3, bassStrategy: "followRoot" }
      );

      expect(result[0].bass % 12).toBe(0); // C
      expect(result[1].bass % 12).toBe(4); // E (slash overrides)
    });
  });

  describe("classic progressions", () => {
    test("ii-V-I", () => {
      const harmonic = voiceLead(
        [
          { root: Note.D, quality: "min7" },
          { root: Note.G, quality: "7" },
          { root: Note.C, quality: "maj7" },
        ],
        { baseOctave: 3, maxVoices: 4 }
      );

      expect(harmonic).toHaveLength(3);
      expect(harmonic.every((c) => c.voices.length === 4)).toBe(true);

      // Convert to performance and verify output
      const perf = toPerformanceOutput(harmonic);
      expect(perf.every((c) => c.notes.length === 5)).toBe(true); // bass + 4
    });

    test("I-IV-V-I cycles back", () => {
      const result = voiceLead(
        [
          { root: Note.C, quality: "maj" },
          { root: Note.F, quality: "maj" },
          { root: Note.G, quality: "maj" },
          { root: Note.C, quality: "maj" },
        ],
        { baseOctave: 4, maxVoices: 3 }
      );

      // First and last C should be identical or very close
      const drift = result[0].voices.reduce(
        (sum, v, i) => sum + Math.abs(result[3].voices[i]! - v),
        0
      );
      expect(drift).toBeLessThanOrEqual(6);
    });
  });
});

// ============================================================================
// Full pipeline test: ChordSpec → harmonic → performance
// ============================================================================

describe("full pipeline", () => {
  test("ChordSpec[] → voiceLead → toPerformanceOutput", () => {
    const specs: ChordSpec[] = [
      { root: Note.C, quality: "maj" },
      { root: Note.A, quality: "min" },
      { root: Note.F, quality: "maj" },
      { root: Note.G, quality: "7" },
    ];

    const harmonic = voiceLead(specs, { baseOctave: 4, maxVoices: 4 });
    const perf = toPerformanceOutput(harmonic, {
      velocity: 90,
      duration: 1,
      channel: 1,
    });

    expect(perf).toHaveLength(4);
    expect(perf.every((c) => c.velocity === 90)).toBe(true);
    expect(perf.every((c) => c.durationBeats === 1)).toBe(true);
    expect(perf.every((c) => c.channel === 1)).toBe(true);
    expect(perf.every((c) => c.notes.length === 5)).toBe(true); // bass + 4 voices
  });

  test("output is ready for synth: just notes[] per chord", () => {
    const specs: ChordSpec[] = [
      { root: Note.C, quality: "maj7" },
      { root: Note.F, quality: "maj7" },
    ];

    const harmonic = voiceLead(specs, { baseOctave: 3, maxVoices: 4 });
    const perf = toPerformanceOutput(harmonic);

    // This is what you send to the synth
    const synthInput = perf.map((c) => c.notes);

    expect(synthInput).toEqual([
      expect.arrayContaining([expect.any(Number)]),
      expect.arrayContaining([expect.any(Number)]),
    ]);

    // Each is sorted low to high
    for (const notes of synthInput) {
      for (let i = 0; i < notes.length - 1; i++) {
        expect(notes[i]).toBeLessThan(notes[i + 1]!);
      }
    }
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe("edge cases", () => {
  test("empty array", () => {
    const result = renderChordSequence([], { baseOctave: 4 });
    expect(result).toEqual([]);

    const perf = toPerformanceOutput([]);
    expect(perf).toEqual([]);
  });

  test("single chord", () => {
    const harmonic = voiceLead(
      [{ root: Note.C, quality: "maj" }],
      { baseOctave: 4, maxVoices: 3 }
    );
    const perf = toPerformanceOutput(harmonic);

    expect(perf).toHaveLength(1);
    expect(perf[0].notes).toHaveLength(4); // bass + 3
  });

  test("extreme octaves", () => {
    const low = renderChordSequence(
      [{ root: Note.C, quality: "maj" }],
      { baseOctave: 1 }
    );
    expect(low[0].bass).toBe(12); // C0

    const high = renderChordSequence(
      [{ root: Note.C, quality: "maj" }],
      { baseOctave: 7 }
    );
    expect(high[0].voices[0]).toBe(96); // C7
  });

  test("all MIDI values in valid range 0-127", () => {
    const harmonic = renderChordSequence(
      [{ root: Note.D_FLAT, quality: "dim7" }],
      { baseOctave: 4 }
    );
    const perf = toPerformanceOutput(harmonic);

    for (const note of perf[0].notes) {
      expect(note).toBeGreaterThanOrEqual(0);
      expect(note).toBeLessThanOrEqual(127);
    }
  });
});
