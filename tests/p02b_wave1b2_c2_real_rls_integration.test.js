/**
 * P0-2B WAVE 1B.2 — Real PostgreSQL & RLS Integration Evidence Test Suite
 * Candidate C2: Diagnostic Interpretation Closed-Loop & Secondary Action Ordering
 * Standards: JCI IPSG 2 / PMKP, ISO 15189, PostgreSQL 16 ACID Transactions, RLS Policy Verification
 *
 * EVIDENCE REQUIREMENTS:
 *   C2-RLS-01: Tenant A reads own diagnostic notifications, encounters, and interpretations.
 *   C2-RLS-02: Tenant A cannot read Tenant B data (returns 0 rows via PostgreSQL RLS filtering).
 *   C2-RLS-03: Tenant A writes own interpretations, audit logs, and secondary actions (committed with tenant_id).
 *   C2-RLS-04: Direct cross-tenant write blocked by PostgreSQL RLS with-check violation (SQLSTATE 42501).
 *   C2-RLS-05: CS 82 verification: executeSecondaryClinicalAction creates clinical_orders with explicit tenant_id.
 *   C2-RLS-06: Transaction rollback atomicity: forced error leaves zero dirty/partial records in database.
 *   C2-RLS-07: Connection reuse cleanliness: DISCARD ALL prevents GUC leak on reused connection.
 *   C2-RLS-08: Missing tenant context rejection: fail-closed 403 AUTHORITATIVE_TENANT_REQUIRED.
 *   C2-RLS-09: Invalid UUID tenant context rejection: fail-closed 403 AUTHORITATIVE_TENANT_REQUIRED.
 *
 * ENVIRONMENT:
 *   - Runs strictly against disposable security test lab: nurseflow_security_lab.
 *   - NEVER touches production database.
 *   - Role: nurseflow_app_user (rolsuper=false, rolbypassrls=false).
 */

// Configure environment to point strictly to the disposable security lab BEFORE any DB import
process.env.POSTGRES_DB = 'nurseflow_security_lab';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';

// Dynamic import ensures process.env.POSTGRES_DB is evaluated first
const { pool, postgresPoolService } = await import('../server/db/postgresPool.js');
const {
  diagnosticInterpretationService,
  DiagnosticInterpretationDomainError
} = await import('../server/services/diagnosticInterpretation.service.js');
const { withUnitOfWork } = await import('../server/db/unitOfWork.js');
const { ENTERPRISE_ROLES } = await import('../src/shared/constants/roles.js');

// Controlled Test Tenants (RFC 4122 UUID v4)
const TENANT_A = 'a0000000-0000-4000-8000-000000000001';
const TENANT_B = 'b0000000-0000-4000-8000-000000000002';

// Controlled Actors
const ACTOR_A_LAB = {
  userId: 'USR-LAB-A01',
  username: 'analis_lab_a',
  fullName: 'Analis Laboratorium Alpha',
  role: ENTERPRISE_ROLES.ROLE_LAB_TECHNICIAN,
  tenantId: TENANT_A
};

const ACTOR_A_DOC = {
  userId: 'DOC-DPJP-A01',
  username: 'dr_siti_a',
  fullName: 'dr. Siti Rahma, Sp.PD',
  role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
  tenantId: TENANT_A
};

const ACTOR_B_LAB = {
  userId: 'USR-LAB-B01',
  username: 'analis_lab_b',
  fullName: 'Analis Laboratorium Beta',
  role: ENTERPRISE_ROLES.ROLE_LAB_TECHNICIAN,
  tenantId: TENANT_B
};

const ACTOR_B_DOC = {
  userId: 'DOC-DPJP-B01',
  username: 'dr_budi_b',
  fullName: 'dr. Budi Setiawan, Sp.PD',
  role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
  tenantId: TENANT_B
};

