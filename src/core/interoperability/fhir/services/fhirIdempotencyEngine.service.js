/**
 * NurseFlow Enterprise HIS 2026 — FHIR R4 Idempotency & Deduplication Engine
 * Standards: IETF RFC 9110 (Idempotent Methods), Kemkes SATUSEHAT Outbox Idempotency.
 */

import crypto from 'crypto';

export class FhirIdempotencyEngineService {
  constructor() {
    this.idempotencyLedger = new Map(); // canonicalHash -> { resourceId, resourceType, firstReceivedAt, callCount, status }
  }

  /**
   * Register or Deduplicate a FHIR Transmission Request by Canonical Hash
   */
  processIdempotentSubmission({
    tenantId = '00000000-0000-0000-0000-000000000001',
    resourceType,
    canonicalHash,
    fhirResource
  }) {
    if (!canonicalHash) throw new Error('Canonical hash is mandatory for idempotency processing');

    const key = `${tenantId}:${resourceType}:${canonicalHash}`;

    if (this.idempotencyLedger.has(key)) {
      const existing = this.idempotencyLedger.get(key);
      existing.callCount += 1;
      existing.lastAttemptAt = new Date().toISOString();
      return {
        isDuplicate: true,
        resourceId: existing.resourceId,
        canonicalHash,
        status: 'DEDUPLICATED_IDEMPOTENT_HIT',
        totalAttempts: existing.callCount
      };
    }

    const assignedId = fhirResource.id || crypto.randomUUID();
    const entry = {
      tenantId,
      resourceType,
      resourceId: assignedId,
      canonicalHash,
      firstReceivedAt: new Date().toISOString(),
      lastAttemptAt: new Date().toISOString(),
      callCount: 1,
      status: 'REGISTERED_NEW'
    };

    this.idempotencyLedger.set(key, entry);

    return {
      isDuplicate: false,
      resourceId: assignedId,
      canonicalHash,
      status: 'PROCESSED_INITIAL_REGISTRATION',
      totalAttempts: 1
    };
  }

  /**
   * Reset / Clear Idempotency Ledger (for test harnesses)
   */
  clear() {
    this.idempotencyLedger.clear();
  }
}

export const fhirIdempotencyEngineService = new FhirIdempotencyEngineService();
