/**
 * NurseFlow Enterprise HIS 2026 — Sprint 3P.3: FHIR Resource Conformance Test Suite
 * Standards: HL7 FHIR R4 (Normative), Kemkes SATUSEHAT 5-Layer Conformance Engine,
 * Machine-Readable Error Model, Clinical/Temporal Invariants.
 */

import { describe, it, expect } from 'vitest';
import { fhirResourceConformanceEngineService } from '../src/core/interoperability/fhir/engine/fhirResourceConformanceEngine.service.js';
import { KEMKES_PROFILES, KEMKES_SYSTEMS } from '../src/core/interoperability/fhir/profiles/kemkesProfiles.js';

describe('🏥 SPRINT 3P.3: FHIR Resource Conformance Gate (5-Layer Validation)', () => {
  // ==========================================================================
  // 1. PATIENT RESOURCE CONFORMANCE (L1 - L5)
  // ==========================================================================
  describe('1. Patient Resource Conformance', () => {
    it('1.1 should PASS valid Kemkes Patient resource across all 5 layers', () => {
      const patient = {
        resourceType: 'Patient',
        id: 'PAT-CONFORM-01',
        meta: { profile: [KEMKES_PROFILES.PATIENT] },
        identifier: [
          { system: KEMKES_SYSTEMS.NIK, value: '3201123456780001' },
          { system: KEMKES_SYSTEMS.PASIEN, value: 'MRN-2026-001' }
        ],
        name: [{ text: 'Bpk. Ahmad Suhendar' }],
        gender: 'male',
        birthDate: '1982-04-12'
      };

      const result = fhirResourceConformanceEngineService.evaluateResourceConformance(patient);
      expect(result.isConformant).toBe(true);
      expect(result.decision).toBe('CONFORMANT');
      expect(result.totalErrors).toBe(0);
    });

    it('1.2 should REJECT Patient missing 16-digit NIK identifier (L2 Profile Slicing Failure)', () => {
      const patientNoNik = {
        resourceType: 'Patient',
        id: 'PAT-NO-NIK',
        meta: { profile: [KEMKES_PROFILES.PATIENT] },
        identifier: [{ system: 'http://custom-hospital.id/mrn', value: '12345' }],
        gender: 'female'
      };

      const result = fhirResourceConformanceEngineService.evaluateResourceConformance(patientNoNik);
      expect(result.isConformant).toBe(false);
      expect(result.decision).toBe('REJECTED');
      expect(result.errors.some(e => e.layer === 'L2_PROFILE' && e.code === 'slicing-violation')).toBe(true);
    });
  });

  // ==========================================================================
  // 2. ENCOUNTER RESOURCE CONFORMANCE (L1 - L5)
  // ==========================================================================
  describe('2. Encounter Resource Conformance', () => {
    it('2.1 should PASS valid Kemkes Encounter resource across all 5 layers', () => {
      const encounter = {
        resourceType: 'Encounter',
        id: 'ENC-CONFORM-01',
        meta: { profile: [KEMKES_PROFILES.ENCOUNTER] },
        status: 'in-progress',
        class: { code: 'IMP', system: KEMKES_SYSTEMS.ACT_CODE },
        subject: { reference: 'Patient/PAT-CONFORM-01' },
        period: {
          start: '2026-08-19T08:00:00+07:00',
          end: '2026-08-19T12:00:00+07:00'
        }
      };

      const result = fhirResourceConformanceEngineService.evaluateResourceConformance(encounter);
      expect(result.isConformant).toBe(true);
      expect(result.decision).toBe('CONFORMANT');
    });

    it('2.2 should REJECT Encounter with temporal inversion (L5 Semantic Failure: end < start)', () => {
      const temporalInversion = {
        resourceType: 'Encounter',
        id: 'ENC-TEMPORAL-FAIL',
        meta: { profile: [KEMKES_PROFILES.ENCOUNTER] },
        status: 'finished',
        class: { code: 'AMB' },
        subject: { reference: 'Patient/PAT-01' },
        period: {
          start: '2026-08-19T14:00:00+07:00',
          end: '2026-08-19T10:00:00+07:00' // End precedes start!
        }
      };

      const result = fhirResourceConformanceEngineService.evaluateResourceConformance(temporalInversion);
      expect(result.isConformant).toBe(false);
      expect(result.errors.some(e => e.layer === 'L5_SEMANTIC' && e.code === 'temporal-inversion')).toBe(true);
    });
  });

  // ==========================================================================
  // 3. CONDITION RESOURCE CONFORMANCE (L1 - L5)
  // ==========================================================================
  describe('3. Condition Resource Conformance', () => {
    it('3.1 should PASS valid Kemkes Condition with standardized ICD-10 terminology', () => {
      const condition = {
        resourceType: 'Condition',
        id: 'COND-CONFORM-01',
        meta: { profile: [KEMKES_PROFILES.CONDITION] },
        clinicalStatus: { coding: [{ code: 'active' }] },
        code: {
          coding: [{ system: KEMKES_SYSTEMS.ICD10, code: 'I10', display: 'Essential hypertension' }]
        },
        subject: { reference: 'Patient/PAT-CONFORM-01' }
      };

      const result = fhirResourceConformanceEngineService.evaluateResourceConformance(condition);
      expect(result.isConformant).toBe(true);
      expect(result.decision).toBe('CONFORMANT');
    });

    it('3.2 should REJECT Condition with malformed ICD-10 code (L3 Terminology Failure)', () => {
      const conditionMalformed = {
        resourceType: 'Condition',
        id: 'COND-MALFORMED',
        meta: { profile: [KEMKES_PROFILES.CONDITION] },
        clinicalStatus: { coding: [{ code: 'active' }] },
        code: {
          coding: [{ system: KEMKES_SYSTEMS.ICD10, code: 'INVALID_ICD_CODE_123' }]
        },
        subject: { reference: 'Patient/PAT-01' }
      };

      const result = fhirResourceConformanceEngineService.evaluateResourceConformance(conditionMalformed);
      expect(result.isConformant).toBe(false);
      expect(result.errors.some(e => e.layer === 'L3_TERMINOLOGY' && e.code === 'invalid-terminology')).toBe(true);
    });
  });

  // ==========================================================================
  // 4. OBSERVATION RESOURCE CONFORMANCE (L1 - L5)
  // ==========================================================================
  describe('4. Observation Resource Conformance', () => {
    it('4.1 should PASS valid Kemkes Vital Signs Observation (LOINC + UCUM)', () => {
      const observation = {
        resourceType: 'Observation',
        id: 'OBS-CONFORM-01',
        meta: { profile: [KEMKES_PROFILES.OBSERVATION_VITALS] },
        status: 'final',
        code: {
          coding: [{ system: KEMKES_SYSTEMS.LOINC, code: '8867-4', display: 'Heart rate' }]
        },
        subject: { reference: 'Patient/PAT-CONFORM-01' },
        valueQuantity: {
          value: 78,
          unit: '/min',
          system: 'http://unitsofmeasure.org'
        }
      };

      const result = fhirResourceConformanceEngineService.evaluateResourceConformance(observation);
      expect(result.isConformant).toBe(true);
      expect(result.decision).toBe('CONFORMANT');
    });

    it('4.2 should WARN on physiologically extreme vital signs (L5 Semantic Outlier Warning)', () => {
      const extremeObs = {
        resourceType: 'Observation',
        id: 'OBS-EXTREME',
        meta: { profile: [KEMKES_PROFILES.OBSERVATION_VITALS] },
        status: 'final',
        code: {
          coding: [{ system: KEMKES_SYSTEMS.LOINC, code: '8867-4' }]
        },
        subject: { reference: 'Patient/PAT-01' },
        valueQuantity: { value: 290, unit: '/min' } // 290 bpm is extreme
      };

      const result = fhirResourceConformanceEngineService.evaluateResourceConformance(extremeObs);
      expect(result.isConformant).toBe(true);
      expect(result.decision).toBe('CONFORMANT_WITH_WARNINGS');
      expect(result.warnings.some(w => w.layer === 'L5_SEMANTIC' && w.code === 'clinical-range-outlier')).toBe(true);
    });
  });

  // ==========================================================================
  // 5. PROCEDURE RESOURCE CONFORMANCE (L1 - L5)
  // ==========================================================================
  describe('5. Procedure Resource Conformance', () => {
    it('5.1 should PASS valid Kemkes Procedure with ICD-9-CM code', () => {
      const proc = {
        resourceType: 'Procedure',
        id: 'PROC-CONFORM-01',
        meta: { profile: [KEMKES_PROFILES.PROCEDURE] },
        status: 'completed',
        code: {
          coding: [{ system: KEMKES_SYSTEMS.ICD9CM, code: '38.08', display: 'Incision of vessel' }]
        },
        subject: { reference: 'Patient/PAT-CONFORM-01' }
      };

      const result = fhirResourceConformanceEngineService.evaluateResourceConformance(proc);
      expect(result.isConformant).toBe(true);
      expect(result.decision).toBe('CONFORMANT');
    });
  });

  // ==========================================================================
  // 6. MEDICATIONREQUEST RESOURCE CONFORMANCE (L1 - L5)
  // ==========================================================================
  describe('6. MedicationRequest Resource Conformance', () => {
    it('6.1 should PASS valid Kemkes MedicationRequest with KFA code', () => {
      const medReq = {
        resourceType: 'MedicationRequest',
        id: 'MED-CONFORM-01',
        meta: { profile: [KEMKES_PROFILES.MEDICATION_REQUEST] },
        status: 'active',
        intent: 'order',
        medicationCodeableConcept: {
          coding: [{ system: KEMKES_SYSTEMS.KFA, code: '93000101', display: 'Amlodipine 5mg' }]
        },
        subject: { reference: 'Patient/PAT-CONFORM-01' }
      };

      const result = fhirResourceConformanceEngineService.evaluateResourceConformance(medReq);
      expect(result.isConformant).toBe(true);
      expect(result.decision).toBe('CONFORMANT');
    });
  });

  // ==========================================================================
  // 7. DIAGNOSTICREPORT RESOURCE CONFORMANCE (L1 - L5)
  // ==========================================================================
  describe('7. DiagnosticReport Resource Conformance', () => {
    it('7.1 should PASS valid Kemkes DiagnosticReport for Lab/Radiology', () => {
      const report = {
        resourceType: 'DiagnosticReport',
        id: 'DR-CONFORM-01',
        meta: { profile: [KEMKES_PROFILES.DIAGNOSTIC_REPORT] },
        status: 'final',
        code: {
          coding: [{ system: KEMKES_SYSTEMS.LOINC, code: '85354-9', display: 'Blood pressure panel' }]
        },
        subject: { reference: 'Patient/PAT-CONFORM-01' }
      };

      const result = fhirResourceConformanceEngineService.evaluateResourceConformance(report);
      expect(result.isConformant).toBe(true);
      expect(result.decision).toBe('CONFORMANT');
    });
  });

  // ==========================================================================
  // 8. MACHINE-READABLE ERROR MODEL AUDIT
  // ==========================================================================
  describe('8. Machine-Readable Diagnostic Error Model Audit', () => {
    it('8.1 should provide structured, deterministic metadata for all conformance failures', () => {
      const invalidResource = {
        resourceType: 'Encounter',
        id: 'ENC-BROKEN-TEST',
        status: 'in-progress'
        // Missing meta.profile, class, and subject
      };

      const result = fhirResourceConformanceEngineService.evaluateResourceConformance(invalidResource);
      expect(result.isConformant).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);

      const err = result.errors[0];
      expect(err).toHaveProperty('layer');
      expect(err).toHaveProperty('severity');
      expect(err).toHaveProperty('code');
      expect(err).toHaveProperty('path');
      expect(err).toHaveProperty('resourceType');
      expect(err).toHaveProperty('profile');
      expect(err).toHaveProperty('message');
    });
  });
});
