const crypto = require('crypto');

// Generate a random secure key once per server execution as a dev/test fallback.
// This ensures that even if no JWT_SECRET is configured, we never use a static
// hardcoded secret, preventing security scans like GitGuardian from triggering.
const fallbackSecret = crypto.randomBytes(32).toString('hex');

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  
  if (secret) {
    return secret;
  }
  
  // Enforce secure JWT configuration in production environments
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      "CRITICAL SECURITY ERROR: The 'JWT_SECRET' environment variable must be set in production!"
    );
  }
  
  // Safe runtime-randomized fallback for development/local testing
  console.warn(
    "⚠️ Warning: JWT_SECRET environment variable is missing. " +
    "A temporary randomized key has been generated for this session."
  );
  return fallbackSecret;
})();

module.exports = JWT_SECRET;
