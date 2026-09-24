/**
 * NurseFlow Enterprise HIS 2026 — Clinical Separation of Duties (SoD) Service
 * Standards: ISO 27001 Dual-Control & Four-Eyes Principle, JCI International Patient Safety Goals (IPSG)
 * 
 * Prevents conflicting clinical authorities (e.g. Prescribing vs Dispensing, Ordering vs Result Validation).
 */

import { AUTHORIZATION_DECISIONS } from '../contracts/authorizationDecision.contract.js';

export const separationOfDutiesService = {
  // Built-in clinical SoD rules registry
  _rules: new Map(),

  /**
   * Register a custom or module-specific SoD rule.
   * @param {string} ruleId
   * @param {Function} evaluator - fn({ actorId, action, targetResource, transactionContext }) => { satisfiesSoD: boolean, reason?: string }
   */
  registerRule(ruleId, evaluator) {
    if (typeof evaluator !== 'function') {
      throw new Error(`Evaluator for rule [${ruleId}] must be a function`);
    }
    this._rules.set(ruleId, evaluator);
  },

  /**
   * Evaluates Separation of Duties policies on a clinical action and transaction.
   * 
   * @param {Object} params
   * @param {string} params.actorId - Authenticated actor UUID
   * @param {string} params.action - Action being evaluated
   * @param {Object} [params.targetResource] - Resource record being operated upon
   * @param {Object} [params.transactionContext] - Associated transaction history
   * @param {string} [params.specificRuleId] - Optional specific rule to evaluate
   * @returns {{
   *   satisfiesSoD: boolean;
   *   ruleId?: string;
   *   decision: string;
   *   reason?: string;
   * }}
   */
  evaluateSoD({
    actorId,
    action,
    targetResource = null,
    transactionContext = null,
    specificRuleId = null
  }) {
    if (!actorId) {
      return {
        satisfiesSoD: false,
        decision: AUTHORIZATION_DECISIONS.DENIED_SEPARATION_OF_DUTIES,
        reason: 'Missing actor identity for Separation of Duties check'
      };
    }

    // ─── 1. BUILT-IN RULE: CPOE PRESCRIBING VS PHARMACY DISPENSING (FOUR-EYES PRINCIPLE) ───
    if (action === 'PHARMACY_DISPENSE' && targetResource) {
      const prescriberId = targetResource.ordering_doctor_id || 
                           targetResource.prescriberId || 
                           targetResource.prescribed_by ||
                           targetResource.created_by;

      if (prescriberId && String(prescriberId) === String(actorId)) {
        return {
          satisfiesSoD: false,
          ruleId: 'SOD-CPOE-PHARMACY-DUAL-CONTROL',
          decision: AUTHORIZATION_DECISIONS.DENIED_SEPARATION_OF_DUTIES,
          reason: 'Separation of Duties Violation: Prescribing physician cannot dispense their own medication order.'
        };
      }
    }

    // ─── 2. BUILT-IN RULE: LAB ORDERING VS LAB RESULT VALIDATION ───
    if (action === 'LAB_RESULT_VALIDATE' && targetResource) {
      const orderingDoctorId = targetResource.ordering_doctor_id || targetResource.ordered_by;
      if (orderingDoctorId && String(orderingDoctorId) === String(actorId)) {
        return {
          satisfiesSoD: false,
          ruleId: 'SOD-LIS-ORDER-VALIDATE-DUAL-CONTROL',
          decision: AUTHORIZATION_DECISIONS.DENIED_SEPARATION_OF_DUTIES,
          reason: 'Separation of Duties Violation: Ordering clinician cannot be the validating analyst for laboratory results.'
        };
      }
    }

    // ─── 3. BUILT-IN RULE: CONTROLLED SUBSTANCES WITNESS ───
    if (action === 'CONTROLLED_DRUG_WITNESS' && transactionContext) {
      const primaryAdministerNurseId = transactionContext.administeredBy || transactionContext.administer_nurse_id;
      if (primaryAdministerNurseId && String(primaryAdministerNurseId) === String(actorId)) {
        return {
          satisfiesSoD: false,
          ruleId: 'SOD-CONTROLLED-DRUG-WITNESS-SELF',
          decision: AUTHORIZATION_DECISIONS.DENIED_SEPARATION_OF_DUTIES,
          reason: 'Separation of Duties Violation: Clinician administering controlled substance cannot act as their own co-witness.'
        };
      }
    }

    // ─── 4. EVALUATE REGISTERED DYNAMIC RULES ───
    if (specificRuleId && this._rules.has(specificRuleId)) {
      const customEvaluator = this._rules.get(specificRuleId);
      const res = customEvaluator({ actorId, action, targetResource, transactionContext });
      if (!res.satisfiesSoD) {
        return {
          satisfiesSoD: false,
          ruleId: specificRuleId,
          decision: AUTHORIZATION_DECISIONS.DENIED_SEPARATION_OF_DUTIES,
          reason: res.reason || `Separation of Duties Violation under policy [${specificRuleId}]`
        };
      }
    }

    return {
      satisfiesSoD: true,
      decision: AUTHORIZATION_DECISIONS.AUTHORIZED
    };
  }
};
