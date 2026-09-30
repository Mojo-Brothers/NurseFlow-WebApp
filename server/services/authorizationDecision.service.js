/**
/**
 * NurseFlow Enterprise HIS 2026 — Master Authorization Decision Service
 * Standards: NIST SP 800-162 (ABAC), ISO 27001 Multi-Tenancy & JCI MOI / KARS KPS
 * 
 * Centralized, authoritative single source of truth for all authorization evaluations.
 * Consolidates:
 *   - Actor Identity & Tenant Context
 *   - Super Administrator Clinical Restriction (System Admin != Clinical Authority)
 *   - Enterprise Role & Permission Verification
 *   - Runtime Clinical Credential (STR/SIP) & Privilege (RKK) Enforcement
 *   - Contextual Resource Ownership & Care Team Access
 *   - Dual-Control Separation of Duties (SoD)
 *   - Forensic Audit Trail Persistence (clinical_authorization_logs)
 */

import { rbacGuardService, isClinicalPermission } from '../../src/core/security/rbacGuard.service.js';
import { clinicalCredentialService } from './clinicalCredential.service.js';
import { resourceAuthorizationService } from './resourceAuthorization.service.js';
import { separationOfDutiesService } from './separationOfDuties.service.js';
import { clinicalAuditService } from './clinicalAudit.service.js';
import { AUTHORIZATION_DECISIONS, isDecisionPersistable } from '../contracts/authorizationDecision.contract.js';
import { structuredLoggerService } from './structuredLogger.service.js';

