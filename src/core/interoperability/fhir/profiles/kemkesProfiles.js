/**
 * NURSEFLOW ENTERPRISE HIS — KEMKES SATUSEHAT FHIR R4 PROFILES & SYSTEMS
 * Official URL Identifiers, System CodeSystems, and StructureDefinitions.
 */

export const SATUSEHAT_ORGANIZATION_ID = '100028741'; // RSUP Master Org ID

export const KEMKES_PROFILES = Object.freeze({
  PATIENT: 'https://fhir.kemkes.go.id/r4/StructureDefinition/Patient',
  ENCOUNTER: 'https://fhir.kemkes.go.id/r4/StructureDefinition/Encounter',
  PRACTITIONER: 'https://fhir.kemkes.go.id/r4/StructureDefinition/Practitioner',
  ORGANIZATION: 'https://fhir.kemkes.go.id/r4/StructureDefinition/Organization',
  LOCATION: 'https://fhir.kemkes.go.id/r4/StructureDefinition/Location',
  CONDITION: 'https://fhir.kemkes.go.id/r4/StructureDefinition/Condition',
  OBSERVATION: 'https://fhir.kemkes.go.id/r4/StructureDefinition/Observation',
  OBSERVATION_VITALS: 'https://fhir.kemkes.go.id/r4/StructureDefinition/Observation-vital-signs',
  OBSERVATION_LAB: 'https://fhir.kemkes.go.id/r4/StructureDefinition/Observation-lab',
  PROCEDURE: 'https://fhir.kemkes.go.id/r4/StructureDefinition/Procedure',
  MEDICATION_REQUEST: 'https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationRequest',
  MEDICATION_DISPENSE: 'https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationDispense',
  MEDICATION_ADMINISTRATION: 'https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationAdministration',
  MEDICATION: 'https://fhir.kemkes.go.id/r4/StructureDefinition/Medication',
  ALLERGY_INTOLERANCE: 'https://fhir.kemkes.go.id/r4/StructureDefinition/AllergyIntolerance',
  DIAGNOSTIC_REPORT: 'https://fhir.kemkes.go.id/r4/StructureDefinition/DiagnosticReport',
  DOCUMENT_REFERENCE: 'https://fhir.kemkes.go.id/r4/StructureDefinition/DocumentReference',
  CONSENT: 'https://fhir.kemkes.go.id/r4/StructureDefinition/Consent'
});

export const KEMKES_SYSTEMS = Object.freeze({
  NIK: 'https://fhir.kemkes.go.id/id/nik',
  PASIEN: `https://fhir.kemkes.go.id/id/pasien/${SATUSEHAT_ORGANIZATION_ID}`,
  NIP: 'https://fhir.kemkes.go.id/id/nip',
  SIP: 'https://fhir.kemkes.go.id/id/sip',
  IHS_NUMBER: 'https://fhir.kemkes.go.id/id/ihs-number',
  BPJS_CARD: 'https://fhir.kemkes.go.id/id/bpjs-kartu',
  ENCOUNTER: `http://sys-ids.kemkes.go.id/encounter/${SATUSEHAT_ORGANIZATION_ID}`,
  PRESCRIPTION: `http://sys-ids.kemkes.go.id/prescription/${SATUSEHAT_ORGANIZATION_ID}`,
  DISPENSE: `http://sys-ids.kemkes.go.id/dispense/${SATUSEHAT_ORGANIZATION_ID}`,
  ADMINISTRATION: `http://sys-ids.kemkes.go.id/administration/${SATUSEHAT_ORGANIZATION_ID}`,
  LOCATION: `http://sys-ids.kemkes.go.id/location/${SATUSEHAT_ORGANIZATION_ID}`,
  ORGANIZATION: 'http://sys-ids.kemkes.go.id/organization',
  KFA: 'http://sys-ids.kemkes.go.id/kfa',
  ICD10: 'http://hl7.org/fhir/sid/icd-10',
  ICD9CM: 'http://hl7.org/fhir/sid/icd-9-cm',
  LOINC: 'http://loinc.org',
  SNOMED: 'http://snomed.info/sct',
  ACT_CODE: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
  CONDITION_CLINICAL: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
  CONDITION_VER_STATUS: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  OBSERVATION_CATEGORY: 'http://terminology.hl7.org/CodeSystem/observation-category'
});
