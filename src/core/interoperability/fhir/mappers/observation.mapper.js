/**
 * FHIR R4 Observation Mapper (Vital Signs, NEWS2, LOINC Labs)
 */
import { KEMKES_PROFILES, KEMKES_SYSTEMS } from '../profiles/kemkesProfiles.js';

export function mapObservation(obs) {
  if (!obs) return null;

  // LOINC code mapping for common hospital measurements
  const LOINC_MAP = {
    BP: { code: '85354-9', display: 'Blood pressure panel with all children optional', unit: 'mmHg' },
    HR: { code: '8867-4', display: 'Heart rate', unit: 'beats/minute', ucum: '/min' },
    RR: { code: '9279-1', display: 'Respiratory rate', unit: 'breaths/minute', ucum: '/min' },
    TEMP: { code: '8310-5', display: 'Body temperature', unit: 'degrees C', ucum: 'Cel' },
    SPO2: { code: '2708-6', display: 'Oxygen saturation in Arterial blood', unit: '%', ucum: '%' },
    NEWS2: { code: '89280-2', display: 'National Early Warning Score 2', unit: 'score', ucum: '{score}' },
    GCS: { code: '9269-2', display: 'Glasgow coma score total', unit: 'score', ucum: '{score}' }
  };

  const obsType = (obs.type || obs.category || 'VITAL_SIGNS').toUpperCase();
  const loincInfo = LOINC_MAP[obs.code] || {
    code: obs.loincCode || '8867-4',
    display: obs.name || 'Clinical Observation',
    unit: obs.unit || 'unit',
    ucum: obs.ucum || '{score}'
  };

  const resource = {
    resourceType: 'Observation',
    id: obs.id || `OBS-${Date.now()}`,
    meta: {
      profile: [KEMKES_PROFILES.OBSERVATION_VITALS]
    },
    status: 'final',
    category: [
      {
        coding: [
          {
            system: KEMKES_SYSTEMS.OBSERVATION_CATEGORY,
            code: 'vital-signs',
            display: 'Vital Signs'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: KEMKES_SYSTEMS.LOINC,
          code: loincInfo.code,
          display: loincInfo.display
        }
      ],
      text: loincInfo.display
    },
    subject: {
      reference: `Patient/${obs.patientId || obs.patient_id}`,
      display: obs.patientName || 'Pasien'
    },
    encounter: obs.encounterId ? {
      reference: `Encounter/${obs.encounterId}`
    } : undefined,
    effectiveDateTime: obs.timestamp || obs.recordedAt || new Date().toISOString(),
    performer: obs.performerId ? [
      {
        reference: `Practitioner/${obs.performerId}`,
        display: obs.performerName || 'Tenaga Medis'
      }
    ] : undefined
  };

  // If observation is Blood Pressure with systolic + diastolic components
  if (obs.code === 'BP' || (obs.systolic !== undefined && obs.diastolic !== undefined)) {
    resource.component = [
      {
        code: {
          coding: [{ system: KEMKES_SYSTEMS.LOINC, code: '8480-6', display: 'Systolic blood pressure' }]
        },
        valueQuantity: {
          value: Number(obs.systolic || 120),
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        }
      },
      {
        code: {
          coding: [{ system: KEMKES_SYSTEMS.LOINC, code: '8462-4', display: 'Diastolic blood pressure' }]
        },
        valueQuantity: {
          value: Number(obs.diastolic || 80),
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        }
      }
    ];
  } else if (obs.value !== undefined && typeof obs.value === 'number') {
    resource.valueQuantity = {
      value: obs.value,
      unit: loincInfo.unit,
      system: 'http://unitsofmeasure.org',
      code: loincInfo.ucum
    };
  } else {
    resource.valueString = String(obs.value || obs.textValue || 'Normal');
  }

  return resource;
}
