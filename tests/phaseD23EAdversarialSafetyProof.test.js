/**
 * ============================================================================
 * 🏥 NURSEFLOW ENTERPRISE HIS 2026 — PHASE D2.3-E ADVERSARIAL SAFETY TEST SUITE
 * PRODUCTION-GRADE AUTHORIZATION PROVENANCE (E6) & PHYSICAL POSTGRESQL ATTACK MATRIX
 * STANDARDS: JCI 7TH EDITION (MMU.4, IPSG.1-2), NIST SP 800-92, RFC 8785 (JCS)
 * ============================================================================
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs';
import crypto from 'crypto';
import pg from 'pg';
import { safetyAuthorizationService, SafetyAuthorizationError } from '../server/services/safetyAuthorization.service.js';
import { computeCommandHash } from '../src/core/safetyDecision.js';

const { Pool } = pg;

// Load .env or .env.local
const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      process.env[k.trim()] = v.join('=').trim();
    }
  });
}

describe('🛡️ PHASE D2.3-E / E6: AUTHORIZATION PROVENANCE & PHYSICAL ADVERSARIAL MATRIX', () => {
  let pool = null;
  let defaultTenantId = '00000000-0000-0000-0000-000000000001';

  const legitimateDoctor = {
    userId: 'USR-DOC-PROV-001',
    username: 'dr_budi_sp_a',
    fullName: 'dr. Budi Santoso, Sp.A',
    role: 'ROLE_DOCTOR_DPJP'
  };

  const rogueImpersonator = {
    userId: 'USR-ATTACKER-999',
    username: 'attacker_fake_doc',
    fullName: 'Dr. Forged Impersonator',
    role: 'ROLE_DOCTOR_DPJP'
  };

  const testPatientId = 'pat-prov-001';
  const testEncounterId = 'enc-prov-001';

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      database: process.env.POSTGRES_DB || 'nurseflow_enterprise_his',
      connectionTimeoutMillis: 5000
    });

    // Mandatory live database connection verification — FAIL-CLOSED: Test FAILS if DB unreachable
    try {
      const client = await pool.connect();
      client.release();
    } catch (err) {
      throw new Error(`CRITICAL FAILURE: PostgreSQL is unreachable at localhost:5432. Physical Adversarial Proof cannot run: ${err.message}`);
    }
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  beforeEach(() => {
    safetyAuthorizationService._resetReplayCache();
  });

  // =========================================================================
  // SCENARIO 1: CLIENT-FORGED SAFETY DECISION (UNISSUED TOKEN INJECTION)
  // =========================================================================
  it('TC-ADV-01 [PROVENANCE]: should strictly reject client-manufactured forged token not issued by server (404)', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN;');
      const forgedDecisionId = `SD-FORGED-${crypto.randomUUID()}`;
      const payload = { orderId: 'ord-prov-001', cancellationReason: 'Tampered order cancel' };

      let error;
      try {
        await safetyAuthorizationService.verifyAndConsumeTransactional(client, {
          decisionId: forgedDecisionId,
          actualCommandPayload: payload,
          expectedAction: 'CPOE_ORDER_CANCEL',
          expectedPatientId: testPatientId,
          expectedEncounterId: testEncounterId,
          actor: legitimateDoctor
        });
      } catch (err) {
        error = err;
      }

      await client.query('ROLLBACK;');

      expect(error).toBeDefined();
      expect(error.code).toBe('SAFETY_DECISION_NOT_FOUND');
      expect(error.statusCode).toBe(404);
    } finally {
      client.release();
    }
  });

  // =========================================================================
  // SCENARIO 2: ACTOR IMPERSONATION ATTACK
  // =========================================================================
  it('TC-ADV-02 [ACCOUNTABILITY]: should strictly reject execution when mutation actor differs from decision authorizer (403)', async () => {
    const client = await pool.connect();
    try {
      const payload = { orderId: 'ord-prov-002', cancellationReason: 'DPJP genuine order cancel' };

      // Step 1: Doctor legitimately issues decision
      const issued = await safetyAuthorizationService.issueSafetyDecision(client, {
        actor: legitimateDoctor,
        patientId: testPatientId,
        encounterId: testEncounterId,
        action: 'CPOE_ORDER_CANCEL',
        justification: payload.cancellationReason,
        targetPayload: payload,
        tenantId: defaultTenantId
      });

      // Step 2: Rogue actor attempts to consume Doctor's token
      await client.query('BEGIN;');
      let error;
      try {
        await safetyAuthorizationService.verifyAndConsumeTransactional(client, {
          decisionId: issued.decisionId,
          actualCommandPayload: payload,
          expectedAction: 'CPOE_ORDER_CANCEL',
          expectedPatientId: testPatientId,
          expectedEncounterId: testEncounterId,
          actor: rogueImpersonator // Attacker!
        });
      } catch (err) {
        error = err;
      }
      await client.query('ROLLBACK;');

      expect(error).toBeDefined();
      expect(error.code).toBe('SAFETY_ACTOR_MISMATCH');
      expect(error.statusCode).toBe(403);
    } finally {
      client.release();
    }
  });

  // =========================================================================
  // SCENARIO 3: ACTION TYPE MISMATCH
  // =========================================================================
  it('TC-ADV-03 [ACTION-BOUND]: should strictly reject token issued for Action A used against Action B (400)', async () => {
    const client = await pool.connect();
    try {
      const payload = { orderId: 'ord-prov-003', cancellationReason: 'Action mismatch test' };

      const issued = await safetyAuthorizationService.issueSafetyDecision(client, {
        actor: legitimateDoctor,
        patientId: testPatientId,
        encounterId: testEncounterId,
        action: 'CPOE_ORDER_MODIFY', // Authorized for MODIFY only
        justification: payload.cancellationReason,
        targetPayload: payload,
        tenantId: defaultTenantId
      });

      await client.query('BEGIN;');
      let error;
      try {
        await safetyAuthorizationService.verifyAndConsumeTransactional(client, {
          decisionId: issued.decisionId,
          actualCommandPayload: payload,
          expectedAction: 'CPOE_ORDER_CANCEL', // Caller tries to CANCEL!
          expectedPatientId: testPatientId,
          expectedEncounterId: testEncounterId,
          actor: legitimateDoctor
        });
      } catch (err) {
        error = err;
      }
      await client.query('ROLLBACK;');

      expect(error).toBeDefined();
      expect(error.code).toBe('SAFETY_ACTION_MISMATCH');
      expect(error.statusCode).toBe(400);
    } finally {
      client.release();
    }
  });

  // =========================================================================
  // SCENARIO 4: FORGED FUTURE EXPIRES_AT ON EXPIRED DB TOKEN
  // =========================================================================
  it('TC-ADV-04 [DB-AUTHORITATIVE EXPIRY]: should reject forged client expiresAt when DB row is expired (401)', async () => {
    const client = await pool.connect();
    try {
      const expiredDecisionId = `SD-EXP-${crypto.randomUUID()}`;
      const payload = { orderId: 'ord-prov-004', cancellationReason: 'Expiry test' };
      const pastTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

      // Seed expired token directly in DB
      await client.query(`
        INSERT INTO safety_decision_registry (
          decision_id, tenant_id, patient_id, encounter_id, actor_id, actor_role,
          action_type, risk_type, justification, command_hash, correlation_id,
          status, expires_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          'CPOE_ORDER_CANCEL', 'DESTRUCTIVE_ACTION', $7, $8, $9,
          'ISSUED', $10, $10
        );
      `, [
        expiredDecisionId, defaultTenantId, testPatientId, testEncounterId,
        legitimateDoctor.userId, legitimateDoctor.role, payload.cancellationReason,
        computeCommandHash(payload), `CORR-EXP-${Date.now()}`, pastTime
      ]);

      // Attacker passes forged future expiresAt in client payload
      const futurePayload = {
        decisionId: expiredDecisionId,
        expiresAt: new Date(Date.now() + 86400000).toISOString() // Fake +24h
      };

      await client.query('BEGIN;');
      let error;
      try {
        await safetyAuthorizationService.verifyAndConsumeTransactional(client, {
          decisionId: expiredDecisionId,
          safetyDecision: futurePayload,
          actualCommandPayload: payload,
          expectedAction: 'CPOE_ORDER_CANCEL',
          expectedPatientId: testPatientId,
          expectedEncounterId: testEncounterId,
          actor: legitimateDoctor
        });
      } catch (err) {
        error = err;
      }
      await client.query('ROLLBACK;');

      expect(error).toBeDefined();
      expect(error.code).toBe('SAFETY_DECISION_EXPIRED');
      expect(error.statusCode).toBe(401);
    } finally {
      client.release();
    }
  });

  // =========================================================================
  // SCENARIO 5: CROSS-TENANT ISOLATION DEFENSE
  // =========================================================================
  it('TC-ADV-05 [MULTI-TENANT]: should strictly reject cross-tenant token consumption (403)', async () => {
    const client = await pool.connect();
    try {
      const payload = { orderId: 'ord-prov-005', cancellationReason: 'Cross tenant test' };
      const tenantA = defaultTenantId;
      const tenantB = '00000000-0000-0000-0000-000000000002';

      const issuedTenantA = await safetyAuthorizationService.issueSafetyDecision(client, {
        actor: legitimateDoctor,
        patientId: testPatientId,
        encounterId: testEncounterId,
        action: 'CPOE_ORDER_CANCEL',
        justification: payload.cancellationReason,
        targetPayload: payload,
        tenantId: tenantA
      });

      // Tenant B tries to consume Tenant A's token
      await client.query('BEGIN;');
      let error;
      try {
        await safetyAuthorizationService.verifyAndConsumeTransactional(client, {
          decisionId: issuedTenantA.decisionId,
          actualCommandPayload: payload,
          expectedAction: 'CPOE_ORDER_CANCEL',
          expectedPatientId: testPatientId,
          expectedEncounterId: testEncounterId,
          actor: legitimateDoctor,
          tenantId: tenantB // Tenant B context
        });
      } catch (err) {
        error = err;
      }
      await client.query('ROLLBACK;');

      expect(error).toBeDefined();
      expect(error.code).toBe('SAFETY_TENANT_MISMATCH');
      expect(error.statusCode).toBe(403);
    } finally {
      client.release();
    }
  });

  // =========================================================================
  // SCENARIO 6: COMMAND HASH TAMPERING DEFENSE (RFC 8785 JCS)
  // =========================================================================
  it('TC-ADV-06 [TAMPER-PROOF]: should strictly reject execution if mutation payload is modified after issuance (400)', async () => {
    const client = await pool.connect();
    try {
      const originalPayload = { orderId: 'ord-prov-006', cancellationReason: 'Original DPJP authorization' };

      const issued = await safetyAuthorizationService.issueSafetyDecision(client, {
        actor: legitimateDoctor,
        patientId: testPatientId,
        encounterId: testEncounterId,
        action: 'CPOE_ORDER_CANCEL',
        justification: originalPayload.cancellationReason,
        targetPayload: originalPayload,
        tenantId: defaultTenantId
      });

      // Attacker tampers with payload in transit
      const tamperedPayload = { orderId: 'ord-prov-006', cancellationReason: 'Malicious unauthorized reason' };

      await client.query('BEGIN;');
      let error;
      try {
        await safetyAuthorizationService.verifyAndConsumeTransactional(client, {
          decisionId: issued.decisionId,
          actualCommandPayload: tamperedPayload,
          expectedAction: 'CPOE_ORDER_CANCEL',
          expectedPatientId: testPatientId,
          expectedEncounterId: testEncounterId,
          actor: legitimateDoctor
        });
      } catch (err) {
        error = err;
      }
      await client.query('ROLLBACK;');

      expect(error).toBeDefined();
      expect(error.code).toBe('SAFETY_COMMAND_HASH_MISMATCH');
      expect(error.statusCode).toBe(400);
    } finally {
      client.release();
    }
  });

  // =========================================================================
  // SCENARIO 7: VALID SERVER-ISSUED DECISION EXECUTION & TRANSACTION ID
  // =========================================================================
  it('TC-ADV-07 [VALID PATH]: should successfully consume server-issued token and record consumed_in_tx_id', async () => {
    const client = await pool.connect();
    try {
      const payload = { orderId: 'ord-prov-007', cancellationReason: 'Valid cancellation with DPJP consent' };

      const issued = await safetyAuthorizationService.issueSafetyDecision(client, {
        actor: legitimateDoctor,
        patientId: testPatientId,
        encounterId: testEncounterId,
        action: 'CPOE_ORDER_CANCEL',
        justification: payload.cancellationReason,
        targetPayload: payload,
        tenantId: defaultTenantId
      });

      await client.query('BEGIN;');
      const consumed = await safetyAuthorizationService.verifyAndConsumeTransactional(client, {
        decisionId: issued.decisionId,
        actualCommandPayload: payload,
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: legitimateDoctor,
        tenantId: defaultTenantId
      });
      await client.query('COMMIT;');

      expect(consumed.isValid).toBe(true);
      expect(consumed.isConsumed).toBe(true);

      // Verify row in database
      const dbCheck = await client.query(`
        SELECT status, consumed_at, consumed_by_actor_id, consumed_in_tx_id
        FROM safety_decision_registry
        WHERE decision_id = $1;
      `, [issued.decisionId]);

      expect(dbCheck.rows[0].status).toBe('CONSUMED');
      expect(dbCheck.rows[0].consumed_by_actor_id).toBe(legitimateDoctor.userId);
      expect(dbCheck.rows[0].consumed_in_tx_id).toBeDefined();
    } finally {
      client.release();
    }
  });

  // =========================================================================
  // SCENARIO 8: CONCURRENT MULTI-CONNECTION REPLAY DEFENSE
  // =========================================================================
  it('TC-ADV-08 [CONCURRENCY]: should permit exactly ONE consumption and reject second connection with 409', async () => {
    const clientIssuer = await pool.connect();
    let issued;
    const payload = { orderId: 'ord-prov-008', cancellationReason: 'Concurrent attack simulation' };
    try {
      issued = await safetyAuthorizationService.issueSafetyDecision(clientIssuer, {
        actor: legitimateDoctor,
        patientId: testPatientId,
        encounterId: testEncounterId,
        action: 'CPOE_ORDER_CANCEL',
        justification: payload.cancellationReason,
        targetPayload: payload,
        tenantId: defaultTenantId
      });
    } finally {
      clientIssuer.release();
    }

    // Connection 1: Consumes & Commits
    const client1 = await pool.connect();
    try {
      await client1.query('BEGIN;');
      await safetyAuthorizationService.verifyAndConsumeTransactional(client1, {
        decisionId: issued.decisionId,
        actualCommandPayload: payload,
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: legitimateDoctor
      });
      await client1.query('COMMIT;');
    } finally {
      client1.release();
    }

    // Connection 2: Attempts Replay -> MUST BE REJECTED 409
    const client2 = await pool.connect();
    let replayError;
    try {
      await client2.query('BEGIN;');
      await safetyAuthorizationService.verifyAndConsumeTransactional(client2, {
        decisionId: issued.decisionId,
        actualCommandPayload: payload,
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: legitimateDoctor
      });
      await client2.query('COMMIT;');
    } catch (err) {
      replayError = err;
      await client2.query('ROLLBACK;');
    } finally {
      client2.release();
    }

    expect(replayError).toBeDefined();
    expect(replayError.code).toBe('SAFETY_DECISION_ALREADY_CONSUMED');
    expect(replayError.statusCode).toBe(409);
  });

  // =========================================================================
  // SCENARIO 9: TRANSACTION ROLLBACK INVARIANCE (TOKEN PRESERVED AS ISSUED)
  // =========================================================================
  it('TC-ADV-09 [ROLLBACK INVARIANCE]: should preserve token as ISSUED if transaction fails and rolls back', async () => {
    const clientIssuer = await pool.connect();
    let issued;
    const payload = { orderId: 'ord-prov-009', cancellationReason: 'Rollback recovery proof' };
    try {
      issued = await safetyAuthorizationService.issueSafetyDecision(clientIssuer, {
        actor: legitimateDoctor,
        patientId: testPatientId,
        encounterId: testEncounterId,
        action: 'CPOE_ORDER_CANCEL',
        justification: payload.cancellationReason,
        targetPayload: payload,
        tenantId: defaultTenantId
      });
    } finally {
      clientIssuer.release();
    }

    // Client 1: Starts Tx, Consumes Token, Simulates Downstream Crash -> ROLLBACK
    const client1 = await pool.connect();
    try {
      await client1.query('BEGIN;');
      await safetyAuthorizationService.verifyAndConsumeTransactional(client1, {
        decisionId: issued.decisionId,
        actualCommandPayload: payload,
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: legitimateDoctor
      });
      // Crash simulation: Rollback
      await client1.query('ROLLBACK;');
    } finally {
      client1.release();
    }

    // Client 2 (Retry): Uses SAME decisionId -> MUST SUCCEED (Never burned prematurely)
    const client2 = await pool.connect();
    try {
      await client2.query('BEGIN;');
      const retryResult = await safetyAuthorizationService.verifyAndConsumeTransactional(client2, {
        decisionId: issued.decisionId,
        actualCommandPayload: payload,
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: legitimateDoctor
      });
      await client2.query('COMMIT;');

      expect(retryResult.isValid).toBe(true);
      expect(retryResult.isConsumed).toBe(true);
    } finally {
      client2.release();
    }
  });

  // =========================================================================
  // SCENARIO 10: PHYSICAL WORM TRIGGER DEFENSE ON NATIVE AUDIT LOGS
  // =========================================================================
  it('TC-ADV-10 [WORM DEFENSE]: should physically block UPDATE/DELETE on universal_audit_logs', async () => {
    const client = await pool.connect();
    try {
      const patRes = await client.query('SELECT id FROM master_patients LIMIT 1;');
      const physicalPatientId = patRes.rows.length > 0 ? patRes.rows[0].id : null;

      const auditId = crypto.randomUUID();
      const decisionId = `SD-WORM-${crypto.randomUUID()}`;
      const correlationId = `CORR-WORM-${Date.now()}`;

      const validSigHash = crypto.createHash('sha256').update('WORM_PROOF_' + auditId).digest('hex');

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
        auditId, legitimateDoctor.userId, legitimateDoctor.fullName, legitimateDoctor.role, '127.0.0.1',
        'OVERRIDE', 'CPOE_ORDER', 'ord-prov-010', physicalPatientId,
        'WORM Immutability Test', validSigHash, decisionId, correlationId
      ]);

      // Attempt UPDATE -> MUST be blocked by trg_immutable_audit_logs
      let updateError;
      try {
        await client.query('UPDATE universal_audit_logs SET reason_for_action = $1 WHERE id = $2;', ['Tampered', auditId]);
      } catch (err) {
        updateError = err;
      }
      expect(updateError).toBeDefined();
      expect(updateError.message).toContain('JCI AUDIT INTEGRITY VIOLATION');

      // Attempt DELETE -> MUST be blocked by trg_immutable_audit_logs
      let deleteError;
      try {
        await client.query('DELETE FROM universal_audit_logs WHERE id = $1;', [auditId]);
      } catch (err) {
        deleteError = err;
      }
      expect(deleteError).toBeDefined();
      expect(deleteError.message).toContain('JCI AUDIT INTEGRITY VIOLATION');
    } finally {
      client.release();
    }
  });
});
