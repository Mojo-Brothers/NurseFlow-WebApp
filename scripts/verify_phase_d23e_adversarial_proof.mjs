/**
 * ============================================================================
 * 🏥 NURSEFLOW ENTERPRISE HIS 2026 — PHASE D2.3-E ADVERSARIAL VERIFICATION PROOF
 * PROVENANCE INTEGRITY (E6), LIVE MULTI-CONNECTION CONCURRENCY & ZERO-TRUST GATES
 * ============================================================================
 */

import fs from 'fs';
import crypto from 'crypto';
import pg from 'pg';
import { safetyAuthorizationService } from '../server/services/safetyAuthorization.service.js';
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

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DB || 'nurseflow_enterprise_his',
  connectionTimeoutMillis: 5000
});

console.log('\n================================================================');
console.log('🛡️  NURSEFLOW PHASE D2.3-E / E6: ZERO-TRUST ADVERSARIAL PROOF');
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
  const legitimateDoctor = {
    userId: 'USR-DOC-ADV-001',
    username: 'dr_siti_sp_pd',
    fullName: 'dr. Siti Rahma, Sp.PD',
    role: 'ROLE_DOCTOR_DPJP'
  };

  const rogueImpersonator = {
    userId: 'USR-ROGUE-999',
    username: 'impersonator',
    fullName: 'Rogue Actor',
    role: 'ROLE_DOCTOR_DPJP'
  };

  const testPatientId = 'pat-adv-888';
  const testEncounterId = 'enc-adv-888';
  const defaultTenantId = '00000000-0000-0000-0000-000000000001';

  try {
    // 0. Database Connectivity Check
    const probeClient = await pool.connect();
    probeClient.release();
    console.log('🔗 PostgreSQL live connection established at localhost:5432.');

    // 1. Forged Client Safety Decision (Unissued Token) -> Must be 404
    console.log('\n🔐 1. Verifying Authorization Provenance (Rejection of Forged Unissued Token)...');
    const forgedClient = await pool.connect();
    let forgedRejected = false;
    try {
      await forgedClient.query('BEGIN;');
      await safetyAuthorizationService.verifyAndConsumeTransactional(forgedClient, {
        decisionId: `SD-FORGED-${crypto.randomUUID()}`,
        actualCommandPayload: { orderId: 'ord-101', cancellationReason: 'Tampered reason' },
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: legitimateDoctor
      });
      await forgedClient.query('COMMIT;');
    } catch (err) {
      if (err.code === 'SAFETY_DECISION_NOT_FOUND' && err.statusCode === 404) {
        forgedRejected = true;
      }
      await forgedClient.query('ROLLBACK;');
    } finally {
      forgedClient.release();
    }
    assert(forgedRejected, 'Client-manufactured forged token strictly rejected with 404 SAFETY_DECISION_NOT_FOUND');

    // 2. Server-Side Trusted Issuance -> Must be ISSUED in Database
    console.log('\n🏛️  2. Verifying Trusted Server-Side Issuance & RFC 8785 Canonical Hashing...');
    const issuerClient = await pool.connect();
    const payload = { orderId: 'ord-adv-001', cancellationReason: 'Instruksi DPJP resmi' };
    let issued;
    try {
      issued = await safetyAuthorizationService.issueSafetyDecision(issuerClient, {
        actor: legitimateDoctor,
        patientId: testPatientId,
        encounterId: testEncounterId,
        action: 'CPOE_ORDER_CANCEL',
        justification: payload.cancellationReason,
        targetPayload: payload,
        tenantId: defaultTenantId
      });
    } finally {
      issuerClient.release();
    }
    assert(issued && issued.status === 'ISSUED' && issued.commandHash.length === 64, 'Server-issued Safety Decision created in database with canonical RFC 8785 SHA-256 hash');

    // 3. Payload Tampering Detection -> Must be 400
    console.log('\n🛡️  3. Verifying Cryptographic Payload Tampering Detection in Transit...');
    const tamperClient = await pool.connect();
    let tamperRejected = false;
    try {
      await tamperClient.query('BEGIN;');
      await safetyAuthorizationService.verifyAndConsumeTransactional(tamperClient, {
        decisionId: issued.decisionId,
        actualCommandPayload: { orderId: 'ord-adv-001', cancellationReason: 'Hacked reason in transit' },
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: legitimateDoctor
      });
      await tamperClient.query('COMMIT;');
    } catch (err) {
      if (err.code === 'SAFETY_COMMAND_HASH_MISMATCH' && err.statusCode === 400) {
        tamperRejected = true;
      }
      await tamperClient.query('ROLLBACK;');
    } finally {
      tamperClient.release();
    }
    assert(tamperRejected, 'Payload tampering in transit strictly blocked with 400 SAFETY_COMMAND_HASH_MISMATCH');

    // 4. Actor Impersonation Detection -> Must be 403
    console.log('\n👤 4. Verifying Actor Accountability & Impersonation Defense...');
    const actorClient = await pool.connect();
    let impersonationRejected = false;
    try {
      await actorClient.query('BEGIN;');
      await safetyAuthorizationService.verifyAndConsumeTransactional(actorClient, {
        decisionId: issued.decisionId,
        actualCommandPayload: payload,
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: rogueImpersonator
      });
      await actorClient.query('COMMIT;');
    } catch (err) {
      if (err.code === 'SAFETY_ACTOR_MISMATCH' && err.statusCode === 403) {
        impersonationRejected = true;
      }
      await actorClient.query('ROLLBACK;');
    } finally {
      actorClient.release();
    }
    assert(impersonationRejected, 'Actor impersonation strictly blocked with 403 SAFETY_ACTOR_MISMATCH');

    // 5. Transaction Rollback Invariance (Token Recovery)
    console.log('\n🔄 5. Verifying Transactional Rollback Invariance (Token Recovery)...');
    const rbClientA = await pool.connect();
    try {
      await rbClientA.query('BEGIN;');
      await safetyAuthorizationService.verifyAndConsumeTransactional(rbClientA, {
        decisionId: issued.decisionId,
        actualCommandPayload: payload,
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: legitimateDoctor
      });
      // Simulate crash: Rollback
      await rbClientA.query('ROLLBACK;');
    } finally {
      rbClientA.release();
    }

    const rbClientB = await pool.connect();
    let retrySucceeded = false;
    try {
      await rbClientB.query('BEGIN;');
      const res = await safetyAuthorizationService.verifyAndConsumeTransactional(rbClientB, {
        decisionId: issued.decisionId,
        actualCommandPayload: payload,
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: legitimateDoctor
      });
      await rbClientB.query('COMMIT;');
      retrySucceeded = res.isConsumed === true;
    } finally {
      rbClientB.release();
    }
    assert(retrySucceeded, 'PostgreSQL ACID Rollback preserved token status as ISSUED (Never burned prematurely)');

    // 6. Distributed Multi-Connection Replay Defense -> Must be 409
    console.log('\n🔒 6. Verifying Distributed Multi-Connection Anti-Replay Defense...');
    const replayClient = await pool.connect();
    let replayBlocked = false;
    try {
      await replayClient.query('BEGIN;');
      await safetyAuthorizationService.verifyAndConsumeTransactional(replayClient, {
        decisionId: issued.decisionId, // Already committed above!
        actualCommandPayload: payload,
        expectedAction: 'CPOE_ORDER_CANCEL',
        expectedPatientId: testPatientId,
        expectedEncounterId: testEncounterId,
        actor: legitimateDoctor
      });
      await replayClient.query('COMMIT;');
    } catch (err) {
      if (err.code === 'SAFETY_DECISION_ALREADY_CONSUMED' && err.statusCode === 409) {
        replayBlocked = true;
      }
      await replayClient.query('ROLLBACK;');
    } finally {
      replayClient.release();
    }
    assert(replayBlocked, 'Replay after commit strictly rejected via PostgreSQL safety_decision_registry (409)');

    // 7. Physical Native Column E5-F Audit Linkage & WORM Defense
    console.log('\n🏛️  7. Verifying Physical Native Column Audit Linkage & WORM Defense...');
    const auditClient = await pool.connect();
    try {
      const patRes = await auditClient.query('SELECT id FROM master_patients LIMIT 1;');
      const physicalPatientId = patRes.rows.length > 0 ? patRes.rows[0].id : null;

      const auditId = crypto.randomUUID();
      const directDecisionId = `SD-NATIVE-${crypto.randomUUID()}`;
      const directCorrId = `CORR-NATIVE-${Date.now()}`;

      const validSigHash = crypto.createHash('sha256').update('NATIVE_PROOF_' + auditId).digest('hex');

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
        auditId, legitimateDoctor.userId, legitimateDoctor.fullName, legitimateDoctor.role, '127.0.0.1',
        'OVERRIDE', 'CPOE_ORDER', 'ord-adv-001', physicalPatientId,
        'Native E5-F Column Audit Verification', validSigHash, directDecisionId, directCorrId
      ]);

      const auditCheck = await auditClient.query(
        'SELECT id, decision_id, correlation_id FROM universal_audit_logs WHERE id = $1;',
        [auditId]
      );

      assert(
        auditCheck.rowCount === 1 &&
        auditCheck.rows[0].decision_id === directDecisionId &&
        auditCheck.rows[0].correlation_id === directCorrId,
        'First-class physical columns decision_id and correlation_id verified in live PostgreSQL universal_audit_logs'
      );

      // Verify WORM protection on native audit row
      let wormBlocked = false;
      try {
        await auditClient.query('UPDATE universal_audit_logs SET decision_id = $1 WHERE id = $2;', ['TAMPERED', auditId]);
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
  console.log(`🏁 ZERO-TRUST ADVERSARIAL SAFETY AUDIT COMPLETED`);
  console.log(`   Passed : ${passed}`);
  console.log(`   Failed : ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdversarialProof();
