import { z } from "zod";

// ============================================================================
// Core Primitives
// ============================================================================

export const LetterSchema = z.enum(["A", "B", "C", "D", "E", "F", "G"]);
export type Letter = z.infer<typeof LetterSchema>;

// -2 = double flat, -1 = flat, 0 = natural, 1 = sharp, 2 = double sharp
export const AccidentalSchema = z.union([
  z.literal(-2),
  z.literal(-1),
  z.literal(0),
  z.literal(1),
  z.literal(2),
]);
export type Accidental = z.infer<typeof AccidentalSchema>;

export const NoteNameSchema = z.object({
  letter: LetterSchema,
  accidental: AccidentalSchema,
});
export type NoteName = z.infer<typeof NoteNameSchema>;

// ============================================================================
// Chord Qualities
// ============================================================================

export const TriadQualitySchema = z.enum([
  "major",
  "minor",
  "diminished",
  "augmented",
  "sus2",
  "sus4",
  "power",
]);
export type TriadQuality = z.infer<typeof TriadQualitySchema>;

export const ChordTypeSchema = z.enum([
  "maj",
  "min",
  "dim",
  "aug",
  "5",
  "7",
  "maj7",
  "min7",
  "dim7",
  "m7b5",
  "9",
  "maj9",
  "min9",
  "11",
  "maj11",
  "min11",
]);
export type ChordType = z.infer<typeof ChordTypeSchema>;

export const ChordQualitySchema = z.enum([
  "maj",
  "min",
  "dim",
  "aug",
  "7",
  "maj7",
  "min7",
  "m7b5",
  "dim7",
  "9",
  "maj9",
  "min9",
  "11",
  "maj11",
  "min11",
  "13",
  "maj13",
  "min13",
]);
export type ChordQuality = z.infer<typeof ChordQualitySchema>;

export const TensionSchema = z.enum(["b9", "#9", "#11", "b13"]);
export type Tension = z.infer<typeof TensionSchema>;

export const OmitDegreeSchema = z.enum(["3", "5"]);
export type OmitDegree = z.infer<typeof OmitDegreeSchema>;

// ============================================================================
// Chord Specifications
// ============================================================================

export const ChordSpecSchema = z.object({
  root: NoteNameSchema,
  quality: ChordQualitySchema,
  tensions: z.array(TensionSchema).optional(),
  omit: z.array(OmitDegreeSchema).optional(),
  bass: NoteNameSchema.optional(),
});
export type ChordSpec = z.infer<typeof ChordSpecSchema>;

export const KeyModeSchema = z.enum(["major", "minor"]);
export type KeyMode = z.infer<typeof KeyModeSchema>;

export const KeySchema = z.object({
  root: NoteNameSchema,
  mode: KeyModeSchema,
});
export type Key = z.infer<typeof KeySchema>;

export const PaletteColorSchema = z.enum(["triad", "seventh", "extended"]);
export type PaletteColor = z.infer<typeof PaletteColorSchema>;

export const MaxExtensionSchema = z.union([
  z.literal(7),
  z.literal(9),
  z.literal(11),
  z.literal(13),
]);
export type MaxExtension = z.infer<typeof MaxExtensionSchema>;

export const PaletteOptionsSchema = z.object({
  color: PaletteColorSchema.optional(),
  maxExtension: MaxExtensionSchema.optional(),
  includeDominants: z.boolean().optional(),
  includeBorrowed: z.boolean().optional(),
});
export type PaletteOptions = z.infer<typeof PaletteOptionsSchema>;

export const ChordSchema = z.object({
  symbol: z.string(),
  tones: z.array(NoteNameSchema),
  bass: NoteNameSchema.optional(),
});
export type Chord = z.infer<typeof ChordSchema>;

export const ChordErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type ChordError = z.infer<typeof ChordErrorSchema>;

// ============================================================================
// Parsed Chord (from string parsing)
// ============================================================================

// Note: Intervals is a Map<number, Accidental> - Maps don't serialize to JSON
// For validation purposes, we provide a schema for the JSON representation
export const IntervalsJsonSchema = z.record(z.string(), AccidentalSchema);
export type IntervalsJson = z.infer<typeof IntervalsJsonSchema>;

