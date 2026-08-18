/**
 * NURSEFLOW ENTERPRISE HIS — CANONICAL CLINICAL DOMAIN CONTRACT (FROZEN v1.0)
 * 
 * Authoritative Single Source of Truth (SSOT) defining Domain Entities,
 * Invariants, Lifecycle States, Audit Provenance, and SATUSEHAT FHIR R4 Target Mappings.
 * 
 * Hierarchy:
 * Patient (EMPI)
 *    ├── Encounter
 *    │      ├── CareState (FSM)
 *    │      ├── ClinicalRecord (JCI Chapters / SOAP / Anamnesis)
 *    │      ├── Medication (CPOE / 5-Rights / FEFO / eMAR)
 *    │      ├── Observation (Vitals / NEWS2 / Lab Panic Values)
 *    │      ├── Procedure (Surgical Checklist / OK Records)
 *    │      └── Document (Legal Consent / Resume Medis / BSrE Signature)
 *    └── Longitudinal History (Episode of Care Timeline)
 */

export const DOMAIN_CONTRACT_VERSION = '1.0.0-FROZEN';

/**
 * ─── 1. PATIENT ENTITY CONTRACT ──────────────────────────────────────────────
 */
export const PATIENT_CONTRACT = Object.freeze({
  entity: 'Patient',
  description: 'Master Patient Identity managed by MPI Engine (EMPI)',
  identity: {
    primaryKey: 'id', // Unique Internal EMPI UUID / String
    alternateKeys: ['mrn', 'nik', 'ihsNumber', 'bpjsCardNo'],
    format: {
      mrn: /^MRN-\d{4}-\d{4}$|^MRN-\w+$/,
      nik: /^\d{16}$/
    }
  },
  ownership: {
    steward: 'Hospital Medical Records & EMPI Governance',
    accessRoles: ['DOCTOR', 'NURSE', 'PHARMACIST', 'ADMISSION_STAFF', 'ADMIN']
  },
  lifecycle: {
    states: ['ACTIVE', 'MERGED', 'DECEASED', 'INACTIVE'],
    initial: 'ACTIVE'
  },
  versioning: {
    concurrencyControl: 'OPTIMISTIC_LOCKING',
    field: 'version'
  },
  auditProvenance: {
    immutableLedger: false,
    auditTrailEvent: 'PATIENT_DEMOGRAPHICS_MUTATED',
    requiredFields: ['id', 'mrn', 'name', 'dob', 'gender', 'updatedAt', 'updatedBy']
  },
  encounterRelationship: 'ONE_TO_MANY',
  fhirMappingTarget: {
    resourceType: 'Patient',
    profiles: ['https://fhir.kemkes.go.id/r4/StructureDefinition/Patient'],
    identifierMappers: {
      nik: 'https://fhir.kemkes.go.id/id/nik',
      mrn: 'https://fhir.kemkes.go.id/id/mrn',
      ihsNumber: 'https://fhir.kemkes.go.id/id/ihs-number',
      bpjsCardNo: 'https://fhir.kemkes.go.id/id/bpjs-kartu'
    }
  }
});

/**
 * ─── 2. ENCOUNTER ENTITY CONTRACT ────────────────────────────────────────────
 */
