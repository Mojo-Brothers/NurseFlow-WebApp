/**
 * NurseFlow Enterprise HIS 2026 — Master Clinical Monitoring, EWS & Deterioration Response Service
 * Domain Authority: Vital Signs Ledger, Multi-Model EWS Scoring (NEWS2 / PEWS / MEOWS), Single Extreme Score 3 Detection,
 * ISBAR Deterioration Escalation, Closed-Loop Physician Read-Back, Rapid Response / Code Blue Resuscitation Ledger,
 * Mandatory Post-Intervention Reassessment, and Transactional Outbox Release.
 * Standards: Royal College of Physicians (NEWS2 2017), JCI IPSG 2 / COP, AHA ACLS 2025, PostgreSQL 16 ACID.
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';

export class ClinicalMonitoringDomainError extends Error {
  constructor(message, code = 'MONITORING_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'ClinicalMonitoringDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const AUTHORIZED_OBSERVATION_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_NURSE',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_EMERGENCY',
  'ROLE_ICU_SPECIALIST'
];

const AUTHORIZED_RRT_LEADER_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_DOCTOR_EMERGENCY',
  'ROLE_DOCTOR_DPJP',
  'ROLE_ICU_SPECIALIST',
  'ROLE_ANESTHESIOLOGIST'
];

/**
 * Royal College of Physicians NEWS2 (2017) Canonical Calculator
 */
