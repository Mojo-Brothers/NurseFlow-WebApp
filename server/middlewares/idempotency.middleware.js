/**
 * NurseFlow Enterprise HIS 2026 — Master Enterprise Idempotency Middleware
 * Standards: RFC 7231, IETF draft-ietf-httpapi-idempotency-key-header, PostgreSQL 16 ACID
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';
import { PROBLEM_TYPES } from '../contracts/problemDetails.contract.js';

export const idempotencyMiddleware = (operationName = null) => {
  return async (req, res, next) => {
    // Only apply to state-changing methods (POST, PUT, PATCH, DELETE)
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim().length === 0) {
      return next();
    }

    const trimmedKey = idempotencyKey.trim();
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const tenantId = req.tenantId || req.user?.tenantId || '00000000-0000-0000-0000-000000000001';
    const actorId = req.user?.userId || req.user?.id || req.user?.email || 'ANONYMOUS';
    const operation = operationName || `${req.method} ${req.baseUrl || ''}${req.path || ''}`;

    // Canonical SHA-256 hash of JSON body
    const bodyString = JSON.stringify(req.body || {});
    const requestHash = crypto.createHash('sha256').update(bodyString).digest('hex');

    try {
      const pool = postgresPoolService.getPool();
      const existingRes = await pool.query(
        `SELECT * FROM idempotency_records 
         WHERE tenant_id = $1 AND actor_id = $2 AND operation = $3 AND idempotency_key = $4
         AND expires_at > NOW()`,
        [tenantId, actorId, operation, trimmedKey]
      );

      if (existingRes.rows.length > 0) {
        const existingRecord = existingRes.rows[0];

        // 1. Check for payload mismatch (Hash Mismatch -> 409 Conflict)
        if (existingRecord.request_hash !== requestHash) {
          res.setHeader('Content-Type', 'application/problem+json');
          res.setHeader('X-Correlation-ID', correlationId);
          return res.status(409).json({
            type: PROBLEM_TYPES.IDEMPOTENCY_CONFLICT,
            title: 'Idempotency Key Reuse Conflict',
            status: 409,
            detail: `Kunci idempotency [${trimmedKey}] telah digunakan sebelumnya dengan payload data yang berbeda.`,
            instance: req.originalUrl || req.path,
            correlationId,
            code: 'IDEMPOTENCY_KEY_REUSE_WITH_DIFFERENT_PAYLOAD'
          });
        }

        // 2. Safe Replay: Return original cached response
        res.setHeader('X-Idempotent-Replay', 'true');
        res.setHeader('X-Correlation-ID', correlationId);
        return res.status(existingRecord.response_status).json(existingRecord.response_body);
      }


      // Attach key to req for internal service awareness
      req.idempotencyKey = trimmedKey;

      // Intercept res.send/res.json to record the response atomically
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only save successful responses (2xx / 4xx)
        if (res.statusCode < 500) {
          const resourceId = body?.data?.id || body?.id || null;
          pool.query(
            `INSERT INTO idempotency_records (
               id, tenant_id, actor_id, operation, idempotency_key, request_hash,
               response_status, response_body, resource_id, created_at, expires_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW() + INTERVAL '24 HOURS')
             ON CONFLICT (tenant_id, actor_id, operation, idempotency_key) DO NOTHING`,
            [
              crypto.randomUUID(),
              tenantId,
              actorId,
              operation,
              trimmedKey,
              requestHash,
              res.statusCode,
              JSON.stringify(body),
              resourceId
            ]
          ).catch(err => {
            console.error('[IdempotencyMiddleware] Error saving idempotency record:', err.message);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error('[IdempotencyMiddleware] Execution error:', err.message);
      next();
    }
  };
};
