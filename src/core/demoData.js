/**
 * High-Fidelity JCI Demo Data for NurseFlow HIS
 * Designed for enterprise-grade demonstrations.
 */

export const DEMO_PATIENTS = [
  {
    id: 'demo-patient-dewi',
    name: 'Ny. Dewi Sartika, S.Pd',
    mrn: '009944',
    nik: '3273016508850001',
    demographics: {
      gender: 'F',
      dob: '1988-08-25',
      pob: 'Bandung',
      religion: 'Islam',
      occupation: 'Guru SMA',
      address: 'Jl. R.E. Martadinata No. 88, Cihapit, Bandung'
    },
    baseline_profile: {
      value: 68,
      chronic_flag: false,
      last_updated: new Date().toISOString()
    },
    allergies: [
      { type: 'DRUG', agent: 'Amoxicillin / Penicillin', reaction: 'Angioedema & Rash', severity: 'SEVERE' },
      { type: 'FOOD', agent: 'Kepiting / Udang', reaction: 'Urtikaria Ringan', severity: 'MILD' }
    ],
    safety_flags: {
      fall_risk: 'LOW',
      pressure_ulcer: 'LOW',
      isolation: 'NONE'
    },
    insurance: {
      type: 'bpjs',
      no: '000192837465',
      name: 'BPJS KESEHATAN (PBI / NON-PBI)'
    },
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    registered_at: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    is_demo: true,
  },
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
    registered_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

export const DEMO_ENCOUNTERS = [
  {
    id: 'ENC-RJ-2026-001',
    patient_id: 'demo-patient-dewi',
    patient_name: 'Ny. Dewi Sartika, S.Pd',
    type: 'OUTPATIENT',
    department: 'Poli Bedah Umum & Digestif',
    doctor_name: 'Dr. Robby Viory, Sp.B',
    doctor_email: 'robby.viory@hospital.com',
    guarantor: 'BPJS Kesehatan (PBI)',
    admitted_at: { toDate: () => new Date(Date.now() - 3600000 * 2.5) },
    status: 'IN_TREATMENT',
    is_demo: true,
    triage_level: 'YELLOW',
    triage_score: 'P2 - Urgensi Sedang',
    vitals: {
      bp: '125/82',
      hr: 92,
      temp: 37.8,
      rr: 20,
      spo2: 99,
      pain_scale: '6/10 (NRS)'
    },
    chief_complaint: 'Nyeri perut kanan bawah mendadak sejak 6 jam lalu, mual, demam sumeng-sumeng.'
  },
  {
    id: 'GLPMBY4B',
    patient_id: 'demo-patient-1',
    patient_name: 'Fajar Susilo',
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
  }
];

export const DEMO_RECORDS = [
  // 1. PENGKAJIAN AWAL MEDIS DOKTER (AOP)
  {
    id: 'rec-dewi-aop',
    patientId: 'demo-patient-dewi',
    encounterId: 'ENC-RJ-2026-001',
    doctor: 'robby.viory@hospital.com',
    moduleName: 'PENGKAJIAN AWAL MEDIS (RJ)',
    status: 'SIGNED',
    subjective: 'Pasien datang dengan keluhan nyeri hebat pada perut kanan bawah sejak tadi pagi (sekitar 6 jam lalu). Awalnya nyeri tumpul di sekitar ulu hati lalu berpindah ke perut kanan bawah. Mual (+), muntah 1x, nafsu makan menurun. Demam dirasakan sejak 4 jam lalu.',
    objective: 'KU: Tampak menahan nyeri, CM. TD: 125/82 mmHg, N: 92x/m, S: 37.8°C, RR: 20x/m. Abdomen: Nyeri tekan titik McBurney (+), Nyeri lepas (+), Rovsing sign (+), Psoas sign (+), Defans muskular ringan di regio RLQ.',
    assessment: 'Acute Appendicitis (ICD-10: K35.8)',
    icd10: [{ code: 'K35.8', name: 'Other and unspecified acute appendicitis' }],
    plan_medications: [
      { medication_name: 'Ceftriaxone 1g IV', dosage: '1 vial', route: 'Intravena', frequency: '1x1', instructions: 'Skin test dulu' },
      { medication_name: 'Ketorolac 30mg IV', dosage: '1 amp', route: 'Intravena', frequency: '3x1', instructions: 'Analgetik anti inflamasi' },
      { medication_name: 'Ondansetron 4mg IV', dosage: '1 amp', route: 'Intravena', frequency: '2x1', instructions: 'Anti emetik' }
    ],
    plan_instructions: 'Pasang IVFD RL 20 tpm, puasakan pasien, siapkan informed consent untuk tindakan Appendectomy Cito hari ini.',
    created_at: { toDate: () => new Date(Date.now() - 3600000 * 2) },
    signed_at: { toDate: () => new Date(Date.now() - 3600000 * 2) },
    signed_by: 'robby.viory@hospital.com'
  },
  // 2. SOAP NOTES / CPPT DPJP (COP)
  {
    id: 'rec-dewi-cppt',
    patientId: 'demo-patient-dewi',
    encounterId: 'ENC-RJ-2026-001',
    doctor: 'robby.viory@hospital.com',
    moduleName: 'SOAP NOTES (CPPT)',
    status: 'SIGNED',
    subjective: 'Pasien mengeluh nyeri perut masih terasa skala 6/10. Menunggu hasil lab darah lengkap dan USG.',
    objective: 'Hasil Lab Cito: Leukosit 15.400 /uL (Leukositosis), Neutrofil 84%. USG Abdomen: Tampak gambaran target sign dan penebalan dinding appendix 8.2 mm non-compressible (Appendisitis Akut).',
    assessment: 'Acute Appendicitis Confirmed - Indikasi Cito Laparoscopic Appendectomy',
    icd10: [{ code: 'K35.8', name: 'Acute appendicitis' }],
    plan_medications: [],
    plan_instructions: 'Rujuk ke Kamar Operasi (OK Sentral). Jadwalkan tindakan operasi pukul 14.00 WIB.',
    created_at: { toDate: () => new Date(Date.now() - 3600000 * 1.5) },
    signed_at: { toDate: () => new Date(Date.now() - 3600000 * 1.5) },
    signed_by: 'robby.viory@hospital.com'
  },
  // 3. PERSETUJUAN TINDAKAN / INFORMED CONSENT (PFR)
  {
    id: 'rec-dewi-consent',
    patientId: 'demo-patient-dewi',
    encounterId: 'ENC-RJ-2026-001',
    doctor: 'robby.viory@hospital.com',
    moduleName: 'PERSETUJUAN TINDAKAN',
    status: 'SIGNED',
    assessment: 'PERSETUJUAN TINDAKAN',
    data: {
      tindakan: 'Laparoscopic Appendectomy (Operasi Usus Buntu Minimal Invasif)',
      risiko: 'Pendarahan, infeksi luka operasi (SSI), konversi ke laparatomi terbuka, reaksi anestesi umum.',
      alternatif: 'Appendectomy Laparatomi Terbuka, Terapi Konservatif Antibiotik (Risiko perforasi tinggi).',
      saksi: 'Tn. Agus Pratama (Suami Pasien)',
      status: 'SIGNED_AND_VERIFIED',
      doctorSignature: 'robby.viory@hospital.com',
      witnessSignature: 'TANDA TANGAN DIGITAL PASIEN VIA TABLET',
      patientSignatureBase64: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" width="300" height="120"><path d="M20,70 Q50,10 90,60 T160,50 T220,90 T280,30" fill="none" stroke="%230284c7" stroke-width="4" stroke-linecap="round"/><path d="M70,95 Q140,80 260,85" fill="none" stroke="%230284c7" stroke-width="3" stroke-linecap="round"/></svg>'
    },
    created_at: { toDate: () => new Date(Date.now() - 3600000 * 1.2) },
    signed_at: { toDate: () => new Date(Date.now() - 3600000 * 1.2) },
    signed_by: 'robby.viory@hospital.com'
  },
  // 4. EDUKASI PASIEN & KELUARGA (PFE)
  {
    id: 'rec-dewi-pfe',
    patientId: 'demo-patient-dewi',
    encounterId: 'ENC-RJ-2026-001',
    doctor: 'robby.viory@hospital.com',
    moduleName: 'EDUKASI PASIEN',
    status: 'SIGNED',
    assessment: 'EDUKASI PASIEN',
    data: {
      topik: 'Pasca-Tindakan - Perawatan Luka & Kebersihan',
      metode: 'Lisan & Demonstrasi',
      penerima: 'Pasien & Suami',
      pemahaman: 'Paham & Dapat Mengulang',
      catatan: 'Pasien dan suami telah memahami pentingnya puasa 6 jam sebelum operasi serta tahapan mobilisasi dini pasca laparoskopi.'
    },
    created_at: { toDate: () => new Date(Date.now() - 3600000 * 1) },
    signed_at: { toDate: () => new Date(Date.now() - 3600000 * 1) },
    signed_by: 'robby.viory@hospital.com'
  },
  // 5. TRANSFER INTERNAL SBAR (ACC)
  {
    id: 'rec-dewi-transfer',
    patientId: 'demo-patient-dewi',
    encounterId: 'ENC-RJ-2026-001',
    doctor: 'robby.viory@hospital.com',
    moduleName: 'TRANSFER INTERNAL (SBAR)',
    status: 'SIGNED',
    assessment: 'TRANSFER INTERNAL (SBAR)',
    data: {
      tujuan: 'Kamar Operasi (OK Sentral)',
      situation: 'Ny. Dewi Sartika (38 th), GCS 15, Post-Konsul Poli Bedah dengan Appendisitis Akut, dijadwalkan Cito Appendectomy Laparoskopi.',
      background: 'Nyeri perut kanan bawah sejak 6 jam lalu. Alergi Amoxicillin (Severe). Telah terpasang IVFD RL 20 tpm pada tangan kiri.',
      assessment: 'TTV Terakhir: TD 125/82, N 92, S 37.8, RR 20. Skala Nyeri 6/10. Puasa sejak pukul 08.00 WIB. Hasil Lab & USG terlampir di EMR.',
      recommendation: 'Lanjutkan puasa, siapkan meja operasi laparoscopic tower, lakukan skin test antibiotik profilaksis non-penicillin di ruang persiapan OK.'
    },
    created_at: { toDate: () => new Date(Date.now() - 3600000 * 0.5) },
    signed_at: { toDate: () => new Date(Date.now() - 3600000 * 0.5) },
    signed_by: 'robby.viory@hospital.com'
  }
];
