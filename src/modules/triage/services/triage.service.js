/**
 * Triage Domain — Service Layer (PostgreSQL 16 Authoritative)
 * Standards: WHO Emergency Care, ATS / ESI v4 SLA Engine, RFC 7807, ACID Transactions
 */

import { apiClient, requestApi } from '../../../core/apiClient.js';

/**
 * Submit Triage Assessment to PostgreSQL 16
 */
export const submitTriage = async ({ 
  patientId, 
  encounterId, 
  episodeId = null,
  bedId = null,
  vitals = {}, 
  secondaryAssessment = {},
  screeningQuestions = {},
  esiLevel = 3,
  chiefComplaint = 'Pemeriksaan Triase IGD',
  fallRisk = false,
  nutritionalRisk = false,
  assessedBy = 'Perawat Triase'
}) => {
  const payload = {
    patientId,
    encounterId,
    episodeId,
    triageMethod: 'ESI',
    esiLevel: Number(esiLevel) || 3,
    atsLevel: Number(esiLevel) || 3,
    chiefComplaint: chiefComplaint || 'Keluhan umum IGD',
    airwayStatus: secondaryAssessment?.airway || 'PATENT',
    breathingStatus: secondaryAssessment?.breathing || 'NORMAL',
    circulationStatus: secondaryAssessment?.circulation || 'NORMAL',
    disabilityStatus: secondaryAssessment?.neurological || 'ALERT',
    exposureStatus: 'NORMAL',
    vitalsPayload: {
      heartRate: Number(vitals.heartRate || 80),
      respRate: Number(vitals.respRate || 18),
      systolicBp: Number(vitals.systolicBP || 120),
      diastolicBp: Number(vitals.diastolicBP || 80),
      spo2: Number(vitals.spo2 || 98),
      temperature: Number(vitals.temperature || 36.5),
      painScore: Number(vitals.painScale || 0),
      gcs: 15
    },
    fallRisk,
    nutritionalRisk
  };

  const res = await apiClient.triage.submit(payload);
  if (!res.ok) {
    throw new Error(res.error || 'Gagal mencatat asesmen triase di PostgreSQL');
  }

  return res.data;
};

/**
 * Get Triage Assessment by Encounter ID
 */
export const getTriageByEncounter = async (encounterId) => {
  try {
    const res = await requestApi(`/api/v1/triage/encounter/${encounterId}`);
    if (res.ok && res.data) {
      return res.data;
    }
    return null;
  } catch (err) {
    console.error('[TriageService] Failed to fetch triage assessment:', err);
    return null;
  }
};
