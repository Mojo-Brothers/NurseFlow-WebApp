/**
 * NURSEFLOW ENTERPRISE HIS — SATUSEHAT INTEGRATION HEALTH MONITOR
 * Computes real-time health diagnostics, outbox backlog counters, latency,
 * success rates, and gateway operational status.
 */

import { persistenceAdapter } from '../../../services/persistenceAdapter.service.js';
import { tokenManager } from '../auth/tokenManager.service.js';
import { OUTBOX_STATUS } from '../retry/retryPolicyFsm.service.js';

export const GATEWAY_HEALTH_STATUS = Object.freeze({
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  DOWN: 'DOWN'
});

export class IntegrationHealthMonitorService {
  /**
   * Compute exhaustive operational snapshot
   */
  async getOperationalSnapshot() {
    const outboxItems = await persistenceAdapter.query('fhir_outbox') || [];
    const auditLogs = await persistenceAdapter.query('integration_audit_logs') || [];

    const pendingCount = outboxItems.filter(i => i.status === OUTBOX_STATUS.PENDING).length;
    const processingCount = outboxItems.filter(i => i.status === OUTBOX_STATUS.PROCESSING).length;
    const retryCount = outboxItems.filter(i => i.status === OUTBOX_STATUS.RETRY).length;
    const deadLetterCount = outboxItems.filter(i => i.status === OUTBOX_STATUS.DEAD_LETTER).length;
    const acknowledgedCount = outboxItems.filter(i => i.status === OUTBOX_STATUS.ACKNOWLEDGED).length;

    // Latency & Success rate over recent logs (up to 100)
    const recentLogs = auditLogs.slice(-100);
    const successLogs = recentLogs.filter(l => l.status === 'SUCCESS');
    const failedLogs = recentLogs.filter(l => l.status === 'FAILED');

    const totalDurations = recentLogs.reduce((acc, l) => acc + (l.durationMs || 0), 0);
    const averageLatencyMs = recentLogs.length > 0 ? Math.round(totalDurations / recentLogs.length) : 0;
    const successRatePercentage = recentLogs.length > 0 ? Number(((successLogs.length / recentLogs.length) * 100).toFixed(2)) : 100;

    // Token Health
    const tokenInfo = tokenManager.cachedToken;
    const isTokenValid = Boolean(tokenInfo && tokenInfo.expiresAt > Date.now());

    // Determine Gateway Health Status
    let gatewayStatus = GATEWAY_HEALTH_STATUS.HEALTHY;
    if (deadLetterCount > 10 || (failedLogs.length > 0 && successRatePercentage < 80)) {
      gatewayStatus = GATEWAY_HEALTH_STATUS.DEGRADED;
    }
    if (failedLogs.length >= 5 && successLogs.length === 0 && recentLogs.length >= 5) {
      gatewayStatus = GATEWAY_HEALTH_STATUS.DOWN;
    }

    const lastSuccess = successLogs[successLogs.length - 1]?.timestamp || null;
    const lastFailure = failedLogs[failedLogs.length - 1]?.timestamp || null;

    return {
      gatewayStatus,
      tokenHealth: isTokenValid ? 'VALID' : (tokenInfo ? 'EXPIRED' : 'ACQUIRING_ON_DEMAND'),
      validationEngineStatus: 'HEALTHY',
      workerStatus: processingCount > 0 ? 'PROCESSING' : (pendingCount > 0 ? 'QUEUED' : 'IDLE'),
      counters: {
        totalEvents: outboxItems.length,
        pending: pendingCount,
        processing: processingCount,
        retrying: retryCount,
        deadLetter: deadLetterCount,
        acknowledged: acknowledgedCount
      },
      metrics: {
        averageLatencyMs,
        successRatePercentage,
        recentSampleCount: recentLogs.length
      },
      timestamps: {
        lastSuccessfulAck: lastSuccess,
        lastFailedRequest: lastFailure,
        snapshotGeneratedAt: new Date().toISOString()
      }
    };
  }
}

export const integrationHealthMonitor = new IntegrationHealthMonitorService();
export default integrationHealthMonitor;
