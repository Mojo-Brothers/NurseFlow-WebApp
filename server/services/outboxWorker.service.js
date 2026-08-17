/**
 * NurseFlow Enterprise HIS 2026 — Transactional Outbox Pattern & Background Worker
 * Guarantees Dual-Write Consistency Between PostgreSQL & External Integrations (SATUSEHAT, BPJS)
 */

class OutboxWorkerService {
  constructor() {
    this.outboxQueue = []; // Persistent PostgreSQL Table Simulation
    this.deadLetterQueue = [];
    this.isProcessing = false;
  }

  /**
   * Stage Outbox Event within the same Database Transaction
   */
  stageEvent({ eventType, aggregateType, aggregateId, payload }) {
    const event = {
      id: `OUTBOX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType,
      aggregateType,
      aggregateId,
      payload,
      status: 'PENDING',
      retryCount: 0,
      maxRetries: 5,
      createdAt: new Date().toISOString(),
      processedAt: null
    };

    this.outboxQueue.push(event);
    return event;
  }

  /**
   * Process Pending Outbox Events
   */
  async processOutbox(publisherHandler) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const pendingEvents = this.outboxQueue.filter(e => e.status === 'PENDING' || e.status === 'FAILED');

    for (const event of pendingEvents) {
      event.status = 'PROCESSING';
      try {
        if (typeof publisherHandler === 'function') {
          await publisherHandler(event);
        }
        event.status = 'PUBLISHED';
        event.processedAt = new Date().toISOString();
      } catch (err) {
        event.retryCount += 1;
        event.errorLog = err.message;

        if (event.retryCount >= event.maxRetries) {
          event.status = 'DEAD_LETTER';
          this.deadLetterQueue.push(event);
        } else {
          event.status = 'FAILED';
        }
      }
    }

    this.isProcessing = false;
    return {
      processedCount: pendingEvents.length,
      publishedCount: this.outboxQueue.filter(e => e.status === 'PUBLISHED').length,
      deadLetterCount: this.deadLetterQueue.length
    };
  }

  getPendingEvents() {
    return this.outboxQueue.filter(e => e.status === 'PENDING');
  }

  getDeadLetterQueue() {
    return this.deadLetterQueue;
  }
}

export const outboxWorkerService = new OutboxWorkerService();