export function calculateNEWS2Score({
  respiratoryRate,
  spo2,
  spo2ScaleType = 'SCALE_1',
  supplementalOxygen = false,
  systolicBp,
  heartRate,
  consciousnessAvpu = 'ALERT',
  bodyTemperature
}) {
  let score = 0;
  let hasScore3 = false;
  const breakdown = {};

  // 1. Respiratory Rate
  let rrScore = 0;
  if (respiratoryRate <= 8) rrScore = 3;
  else if (respiratoryRate >= 9 && respiratoryRate <= 11) rrScore = 1;
  else if (respiratoryRate >= 12 && respiratoryRate <= 20) rrScore = 0;
  else if (respiratoryRate >= 21 && respiratoryRate <= 24) rrScore = 2;
  else if (respiratoryRate >= 25) rrScore = 3;
  breakdown.respiratoryRate = rrScore;
  score += rrScore;
  if (rrScore === 3) hasScore3 = true;

  // 2. SpO2 (Scale 1 or Scale 2)
  let spo2Score = 0;
  if (spo2ScaleType === 'SCALE_2') {
    // Hypercapnic respiratory failure (target 88-92%)
    if (spo2 <= 83) spo2Score = 3;
    else if (spo2 >= 84 && spo2 <= 85) spo2Score = 2;
    else if (spo2 >= 86 && spo2 <= 87) spo2Score = 1;
    else if (spo2 >= 88 && spo2 <= 92) spo2Score = 0;
    else if (spo2 >= 93 && spo2 <= 94) spo2Score = supplementalOxygen ? 1 : 0;
    else if (spo2 >= 95 && spo2 <= 96) spo2Score = supplementalOxygen ? 2 : 0;
    else if (spo2 >= 97) spo2Score = supplementalOxygen ? 3 : 0;
  } else {
    // Scale 1 Standard
    if (spo2 <= 91) spo2Score = 3;
    else if (spo2 >= 92 && spo2 <= 93) spo2Score = 2;
    else if (spo2 >= 94 && spo2 <= 95) spo2Score = 1;
    else if (spo2 >= 96) spo2Score = 0;
  }
  breakdown.spo2 = spo2Score;
  score += spo2Score;
  if (spo2Score === 3) hasScore3 = true;

  // 3. Air or Supplemental Oxygen
  const o2Score = supplementalOxygen ? 2 : 0;
  breakdown.supplementalOxygen = o2Score;
  score += o2Score;

  // 4. Systolic Blood Pressure
  let sbpScore = 0;
  if (systolicBp <= 90) sbpScore = 3;
  else if (systolicBp >= 91 && systolicBp <= 100) sbpScore = 2;
  else if (systolicBp >= 101 && systolicBp <= 110) sbpScore = 1;
  else if (systolicBp >= 111 && systolicBp <= 219) sbpScore = 0;
  else if (systolicBp >= 220) sbpScore = 3;
  breakdown.systolicBp = sbpScore;
  score += sbpScore;
  if (sbpScore === 3) hasScore3 = true;

  // 5. Pulse / Heart Rate
  let hrScore = 0;
  if (heartRate <= 40) hrScore = 3;
  else if (heartRate >= 41 && heartRate <= 50) hrScore = 1;
  else if (heartRate >= 51 && heartRate <= 90) hrScore = 0;
  else if (heartRate >= 91 && heartRate <= 110) hrScore = 1;
  else if (heartRate >= 111 && heartRate <= 130) hrScore = 2;
  else if (heartRate >= 131) hrScore = 3;
  breakdown.heartRate = hrScore;
  score += hrScore;
  if (hrScore === 3) hasScore3 = true;

  // 6. Consciousness (AVPU / New Confusion)
  const avpuNorm = (consciousnessAvpu || 'ALERT').toUpperCase();
  let avpuScore = (avpuNorm === 'ALERT' || avpuNorm === 'A') ? 0 : 3;
  breakdown.consciousness = avpuScore;
  score += avpuScore;
  if (avpuScore === 3) hasScore3 = true;

  // 7. Body Temperature
  let tempScore = 0;
  if (bodyTemperature <= 35.0) tempScore = 3;
  else if (bodyTemperature >= 35.1 && bodyTemperature <= 36.0) tempScore = 1;
  else if (bodyTemperature >= 36.1 && bodyTemperature <= 38.0) tempScore = 0;
  else if (bodyTemperature >= 38.1 && bodyTemperature <= 39.0) tempScore = 1;
  else if (bodyTemperature >= 39.1) tempScore = 2;
  breakdown.temperature = tempScore;
  score += tempScore;
  if (tempScore === 3) hasScore3 = true;

  // Risk Classification & Clinical Guidance
  let riskLevel = 'LOW';
  let monitoringFrequency = 'q12h';
  let recommendedAction = 'Lanjutkan pemantauan rutin per shift (setiap 12 jam).';
  let escalationRequired = false;

  if (score >= 7) {
    riskLevel = 'CRITICAL';
    monitoringFrequency = 'CONTINUOUS';
    recommendedAction = 'AKTIVASI TIM CODE BLUE / RAPID RESPONSE TEAM (RRT) SEGERA! Berikan oksigenasi darurat dan siapkan transfer ke ICU.';
    escalationRequired = true;
  } else if (score >= 5 || hasScore3) {
    riskLevel = 'MEDIUM';
    monitoringFrequency = 'q1h';
    recommendedAction = 'Eskalasi darurat ke Dokter Penanggung Jawab Pasien (DPJP) dan tingkatkan observasi tanda vital menjadi setiap jam.';
    escalationRequired = true;
  } else if (score >= 1 && score <= 4) {
    riskLevel = 'LOW_MEDIUM';
    monitoringFrequency = 'q4h-q6h';
    recommendedAction = 'Evaluasi ulang oleh perawat pelaksana, tingkatkan frekuensi pemantauan menjadi setiap 4-6 jam.';
    escalationRequired = false;
  }

  return {
    score,
    singleExtremeScore3: hasScore3,
    riskLevel,
    recommendedAction,
    recommendedMonitoringFrequency: monitoringFrequency,
    escalationRequired,
    breakdown
  };
}