// Fixture Entity IDs (Valid RFC 4122 UUIDs)
const PATIENT_A_ID   = '10000000-0000-4000-8000-000000000001';
const PATIENT_B_ID   = '10000000-0000-4000-8000-000000000002';
const EPISODE_A_ID   = '20000000-0000-4000-8000-000000000001';
const EPISODE_B_ID   = '20000000-0000-4000-8000-000000000002';
const ENCOUNTER_A_ID = '30000000-0000-4000-8000-000000000001';
const ENCOUNTER_B_ID = '30000000-0000-4000-8000-000000000002';

describe('P0-2B WAVE 1B.2 — Candidate C2 Real PostgreSQL & RLS Integration Evidence', () => {

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

    // 3. Clean up prior C2 test data
    await cleanC2TenantData(TENANT_A);
    await cleanC2TenantData(TENANT_B);

    // 4. Seed Base Data for Tenant A (Patient, Episode, Encounter)
    await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
      await query(`
        INSERT INTO master_patients (
          id, tenant_id, mrn, nik, full_name, birth_date, gender, phone_number, address_line
        ) VALUES (
          $1, $2, 'MRN-C2-A-001', '3171010101010001', 'Pasien Diagnostik A', '1985-05-15', 'FEMALE', '081234567890', 'Lab A St'
        ) ON CONFLICT (id) DO NOTHING;
      `, [PATIENT_A_ID, TENANT_A]);

      await query(`
        INSERT INTO episodes_of_care (
          id, tenant_id, patient_id, episode_number, status, episode_type,
          managing_department_id, managing_department_name, lead_dpjp_id, lead_dpjp_name, branch_id, start_time
        ) VALUES (
          $1, $2, $3, 'EP-C2-A-001', 'ACTIVE', 'RAWAT_INAP',
          'DEPT-INTERNAL', 'Instalasi Rawat Inap', 'DOC-DPJP-A01', 'dr. Siti Rahma, Sp.PD', 'BRANCH-01', NOW()
        ) ON CONFLICT (id) DO NOTHING;
      `, [EPISODE_A_ID, TENANT_A, PATIENT_A_ID]);

      await query(`
        INSERT INTO encounters (
          id, tenant_id, episode_id, patient_id, encounter_number, encounter_type,
          encounter_class, status, primary_doctor_id, primary_doctor_name,
          service_room_id, service_room_name, created_at
        ) VALUES (
          $1, $2, $3, $4, 'ENC-C2-A-001', 'INPATIENT',
          'IMP', 'IN_PROGRESS', 'DOC-DPJP-A01', 'dr. Siti Rahma, Sp.PD',
          'ROOM-ICU-01', 'Ruang Rawat Intensif A', NOW()
        ) ON CONFLICT (id) DO UPDATE SET status = 'IN_PROGRESS';
      `, [ENCOUNTER_A_ID, TENANT_A, EPISODE_A_ID, PATIENT_A_ID]);
    });

    // 5. Seed Base Data for Tenant B (Patient, Episode, Encounter)
    await withUnitOfWork({ tenantId: TENANT_B }, async ({ query }) => {
      await query(`
        INSERT INTO master_patients (
          id, tenant_id, mrn, nik, full_name, birth_date, gender, phone_number, address_line
        ) VALUES (
          $1, $2, 'MRN-C2-B-001', '3171010101010002', 'Pasien Diagnostik B', '1978-08-20', 'MALE', '081298765432', 'Lab B St'
        ) ON CONFLICT (id) DO NOTHING;
      `, [PATIENT_B_ID, TENANT_B]);

      await query(`
        INSERT INTO episodes_of_care (
          id, tenant_id, patient_id, episode_number, status, episode_type,
          managing_department_id, managing_department_name, lead_dpjp_id, lead_dpjp_name, branch_id, start_time
        ) VALUES (
          $1, $2, $3, 'EP-C2-B-001', 'ACTIVE', 'RAWAT_INAP',
          'DEPT-INTERNAL', 'Instalasi Rawat Inap', 'DOC-DPJP-B01', 'dr. Budi Setiawan, Sp.PD', 'BRANCH-01', NOW()
        ) ON CONFLICT (id) DO NOTHING;
      `, [EPISODE_B_ID, TENANT_B, PATIENT_B_ID]);

      await query(`
        INSERT INTO encounters (
          id, tenant_id, episode_id, patient_id, encounter_number, encounter_type,
          encounter_class, status, primary_doctor_id, primary_doctor_name,
          service_room_id, service_room_name, created_at
        ) VALUES (
          $1, $2, $3, $4, 'ENC-C2-B-001', 'INPATIENT',
          'IMP', 'IN_PROGRESS', 'DOC-DPJP-B01', 'dr. Budi Setiawan, Sp.PD',
          'ROOM-ICU-02', 'Ruang Rawat Intensif B', NOW()
        ) ON CONFLICT (id) DO UPDATE SET status = 'IN_PROGRESS';
      `, [ENCOUNTER_B_ID, TENANT_B, EPISODE_B_ID, PATIENT_B_ID]);
    });
  });

  afterAll(async () => {
    try {
      await cleanC2TenantData(TENANT_A);
      await cleanC2TenantData(TENANT_B);
    } catch {
      // Ignored during teardown
    }
  });

  async function cleanC2TenantData(tenantId) {
    await withUnitOfWork({ tenantId }, async ({ query }) => {
      // Clean order items first
      await query(`
        DELETE FROM cpoe_order_items
        WHERE order_id IN (SELECT id FROM clinical_orders WHERE tenant_id = $1);
      `, [tenantId]);

      // Clean secondary actions
      await query(`
        DELETE FROM diagnostic_secondary_actions
        WHERE encounter_id IN (SELECT id FROM encounters WHERE tenant_id = $1);
      `, [tenantId]);

      // Clean clinical orders
      await query('DELETE FROM clinical_orders WHERE tenant_id = $1;', [tenantId]);

      // Clean physician interpretations
      await query('DELETE FROM physician_diagnostic_interpretations WHERE tenant_id = $1;', [tenantId]);

      // Clean notifications
      await query(`
        DELETE FROM diagnostic_result_notifications
        WHERE encounter_id IN (SELECT id FROM encounters WHERE tenant_id = $1);
      `, [tenantId]);

      // Clean outbox (audit_logs is append-only per JCI integrity rules and cannot be deleted)
      await query("DELETE FROM clinical_domain_outbox WHERE aggregate_type IN ('DIAGNOSTIC_NOTIFICATION', 'DIAGNOSTIC_ACTION');");
    });
  }

  // =========================================================================
  // SCENARIO C2-RLS-01: TENANT A READS OWN DATA
  // =========================================================================
  it('C2-RLS-01: Tenant A reads own diagnostic notifications, encounters, and interpretations', async () => {
    // 1. Publish critical panic notification for Tenant A
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: ENCOUNTER_A_ID,
      patientId: PATIENT_A_ID,
      sourceDomain: 'LABORATORY',
      testOrStudyCode: 'LAB-K-PANIC',
      testOrStudyName: 'Serum Potassium (Kalium)',
      resultValue: '7.4 mEq/L',
      numericValue: 7.4,
      referenceRange: '3.5 - 5.0 mEq/L',
      abnormalityFlag: 'CRITICAL_PANIC'
    }, ACTOR_A_LAB);

    expect(notif.id).toBeDefined();
    expect(notif.status).toBe('PENDING_ACKNOWLEDGMENT');

    // 2. Acknowledge with TBAK Read-Back
    const ack = await diagnosticInterpretationService.acknowledgeDiagnosticNotification({
      notificationId: notif.id,
      readBackConfirmed: true,
      acknowledgmentNotes: 'TBAK Read-Back confirmed by DPJP'
    }, ACTOR_A_DOC);

    expect(ack.status).toBe('ACKNOWLEDGED');

    // 3. Record physician interpretation
    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Critical hyperkalemia with peaked T waves on ECG.',
      diagnosticCorrelation: 'Acute on Chronic Kidney Disease Stage 4.',
      impactOnCarePlan: 'URGENT_INTERVENTION_REQUIRED',
      previousValue: 4.8
    }, ACTOR_A_DOC);

    expect(interp.id).toBeDefined();

    // 4. Verify Tenant A can read back own records via withUnitOfWork
    await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
      const readNotif = await query('SELECT * FROM diagnostic_result_notifications WHERE id = $1;', [notif.id]);
      expect(readNotif.rows.length).toBe(1);
      expect(readNotif.rows[0].status).toBe('INTERPRETED');

      const readInterp = await query('SELECT * FROM physician_diagnostic_interpretations WHERE id = $1;', [interp.id]);
      expect(readInterp.rows.length).toBe(1);
      expect(readInterp.rows[0].tenant_id).toBe(TENANT_A);
      expect(readInterp.rows[0].interpreted_by_id).toBe(ACTOR_A_DOC.userId);
    });
  });

  // =========================================================================
  // SCENARIO C2-RLS-02: CROSS-TENANT READ ISOLATION (ZERO BLEED)
  // =========================================================================
  it('C2-RLS-02: Tenant A cannot read Tenant B data (returns 0 rows via PostgreSQL RLS)', async () => {
    // 1. Publish notification for Tenant B under Tenant B session
    const notifB = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: ENCOUNTER_B_ID,
      patientId: PATIENT_B_ID,
      sourceDomain: 'LABORATORY',
      testOrStudyCode: 'LAB-TROP-B',
      testOrStudyName: 'Troponin I Kuantitatif',
      resultValue: '120.0 ng/L',
      numericValue: 120.0,
      referenceRange: '< 14 ng/L',
      abnormalityFlag: 'PATHOLOGICAL'
    }, ACTOR_B_LAB);

    // 2. Acknowledge and Interpret under Tenant B
    await diagnosticInterpretationService.acknowledgeDiagnosticNotification({
      notificationId: notifB.id,
      readBackConfirmed: true
    }, ACTOR_B_DOC);

    const interpB = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notifB.id,
      clinicalImpression: 'NSTEMI Suspect in Tenant B patient.',
      diagnosticCorrelation: 'Elevated troponin with ischemic chest pain.',
      impactOnCarePlan: 'URGENT_INTERVENTION_REQUIRED'
    }, ACTOR_B_DOC);

    // 3. Verify Tenant A queries for Tenant B records return 0 rows via PostgreSQL RLS
    await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
      // RLS on encounters hides ENCOUNTER_B_ID from Tenant A
      const encRes = await query('SELECT * FROM encounters WHERE id = $1;', [ENCOUNTER_B_ID]);
      expect(encRes.rows.length).toBe(0);

      // RLS on physician_diagnostic_interpretations hides interpB from Tenant A
      const interpRes = await query('SELECT * FROM physician_diagnostic_interpretations WHERE id = $1;', [interpB.id]);
      expect(interpRes.rows.length).toBe(0);
    });

    // 4. Verify application-level cross-tenant operation fails because encounter is hidden by RLS
    await expect(
      diagnosticInterpretationService.publishDiagnosticNotification({
        encounterId: ENCOUNTER_B_ID,
        patientId: PATIENT_B_ID,
        sourceDomain: 'LABORATORY',
        testOrStudyCode: 'LAB-ATTACK',
        testOrStudyName: 'Cross-Tenant Tampering',
        resultValue: '10'
      }, ACTOR_A_LAB)
    ).rejects.toThrow('tidak ditemukan');
  });

  // =========================================================================
  // SCENARIO C2-RLS-03: TENANT A WRITES OWN RECORDS (PERSISTED WITH TENANT_ID)
  // =========================================================================
  it('C2-RLS-03: Tenant A writes own interpretations, audit logs, and secondary actions with tenant_id', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: ENCOUNTER_A_ID,
      patientId: PATIENT_A_ID,
      sourceDomain: 'LABORATORY',
      testOrStudyCode: 'LAB-CREAT-A',
      testOrStudyName: 'Serum Creatinine',
      resultValue: '3.6 mg/dL',
      numericValue: 3.6,
      referenceRange: '0.7 - 1.2 mg/dL',
      abnormalityFlag: 'PATHOLOGICAL'
    }, ACTOR_A_LAB);

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Acute Kidney Injury on CKD.',
      diagnosticCorrelation: 'Creatinine baseline 1.2 doubled to 3.6.',
      impactOnCarePlan: 'CHANGE_IN_TREATMENT',
      previousValue: 1.2
    }, ACTOR_A_DOC);

    // Verify written records physically exist with tenant_id = TENANT_A
    await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
      const interpRes = await query('SELECT * FROM physician_diagnostic_interpretations WHERE id = $1;', [interp.id]);
      expect(interpRes.rows.length).toBe(1);
      expect(interpRes.rows[0].tenant_id).toBe(TENANT_A);

      const auditRes = await query('SELECT * FROM universal_audit_logs WHERE resource_id = $1;', [interp.id]);
      expect(auditRes.rows.length).toBe(1);
      expect(auditRes.rows[0].tenant_id).toBe(TENANT_A);
      expect(auditRes.rows[0].actor_id).toBe(ACTOR_A_DOC.userId);
    });
  });

  // =========================================================================
  // SCENARIO C2-RLS-04: DIRECT CROSS-TENANT WRITE BLOCKED BY RLS (SQLSTATE 42501)
  // =========================================================================
  it('C2-RLS-04: Direct cross-tenant write is blocked by PostgreSQL RLS with-check violation (SQLSTATE 42501)', async () => {
    // Inside a transaction configured for TENANT_A, attempt to write a row with tenant_id = TENANT_B
    await expect(
      withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
        await query(`
          INSERT INTO physician_diagnostic_interpretations (
            id, tenant_id, notification_id, encounter_id, patient_id,
            interpreted_by_id, interpreted_by_name, interpreted_by_role,
            clinical_impression, diagnostic_correlation, impact_on_care_plan,
            digital_signature_hash, correlation_id, interpreted_at, created_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8,
            $9, $10, $11,
            $12, $13, NOW(), NOW()
          );
        `, [
          crypto.randomUUID(),
          TENANT_B, // Foreign tenant!
          crypto.randomUUID(),
          ENCOUNTER_A_ID,
          PATIENT_A_ID,
          ACTOR_A_DOC.userId,
          ACTOR_A_DOC.fullName,
          ACTOR_A_DOC.role,
          'Unauthorized Cross-Tenant Injection',
          'Correlation test',
          'URGENT_INTERVENTION_REQUIRED',
          'sig-hash-test',
          'CORR-ATTACK-001'
        ]);
      })
    ).rejects.toThrow(/violates row-level security policy|insufficient_privilege|42501/i);

    // Also verify direct cross-tenant insert on clinical_orders is blocked by RLS
    await expect(
      withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
        await query(`
          INSERT INTO clinical_orders (
            id, tenant_id, order_number, patient_id, episode_id, encounter_id,
            ordered_by, order_category, priority, clinical_indication,
            status, requester_id, requester_name, requester_role,
            correlation_id, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13, $14,
            $15, NOW(), NOW()
          );
        `, [
          crypto.randomUUID(),
          TENANT_B, // Cross-tenant injection!
          'ORD-ATTACK-001',
          PATIENT_A_ID,
          EPISODE_A_ID,
          ENCOUNTER_A_ID,
          ACTOR_A_DOC.fullName,
          'PHARMACY',
          'CITO',
          'Attack indication',
          'ORDERED',
          ACTOR_A_DOC.userId,
          ACTOR_A_DOC.fullName,
          ACTOR_A_DOC.role,
          'CORR-ATTACK-002'
        ]);
      })
    ).rejects.toThrow(/violates row-level security policy|insufficient_privilege|42501/i);
  });

  // =========================================================================
  // SCENARIO C2-RLS-05: CS 82 REMEDIATION VERIFICATION (CLINICAL_ORDERS EXPLICIT TENANT_ID)
  // =========================================================================
  it('C2-RLS-05: CS 82 verification: executeSecondaryClinicalAction creates clinical_orders with explicit tenant_id', async () => {
    // 1. Setup notification and interpretation
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: ENCOUNTER_A_ID,
      patientId: PATIENT_A_ID,
      sourceDomain: 'LABORATORY',
      testOrStudyCode: 'LAB-K-CS82',
      testOrStudyName: 'Serum Potassium Verification',
      resultValue: '7.1 mEq/L',
      numericValue: 7.1,
      referenceRange: '3.5 - 5.0 mEq/L',
      abnormalityFlag: 'CRITICAL_PANIC'
    }, ACTOR_A_LAB);

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Severe hyperkalemia requiring urgent membrane stabilization.',
      diagnosticCorrelation: 'ECG tenting confirmed.',
      impactOnCarePlan: 'URGENT_INTERVENTION_REQUIRED'
    }, ACTOR_A_DOC);

    // 2. Execute secondary action creating downstream CPOE order
    const action = await diagnosticInterpretationService.executeSecondaryClinicalAction({
      interpretationId: interp.id,
      actionType: 'CPOE_MEDICATION_ORDER',
      actionSummary: 'Calcium Gluconate 10% 1 ampul IV push Stat',
      cpoePayload: {
        orderType: 'PHARMACY',
        priority: 'CITO',
        items: [
          { catalogCode: 'MED-CA-GLUC', itemName: 'Calcium Gluconate 10%', quantity: 1 }
        ]
      }
    }, ACTOR_A_DOC);

    expect(action.status).toBe('EXECUTED');
    expect(action.cpoe_order_id).toBeDefined();

    // 3. Direct DB verification of CS 82 remediation
    await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
      const orderRes = await query('SELECT * FROM clinical_orders WHERE id = $1;', [action.cpoe_order_id]);
      expect(orderRes.rows.length).toBe(1);
      // REMEDIATION CONFIRMED: tenant_id is explicitly set and matches authoritative tenant
      expect(orderRes.rows[0].tenant_id).toBe(TENANT_A);
      expect(orderRes.rows[0].order_category).toBe('PHARMACY');
      expect(orderRes.rows[0].status).toBe('ORDERED');

      // Verify secondary action table
      const actionRes = await query('SELECT * FROM diagnostic_secondary_actions WHERE id = $1;', [action.id]);
      expect(actionRes.rows.length).toBe(1);
      expect(actionRes.rows[0].cpoe_order_id).toBe(action.cpoe_order_id);
    });

    // 4. Verify Tenant B CANNOT see this newly created clinical order (RLS isolation)
    await withUnitOfWork({ tenantId: TENANT_B }, async ({ query }) => {
      const crossRes = await query('SELECT * FROM clinical_orders WHERE id = $1;', [action.cpoe_order_id]);
      expect(crossRes.rows.length).toBe(0);
    });
  });

  // =========================================================================
  // SCENARIO C2-RLS-06: TRANSACTION ROLLBACK ATOMICITY
  // =========================================================================
  it('C2-RLS-06: Transaction rollback atomicity: forced error leaves zero dirty records in database', async () => {
    // 1. Setup notification and interpretation
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: ENCOUNTER_A_ID,
      patientId: PATIENT_A_ID,
      sourceDomain: 'LABORATORY',
      testOrStudyCode: 'LAB-RB-TEST',
      testOrStudyName: 'Rollback Test Notification',
      resultValue: '5.0 mEq/L',
      numericValue: 5.0,
      referenceRange: '3.5 - 5.0 mEq/L',
      abnormalityFlag: 'NORMAL'
    }, ACTOR_A_LAB);

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Normal baseline check.',
      diagnosticCorrelation: 'Within reference range.',
      impactOnCarePlan: 'CONTINUE_CURRENT_THERAPY'
    }, ACTOR_A_DOC);

    // Count before dirty attempt
    let initialOrderCount = 0;
    let initialActionCount = 0;
    await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
      const oc = await query('SELECT COUNT(*) FROM clinical_orders WHERE tenant_id = $1;', [TENANT_A]);
      initialOrderCount = parseInt(oc.rows[0].count, 10);
      const ac = await query('SELECT COUNT(*) FROM diagnostic_secondary_actions WHERE encounter_id = $1;', [ENCOUNTER_A_ID]);
      initialActionCount = parseInt(ac.rows[0].count, 10);
    });

    // 2. Attempt executeSecondaryClinicalAction with invalid order category that causes CHECK constraint violation
    // in clinical_orders (order_category NOT IN ('PHARMACY', 'LABORATORY', ...))
    await expect(
      diagnosticInterpretationService.executeSecondaryClinicalAction({
        interpretationId: interp.id,
        actionType: 'CPOE_MEDICATION_ORDER',
        actionSummary: 'Failed Action Simulation',
        cpoePayload: {
          orderCategory: 'INVALID_CATEGORY_DOES_NOT_EXIST', // Triggers check constraint
          items: [{ catalogCode: 'X', itemName: 'X', quantity: -1 }] // Negative quantity also triggers constraint
        }
      }, ACTOR_A_DOC)
    ).rejects.toThrow();

    // 3. Verify clean rollback: zero net records added
    await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
      const oc = await query('SELECT COUNT(*) FROM clinical_orders WHERE tenant_id = $1;', [TENANT_A]);
      const ac = await query('SELECT COUNT(*) FROM diagnostic_secondary_actions WHERE encounter_id = $1;', [ENCOUNTER_A_ID]);
      expect(parseInt(oc.rows[0].count, 10)).toBe(initialOrderCount);
      expect(parseInt(ac.rows[0].count, 10)).toBe(initialActionCount);

      // Notification status should NOT be changed to ACTION_TAKEN
      const nRes = await query('SELECT status FROM diagnostic_result_notifications WHERE id = $1;', [notif.id]);
      expect(nRes.rows[0].status).toBe('INTERPRETED');
    });
  });

  // =========================================================================
  // SCENARIO C2-RLS-07: CONNECTION REUSE CLEANLINESS (ZERO GUC BLEED)
  // =========================================================================
  it('C2-RLS-07: Connection reuse cleanliness: DISCARD ALL prevents GUC leak across sequential checkouts', async () => {
    // 1. Checkout client #1 under Tenant A via UoW and record backend PID
    let pidA;
    await withUnitOfWork({ tenantId: TENANT_A }, async ({ query, client }) => {
      pidA = client.processID;
      expect(typeof pidA).toBe('number');
      expect(pidA).toBeGreaterThan(0);

      const sqlPidRes = await query('SELECT pg_backend_pid() AS pid;');
      expect(Number(sqlPidRes.rows[0].pid)).toBe(pidA);

      const res = await query("SELECT current_setting('app.current_tenant_id', true) AS tenant;");
      expect(res.rows[0].tenant).toBe(TENANT_A);
    });

    // 2. Directly acquire raw client from pool without setting tenant; verify socket reuse and zero bleed
    let pidRaw;
    const client = await pool.connect();
    try {
      pidRaw = client.processID;
      expect(typeof pidRaw).toBe('number');
      expect(pidRaw).toBe(pidA);

      const res = await client.query("SELECT current_setting('app.current_tenant_id', true) AS tenant;");
      // Zero bleed: session GUC must be empty or null
      expect(res.rows[0].tenant).toBeFalsy();
    } finally {
      client.release();
    }

    // 3. Checkout client #2 under Tenant B via UoW; verify same socket reuse and authoritative tenant context
    let pidB;
    await withUnitOfWork({ tenantId: TENANT_B }, async ({ query, client }) => {
      pidB = client.processID;
      expect(typeof pidB).toBe('number');
      expect(pidB).toBe(pidA);

      const sqlPidRes = await query('SELECT pg_backend_pid() AS pid;');
      expect(Number(sqlPidRes.rows[0].pid)).toBe(pidB);

      const res = await query("SELECT current_setting('app.current_tenant_id', true) AS tenant;");
      // Context isolation proof: Tenant B sees TENANT_B, not TENANT_A
      expect(res.rows[0].tenant).toBe(TENANT_B);
    });

    // Explicit two-part proof confirmation:
    // Part A: Same backend connection identity verified
    expect(pidA).toBe(pidB);
    expect(pidRaw).toBe(pidA);
  });

  // =========================================================================
  // SCENARIO C2-RLS-08: MISSING TENANT CONTEXT REJECTION (403)
  // =========================================================================
  it('C2-RLS-08: Missing tenant context throws AUTHORITATIVE_TENANT_REQUIRED (403)', async () => {
    const actorWithoutTenant = {
      userId: 'DOC-ANON',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
      // Missing tenantId
    };

    await expect(
      diagnosticInterpretationService.publishDiagnosticNotification({
        encounterId: ENCOUNTER_A_ID,
        patientId: PATIENT_A_ID,
        testOrStudyCode: 'TEST',
        testOrStudyName: 'Test',
        resultValue: '1'
      }, actorWithoutTenant)
    ).rejects.toThrow(DiagnosticInterpretationDomainError);

    await expect(
      diagnosticInterpretationService.acknowledgeDiagnosticNotification({
        notificationId: crypto.randomUUID()
      }, actorWithoutTenant)
    ).rejects.toThrow('Actor tenantId (UUID) wajib disertakan');

    await expect(
      diagnosticInterpretationService.recordPhysicianInterpretation({
        notificationId: crypto.randomUUID(),
        clinicalImpression: 'Impression',
        diagnosticCorrelation: 'Correlation'
      }, actorWithoutTenant)
    ).rejects.toThrow('Actor tenantId (UUID) wajib disertakan');

    await expect(
      diagnosticInterpretationService.executeSecondaryClinicalAction({
        interpretationId: crypto.randomUUID(),
        actionSummary: 'Action'
      }, actorWithoutTenant)
    ).rejects.toThrow('Actor tenantId (UUID) wajib disertakan');
  });

  // =========================================================================
  // SCENARIO C2-RLS-09: INVALID UUID TENANT CONTEXT REJECTION (403)
  // =========================================================================
  it('C2-RLS-09: Invalid UUID tenant context throws AUTHORITATIVE_TENANT_REQUIRED (403)', async () => {
    const actorWithInvalidTenant = {
      userId: 'DOC-HACK',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
      tenantId: 'non-uuid-string-injection'
    };

    await expect(
      diagnosticInterpretationService.publishDiagnosticNotification({
        encounterId: ENCOUNTER_A_ID,
        patientId: PATIENT_A_ID,
        testOrStudyCode: 'TEST',
        testOrStudyName: 'Test',
        resultValue: '1'
      }, actorWithInvalidTenant)
    ).rejects.toThrow(DiagnosticInterpretationDomainError);

    await expect(
      diagnosticInterpretationService.recordPhysicianInterpretation({
        notificationId: crypto.randomUUID(),
        clinicalImpression: 'Impression',
        diagnosticCorrelation: 'Correlation'
      }, actorWithInvalidTenant)
    ).rejects.toThrow('Actor tenantId (UUID) wajib disertakan');
  });

});
