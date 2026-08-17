import { describe, it, expect } from 'vitest';
import { outboxWorkerService } from '../server/services/outboxWorker.service.js';

describe('Transactional Outbox Pattern & Background Publisher Worker', () => {
  it('should stage an outbox event in PENDING status', () => {
    const staged = outboxWorkerService.stageEvent({
      eventType: 'ENCOUNTER_FINISHED',
      aggregateType: 'ENCOUNTER',
      aggregateId: 'ENC-OUTBOX-001',
      payload: { patientId: 'P-1001', status: 'FINISHED' }
    });

    expect(staged.status).toBe('PENDING');
    expect(staged.eventType).toBe('ENCOUNTER_FINISHED');
  });

  it('should process pending outbox events and mark them as PUBLISHED', async () => {
    const summary = await outboxWorkerService.processOutbox(async (event) => {
      // Simulate external API call to SATUSEHAT
      expect(event.aggregateId).toBe('ENC-OUTBOX-001');
    });

    expect(summary.processedCount).toBeGreaterThan(0);
  });
});
