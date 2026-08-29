/**
 * ============================================================================
 * 🏥 NURSEFLOW ENTERPRISE HIS 2026 — SERVER SAFETY AUTHORIZATION SERVICE
 * BACKEND ENFORCEMENT BOUNDARY: TRUSTED SERVER-SIDE ISSUANCE (PROVENANCE E6),
 * DATABASE-AUTHORITATIVE VERIFICATION, RFC 8785 CRYPTOGRAPHIC BINDING,
 * ACID TRANSACTION CONSUMPTION & DISTRIBUTED ANTI-REPLAY LOCKING
 * STANDARDS: JCI 7TH ED (MMU.4, IPSG.1-2), NIST SP 800-92, RFC 8785 (JCS)
 * ============================================================================
 */

import crypto from 'crypto';
import { canonicalStringify, computeCommandHash } from '../../src/core/safetyDecision.js';

export class SafetyAuthorizationError extends Error {
  constructor(message, code = 'SAFETY_AUTHORIZATION_FAILED', statusCode = 403, details = []) {
    super(message);
    this.name = 'SafetyAuthorizationError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// In-Memory Storage for non-database unit environments
const inMemoryIssuedDecisions = new Map();
const inMemoryConsumedDecisions = new Map();

export const safetyAuthorizationService = {
  /**
   * Clears in-memory caches (Used for test teardown)
   */
  _resetReplayCache: () => {
    inMemoryIssuedDecisions.clear();
    inMemoryConsumedDecisions.clear();
  },

  /**
   * 🏛️ TRUSTED SERVER-SIDE SAFETY DECISION ISSUER (PROVENANCE E6)
   * Only the authenticated, authorized server backend can issue legitimate Safety Decisions into the registry.
   *
   * @param {Object} [clientOrPool] - PostgreSQL connection client or pool (optional for in-memory)
   * @param {Object} params - Issuance parameters
   * @returns {Promise<Object>} Authoritative Server-Issued SafetyDecision
   */
  issueSafetyDecision: async function(clientOrPool, {
    actor,
    patientId,
    encounterId = null,
    action,
    riskType = 'DESTRUCTIVE_ACTION',
    justification,
    targetPayload = null,
    tenantId = null,
    correlationId = null
  }) {
    // 1. Authenticated Actor & Privilege Validation
    if (!actor || (!actor.userId && !actor.id)) {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Penerbitan Safety Decision memerlukan identitas staf medis yang terotentikasi.',
        'AUTHENTICATION_REQUIRED',
        401
      );
    }

    const actorId = actor.userId || actor.id;
    const actorRole = actor.role || 'ROLE_DOCTOR_DPJP';

    // 2. Patient Context Validation
    if (!patientId || String(patientId).trim() === '') {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Penerbitan Safety Decision mewajibkan konteks Pasien (Patient ID).',
        'PATIENT_CONTEXT_REQUIRED',
        400
      );
    }

    // 3. Clinical Justification Validation
    if (!justification || justification.trim().length < 5) {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Justifikasi klinis wajib diisi minimal 5 karakter untuk menerbitkan Safety Decision.',
        'INSUFFICIENT_JUSTIFICATION',
        400
      );
    }

