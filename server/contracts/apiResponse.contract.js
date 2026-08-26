/**
 * NurseFlow Enterprise HIS 2026 — Canonical API Response Contract (FROZEN v1.0)
 * Standards: RFC 7231, RESTful Best Practices, JCI Traceability & Auditability
 * 
 * Success Contracts:
 * 1. Single Entity: { data: { ... }, meta: { correlationId, ... } }
 * 2. Collection:    { data: [ ... ], meta: { page, pageSize, total, totalPages, correlationId, ... } }
 * 3. No Content:    HTTP 204 (Zero Body)
 */

export const API_RESPONSE_CONTRACT_VERSION = '1.0.0-FROZEN';

export const API_RESPONSE_FORMATS = Object.freeze({
  SINGLE: 'SINGLE',
  COLLECTION: 'COLLECTION',
  NO_CONTENT: 'NO_CONTENT'
});

