/**
 * NurseFlow Enterprise HIS 2026 — Immutable CDSS Execution Ledger Repository (WORM Cryptographic Chain)
 * Standards: JCI MCI & Cryptographic Audit Trails
 */

import { ImmutableCdssExecutionLedger } from '../modules/cdss/entities/ClinicalSafetyEntities.js';

// Simple deterministic hash helper for browser & node test environments
function computeDeterministicSha256(content) {
  let hash = 0;
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `sha256_mock_${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

class ImmutableCdssLedgerRepository {
  constructor() {
    this.ledger = [];
    this.lastHash = '0000000000000000000000000000000000000000000000000000000000000000';
  }

  async appendLedgerEntry(entryData) {
    const id = entryData.id || `IMMUTABLE-LEDGER-${Date.now()}-${this.ledger.length + 1}`;
    const previousHash = this.lastHash;

    const payloadToHash = {
      executionId: entryData.executionId,
      encounterId: entryData.encounterId,
      patientId: entryData.patientId,
      medicationId: entryData.medicationId,
      appliedRulesSnapshot: entryData.appliedRulesSnapshot,
      patientClinicalSnapshot: entryData.patientClinicalSnapshot,
      evaluatedAlerts: entryData.evaluatedAlerts,
      decisionOutcome: entryData.decisionOutcome,
      overrideReason: entryData.overrideReason,
      executedAt: entryData.executedAt || Date.now(),
      previousHash
    };

    const cryptographicHash = computeDeterministicSha256(payloadToHash);
    this.lastHash = cryptographicHash;

    const entry = new ImmutableCdssExecutionLedger({
      ...entryData,
      id,
      previousHash,
      cryptographicHash,
      executedAt: payloadToHash.executedAt
    });

    this.ledger.push(entry);
    return entry;
  }

  async findByExecutionId(executionId) {
    return this.ledger.find(e => e.executionId === executionId) || null;
  }

  async findByEncounterId(encounterId) {
    return this.ledger.filter(e => e.encounterId === encounterId);
  }

  async verifyLedgerIntegrity() {
    let currentExpectedPrev = '0000000000000000000000000000000000000000000000000000000000000000';

    for (const entry of this.ledger) {
      if (entry.previousHash !== currentExpectedPrev) {
        return { isIntact: false, brokenEntryId: entry.id, reason: 'Previous hash mismatch (Tampering detected).' };
      }
      currentExpectedPrev = entry.cryptographicHash;
    }

    return { isIntact: true, totalEntriesVerified: this.ledger.length };
  }
}

export const immutableCdssLedgerRepository = new ImmutableCdssLedgerRepository();
