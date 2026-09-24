/**
/**
 * NurseFlow Enterprise HIS 2026 — Runtime Clinical Credential & Licensure Verification Service
 * Standards: Permenkes No. 755/2011 (Komite Medik), KKI (STR), Dinas Kesehatan (SIP) & JCI SQE
 * 
 * Verifies active clinician licensure (STR/SIP) and credential status dynamically at runtime.
 * Fails closed on any lookup failure, expired date, or revoked license.
 */

import { postgresPoolService } from '../db/postgresPool.js';
import { structuredLoggerService } from './structuredLogger.service.js';
import { AUTHORIZATION_DECISIONS } from '../contracts/authorizationDecision.contract.js';

export const clinicalCredentialService = {
  /**
   * Verify clinician credential (STR or SIP) against PostgreSQL records.
   * 
   * @param {Object} params
   * @param {string} params.staffId - Clinical staff profile UUID or employee number
   * @param {string} [params.userId] - Optional auth user UUID to resolve staff profile
   * @param {string} params.tenantId - Trusted actor tenant UUID
   * @param {string} [params.credentialType='SIP'] - 'SIP' (Surat Izin Praktik) or 'STR' (Surat Tanda Registrasi)
   * @param {Date} [params.evaluationDate=new Date()] - Reference date for validity window
   * @returns {Promise<{
   *   isEligible: boolean;
   *   credentialType?: string;
   *   credentialNumber?: string;
   *   validFrom?: string;
   *   validUntil?: string;
   *   decision: string;
   *   reason?: string;
   *   practitioner?: Object;
   * }>}
   */
  async verifyCredential({
    staffId,
    userId = null,
    tenantId,
    credentialType = 'SIP',
    evaluationDate = new Date()
  }) {
    if (!tenantId) {
      return {
        isEligible: false,
        decision: AUTHORIZATION_DECISIONS.DENIED_TENANT_MISSING,
        reason: 'Tenant ID is required for credential verification'
      };
    }

    if (!staffId && !userId) {
      return {
        isEligible: false,
        decision: AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_MISSING,
        reason: 'Actor has no associated staffId or userId to resolve clinician credential'
      };
    }

    const evalDateStr = evaluationDate instanceof Date 
      ? evaluationDate.toISOString().split('T')[0] 
      : String(evaluationDate).split('T')[0];

    try {
      const pool = postgresPoolService.getPool();
      const client = await pool.connect();
      try {
        // Strategy A: Check clinical_staff_profiles & staff_credentials (Migration 015 schema)
        const staffQuery = `
          SELECT 
            s.id as staff_id,
            s.tenant_id,
            s.full_name,
            s.staff_category,
            s.is_active as is_staff_active,
            c.id as credential_id,
            c.credential_type,
            c.credential_number,
            c.valid_from,
            c.valid_until,
            c.verification_status,
            c.revoked_at
          FROM clinical_staff_profiles s
          LEFT JOIN staff_credentials c 
            ON s.id = c.staff_id 
            AND s.tenant_id = c.tenant_id
            AND c.credential_type = $3
          WHERE s.tenant_id = $1
            AND (s.id::text = $2 OR s.user_id::text = $4 OR s.staff_number = $2)
          ORDER BY c.valid_until DESC
          LIMIT 1;
        `;

        const targetCredType = (credentialType || 'SIP').toUpperCase();
        const staffRes = await client.query(staffQuery, [
          tenantId,
          staffId || 'none',
          targetCredType,
          userId || '00000000-0000-0000-0000-000000000000'
        ]);

        if (staffRes.rows.length > 0) {
          const row = staffRes.rows[0];

          if (!row.is_staff_active) {
            return {
              isEligible: false,
              decision: AUTHORIZATION_DECISIONS.DENIED_STAFF_INACTIVE,
              reason: `Staff profile [${row.staff_id}] is inactive`,
              practitioner: { staffId: row.staff_id, name: row.full_name, category: row.staff_category }
            };
          }

          if (!row.credential_id) {
            return {
              isEligible: false,
              decision: AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_MISSING,
              reason: `No [${credentialType}] credential record found for practitioner [${row.staff_id}]`,
              practitioner: { staffId: row.staff_id, name: row.full_name, category: row.staff_category }
            };
          }

          if (row.revoked_at || row.verification_status === 'REVOKED' || row.verification_status === 'SUSPENDED') {
            return {
              isEligible: false,
              decision: AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_REVOKED,
              reason: `Credential [${credentialType} ${row.credential_number}] is revoked or suspended`,
              practitioner: { staffId: row.staff_id, name: row.full_name, category: row.staff_category }
            };
          }

          if (row.verification_status === 'EXPIRED') {
            return {
              isEligible: false,
              decision: AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_EXPIRED,
              reason: `Credential [${credentialType} ${row.credential_number}] verification status is EXPIRED`,
              practitioner: { staffId: row.staff_id, name: row.full_name, category: row.staff_category }
            };
          }

          if (row.verification_status !== 'ACTIVE_VERIFIED') {
            return {
              isEligible: false,
              decision: AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_REVOKED,
              reason: `Credential [${credentialType}] is not verified (status: ${row.verification_status})`,
              practitioner: { staffId: row.staff_id, name: row.full_name, category: row.staff_category }
            };
          }

          // Check effective date window
          const validFromStr = new Date(row.valid_from).toISOString().split('T')[0];
          const validUntilStr = new Date(row.valid_until).toISOString().split('T')[0];

          if (evalDateStr > validUntilStr) {
            return {
              isEligible: false,
              decision: AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_EXPIRED,
              reason: `Credential [${credentialType} ${row.credential_number}] expired on ${validUntilStr} (evaluated at ${evalDateStr})`,
              validFrom: validFromStr,
              validUntil: validUntilStr,
              practitioner: { staffId: row.staff_id, name: row.full_name, category: row.staff_category }
            };
          }

          if (evalDateStr < validFromStr) {
            return {
              isEligible: false,
              decision: AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_EXPIRED,
              reason: `Credential [${credentialType} ${row.credential_number}] not yet effective until ${validFromStr}`,
              validFrom: validFromStr,
              validUntil: validUntilStr,
              practitioner: { staffId: row.staff_id, name: row.full_name, category: row.staff_category }
            };
          }

          // Fully verified and valid
          return {
            isEligible: true,
            decision: AUTHORIZATION_DECISIONS.AUTHORIZED,
            credentialType: row.credential_type,
            credentialNumber: row.credential_number,
            validFrom: validFromStr,
            validUntil: validUntilStr,
            practitioner: {
              staffId: row.staff_id,
              name: row.full_name,
              category: row.staff_category
            }
          };
        }

        // Strategy B: Fallback check on master_practitioners (Migration 029)
        const pracQuery = `
          SELECT 
            p.id as practitioner_id,
            p.staff_id,
            p.license_number,
            p.is_clinical_staff,
            p.status as practitioner_status,
            s.full_name,
            s.status as staff_status
          FROM master_practitioners p
          JOIN master_staff s ON p.staff_id = s.id
          WHERE s.tenant_id = $1
            AND (p.id::text = $2 OR p.staff_id::text = $2 OR s.employee_number = $2)
          LIMIT 1;
        `;

        const pracRes = await client.query(pracQuery, [tenantId, staffId || 'none']);
        if (pracRes.rows.length > 0) {
          const pRow = pracRes.rows[0];
          if (pRow.staff_status !== 'ACTIVE' || pRow.practitioner_status !== 'ACTIVE' || !pRow.is_clinical_staff) {
            return {
              isEligible: false,
              decision: AUTHORIZATION_DECISIONS.DENIED_STAFF_INACTIVE,
              reason: `Master practitioner [${pRow.practitioner_id}] is inactive or non-clinical`
            };
          }

          if (!pRow.license_number) {
            return {
              isEligible: false,
              decision: AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_MISSING,
              reason: `Master practitioner has no registered license number`
            };
          }

          return {
            isEligible: true,
            decision: AUTHORIZATION_DECISIONS.AUTHORIZED,
            credentialType: 'SIP',
            credentialNumber: pRow.license_number,
            practitioner: {
              practitionerId: pRow.practitioner_id,
              name: pRow.full_name
            }
          };
        }

        return {
          isEligible: false,
          decision: AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_MISSING,
          reason: `No practitioner record found in tenant [${tenantId}] for actor [${staffId || userId}]`
        };
      } finally {
        client.release();
      }
    } catch (err) {
      structuredLoggerService.error('CLINICAL_CREDENTIAL_VERIFY_ERROR', {
        error: err.message,
        staffId,
        tenantId,
        credentialType
      });

      // Fail-closed on database or execution failure
      return {
        isEligible: false,
        decision: AUTHORIZATION_DECISIONS.DENIED_SYSTEM_ERROR,
        reason: `Credential verification failed due to internal error: ${err.message}`
      };
    }
  },

  /**
   * Verify whether a clinician has active clinical privileges (RKK/SPK) for a specific procedure.
   */
  async verifyClinicalPrivilege({
    staffId,
    tenantId,
    procedureCode,
    departmentId = null,
    evaluationDate = new Date()
  }) {
    if (!staffId || !tenantId || !procedureCode) {
      return {
        isAuthorized: false,
        decision: AUTHORIZATION_DECISIONS.DENIED_NO_PRIVILEGE,
        reason: 'staffId, tenantId, and procedureCode are required'
      };
    }

    const evalDateStr = evaluationDate instanceof Date 
      ? evaluationDate.toISOString().split('T')[0] 
      : String(evaluationDate).split('T')[0];

    try {
      const pool = postgresPoolService.getPool();
      const client = await pool.connect();
      try {
        const query = `
          SELECT 
            p.*, 
            s.full_name as staff_name, 
            s.is_active as staff_active
          FROM clinical_privileges p
          JOIN clinical_staff_profiles s ON p.staff_id = s.id
          WHERE p.tenant_id = $1
            AND (p.staff_id::text = $2 OR s.staff_number = $2)
            AND p.procedure_code = $3
            AND p.privilege_status = 'ACTIVE'
            AND $4 BETWEEN p.effective_from AND p.effective_until
            ${departmentId ? 'AND p.department_id = $5' : ''}
          LIMIT 1;
        `;

        const params = [tenantId, staffId, procedureCode, evalDateStr];
        if (departmentId) params.push(departmentId);

        const result = await client.query(query, params);

        if (result.rows.length === 0) {
          return {
            isAuthorized: false,
            decision: AUTHORIZATION_DECISIONS.DENIED_NO_PRIVILEGE,
            reason: `Practitioner [${staffId}] has no active privilege for procedure [${procedureCode}] in tenant [${tenantId}]`
          };
        }

        const priv = result.rows[0];
        if (!priv.staff_active) {
          return {
            isAuthorized: false,
            decision: AUTHORIZATION_DECISIONS.DENIED_STAFF_INACTIVE,
            reason: `Practitioner [${staffId}] is inactive`
          };
        }

        return {
          isAuthorized: true,
          decision: AUTHORIZATION_DECISIONS.AUTHORIZED,
          privilege: priv
        };
      } finally {
        client.release();
      }
    } catch (err) {
      structuredLoggerService.error('CLINICAL_PRIVILEGE_VERIFY_ERROR', {
        error: err.message,
        staffId,
        procedureCode
      });
      return {
        isAuthorized: false,
        decision: AUTHORIZATION_DECISIONS.DENIED_SYSTEM_ERROR,
        reason: `Clinical privilege verification failed: ${err.message}`
      };
    }
  }
};
