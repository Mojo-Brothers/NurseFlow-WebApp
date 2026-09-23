/**
 * emrSupportingDocs.service.js
 * ─────────────────────────────────────────────────────────────
 * Layanan data terpadu untuk fitur-fitur EMR:
 * - Upload Dokumen Penunjang (Laboratorium, Radiologi, EKG, dll)
 * - Rujukan Internal Antar-Poli/SMF/Spesialis
 * - Live Resep Online Monitoring
 * - Pemeriksaan Dokumen Kredensial Dokter (SIP & STR)
 * - Worklist Rawat Jalan (RJ) & Rawat Inap (RI)
 * - Laporan Bulanan UGD
 */

const STORAGE_KEY_DOCS = 'nurseflow_emr_supporting_docs';
const STORAGE_KEY_REFERRALS = 'nurseflow_emr_internal_referrals';
const STORAGE_KEY_PRESCRIPTIONS = 'nurseflow_emr_online_prescriptions';

// Inisialisasi Data Default Dokumen Penunjang
const DEFAULT_SUPPORTING_DOCS = [
  {
    id: 'DOC-2026-001',
    patientId: 'P001',
    patientName: 'Ny. Siti Rahmawati',
    mrn: 'MRN-2026-0811',
    title: 'Hasil Pemeriksaan CT Scan Thorax Multi-Slice',
    category: 'RADIOLOGY',
    categoryLabel: 'Radiologi & Imaging',
    documentDate: '2026-09-08',
    facilityOrigin: 'Instalasi Radiologi RSUP Nasional',
    doctorInCharge: 'dr. Hendra Setiawan, Sp.Rad',
    notes: 'Kesan: Susp. Konsolidasi lobus inferior paru kanan disertai efusi pleura minimal.',
    fileName: 'CT_Thorax_SitiRahmawati_20260908.pdf',
    fileSize: '4.2 MB',
    fileType: 'application/pdf',
    uploadedBy: 'Radiografer Ahmad, A.Md.Rad',
    uploadedAt: '2026-09-08T14:30:00Z',
    status: 'VERIFIED'
  },
  {
    id: 'DOC-2026-002',
    patientId: 'P001',
    patientName: 'Ny. Siti Rahmawati',
    mrn: 'MRN-2026-0811',
    title: 'Hasil Pemeriksaan Laboratorium Darah Lengkap & Serologi',
    category: 'LABORATORY',
    categoryLabel: 'Laboratorium Klinis',
    documentDate: '2026-09-09',
    facilityOrigin: 'Laboratorium Sentral RSUP Nasional',
    doctorInCharge: 'dr. Ratna Juwita, Sp.PK',
    notes: 'Leukosit: 14.500/uL (Meningkat), Hb: 11.2 g/dL, Trombosit: 220.000/uL, CRP: 48 mg/L (Positif Tinggi)',
    fileName: 'Lab_Hematologi_SitiRahmawati_20260909.pdf',
    fileSize: '1.8 MB',
    fileType: 'application/pdf',
    uploadedBy: 'Analis Eka, S.Tr.Kes',
    uploadedAt: '2026-09-09T09:15:00Z',
    status: 'VERIFIED'
  },
  {
    id: 'DOC-2026-003',
    patientId: 'P002',
    patientName: 'Tn. Budi Pratama',
    mrn: 'MRN-2026-0922',
    title: 'Rekaman Elektrokardiogram (EKG 12-Lead)',
    category: 'ECG',
    categoryLabel: 'Elektromedik & Kardio',
    documentDate: '2026-09-10',
    facilityOrigin: 'Poli Jantung & Pembuluh Darah',
    doctorInCharge: 'dr. Anita Wijaya, Sp.JP(K)',
    notes: 'Sinus Rhytm 78 bpm, T-wave inversion di lead V3-V5, Axis normal.',
    fileName: 'EKG_12Lead_BudiPratama.jpg',
    fileSize: '850 KB',
    fileType: 'image/jpeg',
    uploadedBy: 'dr. Anita Wijaya, Sp.JP(K)',
    uploadedAt: '2026-09-10T08:45:00Z',
    status: 'VERIFIED'
  },
  {
    id: 'DOC-2026-004',
    patientId: 'P003',
    patientName: 'An. Daffa Maulana',
    mrn: 'MRN-2026-1045',
    title: 'Surat Rujukan Balik & Resume Medis Faskes Primer',
    category: 'EXTERNAL_REFERRAL',
    categoryLabel: 'Rujukan Luar Faskes',
    documentDate: '2026-09-07',
    facilityOrigin: 'Puskesmas Kebayoran Sehat',
    doctorInCharge: 'dr. Faisal Rahman',
    notes: 'Rujukan pasien demam tifoid persisten hari ke-7 tidak respon terapi oral lini 1.',
    fileName: 'SuratRujukan_Puskesmas_Daffa.pdf',
    fileSize: '1.1 MB',
    fileType: 'application/pdf',
    uploadedBy: 'Front Desk Petugas Rujukan',
    uploadedAt: '2026-09-07T11:00:00Z',
    status: 'VERIFIED'
  }
];

