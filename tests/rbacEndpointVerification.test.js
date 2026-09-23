/**
 * tests/rbacEndpointVerification.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * NurseFlow Enterprise HIS 2026 — Verification Gate P0-1: RBAC Endpoint Matrix
 * Proves ALLOW and DENY authorization enforcement on REAL HTTP API endpoints.
 * Standards: OWASP Top 10 A01:2021 (Broken Access Control), RFC 7807 Standard
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../server/server.js';
import { jwtSecurityService } from '../src/core/security/jwtSecurity.service.js';

let server;
let baseUrl;

describe('Verification Gate: RBAC Endpoint Allow / Deny Matrix', () => {
  beforeAll(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  const createAuthHeader = (role, username = 'test.user') => {
    const pair = jwtSecurityService.issueTokenPair({
      userId: 'd0000000-0000-0000-0000-000000000001',
      username,
      role,
      roles: [role]
    });
    return {
      'Authorization': `Bearer ${pair.accessToken}`,
      'Content-Type': 'application/json'
    };
  };

  // ─── 1. ROLE_DOCTOR_DPJP ───
  describe('Role 1: ROLE_DOCTOR_DPJP', () => {
    it('ALLOW: DPJP should be allowed to acknowledge panic alert (LAB_PANIC_ACKNOWLEDGE)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/laboratory/panic-alerts/test-alert-id/acknowledge`, {
        method: 'POST',
        headers: createAuthHeader('ROLE_DOCTOR_DPJP', 'dr.siti.wijaya'),
        body: JSON.stringify({ recipientName: 'dr. Siti Wijaya', readBackVerified: true })
      });
      // Should NOT be 403 Forbidden (may return 200 or 404 resource not found from business logic)
      expect(res.status).not.toBe(403);
    });

    it('DENY: DPJP must be rejected from running lab analyzer (LAB_ANALYZER_RUN)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/laboratory/specimens/test-specimen-id/results`, {
        method: 'POST',
        headers: createAuthHeader('ROLE_DOCTOR_DPJP', 'dr.siti.wijaya'),
        body: JSON.stringify({ testCode: 'HB', numericValue: 13.5 })
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('PERMISSION_DENIED');
      expect(body.type).toContain('forbidden');
    });
  });

  // ─── 2. ROLE_DOCTOR_EMERGENCY ───
  describe('Role 2: ROLE_DOCTOR_EMERGENCY', () => {
    it('ALLOW: Emergency Doctor should be allowed to collect blood specimen in resuscitation (LAB_SPECIMEN_COLLECT)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/laboratory/specimens/test-specimen-id/collect`, {
        method: 'POST',
        headers: createAuthHeader('ROLE_DOCTOR_EMERGENCY', 'dr.budi.santoso'),
        body: JSON.stringify({ phlebotomistNotes: 'ED Bed 1 Trauma Resuscitation' })
      });
      expect(res.status).not.toBe(403);
    });

    it('DENY: Emergency Doctor must be rejected from releasing final lab report (LAB_RESULT_VALIDATE)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/laboratory/results/test-result-id/release`, {
        method: 'POST',
        headers: createAuthHeader('ROLE_DOCTOR_EMERGENCY', 'dr.budi.santoso'),
        body: JSON.stringify({ verified: true })
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('PERMISSION_DENIED');
    });
  });

  // ─── 3. ROLE_NURSE ───
  describe('Role 3: ROLE_NURSE', () => {
    it('ALLOW: Clinical Nurse should be allowed to collect specimen at ward (LAB_SPECIMEN_COLLECT)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/laboratory/specimens/test-specimen-id/collect`, {
        method: 'POST',
        headers: createAuthHeader('ROLE_NURSE', 'ners.indah'),
        body: JSON.stringify({ phlebotomistNotes: 'Ward 3B phlebotomy' })
      });
      expect(res.status).not.toBe(403);
    });

    it('DENY: Clinical Nurse must be rejected from acquiring PACS DICOM studies (RAD_IMAGE_ACQUIRE)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/radiology/studies/acquire`, {
        method: 'POST',
        headers: createAuthHeader('ROLE_NURSE', 'ners.indah'),
        body: JSON.stringify({ modality: 'CT' })
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('PERMISSION_DENIED');
    });
  });

  // ─── 4. ROLE_PHARMACIST ───
  describe('Role 4: ROLE_PHARMACIST', () => {
    it('ALLOW: Pharmacist should be allowed to read CPOE orders (CPOE_ORDER_READ)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/laboratory/orders/order-123/specimens`, {
        method: 'GET',
        headers: createAuthHeader('ROLE_PHARMACIST', 'apt.dimas')
      });
      expect(res.status).not.toBe(403);
    });

    it('DENY: Pharmacist must be rejected from operating laboratory analyzer (LAB_ANALYZER_RUN)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/laboratory/specimens/test-specimen-id/results`, {
        method: 'POST',
        headers: createAuthHeader('ROLE_PHARMACIST', 'apt.dimas'),
        body: JSON.stringify({ testCode: 'GLUCOSE', numericValue: 120 })
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('PERMISSION_DENIED');
    });
  });

  // ─── 5. ROLE_LAB_ANALYST ───
  describe('Role 5: ROLE_LAB_ANALYST', () => {
    it('ALLOW: Lab Analyst should be allowed to enter analyzer results (LAB_ANALYZER_RUN)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/laboratory/specimens/test-specimen-id/results`, {
        method: 'POST',
        headers: createAuthHeader('ROLE_LAB_ANALYST', 'analyst.budi'),
        body: JSON.stringify({ testCode: 'HB', numericValue: 14.1 })
      });
      expect(res.status).not.toBe(403);
    });

    it('DENY: Lab Analyst must be rejected from acquiring PACS radiology imaging (RAD_IMAGE_ACQUIRE)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/radiology/studies/acquire`, {
        method: 'POST',
        headers: createAuthHeader('ROLE_LAB_ANALYST', 'analyst.budi'),
        body: JSON.stringify({ modality: 'MRI' })
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('PERMISSION_DENIED');
    });
  });

  // ─── 6. ROLE_RADIOGRAPHER ───
  describe('Role 6: ROLE_RADIOGRAPHER', () => {
    it('ALLOW: Radiographer should be allowed to acquire DICOM study (RAD_IMAGE_ACQUIRE)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/radiology/studies/acquire`, {
        method: 'POST',
        headers: createAuthHeader('ROLE_RADIOGRAPHER', 'rad.eko'),
        body: JSON.stringify({ modality: 'CR', bodyPart: 'CHEST' })
      });
      expect(res.status).not.toBe(403);
    });

    it('DENY: Radiographer must be rejected from validating lab results (LAB_RESULT_VALIDATE)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/laboratory/results/test-result-id/release`, {
        method: 'POST',
        headers: createAuthHeader('ROLE_RADIOGRAPHER', 'rad.eko'),
        body: JSON.stringify({ verified: true })
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('PERMISSION_DENIED');
    });
  });

  // ─── 7. ROLE_SUPER_ADMIN ───
  describe('Role 7: ROLE_SUPER_ADMIN', () => {
    it('ALLOW: Super Administrator with wildcard (*) should be authorized across endpoints', async () => {
      const res = await fetch(`${baseUrl}/api/v1/laboratory/specimens/test-specimen-id/results`, {
        method: 'POST',
        headers: createAuthHeader('ROLE_SUPER_ADMIN', 'admin.dev'),
        body: JSON.stringify({ testCode: 'HB', numericValue: 12.0 })
      });
      expect(res.status).not.toBe(403);
    });
  });

  // ─── Negative: Unauthenticated Request ───
  describe('Negative: No Token Provided', () => {
    it('DENY: Endpoint should return 401 UNAUTHORIZED when no authorization header is provided', async () => {
      const res = await fetch(`${baseUrl}/api/v1/laboratory/specimens/test-specimen-id/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCode: 'HB', numericValue: 12.0 })
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('UNAUTHORIZED');
    });
  });
});
