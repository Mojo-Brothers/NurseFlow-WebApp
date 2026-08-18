/**
 * NURSEFLOW ENTERPRISE HIS — CLINICAL SECURITY & AUTHORIZATION HARDENING ENGINE
 * Implements granular Role-Based Access Control (RBAC), Attribute-Based Access Control (ABAC),
 * Terminal Encounter Immutability Invariants, and Cross-Patient Context Isolation (Anti-IDOR).
 */

import { persistenceAdapter } from '../services/persistenceAdapter.service.js';

export const CLINICAL_ROLES = Object.freeze({
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  PHARMACIST: 'PHARMACIST',
  LAB_TECH: 'LAB_TECH',
  RADIOLOGIST: 'RADIOLOGIST',
  ADMISSION_STAFF: 'ADMISSION_STAFF',
  BILLING_STAFF: 'BILLING_STAFF',
  AUDITOR: 'AUDITOR',
  ADMINISTRATOR: 'ADMINISTRATOR'
});

export const CLINICAL_RESOURCES = Object.freeze({
  PATIENT: 'PATIENT',
  ENCOUNTER: 'ENCOUNTER',
  SOAP_NOTE: 'SOAP_NOTE',
  CPPT_NOTE: 'CPPT_NOTE',
  CPOE_PRESCRIPTION: 'CPOE_PRESCRIPTION',
  EMAR_ADMINISTRATION: 'EMAR_ADMINISTRATION',
  LAB_ORDER: 'LAB_ORDER',
  RADIOLOGY_ORDER: 'RADIOLOGY_ORDER',
  BILLING_RECORD: 'BILLING_RECORD'
});

export const CLINICAL_ACTIONS = Object.freeze({
  READ: 'READ',
  WRITE: 'WRITE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  PRESCRIBE: 'PRESCRIBE',
  DISPENSE: 'DISPENSE',
  ADMINISTER: 'ADMINISTER',
  AUDIT: 'AUDIT'
});

// Authoritative Permission Matrix (ROLE x RESOURCE x ACTIONS)
export const PERMISSION_MATRIX = Object.freeze({
  [CLINICAL_ROLES.DOCTOR]: {
    [CLINICAL_RESOURCES.PATIENT]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.UPDATE],
    [CLINICAL_RESOURCES.ENCOUNTER]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.UPDATE],
    [CLINICAL_RESOURCES.SOAP_NOTE]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.WRITE, CLINICAL_ACTIONS.UPDATE],
    [CLINICAL_RESOURCES.CPPT_NOTE]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.WRITE],
    [CLINICAL_RESOURCES.CPOE_PRESCRIPTION]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.WRITE, CLINICAL_ACTIONS.PRESCRIBE],
    [CLINICAL_RESOURCES.EMAR_ADMINISTRATION]: [CLINICAL_ACTIONS.READ],
    [CLINICAL_RESOURCES.LAB_ORDER]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.WRITE],
    [CLINICAL_RESOURCES.RADIOLOGY_ORDER]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.WRITE],
    [CLINICAL_RESOURCES.BILLING_RECORD]: [CLINICAL_ACTIONS.READ]
  },
  [CLINICAL_ROLES.NURSE]: {
    [CLINICAL_RESOURCES.PATIENT]: [CLINICAL_ACTIONS.READ],
    [CLINICAL_RESOURCES.ENCOUNTER]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.UPDATE],
    [CLINICAL_RESOURCES.SOAP_NOTE]: [CLINICAL_ACTIONS.READ],
    [CLINICAL_RESOURCES.CPPT_NOTE]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.WRITE],
    [CLINICAL_RESOURCES.CPOE_PRESCRIPTION]: [CLINICAL_ACTIONS.READ],
    [CLINICAL_RESOURCES.EMAR_ADMINISTRATION]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.WRITE, CLINICAL_ACTIONS.ADMINISTER],
    [CLINICAL_RESOURCES.LAB_ORDER]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.WRITE],
    [CLINICAL_RESOURCES.RADIOLOGY_ORDER]: [CLINICAL_ACTIONS.READ],
    [CLINICAL_RESOURCES.BILLING_RECORD]: [CLINICAL_ACTIONS.READ]
  },
  [CLINICAL_ROLES.PHARMACIST]: {
    [CLINICAL_RESOURCES.PATIENT]: [CLINICAL_ACTIONS.READ],
    [CLINICAL_RESOURCES.ENCOUNTER]: [CLINICAL_ACTIONS.READ],
    [CLINICAL_RESOURCES.SOAP_NOTE]: [CLINICAL_ACTIONS.READ],
    [CLINICAL_RESOURCES.CPPT_NOTE]: [CLINICAL_ACTIONS.READ],
    [CLINICAL_RESOURCES.CPOE_PRESCRIPTION]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.UPDATE, CLINICAL_ACTIONS.DISPENSE],
    [CLINICAL_RESOURCES.EMAR_ADMINISTRATION]: [CLINICAL_ACTIONS.READ],
    [CLINICAL_RESOURCES.BILLING_RECORD]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.WRITE]
  },
  [CLINICAL_ROLES.AUDITOR]: {
    [CLINICAL_RESOURCES.PATIENT]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.AUDIT],
    [CLINICAL_RESOURCES.ENCOUNTER]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.AUDIT],
    [CLINICAL_RESOURCES.SOAP_NOTE]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.AUDIT],
    [CLINICAL_RESOURCES.CPPT_NOTE]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.AUDIT],
    [CLINICAL_RESOURCES.CPOE_PRESCRIPTION]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.AUDIT],
    [CLINICAL_RESOURCES.EMAR_ADMINISTRATION]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.AUDIT],
    [CLINICAL_RESOURCES.BILLING_RECORD]: [CLINICAL_ACTIONS.READ, CLINICAL_ACTIONS.AUDIT]
  }
});

