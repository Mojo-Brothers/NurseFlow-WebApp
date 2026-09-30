/**
 * NurseFlow Enterprise HIS 2026 — Native PostgreSQL Migration & Lifecycle Engine
 * Phase 2 & 3 Remediation: Role Separation, Authoritative Tracking & Checksum Validation
 * 
 * Features:
 * 1. Dedicated Migration Authority: Uses MIGRATION_USER / POSTGRES_MIGRATION_USER with DDL privileges.
 * 2. Authoritative Tracking Table (schema_migrations): Records migration_id, sha256 checksum, duration, and timestamp.
 * 3. Tamper Detection: Detects if previously applied migrations have been altered.
 * 4. Idempotent Execution: Skips already applied migrations.
 * 5. Safe Bootstrap: Automatically baselines existing fully provisioned databases.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';

const { Client } = pg;

// Load .env.local or .env
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

const psqlPath = process.env.PSQL_PATH || (process.platform === 'win32' ? 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe' : 'psql');

// Phase 2 Remediation: Dedicated Migration Authority Role (never runtime app user)
const user = process.env.MIGRATION_USER || 
             process.env.POSTGRES_MIGRATION_USER || 
             process.env.POSTGRES_ADMIN_USER || 
             'postgres';

const password = process.env.MIGRATION_PASSWORD || 
                 process.env.POSTGRES_MIGRATION_PASSWORD || 
                 process.env.POSTGRES_ADMIN_PASSWORD || 
                 process.env.POSTGRES_PASSWORD || 
                 '';

const host = process.env.POSTGRES_HOST || 'localhost';
const port = process.env.POSTGRES_PORT || '5432';
const database = process.env.POSTGRES_DB || 'nurseflow_enterprise_his';
const migrationsDir = path.resolve('database', 'migrations');

const isBaselineMode = process.argv.includes('--baseline') || process.argv.includes('--bootstrap');

function computeChecksum(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function runMigrationEngine() {
  console.log('\n🚀 NURSEFLOW ENTERPRISE HIS 2026 — DATABASE MIGRATION ENGINE');
  console.log(`📍 Target Database : ${database} (${host}:${port})`);
  console.log(`👤 Migration Role  : ${user} (Dedicated DDL Authority)`);
  console.log(`📂 Migrations Path : ${migrationsDir}\n`);

  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Migration directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  const client = new Client({
    host,
    port: parseInt(port, 10),
    user,
    password,
    database
  });

  await client.connect();

  // 1. Ensure authoritative schema_migrations tracking table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_id VARCHAR(255) PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      execution_time_ms INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'APPLIED'
    );
  `);

  // 2. Query applied migrations
  const appliedRes = await client.query('SELECT migration_id, checksum, status FROM schema_migrations;');
  const appliedMap = new Map();
  appliedRes.rows.forEach(r => appliedMap.set(r.migration_id, r));

  // Check if database is already provisioned but schema_migrations is empty (Bootstrap condition)
  const tableCountRes = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';");
  const publicTableCount = parseInt(tableCountRes.rows[0].count, 10);
  const shouldAutoBaseline = (appliedMap.size === 0 && publicTableCount > 50) || isBaselineMode;

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && !f.includes('_down'))
    .sort();

  console.log(`Found ${files.length} migration files in repository.`);
  console.log(`Recorded in tracking table: ${appliedMap.size} migrations.`);
  if (shouldAutoBaseline) {
    console.log(`⚡ Existing database with ${publicTableCount} public tables detected. Performing baseline synchronization...\n`);
  } else {
    console.log('');
  }

  let passedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const checksum = computeChecksum(filePath);
    const existing = appliedMap.get(file);

    if (existing) {
      if (existing.checksum !== checksum) {
        console.warn(`  [${file}] ⚠️ CHECKSUM_MISMATCH: Migration modified after application! Stored: ${existing.checksum.slice(0, 10)}..., Current: ${checksum.slice(0, 10)}...`);
      } else {
        console.log(`  [${file}] ... ⏭️ SKIPPED (Already applied)`);
      }
      skippedCount++;
      continue;
    }

    if (shouldAutoBaseline) {
      // Record baseline entry without re-executing DDL against active database
      await client.query(`
        INSERT INTO schema_migrations (migration_id, checksum, applied_at, execution_time_ms, status)
        VALUES ($1, $2, clock_timestamp(), 0, 'APPLIED')
        ON CONFLICT (migration_id) DO UPDATE SET checksum = EXCLUDED.checksum;
      `, [file, checksum]);
      console.log(`  [${file}] ... 📌 BASELINED`);
      passedCount++;
      continue;
    }

    // Execute migration file
    process.stdout.write(`  [${file}] ... `);
    const start = Date.now();
    try {
      execSync(`"${psqlPath}" -U ${user} -h ${host} -p ${port} -d ${database} -f "${filePath}" -v ON_ERROR_STOP=1 --no-password`, {
        env: { ...process.env, PGPASSWORD: password },
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      const durationMs = Date.now() - start;

      await client.query(`
        INSERT INTO schema_migrations (migration_id, checksum, applied_at, execution_time_ms, status)
        VALUES ($1, $2, clock_timestamp(), $3, 'APPLIED')
        ON CONFLICT (migration_id) DO UPDATE 
        SET checksum = EXCLUDED.checksum, execution_time_ms = EXCLUDED.execution_time_ms, status = 'APPLIED';
      `, [file, checksum, durationMs]);

      console.log(`✅ APPLIED (${durationMs}ms)`);
      passedCount++;
    } catch (err) {
      const durationMs = Date.now() - start;
      console.log('❌ ERROR');
      const errMsg = err.stderr || err.stdout || err.message;
      console.error(`     Error Details: ${errMsg.trim()}`);

      await client.query(`
        INSERT INTO schema_migrations (migration_id, checksum, applied_at, execution_time_ms, status)
        VALUES ($1, $2, clock_timestamp(), $3, 'FAILED')
        ON CONFLICT (migration_id) DO UPDATE 
        SET checksum = EXCLUDED.checksum, execution_time_ms = EXCLUDED.execution_time_ms, status = 'FAILED';
      `, [file, checksum, durationMs]).catch(() => {});

      failedCount++;
      break; // Halt execution pipeline on error
    }
  }

  await client.end();

  console.log('\n================================================================');
  console.log(`🏁 MIGRATION EXECUTION COMPLETED`);
  console.log(`   Total Migrations : ${files.length}`);
  console.log(`   Newly Applied    : ${passedCount}`);
  console.log(`   Skipped          : ${skippedCount}`);
  console.log(`   Failed           : ${failedCount}`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runMigrationEngine().catch(err => {
  console.error('Fatal Migration Engine Error:', err.message);
  process.exit(1);
});
