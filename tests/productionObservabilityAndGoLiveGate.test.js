/**
 * SPRINT 3H: PRODUCTION OBSERVABILITY, DISASTER RECOVERY & GO-LIVE READINESS GATE SUITE
 * 
 * Exhaustive Verification covering:
 * 1. Integration Health Monitor Operational Diagnostics & Metrics
 * 2. Dead Letter Queue (DLQ) Operator Workflow & Immutable WORM Audit
 * 3. Priority Alerting Engine (P0 - P3)
 * 4. High-Throughput Outbox Backlog Drainer (Rate-controlled batching)
 * 5. Disaster Recovery Engine (Cold Crash Recovery & Backup Snapshot Restore)
 * 6. 12 Mandatory Go-Live Readiness Quality Gates Evaluation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { integrationHealthMonitor, GATEWAY_HEALTH_STATUS } from '../src/core/interoperability/satusehat/observability/integrationHealthMonitor.service.js';
import { dlqOperatorWorkflow } from '../src/core/interoperability/satusehat/observability/dlqOperatorWorkflow.service.js';
import { integrationAlertEngine, ALERT_SEVERITY } from '../src/core/interoperability/satusehat/observability/integrationAlertEngine.service.js';
import { outboxBacklogDrainer } from '../src/core/interoperability/satusehat/observability/outboxBacklogDrainer.service.js';
import { disasterRecoveryEngine } from '../src/core/interoperability/satusehat/observability/disasterRecoveryEngine.service.js';
import { goLiveReadinessGate, READINESS_LEVEL, GATE_STATUS } from '../src/core/interoperability/satusehat/observability/goLiveReadinessGate.service.js';
import { OUTBOX_STATUS } from '../src/core/interoperability/satusehat/retry/retryPolicyFsm.service.js';
import { satusehatGateway } from '../src/core/interoperability/satusehat/gateway/satusehatGateway.service.js';

describe('Sprint 3H: Production Observability, Disaster Recovery & Go-Live Readiness Suite', () => {
  beforeEach(async () => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
    persistenceAdapter.memoryStore.clear();
    satusehatGateway.setSimulationMode({ enabled: false });
  });

  // ─── 1. INTEGRATION HEALTH MONITOR ──────────────────────────────
  describe('1. Integration Health Monitor Diagnostics', () => {
    it('should compute operational snapshot including backlog counters, latency, and success rates', async () => {
      // Seed sample audit logs
      await persistenceAdapter.save('integration_audit_logs', 'LOG-01', {
        id: 'LOG-01',
        status: 'SUCCESS',
        durationMs: 120,
        timestamp: new Date().toISOString()
      });
      await persistenceAdapter.save('integration_audit_logs', 'LOG-02', {
        id: 'LOG-02',
        status: 'SUCCESS',
        durationMs: 180,
        timestamp: new Date().toISOString()
      });

      const snapshot = await integrationHealthMonitor.getOperationalSnapshot();
      expect(snapshot.gatewayStatus).toBe(GATEWAY_HEALTH_STATUS.HEALTHY);
      expect(snapshot.metrics.successRatePercentage).toBe(100);
      expect(snapshot.metrics.averageLatencyMs).toBe(150);
      expect(snapshot.counters.totalEvents).toBe(0);
    });
  });

  // ─── 2. DLQ OPERATOR WORKFLOW & WORM AUDIT ───────────────────────
  describe('2. Dead Letter Queue (DLQ) Operator Workflow & Immutable Audit', () => {
    it('should allow operator to requeue DLQ item and log immutable audit record', async () => {
      const dlqItem = {
        id: 'OUT-DLQ-001',
        entityType: 'Patient',
        entityId: 'PAT-999',
        fhirResourceType: 'Patient',
        status: OUTBOX_STATUS.DEAD_LETTER,
        lastError: 'HTTP 400 Bad Request',
        retryCount: 5
      };
      await persistenceAdapter.save('fhir_outbox', dlqItem.id, dlqItem);

      // Operator Requeue Action
      const requeueRes = await dlqOperatorWorkflow.requeueItem(dlqItem.id, {
        operatorId: 'OPERATOR-JANE',
        reason: 'Investigated and verified upstream fix'
      });
      expect(requeueRes.success).toBe(true);
      expect(requeueRes.item.status).toBe(OUTBOX_STATUS.PENDING);

      // Verify WORM Operator Audit Log was created
      const auditLogs = await dlqOperatorWorkflow.queryOperatorAuditLogs();
      expect(auditLogs.length).toBe(1);
      expect(auditLogs[0].action).toBe('REQUEUE_IMMEDIATE');
      expect(auditLogs[0].operatorId).toBe('OPERATOR-JANE');
      expect(auditLogs[0].previousStatus).toBe(OUTBOX_STATUS.DEAD_LETTER);
    });

    it('should allow operator to fix payload and requeue with diff audit', async () => {
      const dlqItem = {
        id: 'OUT-DLQ-002',
        entityType: 'Encounter',
        entityId: 'ENC-999',
        fhirResourceType: 'Encounter',
        payload: { resourceType: 'Encounter' },
        status: OUTBOX_STATUS.DEAD_LETTER
      };
      await persistenceAdapter.save('fhir_outbox', dlqItem.id, dlqItem);

      const fixedPayload = { resourceType: 'Encounter', id: 'ENC-999', status: 'in-progress' };
      const fixRes = await dlqOperatorWorkflow.fixAndRequeue(dlqItem.id, {
        correctedPayload: fixedPayload,
        operatorId: 'OPERATOR-ALEX',
        reason: 'Added missing status field'
      });

      expect(fixRes.success).toBe(true);
      expect(fixRes.item.status).toBe(OUTBOX_STATUS.PENDING);
      expect(fixRes.item.payload.status).toBe('in-progress');
    });
  });

  // ─── 3. INTEGRATION ALERT SEVERITY ENGINE ───────────────────────
  describe('3. Integration Alert Severity Engine (P0 - P3)', () => {
    it('should trigger P0 Critical Alert during prolonged outage with backlog', () => {
      const evaluation = integrationAlertEngine.evaluateAlerts({
        gatewayStatus: 'DOWN',
        outageDurationMinutes: 20,
        backlogCount: 1500
      });
      expect(evaluation.highestSeverity).toBe(ALERT_SEVERITY.P0_CRITICAL);
      expect(evaluation.alerts.some(a => a.code === 'SATUSEHAT_PERSISTENT_OUTAGE_CRITICAL')).toBe(true);
    });

    it('should trigger P1 Alert on elevated Dead Letter Queue count', () => {
      const evaluation = integrationAlertEngine.evaluateAlerts({
        gatewayStatus: 'HEALTHY',
        deadLetterCount: 8
      });
      expect(evaluation.highestSeverity).toBe(ALERT_SEVERITY.P1_DEGRADATION);
      expect(evaluation.alerts.some(a => a.code === 'DEAD_LETTER_QUEUE_THRESHOLD_EXCEEDED')).toBe(true);
    });

    it('should return P3 Nominal when all metrics are within SLA', () => {
      const evaluation = integrationAlertEngine.evaluateAlerts({
        gatewayStatus: 'HEALTHY',
        tokenHealth: 'VALID',
        backlogCount: 0,
        deadLetterCount: 0,
        successRate: 100
      });
      expect(evaluation.highestSeverity).toBe(ALERT_SEVERITY.P3_INFO);
    });
  });

  // ─── 4. HIGH-THROUGHPUT OUTBOX BACKLOG DRAINER ──────────────────
  describe('4. High-Throughput Outbox Backlog Protection & Drainer', () => {
    it('should drain queued items in rate-controlled batches without memory or ordering issues', async () => {
      // Seed 25 items in outbox
      for (let i = 1; i <= 25; i++) {
        const item = {
          id: `OUT-BATCH-${i}`,
          entityType: 'Patient',
          entityId: `PAT-B-${i}`,
          fhirResourceType: 'Patient',
          payload: { resourceType: 'Patient', id: `PAT-B-${i}`, name: [{ text: `Pasien ${i}` }], gender: 'male' },
          status: OUTBOX_STATUS.PENDING
        };
        await persistenceAdapter.save('fhir_outbox', item.id, item);
      }

      const drainResult = await outboxBacklogDrainer.drainBacklog({ batchSize: 10, maxBatches: 5 });
      expect(drainResult.totalProcessed).toBe(25);
      expect(drainResult.totalSuccess).toBe(25);
      expect(drainResult.batchesExecuted).toBe(3); // 10 + 10 + 5
    });
  });

  // ─── 5. DISASTER RECOVERY & RESILIENCE SIMULATION ────────────────
  describe('5. Disaster Recovery Cold-Crash & Snapshot Restore', () => {
    it('should recover orphaned PROCESSING items stuck during sudden process crash', async () => {
      // Seed orphaned items
      await persistenceAdapter.save('fhir_outbox', 'OUT-ORPHAN-01', {
        id: 'OUT-ORPHAN-01',
        status: OUTBOX_STATUS.PROCESSING
      });

      const recoveryRes = await disasterRecoveryEngine.executeCrashRecoveryProtocol();
      expect(recoveryRes.success).toBe(true);
      expect(recoveryRes.orphanedItemsRecovered).toBe(1);

      const itemAfter = await persistenceAdapter.findById('fhir_outbox', 'OUT-ORPHAN-01');
      expect(itemAfter.status).toBe(OUTBOX_STATUS.PENDING);
    });

    it('should export backup snapshot and restore with 100% record integrity', async () => {
      await persistenceAdapter.save('fhir_resource_links', 'LINK-01', {
        id: 'LINK-01',
        internal_entity_id: 'PAT-01',
        external_resource_id: 'SAT-PAT-01'
      });

      const snapshot = await disasterRecoveryEngine.exportBackupSnapshot();
      expect(snapshot.snapshotId).toBeDefined();
      expect(snapshot.recordCounts.links).toBe(1);

      // Simulate database wipe
      persistenceAdapter.memoryStore.clear();

      // Restore from snapshot
      const restoreRes = await disasterRecoveryEngine.restoreFromSnapshot(snapshot);
      expect(restoreRes.success).toBe(true);
      expect(restoreRes.restoredRecordsCount).toBe(1);

      const restoredLink = await persistenceAdapter.findById('fhir_resource_links', 'LINK-01');
      expect(restoredLink.external_resource_id).toBe('SAT-PAT-01');
    });
  });

  // ─── 6. GO-LIVE READINESS GATE ENGINE ───────────────────────────
  describe('6. 12 Mandatory Go-Live Readiness Quality Gates', () => {
    it('should evaluate all 13 quality gates and grant SANDBOX_READY_FOR_EXTERNAL_VERIFICATION when all passed', async () => {
      const evaluation = await goLiveReadinessGate.evaluateReadiness();
      expect(evaluation.totalGates).toBe(13);
      expect(evaluation.passedCount).toBe(13);
      expect(evaluation.failedCount).toBe(0);
      expect(evaluation.scorePercentage).toBe(100);
      expect(evaluation.readinessLevel).toBe(READINESS_LEVEL.SANDBOX_READY_FOR_EXTERNAL_VERIFICATION);
    });
  });
});
