import { create } from 'zustand';
import { frontOfficeApiService } from '../services/frontOfficeApi.service.js';

export const useFrontOfficeStore = create((set, get) => ({
  registrations: [],
  queueTickets: [],
  queuePools: [],
  issuedSeps: [],
  taskLogs: [],
  outboxLogs: [],
  consents: [],
  selectedRegistration: null,
  loading: false,
  error: null,

  fetchFrontOfficeData: async () => {
    set({ loading: true, error: null });
    try {
      const [registrations, queueTickets, queuePools, issuedSeps, taskLogs, outboxLogs] = await Promise.all([
        frontOfficeApiService.getRegistrations(),
        frontOfficeApiService.getQueueTickets(),
        frontOfficeApiService.getQueuePools(),
        frontOfficeApiService.getIssuedSeps(),
        frontOfficeApiService.getBpjsTaskLogs(),
        frontOfficeApiService.getOutboxLogs()
      ]);

      set({
        registrations,
        selectedRegistration: registrations[0] || null,
        queueTickets,
        queuePools,
        issuedSeps,
        taskLogs,
        outboxLogs,
        loading: false
      });
    } catch (err) {
      console.error('[FrontOfficeStore] Error loading data:', err);
      set({ error: err.message, loading: false });
    }
  },

  registerNewPatient: async (payload) => {
    const res = await frontOfficeApiService.registerNewPatient(payload);
    await get().fetchFrontOfficeData();
    return res;
  },

  registerExistingPatient: async (payload) => {
    const res = await frontOfficeApiService.registerExistingPatient(payload);
    await get().fetchFrontOfficeData();
    return res;
  },

  recordConsent: async (payload) => {
    const res = await frontOfficeApiService.recordConsent(payload);
    await get().fetchFrontOfficeData();
    return res;
  },

  callTicket: async (ticketId, counterName) => {
    const res = await frontOfficeApiService.callQueueTicket({ ticketId, counterName });
    await get().fetchFrontOfficeData();
    return res;
  },

  generateSep: async (payload) => {
    const res = await frontOfficeApiService.generateBpjsSep(payload);
    await get().fetchFrontOfficeData();
    return res;
  },

  syncTask: async (payload) => {
    const res = await frontOfficeApiService.syncBpjsTask(payload);
    await get().fetchFrontOfficeData();
    return res;
  }
}));
