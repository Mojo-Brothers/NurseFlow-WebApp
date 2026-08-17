/**
 * NurseFlow Enterprise HIS 2026 — SATUSEHAT Enterprise Gateway & Terminology Vertical Slice Test
 * Standards: Kemkes RI SATUSEHAT v4.0.1, HL7 FHIR R4 & Permenkes No. 24/2022
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { satusehatOAuthService } from '../src/integrations/satusehat/auth/oauth.service.js';
import { terminologyValidator, TerminologyValidationError } from '../src/integrations/satusehat/validators/terminology.validator.js';
import { fhirBundleBuilder } from '../src/integrations/satusehat/fhir/bundle.builder.js';
import { fhirDispatcherService } from '../src/integrations/satusehat/gateway/fhirDispatcher.service.js';

describe('Sprint 10: SATUSEHAT Enterprise Gateway, OAuth2 & Terminology Suite', () => {

  beforeEach(() => {
    satusehatOAuthService.invalidateToken();
    fhirDispatcherService.clearDlq();
  });

  // 1. OAuth2 Token Acquisition & Caching Strategy
  it('1. should acquire SATUSEHAT OAuth2 token and reuse cached token within valid TTL', async () => {
    const token1 = await satusehatOAuthService.getValidToken();
    expect(token1.accessToken).toBeDefined();
    expect(token1.isCached).toBe(false);
    expect(token1.tokenType).toBe('Bearer');

    // Second call should return cached token
    const token2 = await satusehatOAuthService.getValidToken();
    expect(token2.accessToken).toBe(token1.accessToken);
    expect(token2.isCached).toBe(true);
  });

  // 2. Clinical Terminology Validation (ICD-10, ICD-9-CM, LOINC, KFA)
  it('2. should validate Indonesian Ministry of Health clinical terminologies (ICD-10, ICD-9, LOINC, KFA)', () => {
    // Valid codes
    expect(terminologyValidator.validateIcd10('I10')).toBe(true);
    expect(terminologyValidator.validateIcd10('A09.9')).toBe(true);
    expect(terminologyValidator.validateIcd9Cm('99.04')).toBe(true);
    expect(terminologyValidator.validateLoinc('8480-6')).toBe(true);
    expect(terminologyValidator.validateKfa('93000001')).toBe(true);

    // Invalid codes must throw TerminologyValidationError
    expect(() => terminologyValidator.validateIcd10('INVALID_ICD')).toThrow(TerminologyValidationError);
    expect(() => terminologyValidator.validateIcd9Cm('NOT_A_PROC')).toThrow(TerminologyValidationError);
    expect(() => terminologyValidator.validateKfa('123')).toThrow(TerminologyValidationError);
  });

  // 3. FHIR R4 Bundle Builder
  it('3. should generate structured HL7 FHIR R4 Transaction Bundle with Encounter, Condition & Observation', () => {
    const bundle = fhirBundleBuilder.buildClinicalEpisodeBundle({
      orgId: '1000001',
      encounterId: 'ENC-2026-0817-001',
      patientIhsNumber: 'P1000001234',
      patientName: 'Ny. Dewi Sartika',
      doctorIhsNumber: 'N1000001',
      doctorName: 'dr. Siti Wijaya, Sp.PD',
      diagnosis: { icd10Code: 'I10', display: 'Essential (primary) hypertension' },
      procedure: { icd9Code: '99.04', display: 'Blood transfusion' },
      medication: { kfaCode: '93000001', name: 'Paracetamol 500mg' },
      vitals: { systolic: 120, diastolic: 80, heartRate: 80 }
    });

    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('transaction');
    expect(bundle.entry.length).toBeGreaterThanOrEqual(3);

    // Verify Encounter entry
    const encounterEntry = bundle.entry.find(e => e.resource.resourceType === 'Encounter');
    expect(encounterEntry).toBeDefined();
    expect(encounterEntry.resource.subject.reference).toBe('Patient/P1000001234');

    // Verify Condition entry
    const conditionEntry = bundle.entry.find(e => e.resource.resourceType === 'Condition');
    expect(conditionEntry).toBeDefined();
    expect(conditionEntry.resource.code.coding[0].code).toBe('I10');
  });

  // 4. FHIR Dispatcher & Transmission Success
  it('4. should dispatch FHIR Bundle through SATUSEHAT Gateway with successful transmission log', async () => {
    const bundle = fhirBundleBuilder.buildClinicalEpisodeBundle({
      encounterId: 'ENC-DISPATCH-01',
      patientIhsNumber: 'P1000001234',
      patientName: 'Ny. Dewi Sartika',
      diagnosis: { icd10Code: 'I10', display: 'Hypertension' }
    });

    const dispatchResult = await fhirDispatcherService.dispatchBundle(bundle);

    expect(dispatchResult.success).toBe(true);
    expect(dispatchResult.httpStatus).toBe(200);
    expect(dispatchResult.transmissionId).toBeDefined();
    expect(dispatchResult.response.entry[0].response.status).toBe('201 Created');
  });

});
