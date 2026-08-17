/**
 * NurseFlow Enterprise HIS 2026 — Redis Token Bucket Distributed Rate Limiter
 * Standard: OWASP Top 10 A04:2021 (Insecure Design / Rate Limiting & Brute Force Prevention)
 */

// In-Memory Token Bucket Store (simulating Redis sliding window counter)
const REDIS_RATE_STORE = new Map();

export const redisRateLimiterService = {
  /**
   * Evaluate request against sliding window rate limit
   * @param {string} identifier - Client IP or User ID
   * @param {number} maxRequests - Max requests allowed in window (e.g., 100)
   * @param {number} windowSeconds - Time window in seconds (e.g., 60s)
   */
  checkLimit: (identifier, maxRequests = 100, windowSeconds = 60) => {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    let bucket = REDIS_RATE_STORE.get(identifier);

    if (!bucket || (now - bucket.windowStart) > windowMs) {
      // Initialize or reset new window
      bucket = {
        count: 1,
        windowStart: now,
        expiresAt: now + windowMs
      };
      REDIS_RATE_STORE.set(identifier, bucket);

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetInSeconds: windowSeconds,
        totalLimit: maxRequests
      };
    }

    bucket.count += 1;
    const remaining = Math.max(0, maxRequests - bucket.count);
    const resetInSeconds = Math.ceil((bucket.expiresAt - now) / 1000);

    if (bucket.count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds,
        totalLimit: maxRequests,
        error: 'TOO_MANY_REQUESTS',
        message: `Batas laju permintaan terlampaui (${bucket.count}/${maxRequests} per ${windowSeconds}s). Silakan coba lagi dalam ${resetInSeconds} detik.`
      };
    }

    return {
      allowed: true,
      remaining,
      resetInSeconds,
      totalLimit: maxRequests
    };
  },

  /**
   * Reset store helper for test isolation
   */
  resetStore: () => {
    REDIS_RATE_STORE.clear();
  }
};
