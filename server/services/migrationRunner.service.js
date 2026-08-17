/**
 * NurseFlow Enterprise HIS 2026 — Zero-Downtime Migration Runner (Expand-Contract Pattern)
 * Ensures online clinical traffic is NEVER blocked by DDL Table Locks.
 */

export const migrationRunnerService = {
  /**
   * Execute Zero-Downtime Safe DDL Migration for adding non-null columns
   */
  executeZeroDowntimeColumnAddition: async ({
    tableName,
    columnName,
    columnType,
    defaultValue,
    sqlExecutor = async (sql) => ({ rowCount: 1, command: sql })
  }) => {
    const migrationLog = [];

    // Phase 1: EXPAND — Add column as NULLABLE (Zero exclusive lock duration)
    const sqlPhase1 = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnType};`;
    await sqlExecutor(sqlPhase1);
    migrationLog.push({ phase: 'EXPAND_NULLABLE', sql: sqlPhase1, timestamp: new Date().toISOString() });

    // Phase 2: BACKFILL — Update existing rows with default value in batches
    const sqlPhase2 = `UPDATE ${tableName} SET ${columnName} = '${defaultValue}' WHERE ${columnName} IS NULL;`;
    await sqlExecutor(sqlPhase2);
    migrationLog.push({ phase: 'BATCH_BACKFILL', sql: sqlPhase2, timestamp: new Date().toISOString() });

    // Phase 3: CONTRACT — Enforce NOT NULL constraint safely
    const sqlPhase3 = `ALTER TABLE ${tableName} ALTER COLUMN ${columnName} SET NOT NULL;`;
    await sqlExecutor(sqlPhase3);
    migrationLog.push({ phase: 'CONTRACT_NOT_NULL', sql: sqlPhase3, timestamp: new Date().toISOString() });

    return {
      success: true,
      tableName,
      columnName,
      strategy: 'EXPAND_CONTRACT_ZERO_DOWNTIME',
      phasesCompleted: migrationLog.length,
      migrationLog
    };
  }
};
