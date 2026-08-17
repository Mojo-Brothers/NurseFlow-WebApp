/**
 * NurseFlow Enterprise HIS 2026 — Enterprise Authentication & Session Service
 * Standar: JWT RFC 7519, Secure Token Storage & Automatic Inactivity Logout
 */

import { jwtSecurityService } from './jwtSecurity.service.js';
import { ENTERPRISE_ROLES } from '../../shared/constants/roles.js';

const SESSION_STORAGE_KEY = 'nurseflow_enterprise_auth_session';

export const enterpriseAuthService = {
  /**
   * Get Current Authenticated User Session
   */
  getCurrentSession: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          const check = jwtSecurityService.verifyToken(session.token);
          if (check.valid) return session;
        }
      }
    } catch (e) {
      console.warn('[EnterpriseAuth] Failed to load session:', e);
    }

    // Default Seed Session with Valid Cryptographic JWT
    const tokenPair = jwtSecurityService.issueTokenPair({
      userId: 'USR-DOC-001',
      username: 'dr.siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    });

    const defaultSession = {
      userId: 'USR-DOC-001',
      username: 'dr.siti',
      fullName: 'dr. Siti Wijaya, Sp.PD-KGEH',
      email: 'siti.wijaya@nurseflow.id',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
      token: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      sessionId: tokenPair.sessionId,
      branchId: 'BRN-JKT-PST'
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(defaultSession));
      } catch (_) {}
    }

    return defaultSession;
  },

  /**
   * Set Current User Session (Login)
   */
  setCurrentSession: (sessionData) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      }
    } catch (e) {
      console.warn('[EnterpriseAuth] Failed to save session:', e);
    }
  },

  /**
   * Switch User Role (for Dev & Multi-role simulation)
   */
  switchRole: (newRole) => {
    const session = enterpriseAuthService.getCurrentSession();
    session.role = newRole;
    const tokenPair = jwtSecurityService.issueTokenPair({
      userId: session.userId,
      username: session.username,
      role: newRole
    });
    session.token = tokenPair.accessToken;
    session.refreshToken = tokenPair.refreshToken;
    session.sessionId = tokenPair.sessionId;

    enterpriseAuthService.setCurrentSession(session);
    return session;
  },

  /**
   * Terminate Session (Logout)
   */
  logout: () => {
    try {
      const session = enterpriseAuthService.getCurrentSession();
      if (session.token) jwtSecurityService.revokeToken(session.token);
      if (session.refreshToken) jwtSecurityService.revokeToken(session.refreshToken);

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('[EnterpriseAuth] Failed to clear session:', e);
    }
  }
};
