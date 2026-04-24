/**
 * NurseFlow — core/constants.js (V10 - Operational Chaos Resilience)
 */
export const COLLECTIONS = {
  PATIENTS:        'patients',
  ENCOUNTERS:      'encounters',
  TRIAGE_LOGS:     'triage_logs',
  MEDICAL_RECORDS: 'medical_records',
  AUDIT_LOGS:      'audit_logs',
  USERS:           'users',
  MEDICATIONS:     'medications',
  ALERTS:          'alerts',
  WARD_METRICS:    'ward_metrics',
  SYSTEM_METRICS:  'system_metrics',
  BILLING:         'billing',
  IDEMPOTENCY_LOCKS: 'idempotency_locks', // V10: Atomic locks
  BEDS:            'beds',           // V11: ADT Ward Map
  HANDOVER_LOGS:   'handover_logs',  // V11: SBAR Continuity
  SURGERY_SCHEDULE: 'surgery_schedule', // V28: ASC Planning
  SURGERY_LOGS:     'surgery_logs',     // V28: Intra-op Audit
  INCIDENTS:        'incidents',        // V32: Institutional Risk Management
  STAFF_CREDENTIALS: 'staff_credentials', // V33: SQE Certification Tracking
  INFO_GOVERNANCE:   'info_governance',   // V34: MOI Data Lifecycle
  INFORMED_CONSENTS: 'informed_consents', // V35: PFR Legal Documentation
  COMPLAINTS:        'patient_complaints', // V35: PFR Complaint Handling
};

export const ROLES = {
  DOCTOR:     'DOCTOR',
  NURSE:      'NURSE',
  ADMIN:      'ADMIN',
  PHARMACIST: 'PHARMACIST',
  SUPERVISOR: 'SUPERVISOR', // V10: Escalation target
};

export const ROUTES = {
  LOGIN:      '/login',
  DASHBOARD:  '/dashboard',
  PATIENTS:   '/patients',
  TRIAGE:     '/triage',
  EMR:        '/emr',
  ENCOUNTERS: '/encounters',
  ADMIN:      '/admin',
  PHARMACY:   '/pharmacy',
  GLD:        '/gld', // V32: Governance Dashboard
};

export const ROLE_PERMISSIONS = {
  [ROLES.DOCTOR]:     [ROUTES.DASHBOARD, ROUTES.PATIENTS, ROUTES.EMR, ROUTES.TRIAGE, ROUTES.ENCOUNTERS],
  [ROLES.NURSE]:      [ROUTES.DASHBOARD, ROUTES.TRIAGE, ROUTES.PATIENTS, ROUTES.ENCOUNTERS],
  [ROLES.ADMIN]:      Object.values(ROUTES).filter(r => r !== ROUTES.LOGIN),
  [ROLES.PHARMACIST]: [ROUTES.DASHBOARD, ROUTES.PHARMACY],
  [ROLES.SUPERVISOR]: Object.values(ROUTES).filter(r => r !== ROUTES.LOGIN),
};

export const TRIAGE_LEVELS = {
  RED:    'red',
  ORANGE: 'orange',
  YELLOW: 'yellow',
  GREEN:  'green',
};

export const ENCOUNTER_STATUSES = {
  WAITING:           'WAITING',
  TRIAGE:            'TRIAGE',
  IN_TREATMENT:      'IN_TREATMENT',
  TRANSFER_INTERNAL: 'TRANSFER_INTERNAL',
  CANCELLED:         'CANCELLED',
  NO_SHOW:           'NO_SHOW',
  DONE:              'DONE',       // V10: Clinical finished
  PAID:              'PAID',       // V10: Financial finished
  DISCHARGED:        'DISCHARGED', // V10: Process complete
};

export const ALERT_STATUSES = {
  ACTIVE:       'ACTIVE',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESOLVED:     'RESOLVED',
};

export const ALERT_SEVERITY = {
  LOW:      'LOW',
  NORMAL:   'NORMAL',
  HIGH:     'HIGH',
  CRITICAL: 'CRITICAL',
};

export const SYSTEM_MODES = {
  OPTIMAL:  'OPTIMAL',
  DEGRADED: 'DEGRADED', // Slow, manual checks
  FAILOVER: 'FAILOVER', // Offline only
};

export const SYSTEM_HEALTH_THRESHOLDS = {
  LATENCY_MAX:  1000, // ms
  SYNC_LAG_MAX: 60,   // seconds
};

export const SLA_TARGETS = {
  WAITING: 900, // 15 mins
  TRIAGE:  300, // 5 mins
};

// V10: Fields that are safe to auto-merge in sync conflicts
export const MERGE_WHITELIST = [
  'address', 'phone', 'notes_non_clinical', 'updated_at', 'v'
];

export const DEGRADED_POLICY = {
  DISABLE_NEW_REG:  true,
  LIMIT_WRITE_OPS:  true,
  READ_ONLY_REPORTS: true,
};

export const ESCALATION_ROLES = [ROLES.NURSE, ROLES.DOCTOR, ROLES.SUPERVISOR];

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW:   'VIEW',
  LOGIN:  'LOGIN',
  LOGOUT: 'LOGOUT',
  MEDICAL_ACTION: 'MEDICAL_ACTION',
  ALERT_ACK: 'ALERT_ACK',
  CONFLICT_RESOLVE: 'CONFLICT_RESOLVE',
  CREDENTIAL_VERIFY: 'CREDENTIAL_VERIFY', // V33: Staff Competency Check
  TERMINOLOGY_AUDIT: 'TERMINOLOGY_AUDIT', // V34: MOI Compliance Check
  CONSENT_SIGNED: 'CONSENT_SIGNED', // V35: PFR Legal Action
  PRIVACY_UPDATE: 'PRIVACY_UPDATE', // V35: PFR Policy Change
};

export const ENCOUNTER_TYPES = {
  EMERGENCY:  'EMERGENCY',
  OUTPATIENT: 'OUTPATIENT',
  INPATIENT:  'INPATIENT',
  PLANNED:    'PLANNED',
};

export const SYNC_PRIORITIES = {
  CRITICAL: 1, // High Frequency, Immediate Sync
  HIGH:     2, // Operational State Transitions
  NORMAL:   3, // Administrative/Demographic data
};

export const QUEUE_STATUS = {
  PENDING: 'PENDING',
  FAILED:  'FAILED',
  DLQ:     'DEAD_LETTER_QUEUE',
};

export const ESCALATION_LEVELS = {
  NONE:     'NONE',
  WATCH:    'WATCH',
  URGENT:   'URGENT',
  CRITICAL: 'CRITICAL',
};

export const ESCALATION_SOURCES = {
  SYSTEM:   'SYSTEM',
  NURSE:    'NURSE',
  DOCTOR:   'DOCTOR',
};

export const VITAL_BOUNDS = {
  heartRate:   { min: 20,  max: 300, unit: 'bpm'  },
  systolicBP:  { min: 50,  max: 300, unit: 'mmHg' },
  diastolicBP: { min: 20,  max: 200, unit: 'mmHg' },
  spo2:        { min: 50,  max: 100, unit: '%'     },
  temperature: { min: 30,  max: 45,  unit: '°C'   },
  respRate:    { min: 5,   max: 60,  unit: '/min'  },
};

export const SYSTEM_VERSION   = '10.0.0'; // Grand Finale V10
export const SCHEMA_VERSION   = 10;
