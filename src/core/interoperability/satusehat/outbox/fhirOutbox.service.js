/**
 * NURSEFLOW ENTERPRISE HIS — ASYNCHRONOUS FHIR OUTBOX SERVICE
 * Decouples Clinical Domain Transactions from SATUSEHAT Network Calls.
 * Guarantees zero clinical blocking on external gateway latency or downtime.
 */

import { persistenceAdapter } from '../../../services/persistenceAdapter.service.js';
import { retryPolicyFsm, OUTBOX_STATUS } from '../retry/retryPolicyFsm.service.js';

export class FhirOutboxService {
  constructor() {
    this.COLLECTION_NAME = 'fhir_outbox';
  }

  /**
   * Fast Non-Blocking Enqueue Method (< 2ms)
   * Invoked synchronously during clinical transactions or via Domain Event Listeners.
   */
  async enqueue({
    entityType,
    entityId,
    fhirResourceType,
    payload,
    correlationId = null,
    idempotencyKey = null
  }) {
    const key = idempotencyKey || `IDEM-${entityType}-${entityId}-${fhirResourceType}`;
    const outboxId = `OUT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Fast deduplication check
    const existing = await persistenceAdapter.findById(this.COLLECTION_NAME, key);
    if (existing && existing.status !== OUTBOX_STATUS.FAILED && existing.status !== OUTBOX_STATUS.DEAD_LETTER) {
      return { duplicate: true, item: existing };
    }

    const outboxItem = {
      id: key, // Use idempotency key as ID to guarantee single-write idempotency
      outboxRecordId: outboxId,
      entityType,
      entityId,
      fhirResourceType,
      payload,
      correlationId: correlationId || `CORR-SAT-${Date.now()}`,
      status: OUTBOX_STATUS.PENDING,
      retryCount: 0,
      maxRetries: 5,
      nextRetryAt: new Date().toISOString(),
      lastError: null,
      httpStatus: null,
      created_at: new Date().toISOString(),
      sent_at: null,
      acknowledged_at: null
    };

    await persistenceAdapter.save(this.COLLECTION_NAME, outboxItem.id, outboxItem);
    return { duplicate: false, item: outboxItem };
  }

  /**
   * Retrieve all items ready for processing (PENDING or RETRY with nextRetryAt <= now)
   */
  async getReadyItems() {
    const now = new Date().toISOString();
    return await persistenceAdapter.query(this.COLLECTION_NAME, (item) => {
      if (item.status === OUTBOX_STATUS.PENDING) return true;
      if (item.status === OUTBOX_STATUS.RETRY && item.nextRetryAt && item.nextRetryAt <= now) return true;
      return false;
    });
  }

  /**
   * Retrieve Dead Letter Queue items for forensic inspection
   */
  async getDeadLetterItems() {
    return await persistenceAdapter.query(this.COLLECTION_NAME, (item) => item.status === OUTBOX_STATUS.DEAD_LETTER);
  }

  /**
   * Mark item as PROCESSING
   */
  async markProcessing(item) {
    const updated = { ...item, status: OUTBOX_STATUS.PROCESSING, updatedAt: new Date().toISOString() };
    await persistenceAdapter.save(this.COLLECTION_NAME, item.id, updated);
    return updated;
  }

  /**
   * Mark item as ACKNOWLEDGED with external SATUSEHAT Resource ID
   */
  async markAcknowledged(item, externalResourceId, httpStatus = 200) {
    const updated = {
      ...item,
      status: OUTBOX_STATUS.ACKNOWLEDGED,
      externalResourceId,
      httpStatus,
      acknowledged_at: new Date().toISOString(),
      sent_at: item.sent_at || new Date().toISOString()
    };
    await persistenceAdapter.save(this.COLLECTION_NAME, item.id, updated);
    return updated;
  }

  /**
   * Mark item as Failed / Retry / Dead Letter via RetryPolicyFsm
   */
  async markFailed(item, httpStatus, errorMessage) {
    const transition = retryPolicyFsm.evaluateFailureTransition(item, httpStatus, errorMessage);
    const updated = {
      ...item,
      status: transition.nextStatus,
      retryCount: transition.retryCount,
      nextRetryAt: transition.nextRetryAt,
      lastError: errorMessage,
      httpStatus,
      errorClassification: transition.errorClassification,
      updatedAt: new Date().toISOString()
    };
    await persistenceAdapter.save(this.COLLECTION_NAME, item.id, updated);
    return updated;
  }
}

export const fhirOutbox = new FhirOutboxService();
export default fhirOutbox;
