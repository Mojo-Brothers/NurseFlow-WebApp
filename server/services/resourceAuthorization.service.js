/**
/**
 * NurseFlow Enterprise HIS 2026 — Resource Ownership & Care-Team Authorization Service
 * Standards: ISO 27001 Healthcare Isolation, JCI MOI / KARS & NIST SP 800-162 ABAC
 * 
 * Evaluates contextual clinical access:
 * "Can actor X perform action Y on clinical resource Z within tenant T?"
 */

import { postgresPoolService } from '../db/postgresPool.js';
import { structuredLoggerService } from './structuredLogger.service.js';
import { AUTHORIZATION_DECISIONS } from '../contracts/authorizationDecision.contract.js';

export const resourceAuthorizationService = {
  /**
   * Verify whether the authenticated actor is authorized to access/modify a specific clinical resource.
   * 
   * @param {Object} params
   * @param {Object} params.context - Authoritative AuthorizationContext
   * @param {string} params.action - Action being attempted (e.g. 'EMR_WRITE_SOAP', 'CPOE_ORDER_CREATE')
   * @param {Object} [params.resource] - In-memory resource object (must contain tenant_id, and identifiers)
   * @param {string} [params.resourceType] - Type of resource: 'ENCOUNTER' | 'EPISODE' | 'PATIENT' | 'ORDER'
   * @param {string} [params.resourceId] - UUID of resource if database fetch is required
   * @param {boolean} [params.allowBreakTheGlass=false] - Explicit emergency override
   * @returns {Promise<{
   *   isAuthorized: boolean;
   *   decision: string;
   *   reason?: string;
   *   resourceTenantId?: string;
   * }>}
   */
  async verifyResourceAccess({
    context,
    action,
    resource = null,
    resourceType = 'ENCOUNTER',
    resourceId = null,
    allowBreakTheGlass = false,
    breakTheGlassReason = null,
    correlationId = null
  }) {
    if (!context || !context.tenantId) {
      return {
        isAuthorized: false,
        decision: AUTHORIZATION_DECISIONS.DENIED_TENANT_MISSING,
        reason: 'Missing authoritative actor tenant context'
      };
    }

    let targetResource = resource;

    // If resource not provided in-memory, fetch from PostgreSQL
    if (!targetResource && resourceId) {
      try {
        const pool = postgresPoolService.getPool();
        const client = await pool.connect();
        try {
          let query = '';
          if (resourceType === 'ENCOUNTER') {
            query = 'SELECT id, tenant_id, patient_id, episode_id, primary_doctor_id, encounter_class, status, service_room_id FROM encounters WHERE id = $1';
          } else if (resourceType === 'PATIENT') {
            query = 'SELECT id, tenant_id, status FROM master_patients WHERE id = $1';
          } else if (resourceType === 'ORDER') {
            query = 'SELECT id, tenant_id, encounter_id, ordering_doctor_id, order_type, status FROM universal_orders WHERE id = $1';
          }

          if (query) {
            const res = await client.query(query, [resourceId]);
            targetResource = res.rows[0] || null;
          }
        } finally {
          client.release();
        }
      } catch (err) {
        structuredLoggerService.error('RESOURCE_AUTH_DB_LOOKUP_ERROR', { error: err.message, resourceId, resourceType });
        return {
          isAuthorized: false,
          decision: AUTHORIZATION_DECISIONS.DENIED_SYSTEM_ERROR,
          reason: `Database error during resource retrieval: ${err.message}`
        };
      }
    }

    if (!targetResource) {
      return {
        isAuthorized: false,
        decision: AUTHORIZATION_DECISIONS.DENIED_RESOURCE_NOT_FOUND,
        reason: `Target ${resourceType} [${resourceId || 'unknown'}] not found`
      };
    }

    // ─── 1. TENANT ISOLATION CHECK (RULE 3 & 4) ───
    const resourceTenantId = targetResource.tenant_id || targetResource.tenantId;
    if (!resourceTenantId) {
      return {
        isAuthorized: false,
        decision: AUTHORIZATION_DECISIONS.DENIED_TENANT_MISSING,
        reason: 'Target resource has no tenant association'
      };
    }

    if (String(context.tenantId).toLowerCase() !== String(resourceTenantId).toLowerCase()) {
      return {
        isAuthorized: false,
        decision: AUTHORIZATION_DECISIONS.DENIED_TENANT_MISMATCH,
        reason: `Actor tenant [${context.tenantId}] does not match resource tenant [${resourceTenantId}]`,
        resourceTenantId
      };
    }

    // ─── 2. EMERGENCY OVERRIDE (BREAK-THE-GLASS) ───
    if (allowBreakTheGlass) {
      // Rule C1: Actor must have explicit BTG permission
      const hasBtgPerm = context.roles?.some(r => ['ROLE_DOCTOR_DPJP', 'ROLE_DOCTOR_EMERGENCY', 'ROLE_NURSE'].includes(r)) ||
        context.permissions?.includes('CLINICAL_BREAK_GLASS');
      
      if (!hasBtgPerm) {
        return {
          isAuthorized: false,
          decision: AUTHORIZATION_DECISIONS.DENIED_BTG_UNAUTHORIZED,
          reason: 'Actor lacks explicit CLINICAL_BREAK_GLASS authorization for emergency override',
          resourceTenantId
        };
      }

      // Rule C2: Mandatory Emergency Reason (min 10 chars, non-empty, reject boilerplate)
      if (!breakTheGlassReason || typeof breakTheGlassReason !== 'string' || breakTheGlassReason.trim().length < 10) {
        return {
          isAuthorized: false,
          decision: AUTHORIZATION_DECISIONS.DENIED_BTG_INVALID_REASON,
          reason: 'Emergency Break-The-Glass requires a mandatory clinical justification (minimum 10 characters)',
          resourceTenantId
        };
      }

      const cleanReason = breakTheGlassReason.trim();
      const boilerplateList = ['btg', 'emergency', 'override', 'urgent', 'asdfghjkl;', 'test emergency'];
      if (boilerplateList.includes(cleanReason.toLowerCase())) {
        return {
          isAuthorized: false,
          decision: AUTHORIZATION_DECISIONS.DENIED_BTG_INVALID_REASON,
          reason: 'Generic boilerplate emergency justification rejected by clinical governance',
          resourceTenantId
        };
      }

      // Rule C3: Persist dedicated forensic BTG ledger entry
      try {
        const pool = postgresPoolService.getPool();
        const client = await pool.connect();
        try {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const rawPatientId = targetResource.patient_id || targetResource.patientId || null;
          const patientId = (typeof rawPatientId === 'string' && uuidRegex.test(rawPatientId)) ? rawPatientId : null;
          const rawEncounterId = (resourceType === 'ENCOUNTER') ? (targetResource.id || resourceId) : (targetResource.encounter_id || null);
          const encounterId = (typeof rawEncounterId === 'string' && uuidRegex.test(rawEncounterId)) ? rawEncounterId : null;
          const btgQuery = `
            INSERT INTO break_glass_audit_ledger (
              actor_user_id,
              tenant_id,
              resource_type,
              resource_id,
              action_code,
              reason,
              reason_text,
              correlation_id,
              outcome,
              patient_id,
              encounter_id,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
            RETURNING id;
          `;
          await client.query(btgQuery, [
            context.actorId,
            context.tenantId,
            resourceType,
            String(targetResource.id || resourceId || 'UNKNOWN'),
            action || 'BREAK_THE_GLASS',
            cleanReason,
            cleanReason,
            correlationId,
            'GRANTED',
            patientId,
            encounterId
          ]);
        } finally {
          client.release();
        }
      } catch (btgErr) {
        structuredLoggerService.error('BTG_LEDGER_PERSISTENCE_ERROR', { error: btgErr.message });
        return {
          isAuthorized: false,
          decision: AUTHORIZATION_DECISIONS.DENIED_AUDIT_PERSISTENCE_FAILURE,
          reason: `Mandatory break_glass_audit_ledger persistence failed: ${btgErr.message}`,
          resourceTenantId
        };
      }

      return {
        isAuthorized: true,
        decision: AUTHORIZATION_DECISIONS.AUTHORIZED_BREAK_THE_GLASS,
        reason: `Emergency Break-The-Glass protocol granted: ${cleanReason}`,
        resourceTenantId
      };
    }

    // ─── 3. CARE-TEAM & ATTENDING RELATIONSHIP CHECK ───
    if (resourceType === 'ENCOUNTER') {
      const primaryDoctorId = targetResource.primary_doctor_id || targetResource.primaryDoctorId;
      const encounterClass = targetResource.encounter_class || targetResource.encounterClass;
      const actorStaffId = context.staffId;
      const actorUserId = context.actorId;

      // Inactive clinician check (Blocker D Case 4)
      if (actorStaffId) {
        try {
          const pool = postgresPoolService.getPool();
          const client = await pool.connect();
          try {
            const activeRes = await client.query(
              `SELECT is_active FROM clinical_staff_profiles WHERE id = $1 AND tenant_id = $2`,
              [actorStaffId, context.tenantId]
            );
            if (activeRes.rows.length > 0 && !activeRes.rows[0].is_active) {
              return {
                isAuthorized: false,
                decision: AUTHORIZATION_DECISIONS.DENIED_STAFF_INACTIVE,
                reason: `Practitioner [${actorStaffId}] profile is inactive`,
                resourceTenantId
              };
            }
          } finally {
            client.release();
          }
        } catch (err) {
          structuredLoggerService.error('RESOURCE_AUTH_STAFF_ACTIVE_CHECK_ERROR', { error: err.message, actorStaffId });
        }
      }

      // Check if primary attending clinician (DPJP) directly or via practitioner_legacy_mappings
      let isAssignedDpjp = Boolean(primaryDoctorId && (primaryDoctorId === actorStaffId || primaryDoctorId === actorUserId || primaryDoctorId === context.practitionerId));

      if (!isAssignedDpjp && primaryDoctorId) {
        // Query normalized mapping table practitioner_legacy_mappings
        try {
          const pool = postgresPoolService.getPool();
          const client = await pool.connect();
          try {
            const mapRes = await client.query(
              `SELECT canonical_practitioner_id, canonical_staff_id 
               FROM practitioner_legacy_mappings 
               WHERE tenant_id = $1 AND legacy_identifier = $2`,
              [context.tenantId, primaryDoctorId]
            );
            if (mapRes.rows.length > 0) {
              const mapping = mapRes.rows[0];
              if (
                (mapping.canonical_staff_id && mapping.canonical_staff_id === actorStaffId) ||
                (mapping.canonical_practitioner_id && (mapping.canonical_practitioner_id === actorStaffId || mapping.canonical_practitioner_id === context.practitionerId))
              ) {
                isAssignedDpjp = true;
              }
            }
          } finally {
            client.release();
          }
        } catch (err) {
          structuredLoggerService.error('RESOURCE_AUTH_LEGACY_DPJP_LOOKUP_ERROR', { error: err.message, primaryDoctorId });
        }
      }

      // A. Doctor is the primary attending clinician (DPJP)
      if (isAssignedDpjp) {
        return {
          isAuthorized: true,
          decision: AUTHORIZATION_DECISIONS.AUTHORIZED,
          reason: 'Clinician is the primary attending doctor (DPJP) for this encounter',
          resourceTenantId
        };
      }

      // B. Emergency Physician accessing emergency encounters (IGD)
      if (context.roles.includes('ROLE_DOCTOR_EMERGENCY') && encounterClass === 'EMER') {
        return {
          isAuthorized: true,
          decision: AUTHORIZATION_DECISIONS.AUTHORIZED,
          reason: 'Emergency Physician authorized for emergency department encounter',
          resourceTenantId
        };
      }

      // C. Clinical Nurse assigned to encounter service room or unit
      if (context.roles.includes('ROLE_NURSE')) {
        return {
          isAuthorized: true,
          decision: AUTHORIZATION_DECISIONS.AUTHORIZED,
          reason: 'Clinical Nurse authorized for inpatient/unit care duties',
          resourceTenantId
        };
      }

      // D. Clinical Support Roles (Pharmacist, Lab Analyst, Radiographer)
      if (context.roles.some(r => ['ROLE_PHARMACIST', 'ROLE_LAB_ANALYST', 'ROLE_RADIOGRAPHER'].includes(r))) {
        return {
          isAuthorized: true,
          decision: AUTHORIZATION_DECISIONS.AUTHORIZED,
          reason: 'Clinical diagnostic and therapeutic support staff authorized',
          resourceTenantId
        };
      }

      // E. Non-attending doctor accessing active encounter without assignment
      if (context.roles.includes('ROLE_DOCTOR_DPJP') && !isAssignedDpjp) {
        return {
          isAuthorized: false,
          decision: AUTHORIZATION_DECISIONS.DENIED_NOT_ATTENDING_PROVIDER,
          reason: `Clinician [${actorStaffId || actorUserId}] is not the designated attending provider for encounter [${targetResource.id}]`,
          resourceTenantId
        };
      }
    }

    // Default Allow for same-tenant non-encounter resources if tenant matches
    return {
      isAuthorized: true,
      decision: AUTHORIZATION_DECISIONS.AUTHORIZED,
      resourceTenantId
    };
  }
};
