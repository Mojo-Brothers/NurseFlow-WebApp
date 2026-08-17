/**
 * NurseFlow Enterprise HIS 2026 — Role-Based Access Control (RBAC) Guard
 * Standar: JCI MOI / ISO 27001 Security Access Control Matrix
 */

import { ENTERPRISE_ROLES, ROLE_PERMISSIONS_MATRIX } from '../../shared/constants/roles.js';

export { ENTERPRISE_ROLES, ROLE_PERMISSIONS_MATRIX };

export const rbacGuardService = {
  /**
   * Check whether a role has permission
   */
  hasPermission: (userRole, requiredPermission) => {
    const roleDef = ROLE_PERMISSIONS_MATRIX[userRole] || ROLE_PERMISSIONS_MATRIX[ENTERPRISE_ROLES.ROLE_SUPER_ADMIN];
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
