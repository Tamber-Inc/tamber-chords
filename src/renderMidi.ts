import type { NoteName, Letter, Accidental } from "./noteName";
import { N, toPitchClass } from "./noteName";
import type { ChordSpec, ChordQuality } from "./buildChord";
import { buildChord } from "./buildChord";

// ============================================================================
// Types
// ============================================================================

export type SpellingStrategy = "sharps" | "flats";

export type MidiSpelling = {
  note: NoteName;
  octave: number;
};

export type VoiceAnalysis = {
  omitted?: string[];
  doubled?: string[];
};

export type MidiChord = {
  bass: number;
  voices: number[];
  spec: ChordSpec;
  analysis?: VoiceAnalysis;
};

export type PerformanceChord = {
  notes: number[];
  velocity: number;
  velocities?: number[];
  index: number;
  startBeat?: number;
  durationBeats?: number;
  channel: number;
};

export type PerformanceOutput = PerformanceChord;

export type VoicingType = "close" | "drop2" | "drop3";
export type TonePriorityDegree = "root" | "3" | "5" | "7" | "9" | "11" | "13";
export type BassStrategy = "followRoot" | "minimalMotion";

export type RenderOptions = {
  baseOctave: number;
  bassOctave?: number;
  voicing?: VoicingType;
};

export type VoiceLeadOptions = {
  baseOctave: number;
  maxVoices?: number;
  keepCommonTones?: boolean;
  tonePriority?: TonePriorityDegree[];
  minNote?: number;
  maxNote?: number;
  bassOctave?: number;
  bassStrategy?: BassStrategy;
};

export type PerformanceOptions = {
  velocity?: number;
  velocities?: number[];
  startTimes?: number[];
  duration?: number;
  channel?: number;
};

// ============================================================================
// Constants
// ============================================================================

const LETTER_TO_SEMITONE: Record<Letter, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

// Canonical spellings for each pitch class using sharps
const SHARP_SPELLINGS: NoteName[] = [
  N("C", 0),  // 0
  N("C", 1),  // 1
  N("D", 0),  // 2
  N("D", 1),  // 3
  N("E", 0),  // 4
  N("F", 0),  // 5
  N("F", 1),  // 6
  N("G", 0),  // 7
  N("G", 1),  // 8
  N("A", 0),  // 9
  N("A", 1),  // 10
  N("B", 0),  // 11
];

// Canonical spellings for each pitch class using flats
const FLAT_SPELLINGS: NoteName[] = [
  N("C", 0),  // 0
  N("D", -1), // 1
  N("D", 0),  // 2
  N("E", -1), // 3
  N("E", 0),  // 4
  N("F", 0),  // 5
  N("G", -1), // 6
  N("G", 0),  // 7
  N("A", -1), // 8
  N("A", 0),  // 9
  N("B", -1), // 10
  N("B", 0),  // 11
];

// Default priority for tone selection when we have more/fewer voices than tones
const DEFAULT_TONE_PRIORITY: TonePriorityDegree[] = [
  "root", "3", "7", "9", "11", "13", "5",
];

// Degree string to interval degree number
const DEGREE_TO_INTERVAL: Record<TonePriorityDegree, number> = {
  root: 1, "3": 3, "5": 5, "7": 7, "9": 9, "11": 11, "13": 13,
};

// ============================================================================
// noteToMidi - pitch conversion
// ============================================================================

export function noteToMidi(note: NoteName, octave: number): number {
  const letterSemitone = LETTER_TO_SEMITONE[note.letter];
  // MIDI 12 = C0, 24 = C1, 36 = C2, 48 = C3, 60 = C4
  // Apply accidental directly (can cross octave boundaries: Cb4 = 59, B#4 = 72)
  return 12 + octave * 12 + letterSemitone + note.accidental;
}

// ============================================================================
// midiToSpelling - MIDI → canonical spelling
// ============================================================================

export function midiToSpelling(
  midi: number,
  strategy: SpellingStrategy = "sharps"
): MidiSpelling {
  // MIDI 12 = C0, so octave = floor((midi - 12) / 12)
  // But we need to be careful: pitch class is relative to C
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;

  const spellings = strategy === "sharps" ? SHARP_SPELLINGS : FLAT_SPELLINGS;
  const note = spellings[pitchClass]!;

  return { note, octave };
}

