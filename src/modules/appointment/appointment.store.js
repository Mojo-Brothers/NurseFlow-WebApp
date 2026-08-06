import { create } from 'zustand';
import { createAppointment, getLatestAppointments } from './services/appointment.service.js';

export const useAppointmentStore = create((set, get) => ({
  appointments: [],
  isLoading: false,
  error: null,

  fetchAppointments: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getLatestAppointments();
      set({ appointments: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addAppointment: async (appointmentData, createdBy) => {
    set({ isLoading: true, error: null });
    try {
      const newId = await createAppointment(appointmentData, createdBy);
      // Refresh list
      await get().fetchAppointments();
      return newId;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  }
}));
