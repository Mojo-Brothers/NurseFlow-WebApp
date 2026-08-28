/**
 * NurseFlow Enterprise HIS 2026 — Phase D0.5 Runtime Safety Contract Adoption & E5-F Proof Suite
 * 
 * Verifies the 5 Core Architectural Questions mandated by Principal Architect (Bos Robby):
 * 1. Clinical Mutation Consumers Fail-Closed Context Locking (9 Modules).
 * 2. Async Fetch Lineage & Active AbortController on Patient-Switch.
 * 3. RFC 7807 422 Error Transformation to Authoritative UI Safety Modals.
 * 4. E5-F WORM Immutable Audit Correlation & Mandatory Override Reason.
 * 5. 50-100ms Rapid Patient-Switch Race Condition Neutralization (Zero Cross-Patient Contamination).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  assertClinicalContextLock,
  ClinicalContextLockError,
  ClinicalLineageBreachError,
  ClinicalExecutionContext,
  validateResponseContextLineage,
  mapErrorToClinicalSafetyAction,
  createSafetyOverridePayload,
  clinicalWorkspaceManager,
  ClinicalSafetyErrorCode
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

describe('🛡️ Phase D0.5: Runtime Safety Contract Adoption & E5-F Proof Suite', () => {

  // =========================================================================
  // 1. QUESTION 1: CLINICAL MUTATION CONSUMERS FAIL-CLOSED CONTEXT LOCKING
  // =========================================================================
  describe('📌 Q1: Fail-Closed Context Lock Across Mutation Consumers', () => {
    it('1.1 should reject raw assertClinicalContextLock when patientId is missing or null', () => {
      expect(() => assertClinicalContextLock(null)).toThrow(ClinicalContextLockError);
      expect(() => assertClinicalContextLock({})).toThrow(ClinicalContextLockError);
      expect(() => assertClinicalContextLock({ patientId: '' })).toThrow(ClinicalContextLockError);
      expect(() => assertClinicalContextLock({ patientId: '   ' })).toThrow(ClinicalContextLockError);
    });

    it('1.2 should accept valid context lock and normalize fields', () => {
      const lock = assertClinicalContextLock({
        patientId: 'PAT-1001',
        encounterId: 'ENC-2001',
        actorId: 'DOC-501',
        role: 'DOCTOR'
      });
      expect(lock.patientId).toBe('PAT-1001');
      expect(lock.encounterId).toBe('ENC-2001');
      expect(lock.actorId).toBe('DOC-501');
      expect(lock.actorRole).toBe('DOCTOR');
      expect(lock.verifiedAt).toBeDefined();
    });

    it('1.3 SOAP Engine: should block recordSoapNote if patientId is missing', async () => {
      await expect(soapEngineService.recordSoapNote({
        patientId: null,
        encounterId: 'ENC-01',
        subjective: 'Demam',
        objective: 'TD 120/80',
        assessment: 'DHF',
        plan: 'IVFD RL'
      })).rejects.toThrow(ClinicalContextLockError);
    });

    it('1.4 Universal CPOE Engine: should block createOrder if patientId is missing', async () => {
      await expect(universalOrderEngineService.createOrder({
        patientId: null,
        encounterId: 'ENC-01',
        items: [{ itemName: 'Paracetamol', quantity: 10 }]
      })).rejects.toThrow(ClinicalContextLockError);
    });

    it('1.5 Laboratory Engine: should block createLabOrder if patientId is missing', async () => {
      await expect(laboratoryEngineService.createLabOrder({
        patientId: null,
        encounterId: 'ENC-01',
        items: [{ name: 'Darah Lengkap' }]
      })).rejects.toThrow(ClinicalContextLockError);
    });

    it('1.6 Pharmacy Engine: should block createPrescriptionOrder if patientId is missing', async () => {
      await expect(pharmacyEngineService.createPrescriptionOrder({
        patientId: null,
        encounterId: 'ENC-01',
        items: [{ medicationName: 'Amoxicillin' }]
      })).rejects.toThrow(ClinicalContextLockError);
    });

    it('1.7 Radiology Engine: should block createRadiologyOrder if patientId is missing', async () => {
      await expect(radiologyEngineService.createRadiologyOrder({
        patientId: null,
        encounterId: 'ENC-01',
        items: [{ name: 'Rontgen Thorax' }]
      })).rejects.toThrow(ClinicalContextLockError);
    });

    it('1.8 Triage Service: should block submitTriage if patientId is missing', async () => {
      await expect(submitTriage({
        patientId: null,
        encounterId: 'ENC-01',
        vitals: { heartRate: 80 }
      })).rejects.toThrow(ClinicalContextLockError);
    });

    it('1.9 Billing Service: should block createBill if patientId is missing', async () => {
      await expect(createBill({
        patientId: null,
        encounterId: 'ENC-01',
        createdBy: 'Kasir-01'
      })).rejects.toThrow(ClinicalContextLockError);
    });

    it('1.10 Bed ADT Service: should block assignBed if patientId is missing', async () => {
      await expect(assignBed('BED-01', 'ENC-01', null, 'Admisi-01'))
        .rejects.toThrow(ClinicalContextLockError);
    });

    it('1.11 Clinical Records (emr.service): should block saveClinicalRecord if patientId is missing', async () => {
      await expect(saveClinicalRecord({
        patientId: null,
        encounterId: 'ENC-01',
        moduleName: 'ANAMNESIS',
        data: { text: 'Test' },
        author: 'DOC-01'
      })).rejects.toThrow(ClinicalContextLockError);
    });

    it('1.12 Surgery Checklist (surgery.service): should block saveSurgicalChecklist if patientId is missing', async () => {
      await expect(saveSurgicalChecklist({
        patientId: null,
        encounterId: 'ENC-01',
        userEmail: 'dr.bedah@hospital.id',
        phase: 'SIGN_IN',
        checklistData: {}
      })).rejects.toThrow(ClinicalContextLockError);
    });

    it('1.13 eMAR Service: should block createEMARRecord if patientId is missing', () => {
      expect(() => emarService.createEMARRecord({
        patientId: null,
        encounterId: 'ENC-01',
        medicationId: 'MED-01'
      })).toThrow(ClinicalContextLockError);
    });

    it('1.14 Operating Theatre Engine: should block scheduleSurgicalCase if patientId is missing', () => {
      expect(() => operatingTheatreEngineService.scheduleSurgicalCase({
        patientId: null,
        encounterId: 'ENC-01',
        procedureName: 'Apendiktomi'
      })).toThrow(ClinicalContextLockError);
    });
  });

  // =========================================================================
  // 2. QUESTION 2: ASYNC FETCH LINEAGE & ABORT CONTROLLER ON PATIENT-SWITCH
  // =========================================================================
  describe('📌 Q2: Async Lineage & AbortController on Patient-Switch', () => {
    it('2.1 should instantiate ClinicalExecutionContext with an active AbortController signal', () => {
      const ctx = new ClinicalExecutionContext({ patientId: 'PAT-A', encounterId: 'ENC-A' });
      expect(ctx.signal).toBeDefined();
      expect(ctx.signal.aborted).toBe(false);
      expect(ctx.isAborted).toBe(false);
    });

    it('2.2 should abort inflight signal when abort() is called with reason', () => {
      const ctx = new ClinicalExecutionContext({ patientId: 'PAT-A', encounterId: 'ENC-A' });
      ctx.abort('PATIENT_SWITCH_TRIGGERED');
      expect(ctx.signal.aborted).toBe(true);
      expect(ctx.isAborted).toBe(true);
      expect(ctx.abortReason).toBe('PATIENT_SWITCH_TRIGGERED');
    });

    it('2.3 validateResponseLineage should reject responses if context was aborted', () => {
      const ctx = new ClinicalExecutionContext({ patientId: 'PAT-A', encounterId: 'ENC-A' });
      ctx.abort('PATIENT_SWITCH');
      expect(() => ctx.validateResponseLineage({ patientId: 'PAT-A', encounterId: 'ENC-A' }))
        .toThrow(ClinicalLineageBreachError);
    });

    it('2.4 validateResponseLineage should strictly reject cross-patient response', () => {
      const ctx = new ClinicalExecutionContext({ patientId: 'PAT-A', encounterId: 'ENC-A' });
      expect(() => ctx.validateResponseLineage({ patientId: 'PAT-B', encounterId: 'ENC-A' }))
        .toThrow(ClinicalLineageBreachError);
    });

    it('2.5 validateResponseLineage should strictly reject cross-encounter response', () => {
      const ctx = new ClinicalExecutionContext({ patientId: 'PAT-A', encounterId: 'ENC-A' });
      expect(() => ctx.validateResponseLineage({ patientId: 'PAT-A', encounterId: 'ENC-B' }))
        .toThrow(ClinicalLineageBreachError);
    });

    it('2.6 validateResponseContextLineage should reject commit if active context is null', () => {
      expect(() => validateResponseContextLineage({ patientId: 'PAT-A' }, null))
        .toThrow(ClinicalLineageBreachError);
    });

    it('2.7 validateResponseContextLineage should reject commit if incoming patientId != active patientId', () => {
      expect(() => validateResponseContextLineage(
        { patientId: 'PAT-STALE', encounterId: 'ENC-01' },
        { patientId: 'PAT-ACTIVE', encounterId: 'ENC-01' }
      )).toThrow(ClinicalLineageBreachError);
    });

    it('2.8 validateResponseContextLineage should pass when incoming and active contexts match perfectly', () => {
      const result = validateResponseContextLineage(
        { patientId: 'PAT-MATCH', encounterId: 'ENC-MATCH' },
        { patientId: 'PAT-MATCH', encounterId: 'ENC-MATCH' }
      );
      expect(result).toBe(true);
    });
  });

  // =========================================================================
  // 3. QUESTION 3: RFC 7807 422 ERROR TRANSFORMATION TO SAFETY MODALS
  // =========================================================================
  describe('📌 Q3: RFC 7807 HTTP 422 to Authoritative UI Safety Modal Mapping', () => {
    it('3.1 should map ALLERGY_HARD_STOP to CRITICAL modal with override required', () => {
      const action = mapErrorToClinicalSafetyAction({
        status: 422,
        code: 'ALLERGY_HARD_STOP',
        detail: 'Pasien memiliki riwayat anafilaksis berat terhadap Penisilin.'
      });
      expect(action.requiresModal).toBe(true);
      expect(action.modalType).toBe('ALLERGY_HARD_STOP');
      expect(action.severity).toBe('CRITICAL');
      expect(action.canOverride).toBe(true);
      expect(action.requiresOverrideReason).toBe(true);
      expect(action.title).toContain('KONTRAINDIKASI ALERGI OBAT');
    });

    it('3.2 should map DRUG_ALLERGY_CONTRAINDICATION with allergy keywords correctly', () => {
      const action = mapErrorToClinicalSafetyAction({
        status: 422,
        code: 'DRUG_ALLERGY_CONTRAINDICATION',
        detail: 'Terdeteksi reaksi alergi silang Sefalosporin.'
      });
      expect(action.modalType).toBe('ALLERGY_HARD_STOP');
      expect(action.canOverride).toBe(true);
    });

    it('3.3 should map HIGH_ALERT_DUAL_SIGN_REQUIRED to HIGH modal requiring witness', () => {
      const action = mapErrorToClinicalSafetyAction({
        status: 422,
        code: 'HIGH_ALERT_DUAL_SIGN_REQUIRED',
        detail: 'Insulin Glargine memerlukan verifikasi ganda perawat (JCI IPSG.3).'
      });
      expect(action.requiresModal).toBe(true);
      expect(action.modalType).toBe('HIGH_ALERT_DUAL_SIGN');
      expect(action.requiresDualSign).toBe(true);
      expect(action.canOverride).toBe(false);
    });

    it('3.4 should map EMERGENCY_PANIC value to CRITICAL modal with 15-min read-back action', () => {
      const action = mapErrorToClinicalSafetyAction({
        status: 422,
        code: 'EMERGENCY_PANIC',
        detail: 'Kalium Darah 2.1 mEq/L (Kritis / Hipokalemia Berat).'
      });
      expect(action.requiresModal).toBe(true);
      expect(action.modalType).toBe('EMERGENCY_PANIC');
      expect(action.severity).toBe('CRITICAL');
      expect(action.recommendedAction).toContain('15 menit');
    });

    it('3.5 should map HTTP 409 CONCURRENCY_CONFLICT to merge modal without blind override', () => {
      const action = mapErrorToClinicalSafetyAction({
        status: 409,
        code: 'CONCURRENCY_CONFLICT',
        detail: 'Versi rekam medis telah diperbarui oleh DPJP lain.'
      });
      expect(action.requiresModal).toBe(true);
      expect(action.modalType).toBe('CONCURRENCY_CONFLICT');
      expect(action.canOverride).toBe(false);
      expect(action.title).toContain('KONFLIK PEMBARUAN DATA');
    });

    it('3.6 should map terminal encounter / context mismatch to CLINICAL_WARNING modal', () => {
      const action = mapErrorToClinicalSafetyAction({
        status: 422,
        code: 'ENCOUNTER_TERMINAL_STATE',
        detail: 'Kunjungan pasien telah selesai (DISCHARGED) dan terkunci secara medikolegal.'
      });
      expect(action.requiresModal).toBe(true);
      expect(action.modalType).toBe('CLINICAL_WARNING');
      expect(action.canOverride).toBe(false);
    });
  });

  // =========================================================================
  // 4. QUESTION 4: E5-F IMMUTABLE AUDIT CORRELATION (WORM PROOF)
  // =========================================================================
  describe('📌 Q4: E5-F WORM Immutable Audit Correlation & Mandatory Reason', () => {
    it('4.1 should reject safety override payload if overrideReason is missing or < 5 characters', () => {
      expect(() => createSafetyOverridePayload({
        safetyCode: 'ALLERGY_HARD_STOP',
        overrideReason: '',
        patientId: 'PAT-1001',
        actorId: 'DOC-501'
      })).toThrow('[E5-F_SAFETY_VIOLATION]');

      expect(() => createSafetyOverridePayload({
        safetyCode: 'ALLERGY_HARD_STOP',
        overrideReason: 'ok',
        patientId: 'PAT-1001',
        actorId: 'DOC-501'
      })).toThrow('[E5-F_SAFETY_VIOLATION]');
    });

    it('4.2 should reject safety override payload if patientId is missing', () => {
      expect(() => createSafetyOverridePayload({
        safetyCode: 'ALLERGY_HARD_STOP',
        overrideReason: 'Indikasi darurat vital resusitasi',
        patientId: null,
        actorId: 'DOC-501'
      })).toThrow('[E5-F_SAFETY_VIOLATION]');
    });

    it('4.3 should construct complete E5-F WORM audit record targeting universal_audit_logs', () => {
      const payload = createSafetyOverridePayload({
        safetyCode: 'ALLERGY_HARD_STOP',
        overrideReason: 'Indikasi darurat: pasien mengalami sepsis fulminan, antibiotik pilihan tunggal sesuai kultur.',
        witnessId: 'NURSE-802',
        correlationId: 'CORR-E5F-TEST-9988',
        patientId: 'PAT-1001',
        encounterId: 'ENC-2001',
        actorId: 'DOC-501',
        actorRole: 'SPESIALIS_PENYAKIT_DALAM',
        originalPayload: { medicationId: 'MED-PENICILLIN', dose: '1g IV' }
      });

      expect(payload.eventType).toBe('CLINICAL_SAFETY_OVERRIDE');
      expect(payload.safetyCode).toBe('ALLERGY_HARD_STOP');
      expect(payload.patientId).toBe('PAT-1001');
      expect(payload.encounterId).toBe('ENC-2001');
      expect(payload.actorId).toBe('DOC-501');
      expect(payload.actorRole).toBe('SPESIALIS_PENYAKIT_DALAM');
      expect(payload.witnessId).toBe('NURSE-802');
      expect(payload.correlationId).toBe('CORR-E5F-TEST-9988');
      expect(payload.isImmutable).toBe(true);
      expect(payload.targetAuditTable).toBe('universal_audit_logs');
      expect(payload.originalPayloadSnapshot.medicationId).toBe('MED-PENICILLIN');
      expect(payload.timestamp).toBeDefined();
    });
  });

  // =========================================================================
  // 5. QUESTION 5: 50-100ms PATIENT-SWITCH RACE CONDITION SHIELD
  // =========================================================================
  describe('📌 Q5: 50–100ms Rapid Patient-Switch Race Condition Defense', () => {
    it('5.1 should cleanly cancel in-flight request when user switches patient after 80ms', async () => {
      // Step 1: User opens Patient A workspace
      const contextA = clinicalWorkspaceManager.switchPatient('PAT-ALPHA', 'ENC-ALPHA');
      expect(clinicalWorkspaceManager.getActiveContext().patientId).toBe('PAT-ALPHA');

      let patientADataCommitted = false;
      let patientBDataCommitted = false;

      // Step 2: In-flight async fetch simulated for Patient A (takes 150ms)
      const fetchPatientA = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          try {
            // Validate lineage before committing to UI state
            contextA.validateResponseLineage({ patientId: 'PAT-ALPHA', encounterId: 'ENC-ALPHA' });
            patientADataCommitted = true;
            resolve('PATIENT_A_LAB_DATA');
          } catch (err) {
            reject(err);
          }
        }, 150);

        contextA.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('REQUEST_ABORTED_DUE_TO_PATIENT_SWITCH'));
        });
      });

      // Step 3: User switches to Patient B after 80ms
      await new Promise(r => setTimeout(r, 80));
      const contextB = clinicalWorkspaceManager.switchPatient('PAT-BETA', 'ENC-BETA');
      expect(clinicalWorkspaceManager.getActiveContext().patientId).toBe('PAT-BETA');
      expect(contextA.isAborted).toBe(true);

      // Step 4: Patient B fetch initiated and completed
      contextB.validateResponseLineage({ patientId: 'PAT-BETA', encounterId: 'ENC-BETA' });
      patientBDataCommitted = true;

      // Step 5: Await Patient A fetch and verify it was rejected
      await expect(fetchPatientA).rejects.toThrow('REQUEST_ABORTED_DUE_TO_PATIENT_SWITCH');

      // Step 6: Zero cross-patient contamination verified
      expect(patientADataCommitted).toBe(false);
      expect(patientBDataCommitted).toBe(true);
    });

    it('5.2 should reject late-arriving response without AbortController if lineage mismatches active context', () => {
      // User is on Patient B
      const activeContext = { patientId: 'PAT-BETA', encounterId: 'ENC-BETA' };

      // Late response from Patient A arrives
      const lateIncomingResponse = { patientId: 'PAT-ALPHA', encounterId: 'ENC-ALPHA', labResults: ['Hb: 14.2'] };

      // Lineage validator MUST throw
      expect(() => validateResponseContextLineage(lateIncomingResponse, activeContext))
        .toThrow(ClinicalLineageBreachError);
    });
  });

});