// ============================================================================
// Chord tone extraction helpers
// ============================================================================

function getChordTones(spec: ChordSpec): NoteName[] {
  const result = buildChord(spec);
  if (!result.ok) {
    throw new Error(`Failed to build chord: ${result.error.message}`);
  }
  return result.value.tones;
}

function getChordIntervalDegrees(quality: ChordQuality): number[] {
  const qualityToDegrees: Record<ChordQuality, number[]> = {
    maj: [1, 3, 5],
    min: [1, 3, 5],
    dim: [1, 3, 5],
    aug: [1, 3, 5],
    "7": [1, 3, 5, 7],
    maj7: [1, 3, 5, 7],
    min7: [1, 3, 5, 7],
    m7b5: [1, 3, 5, 7],
    dim7: [1, 3, 5, 7],
    "9": [1, 3, 5, 7, 9],
    maj9: [1, 3, 5, 7, 9],
    min9: [1, 3, 5, 7, 9],
    "11": [1, 3, 5, 7, 9, 11],
    maj11: [1, 3, 5, 7, 9, 11],
    min11: [1, 3, 5, 7, 9, 11],
    "13": [1, 3, 5, 7, 9, 11, 13],
    maj13: [1, 3, 5, 7, 9, 11, 13],
    min13: [1, 3, 5, 7, 9, 11, 13],
  };
  return qualityToDegrees[quality];
}

function degreeToString(degree: number): string {
  if (degree === 1) return "root";
  return degree.toString();
}

// ============================================================================
// Voicing helpers
// ============================================================================

function applyVoicing(voices: number[], voicing: VoicingType): number[] {
  if (voices.length < 4 || voicing === "close") {
    return voices;
  }

  const sorted = [...voices].sort((a, b) => a - b);

  if (voicing === "drop2") {
    // Drop the second-highest voice down an octave
    const secondHighestIdx = sorted.length - 2;
    sorted[secondHighestIdx] = sorted[secondHighestIdx]! - 12;
    return sorted.sort((a, b) => a - b);
  }

  if (voicing === "drop3") {
    // Drop the third-highest voice down an octave
    const thirdHighestIdx = sorted.length - 3;
    sorted[thirdHighestIdx] = sorted[thirdHighestIdx]! - 12;
    return sorted.sort((a, b) => a - b);
  }

  return voices;
}

// ============================================================================
// renderChordSequence - basic voicing (no voice leading)
// ============================================================================

export function renderChordSequence(
  specs: ChordSpec[],
  options: RenderOptions
): MidiChord[] {
  if (specs.length === 0) return [];

  const { baseOctave, bassOctave, voicing = "close" } = options;
  const effectiveBassOctave = bassOctave ?? baseOctave - 1;

  return specs.map((spec) => {
    const tones = getChordTones(spec);
    const bassNote = spec.bass ?? spec.root;
    const bass = noteToMidi(bassNote, effectiveBassOctave);

    // Stack tones upward from the root in baseOctave
    // Each tone should be >= the previous tone
    const voices: number[] = [];
    let currentFloor = noteToMidi(tones[0]!, baseOctave);

    for (const tone of tones) {
      let midi = noteToMidi(tone, baseOctave);
      // Ensure this note is at or above the current floor
      while (midi < currentFloor) {
        midi += 12;
      }
      voices.push(midi);
      currentFloor = midi;
    }

    // Apply voicing (drop2, drop3, etc.)
    const voicedVoices = applyVoicing(voices, voicing);

    return { bass, voices: voicedVoices, spec };
  });
}

// ============================================================================
// voiceLead - sequence-aware voicing with stable voice identity
// ============================================================================

