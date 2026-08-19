/**
 * NurseFlow Enterprise HIS 2026 — Human Factors Observational Session Recorder
 * Records discrete human observational trials into PostgreSQL table `hfe_participant_sessions`
 * Standards: ISO 9241-11 Usability, NASA-TLX, System Usability Scale (SUS)
 */

import { postgresPoolService, pool } from '../../../server/db/postgresPool.js';
import { humanFactorsService } from './humanFactorsErgonomics.service.js';
import crypto from 'crypto';

export class HumanFactorsSessionRecorderService {
  /**
   * Start a Live Human Clinical Observation Session
   */
  async startSession({
    tenantId = '00000000-0000-0000-0000-000000000001',
    participantId,
    participantRole,
    scenarioCode,
    observerNotes = ''
  }) {
    const sessionId = crypto.randomUUID();
    const startTime = new Date();

    const client = await postgresPoolService.getClient();
    try {
      await client.query(`
        INSERT INTO hfe_participant_sessions (
          id, tenant_id, participant_id, participant_role, scenario_code,
          task_start_time, task_outcome, observer_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED_AUTONOMOUSLY', $7);
      `, [sessionId, tenantId, participantId, participantRole, scenarioCode, startTime, observerNotes]);

      return {
        sessionId,
        participantId,
        participantRole,
        scenarioCode,
        taskStartTime: startTime.toISOString()
      };
    } finally {
      client.release();
    }
  }

  /**
   * Complete an Observational Session with Human Metrics, NASA-TLX & SUS
   */
  async completeSession({
    sessionId,
    firstActionTime,
    taskCompletedTime = new Date(),
    clicksCount = 0,
    keystrokesCount = 0,
    backtracksCount = 0,
    wrongPatientAttempts = 0,
    wrongMedicationAttempts = 0,
    safetyWarningsTriggered = 0,
    safetyWarningsAcknowledged = 0,
    overridesAttempted = 0,
    overrideReasons = '',
    helpRequestsCount = 0,
    taskOutcome = 'COMPLETED_AUTONOMOUSLY',
    rawNasaTlxScores = {},
    susResponses = [],
    observerNotes = ''
  }) {
    const client = await postgresPoolService.getClient();
    try {
      // Calculate Standardized Scores
      let evaluatedTlx = {};
      if (rawNasaTlxScores && Object.keys(rawNasaTlxScores).length === 6) {
        evaluatedTlx = humanFactorsService.calculateNasaTlx(rawNasaTlxScores);
      }

      let evaluatedSus = {};
      if (Array.isArray(susResponses) && susResponses.length === 10) {
        evaluatedSus = humanFactorsService.calculateSusScore(susResponses);
      }

      // Fetch session start time to calculate total duration
      const res = await client.query('SELECT task_start_time FROM hfe_participant_sessions WHERE id = $1', [sessionId]);
      if (res.rows.length === 0) {
        throw new Error(`Session ID not found: ${sessionId}`);
      }

      const startTime = new Date(res.rows[0].task_start_time);
      const endTime = new Date(taskCompletedTime);
      const totalDurationSec = parseFloat(((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2));

      await client.query(`
        UPDATE hfe_participant_sessions
        SET first_action_time = $1,
            task_completed_time = $2,
            total_duration_sec = $3,
            clicks_count = $4,
            keystrokes_count = $5,
            backtracks_count = $6,
            wrong_patient_attempts = $7,
            wrong_medication_attempts = $8,
            safety_warnings_triggered = $9,
            safety_warnings_acknowledged = $10,
            overrides_attempted = $11,
            override_reasons = $12,
            help_requests_count = $13,
            task_outcome = $14,
            nasa_tlx_scores = $15,
            sus_responses = $16,
            observer_notes = COALESCE(observer_notes, '') || ' | ' || $17
        WHERE id = $18;
      `, [
        firstActionTime || startTime,
        endTime,
        totalDurationSec,
        clicksCount,
        keystrokesCount,
        backtracksCount,
        wrongPatientAttempts,
        wrongMedicationAttempts,
        safetyWarningsTriggered,
        safetyWarningsAcknowledged,
        overridesAttempted,
        overrideReasons,
        helpRequestsCount,
        taskOutcome,
        JSON.stringify(evaluatedTlx),
        JSON.stringify(evaluatedSus),
        observerNotes,
        sessionId
      ]);

      return {
        sessionId,
        totalDurationSec,
        taskOutcome,
        evaluatedTlx,
        evaluatedSus
      };
    } finally {
      client.release();
    }
  }

  /**
   * Query All Recorded HFE Participant Sessions
   */
  async getAllSessions(tenantId = '00000000-0000-0000-0000-000000000001') {
    const res = await pool.query(`
      SELECT * FROM hfe_participant_sessions
      WHERE tenant_id = $1
      ORDER BY task_start_time DESC;
    `, [tenantId]);
    return res.rows;
  }
}

export const humanFactorsSessionRecorderService = new HumanFactorsSessionRecorderService();
