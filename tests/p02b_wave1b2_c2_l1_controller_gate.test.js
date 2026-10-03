/**
 * P0-2B WAVE 1B.2 — Evidence Closure: C2 Controller L1 Fail-Closed Tenant Gate Tests
 * Domain: Diagnostic Results & Clinical Interpretation
 *
 * Evidence claims:
 *   C1. Missing req.tenantId / req.user.tenantId -> 403 TENANT_CONTEXT_REQUIRED across all 4 routes
 *   C2. DEFAULT_TENANT_ID env set but req.tenantId absent -> STILL 403 (Zero Fallback)
 *   C3. Invalid UUID tenantId -> 403 TENANT_CONTEXT_REQUIRED
 *   C4. Valid req.tenantId -> passes through to service actor with correct tenantId
 *   C5. Valid req.user.tenantId -> passes through to service actor with correct tenantId
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../server/services/diagnosticInterpretation.service.js', () => ({
  diagnosticInterpretationService: {
    publishDiagnosticNotification: vi.fn().mockResolvedValue({ id: 'NOTIF-01', abnormality_flag: 'NORMAL', notification_priority: 'ROUTINE' }),
    acknowledgeDiagnosticNotification: vi.fn().mockResolvedValue({ id: 'NOTIF-01', status: 'ACKNOWLEDGED', acknowledged_by_name: 'dr_siti', read_back_confirmed: true }),
    recordPhysicianInterpretation: vi.fn().mockResolvedValue({ id: 'INTERP-01', impact_on_care_plan: 'CONTINUE_CURRENT_THERAPY' }),
    executeSecondaryClinicalAction: vi.fn().mockResolvedValue({ id: 'ACTION-01', action_type: 'CPOE_MEDICATION_ORDER', cpoe_order_id: 'ORD-01' })
  },
  DiagnosticInterpretationDomainError: class DiagnosticInterpretationDomainError extends Error {
    constructor(msg, code, sc) {
      super(msg);
      this.code = code;
      this.statusCode = sc;
    }
  }
}));

import { diagnosticInterpretationController } from '../server/controllers/diagnosticInterpretation.controller.js';
import { diagnosticInterpretationService } from '../server/services/diagnosticInterpretation.service.js';

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
const INVALID_UUID   = 'not-a-valid-uuid-format';
const ENV_DEFAULT    = 'ff000000-0000-4000-8000-000000000099';

describe('P0-2B WAVE 1B.2 — C2 Controller L1 Tenant Gate (Fail-Closed)', () => {
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
  describe('1. Missing tenant context yields 403 on all 4 C2 routes', () => {
    it('1.1 — publishNotification: missing tenantId -> 403 TENANT_CONTEXT_REQUIRED', async () => {
      const req = mockReq({ user: { userId: 'U1' } });
      const res = mockRes();
      await diagnosticInterpretationController.publishNotification(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'TENANT_CONTEXT_REQUIRED' })
      }));
      expect(diagnosticInterpretationService.publishDiagnosticNotification).not.toHaveBeenCalled();
    });

    it('1.2 — acknowledgeNotification: missing tenantId -> 403 TENANT_CONTEXT_REQUIRED', async () => {
      const req = mockReq({ params: { id: 'notif-1' }, user: { userId: 'U2' } });
      const res = mockRes();
      await diagnosticInterpretationController.acknowledgeNotification(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'TENANT_CONTEXT_REQUIRED' })
      }));
      expect(diagnosticInterpretationService.acknowledgeDiagnosticNotification).not.toHaveBeenCalled();
    });

    it('1.3 — recordInterpretation: missing tenantId -> 403 TENANT_CONTEXT_REQUIRED', async () => {
      const req = mockReq({ params: { id: 'notif-1' }, user: { userId: 'U3' } });
      const res = mockRes();
      await diagnosticInterpretationController.recordInterpretation(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'TENANT_CONTEXT_REQUIRED' })
      }));
      expect(diagnosticInterpretationService.recordPhysicianInterpretation).not.toHaveBeenCalled();
    });

    it('1.4 — executeSecondaryAction: missing tenantId -> 403 TENANT_CONTEXT_REQUIRED', async () => {
      const req = mockReq({ params: { id: 'interp-1' }, user: { userId: 'U4' } });
      const res = mockRes();
      await diagnosticInterpretationController.executeSecondaryAction(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ code: 'TENANT_CONTEXT_REQUIRED' })
      }));
      expect(diagnosticInterpretationService.executeSecondaryClinicalAction).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 2. INVALID UUID TENANT REJECTION (403)
  // =========================================================================
  describe('2. Invalid UUID tenantId yields 403 on all 4 C2 routes', () => {
    it('2.1 — publishNotification: invalid UUID -> 403', async () => {
      const req = mockReq({ tenantId: INVALID_UUID });
      const res = mockRes();
      await diagnosticInterpretationController.publishNotification(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(diagnosticInterpretationService.publishDiagnosticNotification).not.toHaveBeenCalled();
    });

    it('2.2 — acknowledgeNotification: invalid UUID -> 403', async () => {
      const req = mockReq({ params: { id: 'notif-1' }, tenantId: INVALID_UUID });
      const res = mockRes();
      await diagnosticInterpretationController.acknowledgeNotification(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(diagnosticInterpretationService.acknowledgeDiagnosticNotification).not.toHaveBeenCalled();
    });

    it('2.3 — recordInterpretation: invalid UUID -> 403', async () => {
      const req = mockReq({ params: { id: 'notif-1' }, tenantId: INVALID_UUID });
      const res = mockRes();
      await diagnosticInterpretationController.recordInterpretation(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(diagnosticInterpretationService.recordPhysicianInterpretation).not.toHaveBeenCalled();
    });

    it('2.4 — executeSecondaryAction: invalid UUID -> 403', async () => {
      const req = mockReq({ params: { id: 'interp-1' }, tenantId: INVALID_UUID });
      const res = mockRes();
      await diagnosticInterpretationController.executeSecondaryAction(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(diagnosticInterpretationService.executeSecondaryClinicalAction).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. ZERO FALLBACK (ENV DEFAULT_TENANT_ID DOES NOT BYPASS GATE)
  // =========================================================================
  describe('3. DEFAULT_TENANT_ID environment variable does not act as fallback', () => {
    it('3.1 — publishNotification: env set but req.tenantId absent -> STILL 403', async () => {
      const req = mockReq({});
      const res = mockRes();
      await diagnosticInterpretationController.publishNotification(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(diagnosticInterpretationService.publishDiagnosticNotification).not.toHaveBeenCalled();
    });

    it('3.2 — executeSecondaryAction: env set but req.tenantId absent -> STILL 403', async () => {
      const req = mockReq({ params: { id: 'interp-1' } });
      const res = mockRes();
      await diagnosticInterpretationController.executeSecondaryAction(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(diagnosticInterpretationService.executeSecondaryClinicalAction).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. VALID TENANT PROPAGATION
  // =========================================================================
  describe('4. Valid tenant context propagates correctly to service actor', () => {
    it('4.1 — publishNotification: valid req.tenantId passes through', async () => {
      const req = mockReq({
        tenantId: VALID_TENANT_A,
        user: { userId: 'USR-LAB-A01', role: 'ROLE_LAB_TECHNICIAN' },
        body: { encounterId: 'enc-1' }
      });
      const res = mockRes();
      await diagnosticInterpretationController.publishNotification(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(diagnosticInterpretationService.publishDiagnosticNotification).toHaveBeenCalledWith(
        req.body,
        expect.objectContaining({ tenantId: VALID_TENANT_A, userId: 'USR-LAB-A01' }),
        expect.any(String),
        expect.any(String)
      );
    });

    it('4.2 — acknowledgeNotification: valid req.user.tenantId passes through', async () => {
      const req = mockReq({
        params: { id: 'notif-1' },
        user: { userId: 'DOC-DPJP-A01', tenantId: VALID_TENANT_A, role: 'ROLE_DOCTOR_DPJP' },
        body: { readBackConfirmed: true }
      });
      const res = mockRes();
      await diagnosticInterpretationController.acknowledgeNotification(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(diagnosticInterpretationService.acknowledgeDiagnosticNotification).toHaveBeenCalledWith(
        expect.objectContaining({ notificationId: 'notif-1', readBackConfirmed: true }),
        expect.objectContaining({ tenantId: VALID_TENANT_A, userId: 'DOC-DPJP-A01' }),
        expect.any(String),
        expect.any(String)
      );
    });

    it('4.3 — recordInterpretation: valid req.tenantId passes through', async () => {
      const req = mockReq({
        params: { id: 'notif-1' },
        tenantId: VALID_TENANT_A,
        user: { userId: 'DOC-DPJP-A01', role: 'ROLE_DOCTOR_DPJP' },
        body: { clinicalImpression: 'Normal findings' }
      });
      const res = mockRes();
      await diagnosticInterpretationController.recordInterpretation(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(diagnosticInterpretationService.recordPhysicianInterpretation).toHaveBeenCalledWith(
        expect.objectContaining({ notificationId: 'notif-1', clinicalImpression: 'Normal findings' }),
        expect.objectContaining({ tenantId: VALID_TENANT_A, userId: 'DOC-DPJP-A01' }),
        expect.any(String),
        expect.any(String)
      );
    });

    it('4.4 — executeSecondaryAction: valid req.tenantId passes through', async () => {
      const req = mockReq({
        params: { id: 'interp-1' },
        tenantId: VALID_TENANT_A,
        user: { userId: 'DOC-DPJP-A01', role: 'ROLE_DOCTOR_DPJP' },
        body: { actionType: 'CPOE_MEDICATION_ORDER', actionSummary: 'Start antibiotic' }
      });
      const res = mockRes();
      await diagnosticInterpretationController.executeSecondaryAction(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(diagnosticInterpretationService.executeSecondaryClinicalAction).toHaveBeenCalledWith(
        expect.objectContaining({ interpretationId: 'interp-1', actionSummary: 'Start antibiotic' }),
        expect.objectContaining({ tenantId: VALID_TENANT_A, userId: 'DOC-DPJP-A01' }),
        expect.any(String),
        expect.any(String)
      );
    });
  });
});
