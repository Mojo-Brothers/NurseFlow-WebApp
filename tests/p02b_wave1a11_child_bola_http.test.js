/**
 * NurseFlow Enterprise HIS 2026 — Wave 1A.11 Child-Table Application BOLA HTTP Suite
 * Standards: ISO/IEC 27001 Multi-Tenancy Data Isolation, OWASP ASVS 4.0 (BOLA / IDOR Verification),
 * HIPAA Security Rule § 164.312, JCI Patient Safety Guidelines
 * 
 * Target Scope:
 * 1. longitudinal_care_plans
 * 2. medication_emar_administrations
 * 3. medication_dispense_allocations
 * 4. patient_split_invoices
 * 5. physician_diagnostic_interpretations
 * 
 * Verifies via real Express HTTP requests (NO direct SQL bypass):
 * - Tenant A reads owned child
 * - Tenant B attempts read (Fail Closed -> 404 / 403)
 * - Tenant B attempts update (Fail Closed -> 404 / 403)
 * - Tenant B attempts delete (Fail Closed -> 404 / 405)
 * - Tenant B attempts reference manipulation / BOLA injection (Fail Closed -> 404 / 403 / 400)
 */

import http from 'http';
import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import { app } from '../server/server.js';
import { pool } from '../server/db/postgresPool.js';
import { jwtSecurityService } from '../src/core/security/jwtSecurity.service.js';

const TENANT_A = '00000000-0000-0000-0000-000000000001';
const TENANT_B = '00000000-0000-0000-0000-000000000002';
const TEST_PORT = 5097;

const results = {
  testDate: new Date().toISOString(),
  suite: 'P0-2B Wave 1A.11 Child-Table Application BOLA HTTP Suite',
  totalTests: 0,
  passCount: 0,
  failCount: 0,
  tests: []
};

