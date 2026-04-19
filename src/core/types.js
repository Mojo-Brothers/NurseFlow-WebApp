/**
 * @fileoverview NurseFlow Core Types (JSDoc)
 * Type definitions tanpa TypeScript — tetap memberikan intellisense & safety.
 */

/**
 * @typedef {'DOCTOR' | 'NURSE' | 'ADMIN' | 'PHARMACIST'} UserRole
 */

/**
 * @typedef {Object} NurseFlowUser
 * @property {string} uid
 * @property {string} email
 * @property {string} displayName
 * @property {UserRole} role
 * @property {string} [photoURL]
 */

/**
 * @typedef {Object} Patient
 * @property {string} id
 * @property {string} mrn              - Medical Record Number
 * @property {string} name
 * @property {string} nik              - Indonesian National ID
 * @property {{ dob: string, gender: 'M' | 'F' }} demographics
 * @property {string[]} allergies
 * @property {boolean} is_active
 * @property {import('firebase/firestore').Timestamp} registered_at
 * @property {Object} [baseline_profile]
 * @property {number} baseline_profile.value
 * @property {boolean} baseline_profile.chronic_flag
 * @property {import('firebase/firestore').Timestamp} baseline_profile.last_updated
 * @property {'MANUAL'|'COMPUTED'} baseline_profile.source
 */

/**
 * @typedef {Object} VitalSigns
 * @property {number} heartRate
 * @property {number} systolicBP
 * @property {number} diastolicBP
 * @property {number} spo2
 * @property {number} temperature
 * @property {number} [respiratoryRate]
 */

/**
 * @typedef {'green' | 'yellow' | 'orange' | 'red'} TriageLevel
 */

/**
 * @typedef {Object} TriageLog
 * @property {string} id
 * @property {string} patientId
 * @property {VitalSigns} vitals
 * @property {number} news2_score
 * @property {TriageLevel} triage_level
 * @property {string} escalation_level  - e.g., 'WATCH', 'URGENT', 'CRITICAL'
 * @property {string} escalation_source - e.g., 'SYSTEM', 'NURSE', 'DOCTOR'
 * @property {string} assessed_by       - staff email
 * @property {import('firebase/firestore').Timestamp} timestamp
 */

/**
 * @typedef {Object} SoapNote
 * @property {string} id
 * @property {string} patientId
 * @property {string} doctor            - doctor email
 * @property {'SOAP_NOTE'} type
 * @property {string} subjective
 * @property {string} objective
 * @property {string} assessment
 * @property {string[]} plan_medications
 * @property {string} plan_instructions
 * @property {boolean} is_locked
 * @property {import('firebase/firestore').Timestamp} created_at
 */

/**
 * @typedef {'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT'} AuditAction
 */

/**
 * @typedef {Object} AuditLog
 * @property {string} user             - staff email
 * @property {AuditAction} action
 * @property {string} resource_type    - collection name
 * @property {string} resource_id      - document ID
 * @property {Object} delta            - what changed
 * @property {import('firebase/firestore').Timestamp} timestamp
 */

export {};