export const ENCOUNTER_CONTRACT = Object.freeze({
  entity: 'Encounter',
  description: 'Clinical interaction boundary binding patient, DPJP, ward, care state, and episode of care',
  identity: {
    primaryKey: 'id',
    alternateKeys: ['encounterNumber'],
    format: {
      encounterNumber: /^ENC-\d{8}-\d{4}$|^ENC-\w+$/
    }
  },
  ownership: {
    attendingPhysicianField: 'dpjpId',
    responsibleDepartmentField: 'departmentId',
    accessRoles: ['DOCTOR', 'NURSE', 'PHARMACIST', 'CASEMIX', 'ADMIN']
  },
  lifecycle: {
    states: [
      'PLANNED',
      'REGISTERED',
      'TRIAGE_PENDING',
      'IGD_ACTIVE',
      'IGD_OBSERVATION',
      'ADMISSION_PENDING',
      'INPATIENT_ACTIVE',
      'ICU_ACTIVE',
      'OR_ACTIVE',
      'PACU_RECOVERY',
      'DISCHARGE_PENDING',
      'DISCHARGED',
      'REFERRED',
      'LEFT_AGAINST_MEDICAL_ADVICE',
      'DECEASED',
      'CANCELLED'
    ],
    terminalStates: ['DISCHARGED', 'REFERRED', 'LEFT_AGAINST_MEDICAL_ADVICE', 'DECEASED', 'CANCELLED'],
    initial: 'REGISTERED'
  },
  versioning: {
    concurrencyControl: 'OPTIMISTIC_LOCKING',
    field: 'version'
  },
  auditProvenance: {
    immutableLedger: false,
    auditTrailEvent: 'ENCOUNTER_STATE_TRANSITIONED',
    requiredFields: ['id', 'patientId', 'encounterNumber', 'type', 'primaryState', 'admittedAt']
  },
  encounterRelationship: 'SELF',
  fhirMappingTarget: {
    resourceType: 'Encounter',
    profiles: ['https://fhir.kemkes.go.id/r4/StructureDefinition/Encounter'],
    classMappers: {
      EMERGENCY: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'EMER', display: 'emergency' },
      INPATIENT: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IMP', display: 'inpatient encounter' },
      OUTPATIENT: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
      SURGERY: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'SS', display: 'short stay' }
    }
  }
});

/**
 * ─── 3. CARE STATE ENTITY CONTRACT (FSM WORM LEDGER) ─────────────────────────
 */
export const CARE_STATE_CONTRACT = Object.freeze({
  entity: 'CareState',
  description: 'Append-Only Immutable Care State Event Stream managed by CareStateEngine',
  identity: {
    primaryKey: 'id',
    format: /^EVT-CS-\d+-\w+$/
  },
  ownership: {
    steward: 'CareStateEngine (Single Source of Truth)',
    accessRoles: ['SYSTEM', 'DOCTOR', 'NURSE', 'ADMISSION_STAFF']
  },
  lifecycle: {
    immutable: true,
    writePolicy: 'APPEND_ONLY',
    deletePolicy: 'FORBIDDEN_BY_LAW'
  },
  versioning: {
    field: 'aggregateVersion',
    lineageField: 'correlationId'
  },
  auditProvenance: {
    immutableLedger: true,
    collection: 'patient_care_state_events',
    requiredFields: ['id', 'encounter_id', 'patient_id', 'previous_state', 'new_state', 'performed_by_id', 'performed_at']
  },
  encounterRelationship: 'CHILD_OF_ENCOUNTER',
  fhirMappingTarget: {
    resourceType: 'Encounter.statusHistory',
    profiles: ['https://fhir.kemkes.go.id/r4/StructureDefinition/Encounter']
  }
});

/**
 * ─── 4. CLINICAL RECORD ENTITY CONTRACT (JCI LEGAL DOSSIER) ──────────────────
 */
export const CLINICAL_RECORD_CONTRACT = Object.freeze({
  entity: 'ClinicalRecord',
  description: 'Certified Medical Documentation conforming to 34 JCI Chapters & Indonesian PMK 24/2022',
  identity: {
    primaryKey: 'id',
    format: /^REC-\w+-\d+$/
  },
  ownership: {
    authorRoleField: 'authorRole',
    authorIdField: 'authorId',
    signedByField: 'signed_by',
    accessRoles: ['DOCTOR', 'NURSE', 'PHARMACIST', 'NUTRITIONIST', 'PHYSIOTHERAPIST']
  },
  lifecycle: {
    states: ['DRAFT', 'SIGNED', 'ADDENDUM_ATTACHED', 'VOIDED'],
    initial: 'DRAFT',
    lockOnSign: true
  },
  versioning: {
    field: 'version',
    parentRecordIdField: 'parentRecordId' // For Addendums
  },
  auditProvenance: {
    immutableLedger: true,
    requiredFields: ['id', 'encounterId', 'patientId', 'moduleName', 'title', 'created_at', 'signed_by']
  },
  encounterRelationship: 'CHILD_OF_ENCOUNTER',
  fhirMappingTarget: {
    resourceType: 'Composition / Condition / ClinicalImpression',
    profiles: [
      'https://fhir.kemkes.go.id/r4/StructureDefinition/Composition',
      'https://fhir.kemkes.go.id/r4/StructureDefinition/Condition'
    ]
  }
});

