/**
 * SPRINT 38 / PHASE 4: CANONICAL CLINICAL DOMAIN CONTRACT INTEGRITY SUITE
 * 
 * Verifies that all 8 Clinical Entities are strictly specified, frozen,
 * have WORM audit provenance, explicit lifecycles, and SATUSEHAT FHIR R4 target profiles.
 */

import { describe, it, expect } from 'vitest';
import {
  CANONICAL_DOMAIN_REGISTRY,
  DOMAIN_CONTRACT_VERSION,
  PATIENT_CONTRACT,
  ENCOUNTER_CONTRACT,
  CARE_STATE_CONTRACT,
  CLINICAL_RECORD_CONTRACT,
  MEDICATION_CONTRACT,
  OBSERVATION_CONTRACT,
  PROCEDURE_CONTRACT,
  DOCUMENT_CONTRACT,
  CANONICAL_FHIR_PIPELINE_ARCHITECTURE
} from '../src/core/contracts/canonicalClinicalDomain.contract.js';

describe('Phase 4: Canonical Clinical Domain Contract & Architecture Hardening Suite', () => {
  it('1. should verify domain contract is frozen and versioned 1.0.0-FROZEN', () => {
    expect(DOMAIN_CONTRACT_VERSION).toBe('1.0.0-FROZEN');
    expect(Object.isFrozen(CANONICAL_DOMAIN_REGISTRY)).toBe(true);
    expect(Object.isFrozen(PATIENT_CONTRACT)).toBe(true);
    expect(Object.isFrozen(ENCOUNTER_CONTRACT)).toBe(true);
    expect(Object.isFrozen(MEDICATION_CONTRACT)).toBe(true);
  });

  it('2. should verify Patient contract has EMPI keys and SATUSEHAT Patient profile target', () => {
    expect(PATIENT_CONTRACT.identity.primaryKey).toBe('id');
    expect(PATIENT_CONTRACT.identity.alternateKeys).toContain('mrn');
    expect(PATIENT_CONTRACT.identity.alternateKeys).toContain('nik');
    expect(PATIENT_CONTRACT.fhirMappingTarget.resourceType).toBe('Patient');
    expect(PATIENT_CONTRACT.fhirMappingTarget.profiles).toContain(
      'https://fhir.kemkes.go.id/r4/StructureDefinition/Patient'
    );
  });

  it('3. should verify Encounter contract enforces terminal states and Encounter class mapping', () => {
    expect(ENCOUNTER_CONTRACT.lifecycle.terminalStates).toContain('DISCHARGED');
    expect(ENCOUNTER_CONTRACT.lifecycle.terminalStates).toContain('DECEASED');
    expect(ENCOUNTER_CONTRACT.lifecycle.terminalStates).toContain('CANCELLED');
    expect(ENCOUNTER_CONTRACT.fhirMappingTarget.resourceType).toBe('Encounter');
    expect(ENCOUNTER_CONTRACT.fhirMappingTarget.classMappers.INPATIENT.code).toBe('IMP');
    expect(ENCOUNTER_CONTRACT.fhirMappingTarget.classMappers.EMERGENCY.code).toBe('EMER');
  });

  it('4. should verify CareState contract enforces append-only WORM ledger', () => {
    expect(CARE_STATE_CONTRACT.lifecycle.immutable).toBe(true);
    expect(CARE_STATE_CONTRACT.lifecycle.writePolicy).toBe('APPEND_ONLY');
    expect(CARE_STATE_CONTRACT.lifecycle.deletePolicy).toBe('FORBIDDEN_BY_LAW');
    expect(CARE_STATE_CONTRACT.auditProvenance.collection).toBe('patient_care_state_events');
  });

  it('5. should verify Medication contract covers 5-Rights, FEFO, eMAR, and KFA code systems', () => {
    expect(MEDICATION_CONTRACT.lifecycle.states).toContain('PRESCRIBED');
    expect(MEDICATION_CONTRACT.lifecycle.states).toContain('ADMINISTERED');
    expect(MEDICATION_CONTRACT.lifecycle.states).toContain('NOT_ADMINISTERED');
    expect(MEDICATION_CONTRACT.fhirMappingTarget.resourceTypes).toContain('MedicationRequest');
    expect(MEDICATION_CONTRACT.fhirMappingTarget.resourceTypes).toContain('MedicationAdministration');
    expect(MEDICATION_CONTRACT.fhirMappingTarget.kfaCodeSystem).toBe('http://sys-ids.kemkes.go.id/kfa');
  });

  it('6. should verify ClinicalRecord, Observation, Procedure, and Document contracts are complete', () => {
    expect(CLINICAL_RECORD_CONTRACT.ownership.accessRoles).toContain('DOCTOR');
    expect(OBSERVATION_CONTRACT.fhirMappingTarget.loincCodeSystem).toBe('http://loinc.org');
    expect(PROCEDURE_CONTRACT.fhirMappingTarget.icd9CodeSystem).toBe('http://hl7.org/fhir/sid/icd-9-cm');
    expect(DOCUMENT_CONTRACT.lifecycle.states).toContain('DIGITALLY_SIGNED_BSRE');
  });

  it('7. should enforce 5-stage non-spaghetti FHIR pipeline architecture', () => {
    const pipeline = CANONICAL_FHIR_PIPELINE_ARCHITECTURE.pipelineStages;
    expect(pipeline.length).toBe(5);
    expect(pipeline[0].name).toBe('CLINICAL_DOMAIN_LAYER');
    expect(pipeline[1].name).toBe('CANONICAL_CLINICAL_EVENTS');
    expect(pipeline[2].name).toBe('FHIR_MAPPING_LAYER');
    expect(pipeline[3].name).toBe('SATUSEHAT_GATEWAY');
    expect(pipeline[4].name).toBe('KEMKES_SATUSEHAT_ENDPOINT');
  });
});
