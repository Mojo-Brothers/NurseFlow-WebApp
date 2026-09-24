/**
/**
 * NurseFlow Enterprise HIS 2026 — Forensic Clinical Authorization Audit Service
 * Standards: ISO 27001 / HIPAA / KARS MKI Audit Trail Logging
 * Target Table: clinical_authorization_logs (PostgreSQL 16)
 * 
 * Records every security-relevant authorization evaluation (both grants and denials).
 * Sanitizes metadata to strictly prevent leak of tokens, passwords, or cryptographic secrets.
 */

import { postgresPoolService } from '../db/postgresPool.js';
import { structuredLoggerService } from './structuredLogger.service.js';
import { isDecisionPersistable } from '../contracts/authorizationDecision.contract.js';

export const clinicalAuditService = {
  /**
   * Sanitizes metadata object to strip out sensitive fields before persistence.
   */
  sanitizeMetadata(metadata = {}) {
    if (!metadata || typeof metadata !== 'object') return {};
    const sanitized = Array.isArray(metadata) ? [] : { ...metadata };
    const forbiddenKeys = ['password', 'token', 'secret', 'authorization', 'bearer', 'cookie', 'accesstoken', 'refreshtoken', 'jwt', 'sip', 'str'];
    
    for (const [key, value] of Object.entries(metadata)) {
      if (forbiddenKeys.some(fk => key.toLowerCase().includes(fk))) {
        sanitized[key] = '[REDACTED_BY_SECURITY_POLICY]';
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeMetadata(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  },

  /**
   * Records an authorization decision event to PostgreSQL clinical_authorization_logs.
   * 
   * @param {Object} params
   * @param {string} params.tenantId - Tenant UUID
   * @param {string} [params.staffId] - Clinician profile UUID if mapped
   * @param {string} [params.userId] - Authenticated user UUID
   * @param {string} [params.actorId] - Actor identifier
   * @param {string} [params.actionCode] - Clinical action (e.g. 'CPOE_ORDER_CREATE', 'EMR_WRITE_SOAP')
   * @param {string} [params.procedureCode='N/A'] - Specific procedure code (e.g. ICD-9-CM)
   * @param {string} [params.targetUnitId='GENERAL'] - Service unit / ward ID
   * @param {string} [params.resourceType] - 'ENCOUNTER' | 'ORDER' | 'PATIENT'
   * @param {string} [params.resourceId] - Target resource UUID
   * @param {boolean} params.isAuthorized - Whether access was granted
   * @param {string} params.decision - Standard decision enum code
   * @param {string} [params.denialReason] - Human-readable denial explanation
   * @param {string} [params.correlationId] - Distributed trace / request correlation ID
   * @param {Object} [params.evaluationMetadata] - Contextual metadata
   * @returns {Promise<Object>} Inserted log record
   */
  async logAuthorizationDecision({
    tenantId,
    staffId = null,
    userId = null,
    actorId = null,
    actionCode = 'CLINICAL_ACTION',
    procedureCode = 'N/A',
    targetUnitId = 'GENERAL',
    resourceType = null,
    resourceId = null,
    isAuthorized,
    decision,
    denialReason = null,
    correlationId = null,
    evaluationMetadata = {}
  }) {
    if (!tenantId) {
      structuredLoggerService.warn('AUDIT_LOG_MISSING_TENANT', { decision, actionCode });
      return null;
    }

    // Safety guard: Non-persistable system safety states (e.g. DENIED_AUDIT_PERSISTENCE_FAILURE)
    // are never sent to clinical_authorization_logs to avoid recursive failure loops.
    if (!isDecisionPersistable(decision)) {
      structuredLoggerService.warn('AUDIT_LOG_NON_PERSISTABLE_DECISION_SKIPPED', { decision, actionCode, tenantId });
      return null;
    }

    const cleanMetadata = this.sanitizeMetadata(evaluationMetadata);

    try {
      const pool = postgresPoolService.getPool();
      const client = await pool.connect();
      try {
        const query = `
          INSERT INTO clinical_authorization_logs (
            tenant_id,
            staff_id,
            user_id,
            actor_id,
            action_code,
            procedure_code,
            target_unit_id,
            resource_type,
            resource_id,
            is_authorized,
            authorization_decision,
            denial_reason,
            correlation_id,
            evaluation_metadata,
            evaluated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
          RETURNING id, evaluated_at, is_authorized, authorization_decision;
        `;

        const values = [
          tenantId,
          staffId,
          userId,
          actorId || userId || staffId || 'UNKNOWN_ACTOR',
          actionCode,
          procedureCode || 'N/A',
          targetUnitId || 'GENERAL',
          resourceType,
          resourceId,
          Boolean(isAuthorized),
          decision,
          denialReason,
          correlationId,
          JSON.stringify(cleanMetadata)
        ];

        try {
          const result = await client.query(query, values);
          return result.rows[0];
        } catch (insertErr) {
          // If FK violation on user_id or staff_id (e.g. unknown actor ID), record safely with nullified FK to ensure forensic audit of the rejection is NOT lost
          if (insertErr.code === '23503') {
            structuredLoggerService.warn('AUDIT_LOG_UNKNOWN_ACTOR_FK_FALLBACK', { userId, staffId, tenantId, detail: insertErr.detail });
            const safeValues = [...values];
            safeValues[1] = null; // nullify staff_id to satisfy FK constraint
            safeValues[2] = null; // nullify user_id to satisfy FK constraint
            const safeMetadata = { ...cleanMetadata, unverified_actor_id: userId, unverified_staff_id: staffId, fk_rejection: true };
            safeValues[13] = JSON.stringify(safeMetadata);
            const fallbackRes = await client.query(query, safeValues);
            return fallbackRes.rows[0];
          }
          throw insertErr;
        }
      } finally {
        client.release();
      }
    } catch (err) {
      // Never let an audit persistence failure crash the security boundary, but log prominently
      structuredLoggerService.error('CLINICAL_AUDIT_LOG_INSERT_ERROR', {
        error: err.message,
        tenantId,
        actionCode,
        decision
      });
      return null;
    }
  }
};
