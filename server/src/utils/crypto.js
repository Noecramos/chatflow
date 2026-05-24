/**
 * Cryptographic Security Utility
 * Provides secure AES-256-CBC encryption/decryption of sensitive credentials
 * (Meta tokens, LLM keys, ERP connector credentials) isolated per Organization.
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const GLOBAL_SECRET = process.env.JWT_SECRET || 'chatvolt-super-secure-global-secret-key-32ch';

// Ensure the encryption key is exactly 32 bytes
function getSecretKey(orgId = '') {
  // Combine global key and organization UUID to isolate keying factors
  const combined = GLOBAL_SECRET + orgId;
  return crypto.createHash('sha256').update(combined).digest();
}

module.exports = {
  /**
   * Encrypt sensitive data
   */
  encrypt(text, orgId = '') {
    if (!text) return '';
    try {
      const iv = crypto.randomBytes(16);
      const key = getSecretKey(orgId);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return iv + ciphertext separated by colon
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (e) {
      console.error("Encryption failed:", e.message);
      throw new Error("Security Encryption error.");
    }
  },

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText, orgId = '') {
    if (!encryptedText) return '';
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) return encryptedText; // Fallback if data is stored unencrypted
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const key = getSecretKey(orgId);
      
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (e) {
      console.error("Decryption failed. Invalid credentials keying factors:", e.message);
      // Return empty or throw based on preference.
      // Returning empty is safer for forms display.
      return '';
    }
  }
};
