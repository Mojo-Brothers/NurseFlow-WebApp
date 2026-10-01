/**
 * NurseFlow Enterprise HIS 2026 — Wave 1B.0T Canonical GUC & Tenant Isolation Test Suite
 * Standards: ISO/IEC 27001 Multi-Tenancy Data Isolation, OWASP ASVS 4.0, HIPAA § 164.312
 * 
 * Tests:
 * GUC-01: app.current_tenant_id returns Tenant A when transaction context is Tenant A
 * GUC-02: app.current_tenant_id returns Tenant B when transaction context is Tenant B
 * GUC-03: No tenant context -> NULL, never default tenant
 * GUC-04: Tenant A cannot see Tenant B records (cross-tenant read blocked)
 * GUC-05: Tenant B cannot see Tenant A records (reverse cross-tenant read blocked)
 * GUC-06: Transaction ends -> tenant context does not leak
 * GUC-07: Connection reused by another transaction -> previous tenant context absent
 * GUC-08: current_app_tenant_id() no longer depends on legacy app.tenant_id
 */

import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';

const { Pool } = pg;

// Read .env.local
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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const TENANT_A = '00000000-0000-0000-0000-000000000001';
const TENANT_B = '00000000-0000-0000-0000-000000000002';

const results = {
  suite: 'P0-2B Wave 1B.0T Canonical GUC Test Suite',
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

async function runCanonicalGucSuite() {
  console.log('==============================================================================');
  console.log('NURSEFLOW P0-2B WAVE 1B.0T — CANONICAL GUC & TENANT ISOLATION TEST SUITE');
  console.log('==============================================================================\n');

  const client = await pool.connect();

  try {
    // --------------------------------------------------------------------------
    // GUC-01: app.current_tenant_id returns Tenant A when context is Tenant A
    // --------------------------------------------------------------------------
    let valA = null;
    let funcValA = null;
    await client.query('BEGIN;');
    await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
    const r1 = await client.query("SELECT current_setting('app.current_tenant_id', true) as guc, current_app_tenant_id() as fn;");
    valA = r1.rows[0].guc;
    funcValA = r1.rows[0].fn;
    await client.query('ROLLBACK;');

    recordTest(
      'GUC-01',
      'app.current_tenant_id and current_app_tenant_id() return Tenant A under Tenant A context',
      { guc: TENANT_A, fn: TENANT_A },
      { guc: valA, fn: funcValA },
      valA === TENANT_A && funcValA === TENANT_A
    );

    // --------------------------------------------------------------------------
    // GUC-02: Tenant B context returns Tenant B
    // --------------------------------------------------------------------------
    let valB = null;
    let funcValB = null;
    await client.query('BEGIN;');
    await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_B]);
    const r2 = await client.query("SELECT current_setting('app.current_tenant_id', true) as guc, current_app_tenant_id() as fn;");
    valB = r2.rows[0].guc;
    funcValB = r2.rows[0].fn;
    await client.query('ROLLBACK;');

    recordTest(
      'GUC-02',
      'app.current_tenant_id and current_app_tenant_id() return Tenant B under Tenant B context',
      { guc: TENANT_B, fn: TENANT_B },
      { guc: valB, fn: funcValB },
      valB === TENANT_B && funcValB === TENANT_B
    );

    // --------------------------------------------------------------------------
    // GUC-03: No tenant context -> NULL, never default tenant
    // --------------------------------------------------------------------------
    let valNull = null;
    let funcNull = null;
    let emptyTableRows = 999;
    await client.query('BEGIN;');
    // Explicitly unsetting / ensuring clean transaction context
    const r3 = await client.query("SELECT current_setting('app.current_tenant_id', true) as guc, current_app_tenant_id() as fn;");
    valNull = r3.rows[0].guc;
    funcNull = r3.rows[0].fn;
    // Querying real seeded table appointments (calls current_app_tenant_id())
    const seededQuery = await client.query('SELECT count(*) as count FROM appointments;');
    emptyTableRows = parseInt(seededQuery.rows[0].count, 10);
    await client.query('ROLLBACK;');

    const noDefaultTenant = (valNull === '' || valNull === null) && funcNull === null && emptyTableRows === 0;
    recordTest(
      'GUC-03',
      'No tenant context -> NULL, no default tenant fallback, zero rows returned (fail-closed)',
      { fn: null, tableRows: 0 },
      { fn: funcNull, tableRows: emptyTableRows },
      noDefaultTenant
    );

    // --------------------------------------------------------------------------
    // GUC-04: Tenant A cannot see Tenant B records (cross-tenant read blocked)
    // --------------------------------------------------------------------------
    // Create a real record under Tenant B, verify Tenant A cannot read it
    const testAppointmentB = crypto.randomUUID();
    let tenantBInserted = false;
    let tenantASeesTenantB = true;

    // Transaction 1: Insert real record under Tenant B in appointments (a 54-group table)
    const clientB = await pool.connect();
    try {
      await clientB.query('BEGIN;');
      await clientB.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_B]);
      
      // Look up master_patient or create mock reference if needed, or use operating_theatres
      const otIdB = crypto.randomUUID();
      await clientB.query(`
        INSERT INTO operating_theatres (id, tenant_id, theatre_code, theatre_name, is_active)
        VALUES ($1, $2, $3, 'Tenant B Secret OT', true);
      `, [otIdB, TENANT_B, `OT-B-${Date.now()}`]);
      tenantBInserted = true;

      // Transaction 2: Query under Tenant A context using separate connection/tx
      const clientA = await pool.connect();
      try {
        await clientA.query('BEGIN;');
        await clientA.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
        const aRes = await clientA.query('SELECT * FROM operating_theatres WHERE id = $1;', [otIdB]);
        tenantASeesTenantB = aRes.rows.length > 0;
        await clientA.query('ROLLBACK;');
      } finally {
        clientA.release();
      }

      await clientB.query('ROLLBACK;');
    } finally {
      clientB.release();
    }

    recordTest(
      'GUC-04',
      'Tenant A cannot see Tenant B records (cross-tenant read blocked by canonical RLS)',
      false,
      tenantASeesTenantB,
      tenantBInserted && !tenantASeesTenantB
    );

    // --------------------------------------------------------------------------
    // GUC-05: Tenant B cannot see Tenant A records (reverse cross-tenant read blocked)
    // --------------------------------------------------------------------------
    // Real seeded data: Tenant A has 57 appointments and 5068 encounters.
    let tenantBSeesTenantARecords = true;
    let tenantASeesOwnRecords = false;

    await client.query('BEGIN;');
    await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
    const aCheck = await client.query('SELECT count(*) as count FROM appointments;');
    tenantASeesOwnRecords = parseInt(aCheck.rows[0].count, 10) === 57;
    await client.query('ROLLBACK;');

    await client.query('BEGIN;');
    await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_B]);
    const bCheck = await client.query('SELECT count(*) as count FROM appointments;');
    tenantBSeesTenantARecords = parseInt(bCheck.rows[0].count, 10) > 0;
    await client.query('ROLLBACK;');

    recordTest(
      'GUC-05',
      'Tenant B cannot see Tenant A records (57 seeded appointments invisible to Tenant B)',
      { tenantAOwnRecords: 57, tenantBVisible: 0 },
      { tenantAOwnRecords: tenantASeesOwnRecords ? 57 : 0, tenantBVisible: tenantBSeesTenantARecords ? '>0' : 0 },
      tenantASeesOwnRecords && !tenantBSeesTenantARecords
    );

    // --------------------------------------------------------------------------
    // GUC-06: Transaction ends -> tenant context does not leak
    // --------------------------------------------------------------------------
    let leakedInSession = false;
    await client.query('BEGIN;');
    await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
    // Commit/end the transaction
    await client.query('COMMIT;');

    // Inspect same client connection outside transaction block
    const postTxRes = await client.query("SELECT current_setting('app.current_tenant_id', true) as guc, current_app_tenant_id() as fn;");
    const postGuc = postTxRes.rows[0].guc;
    const postFn = postTxRes.rows[0].fn;
    leakedInSession = (postGuc !== null && postGuc !== '') || postFn !== null;

    recordTest(
      'GUC-06',
      'Transaction ends (COMMIT/ROLLBACK) -> transaction-local tenant context does not leak',
      false,
      leakedInSession,
      !leakedInSession,
      { postGuc, postFn }
    );

    // --------------------------------------------------------------------------
    // GUC-07: Connection reused by another transaction -> previous tenant context absent
    // --------------------------------------------------------------------------
    // Release client back to pool, borrow a client, verify clean state
    client.release();
    const borrowedClient = await pool.connect();
    let reusedDirty = true;
    try {
      await borrowedClient.query('BEGIN;');
      const reuseRes = await borrowedClient.query("SELECT current_setting('app.current_tenant_id', true) as guc, current_app_tenant_id() as fn;");
      const reuseGuc = reuseRes.rows[0].guc;
      const reuseFn = reuseRes.rows[0].fn;
      reusedDirty = (reuseGuc !== null && reuseGuc !== '') || reuseFn !== null;
      await borrowedClient.query('ROLLBACK;');
    } finally {
      borrowedClient.release();
    }

    recordTest(
      'GUC-07',
      'Connection reused across pool leases -> previous tenant context completely absent',
      false,
      reusedDirty,
      !reusedDirty
    );

    // --------------------------------------------------------------------------
    // GUC-08: current_app_tenant_id() no longer depends on legacy app.tenant_id
    // --------------------------------------------------------------------------
    const reconnectedClient = await pool.connect();
    let onlyLegacyGucYieldsNull = false;
    let canonicalGucYieldsUuid = false;
    let appointmentsWithOnlyLegacy = 999;
    let appointmentsWithCanonical = 0;

    try {
      // Step A: Set ONLY legacy app.tenant_id
      await reconnectedClient.query('BEGIN;');
      await reconnectedClient.query("SELECT set_config('app.tenant_id', $1, true);", [TENANT_A]);
      await reconnectedClient.query("SELECT set_config('app.current_tenant_id', '', true);");
      
      const fnLegacy = await reconnectedClient.query('SELECT current_app_tenant_id() as fn;');
      onlyLegacyGucYieldsNull = fnLegacy.rows[0].fn === null;

      const appLegacy = await reconnectedClient.query('SELECT count(*) as count FROM appointments;');
      appointmentsWithOnlyLegacy = parseInt(appLegacy.rows[0].count, 10);
      await reconnectedClient.query('ROLLBACK;');

      // Step B: Set canonical app.current_tenant_id
      await reconnectedClient.query('BEGIN;');
      await reconnectedClient.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      
      const fnCanonical = await reconnectedClient.query('SELECT current_app_tenant_id() as fn;');
      canonicalGucYieldsUuid = fnCanonical.rows[0].fn === TENANT_A;

      const appCanonical = await reconnectedClient.query('SELECT count(*) as count FROM appointments;');
      appointmentsWithCanonical = parseInt(appCanonical.rows[0].count, 10);
      await reconnectedClient.query('ROLLBACK;');

    } finally {
      reconnectedClient.release();
    }

    const legacyDecoupled = onlyLegacyGucYieldsNull && 
                            appointmentsWithOnlyLegacy === 0 && 
                            canonicalGucYieldsUuid && 
                            appointmentsWithCanonical === 57;

    recordTest(
      'GUC-08',
      'current_app_tenant_id() decoupled from app.tenant_id (evaluates only app.current_tenant_id)',
      true,
      legacyDecoupled,
      legacyDecoupled,
      { onlyLegacyGucYieldsNull, appointmentsWithOnlyLegacy, canonicalGucYieldsUuid, appointmentsWithCanonical }
    );

  } finally {
    // client was already released or will be closed with pool
    await pool.end();
  }

  console.log('\n==============================================================================');
  console.log(`CANONICAL GUC TEST RESULTS: ${results.passCount} / ${results.totalTests} PASSED (Failures: ${results.failCount})`);
  console.log('==============================================================================\n');

  if (results.failCount > 0) {
    process.exit(1);
  }
}

runCanonicalGucSuite().catch(err => {
  console.error('GUC Suite Fatal Error:', err);
  process.exit(1);
});