/**
 * ─── 5. MEDICATION ENTITY CONTRACT (CPOE + FEFO + eMAR) ──────────────────────
 */
export const MEDICATION_CONTRACT = Object.freeze({
  entity: 'Medication',
  description: 'Enterprise Closed-Loop Medication Administration, 5-Rights, FEFO Batching & Controlled Substances',
  identity: {
    orderIdKey: 'orderId',
    eventStreamCollection: 'medication_events',
    format: {
      orderId: /^ORD-\w+-\d+$/,
      eventId: /^EVT-MED-\w+-\d+$/
    }
  },
  ownership: {
    prescriberField: 'prescriberId',
    dispenserField: 'dispenserPharmacistId',
    administratorField: 'administeredByNurseId',
    accessRoles: ['DOCTOR', 'PHARMACIST', 'NURSE']
  },
  lifecycle: {
    states: [
      'PRESCRIBED',
      'VALIDATED',
      'DISPENSED',
      'READY_FOR_ADMINISTRATION',
      'ADMINISTERED',
      'NOT_ADMINISTERED',
      'CANCELLED',
      'DISCONTINUED'
    ],
    initial: 'PRESCRIBED'
  },
  versioning: {
    field: 'eventSequence',
    lineageField: 'correlationId'
  },
  auditProvenance: {
    immutableLedger: true,
    collection: 'medication_events',
    requiredFields: ['id', 'orderId', 'encounterId', 'patientId', 'drugName', 'action', 'actor', 'timestamp']
  },
  encounterRelationship: 'CHILD_OF_ENCOUNTER',
  fhirMappingTarget: {
    resourceTypes: ['MedicationRequest', 'MedicationDispense', 'MedicationAdministration'],
    profiles: [
      'https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationRequest',
      'https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationDispense',
      'https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationAdministration'
    ],
    kfaCodeSystem: 'http://sys-ids.kemkes.go.id/kfa'
  }
});

/**
 * ─── 6. OBSERVATION ENTITY CONTRACT (VITALS, NEWS2, LAB PANIC) ────────────────
 */
export const OBSERVATION_CONTRACT = Object.freeze({
  entity: 'Observation',
  description: 'Clinical measurements, Vital Signs, NEWS2 Scores, GCS, and Panic Lab alerts',
  identity: {
    primaryKey: 'id',
    format: /^OBS-\w+-\d+$/
  },
  ownership: {
    observerIdField: 'performedById',
    accessRoles: ['DOCTOR', 'NURSE', 'LAB_TECHNICIAN']
  },
  lifecycle: {
    states: ['REGISTERED', 'PRELIMINARY', 'FINAL', 'AMENDED', 'CANCELLED'],
    initial: 'FINAL'
  },
  versioning: {
    field: 'version'
  },
  auditProvenance: {
    immutableLedger: true,
    requiredFields: ['id', 'encounterId', 'patientId', 'category', 'code', 'value', 'timestamp']
  },
  encounterRelationship: 'CHILD_OF_ENCOUNTER',
  fhirMappingTarget: {
    resourceType: 'Observation',
    profiles: ['https://fhir.kemkes.go.id/r4/StructureDefinition/Observation'],
    loincCodeSystem: 'http://loinc.org'
  }
});

/**
 * ─── 7. PROCEDURE ENTITY CONTRACT (SURGERY, OK, ANESTHESIA) ──────────────────
 */
export const PROCEDURE_CONTRACT = Object.freeze({
  entity: 'Procedure',
  description: 'Surgical and interventional procedures, Surgical Safety Checklist, and Anesthesia records',
  identity: {
    primaryKey: 'id',
    format: /^PROC-\w+-\d+$/
  },
  ownership: {
    primarySurgeonField: 'primarySurgeonId',
    anesthesiologistField: 'anesthesiologistId',
    accessRoles: ['DOCTOR', 'SURGEON', 'ANESTHESIOLOGIST', 'OR_NURSE']
  },
  lifecycle: {
    states: ['PREPARATION', 'IN_PROGRESS', 'COMPLETED', 'ABORTED'],
    initial: 'PREPARATION'
  },
  versioning: {
    field: 'version'
  },
  auditProvenance: {
    immutableLedger: true,
    requiredFields: ['id', 'encounterId', 'patientId', 'procedureName', 'icd9Code', 'startedAt', 'completedAt']
  },
  encounterRelationship: 'CHILD_OF_ENCOUNTER',
  fhirMappingTarget: {
    resourceType: 'Procedure',
    profiles: ['https://fhir.kemkes.go.id/r4/StructureDefinition/Procedure'],
    icd9CodeSystem: 'http://hl7.org/fhir/sid/icd-9-cm'
  }
});

