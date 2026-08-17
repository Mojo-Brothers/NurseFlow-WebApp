/**
 * NurseFlow Enterprise HIS 2026 — Clinical Core REST API Gateway
 * Unified service interface for Episode of Care, Encounter, Appointment,
 * Workflow Engine, and Event-Driven Billing Ledger.
 */

import { episodeOfCareEngineService } from './episodeOfCareEngine.service.js';
import { encounterEngineService } from './encounterEngine.service.js';
import { appointmentEngineService } from './appointmentEngine.service.js';
import { clinicalWorkflowEngineService } from './clinicalWorkflowEngine.service.js';
import { universalEventContractService } from './universalEventContract.service.js';

export const clinicalCoreApiService = {
  // ─── 1. EPISODE OF CARE APIS ───
  getEpisodes: async (filters = {}) => {
    return episodeOfCareEngineService.getEpisodes(filters);
  },

  getEpisodeById: async (episodeId) => {
    return episodeOfCareEngineService.getEpisodeById(episodeId);
  },

  createEpisode: async (payload) => {
    return episodeOfCareEngineService.createEpisode(payload);
  },

  updateEpisodeStatus: async (episodeId, nextStatus, reason, actorEmail) => {
    return episodeOfCareEngineService.updateEpisodeStatus({ episodeId, nextStatus, reason, actorEmail });
  },

  // ─── 2. ENCOUNTER APIS ───
  getEncounters: async (filters = {}) => {
    return encounterEngineService.getEncounters(filters);
  },

  createEncounter: async (payload) => {
    return encounterEngineService.createEncounter(payload);
  },

  transitionEncounter: async (encounterId, nextStatus, reason, actorEmail) => {
    return encounterEngineService.transitionEncounterStatus({ encounterId, nextStatus, reason, actorEmail });
  },

  validateEncounterTransition: (currentStatus, nextStatus) => {
    return encounterEngineService.validateTransition(currentStatus, nextStatus);
  },

  // ─── 3. APPOINTMENT APIS ───
  getAppointments: async (filters = {}) => {
    return appointmentEngineService.getAppointments(filters);
  },

  getDoctorSlots: async (params) => {
    return appointmentEngineService.generateDoctorSlots(params);
  },

  bookAppointment: async (payload) => {
    return appointmentEngineService.bookAppointment(payload);
  },

  cancelAppointment: async (appointmentId, reason) => {
    return appointmentEngineService.cancelAppointment(appointmentId, reason);
  },

  // ─── 4. CLINICAL WORKFLOW APIS ───
  getActiveWorkflows: async () => {
    return clinicalWorkflowEngineService.getActiveWorkflows();
  },

  getWorkflowTemplates: async () => {
    return clinicalWorkflowEngineService.getTemplates();
  },

  startWorkflow: async (payload) => {
    return clinicalWorkflowEngineService.startWorkflow(payload);
  },

  advanceWorkflow: async (instanceId, notes, actorEmail) => {
    return clinicalWorkflowEngineService.advanceStep({ instanceId, notes, actorEmail });
  },

  // ─── 5. EVENT-DRIVEN BILLING LEDGER APIS ───
  recordServiceCharge: async (chargePayload) => {
    return universalEventContractService.recordServiceCharge(chargePayload);
  },

  getBillingLedgerByEpisode: async (episodeId) => {
    return universalEventContractService.getBillingLedgerByEpisode(episodeId);
  },

  getEventStore: async (filters = {}) => {
    return universalEventContractService.getEventStore(filters);
  }
};
