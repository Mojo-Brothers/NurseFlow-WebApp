/**
 * NURSEFLOW ENTERPRISE HIS — SATUSEHAT INTEGRATION AUDIT TRAIL SERVICE
 * Immutable integration logs tracking every outbound/inbound transmission.
 */

import { persistenceAdapter } from '../../../services/persistenceAdapter.service.js';

export class IntegrationAuditService {
  constructor() {
    this.COLLECTION_NAME = 'integration_audit_logs';
  }

  /**
   * Log transaction audit
   */
  async logTransmission({
    correlationId,
    endpoint,
    method = 'POST',
    resourceType,
    internalEntityId,
    payload,
    httpStatus,
    responseBody,
    durationMs,
    status = 'SUCCESS',
    error = null
  }) {
    const logId = `AUD-SAT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const logRecord = {
      id: logId,
      correlationId: correlationId || `CORR-${Date.now()}`,
      endpoint,
      method,
      resourceType,
      internalEntityId,
      payloadSummary: typeof payload === 'object' ? JSON.stringify(payload).slice(0, 500) : String(payload),
      httpStatus,
      responseSummary: typeof responseBody === 'object' ? JSON.stringify(responseBody).slice(0, 500) : String(responseBody),
      durationMs,
      status,
      error: error ? error.message || String(error) : null,
      timestamp: new Date().toISOString()
    };

    await persistenceAdapter.save(this.COLLECTION_NAME, logRecord.id, logRecord);
    return logRecord;
  }

  /**
   * Query integration audit logs
   */
  async queryLogs(filterFn) {
    return await persistenceAdapter.query(this.COLLECTION_NAME, filterFn);
  }
}

export const integrationAudit = new IntegrationAuditService();
export default integrationAudit;
