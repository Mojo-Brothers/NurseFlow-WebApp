/**
 * NurseFlow Enterprise HIS 2026 — Clinical Diagnosis Engine (ICD-10 & SNOMED CT)
 * Sprint 4: SATUSEHAT Condition Resource & Morbidity Coding
 * Standar Kepatuhan: WHO ICD-10 10th Revision, SNOMED CT, Permenkes 24/2022.
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

export const ICD10_CATALOG = [
  { code: 'I10', name: 'Essential (primary) hypertension', snomed: '38341003' },
  { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', snomed: '44054006' },
  { code: 'A90', name: 'Dengue fever [classical dengue]', snomed: '38362002' },
  { code: 'J00', name: 'Acute nasopharyngitis [common cold]', snomed: '82272006' },
  { code: 'K29.7', name: 'Gastritis, unspecified', snomed: '4556007' },
  { code: 'J18.9', name: 'Pneumonia, unspecified organism', snomed: '233604007' },
  { code: 'I21.9', name: 'Acute myocardial infarction, unspecified', snomed: '57054005' },
  { code: 'I63.9', name: 'Cerebral infarction, unspecified (Stroke Iskemik)', snomed: '422504002' },
  { code: 'N18.9', name: 'Chronic kidney disease, unspecified', snomed: '709044004' }
];

const DIAGNOSES_STORAGE_KEY = 'nurseflow_clinical_diagnoses';

const getStoredDiagnoses = () => {
  try {
    const raw = localStorage.getItem(DIAGNOSES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[DiagnosisEngine] Failed to load diagnoses:', e);
  }
  return [
    {
      id: 'DX-1001',
      encounter_id: 'ENC-2026-001',
      episode_id: 'EOC-2026-001',
      patient_id: 'P-1001',
      diagnosis_type: 'PRIMARY',
      icd10_code: 'A90',
      diagnosis_name: 'Dengue fever [classical dengue]',
      snomed_ct_code: '38362002',
      is_primary: true,
      is_active: true,
      created_at: '2026-08-17T08:30:00Z',
      diagnosed_by: 'dr. Siti Wijaya, Sp.PD-KGEH'
    }
  ];
};

const saveStoredDiagnoses = (list) => {
  try {
    localStorage.setItem(DIAGNOSES_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[DiagnosisEngine] Failed to save diagnoses:', e);
  }
};

export const diagnosisEngineService = {
  /**
   * Search ICD-10 Catalog
   */
  searchIcd10: (query) => {
    if (!query) return ICD10_CATALOG;
    const q = query.toLowerCase();
    return ICD10_CATALOG.filter(d =>
      d.code.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q)
    );
  },

  /**
   * Record Diagnosis
   */
  recordDiagnosis: async ({
    encounterId,
    episodeId,
    patientId,
    diagnosisType = 'PRIMARY',
    icd10Code,
    diagnosisName,
    snomedCtCode = '',
    isPrimary = true,
    diagnosedBy = 'dr. Siti Wijaya, Sp.PD-KGEH',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const now = new Date().toISOString();
    const diagnosisRecord = {
      id: `DX-${Date.now()}`,
      encounter_id: encounterId,
      episode_id: episodeId,
      patient_id: patientId,
      diagnosis_type: diagnosisType,
      icd10_code: icd10Code,
      diagnosis_name: diagnosisName,
      snomed_ct_code: snomedCtCode,
      is_primary: isPrimary,
      is_active: true,
      created_at: now,
      diagnosed_by: diagnosedBy
    };

    const currentList = getStoredDiagnoses();
    saveStoredDiagnoses([diagnosisRecord, ...currentList]);

    await outboxPublisherService.stageEvent({
      aggregateType: 'CLINICAL_DIAGNOSIS',
      aggregateId: diagnosisRecord.id,
      eventName: 'DIAGNOSIS_CREATED',
      payload: diagnosisRecord,
      actor: actorEmail
    });

    return diagnosisRecord;
  },

  /**
   * Get Diagnoses for Patient / Encounter
   */
  getDiagnoses: (patientId = null, encounterId = null) => {
    let list = getStoredDiagnoses();
    if (patientId) {
      list = list.filter(d => d.patient_id === patientId);
    }
    if (encounterId) {
      list = list.filter(d => d.encounter_id === encounterId);
    }
    return list;
  }
};
