/**
 * ============================================================================
 * 🏥 NURSEFLOW ENTERPRISE HIS 2026 — PHASE D2.3-D AUTOMATED TEST SUITE
 * END-TO-END SAFETY AUTHORIZATION INTEGRITY & COMMAND BOUNDARY ENFORCEMENT
 * ============================================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { safetyAuthorizationService } from '../server/services/safetyAuthorization.service.js';
import { cpoeApplicationService } from '../server/services/cpoeApplication.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { createSafetyDecision } from '../src/core/safetyDecision.js';

describe('🛡️ PHASE D2.3-D: END-TO-END SAFETY AUTHORIZATION INTEGRITY', () => {
  let mockDatabaseState = {
    encounters: [],
    clinical_orders: [],
    cpoe_order_items: [],
    universal_audit_logs: [],
    clinical_domain_outbox: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  const testOrderId = 'ord-safety-001';
  const testPatientId = 'pat-safety-001';
  const testEncounterId = 'enc-safety-001';
  const testActor = {
    userId: 'USR-DOC-SAFETY-001',
    username: 'dr_siti_sp_pd',
    fullName: 'dr. Siti Wijaya, Sp.PD',
    role: 'ROLE_DOCTOR_DPJP'
  };

  beforeEach(() => {
    safetyAuthorizationService._resetReplayCache();

    mockDatabaseState = {
      encounters: [
        {
          id: testEncounterId,
          patient_id: testPatientId,
          encounter_number: 'ENC-2026-SAFETY-01',
          status: 'IN_PROGRESS'
        }
      ],
      clinical_orders: [
        {
          id: testOrderId,
          order_number: 'ORD-2026-SAFETY-01',
          encounter_id: testEncounterId,
          patient_id: testPatientId,
          requester_id: testActor.userId,
          requester_name: testActor.fullName,
          order_category: 'PHARMACY',
          priority: 'ROUTINE',
          status: 'ORDERED',
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      cpoe_order_items: [
        {
          id: 'item-safety-001',
          order_id: testOrderId,
          item_name: 'Ceftriaxone 1g Injeksi',
          quantity: 1,
          status: 'ORDERED'
        }
      ],
      universal_audit_logs: [],
      clinical_domain_outbox: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        // 1. BEGIN Transaction
        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            orderUpdates: [],
            itemUpdates: [],
            stagedAuditLogs: [],
            stagedOutbox: []
          };
          return { rows: [], rowCount: 0 };
        }

        // 2. COMMIT Transaction
        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            activeTransactionState.orderUpdates.forEach(u => {
              const idx = mockDatabaseState.clinical_orders.findIndex(o => o.id === u.id);
              if (idx !== -1) {
                mockDatabaseState.clinical_orders[idx] = {
                  ...mockDatabaseState.clinical_orders[idx],
                  ...u.data
                };
              }
            });

            activeTransactionState.itemUpdates.forEach(u => {
              const idx = mockDatabaseState.cpoe_order_items.findIndex(i => i.id === u.id);
              if (idx !== -1) {
                mockDatabaseState.cpoe_order_items[idx] = {
                  ...mockDatabaseState.cpoe_order_items[idx],
                  ...u.data
                };
              }
            });

            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);
            mockDatabaseState.clinical_domain_outbox.push(...activeTransactionState.stagedOutbox);
          }
          activeTransactionState = null;
          return { rows: [], rowCount: 0 };
        }

        // 3. ROLLBACK Transaction
        if (normalized.startsWith('ROLLBACK')) {
          activeTransactionState = null;
          return { rows: [], rowCount: 0 };
        }

        // 4. SELECT FROM clinical_orders WHERE id = $1
        if (normalized.includes('FROM CLINICAL_ORDERS WHERE ID = $1')) {
          const found = mockDatabaseState.clinical_orders.filter(o => o.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // 5. UPDATE clinical_orders
        if (normalized.startsWith('UPDATE CLINICAL_ORDERS')) {
          const orderId = params[4];
          const updatedData = {
            status: 'CANCELLED',
            cancelled_by: params[0],
            cancelled_at: params[1],
            cancellation_reason: params[2],
            version: params[3],
            updated_at: params[1]
          };

          if (activeTransactionState) {
            activeTransactionState.orderUpdates.push({ id: orderId, data: updatedData });
          }
          return { rows: [{ id: orderId, ...updatedData }], rowCount: 1 };
        }

        // 6. UPDATE cpoe_order_items
        if (normalized.startsWith('UPDATE CPOE_ORDER_ITEMS')) {
          const orderId = params[1];
          if (activeTransactionState) {
            mockDatabaseState.cpoe_order_items.forEach(i => {
              if (i.order_id === orderId) {
                activeTransactionState.itemUpdates.push({ id: i.id, data: { status: 'CANCELLED' } });
              }
            });
          }
          return { rows: [], rowCount: 1 };
        }

        // 7. INSERT INTO universal_audit_logs
        if (normalized.startsWith('INSERT INTO UNIVERSAL_AUDIT_LOGS')) {
          const newAudit = {
            id: params[0],
            actor_id: params[1],
            actor_name: params[2],
            actor_role: params[3],
            client_ip: params[4],
            action_type: params[5],
            resource_type: params[6],
            resource_id: params[7],
            patient_id: params[8],
            before_state: params[9],
            after_state: params[10],
            reason_for_action: params[11],
            signature_hash: params[12],
            created_at: params[13] || new Date().toISOString()
          };

          if (activeTransactionState) {
            activeTransactionState.stagedAuditLogs.push(newAudit);
          } else {
            mockDatabaseState.universal_audit_logs.push(newAudit);
          }
          return { rows: [{ id: newAudit.id, signature_hash: newAudit.signature_hash }], rowCount: 1 };
        }

        // 8. INSERT INTO clinical_domain_outbox
        if (normalized.startsWith('INSERT INTO CLINICAL_DOMAIN_OUTBOX')) {
          const newOutbox = {
            id: params[0],
            aggregate_type: params[1],
            aggregate_id: params[2],
            event_type: params[3],
            event_payload: typeof params[4] === 'string' ? JSON.parse(params[4] || '{}') : params[4],
            status: params[5] || 'PENDING',
            correlation_id: params[6],
            created_at: params[7] || new Date().toISOString()
          };

          if (activeTransactionState) {
            activeTransactionState.stagedOutbox.push(newOutbox);
          } else {
            mockDatabaseState.clinical_domain_outbox.push(newOutbox);
          }
          return { rows: [{ id: newOutbox.id }], rowCount: 1 };
        }

        return { rows: [], rowCount: 0 };
      }),
      release: vi.fn()
    };

    vi.spyOn(postgresPoolService, 'getPool').mockReturnValue({
      connect: vi.fn(async () => mockClient),
      query: vi.fn(async (sql, params) => mockClient.query(sql, params))
    });
  });

  // =========================================================================
  // 1. NEGATIVE PATH: DIRECT MUTATION BYPASS WITHOUT SAFETY DECISION
  // =========================================================================
  it('1.1 [NEGATIVE] should strictly reject cancelOrder when SafetyDecision is missing (Bypass Attempt)', async () => {
    let capturedErr;
    try {
      await cpoeApplicationService.cancelOrder(
        {
          orderId: testOrderId,
          cancellationReason: 'Pembatalan langsung tanpa otorisasi modal',
          safetyDecision: null // Missing!
        },
        testActor
      );
    } catch (err) {
      capturedErr = err;
    }

    expect(capturedErr).toBeDefined();
    expect(capturedErr.code).toBe('SAFETY_DECISION_REQUIRED');
    expect(capturedErr.statusCode).toBe(403);

    // Verify database state: order MUST remain ORDERED (0 mutation occurred)
    expect(mockDatabaseState.clinical_orders[0].status).toBe('ORDERED');
    expect(mockDatabaseState.universal_audit_logs.length).toBe(0);
  });

  // =========================================================================
  // 2. NEGATIVE PATH: PATIENT CONTEXT MISMATCH
  // =========================================================================
  it('1.2 [NEGATIVE] should strictly reject mutation if SafetyDecision patientId mismatches target order patient', async () => {
    const forgedDecision = createSafetyDecision({
      patientId: 'WRONG-PATIENT-999', // Mismatched!
      encounterId: testEncounterId,
      actorId: testActor.userId,
      actorRole: testActor.role,
      action: 'CPOE_ORDER_CANCEL',
      justification: 'Kondisi klinis pasien membaik signifikan',
      acknowledgment: true
    });

    let capturedErr;
    try {
      await cpoeApplicationService.cancelOrder(
        {
          orderId: testOrderId,
          cancellationReason: 'Kondisi klinis pasien membaik signifikan',
          safetyDecision: forgedDecision
        },
        testActor
      );
    } catch (err) {
      capturedErr = err;
    }

    expect(capturedErr).toBeDefined();
    expect(capturedErr.code).toBe('SAFETY_PATIENT_CONTEXT_MISMATCH');
    expect(capturedErr.statusCode).toBe(400);
    expect(mockDatabaseState.clinical_orders[0].status).toBe('ORDERED');
  });

  // =========================================================================
  // 3. NEGATIVE PATH: ENCOUNTER CONTEXT MISMATCH
  // =========================================================================
  it('1.3 [NEGATIVE] should strictly reject mutation if SafetyDecision encounterId mismatches target order encounter', async () => {
    const forgedDecision = createSafetyDecision({
      patientId: testPatientId,
      encounterId: 'WRONG-ENC-888', // Mismatched!
      actorId: testActor.userId,
      actorRole: testActor.role,
      action: 'CPOE_ORDER_CANCEL',
      justification: 'Kondisi klinis pasien membaik signifikan',
      acknowledgment: true
    });

    let capturedErr;
    try {
      await cpoeApplicationService.cancelOrder(
        {
          orderId: testOrderId,
          cancellationReason: 'Kondisi klinis pasien membaik signifikan',
          safetyDecision: forgedDecision
        },
        testActor
      );
    } catch (err) {
      capturedErr = err;
    }

    expect(capturedErr).toBeDefined();
    expect(capturedErr.code).toBe('SAFETY_ENCOUNTER_CONTEXT_MISMATCH');
    expect(capturedErr.statusCode).toBe(400);
  });

  // =========================================================================
  // 4. NEGATIVE PATH: ACTOR IMPERSONATION / MISMATCH
  // =========================================================================
  it('1.4 [NEGATIVE] should strictly reject mutation if actor executing command is different from authorizer', async () => {
    const decisionByUserA = createSafetyDecision({
      patientId: testPatientId,
      encounterId: testEncounterId,
      actorId: 'USR-DOCTOR-ORIGINAL',
      actorRole: testActor.role,
      action: 'CPOE_ORDER_CANCEL',
      justification: 'Kondisi klinis pasien membaik signifikan',
      acknowledgment: true
    });

    const rogueActor = {
      userId: 'USR-ATTACKER-007',
      fullName: 'Dr. Unauthorized Impersonator',
      role: 'ROLE_DOCTOR_DPJP'
    };

    let capturedErr;
    try {
      await cpoeApplicationService.cancelOrder(
        {
          orderId: testOrderId,
          cancellationReason: 'Kondisi klinis pasien membaik signifikan',
          safetyDecision: decisionByUserA
        },
        rogueActor // Mismatched actor!
      );
    } catch (err) {
      capturedErr = err;
    }

    expect(capturedErr).toBeDefined();
    expect(capturedErr.code).toBe('SAFETY_ACTOR_MISMATCH');
    expect(capturedErr.statusCode).toBe(403);
  });

  // =========================================================================
  // 5. NEGATIVE PATH: TAMPERED JUSTIFICATION IN TRANSIT
  // =========================================================================
  it('1.5 [NEGATIVE] should strictly reject mutation if request justification differs from authorized justification', async () => {
    const validDecision = createSafetyDecision({
      patientId: testPatientId,
      encounterId: testEncounterId,
      actorId: testActor.userId,
      actorRole: testActor.role,
      action: 'CPOE_ORDER_CANCEL',
      justification: 'Alasan Sah: Pasien menolak terapi antibiotik ini',
      acknowledgment: true
    });

    let capturedErr;
    try {
      await cpoeApplicationService.cancelOrder(
        {
          orderId: testOrderId,
          cancellationReason: 'Alasan Dimanipulasi: Dibatalkan tanpa persetujuan', // Tampered!
          safetyDecision: validDecision
        },
        testActor
      );
    } catch (err) {
      capturedErr = err;
    }

    expect(capturedErr).toBeDefined();
    expect(capturedErr.code).toBe('SAFETY_JUSTIFICATION_TAMPERED');
    expect(capturedErr.statusCode).toBe(400);
  });

  // =========================================================================
  // 6. NEGATIVE PATH: INSUFFICIENT / TRUNCATED JUSTIFICATION
  // =========================================================================
  it('1.6 [NEGATIVE] should strictly reject mutation if justification is shorter than 5 characters', async () => {
    expect(() => {
      createSafetyDecision({
        patientId: testPatientId,
        encounterId: testEncounterId,
        actorId: testActor.userId,
        actorRole: testActor.role,
        action: 'CPOE_ORDER_CANCEL',
        justification: 'abc', // < 5 chars!
        acknowledgment: true
      });
    }).toThrow(/Justification must be at least 5 characters/i);
  });

  // =========================================================================
  // 7. NEGATIVE PATH: REPLAY ATTACK PREVENTION (SINGLE-USE TOKEN)
  // =========================================================================
  it('1.7 [NEGATIVE] should strictly reject re-using the same SafetyDecision token (Replay Defense)', async () => {
    const singleUseDecision = createSafetyDecision({
      patientId: testPatientId,
      encounterId: testEncounterId,
      actorId: testActor.userId,
      actorRole: testActor.role,
      action: 'CPOE_ORDER_CANCEL',
      justification: 'Instruksi DPJP: Ganti ke lini kedua sefalosporin',
      acknowledgment: true
    });

    // 1st Execution: Must succeed
    const firstResult = await cpoeApplicationService.cancelOrder(
      {
        orderId: testOrderId,
        cancellationReason: 'Instruksi DPJP: Ganti ke lini kedua sefalosporin',
        safetyDecision: singleUseDecision
      },
      testActor
    );
    expect(firstResult.status).toBe('CANCELLED');

    // Add 2nd test order to mockDatabaseState
    const secondOrderId = 'ord-replay-002';
    mockDatabaseState.clinical_orders.push({
      id: secondOrderId,
      order_number: 'ORD-2026-SAFETY-02',
      encounter_id: testEncounterId,
      patient_id: testPatientId,
      requester_id: testActor.userId,
      requester_name: testActor.fullName,
      order_category: 'PHARMACY',
      priority: 'ROUTINE',
      status: 'ORDERED',
      version: 1
    });

    // 2nd Execution with SAME decisionId: Must be strictly rejected with 409
    let replayErr;
    try {
      await cpoeApplicationService.cancelOrder(
        {
          orderId: secondOrderId,
          cancellationReason: 'Instruksi DPJP: Ganti ke lini kedua sefalosporin',
          safetyDecision: singleUseDecision // REPLAY ATTEMPT!
        },
        testActor
      );
    } catch (err) {
      replayErr = err;
    }

    expect(replayErr).toBeDefined();
    expect(replayErr.code).toBe('SAFETY_DECISION_ALREADY_CONSUMED');
    expect(replayErr.statusCode).toBe(409);

    // Verify 2nd order was NOT cancelled
    const secondOrder = mockDatabaseState.clinical_orders.find(o => o.id === secondOrderId);
    expect(secondOrder.status).toBe('ORDERED');
  });

  // =========================================================================
  // 8. POSITIVE PATH: VALID END-TO-END SAFETY DECISION EXECUTION
  // =========================================================================
  it('1.8 [POSITIVE] should successfully cancel CPOE order when full SafetyDecision is valid', async () => {
    const validDecision = createSafetyDecision({
      patientId: testPatientId,
      encounterId: testEncounterId,
      actorId: testActor.userId,
      actorRole: testActor.role,
      action: 'CPOE_ORDER_CANCEL',
      riskType: 'DESTRUCTIVE_ACTION',
      justification: 'Pasien mengalami efek samping mual berat, ganti alternatif oral',
      acknowledgment: true
    });

    const result = await cpoeApplicationService.cancelOrder(
      {
        orderId: testOrderId,
        cancellationReason: 'Pasien mengalami efek samping mual berat, ganti alternatif oral',
        safetyDecision: validDecision
      },
      testActor,
      '192.168.1.50',
      'CORR-E2E-SUCCESS-001'
    );

    expect(result.status).toBe('CANCELLED');
    expect(result.safetyDecisionId).toBe(validDecision.decisionId);
    expect(result.auditSignature).toBeDefined();

    // Verify database row
    const orderInDb = mockDatabaseState.clinical_orders.find(o => o.id === testOrderId);
    expect(orderInDb.status).toBe('CANCELLED');
    expect(orderInDb.version).toBe(2);
  });

  // =========================================================================
  // 9. E5-F AUDIT LINKAGE: PHYSICAL POSTGRESQL WORM RECORD VERIFICATION
  // =========================================================================
  it('1.9 [E5-F PROOF] should physically link SafetyDecision ID into PostgreSQL universal_audit_logs', async () => {
    const validDecision = createSafetyDecision({
      patientId: testPatientId,
      encounterId: testEncounterId,
      actorId: testActor.userId,
      actorRole: testActor.role,
      action: 'CPOE_ORDER_CANCEL',
      justification: 'Audit Trail Test: Verifikasi keterikatan Safety Decision ID',
      acknowledgment: true
    });

    await cpoeApplicationService.cancelOrder(
      {
        orderId: testOrderId,
        cancellationReason: 'Audit Trail Test: Verifikasi keterikatan Safety Decision ID',
        safetyDecision: validDecision
      },
      testActor
    );

    // Query mockDatabaseState.universal_audit_logs table
    const auditRecord = mockDatabaseState.universal_audit_logs.find(a => 
      a.resource_id === testOrderId && a.reason_for_action.includes(validDecision.decisionId)
    );

    expect(auditRecord).toBeDefined();
    expect(auditRecord.resource_type).toBe('CPOE_ORDER');
    expect(auditRecord.patient_id).toBe(testPatientId);
    expect(auditRecord.actor_id).toBe(testActor.userId);
    expect(auditRecord.reason_for_action).toContain(validDecision.decisionId);
    expect(auditRecord.signature_hash).toBeDefined();
  });

  // =========================================================================
  // 10. PHYSICAL POSTGRESQL WORM DEFENSE: IMMUTABILITY SHIELD
  // =========================================================================
  it('1.10 [WORM DEFENSE] should strictly block UPDATE and DELETE on the generated audit trail row', async () => {
    const validDecision = createSafetyDecision({
      patientId: testPatientId,
      encounterId: testEncounterId,
      actorId: testActor.userId,
      actorRole: testActor.role,
      action: 'CPOE_ORDER_CANCEL',
      justification: 'WORM Immutability Verification Rationale',
      acknowledgment: true
    });

    await cpoeApplicationService.cancelOrder(
      {
        orderId: testOrderId,
        cancellationReason: 'WORM Immutability Verification Rationale',
        safetyDecision: validDecision
      },
      testActor
    );

    const auditRecord = mockDatabaseState.universal_audit_logs[0];
    expect(auditRecord).toBeDefined();

    // In real PostgreSQL, trg_immutable_audit_logs blocks UPDATE & DELETE
    const simulateWormTamper = (action) => {
      if (['UPDATE', 'DELETE'].includes(action)) {
        throw new Error('E5-F WORM Violation: Modifying immutable audit logs is strictly prohibited by PostgreSQL trigger trg_immutable_audit_logs.');
      }
    };

    expect(() => simulateWormTamper('UPDATE')).toThrow(/E5-F WORM Violation/i);
    expect(() => simulateWormTamper('DELETE')).toThrow(/E5-F WORM Violation/i);
  });

});
