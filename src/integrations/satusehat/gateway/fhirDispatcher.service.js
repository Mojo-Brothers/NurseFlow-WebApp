/**
 * NurseFlow Enterprise HIS 2026 — SATUSEHAT FHIR Dispatcher & DLQ Gateway
 * Standard: Kemkes RI SATUSEHAT REST API Specification & Permenkes No. 24/2022
 */

import { satusehatOAuthService } from '../auth/oauth.service.js';

// In-Memory Storage for Dead-Letter Queue & Transmission Audit
const SATUSEHAT_DLQ = [];
const SATUSEHAT_TRANSMISSION_LOGS = [];

export const fhirDispatcherService = {
  /**
   * Dispatch FHIR Transaction Bundle with Exponential Backoff and DLQ routing
   */
  dispatchBundle: async (bundle, maxRetries = 3) => {
    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
      try {
        const auth = await satusehatOAuthService.getValidToken();
        if (!auth.accessToken) throw new Error('Otentikasi OAuth2 SATUSEHAT gagal.');

        // Dispatch simulated HTTP 200/201 response from Kemkes Live Gateway
        const transmissionRecord = {
          id: `TX-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          bundleType: bundle.type,
          entriesCount: bundle.entry?.length || 0,
          status: 'SUCCESS',
          httpStatusCode: 200,
          attempt: attempt + 1,
          tokenUsed: `${auth.accessToken.substring(0, 20)}...`,
          transmittedAt: new Date().toISOString()
        };

        SATUSEHAT_TRANSMISSION_LOGS.unshift(transmissionRecord);

        return {
          success: true,
          httpStatus: 200,
          transmissionId: transmissionRecord.id,
          attempt: attempt + 1,
          response: {
            resourceType: 'Bundle',
            type: 'transaction-response',
            entry: bundle.entry.map(e => ({
              response: { status: '201 Created', location: `${e.resource.resourceType}/${e.resource.id || 'UUID-GEN'}` }
            }))
          }
        };
      } catch (err) {
        attempt++;
        lastError = err;
        if (attempt < maxRetries) {
          // Exponential backoff wait
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 20));
        }
      }
    }

    // If all retries exhausted, push to Dead-Letter Queue (DLQ)
    const dlqItem = {
      id: `DLQ-${Date.now()}`,
      bundle,
      error: lastError?.message || 'Unknown network error',
      failedAt: new Date().toISOString(),
      retryCount: attempt
    };

    SATUSEHAT_DLQ.push(dlqItem);

    return {
      success: false,
      error: lastError?.message,
      movedToDlq: true,
      dlqId: dlqItem.id
    };
  },

  getDlqItems: () => SATUSEHAT_DLQ,
  getTransmissionLogs: () => SATUSEHAT_TRANSMISSION_LOGS,
  clearDlq: () => { SATUSEHAT_DLQ.length = 0; }
};
