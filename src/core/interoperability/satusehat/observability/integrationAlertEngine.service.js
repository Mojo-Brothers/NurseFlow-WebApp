/**
 * NURSEFLOW ENTERPRISE HIS — INTEGRATION ALERT SEVERITY ENGINE (P0 - P3)
 * Classifies integration anomalies into structured priority levels to prevent
 * alert fatigue while guaranteeing immediate escalation of clinical roadblocks.
 */

export const ALERT_SEVERITY = Object.freeze({
  P0_CRITICAL: 'P0_CRITICAL',       // Immediate action: Clinical blockage / SATUSEHAT offline > 15m with backlog
  P1_DEGRADATION: 'P1_DEGRADATION', // Warning: High error rate / sudden DLQ spike
  P2_RECOVERABLE: 'P2_RECOVERABLE', // Low: Transient network retry scheduled
  P3_INFO: 'P3_INFO'                // Info: Routine token renewal / batch drain complete
});

export class IntegrationAlertEngineService {
  /**
   * Evaluate operational state and generate prioritized active alerts
   */
  evaluateAlerts({
    gatewayStatus = 'HEALTHY',
    tokenHealth = 'VALID',
    backlogCount = 0,
    deadLetterCount = 0,
    successRate = 100,
    outageDurationMinutes = 0
  }) {
    const alerts = [];

    // P0 Triggers
    if (gatewayStatus === 'DOWN' && (outageDurationMinutes >= 15 || backlogCount > 1000)) {
      alerts.push({
        severity: ALERT_SEVERITY.P0_CRITICAL,
        code: 'SATUSEHAT_PERSISTENT_OUTAGE_CRITICAL',
        title: 'Critical Outbox Backlog during SATUSEHAT Outage',
        message: `SATUSEHAT has been unreachable for ${outageDurationMinutes}m with ${backlogCount} pending events. Clinical operations remain safe locally, but external synchronization is delayed.`,
        actionRecommended: 'Verify Kemenkes DTO endpoint status & notify clinical IT incident commander.'
      });
    }

    if (tokenHealth === 'INVALID') {
      alerts.push({
        severity: ALERT_SEVERITY.P0_CRITICAL,
        code: 'OAUTH_CREDENTIAL_AUTHENTICATION_FAILURE',
        title: 'OAuth2 Authentication Failure',
        message: 'SATUSEHAT OAuth2 token endpoint rejected credentials.',
        actionRecommended: 'Verify Organization ID & Client credentials in secure environment configuration.'
      });
    }

    // P1 Triggers
    if (deadLetterCount >= 5) {
      alerts.push({
        severity: ALERT_SEVERITY.P1_DEGRADATION,
        code: 'DEAD_LETTER_QUEUE_THRESHOLD_EXCEEDED',
        title: 'Dead Letter Queue Elevated',
        message: `There are ${deadLetterCount} non-retryable items in the Dead Letter Queue requiring operator inspection.`,
        actionRecommended: 'Open DLQ Operator Dashboard to inspect OperationOutcome diagnostics.'
      });
    }

    if (successRate < 85 && successRate > 0) {
      alerts.push({
        severity: ALERT_SEVERITY.P1_DEGRADATION,
        code: 'INTEGRATION_SUCCESS_RATE_DEGRADED',
        title: 'High Transmission Failure Rate',
        message: `Integration success rate dropped to ${successRate}% over recent transmissions.`,
        actionRecommended: 'Check gateway network latency and Kemkes API rate-limits.'
      });
    }

    // P2 Triggers
    if (gatewayStatus === 'DEGRADED' || (backlogCount > 0 && backlogCount <= 1000)) {
      alerts.push({
        severity: ALERT_SEVERITY.P2_RECOVERABLE,
        code: 'TRANSIENT_RETRY_IN_PROGRESS',
        title: 'Outbox Retry Queue Active',
        message: `${backlogCount} items are queued with exponential backoff and will self-heal.`,
        actionRecommended: 'Monitor worker drain; no operator intervention needed yet.'
      });
    }

    // P3 Triggers (Default if healthy)
    if (alerts.length === 0) {
      alerts.push({
        severity: ALERT_SEVERITY.P3_INFO,
        code: 'INTEGRATION_SYSTEMS_NOMINAL',
        title: 'SATUSEHAT Interoperability Systems Nominal',
        message: 'All FHIR mappers, token caches, and outbox workers operating within SLA.',
        actionRecommended: 'No action required.'
      });
    }

    return {
      highestSeverity: alerts[0]?.severity || ALERT_SEVERITY.P3_INFO,
      totalAlerts: alerts.length,
      alerts
    };
  }
}

export const integrationAlertEngine = new IntegrationAlertEngineService();
export default integrationAlertEngine;
