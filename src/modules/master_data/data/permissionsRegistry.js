/**
 * NurseFlow Enterprise HIS — RBAC Roles & Permissions Registry
 * Standardized across JCI, KARS, and Hospital Operational Units
 */

export const DEFAULT_ROLES = [
  {
    id: 'ROLE-SUPER-ADMIN',
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Akses penuh ke seluruh konfigurasi sistem, database, audit trail, dan otorisasi keamanan.',
    department: 'IT / Digital Health',
    level: 1,
    isSystem: true,
    status: 'ACTIVE'
  },
  {
    id: 'ROLE-DIRECTOR',
    code: 'DIRECTOR',
    name: 'Direktur / Manajemen Eksekutif',
    description: 'Akses supervisi eksekutif, laporan strategis, analitik rumah sakit, dan audit kepatuhan.',
    department: 'Direksi',
    level: 2,
    isSystem: true,
    status: 'ACTIVE'
  },
  {
    id: 'ROLE-DOCTOR',
    code: 'DOCTOR',
    name: 'Dokter / DPJP (Dokter Penanggung Jawab Pelayanan)',
    description: 'Akses EMR, input SOAP, order resep, order lab/radiologi, jadwal praktik, dan verifikasi diagnosa.',
    department: 'Pelayanan Medik',
    level: 3,
    isSystem: false,
    status: 'ACTIVE'
  },
  {
    id: 'ROLE-NURSE',
    code: 'NURSE',
    name: 'Perawat / Head Nurse',
    description: 'Akses asuhan keperawatan, triase gawat darurat, tanda vital, pemberian obat eMAR, dan manajemen bed.',
    department: 'Keperawatan',
    level: 3,
    isSystem: false,
    status: 'ACTIVE'
  },
  {
    id: 'ROLE-PHARMACIST',
    code: 'PHARMACIST',
    name: 'Apoteker / Farmasis',
    description: 'Akses dispensing obat, verifikasi resep, rekonsiliasi obat, kontrol narkotika/psikotropika, dan stok obat.',
    department: 'Farmasi',
    level: 3,
    isSystem: false,
    status: 'ACTIVE'
  },
  {
    id: 'ROLE-CASHIER',
    code: 'CASHIER',
    name: 'Kasir / Petugas Billing',
    description: 'Akses pembuatan tagihan, penerimaan pembayaran kas/kartu/QRIS, klaim penjamin, dan rincian biaya.',
    department: 'Keuangan & Kasir',
    level: 4,
    isSystem: false,
    status: 'ACTIVE'
  },
  {
    id: 'ROLE-REGISTRATION',
    code: 'REGISTRATION',
    name: 'Petugas Pendaftaran / Admisi',
    description: 'Akses registrasi pasien baru/lama, verifikasi NIK/BPJS, pembuatan jadwal antrean, dan admisi IGD/RI/RJ.',
    department: 'Admission & Front Office',
    level: 4,
    isSystem: false,
    status: 'ACTIVE'
  },
  {
    id: 'ROLE-MEDICAL-RECORDS',
    code: 'MEDICAL_RECORDS',
    name: 'Perekam Medis (RME Coder)',
    description: 'Akses coding ICD-10 & ICD-9-CM, assembling berkas rekam medis, audit RME, dan klaim INA-CBGs.',
    department: 'Rekam Medis',
    level: 3,
    isSystem: false,
    status: 'ACTIVE'
  },
  {
    id: 'ROLE-LABORATORY',
    code: 'LABORATORY',
    name: 'Petugas Laboratorium / Analis',
    description: 'Akses input hasil pemeriksaan patologi/klinis, validasi nilai kritis, dan manajemen reagen lab.',
    department: 'Laboratorium',
    level: 3,
    isSystem: false,
    status: 'ACTIVE'
  },
  {
    id: 'ROLE-RADIOLOGY',
    code: 'RADIOLOGY',
    name: 'Radiografer & Dokter Spesialis Radiologi',
    description: 'Akses unggah eksaminasi DICOM/PACS, interpretasi hasil foto X-Ray/CT/MRI/USG, dan tarif modalitas.',
    department: 'Radiologi & Imaging',
    level: 3,
    isSystem: false,
    status: 'ACTIVE'
  },
  {
    id: 'ROLE-FINANCE',
    code: 'FINANCE',
    name: 'Keuangan & Akuntansi RS',
    description: 'Akses tarif rumah sakit, integrasi penjamin/asuransi, laporan pendapatan, dan budgeting departemen.',
    department: 'Keuangan',
    level: 3,
    isSystem: false,
    status: 'ACTIVE'
  },
  {
    id: 'ROLE-HRD',
    code: 'HRD',
    name: 'SDM & Kredensial (HRD)',
    description: 'Akses master pegawai, dokter, perawat, validitas SIP/STR, jenjang klinis (PK), dan penugasan unit.',
    department: 'Sumber Daya Manusia',
    level: 3,
    isSystem: false,
    status: 'ACTIVE'
  }
];

