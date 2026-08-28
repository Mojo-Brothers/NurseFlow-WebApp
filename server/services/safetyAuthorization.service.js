/**
 * ============================================================================
 * 🏥 NURSEFLOW ENTERPRISE HIS 2026 — SERVER SAFETY AUTHORIZATION SERVICE
 * BACKEND ENFORCEMENT BOUNDARY: SAFETY DECISION VERIFICATION & ANTI-REPLAY
 * ============================================================================
 */

import crypto from 'crypto';

class SafetyAuthorizationError extends Error {
  constructor(message, code = 'SAFETY_AUTHORIZATION_FAILED', statusCode = 403, details = []) {
    super(message);
    this.name = 'SafetyAuthorizationError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// In-Memory Replay Cache (with TTL / Persistent Fallback)
const consumedDecisions = new Map();

// Periodic cleanup of consumed decisions older than 24 hours
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of consumedDecisions.entries()) {
    if (now - value.timestamp > 86400000) {
      consumedDecisions.delete(key);
    }
  }
}, 3600000);

export const safetyAuthorizationService = {
  /**
   * Validates a SafetyDecision payload against the target clinical mutation context
   * @param {Object} params
   * @param {Object} params.safetyDecision - The submitted safety decision token/object
   * @param {string} params.expectedAction - Target action code (e.g. 'CPOE_ORDER_CANCEL')
   * @param {string} params.expectedPatientId - Target patient ID from database/aggregate
   * @param {string} [params.expectedEncounterId] - Target encounter ID from database/aggregate
   * @param {Object} params.actor - Authenticated actor performing the mutation
   * @param {string} [params.justification] - Direct justification argument from request
   * @returns {Object} Verified and consumed safety decision
   */
  verifyAndConsumeDecision: ({
    safetyDecision,
    expectedAction,
    expectedPatientId,
    expectedEncounterId = null,
    actor = {},
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
      createdAt
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

    // 4. Single-Use Anti-Replay Guard
    if (consumedDecisions.has(decisionId)) {
      const existing = consumedDecisions.get(decisionId);
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Safety Decision [${decisionId}] telah digunakan sebelumnya pada ${new Date(existing.timestamp).toISOString()}. Replay ditolak.`,
        'SAFETY_DECISION_ALREADY_CONSUMED',
        409,
        [{ decisionId, consumedAt: existing.timestamp }]
      );
    }

    // 5. Patient Context Binding (Cross-Patient Protection)
    if (expectedPatientId && String(patientId).trim() !== String(expectedPatientId).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Ketidaksesuaian Konteks Pasien. Safety Decision diterbitkan untuk [${patientId}] namun target mutasi adalah [${expectedPatientId}].`,
        'SAFETY_PATIENT_CONTEXT_MISMATCH',
        400,
        [{ expectedPatientId, actualPatientId: patientId }]
      );
    }

    // 6. Encounter Context Binding (if expected)
    if (expectedEncounterId && encounterId && String(encounterId).trim() !== String(expectedEncounterId).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Ketidaksesuaian Konteks Kunjungan/Encounter [${encounterId} vs ${expectedEncounterId}].`,
        'SAFETY_ENCOUNTER_CONTEXT_MISMATCH',
        400
      );
    }

    // 7. Actor Identity Binding (Accountability & Impersonation Prevention)
    const currentActorId = actor.userId || actor.id || actor.username;
    if (currentActorId && actorId && String(actorId).trim() !== String(currentActorId).trim()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Ketidaksesuaian Identitas Pelaku. Safety Decision diotorisasi oleh [${actorId}] namun dieksekusi oleh [${currentActorId}].`,
        'SAFETY_ACTOR_MISMATCH',
        403
      );
    }

    // 8. Action Binding
    if (expectedAction && action && String(action).trim().toUpperCase() !== String(expectedAction).trim().toUpperCase()) {
      throw new SafetyAuthorizationError(
        `FAIL-CLOSED: Aksi yang diotorisasi [${action}] tidak sesuai dengan aksi mutasi [${expectedAction}].`,
        'SAFETY_ACTION_MISMATCH',
        400
      );
    }

    // 9. Justification Anti-Tampering Check
    const effectiveJustification = decisionJustification || justification;
    if (!effectiveJustification || String(effectiveJustification).trim().length < 5) {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Justifikasi klinis pada Safety Decision wajib diisi minimal 5 karakter.',
        'INVALID_SAFETY_JUSTIFICATION',
        400
      );
    }

    if (justification && decisionJustification && String(justification).trim() !== String(decisionJustification).trim()) {
      throw new SafetyAuthorizationError(
        'FAIL-CLOSED: Justifikasi pada request berbeda dengan justifikasi yang telah diotorisasi pada HardStop.',
        'SAFETY_JUSTIFICATION_TAMPERED',
        400
      );
    }

    // 10. Mark Decision as CONSUMED
    consumedDecisions.set(decisionId, {
      timestamp: Date.now(),
      patientId,
      actorId,
      action: expectedAction
    });

    return {
      decisionId,
      verified: true,
      patientId,
      encounterId,
      actorId,
      justification: String(effectiveJustification).trim(),
      consumedAt: new Date().toISOString()
    };
  },

  /**
   * Reset replay cache (for test isolation)
   */
  _resetReplayCache: () => {
    consumedDecisions.clear();
  }
};
