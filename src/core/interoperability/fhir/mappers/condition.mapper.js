/**
 * FHIR R4 Condition Mapper (ICD-10 Diagnoses)
 */
import { KEMKES_PROFILES, KEMKES_SYSTEMS } from '../profiles/kemkesProfiles.js';

export function mapCondition(condition) {
  if (!condition) return null;

  const icd10Code = condition.icd10Code || condition.code || 'A09.9';
  const display = condition.diagnosis || condition.display || condition.name || 'Gastroenteritis and colitis of unspecified origin';

  return {
    resourceType: 'Condition',
    id: condition.id || `COND-${Date.now()}`,
    meta: {
      profile: [KEMKES_PROFILES.CONDITION]
    },
    clinicalStatus: {
      coding: [
        {
          system: KEMKES_SYSTEMS.CONDITION_CLINICAL,
          code: condition.status === 'RESOLVED' ? 'resolved' : 'active',
          display: condition.status === 'RESOLVED' ? 'Resolved' : 'Active'
        }
      ]
    },
    verificationStatus: {
      coding: [
        {
          system: KEMKES_SYSTEMS.CONDITION_VER_STATUS,
          code: condition.isDifferential ? 'provisional' : 'confirmed',
          display: condition.isDifferential ? 'Provisional' : 'Confirmed'
        }
      ]
    },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: condition.isPrimary ? 'encounter-diagnosis' : 'problem-list-item',
            display: condition.isPrimary ? 'Encounter Diagnosis' : 'Problem List Item'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: KEMKES_SYSTEMS.ICD10,
          code: icd10Code,
          display: display
        }
      ],
      text: display
    },
    subject: {
      reference: `Patient/${condition.patientId || condition.patient_id}`,
      display: condition.patientName || 'Pasien'
    },
    encounter: condition.encounterId ? {
      reference: `Encounter/${condition.encounterId}`
    } : undefined,
    recordedDate: condition.recordedAt || condition.created_at || new Date().toISOString()
  };
}
