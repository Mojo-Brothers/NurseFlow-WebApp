/**
 * Triage Store — Zustand
 * Menyimpan state vitals, patient pilihan, dan progress hold-to-submit.
 */
import { create } from 'zustand';
import { submitTriage } from './services/triage.service.js';
import { getActiveQueue } from '../encounter/services/encounter.service.js';
import { calculateNEWS2, getTriageColor } from '../../utils/clinicalCalculators.js';

const INITIAL_VITALS = {
  heartRate:   '',
  systolicBP:  '',
  diastolicBP: '',
  spo2:        '',
  temperature: '',
  respRate:    '',
  painScale:   0,
};

export const useTriageStore = create((set, get) => ({
  // ─── State ───────────────────────────────
  operationalMode:     'RAPID', // RAPID, DETAIL, MONITOR, POLI
  vitals:              { ...INITIAL_VITALS },
  selectedPatientId:   null,
  selectedEncounterId: null,
  selectedBedId:       null,
  esiLevel:            null,
  chiefComplaint:      '',
  fallRisk:            false,
  nutritionalRisk:     false,
  
  // New Secondary Assessment Fields (JCI Phase 3/4)
  secondaryAssessment: {
    airway: 'PATENT',
    breathing: 'ADEQUATE',
    circulation: 'PRESENT',
    neurological: 'ALERT',
    respiratoryEffort: 'UNLABORED',
    narrative: '',
    allergies: [],
    medications: [],
    infectionControl: 'STANDARD', // STANDARD, DROPLET, AIRBORNE, CONTACT
  },

  // Poli Screening Questions
  screeningQuestions: {
    fever: false,
    shortnessOfBreath: false,
    routineFollowUp: false,
  },

  // Monitor Mode State (Mock Data for Enterprise Demo)
  activeQueue: [],
  zoneLoad: {
    resus: 0.9,
    acute: 0.75,
    fastTrack: 0.3
  },

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
  setOperationalMode: (mode) => set({ operationalMode: mode }),
  
  setVital: (key, value) =>
    set(state => ({ vitals: { ...state.vitals, [key]: value } })),

  setSecondaryField: (key, value) =>
    set(state => ({ 
      secondaryAssessment: { ...state.secondaryAssessment, [key]: value } 
    })),

  setScreeningQuestion: (key, value) =>
    set(state => ({
      screeningQuestions: { ...state.screeningQuestions, [key]: value }
    })),

  selectPatient: (id) => set({ selectedPatientId: id, selectedEncounterId: null }),

  selectEncounter: (id) => set({ selectedEncounterId: id }),

  selectBed: (id) => set({ selectedBedId: id }),

  setEsiLevel: (level) => set({ esiLevel: level }),
  setChiefComplaint: (complaint) => set({ chiefComplaint: complaint }),
  setFallRisk: (risk) => set({ fallRisk: risk }),
  setNutritionalRisk: (risk) => set({ nutritionalRisk: risk }),

  setHoldProgress: (progress) => set({ holdProgress: progress }),

  resetForm: () => set({
    vitals:          { ...INITIAL_VITALS },
    secondaryAssessment: {
      airway: 'PATENT',
      breathing: 'ADEQUATE',
      circulation: 'PRESENT',
      neurological: 'ALERT',
      respiratoryEffort: 'UNLABORED',
      narrative: '',
      allergies: [],
      medications: [],
      infectionControl: 'STANDARD',
    },
    screeningQuestions: {
      fever: false,
      shortnessOfBreath: false,
      routineFollowUp: false,
    },
    selectedBedId:   null,
    esiLevel:        null,
    chiefComplaint:  '',
    fallRisk:        false,
    nutritionalRisk: false,
    holdProgress:    0,
    submitSuccess:   false,
    serverConflict:  null,
    error:           null,
  }),

  fetchActiveQueue: async (allPatients = []) => {
    set({ isLoading: true, error: null });
    try {
      const encounters = await getActiveQueue();
      
      // Map patient names from allPatients list
      const enrichedQueue = encounters.map(e => {
        const patient = allPatients.find(p => p.id === e.patient_id);
        
        // Calculate wait time
        let waitTime = 0;
        if (e.admitted_at) {
          const admittedAt = e.admitted_at.toDate ? e.admitted_at.toDate() : new Date(e.admitted_at);
          const diffMs = new Date() - admittedAt;
          waitTime = Math.floor(diffMs / 60000);
        }

        return {
          id: e.id,
          name: patient ? patient.name : 'Unknown Patient',
          esi: e.last_news2 || e.esi_level || 0, // Fallback to 0 if not triaged
          status: e.status,
          waitTime: waitTime,
          patientId: e.patient_id
        };
      });

      set({ activeQueue: enrichedQueue, isLoading: false });
    } catch (err) {
      console.error('[TriageStore] Fetch queue error:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  executeSubmit: async (userEmail) => {
    const { vitals, selectedPatientId, selectedEncounterId, secondaryAssessment, screeningQuestions, esiLevel, chiefComplaint } = get();

    if (!selectedPatientId || !selectedEncounterId) {
      const msg = 'Pasien dan Encounter Aktif wajib dipilih!';
      set({ error: msg });
      throw new Error(msg);
    }

    if (!esiLevel) {
      const msg = 'JCI Protocol: ESI Level wajib ditentukan sebelum submit.';
      set({ error: msg });
      throw new Error(msg);
    }

    if (!chiefComplaint || chiefComplaint.trim() === '') {
      const msg = 'JCI Protocol: Chief Complaint wajib diisi.';
      set({ error: msg });
      throw new Error(msg);
    }

    set({ isSubmitting: true, error: null });

    try {
      await submitTriage({
        patientId:   selectedPatientId,
        encounterId: selectedEncounterId,
        bedId:       get().selectedBedId,
        vitals,
        secondaryAssessment,
        screeningQuestions,
        esiLevel,
        chiefComplaint,
        fallRisk:    get().fallRisk,
        nutritionalRisk: get().nutritionalRisk,
        assessedBy:  userEmail,
      });

      set({ isSubmitting: false, submitSuccess: true, holdProgress: 0 });
      setTimeout(() => get().resetForm(), 2000);

    } catch (err) {
      console.error('[TriageStore] Submit error:', err);
      set({ isSubmitting: false, error: err.message, holdProgress: 0 });
      throw err;
    }
  },
}));
