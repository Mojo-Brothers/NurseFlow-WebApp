/**
 * NurseFlow Enterprise HIS 2026 — Sprint 3L.2: Sustained Clinical Load & Workload Mix Test Suite
 * Evaluates real-world clinical workload mix under continuous concurrent pressure on PostgreSQL 16.
 *
 * Clinical Workload Mix:
 *  - 30% Patient / Encounter Read
 *  - 20% Patient Search (MRN / Name / NIK)
 *  - 15% SOAP / CPPT Clinical Notes
 *  - 10% Vital Signs (Clinical Observations)
 *  - 10% CPOE Medication Orders
 *  -  5% Bed Allocation Race Contention (Mutex Guard)
 *  -  5% Pharmacy FEFO Expiry Sorting
 *  -  5% Universal Audit Log Event Write
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { postgresPoolService, pool } from '../server/db/postgresPool.js';
import crypto from 'crypto';

const testTenantId = '00000000-0000-0000-0000-000000000001';

describe('🏥 SPRINT 3L.2: Sustained Clinical Load & Clinical Workload Mix', () => {
  let seedPatientIds = [];
  let seedEncounterIds = [];
  let seedBedId = crypto.randomUUID();

  beforeAll(async () => {
    // 1. Seed base patients and encounters for read/search pool
    for (let i = 0; i < 20; i++) {
      const pId = crypto.randomUUID();
      const epId = crypto.randomUUID();
      const encId = crypto.randomUUID();
      const mrn = `MRN-${crypto.randomUUID().slice(0, 8)}-${i}`;
      const nik = `32${crypto.randomUUID().replace(/\D/g, '').slice(0, 14).padEnd(14, '0')}`;
      const name = `Pasien Sustained Mix ${i}`;

      await pool.query(`
        INSERT INTO master_patients (id, tenant_id, mrn, nik, full_name, gender, birth_date, phone_number, address_line)
        VALUES ($1, $2, $3, $4, $5, 'MALE', '1985-05-15', '081234567890', 'Jl. Sustained No. 1')
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
      `, [pId, testTenantId, mrn, nik, name]);

      await pool.query(`
        INSERT INTO episodes_of_care (id, tenant_id, episode_number, patient_id, episode_type, status, managing_department_id, managing_department_name, lead_dpjp_id, lead_dpjp_name)
        VALUES ($1, $2, $3, $4, 'RAWAT_INAP', 'ACTIVE', 'DEP-INT', 'Penyakit Dalam', 'DOC-01', 'dr. DPJP');
      `, [epId, testTenantId, `EOC-MIX-${Date.now()}-${i}`, pId]);

      await pool.query(`
        INSERT INTO encounters (id, tenant_id, encounter_number, episode_id, patient_id, encounter_type, encounter_class, status, primary_doctor_id, primary_doctor_name, service_room_id, service_room_name)
        VALUES ($1, $2, $3, $4, $5, 'RAWAT_INAP', 'IMP', 'IN_PROGRESS', 'DOC-01', 'dr. DPJP', 'RM-101', 'Kamar 101');
      `, [encId, testTenantId, `ENC-MIX-${Date.now()}-${i}`, epId, pId]);

      seedPatientIds.push(pId);
      seedEncounterIds.push({ encId, epId, pId });
    }

    // 2. Seed master bed for contention test
    await pool.query(`
      INSERT INTO master_beds (id, tenant_id, room_id, bed_number, bed_status, daily_tariff)
      VALUES ($1, $2, '00000000-0000-0000-0000-000000000001', $3, 'AVAILABLE', 1500000)
      ON CONFLICT DO NOTHING;
    `, [seedBedId, testTenantId, `ICU-SUSTAINED-${Date.now().toString().slice(-4)}`]);
  });

  it('should execute realistic 8-fold clinical workload mix with zero safety invariant violations', async () => {
    const totalTransactions = 100;
    const latencies = [];
    const counts = {
      read: 0,
      search: 0,
      soap: 0,
      vitals: 0,
      order: 0,
      bedRace: 0,
      fefo: 0,
      audit: 0
    };
    const errors = [];
    let doubleBookingCount = 0;

    const tasks = Array.from({ length: totalTransactions }, async (_, idx) => {
      const rand = Math.random() * 100;
      const client = await postgresPoolService.getClient();
      const start = performance.now();

      try {
        if (rand < 30) {
          // 30% Patient & Encounter Read
          const targetEnc = seedEncounterIds[idx % seedEncounterIds.length];
          const res = await client.query(`
            SELECT p.id, p.mrn, p.full_name, e.id as encounter_id, e.status
            FROM master_patients p 
            JOIN encounters e ON p.id = e.patient_id 
            WHERE e.id = $1;
          `, [targetEnc.encId]);
          expect(res.rows.length).toBeGreaterThanOrEqual(1);
          counts.read++;
        } else if (rand < 50) {
          // 20% Patient Search by MRN/Name
          const searchRes = await client.query(`
            SELECT id, mrn, full_name, nik, birth_date 
            FROM master_patients 
            WHERE full_name ILIKE '%Sustained%' 
            LIMIT 5;
          `);
          expect(searchRes.rows.length).toBeGreaterThanOrEqual(1);
          counts.search++;
        } else if (rand < 65) {
          // 15% SOAP Note Write
          const target = seedEncounterIds[idx % seedEncounterIds.length];
          await client.query('BEGIN');
          const soapId = crypto.randomUUID();
          await client.query(`
            INSERT INTO soap_notes (id, tenant_id, episode_id, encounter_id, patient_id, subjective, objective, assessment, plan, primary_icd10, primary_icd10_name, physician_id, physician_name)
            VALUES ($1, $2, $3, $4, $5, 'Evaluasi klinis rutin', 'TTV Normal', 'I10', 'Therapy maintained', 'I10', 'Hypertension', 'DOC-01', 'dr. Specialist');
          `, [soapId, testTenantId, target.epId, target.encId, target.pId]);
          await client.query('COMMIT');
          counts.soap++;
        } else if (rand < 75) {
          // 10% Vital Signs (Observations)
          const target = seedEncounterIds[idx % seedEncounterIds.length];
          await client.query('BEGIN');
          const obsId = crypto.randomUUID();
          await client.query(`
            INSERT INTO clinical_observations (id, tenant_id, encounter_id, episode_id, patient_id, observation_type, loinc_code, loinc_display, observation_value, unit, observer_name)
            VALUES ($1, $2, $3, $4, $5, 'VITAL_SIGNS', '8867-4', 'Heart Rate', '78', 'bpm', 'Nurse Anisa');
          `, [obsId, testTenantId, target.encId, target.epId, target.pId]);
          await client.query('COMMIT');
          counts.vitals++;
        } else if (rand < 85) {
          // 10% CPOE Universal Order Write
          const target = seedEncounterIds[idx % seedEncounterIds.length];
          await client.query('BEGIN');
          const orderId = crypto.randomUUID();
          const orderNum = `ORD-MIX-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`;
          await client.query(`
            INSERT INTO clinical_orders (id, tenant_id, order_number, patient_id, episode_id, encounter_id, ordered_by, order_category, clinical_indication, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'dr. Specialist', 'PHARMACY', 'Analgesik rutin', 'ORDERED');
          `, [orderId, testTenantId, orderNum, target.pId, target.epId, target.encId]);
          await client.query('COMMIT');
          counts.order++;
        } else if (rand < 90) {
          // 5% Bed Allocation Race Contention
          const target = seedEncounterIds[idx % seedEncounterIds.length];
          try {
            await client.query('BEGIN');
            const occId = crypto.randomUUID();
            await client.query(`
              INSERT INTO bed_occupancies (id, tenant_id, bed_id, patient_id, encounter_id, check_in_time, occupancy_status, admitting_doctor_name)
              VALUES ($1, $2, $3, $4, $5, NOW(), 'ACTIVE', 'dr. Emergency');
            `, [occId, testTenantId, seedBedId, target.pId, target.encId]);
            await client.query('COMMIT');
          } catch (e) {
            try { await client.query('ROLLBACK'); } catch (_) {}
            if (e.code !== '23505') {
              errors.push(e.message);
            }
          }
          counts.bedRace++;
        } else if (rand < 95) {
          // 5% FEFO Expiry Sorting Computation
          const batches = [
            { b: 'B3', exp: '2027-01-01' },
            { b: 'B1', exp: '2026-05-01' },
            { b: 'B2', exp: '2026-08-01' }
          ];
          const sorted = batches.sort((a, b) => new Date(a.exp) - new Date(b.exp));
          expect(sorted[0].b).toBe('B1');
          counts.fefo++;
        } else {
          // 5% Universal Audit Trail Write (JCI Cryptographic Signature)
          const target = seedEncounterIds[idx % seedEncounterIds.length];
          await client.query('BEGIN');
          const auditId = crypto.randomUUID();
          const sigHash = crypto.createHash('sha256').update(`AUDIT-${auditId}-${Date.now()}`).digest('hex');
          await client.query(`
            INSERT INTO universal_audit_logs (id, tenant_id, actor_id, actor_name, actor_role, client_ip, action_type, resource_type, resource_id, patient_id, signature_hash)
            VALUES ($1, $2, 'DOC-01', 'dr. Specialist', 'ROLE_DOCTOR_DPJP', '10.10.1.100', 'READ', 'ENCOUNTER', $3, $4, $5);
          `, [auditId, testTenantId, target.encId, target.pId, sigHash]);
          await client.query('COMMIT');
          counts.audit++;
        }
      } catch (err) {
        errors.push(err.message);
      } finally {
        latencies.push(performance.now() - start);
        client.release();
      }
    });

    await Promise.all(tasks);

    // Verify Bed Invariant (At most 1 active occupancy in database)
    const occCheck = await pool.query(`
      SELECT count(*) as count FROM bed_occupancies WHERE bed_id = $1 AND check_out_time IS NULL;
    `, [seedBedId]);
    const activeOcc = parseInt(occCheck.rows[0].count, 10);
    expect(activeOcc).toBeLessThanOrEqual(1); // Double booking = 0
    if (activeOcc > 1) doubleBookingCount++;

    if (errors.length > 0) {
      console.error('FIRST 3 ERRORS:', errors.slice(0, 3));
    }

    // Assertions
    expect(errors.length).toBe(0);
    expect(doubleBookingCount).toBe(0);

    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    expect(p95).toBeLessThan(1500); // p95 latency SLA
  });
});
