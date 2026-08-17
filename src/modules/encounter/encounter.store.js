/**
 * Encounter Store — Zustand (Step 5c)
 */
import { create } from 'zustand';
import {
  createEncounter,
  dischargeEncounter,
  getActiveEncounters,
  getPatientEncounters,
  getPatientActiveEncounter,
} from './services/encounter.service.js';

export const useEncounterStore = create((set, get) => ({
  // ─── State ───────────────────────────────
  activeEncounters:  [],
  patientEncounters: [],
  selectedEncounterId: null,
  activePatientId: null,
  activeEncounterId: null,
  liveContext:       null, // { patientId, encounterId }
  isLoading:         false,
  error:             null,

  // ─── Actions ─────────────────────────────
  setLiveContext: (patientId, encounterId) => set({ 
    liveContext: { patientId, encounterId },
    activePatientId: patientId,
    activeEncounterId: encounterId,
    selectedEncounterId: encounterId 
  }),

  clearLiveContext: () => set({ 
    liveContext: null, 
    activePatientId: null, 
    activeEncounterId: null, 
    selectedEncounterId: null 
  }),
  fetchActiveEncounters: async () => {
    set({ isLoading: true, error: null });
    try {
      const encounters = await getActiveEncounters();
      set({ activeEncounters: encounters, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchPatientEncounters: async (patientId) => {
    set({ isLoading: true });
    try {
      const encounters = await getPatientEncounters(patientId);
      set({ patientEncounters: encounters, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchPatientActiveEncounter: async (patientId) => {
    set({ isLoading: true, error: null });
    try {
      const active = await getPatientActiveEncounter(patientId);
      set({ selectedEncounterId: active?.id || null, isLoading: false });
      return active;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  openEncounter: async (data, createdBy) => {
    set({ isLoading: true, error: null });
    try {
      const id = await createEncounter({ ...data, createdBy });
      await get().fetchActiveEncounters();
      set({ isLoading: false, selectedEncounterId: id });
      return id;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  discharge: async (encounterId, closedBy) => {
    try {
      await dischargeEncounter(encounterId, closedBy);
      set(state => ({
        activeEncounters: state.activeEncounters.filter(e => e.id !== encounterId),
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  selectEncounter: (id) => set({ selectedEncounterId: id }),
  clearError: () => set({ error: null }),
}));
