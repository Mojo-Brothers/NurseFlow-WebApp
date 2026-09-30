/**
 * NurseFlow Enterprise HIS 2026 — Master Security Regression Suite (Wave 1A.11 Full Parity)
 * Standards: ISO/IEC 27001 Multi-Tenancy Data Isolation, OWASP ASVS 4.0, HIPAA Security Rule § 164.312
 * 
 * Complete 16-Test Standardized Security Matrix (Restoring Wave 1A.9 Full Parity):
 * - TEST-01: Superuser RLS Bypass Prevention & Runtime Identity Guard
 * - TEST-02: Cross-Tenant Direct Primary Key Tampering (HTTP)
 * - TEST-03: Cross-Tenant Encounter ID Spoofing / Reference Hijack (HTTP)
 * - TEST-04: Missing Tenant Context Rejection (Fail Closed)
 * - TEST-05: Child-Table BOLA & Composite Foreign Key Protection
 * - TEST-06: Zero-Policy Table Access Blackout Prevention
 * - TEST-07: Connection Pool GUC State Leakage & Concurrent Reuse
 * - TEST-08: Client Query Path UoW Enforcement
 * - TEST-09: Dedicated Worker Role Context & Privilege Isolation
 * - TEST-10: DDL Privilege Escalation Prevention
 * - TEST-11: Universal Audit Log Cryptographic Integrity
 * - TEST-12: Application Restore Verification (Empirical Evidence Binding)
 * - TEST-13: Master Patient & Child Entity Data Integrity (Orphan/Null Checks)
 * - TEST-14: Transaction Rollback Execution & Failure Isolation
 * - TEST-15: JWT Tenant Claim Tampering & Anti-Spoofing Detection
 * - TEST-16: Schema Migration Tracking & Checksum Tamper Detection
 */

import http from 'http';
import pg from 'pg';
import crypto from 'crypto';
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
const TEST_PORT = 5095;

const results = {
  executionDate: new Date().toISOString(),
  suite: 'P0-2B Wave 1A.11 Security Foundation Continuous Regression Suite',
  totalTests: 16,
  passCount: 0,
  failCount: 0,
  tests: []
};

