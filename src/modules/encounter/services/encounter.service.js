/**
 * Encounter Domain — Service Layer V5 (Enterprise Masterpiece)
 * Connects directly to encounterEngine, persistenceAdapter, domainEventEngine, and clinicalTimelineEngine.
 */
import { encounterEngine, ENCOUNTER_STATUS, ENCOUNTER_TYPES } from '../../../core/services/encounterEngine.service.js';
import { persistenceAdapter } from '../../../core/services/persistenceAdapter.service.js';

/**
 * Membuka encounter baru dalam status REGISTERED / WAITING.
 */
export const createEncounter = async ({
  patientId,
  patientName,
  mrn,
  encounterType,
  chiefComplaint,
  admittingDoctor,
  nurseInCharge,
  ward,
  createdBy,
}) => {
  try {
    const enc = await encounterEngine.createEncounter({
      patientId,
      patientName,
      mrn,
      type: encounterType || ENCOUNTER_TYPES.OUTPATIENT,
      departmentId: ward || 'POLI-UMUM',
      dpjpId: admittingDoctor || 'EMP-2026-0001',
      chiefComplaint,
      payer: 'BPJS Kesehatan'
    }, createdBy || 'Petugas Admisi');

    return enc.id;
  } catch (err) {
    console.error('[EncounterService] Create failed:', err);
    throw err;
  }
};

/**
 * Transisi status encounter.
 */
export const transitionEncounter = async ({ 
  encounterId, 
  targetStatus, 
  reason, 
  userEmail,
  escalationLevel = null 
}) => {
  try {
    const updated = await encounterEngine.updateEncounterStatus(encounterId, targetStatus, userEmail || 'Petugas Medis');
    return updated;
  } catch (err) {
    console.error('[EncounterService] Transition failed:', err);
    throw err;
  }
};

export const getActiveEncounters = async (maxResults = 100) => {
  try {
    const encounters = await encounterEngine.getActiveEncounters();
    return encounters.slice(0, maxResults);
  } catch (error) {
    console.error('[EncounterService] Failed to fetch encounters:', error);
    return [];
  }
};

/**
 * Get all encounters for a specific patient.
 */
export const getPatientEncounters = async (patientId) => {
  try {
    return await encounterEngine.getEncountersByPatient(patientId);
  } catch (error) {
    console.error('[EncounterService] Failed to fetch patient encounters:', error);
    return [];
  }
};

/**
 * Get the current active encounter for a patient (if any).
 */
export const getPatientActiveEncounter = async (patientId) => {
  try {
    const list = await encounterEngine.getEncountersByPatient(patientId);
    return list.find(e => e.status !== ENCOUNTER_STATUS.DISCHARGED && e.status !== ENCOUNTER_STATUS.CANCELLED) || null;
  } catch (error) {
    console.error('[EncounterService] Failed to fetch patient active encounter:', error);
    return null;
  }
};

/**
 * Discharge Encounter
 */
export const dischargeEncounter = async (encounterId, userEmail) => {
  try {
    return await encounterEngine.updateEncounterStatus(encounterId, ENCOUNTER_STATUS.DISCHARGED, userEmail || 'Petugas Medis');
  } catch (err) {
    console.error('[EncounterService] Discharge failed:', err);
    throw err;
  }
};

// Alias for V5 consistency
export const getActiveQueue = getActiveEncounters;