function selectTones(
  allTones: NoteName[],
  allDegrees: number[],
  maxVoices: number,
  priority: TonePriorityDegree[]
): { tones: NoteName[]; degrees: number[]; omitted: string[]; doubled: string[] } {
  const priorityDegrees = priority.map((p) => DEGREE_TO_INTERVAL[p]);

  if (maxVoices >= allTones.length) {
    // We have room - maybe double some tones
    const tones = [...allTones];
    const degrees = [...allDegrees];
    const doubled: string[] = [];

    // Double tones from priority list until we fill maxVoices
    let i = 0;
    while (tones.length < maxVoices && i < priority.length) {
      const degreeToDouble = priorityDegrees[i]!;
      const idx = allDegrees.indexOf(degreeToDouble);
      if (idx !== -1) {
        tones.push(allTones[idx]!);
        degrees.push(allDegrees[idx]!);
        doubled.push(degreeToString(degreeToDouble));
      }
      i++;
    }

    return { tones, degrees, omitted: [], doubled };
  }

  // Need to omit some tones
  // Sort degrees by priority (lower priority = omit first)
  const degreesByPriority = [...allDegrees].sort((a, b) => {
    const aIdx = priorityDegrees.indexOf(a);
    const bIdx = priorityDegrees.indexOf(b);
    const aPrio = aIdx === -1 ? 999 : aIdx;
    const bPrio = bIdx === -1 ? 999 : bIdx;
    return aPrio - bPrio;
  });

  // Take the first maxVoices degrees
  const selectedDegrees = new Set(degreesByPriority.slice(0, maxVoices));
  const omittedDegrees = degreesByPriority.slice(maxVoices);

  const tones: NoteName[] = [];
  const degrees: number[] = [];

  for (let i = 0; i < allTones.length; i++) {
    if (selectedDegrees.has(allDegrees[i]!)) {
      tones.push(allTones[i]!);
      degrees.push(allDegrees[i]!);
    }
  }

  return {
    tones,
    degrees,
    omitted: omittedDegrees.map(degreeToString),
    doubled: [],
  };
}

function findOptimalAssignment(
  previousVoices: number[],
  targetPitchClasses: number[],
  minNote: number,
  maxNote: number,
  anchorCenter?: number
): number[] {
  // For each previous voice, find the closest target pitch class
  // Use a greedy assignment that minimizes total movement
  // IMPORTANT: Ensure no duplicate MIDI values in output
  // When costs are equal, prefer notes closer to anchorCenter to prevent drift

  const numVoices = previousVoices.length;
  const assignments: number[] = new Array(numVoices).fill(-1);
  const usedTargets = new Set<number>();
  const usedMidiNotes = new Set<number>();

  // Calculate anchor center from previous voices if not provided
  const center =
    anchorCenter ??
    previousVoices.reduce((a, b) => a + b, 0) / previousVoices.length;

  // Generate all possible target notes (all octaves in range) for each pitch class
  function getCandidates(pc: number): number[] {
    const candidates: number[] = [];
    for (let midi = minNote; midi <= maxNote; midi++) {
      if (midi % 12 === pc) {
        candidates.push(midi);
      }
    }
    return candidates;
  }

  // For each voice, find the best target
  type Move = {
    voiceIdx: number;
    targetIdx: number;
    midi: number;
    cost: number;
    drift: number;
  };
  const allMoves: Move[] = [];

  for (let v = 0; v < numVoices; v++) {
    const prevNote = previousVoices[v]!;
    for (let t = 0; t < targetPitchClasses.length; t++) {
      const pc = targetPitchClasses[t]!;
      for (const midi of getCandidates(pc)) {
        allMoves.push({
          voiceIdx: v,
          targetIdx: t,
          midi,
          cost: Math.abs(midi - prevNote),
          drift: Math.abs(midi - center), // Distance from center for tiebreaking
        });
      }
    }
  }

  // Sort by cost, then by drift (prefer notes closer to center when costs are equal)
  allMoves.sort((a, b) => {
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.drift - b.drift;
  });

  // Greedy assignment - ensure unique MIDI notes
  const assignedVoices = new Set<number>();

  for (const move of allMoves) {
    if (assignedVoices.has(move.voiceIdx)) continue;
    if (usedTargets.has(move.targetIdx)) continue;
    if (usedMidiNotes.has(move.midi)) continue; // Ensure unique MIDI

    assignments[move.voiceIdx] = move.midi;
    assignedVoices.add(move.voiceIdx);
    usedTargets.add(move.targetIdx);
    usedMidiNotes.add(move.midi);

    if (assignedVoices.size === numVoices) break;
  }

  // Handle any remaining voices (if targets < voices, need to double at different octave)
  for (let v = 0; v < numVoices; v++) {
    if (assignments[v] === -1) {
      // Find closest available target that's not already used
      const prevNote = previousVoices[v]!;
      let bestMidi = -1;
      let bestCost = Infinity;

      for (const pc of targetPitchClasses) {
        for (const midi of getCandidates(pc)) {
          if (usedMidiNotes.has(midi)) continue; // Must be unique
          const cost = Math.abs(midi - prevNote);
          if (cost < bestCost) {
            bestCost = cost;
            bestMidi = midi;
          }
        }
      }

      if (bestMidi !== -1) {
        assignments[v] = bestMidi;
        usedMidiNotes.add(bestMidi);
      } else {
        // Fallback: use the previous note if nothing available
        assignments[v] = prevNote;
      }
    }
  }

  return assignments;
}

