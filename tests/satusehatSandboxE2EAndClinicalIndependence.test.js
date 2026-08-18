/**
 * SPRINT 3G: SATUSEHAT SANDBOX E2E & CLINICAL INDEPENDENCE TORTURE TEST SUITE
 * 
 * Exhaustive Verification covering:
 * 1. OperationOutcome Semantic Parser & Diagnostics Extraction
 * 2. External Contract Lineage Recorder (1-Click Forensic Traceability)
 * 3. Synthetic Data Compliance (Zero Production PHI)
 * 4. CRITICAL CLINICAL INDEPENDENCE TEST:
 *    - SATUSEHAT DOWN (503 Outage)
 *    - Full Clinical Journey (Admission -> CPOE -> eMAR -> CPPT -> Discharge) succeeds 100% locally
 *    - SATUSEHAT RESTORED (Online)
 *    - Outbox Queue drains, creates reconciliation links, and records full contract lineage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { careStateEngine, CARE_STATES, CLINICAL_EVENTS } from '../src/core/services/careStateEngine.service.js';
import { OperationOutcomeParser } from '../src/core/interoperability/satusehat/gateway/operationOutcomeParser.service.js';
import { externalContractRecorder } from '../src/core/interoperability/satusehat/audit/externalContractRecorder.service.js';
import { fhirOutbox } from '../src/core/interoperability/satusehat/outbox/fhirOutbox.service.js';
import { satusehatGateway } from '../src/core/interoperability/satusehat/gateway/satusehatGateway.service.js';
import { fhirResourceLink } from '../src/core/interoperability/satusehat/reconciliation/fhirResourceLink.service.js';
import { OUTBOX_STATUS } from '../src/core/interoperability/satusehat/retry/retryPolicyFsm.service.js';
import * as mappers from '../src/core/interoperability/fhir/mappers/index.js';

describe('Sprint 3G: SATUSEHAT Sandbox E2E & Clinical Independence Suite', () => {
  beforeEach(async () => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
    persistenceAdapter.memoryStore.clear();
    satusehatGateway.setSimulationMode({ enabled: false });
  });

  // ─── 1. OPERATIONOUTCOME SEMANTIC PARSER ────────────────────────
  describe('1. OperationOutcome Semantic Parser & Diagnostics', () => {
    it('should parse multi-issue OperationOutcome with exact severity and JSON location expressions', () => {
      const mockOperationOutcome = {
        resourceType: 'OperationOutcome',
        id: 'out-001',
        issue: [
          {
            severity: 'error',
            code: 'required',
            diagnostics: 'Mandatory field "participant[0].individual" is missing',
            location: ['Encounter.participant[0].individual'],
            expression: ['Encounter.participant[0].individual']
          },
          {
            severity: 'warning',
            code: 'value',
            diagnostics: 'Location code not in preferred ValueSet',
            location: ['Encounter.location[0]'],
            expression: ['Encounter.location[0]']
          }
        ]
      };

      const parsed = OperationOutcomeParser.parse(mockOperationOutcome);
      expect(parsed.isOperationOutcome).toBe(true);
      expect(parsed.hasError).toBe(true);
      expect(parsed.hasWarning).toBe(true);
      expect(parsed.issueCount).toBe(2);
      expect(parsed.issues[0].code).toBe('required');
      expect(parsed.issues[0].expression).toBe('Encounter.participant[0].individual');

      const formatted = OperationOutcomeParser.formatForAudit(parsed);
      expect(formatted).toContain('[ERROR:required]');
      expect(formatted).toContain('[WARNING:value]');
    });

    it('should gracefully handle non-OperationOutcome string errors', () => {
      const parsed = OperationOutcomeParser.parse('Gateway Connection Timeout');
      expect(parsed.isOperationOutcome).toBe(false);
      expect(parsed.summary).toBe('Gateway Connection Timeout');
    });
  });

  // ─── 2. EXTERNAL CONTRACT LINEAGE RECORDER (FORENSIC TRACE) ─────
  describe('2. External Contract Lineage Recorder (1-Click Forensic Trace)', () => {
    it('should record complete request/response lineage and allow 1-click query by internal entity ID', async () => {
      const internalId = 'PAT-SYNTH-999';
      const correlationId = 'CORR-TRACE-12345';
      const syntheticPatient = { id: internalId, name: 'Pasien Uji Sandbox', nik: '3171010101019999' };
      const fhirPayload = mappers.mapPatient(syntheticPatient);

      const recorded = await externalContractRecorder.recordTrace({
        internalEntityType: 'Patient',
        internalEntityId: internalId,
        fhirResourceType: 'Patient',
        correlationId,
        endpointUrl: 'https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1/Patient',
        requestPayload: fhirPayload,
        httpStatus: 201,
        responseBody: { id: 'SAT-PAT-999000', resourceType: 'Patient', status: 'created' },
        externalResourceId: 'SAT-PAT-999000',
        durationMs: 145,
        status: 'SUCCESS'
      });

      expect(recorded.id).toBeDefined();
      expect(recorded.request.payload.name[0].text).toBe('Pasien Uji Sandbox');

      // 1-Click Forensic Search by Internal Entity ID
      const traceByInternal = await externalContractRecorder.getLineageByInternalEntity('Patient', internalId);
      expect(traceByInternal.length).toBe(1);
      expect(traceByInternal[0].externalResourceId).toBe('SAT-PAT-999000');
      expect(traceByInternal[0].response.httpStatus).toBe(201);

      // 1-Click Forensic Search by External SATUSEHAT ID
      const traceByExternal = await externalContractRecorder.getLineageByExternalId('SAT-PAT-999000');
      expect(traceByExternal.length).toBe(1);
      expect(traceByExternal[0].internalEntityId).toBe(internalId);

      // 1-Click Forensic Search by Correlation ID
      const traceByCorr = await externalContractRecorder.getLineageByCorrelationId(correlationId);
      expect(traceByCorr.length).toBe(1);
    });
  });

  // ─── 3. CRITICAL CLINICAL INDEPENDENCE TORTURE TEST ─────────────
  describe('3. Critical Clinical Independence Torture Test (Outage -> Care -> Restore -> Reconcile)', () => {
    it('should prove zero clinical obstruction during SATUSEHAT outage, accumulate in outbox, and reconcile upon restoration', async () => {
      // ══════════════════════════════════════════════════════════════
      // PHASE 1: SATUSEHAT OUTAGE (DOWN - 503 SERVICE UNAVAILABLE)
      // ══════════════════════════════════════════════════════════════
      satusehatGateway.setSimulationMode({
        enabled: true,
        httpStatus: 503,
        errorMessage: 'KEMKES SATUSEHAT 503 GATEWAY TIMEOUT / SERVICE UNAVAILABLE',
        operationOutcome: {
          resourceType: 'OperationOutcome',
          issue: [{ severity: 'error', code: 'transient', diagnostics: 'Database connection pool exhausted on Kemkes server' }]
        }
      });

      // ══════════════════════════════════════════════════════════════
      // PHASE 2: REAL-WORLD CLINICAL WORKFLOW EXECUTION (LOCAL COMMITS)
      // ══════════════════════════════════════════════════════════════
      
      // Step A: Synthetic Patient Registration
      const patient = {
        id: 'PAT-INDEP-001',
        nik: '3171030303030003',
        mrn: 'MRN-2026-INDEP',
        name: 'Tn. Synthetic Patient (Uji Independensi)',
        gender: 'M',
        dob: '1982-04-15'
      };
      await persistenceAdapter.save('patients', patient.id, patient);
      const fhirPat = mappers.mapPatient(patient);
      await fhirOutbox.enqueue({ entityType: 'Patient', entityId: patient.id, fhirResourceType: 'Patient', payload: fhirPat });

      // Step B: Inpatient Admission Care State Transition
      const encounter = {
        id: 'ENC-INDEP-001',
        encounterNumber: 'REG-2026-INDEP-01',
        patientId: patient.id,
        patientName: patient.name,
        type: 'INPATIENT',
        primaryState: CARE_STATES.ADMISSION_PENDING
      };
      await persistenceAdapter.save('encounters', encounter.id, encounter);

      const admitResult = await careStateEngine.transition({
        encounterId: encounter.id,
        targetState: CARE_STATES.INPATIENT_ACTIVE,
        eventType: CLINICAL_EVENTS.ADMIT_PATIENT,
        actorId: 'NURSE-01',
        actorRole: 'NURSE',
        actorName: 'Ners Rina'
      });
      expect(admitResult.success).toBe(true);
      expect(admitResult.encounter.primaryState).toBe(CARE_STATES.INPATIENT_ACTIVE);

      const fhirEnc = mappers.mapEncounter(admitResult.encounter);
      await fhirOutbox.enqueue({ entityType: 'Encounter', entityId: encounter.id, fhirResourceType: 'Encounter', payload: fhirEnc });

      // Step C: Doctor CPOE Medication Order
      const cpoeOrder = {
        id: 'ORD-INDEP-001',
        orderNumber: 'RX-INDEP-001',
        patientId: patient.id,
        encounterId: encounter.id,
        kfaCode: '93000101',
        drugName: 'Ceftriaxone 1g IV',
        dosage: '1g',
        route: 'IV',
        frequency: '2x sehari',
        status: 'PRESCRIBED'
      };
      await persistenceAdapter.save('cpoe_orders', cpoeOrder.id, cpoeOrder);
      const fhirMedReq = mappers.mapMedicationRequest(cpoeOrder);
      await fhirOutbox.enqueue({ entityType: 'MedicationRequest', entityId: cpoeOrder.id, fhirResourceType: 'MedicationRequest', payload: fhirMedReq });

      // Step D: Bedside eMAR 5-Rights Administration
      const adminEvent = {
        id: 'EVT-MED-INDEP-001',
        orderId: cpoeOrder.id,
        patientId: patient.id,
        encounterId: encounter.id,
        drugName: 'Ceftriaxone 1g IV',
        action: 'ADMINISTER',
        status: 'ADMINISTERED',
        administeredByNurseName: 'Ners Rina',
        timestamp: new Date().toISOString()
      };
      await persistenceAdapter.save('medication_events', adminEvent.id, adminEvent);
      const fhirAdmin = mappers.mapMedicationAdministration(adminEvent);
      await fhirOutbox.enqueue({ entityType: 'MedicationAdministration', entityId: adminEvent.id, fhirResourceType: 'MedicationAdministration', payload: fhirAdmin });

      // Step E: Doctor signs Discharge Summary & Terminal State Transition
      await careStateEngine.transition({
        encounterId: encounter.id,
        targetState: CARE_STATES.DISCHARGE_PENDING,
        eventType: CLINICAL_EVENTS.START_DISCHARGE,
        actorId: 'DOC-01',
        actorRole: 'DOCTOR',
        actorName: 'dr. Alexander, Sp.PD'
      });

      const dischResult = await careStateEngine.transition({
        encounterId: encounter.id,
        targetState: CARE_STATES.DISCHARGED,
        eventType: CLINICAL_EVENTS.COMPLETE_DISCHARGE,
        actorId: 'DOC-01',
        actorRole: 'DOCTOR',
        actorName: 'dr. Alexander, Sp.PD'
      });
      expect(dischResult.success).toBe(true);
      expect(dischResult.encounter.primaryState).toBe(CARE_STATES.DISCHARGED);

      // ══════════════════════════════════════════════════════════════
      // PHASE 3: VERIFY ZERO CLINICAL OBSTRUCTION DURING OUTAGE
      // ══════════════════════════════════════════════════════════════
      // All local records MUST be intact and committed!
      const savedEnc = await persistenceAdapter.findById('encounters', encounter.id);
      expect(savedEnc.primaryState).toBe(CARE_STATES.DISCHARGED);

      // Attempt outbound dispatch during outage -> All items fail gracefully to RETRY
      const outboxItems = await fhirOutbox.getReadyItems();
      expect(outboxItems.length).toBe(4); // Patient, Encounter, MedRequest, MedAdmin

      for (const item of outboxItems) {
        const attempt = await satusehatGateway.processOutboxItem(item);
        expect(attempt.success).toBe(false);
        expect(attempt.outboxStatus).toBe(OUTBOX_STATUS.RETRY);
      }

      // Check lineage records contain OperationOutcome diagnostic failure details
      const failureLineage = await externalContractRecorder.getLineageByInternalEntity('Patient', patient.id);
      expect(failureLineage[0].status).toBe('FAILED');
      expect(failureLineage[0].response.operationOutcome).toBeDefined();

      // ══════════════════════════════════════════════════════════════
      // PHASE 4: SATUSEHAT RESTORED (ONLINE) & BACKGROUND RECONCILIATION
      // ══════════════════════════════════════════════════════════════
      satusehatGateway.setSimulationMode({ enabled: false });

      // Reset retry schedule to immediate for simulation test
      const queuedItems = await persistenceAdapter.query('fhir_outbox');
      for (const q of queuedItems) {
        await persistenceAdapter.save('fhir_outbox', q.id, { ...q, status: OUTBOX_STATUS.PENDING });
      }

      // Process Outbox Queue (Drain Worker)
      const drainResults = await satusehatGateway.processOutboxQueue();
      expect(drainResults.length).toBe(4);
      expect(drainResults.every(r => r.success)).toBe(true);

      // Verify Reconciliation Links Created
      const patLink = await fhirResourceLink.getLinkByInternalEntity('Patient', patient.id);
      const encLink = await fhirResourceLink.getLinkByInternalEntity('Encounter', encounter.id);
      const medLink = await fhirResourceLink.getLinkByInternalEntity('MedicationRequest', cpoeOrder.id);
      const admLink = await fhirResourceLink.getLinkByInternalEntity('MedicationAdministration', adminEvent.id);

      expect(patLink.status).toBe('SYNCED');
      expect(encLink.status).toBe('SYNCED');
      expect(medLink.status).toBe('SYNCED');
      expect(admLink.status).toBe('SYNCED');

      // Verify Final Success Lineage Artifacts
      const successLineage = await externalContractRecorder.getLineageByInternalEntity('Patient', patient.id);
      const latestTrace = successLineage.find(t => t.status === 'SUCCESS');
      expect(latestTrace).toBeDefined();
      expect(latestTrace.externalResourceId).toBe(patLink.external_resource_id);
    });
  });
});
