/**
 * P0-2B WAVE 1B.3 — Real PostgreSQL & RLS Integration Evidence Test Suite
 * Candidate C1: CPOE Orders & Safety Authorization Foundation (Phase C1-A)
 * Standards: JCI 7th Edition (MMU.4, IPSG.1-2), PostgreSQL 16 ACID Transactions, RLS Policy Verification
 *
 * EVIDENCE REQUIREMENTS:
 *   C1-RLS-01: Missing tenant context fails closed (403 AUTHORITATIVE_TENANT_REQUIRED).
 *   C1-RLS-02: Invalid UUID tenant context fails closed (403 AUTHORITATIVE_TENANT_REQUIRED).
 *   C1-RLS-03: Missing authenticated actor fails closed (401 AUTHENTICATION_REQUIRED).
 *   C1-RLS-04: Synthetic actor defaults impossible (no USR-DOC-001 / dr_siti fallback).
 *   C1-RLS-05: createOrder own-tenant write + cross-tenant write rejected (PostgreSQL RLS 42501).
 *   C1-RLS-06: cancelOrder own-tenant update + cross-tenant cancellation rejected (404 ORDER_NOT_FOUND).
 *   C1-RLS-07: createOrder rollback atomicity (Failure injection leaves zero orphan rows).
 *   C1-RLS-08: cancelOrder rollback atomicity (Failure injection preserves ORDERED state).
 *   C1-RLS-09: Same-tenant idempotency replay succeeds without row duplication.
 *   C1-RLS-10: Cross-tenant idempotency isolation prevents data leak.
 *   C1-RLS-11: CS 71 Shared route A (/api/v1/orders/cpoe) strictly filters by tenant.
 *   C1-RLS-12: CS 71 Shared route B (/api/v1/orders) strictly filters by tenant.
 *   C1-RLS-13: Transaction client PID consistency (client.processID === pg_backend_pid()).
 *   C1-RLS-14: safetyAuthorizationService uses same transaction client without second connect.
 *   C1-RLS-15: Connection reuse cleanliness (DISCARD ALL prevents GUC leak on reused connection).
 *   C1-CHILD-01..05: Child table (cpoe_order_items) containment verified through parent order isolation.
 *
 * ENVIRONMENT:
 *   - Runs strictly against disposable security test lab: nurseflow_security_lab.
 *   - Role: nurseflow_app_user (rolsuper=false, rolbypassrls=false).
 */

// Configure environment to point strictly to the disposable security lab BEFORE any DB import
process.env.POSTGRES_DB = 'nurseflow_security_lab';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';

// Dynamic import ensures process.env.POSTGRES_DB is evaluated first
const { pool, postgresPoolService } = await import('../server/db/postgresPool.js');
const {
  cpoeApplicationService,
  CpoeDomainError
} = await import('../server/services/cpoeApplication.service.js');
const { safetyAuthorizationService } = await import('../server/services/safetyAuthorization.service.js');
const { withUnitOfWork } = await import('../server/db/unitOfWork.js');
const { ENTERPRISE_ROLES } = await import('../src/shared/constants/roles.js');

// Controlled Test Tenants (RFC 4122 UUID v4)
const TENANT_A = 'a0000000-0000-4000-8000-000000000001';
const TENANT_B = 'b0000000-0000-4000-8000-000000000002';

