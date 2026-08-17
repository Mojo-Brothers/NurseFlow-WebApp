/**
 * NurseFlow Enterprise HIS 2026 — Core EMR REST API Gateway
 * Sprint 4: SOAP, CPPT, Allergy, Observation, Diagnosis, CDSS, CarePlan & Timeline
 */

import { soapEngineService } from './soapEngine.service.js';
import { cpptEngineService } from './cpptEngine.service.js';
import { allergyEngineService } from './allergyEngine.service.js';
import { observationEngineService } from './observationEngine.service.js';
import { diagnosisEngineService } from './diagnosisEngine.service.js';
import { carePlanEngineService } from './carePlanEngine.service.js';
import { cdssEngineService } from './cdssEngine.service.js';
import { emrTimelineEngineService } from './emrTimelineEngine.service.js';

export const emrApiService = {
  // ─── 1. SOAP APIS ───
  getSoapNotes: async (patientId, encounterId) => {
    return soapEngineService.getSoapNotes(patientId, encounterId);
  },

  recordSoapNote: async (payload) => {
    return soapEngineService.recordSoapNote(payload);
  },

  // ─── 2. CPPT APIS ───
  getCpptNotes: async (episodeId, encounterId) => {
    return cpptEngineService.getCpptNotes(episodeId, encounterId);
  },

  recordCpptEntry: async (payload) => {
    return cpptEngineService.recordCpptEntry(payload);
  },

  verifyCpptByDpjp: async (payload) => {
    return cpptEngineService.verifyCpptByDpjp(payload);
  },

  // ─── 3. ALLERGY APIS ───
  getPatientAllergies: async (patientId) => {
    return allergyEngineService.getPatientAllergies(patientId);
  },

  recordAllergy: async (payload) => {
    return allergyEngineService.recordAllergy(payload);
  },

  checkDrugAllergyConflict: (patientId, drugName) => {
    return allergyEngineService.checkDrugAllergyConflict(patientId, drugName);
  },

  // ─── 4. OBSERVATION APIS (LOINC) ───
  getObservations: async (patientId, encounterId) => {
    return observationEngineService.getObservations(patientId, encounterId);
  },

  recordObservation: async (payload) => {
    return observationEngineService.recordObservation(payload);
  },

  // ─── 5. DIAGNOSIS APIS (ICD-10) ───
  searchIcd10: (query) => {
    return diagnosisEngineService.searchIcd10(query);
  },

  getDiagnoses: async (patientId, encounterId) => {
    return diagnosisEngineService.getDiagnoses(patientId, encounterId);
  },

  recordDiagnosis: async (payload) => {
    return diagnosisEngineService.recordDiagnosis(payload);
  },

  // ─── 6. CDSS APIS ───
  evaluatePrescriptionSafeguards: async (payload) => {
    return cdssEngineService.evaluatePrescriptionSafeguards(payload);
  },

  getCdssAlerts: async (encounterId) => {
    return cdssEngineService.getAlerts(encounterId);
  },

  // ─── 7. CARE PLAN APIS ───
  getCarePlans: async (patientId, episodeId) => {
    return carePlanEngineService.getCarePlans(patientId, episodeId);
  },

  createCarePlan: async (payload) => {
    return carePlanEngineService.createCarePlan(payload);
  },

  // ─── 8. LONGITUDINAL TIMELINE ───
  getPatientTimeline: async (patientId) => {
    return emrTimelineEngineService.generatePatientTimeline(patientId);
  }
};
