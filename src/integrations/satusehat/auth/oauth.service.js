/**
 * NurseFlow Enterprise HIS 2026 — SATUSEHAT OAuth2 Authentication Service
 * Standard: Kemkes RI SATUSEHAT OAuth2 Specification (RFC 6749)
 */

export class SatusehatAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SatusehatAuthError';
    this.statusCode = 401;
  }
}

let activeTokenCache = {
  accessToken: null,
  tokenType: 'Bearer',
  expiresAt: 0,
  issuedAt: 0
};

export const satusehatOAuthService = {
  /**
   * Acquire or reuse valid OAuth2 Access Token (TTL: 3600s, Refresh margin: 60s)
   */
  getValidToken: async (
    clientId = process.env.VITE_SATUSEHAT_CLIENT_ID || 'satusehat_client_id_sandbox',
    clientSecret = process.env.VITE_SATUSEHAT_CLIENT_SECRET || 'satusehat_client_secret_sandbox'
  ) => {
    const now = Date.now();

    // If cached and still valid (>60s before expiry), reuse cached token
    if (activeTokenCache.accessToken && now < activeTokenCache.expiresAt - 60000) {
      return {
        accessToken: activeTokenCache.accessToken,
        tokenType: activeTokenCache.tokenType,
        isCached: true,
        expiresInSeconds: Math.floor((activeTokenCache.expiresAt - now) / 1000)
      };
    }

    if (!clientId || !clientSecret) {
      throw new SatusehatAuthError('Client ID atau Client Secret SATUSEHAT tidak dikonfigurasi.');
    }

    // In Live Staging: POST https://api-satusehat-stg.kemkes.go.id/oauth2/v1/accesstoken
    const simulatedToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.satusehat_token_${Date.now()}`;
    const ttlSeconds = 3600;

    activeTokenCache = {
      accessToken: simulatedToken,
      tokenType: 'Bearer',
      expiresAt: now + (ttlSeconds * 1000),
      issuedAt: now
    };

    return {
      accessToken: activeTokenCache.accessToken,
      tokenType: activeTokenCache.tokenType,
      isCached: false,
      expiresInSeconds: ttlSeconds
    };
  },

  /**
   * Invalidate token cache for refresh testing
   */
  invalidateToken: () => {
    activeTokenCache = { accessToken: null, tokenType: 'Bearer', expiresAt: 0, issuedAt: 0 };
  }
};
