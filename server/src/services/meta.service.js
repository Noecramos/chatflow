/**
 * Meta Omnichannel Service Wrapper
 * Forwards calls directly to meta.js to prevent code duplication and split-brain issues.
 */
const meta = require('./meta');
module.exports = meta;