function initializeVoices(
  pitchClasses: number[],
  numVoices: number,
  baseOctave: number,
  minNote: number,
  maxNote: number
): number[] {
  const voices: number[] = [];
  const usedMidi = new Set<number>();
  let currentFloor = 12 + baseOctave * 12;

  for (let i = 0; i < numVoices; i++) {
    const pc = pitchClasses[i % pitchClasses.length]!;
    // Find the lowest note with this pitch class at or above currentFloor
    let midi = currentFloor - (currentFloor % 12) + pc;
    if (midi < currentFloor) midi += 12;
    while (midi < minNote) midi += 12;
    while (midi > maxNote) midi -= 12;

    // Ensure unique MIDI note
    while (usedMidi.has(midi) && midi <= maxNote) {
      midi += 12;
    }
    if (midi > maxNote) {
      // Try going down instead
      midi = currentFloor - (currentFloor % 12) + pc;
      while (usedMidi.has(midi) && midi >= minNote) {
        midi -= 12;
      }
    }

    voices.push(midi);
    usedMidi.add(midi);

    // For the next voice, floor is at least this note
    currentFloor = midi;
  }

  return voices;
}

export function voiceLead(
  specs: ChordSpec[],
  options: VoiceLeadOptions
): MidiChord[] {
  if (specs.length === 0) return [];

  const {
    baseOctave,
    maxVoices = 4,
    keepCommonTones = false,
    tonePriority = DEFAULT_TONE_PRIORITY,
    minNote = 0,
    maxNote = 127,
    bassOctave,
    bassStrategy = "followRoot",
  } = options;

  const effectiveBassOctave = bassOctave ?? baseOctave - 1;
  const results: MidiChord[] = [];
  let previousVoices: number[] | null = null;
  let previousBass: number | null = null;
  let anchorCenter: number | null = null; // Track initial voicing center

  for (const spec of specs) {
    const allTones = getChordTones(spec);
    const allDegrees = getChordIntervalDegrees(spec.quality);

    // Select which tones to use based on maxVoices
    const { tones, omitted, doubled } = selectTones(
      allTones,
      allDegrees,
      maxVoices,
      tonePriority
    );

    // Get pitch classes for the selected tones
    const pitchClasses = tones.map((t) => toPitchClass(t));

    // Determine bass
    let bass: number;
    const bassNote = spec.bass ?? spec.root;

    if (bassStrategy === "minimalMotion" && previousBass !== null && !spec.bass) {
      // Find closest bass note with same pitch class
      const bassPc = toPitchClass(bassNote);
      const prevPc = previousBass % 12;
      let diff = bassPc - prevPc;
      if (diff > 6) diff -= 12;
      if (diff < -6) diff += 12;
      bass = previousBass + diff;
    } else {
      bass = noteToMidi(bassNote, effectiveBassOctave);
    }

    // Voice lead the upper voices
    let voices: number[];

    if (previousVoices === null) {
      // First chord - initialize voices and set anchor center
      voices = initializeVoices(pitchClasses, maxVoices, baseOctave, minNote, maxNote);
      anchorCenter = voices.reduce((a, b) => a + b, 0) / voices.length;
    } else if (keepCommonTones) {
      // Keep common tones in place, move others minimally
      voices = new Array(maxVoices).fill(-1);
      const usedTargetIndices = new Set<number>();
      const usedMidiNotes = new Set<number>();

      // First pass: keep common tones
      for (let v = 0; v < maxVoices; v++) {
        const prevNote = previousVoices[v]!;
        const prevPc = prevNote % 12;

        // Check if this pitch class is in the target chord
        const targetIdx = pitchClasses.findIndex(
          (pc, idx) => pc === prevPc && !usedTargetIndices.has(idx)
        );

        if (targetIdx !== -1 && !usedMidiNotes.has(prevNote)) {
          // Common tone - keep it
          voices[v] = prevNote;
          usedTargetIndices.add(targetIdx);
          usedMidiNotes.add(prevNote);
        }
      }

      // Second pass: assign remaining voices with minimal motion
      const remainingVoices: number[] = [];
      const remainingTargets: number[] = [];

      for (let v = 0; v < maxVoices; v++) {
        if (voices[v] === -1) {
          remainingVoices.push(v);
        }
      }

      for (let t = 0; t < pitchClasses.length; t++) {
        if (!usedTargetIndices.has(t)) {
          remainingTargets.push(t);
        }
      }

      // Assign remaining targets to remaining voices by minimal motion
      if (remainingVoices.length > 0 && remainingTargets.length > 0) {
        const tempPrevVoices = remainingVoices.map((v) => previousVoices![v]!);
        const tempTargetPcs = remainingTargets.map((t) => pitchClasses[t]!);

        // Use custom assignment that respects usedMidiNotes
        for (let i = 0; i < remainingVoices.length && i < remainingTargets.length; i++) {
          const prevNote = tempPrevVoices[i]!;
          const pc = tempTargetPcs[i]!;

          let bestMidi = -1;
          let bestCost = Infinity;

          for (let midi = minNote; midi <= maxNote; midi++) {
            if (midi % 12 === pc && !usedMidiNotes.has(midi)) {
              const cost = Math.abs(midi - prevNote);
              if (cost < bestCost) {
                bestCost = cost;
                bestMidi = midi;
              }
            }
          }

          if (bestMidi !== -1) {
            voices[remainingVoices[i]!] = bestMidi;
            usedMidiNotes.add(bestMidi);
          }
        }
      }

      // Handle any remaining voices needing doubling
      for (let v = 0; v < maxVoices; v++) {
        if (voices[v] === -1) {
          const prevNote = previousVoices[v]!;
          let bestMidi = -1;
          let bestCost = Infinity;

          for (const pc of pitchClasses) {
            for (let midi = minNote; midi <= maxNote; midi++) {
              if (midi % 12 === pc && !usedMidiNotes.has(midi)) {
                const cost = Math.abs(midi - prevNote);
                if (cost < bestCost) {
                  bestCost = cost;
                  bestMidi = midi;
                }
              }
            }
          }

          if (bestMidi !== -1) {
            voices[v] = bestMidi;
            usedMidiNotes.add(bestMidi);
          } else {
            // Fallback: use previous note
            voices[v] = prevNote;
          }
        }
      }
    } else {
      // No common tone retention - just minimize total movement
      voices = findOptimalAssignment(
        previousVoices,
        pitchClasses,
        minNote,
        maxNote,
        anchorCenter ?? undefined
      );
    }

    const analysis: VoiceAnalysis = {};
    if (omitted.length > 0) {
      analysis.omitted = omitted;
    }
    if (doubled.length > 0) {
      analysis.doubled = doubled;
    }

    results.push({
      bass,
      voices,
      spec,
      analysis: Object.keys(analysis).length > 0 ? analysis : undefined,
    });

    previousVoices = voices;
    previousBass = bass;
  }

  return results;
}

// ============================================================================
// toPerformanceOutput - convert harmonic → synth-ready format
// ============================================================================

export function toPerformanceOutput(
  harmonic: MidiChord[],
  options?: PerformanceOptions
): PerformanceOutput[] {
  if (harmonic.length === 0) return [];

  const {
    velocity = 100,
    velocities,
    startTimes,
    duration,
    channel = 1,
  } = options ?? {};

  return harmonic.map((chord, index) => {
    // Combine bass and voices, then sort low to high
    const allNotes = [chord.bass, ...chord.voices];
    const notes = [...new Set(allNotes)].sort((a, b) => a - b);

    const perf: PerformanceChord = {
      notes,
      velocity,
      index,
      channel,
    };

    if (velocities) {
      perf.velocities = velocities;
    }

    if (startTimes && startTimes[index] !== undefined) {
      perf.startBeat = startTimes[index];
    }

    if (duration !== undefined) {
      perf.durationBeats = duration;
    }

    return perf;
  });
}
