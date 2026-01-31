/**
 * Fuzz target for parseChord
 *
 * Highest priority - parses arbitrary user input strings into chord structures.
 */
const { parseChord } = require("../dist/index.js");

module.exports.fuzz = function(data) {
  const input = data.toString("utf-8");

  try {
    parseChord(input);
  } catch (e) {
    // ChordParseError is expected for invalid inputs
    if (e.name === "ChordParseError") {
      return;
    }
    // Any other error is a bug
    throw e;
  }
};
