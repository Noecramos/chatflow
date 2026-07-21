/**
 * Fail-Safe JSON Serialization and Parsing Utilities
 * Provides robust error handling around JSON operations without throwing uncaught SyntaxErrors.
 */

/**
 * Safely parse a JSON string or return a fallback value.
 * If input is already an object/array, returns it directly.
 * @param {string|any} input - Value to parse
 * @param {any} fallback - Fallback value if parsing fails or input is empty (default: {})
 * @returns {any} Parsed value or fallback
 */
function parseJson(input, fallback = {}) {
  if (input === null || input === undefined) {
    return fallback;
  }
  if (typeof input === 'object') {
    return input;
  }
  if (typeof input !== 'string') {
    return fallback;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    return JSON.parse(trimmed);
  } catch (err) {
    console.warn('[json-helpers] Parse warning:', err.message, '| Raw value:', trimmed.substring(0, 80));
    return fallback;
  }
}

/**
 * Safely stringify a value into JSON string.
 * @param {any} input - Value to stringify
 * @param {string} fallback - Fallback string if stringification fails (default: '{}')
 * @returns {string} JSON string
 */
function stringifyJson(input, fallback = '{}') {
  if (input === null || input === undefined) {
    return fallback;
  }
  if (typeof input === 'string') {
    return input;
  }

  try {
    return JSON.stringify(input);
  } catch (err) {
    console.warn('[json-helpers] Stringify warning:', err.message);
    return fallback;
  }
}

module.exports = {
  parseJson,
  stringifyJson
};
