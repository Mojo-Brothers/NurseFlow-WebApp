/**
 * NurseFlow Enterprise HIS 2026 — Episode of Care Aggregate Engine
 * Core Clinical Backbone: Manages full patient care lifecycles,
 * multi-encounter bundling, care continuity, and cross-branch referrals.
 * Standar Kepatuhan: JCI 7th Edition (Continuity of Care) & HL7 FHIR R4 (EpisodeOfCare).
 */

import { universalEventContractService } from './universalEventContract.service.js';

export const EPISODE_TYPES = {
  EMERGENCY: { code: 'EMERGENCY', label: 'Gawat Darurat (IGD)', defaultSlaHours: 24 },
  OUTPATIENT: { code: 'OUTPATIENT', label: 'Rawat Jalan (Poliklinik)', defaultSlaHours: 12 },
  INPATIENT: { code: 'INPATIENT', label: 'Rawat Inap & Bangsal', defaultSlaHours: 720 },
  SURGERY: { code: 'SURGERY', label: 'Tindakan Bedah Sentral (OK)', defaultSlaHours: 48 },
  CHRONIC: { code: 'CHRONIC', label: 'Perawatan Penyakit Kronis Berkelanjutan', defaultSlaHours: 8760 },
  HOMECARE: { code: 'HOMECARE', label: 'Pelayanan Home Care / Kunjungan Rumah', defaultSlaHours: 720 },
  TELEMEDICINE: { code: 'TELEMEDICINE', label: 'Telekonsultasi Jarak Jauh', defaultSlaHours: 24 }
};

export const EPISODE_STATUSES = {
  PLANNED: 'PLANNED',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  TRANSFERRED: 'TRANSFERRED',
  DISCHARGED: 'DISCHARGED',
  CANCELLED: 'CANCELLED',
  CLOSED: 'CLOSED'
};

export const EPISODE_STATUS_TRANSITIONS = {
  PLANNED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['ON_HOLD', 'TRANSFERRED', 'DISCHARGED', 'CLOSED'],
  ON_HOLD: ['ACTIVE', 'CLOSED', 'CANCELLED'],
  TRANSFERRED: ['ACTIVE', 'CLOSED'],
  DISCHARGED: ['CLOSED', 'ACTIVE'],
  CANCELLED: [], // Terminal
  CLOSED: []    // Terminal
};

const EPISODE_STORAGE_KEY = 'nurseflow_episodes_of_care';

