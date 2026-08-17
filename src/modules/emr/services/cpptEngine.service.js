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
  return [
    {
      id: 'CPPT-1001',
      episode_id: 'EOC-2026-001',
      encounter_id: 'ENC-2026-001',
      patient_id: 'P-1001',
      patient_name: 'Ny. Siti Nurhaliza, S.Pd',
      professional_type: 'DOKTER_DPJP',
      author_id: 'DOC-1001',
      author_name: 'dr. Siti Wijaya, Sp.PD-KGEH',
      soap_notes: 'S: Demam hari ke-4 turun, nyeri ulu hati berkurang.\nO: TD 110/70, Nadi 84, Suhu 36.8°C, Trombosit 48.000 /uL, Hematokrit 42%.\nA: DHF Grade II fase kritis.\nP: Lanjut infus RL 2 ml/kgBB/jam, cek DL serial per 12 jam, observasi perdarahan spontan.',
      instruction_notes: 'Transfusi Trombosit Konsentrat 4 unit jika trombosit < 20.000 atau terjadi perdarahan masif.',
      dpjp_verified: true,
      dpjp_verifier_name: 'dr. Siti Wijaya, Sp.PD-KGEH',
      dpjp_verified_at: '2026-08-17T09:00:00Z',
      created_at: '2026-08-17T08:45:00Z'
    },
    {
      id: 'CPPT-1002',
      episode_id: 'EOC-2026-001',
      encounter_id: 'ENC-2026-001',
      patient_id: 'P-1001',
      patient_name: 'Ny. Siti Nurhaliza, S.Pd',
      professional_type: 'PERAWAT',
      author_id: 'NUR-1001',
      author_name: 'Ns. Ratna Sari, S.Kep',
      sbar_situation: 'Pasien mengeluh mual saat minum air putih.',
      sbar_background: 'DHF Grade II hari rawat ke-2.',
      sbar_assessment: 'Risiko defisit volume cairan.',
      sbar_recommendation: 'Edukasi minum sedikit tapi sering, pantau balans cairan per 6 jam.',
      instruction_notes: 'Cairan masuk 1500ml / 8 jam, urin keluar 500ml.',
      dpjp_verified: true,
      dpjp_verifier_name: 'dr. Siti Wijaya, Sp.PD-KGEH',
      dpjp_verified_at: '2026-08-17T09:05:00Z',
      created_at: '2026-08-17T08:50:00Z'
    }
  ];
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
