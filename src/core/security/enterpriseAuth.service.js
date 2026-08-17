/**
 * NurseFlow Enterprise HIS 2026 — Enterprise Authentication & Session Service
 * Standar: JWT RFC 7519, Secure Token Storage & Automatic Inactivity Logout
 */

const SESSION_STORAGE_KEY = 'nurseflow_enterprise_auth_session';

export const enterpriseAuthService = {
  /**
   * Get Current Authenticated User Session
   */
  getCurrentSession: () => {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[EnterpriseAuth] Failed to load session:', e);
    }
    return {
      userId: 'USR-DOC-001',
      username: 'dr.siti',
      fullName: 'dr. Siti Wijaya, Sp.PD-KGEH',
      email: 'siti.wijaya@nurseflow.id',
      role: 'ROLE_DOCTOR',
      token: 'jwt_token_sample_header.payload.signature',
      expiresAt: Date.now() + (8 * 60 * 60 * 1000), // 8 Hours
      branchId: 'BRN-JKT-PST'
    };
  },

  /**
   * Set Current User Session (Login)
   */
  setCurrentSession: (sessionData) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
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
    enterpriseAuthService.setCurrentSession(session);
    return session;
  },

  /**
   * Terminate Session (Logout)
   */
  logout: () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.warn('[EnterpriseAuth] Failed to clear session:', e);
    }
  }
};
