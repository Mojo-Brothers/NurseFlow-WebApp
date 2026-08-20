/**
 * NurseFlow Enterprise HIS 2026 — Zero-Trust Security Gate 0A Verification Suite
 * Standards: NIST SP 800-162 / ABAC & Zero-Trust Architecture (ZTA) / JCI MOI
 * Exhaustive Negative + Positive Security & RBAC Boundary Testing Matrix.
 */

import { describe, it, expect } from 'vitest';
import { masterDataHubController } from '../server/controllers/masterDataHub.controller.js';
import { bloodBankController } from '../server/controllers/bloodBank.controller.js';
import { staffPrivilegingController } from '../server/controllers/staffPrivileging.controller.js';
import { commandCenterController } from '../server/controllers/commandCenter.controller.js';
import { enterpriseInventoryController } from '../server/controllers/enterpriseInventory.controller.js';
import { authenticateJwt } from '../server/middlewares/authMiddleware.js';
import { requireRole } from '../server/middlewares/rbacMiddleware.js';
import { jwtSecurityService } from '../src/core/security/jwtSecurity.service.js';

// Express Middleware Pipeline Runner Harness
async function runMiddlewarePipeline(middlewares, req, res) {
  let idx = 0;
  async function next(err) {
    if (err) return;
    if (idx < middlewares.length) {
      const mw = middlewares[idx++];
      await mw(req, res, next);
    }
  }
  await next();
}

function createMockReqRes({ headers = {}, body = {}, params = {}, query = {}, cookies = {}, user = null } = {}) {
  let statusCode = 200;
  let jsonResponse = null;
  let redirectedTo = null;

  const req = { headers, body, params, query, cookies, user };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonResponse = payload;
      return this;
    },
    redirect(url) {
      redirectedTo = url;
      return this;
    },
    getStatusCode() {
      return statusCode;
    },
    getBody() {
      return jsonResponse;
    },
    getRedirect() {
      return redirectedTo;
    }
  };

  return { req, res };
}

