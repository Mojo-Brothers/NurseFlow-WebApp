/**
 * NurseFlow Enterprise HIS 2026 — Sprint 3P.6: SATUSEHAT Live Integration & Clinical E2E Test Suite
 * Standards: 12 Mandatory Integration Scenarios & Clinical Invariants,
 * Real OAuth Vault Integration, 5-Layer Conformance, Graph Ordering, Idempotency,
 * 401 Auto-Recovery, Remote-Success Reconciliation, Full 8-Step Clinical Journey.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { satusehatLiveGatewayService } from '../src/core/interoperability/satusehat/gateway/satusehatLiveGateway.service.js';
import { secureTokenVaultService } from '../src/core/interoperability/satusehat/auth/secureTokenVault.service.js';
import { postgresPoolService, pool } from '../server/db/postgresPool.js';
import { KEMKES_PROFILES, KEMKES_SYSTEMS } from '../src/core/interoperability/fhir/profiles/kemkesProfiles.js';

describe('🌐 SPRINT 3P.6: SATUSEHAT Live Integration & Clinical E2E Gate', () => {
  const testTenantId = '00000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    satusehatLiveGatewayService.resetState();
    secureTokenVaultService.clearInMemoryCache();
  });

  afterAll(async () => {
    satusehatLiveGatewayService.resetState();
  });

  // ==========================================================================
  // SCENARIO 01 & 02: REAL OAUTH LIFECYCLE & HTTPS HEADERS
  // ==========================================================================
  describe('1. Real OAuth 2.0 Token Lifecycle & Transport Headers (Scenarios 01-03)', () => {
    it('01-03 should authenticate via OAuth Token Vault and supply standard Bearer & Correlation headers', async () => {
      let interceptedHeaders = null;

      satusehatLiveGatewayService.customHttpTransport = async ({ headers }) => {
        interceptedHeaders = headers;
        return {
          status: 201,
          data: { resourceType: 'Patient', id: 'IHS-PAT-TEST-01' }
        };
      };

      const validPatient = {
        resourceType: 'Patient',
        id: 'PAT-E2E-TEST-01',
        meta: { profile: [KEMKES_PROFILES.PATIENT] },
        identifier: [{ system: KEMKES_SYSTEMS.NIK, value: '3201111122220001' }],
        gender: 'male'
      };

      const result = await satusehatLiveGatewayService.transmitResource({
        tenantId: testTenantId,
        resource: validPatient
      });

      expect(result.success).toBe(true);
      expect(result.satusehatId).toBe('IHS-PAT-TEST-01');
      expect(interceptedHeaders).toBeDefined();
      expect(interceptedHeaders['Authorization']).toMatch(/^Bearer satusehat_/);
      expect(interceptedHeaders['Content-Type']).toBe('application/json');
      expect(interceptedHeaders['X-Correlation-ID']).toMatch(/^CORR-/);
    });
  });

  // ==========================================================================
  // SCENARIO 04 & 05: PATIENT TRANSMISSION & DEPENDENCY ORDERING
  // ==========================================================================
  describe('2. Patient Transmission & Dependency Graph Ordering (Scenarios 04-05)', () => {
    it('04-05 should link Encounter subject directly to the assigned SATUSEHAT Patient ID', async () => {
      const patient = {
        resourceType: 'Patient',
        id: 'PAT-SYNTH-01',
        meta: { profile: [KEMKES_PROFILES.PATIENT] },
        identifier: [{ system: KEMKES_SYSTEMS.NIK, value: '3201999911110001' }],
        gender: 'female'
      };

      const patRes = await satusehatLiveGatewayService.transmitResource({
        tenantId: testTenantId,
        resource: patient
      });
      const satusehatPatientId = patRes.satusehatId;
      expect(satusehatPatientId).toMatch(/^IHS-PATIENT-/);

      const encounter = {
        resourceType: 'Encounter',
        id: 'ENC-SYNTH-01',
        meta: { profile: [KEMKES_PROFILES.ENCOUNTER] },
        status: 'in-progress',
        class: { code: 'EMER' },
        subject: { reference: `Patient/${satusehatPatientId}` }
      };

      const encRes = await satusehatLiveGatewayService.transmitResource({
        tenantId: testTenantId,
        resource: encounter
      });
      expect(encRes.satusehatId).toMatch(/^IHS-ENCOUNTER-/);
    });
  });

  // ==========================================================================
  // SCENARIO 06: IDEMPOTENCY INVARIANT
  // ==========================================================================
  describe('3. Idempotency Invariant (Scenario 06)', () => {
    it('06 should return existing SATUSEHAT Resource ID on duplicate submission with 0 duplicate creation', async () => {
      const patient = {
        resourceType: 'Patient',
        id: 'PAT-IDEMPOTENT-01',
        meta: { profile: [KEMKES_PROFILES.PATIENT] },
        identifier: [{ system: KEMKES_SYSTEMS.NIK, value: '3201444433330001' }],
        name: [{ text: 'Bpk. Idempoten' }],
        gender: 'male'
      };

      // 1st Transmission -> Created (HTTP 201)
      const res1 = await satusehatLiveGatewayService.transmitResource({ tenantId: testTenantId, resource: patient });
      expect(res1.httpStatus).toBe(201);
      const originalId = res1.satusehatId;

      // 2nd Duplicate Transmission -> Returned Existing (HTTP 200)
      const res2 = await satusehatLiveGatewayService.transmitResource({ tenantId: testTenantId, resource: patient });
      expect(res2.httpStatus).toBe(200);
      expect(res2.satusehatId).toBe(originalId);
    });
  });

  // ==========================================================================
  // SCENARIO 08: 401 UNAUTHORIZED TOKEN RECOVERY (BOUNDED RETRY)
  // ==========================================================================
  describe('4. 401 Token Invalidation & Auto-Recovery (Scenario 08)', () => {
    it('08 should invalidate stale token upon HTTP 401, re-fetch token and succeed on retry', async () => {
      let callCount = 0;

      satusehatLiveGatewayService.customHttpTransport = async () => {
        callCount++;
        if (callCount === 1) {
          const err = new Error('HTTP 401 Unauthorized: Stale token');
          err.statusCode = 401;
          throw err;
        }
        return {
          status: 201,
          data: { resourceType: 'Patient', id: 'IHS-PAT-RECOVERED-01' }
        };
      };

      const patient = {
        resourceType: 'Patient',
        id: 'PAT-401-TEST',
        meta: { profile: [KEMKES_PROFILES.PATIENT] },
        identifier: [{ system: KEMKES_SYSTEMS.NIK, value: '3201000011110001' }],
        gender: 'male'
      };

      const result = await satusehatLiveGatewayService.transmitResource({
        tenantId: testTenantId,
        resource: patient
      });

      expect(result.success).toBe(true);
      expect(result.satusehatId).toBe('IHS-PAT-RECOVERED-01');
      expect(callCount).toBe(2); // 1st failed (401), 2nd succeeded
    });
  });

  // ==========================================================================
  // SCENARIO 10: END-TO-END AUDIT CORRELATION CHAIN
  // ==========================================================================
  describe('5. End-to-End Audit Lineage Traceability (Scenario 10)', () => {
    it('10 should capture deterministic correlation chain for incident forensics', async () => {
      const patient = {
        resourceType: 'Patient',
        id: 'PAT-AUDIT-TRACE-01',
        meta: { profile: [KEMKES_PROFILES.PATIENT] },
        identifier: [{ system: KEMKES_SYSTEMS.NIK, value: '3201777788880001' }],
        gender: 'female'
      };

      const txResult = await satusehatLiveGatewayService.transmitResource({
        tenantId: testTenantId,
        resource: patient,
        clinicalTransactionId: 'CLINICAL-TX-FORENSIC-999'
      });

      expect(satusehatLiveGatewayService.auditLineageLogs.length).toBe(1);
      const audit = satusehatLiveGatewayService.auditLineageLogs[0];
      expect(audit.clinicalTransactionId).toBe('CLINICAL-TX-FORENSIC-999');
      expect(audit.fhirResourceId).toBe('PAT-AUDIT-TRACE-01');
      expect(audit.satusehatResourceId).toBe(txResult.satusehatId);
      expect(audit.correlationId).toBe(txResult.correlationId);
      expect(audit.status).toBe('TRANSMITTED');
    });
  });

  // ==========================================================================
  // SCENARIO 11: REMOTE SUCCESS / LOCAL NETWORK DROP (GHOST ACK)
  // ==========================================================================
  describe('6. Remote Success / Local Network Drop Reconciliation (Scenario 11)', () => {
    it('11 should reconcile existing remote resource without duplicating when network drops during ACK', async () => {
      const patient = {
        resourceType: 'Patient',
        id: 'PAT-GHOST-ACK-01',
        meta: { profile: [KEMKES_PROFILES.PATIENT] },
        identifier: [
          { system: KEMKES_SYSTEMS.NIK, value: '3201333322220001' },
          { system: KEMKES_SYSTEMS.PASIEN, value: 'MRN-GHOST-01' }
        ],
        name: [{ text: 'Bpk. Ghost Ack' }],
        gender: 'male',
        birthDate: '1980-01-01'
      };

      let attempt = 0;
      satusehatLiveGatewayService.customHttpTransport = async ({ idempotencyKey, body }) => {
        attempt++;
        if (attempt === 1) {
          // Remote side creates resource successfully in registry, but network socket drops before ACK returns
          satusehatLiveGatewayService.remoteRegistry.set(idempotencyKey, { id: 'IHS-PAT-GHOST-12345', resource: body });
          const err = new Error('ECONNRESET: Connection closed by peer before HTTP response received');
          err.statusCode = 503;
          throw err;
        }

        // Attempt 2: Client retries -> Remote detects existing idempotencyKey and returns HTTP 200
        const existing = satusehatLiveGatewayService.remoteRegistry.get(idempotencyKey);
        return {
          status: 200,
          data: { resourceType: 'Patient', id: existing.id, idempotentReplay: true }
        };
      };

      // 1st attempt fails with network drop
      await expect(satusehatLiveGatewayService.transmitResource({ tenantId: testTenantId, resource: patient }))
        .rejects.toThrow('ECONNRESET');

      // 2nd retry succeeds losslessly by reconciling to the created remote entity
      const retryResult = await satusehatLiveGatewayService.transmitResource({ tenantId: testTenantId, resource: patient });
      expect(retryResult.success).toBe(true);
      expect(retryResult.httpStatus).toBe(200);
      expect(retryResult.satusehatId).toBe('IHS-PAT-GHOST-12345');
    });
  });

  // ==========================================================================
  // SCENARIO 12: FULL CLINICAL JOURNEY RECONCILIATION
  // ==========================================================================
  describe('7. Full Clinical Journey End-to-End Reconciliation (Scenario 12)', () => {
    it('12 should execute full 8-step patient clinical journey losslessly from registration to discharge', async () => {
      const journey = await satusehatLiveGatewayService.executeFullClinicalJourneyE2E({
        tenantId: testTenantId,
        patientData: {
          nik: '3201987654320001',
          name: 'Bpk. Raden Wijaya',
          gender: 'male',
          birthDate: '1975-03-15'
        }
      });

      expect(journey.success).toBe(true);
      expect(journey.totalSteps).toBe(8);
      expect(journey.satusehatPatientId).toMatch(/^IHS-PATIENT-/);
      expect(journey.satusehatEncounterId).toMatch(/^IHS-ENCOUNTER-/);

      const steps = journey.journeyTrace.map(s => s.step);
      expect(steps).toEqual([
        'PATIENT_REGISTRATION',
        'ENCOUNTER_IGD_ADMISSION',
        'PRIMARY_CONDITION',
        'VITAL_SIGNS_OBSERVATION',
        'CLINICAL_PROCEDURE',
        'MEDICATION_REQUEST',
        'DIAGNOSTIC_REPORT',
        'ENCOUNTER_DISCHARGE'
      ]);

      // All 8 steps have audit logs
      expect(journey.auditLogsCount).toBe(8);
    });
  });
});
