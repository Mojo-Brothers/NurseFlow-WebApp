/**
 * NurseFlow Enterprise HIS 2026 — Cryptographic JWT & Session Security Service
 * Standards: RFC 7519, RFC 7515, OWASP ASVS 4.0, NIST SP 800-63B
 * Algorithm: Strictly HS256 (HMAC-SHA256) with Constant-Time Signature Verification
 */

import crypto from 'crypto';

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!secret || secret.trim() === '') {
      throw new Error('FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is strictly required in production.');
    }
    if (secret.length < 32) {
      throw new Error('FATAL CONFIGURATION ERROR: JWT_SECRET must be at least 32 characters in production.');
    }
    const lower = secret.toLowerCase();
    if (['nurseflow_enterprise_his_hmac_secret', 'secret', 'default', 'changeme', 'password'].some(p => lower.includes(p))) {
      throw new Error('FATAL CONFIGURATION ERROR: Insecure placeholder JWT_SECRET detected in production.');
    }
    return secret;
  }

  // Non-production fallback (development/test)
  return secret || 'NurseFlow_Enterprise_HIS_HMAC_Secret_2026_Secure_Key';
};

const TOKEN_BLACKLIST_KEY = 'nurseflow_token_blacklist';
const SERVER_TOKEN_BLACKLIST = new Set();

const base64UrlEncode = (str) => {
  return Buffer.from(str, 'utf8').toString('base64url');
};

const base64UrlDecode = (str) => {
  return Buffer.from(str, 'base64url').toString('utf8');
};

const signHmacSha256 = (data, secret) => {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
};

