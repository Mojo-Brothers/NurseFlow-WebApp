import { Router } from 'express';
import { jwtSecurityService } from '../../src/core/security/jwtSecurity.service.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { ENTERPRISE_ROLES } from '../../src/shared/constants/roles.js';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Mock Authentication Validation
  if (!username) {
    return res.status(400).json({ success: false, message: 'Username wajib diisi.' });
  }

  const tokenPair = jwtSecurityService.issueTokenPair({
    userId: 'USR-DOC-001',
    username: username || 'dr.siti',
    role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
  });

  // Set HTTP-Only Secure Cookie
  if (res.cookie) {
    res.cookie('access_token', tokenPair.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });
  }

  return res.json({
    success: true,
    message: 'Login Berhasil (Authenticated)',
    data: {
      userId: 'USR-DOC-001',
      username: username || 'dr.siti',
      fullName: 'dr. Siti Wijaya, Sp.PD-KGEH',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
      token: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      sessionId: tokenPair.sessionId
    }
  });
});

// POST /api/v1/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
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
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    jwtSecurityService.revokeToken(authHeader.substring(7));
  }

  if (res.clearCookie) {
    res.clearCookie('access_token');
  }

  return res.json({
    success: true,
    message: 'Sesi berhasil diakhiri dan token telah dicabut (Revoked).'
  });
});

// GET /api/v1/auth/me
router.get('/me', authenticateJwt, (req, res) => {
  return res.json({
    success: true,
    data: req.user
  });
});

export default router;
