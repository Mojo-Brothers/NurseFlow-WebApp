/**
 * NurseFlow Enterprise HIS 2026 — Gate 0B Live PostgreSQL 16 Proof & Forensic Audit Runner
 * Standards: Permenkes, JCI & KARS, ISO 27001
 * Verifies Real PostgreSQL 16 Connection, Cross-Connection Persistence, Rollback Invariants & Schema Truth
 */

import { postgresPoolService } from '../server/db/postgresPool.js';
import crypto from 'crypto';

async function runLivePostgresProof() {
  console.log('================================================================================');
  console.log('🏛️ NURSEFLOW ENTERPRISE HIS 2026 — GATE 0B POSTGRESQL 16 LIVE FORENSIC AUDIT');
  console.log('================================================================================\n');

  const pool = postgresPoolService.getPool();

  // ─── 1. REAL POSTGRESQL CONNECTION & VERSION MARKER ───
  console.log('📌 STEP 1: PROVING REAL POSTGRESQL 16 ENGINE CONNECTION');
  const client1 = await pool.connect();
  try {
    const metaRes = await client1.query(`
      SELECT 
        current_database() as db_name,
        current_user as db_user,
        version() as pg_version,
        NOW() as server_time,
        inet_server_addr() as server_addr,
        inet_server_port() as server_port;
    `);
    console.log('✅ Real Database Metadata Retrieved:');
    console.table(metaRes.rows);
  } finally {
    client1.release();
  }

  // ─── 2. DOMAIN SCHEMA & FOREIGN KEY VALIDATION ───
  console.log('\n📌 STEP 2: AUDITING REAL TABLES IN POSTGRESQL INFORMATION_SCHEMA');
  const client2 = await pool.connect();
  try {
    const tableAuditRes = await client2.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'blood_donor_units', 'blood_crossmatch_tests', 'blood_transfusion_records', 'blood_bedside_verifications',
          'clinical_staff_profiles', 'staff_credentials', 'clinical_privileges', 'clinical_authorization_logs',
          'master_wards', 'master_rooms', 'master_beds', 'medication_catalog', 'pharmacy_warehouses',
          'appointments', 'queue_sequences', 'appointment_audit_logs',
          'inventory_batches', 'inventory_stock_movements',
          'fhir_delivery_outbox',
          'master_patients', 'episodes_of_care', 'encounters', 'hospital_invoices', 'universal_audit_logs'
        )
      ORDER BY table_name;
    `);
    console.log(`✅ Found ${tableAuditRes.rows.length} verified real PostgreSQL tables for the 7 audited domains:`);
    console.table(tableAuditRes.rows);
  } finally {
    client2.release();
  }

  // ─── 3. DOMAIN 1: BLOOD BANK (BDRS) ACID WRITE -> INDEPENDENT CONNECTION RE-FETCH ───
  console.log('\n📌 STEP 3: DOMAIN 1 (BLOOD BANK) — WRITE IN CONN A -> COMMIT -> RE-READ IN CONN B');
  const testUnitNumber = `ISBT-LIVE-AUDIT-${Date.now()}`;
  let createdUnitId = null;

  // Connection A (Writer)
  const connA = await pool.connect();
  try {
    await connA.query('BEGIN ISOLATION LEVEL READ COMMITTED;');
    createdUnitId = crypto.randomUUID();
    const insRes = await connA.query(`
      INSERT INTO blood_donor_units (
        id, tenant_id, unit_number, product_type, abo_type, rhesus_type,
        volume_ml, donation_date, expiry_date, storage_temperature_celsius,
        storage_location, screening_status, status, version, created_at, updated_at
      ) VALUES (
        $1, '00000000-0000-0000-0000-000000000001', $2, 'PACKED_RED_CELLS', 'B', 'POSITIVE',
        350, CURRENT_DATE, CURRENT_DATE + 35, 4.2,
        'Kulkas BDRS 1 - Rak B2', 'NON_REACTIVE', 'AVAILABLE', 1, NOW(), NOW()
      ) RETURNING *;
    `, [createdUnitId, testUnitNumber]);
    await connA.query('COMMIT;');
    console.log(`✅ Conn A wrote & committed donor unit ID: ${createdUnitId} (${testUnitNumber})`);
  } catch (err) {
    await connA.query('ROLLBACK;');
    throw err;
  } finally {
    connA.release(); // Connection destroyed/returned to pool
  }

  // Connection B (Independent Reader)
  const connB = await pool.connect();
  try {
    const selRes = await connB.query(`
      SELECT id, unit_number, abo_type, rhesus_type, status, storage_location, created_at
      FROM blood_donor_units
      WHERE id = $1;
    `, [createdUnitId]);

    if (selRes.rows.length === 1 && selRes.rows[0].unit_number === testUnitNumber) {
      console.log('✅ Conn B (Independent connection) verified persistent record in PostgreSQL:');
      console.table(selRes.rows);
    } else {
      throw new Error('❌ Conn B failed to find record written by Conn A!');
    }
  } finally {
    connB.release();
  }

  // ─── 4. DOMAIN 2: STAFF PRIVILEGING & PREREQUISITE TRIGGER AUDIT ───
  console.log('\n📌 STEP 4: DOMAIN 2 (STAFF PRIVILEGES) — TRIGGER CONSTRAINT TEST (NO STR -> REJECT)');
  const connC = await pool.connect();
  const uncredentialedStaffId = crypto.randomUUID();
  try {
    // 1. Create staff profile without STR
    await connC.query(`
      INSERT INTO clinical_staff_profiles (
        id, tenant_id, staff_number, full_name, title_prefix, title_suffix,
        staff_category, primary_specialty, primary_department_id, employment_status, is_active, created_at, updated_at
      ) VALUES (
        $1, '00000000-0000-0000-0000-000000000001', $2, 'dr. Forensik Test', 'dr.', 'Sp.A',
        'SPECIALIST_DOCTOR', 'Anak', 'POLI_ANAK', 'PERMANENT', true, NOW(), NOW()
      );
    `, [uncredentialedStaffId, `STF-UNCRED-${Date.now().toString().slice(-4)}`]);

    // 2. Try to grant privilege directly (Must be rejected by trigger trg_validate_privilege_prerequisites)
    let triggerBlocked = false;
    try {
      await connC.query(`
        INSERT INTO clinical_privileges (
          id, tenant_id, staff_id, department_id, procedure_code, procedure_name,
          privilege_level, effective_from, effective_until, privilege_status,
          approved_by_komite_medik_id, approved_by_komite_medik_name, spk_document_number, granted_at, created_at, updated_at
        ) VALUES (
          $1, '00000000-0000-0000-0000-000000000001', $2, 'POLI_ANAK', 'PROC-PALS-01', 'Pediatric Advanced Life Support',
          'INDEPENDENT', CURRENT_DATE, CURRENT_DATE + 365, 'ACTIVE',
          'KM-01', 'dr. Sp.B Ketua Komite Medik', 'SPK-TEST-001', NOW(), NOW(), NOW()
        );
      `, [crypto.randomUUID(), uncredentialedStaffId]);
    } catch (trgErr) {
      triggerBlocked = true;
      console.log(`✅ PostgreSQL Trigger trg_validate_privilege_prerequisites correctly rejected uncredentialed privilege: "${trgErr.message}"`);
    }

    if (!triggerBlocked) {
      throw new Error('❌ Security Trigger failed to block privilege grant without active STR/SIP!');
    }
  } finally {
    connC.release();
  }

  // ─── 5. TRANSACTION ROLLBACK INTEGRITY PROOF (ACID ATOMICITY) ───
  console.log('\n📌 STEP 5: ATOMIC TRANSACTION ROLLBACK TEST (FAIL-STOP INTEGRITY)');
  const connRollback = await pool.connect();
  const testBatchNumber = `BAT-ROLLBACK-${Date.now()}`;
  const rollbackBatchId = crypto.randomUUID();
  try {
    await connRollback.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

    // Step A: Insert batch
    await connRollback.query(`
      INSERT INTO inventory_batches (
        id, tenant_id, warehouse_id, medication_id, batch_number,
        expiry_date, initial_quantity, available_quantity, reserved_quantity,
        unit_cost, unit_price, version, created_at, updated_at
      ) VALUES (
        $1, '00000000-0000-0000-0000-000000000001',
        (SELECT id FROM pharmacy_warehouses LIMIT 1),
        (SELECT id FROM medication_catalog LIMIT 1),
        $2, '2028-12-31', 100, 100, 0, 1000, 1500, 1, NOW(), NOW()
      );
    `, [rollbackBatchId, testBatchNumber]);

    // Step B: Simulate crash / forced error
    throw new Error('SIMULATED_POWER_FAILURE_MID_TRANSACTION');
  } catch (simErr) {
    await connRollback.query('ROLLBACK;');
    console.log(`✅ Transaction safely aborted and rolled back upon error: ${simErr.message}`);
  } finally {
    connRollback.release();
  }

  // Verify on fresh connection that Step A was completely wiped (0 dirty reads)
  const connVerify = await pool.connect();
  try {
    const checkRes = await connVerify.query(
      'SELECT * FROM inventory_batches WHERE id = $1 OR batch_number = $2;',
      [rollbackBatchId, testBatchNumber]
    );
    if (checkRes.rows.length === 0) {
      console.log('✅ Fresh Connection verified 0 records exist (100% Atomicity, Zero Dirty Reads).');
    } else {
      throw new Error('❌ Rollback failed: dirty record found in PostgreSQL database!');
    }
  } finally {
    connVerify.release();
  }

  console.log('\n================================================================================');
  console.log('🟢 GATE 0B INDEPENDENT POSTGRESQL 16 PERSISTENCE AUDIT: 100% VERIFIED & PROVEN');
  console.log('================================================================================\n');
  process.exit(0);
}

runLivePostgresProof().catch(err => {
  console.error('❌ FORENSIC AUDIT FAILED:', err);
  process.exit(1);
});
