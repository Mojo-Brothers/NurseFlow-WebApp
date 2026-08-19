/**
 * NurseFlow Enterprise HIS 2026 — Sprint 3P.7: SATUSEHAT External Transport Test Suite
 * Standards: Real HTTPS Transport Architecture, OAuth 2.0 RFC 6749,
 * Strict TLS Certificate Validation, Zero Secret Leakage Redaction, Ghost ACK Defensive Reconciliation.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { satusehatExternalTransportService, TRANSPORT_MODE } from '../src/core/interoperability/satusehat/transport/satusehatExternalTransport.service.js';
import { satusehatLiveGatewayService } from '../src/core/interoperability/satusehat/gateway/satusehatLiveGateway.service.js';
import { secureTokenVaultService } from '../src/core/interoperability/satusehat/auth/secureTokenVault.service.js';
import { postgresPoolService, pool } from '../server/db/postgresPool.js';
import { KEMKES_PROFILES, KEMKES_SYSTEMS } from '../src/core/interoperability/fhir/profiles/kemkesProfiles.js';

describe('🌐 SPRINT 3P.7: SATUSEHAT External Transport & Sandbox Acceptance Gate', () => {
  const testTenantId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    await pool.query(`
      INSERT INTO tenant_organizations (id, tenant_code, organization_name, hospital_type, status)
      VALUES ('${testTenantId}', 'TENANT-HOSPITAL-01', 'RSUD NurseFlow Pusat', 'GENERAL_HOSPITAL', 'ACTIVE')
      ON CONFLICT (id) DO NOTHING;
    `);

    await secureTokenVaultService.storeTenantCredentials({
      tenantId: testTenantId,
      organizationId: '1000001',
      clientId: 'SATUSEHAT_TEST_CLIENT_ID',
      clientSecret: 'SATUSEHAT_TEST_CLIENT_SECRET_KEY_12345678'
    });
  });

  beforeEach(() => {
    satusehatExternalTransportService.resetState();
    satusehatLiveGatewayService.resetState();
    secureTokenVaultService.clearInMemoryCache();
  });

  afterAll(() => {
    satusehatExternalTransportService.resetState();
    satusehatLiveGatewayService.resetState();
  });

  // ==========================================================================
  // 1. OAUTH 2.0 TOKEN EXCHANGE OVER HTTPS
  // ==========================================================================
  describe('1. OAuth 2.0 Token Exchange Contract & Security Telemetry', () => {
    it('1.1 should perform OAuth token exchange and log sanitized network telemetry', async () => {
      const oauthResult = await satusehatExternalTransportService.exchangeOAuthToken({
        clientId: 'CLIENT-ID-SANDBOX-TEST',
        clientSecret: 'super-secret-sandbox-key-12345'
      });

      expect(oauthResult.accessToken).toBeDefined();
      expect(oauthResult.tokenType).toBe('Bearer');
      expect(oauthResult.expiresIn).toBeGreaterThan(0);

      const logs = satusehatExternalTransportService.getTelemetryLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].type).toBe('OAUTH_TOKEN_EXCHANGE');
      expect(logs[0].httpMethod).toBe('POST');
      expect(logs[0].tlsRejectUnauthorized).toBe(true); // Strict TLS enforced
      expect(logs[0].requestHash).toBeDefined();
      expect(logs[0].responseHash).toBeDefined();
      expect(logs[0]).not.toHaveProperty('clientSecret'); // Zero secret leakage
    });
  });

  // ==========================================================================
  // 2. FHIR RESTFUL DISPATCH & HEADERS
  // ==========================================================================
  describe('2. FHIR RESTful API Dispatch & Header Conformance', () => {
    it('2.1 should dispatch FHIR Patient resource with standard headers and correlation ID', async () => {
      const patient = {
        resourceType: 'Patient',
        id: 'PAT-TRANS-01',
        meta: { profile: [KEMKES_PROFILES.PATIENT] },
        identifier: [{ system: KEMKES_SYSTEMS.NIK, value: '3201888899990001' }],
        gender: 'female'
      };

      const dispatchResult = await satusehatExternalTransportService.dispatchFhirResource({
        resourceType: 'Patient',
        resourcePayload: patient,
        accessToken: 'sample-bearer-token-123',
        idempotencyKey: 'IDEMP-PAT-01'
      });

      expect(dispatchResult.status).toBe(201);
      expect(dispatchResult.data.id).toMatch(/^IHS-PATIENT-/);
      expect(dispatchResult.correlationId).toBeDefined();

      const logs = satusehatExternalTransportService.getTelemetryLogs();
      const patientLog = logs.find(l => l.type === 'FHIR_PATIENT_DISPATCH');
      expect(patientLog).toBeDefined();
      expect(patientLog.tlsVersion).toBe('TLSv1.3');
      expect(patientLog.remoteResourceId).toBe(dispatchResult.data.id);
    });
  });

  // ==========================================================================
  // 3. ZERO SECRET LEAKAGE VERIFICATION
  // ==========================================================================
  describe('3. Zero Secret Leakage Invariant (NIST SP 800-57)', () => {
    it('3.1 should confirm zero client_secret or unmasked tokens appear in telemetry logs', async () => {
      await satusehatExternalTransportService.exchangeOAuthToken({
        clientId: 'LEAK-TEST-CLIENT',
        clientSecret: 'ULTRA_SECRET_TOKEN_DO_NOT_LEAK'
      });

      const logs = satusehatExternalTransportService.getTelemetryLogs();
      const logsJson = JSON.stringify(logs);

      expect(logsJson).not.toContain('ULTRA_SECRET_TOKEN_DO_NOT_LEAK');
      expect(logsJson).not.toContain('client_secret');
      expect(logsJson).not.toContain('authorization');
    });
  });

  // ==========================================================================
  // 4. GHOST ACK & DEFENSIVE RECONCILIATION
  // ==========================================================================
  describe('4. Ghost ACK & Remote-Success Defensive Reconciliation', () => {
    it('4.1 should recover remote resource losslessly when connection drops before HTTP ACK is received', async () => {
      const patient = {
        resourceType: 'Patient',
        id: 'PAT-GHOST-RECONCILE',
        meta: { profile: [KEMKES_PROFILES.PATIENT] },
        identifier: [{ system: KEMKES_SYSTEMS.NIK, value: '3201444455550001' }],
        gender: 'male'
      };

      const idempotencyKey = 'IDEMP-GHOST-KEY-999';

      // 1st Attempt: Socket drops after server created resource
      satusehatExternalTransportService.setHarnessFault('GHOST_ACK_ECONNRESET');

      await expect(satusehatExternalTransportService.dispatchFhirResource({
        resourceType: 'Patient',
        resourcePayload: patient,
        accessToken: 'token-abc',
        idempotencyKey
      })).rejects.toThrow('ECONNRESET');

      // Clear fault for 2nd Attempt: Client retries with same idempotencyKey
      satusehatExternalTransportService.setHarnessFault(null);

      const retryResult = await satusehatExternalTransportService.dispatchFhirResource({
        resourceType: 'Patient',
        resourcePayload: patient,
        accessToken: 'token-abc',
        idempotencyKey
      });

      expect(retryResult.status).toBe(200); // Returned existing created resource
      expect(retryResult.data.idempotentReplay).toBe(true);
      expect(retryResult.data.id).toMatch(/^IHS-PATIENT-GHOST-/);
    });
  });

  // ==========================================================================
  // 5. END-TO-END GATEWAY INTEGRATION WITH REAL TRANSPORT SERVICE
  // ==========================================================================
  describe('5. End-to-End Gateway Integration with Real Transport Service', () => {
    it('5.1 should execute full patient transmission through Live Gateway using External Transport', async () => {
      const patient = {
        resourceType: 'Patient',
        id: 'PAT-LIVE-GW-01',
        meta: { profile: [KEMKES_PROFILES.PATIENT] },
        identifier: [{ system: KEMKES_SYSTEMS.NIK, value: '3201222233330001' }],
        gender: 'male'
      };

      const result = await satusehatLiveGatewayService.transmitResource({
        tenantId: testTenantId,
        resource: patient,
        clinicalTransactionId: 'TX-LIVE-TRANSPORT-01'
      });

      expect(result.success).toBe(true);
      expect(result.satusehatId).toMatch(/^IHS-PATIENT-/);
      expect(result.auditEventId).toBeDefined();

      const logs = satusehatExternalTransportService.getTelemetryLogs();
      expect(logs.length).toBeGreaterThanOrEqual(2); // OAuth + FHIR Dispatch
    });
  });

  // ==========================================================================
  // 6. LIVE HTTPS ENDPOINT PROBE & TLS CONTRACT (KEMENKES DTO GATEWAY)
  // ==========================================================================
  describe('6. Live HTTPS Endpoint Reachability & TLS Validation (Kemenkes DTO Gateway)', () => {
    it('6.1 should probe live Kemenkes DTO endpoint over real HTTPS/TLS', async () => {
      const probeResult = await satusehatExternalTransportService.probeLiveEndpoint();
      expect(probeResult.endpoint).toBe('api-satusehat-stg.dto.kemkes.go.id');
      if (probeResult.reachable) {
        expect(probeResult.tlsValidated).toBe(true);
        expect([401, 429]).toContain(probeResult.httpStatus); // 401 or 429 proves real Kemenkes server response
        expect(probeResult.provenance).toBe('REAL_EXTERNAL_EVIDENCE');
      } else {
        expect(probeResult.provenance).toBe('EXTERNAL_NETWORK_UNREACHABLE');
      }
    });
  });
});
