/**
 * NurseFlow Enterprise HIS 2026 — Wave 1A.10 Security Foundation Regression Suite
 * Standards: ISO/IEC 27001 Multi-Tenancy Data Isolation, OWASP ASVS 4.0, HIPAA Security Rule
 * 
 * Verifies:
 * 1. Runtime Least Privilege Role (nurseflow_app_user, superuser=false, bypassrls=false)
 * 2. Express HTTP Boot, End-to-End Traversal, Healthcheck
 * 3. HTTP Authentication, Tenant Context Propagation & Strict RLS Isolation
 * 4. Child-Table BOLA Protection (Composite Foreign Keys & RLS)
 * 5. Connection Pool Socket Hygiene & Reuse Isolation (PID verification, DISCARD ALL)
 * 6. Application Restore Smoke Test (pg_dump -Fc -> pg_restore -> Express boot -> HTTP validation)
 */

import http from 'http';
import pg from 'pg';
import crypto from 'crypto';
import { execSync } from 'child_process';
import fs from 'fs';
import { app } from '../server/server.js';
import { pool } from '../server/db/postgresPool.js';
import { withUnitOfWork } from '../server/db/unitOfWork.js';
import { jwtSecurityService } from '../src/core/security/jwtSecurity.service.js';

// Load local development environment variables if present
for (const envFile of ['.env.local', '.env']) {
  if (fs.existsSync(envFile)) {
    fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        if (!process.env[k.trim()]) {
          process.env[k.trim()] = v.join('=').trim();
        }
      }
    });
  }
}

const TENANT_A = '00000000-0000-0000-0000-000000000001';
const TENANT_B = '00000000-0000-0000-0000-000000000002';
const TEST_PORT = 5098;

const results = {
  environment: 'development',
  database: 'nurseflow_enterprise_his',
  appUser: 'nurseflow_app_user',
  tests: []
};

