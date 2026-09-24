/**
/**
 * NurseFlow Enterprise HIS 2026 — Master Multi-Tenant Isolation Middleware
 * Standards: ISO/IEC 27001 Multi-Tenancy Data Isolation, NIST SP 800-162 ABAC
 * 
 * Strict Enforcement:
 * 1. Actor Tenant Context MUST originate strictly from trusted server-side authentication (JWT / Session).
 * 2. Zero trust in client headers (x-tenant-id), body (tenantId), or query params.
 * 3. Client tenant spoofing attempts trigger immediate 403 FORBIDDEN.
 * 4. Zero default tenant fallback: Missing tenant MUST fail closed (Never default to 00000000-0000-0000-0000-000000000001).
 */

import { PROBLEM_TYPES } from '../contracts/problemDetails.contract.js';
import { createAuthorizationContext, isValidUUID } from '../contracts/authorizationContext.contract.js';

export const tenantMiddleware = (req, res, next) => {
  const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;

  // If user is authenticated, derive tenantId strictly from authenticated claims
  if (req.user && req.user.tenantId) {
    const trustedTenantId = req.user.tenantId;

    if (!isValidUUID(trustedTenantId)) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/problem+json');
        res.setHeader('X-Correlation-ID', correlationId);
      }
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'INVALID_TENANT_CONTEXT',
        type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
        title: 'Invalid Tenant Context',
        status: 403,
        detail: 'Konteks tenant pengguna tidak valid atau rusak.',
        instance: req.originalUrl || req.path,
        correlationId,
        code: 'INVALID_TENANT_CONTEXT'
      });
    }

    // Anti-Spoofing: Client MUST NOT supply a conflicting tenantId
    const clientHeaderTenant = req.headers['x-tenant-id'];
    if (clientHeaderTenant && clientHeaderTenant !== trustedTenantId) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/problem+json');
        res.setHeader('X-Correlation-ID', correlationId);
      }
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'TENANT_SPOOFING_ATTEMPT',
        type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
        title: 'Tenant Mismatch / Spoofing Detected',
        status: 403,
        detail: 'Akses Ditolak: Header tenant tidak sesuai dengan identitas otentikasi server.',
        instance: req.originalUrl || req.path,
        correlationId,
        code: 'TENANT_MISMATCH'
      });
    }

    const clientBodyTenant = req.body?.tenantId;
    if (clientBodyTenant && clientBodyTenant !== trustedTenantId) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/problem+json');
        res.setHeader('X-Correlation-ID', correlationId);
      }
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'TENANT_SPOOFING_ATTEMPT',
        type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
        title: 'Tenant Mismatch in Request Body',
        status: 403,
        detail: 'Akses Ditolak: Body tenantId tidak sesuai dengan identitas otentikasi server.',
        instance: req.originalUrl || req.path,
        correlationId,
        code: 'TENANT_MISMATCH'
      });
    }

    const clientQueryTenant = req.query?.tenantId;
    if (clientQueryTenant && clientQueryTenant !== trustedTenantId) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/problem+json');
        res.setHeader('X-Correlation-ID', correlationId);
      }
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'TENANT_SPOOFING_ATTEMPT',
        type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
        title: 'Tenant Mismatch in Request Query',
        status: 403,
        detail: 'Akses Ditolak: Query parameter tenantId tidak sesuai dengan identitas otentikasi server.',
        instance: req.originalUrl || req.path,
        correlationId,
        code: 'TENANT_MISMATCH'
      });
    }

    req.tenantId = trustedTenantId;
    req.tenant = Object.freeze({
      tenantId: trustedTenantId,
      branchId: req.user.branchId || 'BRANCH-MAIN-CAMPUS',
      resolvedAt: new Date().toISOString()
    });

    try {
      req.authContext = createAuthorizationContext(req.user, req);
    } catch (e) {
      // If authorization context throws a tenant mismatch, propagate error
      if (e.code === 'TENANT_MISMATCH') {
        if (typeof res.setHeader === 'function') {
          res.setHeader('Content-Type', 'application/problem+json');
          res.setHeader('X-Correlation-ID', correlationId);
        }
        return res.status(403).json({
          success: false,
          statusCode: 403,
          error: 'TENANT_MISMATCH',
          type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
          title: 'Tenant Spoofing Detected',
          status: 403,
          detail: e.message,
          instance: req.originalUrl || req.path,
          correlationId,
          code: 'TENANT_MISMATCH'
        });
      }
    }

    if (typeof res.setHeader === 'function') {
      res.setHeader('X-Tenant-ID', trustedTenantId);
    }
  }

  return next();
};

/**
 * Guard middleware requiring an active, valid tenant context.
 * Rejects requests with missing or unresolvable tenant identity.
 */
export const requireTenantContext = (req, res, next) => {
  const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;
  const tenantId = req.tenantId || req.user?.tenantId;

  if (!tenantId || !isValidUUID(tenantId)) {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Content-Type', 'application/problem+json');
      res.setHeader('X-Correlation-ID', correlationId);
    }
    return res.status(403).json({
      success: false,
      statusCode: 403,
      error: 'TENANT_CONTEXT_REQUIRED',
      type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
      title: 'Tenant Context Required',
      status: 403,
      detail: 'Operasi ini memerlukan konteks tenant yang terotentikasi dan valid.',
      instance: req.originalUrl || req.path,
      correlationId,
      code: 'TENANT_CONTEXT_MISSING'
    });
  }

  return next();
};

/**
 * Asserts that a target resource's tenantId matches the authenticated actor's tenantId.
 * Fails closed on any mismatch.
 * 
 * @param {string} actorTenantId - The trusted actor's tenant ID
 * @param {string} resourceTenantId - The target entity's tenant ID
 * @returns {boolean} True if matching
 * @throws {Error} If mismatch or invalid
 */
export function assertResourceTenant(actorTenantId, resourceTenantId) {
  if (!actorTenantId || !resourceTenantId) {
    const error = new Error('CROSS_TENANT_VIOLATION: Incomplete tenant comparison inputs');
    error.code = 'TENANT_CONTEXT_MISSING';
    error.statusCode = 403;
    throw error;
  }

  if (String(actorTenantId).toLowerCase() !== String(resourceTenantId).toLowerCase()) {
    const error = new Error('CROSS_TENANT_VIOLATION: Actor tenant does not match resource tenant');
    error.code = 'CROSS_TENANT_DENIED';
    error.statusCode = 403;
    throw error;
  }

  return true;
}
