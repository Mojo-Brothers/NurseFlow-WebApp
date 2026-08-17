/**
 * NurseFlow Enterprise HIS 2026 — Security Context & Multi-Branch Isolation Service
 * Enforces Row-Level Security (RLS) query filtering and token revocation / blacklist.
 */

export const securityContextService = {
  /**
   * Apply Row-Level Security (RLS) multi-branch data isolation
   */
  applyBranchIsolation: (records = [], userContext = {}) => {
    if (!userContext || userContext.role === 'SUPER_ADMIN') {
      return records; // Super Admin sees all branches
    }

    const userBranchId = userContext.branch_id;
    if (!userBranchId) return records;

    return records.filter(r => !r.branch_id || r.branch_id === userBranchId);
  },

  /**
   * Apply Department-Level Security
   */
  applyDepartmentIsolation: (records = [], userContext = {}) => {
    if (!userContext || ['SUPER_ADMIN', 'DIRECTOR'].includes(userContext.role)) {
      return records;
    }

    const userDeptId = userContext.department_id;
    if (!userDeptId) return records;

    return records.filter(r => !r.department_id || r.department_id === userDeptId);
  },

  /**
   * Revoke session and blacklist token
   */
  revokeSession: (tokenJti, revokedTokensList = []) => {
    const now = new Date().toISOString();
    return [
      ...revokedTokensList,
      {
        token_jti: tokenJti,
        revoked_at: now,
        reason: 'Revoked by user logout or concurrent login detected'
      }
    ];
  },

  /**
   * Check if token is blacklisted
   */
  isTokenRevoked: (tokenJti, revokedTokensList = []) => {
    return revokedTokensList.some(t => t.token_jti === tokenJti);
  }
};