const getStoredEpisodes = () => {
  try {
    const raw = localStorage.getItem(EPISODE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[EpisodeOfCareEngine] Failed to load local episodes:', e);
  }
  return [
    {
      id: 'EOC-2026-001',
      episode_number: 'EOC-2026-001001',
      patient_id: 'P-1001',
      patient_name: 'Ny. Siti Nurhaliza, S.Pd',
      mrn: 'MRN-2026-001001',
      episode_type: 'INPATIENT',
      parent_episode_id: null,
      branch_id: 'BRN-JKT-PST',
      organization_id: '100028741',
      attending_physician_id: 'DOC-1001',
      attending_physician_name: 'dr. Siti Wijaya, Sp.PD-KGEH',
      chief_complaint: 'Demam tinggi 4 hari, trombositopenia susp. DHF Grade II',
      admission_date: '2026-08-15T08:30:00Z',
      discharge_date: null,
      encounters_count: 3,
      encounter_ids: ['ENC-2026-001', 'ENC-2026-002'],
      status: 'ACTIVE',
      created_at: '2026-08-15T08:30:00Z',
      created_by: 'admin@nurseflow.id',
      updated_at: '2026-08-15T08:30:00Z',
      is_deleted: false
    }
  ];
};

const saveStoredEpisodes = (episodes) => {
  try {
    localStorage.setItem(EPISODE_STORAGE_KEY, JSON.stringify(episodes));
  } catch (e) {
    console.warn('[EpisodeOfCareEngine] Failed to save local episodes:', e);
  }
};

export const episodeOfCareEngineService = {
  /**
   * Create New Episode of Care Aggregate
   */
  createEpisode: async ({
    patientId,
    patientName,
    mrn,
    episodeType, // 'EMERGENCY', 'OUTPATIENT', 'INPATIENT', 'SURGERY', 'CHRONIC', 'HOMECARE', 'TELEMEDICINE'
    attendingPhysicianId,
    attendingPhysicianName,
    chiefComplaint = '',
    parentEpisodeId = null,
    branchId = 'BRN-JKT-PST',
    organizationId = '100028741',
    referralSource = null,
    actorEmail = 'admin@nurseflow.id'
  }) => {
    if (!patientId || !episodeType || !attendingPhysicianId) {
      throw new Error('Validasi gagal: patientId, episodeType, dan attendingPhysicianId wajib disertakan.');
    }

    if (!EPISODE_TYPES[episodeType]) {
      throw new Error(`Tipe episode tidak valid: ${episodeType}.`);
    }

    const now = new Date().toISOString();
    const episodeNumber = `EOC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    const newEpisode = {
      id: `EOC-${Date.now()}`,
      episode_number: episodeNumber,
      patient_id: patientId,
      patient_name: patientName,
      mrn,
      episode_type: episodeType,
      parent_episode_id: parentEpisodeId,
      branch_id: branchId,
      organization_id: organizationId,
      attending_physician_id: attendingPhysicianId,
      attending_physician_name: attendingPhysicianName,
      chief_complaint: chiefComplaint,
      admission_date: now,
      discharge_date: null,
      discharge_disposition_id: null,
      discharge_summary: null,
      encounters_count: 0,
      encounter_ids: [],
      referral_source: referralSource,
      status: 'ACTIVE',
      created_at: now,
      created_by: actorEmail,
      updated_at: now,
      updated_by: actorEmail,
      is_deleted: false
    };

    const currentList = getStoredEpisodes();
    saveStoredEpisodes([newEpisode, ...currentList]);

    // Publish Event
    await universalEventContractService.publishDomainEvent({
      eventName: 'EPISODE_CREATED',
      aggregateType: 'EPISODE_OF_CARE',
      aggregateId: newEpisode.id,
      payload: newEpisode,
      actor: actorEmail,
      branchId
    });

    return newEpisode;
  },

  /**
   * Validate & Transition Episode Status
   */
  updateEpisodeStatus: async ({
    episodeId,
    nextStatus,
    reason = '',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const list = getStoredEpisodes();
    const index = list.findIndex(e => e.id === episodeId);

    if (index === -1) {
      throw new Error(`Episode ${episodeId} tidak ditemukan.`);
    }

    const currentEpisode = list[index];
    const allowedTransitions = EPISODE_STATUS_TRANSITIONS[currentEpisode.status] || [];

    if (!allowedTransitions.includes(nextStatus)) {
      throw new Error(`Transisi status tidak sah: ${currentEpisode.status} → ${nextStatus}. Transisi yang diizinkan: ${allowedTransitions.join(' / ') || 'Tidak ada (Status Akhir)'}`);
    }

    const now = new Date().toISOString();
    const updated = {
      ...currentEpisode,
      status: nextStatus,
      updated_at: now,
      updated_by: actorEmail,
      ...(nextStatus === 'CLOSED' || nextStatus === 'DISCHARGED' ? { discharge_date: now } : {})
    };

    list[index] = updated;
    saveStoredEpisodes(list);

    await universalEventContractService.publishDomainEvent({
      eventName: nextStatus === 'CLOSED' ? 'EPISODE_CLOSED' : 'EPISODE_UPDATED',
      aggregateType: 'EPISODE_OF_CARE',
      aggregateId: episodeId,
      payload: { previousStatus: currentEpisode.status, currentStatus: nextStatus, reason, episode: updated },
      actor: actorEmail,
      branchId: currentEpisode.branch_id
    });

    return updated;
  },

  /**
   * Attach Encounter to Episode
   */
  attachEncounter: async (episodeId, encounterId) => {
    const list = getStoredEpisodes();
    const index = list.findIndex(e => e.id === episodeId);
    if (index === -1) return null;

    const ep = list[index];
    if (!ep.encounter_ids.includes(encounterId)) {
      ep.encounter_ids.push(encounterId);
      ep.encounters_count = ep.encounter_ids.length;
      ep.updated_at = new Date().toISOString();
      list[index] = ep;
      saveStoredEpisodes(list);
    }
    return ep;
  },

  /**
   * Query All Episodes with Filters
   */
  getEpisodes: (filters = {}) => {
    let list = getStoredEpisodes().filter(e => !e.is_deleted);

    if (filters.patientId) {
      list = list.filter(e => e.patient_id === filters.patientId);
    }
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(e => e.status === filters.status);
    }
    if (filters.episodeType && filters.episodeType !== 'ALL') {
      list = list.filter(e => e.episode_type === filters.episodeType);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(e =>
        e.episode_number.toLowerCase().includes(q) ||
        e.patient_name.toLowerCase().includes(q) ||
        e.mrn.toLowerCase().includes(q)
      );
    }

    return list;
  },

  /**
   * Get Episode by ID with Hierarchy Tree
   */
  getEpisodeById: (episodeId) => {
    const list = getStoredEpisodes();
    const episode = list.find(e => e.id === episodeId);
    if (!episode) return null;

    const childEpisodes = list.filter(e => e.parent_episode_id === episodeId);
    return { ...episode, child_episodes: childEpisodes };
  }
};
