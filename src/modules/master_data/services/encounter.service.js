/**
 * NurseFlow Enterprise HIS 2026 — Encounter Finite State Machine Service
 * Enforces strict clinical state transition rules and prevents illegal jumps.
 */

import { enterpriseAuditEngine } from './enterpriseAuditEngine.service.js';

export const ENCOUNTER_STATE_TRANSITIONS = {
  PLANNED: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['TRIAGED', 'CANCELLED'],
  TRIAGED: ['WAITING', 'CANCELLED'],
  WAITING: ['IN_PROGRESS', 'NO_SHOW', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETED'],
  ON_HOLD: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  COMPLETED: [], // Terminal State
  CANCELLED: [], // Terminal State
  NO_SHOW: []   // Terminal State
};

export const encounterService = {
  validateEncounterTransition: (currentStatus, nextStatus) => {
    if (!currentStatus || !nextStatus) {
      return { isValid: false, message: 'Status awal dan status tujuan wajib disertakan.' };
    }

    if (currentStatus === nextStatus) {
      return { isValid: true, message: 'Status tidak berubah.' };
    }

    const allowedNext = ENCOUNTER_STATE_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(nextStatus)) {
      return {
        isValid: false,
        message: `Transisi ilegal: Status ${currentStatus} tidak dapat diubah langsung ke ${nextStatus}. Jalur yang diizinkan: ${allowedNext.join(' / ') || 'Tidak ada (Status Akhir/Terminal)'}`
      };
    }

    return { isValid: true, message: `Transisi valid: ${currentStatus} → ${nextStatus}` };
  },

  transitionEncounter: async ({
    encounterId,
    currentStatus,
    nextStatus,
    practitionerId,
    reason = '',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const validation = encounterService.validateEncounterTransition(currentStatus, nextStatus);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    const now = new Date().toISOString();
    const updatePayload = {
      encounter_status: nextStatus,
      updated_at: now,
      updated_by: actorEmail,
      ...(nextStatus === 'COMPLETED' ? { ended_at: now } : {}),
      ...(nextStatus === 'IN_PROGRESS' && !currentStatus ? { started_at: now } : {})
    };

    await enterpriseAuditEngine.logEvent({
      domain: 'PATIENT',
      entity: 'encounters',
      entityId: encounterId,
      action: 'STATE_TRANSITION',
      oldValue: { status: currentStatus },
      newValue: { status: nextStatus, practitioner_id: practitionerId },
      userEmail: actorEmail,
      reason: `Transisi status encounter: ${currentStatus} → ${nextStatus}. ${reason}`
    });

    return {
      success: true,
      encounterId,
      previousStatus: currentStatus,
      currentStatus: nextStatus,
      timestamp: now
    };
  }
};
