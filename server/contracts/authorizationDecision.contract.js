/**
 * NurseFlow Enterprise HIS 2026 — Canonical Authorization Decision Contract
 * Standards: NIST SP 800-162 (ABAC), ISO/IEC 27001 Multi-Tenancy & JCI MOI / KARS KPS
 * 
 * Single Source of Truth (SSOT) for the entire Enterprise Authorization Decision Taxonomy.
 * Enforces contract consistency between runtime evaluation engines, forensic audit persistence,
 * database schema check constraints, and security verification test suites.
 */

export const DECISION_CLASSIFICATION = Object.freeze({
  CLINICAL_AUTHORIZATION: 'CLINICAL_AUTHORIZATION',
  SYSTEM_SAFETY: 'SYSTEM_SAFETY',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  RESERVED: 'RESERVED',
  LEGACY: 'LEGACY'
});

export const AUDIT_DESTINATION = Object.freeze({
  CLINICAL_LOGS: 'clinical_authorization_logs',
  BTG_LEDGER: 'break_glass_audit_ledger',
  NONE: 'none'
});

export const AUTHORIZATION_DECISIONS = Object.freeze({
  // ─── CLASS A: CLINICAL AUTHORIZATION DECISIONS (POLICY OUTCOMES) ───
  AUTHORIZED: 'AUTHORIZED',
  AUTHORIZED_BREAK_THE_GLASS: 'AUTHORIZED_BREAK_THE_GLASS',

  DENIED_AUTHENTICATION_REQUIRED: 'DENIED_AUTHENTICATION_REQUIRED',
  DENIED_TENANT_MISSING: 'DENIED_TENANT_MISSING',
  DENIED_TENANT_MISMATCH: 'DENIED_TENANT_MISMATCH',
  DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION: 'DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION',
  DENIED_PERMISSION_MISSING: 'DENIED_PERMISSION_MISSING',

  DENIED_CREDENTIAL_MISSING: 'DENIED_CREDENTIAL_MISSING',
  DENIED_CREDENTIAL_EXPIRED: 'DENIED_CREDENTIAL_EXPIRED',
  DENIED_CREDENTIAL_REVOKED: 'DENIED_CREDENTIAL_REVOKED',

  DENIED_STAFF_INACTIVE: 'DENIED_STAFF_INACTIVE',
  DENIED_NO_PRIVILEGE: 'DENIED_NO_PRIVILEGE',
  DENIED_NOT_ATTENDING_PROVIDER: 'DENIED_NOT_ATTENDING_PROVIDER',
  DENIED_SEPARATION_OF_DUTIES: 'DENIED_SEPARATION_OF_DUTIES',

  DENIED_BTG_UNAUTHORIZED: 'DENIED_BTG_UNAUTHORIZED',
  DENIED_BTG_INVALID_REASON: 'DENIED_BTG_INVALID_REASON',

  DENIED_RESOURCE_NOT_FOUND: 'DENIED_RESOURCE_NOT_FOUND',

  // ─── CLASS B: SYSTEM SAFETY STATE (FAIL-CLOSED INFRASTRUCTURE INTERCEPTION) ───
  DENIED_AUDIT_PERSISTENCE_FAILURE: 'DENIED_AUDIT_PERSISTENCE_FAILURE',

  // ─── TECHNICAL RUNTIME ERRORS ───
  DENIED_SYSTEM_ERROR: 'DENIED_SYSTEM_ERROR',

  // ─── CLASS C: RESERVED FUTURE & LEGACY COMPATIBILITY ───
  DENIED_ROLE_FORBIDDEN: 'DENIED_ROLE_FORBIDDEN',
  DENIED_SESSION_INVALIDATED: 'DENIED_SESSION_INVALIDATED',
  DENIED_PRIVILEGE_EXPIRED: 'DENIED_PRIVILEGE_EXPIRED',
  DENIED_WRONG_UNIT: 'DENIED_WRONG_UNIT',
  DENIED_NOT_ON_DUTY: 'DENIED_NOT_ON_DUTY'
});

