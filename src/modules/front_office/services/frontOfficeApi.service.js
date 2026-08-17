/**
 * NurseFlow Enterprise HIS 2026 — Front Office Unified REST API Gateway
 * Sprint 2: Registration, Multi-Queue, BPJS V-Claim, Antrean & Transactional Outbox
 */

import { registrationEngineService } from './registrationEngine.service.js';
import { queueManagementEngineService } from './queueManagementEngine.service.js';
import { bpjsVClaimBridgeService } from './bpjsVClaimBridge.service.js';
import { bpjsAntreanBridgeService } from './bpjsAntreanBridge.service.js';
import { outboxPublisherService } from './outboxPublisher.service.js';

export const frontOfficeApiService = {
  // ─── 1. PATIENT REGISTRATION & CONSENT ───
  getRegistrations: async (filters = {}) => {
    return registrationEngineService.getRegistrations(filters);
  },

  registerNewPatient: async (payload) => {
    return registrationEngineService.registerNewPatient(payload);
  },

  registerExistingPatient: async (payload) => {
    return registrationEngineService.registerExistingPatient(payload);
  },

  recordConsent: async (payload) => {
    return registrationEngineService.recordConsent(payload);
  },

  getConsents: async (patientId) => {
    return registrationEngineService.getConsents(patientId);
  },

  // ─── 2. QUEUE MANAGEMENT ───
  getQueueTickets: async (poolCode = 'ALL') => {
    return queueManagementEngineService.getTickets(poolCode);
  },

  getQueuePools: async () => {
    return queueManagementEngineService.getPools();
  },

  generateQueueTicket: async (payload) => {
    return queueManagementEngineService.generateTicket(payload);
  },

  callQueueTicket: async (payload) => {
    return queueManagementEngineService.callTicket(payload);
  },

  updateQueueStatus: async (ticketId, nextStatus) => {
    return queueManagementEngineService.updateTicketStatus(ticketId, nextStatus);
  },

  // ─── 3. BPJS V-CLAIM BRIDGING ───
  checkBpjsEligibility: async (noKartu, tgl) => {
    return bpjsVClaimBridgeService.checkParticipantEligibility(noKartu, tgl);
  },

  searchBpjsReferral: async (noRujukan) => {
    return bpjsVClaimBridgeService.searchReferral(noRujukan);
  },

  generateBpjsSep: async (sepPayload) => {
    return bpjsVClaimBridgeService.generateSep(sepPayload);
  },

  createControlLetter: async (payload) => {
    return bpjsVClaimBridgeService.createControlLetter(payload);
  },

  getIssuedSeps: async () => {
    return bpjsVClaimBridgeService.getSeps();
  },

  // ─── 4. BPJS ANTREAN MOBILE JKN ───
  syncBpjsTask: async (taskPayload) => {
    return bpjsAntreanBridgeService.syncTask(taskPayload);
  },

  getBpjsTaskLogs: async (bookingCode) => {
    return bpjsAntreanBridgeService.getTaskLogs(bookingCode);
  },

  // ─── 5. TRANSACTIONAL OUTBOX OBSERVABILITY ───
  getOutboxLogs: async () => {
    return outboxPublisherService.getOutboxLogs();
  }
};