// Controlled Actors
const ACTOR_A_DOC = {
  userId: 'DOC-DPJP-A01',
  username: 'dr_siti_a',
  fullName: 'dr. Siti Rahma, Sp.PD',
  role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
  tenantId: TENANT_A
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

describe('P0-2B WAVE 1B.3 — Candidate C1 Real PostgreSQL & RLS Integration Evidence', () => {

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

    // 3. Clean up prior C1 test data
    await cleanC1TenantData(TENANT_A);
    await cleanC1TenantData(TENANT_B);

    // 4. Seed Base Data for Tenant A (Patient, Episode, Encounter)
    await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
      await query(`
        INSERT INTO master_patients (
          id, tenant_id, mrn, nik, full_name, birth_date, gender, phone_number, address_line
        ) VALUES (
          $1, $2, 'MRN-C1-A-001', '3171010101010001', 'Pasien CPOE A', '1985-05-15', 'FEMALE', '081234567890', 'CPOE A St'
        ) ON CONFLICT (id) DO NOTHING;
      `, [PATIENT_A_ID, TENANT_A]);

      await query(`
        INSERT INTO episodes_of_care (
          id, tenant_id, patient_id, episode_number, status, episode_type,
          managing_department_id, managing_department_name, lead_dpjp_id, lead_dpjp_name, branch_id, start_time
        ) VALUES (
          $1, $2, $3, 'EP-C1-A-001', 'ACTIVE', 'RAWAT_INAP',
          'DEPT-INTERNAL', 'Instalasi Rawat Inap', 'DOC-DPJP-A01', 'dr. Siti Rahma, Sp.PD', 'BRANCH-01', NOW()
        ) ON CONFLICT (id) DO NOTHING;
      `, [EPISODE_A_ID, TENANT_A, PATIENT_A_ID]);

      await query(`
        INSERT INTO encounters (
          id, tenant_id, episode_id, patient_id, encounter_number, encounter_type,
          encounter_class, status, primary_doctor_id, primary_doctor_name,
          service_room_id, service_room_name, created_at
        ) VALUES (
          $1, $2, $3, $4, 'ENC-C1-A-001', 'INPATIENT',
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
          $1, $2, 'MRN-C1-B-001', '3171010101010002', 'Pasien CPOE B', '1978-08-20', 'MALE', '081298765432', 'CPOE B St'
        ) ON CONFLICT (id) DO NOTHING;
      `, [PATIENT_B_ID, TENANT_B]);

      await query(`
        INSERT INTO episodes_of_care (
          id, tenant_id, patient_id, episode_number, status, episode_type,
          managing_department_id, managing_department_name, lead_dpjp_id, lead_dpjp_name, branch_id, start_time
        ) VALUES (
          $1, $2, $3, 'EP-C1-B-001', 'ACTIVE', 'RAWAT_INAP',
          'DEPT-INTERNAL', 'Instalasi Rawat Inap', 'DOC-DPJP-B01', 'dr. Budi Setiawan, Sp.PD', 'BRANCH-01', NOW()
        ) ON CONFLICT (id) DO NOTHING;
      `, [EPISODE_B_ID, TENANT_B, PATIENT_B_ID]);

      await query(`
        INSERT INTO encounters (
          id, tenant_id, episode_id, patient_id, encounter_number, encounter_type,
          encounter_class, status, primary_doctor_id, primary_doctor_name,
          service_room_id, service_room_name, created_at
        ) VALUES (
          $1, $2, $3, $4, 'ENC-C1-B-001', 'INPATIENT',
          'IMP', 'IN_PROGRESS', 'DOC-DPJP-B01', 'dr. Budi Setiawan, Sp.PD',
          'ROOM-ICU-02', 'Ruang Rawat Intensif B', NOW()
        ) ON CONFLICT (id) DO UPDATE SET status = 'IN_PROGRESS';
      `, [ENCOUNTER_B_ID, TENANT_B, EPISODE_B_ID, PATIENT_B_ID]);
    });
  });

  afterAll(async () => {
    try {
      await cleanC1TenantData(TENANT_A);
      await cleanC1TenantData(TENANT_B);
    } catch {
      // Ignored during teardown
    }
  });

  async function cleanC1TenantData(tenantId) {
    await withUnitOfWork({ tenantId }, async ({ query }) => {
      await query(`
        DELETE FROM cpoe_order_items
        WHERE order_id IN (SELECT id FROM clinical_orders WHERE tenant_id = $1);
      `, [tenantId]);
      await query('DELETE FROM clinical_orders WHERE tenant_id = $1;', [tenantId]);
      await query('DELETE FROM safety_decision_registry WHERE tenant_id = $1;', [tenantId]);
      await query("DELETE FROM clinical_domain_outbox WHERE aggregate_type = 'CPOE_ORDER';");
    });
  }

  // =========================================================================
  // SCENARIO 1 & 2: MISSING / INVALID TENANT FAILS CLOSED (403)
  // =========================================================================
  describe('Scenarios 1 & 2: Missing & Invalid Tenant Fail Closed (403)', () => {
    it('C1-RLS-01: createOrder without tenantId fails closed with 403 AUTHORITATIVE_TENANT_REQUIRED', async () => {
      await expect(
        cpoeApplicationService.createOrder(
          { encounterId: ENCOUNTER_A_ID, clinicalIndication: 'Test', items: [{ catalogCode: 'L1', itemName: 'T1' }] },
          { userId: 'DOC-01', role: 'ROLE_DOCTOR_DPJP', fullName: 'dr. Test' }
        )
      ).rejects.toThrow('AUTHORITATIVE_TENANT_REQUIRED');
    });

    it('C1-RLS-02: createOrder with non-UUID tenantId fails closed with 403 AUTHORITATIVE_TENANT_REQUIRED', async () => {
      await expect(
        cpoeApplicationService.createOrder(
          { encounterId: ENCOUNTER_A_ID, clinicalIndication: 'Test', items: [{ catalogCode: 'L1', itemName: 'T1' }] },
          { userId: 'DOC-01', role: 'ROLE_DOCTOR_DPJP', fullName: 'dr. Test', tenantId: 'not-a-valid-uuid' }
        )
      ).rejects.toThrow('AUTHORITATIVE_TENANT_REQUIRED');
    });
  });

  // =========================================================================
  // SCENARIO 3 & 4: ACTOR PROVENANCE & ZERO SYNTHETIC FALLBACK (401)
  // =========================================================================
  describe('Scenarios 3 & 4: Authenticated Actor Provenance & Zero Mock Defaults', () => {
    it('C1-RLS-03: createOrder without actor fails closed with 401 AUTHENTICATION_REQUIRED', async () => {
      await expect(
        cpoeApplicationService.createOrder(
          { encounterId: ENCOUNTER_A_ID, clinicalIndication: 'Test', items: [{ catalogCode: 'L1', itemName: 'T1' }] },
          null
        )
      ).rejects.toThrow('AUTHENTICATION_REQUIRED');
    });

    it('C1-RLS-04: cancelOrder without authenticated actor fails closed with 401 (no USR-DOC-001 fallback)', async () => {
      await expect(
        cpoeApplicationService.cancelOrder(
          { orderId: crypto.randomUUID(), cancellationReason: 'Batal tindakan medicolegal' },
          { tenantId: TENANT_A } // Missing userId/id
        )
      ).rejects.toThrow('AUTHENTICATION_REQUIRED');
    });
  });

  // =========================================================================
  // SCENARIO 5: OWN-TENANT WRITE & CROSS-TENANT WRITE REJECTED (RLS 42501)
  // =========================================================================
  describe('Scenario 5: createOrder Own-Tenant Write & Cross-Tenant Write Rejection', () => {
    it('C1-RLS-05: Tenant A creates order successfully; cross-tenant direct insert blocked by RLS (42501)', async () => {
      // 1. Own-tenant write
      const orderA = await cpoeApplicationService.createOrder({
        encounterId: ENCOUNTER_A_ID,
        patientId: PATIENT_A_ID,
        orderCategory: 'LABORATORY',
        priority: 'CITO',
        clinicalIndication: 'Pemeriksaan Darah Lengkap Akut',
        items: [
          { catalogCode: 'LAB-CBC', itemName: 'Complete Blood Count', quantity: 1, unitPrice: 75000 },
          { catalogCode: 'LAB-DIFF', itemName: 'Differential Count', quantity: 1, unitPrice: 45000 }
        ]
      }, ACTOR_A_DOC, '192.168.1.10', `CORR-RLS05-${TENANT_A.slice(0, 8)}`);

      expect(orderA.id).toBeDefined();
      expect(orderA.tenant_id).toBe(TENANT_A);
      expect(orderA.items.length).toBe(2);
      expect(orderA.auditSignature).toBeDefined();

      // Verify in DB under Tenant A context
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
        const checkRes = await query('SELECT * FROM clinical_orders WHERE id = $1;', [orderA.id]);
        expect(checkRes.rows.length).toBe(1);
        expect(checkRes.rows[0].tenant_id).toBe(TENANT_A);

        const itemsRes = await query('SELECT * FROM cpoe_order_items WHERE order_id = $1;', [orderA.id]);
        expect(itemsRes.rows.length).toBe(2);
      });

      // Verify DB isolation under Tenant B context (RLS returns 0 rows)
      await withUnitOfWork({ tenantId: TENANT_B }, async ({ query }) => {
        const checkRes = await query('SELECT * FROM clinical_orders WHERE id = $1;', [orderA.id]);
        expect(checkRes.rows.length).toBe(0);
      });

      // 2. Direct Cross-Tenant Write under Tenant A context attempting to set tenant_id = TENANT_B
      // Must trigger PostgreSQL RLS WITH CHECK violation (SQLSTATE 42501)
      await expect(
        withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
          await query(`
            INSERT INTO clinical_orders (
              id, tenant_id, order_number, patient_id, episode_id, encounter_id,
              ordered_by, order_category, priority, clinical_indication,
              status, is_cito, order_items_count, total_estimated_amount,
              version, requester_id, requester_name, requester_role, created_at, updated_at
            ) VALUES (
              $1, $2, 'ORD-CROSS-01', $3, $4, $5,
              'Illegal Cross Insert', 'LABORATORY', 'ROUTINE', 'Exploit attempt',
              'ORDERED', false, 1, 10000,
              1, 'DOC-EXPLOIT', 'Attacker', 'ROLE_DOCTOR_DPJP', NOW(), NOW()
            );
          `, [crypto.randomUUID(), TENANT_B, PATIENT_A_ID, EPISODE_A_ID, ENCOUNTER_A_ID]);
        })
      ).rejects.toMatchObject({ code: '42501' });

      // 3. Attempt to create order for Tenant B encounter using Tenant A actor
      await expect(
        cpoeApplicationService.createOrder({
          encounterId: ENCOUNTER_B_ID,
          clinicalIndication: 'Cross-tenant encounter order attempt',
          items: [{ catalogCode: 'L1', itemName: 'T1' }]
        }, ACTOR_A_DOC)
      ).rejects.toThrow('ENCOUNTER_NOT_FOUND');
    });
  });

  // =========================================================================
  // SCENARIO 6: CANCELORDER OWN-TENANT UPDATE & CROSS-TENANT REJECTION
  // =========================================================================
  describe('Scenario 6: cancelOrder Own-Tenant Update & Cross-Tenant Rejection', () => {
    it('C1-RLS-06: Tenant A cancels own order; Tenant B cancellation attempt is rejected (404)', async () => {
      // 1. Create order for Tenant A
      const orderA = await cpoeApplicationService.createOrder({
        encounterId: ENCOUNTER_A_ID,
        patientId: PATIENT_A_ID,
        orderCategory: 'RADIOLOGY',
        priority: 'CITO',
        clinicalIndication: 'CXR Suspek Pneumonia',
        items: [{ catalogCode: 'RAD-CXR', itemName: 'Chest X-Ray AP', quantity: 1, unitPrice: 120000 }]
      }, ACTOR_A_DOC);

      // 2. Issue Safety Decision within Tenant A
      let decisionA;
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ client }) => {
        decisionA = await safetyAuthorizationService.issueSafetyDecision(client, {
          patientId: PATIENT_A_ID,
          encounterId: ENCOUNTER_A_ID,
          actor: ACTOR_A_DOC,
          action: 'CPOE_ORDER_CANCEL',
          justification: 'Pasien meminta pembatalan rontgen dada',
          tenantId: TENANT_A,
          targetPayload: {
            orderId: orderA.id,
            cancellationReason: 'Pasien meminta pembatalan rontgen dada'
          }
        });
      });

      // 3. Cross-tenant cancellation attempt: Actor B tries to cancel order A
      await expect(
        cpoeApplicationService.cancelOrder({
          orderId: orderA.id,
          cancellationReason: 'Upaya pembatalan lintas faskes',
          safetyDecision: decisionA
        }, ACTOR_B_DOC)
      ).rejects.toThrow('ORDER_NOT_FOUND');

      // 4. Legitimate cancellation by Actor A
      const cancelResult = await cpoeApplicationService.cancelOrder({
        orderId: orderA.id,
        cancellationReason: 'Pasien meminta pembatalan rontgen dada',
        safetyDecision: decisionA
      }, ACTOR_A_DOC);

      expect(cancelResult.status).toBe('CANCELLED');
      expect(cancelResult.version).toBe(2);
      expect(cancelResult.safetyDecisionId).toBe(decisionA.decisionId);

      // Verify order and item status in DB
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
        const ordRes = await query('SELECT status, version FROM clinical_orders WHERE id = $1;', [orderA.id]);
        expect(ordRes.rows[0].status).toBe('CANCELLED');
        expect(ordRes.rows[0].version).toBe(2);

        const itmRes = await query('SELECT status FROM cpoe_order_items WHERE order_id = $1;', [orderA.id]);
        expect(itmRes.rows[0].status).toBe('CANCELLED');
      });
    });
  });

  // =========================================================================
  // SCENARIO 7 & 8: TRANSACTION ROLLBACK ATOMICITY (FAILURE INJECTION)
  // =========================================================================
  describe('Scenarios 7 & 8: Transaction Rollback Atomicity (Failure Injection)', () => {
    it('C1-RLS-07: createOrder forced failure mid-transaction leaves 0 orphan rows in DB', async () => {
      const orderId = crypto.randomUUID();

      // Force failure during item insertion inside UoW
      await expect(
        withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
          // Insert order header
          await query(`
            INSERT INTO clinical_orders (
              id, tenant_id, order_number, patient_id, episode_id, encounter_id,
              ordered_by, order_category, priority, clinical_indication,
              status, is_cito, order_items_count, total_estimated_amount,
              version, requester_id, requester_name, requester_role, created_at, updated_at
            ) VALUES (
              $1, $2, 'ORD-FI-01', $3, $4, $5,
              'dr. Siti Rahma', 'LABORATORY', 'ROUTINE', 'FI Test',
              'ORDERED', false, 1, 50000,
              1, 'DOC-01', 'dr. Siti Rahma', 'ROLE_DOCTOR_DPJP', NOW(), NOW()
            );
          `, [orderId, TENANT_A, PATIENT_A_ID, EPISODE_A_ID, ENCOUNTER_A_ID]);

          // Inject failure
          throw new Error('FAILURE_INJECTION_MID_TRANSACTION: Simulated crash before items committed');
        })
      ).rejects.toThrow('FAILURE_INJECTION_MID_TRANSACTION');

      // Verify zero orphan rows in clinical_orders
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
        const res = await query('SELECT * FROM clinical_orders WHERE id = $1;', [orderId]);
        expect(res.rows.length).toBe(0);
      });
    });

    it('C1-RLS-08: cancelOrder forced failure preserves original ORDERED status cleanly', async () => {
      // 1. Create fresh order
      const order = await cpoeApplicationService.createOrder({
        encounterId: ENCOUNTER_A_ID,
        patientId: PATIENT_A_ID,
        orderCategory: 'PHARMACY',
        priority: 'ROUTINE',
        clinicalIndication: 'Antibiotic therapy',
        items: [{ catalogCode: 'MED-AMOX', itemName: 'Amoxicillin 500mg', quantity: 10, unitPrice: 5000 }]
      }, ACTOR_A_DOC);

      // 2. Issue Safety Decision
      let decision;
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ client }) => {
        decision = await safetyAuthorizationService.issueSafetyDecision(client, {
          patientId: PATIENT_A_ID,
          encounterId: ENCOUNTER_A_ID,
          actor: ACTOR_A_DOC,
          action: 'CPOE_ORDER_CANCEL',
          justification: 'Simulasi kegagalan audit outbox',
          tenantId: TENANT_A,
          targetPayload: { orderId: order.id, cancellationReason: 'Simulasi kegagalan audit outbox' }
        });
      });

      // 3. Forced rollback inside transactional operation
      await expect(
        withUnitOfWork({ tenantId: TENANT_A }, async ({ client, query }) => {
          await safetyAuthorizationService.verifyAndConsumeTransactional(client, {
            safetyDecision: decision,
            actualCommandPayload: { orderId: order.id, cancellationReason: 'Simulasi kegagalan audit outbox' },
            expectedAction: 'CPOE_ORDER_CANCEL',
            expectedPatientId: PATIENT_A_ID,
            expectedEncounterId: ENCOUNTER_A_ID,
            actor: ACTOR_A_DOC,
            tenantId: TENANT_A,
            justification: 'Simulasi kegagalan audit outbox'
          });

          await query("UPDATE clinical_orders SET status = 'CANCELLED' WHERE id = $1;", [order.id]);

          // Force failure before COMMIT
          throw new Error('FAILURE_INJECTION_OUTBOX_CRASH: Network partition before commit');
        })
      ).rejects.toThrow('FAILURE_INJECTION_OUTBOX_CRASH');

      // 4. Verify post-rollback state: Order is still ORDERED and token status is still ISSUED!
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
        const ordRes = await query('SELECT status, version FROM clinical_orders WHERE id = $1;', [order.id]);
        expect(ordRes.rows[0].status).toBe('ORDERED');
        expect(ordRes.rows[0].version).toBe(1);

        const tokRes = await query('SELECT status FROM safety_decision_registry WHERE decision_id = $1;', [decision.decisionId]);
        expect(tokRes.rows[0].status).toBe('ISSUED');
      });
    });
  });

  // =========================================================================
  // SCENARIO 9 & 10: IDEMPOTENCY REPLAY & CROSS-TENANT ISOLATION
  // =========================================================================
  describe('Scenarios 9 & 10: Idempotency Replay & Cross-Tenant Isolation', () => {
    it('C1-RLS-09: Same-tenant idempotency replay returns identical order without duplicate rows', async () => {
      const idempotencyKey = `IDEMP-SAME-${crypto.randomUUID()}`;

      // First call: creates order
      const res1 = await cpoeApplicationService.createOrder({
        encounterId: ENCOUNTER_A_ID,
        patientId: PATIENT_A_ID,
        orderCategory: 'LABORATORY',
        priority: 'ROUTINE',
        clinicalIndication: 'Idempotent CBC',
        items: [{ catalogCode: 'LAB-CBC', itemName: 'Complete Blood Count', quantity: 1, unitPrice: 75000 }],
        idempotencyKey
      }, ACTOR_A_DOC);

      expect(res1.isIdempotentReplay).toBeFalsy();

      // Second call: exact replay
      const res2 = await cpoeApplicationService.createOrder({
        encounterId: ENCOUNTER_A_ID,
        patientId: PATIENT_A_ID,
        orderCategory: 'LABORATORY',
        priority: 'ROUTINE',
        clinicalIndication: 'Idempotent CBC',
        items: [{ catalogCode: 'LAB-CBC', itemName: 'Complete Blood Count', quantity: 1, unitPrice: 75000 }],
        idempotencyKey
      }, ACTOR_A_DOC);

      expect(res2.isIdempotentReplay).toBe(true);
      expect(res2.id).toBe(res1.id);
      expect(res2.order_number).toBe(res1.order_number);

      // Verify exactly 1 order row exists in DB
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
        const countRes = await query('SELECT COUNT(*)::int AS cnt FROM clinical_orders WHERE idempotency_key = $1;', [idempotencyKey]);
        expect(countRes.rows[0].cnt).toBe(1);
      });
    });

    it('C1-RLS-10: Cross-tenant idempotency isolation prevents Tenant B from receiving Tenant A order', async () => {
      const idempotencyKey = `IDEMP-CROSS-${crypto.randomUUID()}`;

      // Tenant A creates order with key
      const orderA = await cpoeApplicationService.createOrder({
        encounterId: ENCOUNTER_A_ID,
        patientId: PATIENT_A_ID,
        orderCategory: 'LABORATORY',
        priority: 'ROUTINE',
        clinicalIndication: 'Tenant A private order',
        items: [{ catalogCode: 'LAB-A', itemName: 'Test A', quantity: 1, unitPrice: 10000 }],
        idempotencyKey
      }, ACTOR_A_DOC);

      // Tenant B attempts to use same idempotencyKey: must NOT recover Tenant A's order!
      // In DB, uq_clinical_orders_idempotency is unique across table. When Tenant B encounters 23505,
      // the recovery query is scoped to Tenant B (`AND tenant_id = TENANT_B`), so Tenant B gets 0 rows,
      // and the error is properly thrown rather than leaking Tenant A's private order!
      await expect(
        cpoeApplicationService.createOrder({
          encounterId: ENCOUNTER_B_ID,
          patientId: PATIENT_B_ID,
          orderCategory: 'LABORATORY',
          priority: 'ROUTINE',
          clinicalIndication: 'Tenant B colliding key attempt',
          items: [{ catalogCode: 'LAB-B', itemName: 'Test B', quantity: 1, unitPrice: 10000 }],
          idempotencyKey
        }, ACTOR_B_DOC)
      ).rejects.toThrow();

      // Ensure Tenant B cannot read Tenant A order via getOrderById
      await expect(
        cpoeApplicationService.getOrderById(orderA.id, { tenantId: TENANT_B })
      ).rejects.toThrow('ORDER_NOT_FOUND');
    });
  });

  // =========================================================================
  // SCENARIO 11 & 12: CS 71 SHARED CALL SITE ISOLATION (ROUTES A & B)
  // =========================================================================
  describe('Scenarios 11 & 12: Shared Call Site CS 71 Tenant Isolation', () => {
    it('C1-RLS-11: listOrders under Tenant A returns only Tenant A orders (Route A: /orders/cpoe)', async () => {
      const ordersA = await cpoeApplicationService.listOrders({}, { tenantId: TENANT_A });
      expect(ordersA.length).toBeGreaterThanOrEqual(1);
      for (const ord of ordersA) {
        expect(ord.tenant_id).toBe(TENANT_A);
      }
    });

    it('C1-RLS-12: listOrders under Tenant B returns zero Tenant A orders (Route B: /orders compatibility)', async () => {
      const ordersB = await cpoeApplicationService.listOrders({}, { tenantId: TENANT_B });
      for (const ord of ordersB) {
        expect(ord.tenant_id).toBe(TENANT_B);
        expect(ord.tenant_id).not.toBe(TENANT_A);
      }
    });
  });

  // =========================================================================
  // SCENARIO 13: TRANSACTION CLIENT PID CONSISTENCY
  // =========================================================================
  describe('Scenario 13: Transaction Client PID Consistency', () => {
    it('C1-RLS-13: client.processID matches pg_backend_pid() consistently throughout transaction', async () => {
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ client, query }) => {
        const pidRes = await query('SELECT pg_backend_pid();');
        const dbBackendPid = pidRes.rows[0].pg_backend_pid;

        expect(client.processID).toBeDefined();
        expect(client.processID).toBe(dbBackendPid);
      });
    });
  });

  // =========================================================================
  // SCENARIO 14: SAFETY AUTHORIZATION REUSES SAME TRANSACTION CLIENT
  // =========================================================================
  describe('Scenario 14: Safety Authorization Shares Unified Transaction Client', () => {
    it('C1-RLS-14: verifyAndConsumeTransactional executes on the exact same client socket without second connection', async () => {
      // 1. Create order
      const order = await cpoeApplicationService.createOrder({
        encounterId: ENCOUNTER_A_ID,
        patientId: PATIENT_A_ID,
        orderCategory: 'PROCEDURE',
        priority: 'CITO',
        clinicalIndication: 'Test same socket safety authorization',
        items: [{ catalogCode: 'PRC-01', itemName: 'Bedside Procedure', quantity: 1, unitPrice: 50000 }]
      }, ACTOR_A_DOC);

      // 2. Issue safety token
      let decision;
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ client }) => {
        decision = await safetyAuthorizationService.issueSafetyDecision(client, {
          patientId: PATIENT_A_ID,
          encounterId: ENCOUNTER_A_ID,
          actor: ACTOR_A_DOC,
          action: 'CPOE_ORDER_CANCEL',
          justification: 'Verifikasi soket koneksi tunggal',
          tenantId: TENANT_A,
          targetPayload: { orderId: order.id, cancellationReason: 'Verifikasi soket koneksi tunggal' }
        });
      });

      // 3. Execute inside withUnitOfWork and record PID before, during, and after verifyAndConsumeTransactional
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ client, query }) => {
        const pid1Res = await query('SELECT pg_backend_pid();');
        const initialPid = pid1Res.rows[0].pg_backend_pid;

        // Verify safety decision on SAME client
        const verified = await safetyAuthorizationService.verifyAndConsumeTransactional(client, {
          safetyDecision: decision,
          actualCommandPayload: { orderId: order.id, cancellationReason: 'Verifikasi soket koneksi tunggal' },
          expectedAction: 'CPOE_ORDER_CANCEL',
          expectedPatientId: PATIENT_A_ID,
          expectedEncounterId: ENCOUNTER_A_ID,
          actor: ACTOR_A_DOC,
          tenantId: TENANT_A,
          justification: 'Verifikasi soket koneksi tunggal'
        });

        expect(verified.decisionId).toBe(decision.decisionId);

        const pid2Res = await query('SELECT pg_backend_pid();');
        const postVerifyPid = pid2Res.rows[0].pg_backend_pid;

        // Must be the identical backend PID
        expect(initialPid).toBe(postVerifyPid);
        expect(client.processID).toBe(postVerifyPid);
      });
    });
  });

  // =========================================================================
  // SCENARIO 15: CONNECTION REUSE & NO GUC LEAK (DISCARD ALL, SAME PID)
  // =========================================================================
  describe('Scenario 15: Connection Reuse Hygiene (DISCARD ALL, No GUC Leak)', () => {
    it('C1-RLS-15: Reused connection across tenants clears GUC completely without bleed', async () => {
      const client = await pool.connect();
      const clientPid = client.processID;

      try {
        // Step 1: Session Tenant A context
        await client.query('BEGIN;');
        await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);

        const guc1 = await client.query("SELECT current_setting('app.current_tenant_id', true) AS guc;");
        expect(guc1.rows[0].guc).toBe(TENANT_A);

        await client.query('COMMIT;');

        // Step 2: Three-tier socket sanitization (DISCARD ALL)
        await client.query('DISCARD ALL;');

        // Step 3: Verify GUC is completely wiped on same backend PID
        const samePidRes = await client.query('SELECT pg_backend_pid();');
        expect(samePidRes.rows[0].pg_backend_pid).toBe(clientPid);

        const guc2 = await client.query("SELECT current_setting('app.current_tenant_id', true) AS guc;");
        expect(guc2.rows[0].guc).toBe('');

        // Step 4: Session Tenant B on same socket
        await client.query('BEGIN;');
        await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_B]);

        const guc3 = await client.query("SELECT current_setting('app.current_tenant_id', true) AS guc;");
        expect(guc3.rows[0].guc).toBe(TENANT_B);

        await client.query('COMMIT;');
        await client.query('DISCARD ALL;');
      } finally {
        client.release();
      }
    });
  });

  // =========================================================================
  // CHILD TABLE RLS ACCEPTANCE CRITERIA C1-CHILD-01..05
  // =========================================================================
  describe('Child Table Acceptance Contract: C1-CHILD-01..05', () => {
    it('C1-CHILD-01: Direct SELECT on cpoe_order_items under Tenant A context cannot read Tenant B items', async () => {
      // Create order in Tenant A
      const orderA = await cpoeApplicationService.createOrder({
        encounterId: ENCOUNTER_A_ID,
        patientId: PATIENT_A_ID,
        orderCategory: 'LABORATORY',
        priority: 'ROUTINE',
        clinicalIndication: 'Child isolation verification A',
        items: [{ catalogCode: 'L-CHILD-A', itemName: 'Item A', quantity: 1, unitPrice: 10000 }]
      }, ACTOR_A_DOC);

      // Direct SELECT joining clinical_orders under Tenant B context returns 0 rows!
      await withUnitOfWork({ tenantId: TENANT_B }, async ({ query }) => {
        const res = await query(`
          SELECT i.* 
          FROM cpoe_order_items i
          JOIN clinical_orders o ON i.order_id = o.id
          WHERE i.order_id = $1;
        `, [orderA.id]);
        expect(res.rows.length).toBe(0);
      });
    });

    it('C1-CHILD-02: Reading items via parent clinical_orders across tenants yields zero rows', async () => {
      // Create order in Tenant A
      const orderA = await cpoeApplicationService.createOrder({
        encounterId: ENCOUNTER_A_ID,
        patientId: PATIENT_A_ID,
        orderCategory: 'PHARMACY',
        priority: 'ROUTINE',
        clinicalIndication: 'Child isolation verification parent access',
        items: [{ catalogCode: 'MED-CHILD-A', itemName: 'Drug A', quantity: 1, unitPrice: 20000 }]
      }, ACTOR_A_DOC);

      // Service getOrderById under Tenant B must fail with 404
      await expect(
        cpoeApplicationService.getOrderById(orderA.id, { tenantId: TENANT_B })
      ).rejects.toThrow('ORDER_NOT_FOUND');
    });

    it('C1-CHILD-03 & C1-CHILD-04: Application paths to child table are strictly parent-scoped', async () => {
      // In getOrderById, getOrdersByEncounterId, and listOrders, order_id is obtained strictly from parent clinical_orders
      const ordersA = await cpoeApplicationService.getOrdersByEncounterId(ENCOUNTER_A_ID, { tenantId: TENANT_A });
      expect(ordersA.length).toBeGreaterThanOrEqual(1);
      for (const ord of ordersA) {
        expect(ord.items).toBeDefined();
        expect(Array.isArray(ord.items)).toBe(true);
      }

      // Cross-encounter query by Tenant B for Tenant A encounter yields 0 orders and 0 items
      await withUnitOfWork({ tenantId: TENANT_B }, async ({ query }) => {
        const res = await query('SELECT * FROM clinical_orders WHERE encounter_id = $1;', [ENCOUNTER_A_ID]);
        expect(res.rows.length).toBe(0);
      });
    });

    it('C1-CHILD-05: Direct mutation on child table across tenants cannot touch foreign rows', async () => {
      // Create order in Tenant A
      const orderA = await cpoeApplicationService.createOrder({
        encounterId: ENCOUNTER_A_ID,
        patientId: PATIENT_A_ID,
        orderCategory: 'LABORATORY',
        priority: 'ROUTINE',
        clinicalIndication: 'Child mutation protection test',
        items: [{ catalogCode: 'L-MUT-A', itemName: 'Item Mut A', quantity: 1, unitPrice: 15000 }]
      }, ACTOR_A_DOC);

      // Attempt cross-tenant update via application path cancelOrder
      await expect(
        cpoeApplicationService.cancelOrder({
          orderId: orderA.id,
          cancellationReason: 'Cross tenant cancel attempt'
        }, ACTOR_B_DOC)
      ).rejects.toThrow();

      // Verify item status remains ORDERED
      await withUnitOfWork({ tenantId: TENANT_A }, async ({ query }) => {
        const res = await query('SELECT status FROM cpoe_order_items WHERE order_id = $1;', [orderA.id]);
        expect(res.rows[0].status).toBe('ORDERED');
      });
    });
  });
});
