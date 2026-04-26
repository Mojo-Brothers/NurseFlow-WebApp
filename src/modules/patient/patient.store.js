/**
 * Patient Store — Zustand
 * State global untuk patient context, shared antar halaman.
 */
import { create } from 'zustand';
import { getAllPatients, registerPatient, updatePatient } from './services/patient.service.js';

export const usePatientStore = create((set, get) => ({
  // ─── State ───────────────────────────────
  patients:          [],
  selectedPatientId: null,
  isLoading:         false,
  error:             null,

  // ─── Computed (getter) ───────────────────
  get selectedPatient() {
    return get().patients.find(p => p.id === get().selectedPatientId) || null;
  },

  // ─── Actions ─────────────────────────────
  fetchPatients: async () => {
    set({ isLoading: true, error: null });
    try {
      const patients = await getAllPatients();
      set({ patients, isLoading: false });
    } catch (err) {
      console.error('[PatientStore] fetchPatients error:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  selectPatient: (id) => set({ selectedPatientId: id }),

  addPatient: async (patientData, registeredBy, id = null) => {
    set({ isLoading: true, error: null });
    try {
      if (id) {
        // Mode Update
        await updatePatient(id, patientData, registeredBy);
        set(state => ({
          patients: state.patients.map(p => p.id === id ? { ...p, ...patientData } : p),
          isLoading: false
        }));
        return { id, ...patientData };
      } else {
        // Mode Create
        const newPatient = await registerPatient(patientData, registeredBy);
        set(state => ({
          patients:  [newPatient, ...state.patients],
          isLoading: false,
        }));
        return newPatient;
      }
    } catch (err) {
      console.error('[PatientStore] savePatient error:', err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
}));
