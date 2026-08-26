/**
 * NurseFlow Enterprise HIS 2026 — Master Concurrency Guard Service
 * Standards: Optimistic Concurrency Control (OCC), Pessimistic Row-Level Locks, Canonical Lock Hierarchy
 * Arbiter: PostgreSQL 16 ACID Engine (Strictly Zero In-Memory Mutex Fallbacks)
 */

export class ConcurrencyConflictError extends Error {
  constructor(message, code = 'CONCURRENT_MODIFICATION', statusCode = 409, details = []) {
    super(message);
    this.name = 'ConcurrencyConflictError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const concurrencyGuardService = {
  /**
   * Execute an atomic update with Optimistic Concurrency Control (OCC) version checking.
   * If version mismatch occurs, throws RFC 7807 compatible ConcurrencyConflictError (HTTP 409).
   *
   * @param {Object} params
   * @param {Object} params.tx Active transaction context with tx.query
   * @param {string} params.tableName Table to update
   * @param {string} params.id Entity primary key UUID
   * @param {number} params.expectedVersion Expected current version
   * @param {string} params.setClause SQL SET clause (e.g., "title = $2, content = $3")
   * @param {Array} params.setParams Parameters matching setClause
   */
  async updateWithVersionCheck({
    tx,
    tableName,
    id,
    expectedVersion,
    setClause,
    setParams = []
  }) {
    if (!tx || typeof tx.query !== 'function') {
      throw new Error('[concurrencyGuardService] A valid transaction context (tx) is required.');
    }
    if (!tableName || !id || expectedVersion === undefined || expectedVersion === null) {
      throw new Error('[concurrencyGuardService] tableName, id, and expectedVersion are required.');
    }

    // Build the query: update version = version + 1 WHERE id = $id AND version = $expectedVersion
    const nextVersion = Number(expectedVersion) + 1;
    const queryText = `
      UPDATE ${tableName}
      SET ${setClause}, version = $${setParams.length + 1}, updated_at = NOW()
      WHERE id = $${setParams.length + 2} AND version = $${setParams.length + 3}
      RETURNING *;
    `;

    const allParams = [...setParams, nextVersion, id, Number(expectedVersion)];
    const result = await tx.query(queryText, allParams);

    if (result.rows.length === 0) {
      // Investigate why rowCount is 0: Check if row exists with a different version
      const currentRes = await tx.query(`SELECT id, version FROM ${tableName} WHERE id = $1;`, [id]);
      if (currentRes.rows.length === 0) {
        throw new ConcurrencyConflictError(
          `Entitas [${tableName}] dengan ID ${id} tidak ditemukan.`,
          'RESOURCE_NOT_FOUND',
          404,
          [{ id, table: tableName }]
        );
      }

      const currentVersion = currentRes.rows[0].version;
      throw new ConcurrencyConflictError(
        `Konflik konkurensi: Entitas [${tableName}] telah dimodifikasi oleh transaksi lain. Versi yang Anda kirim (${expectedVersion}) telah usang (Versi database saat ini: ${currentVersion}).`,
        'CONCURRENT_MODIFICATION',
        409,
        [{ id, table: tableName, expectedVersion: Number(expectedVersion), currentVersion }]
      );
    }

    return result.rows[0];
  },

  /**
   * Acquire a pessimistic row-level lock on a specific table entity (e.g. master_beds, inventory_batches).
   *
   * @param {Object} tx Transaction context
   * @param {string} tableName Database table
   * @param {string} id Record UUID
   * @param {string} [lockMode='FOR UPDATE'] Locking clause: 'FOR UPDATE' | 'FOR NO KEY UPDATE' | 'FOR SHARE'
   */
  async lockRow(tx, tableName, id, lockMode = 'FOR UPDATE') {
    if (!tx || typeof tx.query !== 'function') {
      throw new Error('[concurrencyGuardService] A valid transaction context (tx) is required.');
    }

    const queryText = `SELECT * FROM ${tableName} WHERE id = $1 ${lockMode};`;
    const result = await tx.query(queryText, [id]);

    if (result.rows.length === 0) {
      throw new ConcurrencyConflictError(
        `Gagal mengunci: Record [${tableName}] dengan ID ${id} tidak ditemukan.`,
        'RESOURCE_NOT_FOUND',
        404,
        [{ id, table: tableName }]
      );
    }

    return result.rows[0];
  }
};
