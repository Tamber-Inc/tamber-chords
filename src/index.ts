// String parsing (for human input)
export {
  parseChord,
  formatChord,
} from "./parseChord";

// Object-based API (for LLM tooling)
export {
  buildChord,
  buildChordSymbol,
  validateChordSpec,
  chordPalette,
} from "./buildChord";

// MIDI rendering
export {
  noteToMidi,
  midiToSpelling,
  renderChordSequence,
  voiceLead,
  toPerformanceOutput,
  transposeNote,
  transposeChords,
} from "./renderMidi";

export type { Result } from "./buildChord";

// Core primitives
export {
  Note,
  N,
  toPitchClass,
  ChordParseError,
} from "./noteName";

// Runtime type for Intervals (Map-based, not JSON-serializable)
export type { Intervals, ParsedChord } from "./noteName";

// ============================================================================
// Zod Schemas - for runtime validation
// ============================================================================

export {
  // Core primitives
  LetterSchema,
  AccidentalSchema,
  NoteNameSchema,
  // Chord qualities
  TriadQualitySchema,
  ChordTypeSchema,
  ChordQualitySchema,
  TensionSchema,
  OmitDegreeSchema,
  // Chord specifications
  ChordSpecSchema,
  KeySchema,
  KeyModeSchema,
  PaletteOptionsSchema,
  PaletteColorSchema,
  MaxExtensionSchema,
  ChordSchema,
  ChordErrorSchema,
  // Parsed chord (JSON representation)
  ParsedChordSchema,
  IntervalsJsonSchema,
  // MIDI / Rendering
  SpellingStrategySchema,
  MidiSpellingSchema,
  VoiceAnalysisSchema,
  MidiChordSchema,
  PerformanceChordSchema,
  VoicingTypeSchema,
  TonePriorityDegreeSchema,
  BassStrategySchema,
  RenderOptionsSchema,
  VoiceLeadOptionsSchema,
  PerformanceOptionsSchema,
  // Result helpers
  createResultSchema,
  ChordResultSchema,
  VoidResultSchema,
} from "./schemas";

// Types derived from schemas
export type {
  Letter,
  Accidental,
  NoteName,
  TriadQuality,
  ChordType,
  ChordQuality,
  Tension,
  OmitDegree,
  ChordSpec,
  Key,
  KeyMode,
  PaletteOptions,
  PaletteColor,
  MaxExtension,
  Chord,
  ChordError,
  ParsedChordJson,
  IntervalsJson,
  SpellingStrategy,
  MidiSpelling,
  VoiceAnalysis,
  MidiChord,
  PerformanceChord,
  PerformanceOutput,
  VoicingType,
  TonePriorityDegree,
  BassStrategy,
  RenderOptions,
  VoiceLeadOptions,
  PerformanceOptions,
  ChordResult,
  VoidResult,
} from "./schemas";