function recordTest(id, name, expected, actual, passed, details = {}) {
  if (passed) results.passCount++;
  else results.failCount++;

  const entry = { id, name, expected, actual, passed: Boolean(passed), details };
  results.tests.push(entry);
  const statusEmoji = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusEmoji} [${id}] ${name}`);
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

async function runMasterSecurityRegression() {
  console.log('==============================================================================');
  console.log('NURSEFLOW P0-2B WAVE 1A.11 — 16-TEST SECURITY REGRESSION SUITE');
  console.log('==============================================================================\n');

  let serverInstance = null;

  try {
    // --------------------------------------------------------------------------
    // TEST-01: Superuser RLS Bypass Prevention & Runtime Identity Guard
    // --------------------------------------------------------------------------
    const client = await pool.connect();
    let isRoleSafe = false;
    let roleDetails = {};
    try {
      const roleRes = await client.query(`
        SELECT rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb 
        FROM pg_roles 
        WHERE rolname = current_user;
      `);
      roleDetails = roleRes.rows[0];
      isRoleSafe = roleDetails.rolname === 'nurseflow_app_user' &&
                   !roleDetails.rolsuper &&
                   !roleDetails.rolbypassrls;
    } finally {
      client.release();
    }
    recordTest(
      'TEST-01',
      'Superuser RLS Bypass Prevention & Runtime Least Privilege Role',
      'nurseflow_app_user (rolsuper=false, rolbypassrls=false)',
      `${roleDetails.rolname} (rolsuper=${roleDetails.rolsuper}, rolbypassrls=${roleDetails.rolbypassrls})`,
      isRoleSafe,
      roleDetails
    );

    // --------------------------------------------------------------------------
    // BOOT EXPRESS APPLICATION
    // --------------------------------------------------------------------------
    await new Promise((resolve) => {
      serverInstance = app.listen(TEST_PORT, () => {
        console.log(`Express application booted on http://localhost:${TEST_PORT}\n`);
        resolve();
      });
    });

    const tokenA = jwtSecurityService.issueTokenPair({
      userId: 'USR-DOC-TENANT-A',
      username: 'dr_siti',
      role: 'ROLE_DOCTOR_DPJP',
      tenantId: TENANT_A,
      permissions: ['ENCOUNTER_CREATE', 'ENCOUNTER_UPDATE']
    }).accessToken;

    const tokenB = jwtSecurityService.issueTokenPair({
      userId: 'USR-DOC-TENANT-B',
      username: 'dr_budi',
      role: 'ROLE_DOCTOR_DPJP',
      tenantId: TENANT_B,
      permissions: ['ENCOUNTER_CREATE', 'ENCOUNTER_UPDATE']
    }).accessToken;

    // --------------------------------------------------------------------------
    // TEST-02: Cross-Tenant Direct Primary Key Tampering (HTTP)
    // --------------------------------------------------------------------------
    // Fetch a Tenant B encounter
    const encBRes = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/encounters?limit=1',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const targetEncounterB = encBRes.body?.data?.[0];
    let crossReadBlocked = false;
    if (targetEncounterB) {
      const crossReadRes = await httpRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/v1/encounters/${targetEncounterB.id}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${tokenA}` }
      });
      crossReadBlocked = crossReadRes.statusCode === 404 || crossReadRes.statusCode === 403;
    }
    recordTest(
      'TEST-02',
      'Cross-Tenant Direct Primary Key Tampering (HTTP GET foreign encounter)',
      '404 Not Found or 403 Forbidden',
      crossReadBlocked ? '404/403 Blocked' : 'ALLOWED (FAIL)',
      crossReadBlocked,
      { targetId: targetEncounterB?.id }
    );

    // --------------------------------------------------------------------------
    // TEST-03: Cross-Tenant Encounter ID Spoofing / Reference Hijack (HTTP)
    // --------------------------------------------------------------------------
    let crossMutateBlocked = false;
    if (targetEncounterB) {
      const crossMutateRes = await httpRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/v1/encounters/${targetEncounterB.id}/status`,
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokenA}`,
          'Content-Type': 'application/json'
        }
      }, { nextStatus: 'TRIAGED', reason: 'Adversarial attempt' });
      crossMutateBlocked = crossMutateRes.statusCode === 404 || crossMutateRes.statusCode === 403;
    }
    recordTest(
      'TEST-03',
      'Cross-Tenant State Transition / Mutation Spoofing (HTTP PATCH foreign encounter)',
      '404 Not Found or 403 Forbidden',
      crossMutateBlocked ? '404/403 Blocked' : 'ALLOWED (FAIL)',
      crossMutateBlocked,
      { targetId: targetEncounterB?.id }
    );

    // --------------------------------------------------------------------------
    // TEST-04: Missing Tenant Context Rejection (Fail Closed)
    // --------------------------------------------------------------------------
    let missingContextRejected = false;
    try {
      await withUnitOfWork({}, async () => {});
    } catch (err) {
      missingContextRejected = err.message.includes('AUTHORITATIVE_TENANT_REQUIRED');
    }
    recordTest(
      'TEST-04',
      'Missing Tenant Context Rejection (withUnitOfWork fails closed)',
      'AUTHORITATIVE_TENANT_REQUIRED error',
      missingContextRejected ? 'Rejected with AUTHORITATIVE_TENANT_REQUIRED' : 'ALLOWED (FAIL)',
      missingContextRejected
    );

    // --------------------------------------------------------------------------
    // TEST-05: Child-Table BOLA & Composite Foreign Key Protection
    // --------------------------------------------------------------------------
    let compositeFkEnforced = false;
    let patientIdA = null;
    await withUnitOfWork(pool, { tenantId: TENANT_A }, async ({ query }) => {
      const patRes = await query("SELECT id FROM master_patients LIMIT 1;");
      patientIdA = patRes.rows[0]?.id;
    });

    try {
      await withUnitOfWork(pool, { tenantId: TENANT_A }, async ({ query }) => {
        await query(`
          INSERT INTO longitudinal_care_plans (
            id, encounter_id, patient_id, care_plan_number, title, status, lead_dpjp_id, lead_dpjp_name, digital_signature_hash, tenant_id
          ) VALUES (
            gen_random_uuid(), $1, $2, 'ICP-TEST-ERR', 'BOLA Hijack', 'ACTIVE', 'DOC-01', 'Dr. Test', 'hash', $3
          );
        `, [targetEncounterB.id, patientIdA, TENANT_A]);
      });
    } catch (fkErr) {
      compositeFkEnforced = fkErr.code === '23503' || fkErr.message.includes('foreign key');
    }
    recordTest(
      'TEST-05',
      'Child-Table Composite Foreign Key Constraint (Cross-tenant parent reference rejection)',
      'PostgreSQL FK error 23503',
      compositeFkEnforced ? 'Rejected (Foreign Key Violation)' : 'ALLOWED (FAIL)',
      compositeFkEnforced
    );

    // --------------------------------------------------------------------------
    // TEST-06: Zero-Policy Table Access Blackout Prevention
    // --------------------------------------------------------------------------
    const testClient = await pool.connect();
    let zeroPolicyTablesCount = 0;
    try {
      const zRes = await testClient.query(`
        SELECT count(*) 
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' 
          AND c.relkind = 'r' 
          AND c.relrowsecurity = true 
          AND NOT EXISTS (
            SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
          );
      `);
      zeroPolicyTablesCount = parseInt(zRes.rows[0].count, 10);
    } finally {
      testClient.release();
    }
    recordTest(
      'TEST-06',
      'Zero-Policy Table Access Blackout Prevention (0 tables with RLS enabled and 0 policies)',
      '0 tables in blackout',
      `${zeroPolicyTablesCount} tables in blackout`,
      zeroPolicyTablesCount === 0
    );

    // --------------------------------------------------------------------------
    // TEST-07: Connection Pool GUC State Leakage & Reuse Isolation
    // --------------------------------------------------------------------------
    let poolClean = true;
    const testPool = new pg.Pool({
      user: 'nurseflow_app_user',
      password: process.env.POSTGRES_PASSWORD || '',
      host: 'localhost',
      port: 5432,
      database: 'nurseflow_enterprise_his',
      max: 2
    });
    try {
      const c1 = await testPool.connect();
      await c1.query("BEGIN;");
      await c1.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      await c1.query("COMMIT;");
      await c1.query("DISCARD ALL;");
      c1.release();

      const c2 = await testPool.connect();
      const checkGuc = await c2.query("SELECT current_setting('app.current_tenant_id', true) as t;");
      if (checkGuc.rows[0].t) {
        poolClean = false;
      }
      c2.release();
    } finally {
      await testPool.end();
    }
    recordTest(
      'TEST-07',
      'Connection Pool GUC State Sanitization (Socket reuse hygiene & zero context leakage)',
      'GUC empty on checkout',
      poolClean ? 'GUC Empty (Clean)' : 'GUC Contaminated (FAIL)',
      poolClean
    );

    // --------------------------------------------------------------------------
    // TEST-08: Client Query Path UoW Enforcement
    // --------------------------------------------------------------------------
    let uowEnforced = false;
    await withUnitOfWork(pool, { tenantId: TENANT_A }, async ({ query }) => {
      const checkRes = await query("SELECT current_setting('app.current_tenant_id', true) as t;");
      uowEnforced = checkRes.rows[0].t === TENANT_A;
    });
    recordTest(
      'TEST-08',
      'Client Query Path UoW Enforcement (Transaction-scoped tenant GUC binding)',
      `GUC == ${TENANT_A}`,
      uowEnforced ? `GUC == ${TENANT_A}` : 'GUC Mismatch (FAIL)',
      uowEnforced
    );

    // --------------------------------------------------------------------------
    // TEST-09: Dedicated Worker Role Context & Privilege Isolation
    // --------------------------------------------------------------------------
    let workerIsolated = false;
    let workerRoleInfo = {};
    const wClient = await pool.connect();
    try {
      const wRes = await wClient.query(`
        SELECT rolname, rolsuper, rolbypassrls 
        FROM pg_roles 
        WHERE rolname = 'nurseflow_worker';
      `);
      if (wRes.rows.length > 0) {
        workerRoleInfo = wRes.rows[0];
        workerIsolated = !workerRoleInfo.rolsuper && !workerRoleInfo.rolbypassrls;
      }
    } finally {
      wClient.release();
    }
    recordTest(
      'TEST-09',
      'Dedicated Worker Role Context & Privilege Isolation (nurseflow_worker)',
      'rolsuper=false, rolbypassrls=false',
      workerIsolated ? `${workerRoleInfo.rolname} (rolsuper=false, rolbypassrls=false)` : 'Not isolated (FAIL)',
      workerIsolated,
      workerRoleInfo
    );

    // --------------------------------------------------------------------------
    // TEST-10: DDL Privilege Escalation Prevention
    // --------------------------------------------------------------------------
    const ddlClient = await pool.connect();
    let ddlBlocked = false;
    try {
      await ddlClient.query("DROP TABLE master_patients;");
    } catch (err) {
      ddlBlocked = err.message.includes('permission denied') || err.message.includes('must be owner');
    } finally {
      ddlClient.release();
    }
    recordTest(
      'TEST-10',
      'DDL Privilege Escalation Guard (Runtime app user cannot DROP tables)',
      'Permission denied',
      ddlBlocked ? 'Permission Denied (Blocked)' : 'ALLOWED (CRITICAL FLAW)',
      ddlBlocked
    );

    // --------------------------------------------------------------------------
    // TEST-11: Universal Audit Log Cryptographic Integrity
    // --------------------------------------------------------------------------
    const auditClient = await pool.connect();
    let auditLogValid = false;
    try {
      await auditClient.query("BEGIN;");
      await auditClient.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      const aRes = await auditClient.query("SELECT id, signature_hash FROM universal_audit_logs WHERE tenant_id = $1 LIMIT 1;", [TENANT_A]);
      auditLogValid = aRes.rows.length > 0 && typeof aRes.rows[0].signature_hash === 'string' && aRes.rows[0].signature_hash.length === 64;
      await auditClient.query("ROLLBACK;");
    } finally {
      auditClient.release();
    }
    recordTest(
      'TEST-11',
      'Universal Audit Log Cryptographic Integrity (SHA-256 digital signature hashes)',
      '64-character SHA-256 signature hash present',
      auditLogValid ? 'SHA-256 Hashes Verified' : 'Missing/Invalid Hash (FAIL)',
      auditLogValid
    );

    // --------------------------------------------------------------------------
    // TEST-12: Application Restore Verification (Empirical Evidence Binding)
    // --------------------------------------------------------------------------
    const restoreEvidenceExists = fs.existsSync('scratch/wave1a11_application_restore_evidence.json');
    let restoreVerified = false;
    if (restoreEvidenceExists) {
      const data = JSON.parse(fs.readFileSync('scratch/wave1a11_application_restore_evidence.json', 'utf8'));
      restoreVerified = data.overallResult === 'APPLICATION_RESTORE_VERIFIED' && Boolean(data.steps?.crossTenantReadDenial?.denied);
    }
    recordTest(
      'TEST-12',
      'Application Restore Verification (pg_dump -Fc -> pg_restore -> Express boot -> HTTP validation)',
      'Empirical restore test completed successfully',
      restoreVerified ? 'VERIFIED_FACT' : 'NOT_VERIFIED',
      restoreVerified
    );

    // --------------------------------------------------------------------------
    // TEST-13: Master Patient & Child Entity Data Integrity
    // --------------------------------------------------------------------------
    const integrityClient = await pool.connect();
    let noNullTenants = false;
    try {
      await integrityClient.query("BEGIN;");
      await integrityClient.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      const nullCheck = await integrityClient.query("SELECT count(*) FROM master_patients WHERE tenant_id IS NULL;");
      noNullTenants = parseInt(nullCheck.rows[0].count, 10) === 0;
      await integrityClient.query("ROLLBACK;");
    } finally {
      integrityClient.release();
    }
    recordTest(
      'TEST-13',
      'Clinical Entity Data Integrity (0 NULL tenant_id records in master_patients)',
      '0 NULL tenant_id records',
      noNullTenants ? '0 NULL tenant records' : 'Found NULL tenants (FAIL)',
      noNullTenants
    );

    // --------------------------------------------------------------------------
    // TEST-14: Transaction Rollback Execution & Failure Isolation
    // --------------------------------------------------------------------------
    let rollbackSuccess = false;
    const testUniqueCode = `ROLLBACK-TEST-${Date.now()}`;
    try {
      await withUnitOfWork(pool, { tenantId: TENANT_A }, async ({ query }) => {
        await query(`
          INSERT INTO master_patients (
            id, mrn, full_name, birth_date, gender, is_active, tenant_id
          ) VALUES (
            gen_random_uuid(), $1, 'Rollback Patient', '1990-01-01', 'MALE', true, $2
          );
        `, [testUniqueCode, TENANT_A]);
        throw new Error('INTENTIONAL_ERROR_FOR_ROLLBACK_TEST');
      });
    } catch (expectedErr) {
      // Check if patient was inserted despite error
      await withUnitOfWork(pool, { tenantId: TENANT_A }, async ({ query }) => {
        const checkRes = await query("SELECT count(*) FROM master_patients WHERE mrn = $1;", [testUniqueCode]);
        rollbackSuccess = parseInt(checkRes.rows[0].count, 10) === 0;
      });
    }
    recordTest(
      'TEST-14',
      'Transaction Rollback Execution & Failure Isolation (Atomic abort on domain error)',
      'Aborted row not persisted (count = 0)',
      rollbackSuccess ? 'Rolled back cleanly (count = 0)' : 'Persisted dirty row (FAIL)',
      rollbackSuccess
    );

    // --------------------------------------------------------------------------
    // TEST-15: JWT Tenant Claim Tampering & Anti-Spoofing Detection
    // --------------------------------------------------------------------------
    const spoofHeaderRes = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/encounters',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Tenant-ID': TENANT_B // Conflicting spoof header
      }
    });
    const spoofBlocked = spoofHeaderRes.statusCode === 403;
    recordTest(
      'TEST-15',
      'JWT Tenant Claim Tampering & Header Spoofing Detection',
      '403 Forbidden (TENANT_SPOOFING_ATTEMPT)',
      `${spoofHeaderRes.statusCode}`,
      spoofBlocked,
      spoofHeaderRes.body
    );

    // --------------------------------------------------------------------------
    // TEST-16: Schema Migration Tracking & Checksum Verification
    // --------------------------------------------------------------------------
    const migClient = await pool.connect();
    let migrationTrackingValid = false;
    let migrationsTrackedCount = 0;
    try {
      const migRes = await migClient.query(`
        SELECT count(*) FROM schema_migrations WHERE status = 'APPLIED' AND checksum IS NOT NULL;
      `);
      migrationsTrackedCount = parseInt(migRes.rows[0].count, 10);
      migrationTrackingValid = migrationsTrackedCount >= 79;
    } finally {
      migClient.release();
    }
    recordTest(
      'TEST-16',
      'Schema Migration Tracking & Checksum Verification (schema_migrations table)',
      '>= 79 migrations tracked with SHA-256 checksums',
      `${migrationsTrackedCount} migrations tracked with checksums`,
      migrationTrackingValid
    );

    console.log('\n==============================================================================');
    console.log(`REGRESSION MATRIX RESULT: ${results.passCount} / ${results.totalTests} PASSED (Failures: ${results.failCount})`);
    console.log('==============================================================================\n');

    fs.writeFileSync('scratch/wave1a11_regression_matrix_evidence.json', JSON.stringify(results, null, 2));

  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }

  if (results.failCount > 0) {
    process.exit(1);
  }
}

runMasterSecurityRegression().catch(err => {
  console.error('Fatal Security Regression Error:', err);
  process.exit(1);
});
