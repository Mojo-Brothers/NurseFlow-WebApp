/**
 * ============================================================================
 * 🏥 NURSEFLOW ENTERPRISE HIS 2026 — PHASE D2.3-E AUTOMATED TEST SUITE
 * PRODUCTION-GRADE SAFETY AUTHORIZATION HARDENING & PHYSICAL ADVERSARIAL PROOF
 * STANDARDS: JCI 7TH EDITION (MMU.4, IPSG.1-2), NIST SP 800-92, RFC 8785 (JCS)
 * ============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import pg from 'pg';
import { safetyAuthorizationService, SafetyAuthorizationError } from '../server/services/safetyAuthorization.service.js';
import { createSafetyDecision, computeCommandHash } from '../src/core/safetyDecision.js';

const { Pool } = pg;

describe('🛡️ PHASE D2.3-E: PRODUCTION-GRADE SAFETY AUTHORIZATION HARDENING', () => {
  let pool = null;
  let isLiveDbAvailable = false;

  const testActor = {
    userId: 'USR-DOC-D23E-001',
    username: 'dr_budi_sp_a',
    fullName: 'dr. Budi Santoso, Sp.A',
    role: 'ROLE_DOCTOR_DPJP'
  };

  const testPatientId = 'pat-d23e-999';
  const testEncounterId = 'enc-d23e-999';

  beforeEach(async () => {
    safetyAuthorizationService._resetReplayCache();

    // Check if live PostgreSQL is reachable
    if (!pool) {
      pool = new Pool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
        database: process.env.POSTGRES_DB || 'nurseflow_enterprise_his',
        connectionTimeoutMillis: 2000
      });

      try {
        const client = await pool.connect();
        client.release();
        isLiveDbAvailable = true;
      } catch (err) {
        isLiveDbAvailable = false;
      }
    }
  });

  // =========================================================================
  // 1. DETERMINISTIC CRYPTOGRAPHIC COMMAND BINDING (E2)
  // =========================================================================
  describe('1. Cryptographic Command Binding & Tamper Detection (E2)', () => {
    it('1.1 should compute identical deterministic commandHash regardless of key order', () => {
      const payloadA = { orderId: 'ord-100', cancellationReason: 'Patient discharged', expectedVersion: 2 };
      const payloadB = { expectedVersion: 2, cancellationReason: 'Patient discharged', orderId: 'ord-100' };

      const hashA = computeCommandHash(payloadA);
      const hashB = computeCommandHash(payloadB);

      expect(hashA).toBe(hashB);
      expect(hashA.length).toBe(64);
    });

    it('1.2 should strictly reject execution when mutation payload is tampered in transit', () => {
      const originalPayload = {
        orderId: 'ord-tamper-001',
        cancellationReason: 'DPJP instruction: Change to oral antibiotic',
        expectedVersion: 1
      };

      const decision = createSafetyDecision({
        patientId: testPatientId,
        encounterId: testEncounterId,
        actorId: testActor.userId,
        actorRole: testActor.role,
        action: 'CPOE_ORDER_CANCEL',
        justification: originalPayload.cancellationReason,
        targetPayload: originalPayload,
        acknowledgment: true
      });

      // Tampered payload in transit (e.g. attacker changing reason)
      const tamperedPayload = {
        orderId: 'ord-tamper-001',
        cancellationReason: 'Unauthorized modification: cancel without doctor consent',
        expectedVersion: 1
      };

      expect(() => {
        safetyAuthorizationService.verifyDecisionContract({
          safetyDecision: decision,
          actualCommandPayload: tamperedPayload,
          expectedAction: 'CPOE_ORDER_CANCEL',
          expectedPatientId: testPatientId,
          expectedEncounterId: testEncounterId,
          actor: testActor
        });
      }).toThrowError(SafetyAuthorizationError);

      try {
        safetyAuthorizationService.verifyDecisionContract({
          safetyDecision: decision,
          actualCommandPayload: tamperedPayload,
          expectedAction: 'CPOE_ORDER_CANCEL',
          expectedPatientId: testPatientId,
          expectedEncounterId: testEncounterId,
          actor: testActor
        });
      } catch (err) {
        expect(err.code).toBe('SAFETY_COMMAND_HASH_MISMATCH');
        expect(err.statusCode).toBe(400);
      }
    });

    it('1.3 should successfully pass verification when command payload is authentic and untampered', () => {
      const payload = {
        orderId: 'ord-valid-001',
        cancellationReason: 'Clinical justification: Lab panic value resolved',
        expectedVersion: 1
      };

      const decision = createSafetyDecision({
        patientId: testPatientId,
        encounterId: testEncounterId,
        actorId: testActor.userId,
        actorRole: testActor.role,
        action: 'CPOE_ORDER_CANCEL',
        justification: payload.cancellationReason,
        targetPayload: payload,
        acknowledgment: true
      });

      const verification = safetyAuthorizationService.verifyDecisionContract({
        safetyDecision: decision,
        actualCommandPayload: payload,
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: testActor
      });

      expect(verification.isValid).toBe(true);
      expect(verification.decisionId).toBe(decision.decisionId);
    });
  });

  // =========================================================================
  // 2. TRANSACTIONAL SINGLE-USE CONSUMPTION & ROLLBACK INVARIANCE (E3)
  // =========================================================================
  describe('2. Transactional Single-Use Consumption & Rollback Invariance (E3)', () => {
    it('2.1 should preserve token as ISSUED and consumable if mid-transaction failure triggers ROLLBACK', async () => {
      if (!isLiveDbAvailable) return;

      const client = await pool.connect();
      const decisionId = `SD-ROLLBACK-${crypto.randomUUID()}`;
      const payload = { orderId: 'ord-rb-001', cancellationReason: 'Test rollback recovery' };

      const decision = {
        decisionId,
        patientId: testPatientId,
        encounterId: testEncounterId,
        actorId: testActor.userId,
        actorRole: testActor.role,
        action: 'CPOE_ORDER_CANCEL',
        riskType: 'DESTRUCTIVE_ACTION',
        justification: payload.cancellationReason,
        commandHash: computeCommandHash(payload),
        acknowledgment: true,
        correlationId: `CORR-RB-${Date.now()}`
      };

      try {
        // Step A: Start Transaction 1 and consume decision
        await client.query('BEGIN;');
        await safetyAuthorizationService.verifyAndConsumeTransactional(client, {
          safetyDecision: decision,
          actualCommandPayload: payload,
          expectedAction: 'CPOE_ORDER_CANCEL',
          expectedPatientId: testPatientId,
          expectedEncounterId: testEncounterId,
          actor: testActor
        });

        // Simulate mid-transaction crash / rollback
        await client.query('ROLLBACK;');
      } finally {
        client.release();
      }

      // Step B: Start Transaction 2 with the SAME decisionId -> MUST NOT BE BURNED
      const client2 = await pool.connect();
      try {
        await client2.query('BEGIN;');
        const retryResult = await safetyAuthorizationService.verifyAndConsumeTransactional(client2, {
          safetyDecision: decision,
          actualCommandPayload: payload,
          expectedAction: 'CPOE_ORDER_CANCEL',
          expectedPatientId: testPatientId,
          expectedEncounterId: testEncounterId,
          actor: testActor
        });

        expect(retryResult.isValid).toBe(true);
        expect(retryResult.isConsumed).toBe(true);
        await client2.query('COMMIT;');
      } finally {
        client2.release();
      }
    });

    it('2.2 should strictly reject replay across concurrent distinct connections after COMMIT', async () => {
      if (!isLiveDbAvailable) return;

      const decisionId = `SD-REPLAY-${crypto.randomUUID()}`;
      const payload = { orderId: 'ord-replay-001', cancellationReason: 'Replay defense test' };

      const decision = {
        decisionId,
        patientId: testPatientId,
        encounterId: testEncounterId,
        actorId: testActor.userId,
        actorRole: testActor.role,
        action: 'CPOE_ORDER_CANCEL',
        riskType: 'DESTRUCTIVE_ACTION',
        justification: payload.cancellationReason,
        commandHash: computeCommandHash(payload),
        acknowledgment: true,
        correlationId: `CORR-REPLAY-${Date.now()}`
      };

      // Connection 1: Consumes and Commits
      const client1 = await pool.connect();
      try {
        await client1.query('BEGIN;');
        await safetyAuthorizationService.verifyAndConsumeTransactional(client1, {
          safetyDecision: decision,
          actualCommandPayload: payload,
          expectedAction: 'CPOE_ORDER_CANCEL',
          expectedPatientId: testPatientId,
          expectedEncounterId: testEncounterId,
          actor: testActor
        });
        await client1.query('COMMIT;');
      } finally {
        client1.release();
      }

      // Connection 2: Attempts to reuse the committed decisionId -> MUST BE REJECTED 409
      const client2 = await pool.connect();
      let capturedReplayErr;
      try {
        await client2.query('BEGIN;');
        await safetyAuthorizationService.verifyAndConsumeTransactional(client2, {
          safetyDecision: decision,
          actualCommandPayload: payload,
          expectedAction: 'CPOE_ORDER_CANCEL',
          expectedPatientId: testPatientId,
          expectedEncounterId: testEncounterId,
          actor: testActor
        });
        await client2.query('COMMIT;');
      } catch (err) {
        capturedReplayErr = err;
        await client2.query('ROLLBACK;');
      } finally {
        client2.release();
      }

      expect(capturedReplayErr).toBeDefined();
      expect(capturedReplayErr.code).toBe('SAFETY_DECISION_ALREADY_CONSUMED');
      expect(capturedReplayErr.statusCode).toBe(409);
    });
  });

  // =========================================================================
  // 3. PHYSICAL POSTGRESQL E5-F AUDIT LINKAGE & WORM DEFENSE (E4 & E5)
  // =========================================================================
  describe('3. Physical PostgreSQL E5-F Audit Linkage & WORM Defense (E4 & E5)', () => {
    it('3.1 should verify native physical columns decision_id and correlation_id in universal_audit_logs', async () => {
      if (!isLiveDbAvailable) return;

      const client = await pool.connect();
      try {
        const patRes = await client.query('SELECT id FROM master_patients LIMIT 1;');
        const physicalPatientId = patRes.rows.length > 0 ? patRes.rows[0].id : null;

        const auditId = crypto.randomUUID();
        const decisionId = `SD-AUDIT-${crypto.randomUUID()}`;
        const correlationId = `CORR-AUDIT-${Date.now()}`;

        await client.query(`
          INSERT INTO universal_audit_logs (
            id, actor_id, actor_name, actor_role, client_ip,
            action_type, resource_type, resource_id, patient_id,
            reason_for_action, signature_hash, decision_id, correlation_id, created_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13, NOW()
          );
        `, [
          auditId,
          testActor.userId,
          testActor.fullName,
          testActor.role,
          '127.0.0.1',
          'OVERRIDE',
          'CLINICAL_SAFETY_DECISION',
          decisionId,
          physicalPatientId,
          'Native Column Audit Linkage Proof',
          'mock_sig_hash',
          decisionId,
          correlationId
        ]);

        // Query physical columns directly
        const res = await client.query(`
          SELECT id, decision_id, correlation_id, reason_for_action
          FROM universal_audit_logs
          WHERE id = $1;
        `, [auditId]);

        expect(res.rowCount).toBe(1);
        expect(res.rows[0].decision_id).toBe(decisionId);
        expect(res.rows[0].correlation_id).toBe(correlationId);

        // Prove PostgreSQL WORM Trigger trg_immutable_audit_logs blocks UPDATE
        let updateErr;
        try {
          await client.query(`
            UPDATE universal_audit_logs
            SET reason_for_action = 'Tampered'
            WHERE id = $1;
          `, [auditId]);
        } catch (err) {
          updateErr = err;
        }
        expect(updateErr).toBeDefined();
        expect(updateErr.message).toContain('JCI AUDIT INTEGRITY VIOLATION');

        // Prove PostgreSQL WORM Trigger trg_immutable_audit_logs blocks DELETE
        let deleteErr;
        try {
          await client.query(`
            DELETE FROM universal_audit_logs
            WHERE id = $1;
          `, [auditId]);
        } catch (err) {
          deleteErr = err;
        }
        expect(deleteErr).toBeDefined();
        expect(deleteErr.message).toContain('JCI AUDIT INTEGRITY VIOLATION');
      } finally {
        client.release();
      }
    });
  });
});
