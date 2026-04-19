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
  vitals:            { ...INITIAL_VITALS },
  selectedPatientId: null,
  holdProgress:      0,
  isSubmitting:      false,
  submitSuccess:     false,
  error:             null,

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

  selectPatient: (id) => set({ selectedPatientId: id }),

  setHoldProgress: (progress) => set({ holdProgress: progress }),

  resetForm: () => set({
    vitals:        { ...INITIAL_VITALS },
    holdProgress:  0,
    submitSuccess: false,
    error:         null,
  }),

  /**
   * Eksekusi submit triage ke Firebase melalui service layer.
   * @param {string} userEmail
   */
  executeSubmit: async (userEmail) => {
    const { vitals, selectedPatientId } = get();

    if (!selectedPatientId) {
      set({ error: 'Pilih pasien terlebih dahulu.' });
      return;
    }

    set({ isSubmitting: true, error: null });

    try {
      const news2Score  = calculateNEWS2(vitals);
      const triageLevel = getTriageColor(news2Score);

      // ✅ Panggil SERVICE, bukan Firebase langsung
      await submitTriage({
        patientId:   selectedPatientId,
        vitals,
        news2Score,
        triageLevel,
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
