/**
 * High-Fidelity JCI Demo Data for NurseFlow HIS
 * Designed for enterprise-grade demonstrations.
 */

export const DEMO_PATIENTS = [
  {
    id: 'demo-patient-1',
    name: 'Fajar Susilo',
    mrn: '005648',
    nik: '3273012345670001',
    demographics: {
      gender: 'M',
      dob: '1992-06-15',
      pob: 'Bandung',
      religion: 'Islam',
      occupation: 'Software Engineer',
      address: 'Jl. Surya Sumantri No. 12, Bandung'
    },
    baseline_profile: {
      value: 72,
      chronic_flag: false,
      last_updated: new Date().toISOString()
    },
    allergies: [
      { type: 'DRUG', agent: 'Penicillin', reaction: 'Urticaria', severity: 'MODERATE' }
    ],
    safety_flags: {
      fall_risk: 'LOW',
      pressure_ulcer: 'LOW',
      isolation: 'NONE'
    },
    is_demo: true,
    registered_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
  },
  {
    id: 'demo-patient-2',
    name: 'Siti Aminah',
    mrn: '008921',
    nik: '3273012345670002',
    demographics: {
      gender: 'F',
      dob: '1975-03-20',
      pob: 'Jakarta',
      religion: 'Islam',
      occupation: 'Ibu Rumah Tangga',
      address: 'Komp. Antapani Mas Block B2, Bandung'
    },
    baseline_profile: {
      value: 85,
      chronic_flag: true, // Diabetes Type 2
      last_updated: new Date().toISOString()
    },
    allergies: [
      { type: 'FOOD', agent: 'Seafood', reaction: 'Anaphylaxis', severity: 'SEVERE' }
    ],
    safety_flags: {
      fall_risk: 'HIGH',
      pressure_ulcer: 'MODERATE',
      isolation: 'NONE'
    },
    is_demo: true,
    registered_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'demo-patient-3',
    name: 'Budi Santoso',
    mrn: '001245',
    nik: '3273012345670003',
    demographics: {
      gender: 'M',
      dob: '1950-11-05',
      pob: 'Surakarta',
      religion: 'Kristen',
      occupation: 'Pensiunan',
      address: 'Jl. Pasteur No. 45, Bandung'
    },
    baseline_profile: {
      value: 65,
      chronic_flag: true, // Hypertension
      last_updated: new Date().toISOString()
    },
    is_demo: true,
    registered_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  }
];

export const DEMO_ENCOUNTERS = [
  {
    id: 'GLPMBY4B',
    patient_id: 'demo-patient-1',
    type: 'OUTPATIENT',
    department: 'Poli Penyakit Dalam (Internis)',
    doctor_name: 'Dr. Robby Viory, Sp.PD',
    doctor_email: 'robby.viory@hospital.com',
    guarantor: 'BPJS Kesehatan',
    admitted_at: { toDate: () => new Date() },
    status: 'ACTIVE',
    is_demo: true,
    vitals: {
      bp: '120/80',
      hr: 72,
      temp: 36.5,
      rr: 18,
      spo2: 98
    },
    chief_complaint: 'Kontrol rutin diabetes, sering merasa lemas di sore hari.'
  },
  {
    id: 'STAM99X1',
    patient_id: 'demo-patient-2',
    type: 'OUTPATIENT',
    department: 'Poli Endokrin',
    doctor_name: 'Dr. Sarah Azhari, Sp.PD-KEMD',
    doctor_email: 'sarah.azhari@hospital.com',
    guarantor: 'Prudential Indonesia',
    admitted_at: { toDate: () => new Date(Date.now() - 3600000 * 2) },
    status: 'ACTIVE',
    is_demo: true,
    vitals: {
      bp: '135/90',
      hr: 88,
      temp: 37.0,
      rr: 20,
      spo2: 97
    },
    chief_complaint: 'Gula darah tidak stabil, sering pusing dan penglihatan kabur.'
  }
];

export const DEMO_RECORDS = [
  {
    id: 'rec-demo-1',
    patientId: 'demo-patient-1',
    encounterId: 'GLPMBY4B',
    doctor: 'robby.viory@hospital.com',
    status: 'SIGNED',
    subjective: 'Pasien mengeluh lemas terutama setelah beraktivitas sore hari. Nafsu makan normal, pola tidur baik.',
    objective: 'KU: Baik, CM. TD: 120/80, N: 72x/m, S: 36.5, RR: 18x/m. GDS: 145 mg/dL.',
    assessment: 'Diabetes Mellitus Type 2 - Controlled',
    icd10: [{ code: 'E11.9', name: 'Type 2 diabetes mellitus without complications' }],
    plan_medications: [
      { medication_name: 'Metformin', dosage: '500mg', route: 'Oral', frequency: '2x1', instructions: 'Sesudah makan' }
    ],
    plan_instructions: 'Diet rendah gula, olahraga ringan 30 menit/hari.',
    created_at: { toDate: () => new Date(Date.now() - 86400000) },
    signed_at: { toDate: () => new Date(Date.now() - 86400000) },
    signed_by: 'robby.viory@hospital.com'
  },
  {
    id: 'rec-demo-2',
    patientId: 'demo-patient-2',
    encounterId: 'STAM99X1',
    doctor: 'sarah.azhari@hospital.com',
    status: 'SIGNED',
    subjective: 'Pasien merasa pusing sejak 3 hari yang lalu. Riwayat diabetes sejak 5 tahun lalu.',
    objective: 'TD: 135/90, N: 88x/m. GDS sewaktu: 210 mg/dL.',
    assessment: 'Diabetes Mellitus Type 2 - Uncontrolled',
    icd10: [{ code: 'E11.8', name: 'Type 2 diabetes mellitus with unspecified complications' }],
    plan_medications: [
      { medication_name: 'Insulin Glargine', dosage: '10 unit', route: 'Subkutan', frequency: '1x1', instructions: 'Malam hari' }
    ],
    plan_instructions: 'Monitor gula darah mandiri (SMBG) 3x sehari.',
    created_at: { toDate: () => new Date(Date.now() - 3600000 * 4) },
    signed_at: { toDate: () => new Date(Date.now() - 3600000 * 4) },
    signed_by: 'sarah.azhari@hospital.com'
  }
];
