/**
 * NurseFlow Core Constants
 * Single source of truth — jangan hardcode string collection di mana pun!
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FIRESTORE COLLECTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const COLLECTIONS = {
  PATIENTS:        'patients',
  ENCOUNTERS:      'encounters',
  TRIAGE_LOGS:     'triage_logs',
  MEDICAL_RECORDS: 'medical_records',
  AUDIT_LOGS:      'audit_logs',
  USERS:           'users',
  WARD_METRICS:    'ward_metrics',
  ALERTS:          'alerts',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USER ROLES (RBAC)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const ROLES = {
  DOCTOR:      'DOCTOR',
  NURSE:       'NURSE',
  ADMIN:       'ADMIN',
  PHARMACIST:  'PHARMACIST',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE PATHS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const ROUTES = {
  LOGIN:     '/login',
  DASHBOARD: '/dashboard',
  PATIENTS:  '/patients',
  TRIAGE:    '/triage',
  EMR:       '/emr',
  ADMIN:     '/admin',
  PHARMACY:  '/pharmacy',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROLE → ALLOWED ROUTES MAPPING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const ROLE_PERMISSIONS = {
  [ROLES.DOCTOR]:     [ROUTES.DASHBOARD, ROUTES.PATIENTS, ROUTES.EMR, ROUTES.TRIAGE],
  [ROLES.NURSE]:      [ROUTES.DASHBOARD, ROUTES.TRIAGE, ROUTES.PATIENTS],
  [ROLES.ADMIN]:      [ROUTES.DASHBOARD, ROUTES.PATIENTS, ROUTES.TRIAGE, ROUTES.EMR, ROUTES.ADMIN],
  [ROLES.PHARMACIST]: [ROUTES.DASHBOARD, ROUTES.PHARMACY],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRIAGE LEVELS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const TRIAGE_LEVELS = {
  RED:    'red',    // NEWS2 >= 7 → Emergency
  ORANGE: 'orange', // NEWS2 5-6 → Urgent
  YELLOW: 'yellow', // NEWS2 1-4 → Ward
  GREEN:  'green',  // NEWS2 0   → Routine
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUDIT ACTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW:   'VIEW',
  LOGIN:  'LOGIN',
  LOGOUT: 'LOGOUT',
};
