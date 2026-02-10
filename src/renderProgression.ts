import { voiceLead } from "./renderMidi";
import type {
  ChordEvent,
  Activation,
  ClipNote,
  RenderProgressionInput,
  RenderProgressionOutput,
} from "./schemas";

/**
 * Renders a chord progression with rhythmic activations into flat MIDI clip notes.
 *
 * Chords define harmonic state changes — each chord is active from its onset_time
 * until the next chord's onset_time. Activations are rhythmic triggers that stamp
 * whatever chord is active at that point.
 *
 * Voice leading is computed once across the chord sequence. Activations emit the
 * voiced MIDI pitches at each trigger point.
 */
export function renderChordProgression(
  input: RenderProgressionInput,
): RenderProgressionOutput {
  const {
    chords,
    activations,
    baseOctave = 4,
    maxVoices = 4,
    velocity = 100,
  } = input;

  if (chords.length === 0) {
    throw new Error("chords array must not be empty");
  }
  if (activations.length === 0) {
    throw new Error("activations array must not be empty");
  }

  // Sort by onset_time
  const sortedChords = [...chords].sort((a, b) => a.onset_time - b.onset_time);
  const sortedActivations = [...activations].sort(
    (a, b) => a.onset_time - b.onset_time,
  );

  // Validate no duplicate chord onset times
  for (let i = 1; i < sortedChords.length; i++) {
    if (sortedChords[i]!.onset_time === sortedChords[i - 1]!.onset_time) {
      throw new Error(
        `Duplicate chord onset_time: ${sortedChords[i]!.onset_time}`,
      );
    }
  }

  // Validate no activation fires before first chord
  const firstChordOnset = sortedChords[0]!.onset_time;
  if (sortedActivations[0]!.onset_time < firstChordOnset) {
    throw new Error(
      `Activation at ${sortedActivations[0]!.onset_time} fires before first chord at ${firstChordOnset} — no chord is active`,
    );
  }

  // Voice-lead the chord sequence
  const specs = sortedChords.map((c) => c.chord);
  const voicedChords = voiceLead(specs, { baseOctave, maxVoices });

  // For each activation, find the active chord and emit notes
  const notes: ClipNote[] = [];
  let chordIdx = 0;

  for (const activation of sortedActivations) {
    // Advance chordIdx to the last chord whose onset_time <= activation.onset_time
    while (
      chordIdx + 1 < sortedChords.length &&
      sortedChords[chordIdx + 1]!.onset_time <= activation.onset_time
    ) {
      chordIdx++;
    }

    const midiChord = voicedChords[chordIdx]!;
    // Combine bass + voices, deduplicate
    const allPitches = [...new Set([midiChord.bass, ...midiChord.voices])];

    for (const pitch of allPitches) {
      notes.push({
        pitch,
        start_time: activation.onset_time,
        duration: activation.duration,
        velocity,
      });
    }
  }

  // totalBeats = max of (last activation end, last chord onset)
  const lastActivationEnd =
    sortedActivations[sortedActivations.length - 1]!.onset_time +
    sortedActivations[sortedActivations.length - 1]!.duration;
  const lastChordOnset = sortedChords[sortedChords.length - 1]!.onset_time;
  const totalBeats = Math.max(lastActivationEnd, lastChordOnset);

  return { notes, totalBeats };
}
