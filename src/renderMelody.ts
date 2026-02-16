import { noteToMidi, midiToSpelling } from "./renderMidi";
import { parseNoteString } from "./parseNote";
import { isNoteInScale } from "./scales";
import type { ClipNote, NoteName } from "./schemas";

export type MelodicNoteEvent = {
  /** Note as string: "C4", "F#3", "Bb2" */
  note: string;
  /** Start position in beats (0-based within clip) */
  start_time: number;
  /** Duration in beats */
  duration: number;
  /** MIDI velocity 1-127 (default 100) */
  velocity?: number;
};

export type ScaleSpec = {
  root: NoteName;
  type: string;
};

export type RenderMelodicLineInput = {
  notes: MelodicNoteEvent[];
  scale?: ScaleSpec;
};

export type RenderMelodicLineOutput = {
  notes: ClipNote[];
  totalBeats: number;
  warnings: string[];
};

/**
 * Render a melodic line from note-name strings into MIDI clip notes.
 *
 * Accepts human-readable note strings ("C4", "F#3") and converts them
 * to MIDI pitches. Optionally validates against a scale, producing
 * warnings (not errors) for out-of-key notes — chromatic passing tones
 * are valid music.
 */
export function renderMelodicLine(
  input: RenderMelodicLineInput,
): RenderMelodicLineOutput {
  const { notes, scale } = input;

  if (notes.length === 0) {
    throw new Error("notes array must not be empty");
  }

  const clipNotes: ClipNote[] = [];
  const warnings: string[] = [];

  for (const event of notes) {
    const parsed = parseNoteString(event.note);
    const midi = noteToMidi(parsed.note, parsed.octave);

    if (midi < 0 || midi > 127) {
      throw new Error(
        `Note "${event.note}" produces MIDI pitch ${midi}, which is outside valid range 0-127`,
      );
    }

    // Scale validation — soft warnings only
    if (scale) {
      if (!isNoteInScale(parsed.note, scale.root, scale.type)) {
        const spelling = midiToSpelling(midi);
        const noteName = `${spelling.note.letter}${spelling.note.accidental === 1 ? "#" : spelling.note.accidental === -1 ? "b" : ""}${spelling.octave}`;
        warnings.push(`${noteName} is not in ${formatScaleRoot(scale.root)} ${scale.type}`);
      }
    }

    clipNotes.push({
      pitch: midi,
      start_time: event.start_time,
      duration: event.duration,
      velocity: event.velocity ?? 100,
    });
  }

  // totalBeats = end of last note
  const totalBeats = clipNotes.reduce(
    (max, n) => Math.max(max, n.start_time + n.duration),
    0,
  );

  return { notes: clipNotes, totalBeats, warnings };
}

function formatScaleRoot(root: NoteName): string {
  const acc = root.accidental === 1 ? "#" : root.accidental === -1 ? "b" : "";
  return `${root.letter}${acc}`;
}
