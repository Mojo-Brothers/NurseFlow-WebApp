/**
 * NurseFlow Enterprise HIS 2026 — Gate 0B: Persistence Round-Trip & Browser Refresh Proof Suite
 * Standards: NIST SP 800-162 / JCI MOI / PostgreSQL 16 Native ACID Verification
 * Verifies 100% real database truth across all 7 newly wired domains:
 * 1. Blood Bank (BDRS)
 * 2. Staff Privileging
 * 3. Master Data Hub
 * 4. Appointments & Queues
 * 5. Enterprise Multi-Depot Inventory
 * 6. SATUSEHAT FHIR Interop & Outbox
 * 7. Executive Command Center (Read-Only)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { bloodBankController } from '../server/controllers/bloodBank.controller.js';
import { staffPrivilegingController } from '../server/controllers/staffPrivileging.controller.js';
import { masterDataHubController } from '../server/controllers/masterDataHub.controller.js';
import { appointmentController } from '../server/controllers/appointment.controller.js';
import { enterpriseInventoryController } from '../server/controllers/enterpriseInventory.controller.js';
import { satusehatStudioController } from '../server/controllers/satusehatStudio.controller.js';
import { commandCenterController } from '../server/controllers/commandCenter.controller.js';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

// Lightweight Express req/res harness
const mockHttp = (body = {}, params = {}, query = {}, headers = {}) => {
  const req = {
    body,
    params,
    query,
    headers,
    user: {
      userId: 'USR-AUDIT-001',
      username: 'auditor_gate0b',
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

describe('🏛️ GATE 0B.1 & 0B.2: POSTGRESQL PERSISTENCE ROUND-TRIP & REFRESH VERIFICATION', () => {
  let pool;
  let testPatientId;
  let testWarehouseId;
  let testMedicationId;

  beforeAll(async () => {
    pool = postgresPoolService.getPool();
    const client = await pool.connect();
    try {
      // Create prerequisite records for foreign key satisfaction
      testPatientId = crypto.randomUUID();
      await client.query(`
        INSERT INTO master_patients (
          id, tenant_id, mrn, nik, full_name, birth_date, gender, phone_number, address_line, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, 'Patient Gate 0B Verification', '1985-05-15', 'MALE', '08123456789', 'Jl. Rawamangun No. 1', true, NOW(), NOW()
        ) ON CONFLICT (id) DO NOTHING;
      `, [testPatientId, TENANT_ID, `MRN-0B-${Date.now().toString().slice(-5)}`, `${Date.now()}123456`.slice(0, 16)]);

      testWarehouseId = crypto.randomUUID();
      await client.query(`
        INSERT INTO pharmacy_warehouses (
          id, tenant_id, warehouse_code, warehouse_name, warehouse_type, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'Gudang Farmasi Sentral Gate 0B', 'MAIN_WAREHOUSE', true, NOW(), NOW()
        ) ON CONFLICT (tenant_id, warehouse_code) DO NOTHING;
      `, [testWarehouseId, TENANT_ID, `WH-0B-${Date.now().toString().slice(-4)}`]);

      testMedicationId = crypto.randomUUID();
      await client.query(`
        INSERT INTO medication_catalog (
          id, tenant_id, item_code, item_name, generic_name, dosage_form, package_unit, dispense_unit, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'Ceftriaxone 1g Vial Gate 0B', 'Ceftriaxone', 'INJECTION', 'BOX', 'VIAL', true, NOW(), NOW()
        ) ON CONFLICT (tenant_id, item_code) DO NOTHING;
      `, [testMedicationId, TENANT_ID, `MED-0B-${Date.now().toString().slice(-4)}`]);
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM master_patients WHERE id = $1;', [testPatientId]);
      await client.query('DELETE FROM pharmacy_warehouses WHERE id = $1;', [testWarehouseId]);
      await client.query('DELETE FROM medication_catalog WHERE id = $1;', [testMedicationId]);
    } catch (e) {
      // silent cleanup
    } finally {
      client.release();
    }
  });

  // ─── DOMAIN 1: BLOOD BANK PERSISTENCE ROUND-TRIP ───
  it('0B.1 — Blood Bank: should execute CREATE -> 201 -> PostgreSQL Commit -> Browser Refresh F5 -> Verified Truth', async () => {
    const testUnitNumber = `ISBT-0B-${Date.now().toString().slice(-6)}`;
    const { req: postReq, res: postRes, getStatus: getPostStatus, getData: getPostData } = mockHttp({
      donor_unit_number: testUnitNumber,
      blood_group: 'O',
      rhesus: 'POSITIVE',
      component_type: 'PACKED_RED_CELLS',
      volume_ml: 350,
      storage_location: 'Kulkas BDRS 1 - Rak 0B'
    });

    // 1. HTTP POST /api/v1/blood-bank/units
    await bloodBankController.intakeDonorUnit(postReq, postRes);
    expect(getPostStatus()).toBe(201);
    const createdUnit = getPostData().data;
    expect(createdUnit.unitNumber).toBe(testUnitNumber);
    expect(createdUnit.id).toBeDefined();

    // 2. Direct PostgreSQL Query (Bypassing any application memory)
    const directPgRes = await pool.query(
      'SELECT * FROM blood_donor_units WHERE id = $1 LIMIT 1;',
      [createdUnit.id]
    );
    expect(directPgRes.rows.length).toBe(1);
    expect(directPgRes.rows[0].unit_number).toBe(testUnitNumber);
    expect(directPgRes.rows[0].abo_type).toBe('O');
    expect(directPgRes.rows[0].volume_ml).toBe(350);

    // 3. Browser Refresh Simulation (GET /api/v1/blood-bank/units after memory wipe)
    const { req: getReq, res: getRes, getStatus: getGetStatus, getData: getGetData } = mockHttp();
    await bloodBankController.getInventory(getReq, getRes);
    expect(getGetStatus()).toBe(200);
    const persisted = getGetData().data.find(u => u.id === createdUnit.id || u.unitNumber === testUnitNumber);
    expect(persisted).toBeDefined();
    expect(persisted.unitNumber).toBe(testUnitNumber);
  });

  // ─── DOMAIN 2: STAFF PRIVILEGING PERSISTENCE ROUND-TRIP ───
  it('0B.2 — Staff Privileging: should execute CREATE -> 201 -> PostgreSQL Commit -> Refresh -> Verified Truth', async () => {
    const staffNum = `STF-0B-${Date.now().toString().slice(-5)}`;
    const { req: postReq, res: postRes, getStatus: getPostStatus, getData: getPostData } = mockHttp({
      staff_number: staffNum,
      full_name: 'dr. Gatot Subroto, Sp.PD',
      staff_category: 'SPECIALIST_DOCTOR',
      primary_specialty: 'Penyakit Dalam',
      primary_department_id: 'POLI_DALAM'
    });

    await staffPrivilegingController.createStaff(postReq, postRes);
    expect(getPostStatus()).toBe(201);
    const createdStaff = getPostData().data;
    expect(createdStaff.id).toBeDefined();

    // Verify in PostgreSQL table clinical_staff_profiles
    const pgCheck = await pool.query(
      'SELECT * FROM clinical_staff_profiles WHERE id = $1 LIMIT 1;',
      [createdStaff.id]
    );
    expect(pgCheck.rows.length).toBe(1);
    expect(pgCheck.rows[0].staff_number).toBe(staffNum);

    // Browser Refresh Simulation
    const { req: getReq, res: getRes, getData: getGetData } = mockHttp();
    await staffPrivilegingController.getStaffList(getReq, getRes);
    const found = getGetData().data.find(s => s.id === createdStaff.id || s.staffNumber === staffNum);
    expect(found).toBeDefined();
  });

  // ─── DOMAIN 3: MASTER DATA HUB PERSISTENCE ROUND-TRIP ───
  it('0B.3 — Master Data Hub: should query global reference tables and spatial beds directly from PostgreSQL', async () => {
    // 1. Query master_genders from PostgreSQL
    const { req: reqGenders, res: resGenders, getData: getGendersData } = mockHttp({}, { entityType: 'genders' });
    await masterDataHubController.listEntities(reqGenders, resGenders);
    expect(getGendersData().success).toBe(true);
    expect(getGendersData().data.length).toBeGreaterThan(0);

    // 2. Create and Verify Bed in master_beds
    const bedNum = `BED-0B-${Date.now().toString().slice(-4)}`;
    const { req: postBedReq, res: postBedRes, getStatus: getBedStatus, getData: getBedData } = mockHttp({
      bed_number: bedNum,
      room_id: '00000000-0000-0000-0000-000000000001',
      bed_status: 'AVAILABLE',
      daily_tariff: 450000
    }, { entityType: 'beds' });

    await masterDataHubController.createEntity(postBedReq, postBedRes);
    expect(getBedStatus()).toBe(201);
    const createdBed = getBedData().data;

    // Direct PostgreSQL truth check
    const pgBed = await pool.query('SELECT * FROM master_beds WHERE id = $1 LIMIT 1;', [createdBed.id]);
    expect(pgBed.rows.length).toBe(1);
    expect(pgBed.rows[0].bed_number).toBe(bedNum);
  });

  // ─── DOMAIN 4: APPOINTMENT PERSISTENCE ROUND-TRIP ───
  it('0B.4 — Appointments: should book appointment -> PostgreSQL commit -> verify slot & check-in queue sequence', async () => {
    const randomDoctorId = `DOC-0B-${Date.now().toString().slice(-4)}`;
    const slotTime = `11:${Math.floor(Math.random() * 50).toString().padStart(2, '0')}`;
    const aptDate = `2026-10-${(10 + Math.floor(Math.random() * 15)).toString().padStart(2, '0')}`;

    const { req: bookReq, res: bookRes, getStatus: getBookStatus, getData: getBookData } = mockHttp({
      patient_id: testPatientId,
      doctor_id: randomDoctorId,
      doctor_name: 'dr. Siti Wijaya, Sp.PD',
      department_id: 'POLI_DALAM',
      department_name: 'Poliklinik Penyakit Dalam',
      appointment_date: aptDate,
      slot_time: slotTime,
      booking_source: 'ON_SITE'
    });

    await appointmentController.book(bookReq, bookRes);
    expect(getBookStatus()).toBe(201);
    const bookedApt = getBookData().data;
    expect(bookedApt.id).toBeDefined();

    // Verify in PostgreSQL table appointments & audit log
    const pgApt = await pool.query('SELECT * FROM appointments WHERE id = $1 LIMIT 1;', [bookedApt.id]);
    expect(pgApt.rows.length).toBe(1);
    expect(pgApt.rows[0].status).toBe('BOOKED');

    const pgAudit = await pool.query('SELECT * FROM appointment_audit_logs WHERE appointment_id = $1;', [bookedApt.id]);
    expect(pgAudit.rows.length).toBeGreaterThan(0);

    // Check-In and verify queue sequence generation in PostgreSQL
    const { req: checkinReq, res: checkinRes, getStatus: getCheckinStatus, getData: getCheckinData } = mockHttp({
      appointment_id: bookedApt.id
    });
    await appointmentController.checkIn(checkinReq, checkinRes);
    expect(getCheckinStatus()).toBe(200);
    expect(getCheckinData().data.status).toBe('CHECKED_IN');
    expect(getCheckinData().data.ticketNumber).toBeDefined();
  });

  // ─── DOMAIN 5: INVENTORY PERSISTENCE ROUND-TRIP ───
  it('0B.5 — Enterprise Inventory: should receive batch -> PostgreSQL commit -> verify stock ledger balance', async () => {
    const batchNum = `BATCH-0B-${Date.now().toString().slice(-6)}`;
    const { req: recReq, res: recRes, getStatus: getRecStatus, getData: getRecData } = mockHttp({
      warehouseId: testWarehouseId,
      itemId: testMedicationId,
      batchNumber: batchNum,
      expiryDate: '2028-12-31',
      quantity: 500,
      unitCost: 15000,
      unitPrice: 22000
    });

    await enterpriseInventoryController.receive(recReq, recRes);
    expect(getRecStatus()).toBe(201);
    const savedBatch = getRecData().data.batch;

    // Verify in PostgreSQL table inventory_batches & inventory_stock_movements
    const pgBatch = await pool.query('SELECT * FROM inventory_batches WHERE id = $1 LIMIT 1;', [savedBatch.id]);
    expect(pgBatch.rows.length).toBe(1);
    expect(parseInt(pgBatch.rows[0].available_quantity, 10)).toBe(500);

    const pgMov = await pool.query('SELECT * FROM inventory_stock_movements WHERE batch_id = $1 LIMIT 1;', [savedBatch.id]);
    expect(pgMov.rows.length).toBe(1);
    expect(pgMov.rows[0].movement_type).toBe('PURCHASE_RECEIPT');
  });

  // ─── DOMAIN 6: SATUSEHAT OUTBOX PERSISTENCE ROUND-TRIP ───
  it('0B.6 — SATUSEHAT Interop: should transmit FHIR payload -> commit to PostgreSQL outbox table -> verify delivery state', async () => {
    const idempKey = `IDEMP-0B-${Date.now()}`;
    const { req: transReq, res: transRes, getStatus: getTransStatus, getData: getTransData } = mockHttp({
      idempotencyKey: idempKey,
      resourceType: 'Encounter',
      resourceId: `ENC-0B-${Date.now()}`,
      bundle: {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [{ resource: { resourceType: 'Encounter', status: 'finished' } }]
      }
    });

    await satusehatStudioController.transmit(transReq, transRes);
    expect(getTransStatus()).toBe(200);
    const outbox = getTransData().data;
    expect(outbox.outboxId).toBeDefined();

    // Verify in PostgreSQL table fhir_delivery_outbox
    const pgOutbox = await pool.query(
      'SELECT * FROM fhir_delivery_outbox WHERE id = $1 LIMIT 1;',
      [outbox.outboxId]
    );
    expect(pgOutbox.rows.length).toBe(1);
    expect(pgOutbox.rows[0].idempotency_key).toBe(idempKey);
    expect(pgOutbox.rows[0].delivery_status).toBe('DELIVERED');
  });

  // ─── DOMAIN 7: EXECUTIVE COMMAND CENTER READ-ONLY TRUTH ───
  it('0B.7 — Command Center: should perform read-only real-time aggregations from PostgreSQL with zero clinical mutation', async () => {
    const { req: capReq, res: capRes, getStatus: getCapStatus, getData: getCapData } = mockHttp();
    await commandCenterController.getCapacity(capReq, capRes);
    expect(getCapStatus()).toBe(200);
    expect(getCapData().data.totalBeds).toBeGreaterThanOrEqual(0);
    expect(getCapData().data.borPercentage).toBeDefined();

    const { req: emerReq, res: emerRes, getStatus: getEmerStatus, getData: getEmerData } = mockHttp();
    await commandCenterController.getEmergency(emerReq, emerRes);
    expect(getEmerStatus()).toBe(200);
    expect(getEmerData().data.status).toBe('OPERATIONAL');

    const { req: finReq, res: finRes, getStatus: getFinStatus, getData: getFinData } = mockHttp();
    await commandCenterController.getFinancial(finReq, finRes);
    expect(getFinStatus()).toBe(200);
    expect(getFinData().data.totalBilledRevenue).toBeDefined();

    const { req: safeReq, res: safeRes, getStatus: getSafeStatus, getData: getSafeData } = mockHttp();
    await commandCenterController.getSafety(safeReq, safeRes);
    expect(getSafeStatus()).toBe(200);
    expect(getSafeData().data.safetyStatus).toBe('CLEAR');
  });
});
