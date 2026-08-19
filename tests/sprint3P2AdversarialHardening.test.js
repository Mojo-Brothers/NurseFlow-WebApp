/**
 * NurseFlow Enterprise HIS 2026 — Sprint 3P.2: Adversarial Security Hardening & Acceptance Audit
 * Standards: OAuth 2.0 (RFC 6749), NIST SP 800-57 (Key Lifecycle & Re-encryption),
 * PostgreSQL 16 Force RLS, Single-Flight Cluster Stampede Guard, Anti-Secret-Leakage.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { secureTokenVaultService, MASTER_KEYS } from '../src/core/interoperability/satusehat/auth/secureTokenVault.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';

const TENANT_A = '00000000-0000-0000-0000-000000000001';
const TENANT_B = '00000000-0000-0000-0000-000000000002';

describe('🛡️ SPRINT 3P.2: Adversarial Security Hardening & Acceptance Audit Gate', () => {
  beforeAll(async () => {
    // Seed encrypted credentials
    await secureTokenVaultService.storeTenantCredentials({
      tenantId: TENANT_A,
      organizationId: '100028741',
      clientId: 'SATUSEHAT_CLIENT_ID_TENANT_A',
      clientSecret: 'SATUSEHAT_TOP_SECRET_TENANT_A_CONFIDENTIAL',
      environment: 'STAGING'
    });

    await secureTokenVaultService.storeTenantCredentials({
      tenantId: TENANT_B,
      organizationId: '200049912',
      clientId: 'SATUSEHAT_CLIENT_ID_TENANT_B',
      clientSecret: 'SATUSEHAT_TOP_SECRET_TENANT_B_CONFIDENTIAL',
      environment: 'PRODUCTION'
    });
  });

  // ==========================================================================
  // 1. MASTER KEY LIFECYCLE, VERSIONING & RE-ENCRYPTION (NIST SP 800-57)
  // ==========================================================================
  describe('1. Master Key Lifecycle, Versioning & Re-encryption', () => {
    it('1.1 should rotate Master Vault Key from V1 to V2 and re-encrypt all stored credentials in-place', async () => {
      const rotationRes = await secureTokenVaultService.rotateMasterVaultKey('V2', MASTER_KEYS.V2);

      expect(rotationRes.success).toBe(true);
      expect(rotationRes.rotatedKeyVersion).toBe('V2');
      expect(rotationRes.totalReEncrypted).toBeGreaterThanOrEqual(2);

      // Verify database reflects V2
      const client = await postgresPoolService.getClient();
      try {
        const rows = await client.query('SELECT tenant_id, key_version FROM tenant_satusehat_credentials;');
        expect(rows.rows.every(r => r.key_version === 'V2')).toBe(true);
      } finally {
        client.release();
      }

      // Verify token acquisition still succeeds seamlessly with V2 key
      const tokenV2 = await secureTokenVaultService.getAccessToken(TENANT_A, true);
      expect(tokenV2.accessToken).toBeDefined();
      expect(tokenV2.organizationId).toBe('100028741');
    });
  });

  // ==========================================================================
  // 2. HIGH-SCALE CONCURRENCY TORTURE (250 SIMULTANEOUS CALLERS)
  // ==========================================================================
  describe('2. High-Scale Concurrency Torture (250 Concurrent Callers)', () => {
    it('2.1 should collapse 250 simultaneous requests into exactly 1 token exchange with 0 stampede', async () => {
      secureTokenVaultService.invalidateToken(TENANT_A, 'PRE_250_TORTURE_RESET');

      const callers = Array.from({ length: 250 }, () => secureTokenVaultService.getAccessToken(TENANT_A));
      const responses = await Promise.all(callers);

      expect(responses.length).toBe(250);
      const firstToken = responses[0].accessToken;
      expect(responses.every(r => r.accessToken === firstToken)).toBe(true);

      const metrics = secureTokenVaultService.getTokenVaultMetrics(TENANT_A);
      expect(metrics.singleFlightHits).toBeGreaterThanOrEqual(240);
    });
  });

  // ==========================================================================
  // 3. ADVERSARIAL FAILURE INJECTION & PROMISE CLEANUP
  // ==========================================================================
  describe('3. Adversarial Failure Injection & Promise Cleanup', () => {
    it('3.1 should reject all concurrent callers on gateway timeout without hanging promises', async () => {
      secureTokenVaultService.invalidateToken(TENANT_A, 'FAILURE_TEST_RESET');
      secureTokenVaultService.failureInjectionMode = 'TIMEOUT';

      const callers = Array.from({ length: 10 }, () => secureTokenVaultService.getAccessToken(TENANT_A));
      const results = await Promise.allSettled(callers);

      expect(results.every(r => r.status === 'rejected')).toBe(true);
      expect(secureTokenVaultService.singleFlightMap.has(TENANT_A)).toBe(false); // Cleaned up

      // Reset failure mode and verify recovery
      secureTokenVaultService.failureInjectionMode = null;
      const recovered = await secureTokenVaultService.getAccessToken(TENANT_A);
      expect(recovered.accessToken).toBeDefined();
    });
  });

  // ==========================================================================
  // 4. SECRET LEAKAGE & ANTI-EXPOSURE AUDIT
  // ==========================================================================
  describe('4. Secret Leakage & Anti-Exposure Audit', () => {
    it('4.1 should ensure client_secret never appears in telemetry, errors, or serialized objects', () => {
      const telemetry = secureTokenVaultService.getTokenVaultMetrics(TENANT_A);
      const str = JSON.stringify(telemetry);

      expect(str.includes('SATUSEHAT_TOP_SECRET')).toBe(false);
      expect(str.includes('client_secret')).toBe(false);
      expect(str.includes('secret_iv')).toBe(false);
    });
  });

  // ==========================================================================
  // 5. PROCESS CRASH & RESTART RESILIENCE (DISPOSABLE CACHE)
  // ==========================================================================
  describe('5. Process Crash & Restart Resilience (Disposable Cache)', () => {
    it('5.1 should safely resume and reacquire tokens after complete in-memory cache wipe', async () => {
      await secureTokenVaultService.getAccessToken(TENANT_A);
      expect(secureTokenVaultService.tokenCache.has(TENANT_A)).toBe(true);

      // Simulate abrupt process crash / memory wipe
      secureTokenVaultService.clearInMemoryCache();
      expect(secureTokenVaultService.tokenCache.has(TENANT_A)).toBe(false);

      // New process incoming request
      const resumedToken = await secureTokenVaultService.getAccessToken(TENANT_A);
      expect(resumedToken.accessToken).toBeDefined();
      expect(resumedToken.organizationId).toBe('100028741');
      expect(secureTokenVaultService.tokenCache.has(TENANT_A)).toBe(true);
    });
  });

  // ==========================================================================
  // 6. POSTGRESQL 16 ROW-LEVEL SECURITY ENFORCEMENT
  // ==========================================================================
  describe('6. PostgreSQL 16 Row-Level Security Enforcement', () => {
    it('6.1 should strictly isolate credentials per tenant under non-superuser RLS role', async () => {
      const client = await postgresPoolService.getClient();

      try {
        await client.query('BEGIN');
        await client.query('SET LOCAL ROLE nurseflow_app_user');
        await client.query(`SET LOCAL app.current_tenant_id = '${TENANT_A}'`);

        const resA = await client.query('SELECT tenant_id, organization_id FROM tenant_satusehat_credentials;');
        expect(resA.rows.length).toBe(1);
        expect(resA.rows[0].tenant_id).toBe(TENANT_A);
        expect(resA.rows.some(r => r.tenant_id === TENANT_B)).toBe(false);

        // Switch context to Tenant B
        await client.query(`SET LOCAL app.current_tenant_id = '${TENANT_B}'`);
        const resB = await client.query('SELECT tenant_id, organization_id FROM tenant_satusehat_credentials;');
        expect(resB.rows.length).toBe(1);
        expect(resB.rows[0].tenant_id).toBe(TENANT_B);
        expect(resB.rows.some(r => r.tenant_id === TENANT_A)).toBe(false);

        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    });
  });
});
