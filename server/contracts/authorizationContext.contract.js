/**
/**
 * NurseFlow Enterprise HIS 2026 — Canonical Authorization Context Contract
 * Standards: NIST SP 800-162 (ABAC), ISO/IEC 27001 Multi-Tenancy & JCI MOI / KARS KPS
 * 
 * Defines the Single Authoritative Server-Side Representation of the Authenticated Actor's Context.
 * Eliminates scattered, inconsistent interpretations of req.user / req.staff / req.tenantId.
 */

import { ROLE_PERMISSIONS_MATRIX } from '../../src/shared/constants/roles.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUUID = (str) => {
  return typeof str === 'string' && UUID_REGEX.test(str);
};

/**
 * Validates and constructs an immutable AuthorizationContext from an authenticated user token payload.
 * Strictly enforces server-originating tenant identity (Rule 3 & Rule 4).
 * 
 * @param {Object} userPayload - Authenticated claims extracted from verified JWT or session
 * @param {Object} [req] - Optional Express HTTP request to perform client anti-spoofing verification
 * @returns {Object} Immutable AuthorizationContext
 */
export function createAuthorizationContext(userPayload, req = null) {
  if (!userPayload || typeof userPayload !== 'object') {
    throw new Error('AUTHORIZATION_CONTEXT_ERROR: userPayload is mandatory to build AuthorizationContext');
  }

  const actorId = userPayload.userId || userPayload.sub || userPayload.id;
  if (!actorId) {
    throw new Error('AUTHORIZATION_CONTEXT_ERROR: Missing actor identity (userId/sub)');
  }

  // Tenant ID MUST originate from authenticated claims. Never client inputs.
  const tenantId = userPayload.tenantId;
  if (!tenantId || !isValidUUID(tenantId)) {
    throw new Error('AUTHORIZATION_CONTEXT_ERROR: Invalid or missing server-verified tenantId in actor claims');
  }

  // Anti-Spoofing: If client supplies conflicting tenant headers or params, trigger immediate rejection
  if (req) {
    const clientHeaderTenant = req.headers?.['x-tenant-id'];
    if (clientHeaderTenant && clientHeaderTenant !== tenantId) {
      const err = new Error(`TENANT_SPOOFING_ATTEMPT: Client header X-Tenant-ID [${clientHeaderTenant}] conflicts with trusted actor tenant [${tenantId}]`);
      err.code = 'TENANT_MISMATCH';
      err.statusCode = 403;
      throw err;
    }

    const clientBodyTenant = req.body?.tenantId;
    if (clientBodyTenant && clientBodyTenant !== tenantId) {
      const err = new Error(`TENANT_SPOOFING_ATTEMPT: Client body tenantId [${clientBodyTenant}] conflicts with trusted actor tenant [${tenantId}]`);
      err.code = 'TENANT_MISMATCH';
      err.statusCode = 403;
      throw err;
    }

    const clientQueryTenant = req.query?.tenantId;
    if (clientQueryTenant && clientQueryTenant !== tenantId) {
      const err = new Error(`TENANT_SPOOFING_ATTEMPT: Client query tenantId [${clientQueryTenant}] conflicts with trusted actor tenant [${tenantId}]`);
      err.code = 'TENANT_MISMATCH';
      err.statusCode = 403;
      throw err;
    }
  }

  // Normalize Roles
  let roles = [];
  if (Array.isArray(userPayload.roles) && userPayload.roles.length > 0) {
    roles = [...userPayload.roles];
  } else if (userPayload.role && typeof userPayload.role === 'string') {
    roles = [userPayload.role];
  }

  // Resolve base permissions across all assigned roles
  const permissionsSet = new Set();
  for (const role of roles) {
    const roleDef = ROLE_PERMISSIONS_MATRIX[role];
    if (roleDef && Array.isArray(roleDef.permissions)) {
      roleDef.permissions.forEach(p => permissionsSet.add(p));
    }
  }

  // System Administration vs Clinical Actor classification
  const isSuperAdmin = roles.includes('ROLE_SUPER_ADMIN') || roles.includes('ADMIN');
  const isSystemAdmin = isSuperAdmin || roles.includes('ROLE_IT_ADMIN');
  const isClinicalActor = roles.some(r => [
    'ROLE_DOCTOR_DPJP',
    'ROLE_DOCTOR_EMERGENCY',
    'ROLE_NURSE',
    'ROLE_PHARMACIST',
    'ROLE_LAB_ANALYST',
    'ROLE_RADIOGRAPHER'
  ].includes(r));

  const authContext = {
    actorId,
    username: userPayload.username || 'unknown',
    fullName: userPayload.fullName || null,
    tenantId,
    branchId: userPayload.branchId || null,
    roles: Object.freeze(roles),
    permissions: Object.freeze(Array.from(permissionsSet)),
    staffId: userPayload.staffId || null,
    practitionerId: userPayload.practitionerId || null,
    sessionId: userPayload.sessionId || null,
    deviceId: userPayload.deviceId || null,
    isSuperAdmin,
    isSystemAdmin,
    isClinicalActor,
    credentialStatus: userPayload.credentialStatus || null,
    clinicalPrivileges: userPayload.clinicalPrivileges || [],
    resolvedAt: new Date().toISOString()
  };

  return Object.freeze(authContext);
}
