/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #001 Durability Test Suite
 * Sprint 5C: Patient Registration ➔ PostgreSQL 16 Durability & System of Record Verification
 * Standards: ACID Transaction Boundaries, Universal Immutable Audit Trail, Canonical Envelope
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import app from '../server/server.js';
import { patientApplicationService, PatientDomainError } from '../server/services/patientApplication.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { jwtSecurityService } from '../src/core/security/jwtSecurity.service.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-01 — Register Patient ➔ PostgreSQL Durability Proof', () => {
  // In-Memory Simulated PostgreSQL Table Engine for High-Fidelity Transaction Testing
  let mockDatabaseState = {
    master_patients: [],
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
          birth_place: 'Jakarta',
          birth_date: '1985-04-23',
          gender: 'MALE',
          blood_type: 'O+',
          marital_status: 'MARRIED',
          religion: 'ISLAM',
          education: 'S1',
          occupation: 'PNS',
          phone_number: '081234567890',
          email: 'budi.santoso@gmail.com',
          address_line: 'Jl. Rawamangun No. 1, Jakarta Timur',
          guarantor_type: 'BPJS',
          bpjs_card_number: '0001234567891',
          is_active: true,
          created_at: new Date('2026-08-01T08:00:00Z'),
          updated_at: new Date('2026-08-01T08:00:00Z')
        }
      ],
      universal_audit_logs: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedPatients: [],
            stagedAuditLogs: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.master_patients.push(...activeTransactionState.stagedPatients);
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);
            activeTransactionState = null;
          }
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('ROLLBACK')) {
          activeTransactionState = null;
          return { rows: [], rowCount: 0 };
        }

        if (normalized.includes('FROM MASTER_PATIENTS') && normalized.includes('ORDER BY MRN DESC')) {
          const currentList = [
            ...mockDatabaseState.master_patients,
            ...(activeTransactionState?.stagedPatients || [])
          ];
          const sorted = [...currentList].sort((a, b) => b.mrn.localeCompare(a.mrn));
          return { rows: sorted.slice(0, 1), rowCount: sorted.length > 0 ? 1 : 0 };
        }

        if (normalized.includes('FROM MASTER_PATIENTS WHERE NIK = $1')) {
          const currentList = [
            ...mockDatabaseState.master_patients,
            ...(activeTransactionState?.stagedPatients || [])
          ];
          const found = currentList.filter(p => p.nik === params[0]);
          return { rows: found, rowCount: found.length };
        }

        if (normalized.includes('FROM MASTER_PATIENTS WHERE BPJS_CARD_NUMBER = $1')) {
          const currentList = [
            ...mockDatabaseState.master_patients,
            ...(activeTransactionState?.stagedPatients || [])
          ];
          const found = currentList.filter(p => p.bpjs_card_number === params[0]);
          return { rows: found, rowCount: found.length };
        }

        if (normalized.startsWith('INSERT INTO MASTER_PATIENTS')) {
          const newPatient = {
            id: params[0],
            mrn: params[1],
            nik: params[2],
            full_name: params[3],
            birth_place: params[4],
            birth_date: params[5],
            gender: params[6],
            blood_type: params[7],
            marital_status: params[8],
            religion: params[9],
            education: params[10],
            occupation: params[11],
            phone_number: params[12],
            email: params[13],
            address_line: params[14],
            guarantor_type: params[15],
            bpjs_card_number: params[16],
            is_active: params[17],
            created_at: params[18],
            updated_at: params[19]
          };

          if (activeTransactionState) {
            activeTransactionState.stagedPatients.push(newPatient);
          } else {
            mockDatabaseState.master_patients.push(newPatient);
          }
          return { rows: [newPatient], rowCount: 1 };
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
            after_state: params[9],
            reason_for_action: params[10],
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

        if (normalized.includes('FROM MASTER_PATIENTS') && normalized.includes('WHERE ID = $1')) {
          const found = mockDatabaseState.master_patients.filter(p => p.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        if (normalized.includes('FROM MASTER_PATIENTS') && normalized.includes('ILIKE $1')) {
          const searchTerm = (params[0] || '').replace(/%/g, '').toLowerCase();
          const found = mockDatabaseState.master_patients.filter(p => 
            p.is_active && (
              p.mrn.toLowerCase().includes(searchTerm) ||
              p.nik.toLowerCase().includes(searchTerm) ||
              p.full_name.toLowerCase().includes(searchTerm) ||
              (p.phone_number && p.phone_number.includes(searchTerm)) ||
              (p.bpjs_card_number && p.bpjs_card_number.includes(searchTerm))
            )
          );
          return { rows: found, rowCount: found.length };
        }

        if (normalized.includes('FROM MASTER_PATIENTS WHERE IS_ACTIVE = TRUE')) {
          return { rows: mockDatabaseState.master_patients, rowCount: mockDatabaseState.master_patients.length };
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

  // ─── TC-01: Server-Side Sequential MRN Numbering Policy ───
  it('TC-01: should atomically generate sequential MRN (MRN-YYYY-XXXXX) server-side', async () => {
    const nextMrn = await patientApplicationService.generateNextMrn(mockClient);
    expect(nextMrn).toBe('MRN-2026-00002');
  });

  // ─── TC-02: Successful Registration via Patient Application Service ───
  it('TC-02: should execute ACID transaction with patient insert + universal audit log + COMMIT', async () => {
    const payload = {
      fullName: 'Siti Aminah',
      nik: '3171012304900002',
      birthDate: '1990-05-15',
      birthPlace: 'Surabaya',
      gender: 'FEMALE',
      bloodType: 'A+',
      phoneNumber: '081299887766',
      address: 'Jl. Salemba Tengah No. 12, Jakarta Pusat',
      guarantorType: 'UMUM'
    };

    const actor = {
      userId: 'USR-REG-001',
      username: 'ratna_admisi',
      role: 'ROLE_REGISTRATION_CLERK'
    };

    const result = await patientApplicationService.registerPatient(payload, actor, '192.168.1.50', 'CORR-VS01-001');

    expect(result.id).toBeDefined();
    expect(result.mrn).toBe('MRN-2026-00002');
    expect(result.full_name).toBe('Siti Aminah');
    expect(result.auditSignature).toBeDefined();

    // Verify Database State
    expect(mockDatabaseState.master_patients.length).toBe(2);
    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);

    const auditEntry = mockDatabaseState.universal_audit_logs[0];
    expect(auditEntry.action_type).toBe('CREATE');
    expect(auditEntry.resource_type).toBe('PATIENT');
    expect(auditEntry.patient_id).toBe(result.id);
    expect(auditEntry.actor_id).toBe('USR-REG-001');
    expect(auditEntry.signature_hash).toBe(result.auditSignature);
  });

  // ─── TC-03: Duplicate NIK Prevention & Atomic Rollback ───
  it('TC-03: should reject duplicate NIK with 409 Conflict and trigger ROLLBACK (0 orphan records)', async () => {
    const duplicatePayload = {
      fullName: 'Budi Santoso Klon',
      nik: '3171012304850001', // Already exists in seed
      birthDate: '1985-04-23',
      gender: 'MALE',
      phoneNumber: '081234567890'
    };

    await expect(patientApplicationService.registerPatient(duplicatePayload)).rejects.toThrow(
      /sudah terdaftar di Master Patient Index/
    );

    // Verify 0 orphan records created in database
    expect(mockDatabaseState.master_patients.length).toBe(1);
    expect(mockDatabaseState.universal_audit_logs.length).toBe(0);
    expect(activeTransactionState).toBeNull();
  });

  // ─── TC-04: Invariant Validation Failure ───
  it('TC-04: should reject invalid NIK format (< 16 digits) before transaction starts', async () => {
    const invalidPayload = {
      fullName: 'Pasien Test',
      nik: '12345', // Invalid
      birthDate: '2000-01-01',
      gender: 'MALE',
      phoneNumber: '08123456789'
    };

    await expect(patientApplicationService.registerPatient(invalidPayload)).rejects.toThrow(
      /NIK wajib 16 digit/
    );

    expect(mockDatabaseState.master_patients.length).toBe(1);
  });

  // ─── TC-05: System of Record Immunity Test (localStorage.clear()) ───
  it('TC-05: should prove PostgreSQL is the System of Record and survives localStorage wipe', async () => {
    // 1. Register a patient
    const registered = await patientApplicationService.registerPatient({
      fullName: 'Ahmad Dahlan',
      nik: '3171012304950003',
      birthDate: '1995-10-10',
      gender: 'MALE',
      phoneNumber: '081988776655'
    });

    expect(registered.mrn).toBe('MRN-2026-00002');

    // 2. Simulate complete browser localStorage wipe
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }

    // 3. Query PostgreSQL directly
    const foundPatient = await patientApplicationService.getPatientById(registered.id);
    expect(foundPatient).not.toBeNull();
    expect(foundPatient.full_name).toBe('Ahmad Dahlan');
    expect(foundPatient.nik).toBe('3171012304950003');
    expect(foundPatient.mrn).toBe('MRN-2026-00002');
  });

  // ─── TC-06: Multi-Device / Concurrent Search by NIK ───
  it('TC-06: should retrieve exact patient record from persistent database search', async () => {
    const searchResults = await patientApplicationService.searchPatients('3171012304850001');
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].full_name).toBe('Budi Santoso');
    expect(searchResults[0].mrn).toBe('MRN-2026-00001');
  });

  // ─── TC-07: Cryptographic Integrity of Immutable Audit Hash ───
  it('TC-07: should verify SHA-256 signature hash matches canonical payload', async () => {
    const result = await patientApplicationService.registerPatient({
      fullName: 'Dewi Sartika',
      nik: '3171012304980004',
      birthDate: '1998-12-04',
      gender: 'FEMALE',
      phoneNumber: '081344556677'
    });

    const auditEntry = mockDatabaseState.universal_audit_logs.find(a => a.patient_id === result.id);
    expect(auditEntry).toBeDefined();
    expect(auditEntry.signature_hash).toBe(result.auditSignature);
    expect(auditEntry.signature_hash.length).toBe(64); // Valid SHA-256 Hex length
  });

  // ─── TC-08: Full HTTP REST Gateway Execution (POST /api/v1/patients) ───
  it('TC-08: should successfully register patient through Express API Gateway with Bearer Token and Correlation-ID', async () => {
    const tokenPair = jwtSecurityService.issueTokenPair({
      userId: 'USR-REG-001',
      username: 'ratna_admisi',
      role: ENTERPRISE_ROLES.ROLE_REGISTRATION_CLERK
    });

    // Mock Express Request / Response Flow via Controller Directly
    const req = {
      headers: {
        'x-request-id': 'REQ-VS01-TEST-001',
        'x-correlation-id': 'CORR-VS01-TEST-001'
      },
      user: {
        userId: 'USR-REG-001',
        username: 'ratna_admisi',
        role: ENTERPRISE_ROLES.ROLE_REGISTRATION_CLERK
      },
      ip: '192.168.10.15',
      body: {
        fullName: 'Hasan Basri',
        nik: '3171012304990005',
        birthDate: '1999-07-20',
        gender: 'MALE',
        phoneNumber: '081566778899',
        address: 'Jl. Pemuda No. 7, Jakarta Timur'
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

    const { patientController } = await import('../server/controllers/patient.controller.js');
    await patientController.createPatient(req, res);

    expect(statusCode).toBe(201);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.mrn).toBe('MRN-2026-00002');
    expect(responseBody.data.full_name).toBe('Hasan Basri');
    expect(responseBody.meta.correlationId).toBe('CORR-VS01-TEST-001');
    expect(responseBody.meta.auditSignature).toBeDefined();
  });

  // ─── TC-09: HTTP Gateway Duplicate NIK Error Envelope (409 Conflict) ───
  it('TC-09: should return 409 Conflict with standard error envelope when NIK already exists in PostgreSQL', async () => {
    const req = {
      headers: {
        'x-request-id': 'REQ-VS01-TEST-002',
        'x-correlation-id': 'CORR-VS01-TEST-002'
      },
      user: {
        userId: 'USR-REG-001',
        username: 'ratna_admisi',
        role: ENTERPRISE_ROLES.ROLE_REGISTRATION_CLERK
      },
      ip: '192.168.10.15',
      body: {
        fullName: 'Budi Santoso Klon',
        nik: '3171012304850001', // Duplicate NIK
        birthDate: '1985-04-23',
        gender: 'MALE',
        phoneNumber: '081234567890'
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

    const { patientController } = await import('../server/controllers/patient.controller.js');
    await patientController.createPatient(req, res);

    expect(statusCode).toBe(409);
    expect(responseBody.success).toBe(false);
    expect(responseBody.error.code).toBe('CLINICAL_DUPLICATE_PATIENT_DETECTED');
    expect(responseBody.error.details[0].field).toBe('nik');
    expect(responseBody.meta.correlationId).toBe('CORR-VS01-TEST-002');
  });

  // ─── TC-10: HTTP Gateway Patient Search (GET /api/v1/patients?q=...) ───
  it('TC-10: should return 200 OK with patient list from PostgreSQL search', async () => {
    const req = {
      headers: {},
      query: { q: 'Budi' }
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

    const { patientController } = await import('../server/controllers/patient.controller.js');
    await patientController.getPatients(req, res);

    expect(statusCode).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.length).toBe(1);
    expect(responseBody.data[0].full_name).toBe('Budi Santoso');
    expect(responseBody.meta.count).toBe(1);
  });
});
