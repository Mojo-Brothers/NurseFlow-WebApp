/**
 * NurseFlow Enterprise HIS 2026 — Multidisciplinary CPPT Engine
 * Sprint 4: Integrated Clinical Progress Notes (Catatan Perkembangan Pasien Terintegrasi)
 * Standar Kepatuhan: KARS PAP (Pelayanan & Asuhan Pasien), JCI 7th Edition (Integrated Care Documentation).
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

const CPPT_STORAGE_KEY = 'nurseflow_cppt_notes';

const getStoredCppt = () => {
  try {
    const raw = localStorage.getItem(CPPT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[CpptEngine] Failed to load CPPT notes:', e);
  }
  return [];
};

const saveStoredCppt = (list) => {
  try {
    localStorage.setItem(CPPT_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[CpptEngine] Failed to save CPPT notes:', e);
  }
};

export const cpptEngineService = {
  /**
   * Record New Multidisciplinary CPPT Entry
   */
  recordCpptEntry: async ({
    episodeId,
    encounterId,
    patientId,
    patientName,
    professionalType = 'DOKTER_DPJP', // 'DOKTER_DPJP', 'PERAWAT', 'APOTEKER_KLINIS', 'DIETISIEN_GIZI'
    authorId = 'DOC-1001',
    authorName,
    sbarSituation = '',
    sbarBackground = '',
    sbarAssessment = '',
    sbarRecommendation = '',
    soapNotes = '',
    instructionNotes = '',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const now = new Date().toISOString();
    const isDoctor = professionalType.startsWith('DOKTER');

    const cpptRecord = {
      id: `CPPT-${Date.now()}`,
      episode_id: episodeId,
      encounter_id: encounterId,
      patient_id: patientId,
      patient_name: patientName,
      professional_type: professionalType,
      author_id: authorId,
      author_name: authorName,
      sbar_situation: sbarSituation,
      sbar_background: sbarBackground,
      sbar_assessment: sbarAssessment,
      sbar_recommendation: sbarRecommendation,
      soap_notes: soapNotes,
      instruction_notes: instructionNotes,
      dpjp_verified: isDoctor, // Auto-verified if DPJP, otherwise requires 24h verification
      dpjp_verifier_id: isDoctor ? authorId : null,
      dpjp_verifier_name: isDoctor ? authorName : null,
      dpjp_verified_at: isDoctor ? now : null,
      created_at: now
    };

    const currentList = getStoredCppt();
    saveStoredCppt([cpptRecord, ...currentList]);

    await outboxPublisherService.stageEvent({
      aggregateType: 'CPPT_NOTE',
      aggregateId: cpptRecord.id,
      eventName: 'CPPT_CREATED',
      payload: cpptRecord,
      actor: actorEmail
    });

    return cpptRecord;
  },

  /**
   * DPJP Verifies / Signs CPPT Entry of Non-Physician PPA
   */
  verifyCpptByDpjp: async ({ cpptId, dpjpId, dpjpName, actorEmail }) => {
    const list = getStoredCppt();
    const index = list.findIndex(c => c.id === cpptId);
    if (index === -1) throw new Error(`CPPT ${cpptId} tidak ditemukan.`);

    const record = list[index];
    record.dpjp_verified = true;
    record.dpjp_verifier_id = dpjpId;
    record.dpjp_verifier_name = dpjpName;
    record.dpjp_verified_at = new Date().toISOString();

    list[index] = record;
    saveStoredCppt(list);

    return record;
  },

  /**
   * Get CPPT Notes by Episode / Encounter
   */
  getCpptNotes: (episodeId = null, encounterId = null) => {
    let list = getStoredCppt();
    if (episodeId) {
      list = list.filter(c => c.episode_id === episodeId);
    }
    if (encounterId) {
      list = list.filter(c => c.encounter_id === encounterId);
    }
    return list;
  }
};
