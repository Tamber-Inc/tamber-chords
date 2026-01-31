// String parsing (for human input)
export {
  parseChord,
  formatChord,
} from "./parseChord";

// Object-based API (for LLM tooling)
export {
  buildChord,
  validateChordSpec,
  chordPalette,
} from "./buildChord";

export type {
  ChordQuality,
  Tension,
  OmitDegree,
  ChordSpec,
  Key,
  PaletteOptions,
  Chord,
  ChordError,
  Result,
} from "./buildChord";

// Core primitives
export {
  Note,
  N,
  toPitchClass,
  ChordParseError,
} from "./noteName";

export type {
  NoteName,
  Letter,
  Accidental,
  TriadQuality,
  ChordType,
  Intervals,
  ParsedChord,
} from "./noteName";
