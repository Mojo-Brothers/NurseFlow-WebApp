/**
 * NurseFlow Enterprise HIS 2026 — Backend JWT & Session Auth Middleware (RFC 7807 Standard)
 * Supports both HTTP Bearer Authorization and Secure HttpOnly Cookie patterns.
 */

import { jwtSecurityService } from '../../src/core/security/jwtSecurity.service.js';
import { PROBLEM_TYPES } from '../contracts/problemDetails.contract.js';

export const authenticateJwt = (req, res, next) => {
  let token = null;

  // 1. Check Bearer Authorization Header
  const authHeader = req.headers?.['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Check Cookie Fallback
  if (!token && req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;

  if (!token) {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Content-Type', 'application/problem+json');
      res.setHeader('X-Correlation-ID', correlationId);
    }
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: 'UNAUTHORIZED',
      type: PROBLEM_TYPES.AUTHENTICATION_ERROR,
      title: 'Authentication Required',
      status: 401,
      detail: 'Sesi tidak valid atau otentikasi Bearer Token / Cookie diperlukan.',
      message: 'Sesi tidak valid atau otentikasi Bearer Token / Cookie diperlukan.',
      instance: req.originalUrl || req.path,
      correlationId,
      code: 'AUTH_REQUIRED'
    });
  }

  const verification = jwtSecurityService.verifyToken(token);
  if (!verification.valid) {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Content-Type', 'application/problem+json');
      res.setHeader('X-Correlation-ID', correlationId);
    }
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: 'TOKEN_EXPIRED_OR_REVOKED',
      type: PROBLEM_TYPES.AUTHENTICATION_ERROR,
      title: 'Token Expired or Revoked',
      status: 401,
      detail: verification.error || 'Token autentikasi tidak valid atau telah kedaluwarsa.',
      message: verification.error || 'Token autentikasi tidak valid atau telah kedaluwarsa.',
      instance: req.originalUrl || req.path,
      correlationId,
      code: 'TOKEN_EXPIRED_OR_REVOKED'
    });
  }

  req.user = verification.payload;

  // Build authoritative server-side AuthorizationContext & validate tenant anti-spoofing
  try {
    if (verification.payload.tenantId) {
      req.tenantId = verification.payload.tenantId;
      req.tenant = Object.freeze({
        tenantId: verification.payload.tenantId,
        branchId: verification.payload.branchId || 'BRANCH-MAIN-CAMPUS',
        resolvedAt: new Date().toISOString()
      });
      if (typeof res.setHeader === 'function') {
        res.setHeader('X-Tenant-ID', verification.payload.tenantId);
      }
    }
    req.authContext = createAuthorizationContext(verification.payload, req);
  } catch (err) {
    if (err.code === 'TENANT_MISMATCH' || err.statusCode === 403) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/problem+json');
        res.setHeader('X-Correlation-ID', correlationId);
      }
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'TENANT_MISMATCH',
        type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
        title: 'Tenant Spoofing Detected',
        status: 403,
        detail: err.message,
        instance: req.originalUrl || req.path,
        correlationId,
        code: 'TENANT_MISMATCH'
      });
    }
  }

  return next();
};
