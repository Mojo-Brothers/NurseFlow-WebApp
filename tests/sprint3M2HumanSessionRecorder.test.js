/**
 * NurseFlow Enterprise HIS 2026 — Sprint 3M.2: Observational Human Session Ledger Test
 * Validates the live recording of participant sessions, NASA-TLX psychometrics,
 * SUS scores, and unprompted human clinical interaction telemetry into PostgreSQL.
 */

import { describe, it, expect } from 'vitest';
import { humanFactorsSessionRecorderService } from '../src/core/services/humanFactorsSessionRecorder.service.js';
import { pool } from '../server/db/postgresPool.js';

const testTenantId = '00000000-0000-0000-0000-000000000001';

describe('🧑‍⚕️ SPRINT 3M.2: Observational Human Session Ledger & Telemetry', () => {
  it('should record an end-to-end human observational clinical trial into PostgreSQL', async () => {
    // 1. Start Live Session
    const session = await humanFactorsSessionRecorderService.startSession({
      tenantId: testTenantId,
      participantId: 'OBS-DOC-01',
      participantRole: 'EMERGENCY_PHYSICIAN',
      scenarioCode: 'SCENARIO_IGD_CHEST_PAIN_58YO',
      observerNotes: 'Observer: Dr. Clinical Auditor'
    });

    expect(session.sessionId).toBeDefined();
    expect(session.participantId).toBe('OBS-DOC-01');

    // 2. Complete Session with Real Human Interaction Metrics
    const firstAction = new Date(Date.now() + 1500); // 1.5s to first click
    const taskCompleted = new Date(Date.now() + 8500); // 8.5s total task time

    const result = await humanFactorsSessionRecorderService.completeSession({
      sessionId: session.sessionId,
      firstActionTime: firstAction,
      taskCompletedTime: taskCompleted,
      clicksCount: 4,
      keystrokesCount: 12,
      backtracksCount: 0,
      wrongPatientAttempts: 0,
      wrongMedicationAttempts: 1, // Attempted Metformin on renal impairment
      safetyWarningsTriggered: 1, // CDSS Hard-Stop fired
      safetyWarningsAcknowledged: 1, // Clinician saw CDSS and changed order
      overridesAttempted: 0,
      overrideReasons: '',
      helpRequestsCount: 0,
      taskOutcome: 'COMPLETED_WITH_INTERCEPTION',
      rawNasaTlxScores: {
        mentalDemand: 25,
        physicalDemand: 10,
        temporalDemand: 20,
        performance: 10,
        effort: 20,
        frustration: 10
      },
      susResponses: [5, 1, 5, 1, 5, 1, 5, 1, 5, 1],
      observerNotes: 'Participant was intercepted by CDSS and safely revised prescription.'
    });

    expect(result.taskOutcome).toBe('COMPLETED_WITH_INTERCEPTION');
    expect(result.evaluatedTlx.rawScore).toBeDefined();
    expect(result.evaluatedSus.susScore).toBe(100);

    // 3. Verify Database Row in PostgreSQL
    const dbRes = await pool.query('SELECT * FROM hfe_participant_sessions WHERE id = $1', [session.sessionId]);
    expect(dbRes.rows.length).toBe(1);
    const row = dbRes.rows[0];
    expect(row.participant_id).toBe('OBS-DOC-01');
    expect(row.task_outcome).toBe('COMPLETED_WITH_INTERCEPTION');
    expect(row.safety_warnings_triggered).toBe(1);
    expect(row.safety_warnings_acknowledged).toBe(1);
    expect(row.nasa_tlx_scores.rawScore).toBeLessThan(30);
  });
});
