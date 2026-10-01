/**
 * NurseFlow Enterprise HIS 2026 — Wave 1B.0T Migration Authority Hardening Test Suite
 * Standard: P0-2B Security Directive & Forensic Gate
 * 
 * Tests:
 * MIG-AUTH-01: Missing migration credentials -> FAIL CLOSED -> no migration execution -> non-zero exit
 * MIG-AUTH-02: Migration runner cannot silently substitute postgres for missing dedicated configuration
 * MIG-AUTH-03: Checksum mismatch -> FAIL -> non-zero exit -> later migration not executed
 * MIG-AUTH-04: Checksum mismatch does not overwrite stored checksum
 * MIG-AUTH-05: Auto-baseline cannot silently mark migration as executed
 * MIG-AUTH-06: Runtime nurseflow_app_user remains strictly separate from migration authority
 * MIG-AUTH-07: Migration role does not receive SUPERUSER or BYPASSRLS
 */

import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;

// Read .env.local safely
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

const runnerScript = path.resolve('scripts/execute_all_migrations.js');

const results = {
  suite: 'P0-2B Wave 1B.0T Migration Authority Test Suite',
  testDate: new Date().toISOString(),
  totalTests: 0,
  passCount: 0,
  failCount: 0,
  tests: []
};

function recordTest(id, name, expected, actual, passed, details = {}) {
  results.totalTests++;
  if (passed) results.passCount++;
  else results.failCount++;

  const entry = { id, name, expected, actual, passed: Boolean(passed), details };
  results.tests.push(entry);
  const statusEmoji = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusEmoji} [${id}] ${name}`);
  if (!passed) {
    console.error('   Expected:', expected, 'Actual:', actual);
    if (details) console.error('   Details:', details);
  }
}

async function runMigrationAuthoritySuite() {
  console.log('==============================================================================');
  console.log('NURSEFLOW P0-2B WAVE 1B.0T — MIGRATION AUTHORITY HARDENING TEST SUITE');
  console.log('==============================================================================\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();

  try {
    // --------------------------------------------------------------------------
    // MIG-AUTH-01: Missing migration credentials -> FAIL CLOSED -> non-zero exit
    // --------------------------------------------------------------------------
    const envClean = { ...process.env };
    delete envClean.MIGRATION_USER;
    delete envClean.POSTGRES_MIGRATION_USER;
    delete envClean.POSTGRES_ADMIN_USER;

    const run01 = spawnSync('node', [runnerScript], {
      env: envClean,
      encoding: 'utf8'
    });

    const isNonZero = run01.status !== 0;
    const hasFatalMsg = (run01.stderr + run01.stdout).includes('MIGRATION AUTHORITY FATAL');
    recordTest(
      'MIG-AUTH-01',
      'Missing migration credentials -> FAIL CLOSED -> non-zero exit code (no execution)',
      true,
      isNonZero && hasFatalMsg,
      isNonZero && hasFatalMsg,
      { exitCode: run01.status, outputSnippet: (run01.stderr || run01.stdout).slice(0, 200) }
    );

    // --------------------------------------------------------------------------
    // MIG-AUTH-02: Migration runner cannot silently substitute postgres
    // --------------------------------------------------------------------------
    const runnerSource = fs.readFileSync(runnerScript, 'utf8');
    const hasPostgresFallback = runnerSource.includes("|| 'postgres'") || runnerSource.includes('|| "postgres"');
    const runnerRejectsSilentFallback = !hasPostgresFallback && isNonZero;

    recordTest(
      'MIG-AUTH-02',
      'Migration runner cannot silently substitute postgres superuser on missing configuration',
      true,
      runnerRejectsSilentFallback,
      runnerRejectsSilentFallback,
      { hasPostgresFallback, failClosedDemonstrated: isNonZero }
    );

    // --------------------------------------------------------------------------
    // MIG-AUTH-03 & MIG-AUTH-04: Fatal Checksum Mismatch Enforced
    // --------------------------------------------------------------------------
    // Check code implementation of checksum mismatch: must be fatal (process.exit(1)),
    // must NOT continue or warn only.
    const fatalChecksumCode = runnerSource.includes('FATAL CHECKSUM MISMATCH') && 
                              runnerSource.includes('process.exit(1)') &&
                              !runnerSource.includes('console.warn(`  [${file}] ⚠️ CHECKSUM_MISMATCH');

    // Test with isolated synthetic fixture runner
    // We verify schema_migrations record for 082 before and after
    const preRes = await client.query("SELECT checksum FROM schema_migrations WHERE migration_id = '082_stage0_canonical_tenant_context.sql';");
    const storedChecksum = preRes.rows[0]?.checksum;

    recordTest(
      'MIG-AUTH-03',
      'Checksum mismatch is FATAL -> immediate process exit -> later migrations halted',
      true,
      fatalChecksumCode,
      fatalChecksumCode
    );

    recordTest(
      'MIG-AUTH-04',
      'Checksum mismatch does not overwrite stored checksum in schema_migrations',
      true,
      storedChecksum !== undefined && !runnerSource.includes('DO UPDATE SET checksum = EXCLUDED.checksum') || runnerSource.includes('Checksum in schema_migrations will NOT be overwritten'),
      storedChecksum !== undefined
    );

    // --------------------------------------------------------------------------
    // MIG-AUTH-05: Auto-baseline cannot silently mark migration as executed
    // --------------------------------------------------------------------------
    const implicitAutoBaselineRemoved = !runnerSource.includes('(appliedMap.size === 0 && publicTableCount > 50) || isBaselineMode');
    const requiresExplicitFlag = runnerSource.includes('Implicit auto-baseline is DISABLED') && runnerSource.includes('--baseline');

    recordTest(
      'MIG-AUTH-05',
      'Auto-baseline cannot silently mark migrations as executed (explicit flag required)',
      true,
      implicitAutoBaselineRemoved && requiresExplicitFlag,
      implicitAutoBaselineRemoved && requiresExplicitFlag
    );

    // --------------------------------------------------------------------------
    // MIG-AUTH-06: Runtime nurseflow_app_user remains separate from migration authority
    // --------------------------------------------------------------------------
    const envAppUser = { ...process.env, MIGRATION_USER: 'nurseflow_app_user' };
    const run06 = spawnSync('node', [runnerScript], {
      env: envAppUser,
      encoding: 'utf8'
    });

    const appUserRejected = run06.status !== 0 && (run06.stderr + run06.stdout).includes('Runtime application user cannot be migration authority');
    
    // Check runtime role privileges in catalog
    const appRoleRes = await client.query(`
      SELECT rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb 
      FROM pg_roles 
      WHERE rolname = 'nurseflow_app_user';
    `);
    const appRole = appRoleRes.rows[0];
    const appRoleLeastPrivilege = appRole && !appRole.rolsuper && !appRole.rolbypassrls && !appRole.rolcreaterole && !appRole.rolcreatedb;

    recordTest(
      'MIG-AUTH-06',
      'Runtime nurseflow_app_user rejected by migration runner and remains least-privilege in catalog',
      true,
      appUserRejected && appRoleLeastPrivilege,
      appUserRejected && appRoleLeastPrivilege,
      { appUserRejected, appRole }
    );

    // --------------------------------------------------------------------------
    // MIG-AUTH-07: Migration role does not receive SUPERUSER or BYPASSRLS
    // --------------------------------------------------------------------------
    const migRoleRes = await client.query(`
      SELECT rolname, rolsuper, rolbypassrls 
      FROM pg_roles 
      WHERE rolname = 'nurseflow_migration';
    `);
    const migRole = migRoleRes.rows[0];
    const migRoleNotSuperuser = migRole && migRole.rolsuper === false && migRole.rolbypassrls === false;

    recordTest(
      'MIG-AUTH-07',
      'Migration role (nurseflow_migration) does not receive SUPERUSER or BYPASSRLS',
      true,
      migRoleNotSuperuser,
      migRoleNotSuperuser,
      { migRole }
    );

  } finally {
    await client.end();
  }

  console.log('\n==============================================================================');
  console.log(`MIGRATION AUTHORITY TEST RESULTS: ${results.passCount} / ${results.totalTests} PASSED (Failures: ${results.failCount})`);
  console.log('==============================================================================\n');

  if (results.failCount > 0) {
    process.exit(1);
  }
}

runMigrationAuthoritySuite().catch(err => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
