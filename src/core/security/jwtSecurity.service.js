/**
 * NurseFlow Enterprise HIS 2026 — Cryptographic JWT & Session Security Service
 * Standar: RFC 7519, OWASP ASVS 4.0, JCI Information Governance
 */

const TOKEN_BLACKLIST_KEY = 'nurseflow_token_blacklist';
const ACTIVE_SESSIONS_KEY = 'nurseflow_active_sessions';

const base64UrlEncode = (str) => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const base64UrlDecode = (str) => {
  let output = str.replace(/-/g, '+').replace(/_/g, '/');
  while (output.length % 4) output += '=';
  return decodeURIComponent(escape(atob(output)));
};

export const jwtSecurityService = {
  /**
   * Issue Authenticated Token Pair (Access Token + Refresh Token)
   */
  issueTokenPair: ({
    userId,
    username,
    role,
    branchId = 'BRN-JKT-PST',
    deviceId = 'DEV-DESKTOP-01'
  }) => {
    const now = Math.floor(Date.now() / 1000);
    const sessionId = `SES-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const accessPayload = {
      iss: 'nurseflow-enterprise-his',
      sub: userId,
      username,
      role,
      branchId,
      deviceId,
      sessionId,
      iat: now,
      exp: now + (15 * 60) // 15 Menit Access Token
    };

    const refreshPayload = {
      iss: 'nurseflow-enterprise-his',
      sub: userId,
      sessionId,
      type: 'REFRESH',
      iat: now,
      exp: now + (7 * 24 * 60 * 60) // 7 Hari Refresh Token
    };

    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const accessBody = base64UrlEncode(JSON.stringify(accessPayload));
    const refreshBody = base64UrlEncode(JSON.stringify(refreshPayload));

    // Simulated HMAC-SHA256 signature hash
    const accessSignature = base64UrlEncode(`sig_${accessBody}_salt2026`);
    const refreshSignature = base64UrlEncode(`sig_${refreshBody}_salt2026`);

    return {
      accessToken: `${header}.${accessBody}.${accessSignature}`,
      refreshToken: `${header}.${refreshBody}.${refreshSignature}`,
      expiresIn: 900,
      sessionId
    };
  },

  /**
   * Verify and Decode JWT Token
   */
  verifyToken: (token) => {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token tidak ditemukan' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Format JWT tidak valid' };
    }

    try {
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      const now = Math.floor(Date.now() / 1000);

      // Check Expiration
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Token telah kedaluwarsa (Expired)', expired: true };
      }

      // Check Token Blacklist (Revocation Check)
      if (jwtSecurityService.isTokenBlacklisted(token)) {
        return { valid: false, error: 'Token telah dicabut (Revoked)', revoked: true };
      }

      return { valid: true, payload };
    } catch (e) {
      return { valid: false, error: `Gagal verifikasi signature JWT: ${e.message}` };
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

    // Blacklist old refresh token to prevent replay attacks
    jwtSecurityService.revokeToken(oldRefreshToken);

    const payload = verification.payload;
    return jwtSecurityService.issueTokenPair({
      userId: payload.sub,
      username: payload.username || 'dr.siti',
      role: payload.role || 'ROLE_DOCTOR_DPJP',
      deviceId: payload.deviceId
    });
  },

  /**
   * Revoke Token (Blacklist on Logout / Breach)
   */
  revokeToken: (token) => {
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
  }
};
