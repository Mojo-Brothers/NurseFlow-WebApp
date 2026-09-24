/**
 * NurseFlow Enterprise HIS 2026 — Role-Based Access Control (RBAC) Guard
 * Standards: JCI MOI / ISO 27001 Security Access Control Matrix
 */

import { ENTERPRISE_ROLES, ROLE_PERMISSIONS_MATRIX, CLINICAL_PERMISSIONS, isClinicalPermission } from '../../shared/constants/roles.js';

export { ENTERPRISE_ROLES, ROLE_PERMISSIONS_MATRIX, CLINICAL_PERMISSIONS, isClinicalPermission };

export const rbacGuardService = {
  /**
   * Check whether a role (or array of roles) has permission against the SSOT matrix.
   * Super Administrator wildcard '*' NEVER matches clinical permissions!
   */
  hasPermission: (userRoleOrRoles, requiredPermission) => {
    if (!userRoleOrRoles || !requiredPermission) return false;

    const roles = Array.isArray(userRoleOrRoles) ? userRoleOrRoles : [userRoleOrRoles];
    const isClinical = isClinicalPermission(requiredPermission);

    for (const role of roles) {
      if (typeof role !== 'string') continue;
      const roleDef = ROLE_PERMISSIONS_MATRIX[role];
      if (!roleDef) continue;

      // Super Admin wildcard '*' handling: System Admin authority != Clinical authority
      if (roleDef.permissions.includes('*')) {
        if (!isClinical) {
          return true;
        }
        // Super Admin wildcard does NOT grant clinical permissions
        continue;
      }

      if (roleDef.permissions.includes(requiredPermission)) {
        return true;
      }
    }

    return false;
  },

  getAllRoles: () => Object.entries(ROLE_PERMISSIONS_MATRIX).map(([id, val]) => ({
    id,
    name: val.name,
    permissions: val.permissions
  }))
};
