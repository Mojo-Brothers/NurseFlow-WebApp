/**
 * NurseFlow — core/constants.js (updated dengan ENCOUNTERS)
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
};

export const ROLES = {
  DOCTOR:     'DOCTOR',
  NURSE:      'NURSE',
  ADMIN:      'ADMIN',
  PHARMACIST: 'PHARMACIST',
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
};

export const ROLE_PERMISSIONS = {
  [ROLES.DOCTOR]:     [ROUTES.DASHBOARD, ROUTES.PATIENTS, ROUTES.EMR, ROUTES.TRIAGE, ROUTES.ENCOUNTERS],
  [ROLES.NURSE]:      [ROUTES.DASHBOARD, ROUTES.TRIAGE, ROUTES.PATIENTS, ROUTES.ENCOUNTERS],
  [ROLES.ADMIN]:      Object.values(ROUTES).filter(r => r !== ROUTES.LOGIN),
  [ROLES.PHARMACIST]: [ROUTES.DASHBOARD, ROUTES.PHARMACY],
};

export const TRIAGE_LEVELS = {
  RED:    'red',
  ORANGE: 'orange',
  YELLOW: 'yellow',
  GREEN:  'green',
};

export const ENCOUNTER_TYPES = {
  EMERGENCY:  'EMERGENCY',
  OUTPATIENT: 'OUTPATIENT',
  INPATIENT:  'INPATIENT',
  PLANNED:    'PLANNED',
};

export const ENCOUNTER_STATUSES = {
  WAITING:           'WAITING',
  TRIAGE:            'TRIAGE',
  IN_TREATMENT:      'IN_TREATMENT',
  TRANSFER_INTERNAL: 'TRANSFER_INTERNAL',
  CANCELLED:         'CANCELLED',
  NO_SHOW:           'NO_SHOW',
  DISCHARGED:        'DISCHARGED',
};

export const ESCALATION_LEVELS = {
  NONE:      'NONE',
  WATCH:     'WATCH',
  URGENT:    'URGENT',
  CRITICAL:  'CRITICAL',
};

export const SYNC_PRIORITIES = {
  CRITICAL: 1, // High Frequency, Immediate Sync
  HIGH:     2, // Operational State Transitions
  NORMAL:   3, // Administrative/Demographic data
};

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW:   'VIEW',
  LOGIN:  'LOGIN',
  LOGOUT: 'LOGOUT',
};

// Batas fisiologis untuk validasi vital signs (Step 9)
export const VITAL_BOUNDS = {
  heartRate:   { min: 20,  max: 300, unit: 'bpm'  },
  systolicBP:  { min: 50,  max: 300, unit: 'mmHg' },
  diastolicBP: { min: 20,  max: 200, unit: 'mmHg' },
  spo2:        { min: 50,  max: 100, unit: '%'     },
  temperature: { min: 30,  max: 45,  unit: '°C'   },
  respRate:    { min: 5,   max: 60,  unit: '/min'  },
};
