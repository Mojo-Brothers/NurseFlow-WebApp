/**
 * NurseFlow Enterprise HIS 2026 — Backend RBAC Middleware (RFC 7807 Standard)
 * Validates permissions and roles against the single source of truth matrix.
 */

import { rbacGuardService } from '../../src/core/security/rbacGuard.service.js';
import { PROBLEM_TYPES } from '../contracts/problemDetails.contract.js';

export const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;

    if (!req.user || !req.user.role) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/problem+json');
        res.setHeader('X-Correlation-ID', correlationId);
      }
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN',
        type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
        title: 'Access Forbidden',
        status: 403,
        detail: 'Akses Ditolak: Konteks pengguna tidak ditemukan.',
        message: 'Akses Ditolak: Konteks pengguna tidak ditemukan.',
        instance: req.originalUrl || req.path,
        correlationId,
        code: 'FORBIDDEN'
      });
    }

    const hasAccess = rbacGuardService.hasPermission(req.user.role, requiredPermission);
    if (!hasAccess) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/problem+json');
        res.setHeader('X-Correlation-ID', correlationId);
      }
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'PERMISSION_DENIED',
        type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
        title: 'Access Forbidden',
        status: 403,
        detail: `Akses Ditolak: Role ${req.user.role} tidak memiliki izin '${requiredPermission}'.`,
        message: `Akses Ditolak: Role ${req.user.role} tidak memiliki izin '${requiredPermission}'.`,
        instance: req.originalUrl || req.path,
        correlationId,
        code: 'PERMISSION_DENIED'
      });
    }

    return next();
  };
};

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;

    if (!req.user) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/problem+json');
        res.setHeader('X-Correlation-ID', correlationId);
      }
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'UNAUTHORIZED',
        type: PROBLEM_TYPES.AUTHENTICATION_ERROR,
        title: 'Authentication Required',
        status: 401,
        detail: 'Akses Ditolak: Otentikasi diperlukan.',
        message: 'Akses Ditolak: Otentikasi diperlukan.',
        instance: req.originalUrl || req.path,
        correlationId,
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role || (Array.isArray(req.user.roles) ? req.user.roles[0] : null);
    if (!userRole) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/problem+json');
        res.setHeader('X-Correlation-ID', correlationId);
      }
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN',
        type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
        title: 'Access Forbidden',
        status: 403,
        detail: 'Akses Ditolak: Konteks role pengguna tidak ditemukan.',
        message: 'Akses Ditolak: Konteks role pengguna tidak ditemukan.',
        instance: req.originalUrl || req.path,
        correlationId,
        code: 'FORBIDDEN'
      });
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [userRole];
    const isSuperAdmin = userRoles.includes('ROLE_SUPER_ADMIN') || userRoles.includes('ADMIN');
    const hasRole = isSuperAdmin || allowedRoles.some(r => {
      if (userRoles.includes(r) || userRole === r) return true;
      if (r === 'DOCTOR' && (userRoles.includes('ROLE_DOCTOR_DPJP') || userRoles.includes('ROLE_DOCTOR_EMERGENCY'))) return true;
      if (r === 'NURSE' && userRoles.includes('ROLE_NURSE')) return true;
      if (r === 'PHARMACIST' && userRoles.includes('ROLE_PHARMACIST')) return true;
      if (r === 'LAB_ANALYST' && userRoles.includes('ROLE_LAB_ANALYST')) return true;
      if (r === 'RADIOGRAPHER' && userRoles.includes('ROLE_RADIOGRAPHER')) return true;
      if (r === 'CASHIER' && userRoles.includes('ROLE_CASHIER')) return true;
      if (r === 'ADMIN' && (userRoles.includes('ROLE_SUPER_ADMIN') || userRoles.includes('ROLE_IT_ADMIN'))) return true;
      return false;
    });

    if (!hasRole) {

      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/problem+json');
        res.setHeader('X-Correlation-ID', correlationId);
      }
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'ROLE_FORBIDDEN',
        type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
        title: 'Access Forbidden',
        status: 403,
        detail: `Akses Ditolak: Role [${userRole}] tidak memiliki wewenang untuk tindakan ini.`,
        message: `Akses Ditolak: Role [${userRole}] tidak memiliki wewenang untuk tindakan ini.`,
        instance: req.originalUrl || req.path,
        correlationId,
        code: 'ROLE_FORBIDDEN'
      });
    }

    return next();
  };
};
