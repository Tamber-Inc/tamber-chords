/**
 * Fuzz target for parseChord
 *
 * This is the highest priority target - it parses arbitrary user input strings
 * into chord structures. Fuzzing will find:
 * - Crashes from unexpected input patterns
 * - Edge cases in regex parsing
 * - Invalid state transitions
 */
import { parseChord } from "../src/parseChord";
import { ChordParseError } from "../src/noteName";

module.exports.fuzz = function(data: Buffer) {
  const input = data.toString("utf-8");

  try {
    parseChord(input);
  } catch (e) {
    // ChordParseError is expected for invalid inputs - that's fine
    if (e instanceof ChordParseError) {
      return;
    }
    // Any other error is a bug we want to find
    throw e;
  }
};
