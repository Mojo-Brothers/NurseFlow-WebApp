/**
 * NurseFlow Enterprise HIS 2026 — Phase D0.5 Physical PostgreSQL E5-F Evidence Verifier
 * 
 * Physically proves:
 * 1. Physical database connection to PostgreSQL (nurseflow_enterprise_his).
 * 2. Real insertion of an authorized clinical safety override into universal_audit_logs with X-Correlation-ID.
 * 3. Physical query verification (SELECT) confirming row persistence and reason preservation.
 * 4. WORM protection verification: Attempting UPDATE on the audit row MUST be rejected by prevent_audit_log_modification() trigger.
 * 5. WORM protection verification: Attempting DELETE on the audit row MUST be rejected by prevent_audit_log_modification() trigger.
 * 6. Real Consumer AbortController & State Commit verification.
 */

import crypto from 'crypto';
import { pool } from '../server/db/postgresPool.js';
import { 
  assertClinicalContextLock,
  createSafetyOverridePayload,
  clinicalWorkspaceManager,
  ClinicalExecutionContext
} from '../src/core/clinicalRuntimeSafetyContract.js';

import { soapEngineService } from '../src/modules/emr/services/soapEngine.service.js';
import { universalOrderEngineService } from '../src/modules/orders/services/universalOrderEngine.service.js';
import { laboratoryEngineService } from '../src/modules/orders/services/laboratoryEngine.service.js';
import { pharmacyEngineService } from '../src/modules/orders/services/pharmacyEngine.service.js';
import { radiologyEngineService } from '../src/modules/orders/services/radiologyEngine.service.js';
import { submitTriage } from '../src/modules/triage/services/triage.service.js';
import { createBill } from '../src/modules/billing/services/billing.service.js';
import { assignBed } from '../src/modules/ward/services/bed.service.js';
import { saveClinicalRecord, saveSoapNote } from '../src/modules/emr/services/emr.service.js';
import { saveSurgicalChecklist } from '../src/modules/emr/services/surgery.service.js';
import { emarService } from '../src/core/services/eMARService.js';
import { operatingTheatreEngineService } from '../src/modules/surgery/services/operatingTheatreEngine.service.js';

