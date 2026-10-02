/**
 * P0-2B WAVE 1B.1 — Real PostgreSQL & RLS Integration Evidence Test Suite
 * Domain: Emergency Triage Assessment (ATS/ESI) & Response SLA Tracking
 *
 * EVIDENCE REQUIREMENTS:
 *   E1. REAL_DB_VERIFIED: Real PostgreSQL 16 on localhost:5432 (database: nurseflow_security_lab).
 *   E2. REAL_RLS_READ_VERIFIED: Cross-tenant reads return null / 0 rows via PostgreSQL RLS.
 *   E3. REAL_RLS_WRITE_VERIFIED: Cross-tenant direct writes blocked by PostgreSQL RLS (42501).
 *   E4. APPLICATION_VALIDATION: Cross-tenant application write denied because encounter row
 *       is hidden by RLS from caller tenant (404 ENCOUNTER_NOT_FOUND).
 *   E5. REAL_COMMIT_VERIFIED: Multi-table write atomically committed and verified in DB.
 *   E6. REAL_ROLLBACK_VERIFIED: Forced error causes clean transaction rollback; no partial state.
 *   E7. REAL_CONNECTION_ISOLATION_VERIFIED: SET LOCAL + DISCARD ALL prevents GUC leak on reused connection.
 *
 * CHARTER:
 *   - Runs against disposable test lab: nurseflow_security_lab.
 *   - NEVER runs against production or nurseflow_enterprise_his.
 *   - Role: nurseflow_app_user (rolsuper=false, rolbypassrls=false).
 *   - Zero fake prefixes (uses valid v4 UUIDs).
 *   - Zero clinical/business logic alterations.
 */

// Configure environment to point strictly to the disposable security lab BEFORE any DB import
process.env.POSTGRES_DB = 'nurseflow_security_lab';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';

// Dynamic import ensures process.env.POSTGRES_DB is evaluated first
const { pool } = await import('../server/db/postgresPool.js');
const { triageApplicationService, TriageDomainError } = await import('../server/services/triageApplication.service.js');
const { withUnitOfWork } = await import('../server/db/unitOfWork.js');

// Controlled Test Tenants (Valid RFC 4122 UUIDs)
const TENANT_A = 'a0000000-0000-4000-8000-000000000001';
const TENANT_B = 'b0000000-0000-4000-8000-000000000002';

// Controlled Actors
const ACTOR_A = {
  userId: 'USR-NURSE-A01',
  username: 'perawat_lab_a',
  role: 'ROLE_NURSE',
  tenantId: TENANT_A
};

const ACTOR_B = {
  userId: 'USR-NURSE-B01',
  username: 'perawat_lab_b',
  role: 'ROLE_NURSE',
  tenantId: TENANT_B
};

// Fixture Entity IDs (Valid RFC 4122 UUIDs)
const PATIENT_A_ID   = '10000000-0000-4000-8000-000000000001';
const PATIENT_B_ID   = '10000000-0000-4000-8000-000000000002';
const EPISODE_A_ID   = '20000000-0000-4000-8000-000000000001';
const EPISODE_B_ID   = '20000000-0000-4000-8000-000000000002';
const ENCOUNTER_A_ID = '30000000-0000-4000-8000-000000000001';
const ENCOUNTER_B_ID = '30000000-0000-4000-8000-000000000002';