export const authorizationDecisionService = {
  /**
   * 1. Check whether context represents an authenticated actor.
   */
  isAuthenticated(context) {
    return Boolean(context && context.actorId);
  },

  /**
   * 2. Check whether actor is a valid member of the target tenant.
   */
  isTenantMember(context, targetTenantId) {
    if (!context || !context.tenantId || !targetTenantId) return false;
    return String(context.tenantId).toLowerCase() === String(targetTenantId).toLowerCase();
  },

  /**
   * 3. Check whether actor possesses an allowed role.
   */
  hasRole(context, allowedRoles = []) {
    if (!context || !Array.isArray(context.roles)) return false;
    return allowedRoles.some(r => context.roles.includes(r));
  },

  /**
   * 4. Check whether actor has specific permission.
   * Wildcard '*' is strictly blocked from matching clinical permissions.
   */
  hasPermission(context, requiredPermission) {
    if (!context || !Array.isArray(context.roles)) return false;
    return rbacGuardService.hasPermission(context.roles, requiredPermission);
  },

  /**
   * 5. Check whether actor possesses active, non-expired clinical credentials (SIP or STR).
   */
  async hasClinicalCredential(context, credentialType = 'SIP', evaluationDate = new Date()) {
    if (!context || !context.tenantId || (!context.staffId && !context.actorId)) {
      return { isEligible: false, decision: AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_MISSING };
    }
    return clinicalCredentialService.verifyCredential({
      staffId: context.staffId,
      userId: context.actorId,
      tenantId: context.tenantId,
      credentialType,
      evaluationDate
    });
  },

  /**
   * 6. Check whether actor has clinical privilege (RKK) for a specific procedure.
   */
  async hasClinicalPrivilege(context, procedureCode, departmentId = null) {
    if (!context || !context.staffId || !context.tenantId || !procedureCode) {
      return { isAuthorized: false, decision: AUTHORIZATION_DECISIONS.DENIED_NO_PRIVILEGE };
    }
    return clinicalCredentialService.verifyClinicalPrivilege({
      staffId: context.staffId,
      tenantId: context.tenantId,
      procedureCode,
      departmentId
    });
  },

  /**
   * 7. Check whether actor has resource access within tenant and care relationship.
   */
  async hasResourceAccess(context, resource, action = 'READ', options = {}) {
    return resourceAuthorizationService.verifyResourceAccess({
      context,
      action,
      resource,
      ...options
    });
  },

  /**
   * 8. Check whether clinical transaction satisfies Separation of Duties.
   */
  satisfiesSeparationOfDuties(context, targetResource, action, transactionContext = null) {
    return separationOfDutiesService.evaluateSoD({
      actorId: context?.actorId,
      action,
      targetResource,
      transactionContext
    });
  },

  /**
   * Master Unified Evaluation Engine
   * Executes full pipeline from Identity -> Tenant -> Role -> Permission -> Credential -> Resource -> SoD -> Audit.
   * 
   * @param {Object} params
   * @param {Object} params.context - Authoritative AuthorizationContext
   * @param {string} params.action - Action / Permission required (e.g. 'CPOE_ORDER_CREATE', 'EMR_WRITE_SOAP')
   * @param {Object} [params.resource] - Target resource object
   * @param {string} [params.resourceType] - 'ENCOUNTER' | 'ORDER' | 'PATIENT'
   * @param {string} [params.resourceId] - Target resource UUID
   * @param {string} [params.procedureCode] - Optional clinical procedure code
   * @param {string} [params.targetUnitId] - Target unit/ward
   * @param {string} [params.requiredCredentialType='SIP'] - 'SIP' or 'STR' if action is clinical
   * @param {string} [params.correlationId] - Trace correlation ID
   * @param {Object} [params.transactionContext] - Additional transaction state for SoD
   * @param {boolean} [params.allowBreakTheGlass=false] - Emergency override
   * @returns {Promise<{
   *   isAuthorized: boolean;
   *   decision: string;
   *   reason?: string;
   *   metadata?: Object;
   * }>}
   */
  async evaluateAuthorization({
    context,
    action,
    resource = null,
    resourceType = null,
    resourceId = null,
    procedureCode = 'N/A',
    targetUnitId = 'GENERAL',
    requiredCredentialType = 'SIP',
    correlationId = null,
    transactionContext = null,
    allowBreakTheGlass = false,
    breakTheGlassReason = null
  }) {
    // Resolve resource identifier if resourceId is absent but resource.id exists (FINDING-P02A-06)
    const rawResId = resourceId || (resource && (resource.id || resource.resourceId)) || null;
    const effectiveResourceId = rawResId !== null && rawResId !== undefined ? String(rawResId) : null;
    const rawResType = resourceType || (resource && (resource.resourceType || resource.resource_type)) || null;
    const effectiveResourceType = rawResType !== null && rawResType !== undefined ? String(rawResType) : null;

    const evalMetadata = {
      action,
      resourceType: effectiveResourceType,
      resourceId: effectiveResourceId,
      procedureCode,
      actorRoles: context?.roles || [],
      evaluatedAt: new Date().toISOString()
    };

    try {
      // ─── STAGE 1: AUTHENTICATION CHECK ───
      if (!this.isAuthenticated(context)) {
        return this._recordAndReturn({
          tenantId: context?.tenantId || null,
          userId: context?.actorId || null,
          actionCode: action,
          resourceType: effectiveResourceType,
          resourceId: effectiveResourceId,
          isAuthorized: false,
          decision: AUTHORIZATION_DECISIONS.DENIED_AUTHENTICATION_REQUIRED,
          denialReason: 'Actor identity is missing or unauthenticated',
          correlationId,
          metadata: evalMetadata
        });
      }

      // ─── STAGE 2: TENANT MEMBERSHIP CHECK ───
      if (!context.tenantId) {
        return this._recordAndReturn({
          tenantId: null,
          userId: context.actorId,
          actionCode: action,
          resourceType: effectiveResourceType,
          resourceId: effectiveResourceId,
          isAuthorized: false,
          decision: AUTHORIZATION_DECISIONS.DENIED_TENANT_MISSING,
          denialReason: 'Authenticated actor lacks a valid tenant context',
          correlationId,
          metadata: evalMetadata
        });
      }

      // ─── STAGE 3: SUPER ADMIN CLINICAL RESTRICTION ───
      // System Administration != Clinical Authority
      const isClinical = isClinicalPermission(action);
      const hasOnlyAdminRoles = context.roles.every(r => ['ROLE_SUPER_ADMIN', 'ROLE_IT_ADMIN', 'ADMIN'].includes(r));

      if (isClinical && hasOnlyAdminRoles) {
        return this._recordAndReturn({
          tenantId: context.tenantId,
          userId: context.actorId,
          actionCode: action,
          resourceType: effectiveResourceType,
          resourceId: effectiveResourceId,
          isAuthorized: false,
          decision: AUTHORIZATION_DECISIONS.DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION,
          denialReason: 'System administrators do not possess clinical practice authority or prescribing privileges.',
          correlationId,
          metadata: { ...evalMetadata, violationType: 'SUPER_ADMIN_CLINICAL_BYPASS_ATTEMPT' }
        });
      }

      // ─── STAGE 4: PERMISSION CHECK ───
      const hasPerm = this.hasPermission(context, action);
      if (!hasPerm) {
        return this._recordAndReturn({
          tenantId: context.tenantId,
          userId: context.actorId,
          actionCode: action,
          resourceType: effectiveResourceType,
          resourceId: effectiveResourceId,
          isAuthorized: false,
          decision: AUTHORIZATION_DECISIONS.DENIED_PERMISSION_MISSING,
          denialReason: `Actor role(s) [${context.roles.join(', ')}] lack required permission '${action}'`,
          correlationId,
          metadata: evalMetadata
        });
      }

      // ─── STAGE 5: CLINICAL CREDENTIAL (SIP/STR) RUNTIME VERIFICATION ───
      if (isClinical && requiredCredentialType) {
        const credResult = await clinicalCredentialService.verifyCredential({
          staffId: context.staffId,
          userId: context.actorId,
          tenantId: context.tenantId,
          credentialType: requiredCredentialType
        });

        if (!credResult.isEligible) {
          return this._recordAndReturn({
            tenantId: context.tenantId,
            userId: context.actorId,
            staffId: context.staffId,
            actionCode: action,
            resourceType: effectiveResourceType,
            resourceId: effectiveResourceId,
            isAuthorized: false,
            decision: credResult.decision || AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_MISSING,
            denialReason: credResult.reason || `Clinician lacks valid, active ${requiredCredentialType} credential`,
            correlationId,
            metadata: { ...evalMetadata, credentialVerification: credResult }
          });
        }
        evalMetadata.credentialVerified = credResult.credentialNumber;
      }

      // ─── STAGE 6: CLINICAL PRIVILEGE CHECK (IF PROCEDURE SPECIFIED) ───
      if (procedureCode && procedureCode !== 'N/A') {
        const privResult = await this.hasClinicalPrivilege(context, procedureCode, targetUnitId);
        if (!privResult.isAuthorized) {
          return this._recordAndReturn({
            tenantId: context.tenantId,
            userId: context.actorId,
            staffId: context.staffId,
            actionCode: action,
            procedureCode,
            targetUnitId,
            resourceType: effectiveResourceType,
            resourceId: effectiveResourceId,
            isAuthorized: false,
            decision: privResult.decision || AUTHORIZATION_DECISIONS.DENIED_NO_PRIVILEGE,
            denialReason: privResult.reason || `Practitioner has no clinical privilege for procedure [${procedureCode}]`,
            correlationId,
            metadata: evalMetadata
          });
        }
      }

      // ─── STAGE 7: RESOURCE OWNERSHIP & CARE-TEAM ACCESS ───
      let btgDetails = null;
      if (resource || effectiveResourceId) {
        const resAccess = await resourceAuthorizationService.verifyResourceAccess({
          context,
          action,
          resource,
          resourceType: effectiveResourceType,
          resourceId: effectiveResourceId,
          allowBreakTheGlass,
          breakTheGlassReason,
          correlationId,
          deferLedgerPersistence: true
        });

        if (!resAccess.isAuthorized) {
          return this._recordAndReturn({
            tenantId: context.tenantId,
            userId: context.actorId,
            staffId: context.staffId,
            actionCode: action,
            resourceType: effectiveResourceType,
            resourceId: effectiveResourceId,
            isAuthorized: false,
            decision: resAccess.decision,
            denialReason: resAccess.reason,
            correlationId,
            metadata: evalMetadata
          });
        }

        if (resAccess.btgDetails) {
          btgDetails = resAccess.btgDetails;
        }
      }

      // ─── STAGE 8: SEPARATION OF DUTIES (SOD) CHECK ───
      const sodResult = separationOfDutiesService.evaluateSoD({
        actorId: context.actorId,
        action,
        targetResource: resource,
        transactionContext
      });

      if (!sodResult.satisfiesSoD) {
        // If a BTG override was requested and validated in Stage 7, record its rejection in BTG ledger with actual outcome:
        const btgLedgerData = btgDetails ? {
          ...btgDetails,
          outcome: sodResult.decision
        } : null;

        return this._recordAndReturn({
          tenantId: context.tenantId,
          userId: context.actorId,
          staffId: context.staffId,
          actionCode: action,
          resourceType: effectiveResourceType,
          resourceId: effectiveResourceId,
          isAuthorized: false,
          decision: sodResult.decision,
          denialReason: sodResult.reason,
          correlationId,
          metadata: { ...evalMetadata, sodRule: sodResult.ruleId },
          btgLedgerData
        });
      }

      // ─── STAGE 9: AUTHORIZED — PERSIST FORENSIC AUDIT ───
      const isBtg = Boolean(allowBreakTheGlass && btgDetails);
      const finalDecision = isBtg ? AUTHORIZATION_DECISIONS.AUTHORIZED_BREAK_THE_GLASS : AUTHORIZATION_DECISIONS.AUTHORIZED;

      const btgLedgerData = isBtg ? {
        ...btgDetails,
        outcome: 'GRANTED'
      } : null;

      return await this._recordAndReturn({
        tenantId: context.tenantId,
        userId: context.actorId,
        staffId: context.staffId,
        actionCode: action,
        procedureCode,
        targetUnitId,
        resourceType: effectiveResourceType,
        resourceId: effectiveResourceId,
        isAuthorized: true,
        decision: finalDecision,
        denialReason: null,
        correlationId,
        metadata: evalMetadata,
        btgLedgerData
      });
    } catch (err) {
      return await this._recordAndReturn({
        tenantId: context?.tenantId || null,
        userId: context?.actorId || null,
        staffId: context?.staffId || null,
        actionCode: action,
        procedureCode,
        targetUnitId,
        resourceType: effectiveResourceType,
        resourceId: effectiveResourceId,
        isAuthorized: false,
        decision: AUTHORIZATION_DECISIONS.DENIED_SYSTEM_ERROR,
        denialReason: `Authorization evaluation failed closed due to internal error: ${err.message}`,
        correlationId,
        metadata: { ...evalMetadata, error: err.message }
      });
    }
  },

  /**
   * Internal helper to persist audit log and format return object.
   */
  async _recordAndReturn({
    tenantId,
    userId,
    staffId = null,
    actionCode,
    procedureCode = 'N/A',
    targetUnitId = 'GENERAL',
    resourceType = null,
    resourceId = null,
    isAuthorized,
    decision,
    denialReason = null,
    correlationId = null,
    metadata = {},
    btgLedgerData = null
  }) {
    let auditResult = null;
    let auditError = null;

    // Check persistability via canonical contract: non-persistable system safety states are never sent to DB
    const shouldPersist = isDecisionPersistable(decision);

    if (tenantId && shouldPersist) {
      try {
        auditResult = await clinicalAuditService.logAuthorizationDecision({
          tenantId,
          staffId,
          userId,
          actorId: userId || staffId,
          actionCode,
          procedureCode,
          targetUnitId,
          resourceType,
          resourceId,
          isAuthorized,
          decision,
          denialReason,
          correlationId,
          evaluationMetadata: metadata,
          btgLedgerData
        });
      } catch (err) {
        auditError = err;
      }
    }

    // MANDATORY FORENSIC PERSISTENCE ENFORCEMENT (BLOCKER A - CASE D)
    // If the decision was ALLOW / isAuthorized === true, but audit persistence failed (returned null or threw),
    // we MUST FAIL CLOSED! We cannot allow a clinical action without immutable forensic audit trail.
    if (isAuthorized && (!auditResult || auditError)) {
      structuredLoggerService.error('MANDATORY_CLINICAL_AUDIT_PERSISTENCE_FAILED_FAIL_CLOSED', {
        originalDecision: decision,
        actionCode,
        tenantId,
        correlationId,
        error: auditError ? auditError.message : 'Database audit log persistence returned null'
      });

      return {
        isAuthorized: false,
        decision: AUTHORIZATION_DECISIONS.DENIED_AUDIT_PERSISTENCE_FAILURE,
        reason: 'Mandatory clinical audit persistence failure: transaction failed closed',
        metadata: {
          ...metadata,
          originalDecision: decision,
          auditFailure: true,
          error: auditError ? auditError.message : 'Database audit log persistence failed'
        }
      };
    }

    return {
      isAuthorized,
      decision,
      reason: denialReason,
      metadata
    };
  }
};
