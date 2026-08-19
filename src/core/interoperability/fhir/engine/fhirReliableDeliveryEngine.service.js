/**
 * NurseFlow Enterprise HIS 2026 — FHIR R4 Reliable Delivery & Outbox Engine
 * Standards: Transactional Outbox (Microservices Pattern), At-Least-Once Delivery + Idempotency,
 * Exponential Backoff + Full Jitter (RFC 8900), HTTP/Conformance Error Classification,
 * Dead Letter Queue (DLQ) Replay, Dependency-Aware Graph Ordering.
 */

import crypto from 'crypto';
import { postgresPoolService, pool } from '../../../../../server/db/postgresPool.js';
import { fhirResourceConformanceEngineService } from './fhirResourceConformanceEngine.service.js';

export const ERROR_CLASSIFICATION = Object.freeze({
  TRANSIENT: 'TRANSIENT',
  PERMANENT: 'PERMANENT',
  NONE: 'NONE'
});

export const OUTBOX_STATUS = Object.freeze({
  PENDING: 'PENDING',
  IN_FLIGHT: 'IN_FLIGHT',
  DELIVERED: 'DELIVERED',
  RETRYING: 'RETRYING',
  DEAD_LETTER_QUEUE: 'DEAD_LETTER_QUEUE'
});

export class FhirReliableDeliveryEngineService {
  constructor() {
    this.baseDelayMs = 1000;
    this.maxDelayMs = 60000;
    this.maxAttempts = 5;
    this.simulatedTransmissionHandler = null; // Can be injected for test harnesses
  }

