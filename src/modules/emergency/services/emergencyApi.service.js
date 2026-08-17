/**
 * NurseFlow Enterprise HIS 2026 — Emergency Unified REST API Gateway
 * Sprint 3: Triage, SLA Timer, Fast-Track Protocol, Resuscitation & Alerts
 */

import { triageEngineService } from './triageEngine.service.js';
import { triageSlaEngineService } from './triageSlaEngine.service.js';
import { emergencyProtocolEngineService } from './emergencyProtocolEngine.service.js';
import { emergencyWorkflowEngineService } from './emergencyWorkflowEngine.service.js';
import { emergencyAlertEngineService } from './emergencyAlertEngine.service.js';

export const emergencyApiService = {
  // ─── 1. TRIAGE APIS ───
  getTriageRecords: async (filters = {}) => {
    return triageEngineService.getTriageRecords(filters);
  },

  recordTriageAssessment: async (payload) => {
    return triageEngineService.recordTriageAssessment(payload);
  },

  calculateGcs: (e, v, m) => {
    return triageEngineService.calculateGcs(e, v, m);
  },

  // ─── 2. SLA STOPWATCH APIS ───
  getActiveSlaTimers: async () => {
    return triageSlaEngineService.getActiveTimers();
  },

  recordFirstPhysicianContact: async (payload) => {
    return triageSlaEngineService.recordFirstPhysicianContact(payload);
  },

  getPmkpCompliance: async () => {
    return triageSlaEngineService.calculatePmkpCompliance();
  },

  // ─── 3. EMERGENCY PROTOCOL APIS ───
  getProtocols: async () => {
    return emergencyProtocolEngineService.getProtocols();
  },

  activateProtocol: async (payload) => {
    return emergencyProtocolEngineService.activateProtocol(payload);
  },

  getProtocolExecutions: async (encounterId) => {
    return emergencyProtocolEngineService.getExecutions(encounterId);
  },

  // ─── 4. RESUSCITATION & DISPOSITION APIS ───
  logResuscitationEvent: async (payload) => {
    return emergencyWorkflowEngineService.logResuscitationEvent(payload);
  },

  getResuscitationTimeline: async (encounterId) => {
    return emergencyWorkflowEngineService.getResuscitationTimeline(encounterId);
  },

  decideDisposition: async (payload) => {
    return emergencyWorkflowEngineService.decideDisposition(payload);
  },

  // ─── 5. EMERGENCY ALERTS ───
  triggerEmergencyAlert: async (payload) => {
    return emergencyAlertEngineService.triggerEmergencyAlert(payload);
  }
};