export const PERMISSION_MODULES = [
  { id: 'MASTER_PATIENT', name: 'Master Pasien' },
  { id: 'MASTER_DOCTOR', name: 'Master Dokter' },
  { id: 'MASTER_NURSE', name: 'Master Perawat' },
  { id: 'MASTER_EMPLOYEE', name: 'Master Pegawai' },
  { id: 'MASTER_CLINIC', name: 'Master Poli' },
  { id: 'MASTER_ROOM', name: 'Master Ruangan' },
  { id: 'MASTER_BED', name: 'Master Tempat Tidur' },
  { id: 'MASTER_DIAGNOSIS', name: 'Master ICD-10' },
  { id: 'MASTER_PROCEDURE', name: 'Master ICD-9-CM' },
  { id: 'MASTER_MEDICINE', name: 'Master Obat' },
  { id: 'MASTER_DEVICE', name: 'Master Alkes' },
  { id: 'MASTER_LAB', name: 'Master Lab' },
  { id: 'MASTER_RADIOLOGY', name: 'Master Radiologi' },
  { id: 'MASTER_TARIFF', name: 'Master Tarif' },
  { id: 'MASTER_GUARANTOR', name: 'Master Penjamin' },
  { id: 'MASTER_INSURANCE', name: 'Master Asuransi' },
  { id: 'MASTER_SCHEDULE', name: 'Master Jadwal' },
  { id: 'MASTER_RBAC', name: 'Master Hak Akses' },
  { id: 'AUDIT_LOGS', name: 'Audit Trail' }
];

export const PERMISSION_ACTIONS = [
  { code: 'READ', label: 'Lihat Data (Read)' },
  { code: 'CREATE', label: 'Tambah Data (Create)' },
  { code: 'UPDATE', label: 'Ubah Data (Update)' },
  { code: 'DELETE', label: 'Hapus Lunak (Soft Delete)' },
  { code: 'RESTORE', label: 'Pulihkan Data (Restore)' },
  { code: 'EXPORT', label: 'Ekspor Excel / PDF' },
  { code: 'IMPORT', label: 'Impor Data Excel' }
];

// Generate standard permission list
export const ALL_PERMISSIONS = PERMISSION_MODULES.flatMap(mod => 
  PERMISSION_ACTIONS.map(act => ({
    id: `PERM_${mod.id}_${act.code}`,
    code: `${mod.id}:${act.code}`,
    module: mod.id,
    moduleName: mod.name,
    action: act.code,
    name: `${act.label} - ${mod.name}`
  }))
);