export const jwtSecurityService = {
  /**
   * Issue Authenticated Token Pair (Access Token + Refresh Token)
   */
  issueTokenPair: ({
    userId,
    username,
    role,
    roles = [],
    staffId = null,
    tenantId = null,
    fullName = null,
    branchId = 'BRN-JKT-PST',
    deviceId = 'DEV-DESKTOP-01'
  }) => {
    if (!userId) {
      throw new Error('userId is mandatory for token issuance');
    }

    const now = Math.floor(Date.now() / 1000);
    const sessionId = `SES-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const accessPayload = {
      iss: 'nurseflow-enterprise-his',
      sub: userId,
      userId,
      username,
      role: role || (roles.length > 0 ? roles[0] : 'ROLE_NURSE'),
      roles: roles.length > 0 ? roles : (role ? [role] : []),
      staffId,
      tenantId: tenantId || '10000000-0000-0000-0000-000000000001',
      fullName,
      branchId,
      deviceId,
      sessionId,
      iat: now,
      exp: now + (15 * 60) // 15 Menit Access Token
    };

    const refreshPayload = {
      iss: 'nurseflow-enterprise-his',
      sub: userId,
      userId,
      sessionId,
      type: 'REFRESH',
      iat: now,
      exp: now + (7 * 24 * 60 * 60) // 7 Hari Refresh Token
    };

    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const accessBody = base64UrlEncode(JSON.stringify(accessPayload));
    const refreshBody = base64UrlEncode(JSON.stringify(refreshPayload));

    // Real Cryptographic HMAC-SHA256 signature
    const secret = getJwtSecret();
    const accessSignature = signHmacSha256(`${header}.${accessBody}`, secret);
    const refreshSignature = signHmacSha256(`${header}.${refreshBody}`, secret);

    return {
      accessToken: `${header}.${accessBody}.${accessSignature}`,
      refreshToken: `${header}.${refreshBody}.${refreshSignature}`,
      expiresIn: 900,
      sessionId
    };
  },

  /**
   * Verify and Decode JWT Token with strict cryptographic checks:
   * - Strict HS256 algorithm enforcement
   * - Constant-time HMAC-SHA256 signature validation
   * - Token expiration and iat sanity
   * - Issuer validation
   * - Blacklist revocation check
   */
  verifyToken: (token, customSecret = null) => {
    const secret = customSecret || getJwtSecret();
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token tidak ditemukan' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Format JWT tidak valid' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // 1. Verify Header & Algorithm
    let header;
    try {
      header = JSON.parse(base64UrlDecode(headerB64));
    } catch {
      return { valid: false, error: 'Header JWT tidak dapat diurai' };
    }

    if (header.alg !== 'HS256') {
      return { valid: false, error: `Algoritma '${header.alg}' ditolak. Hanya HS256 yang diizinkan.` };
    }

    // 2. Cryptographic Signature Verification (Constant-Time)
    try {
      const expectedSignature = signHmacSha256(`${headerB64}.${payloadB64}`, secret);
      const providedSigBuf = Buffer.from(signatureB64, 'utf8');
      const expectedSigBuf = Buffer.from(expectedSignature, 'utf8');

      if (providedSigBuf.length !== expectedSigBuf.length || !crypto.timingSafeEqual(providedSigBuf, expectedSigBuf)) {
        return { valid: false, error: 'Signature JWT tidak valid atau telah dimodifikasi (Tampering Detected)' };
      }
    } catch (e) {
      return { valid: false, error: `Gagal verifikasi cryptographic signature: ${e.message}` };
    }

    // 3. Decode & Verify Claims
    try {
      const payload = JSON.parse(base64UrlDecode(payloadB64));
      const now = Math.floor(Date.now() / 1000);

      // Verify Issuer
      if (payload.iss !== 'nurseflow-enterprise-his') {
        return { valid: false, error: `Issuer token tidak valid: ${payload.iss}` };
      }

      // Verify Subject / UserId
      if (!payload.sub || !payload.userId || payload.sub !== payload.userId) {
        return { valid: false, error: 'Subject atau UserId tidak valid dalam token' };
      }

      // Check Expiration
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Token telah kedaluwarsa (Expired)', expired: true };
      }

      // Check Iat future anomaly
      if (payload.iat && payload.iat > now + 60) {
        return { valid: false, error: 'Waktu terbit token (iat) tidak valid (berada di masa depan)' };
      }

      // Check Token Blacklist (Revocation Check)
      if (jwtSecurityService.isTokenBlacklisted(token)) {
        return { valid: false, error: 'Token telah dicabut (Revoked)', revoked: true };
      }

      return { valid: true, payload };
    } catch (e) {
      return { valid: false, error: `Gagal mengurai payload JWT: ${e.message}` };
    }
  },

  /**
   * Rotate Refresh Token (Refresh Token Rotation - RTR)
   */
  rotateRefreshToken: (oldRefreshToken) => {
    const verification = jwtSecurityService.verifyToken(oldRefreshToken);
    if (!verification.valid) {
      throw new Error(`Refresh Token tidak valid: ${verification.error}`);
    }

    const payload = verification.payload;
    if (payload.type !== 'REFRESH') {
      throw new Error('Token yang diberikan bukan refresh token');
    }

    // Blacklist old refresh token to prevent replay attacks
    jwtSecurityService.revokeToken(oldRefreshToken);

    return jwtSecurityService.issueTokenPair({
      userId: payload.sub,
      username: payload.username || 'dr.siti.wijaya',
      role: payload.role || 'ROLE_DOCTOR_DPJP',
      deviceId: payload.deviceId
    });
  },

  /**
   * Revoke Token (Blacklist on Logout / Breach)
   */
  revokeToken: (token) => {
    if (!token || typeof token !== 'string') return;

    SERVER_TOKEN_BLACKLIST.add(token);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(TOKEN_BLACKLIST_KEY);
        const list = raw ? JSON.parse(raw) : [];
        list.push({ token, revokedAt: new Date().toISOString() });
        localStorage.setItem(TOKEN_BLACKLIST_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('[JwtSecurity] Revoke error:', e);
    }
  },

  isTokenBlacklisted: (token) => {
    if (!token) return false;
    if (SERVER_TOKEN_BLACKLIST.has(token)) return true;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(TOKEN_BLACKLIST_KEY);
        if (raw) {
          const list = JSON.parse(raw);
          return list.some(item => item.token === token);
        }
      }
    } catch (e) {
      console.warn('[JwtSecurity] Check blacklist error:', e);
    }
    return false;
  },

  /**
   * Clear blacklist (for test suite isolation)
   */
  clearBlacklist: () => {
    SERVER_TOKEN_BLACKLIST.clear();
  }
};
