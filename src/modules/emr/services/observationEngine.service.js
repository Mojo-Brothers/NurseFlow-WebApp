/**
 * NurseFlow Enterprise HIS 2026 — Clinical Observation Engine (LOINC Mapped)
 * Sprint 4: SATUSEHAT FHIR Observation & Quantitative Trends
 * Standar Kepatuhan: LOINC, Permenkes 24/2022, SATUSEHAT HL7 FHIR R4.
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

export const LOINC_CODES = {
  HEART_RATE: { code: '8867-4', display: 'Heart rate', unit: 'bpm' },
  BP_SYSTOLIC: { code: '8480-6', display: 'Systolic blood pressure', unit: 'mmHg' },
  BP_DIASTOLIC: { code: '8462-4', display: 'Diastolic blood pressure', unit: 'mmHg' },
  RESPIRATORY_RATE: { code: '9279-1', display: 'Respiratory rate', unit: '/min' },
  BODY_TEMP: { code: '8310-5', display: 'Body temperature', unit: 'Cel' },
  SPO2: { code: '59408-5', display: 'Oxygen saturation in Arterial blood', unit: '%' },
  BLOOD_GLUCOSE: { code: '2339-0', display: 'Glucose [Mass/volume] in Blood', unit: 'mg/dL' },
  EGFR: { code: '33914-3', display: 'Glomerular filtration rate/1.73 sq M', unit: 'mL/min/1.73m2' }
};

const OBSERVATIONS_STORAGE_KEY = 'nurseflow_clinical_observations';

const getStoredObservations = () => {
  try {
    const raw = localStorage.getItem(OBSERVATIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[ObservationEngine] Failed to load observations:', e);
  }
  return [
    {
      id: 'OBS-2026-001',
      encounter_id: 'ENC-2026-001',
      episode_id: 'EOC-2026-001',
      patient_id: 'P-1001',
      observation_type: 'VITAL_SIGN',
      loinc_code: '8480-6',
      loinc_display: 'Systolic blood pressure',
      observation_value: '130',
      unit: 'mmHg',
      interpretation: 'NORMAL',
      observed_at: '2026-08-17T08:30:00Z',
      observer_name: 'Ns. Ratna Sari, S.Kep'
    },
    {
      id: 'OBS-2026-002',
      encounter_id: 'ENC-2026-001',
      episode_id: 'EOC-2026-001',
      patient_id: 'P-1001',
      observation_type: 'VITAL_SIGN',
      loinc_code: '59408-5',
      loinc_display: 'Oxygen saturation',
      observation_value: '97',
      unit: '%',
      interpretation: 'NORMAL',
      observed_at: '2026-08-17T08:30:00Z',
      observer_name: 'Ns. Ratna Sari, S.Kep'
    }
  ];
};

const saveStoredObservations = (list) => {
  try {
    localStorage.setItem(OBSERVATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[ObservationEngine] Failed to save observations:', e);
  }
};

export const observationEngineService = {
  /**
   * Record Clinical Observation with LOINC Mapping
   */
  recordObservation: async ({
    encounterId,
    episodeId,
    patientId,
    observationType = 'VITAL_SIGN',
    loincCode,
    loincDisplay,
    observationValue,
    unit,
    referenceRange = '',
    interpretation = 'NORMAL',
    observerName = 'Ns. Ratna Sari, S.Kep',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const now = new Date().toISOString();
    const obsRecord = {
      id: `OBS-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      encounter_id: encounterId,
      episode_id: episodeId,
      patient_id: patientId,
      observation_type: observationType,
      loinc_code: loincCode,
      loinc_display: loincDisplay,
      observation_value: observationValue,
      unit: unit || 'unit',
      reference_range: referenceRange,
      interpretation: interpretation,
      observed_at: now,
      observer_name: observerName
    };

    const currentList = getStoredObservations();
    saveStoredObservations([obsRecord, ...currentList]);

    await outboxPublisherService.stageEvent({
      aggregateType: 'CLINICAL_OBSERVATION',
      aggregateId: obsRecord.id,
      eventName: 'OBSERVATION_CREATED',
      payload: obsRecord,
      actor: actorEmail
    });

    return obsRecord;
  },

  /**
   * Get Observations for Patient/Encounter
   */
  getObservations: (patientId = null, encounterId = null) => {
    let list = getStoredObservations();
    if (patientId) {
      list = list.filter(o => o.patient_id === patientId);
    }
    if (encounterId) {
      list = list.filter(o => o.encounter_id === encounterId);
    }
    return list;
  }
};
