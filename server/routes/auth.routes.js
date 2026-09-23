import { Router } from 'express';
import { jwtSecurityService } from '../../src/core/security/jwtSecurity.service.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { rateLimiter } from '../middlewares/rateLimiterMiddleware.js';
import { authService } from '../services/auth.service.js';
import { PROBLEM_TYPES } from '../contracts/problemDetails.contract.js';
import { respond } from '../utils/apiResponse.js';

const router = Router();

// POST /api/v1/auth/login — Canonical Database-Backed Authentication
// Rate limited to 10 requests per minute per IP to mitigate brute-force credential stuffing
router.post('/login', rateLimiter(10, 60), async (req, res) => {
  const { username, password } = req.body || {};
  const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;

  // 1. Authenticate against PostgreSQL 16 auth_users & master_staff
  const authResult = await authService.authenticateUser(username, password);

  if (!authResult.success) {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Content-Type', 'application/problem+json');
      res.setHeader('X-Correlation-ID', correlationId);
    }

    const problemType = authResult.statusCode === 423 
      ? PROBLEM_TYPES.RESOURCE_LOCKED 
      : PROBLEM_TYPES.AUTHENTICATION_ERROR;
    
    const problemTitle = authResult.statusCode === 423 
      ? 'Account Locked' 
      : 'Authentication Failed';

    return res.status(authResult.statusCode).json({
      success: false,
      statusCode: authResult.statusCode,
      error: authResult.error,
      type: problemType,
      title: problemTitle,
      status: authResult.statusCode,
      detail: authResult.message,
      message: authResult.message,
      instance: req.originalUrl || req.path,
      correlationId,
      code: authResult.error
    });
  }

  const { user } = authResult;

  // 2. Issue Authenticated JWT Token Pair with Database Identity Claims
  const tokenPair = jwtSecurityService.issueTokenPair({
    userId: user.id,
    username: user.username,
    role: user.role,
    roles: user.roles,
    staffId: user.staffId,
    tenantId: user.tenantId,
    fullName: user.fullName
  });

  // 3. Set HTTP-Only Secure Cookie
  if (res.cookie) {
    res.cookie('access_token', tokenPair.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });
  }

  // 4. Return Canonical User Profile & Session
  return res.json({
    success: true,
    message: 'Login Berhasil (Authenticated via PostgreSQL 16)',
    data: {
      userId: user.id,
      tenantId: user.tenantId,
      staffId: user.staffId,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      roles: user.roles,
      employeeNumber: user.employeeNumber,
      email: user.email,
      phone: user.phone,
      nik: user.nik,
      token: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      sessionId: tokenPair.sessionId
    }
  });
});

// POST /api/v1/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token wajib disertakan.' });
  }

  try {
    const newTokens = jwtSecurityService.rotateRefreshToken(refreshToken);
    return res.json({
      success: true,
      message: 'Token berhasil di-rotate (RTR Safe)',
      data: newTokens
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: err.message });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticateJwt, (req, res) => {
  const authHeader = req.headers?.['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    jwtSecurityService.revokeToken(authHeader.substring(7));
  }

  if (res.clearCookie) {
    res.clearCookie('access_token');
  }

  return respond.noContent(res);
});

// GET /api/v1/auth/me — Verified Database User Context
router.get('/me', authenticateJwt, async (req, res) => {
  const userId = req.user?.userId || req.user?.sub;
  if (userId) {
    const freshProfile = await authService.getUserProfile(userId);
    if (freshProfile) {
      return res.json({
        success: true,
        data: {
          ...req.user,
          ...freshProfile
        }
      });
    }
  }

  return res.json({
    success: true,
    data: req.user
  });
});

export default router;
