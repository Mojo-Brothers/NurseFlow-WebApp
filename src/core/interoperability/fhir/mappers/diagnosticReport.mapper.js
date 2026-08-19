/**
 * NurseFlow Enterprise HIS 2026 — FHIR R4 DiagnosticReport Mapper (LIS Lab & PACS Radiology)
 * Standards: HL7 FHIR R4 DiagnosticReport Profile, Kemkes SATUSEHAT Specification.
 */

import { KEMKES_PROFILES, KEMKES_SYSTEMS, SATUSEHAT_ORGANIZATION_ID } from '../profiles/kemkesProfiles.js';

export function mapDiagnosticReport(report) {
  if (!report) return null;

  const isRadiology = (report.serviceCategory || report.category || '').toUpperCase().includes('RAD') || 
                      (report.type || '').toUpperCase().includes('RADIOLOGY');

  const categoryCoding = isRadiology
    ? { system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'RAD', display: 'Radiology' }
    : { system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB', display: 'Laboratory' };

  return {
    resourceType: 'DiagnosticReport',
    id: report.id || `DR-${Date.now()}`,
    meta: {
      profile: [KEMKES_PROFILES.DIAGNOSTIC_REPORT]
    },
    identifier: [
      {
        system: `http://sys-ids.kemkes.go.id/diagnosticreport/${SATUSEHAT_ORGANIZATION_ID}`,
        value: report.reportNumber || report.accessionNumber || report.id
      }
    ],
    status: report.status === 'PRELIMINARY' ? 'preliminary' : (report.status === 'CORRECTED' ? 'corrected' : 'final'),
    category: [
      {
        coding: [categoryCoding]
      }
    ],
    code: {
      coding: [
        {
          system: KEMKES_SYSTEMS.LOINC,
          code: report.loincCode || (isRadiology ? '24606-6' : '58410-2'),
          display: report.testName || report.studyDescription || (isRadiology ? 'Chest X-Ray 1 View' : 'Complete Blood Count (CBC)')
        }
      ],
      text: report.testName || report.studyDescription || 'Hasil Pemeriksaan Diagnostik'
    },
    subject: {
      reference: `Patient/${report.patientId || report.patient_id}`,
      display: report.patientName || 'Pasien'
    },
    encounter: report.encounterId ? {
      reference: `Encounter/${report.encounterId}`
    } : undefined,
    effectiveDateTime: report.effectiveDateTime || report.performedAt || report.created_at || new Date().toISOString(),
    issued: report.issuedAt || report.finalizedAt || new Date().toISOString(),
    performer: report.performerId ? [
      {
        reference: `Practitioner/${report.performerId}`,
        display: report.performerName || 'Dokter Spesialis Patologi / Radiologi'
      }
    ] : undefined,
    result: report.observationIds && Array.isArray(report.observationIds) ? report.observationIds.map(obsId => ({
      reference: `Observation/${obsId}`
    })) : undefined,
    conclusion: report.conclusion || report.clinicalImpression || report.findingsText || 'Dalam batas normal',
    conclusionCode: report.icd10Code ? [
      {
        coding: [
          {
            system: KEMKES_SYSTEMS.ICD10,
            code: report.icd10Code,
            display: report.conclusion || 'Clinical Finding'
          }
        ]
      }
    ] : undefined
  };
}
