/**
 * NurseFlow Enterprise HIS 2026 — Gate 0B: Idempotency & Deduplication Proof Suite
 * Standards: RFC 7231 / NIST SP 800-162 / FHIR Transactional Outbox Pattern
 * Verifies that repeat requests with identical Idempotency-Keys return existing records without duplicate insertions.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { appointmentController } from '../server/controllers/appointment.controller.js';
import { satusehatStudioController } from '../server/controllers/satusehatStudio.controller.js';
import { bloodBankController } from '../server/controllers/bloodBank.controller.js';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const mockHttp = (body = {}, params = {}, query = {}, headers = {}) => {
  const req = {
    body,
    params,
    query,
    headers,
    user: {
      userId: 'USR-AUDIT-003',
      username: 'auditor_idempotency',
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

describe('🔁 GATE 0B.4: IDEMPOTENCY & DUPLICATE PREVENTION MATRIX', () => {
  let pool;
  let testPatientId;

  beforeAll(async () => {
    pool = postgresPoolService.getPool();
    const client = await pool.connect();
    try {
      testPatientId = crypto.randomUUID();
      await client.query(`
        INSERT INTO master_patients (
          id, tenant_id, mrn, nik, full_name, birth_date, gender, phone_number, address_line, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, 'Idempotency Test Patient', '1988-11-20', 'FEMALE', '08123456780', 'Jl. Idemp Test No. 1', true, NOW(), NOW()
        ) ON CONFLICT (id) DO NOTHING;
      `, [testPatientId, TENANT_ID, `MRN-IDEMP-${Date.now().toString().slice(-4)}`, `${Date.now()}999999`.slice(0, 16)]);
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM master_patients WHERE id = $1;', [testPatientId]);
    } catch (e) {
      // silent cleanup
    } finally {
      client.release();
    }
  });

  // ─── SCENARIO 1: APPOINTMENT BOOKING IDEMPOTENCY ───
  it('0B.4.1 — Appointment: sending identical booking with Idempotency-Key twice returns existing record without creating second slot', async () => {
    const idempKey = `IDEMP-APT-${Date.now()}`;
    const randomDoctorId = `DOC-IDEMP-${Date.now().toString().slice(-5)}`;
    const slotTime = `14:${Math.floor(Math.random() * 50).toString().padStart(2, '0')}`;
    const aptDate = `2026-11-${(10 + Math.floor(Math.random() * 15)).toString().padStart(2, '0')}`;

    const payload = {
      patient_id: testPatientId,
      doctor_id: randomDoctorId,
      doctor_name: 'dr. Budi Setiawan, Sp.A',
      department_id: 'POLI_ANAK',
      department_name: 'Poliklinik Anak',
      appointment_date: aptDate,
      slot_time: slotTime,
      booking_source: 'MOBILE_JKN'
    };

    // Request #1
    const { req: req1, res: res1, getStatus: getStatus1, getData: getData1 } = mockHttp(
      payload, {}, {}, { 'idempotency-key': idempKey }
    );
    await appointmentController.book(req1, res1);
    expect(getStatus1()).toBe(201);
    const firstAptId = getData1().data.id;

    // Request #2 (Identical Idempotency-Key)
    const { req: req2, res: res2, getStatus: getStatus2, getData: getData2 } = mockHttp(
      payload, {}, {}, { 'idempotency-key': idempKey }
    );
    await appointmentController.book(req2, res2);
    expect(getStatus2()).toBe(200);
    expect(getData2().isDuplicateReplay).toBe(true);
    expect(getData2().data.id).toBe(firstAptId);

    // Verify in PostgreSQL: Exactly 1 record exists in appointments
    const countCheck = await pool.query(
      'SELECT count(*) FROM appointments WHERE bpjs_booking_code = $1;',
      [idempKey]
    );
    expect(parseInt(countCheck.rows[0].count, 10)).toBe(1);
  });

  // ─── SCENARIO 2: SATUSEHAT OUTBOX IDEMPOTENCY ───
  it('0B.4.2 — SATUSEHAT: repeat transmit request with same Idempotency-Key returns existing outbox item without duplicating dispatch', async () => {
    const idempKey = `IDEMP-SATU-${Date.now()}`;
    const payload = {
      idempotencyKey: idempKey,
      resourceType: 'Observation',
      resourceId: `OBS-IDEMP-${Date.now()}`,
      bundle: { resourceType: 'Observation', status: 'final', code: { text: 'Vital Signs' } }
    };

    // Transmission #1
    const { req: req1, res: res1, getStatus: getStatus1, getData: getData1 } = mockHttp(
      payload, {}, {}, { 'idempotency-key': idempKey }
    );
    await satusehatStudioController.transmit(req1, res1);
    expect(getStatus1()).toBe(200);
    const outboxId1 = getData1().data.outboxId;

    // Transmission #2 (Network retry simulation)
    const { req: req2, res: res2, getStatus: getStatus2, getData: getData2 } = mockHttp(
      payload, {}, {}, { 'idempotency-key': idempKey }
    );
    await satusehatStudioController.transmit(req2, res2);
    expect(getStatus2()).toBe(200);
    expect(getData2().isDuplicateReplay).toBe(true);
    expect(getData2().data.id).toBe(outboxId1);

    // Verify in PostgreSQL: Exactly 1 record exists in fhir_delivery_outbox
    const countCheck = await pool.query(
      'SELECT count(*) FROM fhir_delivery_outbox WHERE tenant_id = $1 AND idempotency_key = $2;',
      [TENANT_ID, idempKey]
    );
    expect(parseInt(countCheck.rows[0].count, 10)).toBe(1);
  });

  // ─── SCENARIO 3: BLOOD BANK DUPLICATE BARCODE REJECTION ───
  it('0B.4.3 — Blood Bank: duplicate donor unit number must be strictly rejected with HTTP 409 Conflict', async () => {
    const duplicateUnitNum = `ISBT-DUP-${Date.now().toString().slice(-6)}`;
    const payload = {
      donor_unit_number: duplicateUnitNum,
      blood_group: 'B',
      rhesus: 'POSITIVE',
      component_type: 'THROMBOCYTE_CONCENTRATE',
      volume_ml: 200
    };

    // Intake #1
    const { req: req1, res: res1, getStatus: getStatus1 } = mockHttp(payload);
    await bloodBankController.intakeDonorUnit(req1, res1);
    expect(getStatus1()).toBe(201);

    // Intake #2 (Duplicate unit number)
    const { req: req2, res: res2, getStatus: getStatus2, getData: getData2 } = mockHttp(payload);
    await bloodBankController.intakeDonorUnit(req2, res2);
    expect(getStatus2()).toBe(409);
    expect(getData2().success).toBe(false);
  });
});
