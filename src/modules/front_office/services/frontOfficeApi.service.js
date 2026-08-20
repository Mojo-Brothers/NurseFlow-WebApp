/**
 * NurseFlow Enterprise HIS 2026 — Front Office Unified REST API Gateway
 * Sprint 2: Registration, Multi-Queue, BPJS V-Claim, Antrean & Transactional Outbox
 */

import { registrationEngineService } from './registrationEngine.service.js';
import { queueManagementEngineService } from './queueManagementEngine.service.js';
import { bpjsVClaimBridgeService } from './bpjsVClaimBridge.service.js';
import { bpjsAntreanBridgeService } from './bpjsAntreanBridge.service.js';
import { outboxPublisherService } from './outboxPublisher.service.js';
import { httpClient } from '../../../core/api/httpClient.js';

export const frontOfficeApiService = {
  // ─── 1. PATIENT REGISTRATION & CONSENT ───
  getRegistrations: async (filters = {}) => {
    return registrationEngineService.getRegistrations(filters);
  },

  registerNewPatient: async (payload) => {
    // 1. Call Real Backend API to establish Durable PostgreSQL Entity (ACID Transaction)
    const apiRes = await httpClient.post('/patients', {
      fullName: payload.fullName,
      nik: payload.nik,
      birthDate: payload.birthDate,
      birthPlace: payload.birthPlace || 'Jakarta',
      gender: payload.gender,
      bloodType: payload.bloodType || 'UNKNOWN',
      maritalStatus: payload.maritalStatus || 'SINGLE',
      religion: payload.religion || 'ISLAM',
      education: payload.education || 'SMA',
      occupation: payload.occupation || 'KARYAWAN',
      phoneNumber: payload.phoneNumber,
      email: payload.email || '',
      address: payload.address || 'Jl. Rawamangun No. 1, Jakarta',
      guarantorType: payload.guarantorId === 'GRN-BPJS' ? 'BPJS' : 'UMUM',
      bpjsCardNumber: payload.insuranceCardNumber || null
    });

    const serverPatient = apiRes.data;

    // 2. Wire the server-generated durable patient entity into local workflows
    const registrationRecord = await registrationEngineService.registerNewPatient({
      ...payload,
      serverPatient
    });

    return {
      ...registrationRecord,
      serverPatient,
      meta: apiRes.meta
    };
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
