/**
 * NurseFlow Enterprise HIS 2026 — Episode of Care Aggregate Engine (PostgreSQL 16 Authoritative)
 * Standards: JCI 7th Edition (Continuity of Care), HL7 FHIR R4 (EpisodeOfCare), ACID Transactions
 */

import { apiClient, requestApi } from '../../../core/apiClient.js';

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
  CANCELLED: [],
  CLOSED: []
};

export const episodeOfCareEngineService = {
  getEpisodes: async (filters = {}) => {
    try {
      const res = await requestApi('/api/v1/encounters/episodes', { params: filters });
      if (res.ok && res.data) {
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      }
      return [];
    } catch (err) {
      console.error('[EpisodeOfCareEngine] Failed to fetch episodes from PostgreSQL:', err);
      return [];
    }
  },

  getEpisodeById: async (episodeId) => {
    const res = await requestApi(`/api/v1/encounters/episodes/${episodeId}`);
    if (!res.ok) throw new Error(res.error || 'Gagal mengambil episode of care');
    return res.data;
  },

  createEpisode: async (payload) => {
    const res = await requestApi('/api/v1/encounters/episodes', {
      method: 'POST',
      body: payload
    });
    if (!res.ok) throw new Error(res.error || 'Gagal membuat episode of care di PostgreSQL');
    return res.data;
  },

  updateEpisodeStatus: async ({ episodeId, nextStatus, reason, actorEmail }) => {
    const res = await requestApi(`/api/v1/encounters/episodes/${episodeId}/status`, {
      method: 'PATCH',
      body: { status: nextStatus, reason, actorEmail }
    });
    if (!res.ok) throw new Error(res.error || 'Gagal memperbarui status episode di PostgreSQL');
    return res.data;
  }
};
