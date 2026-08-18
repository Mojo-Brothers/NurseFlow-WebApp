/**
 * NurseFlow Enterprise HIS 2026 — CDSS Medicolegal Replay Engine Test Suite (Sprint 2)
 * Standards: JCI MCI (Medicolegal Determinism & Execution Snapshots)
 */

import { describe, it, expect } from 'vitest';
import { dynamicCdssEngineService } from '../server/services/dynamicCdssEngine.service.js';
import { cdssReplayEngineService } from '../server/services/cdssReplayEngine.service.js';

describe('Sprint 2: CDSS Medicolegal Execution Snapshot & Deterministic Replay', () => {

  // 1. Commit Execution Snapshot with Clinical Justification
  it('1. should record CDSS execution snapshot with input context, alerts, and override reason', async () => {
    const inputContext = {
      doseAmount: 80,
      doseUnit: 'mg',
      route: 'ORAL',
      patientContext: { activeMedicationIds: ['MED-003'] } // Warfarin
    };

    const evaluation = await dynamicCdssEngineService.evaluatePrescription({
      organizationId: 'ORG-01',
      encounterId: 'ENC-TEST-REPLAY-01',
      patientId: 'P-TEST-REPLAY-01',
      proposedDrugId: 'MED-004', // Aspirin
      ...inputContext,
      actorId: 'PRAC-DOC-01'
    });

    const executionRecord = await dynamicCdssEngineService.commitExecutionSnapshot({
      organizationId: 'ORG-01',
      encounterId: 'ENC-TEST-REPLAY-01',
      patientId: 'P-TEST-REPLAY-01',
      medicationId: 'MED-004',
      ruleId: 'RULE-DDI-001',
      ruleVersion: 1,
      evaluationResult: 'WARNING_OVERRIDDEN',
      overrideJustification: 'Indikasi STEMI Akut, pasien dalam terapi DAPT dengan proteksi PPI omeprazole.',
      inputSnapshot: inputContext,
      outputSnapshot: evaluation.alerts,
      actorId: 'PRAC-DOC-01'
    });

    expect(executionRecord.id).toBeDefined();
    expect(executionRecord.evaluationResult).toBe('WARNING_OVERRIDDEN');
    expect(executionRecord.overrideJustification).toContain('Indikasi STEMI Akut');
  });

  // 2. Deterministic Replay Verification
  it('2. should replay historical CDSS execution and prove 100% deterministic match of safety alerts', async () => {
    // Record execution snapshot
    const inputContext = {
      doseAmount: 1000,
      doseUnit: 'mg',
      route: 'IV',
      patientContext: { latestEgfr: 20 }
    };

    const evaluation = await dynamicCdssEngineService.evaluatePrescription({
      organizationId: 'ORG-01',
      encounterId: 'ENC-TEST-REPLAY-02',
      patientId: 'P-CKD-REPLAY-02',
      proposedDrugId: 'MED-001', // Meropenem
      ...inputContext,
      actorId: 'PRAC-DOC-01'
    });

    const executionRecord = await dynamicCdssEngineService.commitExecutionSnapshot({
      organizationId: 'ORG-01',
      encounterId: 'ENC-TEST-REPLAY-02',
      patientId: 'P-CKD-REPLAY-02',
      medicationId: 'MED-001',
      ruleId: 'RULE-RENAL-001',
      ruleVersion: 1,
      evaluationResult: 'WARNING_OVERRIDDEN',
      overrideJustification: 'Dosis disesuaikan menjadi 500mg q12h sesuai panduan nefrologi.',
      inputSnapshot: inputContext,
      outputSnapshot: evaluation.alerts,
      actorId: 'PRAC-DOC-01'
    });

    // Execute Replay via Replay Engine
    const replay = await cdssReplayEngineService.replayExecution(executionRecord.id);

    expect(replay.isDeterministicMatch).toBe(true);
    expect(replay.replayedResult.alerts.length).toBe(evaluation.alerts.length);
    expect(replay.replayedResult.alerts[0].type).toBe(evaluation.alerts[0].type);
  });

});
