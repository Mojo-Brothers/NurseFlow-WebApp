/**
 * NurseFlow Enterprise HIS 2026 — Backend JWT & Session Auth Middleware
 * Supports both HTTP Bearer Authorization and Secure HttpOnly Cookie patterns.
 */

import { jwtSecurityService } from '../../src/core/security/jwtSecurity.service.js';

export const authenticateJwt = (req, res, next) => {
  let token = null;

  // 1. Check Bearer Authorization Header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Check Cookie Fallback
  if (!token && req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: 'UNAUTHORIZED',
      message: 'Sesi tidak valid atau otentikasi Bearer Token / Cookie diperlukan.'
    });
  }

  const verification = jwtSecurityService.verifyToken(token);
  if (!verification.valid) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: 'TOKEN_EXPIRED_OR_REVOKED',
      message: verification.error
    });
  }

  req.user = verification.payload;
  next();
};
