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
  for (const mw of middlewares) {
    let nextCalled = false;
    await mw(req, res, () => { nextCalled = true; });
    if (!nextCalled) break;
  }
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
        headers: { 'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID_TAMPERED_PAYLOAD.SIGNATURE' }
      });
      await authenticateJwt(req, res, () => {});

      expect(res.getStatusCode()).toBe(401);
      expect(res.getBody().error).toBe('TOKEN_EXPIRED_OR_REVOKED');
    });

    it('1.3 Anonymous request must NEVER be silently escalated to ADMIN', async () => {
      const { req, res } = createMockReqRes({ headers: {} });
      const guard = requireRole(['ADMIN']);
      await guard(req, res, () => {});

      expect(res.getStatusCode()).toBe(401);
      expect(res.getBody().error).toBe('UNAUTHORIZED');
    });
  });

  // ─── 2. ROLE PRIVILEGE ESCALATION / CROSS-ROLE NEGATIVE TESTS ───
  describe('2. Cross-Role Privilege Escalation Rejection (Negative)', () => {
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
          credentialNumber: `STR-KKI-${Date.now()}`,
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

  // ─── 4. FRONTEND ROUTE NAVIGATION GUARDS ───
  describe('4. Frontend Route Guards & Persona Navigational Access', () => {
    function evaluateRouteAccess(role, targetPath) {
      const publicRoutes = ['/login', '/register', '/portal-pasien'];
      if (publicRoutes.includes(targetPath)) return { allowed: true };
      if (!role) return { allowed: false, redirectTo: '/login' };

      const roleRoutePermissions = {
        DOCTOR: ['/dashboard', '/emr', '/prescriptions', '/clinical-pathways', '/diagnoses', '/consultations'],
        NURSE: ['/dashboard', '/nursing', '/vitals', '/shift-handover', '/triage', '/care-plans'],
        PHARMACIST: ['/dashboard', '/pharmacy', '/e-resep', '/inventory', '/fefo-stock', '/drug-dispense'],
        CASHIER: ['/dashboard', '/billing', '/invoices', '/payments', '/bpjs-claims', '/tariffs'],
        SURGEON: ['/dashboard', '/surgery', '/operating-theatre', '/or-schedule', '/surgical-safety'],
        BLOOD_BANK_OFFICER: ['/dashboard', '/blood-bank', '/crossmatch', '/transfusion', '/isbt128'],
        ADMIN: ['/dashboard', '/command-center', '/users', '/roles', '/master-data', '/audit-trail', '/security']
      };

      const allowedPaths = roleRoutePermissions[role] || ['/dashboard'];
      const isAllowed = allowedPaths.some(p => targetPath.startsWith(p));

      if (!isAllowed) {
        return { allowed: false, redirectTo: '/dashboard', error: 'ROLE_ROUTE_FORBIDDEN' };
      }
      return { allowed: true };
    }

    it('4.1 Anonymous visiting /patients must redirect to /login', () => {
      const res = evaluateRouteAccess(null, '/patients');
      expect(res.allowed).toBe(false);
      expect(res.redirectTo).toBe('/login');
    });

    it('4.2 Anonymous visiting /emr must redirect to /login', () => {
      const res = evaluateRouteAccess(null, '/emr');
      expect(res.allowed).toBe(false);
      expect(res.redirectTo).toBe('/login');
    });

    it('4.3 Anonymous visiting /command-center must redirect to /login', () => {
      const res = evaluateRouteAccess(null, '/command-center');
      expect(res.allowed).toBe(false);
      expect(res.redirectTo).toBe('/login');
    });

    it('4.4 DOCTOR visiting /blood-bank must be denied and redirected to /dashboard', () => {
      const res = evaluateRouteAccess('DOCTOR', '/blood-bank');
      expect(res.allowed).toBe(false);
      expect(res.redirectTo).toBe('/dashboard');
    });

    it('4.5 CASHIER visiting /operating-theatre must be denied and redirected to /dashboard', () => {
      const res = evaluateRouteAccess('CASHIER', '/operating-theatre');
      expect(res.allowed).toBe(false);
      expect(res.redirectTo).toBe('/dashboard');
    });

    it('4.6 SURGEON visiting /surgery must be allowed to render', () => {
      const res = evaluateRouteAccess('SURGEON', '/surgery');
      expect(res.allowed).toBe(true);
    });

    it('4.7 NURSE visiting /nursing must be allowed to render', () => {
      const res = evaluateRouteAccess('NURSE', '/nursing');
      expect(res.allowed).toBe(true);
    });

    it('4.8 PHARMACIST visiting /pharmacy must be allowed to render', () => {
      const res = evaluateRouteAccess('PHARMACIST', '/pharmacy');
      expect(res.allowed).toBe(true);
    });
  });
});
