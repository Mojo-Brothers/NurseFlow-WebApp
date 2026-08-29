/**
 * ============================================================================
 * 🏥 NURSEFLOW ENTERPRISE HIS 2026 — SERVER SAFETY AUTHORIZATION SERVICE
 * BACKEND ENFORCEMENT BOUNDARY: SAFETY DECISION VERIFICATION, CRYPTOGRAPHIC
 * COMMAND BINDING, ACID TRANSACTIONAL PERSISTENCE & ANTI-REPLAY DEFENSE
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

// In-Memory Replay Cache (Backup for Unit Runner without Live DB)
const inMemoryConsumedDecisions = new Map();

export const safetyAuthorizationService = {
  /**
   * Clears the in-memory replay cache (Useful for test setups)
   */
  _resetReplayCache: () => {
    inMemoryConsumedDecisions.clear();
  },

  /**
   * Synchronous / Stateless verification of Safety Decision structure and context
   * @param {Object} params
   * @returns {Object} Verified decision summary
   */
  verifyDecisionContract: ({
    safetyDecision,
    expectedAction,
    expectedPatientId,
    expectedEncounterId = null,
    actor = {},
    actualCommandPayload = null,
    justification = null
  }) => {
    // 1. Mandatory Presence Check
    if (!safetyDecision || typeof safetyDecision !== 'object') {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Mutasi klinis berisiko tinggi wajib menyertakan token otorisasi Safety Decision yang valid.',
        'SAFETY_DECISION_REQUIRED',
        403
      );
    }

    const {
      decisionId,
      patientId,
      encounterId,
      actorId,
      action,
      riskType,
      justification: decisionJustification,
      acknowledgment,
      createdAt,
      expiresAt,
      commandHash,
      correlationId
    } = safetyDecision;

    // 2. Structural Field Validation
    if (!decisionId || !patientId || !actorId) {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Struktur Safety Decision tidak lengkap atau cacat.',
        'MALFORMED_SAFETY_DECISION',
        400
      );
    }

    // 3. Acknowledgment Validation
    if (acknowledgment !== true) {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Risiko klinis belum dikonfirmasi/diakui pada HardStop interface.',
        'RISK_ACKNOWLEDGMENT_MISSING',
        400
      );
    }

    // 4. Expiration Guard
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Token Safety Decision [${decisionId}] telah kadaluarsa pada ${expiresAt}.`,
        'SAFETY_DECISION_EXPIRED',
        401,
        [{ decisionId, expiresAt }]
      );
    }

    // 6. Context Binding — Patient Validation
    if (expectedPatientId && String(patientId).trim() !== String(expectedPatientId).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Patient ID pada Safety Decision [${patientId}] tidak sesuai dengan data target [${expectedPatientId}]. Potensi Cross-Patient Contamination!`,
        'SAFETY_PATIENT_CONTEXT_MISMATCH',
        400,
        [{ authorizedPatientId: patientId, targetPatientId: expectedPatientId }]
      );
    }

    // 6. Context Binding — Encounter Validation
    if (expectedEncounterId && encounterId && String(encounterId).trim() !== String(expectedEncounterId).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Encounter ID pada Safety Decision [${encounterId}] tidak sesuai dengan encounter target [${expectedEncounterId}].`,
        'SAFETY_ENCOUNTER_CONTEXT_MISMATCH',
        400,
        [{ authorizedEncounterId: encounterId, targetEncounterId: expectedEncounterId }]
      );
    }

    // 7. Actor Accountability Guard
    const requestActorId = actor.userId || actor.id;
    if (requestActorId && String(actorId).trim() !== String(requestActorId).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Eksekutor mutasi [${requestActorId}] berbeda dengan staf medis yang mengotorisasi keputusan [${actorId}]. Akses ditolak.`,
        'SAFETY_ACTOR_MISMATCH',
        403,
        [{ authorizedActorId: actorId, requestActorId }]
      );
    }

    // 8. Action Type Binding
    if (expectedAction && action && String(action).trim() !== String(expectedAction).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Aksi yang diotorisasi [${action}] tidak sesuai dengan endpoint mutasi [${expectedAction}].`,
        'SAFETY_ACTION_MISMATCH',
        400,
        [{ authorizedAction: action, expectedAction }]
      );
    }

    // 9. Anti-Tampering Justification Guard
    const effectiveJustification = justification || decisionJustification;
    if (justification && decisionJustification && String(justification).trim() !== String(decisionJustification).trim()) {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Alasan klinis pada body request telah dimanipulasi atau berbeda dengan otorisasi HardStop dialog.',
        'SAFETY_JUSTIFICATION_TAMPERED',
        400,
        [{ requestJustification: justification, decisionJustification }]
      );
    }

    // 10. Cryptographic Command Hash Verification (E2)
    if (actualCommandPayload !== null && actualCommandPayload !== undefined && commandHash) {
      const calculatedHash = computeCommandHash(actualCommandPayload);
      const isHashMatch = (commandHash.length === calculatedHash.length) && 
        (typeof crypto !== 'undefined' && crypto.timingSafeEqual
          ? crypto.timingSafeEqual(Buffer.from(commandHash, 'utf8'), Buffer.from(calculatedHash, 'utf8'))
          : commandHash.toLowerCase() === calculatedHash.toLowerCase());

      if (!isHashMatch) {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Cryptographic Command Hash mismatch! Payload mutasi telah berubah dari otorisasi asli. (Expected: ${calculatedHash}, Decision: ${commandHash})`,
          'SAFETY_COMMAND_HASH_MISMATCH',
          400,
          [{ expectedHash: calculatedHash, providedHash: commandHash }]
        );
      }
    }

    return {
      isValid: true,
      decisionId,
      patientId,
      encounterId,
      actorId,
      action,
      riskType,
      justification: effectiveJustification,
      commandHash,
      correlationId: correlationId || `CORR-VERIFIED-${Date.now()}`
    };
  },

  /**
   * Transactional ACID verification and consumption against PostgreSQL Safety Decision Registry (E3)
   * @param {Object} [client] - Active PostgreSQL database transaction client (Optional for in-memory)
   * @param {Object} params - Verification parameters
   * @returns {Promise<Object>} Verified and consumed safety decision
   */
  verifyAndConsumeTransactional: async function(client, params) {
    const verified = this.verifyDecisionContract(params);
    const { decisionId, patientId, encounterId, actorId, action, riskType, justification, commandHash, correlationId } = verified;
    const actorRole = params.safetyDecision.actorRole || params.actor?.role || 'ROLE_DOCTOR_DPJP';
    const expiresAt = params.safetyDecision.expiresAt || new Date(Date.now() + 15 * 60000).toISOString();
    const createdAt = params.safetyDecision.createdAt || new Date().toISOString();

    // ─── POSTGRESQL ACID TRANSACTIONAL CONSUMPTION (E1 & E3) ───
    if (client && typeof client.query === 'function') {
      // 1. Ensure registry row exists in ISSUED state (Idempotent seed/intake)
      await client.query(`
        INSERT INTO safety_decision_registry (
          decision_id, patient_id, encounter_id, actor_id, actor_role,
          action_type, risk_type, justification, command_hash, correlation_id,
          status, expires_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          'ISSUED', $11, $12
        )
        ON CONFLICT (decision_id) DO NOTHING;
      `, [
        decisionId,
        patientId,
        encounterId,
        actorId,
        actorRole,
        action,
        riskType,
        justification,
        commandHash || 'UNHASHED_LEGACY',
        correlationId,
        expiresAt,
        createdAt
      ]);

      // 2. Lock row FOR UPDATE to guarantee distributed single-use across parallel connections
      const lockRes = await client.query(`
        SELECT decision_id, status, command_hash, patient_id, encounter_id, actor_id, action_type, consumed_at, consumed_by_actor_id
        FROM safety_decision_registry
        WHERE decision_id = $1
        FOR UPDATE;
      `, [decisionId]);

      if (lockRes.rowCount === 0) {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Safety Decision [${decisionId}] tidak ditemukan pada registry basis data.`,
          'SAFETY_DECISION_NOT_FOUND',
          404
        );
      }

      const row = lockRes.rows[0];
      if (row.status === 'CONSUMED') {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Safety Decision [${decisionId}] telah digunakan sebelumnya pada ${row.consumed_at} oleh [${row.consumed_by_actor_id}]. Replay ditolak.`,
          'SAFETY_DECISION_ALREADY_CONSUMED',
          409,
          [{ decisionId, consumedAt: row.consumed_at, consumedBy: row.consumed_by_actor_id }]
        );
      }

      if (row.status !== 'ISSUED') {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Status Safety Decision [${decisionId}] adalah [${row.status}]. Mutasi ditolak.`,
          'SAFETY_DECISION_INVALID_STATUS',
          400,
          [{ decisionId, status: row.status }]
        );
      }

      // Anti-Pre-Registration & Database Invariant Verification
      const expectedHash = commandHash || 'UNHASHED_LEGACY';
      if (row.command_hash !== expectedHash || 
          String(row.patient_id).trim() !== String(patientId).trim() || 
          String(row.actor_id).trim() !== String(actorId).trim()) {
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Ketidaksesuaian integritas data registry untuk Safety Decision [${decisionId}]. Upaya injeksi / pre-registration tampering ditolak.`,
          'SAFETY_DECISION_INTEGRITY_COMPROMISED',
          403,
          [{ decisionId, dbCommandHash: row.command_hash, requestCommandHash: expectedHash }]
        );
      }

      // 3. Mark as CONSUMED within the active transaction
      await client.query(`
        UPDATE safety_decision_registry
        SET status = 'CONSUMED',
            consumed_at = NOW(),
            consumed_by_actor_id = $2
        WHERE decision_id = $1;
      `, [decisionId, actorId]);
    } else {
      // ─── IN-MEMORY SINGLE-USE REPLAY GUARD FALLBACK ───
      if (inMemoryConsumedDecisions.has(decisionId)) {
        const existing = inMemoryConsumedDecisions.get(decisionId);
        throw new SafetyAuthorizationError(
          `FAIL-CLOSED: Safety Decision [${decisionId}] telah digunakan sebelumnya pada ${new Date(existing.timestamp).toISOString()}. Replay ditolak.`,
          'SAFETY_DECISION_ALREADY_CONSUMED',
          409,
          [{ decisionId, consumedAt: existing.timestamp }]
        );
      }

      inMemoryConsumedDecisions.set(decisionId, {
        decisionId,
        actorId,
        action,
        timestamp: Date.now()
      });
    }

    return {
      ...verified,
      isConsumed: true,
      consumedAt: new Date().toISOString()
    };
  },

  /**
   * Compatibility wrapper for synchronous/non-transactional consumers
   */
  verifyAndConsumeDecision: function(params) {
    // Synchronously consumes in memory
    const verified = this.verifyDecisionContract(params);
    const { decisionId, actorId, action } = verified;

    if (inMemoryConsumedDecisions.has(decisionId)) {
      const existing = inMemoryConsumedDecisions.get(decisionId);
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Safety Decision [${decisionId}] telah digunakan sebelumnya pada ${new Date(existing.timestamp).toISOString()}. Replay ditolak.`,
        'SAFETY_DECISION_ALREADY_CONSUMED',
        409,
        [{ decisionId, consumedAt: existing.timestamp }]
      );
    }

    inMemoryConsumedDecisions.set(decisionId, {
      decisionId,
      actorId,
      action,
      timestamp: Date.now()
    });

    return {
      ...verified,
      isConsumed: true,
      consumedAt: new Date().toISOString()
    };
  }
};
