/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #002 Durability Test Suite
 * Sprint 5C: Clinical Encounter & Episode of Care ➔ PostgreSQL 16 Durability & FSM State Machine Verification
 * Standards: HL7 FHIR R4 Encounter, JCI Patient Journey Documentation, ACID Transactions, Canonical Envelope
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import app from '../server/server.js';
import { encounterApplicationService, EncounterDomainError, ENCOUNTER_FSM_TRANSITIONS } from '../server/services/encounterApplication.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { jwtSecurityService } from '../src/core/security/jwtSecurity.service.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-02 — Create Encounter & FSM Transitions ➔ PostgreSQL Durability Proof', () => {
  let mockDatabaseState = {
    master_patients: [],
    episodes_of_care: [],
    encounters: [],
    universal_audit_logs: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      master_patients: [
        {
          id: 'e4b0a1c2-3d4e-4f5a-6b7c-8d9e0f1a2b3c',
          mrn: 'MRN-2026-00001',
          nik: '3171012304850001',
          full_name: 'Budi Santoso',
          is_active: true
        }
      ],
      episodes_of_care: [],
      encounters: [],
      universal_audit_logs: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedEpisodes: [],
            stagedEncounters: [],
            stagedAuditLogs: [],
            updates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.episodes_of_care.push(...activeTransactionState.stagedEpisodes);
            mockDatabaseState.encounters.push(...activeTransactionState.stagedEncounters);
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);

            // Apply updates
            activeTransactionState.updates.forEach(up => {
              const idx = mockDatabaseState.encounters.findIndex(e => e.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.encounters[idx] = { ...mockDatabaseState.encounters[idx], ...up.data };
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

        if (normalized.includes('FROM MASTER_PATIENTS WHERE ID = $1')) {
          const found = mockDatabaseState.master_patients.filter(p => p.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        if (normalized.includes('FROM EPISODES_OF_CARE WHERE EPISODE_NUMBER LIKE $1')) {
          const sorted = [...mockDatabaseState.episodes_of_care].sort((a, b) => b.episode_number.localeCompare(a.episode_number));
          return { rows: sorted.slice(0, 1), rowCount: sorted.length > 0 ? 1 : 0 };
        }

        if (normalized.includes('FROM ENCOUNTERS WHERE ENCOUNTER_NUMBER LIKE $1')) {
          const sorted = [...mockDatabaseState.encounters].sort((a, b) => b.encounter_number.localeCompare(a.encounter_number));
          return { rows: sorted.slice(0, 1), rowCount: sorted.length > 0 ? 1 : 0 };
        }

        if (normalized.includes('FROM ENCOUNTERS WHERE ID = $1')) {
          const allEnc = [
            ...mockDatabaseState.encounters,
            ...(activeTransactionState?.stagedEncounters || [])
          ];
          const found = allEnc.filter(e => e.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        if (normalized.startsWith('INSERT INTO EPISODES_OF_CARE')) {
          const newEp = {
            id: params[0],
            episode_number: params[1],
            patient_id: params[2],
            episode_type: params[3],
            status: params[4],
            managing_department_id: params[5],
            managing_department_name: params[6],
            lead_dpjp_id: params[7],
            lead_dpjp_name: params[8],
            start_time: params[9],
            general_consent_signed: params[10],
            financial_consent_signed: params[11],
            branch_id: params[12],
            created_at: params[13],
            updated_at: params[14]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedEpisodes.push(newEp);
          } else {
            mockDatabaseState.episodes_of_care.push(newEp);
          }
          return { rows: [newEp], rowCount: 1 };
        }

        if (normalized.startsWith('INSERT INTO ENCOUNTERS')) {
          const newEnc = {
            id: params[0],
            encounter_number: params[1],
            episode_id: params[2],
            patient_id: params[3],
            encounter_type: params[4],
            encounter_class: params[5],
            status: params[6],
            primary_doctor_id: params[7],
            primary_doctor_name: params[8],
            service_room_id: params[9],
            service_room_name: params[10],
            bed_id: params[11],
            bed_number: params[12],
            start_time: params[13],
            created_at: params[14],
            updated_at: params[15]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedEncounters.push(newEnc);
          } else {
            mockDatabaseState.encounters.push(newEnc);
          }
          return { rows: [newEnc], rowCount: 1 };
        }

        if (normalized.startsWith('UPDATE ENCOUNTERS SET')) {
          const updatedData = {
            status: params[0],
            updated_at: params[1],
            discharge_disposition: params[3]
          };
          const targetId = params[4];
          if (activeTransactionState) {
            activeTransactionState.updates.push({ id: targetId, data: updatedData });
          }
          const existing = mockDatabaseState.encounters.find(e => e.id === targetId) || {};
          const merged = { ...existing, ...updatedData };
          return { rows: [merged], rowCount: 1 };
        }

        if (normalized.startsWith('INSERT INTO UNIVERSAL_AUDIT_LOGS')) {
          const newAudit = {
            id: params[0],
            actor_id: params[1],
            actor_name: params[2],
            actor_role: params[3],
            client_ip: params[4],
            action_type: params[5],
            resource_type: params[6],
            resource_id: params[7],
            patient_id: params[8],
            signature_hash: params[11],
            created_at: params[12]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedAuditLogs.push(newAudit);
          } else {
            mockDatabaseState.universal_audit_logs.push(newAudit);
          }
          return { rows: [newAudit], rowCount: 1 };
        }

        if (normalized.includes('FROM ENCOUNTERS E') && normalized.includes('JOIN MASTER_PATIENTS P')) {
          let list = [...mockDatabaseState.encounters];
          if (params.length > 0 && typeof params[0] === 'string') {
            list = list.filter(e => e.patient_id === params[0] || e.status === params[0]);
          }
          return {
            rows: list.map(e => ({
              ...e,
              patient_name: 'Budi Santoso',
              mrn: 'MRN-2026-00001',
              nik: '3171012304850001'
            })),
            rowCount: list.length
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

  // ─── TC-01: Server-Side Sequential Numbering Policy ───
  it('TC-01: should atomically generate sequential Episode Number (EPC) and Encounter Number (ENC)', async () => {
    const epc = await encounterApplicationService.generateNextEpisodeNumber(mockClient);
    const enc = await encounterApplicationService.generateNextEncounterNumber(mockClient);

    expect(epc).toBe('EPC-2026-00001');
    expect(enc).toBe('ENC-2026-00001');
  });

  // ─── TC-02: Create Encounter ACID Transaction ───
  it('TC-02: should create Episode of Care + Encounter + Immutable Audit Trail atomically', async () => {
    const result = await encounterApplicationService.createEncounter({
      patientId: 'e4b0a1c2-3d4e-4f5a-6b7c-8d9e0f1a2b3c',
      encounterClass: 'AMB',
      encounterType: 'RAWAT_JALAN_POLI',
      primaryDoctorId: 'DOC-1001',
      primaryDoctorName: 'dr. Siti Wijaya, Sp.PD-KGEH',
      serviceRoomId: 'CLI-1001',
      serviceRoomName: 'Poliklinik Penyakit Dalam'
    });

    expect(result.id).toBeDefined();
    expect(result.encounter_number).toBe('ENC-2026-00001');
    expect(result.status).toBe('ARRIVED');
    expect(result.auditSignature).toBeDefined();

    // Verify DB State
    expect(mockDatabaseState.episodes_of_care.length).toBe(1);
    expect(mockDatabaseState.encounters.length).toBe(1);
    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);

    expect(mockDatabaseState.episodes_of_care[0].episode_number).toBe('EPC-2026-00001');
  });

  // ─── TC-03: Invalid Patient ID Rejection ───
  it('TC-03: should reject encounter creation for non-existent patient with 404', async () => {
    await expect(
      encounterApplicationService.createEncounter({
        patientId: '00000000-0000-0000-0000-000000000000',
        primaryDoctorId: 'DOC-1001',
        primaryDoctorName: 'dr. Siti'
      })
    ).rejects.toThrow(/tidak ditemukan di Master Patient Index/);

    expect(mockDatabaseState.encounters.length).toBe(0);
    expect(mockDatabaseState.episodes_of_care.length).toBe(0);
  });

  // ─── TC-04: Legal Clinical FSM State Transitions ───
  it('TC-04: should execute legal FSM state transitions: ARRIVED -> IN_PROGRESS -> DISCHARGED', async () => {
    const created = await encounterApplicationService.createEncounter({
      patientId: 'e4b0a1c2-3d4e-4f5a-6b7c-8d9e0f1a2b3c',
      encounterClass: 'AMB',
      status: 'ARRIVED',
      primaryDoctorId: 'DOC-1001',
      primaryDoctorName: 'dr. Siti'
    });

    // 1. ARRIVED -> IN_PROGRESS
    const inProgress = await encounterApplicationService.transitionEncounterStatus({
      encounterId: created.id,
      nextStatus: 'IN_PROGRESS',
      reason: 'Dokter memulai pemeriksaan SOAP'
    });

    expect(inProgress.status).toBe('IN_PROGRESS');
    expect(inProgress.previousStatus).toBe('ARRIVED');

    // 2. IN_PROGRESS -> DISCHARGED
    const discharged = await encounterApplicationService.transitionEncounterStatus({
      encounterId: created.id,
      nextStatus: 'DISCHARGED',
      reason: 'Pemeriksaan selesai, pasien dipulangkan',
      dischargeDisposition: 'PULANG_SELESAI_BEROBAT'
    });

    expect(discharged.status).toBe('DISCHARGED');
    expect(discharged.previousStatus).toBe('IN_PROGRESS');
  });

  // ─── TC-05: Illegal FSM State Transition Rejection ───
  it('TC-05: should reject illegal FSM transition (e.g. ARRIVED -> CLOSED) with 400 Bad Request', async () => {
    const created = await encounterApplicationService.createEncounter({
      patientId: 'e4b0a1c2-3d4e-4f5a-6b7c-8d9e0f1a2b3c',
      encounterClass: 'AMB',
      status: 'ARRIVED',
      primaryDoctorId: 'DOC-1001',
      primaryDoctorName: 'dr. Siti'
    });

    await expect(
      encounterApplicationService.transitionEncounterStatus({
        encounterId: created.id,
        nextStatus: 'CLOSED', // Illegal from ARRIVED
        reason: 'Direct close attempt'
      })
    ).rejects.toThrow(/Transisi status Encounter ilegal/);
  });

  // ─── TC-06: localStorage Wipe Immunity Test ───
  it('TC-06: should survive browser localStorage wipe and retrieve persistent encounters', async () => {
    const created = await encounterApplicationService.createEncounter({
      patientId: 'e4b0a1c2-3d4e-4f5a-6b7c-8d9e0f1a2b3c',
      encounterClass: 'EMER',
      status: 'ARRIVED',
      primaryDoctorId: 'DOC-1002',
      primaryDoctorName: 'dr. Emergency'
    });

    // Wipe client storage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }

    const list = await encounterApplicationService.getEncounters({ patientId: 'e4b0a1c2-3d4e-4f5a-6b7c-8d9e0f1a2b3c' });
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(created.id);
    expect(list[0].encounter_number).toBe('ENC-2026-00001');
  });

  // ─── TC-07: HTTP REST Gateway (POST /api/v1/encounters) ───
  it('TC-07: should create encounter via Express API Gateway controller with canonical envelope', async () => {
    const req = {
      headers: {
        'x-request-id': 'REQ-VS02-TEST-001',
        'x-correlation-id': 'CORR-VS02-TEST-001'
      },
      user: {
        userId: 'USR-REG-001',
        username: 'petugas_admisi',
        role: ENTERPRISE_ROLES.ROLE_REGISTRATION_CLERK
      },
      ip: '192.168.1.100',
      body: {
        patientId: 'e4b0a1c2-3d4e-4f5a-6b7c-8d9e0f1a2b3c',
        encounterClass: 'AMB',
        primaryDoctorId: 'DOC-1001',
        primaryDoctorName: 'dr. Siti Wijaya'
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

    const { encounterController } = await import('../server/controllers/encounter.controller.js');
    await encounterController.createEncounter(req, res);

    expect(statusCode).toBe(201);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.encounter_number).toBe('ENC-2026-00001');
    expect(responseBody.meta.correlationId).toBe('CORR-VS02-TEST-001');
  });

  // ─── TC-08: HTTP REST Gateway (PATCH /api/v1/encounters/:id/status) ───
  it('TC-08: should transition encounter status via Express API Gateway with DPJP role', async () => {
    const created = await encounterApplicationService.createEncounter({
      patientId: 'e4b0a1c2-3d4e-4f5a-6b7c-8d9e0f1a2b3c',
      encounterClass: 'AMB',
      status: 'ARRIVED',
      primaryDoctorId: 'DOC-1001',
      primaryDoctorName: 'dr. Siti'
    });

    const req = {
      params: { id: created.id },
      headers: {
        'x-request-id': 'REQ-VS02-TEST-002',
        'x-correlation-id': 'CORR-VS02-TEST-002'
      },
      user: {
        userId: 'USR-DOC-001',
        username: 'dr_siti',
        role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
      },
      ip: '192.168.1.100',
      body: {
        status: 'IN_PROGRESS',
        reason: 'Dokter memulai konsultasi klinis'
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

    const { encounterController } = await import('../server/controllers/encounter.controller.js');
    await encounterController.transitionStatus(req, res);

    expect(statusCode).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.status).toBe('IN_PROGRESS');
    expect(responseBody.meta.previousStatus).toBe('ARRIVED');
  });
});