// Inisialisasi Default Rujukan Internal
const DEFAULT_INTERNAL_REFERRALS = [
  {
    id: 'REF-INT-2026-001',
    referralNo: 'RUJ-INT/2026/09/0088',
    patientId: 'P001',
    patientName: 'Ny. Siti Rahmawati',
    mrn: 'MRN-2026-0811',
    originDepartment: 'Poli Penyakit Dalam',
    referringDoctor: 'dr. Alexander, Sp.PD',
    targetDepartment: 'Poli Paru',
    consultantDoctor: 'dr. Faisal Bahar, Sp.P(K)',
    consultationType: 'CITO', // CITO | ROUTINE | CO_MANAGEMENT | TRANSFER_OF_CARE
    clinicalDiagnosis: 'Bronkopneumonia Dextra ec Bakterial + Efusi Pleura Minima',
    clinicalSummary: 'Pasien rawat inap hari ke-2 dengan batuk purulen dan sesak napas. Hasil foto toraks menunjukkan infiltrat luas di lapang bawah paru kanan.',
    consultationQuestion: 'Mohon evaluasi tindakan torakosentesis aspirasi diagnostik dan evaluasi terapi antibiotik lini kedua.',
    status: 'WAITING_RESPONSE', // WAITING_RESPONSE | ACCEPTED | COMPLETED | REJECTED
    createdAt: '2026-09-10T08:30:00Z',
    responseNotes: null,
    respondedAt: null,
    respondedBy: null
  },
  {
    id: 'REF-INT-2026-002',
    referralNo: 'RUJ-INT/2026/09/0082',
    patientId: 'P002',
    patientName: 'Tn. Budi Pratama',
    mrn: 'MRN-2026-0922',
    originDepartment: 'Instalasi Gawat Darurat (IGD)',
    referringDoctor: 'dr. Budi Santoso, Sp.B',
    targetDepartment: 'Poli Jantung & Pembuluh Darah',
    consultantDoctor: 'dr. Anita Wijaya, Sp.JP(K)',
    consultationType: 'ROUTINE',
    clinicalDiagnosis: 'Apendisitis Akut Perforasi, HT Grade II',
    clinicalSummary: 'Rencana laparotomi eksplorasi cito. Riwayat hipertensi tidak terkontrol, tensi masuk 170/100 mmHg.',
    consultationQuestion: 'Mohon toleransi operasi dan rekomendasi regulasi tekanan darah perioperatif.',
    status: 'COMPLETED',
    createdAt: '2026-09-09T14:10:00Z',
    responseNotes: 'Toleransi operasi sedang. Rekomendasi: Infus Nicardipine titrasi target TD <140/90. Lanjut obat rutin antihipertensi setelah stabil.',
    respondedAt: '2026-09-09T15:20:00Z',
    respondedBy: 'dr. Anita Wijaya, Sp.JP(K)'
  },
  {
    id: 'REF-INT-2026-003',
    referralNo: 'RUJ-INT/2026/09/0079',
    patientId: 'P004',
    patientName: 'Ibu Maria Ulfah',
    mrn: 'MRN-2026-0567',
    originDepartment: 'Bangsal Melati (Rawat Inap)',
    referringDoctor: 'dr. Hendro, Sp.OG',
    targetDepartment: 'Instalasi Gizi & Dietetika',
    consultantDoctor: 'dr. Nurul Hayati, Sp.GK',
    consultationType: 'CO_MANAGEMENT',
    clinicalDiagnosis: 'Post-SC Hari ke-2 + Diabetes Melitus Gestasional',
    clinicalSummary: 'Pasien pasca seksio sesarea dengan GDP 185 mg/dL. Membutuhkan rencana menu nutrisi khusus laktasi dan kontrol glikemik.',
    consultationQuestion: 'Mohon pengaturan diet kalori DM 1900 kkal dan edukasi gizi pra-pulang.',
    status: 'ACCEPTED',
    createdAt: '2026-09-10T07:15:00Z',
    responseNotes: 'Konsultasi diterima. Dietisien dijadwalkan visite bangsal pkl 11.00 WIB.',
    respondedAt: '2026-09-10T08:00:00Z',
    respondedBy: 'Dietisien Rina, S.Gz'
  }
];

// In-memory cache fallback for environments without localStorage (e.g. Node test runner)
let memoryStore = {};

function getStorage(key, fallback) {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }
    return memoryStore[key] ? JSON.parse(memoryStore[key]) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStorage(key, value) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      memoryStore[key] = JSON.stringify(value);
    }
  } catch (e) {
    console.error('Failed to write to storage:', e);
  }
}


