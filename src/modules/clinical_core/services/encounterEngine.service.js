/**
 * NurseFlow Enterprise HIS 2026 — Encounter Finite State Machine Engine (PostgreSQL 16 Authoritative)
 * Standards: JCI 7th Edition (Patient Journey Documentation), HL7 FHIR R4 (Encounter), ACID Transactions
 */

import { apiClient, requestApi } from '../../../core/apiClient.js';

export const ENCOUNTER_CLASSES = {
  EMER: { code: 'EMER', display: 'Emergency (Gawat Darurat)', defaultLocation: 'IGD' },
  AMB: { code: 'AMB', display: 'Ambulatory (Poliklinik Rawat Jalan)', defaultLocation: 'POLI' },
  IMP: { code: 'IMP', display: 'Inpatient (Rawat Inap Bangsal / ICU)', defaultLocation: 'WARD' },
  SS: { code: 'SS', display: 'Short Stay / One Day Care', defaultLocation: 'DAYCARE' },
  HH: { code: 'HH', display: 'Home Health / Home Care', defaultLocation: 'HOME' },
  VR: { code: 'VR', display: 'Virtual / Telemedicine', defaultLocation: 'ONLINE' }
};

export const ENCOUNTER_STATES = {
  PLANNED: 'PLANNED',
  ARRIVED: 'ARRIVED',
  TRIAGED: 'TRIAGED',
  WAITING: 'WAITING',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  DISCHARGED: 'DISCHARGED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
};

export const ENCOUNTER_STATE_TRANSITIONS = {
  PLANNED: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['TRIAGED', 'WAITING', 'CANCELLED'],
  TRIAGED: ['WAITING', 'IN_PROGRESS', 'CANCELLED'],
  WAITING: ['IN_PROGRESS', 'NO_SHOW', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETED', 'DISCHARGED'],
  ON_HOLD: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  COMPLETED: ['DISCHARGED', 'CLOSED'],
  DISCHARGED: ['CLOSED'],
  CLOSED: [],    // Terminal
  CANCELLED: [], // Terminal
  NO_SHOW: []   // Terminal
};

export const encounterEngineService = {
  validateTransition: (currentStatus, nextStatus) => {
    const allowed = ENCOUNTER_STATE_TRANSITIONS[currentStatus] || [];
    return allowed.includes(nextStatus);
  },

  getEncounters: async (filters = {}) => {
    try {
      const res = await apiClient.encounters.list(filters);
      if (res.ok && res.data) {
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      }
      return [];
    } catch (err) {
      console.error('[EncounterEngine] Failed to fetch encounters from PostgreSQL:', err);
      return [];
    }
  },

  getEncounterById: async (encounterId) => {
    const res = await apiClient.encounters.get(encounterId);
    if (!res.ok) throw new Error(res.error || 'Gagal mengambil data encounter');
    return res.data;
  },

  createEncounter: async (payload) => {
    const res = await apiClient.encounters.create(payload);
    if (!res.ok) throw new Error(res.error || 'Gagal membuat encounter di PostgreSQL');
    return res.data;
  },

  transitionEncounterStatus: async ({ encounterId, nextStatus, reason, actorEmail, expectedVersion }) => {
    const res = await requestApi(`/api/v1/encounters/${encounterId}/status`, {
      method: 'PATCH',
      body: { status: nextStatus, reason, actorEmail, expectedVersion }
    });
    if (!res.ok) throw new Error(res.error || 'Gagal memperbarui status encounter di PostgreSQL');
    return res.data;
  }
};
