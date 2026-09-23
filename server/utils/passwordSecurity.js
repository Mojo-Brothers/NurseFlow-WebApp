/**
 * NurseFlow Enterprise HIS 2026 — Cryptographic Password Security Utility
 * Standards: OWASP ASVS 4.0, NIST SP 800-132, Constant-Time Comparison (Timing-Attack Resistant)
 * Protection: Parameter-Downgrade Resistant & Denial-of-Service (DoS) Invariant Guard
 * 
 * Storage Format:
 * scrypt$N=16384,r=8,p=1,maxmem=33554432$<salt_hex>$<derived_key_hex>
 */

import crypto from 'crypto';

export const SCRYPT_CONSTRAINTS = Object.freeze({
  MIN_N: 16384,
  MAX_N: 65536,
  MIN_R: 8,
  MAX_R: 16,
  MIN_P: 1,
  MAX_P: 4,
  MAX_MEM: 64 * 1024 * 1024, // 64 MB Max Memory Invariant
  MIN_SALT_BYTES: 16,        // Minimum 128-bit Salt
  MAX_SALT_BYTES: 64,        // Maximum 512-bit Salt
  EXPECTED_KEY_BYTES: 64,    // 512-bit Derived Key
  MAX_PASSWORD_LEN: 1024     // Max 1024 characters to prevent input buffer flooding DoS
});

const DEFAULT_SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024 // 32MB
};

const isPowerOfTwo = (n) => typeof n === 'number' && n > 0 && (n & (n - 1)) === 0;

// Pre-generated dummy hash for constant-time comparison on non-existent users
// Prevents user enumeration via response timing variance
const DUMMY_SALT = crypto.randomBytes(16).toString('hex');
const DUMMY_DERIVED = crypto.scryptSync(
  'NurseFlow_Constant_Time_Dummy_Password_Mitigation_2026!',
  Buffer.from(DUMMY_SALT, 'hex'),
  64,
  DEFAULT_SCRYPT_PARAMS
).toString('hex');
const DUMMY_HASH = `scrypt$N=${DEFAULT_SCRYPT_PARAMS.N},r=${DEFAULT_SCRYPT_PARAMS.r},p=${DEFAULT_SCRYPT_PARAMS.p},maxmem=${DEFAULT_SCRYPT_PARAMS.maxmem}$${DUMMY_SALT}$${DUMMY_DERIVED}`;

