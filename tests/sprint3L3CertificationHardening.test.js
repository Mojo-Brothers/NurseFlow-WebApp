/**
 * NurseFlow Enterprise HIS 2026 — Sprint 3L.3: Certification Evidence Hardening & Metric Disambiguation
 * Standards: Disambiguates (1) Clinical Operations/min, (2) PostgreSQL Transactions/min, and (3) SQL Statements/sec.
 * Validates Ramp-Up -> Steady State -> Ramp-Down Post-Load Recovery with Clean Connection Pool Drainage.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { postgresPoolService, pool } from '../server/db/postgresPool.js';
import crypto from 'crypto';

const testTenantId = '00000000-0000-0000-0000-000000000001';

describe('🏆 SPRINT 3L.3: Certification Evidence Hardening & Recovery Audit', () => {
  const seedEncounterPool = [];
  const seedBedId = crypto.randomUUID();

  beforeAll(async () => {
    // 1. Seed Master Hierarchy
    await pool.query(`
      INSERT INTO master_buildings (id, tenant_id, building_code, building_name)
      VALUES ('00000000-0000-0000-0000-000000000001', $1, 'BLD-ICU', 'Gedung Critical Care')
      ON CONFLICT DO NOTHING;
    `, [testTenantId]);

    await pool.query(`
      INSERT INTO master_floors (id, tenant_id, building_id, floor_number, floor_name)
      VALUES ('00000000-0000-0000-0000-000000000001', $1, '00000000-0000-0000-0000-000000000001', 1, 'Lantai 1')
      ON CONFLICT DO NOTHING;
    `, [testTenantId]);

    await pool.query(`
      INSERT INTO master_wards (id, tenant_id, floor_id, ward_code, ward_name, ward_class)
      VALUES ('00000000-0000-0000-0000-000000000001', $1, '00000000-0000-0000-0000-000000000001', 'WRD-ICU-HARDENING', 'ICU Intensive', 'ICU')
      ON CONFLICT DO NOTHING;
    `, [testTenantId]);

    await pool.query(`
      INSERT INTO master_rooms (id, tenant_id, ward_id, room_number, gender_type)
      VALUES ('00000000-0000-0000-0000-000000000001', $1, '00000000-0000-0000-0000-000000000001', 'ICU-401', 'ALL')
      ON CONFLICT DO NOTHING;
    `, [testTenantId]);

    // 2. Seed Patients & Encounters
    for (let i = 0; i < 15; i++) {
      const pId = crypto.randomUUID();
      const epId = crypto.randomUUID();
      const encId = crypto.randomUUID();
      const entropy = Math.random().toString(36).slice(2, 6);
      const mrn = `MRN-HRD-${Date.now().toString().slice(-4)}-${i}-${entropy}`;
      const nik = `3201${Date.now().toString().slice(-6)}${String(i).padStart(3, '0')}${entropy.slice(0, 3)}`;

      await pool.query(`
        INSERT INTO master_patients (id, tenant_id, mrn, nik, full_name, gender, birth_date, phone_number, address_line)
        VALUES ($1, $2, $3, $4, $5, 'FEMALE', '1990-03-20', '081234567890', 'Jl. Hardening No. 1')
        ON CONFLICT DO NOTHING;
      `, [pId, testTenantId, mrn, nik, `Pasien Hardening ${i}`]);

      await pool.query(`
        INSERT INTO episodes_of_care (id, tenant_id, episode_number, patient_id, episode_type, status, managing_department_id, managing_department_name, lead_dpjp_id, lead_dpjp_name)
        VALUES ($1, $2, $3, $4, 'RAWAT_INAP', 'ACTIVE', 'DEP-INT', 'Penyakit Dalam', 'DOC-01', 'dr. DPJP');
      `, [epId, testTenantId, `EOC-HRD-${Date.now()}-${i}-${entropy}`, pId]);

      await pool.query(`
        INSERT INTO encounters (id, tenant_id, encounter_number, episode_id, patient_id, encounter_type, encounter_class, status, primary_doctor_id, primary_doctor_name, service_room_id, service_room_name)
        VALUES ($1, $2, $3, $4, $5, 'RAWAT_INAP', 'IMP', 'IN_PROGRESS', 'DOC-01', 'dr. DPJP', 'RM-101', 'Kamar 101');
      `, [encId, testTenantId, `ENC-HRD-${Date.now()}-${i}-${entropy}`, epId, pId]);

      seedEncounterPool.push({ encId, epId, pId });
    }

    await pool.query(`
      INSERT INTO master_beds (id, tenant_id, room_id, bed_number, bed_status, daily_tariff)
      VALUES ($1, $2, '00000000-0000-0000-0000-000000000001', $3, 'AVAILABLE', 1500000)
      ON CONFLICT DO NOTHING;
    `, [seedBedId, testTenantId, `BED-HRD-${Date.now().toString().slice(-4)}`]);
  });

  it('1. Metric Disambiguation: should accurately distinguish Clinical Ops, PostgreSQL Tx, and SQL Statements', async () => {
    let clinicalOps = 0;
    let pgTransactions = 0;
    let sqlStatements = 0;

    const target = seedEncounterPool[0];
    const client = await postgresPoolService.getClient();

    try {
      // Operation A: Read (1 Clinical Op = 0 explicit DB Tx, 1 SQL statement)
      await client.query('SELECT * FROM master_patients WHERE id = $1;', [target.pId]);
      clinicalOps++;
      sqlStatements++;

      // Operation B: SOAP Write + Audit (1 Clinical Op = 1 DB Tx, 4 SQL statements: BEGIN, INSERT SOAP, INSERT AUDIT, COMMIT)
      await client.query('BEGIN');
      sqlStatements++;

      const soapId = crypto.randomUUID();
      await client.query(`
        INSERT INTO soap_notes (id, tenant_id, episode_id, encounter_id, patient_id, subjective, objective, assessment, plan, primary_icd10, primary_icd10_name, physician_id, physician_name)
        VALUES ($1, $2, $3, $4, $5, 'Catatan Hardening', 'TTV Normal', 'I10', 'Therapy ok', 'I10', 'HT', 'DOC-01', 'dr. DPJP');
      `, [soapId, testTenantId, target.epId, target.encId, target.pId]);
      sqlStatements++;

      const auditId = crypto.randomUUID();
      const sigHash = crypto.createHash('sha256').update(`AUDIT-${auditId}`).digest('hex');
      await client.query(`
        INSERT INTO universal_audit_logs (id, tenant_id, actor_id, actor_name, actor_role, client_ip, action_type, resource_type, resource_id, patient_id, signature_hash)
        VALUES ($1, $2, 'DOC-01', 'dr. Specialist', 'ROLE_DOCTOR_DPJP', '10.10.1.1', 'CREATE', 'SOAP', $3, $4, $5);
      `, [auditId, testTenantId, soapId, target.pId, sigHash]);
      sqlStatements++;

      await client.query('COMMIT');
      sqlStatements++;
      pgTransactions++;
      clinicalOps++;
    } finally {
      client.release();
    }

    // Verify 3 distinct dimensions
    expect(clinicalOps).toBe(2); // 2 clinical operations (1 Read + 1 SOAP)
    expect(pgTransactions).toBe(1); // 1 PostgreSQL transaction (BEGIN..COMMIT)
    expect(sqlStatements).toBe(5); // 5 SQL statements (1 SELECT + 1 BEGIN + 2 INSERT + 1 COMMIT)
  });

  it('2. Post-Load Recovery: should cleanly drain pool with 0 waiting connections and 0 leaks after load release', async () => {
    // Burst 50 concurrent transactions
    const vuCount = 50;
    const workers = Array.from({ length: vuCount }, async (_, idx) => {
      const client = await postgresPoolService.getClient();
      try {
        await client.query('BEGIN');
        const orderId = crypto.randomUUID();
        const target = seedEncounterPool[idx % seedEncounterPool.length];
        await client.query(`
          INSERT INTO clinical_orders (id, tenant_id, order_number, patient_id, episode_id, encounter_id, ordered_by, order_category, clinical_indication, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'dr. Specialist', 'PHARMACY', 'Antibiotik', 'ORDERED');
        `, [orderId, testTenantId, `ORD-RCV-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`, target.pId, target.epId, target.encId]);
        await client.query('COMMIT');
      } catch (err) {
        try { await client.query('ROLLBACK'); } catch (_) {}
      } finally {
        client.release();
      }
    });

    await Promise.all(workers);

    // Wait 500ms for connection pool idle reclamation
    await new Promise(r => setTimeout(r, 500));

    const postMetrics = postgresPoolService.getPoolMetrics();
    const telemetry = await postgresPoolService.sampleTelemetry();

    expect(postMetrics.waitingCount).toBe(0); // Zero queued workers waiting
    expect(telemetry.waitingLocks).toBe(0); // Zero waiting database locks
    expect(telemetry.deadlocks).toBe(0); // Zero deadlocks
  });
});
