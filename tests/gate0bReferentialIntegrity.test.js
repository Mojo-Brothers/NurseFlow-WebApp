/**
 * NurseFlow Enterprise HIS 2026 — Gate 0B: Referential Integrity & Constraint Proof Suite
 * Standards: PostgreSQL Foreign Keys, Check Constraints & Database Safety Triggers
 * Verifies that deliberately invalid operations are rejected by the database engine with zero orphan records.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { bloodBankController } from '../server/controllers/bloodBank.controller.js';
import { staffPrivilegingController } from '../server/controllers/staffPrivileging.controller.js';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const mockHttp = (body = {}, params = {}, query = {}, headers = {}) => {
  const req = {
    body,
    params,
    query,
    headers,
    user: {
      userId: 'USR-AUDIT-004',
      username: 'auditor_constraints',
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

describe('🛑 GATE 0B.5: REFERENTIAL INTEGRITY & CONSTRAINT ENFORCEMENT MATRIX', () => {
  let pool;

  beforeAll(() => {
    pool = postgresPoolService.getPool();
  });

  // ─── TEST 1: NON-EXISTENT FOREIGN KEY REJECTION ───
  it('0B.5.1 — Foreign Key: should reject crossmatch on non-existent blood unit ID with zero orphan records', async () => {
    const fakeUnitId = crypto.randomUUID();
    const fakePatientId = crypto.randomUUID();
    const fakeEncounterId = crypto.randomUUID();

    const { req, res, getStatus, getData } = mockHttp({
      patient_id: fakePatientId,
      encounter_id: fakeEncounterId,
      blood_unit_id: fakeUnitId,
      patient_abo: 'A',
      patient_rhesus: 'POSITIVE',
      donor_abo: 'A',
      donor_rhesus: 'POSITIVE'
    });

    await bloodBankController.executeCrossmatch(req, res);
    expect(getStatus()).toBe(400);
    expect(getData().success).toBe(false);

    // Verify 0 crossmatch records exist for fakeUnitId
    const checkRes = await pool.query('SELECT * FROM blood_crossmatch_tests WHERE blood_unit_id = $1;', [fakeUnitId]);
    expect(checkRes.rows.length).toBe(0);
  });

  // ─── TEST 2: CLINICAL PRIVILEGE PREREQUISITE TRIGGER (STR/SIP REQUIRED) ───
  it('0B.5.2 — Safety Trigger: should block clinical privilege grant when clinician lacks active STR/SIP', async () => {
    const client = await pool.connect();
    let staffId;
    try {
      staffId = crypto.randomUUID();
      // Register staff profile WITHOUT active STR/SIP credentials
      await client.query(`
        INSERT INTO clinical_staff_profiles (
          id, tenant_id, staff_number, full_name, staff_category, primary_specialty,
          primary_department_id, employment_status, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'dr. Tanpa STR Test', 'SPECIALIST_DOCTOR', 'Bedah Umum',
          'BEDAH', 'PERMANENT', true, NOW(), NOW()
        );
      `, [staffId, TENANT_ID, `STF-NOSTR-${Date.now().toString().slice(-4)}`]);

      // Attempt to grant clinical privilege
      const { req, res, getStatus, getData } = mockHttp({
        staff_id: staffId,
        department_id: 'BEDAH',
        procedure_code: 'PROC-APP-01',
        procedure_name: 'Appendectomy Laparoscopic',
        effective_from: '2026-08-01',
        effective_until: '2029-08-01'
      });

      await staffPrivilegingController.grantPrivilege(req, res);
      expect(getStatus()).toBe(400);
      expect(getData().success).toBe(false);
      // Database trigger fn_validate_privilege_prerequisites throws exception
      expect(getData().message).toContain('AUTHORIZATION_DENIED');

      // Verify 0 privilege records exist for this staff in PostgreSQL
      const privCheck = await pool.query('SELECT * FROM clinical_privileges WHERE staff_id = $1;', [staffId]);
      expect(privCheck.rows.length).toBe(0);
    } finally {
      if (staffId) {
        await client.query('DELETE FROM clinical_staff_profiles WHERE id = $1;', [staffId]);
      }
      client.release();
    }
  });

  // ─── TEST 3: DATABASE ANTI-NEGATIVE INVENTORY CONSTRAINT ───
  it('0B.5.3 — Check Constraint: should enforce available_quantity >= 0 on inventory_batches', async () => {
    const client = await pool.connect();
    const tempWarehouseId = crypto.randomUUID();
    const tempMedId = crypto.randomUUID();
    const tempBatchId = crypto.randomUUID();

    try {
      await client.query(`
        INSERT INTO pharmacy_warehouses (id, tenant_id, warehouse_code, warehouse_name, warehouse_type, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, 'Gudang Negatif Test', 'MAIN_WAREHOUSE', true, NOW(), NOW());
      `, [tempWarehouseId, TENANT_ID, `WH-NEG-${Date.now().toString().slice(-4)}`]);

      await client.query(`
        INSERT INTO medication_catalog (id, tenant_id, item_code, item_name, generic_name, dosage_form, package_unit, dispense_unit, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, 'Obat Negatif Test', 'Test Med', 'TABLET', 'BOX', 'TABLET', true, NOW(), NOW());
      `, [tempMedId, TENANT_ID, `MED-NEG-${Date.now().toString().slice(-4)}`]);

      // Direct SQL injection of negative quantity should fail PostgreSQL CHECK constraint
      let constraintFailed = false;
      try {
        await client.query(`
          INSERT INTO inventory_batches (
            id, tenant_id, warehouse_id, medication_id, batch_number,
            expiry_date, initial_quantity, available_quantity, reserved_quantity,
            unit_cost, unit_price, version, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, 'BATCH-NEG-001',
            '2028-01-01', 10, -5, 0,
            1000, 1500, 1, NOW(), NOW()
          );
        `, [tempBatchId, TENANT_ID, tempWarehouseId, tempMedId]);
      } catch (err) {
        constraintFailed = true;
        expect(err.code).toBe('23514'); // check_violation
      }
      expect(constraintFailed).toBe(true);
    } finally {
      await client.query('DELETE FROM pharmacy_warehouses WHERE id = $1;', [tempWarehouseId]);
      await client.query('DELETE FROM medication_catalog WHERE id = $1;', [tempMedId]);
      client.release();
    }
  });

  // ─── TEST 4: FINALIZED CROSSMATCH IMMUTABILITY TRIGGER ───
  it('0B.5.4 — Immutability Trigger: should prevent tampering with finalized blood crossmatch test', async () => {
    const client = await pool.connect();
    const tempPatientId = crypto.randomUUID();
    const tempEpisodeId = crypto.randomUUID();
    const tempEncounterId = crypto.randomUUID();
    const tempUnitId = crypto.randomUUID();
    const tempCmId = crypto.randomUUID();

    try {
      await client.query(`
        INSERT INTO master_patients (id, tenant_id, mrn, nik, full_name, birth_date, gender, phone_number, address_line, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'Immutability Patient', '1992-04-10', 'MALE', '08121112223', 'Jl. Immutability No. 1', true, NOW(), NOW());
      `, [tempPatientId, TENANT_ID, `MRN-IMM-${Date.now().toString().slice(-4)}`, `${Date.now()}777777`.slice(0, 16)]);

      await client.query(`
        INSERT INTO episodes_of_care (
          id, tenant_id, patient_id, episode_number, branch_id, episode_type,
          status, lead_dpjp_id, lead_dpjp_name, managing_department_id,
          managing_department_name, start_time, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, 'BRANCH-01', 'GAWAT_DARURAT',
          'ACTIVE', 'DOC-01', 'dr. Jaga IGD', 'DEPT-EMER',
          'Instalasi Gawat Darurat', NOW(), NOW(), NOW()
        );
      `, [tempEpisodeId, TENANT_ID, tempPatientId, `EP-IMM-${Date.now().toString().slice(-4)}`]);

      await client.query(`
        INSERT INTO encounters (
          id, tenant_id, episode_id, patient_id, encounter_number, encounter_type,
          encounter_class, status, primary_doctor_id, primary_doctor_name,
          service_room_id, service_room_name, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, 'EMERGENCY',
          'EMER', 'IN_PROGRESS', 'DOC-01', 'dr. Jaga',
          'ROOM-IGD', 'IGD Resusitasi', NOW(), NOW()
        );
      `, [tempEncounterId, TENANT_ID, tempEpisodeId, tempPatientId, `ENC-IMM-${Date.now().toString().slice(-4)}`]);

      await client.query(`
        INSERT INTO blood_donor_units (id, tenant_id, unit_number, product_type, abo_type, rhesus_type, volume_ml, donation_date, expiry_date, storage_location, status, version, created_at, updated_at)
        VALUES ($1, $2, $3, 'PACKED_RED_CELLS', 'O', 'POSITIVE', 300, '2026-08-01', '2026-09-15', 'Kulkas BDRS 1', 'AVAILABLE', 1, NOW(), NOW());
      `, [tempUnitId, TENANT_ID, `ISBT-IMM-${Date.now().toString().slice(-4)}`]);

      const testNum = `CM-IMM-${Date.now()}`;
      await client.query(`
        INSERT INTO blood_crossmatch_tests (
          id, tenant_id, test_number, patient_id, encounter_id, blood_unit_id,
          patient_abo, patient_rhesus, donor_abo, donor_rhesus,
          major_crossmatch, overall_compatibility, technician_id, technician_name,
          is_finalized, finalized_at, tested_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          'O', 'POSITIVE', 'O', 'POSITIVE',
          'COMPATIBLE', 'COMPATIBLE', 'TECH-01', 'Analis 1',
          true, NOW(), NOW(), NOW()
        );
      `, [tempCmId, TENANT_ID, testNum, tempPatientId, tempEncounterId, tempUnitId]);

      // Attempt to tamper with overall_compatibility on finalized crossmatch
      let immutabilityViolated = false;
      try {
        await client.query(`
          UPDATE blood_crossmatch_tests
          SET overall_compatibility = 'INCOMPATIBLE'
          WHERE id = $1;
        `, [tempCmId]);
      } catch (err) {
        immutabilityViolated = true;
        expect(err.message).toContain('IMMUTABILITY_VIOLATION');
      }
      expect(immutabilityViolated).toBe(true);
    } finally {
      await client.query('DELETE FROM blood_crossmatch_tests WHERE id = $1;', [tempCmId]);
      await client.query('DELETE FROM blood_donor_units WHERE id = $1;', [tempUnitId]);
      await client.query('DELETE FROM encounters WHERE id = $1;', [tempEncounterId]);
      await client.query('DELETE FROM episodes_of_care WHERE id = $1;', [tempEpisodeId]);
      await client.query('DELETE FROM master_patients WHERE id = $1;', [tempPatientId]);
      client.release();
    }
  });
});
