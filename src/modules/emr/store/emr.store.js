import { create } from 'zustand';
import { emrApiService } from '../services/emrApi.service.js';

export const useEmrStore = create((set, get) => ({
  patientTimeline: null,
  soapNotes: [],
  cpptNotes: [],
  allergies: [],
  observations: [],
  diagnoses: [],
  carePlans: [],
  cdssAlerts: [],
  selectedPatientId: null,
  loading: false,
  error: null,

  fetchEmrData: async (patientId = null) => {
    if (!patientId) {
      set({ patientTimeline: null, soapNotes: [], cpptNotes: [], allergies: [], observations: [], diagnoses: [], carePlans: [], cdssAlerts: [], selectedPatientId: null, loading: false });
      return;
    }
    set({ loading: true, error: null, selectedPatientId: patientId });
    try {
      const [timeline, soapNotes, cpptNotes, allergies, observations, diagnoses, carePlans, cdssAlerts] = await Promise.all([
        emrApiService.getPatientTimeline(patientId),
        emrApiService.getSoapNotes(patientId),
        emrApiService.getCpptNotes(),
        emrApiService.getPatientAllergies(patientId),
        emrApiService.getObservations(patientId),
        emrApiService.getDiagnoses(patientId),
        emrApiService.getCarePlans(patientId),
        emrApiService.getCdssAlerts()
      ]);

      set({
        patientTimeline: timeline,
        soapNotes,
        cpptNotes,
        allergies,
        observations,
        diagnoses,
        carePlans,
        cdssAlerts,
        loading: false
      });
    } catch (err) {
      console.error('[EmrStore] Error loading EMR data:', err);
      set({ error: err.message, loading: false });
    }
  },

  recordSoapNote: async (payload) => {
    const res = await emrApiService.recordSoapNote(payload);
    await get().fetchEmrData(payload.patientId);
    return res;
  },

  recordCpptEntry: async (payload) => {
    const res = await emrApiService.recordCpptEntry(payload);
    await get().fetchEmrData(payload.patientId);
    return res;
  },

  recordAllergy: async (payload) => {
    const res = await emrApiService.recordAllergy(payload);
    await get().fetchEmrData(payload.patientId);
    return res;
  },

  recordObservation: async (payload) => {
    const res = await emrApiService.recordObservation(payload);
    await get().fetchEmrData(payload.patientId);
    return res;
  },

  recordDiagnosis: async (payload) => {
    const res = await emrApiService.recordDiagnosis(payload);
    await get().fetchEmrData(payload.patientId);
    return res;
  },

  createCarePlan: async (payload) => {
    const res = await emrApiService.createCarePlan(payload);
    await get().fetchEmrData(payload.patientId);
    return res;
  },

  evaluatePrescriptionSafeguards: async (payload) => {
    const res = await emrApiService.evaluatePrescriptionSafeguards(payload);
    const alerts = await emrApiService.getCdssAlerts(payload.encounterId);
    set({ cdssAlerts: alerts });
    return res;
  }
}));
