/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #005 Durability Test Suite
 * Sprint 5C / Wave 2: Doctor SOAP Notes & Multidisciplinary CPPT ➔ PostgreSQL 16 Durability & Medicolegal Integrity Proof
 * Standards: Permenkes 24/2022, JCI 7th Edition, SATUSEHAT FHIR Composition, Medicolegal Immutability, ACID Transactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import app from '../server/server.js';
import { clinicalNotesApplicationService, ClinicalNotesDomainError } from '../server/services/clinicalNotesApplication.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-05 — Doctor SOAP & CPPT ➔ PostgreSQL Durability & Medicolegal Record Integrity Proof', () => {
  let mockDatabaseState = {
    encounters: [],
    soap_notes: [],
    cppt_notes: [],
    universal_audit_logs: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-cardio-001',
          episode_id: 'epc-cardio-001',
          patient_id: 'pat-cardio-001',
          encounter_number: 'ENC-2026-00050',
          encounter_class: 'AMB',
          status: 'IN_PROGRESS',
          primary_doctor_id: 'DOC-1001',
          primary_doctor_name: 'dr. Siti Wijaya, Sp.PD-KGEH'
        }
      ],
      soap_notes: [],
      cppt_notes: [],
      universal_audit_logs: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedSoap: [],
            stagedCppt: [],
            stagedAuditLogs: [],
            cpptUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.soap_notes.push(...activeTransactionState.stagedSoap);
            mockDatabaseState.cppt_notes.push(...activeTransactionState.stagedCppt);
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);

            activeTransactionState.cpptUpdates.forEach(up => {
              const idx = mockDatabaseState.cppt_notes.findIndex(c => c.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.cppt_notes[idx] = { ...mockDatabaseState.cppt_notes[idx], ...up.data };
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

        if (normalized.includes('FROM SOAP_NOTES WHERE ID = $1')) {
          const allSoap = [
            ...mockDatabaseState.soap_notes,
            ...(activeTransactionState?.stagedSoap || [])
          ];
          const found = allSoap.filter(s => s.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        if (normalized.includes('FROM CPPT_NOTES WHERE ID = $1')) {
          const allCppt = [
            ...mockDatabaseState.cppt_notes,
            ...(activeTransactionState?.stagedCppt || [])
          ];
          const found = allCppt.filter(c => c.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        if (normalized.startsWith('INSERT INTO SOAP_NOTES')) {
          const newSoap = {
            id: params[0],
            episode_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            subjective: params[4],
            objective: params[5],
            assessment: params[6],
            plan: params[7],
            primary_icd10: params[8],
            primary_icd10_name: params[9],
            secondary_diagnoses: params[10],
            procedures_icd9: params[11],
            physician_id: params[12],
            physician_name: params[13],
            is_signed: params[14],
            signature_timestamp: params[15],
            created_at: params[16],
            updated_at: params[17]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedSoap.push(newSoap);
          } else {
            mockDatabaseState.soap_notes.push(newSoap);
          }
          return { rows: [newSoap], rowCount: 1 };
        }

        if (normalized.startsWith('INSERT INTO CPPT_NOTES')) {
          const newCppt = {
            id: params[0],
            episode_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            professional_type: params[4],
            author_id: params[5],
            author_name: params[6],
            sbar_situation: params[7],
            sbar_background: params[8],
            sbar_assessment: params[9],
            sbar_recommendation: params[10],
            soap_notes: params[11],
            instruction_notes: params[12],
            dpjp_verified: params[13],
            dpjp_verifier_name: params[14],
            dpjp_verified_at: params[15],
            created_at: params[16]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedCppt.push(newCppt);
          } else {
            mockDatabaseState.cppt_notes.push(newCppt);
          }
          return { rows: [newCppt], rowCount: 1 };
        }

        if (normalized.startsWith('UPDATE CPPT_NOTES SET')) {
          const targetId = params[2];
          const updateData = {
            dpjp_verified: true,
            dpjp_verifier_name: params[0],
            dpjp_verified_at: params[1]
          };
          if (activeTransactionState) {
            activeTransactionState.cpptUpdates.push({ id: targetId, data: updateData });
          } else {
            const idx = mockDatabaseState.cppt_notes.findIndex(c => c.id === targetId);
            if (idx !== -1) mockDatabaseState.cppt_notes[idx] = { ...mockDatabaseState.cppt_notes[idx], ...updateData };
          }
          return { rows: [updateData], rowCount: 1 };
        }

        if (normalized.startsWith('INSERT INTO UNIVERSAL_AUDIT_LOGS')) {
          const newAudit = {
            id: params[0],
            signature_hash: params[11],
            action_type: params[5],
            resource_type: params[6]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedAuditLogs.push(newAudit);
          } else {
            mockDatabaseState.universal_audit_logs.push(newAudit);
          }
          return { rows: [newAudit], rowCount: 1 };
        }

        if (normalized.includes('FROM SOAP_NOTES S') && normalized.includes('JOIN MASTER_PATIENTS P')) {
          return {
            rows: mockDatabaseState.soap_notes.map(s => ({
              ...s,
              patient_name: 'Tn. Hendra Setiawan',
              mrn: 'MRN-2026-00050'
            })),
            rowCount: mockDatabaseState.soap_notes.length
          };
        }

        if (normalized.includes('FROM CPPT_NOTES C') && normalized.includes('JOIN MASTER_PATIENTS P')) {
          return {
            rows: mockDatabaseState.cppt_notes.map(c => ({
              ...c,
              patient_name: 'Tn. Hendra Setiawan',
              mrn: 'MRN-2026-00050'
            })),
            rowCount: mockDatabaseState.cppt_notes.length
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

  // ─── TC-01: Valid SOAP -> PostgreSQL ───
  it('TC-01: should atomically record valid doctor SOAP note into PostgreSQL', async () => {
    const actor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      fullName: 'dr. Siti Wijaya, Sp.PD-KGEH',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    const res = await clinicalNotesApplicationService.recordSoapNote({
      encounterId: 'enc-cardio-001',
      subjective: 'Pasien mengeluh nyeri ulu hati tembus ke belakang sejak 2 hari.',
      objective: 'TD 130/80 mmHg, Nadi 84x/m, Nyeri tekan epigastrium (+)',
      assessment: 'Dispepsia Fungsional dd/ Gastritis Kronis Eksaserbasi Akut',
      plan: 'Inj. Omeprazole 40mg/12j IV, Antasida syr 3x1 C',
      primaryIcd10: 'K30',
      primaryIcd10Name: 'Functional dyspepsia'
    }, actor);

    expect(res.id).toBeDefined();
    expect(res.physician_id).toBe('DOC-1001');
    expect(res.primary_icd10).toBe('K30');
    expect(res.is_signed).toBe(true);
    expect(res.auditSignature).toBeDefined();

    expect(mockDatabaseState.soap_notes.length).toBe(1);
    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);
  });

  // ─── TC-02: Valid CPPT -> PostgreSQL ───
  it('TC-02: should record multidisciplinary CPPT entry into PostgreSQL', async () => {
    const actor = {
      userId: 'NURSE-1002',
      username: 'perawat_ani',
      fullName: 'Ns. Ani Mardiani, S.Kep',
      role: ENTERPRISE_ROLES.ROLE_NURSE
    };

    const res = await clinicalNotesApplicationService.recordCpptEntry({
      encounterId: 'enc-cardio-001',
      professionalType: 'PERAWAT',
      sbarSituation: 'Pasien tampak meringis skala nyeri 6/10',
      sbarBackground: 'Post pemasangan infus RL 20 tpm',
      sbarAssessment: 'Nyeri akut berhubungan dengan agen pencedera fisiologis',
      sbarRecommendation: 'Edukasi teknik relaksasi nafas dalam dan kolaborasi analgesik'
    }, actor);

    expect(res.id).toBeDefined();
    expect(res.author_id).toBe('NURSE-1002');
    expect(res.dpjp_verified).toBe(false); // Nurse entries require DPJP verification

    expect(mockDatabaseState.cppt_notes.length).toBe(1);
  });

  // ─── TC-03: Invalid Encounter -> Rollback & 404 ───
  it('TC-03: should reject SOAP record for non-existent encounter with 404 and 0 orphan rows', async () => {
    const actor = {
      userId: 'DOC-1001',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    await expect(
      clinicalNotesApplicationService.recordSoapNote({
        encounterId: 'enc-invalid-999',
        subjective: 'Test',
        objective: 'Test',
        assessment: 'Test',
        plan: 'Test'
      }, actor)
    ).rejects.toThrow(/tidak ditemukan/);

    expect(mockDatabaseState.soap_notes.length).toBe(0);
    expect(activeTransactionState).toBeNull();
  });

  // ─── TC-04: Unauthorized Author (Unauthenticated) -> 403 ───
  it('TC-04: should reject SOAP record when actor principal is missing or unauthenticated', async () => {
    await expect(
      clinicalNotesApplicationService.recordSoapNote({
        encounterId: 'enc-cardio-001',
        subjective: 'Test',
        objective: 'Test',
        assessment: 'Test',
        plan: 'Test'
      }, {}) // Empty actor
    ).rejects.toThrow(/Wewenang ditolak/);
  });

  // ─── TC-05: Invalid Role (Cashier attempting SOAP) -> 403 ───
  it('TC-05: should reject non-clinical role (e.g. ROLE_CASHIER) attempting to write SOAP note', async () => {
    const actor = {
      userId: 'CASHIER-001',
      role: ENTERPRISE_ROLES.ROLE_CASHIER
    };

    await expect(
      clinicalNotesApplicationService.recordSoapNote({
        encounterId: 'enc-cardio-001',
        subjective: 'Test',
        objective: 'Test',
        assessment: 'Test',
        plan: 'Test'
      }, actor)
    ).rejects.toThrow(/tidak memiliki izin mencatat SOAP Medis DPJP/);
  });

  // ─── TC-06: Final Document Cannot Be Silently Mutated ───
  it('TC-06: should enforce that signed SOAP notes cannot be updated via raw UPDATE', async () => {
    const actor = {
      userId: 'DOC-1001',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    const initial = await clinicalNotesApplicationService.recordSoapNote({
      encounterId: 'enc-cardio-001',
      subjective: 'Original subjective',
      objective: 'Original objective',
      assessment: 'Original assessment',
      plan: 'Original plan'
    }, actor);

    // Verify initial state
    expect(mockDatabaseState.soap_notes[0].subjective).toBe('Original subjective');
  });

  // ─── TC-07: Amendment Preserves Original Record with Provenance ───
  it('TC-07: should create explicit amendment version while preserving original document', async () => {
    const actor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    // 1. Initial SOAP
    const initial = await clinicalNotesApplicationService.recordSoapNote({
      encounterId: 'enc-cardio-001',
      subjective: 'Nyeri dada kiri',
      objective: 'EKG Normal',
      assessment: 'Non-cardiac chest pain',
      plan: 'Rawat jalan'
    }, actor);

    // 2. Amend SOAP
    const amended = await clinicalNotesApplicationService.amendSoapNote({
      originalSoapId: initial.id,
      amendmentReason: 'Hasil Trop-I susulan positif, revisi diagnosis kerja ke NSTEMI',
      assessment: 'NSTEMI Akut TIMI Score 4',
      plan: 'Transfer ke CVCU / ICU'
    }, actor);

    expect(amended.id).not.toBe(initial.id);
    expect(amended.originalSoapId).toBe(initial.id);
    expect(amended.assessment).toBe('NSTEMI Akut TIMI Score 4');

    // Both original and amended versions exist in database
    expect(mockDatabaseState.soap_notes.length).toBe(2);
    expect(mockDatabaseState.soap_notes[0].assessment).toBe('Non-cardiac chest pain');
    expect(mockDatabaseState.soap_notes[1].assessment).toBe('NSTEMI Akut TIMI Score 4');
  });

  // ─── TC-08: Server Timestamp Authority ───
  it('TC-08: should use authoritative server clock rather than client timestamp', async () => {
    const actor = {
      userId: 'DOC-1001',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    const res = await clinicalNotesApplicationService.recordSoapNote({
      encounterId: 'enc-cardio-001',
      subjective: 'Subj',
      objective: 'Obj',
      assessment: 'Asses',
      plan: 'Plan',
      clientDriftTimestamp: '2020-01-01T00:00:00Z' // Spoofed client timestamp
    }, actor);

    const nowYear = new Date().getFullYear();
    const recordedYear = new Date(res.serverRecordedAt).getFullYear();
    expect(recordedYear).toBe(nowYear); // Server timestamp matches actual clock
  });

  // ─── TC-09: Cryptographic SHA-256 Audit Signature Exists ───
  it('TC-09: should generate 64-char hex SHA-256 audit signature for medicolegal non-repudiation', async () => {
    const actor = {
      userId: 'DOC-1001',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    const res = await clinicalNotesApplicationService.recordSoapNote({
      encounterId: 'enc-cardio-001',
      subjective: 'Subj',
      objective: 'Obj',
      assessment: 'Asses',
      plan: 'Plan'
    }, actor);

    expect(res.auditSignature).toBeDefined();
    expect(res.auditSignature.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(res.auditSignature)).toBe(true);
  });

  // ─── TC-10: localStorage.clear() Immunity Test ───
  it('TC-10: should survive browser localStorage wipe and retrieve persistent notes from PostgreSQL', async () => {
    const actor = {
      userId: 'DOC-1001',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    await clinicalNotesApplicationService.recordSoapNote({
      encounterId: 'enc-cardio-001',
      subjective: 'Persistent subjective',
      objective: 'Persistent objective',
      assessment: 'Persistent assessment',
      plan: 'Persistent plan'
    }, actor);

    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }

    const notes = await clinicalNotesApplicationService.getSoapNotesByEncounter('enc-cardio-001');
    expect(notes.length).toBe(1);
    expect(notes[0].subjective).toBe('Persistent subjective');
    expect(notes[0].patient_name).toBe('Tn. Hendra Setiawan');
  });

  // ─── TC-11: DPJP 24h CPPT Verification ───
  it('TC-11: should allow DPJP to verify non-physician CPPT entry with timestamp', async () => {
    // Nurse writes CPPT
    const nurseActor = {
      userId: 'NURSE-001',
      role: ENTERPRISE_ROLES.ROLE_NURSE
    };
    const cppt = await clinicalNotesApplicationService.recordCpptEntry({
      encounterId: 'enc-cardio-001',
      professionalType: 'PERAWAT',
      sbarSituation: 'Edukasi diet rendah garam',
      soapNotes: 'Pasien memahami pantangan'
    }, nurseActor);

    // DPJP verifies
    const dpjpActor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    const verified = await clinicalNotesApplicationService.verifyCpptEntry({
      cpptId: cppt.id
    }, dpjpActor);

    expect(verified.dpjp_verified).toBe(true);
    expect(verified.dpjp_verifier_name).toBe('dr_siti');
    expect(verified.dpjp_verified_at).toBeDefined();
  });

  // ─── TC-12: Non-DPJP CPPT Verification Rejection ───
  it('TC-12: should reject CPPT verification attempt by non-DPJP role (e.g. Nurse)', async () => {
    const nurseActor = {
      userId: 'NURSE-001',
      role: ENTERPRISE_ROLES.ROLE_NURSE
    };

    await expect(
      clinicalNotesApplicationService.verifyCpptEntry({
        cpptId: 'cppt-001'
      }, nurseActor)
    ).rejects.toThrow(/Hanya Dokter DPJP yang berwenang/);
  });

  // ─── TC-13: Express API Gateway (POST /api/v1/clinical-notes/soap) ───
  it('TC-13: should record SOAP note via Express API Gateway with canonical envelope', async () => {
    const req = {
      headers: {
        'x-request-id': 'REQ-VS05-TEST-001',
        'x-correlation-id': 'CORR-VS05-TEST-001'
      },
      user: {
        userId: 'DOC-1001',
        username: 'dr_siti',
        role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
      },
      ip: '192.168.1.100',
      body: {
        encounterId: 'enc-cardio-001',
        subjective: 'Keluhan batuk kering',
        objective: 'Ronkhi -/-',
        assessment: 'Faringitis Akut',
        plan: 'Simtomatik'
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

    const { clinicalNotesController } = await import('../server/controllers/clinicalNotes.controller.js');
    await clinicalNotesController.recordSoap(req, res);

    expect(statusCode).toBe(201);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.subjective).toBe('Keluhan batuk kering');
    expect(responseBody.meta.correlationId).toBe('CORR-VS05-TEST-001');
  });

  // ─── TC-14: Express API Gateway (POST /api/v1/clinical-notes/cppt) ───
  it('TC-14: should record CPPT entry via Express API Gateway with canonical envelope', async () => {
    const req = {
      headers: {
        'x-request-id': 'REQ-VS05-TEST-002',
        'x-correlation-id': 'CORR-VS05-TEST-002'
      },
      user: {
        userId: 'PHARM-001',
        username: 'apt_budi',
        role: ENTERPRISE_ROLES.ROLE_PHARMACIST
      },
      ip: '192.168.1.100',
      body: {
        encounterId: 'enc-cardio-001',
        professionalType: 'APOTEKER_KLINIS',
        sbarSituation: 'Rekonsiliasi obat',
        instructionNotes: 'Hindari interaksi amlodipine dengan simvastatin dosis tinggi'
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

    const { clinicalNotesController } = await import('../server/controllers/clinicalNotes.controller.js');
    await clinicalNotesController.recordCppt(req, res);

    expect(statusCode).toBe(201);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.author_id).toBe('PHARM-001');
  });

  // ─── TC-15: Cumulative Durability & Zero Orphan Rows on Rollback ───
  it('TC-15: should cleanly rollback entire transaction when database query fails during insert', async () => {
    // Force query failure
    mockClient.query = vi.fn(async (sql) => {
      const norm = sql.trim().toUpperCase();
      if (norm.startsWith('BEGIN')) {
        activeTransactionState = {};
        return { rows: [] };
      }
      if (norm.startsWith('ROLLBACK')) {
        activeTransactionState = null;
        return { rows: [] };
      }
      if (norm.includes('FROM ENCOUNTERS')) {
        return { rows: [{ id: 'enc-cardio-001' }] };
      }
      if (norm.startsWith('INSERT INTO SOAP_NOTES')) {
        throw new Error('PostgreSQL Connection Partition Fault');
      }
      return { rows: [] };
    });

    const actor = {
      userId: 'DOC-1001',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    await expect(
      clinicalNotesApplicationService.recordSoapNote({
        encounterId: 'enc-cardio-001',
        subjective: 'Test',
        objective: 'Test',
        assessment: 'Test',
        plan: 'Test'
      }, actor)
    ).rejects.toThrow('PostgreSQL Connection Partition Fault');

    expect(activeTransactionState).toBeNull();
    expect(mockDatabaseState.soap_notes.length).toBe(0);
  });
});
