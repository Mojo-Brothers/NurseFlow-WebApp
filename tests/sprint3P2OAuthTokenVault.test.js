/**
 * NurseFlow Enterprise HIS 2026 — Sprint 3P.2: OAuth 2.0 Credential Lifecycle & Secure Token Vault Suite
 * Standards: OAuth 2.0 (RFC 6749), NIST SP 800-57, Kemkes SATUSEHAT Client Credentials Flow.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { secureTokenVaultService } from '../src/core/interoperability/satusehat/auth/secureTokenVault.service.js';

const TENANT_A = '00000000-0000-0000-0000-000000000001';
const TENANT_B = '00000000-0000-0000-0000-000000000002';

describe('🔐 SPRINT 3P.2: SATUSEHAT OAuth 2.0 Credential Lifecycle & Token Vault Gate', () => {
  beforeAll(async () => {
    // Store encrypted credentials for Tenant A
    await secureTokenVaultService.storeTenantCredentials({
      tenantId: TENANT_A,
      organizationId: '100028741',
      clientId: 'SATUSEHAT_CLIENT_ID_TENANT_A',
      clientSecret: 'SATUSEHAT_SUPER_SECRET_TENANT_A_12345',
      environment: 'STAGING'
    });

    // Store encrypted credentials for Tenant B
    await secureTokenVaultService.storeTenantCredentials({
      tenantId: TENANT_B,
      organizationId: '200049912',
      clientId: 'SATUSEHAT_CLIENT_ID_TENANT_B',
      clientSecret: 'SATUSEHAT_SUPER_SECRET_TENANT_B_99999',
      environment: 'PRODUCTION'
    });
  });

  // ==========================================================================
  // 1. AES-256-GCM SECRET ENCRYPTION & DECRYPTION
  // ==========================================================================
  describe('1. AES-256-GCM Secret Encryption & Decryption', () => {
    it('1.1 should encrypt client secret into ciphertext with unique IV and Auth Tag', () => {
      const secret = 'KEMKES_TOP_SECRET_CREDENTIAL_KEY';
      const enc = secureTokenVaultService.encryptSecret(secret);

      expect(enc.encryptedHex).toBeDefined();
      expect(enc.encryptedHex).not.toBe(secret);
      expect(enc.ivHex).toBeDefined();
      expect(enc.ivHex.length).toBe(24); // 12 bytes = 24 hex
      expect(enc.authTagHex).toBeDefined();
      expect(enc.authTagHex.length).toBe(32); // 16 bytes = 32 hex
    });

    it('1.2 should decrypt ciphertext back to original plain secret with matching Auth Tag', () => {
      const secret = 'KEMKES_TOP_SECRET_CREDENTIAL_KEY';
      const enc = secureTokenVaultService.encryptSecret(secret);
      const dec = secureTokenVaultService.decryptSecret(enc.encryptedHex, enc.ivHex, enc.authTagHex);

      expect(dec).toBe(secret);
    });

    it('1.3 should FAIL decryption when ciphertext or Auth Tag has been tampered with', () => {
      const secret = 'KEMKES_TOP_SECRET_CREDENTIAL_KEY';
      const enc = secureTokenVaultService.encryptSecret(secret);
      const tamperedTag = enc.authTagHex.replace(/^../, '00');

      expect(() => {
        secureTokenVaultService.decryptSecret(enc.encryptedHex, enc.ivHex, tamperedTag);
      }).toThrow();
    });
  });

  // ==========================================================================
  // 2. MULTI-TENANT TOKEN ACQUISITION & ISOLATION
  // ==========================================================================
  describe('2. Multi-Tenant Token Acquisition & Isolation', () => {
    it('2.1 should acquire separate tokens for distinct hospital tenants', async () => {
      const tokA = await secureTokenVaultService.getAccessToken(TENANT_A, true);
      const tokB = await secureTokenVaultService.getAccessToken(TENANT_B, true);

      expect(tokA.accessToken).toBeDefined();
      expect(tokB.accessToken).toBeDefined();
      expect(tokA.accessToken).not.toBe(tokB.accessToken);
      expect(tokA.organizationId).toBe('100028741');
      expect(tokB.organizationId).toBe('200049912');
    });

    it('2.2 should return in-memory cached token on subsequent calls for same tenant', async () => {
      const tok1 = await secureTokenVaultService.getAccessToken(TENANT_A);
      const tok2 = await secureTokenVaultService.getAccessToken(TENANT_A);

      expect(tok2.isCached).toBe(true);
      expect(tok2.accessToken).toBe(tok1.accessToken);
    });
  });

  // ==========================================================================
  // 3. SINGLE-FLIGHT CONCURRENCY LOCK (CACHE STAMPEDE PROTECTION)
  // ==========================================================================
  describe('3. Single-Flight Concurrency Lock (Stampede Guard)', () => {
    it('3.1 should collapse 50 simultaneous concurrent token requests into 1 single token exchange', async () => {
      secureTokenVaultService.invalidateToken(TENANT_A, 'TEST_STAMPEDE_RESET');

      const requests = Array.from({ length: 50 }, () => secureTokenVaultService.getAccessToken(TENANT_A));
      const results = await Promise.all(requests);

      const firstToken = results[0].accessToken;
      expect(results.every(r => r.accessToken === firstToken)).toBe(true);

      const metrics = secureTokenVaultService.getTokenVaultMetrics(TENANT_A);
      expect(metrics.singleFlightHits).toBeGreaterThanOrEqual(40);
    });
  });

  // ==========================================================================
  // 4. TOKEN INVALIDATION & OBSERVABILITY TELEMETRY
  // ==========================================================================
  describe('4. Token Invalidation & Observability Telemetry', () => {
    it('4.1 should force fresh token acquisition after explicit invalidation (401 response simulation)', async () => {
      const tokBefore = await secureTokenVaultService.getAccessToken(TENANT_A);
      secureTokenVaultService.invalidateToken(TENANT_A, 'SIMULATED_401_UNAUTHORIZED');

      const tokAfter = await secureTokenVaultService.getAccessToken(TENANT_A);
      expect(tokAfter.isCached).toBe(false);
      expect(tokAfter.accessToken).not.toBe(tokBefore.accessToken);
    });

    it('4.2 should export health telemetry and expiry countdown', () => {
      const telemetry = secureTokenVaultService.getTokenVaultMetrics(TENANT_A);

      expect(telemetry.hasValidToken).toBe(true);
      expect(telemetry.timeToExpirySeconds).toBeGreaterThan(0);
      expect(telemetry.refreshCount).toBeGreaterThanOrEqual(1);
      expect(telemetry.lastRefreshTimestamp).toBeDefined();
    });
  });
});
