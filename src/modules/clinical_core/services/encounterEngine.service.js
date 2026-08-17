/**
 * NurseFlow Enterprise HIS 2026 — Encounter Finite State Machine Engine
 * Core Clinical Backbone: Enforces strict clinical state transitions across all encounters
 * (IGD, Outpatient, Inpatient, Telemedicine, Daycare).
 * Standar Kepatuhan: JCI 7th Edition (Patient Journey Documentation) & HL7 FHIR R4 (Encounter).
 */

import { universalEventContractService } from './universalEventContract.service.js';
import { episodeOfCareEngineService } from './episodeOfCareEngine.service.js';

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

const ENCOUNTER_STORAGE_KEY = 'nurseflow_encounters';

const getStoredEncounters = () => {
  try {
    const raw = localStorage.getItem(ENCOUNTER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[EncounterEngine] Failed to load local encounters:', e);
  }
  return [
    {
      id: 'ENC-2026-001',
      encounter_number: 'ENC-2026-001001',
      episode_id: 'EOC-2026-001',
      patient_id: 'P-1001',
      patient_name: 'Ny. Siti Nurhaliza, S.Pd',
      mrn: 'MRN-2026-001001',
      encounter_class: 'IMP',
      encounter_class_label: 'Inpatient (Rawat Inap Bangsal)',
      encounter_status: 'IN_PROGRESS',
      practitioner_id: 'DOC-1001',
      practitioner_name: 'dr. Siti Wijaya, Sp.PD-KGEH',
      location_id: 'FAC-BED-301B',
      location_name: 'Kamar Mawar 301 (Bed 301-B)',
      priority: 'ROUTINE',
      started_at: '2026-08-15T09:00:00Z',
      ended_at: null,
      created_at: '2026-08-15T08:45:00Z',
      created_by: 'admin@nurseflow.id',
      updated_at: '2026-08-15T09:00:00Z',
      is_deleted: false
    }
  ];
};

const saveStoredEncounters = (encounters) => {
  try {
    localStorage.setItem(ENCOUNTER_STORAGE_KEY, JSON.stringify(encounters));
  } catch (e) {
    console.warn('[EncounterEngine] Failed to save local encounters:', e);
  }
};

export const encounterEngineService = {
  /**
   * Validate if state transition is legally permitted
   */
  validateTransition: (currentStatus, nextStatus) => {
    if (!currentStatus || !nextStatus) {
      return { isValid: false, message: 'Status awal dan status tujuan wajib disertakan.' };
    }
    if (currentStatus === nextStatus) {
      return { isValid: true, message: 'Status tidak mengalami perubahan.' };
    }

    const allowed = ENCOUNTER_STATE_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      return {
        isValid: false,
        message: `Transisi ilegal: Status ${currentStatus} tidak dapat langsung dialihkan ke ${nextStatus}. Jalur sah: ${allowed.join(' / ') || 'Tidak ada (Status Terminal)'}`
      };
    }

    return { isValid: true, message: `Transisi sah: ${currentStatus} → ${nextStatus}` };
  },

  /**
   * Create New Encounter Bound to an Episode of Care
   */
  createEncounter: async ({
    episodeId,
    patientId,
    patientName,
    mrn,
    encounterClass = 'AMB', // 'EMER', 'AMB', 'IMP', 'SS', 'HH', 'VR'
    practitionerId,
    practitionerName,
    locationId,
    locationName,
    priority = 'ROUTINE',
    actorEmail = 'admin@nurseflow.id',
    branchId = 'BRN-JKT-PST'
  }) => {
    if (!episodeId || !patientId || !practitionerId) {
      throw new Error('Validasi gagal: episodeId, patientId, dan practitionerId wajib disertakan.');
    }

    const now = new Date().toISOString();
    const encounterNumber = `ENC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const classMeta = ENCOUNTER_CLASSES[encounterClass] || ENCOUNTER_CLASSES.AMB;

    const newEncounter = {
      id: `ENC-${Date.now()}`,
      encounter_number: encounterNumber,
      episode_id: episodeId,
      patient_id: patientId,
      patient_name: patientName,
      mrn,
      encounter_class: encounterClass,
      encounter_class_label: classMeta.display,
      encounter_status: 'ARRIVED',
      practitioner_id: practitionerId,
      practitioner_name: practitionerName,
      location_id: locationId,
      location_name: locationName,
      priority,
      started_at: now,
      ended_at: null,
      created_at: now,
      created_by: actorEmail,
      updated_at: now,
      updated_by: actorEmail,
      branch_id: branchId,
      is_deleted: false
    };

    const currentList = getStoredEncounters();
    saveStoredEncounters([newEncounter, ...currentList]);

    // Attach to Episode aggregate
    await episodeOfCareEngineService.attachEncounter(episodeId, newEncounter.id);

    // Publish Event
    await universalEventContractService.publishDomainEvent({
      eventName: 'ENCOUNTER_CREATED',
      aggregateType: 'ENCOUNTER',
      aggregateId: newEncounter.id,
      payload: newEncounter,
      actor: actorEmail,
      branchId
    });

    return newEncounter;
  },

  /**
   * Transition Encounter Status via State Machine
   */
  transitionEncounterStatus: async ({
    encounterId,
    nextStatus,
    reason = '',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const list = getStoredEncounters();
    const index = list.findIndex(e => e.id === encounterId);

    if (index === -1) {
      throw new Error(`Encounter ${encounterId} tidak ditemukan.`);
    }

    const current = list[index];
    const validation = encounterEngineService.validateTransition(current.encounter_status, nextStatus);

    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    const now = new Date().toISOString();
    const updated = {
      ...current,
      encounter_status: nextStatus,
      updated_at: now,
      updated_by: actorEmail,
      ...(nextStatus === 'COMPLETED' || nextStatus === 'CLOSED' ? { ended_at: now } : {})
    };

    list[index] = updated;
    saveStoredEncounters(list);

    await universalEventContractService.publishDomainEvent({
      eventName: 'ENCOUNTER_STATUS_CHANGED',
      aggregateType: 'ENCOUNTER',
      aggregateId: encounterId,
      payload: { previousStatus: current.encounter_status, currentStatus: nextStatus, reason, encounter: updated },
      actor: actorEmail,
      branchId: current.branch_id || 'BRN-JKT-PST'
    });

    return updated;
  },

  /**
   * Query Encounters
   */
  getEncounters: (filters = {}) => {
    let list = getStoredEncounters().filter(e => !e.is_deleted);

    if (filters.episodeId) {
      list = list.filter(e => e.episode_id === filters.episodeId);
    }
    if (filters.patientId) {
      list = list.filter(e => e.patient_id === filters.patientId);
    }
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(e => e.encounter_status === filters.status);
    }
    if (filters.encounterClass && filters.encounterClass !== 'ALL') {
      list = list.filter(e => e.encounter_class === filters.encounterClass);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(e =>
        e.encounter_number.toLowerCase().includes(q) ||
        e.patient_name.toLowerCase().includes(q) ||
        e.mrn.toLowerCase().includes(q)
      );
    }

    return list;
  }
};