export const clinicalMonitoringService = {
  /**
   * 1. Record Vital Sign Observation & Calculate EWS (NEWS2 / PEWS / MEOWS)
   */
  recordVitalSignObservation: async ({
    encounterId,
    patientId,
    heartRateBpm,
    systolicBpMmhg,
    diastolicBpMmhg,
    respiratoryRateBpm,
    spo2Percent,
    spo2ScaleType = 'SCALE_1',
    supplementalOxygen = false,
    oxygenFlowRateLpm = 0.0,
    bodyTemperatureCelsius,
    consciousnessAvpu = 'ALERT',
    gcsScore = 15,
    capillaryRefillSeconds = 2,
    clinicalNotes = null,
    scoringSystem = 'NEWS2'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!encounterId || !patientId) {
      throw new ClinicalMonitoringDomainError('Encounter ID dan Patient ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_OBSERVATION_ROLES.includes(authorRole)) {
      throw new ClinicalMonitoringDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin mencatat observasi klinis tanda vital.`,
        'FORBIDDEN_OBSERVATION_ROLE',
        403
      );
    }

    // Physiological Range Safeguards
    if (heartRateBpm < 10 || heartRateBpm > 350) {
      throw new ClinicalMonitoringDomainError(`Heart Rate (${heartRateBpm} bpm) di luar batas fisiologis yang masuk akal (10-350 bpm).`, 'INVALID_HEART_RATE', 400);
    }
    if (systolicBpMmhg < 20 || systolicBpMmhg > 350) {
      throw new ClinicalMonitoringDomainError(`Systolic BP (${systolicBpMmhg} mmHg) di luar batas fisiologis (20-350 mmHg).`, 'INVALID_SYSTOLIC_BP', 400);
    }
    if (respiratoryRateBpm < 2 || respiratoryRateBpm > 100) {
      throw new ClinicalMonitoringDomainError(`Respiratory Rate (${respiratoryRateBpm} bpm) di luar batas fisiologis (2-100 bpm).`, 'INVALID_RESPIRATORY_RATE', 400);
    }
    if (spo2Percent < 30.0 || spo2Percent > 100.0) {
      throw new ClinicalMonitoringDomainError(`SpO2 (${spo2Percent}%) di luar rentang valid (30.0 - 100.0%).`, 'INVALID_SPO2', 400);
    }
    if (bodyTemperatureCelsius < 25.0 || bodyTemperatureCelsius > 46.0) {
      throw new ClinicalMonitoringDomainError(`Suhu Tubuh (${bodyTemperatureCelsius} °C) di luar rentang valid (25.0 - 46.0 °C).`, 'INVALID_TEMPERATURE', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      // 1. Verify Encounter Exists & Is Active
      const encRes = await client.query('SELECT * FROM encounters WHERE id = $1 FOR UPDATE;', [encounterId]);
      if (encRes.rows.length === 0) {
        throw new ClinicalMonitoringDomainError(`Encounter ${encounterId} tidak ditemukan.`, 'ENCOUNTER_NOT_FOUND', 404);
      }
      const encounter = encRes.rows[0];

      if (['CLOSED', 'DISCHARGED', 'CANCELLED'].includes(encounter.status)) {
        throw new ClinicalMonitoringDomainError(
          `Ditolak: Tidak dapat mencatat observasi klinis pada encounter yang telah ditutup/selesai (${encounter.status}).`,
          'ENCOUNTER_ALREADY_TERMINATED',
          400
        );
      }

      // 2. Compute NEWS2 Score
      const news2Result = calculateNEWS2Score({
        respiratoryRate: respiratoryRateBpm,
        spo2: spo2Percent,
        spo2ScaleType,
        supplementalOxygen,
        systolicBp: systolicBpMmhg,
        heartRate: heartRateBpm,
        consciousnessAvpu,
        bodyTemperature: bodyTemperatureCelsius
      });

      const obsId = crypto.randomUUID();
      const serverTimestamp = new Date();
      const observerName = actor.fullName || actor.username || 'Perawat Ruangan, S.Kep';
      const observerId = actor.userId || 'USR-NURSE-01';

      // Digital Signature (SHA-256)
      const sigPayload = `${obsId}:${encounterId}:${observerId}:${news2Result.score}:${news2Result.riskLevel}:${serverTimestamp.toISOString()}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO clinical_vital_sign_observations (
          id, encounter_id, patient_id, observed_at,
          observed_by_id, observed_by_name, observed_by_role,
          heart_rate_bpm, systolic_bp_mmhg, diastolic_bp_mmhg,
          respiratory_rate_bpm, spo2_percent, spo2_scale_type,
          supplemental_oxygen, oxygen_flow_rate_lpm, body_temperature_celsius,
          consciousness_avpu, gcs_score, capillary_refill_seconds,
          clinical_notes, scoring_system, calculated_score,
          single_extreme_score_3, risk_level, recommended_action,
          recommended_monitoring_frequency, escalation_required,
          escalation_status, digital_signature_hash, correlation_id, version,
          created_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $10,
          $11, $12, $13,
          $14, $15, $16,
          $17, $18, $19,
          $20, $21, $22,
          $23, $24, $25,
          $26, $27,
          $28, $29, $30, $31,
          $32
        ) RETURNING *;
      `;

      const obsRes = await client.query(insertSql, [
        obsId,
        encounterId,
        patientId,
        serverTimestamp,
        observerId,
        observerName,
        authorRole,
        heartRateBpm,
        systolicBpMmhg,
        diastolicBpMmhg,
        respiratoryRateBpm,
        spo2Percent,
        spo2ScaleType,
        supplementalOxygen,
        oxygenFlowRateLpm,
        bodyTemperatureCelsius,
        consciousnessAvpu,
        gcsScore,
        capillaryRefillSeconds,
        clinicalNotes,
        scoringSystem,
        news2Result.score,
        news2Result.singleExtremeScore3,
        news2Result.riskLevel,
        news2Result.recommendedAction,
        news2Result.recommendedMonitoringFrequency,
        news2Result.escalationRequired,
        'NOT_ESCALATED',
        digitalSignatureHash,
        correlationId,
        1,
        serverTimestamp
      ]);

      // Universal Audit Log
      await client.query(`
        INSERT INTO universal_audit_logs (
          id, actor_id, actor_name, actor_role, client_ip,
          action_type, resource_type, resource_id, patient_id,
          before_state, after_state, reason_for_action, signature_hash, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
      `, [
        crypto.randomUUID(),
        observerId,
        observerName,
        authorRole,
        clientIp,
        'CREATE',
        'VITAL_SIGNS_OBSERVATION',
        obsId,
        patientId,
        null,
        JSON.stringify(obsRes.rows[0]),
        `Pencatatan Tanda Vital & EWS NEWS2 = ${news2Result.score} (${news2Result.riskLevel})`,
        digitalSignatureHash,
        serverTimestamp
      ]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'CLINICAL_MONITORING',
        obsId,
        'VITAL_SIGNS_OBSERVED',
        JSON.stringify({
          observationId: obsId,
          encounterId,
          patientId,
          ewsScore: news2Result.score,
          riskLevel: news2Result.riskLevel,
          singleExtremeScore3: news2Result.singleExtremeScore3,
          escalationRequired: news2Result.escalationRequired,
          recommendedAction: news2Result.recommendedAction,
          observedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return {
        ...obsRes.rows[0],
        breakdown: news2Result.breakdown
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof ClinicalMonitoringDomainError) throw err;
      throw new ClinicalMonitoringDomainError(`Gagal mencatat tanda vital: ${err.message}`, 'VITAL_SIGNS_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 2. Escalate Clinical Deterioration (ISBAR Structured Communication)
   */
  escalateDeterioration: async ({
    observationId,
    escalationLevel = 'ATTENDING_PHYSICIAN_DPJP',
    isbarPayload = {},
    notifiedToId = 'DOC-DPJP-01',
    notifiedToName = 'dr. Siti Rahma, Sp.PD',
    notifiedToRole = 'ROLE_DOCTOR_DPJP',
    notificationMethod = 'HOSPITAL_PAGE'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!observationId) {
      throw new ClinicalMonitoringDomainError('Observation ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const obsRes = await client.query('SELECT * FROM clinical_vital_sign_observations WHERE id = $1 FOR UPDATE;', [observationId]);
      if (obsRes.rows.length === 0) {
        throw new ClinicalMonitoringDomainError(`Data observasi ${observationId} tidak ditemukan.`, 'OBSERVATION_NOT_FOUND', 404);
      }
      const obs = obsRes.rows[0];

      // Target response window according to severity
      let targetResponseWindowMinutes = 30; // Medium
      if (escalationLevel === 'CODE_BLUE_CARDIAC_ARREST') targetResponseWindowMinutes = 0;
      else if (escalationLevel === 'RAPID_RESPONSE_TEAM') targetResponseWindowMinutes = 15;
      else if (escalationLevel === 'ATTENDING_PHYSICIAN_DPJP') targetResponseWindowMinutes = 30;

      const escalationId = crypto.randomUUID();
      const serverTimestamp = new Date();
      const escalatedByName = actor.fullName || actor.username || 'Perawat Penanggung Jawab, S.Kep';
      const escalatedById = actor.userId || 'USR-NURSE-01';

      const insertEscalationSql = `
        INSERT INTO clinical_deterioration_escalations (
          id, observation_id, encounter_id, patient_id,
          escalation_level, isbar_payload, notified_to_id,
          notified_to_name, notified_to_role, notification_method,
          escalated_by_id, escalated_by_name, escalated_at,
          target_response_window_minutes, status, correlation_id, created_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $10,
          $11, $12, $13,
          $14, $15, $16, $17
        ) RETURNING *;
      `;

      const escRes = await client.query(insertEscalationSql, [
        escalationId,
        observationId,
        obs.encounter_id,
        obs.patient_id,
        escalationLevel,
        JSON.stringify(isbarPayload),
        notifiedToId,
        notifiedToName,
        notifiedToRole,
        notificationMethod,
        escalatedById,
        escalatedByName,
        serverTimestamp,
        targetResponseWindowMinutes,
        'PENDING_ACKNOWLEDGMENT',
        correlationId,
        serverTimestamp
      ]);

      // Update observation escalation status
      await client.query(`
        UPDATE clinical_vital_sign_observations
        SET escalation_status = 'ESCALATED',
            version = version + 1
        WHERE id = $1;
      `, [observationId]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'CLINICAL_ESCALATION',
        escalationId,
        'DETERIORATION_ESCALATED',
        JSON.stringify({
          escalationId,
          observationId,
          encounterId: obs.encounter_id,
          patientId: obs.patient_id,
          escalationLevel,
          notifiedTo: notifiedToName,
          notificationMethod,
          targetResponseWindowMinutes,
          escalatedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return escRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof ClinicalMonitoringDomainError) throw err;
      throw new ClinicalMonitoringDomainError(`Gagal melakukan eskalasi perburukan klinis: ${err.message}`, 'ESCALATION_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 3. Closed-Loop Physician / RRT Acknowledgment & Read-Back
   */
  acknowledgeEscalation: async ({
    escalationId,
    physicianInstruction,
    readBackConfirmed = true
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!escalationId || !physicianInstruction || physicianInstruction.trim().length < 5) {
      throw new ClinicalMonitoringDomainError('Escalation ID dan Instruksi Dokter (minimal 5 karakter) wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    if (!readBackConfirmed) {
      throw new ClinicalMonitoringDomainError(
        'JCI IPSG 2 MANDATORY: Konfirmasi read-back instruksi lisan/telepon (TBAK: Tulis, Baca, Konfirmasi) wajib bernilai TRUE!',
        'READ_BACK_CONFIRMATION_REQUIRED',
        400
      );
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const escRes = await client.query('SELECT * FROM clinical_deterioration_escalations WHERE id = $1 FOR UPDATE;', [escalationId]);
      if (escRes.rows.length === 0) {
        throw new ClinicalMonitoringDomainError(`Data eskalasi ${escalationId} tidak ditemukan.`, 'ESCALATION_NOT_FOUND', 404);
      }
      const esc = escRes.rows[0];

      if (esc.status === 'ACKNOWLEDGED') {
        throw new ClinicalMonitoringDomainError('Eskalasi ini sudah dikonfirmasi sebelumnya.', 'ALREADY_ACKNOWLEDGED', 400);
      }

      const serverTimestamp = new Date();
      const ackByName = actor.fullName || actor.username || 'dr. Siti Rahma, Sp.PD';
      const ackById = actor.userId || 'DOC-DPJP-01';

      const updateSql = `
        UPDATE clinical_deterioration_escalations
        SET acknowledged_at = $1,
            acknowledged_by_id = $2,
            acknowledged_by_name = $3,
            read_back_confirmed = $4,
            physician_instruction = $5,
            status = 'ACKNOWLEDGED'
        WHERE id = $6
        RETURNING *;
      `;

      const updatedRes = await client.query(updateSql, [
        serverTimestamp,
        ackById,
        ackByName,
        true,
        physicianInstruction.trim(),
        escalationId
      ]);

      // Update observation
      await client.query(`
        UPDATE clinical_vital_sign_observations
        SET escalation_status = 'ACKNOWLEDGED'
        WHERE id = $1;
      `, [esc.observation_id]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'CLINICAL_ESCALATION',
        escalationId,
        'ESCALATION_ACKNOWLEDGED',
        JSON.stringify({
          escalationId,
          acknowledgedBy: ackByName,
          instruction: physicianInstruction.trim(),
          readBackConfirmed: true,
          acknowledgedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return updatedRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof ClinicalMonitoringDomainError) throw err;
      throw new ClinicalMonitoringDomainError(`Gagal mengonfirmasi eskalasi: ${err.message}`, 'ACK_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 4. Rapid Response Team (RRT) / Code Blue Resuscitation Event Ledger
   */
  activateRapidResponseOrCodeBlue: async ({
    escalationId = null,
    encounterId,
    patientId,
    eventType = 'RAPID_RESPONSE',
    locationWardRoom = 'Ruang Rawat Inap Melati Bed 3',
    teamLeaderId = 'DOC-ICU-LEAD-01',
    teamLeaderName = 'dr. Budi Setiawan, Sp.An-KIC',
    teamLeaderRole = 'ROLE_ICU_SPECIALIST',
    teamMembers = [],
    arrivalTimestamp = new Date().toISOString(),
    initialRhythm = 'SEVERE_BRADYCARDIA',
    interventionsPerformed = [],
    outcome = 'STABILIZED_IN_WARD',
    eventSummary = 'Resusitasi darurat RRT berhasil menstabilkan hemodinamik pasien.'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!encounterId || !patientId) {
      throw new ClinicalMonitoringDomainError('Encounter ID dan Patient ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const authorRole = actor.role || teamLeaderRole || 'ROLE_DOCTOR_EMERGENCY';
    if (!AUTHORIZED_RRT_LEADER_ROLES.includes(authorRole)) {
      throw new ClinicalMonitoringDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki wewenang memimpin Tim Resusitasi / Rapid Response.`,
        'FORBIDDEN_RRT_ROLE',
        403
      );
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const eventId = crypto.randomUUID();
      const chargeId = crypto.randomUUID();
      const serverTimestamp = new Date();

      // Digital Signature (SHA-256)
      const sigPayload = `${eventId}:${encounterId}:${teamLeaderId}:${eventType}:${outcome}:${serverTimestamp.toISOString()}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertEventSql = `
        INSERT INTO rapid_response_code_blue_events (
          id, escalation_id, encounter_id, patient_id,
          event_type, location_ward_room, team_leader_id,
          team_leader_name, team_leader_role, team_members,
          arrival_timestamp, initial_rhythm, interventions_performed,
          outcome, event_summary, charge_id, charge_captured,
          digital_signature_hash, correlation_id, completed_at, created_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $10,
          $11, $12, $13,
          $14, $15, $16, $17,
          $18, $19, $20, $21
        ) RETURNING *;
      `;

      const eventRes = await client.query(insertEventSql, [
        eventId,
        escalationId,
        encounterId,
        patientId,
        eventType,
        locationWardRoom,
        teamLeaderId,
        teamLeaderName,
        teamLeaderRole,
        JSON.stringify(teamMembers),
        new Date(arrivalTimestamp),
        initialRhythm,
        JSON.stringify(interventionsPerformed),
        outcome,
        eventSummary,
        chargeId,
        true,
        digitalSignatureHash,
        correlationId,
        serverTimestamp,
        serverTimestamp
      ]);

      // If escalationId provided, update escalation status
      if (escalationId) {
        await client.query(`
          UPDATE clinical_deterioration_escalations
          SET status = 'COMPLETED'
          WHERE id = $1;
        `, [escalationId]);
      }

      // Outbox Event 1: Emergency Event Logged
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'RAPID_RESPONSE_EVENT',
        eventId,
        'RAPID_RESPONSE_COMPLETED',
        JSON.stringify({
          eventId,
          encounterId,
          patientId,
          eventType,
          outcome,
          teamLeader: teamLeaderName,
          completedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      // Outbox Event 2: Charge Capture Exactly-Once
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'BILLING_CHARGE',
        chargeId,
        'CHARGE_CAPTURE_RECORDED',
        JSON.stringify({
          chargeId,
          sourceType: 'RAPID_RESPONSE_EVENT',
          sourceId: eventId,
          encounterId,
          patientId,
          amount: eventType === 'CODE_BLUE_ARREST' ? 500000.00 : 250000.00,
          capturedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return eventRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof ClinicalMonitoringDomainError) throw err;
      throw new ClinicalMonitoringDomainError(`Gagal mencatat kejadian resusitasi RRT/Code Blue: ${err.message}`, 'RRT_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 5. Mandatory Closed-Loop Reassessment (Post-Intervention EWS Evaluation)
   */
  recordClosedLoopReassessment: async ({
    initialObservationId,
    eventId = null,
    postHeartRateBpm,
    postSystolicBpMmhg,
    postDiastolicBpMmhg,
    postRespiratoryRateBpm,
    postSpo2Percent,
    postSupplementalOxygen = false,
    postBodyTemperatureCelsius,
    postConsciousnessAvpu = 'ALERT',
    reassessmentNotes = 'Evaluasi ulang pasca intervensi medis menunjukkan perbaikan hemodinamik.'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!initialObservationId) {
      throw new ClinicalMonitoringDomainError('Initial Observation ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const initObsRes = await client.query('SELECT * FROM clinical_vital_sign_observations WHERE id = $1 FOR UPDATE;', [initialObservationId]);
      if (initObsRes.rows.length === 0) {
        throw new ClinicalMonitoringDomainError(`Data observasi awal ${initialObservationId} tidak ditemukan.`, 'OBSERVATION_NOT_FOUND', 404);
      }
      const initObs = initObsRes.rows[0];

      // Calculate Post-Intervention Score
      const postNews2 = calculateNEWS2Score({
        respiratoryRate: postRespiratoryRateBpm,
        spo2: postSpo2Percent,
        spo2ScaleType: initObs.spo2_scale_type || 'SCALE_1',
        supplementalOxygen: postSupplementalOxygen,
        systolicBp: postSystolicBpMmhg,
        heartRate: postHeartRateBpm,
        consciousnessAvpu: postConsciousnessAvpu,
        bodyTemperature: postBodyTemperatureCelsius
      });

      const preScore = Number(initObs.calculated_score);
      const postScore = Number(postNews2.score);
      const scoreDelta = postScore - preScore;

      let recoveryTrajectory = 'STABLE';
      if (scoreDelta < 0) recoveryTrajectory = 'IMPROVING'; // Lower score is better
      else if (scoreDelta > 0) recoveryTrajectory = 'DETERIORATING';

      const reassessId = crypto.randomUUID();
      const serverTimestamp = new Date();
      const reassessByName = actor.fullName || actor.username || 'Perawat Evaluator, S.Kep';
      const reassessById = actor.userId || 'USR-NURSE-01';

      const insertReassessSql = `
        INSERT INTO clinical_reassessments (
          id, initial_observation_id, event_id, encounter_id,
          patient_id, reassessed_at, reassessed_by_id, reassessed_by_name,
          pre_score, post_score, score_delta, recovery_trajectory,
          reassessment_notes, correlation_id, created_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15
        ) RETURNING *;
      `;

      const reassessRes = await client.query(insertReassessSql, [
        reassessId,
        initialObservationId,
        eventId,
        initObs.encounter_id,
        initObs.patient_id,
        serverTimestamp,
        reassessById,
        reassessByName,
        preScore,
        postScore,
        scoreDelta,
        recoveryTrajectory,
        reassessmentNotes,
        correlationId,
        serverTimestamp
      ]);

      // Update initial observation escalation status to RESOLVED
      await client.query(`
        UPDATE clinical_vital_sign_observations
        SET escalation_status = 'RESOLVED'
        WHERE id = $1;
      `, [initialObservationId]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'CLINICAL_REASSESSMENT',
        reassessId,
        'REASSESSMENT_RECORDED',
        JSON.stringify({
          reassessmentId: reassessId,
          initialObservationId,
          preScore,
          postScore,
          scoreDelta,
          recoveryTrajectory,
          reassessedBy: reassessByName,
          reassessedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return reassessRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof ClinicalMonitoringDomainError) throw err;
      throw new ClinicalMonitoringDomainError(`Gagal mencatat evaluasi ulang pasca intervensi: ${err.message}`, 'REASSESSMENT_FAILED', 500);
    } finally {
      client.release();
    }
  }
};