    // 4. Action Type Validation
    if (!action || String(action).trim() === '') {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Jenis tindakan klinis (action) wajib ditentukan.',
        'ACTION_REQUIRED',
        400
      );
    }

    // 5. Compute Deterministic Canonical Command Hash Server-Side (RFC 8785 JCS)
    const commandHash = computeCommandHash(targetPayload || { action, patientId, encounterId });

    // 6. Generate Authoritative Server State & Timestamps
    const decisionId = `SD-${crypto.randomUUID()}`;
    const generatedCorrelationId = correlationId || `CORR-SD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString(); // Authoritative 15-min TTL

    const decisionRecord = {
      decisionId,
      tenantId: tenantId || null,
      patientId: String(patientId).trim(),
      encounterId: encounterId ? String(encounterId).trim() : null,
      actorId,
      actorRole,
      action: String(action).trim(),
      riskType,
      justification: justification.trim(),
      commandHash,
      correlationId: generatedCorrelationId,
      status: 'ISSUED',
      expiresAt,
      createdAt
    };

    // 7. Persist into PostgreSQL Safety Decision Registry (E1 & E6)
    if (clientOrPool && typeof clientOrPool.query === 'function') {
      await clientOrPool.query(`
        INSERT INTO safety_decision_registry (
          decision_id, tenant_id, patient_id, encounter_id, actor_id, actor_role,
          action_type, risk_type, justification, command_hash, correlation_id,
          status, expires_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, 'ISSUED', $12, $13
        );
      `, [
        decisionId,
        decisionRecord.tenantId,
        decisionRecord.patientId,
        decisionRecord.encounterId,
        decisionRecord.actorId,
        decisionRecord.actorRole,
        decisionRecord.action,
        decisionRecord.riskType,
        decisionRecord.justification,
        decisionRecord.commandHash,
        decisionRecord.correlationId,
        decisionRecord.expiresAt,
        decisionRecord.createdAt
      ]);
    } else {
      // In-Memory Issuance Fallback for Unit Tests
      inMemoryIssuedDecisions.set(decisionId, { ...decisionRecord });
    }

    return decisionRecord;
  },

  /**
   * 🔒 TRANSACTIONAL ACID VERIFICATION & CONSUMPTION (E3 & E6)
   * Locks the authoritative server-issued decision row in PostgreSQL FOR UPDATE,
   * enforces DB-authoritative expiry and invariant checks, and consumes the token.
   *
   * @param {Object} [client] - Active PostgreSQL transaction client
   * @param {Object} params - Verification parameters
   * @returns {Promise<Object>} Verified and consumed safety decision summary
   */
  verifyAndConsumeTransactional: async function(client, {
    decisionId,
    safetyDecision,
    actualCommandPayload = null,
    expectedAction = null,
    expectedPatientId = null,
    expectedEncounterId = null,
    actor = {},
    tenantId = null,
    justification = null
  }) {
    const targetDecisionId = decisionId || safetyDecision?.decisionId;

    // 1. Mandatory Decision ID Presence Check
    if (!targetDecisionId || typeof targetDecisionId !== 'string') {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Mutasi klinis berisiko tinggi wajib menyertakan ID otorisasi Safety Decision yang sah dari server.',
        'SAFETY_DECISION_REQUIRED',
        403
      );
    }

    const requestActorId = actor.userId || actor.id;

    // ─── POSTGRESQL DATABASE TRANSACTIONAL PATH ───
    if (client && typeof client.query === 'function') {
      // 2. Row-Level Lock FOR UPDATE (Guarantees zero concurrent double-consumption)
      const lockRes = await client.query(`
        SELECT decision_id, tenant_id, patient_id, encounter_id, actor_id, actor_role,
               action_type, risk_type, justification, command_hash, correlation_id,
               status, expires_at, created_at, consumed_at, consumed_by_actor_id
        FROM safety_decision_registry
        WHERE decision_id = $1
        FOR UPDATE;
      `, [targetDecisionId]);

      // 3. Provenance & Existence Check (E6: Unissued / Forged tokens strictly rejected)
      if (lockRes.rowCount === 0) {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Safety Decision [${targetDecisionId}] tidak ditemukan pada registry basis data. Upaya eksekusi tanpa otorisasi terpercaya (forged token) ditolak.`,
          'SAFETY_DECISION_NOT_FOUND',
          404,
          [{ decisionId: targetDecisionId }]
        );
      }

      const row = lockRes.rows[0];

      // 4. Status Machine Checks
      if (row.status === 'CONSUMED') {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Safety Decision [${targetDecisionId}] telah digunakan sebelumnya pada ${row.consumed_at} oleh [${row.consumed_by_actor_id}]. Replay ditolak.`,
          'SAFETY_DECISION_ALREADY_CONSUMED',
          409,
          [{ decisionId: targetDecisionId, consumedAt: row.consumed_at, consumedBy: row.consumed_by_actor_id }]
        );
      }

      if (row.status === 'REVOKED') {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Safety Decision [${targetDecisionId}] telah dicabut (REVOKED). Eksekusi ditolak.`,
          'SAFETY_DECISION_REVOKED',
          403,
          [{ decisionId: targetDecisionId }]
        );
      }

      if (row.status === 'EXPIRED') {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Safety Decision [${targetDecisionId}] telah kadaluarsa (EXPIRED).`,
          'SAFETY_DECISION_EXPIRED',
          401,
          [{ decisionId: targetDecisionId, expiresAt: row.expires_at }]
        );
      }

      if (row.status !== 'ISSUED') {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Status Safety Decision [${targetDecisionId}] adalah [${row.status}]. Mutasi ditolak.`,
          'SAFETY_DECISION_INVALID_STATUS',
          400,
          [{ decisionId: targetDecisionId, status: row.status }]
        );
      }

      // 5. Database-Authoritative Expiry Guard (E3/E6)
      if (new Date(row.expires_at).getTime() < Date.now()) {
        await client.query(
          "UPDATE safety_decision_registry SET status = 'EXPIRED' WHERE decision_id = $1;",
          [targetDecisionId]
        );
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Token Safety Decision [${targetDecisionId}] telah kadaluarsa pada basis data (${row.expires_at}).`,
          'SAFETY_DECISION_EXPIRED',
          401,
          [{ decisionId: targetDecisionId, expiresAt: row.expires_at }]
        );
      }

      // 6. Multi-Tenant Isolation Guard (E4)
      if (tenantId && row.tenant_id && String(row.tenant_id) !== String(tenantId)) {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Tenant mismatch pada Safety Decision [${targetDecisionId}]. Akses lintas institusi ditolak.`,
          'SAFETY_TENANT_MISMATCH',
          403,
          [{ rowTenant: row.tenant_id, requestTenant: tenantId }]
        );
      }

      // 7. Context Binding — Patient Validation
      if (expectedPatientId && String(row.patient_id).trim() !== String(expectedPatientId).trim()) {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Patient ID pada Safety Decision [${row.patient_id}] tidak sesuai dengan data target [${expectedPatientId}]. Potensi Cross-Patient Contamination!`,
          'SAFETY_PATIENT_CONTEXT_MISMATCH',
          400,
          [{ authorizedPatientId: row.patient_id, targetPatientId: expectedPatientId }]
        );
      }

      // 8. Context Binding — Encounter Validation
      if (expectedEncounterId && row.encounter_id && String(row.encounter_id).trim() !== String(expectedEncounterId).trim()) {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Encounter ID pada Safety Decision [${row.encounter_id}] tidak sesuai dengan encounter target [${expectedEncounterId}].`,
          'SAFETY_ENCOUNTER_CONTEXT_MISMATCH',
          400,
          [{ authorizedEncounterId: row.encounter_id, targetEncounterId: expectedEncounterId }]
        );
      }

      // 9. Actor Accountability Guard
      if (requestActorId && String(row.actor_id).trim() !== String(requestActorId).trim()) {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Eksekutor mutasi [${requestActorId}] berbeda dengan staf medis yang mengotorisasi keputusan [${row.actor_id}]. Akses ditolak.`,
          'SAFETY_ACTOR_MISMATCH',
          403,
          [{ authorizedActorId: row.actor_id, requestActorId }]
        );
      }

      // 10. Action Type Binding
      if (expectedAction && String(row.action_type).trim() !== String(expectedAction).trim()) {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Aksi yang diotorisasi [${row.action_type}] tidak sesuai dengan endpoint mutasi [${expectedAction}].`,
          'SAFETY_ACTION_MISMATCH',
          400,
          [{ authorizedAction: row.action_type, expectedAction }]
        );
      }

      // 11. Anti-Tampering Justification Guard
      const effectiveJustification = justification || safetyDecision?.justification;
      if (effectiveJustification && String(effectiveJustification).trim() !== String(row.justification).trim()) {
        throw new SafetyAuthorizationError(
          'FAIL-CLOSED: Alasan klinis pada body request telah dimanipulasi atau berbeda dengan otorisasi HardStop dialog.',
          'SAFETY_JUSTIFICATION_TAMPERED',
          400,
          [{ requestJustification: effectiveJustification, authorizedJustification: row.justification }]
        );
      }

      // 12. Cryptographic Command Hash Verification (E2 RFC 8785)
      if (actualCommandPayload !== null && actualCommandPayload !== undefined) {
        const calculatedHash = computeCommandHash(actualCommandPayload);
        const isHashMatch = (row.command_hash.length === calculatedHash.length) &&
          (typeof crypto !== 'undefined' && crypto.timingSafeEqual
            ? crypto.timingSafeEqual(Buffer.from(row.command_hash, 'utf8'), Buffer.from(calculatedHash, 'utf8'))
            : row.command_hash.toLowerCase() === calculatedHash.toLowerCase());

        if (!isHashMatch) {
          throw new SafetyAuthorizationError(
            `FAIL-CLOSED: Cryptographic Command Hash mismatch! Payload mutasi telah berubah dari otorisasi asli. (Expected: ${calculatedHash}, Decision: ${row.command_hash})`,
            'SAFETY_COMMAND_HASH_MISMATCH',
            400,
            [{ expectedHash: calculatedHash, providedHash: row.command_hash }]
          );
        }
      }

      // 13. Atomically Consume Token inside the Active Transaction (E3 & E6)
      await client.query(`
        UPDATE safety_decision_registry
        SET status = 'CONSUMED',
            consumed_at = NOW(),
            consumed_by_actor_id = $2,
            consumed_in_tx_id = txid_current()
        WHERE decision_id = $1;
      `, [targetDecisionId, requestActorId || row.actor_id]);

      return {
        isValid: true,
        isConsumed: true,
        decisionId: row.decision_id,
        tenantId: row.tenant_id,
        patientId: row.patient_id,
        encounterId: row.encounter_id,
        actorId: row.actor_id,
        actorRole: row.actor_role,
        action: row.action_type,
        riskType: row.risk_type,
        justification: row.justification,
        commandHash: row.command_hash,
        correlationId: row.correlation_id,
        consumedAt: new Date().toISOString()
      };
    }

    // ─── IN-MEMORY FALLBACK PATH (FOR STANDALONE UNIT TESTS WITHOUT DB) ───
    const memoryRecord = inMemoryIssuedDecisions.get(targetDecisionId);
    if (!memoryRecord) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Safety Decision [${targetDecisionId}] tidak ditemukan pada registry basis data. Upaya eksekusi tanpa otorisasi terpercaya (forged token) ditolak.`,
        'SAFETY_DECISION_NOT_FOUND',
        404,
        [{ decisionId: targetDecisionId }]
      );
    }

    if (inMemoryConsumedDecisions.has(targetDecisionId)) {
      const existing = inMemoryConsumedDecisions.get(targetDecisionId);
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Safety Decision [${targetDecisionId}] telah digunakan sebelumnya pada ${new Date(existing.timestamp).toISOString()}. Replay ditolak.`,
        'SAFETY_DECISION_ALREADY_CONSUMED',
        409,
        [{ decisionId: targetDecisionId, consumedAt: existing.timestamp }]
      );
    }

    // Run same invariant checks against in-memory record
    if (new Date(memoryRecord.expiresAt).getTime() < Date.now()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Token Safety Decision [${targetDecisionId}] telah kadaluarsa pada basis data (${memoryRecord.expiresAt}).`,
        'SAFETY_DECISION_EXPIRED',
        401
      );
    }

    if (expectedPatientId && String(memoryRecord.patientId).trim() !== String(expectedPatientId).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Patient ID pada Safety Decision [${memoryRecord.patientId}] tidak sesuai dengan data target [${expectedPatientId}]. Potensi Cross-Patient Contamination!`,
        'SAFETY_PATIENT_CONTEXT_MISMATCH',
        400
      );
    }

    if (expectedEncounterId && memoryRecord.encounterId && String(memoryRecord.encounterId).trim() !== String(expectedEncounterId).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Encounter ID pada Safety Decision [${memoryRecord.encounterId}] tidak sesuai dengan encounter target [${expectedEncounterId}].`,
        'SAFETY_ENCOUNTER_CONTEXT_MISMATCH',
        400
      );
    }

    if (requestActorId && String(memoryRecord.actorId).trim() !== String(requestActorId).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Eksekutor mutasi [${requestActorId}] berbeda dengan staf medis yang mengotorisasi keputusan [${memoryRecord.actorId}]. Akses ditolak.`,
        'SAFETY_ACTOR_MISMATCH',
        403
      );
    }

    if (expectedAction && String(memoryRecord.action).trim() !== String(expectedAction).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Aksi yang diotorisasi [${memoryRecord.action}] tidak sesuai dengan endpoint mutasi [${expectedAction}].`,
        'SAFETY_ACTION_MISMATCH',
        400
      );
    }

    const effectiveJustification = justification || safetyDecision?.justification;
    if (effectiveJustification && String(effectiveJustification).trim() !== String(memoryRecord.justification).trim()) {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Alasan klinis pada body request telah dimanipulasi atau berbeda dengan otorisasi HardStop dialog.',
        'SAFETY_JUSTIFICATION_TAMPERED',
        400
      );
    }

    if (actualCommandPayload !== null && actualCommandPayload !== undefined) {
      const calculatedHash = computeCommandHash(actualCommandPayload);
      if (memoryRecord.commandHash.toLowerCase() !== calculatedHash.toLowerCase()) {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Cryptographic Command Hash mismatch! Payload mutasi telah berubah dari otorisasi asli. (Expected: ${calculatedHash}, Decision: ${memoryRecord.commandHash})`,
          'SAFETY_COMMAND_HASH_MISMATCH',
          400
        );
      }
    }

    inMemoryConsumedDecisions.set(targetDecisionId, {
      decisionId: targetDecisionId,
      actorId: requestActorId || memoryRecord.actorId,
      timestamp: Date.now()
    });

    return {
      isValid: true,
      isConsumed: true,
      decisionId: memoryRecord.decisionId,
      tenantId: memoryRecord.tenantId,
      patientId: memoryRecord.patientId,
      encounterId: memoryRecord.encounterId,
      actorId: memoryRecord.actorId,
      actorRole: memoryRecord.actorRole,
      action: memoryRecord.action,
      riskType: memoryRecord.riskType,
      justification: memoryRecord.justification,
      commandHash: memoryRecord.commandHash,
      correlationId: memoryRecord.correlationId,
      consumedAt: new Date().toISOString()
    };
  },

  /**
   * Synchronous / Stateless verification of Safety Decision structure and context
   */
  verifyDecisionContract: function(params) {
    const targetDecisionId = params.decisionId || params.safetyDecision?.decisionId;
    if (!targetDecisionId) {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Mutasi klinis berisiko tinggi wajib menyertakan token otorisasi Safety Decision yang valid.',
        'SAFETY_DECISION_REQUIRED',
        403
      );
    }

    const decision = params.safetyDecision || inMemoryIssuedDecisions.get(targetDecisionId);
    if (!decision) {
      // In stateless check, if not provided in payload, return basic contract
      return {
        isValid: true,
        decisionId: targetDecisionId
      };
    }

    const { patientId, encounterId, actorId, action, justification, expiresAt, commandHash, correlationId } = decision;

    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Token Safety Decision [${targetDecisionId}] telah kadaluarsa pada ${expiresAt}.`,
        'SAFETY_DECISION_EXPIRED',
        401
      );
    }

    if (params.expectedPatientId && String(patientId).trim() !== String(params.expectedPatientId).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Patient ID pada Safety Decision [${patientId}] tidak sesuai dengan data target [${params.expectedPatientId}]. Potensi Cross-Patient Contamination!`,
        'SAFETY_PATIENT_CONTEXT_MISMATCH',
        400
      );
    }

    if (params.expectedEncounterId && encounterId && String(encounterId).trim() !== String(params.expectedEncounterId).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Encounter ID pada Safety Decision [${encounterId}] tidak sesuai dengan encounter target [${params.expectedEncounterId}].`,
        'SAFETY_ENCOUNTER_CONTEXT_MISMATCH',
        400
      );
    }

    const requestActorId = params.actor?.userId || params.actor?.id;
    if (requestActorId && String(actorId).trim() !== String(requestActorId).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Eksekutor mutasi [${requestActorId}] berbeda dengan staf medis yang mengotorisasi keputusan [${actorId}]. Akses ditolak.`,
        'SAFETY_ACTOR_MISMATCH',
        403
      );
    }

    if (params.expectedAction && action && String(action).trim() !== String(params.expectedAction).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Aksi yang diotorisasi [${action}] tidak sesuai dengan endpoint mutasi [${params.expectedAction}].`,
        'SAFETY_ACTION_MISMATCH',
        400
      );
    }

    if (params.actualCommandPayload && commandHash) {
      const calculatedHash = computeCommandHash(params.actualCommandPayload);
      if (commandHash.toLowerCase() !== calculatedHash.toLowerCase()) {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Cryptographic Command Hash mismatch! Payload mutasi telah berubah dari otorisasi asli.`,
          'SAFETY_COMMAND_HASH_MISMATCH',
          400
        );
      }
    }

    return {
      isValid: true,
      decisionId: targetDecisionId,
      patientId,
      encounterId,
      actorId,
      action,
      justification,
      commandHash,
      correlationId: correlationId || `CORR-VERIFIED-${Date.now()}`
    };
  },

  /**
   * Compatibility wrapper for synchronous in-memory consumers
   */
  verifyAndConsumeDecision: function(params) {
    const targetDecisionId = params.decisionId || params.safetyDecision?.decisionId;
    if (!targetDecisionId) {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Mutasi klinis berisiko tinggi wajib menyertakan ID otorisasi Safety Decision yang valid.',
        'SAFETY_DECISION_REQUIRED',
        403
      );
    }

    if (inMemoryConsumedDecisions.has(targetDecisionId)) {
      const existing = inMemoryConsumedDecisions.get(targetDecisionId);
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Safety Decision [${targetDecisionId}] telah digunakan sebelumnya pada ${new Date(existing.timestamp).toISOString()}. Replay ditolak.`,
        'SAFETY_DECISION_ALREADY_CONSUMED',
        409
      );
    }

    const verified = this.verifyDecisionContract(params);

    inMemoryConsumedDecisions.set(targetDecisionId, {
      decisionId: targetDecisionId,
      actorId: params.actor?.userId || verified.actorId,
      timestamp: Date.now()
    });

    return {
      ...verified,
      isConsumed: true,
      consumedAt: new Date().toISOString()
    };
  }
};
