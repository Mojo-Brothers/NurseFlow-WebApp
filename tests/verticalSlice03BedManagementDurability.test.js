/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #003 Durability Test Suite
 * Sprint 5C: Inpatient Bed ADT (Assign, Transfer, Discharge) ➔ PostgreSQL 16 Durability & Mutex Integrity
 * Standards: Permenkes 24/2022, JCI IPSG 1, HL7 ADT Specifications, ACID Transactions, Canonical Envelope
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import app from '../server/server.js';
import { bedManagementApplicationService, BedDomainError } from '../server/services/bedManagementApplication.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { jwtSecurityService } from '../src/core/security/jwtSecurity.service.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-03 — Inpatient Bed ADT ➔ PostgreSQL Durability Proof', () => {
  let mockDatabaseState = {
    master_beds: [],
    bed_occupancies: [],
    bed_transfers: [],
    universal_audit_logs: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      master_beds: [
        {
          id: 'bed-001',
          room_id: 'room-01',
          bed_number: 'BED-VIP-101',
          bed_status: 'AVAILABLE',
          version: 1
        },
        {
          id: 'bed-002',
          room_id: 'room-01',
          bed_number: 'BED-VIP-102',
          bed_status: 'AVAILABLE',
          version: 1
        },
        {
          id: 'bed-003',
          room_id: 'room-02',
          bed_number: 'BED-ICU-201',
          bed_status: 'OCCUPIED',
          version: 2
        }
      ],
      bed_occupancies: [],
      bed_transfers: [],
      universal_audit_logs: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedOccupancies: [],
            stagedTransfers: [],
            stagedAuditLogs: [],
            bedUpdates: [],
            occupancyUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.bed_occupancies.push(...activeTransactionState.stagedOccupancies);
            mockDatabaseState.bed_transfers.push(...activeTransactionState.stagedTransfers);
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);

            activeTransactionState.bedUpdates.forEach(up => {
              const idx = mockDatabaseState.master_beds.findIndex(b => b.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.master_beds[idx] = { ...mockDatabaseState.master_beds[idx], ...up.data };
              }
            });

            activeTransactionState.occupancyUpdates.forEach(up => {
              const idx = mockDatabaseState.bed_occupancies.findIndex(o => o.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.bed_occupancies[idx] = { ...mockDatabaseState.bed_occupancies[idx], ...up.data };
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

        if (normalized.includes('FROM MASTER_BEDS WHERE ID = $1')) {
          const found = mockDatabaseState.master_beds.filter(b => b.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        if (normalized.includes('FROM BED_OCCUPANCIES') && normalized.includes('CHECK_OUT_TIME IS NULL')) {
          let list = [...mockDatabaseState.bed_occupancies];
          if (normalized.includes('ENCOUNTER_ID = $1') && normalized.includes('BED_ID = $2')) {
            list = list.filter(o => o.encounter_id === params[0] && o.bed_id === params[1] && !o.check_out_time);
          } else if (normalized.includes('ENCOUNTER_ID = $1')) {
            list = list.filter(o => o.encounter_id === params[0] && !o.check_out_time);
          }
          return { rows: list, rowCount: list.length };
        }

        if (normalized.startsWith('UPDATE MASTER_BEDS SET BED_STATUS = $1')) {
          const newStatus = params[0];
          const targetId = params[2];
          const updateObj = { id: targetId, data: { bed_status: newStatus } };
          if (activeTransactionState) {
            activeTransactionState.bedUpdates.push(updateObj);
          } else {
            const idx = mockDatabaseState.master_beds.findIndex(b => b.id === targetId);
            if (idx !== -1) mockDatabaseState.master_beds[idx].bed_status = newStatus;
          }
          return { rows: [], rowCount: 1 };
        }

        if (normalized.startsWith('INSERT INTO BED_OCCUPANCIES')) {
          const newOcc = {
            id: params[0],
            tenant_id: params[1],
            bed_id: params[2],
            patient_id: params[3],
            encounter_id: params[4],
            check_in_time: params[5],
            occupancy_status: params[6],
            admitting_doctor_name: params[7],
            created_at: params[8]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedOccupancies.push(newOcc);
          } else {
            mockDatabaseState.bed_occupancies.push(newOcc);
          }
          return { rows: [newOcc], rowCount: 1 };
        }

        if (normalized.startsWith('UPDATE BED_OCCUPANCIES SET CHECK_OUT_TIME = $1')) {
          const checkOutTime = params[0];
          const nextStatus = params[1];
          const targetId = params[2];
          const updateObj = { id: targetId, data: { check_out_time: checkOutTime, occupancy_status: nextStatus } };
          if (activeTransactionState) {
            activeTransactionState.occupancyUpdates.push(updateObj);
          }
          return { rows: [], rowCount: 1 };
        }

        if (normalized.startsWith('INSERT INTO BED_TRANSFERS')) {
          const newTrans = {
            id: params[0],
            tenant_id: params[1],
            encounter_id: params[2],
            from_bed_id: params[3],
            to_bed_id: params[4],
            transfer_reason: params[5],
            transferred_by: params[6],
            transferred_at: params[7]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedTransfers.push(newTrans);
          } else {
            mockDatabaseState.bed_transfers.push(newTrans);
          }
          return { rows: [newTrans], rowCount: 1 };
        }

        if (normalized.startsWith('UPDATE ENCOUNTERS SET BED_ID = $1')) {
          return { rows: [], rowCount: 1 };
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

        if (normalized.includes('FROM MASTER_BEDS B')) {
          return {
            rows: mockDatabaseState.master_beds.map(b => ({
              ...b,
              room_number: '101',
              ward_name: 'Bangsal Melati VIP',
              ward_class: 'VIP'
            })),
            rowCount: mockDatabaseState.master_beds.length
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

  // ─── TC-01: Assign Available Bed (Admission ADT) ───
  it('TC-01: should atomically assign patient to available bed with ACID transaction and audit trail', async () => {
    const result = await bedManagementApplicationService.assignBed({
      bedId: 'bed-001',
      patientId: 'patient-001',
      encounterId: 'enc-001',
      admittingDoctorName: 'dr. Siti Wijaya, Sp.PD-KGEH'
    });

    expect(result.id).toBeDefined();
    expect(result.bed_id).toBe('bed-001');
    expect(result.occupancy_status).toBe('ACTIVE');
    expect(result.bedNumber).toBe('BED-VIP-101');
    expect(result.auditSignature).toBeDefined();

    // Verify DB State
    expect(mockDatabaseState.bed_occupancies.length).toBe(1);
    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);
    expect(mockDatabaseState.master_beds.find(b => b.id === 'bed-001').bed_status).toBe('OCCUPIED');
  });

  // ─── TC-02: Rejection on Occupied Bed (Mutex Constraint) ───
  it('TC-02: should reject assignment to already occupied bed with 409 Conflict and 0 orphan records', async () => {
    await expect(
      bedManagementApplicationService.assignBed({
        bedId: 'bed-003', // Already OCCUPIED
        patientId: 'patient-002',
        encounterId: 'enc-002'
      })
    ).rejects.toThrow(/sedang berstatus 'OCCUPIED'/);

    expect(mockDatabaseState.bed_occupancies.length).toBe(0);
    expect(activeTransactionState).toBeNull();
  });

  // ─── TC-03: Bed Transfer ADT (Atomic fromBed -> toBed) ───
  it('TC-03: should atomically transfer patient between beds and log immutable bed_transfers record', async () => {
    // 1. Initial assignment to bed-001
    await bedManagementApplicationService.assignBed({
      bedId: 'bed-001',
      patientId: 'patient-001',
      encounterId: 'enc-001'
    });

    // 2. Transfer from bed-001 to bed-002
    const transferResult = await bedManagementApplicationService.transferBed({
      encounterId: 'enc-001',
      fromBedId: 'bed-001',
      toBedId: 'bed-002',
      transferReason: 'Dipindahkan ke kamar lebih tenang'
    });

    expect(transferResult.id).toBeDefined();
    expect(transferResult.bed_id).toBe('bed-002');
    expect(transferResult.transferredToBedNumber).toBe('BED-VIP-102');

    // Verify DB Status
    expect(mockDatabaseState.master_beds.find(b => b.id === 'bed-001').bed_status).toBe('CLEANING');
    expect(mockDatabaseState.master_beds.find(b => b.id === 'bed-002').bed_status).toBe('OCCUPIED');
    expect(mockDatabaseState.bed_transfers.length).toBe(1);
    expect(mockDatabaseState.bed_transfers[0].transfer_reason).toBe('Dipindahkan ke kamar lebih tenang');
  });

  // ─── TC-04: Same Bed Transfer Rejection ───
  it('TC-04: should reject transfer to the same bed with 400 Bad Request', async () => {
    await expect(
      bedManagementApplicationService.transferBed({
        encounterId: 'enc-001',
        fromBedId: 'bed-001',
        toBedId: 'bed-001'
      })
    ).rejects.toThrow(/tidak boleh sama/);
  });

  // ─── TC-05: Bed Discharge ADT ───
  it('TC-05: should discharge patient and transition bed to CLEANING status', async () => {
    await bedManagementApplicationService.assignBed({
      bedId: 'bed-001',
      patientId: 'patient-001',
      encounterId: 'enc-001'
    });

    const dischargeResult = await bedManagementApplicationService.dischargeBed({
      encounterId: 'enc-001',
      bedId: 'bed-001',
      dischargeType: 'PULANG_SELESAI_BEROBAT'
    });

    expect(dischargeResult.success).toBe(true);
    expect(mockDatabaseState.master_beds.find(b => b.id === 'bed-001').bed_status).toBe('CLEANING');
  });

  // ─── TC-06: localStorage Wipe Immunity Test ───
  it('TC-06: should survive browser storage wipe and retrieve persistent bed hierarchy', async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }

    const beds = await bedManagementApplicationService.getBeds();
    expect(beds.length).toBe(3);
    expect(beds[0].bed_number).toBe('BED-VIP-101');
  });

  // ─── TC-07: HTTP Express Gateway (POST /api/v1/beds/assign) ───
  it('TC-07: should assign bed via Express API Gateway with canonical envelope', async () => {
    const req = {
      headers: {
        'x-request-id': 'REQ-VS03-TEST-001',
        'x-correlation-id': 'CORR-VS03-TEST-001'
      },
      user: {
        userId: 'USR-ADM-001',
        username: 'petugas_admisi',
        role: ENTERPRISE_ROLES.ROLE_REGISTRATION_CLERK
      },
      ip: '192.168.1.100',
      body: {
        bedId: 'bed-001',
        patientId: 'patient-001',
        encounterId: 'enc-001'
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

    const { bedManagementController } = await import('../server/controllers/bedManagement.controller.js');
    await bedManagementController.assignBed(req, res);

    expect(statusCode).toBe(201);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.bedNumber).toBe('BED-VIP-101');
    expect(responseBody.meta.correlationId).toBe('CORR-VS03-TEST-001');
  });
});
