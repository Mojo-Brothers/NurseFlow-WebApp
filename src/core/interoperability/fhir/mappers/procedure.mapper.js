/**
 * FHIR R4 Procedure Mapper (ICD-9-CM Surgical Interventions)
 */
import { KEMKES_PROFILES, KEMKES_SYSTEMS } from '../profiles/kemkesProfiles.js';

export function mapProcedure(proc) {
  if (!proc) return null;

  return {
    resourceType: 'Procedure',
    id: proc.id || `PROC-${Date.now()}`,
    meta: {
      profile: [KEMKES_PROFILES.PROCEDURE]
    },
    status: proc.status === 'ABORTED' ? 'not-done' : (proc.status === 'IN_PROGRESS' ? 'in-progress' : 'completed'),
    code: {
      coding: [
        {
          system: KEMKES_SYSTEMS.ICD9CM,
          code: proc.icd9Code || proc.code || '47.09',
          display: proc.procedureName || proc.name || 'Other appendectomy'
        }
      ],
      text: proc.procedureName || proc.name || 'Tindakan Bedah'
    },
    subject: {
      reference: `Patient/${proc.patientId || proc.patient_id}`,
      display: proc.patientName || 'Pasien'
    },
    encounter: proc.encounterId ? {
      reference: `Encounter/${proc.encounterId}`
    } : undefined,
    performedPeriod: {
      start: proc.startedAt || proc.created_at || new Date().toISOString(),
      end: proc.completedAt || new Date().toISOString()
    },
    performer: proc.surgeonId ? [
      {
        actor: {
          reference: `Practitioner/${proc.surgeonId}`,
          display: proc.surgeonName || 'Dokter Operator Bedah'
        }
      }
    ] : undefined
  };
}