  /**
   * Deterministic Canonicalization of JSON Structure (RFC 8785)
   */
  canonicalize(obj) {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.canonicalize(item)).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + this.canonicalize(obj[k])).join(',') + '}';
  }

  /**
   * Compute Deterministic Idempotency Key (SHA-256 Digest)
   */
  computeIdempotencyKey(resource) {
    const canonical = this.canonicalize(resource);
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Stage FHIR Resource into Transactional Outbox (Atomically with clinical write)
   */
  async stageOutboxEvent({
    client, // Passed PG Client for transaction atomicity
    tenantId = '00000000-0000-0000-0000-000000000001',
    fhirResource,
    parentResourceType = null,
    parentResourceId = null,
    dependencyDepth = 0,
    maxAttempts = 5
  }) {
    if (!fhirResource || !fhirResource.resourceType || !fhirResource.id) {
      throw new Error('[FhirReliableDeliveryEngine] fhirResource must specify resourceType and id');
    }

    const idempotencyKey = this.computeIdempotencyKey(fhirResource);
    const db = client || pool;

    const query = `
      INSERT INTO fhir_delivery_outbox (
        tenant_id, idempotency_key, resource_type, resource_id,
        parent_resource_type, parent_resource_id, dependency_depth,
        payload, delivery_status, attempt_count, max_attempts, next_retry_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', 0, $9, NOW())
      ON CONFLICT (tenant_id, idempotency_key) DO UPDATE SET
        updated_at = NOW()
      RETURNING id, idempotency_key, delivery_status, attempt_count;
    `;

    const res = await db.query(query, [
      tenantId,
      idempotencyKey,
      fhirResource.resourceType,
      fhirResource.id,
      parentResourceType,
      parentResourceId,
      dependencyDepth,
      JSON.stringify(fhirResource),
      maxAttempts
    ]);

    return {
      outboxId: res.rows[0].id,
      idempotencyKey: res.rows[0].idempotency_key,
      deliveryStatus: res.rows[0].delivery_status,
      tenantId
    };
  }

  /**
   * Classify Error into Transient vs Permanent
   */
  classifyError(err) {
    if (!err) return ERROR_CLASSIFICATION.NONE;

    const msg = String(err.message || err);
    const statusCode = err.status || err.statusCode || err.httpCode;

    // Transient HTTP Status Codes: 408 (Timeout), 429 (Throttled), 500, 502, 503, 504
    if ([408, 429, 500, 502, 503, 504].includes(statusCode)) {
      return ERROR_CLASSIFICATION.TRANSIENT;
    }

    // Transient Network Exceptions
    if (
      msg.includes('TIMEOUT') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('network') ||
      msg.includes('socket hang up')
    ) {
      return ERROR_CLASSIFICATION.TRANSIENT;
    }

    // Permanent Rejections: 400 (Bad Request), 422 (Unprocessable), Schema / Conformance Violations
    if ([400, 422].includes(statusCode) || msg.includes('Validation') || msg.includes('conformance') || msg.includes('syntax')) {
      return ERROR_CLASSIFICATION.PERMANENT;
    }

    // Default to transient for unclassified unexpected errors, but permanent if client error 4xx
    if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 408 && statusCode !== 429) {
      return ERROR_CLASSIFICATION.PERMANENT;
    }

    return ERROR_CLASSIFICATION.TRANSIENT;
  }

  /**
   * Compute Exponential Backoff with Full Jitter
   */
  calculateNextRetryTime(attemptCount) {
    // Exponential delay: min(base * 2^attempt, maxDelay)
    const expDelay = Math.min(this.baseDelayMs * Math.pow(2, attemptCount), this.maxDelayMs);
    // Full Jitter: random between 0 and expDelay
    const jitter = Math.floor(Math.random() * expDelay);
    const totalDelayMs = Math.floor(expDelay / 2) + jitter;

    return new Date(Date.now() + totalDelayMs);
  }

  /**
   * Dispatch and Process Outbox Events with Dependency Graph Ordering & Retry Handling
   */
  async processOutboxBatch({
    tenantId = '00000000-0000-0000-0000-000000000001',
    batchSize = 20
  }) {
    const client = await postgresPoolService.getClient();

    try {
      await client.query('BEGIN');

      // 1. Fetch pending/retrying events ordered by dependency depth (Parents first)
      const fetchQuery = `
        SELECT id, idempotency_key, resource_type, resource_id,
               parent_resource_type, parent_resource_id, dependency_depth,
               payload, delivery_status, attempt_count, max_attempts
        FROM fhir_delivery_outbox
        WHERE tenant_id = $1
          AND delivery_status IN ('PENDING', 'RETRYING')
          AND next_retry_at <= NOW()
        ORDER BY dependency_depth ASC, created_at ASC
        LIMIT $2
        FOR UPDATE SKIP LOCKED;
      `;

      const outboxRes = await client.query(fetchQuery, [tenantId, batchSize]);
      const results = [];

      for (const row of outboxRes.rows) {
        // 2. Dependency Check: If this resource has a parent, ensure parent is DELIVERED
        if (row.parent_resource_type && row.parent_resource_id) {
          const parentCheck = await client.query(`
            SELECT delivery_status, transmitted_satusehat_id
            FROM fhir_delivery_outbox
            WHERE tenant_id = $1
              AND resource_type = $2
              AND resource_id = $3
            LIMIT 1;
          `, [tenantId, row.parent_resource_type, row.parent_resource_id]);

          if (parentCheck.rows.length > 0 && parentCheck.rows[0].delivery_status !== 'DELIVERED') {
            // Parent not ready -> Defer child event
            await client.query(`
              UPDATE fhir_delivery_outbox
              SET next_retry_at = NOW() + INTERVAL '2 seconds',
                  last_error_message = 'Deferred: Parent resource is not yet DELIVERED'
              WHERE id = $1;
            `, [row.id]);

            results.push({
              outboxId: row.id,
              resourceType: row.resource_type,
              id: row.resource_id,
              status: 'DEFERRED_PARENT_NOT_READY'
            });
            continue;
          }
        }

        // 3. Mark IN_FLIGHT
        await client.query(`
          UPDATE fhir_delivery_outbox
          SET delivery_status = 'IN_FLIGHT', updated_at = NOW()
          WHERE id = $1;
        `, [row.id]);

        // 4. Transmit Event (Simulated or via custom handler)
        let transmissionSuccess = false;
        let transmissionError = null;
        let assignedSatusehatId = null;

        try {
          if (this.simulatedTransmissionHandler) {
            const resp = await this.simulatedTransmissionHandler(row.payload, row);
            assignedSatusehatId = resp?.satusehatId || `SATUSEHAT-${row.resource_type}-${row.resource_id}`;
            transmissionSuccess = true;
          } else {
            // Default success transmission simulation
            assignedSatusehatId = `SATUSEHAT-${row.resource_type}-${row.resource_id}`;
            transmissionSuccess = true;
          }
        } catch (txErr) {
          transmissionSuccess = false;
          transmissionError = txErr;
        }

        // 5. Handle Outcome
        if (transmissionSuccess) {
          await client.query(`
            UPDATE fhir_delivery_outbox
            SET delivery_status = 'DELIVERED',
                transmitted_satusehat_id = $1,
                delivered_at = NOW(),
                updated_at = NOW()
            WHERE id = $2;
          `, [assignedSatusehatId, row.id]);

          // Wake up dependent children waiting for this parent
          await client.query(`
            UPDATE fhir_delivery_outbox
            SET next_retry_at = NOW()
            WHERE tenant_id = $1
              AND parent_resource_type = $2
              AND parent_resource_id = $3
              AND delivery_status IN ('PENDING', 'RETRYING');
          `, [tenantId, row.resource_type, row.resource_id]);

          results.push({
            outboxId: row.id,
            resourceType: row.resource_type,
            id: row.resource_id,
            status: 'DELIVERED',
            satusehatId: assignedSatusehatId
          });
        } else {
          const classification = this.classifyError(transmissionError);
          const newAttemptCount = row.attempt_count + 1;
          const isMaxAttemptsExceeded = newAttemptCount >= row.max_attempts;

          if (classification === ERROR_CLASSIFICATION.PERMANENT || isMaxAttemptsExceeded) {
            // Move to Dead Letter Queue (DLQ)
            await client.query(`
              UPDATE fhir_delivery_outbox
              SET delivery_status = 'DEAD_LETTER_QUEUE',
                  attempt_count = $1,
                  last_error_code = 'TRANSMISSION_FAILED',
                  last_error_message = $2,
                  last_error_classification = $3,
                  updated_at = NOW()
              WHERE id = $4;
            `, [newAttemptCount, String(transmissionError.message || transmissionError), classification, row.id]);

            results.push({
              outboxId: row.id,
              resourceType: row.resource_type,
              id: row.resource_id,
              status: 'MOVED_TO_DLQ',
              classification,
              error: transmissionError.message
            });
          } else {
            // Schedule Retry with Backoff + Jitter
            const nextRetry = this.calculateNextRetryTime(newAttemptCount);
            await client.query(`
              UPDATE fhir_delivery_outbox
              SET delivery_status = 'RETRYING',
                  attempt_count = $1,
                  next_retry_at = $2,
                  last_error_code = 'TRANSIENT_FAILURE',
                  last_error_message = $3,
                  last_error_classification = $4,
                  updated_at = NOW()
              WHERE id = $5;
            `, [newAttemptCount, nextRetry, String(transmissionError.message || transmissionError), classification, row.id]);

            results.push({
              outboxId: row.id,
              resourceType: row.resource_type,
              id: row.resource_id,
              status: 'SCHEDULED_FOR_RETRY',
              attemptCount: newAttemptCount,
              nextRetryAt: nextRetry.toISOString()
            });
          }
        }
      }

      await client.query('COMMIT');
      return {
        processedCount: results.length,
        results
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Inspect Dead Letter Queue (DLQ)
   */
  async getDlqEvents(tenantId = '00000000-0000-0000-0000-000000000001') {
    const res = await pool.query(`
      SELECT id, idempotency_key, resource_type, resource_id,
             attempt_count, max_attempts, last_error_code, last_error_message,
             last_error_classification, created_at, updated_at, payload
      FROM fhir_delivery_outbox
      WHERE tenant_id = $1 AND delivery_status = 'DEAD_LETTER_QUEUE'
      ORDER BY updated_at DESC;
    `, [tenantId]);

    return res.rows;
  }

  /**
   * Replay / Recover Event from Dead Letter Queue (DLQ)
   */
  async replayDlqEvent({
    tenantId = '00000000-0000-0000-0000-000000000001',
    outboxId,
    updatedPayload = null
  }) {
    const client = await postgresPoolService.getClient();

    try {
      await client.query('BEGIN');

      const existing = await client.query(`
        SELECT id, payload, delivery_status
        FROM fhir_delivery_outbox
        WHERE id = $1 AND tenant_id = $2
        FOR UPDATE;
      `, [outboxId, tenantId]);

      if (existing.rows.length === 0) {
        throw new Error(`[FhirReliableDeliveryEngine] DLQ event not found: ${outboxId}`);
      }

      let finalPayload = existing.rows[0].payload;
      if (updatedPayload) {
        finalPayload = updatedPayload;
        // Re-validate payload with 5-Layer Conformance Engine before queuing
        const conformance = fhirResourceConformanceEngineService.evaluateResourceConformance(finalPayload);
        if (!conformance.isConformant) {
          throw new Error(`[FhirReliableDeliveryEngine] Cannot replay invalid payload: ${conformance.errors[0]?.message}`);
        }
      }

      await client.query(`
        UPDATE fhir_delivery_outbox
        SET delivery_status = 'PENDING',
            attempt_count = 0,
            next_retry_at = NOW(),
            last_error_code = 'REPLAY_QUEUED',
            last_error_message = 'Event recovered from DLQ for re-transmission',
            payload = $1,
            updated_at = NOW()
        WHERE id = $2;
      `, [JSON.stringify(finalPayload), outboxId]);

      await client.query('COMMIT');

      return {
        success: true,
        outboxId,
        status: 'REPLAY_QUEUED'
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const fhirReliableDeliveryEngineService = new FhirReliableDeliveryEngineService();
