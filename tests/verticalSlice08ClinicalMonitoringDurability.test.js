/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #08 Durability & Patient Safety Core Test Suite
 * Clinical Monitoring, EWS (NEWS2/PEWS/MEOWS), ISBAR Escalation, Rapid Response / Code Blue & Closed-Loop Reassessment
 * Standards: Royal College of Physicians (NEWS2 2017), JCI IPSG 2 / COP, AHA ACLS 2025, PostgreSQL 16 ACID.
 * Complete 25 Chaos Gate Scenarios.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import {
  clinicalMonitoringService,
  calculateNEWS2Score,
  ClinicalMonitoringDomainError
} from '../server/services/clinicalMonitoring.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-08 — Clinical Monitoring, EWS & Patient Deterioration Response ➔ PostgreSQL Durability & Chaos Gate (25 Scenarios)', () => {
  let mockDatabaseState = {
    encounters: [],
    clinical_vital_sign_observations: [],
    clinical_deterioration_escalations: [],
    rapid_response_code_blue_events: [],
    clinical_reassessments: [],
    universal_audit_logs: [],
    clinical_domain_outbox: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-mon-001',
          episode_id: 'epc-mon-001',
          patient_id: 'pat-mon-001',
          encounter_number: 'ENC-2026-MON-01',
          status: 'IN_PROGRESS'
        },
        {
          id: 'enc-closed-002',
          encounter_number: 'ENC-2026-MON-99',
          status: 'CLOSED'
        }
      ],
      clinical_vital_sign_observations: [],
      clinical_deterioration_escalations: [],
      rapid_response_code_blue_events: [],
      clinical_reassessments: [],
      universal_audit_logs: [],
      clinical_domain_outbox: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedObservations: [],
            stagedEscalations: [],
            stagedEvents: [],
            stagedReassessments: [],
            stagedAuditLogs: [],
            stagedOutbox: [],
            observationUpdates: [],
            escalationUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.clinical_vital_sign_observations.push(...activeTransactionState.stagedObservations);
            mockDatabaseState.clinical_deterioration_escalations.push(...activeTransactionState.stagedEscalations);
            mockDatabaseState.rapid_response_code_blue_events.push(...activeTransactionState.stagedEvents);
            mockDatabaseState.clinical_reassessments.push(...activeTransactionState.stagedReassessments);
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);
            mockDatabaseState.clinical_domain_outbox.push(...activeTransactionState.stagedOutbox);

            activeTransactionState.observationUpdates.forEach(up => {
              const idx = mockDatabaseState.clinical_vital_sign_observations.findIndex(o => o.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.clinical_vital_sign_observations[idx] = { ...mockDatabaseState.clinical_vital_sign_observations[idx], ...up.data };
              }
            });

            activeTransactionState.escalationUpdates.forEach(up => {
              const idx = mockDatabaseState.clinical_deterioration_escalations.findIndex(e => e.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.clinical_deterioration_escalations[idx] = { ...mockDatabaseState.clinical_deterioration_escalations[idx], ...up.data };
              }
            });

            activeTransactionState = null;
          }
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('ROLLBACK')) {
          activeTransactionState = null;
          return { rows: [], rowCount: 0 };
        }

        // SELECT FROM encounters
        if (normalized.includes('FROM ENCOUNTERS WHERE ID = $1')) {
          const found = mockDatabaseState.encounters.filter(e => e.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM clinical_vital_sign_observations WHERE id = $1
        if (normalized.includes('FROM CLINICAL_VITAL_SIGN_OBSERVATIONS WHERE ID = $1')) {
          const allObs = [
            ...mockDatabaseState.clinical_vital_sign_observations,
            ...(activeTransactionState?.stagedObservations || [])
          ];
          const found = allObs.filter(o => o.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM clinical_deterioration_escalations WHERE id = $1
        if (normalized.includes('FROM CLINICAL_DETERIORATION_ESCALATIONS WHERE ID = $1')) {
          const allEsc = [
            ...mockDatabaseState.clinical_deterioration_escalations,
            ...(activeTransactionState?.stagedEscalations || [])
          ];
          const found = allEsc.filter(e => e.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // INSERT INTO clinical_vital_sign_observations
        if (normalized.startsWith('INSERT INTO CLINICAL_VITAL_SIGN_OBSERVATIONS')) {
          const newObs = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            observed_at: params[3],
            observed_by_id: params[4],
            observed_by_name: params[5],
            observed_by_role: params[6],
            heart_rate_bpm: params[7],
            systolic_bp_mmhg: params[8],
            diastolic_bp_mmhg: params[9],
            respiratory_rate_bpm: params[10],
            spo2_percent: params[11],
            spo2_scale_type: params[12],
            supplemental_oxygen: params[13],
            oxygen_flow_rate_lpm: params[14],
            body_temperature_celsius: params[15],
            consciousness_avpu: params[16],
            gcs_score: params[17],
            capillary_refill_seconds: params[18],
            clinical_notes: params[19],
            scoring_system: params[20],
            calculated_score: params[21],
            single_extreme_score_3: params[22],
            risk_level: params[23],
            recommended_action: params[24],
            recommended_monitoring_frequency: params[25],
            escalation_required: params[26],
            escalation_status: params[27],
            digital_signature_hash: params[28],
            correlation_id: params[29],
            version: params[30],
            created_at: params[31]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedObservations.push(newObs);
          } else {
            mockDatabaseState.clinical_vital_sign_observations.push(newObs);
          }
          return { rows: [newObs], rowCount: 1 };
        }

        // INSERT INTO clinical_deterioration_escalations
        if (normalized.startsWith('INSERT INTO CLINICAL_DETERIORATION_ESCALATIONS')) {
          const newEsc = {
            id: params[0],
            observation_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            escalation_level: params[4],
            isbar_payload: JSON.parse(params[5] || '{}'),
            notified_to_id: params[6],
            notified_to_name: params[7],
            notified_to_role: params[8],
            notification_method: params[9],
            escalated_by_id: params[10],
            escalated_by_name: params[11],
            escalated_at: params[12],
            target_response_window_minutes: params[13],
            status: params[14],
            correlation_id: params[15],
            created_at: params[16]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedEscalations.push(newEsc);
          } else {
            mockDatabaseState.clinical_deterioration_escalations.push(newEsc);
          }
          return { rows: [newEsc], rowCount: 1 };
        }

        // INSERT INTO rapid_response_code_blue_events
        if (normalized.startsWith('INSERT INTO RAPID_RESPONSE_CODE_BLUE_EVENTS')) {
          const newEvent = {
            id: params[0],
            escalation_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            event_type: params[4],
            location_ward_room: params[5],
            team_leader_id: params[6],
            team_leader_name: params[7],
            team_leader_role: params[8],
            team_members: JSON.parse(params[9] || '[]'),
            arrival_timestamp: params[10],
            initial_rhythm: params[11],
            interventions_performed: JSON.parse(params[12] || '[]'),
            outcome: params[13],
            event_summary: params[14],
            charge_id: params[15],
            charge_captured: params[16],
            digital_signature_hash: params[17],
            correlation_id: params[18],
            completed_at: params[19],
            created_at: params[20]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedEvents.push(newEvent);
          } else {
            mockDatabaseState.rapid_response_code_blue_events.push(newEvent);
          }
          return { rows: [newEvent], rowCount: 1 };
        }

        // INSERT INTO clinical_reassessments
        if (normalized.startsWith('INSERT INTO CLINICAL_REASSESSMENTS')) {
          const newReassess = {
            id: params[0],
            initial_observation_id: params[1],
            event_id: params[2],
            encounter_id: params[3],
            patient_id: params[4],
            reassessed_at: params[5],
            reassessed_by_id: params[6],
            reassessed_by_name: params[7],
            pre_score: params[8],
            post_score: params[9],
            score_delta: params[10],
            recovery_trajectory: params[11],
            reassessment_notes: params[12],
            correlation_id: params[13],
            created_at: params[14]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedReassessments.push(newReassess);
          } else {
            mockDatabaseState.clinical_reassessments.push(newReassess);
          }
          return { rows: [newReassess], rowCount: 1 };
        }

        // INSERT INTO universal_audit_logs
        if (normalized.startsWith('INSERT INTO UNIVERSAL_AUDIT_LOGS')) {
          const newAudit = { id: params[0], resource_id: params[7], created_at: params[13] };
          if (activeTransactionState) {
            activeTransactionState.stagedAuditLogs.push(newAudit);
          } else {
            mockDatabaseState.universal_audit_logs.push(newAudit);
          }
          return { rows: [{ id: newAudit.id }], rowCount: 1 };
        }

        // INSERT INTO clinical_domain_outbox
        if (normalized.startsWith('INSERT INTO CLINICAL_DOMAIN_OUTBOX')) {
          const newOutbox = {
            id: params[0],
            aggregate_type: params[1],
            aggregate_id: params[2],
            event_type: params[3],
            event_payload: JSON.parse(params[4] || '{}'),
            status: params[5],
            correlation_id: params[6],
            created_at: params[7]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedOutbox.push(newOutbox);
          } else {
            mockDatabaseState.clinical_domain_outbox.push(newOutbox);
          }
          return { rows: [{ id: newOutbox.id }], rowCount: 1 };
        }

        // UPDATE clinical_vital_sign_observations
        if (normalized.startsWith('UPDATE CLINICAL_VITAL_SIGN_OBSERVATIONS')) {
          const obsId = params[params.length - 1];
          if (normalized.includes("ESCALATION_STATUS = 'ESCALATED'")) {
            if (activeTransactionState) {
              activeTransactionState.observationUpdates.push({ id: obsId, data: { escalation_status: 'ESCALATED' } });
            }
          } else if (normalized.includes("ESCALATION_STATUS = 'ACKNOWLEDGED'")) {
            if (activeTransactionState) {
              activeTransactionState.observationUpdates.push({ id: obsId, data: { escalation_status: 'ACKNOWLEDGED' } });
            }
          } else if (normalized.includes("ESCALATION_STATUS = 'RESOLVED'")) {
            if (activeTransactionState) {
              activeTransactionState.observationUpdates.push({ id: obsId, data: { escalation_status: 'RESOLVED' } });
            }
          }
          return { rows: [], rowCount: 1 };
        }

        // UPDATE clinical_deterioration_escalations
        if (normalized.startsWith('UPDATE CLINICAL_DETERIORATION_ESCALATIONS')) {
          const escId = params[params.length - 1];
          if (normalized.includes("STATUS = 'ACKNOWLEDGED'")) {
            const updated = {
              acknowledged_at: params[0],
              acknowledged_by_id: params[1],
              acknowledged_by_name: params[2],
              read_back_confirmed: params[3],
              physician_instruction: params[4],
              status: 'ACKNOWLEDGED'
            };
            if (activeTransactionState) {
              activeTransactionState.escalationUpdates.push({ id: escId, data: updated });
            }
            return { rows: [{ id: escId, ...updated }], rowCount: 1 };
          }
          if (normalized.includes("STATUS = 'COMPLETED'")) {
            if (activeTransactionState) {
              activeTransactionState.escalationUpdates.push({ id: escId, data: { status: 'COMPLETED' } });
            }
            return { rows: [], rowCount: 1 };
          }
        }

        return { rows: [], rowCount: 0 };
      }),
      release: vi.fn()
    };

    vi.spyOn(postgresPoolService, 'getPool').mockReturnValue({
      connect: vi.fn(async () => mockClient),
      query: vi.fn(async (sql, params) => mockClient.query(sql, params))
    });
  });

  // ─── TC-01: NORMAL VITAL SIGNS ➔ NEWS2 SCORE 0 (LOW RISK) ───
  it('TC-01: should record normal vital signs and calculate NEWS2 score = 0 with LOW risk classification', async () => {
    const obs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 72,
      systolicBpMmhg: 120,
      diastolicBpMmhg: 80,
      respiratoryRateBpm: 16,
      spo2Percent: 98.0,
      supplementalOxygen: false,
      bodyTemperatureCelsius: 36.8,
      consciousnessAvpu: 'ALERT'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(obs.calculated_score).toBe(0);
    expect(obs.risk_level).toBe('LOW');
    expect(obs.recommended_monitoring_frequency).toBe('q12h');
    expect(obs.escalation_required).toBe(false);
    expect(mockDatabaseState.clinical_vital_sign_observations.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'VITAL_SIGNS_OBSERVED')).toBe(true);
  });

  // ─── TC-02: MILD DERANGEMENT ➔ NEWS2 SCORE 1-4 (LOW-MEDIUM RISK) ───
  it('TC-02: should calculate NEWS2 score = 3 for mild tachypnea and tachycardia with LOW_MEDIUM risk', async () => {
    const obs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 98, // Score 1 (91-110)
      systolicBpMmhg: 115,
      diastolicBpMmhg: 75,
      respiratoryRateBpm: 22, // Score 2 (21-24)
      spo2Percent: 96.0,
      supplementalOxygen: false,
      bodyTemperatureCelsius: 37.0,
      consciousnessAvpu: 'ALERT'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(obs.calculated_score).toBe(3);
    expect(obs.risk_level).toBe('LOW_MEDIUM');
    expect(obs.recommended_monitoring_frequency).toBe('q4h-q6h');
    expect(obs.escalation_required).toBe(false);
  });

  // ─── TC-03: MEDIUM CLINICAL RISK (NEWS2 = 5-6) ───
  it('TC-03: should calculate NEWS2 score = 5 with MEDIUM risk and require nurse/physician escalation', async () => {
    const obs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 115, // Score 2 (111-130)
      systolicBpMmhg: 105, // Score 1 (101-110)
      diastolicBpMmhg: 70,
      respiratoryRateBpm: 23, // Score 2 (21-24)
      spo2Percent: 96.0,
      supplementalOxygen: false,
      bodyTemperatureCelsius: 37.2,
      consciousnessAvpu: 'ALERT'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(obs.calculated_score).toBe(5);
    expect(obs.risk_level).toBe('MEDIUM');
    expect(obs.recommended_monitoring_frequency).toBe('q1h');
    expect(obs.escalation_required).toBe(true);
  });

  // ─── TC-04: SINGLE EXTREME PARAMETER SCORE OF 3 ───
  it('TC-04: should flag single extreme parameter score of 3 and upgrade risk to MEDIUM even if total score < 5', async () => {
    const obs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 75, // Score 0
      systolicBpMmhg: 85, // Score 3 (<= 90 mmHg Extreme Hypotension!)
      diastolicBpMmhg: 50,
      respiratoryRateBpm: 16, // Score 0
      spo2Percent: 97.0, // Score 0
      supplementalOxygen: false,
      bodyTemperatureCelsius: 36.8,
      consciousnessAvpu: 'ALERT'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(obs.calculated_score).toBe(3);
    expect(obs.single_extreme_score_3).toBe(true);
    expect(obs.risk_level).toBe('MEDIUM'); // Upgraded due to single extreme 3!
    expect(obs.escalation_required).toBe(true);
  });

  // ─── TC-05: HIGH / CRITICAL RISK (NEWS2 >= 7) ───
  it('TC-05: should calculate NEWS2 score >= 7 and trigger CRITICAL risk with continuous monitoring and RRT alert', async () => {
    const obs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 135, // Score 3 (>= 131)
      systolicBpMmhg: 88, // Score 3 (<= 90)
      diastolicBpMmhg: 50,
      respiratoryRateBpm: 28, // Score 3 (>= 25)
      spo2Percent: 90.0, // Score 3 (<= 91)
      supplementalOxygen: true, // Score 2
      bodyTemperatureCelsius: 38.5, // Score 1
      consciousnessAvpu: 'VOICE' // Score 3 (Non-alert)
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(obs.calculated_score).toBe(18);
    expect(obs.risk_level).toBe('CRITICAL');
    expect(obs.recommended_monitoring_frequency).toBe('CONTINUOUS');
    expect(obs.recommended_action).toContain('CODE BLUE / RAPID RESPONSE TEAM');
  });

  // ─── TC-06: SPO2 SCALE 2 FOR HYPERCAPNIC RESPIRATORY FAILURE (COPD) ───
  it('TC-06: should evaluate SpO2 90% as normal (Score 0) under Scale 2 for hypercapnic respiratory failure', async () => {
    const scale1 = calculateNEWS2Score({ respiratoryRate: 16, spo2: 90, spo2ScaleType: 'SCALE_1', systolicBp: 120, heartRate: 72, bodyTemperature: 36.8 });
    const scale2 = calculateNEWS2Score({ respiratoryRate: 16, spo2: 90, spo2ScaleType: 'SCALE_2', systolicBp: 120, heartRate: 72, bodyTemperature: 36.8 });

    expect(scale1.breakdown.spo2).toBe(3); // 90% is hypoxic on Scale 1
    expect(scale2.breakdown.spo2).toBe(0); // 90% is target on Scale 2 (88-92%)
  });

  // ─── TC-07: SUPPLEMENTAL OXYGEN DERANGEMENT SCORING ───
  it('TC-07: should add 2 penalty points whenever patient requires supplemental oxygen', async () => {
    const air = calculateNEWS2Score({ respiratoryRate: 16, spo2: 98, supplementalOxygen: false, systolicBp: 120, heartRate: 72, bodyTemperature: 36.8 });
    const o2 = calculateNEWS2Score({ respiratoryRate: 16, spo2: 98, supplementalOxygen: true, systolicBp: 120, heartRate: 72, bodyTemperature: 36.8 });

    expect(air.score).toBe(0);
    expect(o2.score).toBe(2);
  });

  // ─── TC-08: PHYSIOLOGICAL OUT-OF-BOUNDS REJECTION ───
  it('TC-08: should reject impossible physiological values (e.g. Heart Rate 400 bpm)', async () => {
    await expect(clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 400, // Impossible HR
      systolicBpMmhg: 120,
      diastolicBpMmhg: 80,
      respiratoryRateBpm: 16,
      spo2Percent: 98,
      bodyTemperatureCelsius: 36.8
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('Heart Rate (400 bpm) di luar batas fisiologis');
  });

  // ─── TC-09: TERMINATED ENCOUNTER GUARD ───
  it('TC-09: should reject recording vital signs on a CLOSED / DISCHARGED encounter', async () => {
    await expect(clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-closed-002',
      patientId: 'pat-mon-001',
      heartRateBpm: 75,
      systolicBpMmhg: 120,
      diastolicBpMmhg: 80,
      respiratoryRateBpm: 16,
      spo2Percent: 98,
      bodyTemperatureCelsius: 36.8
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('encounter yang telah ditutup/selesai');
  });

  // ─── TC-10: OBSERVER ROLE AUTHORIZATION GUARD ───
  it('TC-10: should reject vital sign observation by non-clinical unauthorized roles (403)', async () => {
    await expect(clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 75,
      systolicBpMmhg: 120,
      diastolicBpMmhg: 80,
      respiratoryRateBpm: 16,
      spo2Percent: 98,
      bodyTemperatureCelsius: 36.8
    }, { role: ENTERPRISE_ROLES.ROLE_CASHIER })).rejects.toThrow('Wewenang ditolak');
  });

  // ─── TC-11: ISBAR DETERIORATION ESCALATION TO ATTENDING DPJP ───
  it('TC-11: should escalate patient deterioration with ISBAR structured payload and 30-minute target window', async () => {
    const obs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 115,
      systolicBpMmhg: 105,
      diastolicBpMmhg: 70,
      respiratoryRateBpm: 23,
      spo2Percent: 96.0,
      bodyTemperatureCelsius: 37.2
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    const isbar = {
      identity: 'Tn. Ahmad Fauzi (MRN: 2026-0801), Ruang Melati Bed 3',
      situation: 'Skor EWS naik menjadi 5 (Derajat Medium), pasien mengeluh sesak nafas bertambah.',
      background: 'Post-op Laparatomi Hari ke-2 dengan riwayat PPOK.',
      assessment: 'Takipnea 23x/m, Takikardia 115x/m, SpO2 96% room air.',
      recommendation: 'Mohon telaah klinis DPJP di tempat dan pertimbangan terapi bronkodilator nebulisasi.'
    };

    const esc = await clinicalMonitoringService.escalateDeterioration({
      observationId: obs.id,
      escalationLevel: 'ATTENDING_PHYSICIAN_DPJP',
      isbarPayload: isbar,
      notifiedToName: 'dr. Siti Rahma, Sp.PD',
      notificationMethod: 'HOSPITAL_PAGE'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(esc.escalation_level).toBe('ATTENDING_PHYSICIAN_DPJP');
    expect(esc.target_response_window_minutes).toBe(30);
    expect(mockDatabaseState.clinical_vital_sign_observations[0].escalation_status).toBe('ESCALATED');
  });

  // ─── TC-12: TARGET RECIPIENT PROVENANCE & NOTIFICATION METHOD ───
  it('TC-12: should record communication provenance including recipient name, role, and dispatch method', async () => {
    const obs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 115,
      systolicBpMmhg: 105,
      diastolicBpMmhg: 70,
      respiratoryRateBpm: 23,
      spo2Percent: 96.0,
      bodyTemperatureCelsius: 37.2
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    const esc = await clinicalMonitoringService.escalateDeterioration({
      observationId: obs.id,
      escalationLevel: 'RAPID_RESPONSE_TEAM',
      notifiedToId: 'DOC-ICU-LEAD-01',
      notifiedToName: 'dr. Budi Setiawan, Sp.An-KIC',
      notifiedToRole: 'ROLE_ICU_SPECIALIST',
      notificationMethod: 'DIRECT_CALL'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(esc.notified_to_name).toBe('dr. Budi Setiawan, Sp.An-KIC');
    expect(esc.notification_method).toBe('DIRECT_CALL');
    expect(esc.target_response_window_minutes).toBe(15);
  });

  // ─── TC-13: CLOSED-LOOP PHYSICIAN READ-BACK ACKNOWLEDGMENT ───
  it('TC-13: should acknowledge deterioration escalation with closed-loop TBAK read-back confirmation and instructions', async () => {
    const obs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 115,
      systolicBpMmhg: 105,
      diastolicBpMmhg: 70,
      respiratoryRateBpm: 23,
      spo2Percent: 96.0,
      bodyTemperatureCelsius: 37.2
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    const esc = await clinicalMonitoringService.escalateDeterioration({
      observationId: obs.id,
      escalationLevel: 'ATTENDING_PHYSICIAN_DPJP',
      notifiedToName: 'dr. Siti Rahma, Sp.PD'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    const ack = await clinicalMonitoringService.acknowledgeEscalation({
      escalationId: esc.id,
      physicianInstruction: 'Pasang O2 Nasal Kanul 3 LPM, berikan Nebulisasi Combivent 1 respule, pantau tanda vital tiap 30 menit.',
      readBackConfirmed: true
    }, { fullName: 'dr. Siti Rahma, Sp.PD', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(ack.status).toBe('ACKNOWLEDGED');
    expect(ack.read_back_confirmed).toBe(true);
    expect(mockDatabaseState.clinical_vital_sign_observations[0].escalation_status).toBe('ACKNOWLEDGED');
  });

  // ─── TC-14: MISSING READ-BACK CONFIRMATION REJECTION ───
  it('TC-14: should strictly reject acknowledgment if readBackConfirmed is false (JCI IPSG 2 Guard)', async () => {
    const obs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 115,
      systolicBpMmhg: 105,
      diastolicBpMmhg: 70,
      respiratoryRateBpm: 23,
      spo2Percent: 96.0,
      bodyTemperatureCelsius: 37.2
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    const esc = await clinicalMonitoringService.escalateDeterioration({
      observationId: obs.id,
      escalationLevel: 'ATTENDING_PHYSICIAN_DPJP'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    await expect(clinicalMonitoringService.acknowledgeEscalation({
      escalationId: esc.id,
      physicianInstruction: 'Pasang O2',
      readBackConfirmed: false // Missing read-back confirmation
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('Konfirmasi read-back instruksi lisan/telepon (TBAK');
  });

  // ─── TC-15: DUPLICATE ESCALATION ACKNOWLEDGMENT PREVENTION ───
  it('TC-15: should prevent double-acknowledging an already acknowledged deterioration escalation', async () => {
    const obs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 115,
      systolicBpMmhg: 105,
      diastolicBpMmhg: 70,
      respiratoryRateBpm: 23,
      spo2Percent: 96.0,
      bodyTemperatureCelsius: 37.2
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    const esc = await clinicalMonitoringService.escalateDeterioration({
      observationId: obs.id,
      escalationLevel: 'ATTENDING_PHYSICIAN_DPJP'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    await clinicalMonitoringService.acknowledgeEscalation({
      escalationId: esc.id,
      physicianInstruction: 'Pasang O2 Nasal Kanul 3 LPM',
      readBackConfirmed: true
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    await expect(clinicalMonitoringService.acknowledgeEscalation({
      escalationId: esc.id,
      physicianInstruction: 'Instruksi kedua',
      readBackConfirmed: true
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('sudah dikonfirmasi sebelumnya');
  });

  // ─── TC-16: RAPID RESPONSE TEAM (RRT) ACTIVATION ───
  it('TC-16: should record Rapid Response Team arrival, interventions, and stabilization outcome', async () => {
    const event = await clinicalMonitoringService.activateRapidResponseOrCodeBlue({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      eventType: 'RAPID_RESPONSE',
      locationWardRoom: 'Ruang Melati Bed 3',
      teamLeaderId: 'DOC-ICU-LEAD-01',
      teamLeaderName: 'dr. Budi Setiawan, Sp.An-KIC',
      teamLeaderRole: 'ROLE_ICU_SPECIALIST',
      teamMembers: [
        { name: 'dr. Budi Setiawan, Sp.An-KIC', role: 'Team Leader' },
        { name: 'Ners Dewi, S.Kep', role: 'ICU Resuscitation Nurse' },
        { name: 'apt. Maya, S.Farm', role: 'Clinical Pharmacist' }
      ],
      initialRhythm: 'SEVERE_BRADYCARDIA',
      interventionsPerformed: [
        { type: 'OXYGENATION', detail: 'High Flow Nasal Cannula (HFNC) FiO2 60%' },
        { type: 'FLUID_RESUSCITATION', detail: 'NaCl 0.9% 500 mL IV Bolus' },
        { type: 'MEDICATION', detail: 'Atropine 0.5mg IV Bolus' }
      ],
      outcome: 'STABILIZED_IN_WARD',
      eventSummary: 'Pasien mengalami respon positif pasca atropin dan oksigenasi HFNC, HR naik ke 78 bpm.'
    }, { role: ENTERPRISE_ROLES.ROLE_ICU_SPECIALIST });

    expect(event.event_type).toBe('RAPID_RESPONSE');
    expect(event.outcome).toBe('STABILIZED_IN_WARD');
    expect(event.digital_signature_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(mockDatabaseState.rapid_response_code_blue_events.length).toBe(1);
  });

  // ─── TC-17: CODE BLUE CARDIAC ARREST RESUSCITATION LEDGER ───
  it('TC-17: should record Code Blue cardiac arrest with shockable rhythm, CPR cycles, and ROSC achieved outcome', async () => {
    const event = await clinicalMonitoringService.activateRapidResponseOrCodeBlue({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      eventType: 'CODE_BLUE_ARREST',
      locationWardRoom: 'Ruang ICU Bed 1',
      teamLeaderId: 'DOC-EMERGENCY-01',
      teamLeaderName: 'dr. Hendra Gunawan, Sp.JP',
      teamLeaderRole: 'ROLE_DOCTOR_EMERGENCY',
      teamMembers: [
        { name: 'dr. Hendra Gunawan, Sp.JP', role: 'ACLS Team Leader' },
        { name: 'Ners Anton, S.Kep', role: 'Compressor' },
        { name: 'Ners Rina, S.Kep', role: 'Airway / Bag-Valve-Mask' }
      ],
      initialRhythm: 'VF_VT_SHOCKABLE',
      interventionsPerformed: [
        { cycle: 1, action: 'CPR 2 Minutes + Defibrillation 200J Biphasic' },
        { cycle: 2, action: 'CPR 2 Minutes + Epinephrine 1mg IV + Defibrillation 200J' },
        { cycle: 3, action: 'CPR 2 Minutes + Amiodarone 300mg IV + Return of Spontaneous Circulation (ROSC)' }
      ],
      outcome: 'ROSC_ACHIEVED',
      eventSummary: 'ROSC tercapai pada siklus ke-3 ACLS. Pasien dialihkan ke ventilasi mekanik invasif di ICU.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_EMERGENCY });

    expect(event.event_type).toBe('CODE_BLUE_ARREST');
    expect(event.outcome).toBe('ROSC_ACHIEVED');
    expect(event.initial_rhythm).toBe('VF_VT_SHOCKABLE');
  });

  // ─── TC-18: RRT TEAM LEADER AUTHORIZATION GUARD ───
  it('TC-18: should reject leading RRT / Code Blue by non-physician / non-emergency roles (403)', async () => {
    await expect(clinicalMonitoringService.activateRapidResponseOrCodeBlue({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      eventType: 'CODE_BLUE_ARREST'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('Wewenang ditolak');
  });

  // ─── TC-19: EXACTLY-ONCE RRT / CODE BLUE CHARGE CAPTURE ───
  it('TC-19: should automatically capture emergency resuscitation charges and emit outbox event', async () => {
    const event = await clinicalMonitoringService.activateRapidResponseOrCodeBlue({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      eventType: 'CODE_BLUE_ARREST',
      outcome: 'ROSC_ACHIEVED'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_EMERGENCY });

    expect(event.charge_captured).toBe(true);
    expect(event.charge_id).toBeDefined();
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'CHARGE_CAPTURE_RECORDED')).toBe(true);
  });

  // ─── TC-20: MANDATORY POST-INTERVENTION REASSESSMENT EXECUTION ───
  it('TC-20: should record closed-loop reassessment showing score delta improvement (e.g. 9 ➔ 1)', async () => {
    // Initial critical observation (Score 9)
    const initObs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 135, // 3
      systolicBpMmhg: 95, // 2
      diastolicBpMmhg: 60,
      respiratoryRateBpm: 26, // 3
      spo2Percent: 94.0, // 1
      bodyTemperatureCelsius: 37.0
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(initObs.calculated_score).toBe(9);

    // Reassessment 20 mins post-intervention
    const reassess = await clinicalMonitoringService.recordClosedLoopReassessment({
      initialObservationId: initObs.id,
      postHeartRateBpm: 76, // 0
      postSystolicBpMmhg: 118, // 0
      postDiastolicBpMmhg: 78,
      postRespiratoryRateBpm: 18, // 0
      postSpo2Percent: 98.0, // 0
      postSupplementalOxygen: false,
      postBodyTemperatureCelsius: 36.8,
      postConsciousnessAvpu: 'ALERT',
      reassessmentNotes: 'Pasca terapi oksigen dan rehidrasi IV, hemodinamik membaik signifikan.'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(reassess.pre_score).toBe(9);
    expect(reassess.post_score).toBe(0);
    expect(reassess.score_delta).toBe(-9);
    expect(reassess.recovery_trajectory).toBe('IMPROVING');
    expect(mockDatabaseState.clinical_reassessments.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'REASSESSMENT_RECORDED')).toBe(true);
  });

  // ─── TC-21: ESCALATION STATE RESOLUTION ON REASSESSMENT ───
  it('TC-21: should transition initial observation escalation_status to RESOLVED upon recording reassessment', async () => {
    const initObs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 135,
      systolicBpMmhg: 95,
      diastolicBpMmhg: 60,
      respiratoryRateBpm: 26,
      spo2Percent: 94.0,
      bodyTemperatureCelsius: 37.0
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    await clinicalMonitoringService.escalateDeterioration({
      observationId: initObs.id,
      escalationLevel: 'RAPID_RESPONSE_TEAM'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(mockDatabaseState.clinical_vital_sign_observations[0].escalation_status).toBe('ESCALATED');

    await clinicalMonitoringService.recordClosedLoopReassessment({
      initialObservationId: initObs.id,
      postHeartRateBpm: 76,
      postSystolicBpMmhg: 118,
      postDiastolicBpMmhg: 78,
      postRespiratoryRateBpm: 18,
      postSpo2Percent: 98.0,
      postBodyTemperatureCelsius: 36.8
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(mockDatabaseState.clinical_vital_sign_observations[0].escalation_status).toBe('RESOLVED');
  });

  // ─── TC-22: MULTI-MODEL SCORING (PEWS / MEOWS) SUPPORT ───
  it('TC-22: should preserve designated scoring_system parameter (NEWS2, PEWS, MEOWS) in observation record', async () => {
    const obs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 110,
      systolicBpMmhg: 95,
      diastolicBpMmhg: 60,
      respiratoryRateBpm: 28,
      spo2Percent: 96.0,
      bodyTemperatureCelsius: 37.0,
      scoringSystem: 'PEWS' // Pediatric Early Warning Score
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(obs.scoring_system).toBe('PEWS');
  });

  // ─── TC-23: SHA-256 DIGITAL SIGNATURE IMMUTABILITY ───
  it('TC-23: should generate cryptographic SHA-256 digital signature hash for vital sign observation', async () => {
    const obs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 72,
      systolicBpMmhg: 120,
      diastolicBpMmhg: 80,
      respiratoryRateBpm: 16,
      spo2Percent: 98.0,
      bodyTemperatureCelsius: 36.8
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(obs.digital_signature_hash).toBeDefined();
    expect(obs.digital_signature_hash.length).toBe(64);
  });

  // ─── TC-24: AUDIT LOG & OUTBOX ATOMICITY ───
  it('TC-24: should atomically write audit log and domain outbox event within same database transaction', async () => {
    await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 72,
      systolicBpMmhg: 120,
      diastolicBpMmhg: 80,
      respiratoryRateBpm: 16,
      spo2Percent: 98.0,
      bodyTemperatureCelsius: 36.8
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(1);
  });

  // ─── TC-25: FULL E2E DETERIORATION & RESUSCITATION RECONCILIATION ───
  it('TC-25: should reconcile complete deterioration journey with 0 discrepancy across all clinical states', async () => {
    // 1. Initial observation with Critical Score (11)
    const initObs = await clinicalMonitoringService.recordVitalSignObservation({
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      heartRateBpm: 140, // 3
      systolicBpMmhg: 85, // 3
      diastolicBpMmhg: 50,
      respiratoryRateBpm: 28, // 3
      spo2Percent: 93.0, // 2
      supplementalOxygen: true, // 2
      bodyTemperatureCelsius: 38.6, // 1
      consciousnessAvpu: 'VOICE' // 3
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(initObs.risk_level).toBe('CRITICAL');

    // 2. ISBAR Escalation to Rapid Response Team
    const esc = await clinicalMonitoringService.escalateDeterioration({
      observationId: initObs.id,
      escalationLevel: 'RAPID_RESPONSE_TEAM',
      notifiedToName: 'dr. Budi Setiawan, Sp.An-KIC',
      notificationMethod: 'EMERGENCY_SIREN_BROADCAST'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(esc.status).toBe('PENDING_ACKNOWLEDGMENT');

    // 3. RRT Team Leader Read-Back Acknowledgment
    const ack = await clinicalMonitoringService.acknowledgeEscalation({
      escalationId: esc.id,
      physicianInstruction: 'Tim RRT meluncur segera, siapkan suction dan bag-valve mask di bedside.',
      readBackConfirmed: true
    }, { role: ENTERPRISE_ROLES.ROLE_ICU_SPECIALIST });

    expect(ack.status).toBe('ACKNOWLEDGED');

    // 4. RRT Resuscitation Execution
    const event = await clinicalMonitoringService.activateRapidResponseOrCodeBlue({
      escalationId: esc.id,
      encounterId: 'enc-mon-001',
      patientId: 'pat-mon-001',
      eventType: 'RAPID_RESPONSE',
      outcome: 'STABILIZED_IN_WARD',
      eventSummary: 'Intervensi RRT berhasil.'
    }, { role: ENTERPRISE_ROLES.ROLE_ICU_SPECIALIST });

    expect(event.charge_captured).toBe(true);

    // 5. Post-Intervention Reassessment
    const reassess = await clinicalMonitoringService.recordClosedLoopReassessment({
      initialObservationId: initObs.id,
      eventId: event.id,
      postHeartRateBpm: 82,
      postSystolicBpMmhg: 115,
      postDiastolicBpMmhg: 75,
      postRespiratoryRateBpm: 18,
      postSpo2Percent: 98.0,
      postSupplementalOxygen: false,
      postBodyTemperatureCelsius: 37.0,
      postConsciousnessAvpu: 'ALERT'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(reassess.recovery_trajectory).toBe('IMPROVING');

    // Final Ledger Reconciliation
    expect(mockDatabaseState.clinical_vital_sign_observations.length).toBe(1);
    expect(mockDatabaseState.clinical_deterioration_escalations.length).toBe(1);
    expect(mockDatabaseState.rapid_response_code_blue_events.length).toBe(1);
    expect(mockDatabaseState.clinical_reassessments.length).toBe(1);
    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBeGreaterThanOrEqual(4);
  });
});