// Map default permissions to standard roles
export const DEFAULT_ROLE_PERMISSIONS = {
  'SUPER_ADMIN': ALL_PERMISSIONS.map(p => p.code),
  'DIRECTOR': ALL_PERMISSIONS.filter(p => p.action === 'READ' || p.action === 'EXPORT').map(p => p.code),
  'DOCTOR': [
    'MASTER_PATIENT:READ', 'MASTER_PATIENT:CREATE', 'MASTER_PATIENT:UPDATE',
    'MASTER_DOCTOR:READ', 'MASTER_NURSE:READ', 'MASTER_CLINIC:READ',
    'MASTER_ROOM:READ', 'MASTER_BED:READ',
    'MASTER_DIAGNOSIS:READ', 'MASTER_PROCEDURE:READ',
    'MASTER_MEDICINE:READ', 'MASTER_DEVICE:READ',
    'MASTER_LAB:READ', 'MASTER_RADIOLOGY:READ',
    'MASTER_TARIFF:READ', 'MASTER_GUARANTOR:READ',
    'MASTER_SCHEDULE:READ', 'MASTER_SCHEDULE:UPDATE'
  ],
  'NURSE': [
    'MASTER_PATIENT:READ', 'MASTER_PATIENT:CREATE', 'MASTER_PATIENT:UPDATE',
    'MASTER_DOCTOR:READ', 'MASTER_NURSE:READ', 'MASTER_CLINIC:READ',
    'MASTER_ROOM:READ', 'MASTER_BED:READ', 'MASTER_BED:UPDATE',
    'MASTER_DIAGNOSIS:READ', 'MASTER_PROCEDURE:READ',
    'MASTER_MEDICINE:READ', 'MASTER_DEVICE:READ',
    'MASTER_LAB:READ', 'MASTER_RADIOLOGY:READ',
    'MASTER_SCHEDULE:READ'
  ],
  'PHARMACIST': [
    'MASTER_PATIENT:READ', 'MASTER_MEDICINE:READ', 'MASTER_MEDICINE:CREATE', 'MASTER_MEDICINE:UPDATE',
    'MASTER_MEDICINE:EXPORT', 'MASTER_DEVICE:READ', 'MASTER_TARIFF:READ'
  ],
  'CASHIER': [
    'MASTER_PATIENT:READ', 'MASTER_TARIFF:READ', 'MASTER_GUARANTOR:READ', 'MASTER_INSURANCE:READ'
  ],
  'REGISTRATION': [
    'MASTER_PATIENT:READ', 'MASTER_PATIENT:CREATE', 'MASTER_PATIENT:UPDATE',
    'MASTER_DOCTOR:READ', 'MASTER_CLINIC:READ', 'MASTER_ROOM:READ',
    'MASTER_BED:READ', 'MASTER_GUARANTOR:READ', 'MASTER_INSURANCE:READ',
    'MASTER_SCHEDULE:READ'
  ],
  'MEDICAL_RECORDS': [
    'MASTER_PATIENT:READ', 'MASTER_DIAGNOSIS:READ', 'MASTER_DIAGNOSIS:CREATE', 'MASTER_DIAGNOSIS:UPDATE',
    'MASTER_PROCEDURE:READ', 'MASTER_PROCEDURE:CREATE', 'MASTER_PROCEDURE:UPDATE',
    'MASTER_DOCTOR:READ', 'MASTER_CLINIC:READ', 'AUDIT_LOGS:READ'
  ],
  'LABORATORY': [
    'MASTER_PATIENT:READ', 'MASTER_LAB:READ', 'MASTER_LAB:CREATE', 'MASTER_LAB:UPDATE', 'MASTER_TARIFF:READ'
  ],
  'RADIOLOGY': [
    'MASTER_PATIENT:READ', 'MASTER_RADIOLOGY:READ', 'MASTER_RADIOLOGY:CREATE', 'MASTER_RADIOLOGY:UPDATE', 'MASTER_TARIFF:READ'
  ],
  'FINANCE': [
    'MASTER_TARIFF:READ', 'MASTER_TARIFF:CREATE', 'MASTER_TARIFF:UPDATE', 'MASTER_TARIFF:DELETE', 'MASTER_TARIFF:EXPORT',
    'MASTER_GUARANTOR:READ', 'MASTER_GUARANTOR:CREATE', 'MASTER_GUARANTOR:UPDATE',
    'MASTER_INSURANCE:READ', 'MASTER_INSURANCE:CREATE', 'MASTER_INSURANCE:UPDATE'
  ],
  'HRD': [
    'MASTER_EMPLOYEE:READ', 'MASTER_EMPLOYEE:CREATE', 'MASTER_EMPLOYEE:UPDATE', 'MASTER_EMPLOYEE:DELETE', 'MASTER_EMPLOYEE:RESTORE',
    'MASTER_DOCTOR:READ', 'MASTER_DOCTOR:CREATE', 'MASTER_DOCTOR:UPDATE',
    'MASTER_NURSE:READ', 'MASTER_NURSE:CREATE', 'MASTER_NURSE:UPDATE',
    'MASTER_SCHEDULE:READ', 'MASTER_SCHEDULE:CREATE', 'MASTER_SCHEDULE:UPDATE'
  ]
};

