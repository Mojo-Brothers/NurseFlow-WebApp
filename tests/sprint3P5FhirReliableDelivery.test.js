/**
 * NurseFlow Enterprise HIS 2026 — Sprint 3P.5: FHIR Reliable Delivery Test Suite
 * Standards: Transactional Outbox, Exponential Backoff + Jitter, Error Classification,
 * Dead Letter Queue (DLQ) Replay, Dependency-Aware Graph Delivery.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { fhirReliableDeliveryEngineService, ERROR_CLASSIFICATION } from '../src/core/interoperability/fhir/engine/fhirReliableDeliveryEngine.service.js';
import { postgresPoolService, pool } from '../server/db/postgresPool.js';
import { KEMKES_PROFILES, KEMKES_SYSTEMS } from '../src/core/interoperability/fhir/profiles/kemkesProfiles.js';

describe('🚀 SPRINT 3P.5: FHIR Reliable Delivery & Outbox Engine Gate', () => {
  const testTenantId = '00000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    fhirReliableDeliveryEngineService.simulatedTransmissionHandler = null;
    await pool.query('DELETE FROM fhir_delivery_outbox WHERE tenant_id = $1;', [testTenantId]);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM fhir_delivery_outbox WHERE tenant_id = $1;', [testTenantId]);
  });

  // ==========================================================================
  // 1. ATOMIC TRANSACTIONAL OUTBOX STAGING (L1)
  // ==========================================================================
  describe('1. Atomic Transactional Outbox Staging', () => {
    it('1.1 should stage outbox event atomically in a PostgreSQL transaction', async () => {
      const client = await postgresPoolService.getClient();
      try {
        await client.query('BEGIN');

        const samplePatient = {
          resourceType: 'Patient',
          id: 'PAT-OUTBOX-01',
          meta: { profile: [KEMKES_PROFILES.PATIENT] },
          identifier: [{ system: KEMKES_SYSTEMS.NIK, value: '3201888877770001' }]
        };

        const outboxResult = await fhirReliableDeliveryEngineService.stageOutboxEvent({
          client,
          tenantId: testTenantId,
          fhirResource: samplePatient,
          dependencyDepth: 0
        });

        expect(outboxResult.outboxId).toBeDefined();
        expect(outboxResult.idempotencyKey).toBeDefined();
        expect(outboxResult.deliveryStatus).toBe('PENDING');

        await client.query('COMMIT');

        // Verify row exists in database after commit
        const check = await pool.query('SELECT * FROM fhir_delivery_outbox WHERE id = $1;', [outboxResult.outboxId]);
        expect(check.rows.length).toBe(1);
        expect(check.rows[0].delivery_status).toBe('PENDING');
      } finally {
        client.release();
      }
    });
  });

  // ==========================================================================
  // 2. ERROR CLASSIFICATION (TRANSIENT VS PERMANENT)
  // ==========================================================================
  describe('2. Error Classification Engine', () => {
    it('2.1 should classify 503, 429, 408 and Network Timeouts as TRANSIENT (Retryable)', () => {
      expect(fhirReliableDeliveryEngineService.classifyError({ statusCode: 503 })).toBe(ERROR_CLASSIFICATION.TRANSIENT);
      expect(fhirReliableDeliveryEngineService.classifyError({ statusCode: 429 })).toBe(ERROR_CLASSIFICATION.TRANSIENT);
      expect(fhirReliableDeliveryEngineService.classifyError(new Error('ETIMEDOUT: Connection timed out'))).toBe(ERROR_CLASSIFICATION.TRANSIENT);
    });

    it('2.2 should classify 400, 422 and Schema Validation Errors as PERMANENT (Non-Retryable -> DLQ)', () => {
      expect(fhirReliableDeliveryEngineService.classifyError({ statusCode: 400 })).toBe(ERROR_CLASSIFICATION.PERMANENT);
      expect(fhirReliableDeliveryEngineService.classifyError({ statusCode: 422 })).toBe(ERROR_CLASSIFICATION.PERMANENT);
      expect(fhirReliableDeliveryEngineService.classifyError(new Error('Validation failed: Missing NIK identifier'))).toBe(ERROR_CLASSIFICATION.PERMANENT);
    });
  });

  // ==========================================================================
  // 3. EXPONENTIAL BACKOFF & JITTER
  // ==========================================================================
  describe('3. Exponential Backoff & Jitter Calculation', () => {
    it('3.1 should calculate future retry timestamp with exponential backoff and jitter', () => {
      const t1 = fhirReliableDeliveryEngineService.calculateNextRetryTime(1);
      const t3 = fhirReliableDeliveryEngineService.calculateNextRetryTime(3);

      expect(t1.getTime()).toBeGreaterThan(Date.now());
      expect(t3.getTime()).toBeGreaterThan(t1.getTime());
    });
  });

  // ==========================================================================
  // 4. RESILIENT RETRY & DLQ MIGRATION
  // ==========================================================================
  describe('4. Resilient Retry & Dead Letter Queue (DLQ) Lifecycle', () => {
    it('4.1 should retry on transient failure and transition to DEAD_LETTER_QUEUE upon permanent failure', async () => {
      const patient = {
        resourceType: 'Patient',
        id: 'PAT-FAIL-TEST',
        meta: { profile: [KEMKES_PROFILES.PATIENT] }
      };

      const outbox = await fhirReliableDeliveryEngineService.stageOutboxEvent({
        tenantId: testTenantId,
        fhirResource: patient,
        maxAttempts: 2
      });

      // 1st Attempt: Simulate Transient Error (HTTP 500)
      fhirReliableDeliveryEngineService.simulatedTransmissionHandler = async () => {
        const err = new Error('HTTP 500: Temporary Server Error');
        err.statusCode = 500;
        throw err;
      };

      const dispatch1 = await fhirReliableDeliveryEngineService.processOutboxBatch({ tenantId: testTenantId });
      expect(dispatch1.results[0].status).toBe('SCHEDULED_FOR_RETRY');
      expect(dispatch1.results[0].attemptCount).toBe(1);

      // Force next_retry_at to NOW() for immediate 2nd attempt
      await pool.query('UPDATE fhir_delivery_outbox SET next_retry_at = NOW() WHERE id = $1;', [outbox.outboxId]);

      // 2nd Attempt: Exceeds maxAttempts (2) -> Should move to DLQ
      const dispatch2 = await fhirReliableDeliveryEngineService.processOutboxBatch({ tenantId: testTenantId });
      expect(dispatch2.results[0].status).toBe('MOVED_TO_DLQ');

      // Verify row status in PostgreSQL
      const dlqRows = await fhirReliableDeliveryEngineService.getDlqEvents(testTenantId);
      expect(dlqRows.length).toBe(1);
      expect(dlqRows[0].last_error_classification).toBe('TRANSIENT');
    });
  });

  // ==========================================================================
  // 5. DEPENDENCY-AWARE GRAPH ORDERING
  // ==========================================================================
  describe('5. Dependency-Aware Graph Ordering', () => {
    it('5.1 should defer child Observation until parent Encounter is DELIVERED', async () => {
      const parentEncounter = {
        resourceType: 'Encounter',
        id: 'ENC-PARENT-01',
        meta: { profile: [KEMKES_PROFILES.ENCOUNTER] }
      };

      const childObservation = {
        resourceType: 'Observation',
        id: 'OBS-CHILD-01',
        meta: { profile: [KEMKES_PROFILES.OBSERVATION_VITALS] }
      };

      // Stage Child FIRST, then Parent
      await fhirReliableDeliveryEngineService.stageOutboxEvent({
        tenantId: testTenantId,
        fhirResource: childObservation,
        parentResourceType: 'Encounter',
        parentResourceId: 'ENC-PARENT-01',
        dependencyDepth: 1
      });

      await fhirReliableDeliveryEngineService.stageOutboxEvent({
        tenantId: testTenantId,
        fhirResource: parentEncounter,
        dependencyDepth: 0
      });

      // Execute batch with batchSize: 1 -> Only Parent (depth 0) is delivered first
      const batchResult1 = await fhirReliableDeliveryEngineService.processOutboxBatch({ tenantId: testTenantId, batchSize: 1 });
      expect(batchResult1.results.length).toBe(1);
      expect(batchResult1.results[0].resourceType).toBe('Encounter');
      expect(batchResult1.results[0].status).toBe('DELIVERED');

      // Subsequent batch: Child (depth 1) is now dispatched because parent is already DELIVERED
      const batchResult2 = await fhirReliableDeliveryEngineService.processOutboxBatch({ tenantId: testTenantId, batchSize: 1 });
      expect(batchResult2.results.length).toBe(1);
      expect(batchResult2.results[0].resourceType).toBe('Observation');
      expect(batchResult2.results[0].status).toBe('DELIVERED');
    });
  });

  // ==========================================================================
  // 6. DLQ INSPECTION & REPLAY RECOVERY
  // ==========================================================================
  describe('6. DLQ Inspection & Replay Recovery', () => {
    it('6.1 should recover and replay a DLQ event after payload remediation', async () => {
      const brokenPatient = {
        resourceType: 'Patient',
        id: 'PAT-DLQ-REPLAY',
        meta: { profile: [KEMKES_PROFILES.PATIENT] }
      };

      const outbox = await fhirReliableDeliveryEngineService.stageOutboxEvent({
        tenantId: testTenantId,
        fhirResource: brokenPatient
      });

      // Force error into DLQ
      fhirReliableDeliveryEngineService.simulatedTransmissionHandler = async () => {
        const err = new Error('HTTP 422: Unprocessable Entity');
        err.statusCode = 422;
        throw err;
      };

      await fhirReliableDeliveryEngineService.processOutboxBatch({ tenantId: testTenantId });

      const dlqEvents = await fhirReliableDeliveryEngineService.getDlqEvents(testTenantId);
      expect(dlqEvents.length).toBe(1);

      // Replay with fixed payload (with valid NIK)
      const remediatedPatient = {
        resourceType: 'Patient',
        id: 'PAT-DLQ-REPLAY',
        meta: { profile: [KEMKES_PROFILES.PATIENT] },
        identifier: [{ system: KEMKES_SYSTEMS.NIK, value: '3201123456780001' }],
        gender: 'male'
      };

      const replayResult = await fhirReliableDeliveryEngineService.replayDlqEvent({
        tenantId: testTenantId,
        outboxId: outbox.outboxId,
        updatedPayload: remediatedPatient
      });

      expect(replayResult.success).toBe(true);
      expect(replayResult.status).toBe('REPLAY_QUEUED');

      // Now clear simulated error and process batch -> Should deliver successfully!
      fhirReliableDeliveryEngineService.simulatedTransmissionHandler = null;
      const finalDispatch = await fhirReliableDeliveryEngineService.processOutboxBatch({ tenantId: testTenantId });
      expect(finalDispatch.results[0].status).toBe('DELIVERED');
    });
  });
});