export const passwordSecurity = {
  /**
   * Hashes a plaintext password using Node.js native scrypt with a cryptographically secure 128-bit salt.
   * Parameter-encoded storage format:
   * scrypt$N=16384,r=8,p=1,maxmem=33554432$<salt_hex>$<derived_key_hex>
   */
  hashPassword: (plaintextPassword, customParams = {}) => {
    if (!plaintextPassword || typeof plaintextPassword !== 'string') {
      throw new Error('Password must be a non-empty string.');
    }
    if (plaintextPassword.length > SCRYPT_CONSTRAINTS.MAX_PASSWORD_LEN) {
      throw new Error(`Password length exceeds maximum allowed (${SCRYPT_CONSTRAINTS.MAX_PASSWORD_LEN} chars).`);
    }

    const params = { ...DEFAULT_SCRYPT_PARAMS, ...customParams };

    // Validate generation bounds
    if (params.N < SCRYPT_CONSTRAINTS.MIN_N || params.N > SCRYPT_CONSTRAINTS.MAX_N || !isPowerOfTwo(params.N)) {
      throw new Error(`Invalid scrypt N parameter (${params.N}). Must be a power of 2 between ${SCRYPT_CONSTRAINTS.MIN_N} and ${SCRYPT_CONSTRAINTS.MAX_N}.`);
    }

    // Minimal 128-bit (16 bytes) cryptographically random salt per credential
    const saltBuf = crypto.randomBytes(16);
    const saltHex = saltBuf.toString('hex');

    const derivedKey = crypto.scryptSync(plaintextPassword, saltBuf, 64, {
      N: params.N,
      r: params.r,
      p: params.p,
      maxmem: params.maxmem
    });

    const paramString = `N=${params.N},r=${params.r},p=${params.p},maxmem=${params.maxmem}`;
    return `scrypt$${paramString}$${saltHex}$${derivedKey.toString('hex')}`;
  },

  /**
   * Verifies a plaintext password against a stored scrypt hash using metadata-driven parameters
   * with strict DoS protection, parameter downgrade rejection, and constant-time buffer comparison.
   */
  verifyPassword: (plaintextPassword, storedHash) => {
    if (!plaintextPassword || !storedHash || typeof storedHash !== 'string' || typeof plaintextPassword !== 'string') {
      return false;
    }

    // Input length DoS guard
    if (plaintextPassword.length > SCRYPT_CONSTRAINTS.MAX_PASSWORD_LEN) {
      return false;
    }

    if (!storedHash.startsWith('scrypt$')) {
      return false;
    }

    const parts = storedHash.split('$');
    // Format with parameters: scrypt$params$salt$derivedKey (4 parts)
    // Legacy format: scrypt$salt$derivedKey (3 parts)
    let params = { ...DEFAULT_SCRYPT_PARAMS };
    let saltHex = '';
    let expectedKeyHex = '';

    if (parts.length === 4) {
      // Parse parameter string: N=16384,r=8,p=1,maxmem=33554432
      const paramParts = parts[1].split(',');
      for (const p of paramParts) {
        const [k, v] = p.split('=');
        if (k && v && !isNaN(Number(v))) {
          params[k] = Number(v);
        }
      }
      saltHex = parts[2];
      expectedKeyHex = parts[3];
    } else if (parts.length === 3) {
      // Backward compatibility fallback
      saltHex = parts[1];
      expectedKeyHex = parts[2];
    } else {
      return false;
    }

    if (!saltHex || !expectedKeyHex) {
      return false;
    }

    // ─── DoS & Parameter Downgrade Defense Invariants ───
    // 1. N parameter: Must be power of 2 and within [16384, 65536]
    if (!isPowerOfTwo(params.N) || params.N < SCRYPT_CONSTRAINTS.MIN_N || params.N > SCRYPT_CONSTRAINTS.MAX_N) {
      return false;
    }

    // 2. r parameter: Must be within [8, 16]
    if (params.r < SCRYPT_CONSTRAINTS.MIN_R || params.r > SCRYPT_CONSTRAINTS.MAX_R) {
      return false;
    }

    // 3. p parameter: Must be within [1, 4]
    if (params.p < SCRYPT_CONSTRAINTS.MIN_P || params.p > SCRYPT_CONSTRAINTS.MAX_P) {
      return false;
    }

    // 4. Memory limit: Max 64 MB
    if (params.maxmem > SCRYPT_CONSTRAINTS.MAX_MEM || params.maxmem <= 0) {
      return false;
    }

    try {
      const saltBuf = Buffer.from(saltHex, 'hex');
      const expectedKey = Buffer.from(expectedKeyHex, 'hex');

      // 5. Salt length: Minimum 16 bytes (128-bit), maximum 64 bytes
      if (saltBuf.length < SCRYPT_CONSTRAINTS.MIN_SALT_BYTES || saltBuf.length > SCRYPT_CONSTRAINTS.MAX_SALT_BYTES) {
        return false;
      }

      // 6. Expected key length: Must be exactly 64 bytes (512-bit)
      if (expectedKey.length !== SCRYPT_CONSTRAINTS.EXPECTED_KEY_BYTES) {
        return false;
      }

      const derivedKey = crypto.scryptSync(plaintextPassword, saltBuf, expectedKey.length, {
        N: params.N,
        r: params.r,
        p: params.p,
        maxmem: params.maxmem
      });

      if (derivedKey.length !== expectedKey.length) {
        return false;
      }

      return crypto.timingSafeEqual(derivedKey, expectedKey);
    } catch (err) {
      // Safely reject any malformed hex, invalid scrypt options, or memory limits
      return false;
    }
  },

  /**
   * Executes a constant-time dummy verification for unknown users to eliminate timing differences.
   */
  verifyDummyPassword: (plaintextPassword) => {
    return passwordSecurity.verifyPassword(plaintextPassword, DUMMY_HASH);
  }
};
