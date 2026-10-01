/**
 * NurseFlow Enterprise HIS 2026 — Wave 1B.0 Security Containment Test Suite
 * Standards: ISO/IEC 27001 Multi-Tenancy Data Isolation, OWASP ASVS 4.0, HIPAA § 164.312
 * 
 * Verifies the 5 Bounded Containment Goals:
 * 1. Runtime privilege hardening (TRUNCATE revoked, legitimate DML preserved)
 * 2. Operating theatres & radiology orders dual-GUC conflict elimination & tenant isolation
 * 3. Policy normalization (0 duplicate policies, 0 fail-open policies)
 * 4. Secret hygiene (0 secrets in tracked source and working-tree artifacts)
 * 5. Migration tracking (080 and 081 tracked with checksums)
 */

import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import { execSync } from 'child_process';
import { pool } from '../server/db/postgresPool.js';

const TENANT_A = '00000000-0000-0000-0000-000000000001';
const TENANT_B = '00000000-0000-0000-0000-000000000002';

const results = {
  suite: 'P0-2B Wave 1B.0 Security Containment Suite',
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
  }
}

async function runContainmentSuite() {
  console.log('==============================================================================');
  console.log('NURSEFLOW P0-2B WAVE 1B.0 — SECURITY CONTAINMENT & PRE-UOW VERIFICATION');
  console.log('==============================================================================\n');

  const client = await pool.connect();

  try {
    // --------------------------------------------------------------------------
    // PRIV-01: Runtime role is non-superuser
    // --------------------------------------------------------------------------
    const roleRes = await client.query(`
      SELECT rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb 
      FROM pg_roles 
      WHERE rolname = current_user;
    `);
    const roleInfo = roleRes.rows[0];
    recordTest(
      'PRIV-01',
      'Runtime role is non-superuser (rolsuper = false)',
      false,
      roleInfo.rolsuper,
      roleInfo.rolsuper === false
    );

    // --------------------------------------------------------------------------
    // PRIV-02: Runtime role has least privilege role flags
    // --------------------------------------------------------------------------
    const leastPrivRole = roleInfo.rolbypassrls === false && 
                          roleInfo.rolcreaterole === false && 
                          roleInfo.rolcreatedb === false;
    recordTest(
      'PRIV-02',
      'Runtime role has rolbypassrls=false, rolcreaterole=false, rolcreatedb=false',
      true,
      leastPrivRole,
      leastPrivRole
    );

    // --------------------------------------------------------------------------
    // PRIV-03: Runtime role cannot TRUNCATE protected application tables
    // --------------------------------------------------------------------------
    let truncateBlocked = false;
    try {
      await client.query('TRUNCATE TABLE encounters;');
    } catch (err) {
      truncateBlocked = err.message.includes('permission denied') || err.message.includes('must be owner');
    }
    const truncateGrants = await client.query(`
      SELECT count(*) as c FROM information_schema.role_table_grants 
      WHERE grantee = 'nurseflow_app_user' AND privilege_type = 'TRUNCATE';
    `);
    const zeroTruncateGrants = parseInt(truncateGrants.rows[0].c, 10) === 0;
    recordTest(
      'PRIV-03',
      'Runtime role cannot TRUNCATE protected application tables (0 table grants & runtime denial)',
      '0 TRUNCATE grants & Permission Denied',
      `Grants: ${truncateGrants.rows[0].c}, Denied: ${truncateBlocked}`,
      zeroTruncateGrants && truncateBlocked
    );

    // --------------------------------------------------------------------------
    // PRIV-04: Required SELECT still works
    // --------------------------------------------------------------------------
    let selectWorks = false;
    try {
      await client.query('BEGIN;');
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      const sRes = await client.query('SELECT count(*) as c FROM encounters;');
      selectWorks = parseInt(sRes.rows[0].c, 10) > 0;
      await client.query('ROLLBACK;');
    } catch (_) {}
    recordTest(
      'PRIV-04',
      'Required SELECT privilege preserved and operational',
      true,
      selectWorks,
      selectWorks
    );

    // --------------------------------------------------------------------------
    // PRIV-05: Required INSERT still works
    // --------------------------------------------------------------------------
    let insertWorks = false;
    const testOtId = crypto.randomUUID();
    try {
      await client.query('BEGIN;');
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      const iRes = await client.query(`
        INSERT INTO operating_theatres (id, tenant_id, theatre_code, theatre_name, is_active)
        VALUES ($1, $2, $3, 'Test OT Insert', true)
        RETURNING id;
      `, [testOtId, TENANT_A, `OT-INS-${Date.now()}`]);
      insertWorks = iRes.rows.length === 1;
      await client.query('ROLLBACK;');
    } catch (_) {}
    recordTest(
      'PRIV-05',
      'Required INSERT privilege preserved and operational',
      true,
      insertWorks,
      insertWorks
    );

    // --------------------------------------------------------------------------
    // PRIV-06: Required UPDATE still works
    // --------------------------------------------------------------------------
    let updateWorks = false;
    try {
      await client.query('BEGIN;');
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      await client.query(`
        INSERT INTO operating_theatres (id, tenant_id, theatre_code, theatre_name, is_active)
        VALUES ($1, $2, $3, 'Test OT Update Pre', true);
      `, [testOtId, TENANT_A, `OT-UPD-${Date.now()}`]);
      const uRes = await client.query(`
        UPDATE operating_theatres SET theatre_name = 'Test OT Update Post' WHERE id = $1;
      `, [testOtId]);
      updateWorks = uRes.rowCount === 1;
      await client.query('ROLLBACK;');
    } catch (_) {}
    recordTest(
      'PRIV-06',
      'Required UPDATE privilege preserved and operational',
      true,
      updateWorks,
      updateWorks
    );

    // --------------------------------------------------------------------------
    // PRIV-07: Required DELETE still works
    // --------------------------------------------------------------------------
    let deleteWorks = false;
    try {
      await client.query('BEGIN;');
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      await client.query(`
        INSERT INTO operating_theatres (id, tenant_id, theatre_code, theatre_name, is_active)
        VALUES ($1, $2, $3, 'Test OT Delete', true);
      `, [testOtId, TENANT_A, `OT-DEL-${Date.now()}`]);
      const dRes = await client.query('DELETE FROM operating_theatres WHERE id = $1;', [testOtId]);
      deleteWorks = dRes.rowCount === 1;
      await client.query('ROLLBACK;');
    } catch (_) {}
    recordTest(
      'PRIV-07',
      'Required DELETE privilege preserved and operational',
      true,
      deleteWorks,
      deleteWorks
    );

    // --------------------------------------------------------------------------
    // RLS-01: operating_theatres tenant isolation
    // RLS-03: Tenant A cannot read Tenant B
    // RLS-04: Tenant A cannot update Tenant B
    // RLS-05: Tenant B cannot read Tenant A
    // --------------------------------------------------------------------------
    let otIsoPassed = false;
    let tA_cannot_read_tB = false;
    let tA_cannot_update_tB = false;
    let tB_cannot_read_tA = false;

    const otA = crypto.randomUUID();
    const otB = crypto.randomUUID();

    try {
      await client.query('BEGIN;');
      // Seed Tenant A theatre
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      await client.query(`
        INSERT INTO operating_theatres (id, tenant_id, theatre_code, theatre_name, is_active)
        VALUES ($1, $2, $3, 'OR-Suite-A', true);
      `, [otA, TENANT_A, `OT-ISO-A-${Date.now()}`]);

      // Seed Tenant B theatre
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_B]);
      await client.query(`
        INSERT INTO operating_theatres (id, tenant_id, theatre_code, theatre_name, is_active)
        VALUES ($1, $2, $3, 'OR-Suite-B', true);
      `, [otB, TENANT_B, `OT-ISO-B-${Date.now()}`]);

      // Tenant A queries
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      const aReadA = await client.query('SELECT id FROM operating_theatres WHERE id = $1;', [otA]);
      const aReadB = await client.query('SELECT id FROM operating_theatres WHERE id = $1;', [otB]);
      const aUpdateB = await client.query("UPDATE operating_theatres SET theatre_name = 'Hacked' WHERE id = $1;", [otB]);

      // Tenant B queries
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_B]);
      const bReadB = await client.query('SELECT id FROM operating_theatres WHERE id = $1;', [otB]);
      const bReadA = await client.query('SELECT id FROM operating_theatres WHERE id = $1;', [otA]);

      tA_cannot_read_tB = aReadB.rows.length === 0;
      tA_cannot_update_tB = aUpdateB.rowCount === 0;
      tB_cannot_read_tA = bReadA.rows.length === 0;

      otIsoPassed = aReadA.rows.length === 1 && bReadB.rows.length === 1 && 
                    tA_cannot_read_tB && tA_cannot_update_tB && tB_cannot_read_tA;

      await client.query('ROLLBACK;');
    } catch (_) {}

    recordTest(
      'RLS-01',
      'operating_theatres tenant isolation under canonical app.current_tenant_id GUC',
      'Own rows visible, foreign rows hidden',
      otIsoPassed ? '100% Isolated' : 'Isolation Breach',
      otIsoPassed
    );

    recordTest(
      'RLS-03',
      'Tenant A cannot read Tenant B entities (Cross-Tenant Read Blocked)',
      '0 rows returned',
      tA_cannot_read_tB ? '0 rows returned (Blocked)' : 'Read Leaked',
      tA_cannot_read_tB
    );

    recordTest(
      'RLS-04',
      'Tenant A cannot update Tenant B entities (Cross-Tenant Update Blocked)',
      '0 rows updated',
      tA_cannot_update_tB ? '0 rows updated (Blocked)' : 'Update Allowed',
      tA_cannot_update_tB
    );

    recordTest(
      'RLS-05',
      'Tenant B cannot read Tenant A entities (Reverse Cross-Tenant Read Blocked)',
      '0 rows returned',
      tB_cannot_read_tA ? '0 rows returned (Blocked)' : 'Read Leaked',
      tB_cannot_read_tA
    );

    // --------------------------------------------------------------------------
    // RLS-02: radiology_orders tenant isolation
    // --------------------------------------------------------------------------
    let radIsoPassed = false;
    const radA = crypto.randomUUID();
    const radB = crypto.randomUUID();
    const ordA = crypto.randomUUID();
    const ordB = crypto.randomUUID();

    try {
      await client.query('BEGIN;');
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      const encA = (await client.query('SELECT id, patient_id, episode_id FROM encounters WHERE tenant_id = $1 LIMIT 1;', [TENANT_A])).rows[0];

      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_B]);
      const encB = (await client.query('SELECT id, patient_id, episode_id FROM encounters WHERE tenant_id = $1 LIMIT 1;', [TENANT_B])).rows[0];

      // Seed clinical orders
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      await client.query(`
        INSERT INTO clinical_orders (id, order_number, encounter_id, patient_id, episode_id, ordered_by, order_category, clinical_indication, status, tenant_id)
        VALUES ($1, $2, $3, $4, $5, 'dr. Siti', 'RADIOLOGY', 'Indikasi A', 'ORDERED', $6);
      `, [ordA, `ORD-A-${Date.now()}`, encA.id, encA.patient_id, encA.episode_id, TENANT_A]);

      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_B]);
      await client.query(`
        INSERT INTO clinical_orders (id, order_number, encounter_id, patient_id, episode_id, ordered_by, order_category, clinical_indication, status, tenant_id)
        VALUES ($1, $2, $3, $4, $5, 'dr. Budi', 'RADIOLOGY', 'Indikasi B', 'ORDERED', $6);
      `, [ordB, `ORD-B-${Date.now()}`, encB.id, encB.patient_id, encB.episode_id, TENANT_B]);

      // Seed radiology orders
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      await client.query(`
        INSERT INTO radiology_orders (id, order_id, modality, examination_name, dicom_study_uid, unit_price, tenant_id)
        VALUES ($1, $2, 'CT', 'CT Thorax Test A', '1.2.3.4.A.TEST', 1250000, $3);
      `, [radA, ordA, TENANT_A]);

      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_B]);
      await client.query(`
        INSERT INTO radiology_orders (id, order_id, modality, examination_name, dicom_study_uid, unit_price, tenant_id)
        VALUES ($1, $2, 'XR', 'Chest X-Ray Test B', '1.2.3.4.B.TEST', 350000, $3);
      `, [radB, ordB, TENANT_B]);

      // Isolation checks
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      const rA_readA = await client.query('SELECT id FROM radiology_orders WHERE id = $1;', [radA]);
      const rA_readB = await client.query('SELECT id FROM radiology_orders WHERE id = $1;', [radB]);
      const rA_updateB = await client.query("UPDATE radiology_orders SET examination_name = 'Hacked' WHERE id = $1;", [radB]);

      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_B]);
      const rB_readB = await client.query('SELECT id FROM radiology_orders WHERE id = $1;', [radB]);
      const rB_readA = await client.query('SELECT id FROM radiology_orders WHERE id = $1;', [radA]);

      radIsoPassed = rA_readA.rows.length === 1 && rB_readB.rows.length === 1 &&
                     rA_readB.rows.length === 0 && rA_updateB.rowCount === 0 && rB_readA.rows.length === 0;

      await client.query('ROLLBACK;');
    } catch (_) {}

    recordTest(
      'RLS-02',
      'radiology_orders tenant isolation under canonical app.current_tenant_id GUC',
      'Own rows visible, foreign rows hidden',
      radIsoPassed ? '100% Isolated' : 'Isolation Breach',
      radIsoPassed
    );

    // --------------------------------------------------------------------------
    // POLICY-01: No unauthorized duplicate policy remains
    // --------------------------------------------------------------------------
    const dupRes = await client.query(`
      SELECT tablename, count(*) as c 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      GROUP BY tablename HAVING count(*) > 1;
    `);
    const zeroDuplicates = dupRes.rows.length === 0;
    recordTest(
      'POLICY-01',
      'Policy Normalization (0 tables with duplicate or conflicting policies in catalog)',
      0,
      dupRes.rows.length,
      zeroDuplicates
    );

    // --------------------------------------------------------------------------
    // POLICY-02: No fail-open `tenant_id IS NULL` in active policies
    // --------------------------------------------------------------------------
    const failOpenRes = await client.query(`
      SELECT count(*) as c 
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND qual LIKE '%tenant_id IS NULL%';
    `);
    const zeroFailOpen = parseInt(failOpenRes.rows[0].c, 10) === 0;
    recordTest(
      'POLICY-02',
      'Zero fail-open (tenant_id IS NULL) clauses in active catalog policies',
      0,
      parseInt(failOpenRes.rows[0].c, 10),
      zeroFailOpen
    );

    // --------------------------------------------------------------------------
    // SECRET-01: No live secret exists in tracked source
    // --------------------------------------------------------------------------
    let trackedSecretClean = true;
    try {
      const trackedFiles = execSync('git ls-files', { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
      const envLocal = fs.readFileSync('.env.local', 'utf8');
      const passMatch = envLocal.match(/POSTGRES_PASSWORD=(.*)/);
      const secretVal = passMatch ? passMatch[1].trim() : '';

      if (secretVal) {
        for (const file of trackedFiles) {
          if (file.endsWith('package-lock.json')) continue;
          if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes(secretVal)) {
              trackedSecretClean = false;
              break;
            }
          }
        }
      }
    } catch (_) {}
    recordTest(
      'SECRET-01',
      'No live database secrets present in tracked source repository',
      true,
      trackedSecretClean,
      trackedSecretClean
    );

    // --------------------------------------------------------------------------
    // SECRET-02: No live secret exists in current audit artifacts
    // --------------------------------------------------------------------------
    let artifactSecretClean = true;
    try {
      const envLocal = fs.readFileSync('.env.local', 'utf8');
      const passMatch = envLocal.match(/POSTGRES_PASSWORD=(.*)/);
      const secretVal = passMatch ? passMatch[1].trim() : '';

      if (secretVal) {
        const auditFiles = [
          ...fs.readdirSync('docs/audit').map(f => `docs/audit/${f}`),
          ...fs.readdirSync('scratch').filter(f => f.endsWith('.json') || f.endsWith('.md')).map(f => `scratch/${f}`)
        ];
        for (const f of auditFiles) {
          if (fs.existsSync(f)) {
            const content = fs.readFileSync(f, 'utf8');
            if (content.includes(secretVal)) {
              artifactSecretClean = false;
              break;
            }
          }
        }
      }
    } catch (_) {}
    recordTest(
      'SECRET-02',
      'No live database secrets present in working tree audit/scratch artifacts',
      true,
      artifactSecretClean,
      artifactSecretClean
    );

    // --------------------------------------------------------------------------
    // MIG-01: Migrations 080 and 081 tracked by schema_migrations
    // --------------------------------------------------------------------------
    const migRes = await client.query(`
      SELECT migration_id, status FROM schema_migrations 
      WHERE migration_id IN ('080_stage0_runtime_privilege_hardening.sql', '081_stage0_policy_normalization.sql');
    `);
    const mig080 = migRes.rows.find(r => r.migration_id === '080_stage0_runtime_privilege_hardening.sql');
    const mig081 = migRes.rows.find(r => r.migration_id === '081_stage0_policy_normalization.sql');
    const migrationsApplied = mig080?.status === 'APPLIED' && mig081?.status === 'APPLIED';
    recordTest(
      'MIG-01',
      'Security migrations 080 & 081 recorded with status APPLIED in schema_migrations',
      'Both APPLIED',
      `080: ${mig080?.status}, 081: ${mig081?.status}`,
      migrationsApplied
    );

    // --------------------------------------------------------------------------
    // MIG-02: Migration checksums exist and are non-empty
    // --------------------------------------------------------------------------
    const migChecksumRes = await client.query(`
      SELECT migration_id, checksum FROM schema_migrations 
      WHERE migration_id IN ('080_stage0_runtime_privilege_hardening.sql', '081_stage0_policy_normalization.sql');
    `);
    const checksumsValid = migChecksumRes.rows.length === 2 && 
                           migChecksumRes.rows.every(r => typeof r.checksum === 'string' && r.checksum.length === 64);
    recordTest(
      'MIG-02',
      'Authoritative SHA-256 checksums recorded for migrations 080 and 081',
      '64-character SHA-256 for both',
      checksumsValid ? 'Valid Checksums' : 'Invalid/Missing Checksums',
      checksumsValid
    );

    console.log('\n==============================================================================');
    console.log(`CONTAINMENT TEST RESULTS: ${results.passCount} / ${results.totalTests} PASSED (Failures: ${results.failCount})`);
    console.log('==============================================================================\n');

    fs.writeFileSync('scratch/wave1b0_containment_test_results.json', JSON.stringify(results, null, 2));

  } finally {
    client.release();
    await pool.end();
  }

  if (results.failCount > 0) {
    process.exit(1);
  }
}

runContainmentSuite().catch(err => {
  console.error('Fatal Containment Suite Error:', err);
  process.exit(1);
});
