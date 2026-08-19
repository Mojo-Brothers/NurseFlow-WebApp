/**
 * NurseFlow Enterprise HIS 2026 — Practitioner PKI Key Lifecycle Management Service
 * Standards: NIST SP 800-57 (Key Management), Permenkes No. 24/2022 (TTE Tenaga Medis).
 */

import { postgresPoolService, pool } from '../../../server/db/postgresPool.js';
import { clinicalDocumentSignerService } from './clinicalDocumentSigner.service.js';
import crypto from 'crypto';

export const KEY_STATUS = {
  ACTIVE: 'ACTIVE',
  ROTATED_VERIFY_ONLY: 'ROTATED_VERIFY_ONLY',
  REVOKED: 'REVOKED'
};

export class PkiKeyLifecycleService {
  /**
   * Register a New Practitioner Key
   */
  async registerPractitionerKey({
    tenantId = '00000000-0000-0000-0000-000000000001',
    practitionerId,
    practitionerName,
    publicKeyPem
  }) {
    const keyId = crypto.randomUUID();
    const client = await postgresPoolService.getClient();
    try {
      await client.query(`
        INSERT INTO practitioner_key_lifecycle (
          id, tenant_id, practitioner_id, practitioner_name,
          public_key_pem, key_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW());
      `, [keyId, tenantId, practitionerId, practitionerName, publicKeyPem]);

      return {
        keyId,
        practitionerId,
        keyStatus: KEY_STATUS.ACTIVE
      };
    } finally {
      client.release();
    }
  }

  /**
   * Rotate a Practitioner Key: Old key moves to ROTATED_VERIFY_ONLY, New key becomes ACTIVE
   */
  async rotateKey({
    tenantId = '00000000-0000-0000-0000-000000000001',
    practitionerId,
    practitionerName,
    newPublicKeyPem
  }) {
    const client = await postgresPoolService.getClient();
    try {
      await client.query('BEGIN');

      // 1. Demote current active key to ROTATED_VERIFY_ONLY
      await client.query(`
        UPDATE practitioner_key_lifecycle
        SET key_status = 'ROTATED_VERIFY_ONLY', rotated_at = NOW()
        WHERE tenant_id = $1 AND practitioner_id = $2 AND key_status = 'ACTIVE';
      `, [tenantId, practitionerId]);

      // 2. Insert new active key
      const newKeyId = crypto.randomUUID();
      await client.query(`
        INSERT INTO practitioner_key_lifecycle (
          id, tenant_id, practitioner_id, practitioner_name,
          public_key_pem, key_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW());
      `, [newKeyId, tenantId, practitionerId, practitionerName, newPublicKeyPem]);

      await client.query('COMMIT');

      return {
        newKeyId,
        practitionerId,
        keyStatus: KEY_STATUS.ACTIVE,
        previousKeysStatus: KEY_STATUS.ROTATED_VERIFY_ONLY
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Revoke a Practitioner Key (Compromised or Practitioner Resignation)
   */
  async revokeKey({
    tenantId = '00000000-0000-0000-0000-000000000001',
    keyId,
    revocationReason = 'KEY_COMPROMISE_REPORTED'
  }) {
    const client = await postgresPoolService.getClient();
    try {
      await client.query(`
        UPDATE practitioner_key_lifecycle
        SET key_status = 'REVOKED', revoked_at = NOW(), revocation_reason = $1
        WHERE id = $2 AND tenant_id = $3;
      `, [revocationReason, keyId, tenantId]);

      return { keyId, keyStatus: KEY_STATUS.REVOKED, revocationReason };
    } finally {
      client.release();
    }
  }

  /**
   * Check if a Key is Permitted to Sign Documents
   */
  async canSignWithKey(keyId) {
    const res = await pool.query('SELECT key_status FROM practitioner_key_lifecycle WHERE id = $1', [keyId]);
    if (res.rows.length === 0) return false;
    return res.rows[0].key_status === KEY_STATUS.ACTIVE;
  }
}

export const pkiKeyLifecycleService = new PkiKeyLifecycleService();