/**
 * ─── 8. DOCUMENT ENTITY CONTRACT (LEGAL CONSENTS, RESUME MEDIS) ──────────────
 */
export const DOCUMENT_CONTRACT = Object.freeze({
  entity: 'Document',
  description: 'Legal Medical Documents with BSrE Digital Signatures (Informed Consent, General Consent, Discharge Summary)',
  identity: {
    primaryKey: 'id',
    format: /^DOC-\w+-\d+$/
  },
  ownership: {
    signatoryField: 'signatoryPerson',
    witnessField: 'witnessPerson',
    accessRoles: ['DOCTOR', 'NURSE', 'LEGAL', 'PATIENT_PROXY']
  },
  lifecycle: {
    states: ['PENDING_SIGNATURE', 'DIGITALLY_SIGNED_BSRE', 'REVOKED'],
    initial: 'PENDING_SIGNATURE'
  },
  versioning: {
    field: 'documentVersion'
  },
  auditProvenance: {
    immutableLedger: true,
    requiredFields: ['id', 'encounterId', 'patientId', 'documentType', 'signatureHash', 'signedAt']
  },
  encounterRelationship: 'CHILD_OF_ENCOUNTER',
  fhirMappingTarget: {
    resourceType: 'DocumentReference / Consent',
    profiles: [
      'https://fhir.kemkes.go.id/r4/StructureDefinition/DocumentReference',
      'https://fhir.kemkes.go.id/r4/StructureDefinition/Consent'
    ]
  }
});

/**
 * ─── 9. CANONICAL PIPELINE BLUEPRINT (PREVENTING SPAGHETTI INTEGRATION) ───────
 */
export const CANONICAL_FHIR_PIPELINE_ARCHITECTURE = Object.freeze({
  pipelineStages: [
    {
      stage: 1,
      name: 'CLINICAL_DOMAIN_LAYER',
      description: 'NurseFlow core business engines (CareStateEngine, MedicationEngine, ADTEngine, etc.) execute hospital transactions.',
      ssot: true
    },
    {
      stage: 2,
      name: 'CANONICAL_CLINICAL_EVENTS',
      description: 'DomainEventEngine emits standardized immutable events (e.g. PATIENT_ADMITTED, MEDICATION_ADMINISTERED, CONDITION_DIAGNOSED).',
      immutable: true
    },
    {
      stage: 3,
      name: 'FHIR_MAPPING_LAYER',
      description: 'Centralized fhirMappers service transforms canonical domain entities into FHIR R4 Bundle without point-to-point spaghetti.',
      pureFunction: true
    },
    {
      stage: 4,
      name: 'SATUSEHAT_GATEWAY',
      description: 'OAuth2 token management, payload validation against Kemkes profiles, rate-limiting, and resilient outbox dispatching.',
      resilience: 'OUTBOX_PATTERN_SUPPORTED'
    },
    {
      stage: 5,
      name: 'KEMKES_SATUSEHAT_ENDPOINT',
      description: 'Production SATUSEHAT FHIR R4 Platform.'
    }
  ]
});

/**
 * Master Domain Contract Registry
 */
export const CANONICAL_DOMAIN_REGISTRY = Object.freeze({
  version: DOMAIN_CONTRACT_VERSION,
  entities: {
    Patient: PATIENT_CONTRACT,
    Encounter: ENCOUNTER_CONTRACT,
    CareState: CARE_STATE_CONTRACT,
    ClinicalRecord: CLINICAL_RECORD_CONTRACT,
    Medication: MEDICATION_CONTRACT,
    Observation: OBSERVATION_CONTRACT,
    Procedure: PROCEDURE_CONTRACT,
    Document: DOCUMENT_CONTRACT
  },
  pipeline: CANONICAL_FHIR_PIPELINE_ARCHITECTURE
});

export default CANONICAL_DOMAIN_REGISTRY;
