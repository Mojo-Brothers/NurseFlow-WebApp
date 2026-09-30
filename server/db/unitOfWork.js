/**
 * NurseFlow Enterprise HIS 2026 — Authoritative Unit of Work (Option C)
 * Standards: ISO/IEC 27001 Multi-Tenancy Data Isolation, HIPAA Security Rule § 164.312
 * 
 * Strict Multi-Tenant Transaction Boundary:
 * 1. Pre-execution Gate: Missing or invalid tenantId fails closed immediately (AUTHORITATIVE_TENANT_REQUIRED).
 * 2. Scoped GUC Injection: Context injected via SET LOCAL (set_config($1, $2, true)), scoped strictly to transaction.
 * 3. Atomic Transaction Lifecycle: BEGIN -> SET LOCAL -> OPERATION -> COMMIT / ROLLBACK.
 * 4. Three-Tier Socket Hygiene: DISCARD ALL executed in finally block before socket release.
 * 5. Fatal Connection Handling: Corrupted or aborted sockets are destroyed rather than returned dirty to pool.
 */

import { pool as defaultPool } from './postgresPool.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id) {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}

/**
 * Executes a business operation within an authoritative, tenant-isolated Unit of Work.
 * 
 * @param {Object|pg.Pool} poolOrOptions Pool instance or options object
 * @param {Object|Function} optionsOrCallback Options object or operation callback
 * @param {Function} [maybeCallback] Operation callback if pool was passed as first argument
 * @returns {Promise<any>} Result of the business operation
 */
export async function withUnitOfWork(poolOrOptions, optionsOrCallback, maybeCallback) {
  let targetPool = defaultPool;
  let options = {};
  let operation;

  // Polymorphic argument parsing
  if (poolOrOptions && typeof poolOrOptions.connect === 'function') {
    targetPool = poolOrOptions;
    options = optionsOrCallback || {};
    operation = maybeCallback;
  } else {
    options = poolOrOptions || {};
    operation = optionsOrCallback;
  }

  if (typeof operation !== 'function') {
    throw new Error('UNIT_OF_WORK_ERROR: An async operation callback is required.');
  }

  const { tenantId, actorId = null, userRole = null, isolationLevel = 'READ COMMITTED' } = options;

  // 1. Authoritative Pre-Condition Gate: Missing or non-UUID tenantId fails closed
  if (!tenantId || !isValidUuid(tenantId)) {
    throw new Error(`AUTHORITATIVE_TENANT_REQUIRED: Missing or invalid tenantId [${tenantId}]`);
  }

  const client = await targetPool.connect();
  let inTransaction = false;
  let fatalError = false;

  try {
    // 2. Start Transaction with specified isolation level
    await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);
    inTransaction = true;

    // 3. Inject Transaction-Local Tenant Context (SET LOCAL)
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId.trim()]);
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId.trim()]);

    if (actorId) {
      await client.query("SELECT set_config('app.current_user_id', $1, true)", [String(actorId).trim()]);
    }

    if (userRole) {
      await client.query("SELECT set_config('app.current_user_role', $1, true)", [String(userRole).trim()]);
    }

    // 4. Execute Domain Business Operation with Scoped Client Wrapper
    const uowContext = {
      client,
      tenantId: tenantId.trim(),
      actorId,
      userRole,
      query: (text, params) => client.query(text, params)
    };

    const result = await operation(uowContext);

    // 5. Commit Transaction
    await client.query('COMMIT');
    inTransaction = false;

    return result;
  } catch (error) {
    if (inTransaction) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        fatalError = true;
      }
      inTransaction = false;
    }
    throw error;
  } finally {
    // 6. Three-Tier Connection Sanitization Protocol
    try {
      if (!fatalError && !client._ending && !client._connectionError) {
        await client.query('DISCARD ALL');
      }
    } catch (_) {
      fatalError = true;
    }

    // 7. Release or Destroy Connection
    if (fatalError || client._ending || client._connectionError) {
      try {
        client.release(true); // Destroy socket
      } catch (_) {}
    } else {
      client.release();
    }
  }
}

export default {
  withUnitOfWork,
  isValidUuid
};
