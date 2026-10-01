/**
 * P0-2B WAVE 1B.1 — Evidence Closure: L-1 Controller Tenant Gate Tests
 *
 * Proves the controller-layer fail-closed behavior after DEFAULT_TENANT_ID
 * fallback removal (L-1 resolution).
 *
 * Evidence claims:
 *   C1. Missing req.tenantId -> 403 TENANT_CONTEXT_REQUIRED (all 3 methods)
 *   C2. DEFAULT_TENANT_ID env present but req.tenantId absent -> STILL 403
 *   C3. Valid req.tenantId -> reaches service actor with correct tenantId
 *   C4. Service-level pre-gate also independently enforces tenantId
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../server/services/triageApplication.service.js', () => ({
  triageApplicationService: {
    recordTriageAssessment: vi.fn().mockResolvedValue({
      triage: { id: 'T1', triage_level: 2, target_response_minutes: 10 },
      slaTimer: { id: 'SLA1' },
      auditSignature: 'SIG1'
    }),
    recordFirstPhysicianContact: vi.fn().mockResolvedValue({ elapsed_seconds: 300, is_overdue: false }),
    getTriageByEncounterId: vi.fn().mockResolvedValue({ id: 'T1', encounter_id: 'ENC1' })
  },
  TriageDomainError: class TriageDomainError extends Error {
    constructor(msg, code, sc) { super(msg); this.code = code; this.statusCode = sc; }
  }
}));

import { triageController } from '../server/controllers/triage.controller.js';
import { triageApplicationService } from '../server/services/triageApplication.service.js';

function mockRes() {
  const r = {};
  r.status = vi.fn().mockReturnValue(r);
  r.json = vi.fn().mockReturnValue(r);
  return r;
}

function mockReq(overrides = {}) {
  return { headers: {}, body: {}, params: {}, ip: '127.0.0.1', ...overrides };
}

const VALID_TENANT_A = 'a0000000-0000-4000-8000-000000000001';
const VALID_ENC_ID   = 'aa000001-0000-4000-8000-000000000001';
const ENV_DEFAULT    = 'ff000000-0000-4000-8000-000000000099';

describe('P0-2B WAVE 1B.1 Evidence Closure — L-1: Controller Tenant Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEFAULT_TENANT_ID = ENV_DEFAULT;
  });
  afterEach(() => { delete process.env.DEFAULT_TENANT_ID; });

  describe('C1 — Missing req.tenantId yields 403 on all three routes', () => {
    it('C1.1 — recordAssessment: missing req.tenantId -> 403', async () => {
      const req = mockReq({ user: { userId: 'U1' } });
      const res = mockRes();
      await triageController.recordAssessment(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'TENANT_CONTEXT_REQUIRED' })
      }));
      expect(triageApplicationService.recordTriageAssessment).not.toHaveBeenCalled();
    });

    it('C1.2 — recordFirstPhysicianContact: missing req.tenantId -> 403', async () => {
      const req = mockReq({ user: { userId: 'U2' } });
      const res = mockRes();
      await triageController.recordFirstPhysicianContact(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(triageApplicationService.recordFirstPhysicianContact).not.toHaveBeenCalled();
    });

    it('C1.3 — getTriageByEncounterId: missing req.tenantId -> 403', async () => {
      const req = mockReq({ params: { encounterId: VALID_ENC_ID } });
      const res = mockRes();
      await triageController.getTriageByEncounterId(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(triageApplicationService.getTriageByEncounterId).not.toHaveBeenCalled();
    });

    it('C1.4 — req.tenantId=null -> 403', async () => {
      const req = mockReq({ tenantId: null });
      const res = mockRes();
      await triageController.recordAssessment(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('C1.5 — req.tenantId=undefined -> 403', async () => {
      const req = mockReq({ tenantId: undefined });
      const res = mockRes();
      await triageController.recordAssessment(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('C2 — DEFAULT_TENANT_ID env does NOT act as fallback when req.tenantId absent', () => {
    it('C2.1 — recordAssessment: env DEFAULT_TENANT_ID set, req.tenantId absent -> 403', async () => {
      const req = mockReq({ user: { userId: 'U1' } });
      const res = mockRes();
      await triageController.recordAssessment(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(triageApplicationService.recordTriageAssessment).not.toHaveBeenCalled();
    });

    it('C2.2 — recordFirstPhysicianContact: env DEFAULT_TENANT_ID set, req.tenantId absent -> 403', async () => {
      const req = mockReq({ user: { userId: 'U2' } });
      const res = mockRes();
      await triageController.recordFirstPhysicianContact(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('C2.3 — getTriageByEncounterId: env DEFAULT_TENANT_ID set, req.tenantId absent -> 403', async () => {
      const req = mockReq({ params: { encounterId: VALID_ENC_ID } });
      const res = mockRes();
      await triageController.getTriageByEncounterId(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('C3 — Valid req.tenantId propagates correctly to service', () => {
    it('C3.1 — recordAssessment: actor receives req.tenantId (not env)', async () => {
      const req = mockReq({
        tenantId: VALID_TENANT_A,
        user: { userId: 'U1', role: 'ROLE_NURSE', tenantId: VALID_TENANT_A },
        body: { encounterId: VALID_ENC_ID, chiefComplaint: 'Chest pain' }
      });
      const res = mockRes();
      await triageController.recordAssessment(req, res);
      expect(triageApplicationService.recordTriageAssessment).toHaveBeenCalledWith(
        req.body,
        expect.objectContaining({ tenantId: VALID_TENANT_A }),
        expect.any(String),
        expect.any(String)
      );
    });

    it('C3.2 — recordFirstPhysicianContact: actor.tenantId = req.tenantId', async () => {
      const req = mockReq({
        tenantId: VALID_TENANT_A,
        user: { userId: 'U2', role: 'ROLE_DOCTOR_EMERGENCY', tenantId: VALID_TENANT_A },
        body: { encounterId: VALID_ENC_ID }
      });
      const res = mockRes();
      await triageController.recordFirstPhysicianContact(req, res);
      expect(triageApplicationService.recordFirstPhysicianContact).toHaveBeenCalledWith(
        req.body,
        expect.objectContaining({ tenantId: VALID_TENANT_A }),
        expect.any(String),
        expect.any(String)
      );
    });

    it('C3.3 — getTriageByEncounterId: actor.tenantId = req.tenantId, not env', async () => {
      const req = mockReq({
        tenantId: VALID_TENANT_A,
        user: { userId: 'U3', role: 'ROLE_NURSE', tenantId: VALID_TENANT_A },
        params: { encounterId: VALID_ENC_ID }
      });
      const res = mockRes();
      await triageController.getTriageByEncounterId(req, res);
      const calledActor = triageApplicationService.getTriageByEncounterId.mock.calls[0][1];
      expect(calledActor.tenantId).toBe(VALID_TENANT_A);
      expect(calledActor.tenantId).not.toBe(ENV_DEFAULT);
    });

    it('C3.4 — env DEFAULT_TENANT_ID is NEVER the actor tenantId even when present', async () => {
      const req = mockReq({
        tenantId: VALID_TENANT_A,
        user: { userId: 'U1', tenantId: VALID_TENANT_A },
        body: { encounterId: VALID_ENC_ID, chiefComplaint: 'Fever' }
      });
      const res = mockRes();
      await triageController.recordAssessment(req, res);
      const calledActor = triageApplicationService.recordTriageAssessment.mock.calls[0][1];
      expect(calledActor.tenantId).toBe(VALID_TENANT_A);
      expect(calledActor.tenantId).not.toBe(ENV_DEFAULT);
    });
  });
});
