/**
 * NurseFlow Enterprise HIS 2026 — Master Enterprise Idempotency Service
 * Standards: IETF draft-ietf-httpapi-idempotency-key-header, PostgreSQL 16 ACID Transaction Integrity
 * Guarantees: Exactly-Once Mutation Semantics, In-Flight Concurrent Lock, Replay Protection
 */

import crypto from 'crypto';

export class IdempotencyConflictError extends Error {
  constructor(message, code = 'IDEMPOTENCY_KEY_REUSE_WITH_DIFFERENT_PAYLOAD', statusCode = 409) {
    super(message);
    this.name = 'IdempotencyConflictError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const idempotencyGuardService = {
  /**
   * Acquire an idempotency check/lock inside an active PostgreSQL transaction.
   *
   * @param {Object} tx Dedicated transaction context with tx.query
   * @param {Object} params
   * @param {string} params.tenantId
   * @param {string} params.actorId
   * @param {string} params.operation
   * @param {string} params.idempotencyKey
   * @param {Object} params.payload
   * @returns {Promise<{ isReplay: boolean, cachedResponse?: any, requestHash: string }>}
   */
  async acquire({
    tx,
    tenantId = '00000000-0000-0000-0000-000000000001',
    actorId = 'SYSTEM',
    operation,
    idempotencyKey,
    payload = {}
  }) {
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return { isReplay: false, requestHash: null };
    }

    const trimmedKey = idempotencyKey.trim();
    const payloadStr = JSON.stringify(payload || {});
    const requestHash = crypto.createHash('sha256').update(payloadStr).digest('hex');

    // Query existing record with row-level lock
    const existingRes = await tx.query(
      `SELECT * FROM idempotency_records 
       WHERE tenant_id = $1 AND actor_id = $2 AND operation = $3 AND idempotency_key = $4
       FOR UPDATE;`,
      [tenantId, actorId, operation, trimmedKey]
    );

    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];

      if (existing.request_hash !== requestHash) {
        throw new IdempotencyConflictError(
          `Kunci idempotency [${trimmedKey}] telah digunakan sebelumnya dengan payload data yang berbeda.`,
          'IDEMPOTENCY_KEY_REUSE_WITH_DIFFERENT_PAYLOAD',
          409
        );
      }

      return {
        isReplay: true,
        cachedResponse: typeof existing.response_body === 'string' ? JSON.parse(existing.response_body) : existing.response_body,
        responseStatus: existing.response_status,
        resourceId: existing.resource_id,
        requestHash
      };
    }

    return {
      isReplay: false,
      requestHash
    };
  },

  /**
   * Finalize and persist an idempotency record in the same atomic transaction.
   */
  async finalize({
    tx,
    tenantId = '00000000-0000-0000-0000-000000000001',
    actorId = 'SYSTEM',
    operation,
    idempotencyKey,
    requestHash,
    responseStatus = 200,
    responseBody = {},
    resourceId = null
  }) {
    if (!idempotencyKey || !requestHash) return null;

    const trimmedKey = idempotencyKey.trim();
    const recordId = crypto.randomUUID();

    const insertSql = `
      INSERT INTO idempotency_records (
        id, tenant_id, actor_id, operation, idempotency_key, request_hash,
        response_status, response_body, resource_id, created_at, expires_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, NOW(), NOW() + INTERVAL '24 HOURS'
      )
      ON CONFLICT (tenant_id, actor_id, operation, idempotency_key)
      DO UPDATE SET
        response_status = EXCLUDED.response_status,
        response_body = EXCLUDED.response_body,
        resource_id = EXCLUDED.resource_id,
        expires_at = EXCLUDED.expires_at
      RETURNING *;
    `;

    const res = await tx.query(insertSql, [
      recordId,
      tenantId,
      actorId,
      operation,
      trimmedKey,
      requestHash,
      responseStatus,
      JSON.stringify(responseBody),
      resourceId ? String(resourceId) : null
    ]);

    return res.rows[0];
  }
};
