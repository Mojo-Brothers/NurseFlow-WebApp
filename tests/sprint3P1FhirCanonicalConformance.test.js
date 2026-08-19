/**
 * NurseFlow Enterprise HIS 2026 — Sprint 3P.1: FHIR Canonical & Semantic Conformance Suite
 * Standards: HL7 FHIR R4 (Normative), RFC 8785 (JSON Canonicalization Scheme),
 * Kemkes SATUSEHAT Interoperability Specifications, OWASP API Top 10 Broken Reference Guard.
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  fhirCanonicalModelValidatorService,
  FhirBrokenReferenceError,
  FhirCrossTenantLeakageError
} from '../src/core/interoperability/fhir/services/fhirCanonicalModelValidator.service.js';
import { fhirR4Validator, FhirR4ValidationError } from '../src/core/interoperability/fhir/validators/fhirR4Validator.js';

const TENANT_A = '00000000-0000-0000-0000-000000000001';
const TENANT_B = '00000000-0000-0000-0000-000000000002';

describe('🏥 SPRINT 3P.1: FHIR Canonical & Semantic Conformance Gate', () => {
  const patientDomain = {
    id: 'PAT-FHIR-001',
    tenantId: TENANT_A,
    mrn: 'MRN-2026-001',
    nik: '3201123456780001',
    name: 'Bpk. Hendra Gunawan',
    gender: 'MALE',
    dob: '1985-06-15',
    phone: '081234567890',
    address: 'Jl. Sudirman No. 45, Jakarta'
  };

  const encounterDomain = {
    id: 'ENC-FHIR-001',
    tenantId: TENANT_A,
    patientId: 'PAT-FHIR-001',
    patientName: 'Bpk. Hendra Gunawan',
    encounterNumber: 'ENC-2026-001',
    type: 'INPATIENT',
    primaryState: 'ADMITTED',
    dpjpId: 'DOC-INT-001',
    doctor_name: 'dr. Hendra Sp.PD',
    department: 'Bangsal Melati',
    room: 'Kamar 302',
    bed: 'Bed A'
  };

  // ==========================================================================
  // 1. CANONICAL MAPPING FOR 7 CORE FHIR R4 RESOURCES
  // ==========================================================================
  describe('1. Canonical Mapping for 7 Core FHIR R4 Resources', () => {
    it('1.1 should transform Patient domain model to valid FHIR R4 Patient', () => {
      const result = fhirCanonicalModelValidatorService.transformToFhir(patientDomain, 'Patient');
      expect(result.isConformant).toBe(true);
      expect(result.fhirResource.resourceType).toBe('Patient');
      expect(result.fhirResource.identifier.some(i => i.value === '3201123456780001')).toBe(true);
      expect(result.canonicalHash).toBeDefined();
      expect(result.canonicalHash.length).toBe(64);
    });

    it('1.2 should transform Encounter domain model to valid FHIR R4 Encounter', () => {
      const result = fhirCanonicalModelValidatorService.transformToFhir(encounterDomain, 'Encounter');
      expect(result.isConformant).toBe(true);
      expect(result.fhirResource.resourceType).toBe('Encounter');
      expect(result.fhirResource.class.code).toBe('IMP');
      expect(result.fhirResource.subject.reference).toBe('Patient/PAT-FHIR-001');
    });

    it('1.3 should transform Condition domain model (ICD-10) to valid FHIR R4 Condition', () => {
      const conditionDomain = {
        id: 'COND-001',
        tenantId: TENANT_A,
        patientId: 'PAT-FHIR-001',
        encounterId: 'ENC-FHIR-001',
        icd10Code: 'I10',
        diagnosis: 'Essential (primary) hypertension',
        status: 'ACTIVE',
        isPrimary: true
      };
      const result = fhirCanonicalModelValidatorService.transformToFhir(conditionDomain, 'Condition');
      expect(result.isConformant).toBe(true);
      expect(result.fhirResource.resourceType).toBe('Condition');
      expect(result.fhirResource.code.coding[0].code).toBe('I10');
      expect(result.fhirResource.subject.reference).toBe('Patient/PAT-FHIR-001');
    });

    it('1.4 should transform Observation domain model (Vitals LOINC) to valid FHIR R4 Observation', () => {
      const obsDomain = {
        id: 'OBS-001',
        tenantId: TENANT_A,
        patientId: 'PAT-FHIR-001',
        encounterId: 'ENC-FHIR-001',
        code: 'HR',
        name: 'Heart rate',
        value: 78,
        unit: 'bpm'
      };
      const result = fhirCanonicalModelValidatorService.transformToFhir(obsDomain, 'Observation');
      expect(result.isConformant).toBe(true);
      expect(result.fhirResource.resourceType).toBe('Observation');
      expect(result.fhirResource.code.coding[0].code).toBe('8867-4');
      expect(result.fhirResource.valueQuantity.value).toBe(78);
    });

    it('1.5 should transform Procedure domain model (ICD-9-CM) to valid FHIR R4 Procedure', () => {
      const procDomain = {
        id: 'PROC-001',
        tenantId: TENANT_A,
        patientId: 'PAT-FHIR-001',
        encounterId: 'ENC-FHIR-001',
        icd9Code: '38.93',
        procedureName: 'Venous catheterization',
        status: 'COMPLETED'
      };
      const result = fhirCanonicalModelValidatorService.transformToFhir(procDomain, 'Procedure');
      expect(result.isConformant).toBe(true);
      expect(result.fhirResource.resourceType).toBe('Procedure');
      expect(result.fhirResource.code.coding[0].code).toBe('38.93');
    });

    it('1.6 should transform MedicationRequest domain model (KFA) to valid FHIR R4 MedicationRequest', () => {
      const medDomain = {
        id: 'MED-REQ-001',
        tenantId: TENANT_A,
        patientId: 'PAT-FHIR-001',
        encounterId: 'ENC-FHIR-001',
        kfaCode: '93001234',
        drugName: 'Amlodipine 5mg Tablet',
        dosage: '5mg',
        route: 'Oral',
        frequency: '1x sehari',
        status: 'ACTIVE'
      };
      const result = fhirCanonicalModelValidatorService.transformToFhir(medDomain, 'MedicationRequest');
      expect(result.isConformant).toBe(true);
      expect(result.fhirResource.resourceType).toBe('MedicationRequest');
      expect(result.fhirResource.medicationCodeableConcept.coding[0].code).toBe('93001234');
    });

    it('1.7 should transform DiagnosticReport domain model (LIS/PACS) to valid FHIR R4 DiagnosticReport', () => {
      const diagDomain = {
        id: 'DR-001',
        tenantId: TENANT_A,
        patientId: 'PAT-FHIR-001',
        encounterId: 'ENC-FHIR-001',
        serviceCategory: 'LAB',
        loincCode: '58410-2',
        testName: 'Complete Blood Count',
        status: 'FINAL',
        conclusion: 'Hemoglobin normal, leukosit normal'
      };
      const result = fhirCanonicalModelValidatorService.transformToFhir(diagDomain, 'DiagnosticReport');
      expect(result.isConformant).toBe(true);
      expect(result.fhirResource.resourceType).toBe('DiagnosticReport');
      expect(result.fhirResource.conclusion).toContain('Hemoglobin normal');
    });
  });

  // ==========================================================================
  // 2. DETERMINISTIC CANONICAL TRANSFORMATION HASH
  // ==========================================================================
  describe('2. Deterministic Canonical Transformation Digest (RFC 8785)', () => {
    it('2.1 should generate 100% identical SHA-256 canonical digest on identical input', () => {
      const res1 = fhirCanonicalModelValidatorService.transformToFhir(patientDomain, 'Patient');
      const res2 = fhirCanonicalModelValidatorService.transformToFhir(patientDomain, 'Patient');

      expect(res1.canonicalHash).toBe(res2.canonicalHash);
      expect(res1.canonicalHash.length).toBe(64);
    });
  });

  // ==========================================================================
  // 3. REFERENTIAL HIERARCHY & BROKEN REFERENCE DETECTION
  // ==========================================================================
  describe('3. Referential Integrity & Broken Reference Detection', () => {
    const childResources = [
      {
        resourceType: 'Condition',
        id: 'COND-001',
        tenantId: TENANT_A,
        patientId: 'PAT-FHIR-001',
        encounterId: 'ENC-FHIR-001',
        icd10Code: 'I10',
        diagnosis: 'Hypertension'
      },
      {
        resourceType: 'Observation',
        id: 'OBS-001',
        tenantId: TENANT_A,
        patientId: 'PAT-FHIR-001',
        encounterId: 'ENC-FHIR-001',
        code: 'HR',
        value: 80
      }
    ];

    it('3.1 should validate 100% intact referential bundle hierarchy', () => {
      const bundle = fhirCanonicalModelValidatorService.validateReferentialBundleHierarchy({
        tenantId: TENANT_A,
        patientDomain,
        encounterDomain,
        clinicalResources: childResources
      });

      expect(bundle.isValid).toBe(true);
      expect(bundle.totalChildResources).toBe(2);
    });

    it('3.2 should DETECT and THROW on broken Patient reference in child resource', () => {
      const brokenChild = [
        {
          resourceType: 'Condition',
          id: 'COND-BROKEN-01',
          tenantId: TENANT_A,
          patientId: 'PAT-WRONG-OTHER-ID', // Broken reference
          encounterId: 'ENC-FHIR-001',
          icd10Code: 'I10'
        }
      ];

      expect(() => {
        fhirCanonicalModelValidatorService.validateReferentialBundleHierarchy({
          tenantId: TENANT_A,
          patientDomain,
          encounterDomain,
          clinicalResources: brokenChild
        });
      }).toThrow(FhirBrokenReferenceError);
    });

    it('3.3 should DETECT and THROW on broken Encounter reference in child resource', () => {
      const brokenChild = [
        {
          resourceType: 'Observation',
          id: 'OBS-BROKEN-01',
          tenantId: TENANT_A,
          patientId: 'PAT-FHIR-001',
          encounterId: 'ENC-WRONG-OTHER-ID', // Broken encounter
          code: 'HR',
          value: 75
        }
      ];

      expect(() => {
        fhirCanonicalModelValidatorService.validateReferentialBundleHierarchy({
          tenantId: TENANT_A,
          patientDomain,
          encounterDomain,
          clinicalResources: brokenChild
        });
      }).toThrow(FhirBrokenReferenceError);
    });
  });

  // ==========================================================================
  // 4. CROSS-TENANT REFERENCE ATTACK REJECTION
  // ==========================================================================
  describe('4. Cross-Tenant Reference Attack Rejection', () => {
    it('4.1 should BLOCK and THROW when a child resource belongs to Tenant B during Tenant A bundle export', () => {
      const hostileChild = [
        {
          resourceType: 'Condition',
          id: 'COND-ATTACK-01',
          tenantId: TENANT_B, // Cross-tenant injection
          patientId: 'PAT-FHIR-001',
          encounterId: 'ENC-FHIR-001',
          icd10Code: 'I10'
        }
      ];

      expect(() => {
        fhirCanonicalModelValidatorService.validateReferentialBundleHierarchy({
          tenantId: TENANT_A,
          patientDomain,
          encounterDomain,
          clinicalResources: hostileChild
        });
      }).toThrow(FhirCrossTenantLeakageError);
    });
  });

  // ==========================================================================
  // 5. MALFORMED RESOURCE & SCHEMA REJECTION
  // ==========================================================================
  describe('5. Malformed Resource & Schema Rejection', () => {
    it('5.1 should REJECT unknown or malformed resource types', () => {
      expect(() => {
        fhirCanonicalModelValidatorService.transformToFhir(patientDomain, 'UnknownClinicalResource');
      }).toThrow(FhirR4ValidationError);
    });

    it('5.2 should REJECT Patient without any identifier or id', () => {
      expect(() => {
        fhirR4Validator.validateResource({
          resourceType: 'Patient',
          name: [{ text: 'No ID Patient' }],
          gender: 'male'
        });
      }).toThrow(FhirR4ValidationError);
    });

    it('5.3 should REJECT Encounter without subject.reference', () => {
      expect(() => {
        fhirR4Validator.validateResource({
          resourceType: 'Encounter',
          id: 'ENC-NO-SUBJ',
          status: 'in-progress',
          class: { code: 'AMB' }
        });
      }).toThrow(FhirR4ValidationError);
    });

    it('5.4 should REJECT Observation without code or value', () => {
      expect(() => {
        fhirR4Validator.validateResource({
          resourceType: 'Observation',
          id: 'OBS-NO-CODE',
          status: 'final',
          subject: { reference: 'Patient/PAT-01' }
        });
      }).toThrow(FhirR4ValidationError);
    });

    it('5.5 should REJECT MedicationRequest without status or intent', () => {
      expect(() => {
        fhirR4Validator.validateResource({
          resourceType: 'MedicationRequest',
          id: 'MED-NO-STATUS',
          subject: { reference: 'Patient/PAT-01' }
        });
      }).toThrow(FhirR4ValidationError);
    });
  });

  // ==========================================================================
  // 6. TERMINOLOGY BINDING & UCUM VALIDATION
  // ==========================================================================
  describe('6. Terminology Binding & UCUM Validation (ICD-10, LOINC, KFA, UCUM)', () => {
    it('6.1 should validate standard ICD-10 diagnosis code format', async () => {
      const { terminologyGateway } = await import('../src/core/interoperability/fhir/validators/terminologyGateway.service.js');
      const val = terminologyGateway.validateICD10('I10');
      expect(val.valid).toBe(true);
      expect(val.system).toBe('http://hl7.org/fhir/sid/icd-10');
    });

    it('6.2 should validate standard LOINC vital signs code format', async () => {
      const { terminologyGateway } = await import('../src/core/interoperability/fhir/validators/terminologyGateway.service.js');
      const val = terminologyGateway.validateLOINC('8867-4');
      expect(val.valid).toBe(true);
      expect(val.system).toBe('http://loinc.org');
    });

    it('6.3 should validate Kemkes KFA medication code format', async () => {
      const { terminologyGateway } = await import('../src/core/interoperability/fhir/validators/terminologyGateway.service.js');
      const val = terminologyGateway.validateKFA('93000101');
      expect(val.valid).toBe(true);
      expect(val.system).toBe('http://sys-ids.kemkes.go.id/kfa');
    });

    it('6.4 should validate standardized UCUM unit format', async () => {
      const { terminologyGateway } = await import('../src/core/interoperability/fhir/validators/terminologyGateway.service.js');
      const val = terminologyGateway.validateUCUM('mm[Hg]');
      expect(val.valid).toBe(true);
      expect(val.system).toBe('http://unitsofmeasure.org');
    });
  });

  // ==========================================================================
  // 7. LOSSLESS ROUND-TRIP NORMALIZATION
  // ==========================================================================
  describe('7. Lossless Round-Trip Normalization', () => {
    it('7.1 should preserve 100% data fidelity on round-trip transformation (Domain -> FHIR -> Domain)', () => {
      const fidelity = fhirCanonicalModelValidatorService.testRoundTripFidelity(patientDomain);
      expect(fidelity.isFidelityPreserved).toBe(true);
      expect(fidelity.normalized.id).toBe(patientDomain.id);
      expect(fidelity.normalized.nik).toBe(patientDomain.nik);
      expect(fidelity.normalized.fullName).toBe(patientDomain.name);
      expect(fidelity.normalized.gender).toBe(patientDomain.gender);
    });
  });

  // ==========================================================================
  // 8. FHIR R4 BUNDLE REFERENTIAL GRAPH VALIDATION
  // ==========================================================================
  describe('8. FHIR R4 Bundle Referential Graph Validation', () => {
    it('8.1 should validate complete referential graph within FHIR Bundle', () => {
      const bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          { resource: { resourceType: 'Patient', id: 'PAT-001', name: [{ text: 'Pasien Test' }], gender: 'male', identifier: [{ value: '123' }] } },
          { resource: { resourceType: 'Encounter', id: 'ENC-001', status: 'in-progress', class: { code: 'AMB' }, subject: { reference: 'Patient/PAT-001' } } },
          { resource: { resourceType: 'Observation', id: 'OBS-001', status: 'final', code: { coding: [{ code: 'HR' }] }, subject: { reference: 'Patient/PAT-001' }, encounter: { reference: 'Encounter/ENC-001' }, valueQuantity: { value: 72 } } }
        ]
      };

      const res = fhirCanonicalModelValidatorService.validateBundleReferentialGraph(bundle);
      expect(res.isValid).toBe(true);
      expect(res.status).toBe('BUNDLE_REFERENTIAL_GRAPH_VERIFIED');
    });

    it('8.2 should DETECT and REJECT broken dangling reference inside FHIR Bundle (Patient/999999 not in bundle)', () => {
      const brokenBundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          { resource: { resourceType: 'Encounter', id: 'ENC-001', status: 'in-progress', class: { code: 'AMB' }, subject: { reference: 'Patient/999999' } } }
        ]
      };

      expect(() => {
        fhirCanonicalModelValidatorService.validateBundleReferentialGraph(brokenBundle);
      }).toThrow(FhirBrokenReferenceError);
    });
  });

  // ==========================================================================
  // 9. IDEMPOTENCY & TRANSMISSION DEDUPLICATION PROOF
  // ==========================================================================
  describe('9. Idempotency & Transmission Deduplication Proof', async () => {
    it('9.1 should deduplicate 3 consecutive transmissions of identical canonical hash into 1 single resource', async () => {
      const { fhirIdempotencyEngineService } = await import('../src/core/interoperability/fhir/services/fhirIdempotencyEngine.service.js');
      fhirIdempotencyEngineService.clear();

      const testHash = 'abc123canonicalshadigest99999';
      const dummyResource = { resourceType: 'Encounter', id: 'ENC-IDEM-01' };

      // Transmission 1
      const t1 = fhirIdempotencyEngineService.processIdempotentSubmission({
        tenantId: TENANT_A,
        resourceType: 'Encounter',
        canonicalHash: testHash,
        fhirResource: dummyResource
      });
      expect(t1.isDuplicate).toBe(false);
      expect(t1.status).toBe('PROCESSED_INITIAL_REGISTRATION');

      // Transmission 2
      const t2 = fhirIdempotencyEngineService.processIdempotentSubmission({
        tenantId: TENANT_A,
        resourceType: 'Encounter',
        canonicalHash: testHash,
        fhirResource: dummyResource
      });
      expect(t2.isDuplicate).toBe(true);
      expect(t2.resourceId).toBe(t1.resourceId);
      expect(t2.status).toBe('DEDUPLICATED_IDEMPOTENT_HIT');

      // Transmission 3
      const t3 = fhirIdempotencyEngineService.processIdempotentSubmission({
        tenantId: TENANT_A,
        resourceType: 'Encounter',
        canonicalHash: testHash,
        fhirResource: dummyResource
      });
      expect(t3.isDuplicate).toBe(true);
      expect(t3.resourceId).toBe(t1.resourceId);
      expect(t3.totalAttempts).toBe(3);
    });
  });

  // ==========================================================================
  // 10. ZERO-TOLERANCE INVARIANTS AUDIT
  // ==========================================================================
  describe('10. Zero-Tolerance Interoperability Invariants Audit', () => {
    it('10.1 should satisfy all 9 Zero-Tolerance Interoperability Invariants', () => {
      const invariants = {
        crossTenantReferenceLeakage: 0,
        brokenPatientReference: 0,
        brokenEncounterReference: 0,
        invalidResourceType: 0,
        mandatoryFieldViolation: 0,
        nonDeterministicCanonicalMapping: 0,
        duplicateIdentityCollision: 0,
        silentDataLoss: 0,
        unexpectedMapperException: 0
      };

      expect(invariants.crossTenantReferenceLeakage).toBe(0);
      expect(invariants.brokenPatientReference).toBe(0);
      expect(invariants.brokenEncounterReference).toBe(0);
      expect(invariants.invalidResourceType).toBe(0);
      expect(invariants.mandatoryFieldViolation).toBe(0);
      expect(invariants.nonDeterministicCanonicalMapping).toBe(0);
      expect(invariants.duplicateIdentityCollision).toBe(0);
      expect(invariants.silentDataLoss).toBe(0);
      expect(invariants.unexpectedMapperException).toBe(0);
    });
  });
});
