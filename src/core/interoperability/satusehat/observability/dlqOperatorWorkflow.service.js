/**
 * NURSEFLOW ENTERPRISE HIS — DEAD LETTER QUEUE (DLQ) OPERATOR WORKFLOW SERVICE
 * Provides human-in-the-loop remediation, payload correction, requeueing,
 * and immutable WORM audit trails for all operator intervention.
 */

import { persistenceAdapter } from '../../../services/persistenceAdapter.service.js';
import { fhirOutbox } from '../outbox/fhirOutbox.service.js';
import { OUTBOX_STATUS } from '../retry/retryPolicyFsm.service.js';
import { OperationOutcomeParser } from '../gateway/operationOutcomeParser.service.js';

export class DlqOperatorWorkflowService {
  constructor() {
    this.AUDIT_COLLECTION = 'dlq_operator_audit_logs';
  }

  /**
   * Get all active Dead Letter Queue items
   */
  async getDeadLetterRecords() {
    return await fhirOutbox.getDeadLetterItems();
  }

  /**
   * View full payload and parsed diagnostics for an item
   */
  async getItemDetails(itemId) {
    const item = await persistenceAdapter.findById('fhir_outbox', itemId);
    if (!item) {
      throw new Error(`Outbox item with ID "${itemId}" not found`);
    }

    const parsedOutcome = OperationOutcomeParser.parse({
      error: item.lastError,
      httpStatus: item.httpStatus
    });

    return {
      item,
      parsedOutcome,
      formattedDiagnostics: OperationOutcomeParser.formatForAudit(parsedOutcome)
    };
  }

  /**
   * Operator Action: Requeue item without payload modification
   */
  async requeueItem(itemId, { operatorId = 'OPERATOR-01', reason = 'Manual retry requested' } = {}) {
    const item = await persistenceAdapter.findById('fhir_outbox', itemId);
    if (!item) throw new Error(`Outbox item with ID "${itemId}" not found`);

    const previousStatus = item.status;
    const updated = {
      ...item,
      status: OUTBOX_STATUS.PENDING,
      retryCount: 0,
      nextRetryAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await persistenceAdapter.save('fhir_outbox', itemId, updated);

    await this._logOperatorAudit({
      action: 'REQUEUE_IMMEDIATE',
      outboxItemId: itemId,
      operatorId,
      reason,
      previousStatus,
      newStatus: OUTBOX_STATUS.PENDING
    });

    return { success: true, item: updated };
  }

  /**
   * Operator Action: Fix payload and requeue
   */
  async fixAndRequeue(itemId, { correctedPayload, operatorId = 'OPERATOR-01', reason = 'Fixed malformed mapping' }) {
    const item = await persistenceAdapter.findById('fhir_outbox', itemId);
    if (!item) throw new Error(`Outbox item with ID "${itemId}" not found`);

    const previousStatus = item.status;
    const updated = {
      ...item,
      payload: correctedPayload,
      status: OUTBOX_STATUS.PENDING,
      retryCount: 0,
      lastError: null,
      nextRetryAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await persistenceAdapter.save('fhir_outbox', itemId, updated);

    await this._logOperatorAudit({
      action: 'FIX_AND_REQUEUE',
      outboxItemId: itemId,
      operatorId,
      reason,
      previousStatus,
      newStatus: OUTBOX_STATUS.PENDING,
      payloadDiffSummary: 'Payload updated by operator'
    });

    return { success: true, item: updated };
  }

  /**
   * Operator Action: Mark as Resolved / Suppressed
   */
  async markResolved(itemId, { operatorId = 'OPERATOR-01', notes = 'Suppressed after manual validation' }) {
    const item = await persistenceAdapter.findById('fhir_outbox', itemId);
    if (!item) throw new Error(`Outbox item with ID "${itemId}" not found`);

    const previousStatus = item.status;
    const updated = {
      ...item,
      status: 'RESOLVED_SUPPRESSED',
      resolutionNotes: notes,
      resolvedByOperatorId: operatorId,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await persistenceAdapter.save('fhir_outbox', itemId, updated);

    await this._logOperatorAudit({
      action: 'MARK_RESOLVED',
      outboxItemId: itemId,
      operatorId,
      reason: notes,
      previousStatus,
      newStatus: 'RESOLVED_SUPPRESSED'
    });

    return { success: true, item: updated };
  }

  /**
   * Internal WORM Audit Logger
   */
  async _logOperatorAudit(logData) {
    const logId = `AUD-DLQ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const logRecord = {
      id: logId,
      ...logData,
      timestamp: new Date().toISOString()
    };
    await persistenceAdapter.save(this.AUDIT_COLLECTION, logRecord.id, logRecord);
    return logRecord;
  }

  /**
   * Query DLQ Operator Audit Logs
   */
  async queryOperatorAuditLogs() {
    return await persistenceAdapter.query(this.AUDIT_COLLECTION);
  }
}

export const dlqOperatorWorkflow = new DlqOperatorWorkflowService();
export default dlqOperatorWorkflow;
