import { create } from 'zustand';
import {
  getPendingMedications,
  dispenseMedication,
  cancelMedication,
} from './services/pharmacy.service.js';

export const usePharmacyStore = create((set, get) => ({
  pendingQueue: [],
  isLoading:    false,
  error:        null,

  fetchQueue: async () => {
    set({ isLoading: true, error: null });
    try {
      const meds = await getPendingMedications();
      set({ pendingQueue: meds, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  dispense: async (medicationId, dispensedBy) => {
    try {
      await dispenseMedication(medicationId, dispensedBy);
      set(s => ({
        pendingQueue: s.pendingQueue.filter(m => m.id !== medicationId)
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  cancel: async (medicationId, cancelledBy) => {
    try {
      await cancelMedication(medicationId, cancelledBy);
      set(s => ({
        pendingQueue: s.pendingQueue.filter(m => m.id !== medicationId)
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
