/**
 * NurseFlow Enterprise HIS 2026 — Master Database Seeder
 * Seeds Standard Clinical Master Data: Staff, ICD-10, LOINC, Pharmacy & Tariffs.
 */

import { ENTERPRISE_ROLES } from '../../src/shared/constants/roles.js';

export const MASTER_DATABASE_SEED = {
  users: [
    {
      id: 'USR-ADMIN-001',
      employeeId: 'EMP-0001',
      username: 'superadmin',
      fullName: 'Chief Medical & Information Officer (CMIO)',
      role: ENTERPRISE_ROLES.ROLE_SUPER_ADMIN,
      departmentId: 'DEPT-DIR'
    },
    {
      id: 'USR-DOC-001',
      employeeId: 'EMP-0010',
      username: 'dr.siti',
      fullName: 'dr. Siti Wijaya, Sp.PD-KGEH',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP,
      departmentId: 'POLI-PD',
      sipNumber: 'SIP/503/001/IDI/2024'
    },
    {
      id: 'USR-DOC-002',
      employeeId: 'EMP-0011',
      username: 'dr.budi',
      fullName: 'dr. Budi Santoso, Sp.EM',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_EMERGENCY,
      departmentId: 'IGD',
      sipNumber: 'SIP/503/002/IDI/2024'
    },
    {
      id: 'USR-NUR-001',
      employeeId: 'EMP-0020',
      username: 'nurse.indah',
      fullName: 'Ns. Indah Permata, S.Kep',
      role: ENTERPRISE_ROLES.ROLE_NURSE,
      departmentId: 'IGD'
    },
    {
      id: 'USR-PHARM-001',
      employeeId: 'EMP-0030',
      username: 'apt.dimas',
      fullName: 'apt. Dimas Anggara, S.Farm',
      role: ENTERPRISE_ROLES.ROLE_PHARMACIST,
      departmentId: 'IFRS'
    },
    {
      id: 'USR-CASH-001',
      employeeId: 'EMP-0040',
      username: 'kasir.maya',
      fullName: 'Maya Ananda, S.Ak',
      role: ENTERPRISE_ROLES.ROLE_CASHIER,
      departmentId: 'FINANCE'
    }
  ],

  icd10: [
    { code: 'I10', name: 'Essential (primary) hypertension' },
    { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications' },
    { code: 'I21.9', name: 'Acute myocardial infarction, unspecified (STEMI/NSTEMI)' },
    { code: 'I63.9', name: 'Cerebral infarction, unspecified (Acute Ischemic Stroke)' },
    { code: 'A41.9', name: 'Sepsis, unspecified organism' },
    { code: 'K35.8', name: 'Other and unspecified acute appendicitis' }
  ],

  loinc: [
    { loinc: '718-7', name: 'Hemoglobin [Mass/volume] in Blood', refRange: '13.0 - 17.5 g/dL' },
    { loinc: '777-3', name: 'Platelets [#/volume] in Blood', refRange: '150,000 - 450,000 /uL' },
    { loinc: '6598-7', name: 'Troponin I.cardiac [Mass/volume] in Serum or Plasma', refRange: '< 0.04 ng/mL' },
    { loinc: '2160-0', name: 'Creatinine [Mass/volume] in Serum or Plasma', refRange: '0.6 - 1.2 mg/dL' }
  ],

  tariffs: [
    { code: 'TAR-KONSUL-SP', name: 'Konsultasi Dokter Spesialis', amount: 250000 },
    { code: 'TAR-ADM-RJ', name: 'Biaya Administrasi Rawat Jalan', amount: 50000 },
    { code: 'TAR-TRG-IGD', name: 'Pelayanan Triase & Gawat Darurat', amount: 350000 },
    { code: 'TAR-LAB-DL', name: 'Darah Lengkap Otomatis (CBC)', amount: 125000 },
    { code: 'TAR-RAD-THORAX', name: 'Rontgen Thorax PA Digital', amount: 180000 }
  ]
};
