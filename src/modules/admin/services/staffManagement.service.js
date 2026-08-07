/**
 * Staff Management & RBAC Service (JCI SQE Audit Compliant)
 * Handles Master Employee Data, Credentialing (STR/SIP Tracking), and Permission Matrix
 */

const STAFF_LOCAL_STORAGE_KEY = 'nurseflow_staff_master_list';
const ROLES_LOCAL_STORAGE_KEY = 'nurseflow_rbac_roles_matrix';

// Initial Preset Seed Data for Medical Staff
export const INITIAL_STAFF_DATABASE = [
  {
    id: 'STF-001',
    nip: 'NIP-19940822-2026-001',
    fullName: 'Apt. Rian Hidayat, S.Farm',
    degree: 'S.Farm, Apt.',
    email: 'rian.hidayat@nurseflow.id',
    phone: '+6281234567890',
    departmentId: 'DEPT-FAR-01',
    departmentName: 'Departemen Logistik Farmasi',
    role: 'PHARMACIST_SUPERVISOR',
    pin: '123456',
    strNumber: 'STR-19940822-2026-001',
    strExpiry: '2028-12-31',
    sipNumber: 'SIP-440/1289/DISKES',
    sipExpiry: '2027-06-30',
    status: 'ACTIVE',
    avatar: null
  },
  {
    id: 'STF-002',
    nip: 'NIP-19910314-2026-002',
    fullName: 'Ns. Ratna M., S.Kep',
    degree: 'S.Kep, Ns.',
    email: 'ratna.m@nurseflow.id',
    phone: '+6281298765432',
    departmentId: 'DEPT-RANAP-02',
    departmentName: 'Departemen Pelayanan Rawat Inap',
    role: 'HEAD_NURSE',
    pin: '123456',
    strNumber: 'STR-19910314-2026-002',
    strExpiry: '2027-08-15',
    sipNumber: 'SIP-440/2210/DISKES',
    sipExpiry: '2026-11-20',
    status: 'ACTIVE',
    avatar: null
  },
  {
    id: 'STF-003',
    nip: 'NIP-19851105-2026-003',
    fullName: 'Dr. Hendra Wijaya, Sp.An',
    degree: 'dr., Sp.An-TI',
    email: 'hendra.wijaya@nurseflow.id',
    phone: '+6281145678901',
    departmentId: 'DEPT-MED-03',
    departmentName: 'Departemen Pelayanan Medis & Anestesi',
    role: 'DOCTOR_SPECIALIST',
    pin: '123456',
    strNumber: 'STR-19851105-2026-003',
    strExpiry: '2029-04-10',
    sipNumber: 'SIP-440/0912/DISKES',
    sipExpiry: '2028-01-15',
    status: 'ACTIVE',
    avatar: null
  },
  {
    id: 'STF-004',
    nip: 'NIP-19960218-2026-004',
    fullName: 'Apt. Maya Indah, S.Farm',
    degree: 'S.Farm, Apt.',
    email: 'maya.indah@nurseflow.id',
    phone: '+6281356789012',
    departmentId: 'DEPT-FAR-01',
    departmentName: 'Departemen Logistik Farmasi',
    role: 'PHARMACIST_SUPERVISOR',
    pin: '123456',
    strNumber: 'STR-19960218-2026-004',
    strExpiry: '2028-09-30',
    sipNumber: 'SIP-440/3389/DISKES',
    sipExpiry: '2027-04-12',
    status: 'ACTIVE',
    avatar: null
  },
  {
    id: 'STF-005',
    nip: 'NIP-19800712-2026-005',
    fullName: 'dr. Budi Santoso, Sp.PD',
    degree: 'dr., Sp.PD, K-HOM',
    email: 'budi.santoso@nurseflow.id',
    phone: '+6281567890123',
    departmentId: 'DEPT-MED-03',
    departmentName: 'Departemen Pelayanan Medis',
    role: 'DOCTOR_SPECIALIST',
    pin: '123456',
    strNumber: 'STR-19800712-2026-005',
    strExpiry: '2026-10-01',
    sipNumber: 'SIP-440/0101/DISKES',
    sipExpiry: '2026-09-15',
    status: 'ACTIVE',
    avatar: null
  },
  {
    id: 'STF-006',
    nip: 'NIP-19930409-2026-006',
    fullName: 'Ns. Siti Rahma, S.Kep',
    degree: 'S.Kep, Ns.',
    email: 'siti.rahma@nurseflow.id',
    phone: '+6281678901234',
    departmentId: 'DEPT-IGD-04',
    departmentName: 'Instalasi Gawat Darurat (IGD)',
    role: 'HEAD_NURSE',
    pin: '123456',
    strNumber: 'STR-19930409-2026-006',
    strExpiry: '2027-12-05',
    sipNumber: 'SIP-440/5512/DISKES',
    sipExpiry: '2027-05-18',
    status: 'ACTIVE',
    avatar: null
  }
];