export const RBAC_MODULE_PERMISSIONS = [
  {
    moduleKey: 'PATIENT',
    moduleTitle: 'Master Pasien 360 & Identitas',
    icon: 'person',
    permissions: [
      { key: 'PATIENT:READ', label: 'Lihat Data Pasien & Identitas' },
      { key: 'PATIENT:WRITE', label: 'Tambah / Ubah Data Master Pasien' },
      { key: 'PATIENT:MRN_MERGE_EXECUTE', label: 'Otorisasi & Eksekusi Merge MRN Ganda (JCI)' },
      { key: 'PATIENT:DELETE', label: 'Hapus Lunak (Soft Delete) Pasien' }
    ]
  },
  {
    moduleKey: 'CLINICAL_EMR',
    moduleTitle: 'Pelayanan Klinis, EMR & Farmasi',
    icon: 'stethoscope',
    permissions: [
      { key: 'EMR:READ', label: 'Akses Berkas Rekam Medis Elektronik' },
      { key: 'EMR:WRITE', label: 'Input Catatan Medis DPJP (SOAP)' },
      { key: 'ORDER:WRITE', label: 'Order Resep, Lab & Radiologi' },
      { key: 'MEDICINE:HIGH_ALERT_OVERRIDE', label: 'Otorisasi Pemberian Obat High-Alert' },
      { key: 'PHARMACY:LASA_OVERRIDE', label: 'Override Peringatan LASA Farmasi' }
    ]
  },
  {
    moduleKey: 'NURSING_CARE',
    moduleTitle: 'Keperawatan, Triase & ADT Bed Management',
    icon: 'medical_services',
    permissions: [
      { key: 'TRIAGE:ASSIGN', label: 'Penetapan & Penugasan Level Triase (ATS/ESI)' },
      { key: 'NURSING_CARE:WRITE', label: 'Dokumentasi Asuhan Keperawatan' },
      { key: 'EMAR:WRITE', label: 'Pemberian Obat eMAR Terjadwal' },
      { key: 'BED:DISINFECT_RELEASE', label: 'Rilis Status Disinfeksi & Sterilisasi Bed' },
      { key: 'ADT:ADMIT', label: 'Otorisasi Admisi Rawat Inap' },
      { key: 'ADT:TRANSFER', label: 'Otorisasi Mutasi Bangsal / Bed' },
      { key: 'ADT:DISCHARGE', label: 'Otorisasi Pemulangan Pasien (Discharge)' }
    ]
  },
  {
    moduleKey: 'TARIFF_BILLING',
    moduleTitle: 'Tarif, Kasir & Penjamin',
    icon: 'payments',
    permissions: [
      { key: 'BILLING:READ', label: 'Lihat Rincian Tagihan Pasien' },
      { key: 'BILLING:WRITE', label: 'Kalkulasi & Verifikasi Billing' },
      { key: 'PAYMENT:WRITE', label: 'Penerimaan Kasir & Cetak Kuitansi' },
      { key: 'TARIFF:WRITE', label: 'Konfigurasi Master Tarif Multi-Komponen' }
    ]
  },
  {
    moduleKey: 'SECURITY_AUDIT',
    moduleTitle: 'Keamanan, Event Sourcing & Tata Kelola Data',
    icon: 'policy',
    permissions: [
      { key: 'AUDIT:READ', label: 'Akses Jejak Universal Audit Trail & Diff' },
      { key: 'USER:MANAGE', label: 'Manajemen Akun & Reset Password' },
      { key: 'RBAC:CONFIGURE', label: 'Konfigurasi Matriks Hak Akses' },
      { key: 'EVENT:READ', label: 'Akses Clinical Event Stream' },
      { key: 'EVENT:WRITE', label: 'Publikasi Manual Event Klinis' },
      { key: 'QUEUE:CALL', label: 'Panggil Nomor Antrean Pasien di Loket' },
      { key: 'QUEUE:MANAGE', label: 'Konfigurasi Loket & Kuota Antrean' },
      { key: 'RULE:MANAGE', label: 'Konfigurasi Business Rules Engine' },
      { key: 'NOTIFICATION:SEND', label: 'Broadcast Notifikasi Darurat & SLA' },
      { key: 'DATA_RETENTION:MANAGE', label: 'Pengarsipan & Retensi Data Medis' }
    ]
  }
];

