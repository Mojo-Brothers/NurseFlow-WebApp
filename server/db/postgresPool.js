/**
 * NurseFlow Enterprise HIS 2026 — PostgreSQL 16 Native Connection Pool & Telemetry
 * Standards: ACID Transaction Guarantee, Robust Connection Pooling & Live Telemetry Sampling
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Load .env.local or .env if present
const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      if (!process.env[k.trim()]) {
        process.env[k.trim()] = v.join('=').trim();
      }
    }
  });
}

export const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'Rfvtgb12@',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'nurseflow_enterprise_his',
  max: 20, // Enterprise default connection pool limit
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 3000
});

pool.on('error', (err) => {
  console.error('[PostgresPool] Unexpected client error on idle connection:', err.message);
});

export const postgresPoolService = {
  getPool: () => pool,

  query: async (text, params) => {
    const start = performance.now();
    const res = await pool.query(text, params);
    const duration = performance.now() - start;
    return { ...res, durationMs: duration };
  },

  getClient: async () => {
    return await pool.connect();
  },

  getPoolMetrics: () => {
    return {
      max: pool.options.max,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
  },

  /**
   * Sample High-Frequency PostgreSQL Engine Telemetry
   */
  sampleTelemetry: async () => {
    try {
      const dbStatsQuery = `
        SELECT 
          xact_commit, 
          xact_rollback, 
          blks_read, 
          blks_hit, 
          tup_inserted, 
          tup_updated, 
          tup_deleted,
          deadlocks
        FROM pg_stat_database 
        WHERE datname = 'nurseflow_enterprise_his';
      `;
      
      const activityQuery = `
        SELECT 
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) as total_connections
        FROM pg_stat_activity 
        WHERE datname = 'nurseflow_enterprise_his';
      `;

      const locksQuery = `
        SELECT 
          count(*) as total_locks,
          count(*) FILTER (WHERE NOT granted) as waiting_locks
        FROM pg_locks
        WHERE database = (SELECT oid FROM pg_database WHERE datname = 'nurseflow_enterprise_his');
      `;

      const [dbStatsRes, activityRes, locksRes] = await Promise.all([
        pool.query(dbStatsQuery),
        pool.query(activityQuery),
        pool.query(locksQuery)
      ]);

      const dbStats = dbStatsRes.rows[0] || {};
      const activity = activityRes.rows[0] || {};
      const locks = locksRes.rows[0] || {};

      const blksRead = parseInt(dbStats.blks_read || '0', 10);
      const blksHit = parseInt(dbStats.blks_hit || '0', 10);
      const cacheHitRatio = (blksHit + blksRead) > 0 
        ? ((blksHit / (blksHit + blksRead)) * 100).toFixed(2) 
        : '100.00';

      return {
        timestamp: new Date().toISOString(),
        poolMetrics: postgresPoolService.getPoolMetrics(),
        activeConnections: parseInt(activity.active_connections || '0', 10),
        idleConnections: parseInt(activity.idle_connections || '0', 10),
        totalConnections: parseInt(activity.total_connections || '0', 10),
        waitingLocks: parseInt(locks.waiting_locks || '0', 10),
        totalLocks: parseInt(locks.total_locks || '0', 10),
        xactCommit: parseInt(dbStats.xact_commit || '0', 10),
        xactRollback: parseInt(dbStats.xact_rollback || '0', 10),
        deadlocks: parseInt(dbStats.deadlocks || '0', 10),
        tupInserted: parseInt(dbStats.tup_inserted || '0', 10),
        tupUpdated: parseInt(dbStats.tup_updated || '0', 10),
        cacheHitRatio: `${cacheHitRatio}%`
      };
    } catch (err) {
      return {
        error: err.message,
        poolMetrics: postgresPoolService.getPoolMetrics()
      };
    }
  }
};
