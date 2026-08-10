/**
 * NurseFlow Enterprise HIS — Core Master Registry Service
 * Single Source of Truth for Master Entities:
 * - Departments (104 Units)
 * - Staff & Practitioners (520 Members)
 * - Locations (Beds & Wards)
 * - Diagnosis (ICD-10 Master)
 * - Procedure (ICD-9-CM Master)
 * - Medication (Formulary Master)
 */

import { MASTER_DEPARTMENTS } from '../departments.js';
import { STAFF_REGISTRY } from '../staffRegistry.js';

// Indexing maps for O(1) high-performance lookup
const departmentMap = new Map();
MASTER_DEPARTMENTS.forEach(dept => departmentMap.set(dept.id, dept));

const staffMap = new Map();
STAFF_REGISTRY.forEach(staff => {
  staffMap.set(staff.id, staff);
  if (staff.employeeId) staffMap.set(staff.employeeId, staff);
});

// Master ICD-10 Sample Registry
export const ICD10_DIAGNOSES = [
  { code: 'I10', name: 'Essential (primary) hypertension', category: 'Kardiovaskular' },
  { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', category: 'Endokrin' },
  { code: 'J45.909', name: 'Unspecified asthma, uncomplicated', category: 'Respirasi' },
  { code: 'K35.80', name: 'Unspecified acute appendicitis', category: 'Digestif' },
  { code: 'A91', name: 'Dengue hemorrhagic fever', category: 'Infeksi' },
  { code: 'N39.0', name: 'Urinary tract infection, site not specified', category: 'Urologi' },
  { code: 'G44.2', name: 'Tension-type headache', category: 'Neurologi' },
  { code: 'M54.5', name: 'Low back pain', category: 'Muskuloskeletal' },
  { code: 'O80', name: 'Encounter for full-term uncomplicated delivery', category: 'Obstetri' },
  { code: 'H10.9', name: 'Unspecified conjunctivitis', category: 'Mata' }
];

// Master ICD-9-CM Sample Registry
export const ICD9_PROCEDURES = [
  { code: '47.09', name: 'Other appendectomy', category: 'Bedah Digestif' },
  { code: '73.59', name: 'Other assisted spontaneous delivery', category: 'Obstetri' },
  { code: '38.12', name: 'Endarterectomy, head and neck vessels', category: 'Vaskular' },
  { code: '88.76', name: 'Diagnostic ultrasound of abdomen and retroperitoneum', category: 'Radiologi' },
  { code: '87.44', name: 'Routine chest x-ray, so described', category: 'Radiologi' },
  { code: '99.04', name: 'Transfusion of packed cells', category: 'Tindakan Medis' }
];

// Master Kemenkes Formulary Medications
export const MASTER_MEDICATIONS = [
  { id: 'MED-AMX-500', code: 'AMX-500', name: 'Amoxicillin Trihydrate 500 mg', category: 'Antibiotik', form: 'Kaplet', unit: 'Tablet', isHighAlert: false, isLasa: false },
  { id: 'MED-PAR-500', code: 'PAR-500', name: 'Paracetamol 500 mg', category: 'Analgetik/Antipiretik', form: 'Tablet', unit: 'Tablet', isHighAlert: false, isLasa: false },
  { id: 'MED-MET-500', code: 'MET-500', name: 'Metformin HCl 500 mg', category: 'Antidiabetes', form: 'Tablet', unit: 'Tablet', isHighAlert: false, isLasa: true },
  { id: 'MED-AML-10',  code: 'AML-10',  name: 'Amlodipine Besilate 10 mg', category: 'Antihipertensi', form: 'Tablet', unit: 'Tablet', isHighAlert: false, isLasa: true },
  { id: 'MED-INS-GLA', code: 'INS-GLA', name: 'Insulin Glargine Pen 100 IU/mL', category: 'Antidiabetes / High-Alert', form: 'Pen Injector', unit: 'Pen', isHighAlert: true, isLasa: false },
  { id: 'MED-HEP-INJ', code: 'HEP-INJ', name: 'Heparin Sodium Injection 5000 IU/mL', category: 'Antikoagulan / High-Alert', form: 'Vial', unit: 'Vial', isHighAlert: true, isLasa: false }
];

export const CoreRegistryService = {
  // Department Master
  getAllDepartments: () => MASTER_DEPARTMENTS,
  getDepartmentById: (id) => departmentMap.get(id) || null,
  getDepartmentsByCategory: (cat) => MASTER_DEPARTMENTS.filter(d => d.category === cat),

  // Staff & Practitioner Master
  getAllStaff: () => STAFF_REGISTRY,
  getStaffById: (id) => staffMap.get(id) || null,
  getDoctors: () => STAFF_REGISTRY.filter(s => s.role === 'DOCTOR'),
  getNurses: () => STAFF_REGISTRY.filter(s => s.role === 'NURSE'),
  getPharmacists: () => STAFF_REGISTRY.filter(s => s.role === 'PHARMACIST'),
  getDoctorsByDepartment: (deptId) => STAFF_REGISTRY.filter(s => s.role === 'DOCTOR' && s.departmentId === deptId),

  // Diagnoses & Procedures Master
  searchDiagnoses: (query) => {
    if (!query) return ICD10_DIAGNOSES;
    const q = query.toLowerCase();
    return ICD10_DIAGNOSES.filter(d => d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q));
  },
  searchProcedures: (query) => {
    if (!query) return ICD9_PROCEDURES;
    const q = query.toLowerCase();
    return ICD9_PROCEDURES.filter(p => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
  },

  // Medication Master
  getAllMedications: () => MASTER_MEDICATIONS,
  getMedicationById: (id) => MASTER_MEDICATIONS.find(m => m.id === id) || null,
  searchMedications: (query) => {
    if (!query) return MASTER_MEDICATIONS;
    const q = query.toLowerCase();
    return MASTER_MEDICATIONS.filter(m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  }
};

export default CoreRegistryService;
