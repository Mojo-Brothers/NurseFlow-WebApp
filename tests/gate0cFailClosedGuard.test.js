/**
 * NurseFlow Enterprise HIS 2026 — Gate 0C Fail-Closed Database Guard Test Suite
 * Standards: ISO 27001, JCI Patient Safety & KARS Medicolegal Invariants
 * Proves that when PostgreSQL is unavailable, the system strictly FAILS CLOSED (503/500/400),
 * rejecting mutations and NEVER falling back to silent in-memory persistence.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bloodBankController } from '../server/controllers/bloodBank.controller.js';
import { staffPrivilegingController } from '../server/controllers/staffPrivileging.controller.js';
import { masterDataHubController } from '../server/controllers/masterDataHub.controller.js';
import { appointmentController } from '../server/controllers/appointment.controller.js';
import { enterpriseInventoryController } from '../server/controllers/enterpriseInventory.controller.js';
import { postgresPoolService } from '../server/db/postgresPool.js';

function createMockReqRes({ user, body = {}, query = {}, params = {}, headers = {} }) {
  const req = {
    user: user || { userId: 'USR-ADMIN-01', role: 'ROLE_SUPER_ADMIN', tenantId: '00000000-0000-0000-0000-000000000001' },
    body,
    query,
    params,
    headers: {
      'x-fail-closed': 'true',
      ...headers
    },
    ip: '127.0.0.1'
  };

  let statusCode = 200;
  let responseBody = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    },
    getStatusCode: () => statusCode,
    getBody: () => responseBody
  };

  return { req, res };
}

describe('Gate 0C Mandatory: PostgreSQL Fail-Closed & Zero Silent Fallback Verification', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalStrict = process.env.STRICT_FAIL_CLOSED;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    process.env.STRICT_FAIL_CLOSED = 'true';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.STRICT_FAIL_CLOSED = originalStrict;
    vi.restoreAllMocks();
  });

  it('0C.FC.1 — Blood Bank Intake must FAIL CLOSED on database outage (No silent memory insert)', async () => {
    const pool = postgresPoolService.getPool();
    vi.spyOn(pool, 'connect').mockRejectedValueOnce(new Error('FATAL: Connection to PostgreSQL refused on port 5432'));

    const { req, res } = createMockReqRes({
      body: {
        unitNumber: 'ISBT-FAIL-CLOSED-01',
        aboType: 'O',
        rhesusType: 'POSITIVE',
        volumeMl: 350
      }
    });

    await bloodBankController.intakeDonorUnit(req, res);

    expect(res.getStatusCode()).toBeGreaterThanOrEqual(400);
    expect(res.getBody().success).toBe(false);
    expect(res.getBody().error).toBeDefined();
  });

  it('0C.FC.2 — Staff Credential Registration must FAIL CLOSED on database outage', async () => {
    const pool = postgresPoolService.getPool();
    vi.spyOn(pool, 'connect').mockRejectedValueOnce(new Error('FATAL: database "nurseflow_enterprise_his" does not exist'));

    const { req, res } = createMockReqRes({
      body: {
        staffId: 'STAFF-FAIL-01',
        credentialType: 'STR',
        credentialNumber: 'STR-FAIL-001'
      }
    });

    await staffPrivilegingController.addCredential(req, res);

    expect(res.getStatusCode()).toBeGreaterThanOrEqual(400);
    expect(res.getBody().success).toBe(false);
  });

  it('0C.FC.3 — Inventory Stock Transfer must FAIL CLOSED on database outage (No uncommitted stock drift)', async () => {
    const pool = postgresPoolService.getPool();
    vi.spyOn(pool, 'connect').mockRejectedValueOnce(new Error('FATAL: Database cluster is in recovery mode'));

    const { req, res } = createMockReqRes({
      body: {
        sourceWarehouseId: 'WH-MAIN-PHARMACY',
        targetWarehouseId: 'EMERGENCY_DEPO',
        itemCode: 'MED-AMOX-500',
        quantity: 10
      }
    });

    await enterpriseInventoryController.transfer(req, res);

    expect(res.getStatusCode()).toBeGreaterThanOrEqual(400);
    expect(res.getBody().success).toBe(false);
    expect(res.getBody().error).toBe('TRANSFER_FAILED');
  });

  it('0C.FC.4 — Appointment Booking must FAIL CLOSED on database outage (No ghost appointments)', async () => {
    const pool = postgresPoolService.getPool();
    vi.spyOn(pool, 'connect').mockRejectedValueOnce(new Error('FATAL: Connection pool exhausted'));

    const { req, res } = createMockReqRes({
      body: {
        patientId: 'P-TEST-001',
        practitionerId: 'DOC-01',
        departmentId: 'POLI_DALAM',
        appointmentDate: '2026-09-01',
        slotTime: '09:00'
      }
    });

    await appointmentController.book(req, res);

    expect(res.getStatusCode()).toBeGreaterThanOrEqual(400);
    expect(res.getBody().success).toBe(false);
  });
});
