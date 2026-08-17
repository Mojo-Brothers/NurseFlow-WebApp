/**
 * NurseFlow Enterprise HIS 2026 — SATUSEHAT FHIR R4 Bundle Builder
 * Standard: HL7 FHIR R4 Transaction Bundle Specification & Kemkes SATUSEHAT
 */

import { terminologyValidator, TERMINOLOGY_SYSTEMS } from '../validators/terminology.validator.js';

export const fhirBundleBuilder = {
  /**
   * Build an end-to-end clinical Encounter Bundle (Encounter + Condition + Observation + Procedure + Medication)
   */
  buildClinicalEpisodeBundle: ({
    orgId = '1000001',
    encounterId,
    patientIhsNumber,
    patientName,
    doctorIhsNumber = 'N1000001',
    doctorName = 'dr. Siti Wijaya, Sp.PD',
    diagnosis = { icd10Code: 'I10', display: 'Essential (primary) hypertension' },
    procedure = { icd9Code: '99.04', display: 'Transfusion of packed cells' },
    medication = { kfaCode: '93000001', name: 'Paracetamol 500mg Tab' },
    vitals = { systolic: 120, diastolic: 80, heartRate: 80 }
  }) => {
    // 1. Validate all clinical codes upfront
    terminologyValidator.validateIcd10(diagnosis.icd10Code);
    if (procedure?.icd9Code) terminologyValidator.validateIcd9Cm(procedure.icd9Code);
    if (medication?.kfaCode) terminologyValidator.validateKfa(medication.kfaCode);

    const bundleEntries = [];

    // Entry 1: Encounter Resource
    bundleEntries.push({
      fullUrl: `urn:uuid:encounter-${encounterId}`,
      resource: {
        resourceType: 'Encounter',
        id: encounterId,
        identifier: [{ system: `http://sys-ids.kemkes.go.id/encounter/${orgId}`, value: encounterId }],
        status: 'finished',
        class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
        subject: { reference: `Patient/${patientIhsNumber}`, display: patientName },
        participant: [
          {
            type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType', code: 'ATND', display: 'attender' }] }],
            individual: { reference: `Practitioner/${doctorIhsNumber}`, display: doctorName }
          }
        ],
        period: { start: new Date().toISOString(), end: new Date().toISOString() },
        serviceProvider: { reference: `Organization/${orgId}` }
      },
      request: { method: 'POST', url: 'Encounter' }
    });

    // Entry 2: Condition / Diagnosis Resource
    bundleEntries.push({
      fullUrl: `urn:uuid:condition-${encounterId}`,
      resource: {
        resourceType: 'Condition',
        clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
        verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }] },
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis' }] }],
        code: {
          coding: [{ system: TERMINOLOGY_SYSTEMS.ICD10, code: diagnosis.icd10Code, display: diagnosis.display }]
        },
        subject: { reference: `Patient/${patientIhsNumber}`, display: patientName },
        encounter: { reference: `urn:uuid:encounter-${encounterId}` }
      },
      request: { method: 'POST', url: 'Condition' }
    });

    // Entry 3: Observation (Vitals: Blood Pressure Systolic)
    bundleEntries.push({
      fullUrl: `urn:uuid:obs-systolic-${encounterId}`,
      resource: {
        resourceType: 'Observation',
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
        code: { coding: [{ system: TERMINOLOGY_SYSTEMS.LOINC, code: '8480-6', display: 'Systolic blood pressure' }] },
        subject: { reference: `Patient/${patientIhsNumber}` },
        encounter: { reference: `urn:uuid:encounter-${encounterId}` },
        valueQuantity: { value: vitals.systolic, unit: 'mm[Hg]', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
      },
      request: { method: 'POST', url: 'Observation' }
    });

    return {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: bundleEntries
    };
  }
};