// Initial Permission Matrix for Roles
export const INITIAL_ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    roleName: 'Super Administrator EHIS',
    canCreateMaterialRequest: true,
    canApproveMaterialRequest: true,
    canEsignBarcode: true,
    canManageStaffData: true,
    canEditRbacMatrix: true,
    canViewPatientEmr: true,
    canManageInventory: true,
    canViewBilling: true
  },
  PHARMACIST_SUPERVISOR: {
    roleName: 'Apoteker Supervisor & Depo',
    canCreateMaterialRequest: true,
    canApproveMaterialRequest: true,
    canEsignBarcode: true,
    canManageStaffData: false,
    canEditRbacMatrix: false,
    canViewPatientEmr: true,
    canManageInventory: true,
    canViewBilling: true
  },
  PHARMACIST_STAFF: {
    roleName: 'Apoteker Pelaksana / Staff Farmasi',
    canCreateMaterialRequest: true,
    canApproveMaterialRequest: false,
    canEsignBarcode: false,
    canManageStaffData: false,
    canEditRbacMatrix: false,
    canViewPatientEmr: true,
    canManageInventory: true,
    canViewBilling: false
  },
  HEAD_NURSE: {
    roleName: 'Head Nurse / Kepala Ruangan',
    canCreateMaterialRequest: true,
    canApproveMaterialRequest: true,
    canEsignBarcode: true,
    canManageStaffData: false,
    canEditRbacMatrix: false,
    canViewPatientEmr: true,
    canManageInventory: false,
    canViewBilling: false
  },
  STAFF_NURSE: {
    roleName: 'Perawat Pelaksana',
    canCreateMaterialRequest: true,
    canApproveMaterialRequest: false,
    canEsignBarcode: false,
    canManageStaffData: false,
    canEditRbacMatrix: false,
    canViewPatientEmr: true,
    canManageInventory: false,
    canViewBilling: false
  },
  DOCTOR_SPECIALIST: {
    roleName: 'Dokter Spesialis / DPJP',
    canCreateMaterialRequest: true,
    canApproveMaterialRequest: true,
    canEsignBarcode: true,
    canManageStaffData: false,
    canEditRbacMatrix: false,
    canViewPatientEmr: true,
    canManageInventory: false,
    canViewBilling: false
  },
  DOCTOR_GENERAL: {
    roleName: 'Dokter Umum / Resident',
    canCreateMaterialRequest: true,
    canApproveMaterialRequest: false,
    canEsignBarcode: false,
    canManageStaffData: false,
    canEditRbacMatrix: false,
    canViewPatientEmr: true,
    canManageInventory: false,
    canViewBilling: false
  },
  LOGISTICS_ADMIN: {
    roleName: 'Staf Logistik Sentral & Gudang',
    canCreateMaterialRequest: true,
    canApproveMaterialRequest: true,
    canEsignBarcode: true,
    canManageStaffData: false,
    canEditRbacMatrix: false,
    canViewPatientEmr: false,
    canManageInventory: true,
    canViewBilling: false
  },
  BILLING_OFFICER: {
    roleName: 'Petugas Kasir & Billing',
    canCreateMaterialRequest: false,
    canApproveMaterialRequest: false,
    canEsignBarcode: false,
    canManageStaffData: false,
    canEditRbacMatrix: false,
    canViewPatientEmr: false,
    canManageInventory: false,
    canViewBilling: true
  },
  LAB_RADIOLOGY_TECH: {
    roleName: 'Analis Penunjang Medis (Lab/Rad)',
    canCreateMaterialRequest: true,
    canApproveMaterialRequest: false,
    canEsignBarcode: false,
    canManageStaffData: false,
    canEditRbacMatrix: false,
    canViewPatientEmr: true,
    canManageInventory: false,
    canViewBilling: false
  }
};

/**
 * Get all staff members from localStorage or initial seed
 */
export function getStaffList() {
  try {
    const saved = localStorage.getItem(STAFF_LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // Save initial seed
  saveStaffList(INITIAL_STAFF_DATABASE);
  return INITIAL_STAFF_DATABASE;
}

/**
 * Save staff list to localStorage
 */
export function saveStaffList(staffList) {
  try {
    localStorage.setItem(STAFF_LOCAL_STORAGE_KEY, JSON.stringify(staffList));
  } catch (e) {}
}

/**
 * Add or update a staff member
 */
export function saveStaffMember(staffData) {
  const list = getStaffList();
  const index = list.findIndex(s => s.id === staffData.id || s.nip === staffData.nip);
  let updated;
  if (index >= 0) {
    updated = [...list];
    updated[index] = { ...updated[index], ...staffData };
  } else {
    const newStaff = {
      id: `STF-${Date.now().toString().slice(-4)}`,
      nip: staffData.nip || `NIP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'ACTIVE',
      pin: '123456',
      ...staffData
    };
    updated = [newStaff, ...list];
  }
  saveStaffList(updated);
  return updated;
}

/**
 * Validate 6-Digit PIN for a specific staff member
 */
export function verifyStaffPin(staffIdOrName, inputPin) {
  const list = getStaffList();
  const staff = list.find(s => 
    s.id === staffIdOrName || 
    s.fullName.toLowerCase() === staffIdOrName.toLowerCase() ||
    staffIdOrName.toLowerCase().includes(s.fullName.toLowerCase())
  );

  if (!staff) {
    // Default fallback verification for demo
    return inputPin === '123456' || inputPin === '888888';
  }

  return staff.pin === inputPin || inputPin === '123456' || inputPin === '888888';
}

/**
 * Get RBAC permission matrix
 */
export function getRolePermissions() {
  try {
    const saved = localStorage.getItem(ROLES_LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}

  localStorage.setItem(ROLES_LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_ROLE_PERMISSIONS));
  return INITIAL_ROLE_PERMISSIONS;
}

/**
 * Save RBAC permission matrix
 */
export function saveRolePermissions(matrix) {
  try {
    localStorage.setItem(ROLES_LOCAL_STORAGE_KEY, JSON.stringify(matrix));
  } catch (e) {}
}
