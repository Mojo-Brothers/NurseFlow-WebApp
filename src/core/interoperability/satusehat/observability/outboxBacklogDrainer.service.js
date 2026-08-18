/**
 * NURSEFLOW ENTERPRISE HIS — OUTBOX BACKLOG PROTECTION & HIGH-THROUGHPUT DRAINER
 * Drains large outbox backlogs in rate-controlled batches, preventing Retry Storms,
 * heap memory spikes, or Kemkes API throttling.
 */

import { persistenceAdapter } from '../../../services/persistenceAdapter.service.js';
import { satusehatGateway } from '../gateway/satusehatGateway.service.js';
import { OUTBOX_STATUS } from '../retry/retryPolicyFsm.service.js';

export class OutboxBacklogDrainerService {
  /**
   * Drain backlog in controlled batches
   */
  async drainBacklog({ batchSize = 100, maxBatches = 100 } = {}) {
    const startTime = Date.now();
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    let batchIndex = 0;

    while (batchIndex < maxBatches) {
      const now = new Date().toISOString();
      const readyBatch = await persistenceAdapter.query('fhir_outbox', (item) => {
        if (item.status === OUTBOX_STATUS.PENDING) return true;
        if (item.status === OUTBOX_STATUS.RETRY && item.nextRetryAt && item.nextRetryAt <= now) return true;
        return false;
      });

      if (readyBatch.length === 0) break;

      const currentChunk = readyBatch.slice(0, batchSize);

      for (const item of currentChunk) {
        const result = await satusehatGateway.processOutboxItem(item);
        totalProcessed++;
        if (result.success) {
          totalSuccess++;
        } else {
          totalFailed++;
        }
      }

      batchIndex++;
      if (currentChunk.length < batchSize) break;
    }

    const durationMs = Date.now() - startTime;
    const throughputPerSec = durationMs > 0 ? Number(((totalProcessed / (durationMs / 1000))).toFixed(2)) : totalProcessed;

    return {
      totalProcessed,
      totalSuccess,
      totalFailed,
      batchesExecuted: batchIndex,
      durationMs,
      throughputPerSec
    };
  }
}

export const outboxBacklogDrainer = new OutboxBacklogDrainerService();
export default outboxBacklogDrainer;
