/**
 * NurseFlow Enterprise HIS 2026 — Central Unit of Work & Transaction Manager
 * Standards: PostgreSQL 16 ACID Transaction Integrity, Strict Connection Discipline & Fail-Closed Guardrails
 */

import crypto from 'crypto';
import { postgresPoolService } from './postgresPool.js';
import { structuredLoggerService } from '../services/structuredLogger.service.js';
import { withUnitOfWork } from './unitOfWork.js';

export const ISOLATION_LEVELS = {
  READ_COMMITTED: 'READ COMMITTED',
  REPEATABLE_READ: 'REPEATABLE READ',
  SERIALIZABLE: 'SERIALIZABLE'
};

class TransactionManager {
  /**
   * Execute a unit of work inside an atomic PostgreSQL transaction.
   * Ensures single-connection discipline, automatic commit/rollback, and resource cleanup.
   *
   * @param {Object} options Configuration options
   * @param {string} [options.correlationId] Correlation ID for tracing
   * @param {string} [options.isolationLevel='READ COMMITTED'] PostgreSQL transaction isolation level
   * @param {number} [options.timeoutMs=15000] Statement timeout in milliseconds
   * @param {Function} callback Async function receiving tx context: (tx) => Promise<any>
   * @returns {Promise<any>} Result of the callback
   */
  async withTransaction(options = {}, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (typeof callback !== 'function') {
      throw new Error('[TransactionManager] Callback function is required.');
    }

    const correlationId = options.correlationId || `CORR-TX-${Date.now()}`;
    const isolationLevel = options.isolationLevel || ISOLATION_LEVELS.READ_COMMITTED;

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    const txContext = {
      client,
      correlationId,
      isTransaction: true,
      processId: client.processID || null,

      /**
       * Execute a query on the dedicated transaction client.
       */
      query: async (text, params) => {
        return await client.query(text, params);
      },

      /**
       * Atomically append an immutable WORM audit log to universal_audit_logs.
       */
      audit: async ({
        actorId = 'SYSTEM',
        actorName = 'System Automated Process',
        actorRole = 'ROLE_SYSTEM',
        clientIp = '127.0.0.1',
        actionType = 'CREATE',
        resourceType,
        resourceId,
        patientId = null,
        beforeState = null,
        afterState = null,
        reason = 'Clinical transaction execution',
        signatureHash = null
      }) => {
        if (!resourceType || !resourceId) {
          throw new Error('[TransactionManager.audit] resourceType and resourceId are required.');
        }

        const sig = signatureHash || crypto.createHash('sha256')
          .update(`${actorId}:${actionType}:${resourceType}:${resourceId}:${JSON.stringify(afterState || {})}`)
          .digest('hex');

        const insertQuery = `
          INSERT INTO universal_audit_logs (
            id, actor_id, actor_name, actor_role, client_ip,
            action_type, resource_type, resource_id, patient_id,
            before_state, after_state, reason_for_action, signature_hash, created_at
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10, $11, $12, NOW()
          ) RETURNING id;
        `;

        const res = await client.query(insertQuery, [
          actorId,
          actorName,
          actorRole,
          clientIp,
          actionType,
          resourceType,
          String(resourceId),
          patientId,
          beforeState ? JSON.stringify(beforeState) : null,
          afterState ? JSON.stringify(afterState) : null,
          reason,
          sig
        ]);

        return {
          id: res.rows[0]?.id || crypto.randomUUID(),
          signature_hash: sig
        };
      },


      /**
       * Atomically enqueue a domain event to clinical_domain_outbox (Creation of Intent).
       */
      outbox: async ({
        aggregateType = 'CLINICAL_AGGREGATE',
        aggregateId,
        eventType,
        eventPayload = {},
        idempotencyKey = null
      }) => {
        if (!aggregateId || !eventType) {
          throw new Error('[TransactionManager.outbox] aggregateId and eventType are required.');
        }

        const insertQuery = `
          INSERT INTO clinical_domain_outbox (
            id, aggregate_type, aggregate_id, event_type, event_payload,
            status, retry_count, max_retries, idempotency_key, correlation_id, created_at
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4,
            'PENDING', 0, 5, $5, $6, NOW()
          ) RETURNING id, status, created_at;
        `;

        const res = await client.query(insertQuery, [
          aggregateType,
          String(aggregateId),
          eventType,
          JSON.stringify(eventPayload),
          idempotencyKey,
          correlationId
        ]);

        return res.rows[0];
      }
    };

    try {
      await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel};`);
      if (options.tenantId) {
        await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [String(options.tenantId).trim()]);
      }
      if (options.actorId) {
        await client.query("SELECT set_config('app.current_user_id', $1, true);", [String(options.actorId).trim()]);
      }
      const result = await callback(txContext);
      await client.query('COMMIT;');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK;');
      } catch (rollbackErr) {
        structuredLoggerService.error('TRANSACTION_ROLLBACK_FAILURE', {
          correlationId,
          error: rollbackErr.message
        });
      }
      throw error;
    } finally {
      try {
        await client.query('DISCARD ALL;');
      } catch (_) {}
      client.release();
    }
  }

  /**
   * Execute an authoritative Unit of Work bound to a specific tenant context.
   */
  async withUnitOfWork(options, callback) {
    return withUnitOfWork(options, callback);
  }
}

export const transactionManager = new TransactionManager();
export { withUnitOfWork } from './unitOfWork.js';