export class ClinicalSecurityEngine {
  constructor() {
    this.AUDIT_COLLECTION = 'security_audit_logs';
  }

  /**
   * Evaluate access request against RBAC, ABAC, and Terminal Encounter Invariants
   */
  async evaluateAccess({
    actorId,
    actorRole,
    resource,
    action,
    encounter = null,
    patientId = null,
    targetPatientId = null
  }) {
    // 1. Basic RBAC Check
    const rolePermissions = PERMISSION_MATRIX[actorRole];
    if (!rolePermissions) {
      await this._logSecurityViolation({
        actorId,
        actorRole,
        resource,
        action,
        reason: `Role "${actorRole}" is not defined in the authorization matrix`
      });
      return { allowed: false, reason: `Role "${actorRole}" has no access permissions` };
    }

    const resourceAllowedActions = rolePermissions[resource] || [];
    if (!resourceAllowedActions.includes(action)) {
      await this._logSecurityViolation({
        actorId,
        actorRole,
        resource,
        action,
        reason: `Role "${actorRole}" is not authorized to perform "${action}" on "${resource}"`
      });
      return { allowed: false, reason: `Unauthorized action "${action}" on resource "${resource}"` };
    }

    // 2. Closed Encounter Immutability Check (JCI Medicolegal Invariant)
    if (encounter && (encounter.primaryState === 'DISCHARGED' || encounter.isTerminal)) {
      if (action !== CLINICAL_ACTIONS.READ && action !== CLINICAL_ACTIONS.AUDIT) {
        await this._logSecurityViolation({
          actorId,
          actorRole,
          resource,
          action,
          encounterId: encounter.id,
          reason: `Attempted to perform mutating action "${action}" on TERMINAL/DISCHARGED encounter`
        });
        return {
          allowed: false,
          reason: `Encounter "${encounter.id}" is CLOSED/TERMINAL. Modifying clinical records is strictly prohibited by medicolegal policy.`
        };
      }
    }

    // 3. Cross-Patient Context Isolation (Anti-IDOR Check)
    if (patientId && targetPatientId && patientId !== targetPatientId) {
      await this._logSecurityViolation({
        actorId,
        actorRole,
        resource,
        action,
        reason: `Cross-patient context mismatch: Active chart "${patientId}" vs Target record "${targetPatientId}"`
      });
      return {
        allowed: false,
        reason: `Cross-patient access violation detected. Active patient context mismatch.`
      };
    }

    return { allowed: true };
  }

  /**
   * Log security violation immutably
   */
  async _logSecurityViolation(violationData) {
    const logId = `SEC-VIOL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const logRecord = {
      id: logId,
      ...violationData,
      severity: 'SECURITY_ALERT',
      timestamp: new Date().toISOString()
    };
    await persistenceAdapter.save(this.AUDIT_COLLECTION, logRecord.id, logRecord);
    return logRecord;
  }

  /**
   * Query Security Audit Logs
   */
  async querySecurityAuditLogs() {
    return await persistenceAdapter.query(this.AUDIT_COLLECTION) || [];
  }
}

export const clinicalSecurityEngine = new ClinicalSecurityEngine();
export default clinicalSecurityEngine;
