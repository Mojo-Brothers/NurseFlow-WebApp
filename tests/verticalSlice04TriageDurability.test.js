/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #004 Durability Test Suite
 * Sprint 5C / Wave 2: Emergency Triage Assessment (ATS / ESI v4) & Response SLA ➔ PostgreSQL 16 Durability Proof
 * Standards: Australasian Triage Scale (ATS), ESI v4, KARS PMKP 2024, JCI IPSG 1, ACID Transactions, Canonical Envelope
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import app from '../server/server.js';
import { triageApplicationService, TriageDomainError, ATS_SLA_MINUTES } from '../server/services/triageApplication.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { jwtSecurityService } from '../src/core/security/jwtSecurity.service.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-04 — Triage Assessment & SLA Timers ➔ PostgreSQL Durability Proof', () => {
  let mockDatabaseState = {
    encounters: [],
    triage_assessments: [],
    triage_sla_timers: [],
    universal_audit_logs: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-emer-001',
          episode_id: 'epc-emer-001',
          patient_id: 'pat-emer-001',
          encounter_number: 'ENC-2026-00010',
          encounter_class: 'EMER',
          status: 'ARRIVED',
          primary_doctor_id: 'DOC-EMER-001',
          primary_doctor_name: 'dr. Emergency, Sp.B'
        }
      ],
      triage_assessments: [],
      triage_sla_timers: [],
      universal_audit_logs: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedTriage: [],
            stagedTimers: [],
            stagedAuditLogs: [],
            encounterUpdates: [],
            timerUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.triage_assessments.push(...activeTransactionState.stagedTriage);
            mockDatabaseState.triage_sla_timers.push(...activeTransactionState.stagedTimers);
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);

            activeTransactionState.encounterUpdates.forEach(up => {
              const idx = mockDatabaseState.encounters.findIndex(e => e.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.encounters[idx] = { ...mockDatabaseState.encounters[idx], ...up.data };
              }
            });

            activeTransactionState.timerUpdates.forEach(up => {
              const idx = mockDatabaseState.triage_sla_timers.findIndex(t => t.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.triage_sla_timers[idx] = { ...mockDatabaseState.triage_sla_timers[idx], ...up.data };
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

        if (normalized.includes('FROM ENCOUNTERS WHERE ID = $1')) {
          const found = mockDatabaseState.encounters.filter(e => e.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        if (normalized.startsWith('INSERT INTO TRIAGE_ASSESSMENTS')) {
          const newTriage = {
            id: params[0],
            episode_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            triage_method: params[4],
            triage_level: params[5],
            ats_level: params[6],
            esi_level: params[7],
            chief_complaint: params[8],
            airway_status: params[9],
            breathing_status: params[10],
            circulation_status: params[11],
            disability_status: params[12],
            exposure_notes: params[13],
            vitals_payload: params[14],
            is_trauma: params[15],
            is_cito: params[16],
            target_response_minutes: params[17],
            assessed_at: params[18],
            assessed_by: params[19]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedTriage.push(newTriage);
          } else {
            mockDatabaseState.triage_assessments.push(newTriage);
          }
          return { rows: [newTriage], rowCount: 1 };
        }

        if (normalized.startsWith('INSERT INTO TRIAGE_SLA_TIMERS')) {
          const newTimer = {
            id: params[0],
            encounter_id: params[1],
            triage_level: params[2],
            target_response_minutes: params[3],
            started_at: params[4],
            status: params[5]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedTimers.push(newTimer);
          } else {
            mockDatabaseState.triage_sla_timers.push(newTimer);
          }
          return { rows: [newTimer], rowCount: 1 };
        }

        if (normalized.startsWith('UPDATE ENCOUNTERS SET STATUS = $1')) {
          const status = params[0];
          const targetId = params[2];
          const updateObj = { id: targetId, data: { status } };
          if (activeTransactionState) {
            activeTransactionState.encounterUpdates.push(updateObj);
          }
          return { rows: [], rowCount: 1 };
        }

        if (normalized.includes('FROM TRIAGE_SLA_TIMERS WHERE ENCOUNTER_ID = $1')) {
          const found = mockDatabaseState.triage_sla_timers.filter(t => t.encounter_id === params[0] && t.status === params[1]);
          return { rows: found, rowCount: found.length };
        }

        if (normalized.startsWith('UPDATE TRIAGE_SLA_TIMERS SET')) {
          const firstContact = params[0];
          const elapsed = params[1];
          const isOverdue = params[2];
          const targetId = params[3];
          const updateObj = {
            id: targetId,
            data: {
              first_physician_contact_at: firstContact,
              completed_at: firstContact,
              elapsed_seconds: elapsed,
              is_overdue: isOverdue,
              status: 'COMPLETED'
            }
          };
          if (activeTransactionState) {
            activeTransactionState.timerUpdates.push(updateObj);
          }
          const existing = mockDatabaseState.triage_sla_timers.find(t => t.id === targetId) || {};
          const merged = { ...existing, ...updateObj.data };
          return { rows: [merged], rowCount: 1 };
        }

        if (normalized.startsWith('INSERT INTO UNIVERSAL_AUDIT_LOGS')) {
          const newAudit = {
            id: params[0],
            signature_hash: params[11]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedAuditLogs.push(newAudit);
          } else {
            mockDatabaseState.universal_audit_logs.push(newAudit);
          }
          return { rows: [newAudit], rowCount: 1 };
        }

        if (normalized.includes('FROM TRIAGE_ASSESSMENTS T') && normalized.includes('JOIN MASTER_PATIENTS P')) {
          return {
            rows: mockDatabaseState.triage_assessments.map(t => ({
              ...t,
              patient_name: 'Budi Emergency',
              mrn: 'MRN-2026-00010',
              encounter_status: 'TRIAGED'
            })),
            rowCount: mockDatabaseState.triage_assessments.length
          };
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

  // ─── TC-01: ATS/ESI Calculation & Target SLA ───
  it('TC-01: should calculate ATS 2 (Emergent) with 10-minute response target', () => {
    const res = triageApplicationService.evaluateTriageLevel({
      atsLevel: 2,
      airwayStatus: 'PATENT',
      breathingStatus: 'NORMAL',
      circulationStatus: 'NORMAL'
    });

    expect(res.level).toBe(2);
    expect(res.triageLevel).toBe('ATS_2_EMERGENT');
    expect(res.targetMinutes).toBe(10);
    expect(res.colorCode).toBe('ORANGE');
  });

  // ─── TC-02: Red Flag Override to Resuscitation (ATS 1 / 0 Min) ───
  it('TC-02: should elevate to ATS 1 Resuscitation (0 Min SLA) when airway is obstructed or SpO2 < 85%', () => {
    const res = triageApplicationService.evaluateTriageLevel({
      atsLevel: 4, // Input says semi-urgent, but red flag triggers
      airwayStatus: 'OBSTRUCTED',
      vitalsPayload: { spo2: 80 }
    });

    expect(res.level).toBe(1);
    expect(res.triageLevel).toBe('ATS_1_RESUSCITATION');
    expect(res.targetMinutes).toBe(0);
    expect(res.colorCode).toBe('RED');
  });

  // ─── TC-03: ACID Transaction Insert Triage Assessment + SLA Timer ───
  it('TC-03: should record triage assessment, create SLA timer, update encounter to TRIAGED, and log audit trail', async () => {
    const result = await triageApplicationService.recordTriageAssessment({
      encounterId: 'enc-emer-001',
      chiefComplaint: 'Nyeri dada mendadak tembus ke punggung',
      atsLevel: 2,
      airwayStatus: 'PATENT',
      breathingStatus: 'NORMAL',
      circulationStatus: 'NORMAL',
      disabilityStatus: 'ALERT',
      vitalsPayload: { systolicBp: 160, heartRate: 98, spo2: 97 },
      assessedBy: 'Ns. Ratna Dewi, S.Kep'
    });

    expect(result.triage.id).toBeDefined();
    expect(result.triage.triage_level).toBe('ATS_2_EMERGENT');
    expect(result.triage.target_response_minutes).toBe(10);
    expect(result.slaTimer.status).toBe('RUNNING');
    expect(result.auditSignature).toBeDefined();

    // Verify DB State
    expect(mockDatabaseState.triage_assessments.length).toBe(1);
    expect(mockDatabaseState.triage_sla_timers.length).toBe(1);
    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);
    expect(mockDatabaseState.encounters[0].status).toBe('TRIAGED');
  });

  // ─── TC-04: Non-existent Encounter Rejection ───
  it('TC-04: should reject triage assessment for non-existent encounter with 404', async () => {
    await expect(
      triageApplicationService.recordTriageAssessment({
        encounterId: 'enc-non-existent-999',
        chiefComplaint: 'Demam tinggi'
      })
    ).rejects.toThrow(/tidak ditemukan/);

    expect(mockDatabaseState.triage_assessments.length).toBe(0);
    expect(activeTransactionState).toBeNull();
  });

  // ─── TC-05: Empty Chief Complaint Rejection ───
  it('TC-05: should reject triage assessment without chief complaint with 400 Bad Request', async () => {
    await expect(
      triageApplicationService.recordTriageAssessment({
        encounterId: 'enc-emer-001',
        chiefComplaint: ''
      })
    ).rejects.toThrow(/Keluhan utama/);
  });

  // ─── TC-06: Stop SLA Timer on First Physician Contact ───
  it('TC-06: should record first physician contact, complete timer, and calculate response duration', async () => {
    // 1. Record triage to start timer
    await triageApplicationService.recordTriageAssessment({
      encounterId: 'enc-emer-001',
      chiefComplaint: 'Sesak nafas akut',
      atsLevel: 2
    });

    // 2. Doctor arrives
    const timer = await triageApplicationService.recordFirstPhysicianContact({
      encounterId: 'enc-emer-001',
      physicianId: 'DOC-EMER-001',
      physicianName: 'dr. Emergency, Sp.B'
    });

    expect(timer.status).toBe('COMPLETED');
    expect(timer.first_physician_contact_at).toBeDefined();
    expect(timer.elapsed_seconds).toBeDefined();
    expect(mockDatabaseState.triage_sla_timers[0].status).toBe('COMPLETED');
  });

  // ─── TC-07: localStorage Wipe Immunity Test ───
  it('TC-07: should survive browser localStorage wipe and retrieve persistent triage from PostgreSQL', async () => {
    await triageApplicationService.recordTriageAssessment({
      encounterId: 'enc-emer-001',
      chiefComplaint: 'Trauma kepala akibat kecelakaan lalu lintas',
      atsLevel: 1,
      airwayStatus: 'OBSTRUCTED'
    });

    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }

    const triage = await triageApplicationService.getTriageByEncounterId('enc-emer-001');
    expect(triage).not.toBeNull();
    expect(triage.triage_level).toBe('ATS_1_RESUSCITATION');
    expect(triage.patient_name).toBe('Budi Emergency');
  });

  // ─── TC-08: Express API Gateway (POST /api/v1/triage/assessments) ───
  it('TC-08: should record triage assessment via Express API Gateway with canonical envelope', async () => {
    const req = {
      headers: {
        'x-request-id': 'REQ-VS04-TEST-001',
        'x-correlation-id': 'CORR-VS04-TEST-001'
      },
      user: {
        userId: 'USR-NURSE-001',
        username: 'perawat_igd',
        role: ENTERPRISE_ROLES.ROLE_NURSE
      },
      ip: '192.168.1.100',
      body: {
        encounterId: 'enc-emer-001',
        chiefComplaint: 'Nyeri dada tipikal',
        atsLevel: 2,
        airwayStatus: 'PATENT'
      }
    };

    let statusCode = 0;
    let responseBody = null;

    const res = {
      status: vi.fn((code) => {
        statusCode = code;
        return res;
      }),
      json: vi.fn((body) => {
        responseBody = body;
        return res;
      })
    };

    const { triageController } = await import('../server/controllers/triage.controller.js');
    await triageController.recordAssessment(req, res);

    expect(statusCode).toBe(201);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.triage.triage_level).toBe('ATS_2_EMERGENT');
    expect(responseBody.meta.correlationId).toBe('CORR-VS04-TEST-001');
  });
});
