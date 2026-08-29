/**
 * ============================================================================
 * 🏥 NURSEFLOW ENTERPRISE HIS 2026 — PHASE D2.3-E ADVERSARIAL VERIFICATION PROOF
 * LIVE POSTGRESQL MULTI-CONNECTION CONCURRENCY, ROLLBACK INVARIANCE, CRYPTO BINDING
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import { safetyAuthorizationService } from '../server/services/safetyAuthorization.service.js';
import { createSafetyDecision, computeCommandHash } from '../src/core/safetyDecision.js';

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

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DB || 'nurseflow_enterprise_his'
});

console.log('\n================================================================');
console.log('🛡️  NURSEFLOW PHASE D2.3-E: PRODUCTION SAFETY ADVERSARIAL PROOF');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runAdversarialProof() {
  const testActor = {
    userId: 'USR-DOC-ADV-001',
    username: 'dr_siti_sp_pd',
    fullName: 'dr. Siti Rahma, Sp.PD',
    role: 'ROLE_DOCTOR_DPJP'
  };

  const testPatientId = 'pat-adv-888';
  const testEncounterId = 'enc-adv-888';

  try {
    console.log('🔐 1. Verifying Cryptographic Command Binding (RFC 8785 JCS & SHA-256)...');
    const validPayload = { orderId: 'ord-cpoe-888', cancellationReason: 'Uji klinis otorisasi sah', expectedVersion: 1 };
    const hash1 = computeCommandHash(validPayload);
    const hash2 = computeCommandHash({ cancellationReason: 'Uji klinis otorisasi sah', expectedVersion: 1, orderId: 'ord-cpoe-888' });
    assert(hash1 === hash2 && hash1.length === 64, 'Deterministic canonical SHA-256 hash generated consistently');

    const validDecision = createSafetyDecision({
      patientId: testPatientId,
      encounterId: testEncounterId,
      actorId: testActor.userId,
      actorRole: testActor.role,
      action: 'CPOE_ORDER_CANCEL',
      justification: validPayload.cancellationReason,
      targetPayload: validPayload,
      acknowledgment: true
    });

    let tamperedRejected = false;
    try {
      safetyAuthorizationService.verifyDecisionContract({
        safetyDecision: validDecision,
        actualCommandPayload: { orderId: 'ord-cpoe-888', cancellationReason: 'Payload dimanipulasi peretas', expectedVersion: 1 },
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: testActor
      });
    } catch (err) {
      if (err.code === 'SAFETY_COMMAND_HASH_MISMATCH') {
        tamperedRejected = true;
      }
    }
    assert(tamperedRejected, 'Tampered command payload in transit strictly blocked (400 SAFETY_COMMAND_HASH_MISMATCH)');

    console.log('\n🔄 2. Verifying Transactional Rollback Invariance (Token Recovery)...');
    const rbDecisionId = `SD-PROOF-RB-${crypto.randomUUID()}`;
    const rbPayload = { orderId: 'ord-rb-proof', cancellationReason: 'Uji pembatalan transaksi' };
    const rbDecision = {
      decisionId: rbDecisionId,
      patientId: testPatientId,
      encounterId: testEncounterId,
      actorId: testActor.userId,
      actorRole: testActor.role,
      action: 'CPOE_ORDER_CANCEL',
      riskType: 'DESTRUCTIVE_ACTION',
      justification: rbPayload.cancellationReason,
      commandHash: computeCommandHash(rbPayload),
      acknowledgment: true,
      correlationId: `CORR-RB-${Date.now()}`
    };

    // Client A starts tx and rolls back
    const clientA = await pool.connect();
    try {
      await clientA.query('BEGIN;');
      await safetyAuthorizationService.verifyAndConsumeTransactional(clientA, {
        safetyDecision: rbDecision,
        actualCommandPayload: rbPayload,
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: testActor
      });
      await clientA.query('ROLLBACK;');
    } finally {
      clientA.release();
    }

    // Client B retries with SAME decisionId -> MUST succeed
    const clientB = await pool.connect();
    let retrySucceeded = false;
    try {
      await clientB.query('BEGIN;');
      const res = await safetyAuthorizationService.verifyAndConsumeTransactional(clientB, {
        safetyDecision: rbDecision,
        actualCommandPayload: rbPayload,
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: testActor
      });
      await clientB.query('COMMIT;');
      retrySucceeded = res.isConsumed === true;
    } finally {
      clientB.release();
    }
    assert(retrySucceeded, 'PostgreSQL ACID Rollback preserved Safety Decision status without burning token');

    console.log('\n🔒 3. Verifying Distributed Multi-Connection Anti-Replay Defense...');
    const replayClient = await pool.connect();
    let replayBlocked = false;
    try {
      await replayClient.query('BEGIN;');
      await safetyAuthorizationService.verifyAndConsumeTransactional(replayClient, {
        safetyDecision: rbDecision, // Same decision committed above!
        actualCommandPayload: rbPayload,
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: testActor
      });
      await replayClient.query('COMMIT;');
    } catch (err) {
      if (err.code === 'SAFETY_DECISION_ALREADY_CONSUMED') {
        replayBlocked = true;
      }
      await replayClient.query('ROLLBACK;');
    } finally {
      replayClient.release();
    }
    assert(replayBlocked, 'Multi-connection Replay strictly rejected via PostgreSQL safety_decision_registry (409)');

    console.log('\n🏛️  4. Verifying Physical Native Column E5-F Audit Linkage & WORM Defense...');
    const auditClient = await pool.connect();
    try {
      const patRes = await auditClient.query('SELECT id FROM master_patients LIMIT 1;');
      const physicalPatientId = patRes.rows.length > 0 ? patRes.rows[0].id : null;

      const auditId = crypto.randomUUID();
      const directDecisionId = `SD-NATIVE-${crypto.randomUUID()}`;
      const directCorrId = `CORR-NATIVE-${Date.now()}`;

      await auditClient.query(`
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
        auditId, testActor.userId, testActor.fullName, testActor.role, '127.0.0.1',
        'OVERRIDE', 'CPOE_ORDER', 'ord-cpoe-888', physicalPatientId,
        'Native E5-F Column Audit Verification', 'sig_hash_888', directDecisionId, directCorrId
      ]);

      const auditCheck = await auditClient.query(`
        SELECT id, decision_id, correlation_id FROM universal_audit_logs WHERE id = $1;
      `, [auditId]);

      assert(
        auditCheck.rowCount === 1 && 
        auditCheck.rows[0].decision_id === directDecisionId && 
        auditCheck.rows[0].correlation_id === directCorrId,
        'First-class physical columns decision_id and correlation_id verified in live PostgreSQL universal_audit_logs'
      );

      // Verify WORM protection on native audit row
      let wormBlocked = false;
      try {
        await auditClient.query(`UPDATE universal_audit_logs SET decision_id = 'TAMPERED' WHERE id = $1;`, [auditId]);
      } catch (err) {
        if (err.message.includes('JCI AUDIT INTEGRITY VIOLATION')) {
          wormBlocked = true;
        }
      }
      assert(wormBlocked, 'PostgreSQL WORM Trigger trg_immutable_audit_logs physically blocked UPDATE on audit row');
    } finally {
      auditClient.release();
    }

  } catch (globalErr) {
    console.error(`💥 Unexpected Error in Adversarial Proof: ${globalErr.message}`);
    failed++;
  } finally {
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`🏁 PHASE D2.3-E ADVERSARIAL SAFETY AUDIT COMPLETED`);
  console.log(`   Passed : ${passed}`);
  console.log(`   Failed : ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdversarialProof();
