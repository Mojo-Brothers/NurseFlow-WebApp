/**
 * NurseFlow Enterprise HIS 2026 — Master Data Governance & Clinical Knowledge Architecture
 * Standar: Permenkes No. 24/2022, JCI Information Management & WHO ATC/DDD & INA-CBGs
 */

export const MASTER_DATA_GOVERNANCE = {
  departments: [
    { id: 'DEPT-IGD', code: 'IGD', name: 'Instalasi Gawat Darurat', type: 'EMERGENCY' },
    { id: 'DEPT-IRJ', code: 'IRJ', name: 'Instalasi Rawat Jalan', type: 'OUTPATIENT' },
    { id: 'DEPT-IRNA', code: 'IRNA', name: 'Instalasi Rawat Inap', type: 'INPATIENT' },
    { id: 'DEPT-ICU', code: 'ICU', name: 'Intensive Care Unit', type: 'INTENSIVE' },
    { id: 'DEPT-COT', code: 'COT', name: 'Central Operating Theatre', type: 'SURGICAL' },
    { id: 'DEPT-IFRS', code: 'IFRS', name: 'Instalasi Farmasi Rumah Sakit', type: 'PHARMACY' },
    { id: 'DEPT-LAB', code: 'LAB', name: 'Instalasi Laboratorium Klinis', type: 'DIAGNOSTIC' },
    { id: 'DEPT-RAD', code: 'RAD', name: 'Instalasi Radiologi & Imaging', type: 'DIAGNOSTIC' }
  ],

  clinics: [
    { id: 'POLI-INT', code: 'INT', name: 'Poliklinik Penyakit Dalam', departmentId: 'DEPT-IRJ', bpjsPoliCode: 'INT' },
    { id: 'POLI-JTG', code: 'JTG', name: 'Poliklinik Jantung & Pembuluh Darah', departmentId: 'DEPT-IRJ', bpjsPoliCode: 'JAN' },
    { id: 'POLI-BED', code: 'BED', name: 'Poliklinik Bedah Umum', departmentId: 'DEPT-IRJ', bpjsPoliCode: 'BED' },
    { id: 'POLI-ANA', code: 'ANA', name: 'Poliklinik Kesehatan Anak', departmentId: 'DEPT-IRJ', bpjsPoliCode: 'ANA' },
    { id: 'POLI-OBG', code: 'OBG', name: 'Poliklinik Kebidanan & Kandungan', departmentId: 'DEPT-IRJ', bpjsPoliCode: 'OBG' },
    { id: 'POLI-SAR', code: 'SAR', name: 'Poliklinik Neurologi / Saraf', departmentId: 'DEPT-IRJ', bpjsPoliCode: 'SAR' }
  ],

  practitioners: [
    {
      id: 'DOC-001',
      employeeNumber: 'EMP-DOC-101',
      fullName: 'dr. Siti Wijaya, Sp.PD-KGEH',
      specialty: 'Spesialis Penyakit Dalam',
      strNumber: 'STR-31.1.1.100.1.20.123456',
      sipNumber: 'SIP/503/001/IDI/2024',
      ihsNumber: 'N1000001',
      bpjsDoctorCode: '12345',
      departmentId: 'POLI-INT'
    },
    {
      id: 'DOC-002',
      employeeNumber: 'EMP-DOC-102',
      fullName: 'dr. Budi Santoso, Sp.EM',
      specialty: 'Spesialis Emergensi Medik',
      strNumber: 'STR-31.1.1.100.1.20.123457',
      sipNumber: 'SIP/503/002/IDI/2024',
      ihsNumber: 'N1000002',
      bpjsDoctorCode: '12346',
      departmentId: 'DEPT-IGD'
    },
    {
      id: 'NUR-001',
      employeeNumber: 'EMP-NUR-201',
      fullName: 'Ns. Indah Permata, S.Kep',
      strNumber: 'STR-31.2.1.200.2.21.654321',
      departmentId: 'DEPT-IGD'
    },
    {
      id: 'PHARM-001',
      employeeNumber: 'EMP-PHA-301',
      fullName: 'apt. Dimas Anggara, S.Farm',
      sipaNumber: 'SIPA/503/003/IAI/2024',
      departmentId: 'DEPT-IFRS'
    }
  ],

  icd10: [
    { code: 'I10', name: 'Essential (primary) hypertension', category: 'Circulatory' },
    { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' },
    { code: 'I21.9', name: 'Acute myocardial infarction, unspecified (STEMI/NSTEMI)', category: 'Circulatory' },
    { code: 'I63.9', name: 'Cerebral infarction, unspecified (Acute Ischemic Stroke)', category: 'Nervous' },
    { code: 'A41.9', name: 'Sepsis, unspecified organism', category: 'Infectious' },
    { code: 'K35.8', name: 'Other and unspecified acute appendicitis', category: 'Digestive' },
    { code: 'J45.909', name: 'Unspecified asthma, uncomplicated', category: 'Respiratory' }
  ],

  icd9cm: [
    { code: '89.52', name: 'Electrocardiogram (ECG/EKG 12-Lead)' },
    { code: '87.44', name: 'Routine chest x-ray, so described (Thorax PA)' },
    { code: '47.09', name: 'Other appendectomy (Open / Laparoscopic)' },
    { code: '90.59', name: 'Microscopic examination of blood (Complete Blood Count)' },
    { code: '96.04', name: 'Insertion of endotracheal tube (Intubation)' }
  ],

  formularium: [
    {
      code: 'MED-MET-500',
      name: 'Metformin HCl 500mg Tablet',
      form: 'TABLET',
      strength: '500 mg',
      category: 'ANTIDIABETIC',
      highAlert: false,
      lasa: false,
      renalContraindicationEgfr: 30,
      unitPrice: 1200
    },
    {
      code: 'MED-INS-GLA',
      name: 'Insulin Glargine 100 IU/mL Pen',
      form: 'INJECTION',
      strength: '100 IU/mL',
      category: 'ANTIDIABETIC',
      highAlert: true,
      lasa: true,
      unitPrice: 165000
    },
    {
      code: 'MED-HEP-INJ',
      name: 'Heparin Sodium 5,000 IU/mL Injeksi',
      form: 'INJECTION',
      strength: '5,000 IU/mL',
      category: 'ANTICOAGULANT',
      highAlert: true,
      lasa: false,
      unitPrice: 85000
    },
    {
      code: 'MED-AML-10',
      name: 'Amlodipine Besylate 10mg Tablet',
      form: 'TABLET',
      strength: '10 mg',
      category: 'ANTIHYPERTENSIVE',
      highAlert: false,
      lasa: true,
      unitPrice: 2500
    }
  ]
};

export const masterDataGovernanceService = {
  getDepartments: () => MASTER_DATA_GOVERNANCE.departments,
  getClinics: () => MASTER_DATA_GOVERNANCE.clinics,
  getPractitioners: () => MASTER_DATA_GOVERNANCE.practitioners,
  searchIcd10: (query) => {
    if (!query) return MASTER_DATA_GOVERNANCE.icd10;
    const q = query.toLowerCase();
    return MASTER_DATA_GOVERNANCE.icd10.filter(item => item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q));
  },
  searchIcd9cm: (query) => {
    if (!query) return MASTER_DATA_GOVERNANCE.icd9cm;
    const q = query.toLowerCase();
    return MASTER_DATA_GOVERNANCE.icd9cm.filter(item => item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q));
  },
  getFormularium: () => MASTER_DATA_GOVERNANCE.formularium
};
