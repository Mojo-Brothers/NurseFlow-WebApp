/**
 * NurseFlow Enterprise HIS 2026 — Role-Based Access Control (RBAC) Guard
 * Standards: JCI MOI / ISO 27001 Security Access Control Matrix
 */

import { ENTERPRISE_ROLES, ROLE_PERMISSIONS_MATRIX } from '../../shared/constants/roles.js';

export { ENTERPRISE_ROLES, ROLE_PERMISSIONS_MATRIX };

export const rbacGuardService = {
  /**
   * Check whether a role has permission against the SSOT matrix.
   * Never fallback to super admin on unknown role!
   */
  hasPermission: (userRole, requiredPermission) => {
    if (!userRole || typeof userRole !== 'string') return false;

    const roleDef = ROLE_PERMISSIONS_MATRIX[userRole];
    if (!roleDef) return false;
    if (roleDef.permissions.includes('*')) return true;
    return roleDef.permissions.includes(requiredPermission);
  },

  getAllRoles: () => Object.entries(ROLE_PERMISSIONS_MATRIX).map(([id, val]) => ({
    id,
    name: val.name,
    permissions: val.permissions
  }))
};
