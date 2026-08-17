/**
 * NurseFlow Enterprise HIS 2026 — Role-Based Access Control (RBAC) Guard
 * Standar: JCI MOI / ISO 27001 Security Access Control Matrix
 */

export const ENTERPRISE_ROLES = {
  ROLE_SUPER_ADMIN: {
    id: 'ROLE_SUPER_ADMIN',
    name: 'Super Administrator / CIO',
    permissions: ['*']
  },
  ROLE_DOCTOR: {
    id: 'ROLE_DOCTOR',
    name: 'Dokter Spesialis / DPJP',
    permissions: [
      'EMR_READ', 'EMR_WRITE_SOAP', 'CPPT_WRITE', 'CPPT_VERIFY',
      'ORDER_CREATE_PHARMACY', 'ORDER_CREATE_LAB', 'ORDER_CREATE_RAD',
      'TRIAGE_READ', 'TRIAGE_WRITE', 'RESUSCITATION_WRITE'
    ]
  },
  ROLE_NURSE: {
    id: 'ROLE_NURSE',
    name: 'Perawat Klinis (Nurse)',
    permissions: [
      'EMR_READ', 'CPPT_WRITE', 'OBSERVATION_WRITE',
      'TRIAGE_READ', 'TRIAGE_WRITE', 'RESUSCITATION_WRITE',
      'MEDICATION_ADMINISTER'
    ]
  },
  ROLE_PHARMACIST: {
    id: 'ROLE_PHARMACIST',
    name: 'Apoteker Klinis (Pharmacist)',
    permissions: [
      'EMR_READ', 'CPPT_WRITE', 'PHARMACY_REVIEW', 'PHARMACY_DISPENSE',
      'MEDICATION_MASTER_WRITE', 'ANTIBIOTIC_STEWARDSHIP_MANAGE'
    ]
  },
  ROLE_LAB_ANALYST: {
    id: 'ROLE_LAB_ANALYST',
    name: 'Analis Laboratorium (LIS)',
    permissions: [
      'EMR_READ_ORDERS', 'LAB_SPECIMEN_RECEIVE', 'LAB_ANALYZER_RUN', 'LAB_RESULT_VALIDATE'
    ]
  },
  ROLE_RADIOGRAPHER: {
    id: 'ROLE_RADIOGRAPHER',
    name: 'Radiografer & Radiolog (PACS)',
    permissions: [
      'EMR_READ_ORDERS', 'RAD_IMAGE_ACQUIRE', 'RAD_REPORT_WRITE', 'RAD_REPORT_VERIFY'
    ]
  },
  ROLE_CASHIER: {
    id: 'ROLE_CASHIER',
    name: 'Kasir & Keuangan Rumah Sakit',
    permissions: [
      'BILLING_READ', 'INVOICE_CREATE', 'PAYMENT_PROCESS', 'INACBG_CLAIM_MANAGE'
    ]
  },
  ROLE_REGISTRATION_CLERK: {
    id: 'ROLE_REGISTRATION_CLERK',
    name: 'Petugas Pendaftaran & Admisi (Front Office)',
    permissions: [
      'PATIENT_REGISTER', 'QUEUE_MANAGE', 'BPJS_SEP_GENERATE', 'CONSENT_RECORD'
    ]
  }
};

export const rbacGuardService = {
  /**
   * Check whether a role has permission
   */
  hasPermission: (userRole, requiredPermission) => {
    const roleDef = ENTERPRISE_ROLES[userRole] || ENTERPRISE_ROLES.ROLE_SUPER_ADMIN;
    if (roleDef.permissions.includes('*')) return true;
    return roleDef.permissions.includes(requiredPermission);
  },

  getAllRoles: () => Object.values(ENTERPRISE_ROLES)
};
