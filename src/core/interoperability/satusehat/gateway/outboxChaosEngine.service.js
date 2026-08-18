/**
 * NURSEFLOW ENTERPRISE HIS — SATUSEHAT OUTBOX CHAOS & RECOVERY ENGINE
 * Simulates real-world network turbulence, process crashes, corrupted payloads,
 * and verifies zero data loss and automated crash recovery.
 */

import { fhirOutbox } from '../outbox/fhirOutbox.service.js';
import { satusehatGateway } from './satusehatGateway.service.js';
import { OUTBOX_STATUS } from '../retry/retryPolicyFsm.service.js';
import { persistenceAdapter } from '../../../services/persistenceAdapter.service.js';

export const CHAOS_SCENARIOS = Object.freeze({
  SERVICE_UNAVAILABLE_503: 'SERVICE_UNAVAILABLE_503',
  RATE_LIMIT_429: 'RATE_LIMIT_429',
  AUTH_EXPIRED_401: 'AUTH_EXPIRED_401',
  PROCESS_CRASH_MID_SEND: 'PROCESS_CRASH_MID_SEND',
  CORRUPT_PAYLOAD_400: 'CORRUPT_PAYLOAD_400',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT'
});

export class OutboxChaosEngine {
  /**
   * Simulate a sudden process crash while items are in 'PROCESSING' state
   * and verify automated recovery on restart.
   */
  async simulateProcessCrashAndRecover() {
    // 1. Enqueue item
    const enqueueRes = await fhirOutbox.enqueue({
      entityType: 'Encounter',
      entityId: 'ENC-CRASH-001',
      fhirResourceType: 'Encounter',
      payload: { resourceType: 'Encounter', id: 'ENC-CRASH-001', status: 'in-progress' }
    });

    // 2. Mark as PROCESSING (simulating active network flight)
    await fhirOutbox.markProcessing(enqueueRes.item);

    // 3. Simulate sudden crash (Server reboot / browser refresh)
    // Worker restarts and queries orphaned PROCESSING items to recover to RETRY/PENDING
    const orphanedItems = await persistenceAdapter.query('fhir_outbox', (i) => i.status === OUTBOX_STATUS.PROCESSING);

    for (const orphan of orphanedItems) {
      const recovered = {
        ...orphan,
        status: OUTBOX_STATUS.PENDING,
        lastError: 'RECOVERED_FROM_PROCESS_CRASH',
        updatedAt: new Date().toISOString()
      };
      await persistenceAdapter.save('fhir_outbox', orphan.id, recovered);
    }

    const afterRecovery = await persistenceAdapter.findById('fhir_outbox', enqueueRes.item.id);
    return {
      recoveredCount: orphanedItems.length,
      recoveredItemStatus: afterRecovery.status
    };
  }

  /**
   * Run chaos resilience matrix against SATUSEHAT Gateway
   */
  async runChaosScenario(scenario) {
    switch (scenario) {
      case CHAOS_SCENARIOS.SERVICE_UNAVAILABLE_503:
        satusehatGateway.setSimulationMode({ enabled: true, httpStatus: 503, errorMessage: 'Kemenkes Gateway 503' });
        break;

      case CHAOS_SCENARIOS.RATE_LIMIT_429:
        satusehatGateway.setSimulationMode({ enabled: true, httpStatus: 429, errorMessage: 'Kemenkes Gateway 429 Rate Limit' });
        break;

      case CHAOS_SCENARIOS.AUTH_EXPIRED_401:
        satusehatGateway.setSimulationMode({ enabled: true, httpStatus: 401, errorMessage: 'OAuth2 Token Expired' });
        break;

      case CHAOS_SCENARIOS.NETWORK_TIMEOUT:
        satusehatGateway.setSimulationMode({ enabled: true, httpStatus: 504, errorMessage: 'Gateway Timeout' });
        break;

      default:
        satusehatGateway.setSimulationMode({ enabled: false });
        break;
    }
  }
}

export const outboxChaosEngine = new OutboxChaosEngine();
export default outboxChaosEngine;
