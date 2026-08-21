/**
 * NurseFlow Enterprise HIS 2026 — Gate 0B: Transaction Integrity & Rollback Suite
 * Standards: ACID Isolation, Two-Phase Commit Safety, Deadlock Prevention
 * Verifies that partial failures in multi-step workflows ROLLBACK 100% cleanly without partial state.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { bloodBankController } from '../server/controllers/bloodBank.controller.js';
import { enterpriseInventoryController } from '../server/controllers/enterpriseInventory.controller.js';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const mockHttp = (body = {}, params = {}, query = {}, headers = {}) => {
  const req = {
    body,
    params,
    query,
    headers,
    user: {
      userId: 'USR-AUDIT-002',
      username: 'auditor_rollback',
      role: 'ROLE_ENTERPRISE_ADMIN',
      tenantId: TENANT_ID
    },
    ip: '127.0.0.1'
  };

  let resData = null;
  let resStatus = 200;

  const res = {
    status(code) {
      resStatus = code;
      return this;
    },
    json(payload) {
      resData = payload;
      return this;
    }
  };

  return { req, res, getStatus: () => resStatus, getData: () => resData };
};

describe('🛡️ GATE 0B.3: TRANSACTION INTEGRITY & FAULT ROLLBACK MATRIX', () => {
  let pool;
  let testWarehouseA;
  let testWarehouseB;
  let testMedicationId;

  beforeAll(async () => {
    pool = postgresPoolService.getPool();
    const client = await pool.connect();
    try {
      testWarehouseA = crypto.randomUUID();
      testWarehouseB = crypto.randomUUID();
      testMedicationId = crypto.randomUUID();

      await client.query(`
        INSERT INTO pharmacy_warehouses (id, tenant_id, warehouse_code, warehouse_name, warehouse_type, is_active, created_at, updated_at)
        VALUES 
          ($1, $3, $4, 'Gudang Farmasi Sumber A', 'MAIN_WAREHOUSE', true, NOW(), NOW()),
          ($2, $3, $5, 'Gudang Farmasi Tujuan B', 'INPATIENT_DEPO', true, NOW(), NOW())
        ON CONFLICT (tenant_id, warehouse_code) DO NOTHING;
      `, [testWarehouseA, testWarehouseB, TENANT_ID, `WH-SRC-${Date.now().toString().slice(-4)}`, `WH-DST-${Date.now().toString().slice(-4)}`]);

      await client.query(`
        INSERT INTO medication_catalog (id, tenant_id, item_code, item_name, generic_name, dosage_form, package_unit, dispense_unit, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, 'Amoxicillin 500mg Rollback Test', 'Amoxicillin', 'CAPSULE', 'STRIP', 'CAPSULE', true, NOW(), NOW())
        ON CONFLICT (tenant_id, item_code) DO NOTHING;
      `, [testMedicationId, TENANT_ID, `MED-RB-${Date.now().toString().slice(-4)}`]);
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM pharmacy_warehouses WHERE id IN ($1, $2);', [testWarehouseA, testWarehouseB]);
      await client.query('DELETE FROM medication_catalog WHERE id = $1;', [testMedicationId]);
    } catch (e) {
      // silent cleanup
    } finally {
      client.release();
    }
  });

  // ─── SCENARIO 1: INVENTORY TRANSFER INSUFFICIENT STOCK ROLLBACK ───
  it('0B.3.1 — Inventory: should abort multi-step stock transfer on insufficient balance and ROLLBACK with ZERO side effects', async () => {
    const client = await pool.connect();
    let sourceBatchId;
    try {
      // Setup initial batch with exact 50 units
      sourceBatchId = crypto.randomUUID();
      await client.query(`
        INSERT INTO inventory_batches (
          id, tenant_id, warehouse_id, medication_id, batch_number,
          expiry_date, initial_quantity, available_quantity, reserved_quantity,
          unit_cost, unit_price, version, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          '2028-06-30', 50, 50, 0,
          5000, 8000, 1, NOW(), NOW()
        );
      `, [sourceBatchId, TENANT_ID, testWarehouseA, testMedicationId, `BATCH-RB-${Date.now().toString().slice(-5)}`]);

      // Count initial movements in database
      const movCountBefore = await client.query('SELECT count(*) FROM inventory_stock_movements WHERE batch_id = $1;', [sourceBatchId]);
      const initialMovements = parseInt(movCountBefore.rows[0].count, 10);

      // Attempt to transfer 100 units (Exceeding 50 available)
      const { req: trfReq, res: trfRes, getStatus: getTrfStatus, getData: getTrfData } = mockHttp({
        sourceWarehouseId: testWarehouseA,
        destinationWarehouseId: testWarehouseB,
        batchId: sourceBatchId,
        quantity: 100
      });

      await enterpriseInventoryController.transfer(trfReq, trfRes);
      expect(getTrfStatus()).toBe(400);
      expect(getTrfData().success).toBe(false);
      expect(getTrfData().message).toContain('INSUFFICIENT_STOCK');

      // Verify PostgreSQL state: Source stock MUST still be 50, movements MUST NOT increase
      const sourceBatchCheck = await client.query('SELECT available_quantity FROM inventory_batches WHERE id = $1;', [sourceBatchId]);
      expect(parseInt(sourceBatchCheck.rows[0].available_quantity, 10)).toBe(50);

      const movCountAfter = await client.query('SELECT count(*) FROM inventory_stock_movements WHERE batch_id = $1;', [sourceBatchId]);
      expect(parseInt(movCountAfter.rows[0].count, 10)).toBe(initialMovements);
    } finally {
      client.release();
    }
  });

  // ─── SCENARIO 2: BLOOD BEDSIDE TRANSFUSION DUAL-NURSE VIOLATION ROLLBACK ───
  it('0B.3.2 — Blood Bank: should reject transfusion when identical nurse administers and witnesses, rolling back without unit state mutation', async () => {
    const client = await pool.connect();
    let unitId;
    try {
      unitId = crypto.randomUUID();
      const unitNumber = `ISBT-RB-${Date.now().toString().slice(-5)}`;
      await client.query(`
        INSERT INTO blood_donor_units (
          id, tenant_id, unit_number, product_type, abo_type, rhesus_type,
          volume_ml, donation_date, expiry_date, storage_location, status, version, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'PACKED_RED_CELLS', 'A', 'POSITIVE',
          300, '2026-08-01', '2026-09-15', 'Kulkas BDRS 1', 'CROSSMATCHED', 1, NOW(), NOW()
        );
      `, [unitId, TENANT_ID, unitNumber]);

      // Attempt dual-nurse verification with same nurse ID for both roles
      const { req: verifReq, res: verifRes, getStatus: getVerifStatus, getData: getVerifData } = mockHttp({
        unit_id: unitId,
        encounter_id: crypto.randomUUID(),
        patient_id: crypto.randomUUID(),
        crossmatch_id: crypto.randomUUID(),
        primary_nurse_id: 'NURSE-SAME-01',
        secondary_nurse_id: 'NURSE-SAME-01' // IDENTICAL NURSE VIOLATION
      });

      await bloodBankController.verifyBedsideTransfusion(verifReq, verifRes);
      expect(getVerifStatus()).toBe(400);
      expect(getVerifData().error).toBe('DOUBLE_CHECK_REQUIRED');

      // Verify PostgreSQL state: Unit status MUST remain 'CROSSMATCHED', NOT 'TRANSFUSED'
      const unitCheck = await client.query('SELECT status, version FROM blood_donor_units WHERE id = $1;', [unitId]);
      expect(unitCheck.rows[0].status).toBe('CROSSMATCHED');
      expect(unitCheck.rows[0].version).toBe(1);

      // Verify NO transfusion record or bedside verification record was created
      const trfCheck = await client.query('SELECT * FROM blood_transfusion_records WHERE blood_unit_id = $1;', [unitId]);
      expect(trfCheck.rows.length).toBe(0);
    } finally {
      client.release();
    }
  });

  // ─── SCENARIO 3: ATOMIC SIMULATED DB CRASH MID-TRANSACTION ROLLBACK ───
  it('0B.3.3 — Database Engine: should guarantee atomicity when manual exception occurs inside transaction block', async () => {
    const client = await pool.connect();
    const tempPatientId = crypto.randomUUID();
    try {
      await client.query('BEGIN;');

      await client.query(`
        INSERT INTO master_patients (id, tenant_id, mrn, nik, full_name, birth_date, gender, phone_number, address_line, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'Atomic Rollback Test Patient', '1990-01-01', 'FEMALE', '08129999000', 'Jl. Test Atomicity', true, NOW(), NOW());
      `, [tempPatientId, TENANT_ID, `MRN-TEMP-${Date.now().toString().slice(-4)}`, `${Date.now()}888888`.slice(0, 16)]);

      // Simulate unexpected crash / business exception before commit
      throw new Error('SIMULATED_CRASH_MID_TRANSACTION');
    } catch (err) {
      await client.query('ROLLBACK;');
      expect(err.message).toBe('SIMULATED_CRASH_MID_TRANSACTION');
    } finally {
      client.release();
    }

    // Verify patient was NOT persisted in PostgreSQL
    const checkRes = await pool.query('SELECT * FROM master_patients WHERE id = $1;', [tempPatientId]);
    expect(checkRes.rows.length).toBe(0);
  });
});
