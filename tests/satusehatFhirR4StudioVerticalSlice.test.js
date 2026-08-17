/**
 * NurseFlow Enterprise HIS 2026 — SATUSEHAT FHIR R4 Interoperability Studio Test
 * Standards: Permenkes No. 24/2022 (RME), SATUSEHAT HL7 FHIR R4 & Kemenkes DTO
 */

import { describe, it, expect } from 'vitest';
import { satusehatFhirStudioService, SATUSEHAT_CONFIG } from '../server/services/satusehatFhirStudio.service.js';

describe('Gate 1F.1: SATUSEHAT FHIR R4 Interoperability Studio Vertical Slice', () => {

  // 1. Serialization of Foundation & Clinical Resources
  it('1. should serialize Organization, Location, Practitioner, and Patient with valid SATUSEHAT profiles', () => {
    const org = satusehatFhirStudioService.serializeOrganization();
    expect(org.resourceType).toBe('Organization');
    expect(org.id).toBe('100028741');
    expect(org.meta.profile[0]).toBe(SATUSEHAT_CONFIG.PROFILES.ORGANIZATION);
    expect(org.identifier[0].system).toBe(SATUSEHAT_CONFIG.SYSTEMS.ORGANISASI);

    const loc = satusehatFhirStudioService.serializeLocation();
    expect(loc.resourceType).toBe('Location');
    expect(loc.physicalType.coding[0].code).toBe('bd');

    const prac = satusehatFhirStudioService.serializePractitioner();
    expect(prac.resourceType).toBe('Practitioner');
    expect(prac.identifier.some(i => i.system === SATUSEHAT_CONFIG.SYSTEMS.IHS_NUMBER)).toBe(true);

    const pt = satusehatFhirStudioService.serializePatient();
    expect(pt.resourceType).toBe('Patient');
    expect(pt.identifier.some(i => i.system === SATUSEHAT_CONFIG.SYSTEMS.NIK && i.value.length === 16)).toBe(true);
  });

  // 2. Serialization of Encounter, Diagnosis, Lab, Medication & Procedure
  it('2. should serialize full episode of care (Encounter, Condition, Observation, Medication, Procedure)', () => {
    const enc = satusehatFhirStudioService.serializeEncounter();
    expect(enc.resourceType).toBe('Encounter');
    expect(enc.status).toBe('arrived');
    expect(enc.serviceProvider.reference).toBe('Organization/100028741');

    const cond = satusehatFhirStudioService.serializeCondition();
    expect(cond.resourceType).toBe('Condition');
    expect(cond.code.coding[0].system).toBe(SATUSEHAT_CONFIG.SYSTEMS.ICD10);
    expect(cond.code.coding[0].code).toBe('I10');

    const obs = satusehatFhirStudioService.serializeObservation();
    expect(obs.resourceType).toBe('Observation');
    expect(obs.code.coding[0].system).toBe(SATUSEHAT_CONFIG.SYSTEMS.LOINC);

    const medReq = satusehatFhirStudioService.serializeMedicationRequest();
    expect(medReq.resourceType).toBe('MedicationRequest');
    expect(medReq.medicationCodeableConcept.coding[0].system).toBe(SATUSEHAT_CONFIG.SYSTEMS.KFA);

    const proc = satusehatFhirStudioService.serializeProcedure();
    expect(proc.resourceType).toBe('Procedure');
    expect(proc.code.coding[0].system).toBe(SATUSEHAT_CONFIG.SYSTEMS.ICD9CM);

    const diag = satusehatFhirStudioService.serializeDiagnosticReport();
    expect(diag.resourceType).toBe('DiagnosticReport');
    expect(diag.conclusion).toContain('Cor dan pulmo');
  });

  // 3. Structure & Conformance Validator
  it('3. should validate compliant FHIR resources and score 100% conformance', () => {
    const validPatient = satusehatFhirStudioService.serializePatient();
    const validation = satusehatFhirStudioService.validateFhirResource(validPatient);

    expect(validation.isValid).toBe(true);
    expect(validation.conformanceScore).toBe(100);
    expect(validation.errorCount).toBe(0);
  });

  // 4. Validator Detection of Invalid Payload / Missing NIK
  it('4. should detect invalid resources (missing NIK or missing resourceType) and flag errors', () => {
    const invalidPatient = {
      resourceType: 'Patient',
      id: 'PT-INVALID',
      identifier: [] // Missing NIK
    };

    const validation = satusehatFhirStudioService.validateFhirResource(invalidPatient);
    expect(validation.isValid).toBe(false);
    expect(validation.errorCount).toBeGreaterThanOrEqual(1);
    expect(validation.issues.some(i => i.field === 'identifier.NIK')).toBe(true);
  });

  // 5. Transaction Bundle Assembly
  it('5. should assemble multi-resource Transaction Bundle with correct POST methods', () => {
    const patient = satusehatFhirStudioService.serializePatient();
    const encounter = satusehatFhirStudioService.serializeEncounter();
    const condition = satusehatFhirStudioService.serializeCondition();

    const bundle = satusehatFhirStudioService.buildTransactionBundle([patient, encounter, condition]);

    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('transaction');
    expect(bundle.entry.length).toBe(3);
    expect(bundle.entry[0].request.method).toBe('POST');
    expect(bundle.entry[0].request.url).toBe('Patient');
    expect(bundle.entry[1].request.url).toBe('Encounter');
  });

  // 6. OAuth2 Token Simulation & Refresh
  it('6. should generate and refresh SATUSEHAT OAuth2 Bearer token with active TTL', () => {
    const token = satusehatFhirStudioService.getOAuthToken();
    expect(token.access_token).toBeDefined();
    expect(token.token_type).toBe('Bearer');

    const refreshed = satusehatFhirStudioService.refreshOAuthToken();
    expect(refreshed.access_token).toBeDefined();
    expect(refreshed.expires_in).toBe(3600);
  });

  // 7. Transmission Simulator Execution & Gateway Logging
  it('7. should simulate transmission of valid bundle and record HTTP 200 log', () => {
    const bundle = satusehatFhirStudioService.buildTransactionBundle([
      satusehatFhirStudioService.serializePatient(),
      satusehatFhirStudioService.serializeEncounter()
    ]);

    const result = satusehatFhirStudioService.simulateTransmission(bundle, {
      endpoint: '/Bundle',
      targetEnvironment: 'SANDBOX'
    });

    expect(result.httpCode).toBe(200);
    expect(result.status).toBe('SUCCESS');
    expect(result.responseBody.status).toBe('synced_to_kemkes');

    const logs = satusehatFhirStudioService.getTransmissionLogs();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].endpoint).toBe('/Bundle');
  });

  // 8. Transmission Rejection on Invalid Payload
  it('8. should return OperationOutcome HTTP 400 when transmitting malformed resource', () => {
    const malformedResource = { invalidField: true }; // Missing resourceType & id

    const result = satusehatFhirStudioService.simulateTransmission(malformedResource, {
      endpoint: '/Unknown'
    });

    expect(result.httpCode).toBe(400);
    expect(result.status).toBe('FAILED');
    expect(result.responseBody.resourceType).toBe('OperationOutcome');
  });

});