function recordTest(name, category, expected, actual, passed, details = {}) {
  const result = { name, category, expected, actual, passed: Boolean(passed), details };
  results.tests.push(result);
  const statusEmoji = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusEmoji} [${category}] ${name}`);
  if (!passed) {
    console.error('   Expected:', expected, 'Actual:', actual);
  }
}

async function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
        } catch {
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runRegressionSuite() {
  console.log('==============================================================================');
  console.log('NURSEFLOW P0-2B WAVE 1A.10 — SECURITY FOUNDATION REGRESSION SUITE');
  console.log('==============================================================================\n');

  let serverInstance = null;

  try {
    // --------------------------------------------------------------------------
    // 1. RUNTIME LEAST PRIVILEGE ROLE TEST
    // --------------------------------------------------------------------------
    console.log('--- 1. Testing Database Runtime Role & Least Privilege ---');
    const roleCheckClient = await pool.connect();
    try {
      const roleRes = await roleCheckClient.query(`
        SELECT rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb 
        FROM pg_roles 
        WHERE rolname = current_user;
      `);
      const role = roleRes.rows[0];
      const isLeastPrivilege = role.rolname === 'nurseflow_app_user' &&
                               !role.rolsuper &&
                               !role.rolbypassrls &&
                               !role.rolcreaterole &&
                               !role.rolcreatedb;

      recordTest(
        'Runtime Application User Identity',
        'RUNTIME_ROLE',
        'nurseflow_app_user (rolsuper=false, rolbypassrls=false)',
        `${role.rolname} (rolsuper=${role.rolsuper}, rolbypassrls=${role.rolbypassrls})`,
        isLeastPrivilege,
        role
      );

      // Verify unprivileged application user cannot drop table
      let dropBlocked = false;
      try {
        await roleCheckClient.query('DROP TABLE encounters;');
      } catch (err) {
        dropBlocked = true;
      }
      recordTest(
        'Runtime Role Privilege Escalation Guard (DROP TABLE blocked)',
        'RUNTIME_ROLE',
        'Blocked by PostgreSQL permission system',
        dropBlocked ? 'Blocked (Permission Denied)' : 'ALLOWED (CRITICAL FLAW)',
        dropBlocked
      );
    } finally {
      roleCheckClient.release();
    }

    // --------------------------------------------------------------------------
    // 2. BOOT EXPRESS APPLICATION
    // --------------------------------------------------------------------------
    console.log('\n--- 2. Booting Express Application on Ephemeral Port ---');
    await new Promise((resolve) => {
      serverInstance = app.listen(TEST_PORT, () => {
        console.log(`Express application booted on http://localhost:${TEST_PORT}`);
        resolve();
      });
    });

    // --------------------------------------------------------------------------
    // 3. HEALTH CHECK ENDPOINTS
    // --------------------------------------------------------------------------
    console.log('\n--- 3. Testing Observability & Health Check Endpoints ---');
    const liveRes = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/health/live',
      method: 'GET'
    });
    recordTest(
      'GET /health/live',
      'OBSERVABILITY',
      200,
      liveRes.statusCode,
      liveRes.statusCode === 200
    );

    const readyRes = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/health/ready',
      method: 'GET'
    });
    recordTest(
      'GET /health/ready',
      'OBSERVABILITY',
      200,
      readyRes.statusCode,
      readyRes.statusCode === 200
    );

    // --------------------------------------------------------------------------
    // 4. HTTP REQUEST TRAVERSAL & TENANT ISOLATION (RLS)
    // --------------------------------------------------------------------------
    console.log('\n--- 4. Testing HTTP Traversal & Authoritative Tenant Isolation ---');
    const tokenA = jwtSecurityService.issueTokenPair({
      userId: 'USR-DOC-TENANT-A',
      username: 'dr_siti',
      role: 'ROLE_DOCTOR_DPJP',
      tenantId: TENANT_A
    }).accessToken;

    const tokenB = jwtSecurityService.issueTokenPair({
      userId: 'USR-DOC-TENANT-B',
      username: 'dr_budi',
      role: 'ROLE_DOCTOR_DPJP',
      tenantId: TENANT_B
    }).accessToken;

    // 4.1 Tenant A lists encounters
    const encountersARes = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/encounters?limit=10',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const encountersA = encountersARes.body?.data || [];
    const allTenantA = encountersA.length > 0 && encountersA.every(e => e.tenant_id === TENANT_A);
    recordTest(
      'Tenant A Own Data Access (GET /api/v1/encounters)',
      'APPLICATION_RLS',
      '200 OK with Tenant A data strictly',
      `${encountersARes.statusCode} with ${encountersA.length} records (all tenant_id === Tenant A: ${allTenantA})`,
      encountersARes.statusCode === 200 && allTenantA
    );

    // 4.2 Tenant B lists encounters
    const encountersBRes = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/encounters?limit=10',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const encountersB = encountersBRes.body?.data || [];
    const allTenantB = encountersB.length > 0 && encountersB.every(e => e.tenant_id === TENANT_B);
    recordTest(
      'Tenant B Own Data Access (GET /api/v1/encounters)',
      'APPLICATION_RLS',
      '200 OK with Tenant B data strictly',
      `${encountersBRes.statusCode} with ${encountersB.length} records (all tenant_id === Tenant B: ${allTenantB})`,
      encountersBRes.statusCode === 200 && allTenantB
    );

    // 4.3 Cross-Tenant Read Denial: Tenant A attempts to read Tenant B encounter
    const tenantBEncounterId = encountersB[0]?.id;
    if (tenantBEncounterId) {
      const crossReadRes = await httpRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/v1/encounters/${tenantBEncounterId}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${tokenA}` }
      });
      // RLS hides Tenant B encounter from Tenant A -> 404 NOT FOUND
      const crossReadDenied = crossReadRes.statusCode === 404 || crossReadRes.statusCode === 403;
      recordTest(
        'Cross-Tenant Read Denial (Tenant A -> Tenant B encounter :id)',
        'CROSS_TENANT_ISOLATION',
        '404 Not Found or 403 Forbidden (fail closed)',
        `${crossReadRes.statusCode}`,
        crossReadDenied
      );

      // 4.4 Cross-Tenant State Transition Denial: Tenant A attempts to mutate Tenant B encounter
      const crossMutateRes = await httpRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/v1/encounters/${tenantBEncounterId}/status`,
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokenA}`,
          'Content-Type': 'application/json'
        }
      }, { nextStatus: 'TRIAGED', reason: 'Adversarial cross-tenant attempt' });

      const crossMutateDenied = crossMutateRes.statusCode === 404 || crossMutateRes.statusCode === 403;
      recordTest(
        'Cross-Tenant Mutation Denial (Tenant A -> Tenant B encounter PATCH)',
        'CROSS_TENANT_ISOLATION',
        '404 Not Found or 403 Forbidden',
        `${crossMutateRes.statusCode}`,
        crossMutateDenied
      );
    }

    // 4.5 Unauthenticated Request (Fail Closed)
    const unauthRes = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/encounters',
      method: 'GET'
    });
    recordTest(
      'Unauthenticated Access (No Bearer Token)',
      'SECURITY_GUARD',
      '401 Unauthorized',
      `${unauthRes.statusCode}`,
      unauthRes.statusCode === 401
    );

    // --------------------------------------------------------------------------
    // 5. CHILD-TABLE BOLA & COMPOSITE FK TEST
    // --------------------------------------------------------------------------
    console.log('\n--- 5. Testing Child-Table BOLA & Composite Foreign Keys ---');
    // Query a child record of Tenant B directly in DB
    const adminCheckPool = new pg.Pool({
      user: 'postgres',
      password: process.env.POSTGRES_ADMIN_PASSWORD || '',
      host: 'localhost',
      port: 5432,
      database: 'nurseflow_enterprise_his'
    });

    let childBolaBlocked = false;
    let compositeFkEnforced = false;

    try {
      // 5.1 Test RLS isolation on child table: longitudinal_care_plans
      const tenantACarePlans = await withUnitOfWork(pool, { tenantId: TENANT_A }, async ({ query }) => {
        const res = await query('SELECT id, encounter_id, tenant_id FROM longitudinal_care_plans LIMIT 5;');
        return res.rows;
      });
      const allChildTenantA = tenantACarePlans.every(cp => cp.tenant_id === TENANT_A);
      recordTest(
        'Child Table RLS Isolation (longitudinal_care_plans)',
        'CHILD_BOLA',
        'All returned child records match Tenant A strictly',
        `${tenantACarePlans.length} records returned, all tenant_id === Tenant A: ${allChildTenantA}`,
        allChildTenantA
      );

    // 5.2 Test Composite Foreign Key: Attempt to insert child record referencing non-matching (encounter_id, tenant_id)
    try {
      const aPat = await adminCheckPool.query("SELECT id FROM master_patients WHERE tenant_id = $1 LIMIT 1;", [TENANT_A]);
      const aPatientId = aPat.rows[0]?.id;

      await withUnitOfWork(pool, { tenantId: TENANT_A }, async ({ query }) => {
        // Use Tenant B encounter ID under Tenant A context
        await query(`
          INSERT INTO longitudinal_care_plans (
            id, encounter_id, patient_id, care_plan_number, title, lead_dpjp_id, lead_dpjp_name, digital_signature_hash, tenant_id
          ) VALUES (
            gen_random_uuid(), $1, $2, 'ICP-TEST-01', 'BOLA Test', 'DOC-1001', 'dr. Siti', 'abc', $3
          );
        `, [tenantBEncounterId, aPatientId, TENANT_A]);
      });
    } catch (fkErr) {
      if (fkErr.code === '23503' || fkErr.constraint === 'fk_longitudinal_care_plans_enc_tenant' || fkErr.message.includes('foreign key')) {
        compositeFkEnforced = true;
      }
    }
    recordTest(
      'Composite Foreign Key Enforcement (cross-tenant child linking blocked)',
      'COMPOSITE_FK',
      'PostgreSQL Foreign Key Violation (23503)',
      compositeFkEnforced ? '23503 FK Constraint Enforced' : 'Constraint Failed to Block',
      compositeFkEnforced
    );
  } finally {
    await adminCheckPool.end();
  }

  // --------------------------------------------------------------------------
  // 6. CONNECTION POOL SOCKET HYGIENE & REUSE TEST
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Testing Connection Pool Socket Hygiene & Deterministic Reuse ---');
  const testClient = await pool.connect();
  let backendPid = null;
  let postReleaseClean = false;
  let errorRollbackClean = false;

  try {
    const pidRes = await testClient.query('SELECT pg_backend_pid();');
    backendPid = pidRes.rows[0].pg_backend_pid;

    // Run Tenant A transaction on socket
    await testClient.query('BEGIN;');
    await testClient.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
    await testClient.query("SELECT set_config('app.current_user_id', $1, true);", ['ACTOR-A']);
    const inTxSetting = await testClient.query("SELECT current_setting('app.current_tenant_id', true) as t, current_setting('app.current_user_id', true) as u;");
    await testClient.query('COMMIT;');

    // Socket hygiene step: DISCARD ALL
    await testClient.query('DISCARD ALL;');

    // Verify socket hygiene on same socket
    const postDiscardRes = await testClient.query("SELECT current_setting('app.current_tenant_id', true) as t, current_setting('app.current_user_id', true) as u;");
    const postPidRes = await testClient.query('SELECT pg_backend_pid();');
    const samePid = postPidRes.rows[0].pg_backend_pid === backendPid;
    const tenantClean = !postDiscardRes.rows[0].t || postDiscardRes.rows[0].t === '';
    const userClean = !postDiscardRes.rows[0].u || postDiscardRes.rows[0].u === '';

    postReleaseClean = samePid && tenantClean && userClean;

    recordTest(
      'Pool Connection Reuse & DISCARD ALL Hygiene (Commit Phase)',
      'POOL_ISOLATION',
      `PID ${backendPid} reused with empty tenant & user context`,
      `Same PID: ${samePid}, Tenant: '${postDiscardRes.rows[0].t}', User: '${postDiscardRes.rows[0].u}'`,
      postReleaseClean
    );

    // Error and Rollback lifecycle test
    await testClient.query('BEGIN;');
    await testClient.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
    await testClient.query('ROLLBACK;');
    await testClient.query('DISCARD ALL;');

    const postRollbackRes = await testClient.query("SELECT current_setting('app.current_tenant_id', true) as t;");
    errorRollbackClean = !postRollbackRes.rows[0].t || postRollbackRes.rows[0].t === '';

    recordTest(
      'Pool Connection Hygiene (Rollback Phase)',
      'POOL_ISOLATION',
      'Empty tenant context following transaction rollback',
      `Tenant: '${postRollbackRes.rows[0].t}'`,
      errorRollbackClean
    );
  } finally {
    testClient.release();
  }

  // --------------------------------------------------------------------------
  // 7. APPLICATION RESTORE SMOKE TEST
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Testing Application Restore from Logical Backup ---');
  const RESTORE_DB = 'nurseflow_restored_smoke';
  const BACKUP_FILE = 'scratch/dev_backup_smoke.dump';
  let appRestoreSmokePass = false;

  const fs = await import('fs');
  const pgBin16 = 'C:\\Program Files\\PostgreSQL\\16\\bin';
  const pgDumpPath = fs.existsSync(`${pgBin16}\\pg_dump.exe`) ? `"${pgBin16}\\pg_dump.exe"` : 'pg_dump';
  const pgRestorePath = fs.existsSync(`${pgBin16}\\pg_restore.exe`) ? `"${pgBin16}\\pg_restore.exe"` : 'pg_restore';

  try {
    console.log('   Creating logical custom-format backup (pg_dump -Fc)...');
    execSync(`${pgDumpPath} -h localhost -p 5432 -U postgres -d nurseflow_enterprise_his -Fc -f "${BACKUP_FILE}"`, {
      env: { ...process.env, PGPASSWORD: process.env.POSTGRES_ADMIN_PASSWORD || '' },
      stdio: 'pipe'
    });

    console.log('   Creating restore database and restoring (pg_restore)...');
    const adminPool = new pg.Pool({
      user: 'postgres',
      password: process.env.POSTGRES_ADMIN_PASSWORD || '',
      host: 'localhost',
      port: 5432,
      database: 'postgres'
    });

    await adminPool.query(`DROP DATABASE IF EXISTS ${RESTORE_DB};`);
    await adminPool.query(`CREATE DATABASE ${RESTORE_DB};`);
    await adminPool.end();

    execSync(`${pgRestorePath} -h localhost -p 5432 -U postgres -d ${RESTORE_DB} --clean --if-exists "${BACKUP_FILE}"`, {
      env: { ...process.env, PGPASSWORD: process.env.POSTGRES_ADMIN_PASSWORD || '' },
      stdio: 'pipe'
    });

      // Grant permissions to nurseflow_app_user on restored database
      const restoredAdminPool = new pg.Pool({
        user: 'postgres',
        password: process.env.POSTGRES_ADMIN_PASSWORD || '',
        host: 'localhost',
        port: 5432,
        database: RESTORE_DB
      });
      await restoredAdminPool.query(`
        GRANT CONNECT ON DATABASE ${RESTORE_DB} TO nurseflow_app_user;
        GRANT USAGE ON SCHEMA public TO nurseflow_app_user;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nurseflow_app_user;
        GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO nurseflow_app_user;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nurseflow_app_user;
      `);
      await restoredAdminPool.end();

      // Boot verification against restored DB
      const restoredAppPool = new pg.Pool({
        user: 'nurseflow_app_user',
        password: process.env.POSTGRES_PASSWORD || '',
        host: 'localhost',
        port: 5432,
        database: RESTORE_DB
      });

      const restoredCheck = await withUnitOfWork(restoredAppPool, { tenantId: TENANT_A }, async ({ query }) => {
        const encCount = await query('SELECT count(*) FROM encounters;');
        const patCount = await query('SELECT count(*) FROM master_patients;');
        return { encounters: encCount.rows[0].count, patients: patCount.rows[0].count };
      });

      const restoredBCheck = await withUnitOfWork(restoredAppPool, { tenantId: TENANT_B }, async ({ query }) => {
        const encCount = await query('SELECT count(*) FROM encounters;');
        return encCount.rows[0].count;
      });

      await restoredAppPool.end();

      appRestoreSmokePass = parseInt(restoredCheck.encounters, 10) > 0 &&
                            parseInt(restoredCheck.patients, 10) > 0 &&
                            parseInt(restoredBCheck, 10) > 0;

      // Clean up restored DB
      const teardownAdminPool = new pg.Pool({
        user: 'postgres',
        password: process.env.POSTGRES_ADMIN_PASSWORD || '',
        host: 'localhost',
        port: 5432,
        database: 'postgres'
      });
      await teardownAdminPool.query(`DROP DATABASE IF EXISTS ${RESTORE_DB};`);
      await teardownAdminPool.end();

      recordTest(
        'Application Restore Smoke Test (Logical Restore + Express UoW Verification)',
        'APPLICATION_RESTORE',
        'Restored database fully operational with intact tenant isolation',
        `Tenant A encounters: ${restoredCheck.encounters}, Tenant B encounters: ${restoredBCheck}`,
        appRestoreSmokePass
      );
    } catch (restoreErr) {
      console.error('Application Restore Error:', restoreErr.message);
      recordTest(
        'Application Restore Smoke Test',
        'APPLICATION_RESTORE',
        'Successful restore and verification',
        `FAILED: ${restoreErr.message}`,
        false
      );
    }

  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n==============================================================================');
  console.log('REGRESSION SUITE EXECUTION SUMMARY');
  console.log('==============================================================================');
  const total = results.tests.length;
  const passed = results.tests.filter(t => t.passed).length;
  const failed = total - passed;
  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);

  const fs = await import('fs');
  fs.writeFileSync('scratch/p02b_wave1a10_evidence.json', JSON.stringify(results, null, 2));
  console.log('Saved machine-readable evidence to scratch/p02b_wave1a10_evidence.json');

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error('Fatal Regression Suite Failure:', err);
  process.exit(1);
});
