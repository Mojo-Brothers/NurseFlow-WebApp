/**
 * NurseFlow Enterprise HIS 2026 — Backend RBAC Middleware
 * Validates permissions against the single source of truth matrix.
 */

import { rbacGuardService } from '../../src/core/security/rbacGuard.service.js';

export const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN',
        message: 'Akses Ditolak: Konteks pengguna tidak ditemukan.'
      });
    }

    const hasAccess = rbacGuardService.hasPermission(req.user.role, requiredPermission);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'PERMISSION_DENIED',
        message: `Akses Ditolak: Role ${req.user.role} tidak memiliki izin '${requiredPermission}'.`
      });
    }

    next();
  };
};
