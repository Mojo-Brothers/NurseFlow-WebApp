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

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Akses Ditolak: Otentikasi diperlukan.'
      });
    }

    const userRole = req.user.role || (Array.isArray(req.user.roles) ? req.user.roles[0] : null);
    if (!userRole) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN',
        message: 'Akses Ditolak: Konteks role pengguna tidak ditemukan.'
      });
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [userRole];
    const hasRole = allowedRoles.some(r => userRoles.includes(r) || userRole === r);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'ROLE_FORBIDDEN',
        message: `Akses Ditolak: Role [${userRole}] tidak memiliki wewenang untuk tindakan ini.`
      });
    }

    next();
  };
};