async function runVerification() {
  console.log('\n================================================================');
  console.log('🏛️  NURSEFLOW PHASE D0.5: PHYSICAL POSTGRESQL E5-F EVIDENCE AUDIT');
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

  // -------------------------------------------------------------------------
  // 1. RECONCILED INVENTORY AUDIT (ALL 9 CONSUMER MODULES)
  // -------------------------------------------------------------------------
  console.log('📦 1. Verifying Complete 9-Module Mutation Consumer Inventory (Fail-Closed)...');

  const testConsumers = [
    { name: '1. SOAP Engine (soapEngineService.recordSoapNote)', fn: () => soapEngineService.recordSoapNote({ patientId: null }) },
    { name: '2. Clinical Records (emr.service.saveClinicalRecord)', fn: () => saveClinicalRecord({ patientId: null, encounterId: 'E1' }) },
    { name: '3. CPOE Orders (universalOrderEngineService.createOrder)', fn: () => universalOrderEngineService.createOrder({ patientId: null }) },
    { name: '4. eMAR Service (emarService.createEMARRecord)', fn: () => emarService.createEMARRecord({ patientId: null }) },
    { name: '5. LIS Orders (laboratoryEngineService.createLabOrder)', fn: () => laboratoryEngineService.createLabOrder({ patientId: null }) },
    { name: '6. RIS Orders (radiologyEngineService.createRadiologyOrder)', fn: () => radiologyEngineService.createRadiologyOrder({ patientId: null }) },
    { name: '7. Surgery Checklist (surgery.service.saveSurgicalChecklist)', fn: () => saveSurgicalChecklist({ patientId: null, encounterId: 'E1' }) },
    { name: '8. Triage Assessment (triage.service.submitTriage)', fn: () => submitTriage({ patientId: null, encounterId: 'E1' }) },
    { name: '9. Billing Invoicing (billing.service.createBill)', fn: () => createBill({ patientId: null, encounterId: 'E1' }) },
    { name: '10. Bed ADT Assignment (bed.service.assignBed)', fn: () => assignBed('B1', 'E1', null) }
  ];

  for (const consumer of testConsumers) {
    try {
      await consumer.fn();
      assert(false, `${consumer.name} SHOULD HAVE FAILED CLOSED ON NULL PATIENT`);
    } catch (err) {
      const isLockError = err.name === 'ClinicalContextLockError' || err.code === 'CLINICAL_CONTEXT_LOCK_FAILURE';
      assert(isLockError, `${consumer.name} strictly rejected null context with fail-closed lock`);
    }
  }

  // -------------------------------------------------------------------------
  // 2. REAL WORKSPACE ABORTCONTROLLER & STATE COMMIT TEST
  // -------------------------------------------------------------------------
  console.log('\n⚡ 2. Verifying Real Workspace AbortController & State Commit Shield...');

  const ctxA = clinicalWorkspaceManager.switchPatient('PAT-ALPHA-REAL', 'ENC-ALPHA-REAL');
  let stateCommitted = false;

  const asyncFetchA = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try {
        ctxA.validateResponseLineage({ patientId: 'PAT-ALPHA-REAL', encounterId: 'ENC-ALPHA-REAL' });
        stateCommitted = true;
        resolve('OK');
      } catch (err) {
        reject(err);
      }
    }, 120);

    ctxA.signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('ABORTED_BY_PATIENT_SWITCH'));
    });
  });

  // Switch to Patient B at 60ms
  await new Promise(r => setTimeout(r, 60));
  const ctxB = clinicalWorkspaceManager.switchPatient('PAT-BETA-REAL', 'ENC-BETA-REAL');

  try {
    await asyncFetchA;
    assert(false, 'In-flight fetch for Patient A should have been aborted on patient switch');
  } catch (err) {
    assert(err.message === 'ABORTED_BY_PATIENT_SWITCH', 'Patient A fetch was cleanly cancelled via AbortController');
  }

  assert(stateCommitted === false, 'React state commit for Patient A was strictly prevented (0 cross-patient contamination)');
  assert(ctxB.patientId === 'PAT-BETA-REAL', 'Active workspace cleanly transitioned to Patient B');

  // -------------------------------------------------------------------------
  // 3. PHYSICAL POSTGRESQL E5-F AUDIT TRAIL & WORM VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n🗄️  3. Verifying Physical PostgreSQL E5-F Audit Trail & WORM Immutability...');

  const client = await pool.connect();
  try {
    // 3.1 Fetch a valid master patient from PostgreSQL
    const patRes = await client.query('SELECT id FROM master_patients LIMIT 1');
    let realPatientId = patRes.rows[0]?.id;

    if (!realPatientId) {
      // Create a test patient if not present
      const insertPat = await client.query(`
        INSERT INTO master_patients (mrn, full_name, date_of_birth, gender, status)
        VALUES ('MRN-D05-TEST', 'Pasien Uji E5F', '1990-01-01', 'MALE', 'ACTIVE')
        RETURNING id
      `);
      realPatientId = insertPat.rows[0].id;
    }

    const testCorrelationId = `CORR-E5F-PHYSICAL-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const overridePayload = createSafetyOverridePayload({
      safetyCode: 'ALLERGY_HARD_STOP',
      overrideReason: 'Telaah klinis darurat DPJP: Anafilaksis terdokumentasi ringan 10 tahun lalu, antibiotik alternatif tidak sensitif pada kultur darah.',
      witnessId: 'NURSE-WITNESS-909',
      correlationId: testCorrelationId,
      patientId: realPatientId,
      encounterId: null,
      actorId: 'DOC-SPPD-101',
      actorRole: 'ROLE_DOCTOR_DPJP',
      originalPayload: { medicationCode: 'MED-PENICILLIN', dose: '1000mg IV' }
    });

    const sigHash = crypto.createHash('sha256').update(JSON.stringify(overridePayload)).digest('hex');

    // 3.2 Physical INSERT into universal_audit_logs
    const insertRes = await client.query(`
      INSERT INTO universal_audit_logs (
        actor_id, actor_name, actor_role, client_ip, action_type,
        resource_type, resource_id, patient_id, before_state, after_state,
        reason_for_action, signature_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, created_at
    `, [
      overridePayload.actorId,
      'dr. Spesialis Penyakit Dalam',
      overridePayload.actorRole,
      '127.0.0.1',
      'OVERRIDE',
      'CLINICAL_MEDICATION_ORDER',
      testCorrelationId,
      realPatientId,
      JSON.stringify(overridePayload.originalPayloadSnapshot),
      JSON.stringify({ overrideReason: overridePayload.overrideReason, witnessId: overridePayload.witnessId, correlationId: testCorrelationId }),
      overridePayload.overrideReason,
      sigHash
    ]);

    const auditRowId = insertRes.rows[0].id;
    assert(auditRowId !== undefined, `Physical audit record created with ID [${auditRowId}] and correlation [${testCorrelationId}]`);

    // 3.3 Physical SELECT verification
    const selectRes = await client.query('SELECT * FROM universal_audit_logs WHERE id = $1', [auditRowId]);
    assert(selectRes.rows.length === 1, 'Audit record physically exists in PostgreSQL table universal_audit_logs');
    assert(selectRes.rows[0].reason_for_action.includes('Anafilaksis terdokumentasi ringan'), 'Override justification reason is physically stored without truncation');
    assert(selectRes.rows[0].resource_id === testCorrelationId, 'Physical row matches exact X-Correlation-ID');

    // 3.4 WORM Immutability Test 1: Attempt illegal UPDATE
    let updateBlocked = false;
    try {
      await client.query('UPDATE universal_audit_logs SET reason_for_action = $1 WHERE id = $2', [
        'TAMPERED_REASON',
        auditRowId
      ]);
    } catch (err) {
      if (err.message.includes('JCI AUDIT INTEGRITY VIOLATION') || err.message.includes('strictly immutable')) {
        updateBlocked = true;
      }
    }
    assert(updateBlocked, 'PostgreSQL WORM Trigger trg_immutable_audit_logs strictly blocked UPDATE modification');

    // 3.5 WORM Immutability Test 2: Attempt illegal DELETE
    let deleteBlocked = false;
    try {
      await client.query('DELETE FROM universal_audit_logs WHERE id = $1', [auditRowId]);
    } catch (err) {
      if (err.message.includes('JCI AUDIT INTEGRITY VIOLATION') || err.message.includes('strictly immutable')) {
        deleteBlocked = true;
      }
    }
    assert(deleteBlocked, 'PostgreSQL WORM Trigger trg_immutable_audit_logs strictly blocked DELETE modification');

  } finally {
    client.release();
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`🏁 PHYSICAL E5-F EVIDENCE AUDIT COMPLETED`);
  console.log(`   Passed : ${passed}`);
  console.log(`   Failed : ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