export const ParsedChordSchema = z.object({
  input: z.string(),
  root: NoteNameSchema,
  bass: NoteNameSchema,
  triadQuality: TriadQualitySchema,
  chordType: ChordTypeSchema,
  // intervals: stored as Map at runtime, but this schema is for JSON serialization
  tones: z.array(NoteNameSchema),
});
export type ParsedChordJson = z.infer<typeof ParsedChordSchema>;

// ============================================================================
// MIDI / Rendering Types
// ============================================================================

export const SpellingStrategySchema = z.enum(["sharps", "flats"]);
export type SpellingStrategy = z.infer<typeof SpellingStrategySchema>;

export const MidiSpellingSchema = z.object({
  note: NoteNameSchema,
  octave: z.number().int(),
});
export type MidiSpelling = z.infer<typeof MidiSpellingSchema>;

export const VoiceAnalysisSchema = z.object({
  omitted: z.array(z.string()).optional(),
  doubled: z.array(z.string()).optional(),
});
export type VoiceAnalysis = z.infer<typeof VoiceAnalysisSchema>;

export const MidiChordSchema = z.object({
  bass: z.number().int(),
  voices: z.array(z.number().int()),
  spec: ChordSpecSchema,
  analysis: VoiceAnalysisSchema.optional(),
});
export type MidiChord = z.infer<typeof MidiChordSchema>;

export const PerformanceChordSchema = z.object({
  notes: z.array(z.number().int()),
  velocity: z.number().int().min(0).max(127),
  velocities: z.array(z.number().int().min(0).max(127)).optional(),
  index: z.number().int().min(0),
  startBeat: z.number().optional(),
  durationBeats: z.number().optional(),
  channel: z.number().int().min(1).max(16),
});
export type PerformanceChord = z.infer<typeof PerformanceChordSchema>;

export type PerformanceOutput = PerformanceChord;

export const VoicingTypeSchema = z.enum(["close", "drop2", "drop3"]);
export type VoicingType = z.infer<typeof VoicingTypeSchema>;

export const TonePriorityDegreeSchema = z.enum([
  "root",
  "3",
  "5",
  "7",
  "9",
  "11",
  "13",
]);
export type TonePriorityDegree = z.infer<typeof TonePriorityDegreeSchema>;

export const BassStrategySchema = z.enum(["followRoot", "minimalMotion"]);
export type BassStrategy = z.infer<typeof BassStrategySchema>;

export const RenderOptionsSchema = z.object({
  baseOctave: z.number().int(),
  bassOctave: z.number().int().optional(),
  voicing: VoicingTypeSchema.optional(),
});
export type RenderOptions = z.infer<typeof RenderOptionsSchema>;

export const VoiceLeadOptionsSchema = z.object({
  baseOctave: z.number().int(),
  maxVoices: z.number().int().min(1).optional(),
  keepCommonTones: z.boolean().optional(),
  tonePriority: z.array(TonePriorityDegreeSchema).optional(),
  minNote: z.number().int().min(0).max(127).optional(),
  maxNote: z.number().int().min(0).max(127).optional(),
  bassOctave: z.number().int().optional(),
  bassStrategy: BassStrategySchema.optional(),
});
export type VoiceLeadOptions = z.infer<typeof VoiceLeadOptionsSchema>;

export const PerformanceOptionsSchema = z.object({
  velocity: z.number().int().min(0).max(127).optional(),
  velocities: z.array(z.number().int().min(0).max(127)).optional(),
  startTimes: z.array(z.number()).optional(),
  duration: z.number().optional(),
  channel: z.number().int().min(1).max(16).optional(),
});
export type PerformanceOptions = z.infer<typeof PerformanceOptionsSchema>;

// ============================================================================
// Result Type (discriminated union)
// ============================================================================

export function createResultSchema<T extends z.ZodType>(valueSchema: T) {
  return z.discriminatedUnion("ok", [
    z.object({ ok: z.literal(true), value: valueSchema }),
    z.object({ ok: z.literal(false), error: ChordErrorSchema }),
  ]);
}

// Common result schemas
export const ChordResultSchema = createResultSchema(ChordSchema);
export type ChordResult = z.infer<typeof ChordResultSchema>;

export const VoidResultSchema = createResultSchema(z.undefined());
export type VoidResult = z.infer<typeof VoidResultSchema>;
