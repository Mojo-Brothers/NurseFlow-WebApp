/**
 * ============================================================================
 * 🏥 NURSEFLOW ENTERPRISE HIS 2026 — SAFETY DECISION CONTRACT
 * DOMAIN: CLINICAL SAFETY AUTHORIZATION & LINEAGE (JCI / KEMENKES STANDARDS)
 * ============================================================================
 */

/**
 * Creates an immutable, context-bound Safety Decision payload
 * @param {Object} params
 * @param {string} params.patientId - Authoritative patient ID
 * @param {string} params.encounterId - Authoritative encounter ID
 * @param {string} params.actorId - Current authenticated actor/user ID
 * @param {string} params.actorRole - Current authenticated actor role (e.g. ROLE_DOCTOR_DPJP)
 * @param {string} params.action - Target clinical action (e.g. 'CPOE_ORDER_CANCEL', 'ALLERGY_OVERRIDE')
 * @param {string} params.riskType - Risk classification ('CRITICAL_OVERRIDE' | 'DESTRUCTIVE_ACTION')
 * @param {string} params.justification - Mandatory clinical rationale (min 5 chars)
 * @param {boolean} params.acknowledgment - Explicit acknowledgment of clinical risk
 * @param {string} [params.typedConfirmation] - Optional typed confirmation phrase
 * @param {string} [params.correlationId] - Tracing correlation ID
 * @param {string} [params.commandHash] - Optional hash of the target mutation payload
 * @returns {Object} Immutable Safety Decision object
 */
export function createSafetyDecision({
  patientId,
  encounterId,
  actorId,
  actorRole = 'ROLE_DOCTOR_DPJP',
  action = 'CLINICAL_ACTION',
  riskType = 'CRITICAL_OVERRIDE',
  justification,
  acknowledgment = true,
  typedConfirmation = null,
  correlationId = null,
  commandHash = null
}) {
  if (!patientId) throw new Error('Safety Decision Error: patientId is mandatory for context binding.');
  if (!encounterId) throw new Error('Safety Decision Error: encounterId is mandatory for context binding.');
  if (!actorId) throw new Error('Safety Decision Error: actorId is mandatory for accountability.');
  if (!justification || justification.trim().length < 5) {
    throw new Error('Safety Decision Error: Justification must be at least 5 characters.');
  }
  if (acknowledgment !== true) {
    throw new Error('Safety Decision Error: Risk acknowledgment must be explicitly true.');
  }

  const decisionId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? `SD-${crypto.randomUUID()}`
    : `SD-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const corrId = correlationId || (
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? `CORR-SD-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
      : `CORR-SD-${Date.now()}`
  );

  return Object.freeze({
    decisionId,
    patientId: String(patientId).trim(),
    encounterId: String(encounterId).trim(),
    actorId: String(actorId).trim(),
    actorRole: String(actorRole).trim(),
    action: String(action).trim(),
    riskType: String(riskType).trim(),
    justification: String(justification).trim(),
    acknowledgment: true,
    typedConfirmation: typedConfirmation ? String(typedConfirmation).trim() : null,
    createdAt: new Date().toISOString(),
    correlationId: corrId,
    commandHash: commandHash || null,
    status: 'AUTHORIZED'
  });
}