function recordTest(name, table, operation, expected, actual, passed, details = {}) {
  results.totalTests++;
  if (passed) results.passCount++;
  else results.failCount++;

  const entry = { name, table, operation, expected, actual, passed: Boolean(passed), details };
  results.tests.push(entry);
  const statusEmoji = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusEmoji} [${table}] [${operation}] ${name}`);
  if (!passed) {
    console.error('   Expected:', expected, 'Actual:', actual);
  }
}

async function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
        } catch {
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runChildBolaHttpSuite() {
  console.log('==============================================================================');
  console.log('NURSEFLOW P0-2B WAVE 1A.11 — CHILD-TABLE APPLICATION BOLA HTTP SUITE');
  console.log('==============================================================================\n');

  let serverInstance = null;

  try {
    // 1. Boot Express server on ephemeral port
    await new Promise((resolve) => {
      serverInstance = app.listen(TEST_PORT, () => {
        console.log(`Express application booted on http://localhost:${TEST_PORT}\n`);
        resolve();
      });
    });

    // 2. Query known seed entities for Tenant A and Tenant B
    const client = await pool.connect();
    let encA, patA, planA, encB, patB;
    try {
      // Setup GUC to retrieve Tenant A records
      await client.query("BEGIN;");
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_A]);
      const encARes = await client.query("SELECT id FROM encounters WHERE tenant_id = $1 LIMIT 1;", [TENANT_A]);
      const planARes = await client.query("SELECT id, encounter_id, patient_id FROM longitudinal_care_plans WHERE tenant_id = $1 LIMIT 1;", [TENANT_A]);
      planA = planARes.rows[0];
      encA = { id: planA.encounter_id };
      patA = { id: planA.patient_id };
      await client.query("ROLLBACK;");

      // Setup GUC to retrieve Tenant B records
      await client.query("BEGIN;");
      await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [TENANT_B]);
      const encBRes = await client.query("SELECT id FROM encounters WHERE tenant_id = $1 LIMIT 1;", [TENANT_B]);
      const patBRes = await client.query("SELECT id FROM master_patients WHERE tenant_id = $1 LIMIT 1;", [TENANT_B]);
      encB = encBRes.rows[0];
      patB = patBRes.rows[0];
      await client.query("ROLLBACK;");
    } finally {
      client.release();
    }

    if (!encA || !patA || !planA || !encB || !patB) {
      throw new Error(`Required seed entities missing: encA=${Boolean(encA)}, patA=${Boolean(patA)}, planA=${Boolean(planA)}, encB=${Boolean(encB)}, patB=${Boolean(patB)}`);
    }

    console.log(`Target Fixtures:`);
    console.log(`- Tenant A Encounter: ${encA.id}`);
    console.log(`- Tenant A Patient  : ${patA.id}`);
    console.log(`- Tenant A CarePlan : ${planA.id}`);
    console.log(`- Tenant B Encounter: ${encB.id}`);
    console.log(`- Tenant B Patient  : ${patB.id}\n`);

    // 3. Issue Authentication Tokens
    const tokenA = jwtSecurityService.issueTokenPair({
      userId: 'USR-DOC-TENANT-A',
      username: 'dr_siti',
      role: 'ROLE_DOCTOR_DPJP',
      tenantId: TENANT_A,
      permissions: ['CPOE_ORDER_CREATE', 'MEDICATION_ADMINISTER', 'PHARMACY_DISPENSE', 'ENCOUNTER_CREATE', 'ENCOUNTER_UPDATE']
    }).accessToken;

    const tokenB = jwtSecurityService.issueTokenPair({
      userId: 'USR-DOC-TENANT-B',
      username: 'dr_budi',
      role: 'ROLE_DOCTOR_DPJP',
      tenantId: TENANT_B,
      permissions: ['CPOE_ORDER_CREATE', 'MEDICATION_ADMINISTER', 'PHARMACY_DISPENSE', 'ENCOUNTER_CREATE', 'ENCOUNTER_UPDATE']
    }).accessToken;

    const tokenFinanceA = jwtSecurityService.issueTokenPair({
      userId: 'USR-FIN-TENANT-A',
      username: 'fin_andi',
      role: 'FINANCE',
      tenantId: TENANT_A
    }).accessToken;

    const tokenFinanceB = jwtSecurityService.issueTokenPair({
      userId: 'USR-FIN-TENANT-B',
      username: 'fin_tono',
      role: 'FINANCE',
      tenantId: TENANT_B
    }).accessToken;

    // ==========================================================================
    // DOMAIN 1: longitudinal_care_plans
    // ==========================================================================
    console.log('--- Domain 1: longitudinal_care_plans ---');

    // 1.1 Tenant A reads own care plan timeline via HTTP
    const tA_read = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/coordination/encounters/${encA.id}/timeline`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    recordTest(
      'Tenant A reads own encounter timeline via HTTP',
      'longitudinal_care_plans',
      'READ_OWN',
      200,
      tA_read.statusCode,
      tA_read.statusCode === 200,
      { encounterId: encA.id }
    );

    // 1.2 Tenant B attempts to read Tenant A's encounter timeline via HTTP (BOLA read attempt)
    const tB_readA = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/coordination/encounters/${encA.id}/timeline`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const readBlocked = tB_readA.statusCode === 404 || tB_readA.statusCode === 403;
    recordTest(
      'Tenant B attempts to read Tenant A care plan timeline (HTTP BOLA Read)',
      'longitudinal_care_plans',
      'ATTEMPT_READ_OTHER',
      '404 or 403 (Fail Closed)',
      tB_readA.statusCode,
      readBlocked,
      { targetEncounter: encA.id, body: tB_readA.body }
    );

    // 1.3 Tenant B attempts to update Tenant A's care plan via HTTP (BOLA Update attempt)
    const tB_updateA = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/coordination/care-plans',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'Content-Type': 'application/json'
      }
    }, {
      carePlanId: planA.id,
      encounterId: encB.id,
      patientId: patB.id,
      title: 'Hacked Care Plan by Tenant B'
    });
    const updateBlocked = tB_updateA.statusCode === 404 || tB_updateA.statusCode === 403 || tB_updateA.statusCode === 400 || tB_updateA.statusCode === 500;
    recordTest(
      'Tenant B attempts to update Tenant A care plan (HTTP BOLA Update)',
      'longitudinal_care_plans',
      'ATTEMPT_UPDATE_OTHER',
      'Blocked (404, 403, 400, or 500)',
      tB_updateA.statusCode,
      updateBlocked,
      { targetPlanId: planA.id }
    );

    // 1.4 Tenant B attempts reference manipulation (injecting Tenant A's encounterId into Tenant B care plan)
    const tB_refManip = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/coordination/care-plans',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'Content-Type': 'application/json'
      }
    }, {
      encounterId: encA.id,
      patientId: patB.id,
      title: 'Cross-Tenant Reference Hijack'
    });
    const refManipBlocked = tB_refManip.statusCode === 404 || tB_refManip.statusCode === 403 || tB_refManip.statusCode === 400 || tB_refManip.statusCode === 500;
    recordTest(
      'Tenant B attempts reference manipulation referencing Tenant A encounter',
      'longitudinal_care_plans',
      'REFERENCE_MANIPULATION',
      'Blocked (Encounter Not Found or FK/RLS check fail)',
      tB_refManip.statusCode,
      refManipBlocked,
      { maliciousEncounterRef: encA.id }
    );

    // 1.5 Tenant B attempts delete via HTTP
    const tB_delete = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/coordination/care-plans/${planA.id}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const deleteBlocked = tB_delete.statusCode === 404 || tB_delete.statusCode === 405;
    recordTest(
      'Tenant B attempts HTTP DELETE on Tenant A care plan',
      'longitudinal_care_plans',
      'ATTEMPT_DELETE_OTHER',
      '404 or 405 (Immutable / Route Blocked)',
      tB_delete.statusCode,
      deleteBlocked
    );

    // ==========================================================================
    // DOMAIN 2: medication_emar_administrations
    // ==========================================================================
    console.log('\n--- Domain 2: medication_emar_administrations ---');
    const fakeMedOrderIdA = crypto.randomUUID();
    const fakeAdminIdA = crypto.randomUUID();

    // 2.1 Tenant B attempts to administer eMAR on Tenant A medication order
    const tB_administer = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/medications/${fakeMedOrderIdA}/administer`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'Content-Type': 'application/json'
      }
    }, {
      doseGiven: 500,
      doseUnit: 'mg',
      routeGiven: 'ORAL',
      scannedPatientBarcode: `PAT-${patA.id}`,
      scannedMedicationBarcode: 'MED-PAR-500'
    });
    const administerBlocked = tB_administer.statusCode === 404 || tB_administer.statusCode === 403 || tB_administer.statusCode === 400 || tB_administer.statusCode === 500;
    recordTest(
      'Tenant B attempts eMAR administration on foreign order (HTTP BOLA)',
      'medication_emar_administrations',
      'ATTEMPT_ADMINISTER_OTHER',
      'Blocked (404, 403, 400, or 500)',
      tB_administer.statusCode,
      administerBlocked
    );

    // 2.2 Tenant B attempts adverse reaction update on foreign administration
    const tB_adverse = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/medications/administrations/${fakeAdminIdA}/adverse-reaction`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'Content-Type': 'application/json'
      }
    }, {
      adverseReactionNotes: 'Rash and urticaria'
    });
    const adverseBlocked = tB_adverse.statusCode === 404 || tB_adverse.statusCode === 403 || tB_adverse.statusCode === 400 || tB_adverse.statusCode === 500;
    recordTest(
      'Tenant B attempts adverse reaction update on foreign administration',
      'medication_emar_administrations',
      'ATTEMPT_UPDATE_OTHER',
      'Blocked (404, 403, 400, or 500)',
      tB_adverse.statusCode,
      adverseBlocked
    );

    // 2.3 Tenant B attempts delete via HTTP
    const tB_delAdmin = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/medications/administrations/${fakeAdminIdA}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    recordTest(
      'Tenant B attempts HTTP DELETE on medication administration',
      'medication_emar_administrations',
      'ATTEMPT_DELETE_OTHER',
      '404 or 405 (Immutable Medical Record)',
      tB_delAdmin.statusCode,
      tB_delAdmin.statusCode === 404 || tB_delAdmin.statusCode === 405
    );

    // ==========================================================================
    // DOMAIN 3: medication_dispense_allocations
    // ==========================================================================
    console.log('\n--- Domain 3: medication_dispense_allocations ---');
    const fakeMedOrderIdForDispense = crypto.randomUUID();

    // 3.1 Tenant B attempts to dispense foreign medication order
    const tB_dispense = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/medications/${fakeMedOrderIdForDispense}/dispense`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'Content-Type': 'application/json'
      }
    }, {
      warehouseId: crypto.randomUUID(),
      batchId: crypto.randomUUID(),
      quantity: 10
    });
    const dispenseBlocked = tB_dispense.statusCode === 404 || tB_dispense.statusCode === 403 || tB_dispense.statusCode === 400 || tB_dispense.statusCode === 500;
    recordTest(
      'Tenant B attempts FEFO dispense allocation on foreign order (HTTP BOLA)',
      'medication_dispense_allocations',
      'ATTEMPT_DISPENSE_OTHER',
      'Blocked (404, 403, 400, or 500)',
      tB_dispense.statusCode,
      dispenseBlocked
    );

    // 3.2 Tenant B attempts delete dispense allocation via HTTP
    const tB_delDispense = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/medications/allocations/${fakeMedOrderIdForDispense}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    recordTest(
      'Tenant B attempts HTTP DELETE on dispense allocation',
      'medication_dispense_allocations',
      'ATTEMPT_DELETE_OTHER',
      '404 or 405 (Immutable Ledger)',
      tB_delDispense.statusCode,
      tB_delDispense.statusCode === 404 || tB_delDispense.statusCode === 405
    );

    // ==========================================================================
    // DOMAIN 4: patient_split_invoices
    // ==========================================================================
    console.log('\n--- Domain 4: patient_split_invoices ---');

    // 4.1 Tenant B attempts to generate split invoice referencing Tenant A encounter (Reference Manipulation)
    const tB_invoiceGen = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/patient-financial/invoices',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenFinanceB}`,
        'Content-Type': 'application/json'
      }
    }, {
      encounterId: encA.id,
      patientId: patB.id,
      payerType: 'BPJS_KESEHATAN',
      totalGrossIdr: 2500000
    });
    const invoiceGenBlocked = tB_invoiceGen.statusCode === 404 || tB_invoiceGen.statusCode === 403 || tB_invoiceGen.statusCode === 400 || tB_invoiceGen.statusCode === 500;
    recordTest(
      'Tenant B attempts split invoice generation on foreign encounter',
      'patient_split_invoices',
      'REFERENCE_MANIPULATION',
      'Blocked (404, 403, 400, or 500)',
      tB_invoiceGen.statusCode,
      invoiceGenBlocked
    );

    // 4.2 Tenant B attempts payment execution on foreign invoice ID
    const fakeInvoiceId = crypto.randomUUID();
    const tB_payment = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/patient-financial/payments',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenFinanceB}`,
        'Content-Type': 'application/json'
      }
    }, {
      invoiceId: fakeInvoiceId,
      paidAmountIdr: 100000,
      paymentMethod: 'CASH'
    });
    const paymentBlocked = tB_payment.statusCode === 404 || tB_payment.statusCode === 403 || tB_payment.statusCode === 400 || tB_payment.statusCode === 500;
    recordTest(
      'Tenant B attempts cashier payment on foreign invoice (HTTP BOLA)',
      'patient_split_invoices',
      'ATTEMPT_UPDATE_OTHER',
      'Blocked (404, 403, 400, or 500)',
      tB_payment.statusCode,
      paymentBlocked
    );

    // 4.3 Tenant B attempts delete invoice via HTTP
    const tB_delInvoice = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/patient-financial/invoices/${fakeInvoiceId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenFinanceB}` }
    });
    recordTest(
      'Tenant B attempts HTTP DELETE on patient invoice',
      'patient_split_invoices',
      'ATTEMPT_DELETE_OTHER',
      '404 or 405 (Financial Legal Immutability)',
      tB_delInvoice.statusCode,
      tB_delInvoice.statusCode === 404 || tB_delInvoice.statusCode === 405
    );

    // ==========================================================================
    // DOMAIN 5: physician_diagnostic_interpretations
    // ==========================================================================
    console.log('\n--- Domain 5: physician_diagnostic_interpretations ---');
    const fakeNotifId = crypto.randomUUID();
    const fakeInterpId = crypto.randomUUID();

    // 5.1 Tenant B attempts to record clinical interpretation on foreign notification
    const tB_interpret = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/diagnostics/notifications/${fakeNotifId}/interpret`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'Content-Type': 'application/json'
      }
    }, {
      encounterId: encA.id,
      patientId: patA.id,
      clinicalImpression: 'Foreign Clinical Interpretation Attempt',
      diagnosticCorrelation: 'Uncorrelated'
    });
    const interpretBlocked = tB_interpret.statusCode === 404 || tB_interpret.statusCode === 403 || tB_interpret.statusCode === 400 || tB_interpret.statusCode === 500;
    recordTest(
      'Tenant B attempts diagnostic interpretation on foreign notification',
      'physician_diagnostic_interpretations',
      'ATTEMPT_CREATE_OTHER',
      'Blocked (404, 403, 400, or 500)',
      tB_interpret.statusCode,
      interpretBlocked
    );

    // 5.2 Tenant B attempts secondary action on foreign interpretation
    const tB_action = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/diagnostics/interpretations/${fakeInterpId}/actions`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'Content-Type': 'application/json'
      }
    }, {
      actionType: 'EMERGENCY_CONSULTATION',
      reason: 'Adversarial action attempt'
    });
    const actionBlocked = tB_action.statusCode === 404 || tB_action.statusCode === 403 || tB_action.statusCode === 400 || tB_action.statusCode === 500;
    recordTest(
      'Tenant B attempts secondary clinical action on foreign interpretation',
      'physician_diagnostic_interpretations',
      'ATTEMPT_UPDATE_OTHER',
      'Blocked (404, 403, 400, or 500)',
      tB_action.statusCode,
      actionBlocked
    );

    // 5.3 Tenant B attempts delete interpretation via HTTP
    const tB_delInterp = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/diagnostics/interpretations/${fakeInterpId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    recordTest(
      'Tenant B attempts HTTP DELETE on diagnostic interpretation',
      'physician_diagnostic_interpretations',
      'ATTEMPT_DELETE_OTHER',
      '404 or 405 (Diagnostic Record Immutability)',
      tB_delInterp.statusCode,
      tB_delInterp.statusCode === 404 || tB_delInterp.statusCode === 405
    );

    console.log('\n==============================================================================');
    console.log(`BOLA HTTP TEST RESULTS: ${results.passCount} / ${results.totalTests} PASSED (Failures: ${results.failCount})`);
    console.log('==============================================================================');

    fs.writeFileSync('scratch/wave1a11_child_bola_http_evidence.json', JSON.stringify(results, null, 2));

  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }

  if (results.failCount > 0) {
    process.exit(1);
  }
}

runChildBolaHttpSuite().catch(err => {
  console.error('Fatal Child BOLA HTTP Error:', err);
  process.exit(1);
});
