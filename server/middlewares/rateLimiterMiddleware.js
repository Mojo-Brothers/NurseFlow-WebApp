/**
 * NurseFlow Enterprise HIS 2026 — Express Rate Limiter Middleware
 * Uses Redis Sliding Window Counter for Distributed Protection
 */

import { redisRateLimiterService } from '../services/redisRateLimiter.service.js';

export const rateLimiter = (maxRequests = 100, windowSeconds = 60) => {
  return (req, res, next) => {
    const identifier = req.user?.id || req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const rateCheck = redisRateLimiterService.checkLimit(identifier, maxRequests, windowSeconds);

    res.setHeader('X-RateLimit-Limit', rateCheck.totalLimit);
    res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
    res.setHeader('X-RateLimit-Reset', rateCheck.resetInSeconds);

    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        statusCode: 429,
        error: rateCheck.error,
        message: rateCheck.message,
        retryAfter: rateCheck.resetInSeconds
      });
    }

    next();
  };
};