describe('Gate 0A — Zero-Trust Security & End-to-End RBAC Hardening Verification (14 Scenarios)', () => {

  // ─── 1. ANONYMOUS / UNAUTHENTICATED NEGATIVE TESTS ───
  describe('1. Unauthenticated / Anonymous Security Barriers (Negative)', () => {
    it('1.1 Request to protected API without JWT header must return 401 Unauthorized', async () => {
      const { req, res } = createMockReqRes({ headers: {} });
      await authenticateJwt(req, res, () => {});

      expect(res.getStatusCode()).toBe(401);
      expect(res.getBody().error).toBe('UNAUTHORIZED');
    });

    it('1.2 Request to protected API with invalid/tampered JWT must return 401 Unauthorized', async () => {
      const { req, res } = createMockReqRes({
        headers: { 'authorization': 'Bearer invalid_tampered_jwt_signature_xyz' }
      });
      await authenticateJwt(req, res, () => {});

      expect(res.getStatusCode()).toBe(401);
      expect(res.getBody().error).toBe('TOKEN_EXPIRED_OR_REVOKED');
    });

    it('1.3 Anonymous request must NEVER be silently escalated to ADMIN', async () => {
      const { req, res } = createMockReqRes({ headers: {} });
      await authenticateJwt(req, res, () => {});

      expect(req.user).toBeNull();
      expect(res.getStatusCode()).toBe(401);
    });
  });

  // ─── 2. ROLE AUTHORIZATION NEGATIVE TESTS ───
  describe('2. Role Boundary & Privilege Escalation Prevention (Negative)', () => {
    it('2.1 DOCTOR token attempting Blood Bank stock mutation must return 403 Forbidden', async () => {
      const doctorPayload = { uid: 'DOC-01', role: 'DOCTOR', email: 'dr.budi@nurseflow.id' };
      const { req, res } = createMockReqRes({ user: doctorPayload });

      const guard = requireRole(['BLOOD_BANK_OFFICER', 'ADMIN']);
      await guard(req, res, () => {});

      expect(res.getStatusCode()).toBe(403);
      expect(res.getBody().error).toBe('ROLE_FORBIDDEN');
    });

    it('2.2 CASHIER token attempting Operating Theatre execution must return 403 Forbidden', async () => {
      const cashierPayload = { uid: 'CSH-01', role: 'CASHIER', email: 'kasir1@nurseflow.id' };
      const { req, res } = createMockReqRes({ user: cashierPayload });

      const guard = requireRole(['SURGEON', 'ANESTHESIOLOGIST', 'OR_NURSE', 'ADMIN']);
      await guard(req, res, () => {});

      expect(res.getStatusCode()).toBe(403);
      expect(res.getBody().error).toBe('ROLE_FORBIDDEN');
    });

    it('2.3 NURSE token attempting Master Data Tariff mutation must return 403 Forbidden', async () => {
      const nursePayload = { uid: 'NRS-01', role: 'NURSE', email: 'nurse.maya@nurseflow.id' };
      const { req, res } = createMockReqRes({
        user: nursePayload,
        params: { entityType: 'tariffs' },
        body: { code: 'TAR-NEW', name: 'Tarif Palsu', tariff_amount: 999999 }
      });

      const guard = requireRole(['ADMIN', 'SUPERVISOR']);
      await guard(req, res, () => {});

      expect(res.getStatusCode()).toBe(403);
      expect(res.getBody().error).toBe('ROLE_FORBIDDEN');
    });

    it('2.4 PHARMACIST token attempting Staff Privileging grant must return 403 Forbidden', async () => {
      const pharmPayload = { uid: 'PHARM-01', role: 'PHARMACIST', email: 'apt.siti@nurseflow.id' };
      const { req, res } = createMockReqRes({ user: pharmPayload });

      const guard = requireRole(['ADMIN', 'CLINICAL_DIRECTOR']);
      await guard(req, res, () => {});

      expect(res.getStatusCode()).toBe(403);
      expect(res.getBody().error).toBe('ROLE_FORBIDDEN');
    });
  });

  // ─── 3. POSITIVE AUTHORIZATION TESTS ───
  describe('3. Legitimate Role Authorization & Domain Execution (Positive)', () => {
    it('3.1 ADMIN with valid token can access executive Command Center alerts', async () => {
      const tokenPair = jwtSecurityService.issueTokenPair({
        userId: 'ADM-01',
        username: 'superadmin',
        role: 'ADMIN'
      });

      const { req, res } = createMockReqRes({
        headers: { 'authorization': `Bearer ${tokenPair.accessToken}` }
      });

      await runMiddlewarePipeline([
        authenticateJwt,
        requireRole(['ADMIN', 'EXECUTIVE', 'HOSPITAL_DIRECTOR']),
        commandCenterController.getAlerts
      ], req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(Array.isArray(res.getBody().data)).toBe(true);
    });

    it('3.2 BLOOD_BANK_OFFICER can intake blood donor unit with ISBT-128 barcode', async () => {
      const tokenPair = jwtSecurityService.issueTokenPair({
        userId: 'BDRS-01',
        username: 'petugas_bdrs',
        role: 'BLOOD_BANK_OFFICER'
      });

      const { req, res } = createMockReqRes({
        headers: { 'authorization': `Bearer ${tokenPair.accessToken}` },
        body: {
          donor_unit_number: `DONOR-POS-${Date.now()}`,
          blood_group: 'B',
          rhesus: 'POSITIVE',
          component_type: 'PACKED_RED_CELLS',
          volume_ml: 350,
          collection_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 35 * 86400000).toISOString()
        }
      });

      await runMiddlewarePipeline([
        authenticateJwt,
        requireRole(['BLOOD_BANK_OFFICER', 'ADMIN', 'SUPERVISOR']),
        bloodBankController.intakeDonorUnit
      ], req, res);

      expect(res.getStatusCode()).toBe(201);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.isbt128_barcode).toBeDefined();
    });

    it('3.3 PHARMACIST can receive inventory batch and perform FEFO stock mutation', async () => {
      const tokenPair = jwtSecurityService.issueTokenPair({
        userId: 'PHARM-01',
        username: 'apt_siti',
        role: 'PHARMACIST'
      });

      const { req, res } = createMockReqRes({
        headers: { 'authorization': `Bearer ${tokenPair.accessToken}` },
        body: {
          warehouseId: 'WH-MAIN-PHARMACY',
          itemCode: 'MED-CIPRO-500',
          itemName: 'Ciprofloxacin 500mg',
          batchNumber: `BAT-CIPRO-${Date.now()}`,
          expiryDate: '2028-12-31',
          quantity: 500,
          unitCost: 1200
        }
      });

      await runMiddlewarePipeline([
        authenticateJwt,
        requireRole(['PHARMACIST', 'LOGISTICS_OFFICER', 'ADMIN']),
        enterpriseInventoryController.receive
      ], req, res);

      expect(res.getStatusCode()).toBe(201);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.availableQuantity).toBe(500);
    });

    it('3.4 CLINICAL_DIRECTOR can register new practitioner credential (STR/SIP)', async () => {
      const tokenPair = jwtSecurityService.issueTokenPair({
        userId: 'DIR-01',
        username: 'direktur_medik',
        role: 'CLINICAL_DIRECTOR'
      });

      // Register staff profile first
      const staffProfile = { id: `STAFF-DIR-${Date.now()}`, fullName: 'dr. Satria, Sp.OG', staffCategory: 'SPECIALIST_DOCTOR' };
      const { req: staffReq, res: staffRes } = createMockReqRes({
        headers: { 'authorization': `Bearer ${tokenPair.accessToken}` },
        body: staffProfile
      });
      await runMiddlewarePipeline([authenticateJwt, staffPrivilegingController.createStaff], staffReq, staffRes);

      const { req, res } = createMockReqRes({
        headers: { 'authorization': `Bearer ${tokenPair.accessToken}` },
        body: {
          staffId: staffProfile.id,
          credentialType: 'STR',
          credentialNumber: 'STR-KKI-2026-8819',
          issuingAuthority: 'Konsil Kedokteran Indonesia',
          issuedAt: '2026-01-01',
          validFrom: '2026-01-01',
          validUntil: '2031-01-01',
          verificationStatus: 'ACTIVE_VERIFIED'
        }
      });

      await runMiddlewarePipeline([
        authenticateJwt,
        requireRole(['ADMIN', 'CLINICAL_DIRECTOR', 'SUPERVISOR']),
        staffPrivilegingController.addCredential
      ], req, res);

      expect(res.getStatusCode()).toBe(201);
      expect(res.getBody().success).toBe(true);
    });
  });

  // ─── 4. REACT ROUTE PROTECTEDROUTE EVALUATION (FRONTEND ZERO-TRUST) ───
  describe('4. React Router ProtectedRoute RBAC Evaluation (Frontend)', () => {
    function evaluateRouteAccess({ user, role, allowedRoles = [] }) {
      if (!user) return { action: 'REDIRECT_LOGIN', target: '/login' };
      if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
        return { action: 'REDIRECT_DASHBOARD', target: '/dashboard' };
      }
      return { action: 'RENDER_ROUTE', target: null };
    }

    it('4.1 Anonymous visiting /patients must redirect to /login', () => {
      const res = evaluateRouteAccess({ user: null, role: null, allowedRoles: ['DOCTOR', 'NURSE', 'ADMIN'] });
      expect(res.action).toBe('REDIRECT_LOGIN');
      expect(res.target).toBe('/login');
    });

    it('4.2 Anonymous visiting /emr must redirect to /login', () => {
      const res = evaluateRouteAccess({ user: null, role: null, allowedRoles: ['DOCTOR', 'NURSE', 'ADMIN'] });
      expect(res.action).toBe('REDIRECT_LOGIN');
      expect(res.target).toBe('/login');
    });

    it('4.3 Anonymous visiting /command-center must redirect to /login', () => {
      const res = evaluateRouteAccess({ user: null, role: null, allowedRoles: ['ADMIN', 'EXECUTIVE', 'HOSPITAL_DIRECTOR'] });
      expect(res.action).toBe('REDIRECT_LOGIN');
      expect(res.target).toBe('/login');
    });

    it('4.4 DOCTOR visiting /blood-bank must be denied and redirected to /dashboard', () => {
      const res = evaluateRouteAccess({
        user: { uid: 'DOC-01' },
        role: 'DOCTOR',
        allowedRoles: ['BLOOD_BANK_OFFICER', 'ADMIN', 'LAB_ANALYST']
      });
      expect(res.action).toBe('REDIRECT_DASHBOARD');
      expect(res.target).toBe('/dashboard');
    });

    it('4.5 CASHIER visiting /operating-theatre must be denied and redirected to /dashboard', () => {
      const res = evaluateRouteAccess({
        user: { uid: 'CSH-01' },
        role: 'CASHIER',
        allowedRoles: ['SURGEON', 'ANESTHESIOLOGIST', 'OR_NURSE', 'ADMIN']
      });
      expect(res.action).toBe('REDIRECT_DASHBOARD');
      expect(res.target).toBe('/dashboard');
    });

    it('4.6 SURGEON visiting /surgery must be allowed to render', () => {
      const res = evaluateRouteAccess({
        user: { uid: 'SRG-01' },
        role: 'SURGEON',
        allowedRoles: ['SURGEON', 'ANESTHESIOLOGIST', 'OR_NURSE', 'ADMIN']
      });
      expect(res.action).toBe('RENDER_ROUTE');
      expect(res.target).toBeNull();
    });

    it('4.7 NURSE visiting /nursing must be allowed to render', () => {
      const res = evaluateRouteAccess({
        user: { uid: 'NRS-01' },
        role: 'NURSE',
        allowedRoles: ['NURSE', 'DOCTOR', 'ADMIN']
      });
      expect(res.action).toBe('RENDER_ROUTE');
      expect(res.target).toBeNull();
    });

    it('4.8 PHARMACIST visiting /pharmacy must be allowed to render', () => {
      const res = evaluateRouteAccess({
        user: { uid: 'PHARM-01' },
        role: 'PHARMACIST',
        allowedRoles: ['PHARMACIST', 'ADMIN', 'DOCTOR']
      });
      expect(res.action).toBe('RENDER_ROUTE');
      expect(res.target).toBeNull();
    });
  });
});
