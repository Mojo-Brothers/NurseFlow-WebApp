import { create } from 'zustand';
import { emergencyApiService } from '../services/emergencyApi.service.js';

export const useEmergencyStore = create((set, get) => ({
  triageRecords: [],
  slaTimers: [],
  pmkpStats: { compliancePercent: 100, totalCases: 0, breachedCases: 0 },
  protocols: [],
  protocolExecutions: [],
  resusTimeline: [],
  selectedTriage: null,
  loading: false,
  error: null,

  fetchEmergencyData: async () => {
    set({ loading: true, error: null });
    try {
      const [triageRecords, slaTimers, pmkpStats, protocols] = await Promise.all([
        emergencyApiService.getTriageRecords(),
        emergencyApiService.getActiveSlaTimers(),
        emergencyApiService.getPmkpCompliance(),
        emergencyApiService.getProtocols()
      ]);

      set({
        triageRecords,
        selectedTriage: triageRecords[0] || null,
        slaTimers,
        pmkpStats,
        protocols,
        loading: false
      });
    } catch (err) {
      console.error('[EmergencyStore] Error loading emergency data:', err);
      set({ error: err.message, loading: false });
    }
  },

  recordTriageAssessment: async (payload) => {
    const res = await emergencyApiService.recordTriageAssessment(payload);
    await get().fetchEmergencyData();
    return res;
  },

  recordFirstPhysicianContact: async (encounterId, physicianName) => {
    const res = await emergencyApiService.recordFirstPhysicianContact({ encounterId, physicianName });
    await get().fetchEmergencyData();
    return res;
  },

  activateProtocol: async (payload) => {
    const res = await emergencyApiService.activateProtocol(payload);
    await get().fetchEmergencyData();
    return res;
  },

  logResuscitationEvent: async (payload) => {
    const res = await emergencyApiService.logResuscitationEvent(payload);
    const timeline = await emergencyApiService.getResuscitationTimeline(payload.encounterId);
    set({ resusTimeline: timeline });
    return res;
  },

  decideDisposition: async (payload) => {
    const res = await emergencyApiService.decideDisposition(payload);
    await get().fetchEmergencyData();
    return res;
  },

  triggerEmergencyAlert: async (payload) => {
    return emergencyApiService.triggerEmergencyAlert(payload);
  }
}));