export const DECISION_METADATA = Object.freeze({
  [AUTHORIZATION_DECISIONS.AUTHORIZED]: {
    code: AUTHORIZATION_DECISIONS.AUTHORIZED,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Clinical authorization granted based on full credential, privilege, resource, and SoD compliance.'
  },
  [AUTHORIZATION_DECISIONS.AUTHORIZED_BREAK_THE_GLASS]: {
    code: AUTHORIZATION_DECISIONS.AUTHORIZED_BREAK_THE_GLASS,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS, AUDIT_DESTINATION.BTG_LEDGER],
    description: 'Emergency clinical override protocol granted with mandatory clinical justification.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_AUTHENTICATION_REQUIRED]: {
    code: AUTHORIZATION_DECISIONS.DENIED_AUTHENTICATION_REQUIRED,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Actor identity is unauthenticated or missing from request context.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_TENANT_MISSING]: {
    code: AUTHORIZATION_DECISIONS.DENIED_TENANT_MISSING,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Actor claims or target resource lacks authoritative tenant ID.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_TENANT_MISMATCH]: {
    code: AUTHORIZATION_DECISIONS.DENIED_TENANT_MISMATCH,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Actor tenant does not match target resource tenant (Multi-tenant isolation barrier).'
  },
  [AUTHORIZATION_DECISIONS.DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION]: {
    code: AUTHORIZATION_DECISIONS.DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Super Administrator or IT Administrator restricted from clinical practice or prescribing.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_PERMISSION_MISSING]: {
    code: AUTHORIZATION_DECISIONS.DENIED_PERMISSION_MISSING,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Actor assigned roles do not possess the required clinical permission.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_MISSING]: {
    code: AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_MISSING,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Clinician has no active SIP or STR credential record registered in the tenant.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_EXPIRED]: {
    code: AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_EXPIRED,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Clinician SIP or STR credential valid until date is in the past.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_REVOKED]: {
    code: AUTHORIZATION_DECISIONS.DENIED_CREDENTIAL_REVOKED,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Clinician credential has been suspended or revoked by regulatory authority.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_STAFF_INACTIVE]: {
    code: AUTHORIZATION_DECISIONS.DENIED_STAFF_INACTIVE,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Clinician profile is marked inactive in clinical staff registry.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_NO_PRIVILEGE]: {
    code: AUTHORIZATION_DECISIONS.DENIED_NO_PRIVILEGE,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Practitioner lacks authorized Surat Penugasan Klinis (SPK) or RKK for procedure.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_NOT_ATTENDING_PROVIDER]: {
    code: AUTHORIZATION_DECISIONS.DENIED_NOT_ATTENDING_PROVIDER,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Physician is not the assigned attending physician (DPJP) for this encounter.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_SEPARATION_OF_DUTIES]: {
    code: AUTHORIZATION_DECISIONS.DENIED_SEPARATION_OF_DUTIES,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Dual-control separation of duties conflict (e.g. prescriber cannot dispense medication).'
  },
  [AUTHORIZATION_DECISIONS.DENIED_BTG_UNAUTHORIZED]: {
    code: AUTHORIZATION_DECISIONS.DENIED_BTG_UNAUTHORIZED,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Actor role lacks explicit CLINICAL_BREAK_GLASS permission for emergency override.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_BTG_INVALID_REASON]: {
    code: AUTHORIZATION_DECISIONS.DENIED_BTG_INVALID_REASON,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Break-The-Glass justification was missing, under 10 characters, or boilerplate.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_RESOURCE_NOT_FOUND]: {
    code: AUTHORIZATION_DECISIONS.DENIED_RESOURCE_NOT_FOUND,
    classification: DECISION_CLASSIFICATION.CLINICAL_AUTHORIZATION,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Target clinical resource identifier could not be resolved from storage.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_AUDIT_PERSISTENCE_FAILURE]: {
    code: AUTHORIZATION_DECISIONS.DENIED_AUDIT_PERSISTENCE_FAILURE,
    classification: DECISION_CLASSIFICATION.SYSTEM_SAFETY,
    isPersistable: false,
    auditDestinations: [AUDIT_DESTINATION.NONE],
    description: 'System safety fail-closed state returned when mandatory audit persistence fails. Never recursively persisted through failing audit path.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_SYSTEM_ERROR]: {
    code: AUTHORIZATION_DECISIONS.DENIED_SYSTEM_ERROR,
    classification: DECISION_CLASSIFICATION.SYSTEM_ERROR,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Internal evaluation failure caught safely to fail closed.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_ROLE_FORBIDDEN]: {
    code: AUTHORIZATION_DECISIONS.DENIED_ROLE_FORBIDDEN,
    classification: DECISION_CLASSIFICATION.RESERVED,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Reserved for explicit role denial policies.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_SESSION_INVALIDATED]: {
    code: AUTHORIZATION_DECISIONS.DENIED_SESSION_INVALIDATED,
    classification: DECISION_CLASSIFICATION.RESERVED,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Reserved for distributed session and token revocation enforcement.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_PRIVILEGE_EXPIRED]: {
    code: AUTHORIZATION_DECISIONS.DENIED_PRIVILEGE_EXPIRED,
    classification: DECISION_CLASSIFICATION.LEGACY,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Legacy decision code for expired clinical privilege.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_WRONG_UNIT]: {
    code: AUTHORIZATION_DECISIONS.DENIED_WRONG_UNIT,
    classification: DECISION_CLASSIFICATION.LEGACY,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Legacy decision code for clinician not rostered in unit.'
  },
  [AUTHORIZATION_DECISIONS.DENIED_NOT_ON_DUTY]: {
    code: AUTHORIZATION_DECISIONS.DENIED_NOT_ON_DUTY,
    classification: DECISION_CLASSIFICATION.LEGACY,
    isPersistable: true,
    auditDestinations: [AUDIT_DESTINATION.CLINICAL_LOGS],
    description: 'Legacy decision code for clinician not on active shift or on-call roster.'
  }
});

/**
 * Returns an array of all decision codes marked as persistable to PostgreSQL clinical_authorization_logs.
 * @returns {string[]}
 */
export function getPersistableDecisions() {
  return Object.values(DECISION_METADATA)
    .filter(meta => meta.isPersistable)
    .map(meta => meta.code)
    .sort();
}

/**
 * Checks whether a given decision string is marked as persistable in the canonical contract.
 * @param {string} decision
 * @returns {boolean}
 */
export function isDecisionPersistable(decision) {
  if (!decision || typeof decision !== 'string') return false;
  const meta = DECISION_METADATA[decision];
  return Boolean(meta && meta.isPersistable);
}

/**
 * Retrieves metadata for a decision code.
 * @param {string} decision
 * @returns {Object|null}
 */
export function getDecisionMetadata(decision) {
  if (!decision || typeof decision !== 'string') return null;
  return DECISION_METADATA[decision] || null;
}

/**
 * Checks whether a given decision string is valid within the canonical taxonomy.
 * @param {string} decision
 * @returns {boolean}
 */
export function isValidDecision(decision) {
  if (!decision || typeof decision !== 'string') return false;
  return Boolean(DECISION_METADATA[decision]);
}
