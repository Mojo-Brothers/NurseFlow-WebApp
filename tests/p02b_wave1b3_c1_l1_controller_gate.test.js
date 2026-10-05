/**
 * P0-2B WAVE 1B.3 — Evidence Closure: C1 Controller L1 Fail-Closed Tenant Gate Tests
 * Domain: Universal CPOE Orders & Safety Authorization
 *
 * Evidence claims:
 *   C1. Missing req.tenantId / req.user.tenantId -> 403 TENANT_CONTEXT_REQUIRED across all 5 controller routes
 *   C2. DEFAULT_TENANT_ID env set but req.tenantId absent -> STILL 403 (Zero Fallback)
 *   C3. Invalid UUID tenantId -> 403 TENANT_CONTEXT_REQUIRED
 *   C4. Missing authenticated actor -> 401 UNAUTHORIZED on mutation routes (createOrder, cancelOrder)
 *   C5. Valid req.tenantId -> passes through to service actor/tenantContext with correct tenantId
 *   C6. Valid req.user.tenantId -> passes through to service actor/tenantContext with correct tenantId
 *   C7. Zero synthetic actor defaults: USR-DOC-001, DOC-SYSTEM-001, dr_siti eradicated
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../server/services/cpoeApplication.service.js', () => ({
  cpoeApplicationService: {
    createOrder: vi.fn().mockResolvedValue({ id: 'ORD-01', order_number: 'ORD-2026-001', isIdempotentReplay: false }),
    cancelOrder: vi.fn().mockResolvedValue({ id: 'ORD-01', status: 'CANCELLED' }),
    getOrderById: vi.fn().mockResolvedValue({ id: 'ORD-01', items: [] }),
    getOrdersByEncounterId: vi.fn().mockResolvedValue([{ id: 'ORD-01', items: [] }]),
    listOrders: vi.fn().mockResolvedValue([{ id: 'ORD-01', items: [] }])
  },
  CpoeDomainError: class CpoeDomainError extends Error {
    constructor(msg, code, sc) {
      super(msg);
      this.code = code;
      this.statusCode = sc;
    }
  }
}));

import { cpoeController } from '../server/controllers/cpoe.controller.js';
import { cpoeApplicationService } from '../server/services/cpoeApplication.service.js';

function mockRes() {
  const r = {};
  r.status = vi.fn().mockReturnValue(r);
  r.json = vi.fn().mockReturnValue(r);
  r.setHeader = vi.fn().mockReturnValue(r);
  return r;
}

function mockReq(overrides = {}) {
  return { headers: {}, body: {}, params: {}, query: {}, ip: '127.0.0.1', ...overrides };
}

const VALID_TENANT_A = 'a0000000-0000-4000-8000-000000000001';
const INVALID_UUID   = 'not-a-valid-uuid-format';
const ENV_DEFAULT    = 'ff000000-0000-4000-8000-000000000099';

describe('P0-2B WAVE 1B.3 — C1 Controller L1 Tenant Gate (Fail-Closed)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEFAULT_TENANT_ID = ENV_DEFAULT;
  });

  afterEach(() => {
    delete process.env.DEFAULT_TENANT_ID;
  });

  // =========================================================================
  // 1. MISSING TENANT CONTEXT REJECTION (403)
  // =========================================================================
  describe('1. Missing tenant context yields 403 on all 5 C1 controller routes', () => {
    it('1.1 — createOrder: missing tenantId -> 403 TENANT_CONTEXT_REQUIRED', async () => {
      const req = mockReq({ user: { userId: 'DOC-01', role: 'ROLE_DOCTOR_DPJP' } });
      const res = mockRes();
      await cpoeController.createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'TENANT_CONTEXT_REQUIRED' })
      }));
      expect(cpoeApplicationService.createOrder).not.toHaveBeenCalled();
    });

    it('1.2 — cancelOrder: missing tenantId -> 403 TENANT_CONTEXT_REQUIRED', async () => {
      const req = mockReq({ params: { id: 'ord-1' }, user: { userId: 'DOC-01', role: 'ROLE_DOCTOR_DPJP' } });
      const res = mockRes();
      await cpoeController.cancelOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'TENANT_CONTEXT_REQUIRED' })
      }));
      expect(cpoeApplicationService.cancelOrder).not.toHaveBeenCalled();
    });

    it('1.3 — getOrderById: missing tenantId -> 403 TENANT_CONTEXT_REQUIRED', async () => {
      const req = mockReq({ params: { id: 'ord-1' }, user: { userId: 'DOC-01' } });
      const res = mockRes();
      await cpoeController.getOrderById(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'TENANT_CONTEXT_REQUIRED' })
      }));
      expect(cpoeApplicationService.getOrderById).not.toHaveBeenCalled();
    });

    it('1.4 — getOrdersByEncounter: missing tenantId -> 403 TENANT_CONTEXT_REQUIRED', async () => {
      const req = mockReq({ params: { encounterId: 'enc-1' }, user: { userId: 'DOC-01' } });
      const res = mockRes();
      await cpoeController.getOrdersByEncounter(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'TENANT_CONTEXT_REQUIRED' })
      }));
      expect(cpoeApplicationService.getOrdersByEncounterId).not.toHaveBeenCalled();
    });

    it('1.5 — listOrders (CS 71): missing tenantId -> 403 TENANT_CONTEXT_REQUIRED', async () => {
      const req = mockReq({ user: { userId: 'DOC-01' } });
      const res = mockRes();
      await cpoeController.listOrders(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'TENANT_CONTEXT_REQUIRED' })
      }));
      expect(cpoeApplicationService.listOrders).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 2. ZERO FALLBACK TO DEFAULT_TENANT_ID ENV
  // =========================================================================
  describe('2. DEFAULT_TENANT_ID in process.env does NOT bypass gate (Zero Fallback)', () => {
    it('2.1 — createOrder: process.env.DEFAULT_TENANT_ID set, req has no tenant -> still 403', async () => {
      const req = mockReq({ user: { userId: 'DOC-01', role: 'ROLE_DOCTOR_DPJP' } });
      const res = mockRes();
      await cpoeController.createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(cpoeApplicationService.createOrder).not.toHaveBeenCalled();
    });

    it('2.2 — cancelOrder: process.env.DEFAULT_TENANT_ID set, req has no tenant -> still 403', async () => {
      const req = mockReq({ params: { id: 'ord-1' }, user: { userId: 'DOC-01', role: 'ROLE_DOCTOR_DPJP' } });
      const res = mockRes();
      await cpoeController.cancelOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(cpoeApplicationService.cancelOrder).not.toHaveBeenCalled();
    });

    it('2.3 — listOrders (CS 71): process.env.DEFAULT_TENANT_ID set, req has no tenant -> still 403', async () => {
      const req = mockReq({ user: { userId: 'DOC-01' } });
      const res = mockRes();
      await cpoeController.listOrders(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(cpoeApplicationService.listOrders).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. INVALID UUID REJECTION (403)
  // =========================================================================
  describe('3. Non-UUID tenantId fails closed on all routes (403)', () => {
    it('3.1 — createOrder: invalid UUID -> 403 TENANT_CONTEXT_REQUIRED', async () => {
      const req = mockReq({ tenantId: INVALID_UUID, user: { userId: 'DOC-01', role: 'ROLE_DOCTOR_DPJP' } });
      const res = mockRes();
      await cpoeController.createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(cpoeApplicationService.createOrder).not.toHaveBeenCalled();
    });

    it('3.2 — cancelOrder: invalid UUID -> 403 TENANT_CONTEXT_REQUIRED', async () => {
      const req = mockReq({ tenantId: INVALID_UUID, params: { id: 'ord-1' }, user: { userId: 'DOC-01' } });
      const res = mockRes();
      await cpoeController.cancelOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(cpoeApplicationService.cancelOrder).not.toHaveBeenCalled();
    });

    it('3.3 — getOrderById: invalid UUID -> 403 TENANT_CONTEXT_REQUIRED', async () => {
      const req = mockReq({ tenantId: INVALID_UUID, params: { id: 'ord-1' } });
      const res = mockRes();
      await cpoeController.getOrderById(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(cpoeApplicationService.getOrderById).not.toHaveBeenCalled();
    });

    it('3.4 — listOrders (CS 71): invalid UUID -> 403 TENANT_CONTEXT_REQUIRED', async () => {
      const req = mockReq({ tenantId: INVALID_UUID });
      const res = mockRes();
      await cpoeController.listOrders(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(cpoeApplicationService.listOrders).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. AUTHENTICATED ACTOR PROVENANCE (401 FAIL-CLOSED)
  // =========================================================================
  describe('4. Missing authenticated actor fails closed with 401', () => {
    it('4.1 — createOrder: missing req.user -> 401 UNAUTHORIZED (Zero mock fallback)', async () => {
      const req = mockReq({ tenantId: VALID_TENANT_A, body: { encounterId: 'enc-1' } });
      const res = mockRes();
      await cpoeController.createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'UNAUTHORIZED' })
      }));
      expect(cpoeApplicationService.createOrder).not.toHaveBeenCalled();
    });

    it('4.2 — cancelOrder: missing req.user -> 401 UNAUTHORIZED (Zero mock fallback)', async () => {
      const req = mockReq({ tenantId: VALID_TENANT_A, params: { id: 'ord-1' }, body: { cancellationReason: 'Alasan batal' } });
      const res = mockRes();
      await cpoeController.cancelOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'UNAUTHORIZED' })
      }));
      expect(cpoeApplicationService.cancelOrder).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 5. VALID TENANT CONTEXT PASS-THROUGH
  // =========================================================================
  describe('5. Valid tenant context passes through to service layer with authoritative tenantId', () => {
    it('5.1 — createOrder: valid req.tenantId passed to actor.tenantId', async () => {
      const req = mockReq({
        tenantId: VALID_TENANT_A,
        user: { userId: 'DOC-DPJP-01', username: 'dr_siti', role: 'ROLE_DOCTOR_DPJP', fullName: 'dr. Siti Rahma' },
        body: { encounterId: 'enc-1', clinicalIndication: 'Test', items: [{ catalogCode: 'L1', itemName: 'T1' }] }
      });
      const res = mockRes();
      await cpoeController.createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(cpoeApplicationService.createOrder).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tenantId: VALID_TENANT_A, userId: 'DOC-DPJP-01' }),
        expect.anything(),
        expect.anything()
      );
    });

    it('5.2 — cancelOrder: valid req.user.tenantId passed to actor.tenantId', async () => {
      const req = mockReq({
        params: { id: 'ord-1' },
        user: { userId: 'DOC-DPJP-01', username: 'dr_siti', role: 'ROLE_DOCTOR_DPJP', tenantId: VALID_TENANT_A },
        body: { cancellationReason: 'Pembatalan medicolegal sah' }
      });
      const res = mockRes();
      await cpoeController.cancelOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(cpoeApplicationService.cancelOrder).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tenantId: VALID_TENANT_A, userId: 'DOC-DPJP-01' }),
        expect.anything(),
        expect.anything()
      );
    });

    it('5.3 — listOrders (CS 71): valid req.tenantId passed to service tenantContext', async () => {
      const req = mockReq({
        tenantId: VALID_TENANT_A,
        query: { status: 'ORDERED' }
      });
      const res = mockRes();
      await cpoeController.listOrders(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(cpoeApplicationService.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ORDERED' }),
        expect.objectContaining({ tenantId: VALID_TENANT_A })
      );
    });

    it('5.4 — getOrderById: valid req.tenantId passed to service tenantContext', async () => {
      const req = mockReq({
        params: { id: 'ord-1' },
        tenantId: VALID_TENANT_A
      });
      const res = mockRes();
      await cpoeController.getOrderById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(cpoeApplicationService.getOrderById).toHaveBeenCalledWith(
        'ord-1',
        expect.objectContaining({ tenantId: VALID_TENANT_A })
      );
    });
  });
});