// ─────────────────────────────────────────────────────────────
// 1. DOKUMEN PENUNJANG APIS
// ─────────────────────────────────────────────────────────────
export const emrSupportingDocsService = {
  getDocuments(filter = {}) {
    let docs = getStorage(STORAGE_KEY_DOCS, DEFAULT_SUPPORTING_DOCS);
    if (filter.patientId) {
      docs = docs.filter(d => d.patientId === filter.patientId || d.mrn === filter.patientId);
    }
    if (filter.category && filter.category !== 'ALL') {
      docs = docs.filter(d => d.category === filter.category);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      docs = docs.filter(d => 
        (d.title || '').toLowerCase().includes(q) ||
        (d.patientName || '').toLowerCase().includes(q) ||
        (d.mrn || '').toLowerCase().includes(q) ||
        (d.notes || '').toLowerCase().includes(q)
      );
    }
    return docs;
  },

  addDocument(docData) {
    const current = getStorage(STORAGE_KEY_DOCS, DEFAULT_SUPPORTING_DOCS);
    const newDoc = {
      id: `DOC-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      status: 'VERIFIED',
      ...docData
    };
    const updated = [newDoc, ...current];
    setStorage(STORAGE_KEY_DOCS, updated);
    return newDoc;
  },

  deleteDocument(docId) {
    const current = getStorage(STORAGE_KEY_DOCS, DEFAULT_SUPPORTING_DOCS);
    const updated = current.filter(d => d.id !== docId);
    setStorage(STORAGE_KEY_DOCS, updated);
    return true;
  },

  // ─────────────────────────────────────────────────────────────
  // 2. RUJUKAN INTERNAL APIS
  // ─────────────────────────────────────────────────────────────
  getInternalReferrals(filter = {}) {
    let refs = getStorage(STORAGE_KEY_REFERRALS, DEFAULT_INTERNAL_REFERRALS);
    if (filter.status && filter.status !== 'ALL') {
      refs = refs.filter(r => r.status === filter.status);
    }
    if (filter.department && filter.department !== 'ALL') {
      refs = refs.filter(r => r.targetDepartment === filter.department || r.originDepartment === filter.department);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      refs = refs.filter(r =>
        (r.referralNo || '').toLowerCase().includes(q) ||
        (r.patientName || '').toLowerCase().includes(q) ||
        (r.clinicalDiagnosis || '').toLowerCase().includes(q) ||
        (r.referringDoctor || '').toLowerCase().includes(q)
      );
    }
    return refs;
  },

  createInternalReferral(data) {
    const current = getStorage(STORAGE_KEY_REFERRALS, DEFAULT_INTERNAL_REFERRALS);
    const counter = current.length + 1;
    const newRef = {
      id: `REF-INT-${Date.now()}`,
      referralNo: `RUJ-INT/${new Date().getFullYear()}/${(new Date().getMonth()+1).toString().padStart(2,'0')}/${counter.toString().padStart(4,'0')}`,
      status: 'WAITING_RESPONSE',
      createdAt: new Date().toISOString(),
      responseNotes: null,
      respondedAt: null,
      respondedBy: null,
      ...data
    };
    const updated = [newRef, ...current];
    setStorage(STORAGE_KEY_REFERRALS, updated);
    return newRef;
  },

  respondInternalReferral(referralId, { responseNotes, responderName, newStatus = 'COMPLETED' }) {
    const current = getStorage(STORAGE_KEY_REFERRALS, DEFAULT_INTERNAL_REFERRALS);
    const updated = current.map(r => {
      if (r.id === referralId) {
        return {
          ...r,
          responseNotes,
          respondedBy: responderName,
          respondedAt: new Date().toISOString(),
          status: newStatus
        };
      }
      return r;
    });
    setStorage(STORAGE_KEY_REFERRALS, updated);
    return updated.find(r => r.id === referralId);
  },

  // ─────────────────────────────────────────────────────────────
  // 3. DOCTOR CREDENTIAL / SIP-STR EXPIRATION CHECKER
  // ─────────────────────────────────────────────────────────────
  checkDoctorCredentials(doctorProfile) {
    // Default simulated doctor profile if not provided
    const doc = doctorProfile || {
      name: 'dr. Budi Santoso, Sp.B',
      strNumber: '31.1.1.100.2.21.145892',
      strExpiryDate: '2026-10-31', // Expiring in ~1.5 months
      sipNumber: '503/SIP-D/DPMPTSP/2021/449',
      sipExpiryDate: '2026-11-15'  // Expiring in ~2 months
    };

    const now = new Date();
    const alerts = [];

    // Check STR
    if (doc.strExpiryDate) {
      const expiry = new Date(doc.strExpiryDate);
      const diffTime = expiry.getTime() - now.getTime();
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.4375));
      
      if (diffMonths <= 0) {
        alerts.push({
          type: 'STR',
          number: doc.strNumber,
          isExpired: true,
          monthsRemaining: 0,
          expiryDate: doc.strExpiryDate,
          message: `STR Anda dengan nomor ${doc.strNumber} telah kadaluarsa pada ${doc.strExpiryDate}. Mohon lakukan perpanjangan KKI segera!`
        });
      } else if (diffMonths <= 3) {
        alerts.push({
          type: 'STR',
          number: doc.strNumber,
          isExpired: false,
          monthsRemaining: diffMonths,
          expiryDate: doc.strExpiryDate,
          message: `STR Anda dengan nomor ${doc.strNumber} akan berakhir dalam ${diffMonths} bulan kedepan (${doc.strExpiryDate}). Mohon melakukan pengurusan segera!`
        });
      }
    }

    // Check SIP
    if (doc.sipExpiryDate) {
      const expiry = new Date(doc.sipExpiryDate);
      const diffTime = expiry.getTime() - now.getTime();
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.4375));
      
      if (diffMonths <= 0) {
        alerts.push({
          type: 'SIP',
          number: doc.sipNumber,
          isExpired: true,
          monthsRemaining: 0,
          expiryDate: doc.sipExpiryDate,
          message: `SIP Anda dengan nomor ${doc.sipNumber} telah kadaluarsa pada ${doc.sipExpiryDate}. Pelayanan klinis wajib didukung izin aktif!`
        });
      } else if (diffMonths <= 3) {
        alerts.push({
          type: 'SIP',
          number: doc.sipNumber,
          isExpired: false,
          monthsRemaining: diffMonths,
          expiryDate: doc.sipExpiryDate,
          message: `SIP Anda dengan nomor ${doc.sipNumber} akan berakhir dalam ${diffMonths} bulan kedepan (${doc.sipExpiryDate}). Mohon melakukan pengurusan ke Dinkes/PTSP segera!`
        });
      }
    }

    return {
      hasAlert: alerts.length > 0,
      alerts,
      doctorName: doc.name
    };
  },

  // ─────────────────────────────────────────────────────────────
  // 4. RESEP ONLINE COUNTER & SHIFT CALCULATION
  // ─────────────────────────────────────────────────────────────
  getPendingOnlinePrescriptionsCount() {
    return 4; // Simulated 4 pending e-prescriptions awaiting dispensing
  },

  getCurrentHospitalShift() {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 7 && hour < 14) {
      return { shift: 'PAGI', label: 'Shift Pagi (07:00 - 14:00 WIB)', color: 'text-amber-400' };
    } else if (hour >= 14 && hour < 21) {
      return { shift: 'SIANG', label: 'Shift Siang (14:00 - 21:00 WIB)', color: 'text-cyan-400' };
    } else {
      return { shift: 'MALAM', label: 'Shift Malam (21:00 - 07:00 WIB)', color: 'text-purple-400' };
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 5. WORKLIST RAWAT JALAN & RAWAT INAP DATA
  // ─────────────────────────────────────────────────────────────
  getOutpatientWorklist(filter = {}) {
    const list = [
      {
        id: 'RJ-001',
        queueNo: 'A-01',
        mrn: 'MRN-2026-0811',
        patientName: 'Ny. Siti Rahmawati',
        dob: '1985-04-12',
        gender: 'P',
        clinic: 'Poli Penyakit Dalam',
        doctor: 'dr. Alexander, Sp.PD',
        arrivalTime: '08:15',
        status: 'SEDANG_DIPERIKSA', // MENUNGGU | SEDANG_DIPERIKSA | SELESAI | DIRUJUK
        vitals: { td: '120/80', hr: '82', rr: '20', spo2: '98%', temp: '36.8' },
        chiefComplaint: 'Batuk berdahak 4 hari disertai demam naik turun',
        paymentMethod: 'BPJS Kesehatan'
      },
      {
        id: 'RJ-002',
        queueNo: 'A-02',
        mrn: 'MRN-2026-0922',
        patientName: 'Tn. Budi Pratama',
        dob: '1978-11-23',
        gender: 'L',
        clinic: 'Poli Bedah Umum',
        doctor: 'dr. Budi Santoso, Sp.B',
        arrivalTime: '08:30',
        status: 'MENUNGGU',
        vitals: { td: '135/85', hr: '76', rr: '18', spo2: '99%', temp: '36.5' },
        chiefComplaint: 'Kontrol jahitan luka operasi hernia post-op hari ke-7',
        paymentMethod: 'Umum / Mandiri'
      },
      {
        id: 'RJ-003',
        queueNo: 'A-03',
        mrn: 'MRN-2026-1045',
        patientName: 'An. Daffa Maulana',
        dob: '2019-06-15',
        gender: 'L',
        clinic: 'Poli Anak',
        doctor: 'dr. Indah Permata, Sp.A',
        arrivalTime: '08:45',
        status: 'MENUNGGU',
        vitals: { td: '100/65', hr: '105', rr: '24', spo2: '99%', temp: '38.2' },
        chiefComplaint: 'Demam tinggi 3 hari, mual, nafsu makan berkurang drastis',
        paymentMethod: 'BPJS Kesehatan'
      },
      {
        id: 'RJ-004',
        queueNo: 'A-04',
        mrn: 'MRN-2026-0567',
        patientName: 'Ibu Maria Ulfah',
        dob: '1992-09-03',
        gender: 'P',
        clinic: 'Poli Kebidanan & Kandungan',
        doctor: 'dr. Hendro, Sp.OG',
        arrivalTime: '09:00',
        status: 'SELESAI',
        vitals: { td: '115/75', hr: '80', rr: '18', spo2: '99%', temp: '36.6' },
        chiefComplaint: 'Pemeriksaan USG antenatal kehamilan trimester ke-3 (32 minggu)',
        paymentMethod: 'Asuransi Swasta'
      },
      {
        id: 'RJ-005',
        queueNo: 'A-05',
        mrn: 'MRN-2026-1210',
        patientName: 'Tn. Hendra Gunawan',
        dob: '1965-02-18',
        gender: 'L',
        clinic: 'Poli Jantung & Pembuluh Darah',
        doctor: 'dr. Anita Wijaya, Sp.JP(K)',
        arrivalTime: '09:15',
        status: 'DIRUJUK',
        vitals: { td: '150/95', hr: '92', rr: '22', spo2: '96%', temp: '36.7' },
        chiefComplaint: 'Nyeri dada saat aktivitas fisik memberat 2 hari terakhir',
        paymentMethod: 'BPJS Kesehatan'
      }
    ];

    let res = list;
    if (filter.clinic && filter.clinic !== 'ALL') {
      res = res.filter(item => item.clinic === filter.clinic);
    }
    if (filter.status && filter.status !== 'ALL') {
      res = res.filter(item => item.status === filter.status);
    }
    return res;
  },

  getInpatientWorklist(filter = {}) {
    const list = [
      {
        id: 'RI-001',
        ward: 'Bangsal Melati',
        room: 'Kamar 201',
        bed: 'Bed A',
        classType: 'Kelas I',
        mrn: 'MRN-2026-0811',
        patientName: 'Ny. Siti Rahmawati',
        dob: '1985-04-12',
        gender: 'P',
        dpjp: 'dr. Alexander, Sp.PD',
        admissionDate: '2026-09-07',
        los: 3, // days
        diagnosis: 'DHF Grade II, Efusi Pleura Kanan Minima',
        acuityScore: 2, // EWS Score
        acuityLevel: 'LOW_RISK',
        cpptStatusToday: 'SUDAH_VISITE',
        pendingOrders: 1
      },
      {
        id: 'RI-002',
        ward: 'Bangsal Melati',
        room: 'Kamar 202',
        bed: 'Bed B',
        classType: 'Kelas II',
        mrn: 'MRN-2026-0922',
        patientName: 'Tn. Budi Pratama',
        dob: '1978-11-23',
        gender: 'L',
        dpjp: 'dr. Budi Santoso, Sp.B',
        admissionDate: '2026-09-08',
        los: 2,
        diagnosis: 'Post-Op Laparotomi Apendisitis Perforasi H-1',
        acuityScore: 4,
        acuityLevel: 'MEDIUM_RISK',
        cpptStatusToday: 'BELUM_VISITE',
        pendingOrders: 3
      },
      {
        id: 'RI-003',
        ward: 'Intensive Care Unit (ICU)',
        room: 'Bed ICU-03',
        bed: 'Bed 03',
        classType: 'Intensif',
        mrn: 'MRN-2026-1188',
        patientName: 'Tn. Agus Salim',
        dob: '1959-08-10',
        gender: 'L',
        dpjp: 'dr. Faisal Bahar, Sp.P(K)',
        admissionDate: '2026-09-05',
        los: 5,
        diagnosis: 'ARDS Berat, Sepsis ec Pneumonia Komunitas, Terintubasi',
        acuityScore: 8,
        acuityLevel: 'HIGH_RISK',
        cpptStatusToday: 'SUDAH_VISITE',
        pendingOrders: 5
      },
      {
        id: 'RI-004',
        ward: 'Paviliun Garuda',
        room: 'Suite 501',
        bed: 'VIP Bed',
        classType: 'VVIP',
        mrn: 'MRN-2026-0567',
        patientName: 'Ibu Maria Ulfah',
        dob: '1992-09-03',
        gender: 'P',
        dpjp: 'dr. Hendro, Sp.OG',
        admissionDate: '2026-09-09',
        los: 1,
        diagnosis: 'Post-Sectio Caesarea Elektif Hari ke-1',
        acuityScore: 1,
        acuityLevel: 'LOW_RISK',
        cpptStatusToday: 'SUDAH_VISITE',
        pendingOrders: 0
      },
      {
        id: 'RI-005',
        ward: 'Bangsal Bougenville',
        room: 'Kamar 104',
        bed: 'Bed C',
        classType: 'Kelas III',
        mrn: 'MRN-2026-1304',
        patientName: 'Tn. Joko Susilo',
        dob: '1971-12-05',
        gender: 'L',
        dpjp: 'dr. Anita Wijaya, Sp.JP(K)',
        admissionDate: '2026-09-08',
        los: 2,
        diagnosis: 'NSTEMI Akut, Hipertensi Urgensi',
        acuityScore: 5,
        acuityLevel: 'MEDIUM_RISK',
        cpptStatusToday: 'BELUM_VISITE',
        pendingOrders: 2
      }
    ];

    let res = list;
    if (filter.ward && filter.ward !== 'ALL') {
      res = res.filter(item => item.ward === filter.ward);
    }
    if (filter.status && filter.status !== 'ALL') {
      res = res.filter(item => item.cpptStatusToday === filter.status);
    }
    return res;
  },

  // ─────────────────────────────────────────────────────────────
  // 6. LAPORAN BULANAN UGD & GAWAT DARURAT DATA
  // ─────────────────────────────────────────────────────────────
  getMonthlyUgdReport(month = '2026-08') {
    return {
      period: month,
      periodLabel: 'Agustus 2026',
      totalVisits: 1482,
      averageResponseTimeMinutes: 3.8, // Menit
      cprSuccessRate: '91.2%',
      triageBreakdown: [
        { level: 'Level 1 (Resusitasi)', count: 48, percentage: 3.2, color: 'bg-rose-600', text: 'text-rose-400' },
        { level: 'Level 2 (Emergency / P1)', count: 215, percentage: 14.5, color: 'bg-orange-500', text: 'text-orange-400' },
        { level: 'Level 3 (Urgent / P2)', count: 684, percentage: 46.2, color: 'bg-amber-500', text: 'text-amber-400' },
        { level: 'Level 4 (Semi Urgent / P3)', count: 395, percentage: 26.7, color: 'bg-emerald-500', text: 'text-emerald-400' },
        { level: 'Level 5 (Non Urgent / P4)', count: 140, percentage: 9.4, color: 'bg-blue-500', text: 'text-blue-400' }
      ],
      dispositionBreakdown: [
        { label: 'Rawat Inap (Admisi)', count: 412, percentage: 27.8 },
        { label: 'Rawat Jalan / Pulang Membaik', count: 980, percentage: 66.1 },
        { label: 'Dirujuk Keluar (Faskes Lanjutan)', count: 62, percentage: 4.2 },
        { label: 'Meninggal < 48 Jam (DOA / IGD)', count: 18, percentage: 1.2 },
        { label: 'PAPS (Pulang Atas Permintaan Sendiri)', count: 10, percentage: 0.7 }
      ],
      top10Diagnoses: [
        { rank: 1, icd10: 'A09.9', name: 'Gastroenteritis dan Kolitis Akut', count: 145 },
        { rank: 2, icd10: 'J18.9', name: 'Pneumonia Komunitas Tidak Spesifik', count: 122 },
        { rank: 3, icd10: 'I10', name: 'Hipertensi Esensial (Krisis/Urgensi)', count: 98 },
        { rank: 4, icd10: 'A91', name: 'Demam Berdarah Dengue (DHF)', count: 94 },
        { rank: 5, icd10: 'I21.9', name: 'Infark Miokard Akut (STEMI / NSTEMI)', count: 86 },
        { rank: 6, icd10: 'S06.0', name: 'Cedera Kepala Ringan (KLL)', count: 75 },
        { rank: 7, icd10: 'E11.65', name: 'Diabetes Melitus Tipe 2 dengan Hiperglikemia Akut', count: 64 },
        { rank: 8, icd10: 'K35.80', name: 'Apendisitis Akut', count: 58 },
        { rank: 9, icd10: 'J45.901', name: 'Asma Bronkial dalam Serangan Akut', count: 52 },
        { rank: 10, icd10: 'N39.0', name: 'Infeksi Saluran Kemih Akut', count: 48 }
      ]
    };
  },

  // ─────────────────────────────────────────────────────────────
  // 7. COMPREHENSIVE OUTPATIENT PATIENT EXAMINATION WORKSPACE
  // ─────────────────────────────────────────────────────────────
  getDepartmentList() {
    return [
      { id: 'MED-UGD', name: 'Instalasi Gawat Darurat (UGD)' },
      { id: 'MED-POLI-INTERNIS', name: 'Poli Penyakit Dalam' },
      { id: 'MED-POLI-ANAK', name: 'Poli Anak' },
      { id: 'MED-POLI-BEDAH', name: 'Poli Bedah Umum' },
      { id: 'MED-POLI-KEBIDANAN', name: 'Poli Kebidanan & Kandungan' },
      { id: 'MED-POLI-JANTUNG', name: 'Poli Jantung & Pembuluh Darah' },
      { id: 'MED-POLI-SARAF', name: 'Poli Saraf / Neurologi' },
      { id: 'MED-POLI-MATA', name: 'Poli Mata' },
      { id: 'MED-POLI-THT', name: 'Poli THT' },
      { id: 'MED-POLI-GIGI', name: 'Poli Gigi & Mulut' },
      { id: 'MED-POLI-PARU', name: 'Poli Paru' },
      { id: 'MED-POLI-KULIT', name: 'Poli Kulit & Kelamin' },
      { id: 'MCU', name: 'Medical Check Up (MCU)' },
      { id: 'MED-HAEMODIALISA', name: 'Hemodialisa' }
    ];
  },

  getPayersList() {
    return [
      { id: 'BPJS', name: 'BPJS Kesehatan' },
      { id: 'UMUM', name: 'Pasien Umum / Mandiri' },
      { id: 'ADM', name: 'AdMedika' },
      { id: 'INHEALTH', name: 'Mandiri Inhealth' },
      { id: 'GARDA', name: 'Garda Medika (Astra Buana)' },
      { id: 'ALLIANZ', name: 'Allianz Life Indonesia' },
      { id: 'PRUDENTIAL', name: 'Prudential Life Assurance' },
      { id: 'BNI-LIFE', name: 'BNI Life Insurance' },
      { id: 'AXA', name: 'AXA Mandiri / AXA Insurance' }
    ];
  },

  getExaminationDetail(regId = 'P260907814') {
    const STORAGE_KEY_EXAM = `nurseflow_emr_exam_${regId}`;
    const defaultData = {
      regId: regId || 'P260907814',
      mrn: '00360110',
      patientName: 'Tn. Budi Pratama',
      dob: '1978-11-23',
      age: '47 Thn 9 Bln',
      gender: 'L',
      religion: 'Islam',
      departmentId: 'MED-UGD',
      departmentName: 'Instalasi Gawat Darurat (UGD)',
      doctorName: 'dr. Hanifia Hanum',
      doctorId: 'drhanifia',
      payerName: 'BPJS Kesehatan (PBI)',
      payerId: 'BPJS',
      queueNo: 'A-02',
      isDischarged: false,
      isComplexPatient: false,
      antenatal: { gpa: 'G0 P0 A0', hpht: '-' },
      jointCare: null,
      allergies: [],
      vaccines: [
        { id: 'VAC-1', name: 'Vaksin Covid-19 Dosis 1 - Sinovac', date: '2022-03-15', provider: 'Puskesmas', notes: 'Tanpa KIPI' },
        { id: 'VAC-2', name: 'Vaksin Covid-19 Dosis 2 - Sinovac', date: '2022-04-12', provider: 'Puskesmas', notes: 'Tanpa KIPI' }
      ],
      workingDiagnosis: 'Obs. Febris H-4 ec Susp. DHF Grade II',
      primaryDiagnosis: 'A91 - Dengue haemorrhagic fever',
      secondaryDiagnoses: [
        'R50.9 - Fever, unspecified',
        'K29.7 - Gastritis, unspecified'
      ],
      clinicalMarkers: ['Risiko Jatuh Rendah', 'Alergi (-)'],
      assessments: [
        { id: 'ASM-1', date: '10-09-2026 / 09:20', practitioner: 'Riska Anggraeni, S.Kep., Ners', title: 'Catatan Terintegrasi (CPPT Perawat)', type: 'CPPT' },
        { id: 'ASM-2', date: '10-09-2026 / 09:01', practitioner: 'iif syarifah nur, A.Md.Kep', title: 'Pengkajian Unit Gawat Darurat (UGD)', type: 'PENGKAJIAN_UGD' },
        { id: 'ASM-3', date: '10-09-2026 / 08:32', practitioner: 'dr. Hanifia Hanum', title: 'Pengkajian Dokter Unit Gawat Darurat (UGD)', type: 'PENGKAJIAN_DOKTER' }
      ],
      medicalProfile: [
        { date: '03-09-2025', regId: 'P250902778', clinic: 'UGD', diagnosis: 'Febris Akut ec Viral Infection', procedure: 'Infus RL 500ml, Inj. Paracetamol IV', therapy: 'Paracetamol Tab 500mg 3x1, Vit C 500mg', diagnostic: 'Darah Rutin (Hb 14.1, Leu 7.200, Plt 198.000)' },
        { date: '17-03-2024', regId: 'P240310905', clinic: 'UGD', diagnosis: 'Gastritis Erosif Akut', procedure: 'Inj. Omeprazole 40mg IV, Inj. Ondansetron 4mg IV', therapy: 'Omeprazole 20mg 2x1, Sucralfat Susp 3x1 C', diagnostic: 'EKG 12-Lead Normal' },
        { date: '19-09-2023', regId: 'P230912040', clinic: 'PSS Alergi Imunologi Anak', diagnosis: 'Rhinitis Alergi Persisten Ringan', procedure: 'Skin Prick Test (Alergen Debu +2)', therapy: 'Cetirizine Syr 5mg 1x1, Mometasone Nasal Spray', diagnostic: 'IgE Total Serum (185 IU/ml)' }
      ],
      laboratoryResults: [
        { id: 'LAB-1', parameter: 'Hemoglobin', value: '13.2', unit: 'g/dL', normal: '13.0 - 17.5', status: 'NORMAL' },
        { id: 'LAB-2', parameter: 'Hematokrit', value: '44.0', unit: '%', normal: '40.0 - 52.0', status: 'NORMAL' },
        { id: 'LAB-3', parameter: 'Leukosit', value: '3.400', unit: '/uL', normal: '5.000 - 10.000', status: 'LOW' },
        { id: 'LAB-4', parameter: 'Trombosit', value: '88.000', unit: '/uL', normal: '150.000 - 450.000', status: 'CRITICAL' },
        { id: 'LAB-5', parameter: 'Eritrosit', value: '4.8', unit: '10^6/uL', normal: '4.5 - 5.9', status: 'NORMAL' },
        { id: 'LAB-6', parameter: 'Dengue NS1 Antigen', value: 'POSITIF (Reaktif)', unit: '', normal: 'Negatif', status: 'ABNORMAL' }
      ],
      radiologyResults: [
        { id: 'RAD-1', study: 'Foto Thorax AP/PA', date: '10-09-2026', impression: 'Cor & Pulmo dalam batas normal. Sinus costophrenicus kanan tumpul minimal (curiga efusi pleura subklinis).', doctor: 'dr. Hendra Setiawan, Sp.Rad', status: 'SELESAI' }
      ],
      onlinePrescriptions: [
        { id: 'RX-1', date: '10-09-2026 09:30', name: 'Paracetamol Infus 1000mg/100ml', instructions: '1 Fls IV bila suhu > 38.5 C (k/p demam)', quantity: '2 Kolf', type: 'REGULER', status: 'TERKIRIM' },
        { id: 'RX-2', date: '10-09-2026 09:30', name: 'Cairan Ringer Laktat (RL) 500ml', instructions: 'IVFD 20 tetes/menit makro', quantity: '4 Kolf', type: 'REGULER', status: 'TERKIRIM' },
        { id: 'RX-3', date: '10-09-2026 09:35', name: 'Sucralfate Suspensi 500mg/5ml', instructions: '3 x 1 sendok makan (15 ml) ac', quantity: '1 Botol', type: 'REGULER', status: 'TERKIRIM' }
      ],
      referrals: [
        { id: 'REF-1', date: '10-09-2026', target: 'Laboratorium Sentral', description: 'Monitoring Seri Trombosit & Hematokrit serial per 12 jam', cito: true, status: 'MENUNGGU' }
      ],
      examinationHistory: [
        { id: 1, date: '03-09-2025 21:26', examiner: 'Marianus Alfonsus R. Hurint', examName: 'Pengkajian Unit Gawat Darurat (UGD)' },
        { id: 2, date: '03-09-2025 20:15', examiner: 'dr. Astari Febyane Putri', examName: 'Pengkajian Unit Gawat Darurat (UGD)' },
        { id: 3, date: '17-03-2024 09:09', examiner: 'iif syarifah nur', examName: 'Pengkajian Unit Gawat Darurat (UGD)' },
        { id: 4, date: '17-03-2024 08:52', examiner: 'dr. Esther Damayanti', examName: 'Pengkajian Unit Gawat Darurat (UGD)' },
        { id: 5, date: '19-09-2023 09:21', examiner: 'desi yuniarti', examName: 'Pemeriksaan Rawat Jalan → PSS ALERGI IMUNOLOGI ANAK (dr. Isman Jafar, Sp.A(K))' },
        { id: 6, date: '12-09-2023 09:48', examiner: 'Lince Romatua', examName: 'Pemeriksaan Rawat Jalan → PSS ALERGI IMUNOLOGI ANAK (dr. Isman Jafar, Sp.A(K))' },
        { id: 7, date: '24-01-2023 09:37', examiner: 'ferawaty gurning', examName: 'Pemeriksaan Rawat Jalan → PSS ALERGI IMUNOLOGI ANAK' },
        { id: 8, date: '05-01-2023 13:54', examiner: 'Lince Romatua', examName: 'Pemeriksaan Rawat Jalan → PS ANAK (dr. Ali Syaugi, Sp.A)' },
        { id: 9, date: '01-01-2023 17:12', examiner: 'dr. Gianta Dharma', examName: 'Catatan Terintegrasi' },
        { id: 10, date: '01-01-2023 15:33', examiner: 'Tinta Indarti', examName: 'Resume Keperawatan' }
      ],
      controlSchedules: [
        { id: 'CTL-1', controlDate: '2026-09-13', clinic: 'Poli Penyakit Dalam', doctor: 'dr. Alexander, Sp.PD', notes: 'Kontrol evaluasi trombosit & perbaikan klinis post-DHF H-7' }
      ],
      scannedExternalDocs: [
        { id: 'SCN-1', category: 'Lain-Lain (UGD)', date: '02-01-2023', fileName: 'IMG20230102_00360110_20230102_113412.pdf', size: '1.2 MB' },
        { id: 'SCN-2', category: 'Lain-Lain (UGD)', date: '25-09-2021', fileName: 'img078_00360110_20210925_160735.pdf', size: '2.4 MB' },
        { id: 'SCN-3', category: 'Edukasi Pasien', date: '17-03-2024', fileName: 'MED-UGD_EDUKASI_20240317_081041.pdf', size: '850 KB' },
        { id: 'SCN-4', category: 'Lain-Lain (UGD)', date: '03-09-2025', fileName: 'MED-UGD_LainLain_20250903_120606.pdf', size: '1.5 MB' }
      ],
      medicalLetters: [
        { id: 'SK-1', number: '445/SKD/RSUP/IX/2026/0122', type: 'Surat Keterangan Sakit (Istirahat)', date: '10-09-2026', doctor: 'dr. Hanifia Hanum', duration: '3 Hari (10 s.d. 12 September 2026)', statusTte: 'TERTANDATANGAN_ELEKTRONIK', tteSignId: 'TTE-20260910-881' }
      ],
      icareJkn: {
        bpjsNumber: '0001889218291',
        status: 'AKTIF (PBI APBN)',
        faskesTingkat1: 'Puskesmas Kebayoran Lama (Kode: 0115B001)',
        riwayatKunjunganFktp: '15-08-2026 - Febris 3 Hari (Terapi: Paracetamol 500mg, Amoxicillin 500mg)',
        riwayatKronisPrb: 'Hipertensi Terkontrol (Amlodipine 5mg 1x1)'
      }
    };

    return getStorage(STORAGE_KEY_EXAM, defaultData);
  },

  updateExaminationDetail(regId, updates) {
    const current = this.getExaminationDetail(regId);
    const merged = { ...current, ...updates };
    const STORAGE_KEY_EXAM = `nurseflow_emr_exam_${regId}`;
    setStorage(STORAGE_KEY_EXAM, merged);
    return merged;
  },

  searchPatientsComprehensive(criteria = {}) {
    // Search across registered outpatient list and return matches
    const list = this.getOutpatientWorklist();
    let results = list;

    if (criteria.regId) {
      const q = criteria.regId.toLowerCase();
      results = results.filter(p => (p.regId || `P260907814-${p.id}`).toLowerCase().includes(q));
    }
    if (criteria.mrn) {
      const q = criteria.mrn.toLowerCase();
      results = results.filter(p => (p.mrn || '').toLowerCase().includes(q));
    }
    if (criteria.name) {
      const q = criteria.name.toLowerCase();
      results = results.filter(p => (p.patientName || '').toLowerCase().includes(q));
    }
    if (criteria.departmentId && criteria.departmentId !== '') {
      results = results.filter(p => p.clinic === criteria.departmentId || p.departmentId === criteria.departmentId);
    }
    if (criteria.payerId && criteria.payerId !== '') {
      results = results.filter(p => (p.paymentMethod || '').toLowerCase().includes(criteria.payerId.toLowerCase()));
    }

    return results;
  }
};

