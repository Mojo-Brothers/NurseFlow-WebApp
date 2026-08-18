/**
 * Encounter & Clinical Care State Store — Zustand
 * Authoritative Client State Manager for Active Encounter & Care State Journey
 */
import { create } from 'zustand';
import {
  createEncounter,
  dischargeEncounter,
  getActiveEncounters,
  getPatientEncounters,
  getPatientActiveEncounter,
} from './services/encounter.service.js';
import { careStateEngine, CARE_STATES, CLINICAL_EVENTS } from '../../core/services/careStateEngine.service.js';
import { domainEventEngine, DOMAIN_EVENTS } from '../../core/services/domainEventEngine.service.js';

export const useEncounterStore = create((set, get) => {
  // Global Event Listener for Real-Time State & Location Convergence
  domainEventEngine.subscribe(DOMAIN_EVENTS.PATIENT_CARE_STATE_CHANGED || 'PATIENT_CARE_STATE_CHANGED', (eventPayload) => {
    const state = get();
    if (state.activeEncounterId === eventPayload.encounterId || state.activePatientId === eventPayload.patientId) {
      set({
        currentCareState: eventPayload.newState,
        currentLocation: eventPayload.location,
        liveContext: {
          ...state.liveContext,
          careState: eventPayload.newState,
          location: eventPayload.location
        }
      });
    }
  });

  return {
    // ─── State ───────────────────────────────
    activeEncounters:    [],
    patientEncounters:   [],
    selectedEncounterId: null,
    activePatientId:     null,
    activeEncounterId:   null,
    currentCareState:    CARE_STATES.REGISTERED,
    currentLocation:     null,
    secondaryStates:     [],
    liveContext:         null, // { patientId, encounterId, careState, location }
    isLoading:           false,
    error:               null,

    // ─── Actions ─────────────────────────────
    setLiveContext: (patientId, encounterId, careState = null, location = null) => set({ 
      liveContext: { patientId, encounterId, careState, location },
      activePatientId: patientId,
      activeEncounterId: encounterId,
      selectedEncounterId: encounterId,
      currentCareState: careState || CARE_STATES.REGISTERED,
      currentLocation: location || null
    }),

    clearLiveContext: () => set({ 
      liveContext: null, 
      activePatientId: null, 
      activeEncounterId: null, 
      selectedEncounterId: null,
      currentCareState: CARE_STATES.REGISTERED,
      currentLocation: null,
      secondaryStates: []
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
        if (active) {
          set({ 
            selectedEncounterId: active.id,
            activeEncounterId: active.id,
            activePatientId: patientId,
            currentCareState: active.primaryState || active.status || CARE_STATES.REGISTERED,
            currentLocation: active.location || null,
            secondaryStates: active.secondaryStates || [],
            isLoading: false 
          });
        }
        return active;
      } catch (err) {
        set({ error: err.message, isLoading: false });
        return null;
      }
    },

    /**
     * Authoritative State Transition Command (Rule 1 & Rule 3)
     */
    transitionCareState: async ({ targetState, eventType, location, bedId, actorName, actorRole, reason, clinicalNotes }) => {
      const state = get();
      if (!state.activeEncounterId) throw new Error('No active encounter selected for state transition');

      set({ isLoading: true, error: null });
      try {
        const result = await careStateEngine.transition({
          encounterId: state.activeEncounterId,
          targetState,
          eventType: eventType || CLINICAL_EVENTS.START_TRIAGE,
          location: location || state.currentLocation,
          bedId,
          actorName: actorName || 'Petugas Medis',
          actorRole: actorRole || 'STAFF',
          reason,
          clinicalNotes
        });

        set({
          currentCareState: targetState,
          currentLocation: result.encounter.location,
          isLoading: false
        });

        await get().fetchActiveEncounters();
        return result;
      } catch (err) {
        set({ error: err.message, isLoading: false });
        throw err;
      }
    },

    openEncounter: async (data, createdBy) => {
      set({ isLoading: true, error: null });
      try {
        const id = await createEncounter({ ...data, createdBy });
        await get().fetchActiveEncounters();
        set({ isLoading: false, selectedEncounterId: id, activeEncounterId: id });
        return id;
      } catch (err) {
        set({ error: err.message, isLoading: false });
        throw err;
      }
    },

    discharge: async (encounterId, closedBy) => {
      try {
        await careStateEngine.transition({
          encounterId,
          targetState: CARE_STATES.DISCHARGED,
          eventType: CLINICAL_EVENTS.COMPLETE_DISCHARGE,
          actorName: closedBy || 'Petugas Medis',
          actorRole: 'STAFF',
          reason: 'Proses Pemulangan Pasien Selesai'
        });

        set(state => ({
          activeEncounters: state.activeEncounters.filter(e => e.id !== encounterId),
        }));
      } catch (err) {
        set({ error: err.message });
        throw err;
      }
    },

    selectEncounter: (id) => set({ selectedEncounterId: id, activeEncounterId: id }),
    clearError: () => set({ error: null }),
  };
});
