/**
 * NurseFlow Enterprise HIS 2026 — CDSS Medicolegal Replay & Audit Service
 * Standards: JCI MCI (Medicolegal Replay & Deterministic Investigation)
 */

import { cdssExecutionRepository } from '../repositories/cdssExecution.repository.js';
import { dynamicCdssEngineService } from './dynamicCdssEngine.service.js';

export const cdssReplayEngineService = {
  /**
   * Replay historical CDSS evaluation using stored input snapshot
   */
  replayExecution: async (executionId) => {
    const historicalRecord = await cdssExecutionRepository.findById(executionId);
    if (!historicalRecord) {
      throw new Error(`Record eksekusi CDSS ${executionId} tidak ditemukan.`);
    }

    const inputSnapshot = JSON.parse(historicalRecord.inputSnapshot);
    const originalOutputSnapshot = JSON.parse(historicalRecord.outputSnapshot);

    // Re-evaluate using exact historical inputs
    const replayedResult = await dynamicCdssEngineService.evaluatePrescription({
      organizationId: historicalRecord.organizationId,
      encounterId: historicalRecord.encounterId,
      patientId: historicalRecord.patientId,
      proposedDrugId: historicalRecord.medicationId,
      doseAmount: inputSnapshot.doseAmount,
      doseUnit: inputSnapshot.doseUnit,
      route: inputSnapshot.route,
      patientContext: inputSnapshot.patientContext,
      actorId: historicalRecord.executedByPractitionerId
    });

    const isIdentical = replayedResult.evaluationResult === historicalRecord.evaluationResult ||
                        (historicalRecord.evaluationResult === 'WARNING_OVERRIDDEN' && replayedResult.evaluationResult === 'WARNING_TRIGGERED');

    return {
      executionId,
      historicalRecord,
      originalOutputSnapshot,
      replayedResult,
      isDeterministicMatch: isIdentical,
      replayedAt: Date.now()
    };
  },

  getAuditTrailForEncounter: async (encounterId) => {
    return cdssExecutionRepository.findByEncounterId(encounterId);
  }
};
