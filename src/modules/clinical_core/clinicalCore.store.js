import { create } from 'zustand';
import { clinicalCoreApiService } from './services/clinicalCoreApi.service.js';

export const useClinicalCoreStore = create((set, get) => ({
  // State
  episodes: [],
  selectedEpisode: null,
  encounters: [],
  selectedEncounter: null,
  appointments: [],
  workflows: [],
  billingLedger: null,
  eventStore: [],
  loading: false,
  error: null,

  // Fetch all core clinical data
  fetchCoreData: async () => {
    set({ loading: true, error: null });
    try {
      const [episodes, encounters, appointments, workflows, eventStore] = await Promise.all([
        clinicalCoreApiService.getEpisodes(),
        clinicalCoreApiService.getEncounters(),
        clinicalCoreApiService.getAppointments(),
        clinicalCoreApiService.getActiveWorkflows(),
        clinicalCoreApiService.getEventStore()
      ]);

      const selectedEp = episodes[0] || null;
      let ledger = null;
      if (selectedEp) {
        ledger = await clinicalCoreApiService.getBillingLedgerByEpisode(selectedEp.id);
      }

      set({
        episodes,
        selectedEpisode: selectedEp,
        encounters,
        selectedEncounter: encounters[0] || null,
        appointments,
        workflows,
        billingLedger: ledger,
        eventStore,
        loading: false
      });
    } catch (err) {
      console.error('[ClinicalCoreStore] Error loading core clinical data:', err);
      set({ error: err.message, loading: false });
    }
  },

  setSelectedEpisode: async (episode) => {
    set({ selectedEpisode: episode });
    if (episode) {
      const ledger = await clinicalCoreApiService.getBillingLedgerByEpisode(episode.id);
      const epEncounters = await clinicalCoreApiService.getEncounters({ episodeId: episode.id });
      set({ billingLedger: ledger, encounters: epEncounters });
    }
  },

  createEpisode: async (payload) => {
    const newEp = await clinicalCoreApiService.createEpisode(payload);
    await get().fetchCoreData();
    return newEp;
  },

  updateEpisodeStatus: async (episodeId, nextStatus, reason) => {
    const updated = await clinicalCoreApiService.updateEpisodeStatus(episodeId, nextStatus, reason, 'admin@nurseflow.id');
    await get().fetchCoreData();
    return updated;
  },

  createEncounter: async (payload) => {
    const newEnc = await clinicalCoreApiService.createEncounter(payload);
    await get().fetchCoreData();
    return newEnc;
  },

  transitionEncounter: async (encounterId, nextStatus, reason) => {
    const updated = await clinicalCoreApiService.transitionEncounter(encounterId, nextStatus, reason, 'admin@nurseflow.id');
    await get().fetchCoreData();
    return updated;
  },

  bookAppointment: async (payload) => {
    const appt = await clinicalCoreApiService.bookAppointment(payload);
    await get().fetchCoreData();
    return appt;
  },

  cancelAppointment: async (appointmentId, reason) => {
    const cancelled = await clinicalCoreApiService.cancelAppointment(appointmentId, reason);
    await get().fetchCoreData();
    return cancelled;
  },

  recordServiceCharge: async (chargePayload) => {
    const res = await clinicalCoreApiService.recordServiceCharge(chargePayload);
    if (get().selectedEpisode) {
      const ledger = await clinicalCoreApiService.getBillingLedgerByEpisode(get().selectedEpisode.id);
      set({ billingLedger: ledger });
    }
    return res;
  },

  advanceWorkflow: async (instanceId, notes) => {
    const updated = await clinicalCoreApiService.advanceWorkflow(instanceId, notes, 'admin@nurseflow.id');
    await get().fetchCoreData();
    return updated;
  }
}));