describe('P0-2B WAVE 1B.1 — Real PostgreSQL & RLS Integration Evidence', () => {

  beforeAll(async () => {
    // 1. Verify connection and ensure we are strictly in disposable nurseflow_security_lab
    const info = await pool.query('SELECT current_database(), current_user, version();');
    expect(info.rows[0].current_database).toBe('nurseflow_security_lab');
    expect(info.rows[0].current_user).toBe('nurseflow_app_user');

    // 2. Seed tenant_organizations for foreign key prerequisites
    await pool.query(`
      INSERT INTO tenant_organizations (id, tenant_code, organization_name, hospital_type, status)
      VALUES
        ($1, 'LAB-TENANT-A', 'Hospital Lab Alpha', 'TYPE_B', 'ACTIVE'),
        ($2, 'LAB-TENANT-B', 'Hospital Lab Beta', 'TYPE_B', 'ACTIVE')
      ON CONFLICT (id) DO NOTHING;
    `, [TENANT_A, TENANT_B]);

    // 3. Clean up any previous triage test records from both tenants
    await cleanTenantData(TENANT_A);
    await cleanTenantData(TENANT_B);

    // 4. Seed Base Data for Tenant A (Patient, Episode, Encounter)
    await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
      await query(`
        INSERT INTO master_patients (
          id, tenant_id, mrn, nik, full_name, birth_date, gender, phone_number, address_line
        ) VALUES (
          $1, $2, 'MRN-LAB-A-001', '3171010101010001', 'Pasien Uji Lab A', '1990-01-01', 'MALE', '081234567890', 'Lab A St'
        ) ON CONFLICT (id) DO NOTHING;
      `, [PATIENT_A_ID, TENANT_A]);

      await query(`
        INSERT INTO episodes_of_care (
          id, tenant_id, patient_id, episode_number, status, episode_type,
          managing_department_id, managing_department_name, lead_dpjp_id, lead_dpjp_name, branch_id, start_time
        ) VALUES (
          $1, $2, $3, 'EP-LAB-A-001', 'ACTIVE', 'GAWAT_DARURAT',
          'DEPT-IGD', 'Instalasi Gawat Darurat', 'DOC-001', 'dr. Emergency A', 'BRANCH-01', NOW()
        ) ON CONFLICT (id) DO NOTHING;
      `, [EPISODE_A_ID, TENANT_A, PATIENT_A_ID]);

      await query(`
        INSERT INTO encounters (
          id, tenant_id, episode_id, patient_id, encounter_number, encounter_type,
          encounter_class, status, primary_doctor_id, primary_doctor_name,
          service_room_id, service_room_name, created_at
        ) VALUES (
          $1, $2, $3, $4, 'ENC-LAB-A-001', 'EMERGENCY',
          'EMER', 'ARRIVED', 'DOC-001', 'dr. Emergency A',
          'ROOM-IGD-01', 'Ruang Triase IGD A', NOW()
        ) ON CONFLICT (id) DO UPDATE SET status = 'ARRIVED';
      `, [ENCOUNTER_A_ID, TENANT_A, EPISODE_A_ID, PATIENT_A_ID]);
    });

    // 5. Seed Base Data for Tenant B (Patient, Episode, Encounter)
    await withUnitOfWork({ tenantId: TENANT_B }, async ({ query }) => {
      await query(`
        INSERT INTO master_patients (
          id, tenant_id, mrn, nik, full_name, birth_date, gender, phone_number, address_line
        ) VALUES (
          $1, $2, 'MRN-LAB-B-001', '3171010101010002', 'Pasien Uji Lab B', '1992-02-02', 'FEMALE', '081298765432', 'Lab B St'
        ) ON CONFLICT (id) DO NOTHING;
      `, [PATIENT_B_ID, TENANT_B]);

      await query(`
        INSERT INTO episodes_of_care (
          id, tenant_id, patient_id, episode_number, status, episode_type,
          managing_department_id, managing_department_name, lead_dpjp_id, lead_dpjp_name, branch_id, start_time
        ) VALUES (
          $1, $2, $3, 'EP-LAB-B-001', 'ACTIVE', 'GAWAT_DARURAT',
          'DEPT-IGD', 'Instalasi Gawat Darurat', 'DOC-002', 'dr. Emergency B', 'BRANCH-01', NOW()
        ) ON CONFLICT (id) DO NOTHING;
      `, [EPISODE_B_ID, TENANT_B, PATIENT_B_ID]);

      await query(`
        INSERT INTO encounters (
          id, tenant_id, episode_id, patient_id, encounter_number, encounter_type,
          encounter_class, status, primary_doctor_id, primary_doctor_name,
          service_room_id, service_room_name, created_at
        ) VALUES (
          $1, $2, $3, $4, 'ENC-LAB-B-001', 'EMERGENCY',
          'EMER', 'ARRIVED', 'DOC-002', 'dr. Emergency B',
          'ROOM-IGD-02', 'Ruang Triase IGD B', NOW()
        ) ON CONFLICT (id) DO UPDATE SET status = 'ARRIVED';
      `, [ENCOUNTER_B_ID, TENANT_B, EPISODE_B_ID, PATIENT_B_ID]);
    });
  });

  afterAll(async () => {
    try {
      await cleanTenantData(TENANT_A);
      await cleanTenantData(TENANT_B);
    } catch {
      // Ignored during teardown
    }
  });

  async function cleanTenantData(tenantId) {
    await withUnitOfWork({ tenantId }, async ({ query }) => {
      await query('DELETE FROM triage_sla_timers WHERE tenant_id = $1;', [tenantId]);
      await query('DELETE FROM triage_assessments WHERE tenant_id = $1;', [tenantId]);
      await query("UPDATE encounters SET status = 'ARRIVED' WHERE tenant_id = $1;", [tenantId]);
    });
  }

  // =========================================================================
  // 1. REAL WRITE ISOLATION & TRANSACTION COMMIT
  // =========================================================================
  describe('1. Real Write Isolation & Atomic Commit (Section 8 & 9)', () => {
    it('1.1 — Tenant A writes triage assessment to ENCOUNTER_A (COMMIT)', async () => {
      const payload = {
        encounterId: ENCOUNTER_A_ID,
        patientId: PATIENT_A_ID,
        episodeId: EPISODE_A_ID,
        triageMethod: 'ATS',
        atsLevel: 2,
        chiefComplaint: 'Nyeri dada menusuk sejak 1 jam SMRS',
        airwayStatus: 'CLEAR',
        breathingStatus: 'NORMAL',
        circulationStatus: 'NORMAL',
        disabilityStatus: 'ALERT',
        vitalsPayload: { systolic: 130, diastolic: 85, hr: 88, rr: 20, spo2: 98, gcs: 15 }
      };

      const result = await triageApplicationService.recordTriageAssessment(
        payload,
        ACTOR_A,
        '10.0.0.1',
        'CORR-REAL-001'
      );

      expect(result).toBeDefined();
      expect(result.triage.triage_level).toBe('ATS_2_EMERGENT');
      expect(result.triage.ats_level).toBe(2);
      expect(result.triage.tenant_id).toBe(TENANT_A);
      expect(result.slaTimer.status).toBe('RUNNING');

      // Direct DB verification: check record is physically committed in PostgreSQL
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
        const triageCheck = await query('SELECT * FROM triage_assessments WHERE id = $1;', [result.triage.id]);
        expect(triageCheck.rows.length).toBe(1);
        expect(triageCheck.rows[0].encounter_id).toBe(ENCOUNTER_A_ID);

        const encCheck = await query('SELECT status FROM encounters WHERE id = $1;', [ENCOUNTER_A_ID]);
        expect(encCheck.rows[0].status).toBe('TRIAGED');
      });
    });

    it('1.2 — Tenant B writes triage assessment to ENCOUNTER_B (COMMIT)', async () => {
      const payload = {
        encounterId: ENCOUNTER_B_ID,
        patientId: PATIENT_B_ID,
        episodeId: EPISODE_B_ID,
        triageMethod: 'ATS',
        atsLevel: 3,
        chiefComplaint: 'Demam tinggi 3 hari',
        airwayStatus: 'CLEAR',
        breathingStatus: 'NORMAL',
        circulationStatus: 'NORMAL',
        disabilityStatus: 'ALERT',
        vitalsPayload: { systolic: 110, diastolic: 70, hr: 95, rr: 18, spo2: 99, gcs: 15 }
      };

      const result = await triageApplicationService.recordTriageAssessment(
        payload,
        ACTOR_B,
        '10.0.0.2',
        'CORR-REAL-002'
      );

      expect(result).toBeDefined();
      expect(result.triage.triage_level).toBe('ATS_3_URGENT');
      expect(result.triage.ats_level).toBe(3);
      expect(result.triage.tenant_id).toBe(TENANT_B);

      // Direct DB verification
      await withUnitOfWork({ tenantId: TENANT_B }, async ({ query }) => {
        const triageCheck = await query('SELECT * FROM triage_assessments WHERE id = $1;', [result.triage.id]);
        expect(triageCheck.rows.length).toBe(1);
        expect(triageCheck.rows[0].encounter_id).toBe(ENCOUNTER_B_ID);
      });
    });

    it('1.3 — Tenant A attempts cross-tenant triage on ENCOUNTER_B: Denied at APPLICATION_VALIDATION because RLS hides row', async () => {
      const payload = {
        encounterId: ENCOUNTER_B_ID, // Owned by Tenant B
        patientId: PATIENT_B_ID,
        episodeId: EPISODE_B_ID,
        triageMethod: 'ATS',
        atsLevel: 1,
        chiefComplaint: 'Henti jantung (Cross-tenant attack)',
        airwayStatus: 'OBSTRUCTED',
        breathingStatus: 'APNEA',
        circulationStatus: 'PULSELESS',
        disabilityStatus: 'UNRESPONSIVE'
      };

      // Service executes SELECT * FROM encounters WHERE id = $1 FOR UPDATE under TENANT_A.
      // PostgreSQL RLS hides ENCOUNTER_B from TENANT_A.
      // Application throws ENCOUNTER_NOT_FOUND (404).
      await expect(
        triageApplicationService.recordTriageAssessment(payload, ACTOR_A, '10.0.0.1', 'CORR-ATTACK-01')
      ).rejects.toThrowError(/Encounter dengan ID .* tidak ditemukan/);
    });

    it('1.4 — Direct SQL cross-tenant INSERT under UoW: Denied by POSTGRESQL RLS (code 42501)', async () => {
      // Execute under TENANT_A session context, but try to INSERT a row specifying tenant_id = TENANT_B
      // Table triage_assessments has WITH CHECK (tenant_id = current_app_tenant_id())
      let pgError = null;

      try {
        await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
          await query(`
            INSERT INTO triage_assessments (
              id, tenant_id, episode_id, encounter_id, patient_id, triage_method,
              triage_level, chief_complaint, airway_status, breathing_status,
              circulation_status, disability_status, vitals_payload, target_response_minutes,
              assessed_at, assessed_by
            ) VALUES (
              $1, $2, $3, $4, $5, 'ATS',
              1, 'RLS Bypass Attack', 'CLEAR', 'NORMAL',
              'NORMAL', 'ALERT', '{}'::jsonb, 10,
              NOW(), 'ATTACKER'
            );
          `, [crypto.randomUUID(), TENANT_B, EPISODE_A_ID, ENCOUNTER_A_ID, PATIENT_A_ID]);
        });
      } catch (err) {
        pgError = err;
      }

      expect(pgError).toBeDefined();
      // PostgreSQL error 42501: new row violates row-level security policy for table "triage_assessments"
      expect(pgError.code).toBe('42501');
      expect(pgError.message).toMatch(/violates row-level security policy/i);
    });
  });

  // =========================================================================
  // 2. REAL READ ISOLATION (Section 7)
  // =========================================================================
  describe('2. Real Read Isolation (Section 7)', () => {
    it('2.1 — Tenant A reads ENCOUNTER_A -> returns Triage A', async () => {
      const triage = await triageApplicationService.getTriageByEncounterId(ENCOUNTER_A_ID, ACTOR_A);
      expect(triage).not.toBeNull();
      expect(triage.encounter_id).toBe(ENCOUNTER_A_ID);
      expect(triage.tenant_id).toBe(TENANT_A);
      expect(triage.patient_name).toBe('Pasien Uji Lab A');
    });

    it('2.2 — Tenant A reads ENCOUNTER_B -> returns null (MUST NOT return B)', async () => {
      // ENCOUNTER_B exists in DB, but belongs to Tenant B.
      // Under ACTOR_A context, RLS filters out encounters and triage_assessments.
      const triage = await triageApplicationService.getTriageByEncounterId(ENCOUNTER_B_ID, ACTOR_A);
      expect(triage).toBeNull();
    });

    it('2.3 — Tenant B reads ENCOUNTER_B -> returns Triage B', async () => {
      const triage = await triageApplicationService.getTriageByEncounterId(ENCOUNTER_B_ID, ACTOR_B);
      expect(triage).not.toBeNull();
      expect(triage.encounter_id).toBe(ENCOUNTER_B_ID);
      expect(triage.tenant_id).toBe(TENANT_B);
      expect(triage.patient_name).toBe('Pasien Uji Lab B');
    });

    it('2.4 — Tenant B reads ENCOUNTER_A -> returns null (MUST NOT return A)', async () => {
      const triage = await triageApplicationService.getTriageByEncounterId(ENCOUNTER_A_ID, ACTOR_B);
      expect(triage).toBeNull();
    });
  });

  // =========================================================================
  // 3. REAL TRANSACTION ROLLBACK (Section 9)
  // =========================================================================
  describe('3. Real Transaction Rollback (Section 9)', () => {
    it('3.1 — Forced error after initial write triggers ROLLBACK; no partial writes persisted', async () => {
      const testEncounterId = '40000000-0000-4000-8000-000000000001';
      const testTriageId = crypto.randomUUID();

      // Seed a dedicated encounter for rollback test
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
        await query(`
          INSERT INTO encounters (
            id, tenant_id, episode_id, patient_id, encounter_number, encounter_type,
            encounter_class, status, primary_doctor_id, primary_doctor_name,
            service_room_id, service_room_name, created_at
          ) VALUES (
            $1, $2, $3, $4, 'ENC-ROLLBACK-01', 'EMERGENCY',
            'EMER', 'ARRIVED', 'DOC-001', 'dr. Rollback',
            'ROOM-IGD-01', 'Ruang Triase', NOW()
          ) ON CONFLICT (id) DO UPDATE SET status = 'ARRIVED';
        `, [testEncounterId, TENANT_A, EPISODE_A_ID, PATIENT_A_ID]);
      });

      // Execute UoW that writes #1 then throws forced error
      let caughtError = null;
      try {
        await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
          // Write #1: Insert into triage_assessments
          await query(`
            INSERT INTO triage_assessments (
              id, tenant_id, episode_id, encounter_id, patient_id, triage_method,
              triage_level, chief_complaint, airway_status, breathing_status,
              circulation_status, disability_status, vitals_payload, target_response_minutes,
              assessed_at, assessed_by
            ) VALUES (
              $1, $2, $3, $4, $5, 'ATS',
              2, 'Rollback Test', 'CLEAR', 'NORMAL',
              'NORMAL', 'ALERT', '{}'::jsonb, 10,
              NOW(), 'NURSE-01'
            );
          `, [testTriageId, TENANT_A, EPISODE_A_ID, testEncounterId, PATIENT_A_ID]);

          // Force an intentional domain error before commit
          throw new Error('SIMULATED_CONTROLLED_TRANSACTION_FAILURE');
        });
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError.message).toBe('SIMULATED_CONTROLLED_TRANSACTION_FAILURE');

      // Verify that Write #1 is COMPLETELY ABSENT from PostgreSQL
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
        const check = await query('SELECT * FROM triage_assessments WHERE id = $1;', [testTriageId]);
        expect(check.rows.length).toBe(0);

        // Encounter status must still be ARRIVED (not modified)
        const enc = await query('SELECT status FROM encounters WHERE id = $1;', [testEncounterId]);
        expect(enc.rows[0].status).toBe('ARRIVED');
      });
    });
  });

  // =========================================================================
  // 4. REAL CONNECTION / TENANT LEAK TEST (Section 10)
  // =========================================================================
  describe('4. Real Connection & Tenant Leak Test (Section 10)', () => {
    it('4.1 — Sequential reuse of same physical connection does NOT bleed tenant context', async () => {
      // Check out a single dedicated client directly from pool
      const client = await pool.connect();

      try {
        // Step 1: Request A under TENANT_A
        await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');
        await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
        const gucA = await client.query("SELECT current_setting('app.current_tenant_id', true) as t;");
        expect(gucA.rows[0].t).toBe(TENANT_A);
        await client.query('COMMIT;');
        await client.query('DISCARD ALL;'); // Mimics UoW finally block

        // Step 2: Request B under TENANT_B on SAME connection
        await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');
        await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_B]);
        const gucB = await client.query("SELECT current_setting('app.current_tenant_id', true) as t;");
        expect(gucB.rows[0].t).toBe(TENANT_B);
        expect(gucB.rows[0].t).not.toBe(TENANT_A);
        await client.query('COMMIT;');
        await client.query('DISCARD ALL;');

        // Step 3: Request C without tenant context on SAME connection
        // After DISCARD ALL, app.current_tenant_id must be completely cleared
        const gucC = await client.query("SELECT current_setting('app.current_tenant_id', true) as t;");
        const valC = gucC.rows[0].t;
        expect(valC === '' || valC === null).toBe(true);

        // Raw query on encounters without tenant GUC returns 0 rows (fail-closed RLS)
        const encs = await client.query('SELECT * FROM encounters;');
        expect(encs.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });
  });
});
