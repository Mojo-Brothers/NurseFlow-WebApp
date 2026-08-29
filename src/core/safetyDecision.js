/**
 * ============================================================================
 * 🏥 NURSEFLOW ENTERPRISE HIS 2026 — SAFETY DECISION CONTRACT
 * DOMAIN: CLINICAL SAFETY AUTHORIZATION & CRYPTOGRAPHIC COMMAND BINDING
 * STANDARDS: JCI 7TH ED (MMU.4, IPSG.1-2), RFC 8785 JSON CANONICALIZATION (JCS)
 * ============================================================================
 */

import crypto from 'crypto';

/**
 * Deterministic JSON Canonicalization (RFC 8785 JSON Canonicalization Scheme)
 * Sorts object keys recursively and formats numbers/strings deterministically.
 * @param {*} obj - Any JavaScript object, primitive, or array
 * @returns {string} Canonical JSON string
 */
export function canonicalStringify(obj) {
  if (obj === undefined) {
    return undefined;
  }
  if (obj === null) {
    return 'null';
  }
  if (typeof obj === 'boolean') {
    return obj ? 'true' : 'false';
  }
  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) {
      throw new TypeError('JCS (RFC 8785) forbids NaN, Infinity, or -Infinity');
    }
    // Handle -0 normalization per RFC 8785 Section 3.2.2.3
    if (Object.is(obj, -0)) {
      return '0';
    }
    return JSON.stringify(obj);
  }
  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalStringify(item) ?? 'null').join(',') + ']';
  }
  if (typeof obj === 'object') {
    // Sort keys strictly according to UTF-16 code unit values (RFC 8785 Section 3.2.3)
    const sortedKeys = Object.keys(obj)
      .filter(key => obj[key] !== undefined && typeof obj[key] !== 'function' && typeof obj[key] !== 'symbol')
      .sort((a, b) => {
        const minLen = Math.min(a.length, b.length);
        for (let i = 0; i < minLen; i++) {
          const codeA = a.charCodeAt(i);
          const codeB = b.charCodeAt(i);
          if (codeA !== codeB) return codeA - codeB;
        }
        return a.length - b.length;
      });

    const pairs = sortedKeys.map(key => `${JSON.stringify(key)}:${canonicalStringify(obj[key])}`);
    return '{' + pairs.join(',') + '}';
  }
  throw new TypeError(`JCS (RFC 8785) does not support type: ${typeof obj}`);
}

/**
 * Computes a deterministic SHA-256 hex digest for any command payload
 * @param {*} payload - Target mutation command parameters
 * @returns {string} SHA-256 hex string (64 characters)
 */
export function computeCommandHash(payload) {
  if (payload === undefined || payload === null) {
    payload = {};
  }
  const canonical = canonicalStringify(payload);

  if (typeof crypto !== 'undefined' && crypto.createHash) {
    return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
  }

  // Fallback SHA-256 Pure JS implementation for edge/browser environments
  return sha256Pure(canonical);
}

/**
 * Pure JS SHA-256 implementation conforming exactly to FIPS 180-4
 */
function sha256Pure(ascii) {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let compositeHash = 0;
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const s0 = ((w[j - 15] >>> 7) | (w[j - 15] << 25)) ^ ((w[j - 15] >>> 18) | (w[j - 15] << 14)) ^ (w[j - 15] >>> 3);
        const s1 = ((w[j - 2] >>> 17) | (w[j - 2] << 15)) ^ ((w[j - 2] >>> 19) | (w[j - 2] << 13)) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const S1 = ((hash[4] >>> 6) | (hash[4] << 26)) ^ ((hash[4] >>> 11) | (hash[4] << 21)) ^ ((hash[4] >>> 25) | (hash[4] << 7));
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + S1 + ch + k[j] + w[j]) | 0;
      const S0 = ((hash[0] >>> 2) | (hash[0] << 30)) ^ ((hash[0] >>> 13) | (hash[0] << 19)) ^ ((hash[0] >>> 22) | (hash[0] << 10));
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (S0 + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16 ? '0' : '') + b.toString(16));
    }
  }

  return result;
}

/**
 * Creates an immutable, cryptographically bound Safety Decision object
 * @param {Object} params
 * @param {string} params.patientId - Authoritative patient ID
 * @param {string} params.encounterId - Authoritative encounter ID
 * @param {string} params.actorId - Current authenticated actor/user ID
 * @param {string} params.actorRole - Current authenticated actor role (e.g. ROLE_DOCTOR_DPJP)
 * @param {string} params.action - Target clinical action (e.g. 'CPOE_ORDER_CANCEL', 'ALLERGY_OVERRIDE')
 * @param {string} params.riskType - Risk classification ('CRITICAL_OVERRIDE' | 'DESTRUCTIVE_ACTION')
 * @param {string} params.justification - Mandatory clinical rationale (min 5 chars)
 * @param {boolean} params.acknowledgment - Explicit acknowledgment of clinical risk
 * @param {Object} [params.targetPayload] - Target command payload for cryptographic binding
 * @param {string} [params.typedConfirmation] - Optional typed confirmation phrase
 * @param {string} [params.correlationId] - Tracing correlation ID
 * @param {string} [params.commandHash] - Explicit pre-calculated hash of the target payload
 * @param {number} [params.durationMinutes] - Validity duration (default: 15 minutes)
 * @returns {Object} Immutable Safety Decision object
 */
export function createSafetyDecision({
  patientId,
  encounterId,
  actorId,
  actorRole = 'ROLE_DOCTOR_DPJP',
  action = 'CLINICAL_ACTION',
  riskType = 'CRITICAL_OVERRIDE',
  justification,
  acknowledgment = true,
  targetPayload = null,
  typedConfirmation = null,
  correlationId = null,
  commandHash = null,
  durationMinutes = 15
}) {
  if (!patientId) throw new Error('Safety Decision Error: patientId is mandatory for context binding.');
  if (!encounterId) throw new Error('Safety Decision Error: encounterId is mandatory for context binding.');
  if (!actorId) throw new Error('Safety Decision Error: actorId is mandatory for accountability.');
  if (!justification || justification.trim().length < 5) {
    throw new Error('Safety Decision Error: Justification must be at least 5 characters.');
  }
  if (acknowledgment !== true) {
    throw new Error('Safety Decision Error: Risk acknowledgment must be explicitly true.');
  }

  const decisionId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? `SD-${crypto.randomUUID()}`
    : `SD-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const corrId = correlationId || (
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? `CORR-SD-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
      : `CORR-SD-${Date.now()}`
  );

  const calculatedCommandHash = commandHash || (targetPayload !== null ? computeCommandHash(targetPayload) : computeCommandHash({
    action,
    patientId: String(patientId).trim(),
    encounterId: String(encounterId).trim(),
    actorId: String(actorId).trim(),
    justification: String(justification).trim()
  }));

  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60000).toISOString();

  return Object.freeze({
    decisionId,
    patientId: String(patientId).trim(),
    encounterId: String(encounterId).trim(),
    actorId: String(actorId).trim(),
    actorRole: String(actorRole).trim(),
    action: String(action).trim(),
    riskType: String(riskType).trim(),
    justification: String(justification).trim(),
    acknowledgment: true,
    typedConfirmation: typedConfirmation ? String(typedConfirmation).trim() : null,
    createdAt: now.toISOString(),
    expiresAt,
    correlationId: corrId,
    commandHash: calculatedCommandHash,
    status: 'ISSUED'
  });
}
