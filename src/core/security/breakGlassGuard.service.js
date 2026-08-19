/**
 * NurseFlow Enterprise HIS 2026 — Emergency Break-The-Glass Protocol & Rate Limiter Service
 * Standards: JCI MOI / IPSG, Permenkes No. 24/2022, NIST SP 800-207 Zero Trust Architecture.
 */

import { postgresPoolService, pool } from '../../../server/db/postgresPool.js';
import crypto from 'crypto';

export const BREAK_GLASS_LIMITS = {
  MAX_PER_HOUR: 5
};

export class BreakGlassGuardService {
  /**
   * Evaluate and Record Break-The-Glass Emergency Access Request
   */
  async requestBreakGlassAccess({
    tenantId = '00000000-0000-0000-0000-000000000001',
    practitionerId,
    practitionerName,
    practitionerRole,
    patientId,
    encounterId,
    reasonText,
    clientIp = '127.0.0.1'
  }) {
    // 1. Mandatory Reason Length Validation (>= 10 characters)
    if (!reasonText || reasonText.trim().length < 10) {
      return {
        isGranted: false,
        statusCode: 400,
        error: 'REASON_INSUFFICIENT_MINIMUM_10_CHARACTERS_REQUIRED'
      };
    }

    // 2. Query Recent Break-Glass Count in the Past Hour (Rate Limiter Check)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const countRes = await pool.query(`
      SELECT count(*) FROM break_glass_audit_ledger
      WHERE tenant_id = $1 AND practitioner_id = $2 AND created_at >= $3;
    `, [tenantId, practitionerId, oneHourAgo]);

    const recentCount = parseInt(countRes.rows[0].count, 10);
    const isRateLimitExceeded = recentCount >= BREAK_GLASS_LIMITS.MAX_PER_HOUR;
    const supervisorAlertDispatched = isRateLimitExceeded || recentCount >= (BREAK_GLASS_LIMITS.MAX_PER_HOUR - 1);

    // 3. Record in Break-Glass Audit Ledger
    const entryId = crypto.randomUUID();
    const client = await postgresPoolService.getClient();
    try {
      await client.query(`
        INSERT INTO break_glass_audit_ledger (
          id, tenant_id, practitioner_id, practitioner_name, practitioner_role,
          patient_id, encounter_id, reason_text, is_rate_limit_exceeded,
          supervisor_alert_dispatched, client_ip, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW());
      `, [
        entryId, tenantId, practitionerId, practitionerName, practitionerRole,
        patientId, encounterId, reasonText, isRateLimitExceeded,
        supervisorAlertDispatched, clientIp
      ]);

      if (isRateLimitExceeded) {
        return {
          isGranted: false,
          statusCode: 429,
          error: 'BREAK_GLASS_HOURLY_RATE_LIMIT_EXCEEDED',
          supervisorAlertDispatched: true,
          hourlyUsage: recentCount
        };
      }

      return {
        isGranted: true,
        statusCode: 200,
        entryId,
        supervisorAlertDispatched,
        hourlyUsage: recentCount + 1,
        message: 'EMERGENCY_BREAK_GLASS_AUTHORIZED'
      };
    } finally {
      client.release();
    }
  }
}

export const breakGlassGuardService = new BreakGlassGuardService();
