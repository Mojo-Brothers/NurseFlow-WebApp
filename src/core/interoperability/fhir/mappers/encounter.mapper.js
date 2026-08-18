/**
 * FHIR R4 Encounter Mapper (Pure Transformation)
 */
import { KEMKES_PROFILES, KEMKES_SYSTEMS, SATUSEHAT_ORGANIZATION_ID } from '../profiles/kemkesProfiles.js';

export function mapEncounter(encounter) {
  if (!encounter) return null;

  const classCodeMap = {
    EMERGENCY: { system: KEMKES_SYSTEMS.ACT_CODE, code: 'EMER', display: 'emergency' },
    INPATIENT: { system: KEMKES_SYSTEMS.ACT_CODE, code: 'IMP', display: 'inpatient encounter' },
    OUTPATIENT: { system: KEMKES_SYSTEMS.ACT_CODE, code: 'AMB', display: 'ambulatory' },
    SURGERY: { system: KEMKES_SYSTEMS.ACT_CODE, code: 'SS', display: 'short stay' }
  };

  const encounterType = (encounter.type || 'OUTPATIENT').toUpperCase();
  const fhirClass = classCodeMap[encounterType] || classCodeMap.OUTPATIENT;

  // Status mapping
  let fhirStatus = 'in-progress';
  if (['DISCHARGED', 'REFERRED', 'DECEASED'].includes(encounter.primaryState || encounter.status)) {
    fhirStatus = 'finished';
  } else if (['CANCELLED'].includes(encounter.primaryState || encounter.status)) {
    fhirStatus = 'cancelled';
  } else if (['PLANNED', 'REGISTERED', 'TRIAGE_PENDING'].includes(encounter.primaryState || encounter.status)) {
    fhirStatus = 'arrived';
  }

  const resource = {
    resourceType: 'Encounter',
    id: encounter.id,
    meta: {
      profile: [KEMKES_PROFILES.ENCOUNTER]
    },
    identifier: [
      {
        system: KEMKES_SYSTEMS.ENCOUNTER,
        value: encounter.encounterNumber || encounter.id
      }
    ],
    status: fhirStatus,
    class: fhirClass,
    subject: {
      reference: `Patient/${encounter.patientId || encounter.patient_id}`,
      display: encounter.patientName || 'Pasien'
    },
    period: {
      start: encounter.admittedAt || encounter.admissionTime || encounter.created_at || new Date().toISOString(),
      end: (['DISCHARGED', 'REFERRED', 'DECEASED'].includes(encounter.primaryState || encounter.status)) 
        ? encounter.dischargedAt || encounter.updatedAt || new Date().toISOString() 
        : undefined
    },
    serviceProvider: {
      reference: `Organization/${encounter.organizationId || SATUSEHAT_ORGANIZATION_ID}`,
      display: 'RSUP NurseFlow'
    }
  };

  // Practitioner Participant (DPJP)
  if (encounter.dpjpId || encounter.doctor_name) {
    resource.participant = [
      {
        type: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                code: 'ATND',
                display: 'attender'
              }
            ]
          }
        ],
        individual: {
          reference: `Practitioner/${encounter.dpjpId || 'DOC-01'}`,
          display: encounter.doctor_name || 'Dokter Penanggung Jawab Pelayanan (DPJP)'
        }
      }
    ];
  }

  // Location (Bed / Room / Ward)
  if (encounter.location || encounter.room || encounter.bed) {
    resource.location = [
      {
        location: {
          reference: `Location/${encounter.location?.id || encounter.bedId || 'LOC-BED-01'}`,
          display: `${encounter.department || 'Bangsal'} - ${encounter.room || 'Kamar'} (${encounter.bed || 'Bed'})`
        },
        status: fhirStatus === 'finished' ? 'completed' : 'active'
      }
    ];
  }

  return resource;
}
