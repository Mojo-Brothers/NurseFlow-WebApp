/**
 * Triage Store — Zustand
 * Menyimpan state vitals, patient pilihan, dan progress hold-to-submit.
 */
import { create } from 'zustand';
import { submitTriage } from './services/triage.service.js';
import { calculateNEWS2, getTriageColor } from '../../utils/clinicalCalculators.js';

const INITIAL_VITALS = {
  heartRate:   '',
  systolicBP:  '',
  diastolicBP: '',
  spo2:        '',
  temperature: '',
};

export const useTriageStore = create((set, get) => ({
  // ─── State ───────────────────────────────
  vitals:              { ...INITIAL_VITALS },
  selectedPatientId:   null,
  selectedEncounterId: null,
  selectedBedId:       null,
  holdProgress:        0,
  isSubmitting:        false,
  submitSuccess:       false,
  error:               null,

  // ─── Computed (dipakai UI) ───────────────
  get news2Score() {
    return calculateNEWS2(get().vitals);
  },
  get triageLevel() {
    return getTriageColor(calculateNEWS2(get().vitals));
  },

  // ─── Actions ─────────────────────────────
  setVital: (key, value) =>
    set(state => ({ vitals: { ...state.vitals, [key]: value } })),

  selectPatient: (id) => set({ selectedPatientId: id, selectedEncounterId: null }),

  selectEncounter: (id) => set({ selectedEncounterId: id }),

  selectBed: (id) => set({ selectedBedId: id }),

  setHoldProgress: (progress) => set({ holdProgress: progress }),

  resetForm: () => set({
    vitals:        { ...INITIAL_VITALS },
    selectedBedId: null,
    holdProgress:  0,
    submitSuccess: false,
    serverConflict: null,
    error:         null,
  }),

  /**
   * Eksekusi submit triage ke Firebase melalui service layer.
   * @param {string} userEmail
   */
  executeSubmit: async (userEmail) => {
    const { vitals, selectedPatientId, selectedEncounterId } = get();

    if (!selectedPatientId || !selectedEncounterId) {
      set({ error: 'Pasien dan Encounter Aktif wajib dipilih!' });
      return;
    }

    set({ isSubmitting: true, error: null });

    try {

      // ✅ Panggil SERVICE (Spark-Safe Transaction)
      await submitTriage({
        patientId:   selectedPatientId,
        encounterId: selectedEncounterId,
        bedId:       get().selectedBedId,
        vitals,
        assessedBy:  userEmail,
      });

      set({ isSubmitting: false, submitSuccess: true, holdProgress: 0 });
      // Auto-reset form setelah 2 detik
      setTimeout(() => get().resetForm(), 2000);

    } catch (err) {
      console.error('[TriageStore] Submit error:', err);
      set({ isSubmitting: false, error: err.message, holdProgress: 0 });
    }
  },
}));
