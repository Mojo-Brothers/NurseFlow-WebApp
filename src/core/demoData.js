/**
 * Enterprise JCI Demo Data Generator for NurseFlow HIS
 * 100 High-Fidelity Patient Records & Encounters (Indonesia Enterprise Medical Data)
 * Replaces old legacy demo data completely.
 */

const INDONESIAN_NAMES_FEMALE = [
  'Siti Nurhaliza', 'Ratna Sari Dewi', 'Sri Mulyani', 'Dian Sastrowardoyo', 'Najwa Shihab',
  'Aisyah Putri', 'Retno Marsudi', 'Rina Nose', 'Kartini Rahayu', 'Indah Permatasari',
  'Nia Ramadhani', 'Titi Kamal', 'Raisa Andriana', 'Isyana Sarasvati', 'Laudya Cynthia',
  'Maudy Ayunda', 'Bunga Citra', 'Agnez Monica', 'Chelsea Islan', 'Pevita Pearce',
  'Yuni Shara', 'Krisdayanti', 'Rossa Roslaina', 'Inul Daratista', 'Desy Ratnasari',
  'Venna Melinda', 'Arzetti Bilbina', 'Sophia Latjuba', 'Tamara Bleszynski', 'Ersa Mayori',
  'Cut Tari', 'Luna Maya', 'Melaney Ricardo', 'Ayu Dewi', 'Olla Ramlan',
  'Zaskia Adya', 'Shireen Sungkar', 'Zaskia Sungkar', 'Citra Kirana', 'Marshanda',
  'Nabila Syakieb', 'Gita Gutawa', 'Sherina Munaf', 'Tasya Kamila', 'Cinta Laura',
  'Alyssa Soebandono', 'Mikha Tambayong', 'Velove Vexia', 'Asmirandah', 'Ririn Dwi'
];

const INDONESIAN_NAMES_MALE = [
  'Bambang Pamungkas', 'Budi Gunawan', 'Agus Harimurti', 'Nicholas Saputra', 'Ahmad Dhani',
  'Hendra Setiawan', 'Reza Rahadian', 'Raffi Ahmad', 'Deddy Corbuzier', 'Sule Sutisna',
  'Andre Taulany', 'Parto Patrio', 'Denny Cagur', 'Raditya Dika', 'Ernest Prakasa',
  'Iko Uwais', 'Joe Taslim', 'Chico Jericho', 'Vino G. Bastian', 'Abimana Aryasatya',
  'Rio Dewanto', 'Gading Marten', 'Andhika Pratama', 'Irfan Hakim', 'Boy William',
  'Daniel Mananta', 'Arie Untung', 'Teuku Wisnu', 'Irwansyah', 'Dude Harlino',
  'Christian Sugiono', 'Ringgo Agus', 'Desta Mahendra', 'Vincent Rompies', 'Tora Sudiro',
  'Amara Zanette', 'Indra Bekti', 'Uya Kuya', 'Anang Hermansyah', 'Judika Sihotang',
  'Afgan Syahreza', 'Vidi Aldiano', 'Marcell Siahaan', 'Glenn Fredly', 'Once Mekel',
  'Ari Lasso', 'Kaka Slank', 'Bimbim Slank', 'Ahmad Albar', 'Rhoma Irama'
];

const DEPARTMENTS = [
  { name: 'Poli Penyakit Dalam (Lantai 2)', type: 'OUTPATIENT', doctor: 'dr. Siti Wijaya, Sp.PD', email: 'siti.wijaya@hospital.com' },
  { name: 'Poli Bedah Umum & Digestif (Lantai 2)', type: 'OUTPATIENT', doctor: 'Dr. Robby Viory, Sp.B', email: 'robby.viory@hospital.com' },
  { name: 'Poli Anak & Tumbuh Kembang (Lantai 3)', type: 'OUTPATIENT', doctor: 'dr. Ahmad Hidayat, Sp.A', email: 'ahmad.hidayat@hospital.com' },
  { name: 'Poli Kebidanan & Kandungan (Lantai 2)', type: 'OUTPATIENT', doctor: 'dr. Maya Indah, Sp.OG', email: 'maya.indah@hospital.com' },
  { name: 'Poli Jantung & Pembuluh Darah (Lantai 3)', type: 'OUTPATIENT', doctor: 'dr. Hendra Gunawan, Sp.JP', email: 'hendra.gunawan@hospital.com' },
  { name: 'Poli Saraf & Neurologi (Lantai 2)', type: 'OUTPATIENT', doctor: 'dr. Anisa Putri, Sp.S', email: 'anisa.putri@hospital.com' },
  { name: 'Poli Mata (Lantai 3)', type: 'OUTPATIENT', doctor: 'dr. Rina Melati, Sp.M', email: 'rina.melati@hospital.com' },
  { name: 'Poli THT-KL (Lantai 3)', type: 'OUTPATIENT', doctor: 'dr. Budi Santoso, Sp.THT', email: 'budi.santoso@hospital.com' },
  { name: 'UGD & Unit Gawat Darurat (Zona Merah)', type: 'EMERGENCY', doctor: 'dr. Farhan Malik, Sp.An (KIC)', email: 'farhan.malik@hospital.com' },
  { name: 'Ruang Perawatan Chrysant (Kamar 302)', type: 'INPATIENT', doctor: 'Dr. Robby Viory, Sp.B', email: 'robby.viory@hospital.com' },
  { name: 'Ruang Perawatan Orchid (Kamar 205)', type: 'INPATIENT', doctor: 'dr. Siti Wijaya, Sp.PD', email: 'siti.wijaya@hospital.com' },
  { name: 'Ruang VIP President Suite (Kamar 501)', type: 'INPATIENT', doctor: 'dr. Hendra Gunawan, Sp.JP', email: 'hendra.gunawan@hospital.com' },
];

const COMPLAINTS = [
  'Nyeri dada pasca aktivitas fisik, sesak napas ringan, riwayat hipertensi 5 tahun.',
  'Demam tinggi 38.5°C sejak 3 hari disertai mual, muntah, dan mialgia seluruh tubuh.',
  'Sesak napas mendadak serangan asma bronkial, batuk berdahak putih kental.',
  'Nyeri perut kanan bawah tajam mendadak sejak 6 jam lalu, mual & anoreksia.',
  'Kontrol rutin Hipertensi & Diabetes Mellitus Tipe 2, lemas, BAK sering malam hari.',
  'Evaluasi pasca operasi SC H+3, luka terawat kering, nyeri luka operasi skala 3/10.',
  'Pusing berputar (vertigo posisional) disertai mual saat perubahan posisi kepala.',
  'Nyeri tenggorokan saat menelan (odinfagia), demam sumeng-sumeng 2 hari.',
  'Mata merah gatal & berair pada kedua mata sejak kemarin pagi, pandangan agak kabur.',
  'Benjolan keras di payudara kiri tanpa nyeri, evaluasi USG Mammae & Biopsi.',
  'Cedera pergelangan kaki kanan pasca tergelincir, bengkak & nyeri tekan lokal.',
  'Diare cair 5-6 kali sehari, lemas, dehidrasi ringan pasca konsumsi makanan pedas.'
];

const GUARANTORS = [
  'BPJS Kesehatan (PBI)',
  'BPJS Kesehatan (NON-PBI Kelas 1)',
  'BPJS Kesehatan (NON-PBI Kelas 2)',
  'Asuransi Mandiri Inhealth',
  'Asuransi Prudential Syariah',
  'Asuransi AXA Mandiri Platinum',
  'Umum / Mandiri Cash'
];

const ALLERGIES_LIST = [
  [{ type: 'DRUG', agent: 'Amoxicillin / Penicillin', reaction: 'Angioedema & Rash', severity: 'SEVERE' }],
  [{ type: 'FOOD', agent: 'Kepiting / Udang', reaction: 'Urtikaria Ringan', severity: 'MILD' }],
  [{ type: 'DRUG', agent: 'Ciprofloxacin', reaction: 'Mual & Ruam Kulit', severity: 'MODERATE' }],
  [{ type: 'DRUG', agent: 'Aspirin / NSAID', reaction: 'Bronkospasme & Gatal', severity: 'SEVERE' }],
  [{ type: 'FOOD', agent: 'Kacang Tanah', reaction: 'Anafilaksis Ringan', severity: 'MODERATE' }],
  []
];

function generate100Patients() {
  const patients = [];
  const encounters = [];

  for (let i = 1; i <= 100; i++) {
    const isFemale = i % 2 === 1;
    const nameList = isFemale ? INDONESIAN_NAMES_FEMALE : INDONESIAN_NAMES_MALE;
    const rawName = nameList[(i - 1) % nameList.length];
    const prefix = isFemale ? (i % 4 === 1 ? 'Ny. ' : i % 4 === 3 ? 'An. ' : 'Sdri. ') : (i % 4 === 2 ? 'Tn. ' : 'An. ');
    const title = isFemale ? (i % 5 === 0 ? ', S.Pd' : i % 7 === 0 ? ', S.E' : '') : (i % 6 === 0 ? ', S.T' : i % 8 === 0 ? ', M.T' : '');
    const fullName = `${prefix}${rawName}${title}`;

    const mrn = String(100000 + i).slice(-6); // 001001 to 001100
    const nik = `32730${String(10000000000 + i * 1234567).slice(0, 11)}`;
    const ageYears = 18 + ((i * 7) % 65); // age 18 to 83
    const birthYear = 2026 - ageYears;
    const dob = `${birthYear}-0${(i % 9) + 1}-15`;

    const deptObj = DEPARTMENTS[(i - 1) % DEPARTMENTS.length];
    const guarantor = GUARANTORS[(i - 1) % GUARANTORS.length];
    const complaint = COMPLAINTS[(i - 1) % COMPLAINTS.length];
    const allergy = ALLERGIES_LIST[(i - 1) % ALLERGIES_LIST.length];

    const weight = 45 + ((i * 3) % 45);
    const height = 150 + ((i * 2) % 35);
    const systolic = 110 + ((i * 4) % 40);
    const diastolic = 70 + ((i * 2) % 25);
    const hr = 68 + ((i * 3) % 32);
    const temp = (36.3 + ((i % 15) * 0.1)).toFixed(1);
    const rr = 18 + (i % 6);

    const patientId = `demo-patient-${i}`;

    const statusOptions = ['IN_TREATMENT', 'PROSES_PULANG', 'DISCHARGED'];
    const encStatus = i % 5 === 0 ? 'PROSES_PULANG' : i % 7 === 0 ? 'DISCHARGED' : 'IN_TREATMENT';

    patients.push({
      id: patientId,
      name: fullName,
      mrn: mrn,
      nik: nik,
      phone: `0812${String(10000000 + i * 9876).slice(0, 8)}`,
      email: `${rawName.toLowerCase().replace(/\s+/g, '.')}${i}@gmail.com`,
      address: `Jl. Soekarno Hatta No. ${i * 3}, Buah Batu, Bandung`,
      city: 'Bandung',
      province: 'Jawa Barat, INDONESIA',
      gender: isFemale ? 'F' : 'M',
      dob: dob,
      blood_type: i % 4 === 0 ? 'O+' : i % 3 === 0 ? 'A+' : i % 2 === 0 ? 'B+' : 'O-',
      marital_status: i % 3 === 0 ? 'Menikah' : i % 2 === 0 ? 'Belum Menikah' : 'Cerai Hidup',
      religion: i % 5 === 0 ? 'Kristen Protestan' : i % 7 === 0 ? 'Katolik' : 'Islam',
      demographics: {
        gender: isFemale ? 'F' : 'M',
        dob: dob,
        pob: 'Bandung',
        religion: i % 5 === 0 ? 'Kristen Protestan' : i % 7 === 0 ? 'Katolik' : 'Islam',
        occupation: isFemale ? 'Wiraswasta / Ibu Rumah Tangga' : 'Karyawan Swasta',
        address: `Jl. Soekarno Hatta No. ${i * 3}, Buah Batu, Bandung`,
        city: 'Bandung',
        province: 'Jawa Barat, INDONESIA'
      },
      baseline_profile: {
        value: weight,
        chronic_flag: i % 3 === 0,
        last_updated: new Date().toISOString()
      },
      allergies: allergy,
      safety_flags: {
        fall_risk: i % 4 === 0 ? 'HIGH' : i % 3 === 0 ? 'MODERATE' : 'LOW',
        pressure_ulcer: 'LOW',
        isolation: 'NONE'
      },
      insurance: {
        type: guarantor.toLowerCase().includes('bpjs') ? 'bpjs' : 'mandiri',
        no: `00019${String(10000000 + i * 9876).slice(0, 7)}`,
        name: guarantor
      },
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 3600000 * i).toISOString(),
      registered_at: new Date(Date.now() - 3600000 * (i + 2)).toISOString(),
      is_demo: true
    });

    encounters.push({
      id: `ENC-RJ-2026-${String(i).padStart(3, '0')}`,
      patient_id: patientId,
      patient_name: fullName,
      type: deptObj.type,
      department: deptObj.name,
      doctor_name: deptObj.doctor,
      doctor_email: deptObj.email,
      guarantor: guarantor,
      admitted_at: { toDate: () => new Date(Date.now() - 3600000 * i) },
      status: encStatus,
      is_demo: true,
      triage_level: i % 10 === 0 ? 'RED' : i % 3 === 0 ? 'YELLOW' : 'GREEN',
      triage_score: i % 10 === 0 ? 'P1 - Resusitasi Cito' : i % 3 === 0 ? 'P2 - Urgensi Sedang' : 'P3 - Non-Urgensi',
      vitals: {
        bp: `${systolic}/${diastolic}`,
        hr: hr,
        temp: Number(temp),
        rr: rr,
        spo2: 98 + (i % 3),
        pain_scale: `${i % 6}/10 (NRS)`
      },
      chief_complaint: complaint
    });

    // Populate JCI-Certified Medical Records for each patient
    records.push({
      id: `rec-cppt-${patientId}`,
      patientId: patientId,
      patient_id: patientId,
      mrn: mrn,
      patientName: fullName,
      doctor: deptObj.doctor,
      doctor_name: deptObj.doctor,
      moduleName: 'SOAP NOTES (CPPT)',
      chapter: 'COP',
      title: 'Catatan CPPT & SOAP Perkembangan Pasien',
      status: 'SIGNED_VERIFIED',
      subjective: `Pasien ${fullName} mengeluhkan: ${complaint}`,
      objective: `TD: ${systolic}/${diastolic} mmHg, HR: ${hr} bpm, Temp: ${temp}°C, SpO2: 98%`,
      assessment: `Keluhan Terkontrol - Diagnosis Utama: ${complaint.split(',')[0]}`,
      plan: `Instruksi DPJP (${deptObj.doctor}): Terapi medikasi oral & evaluasi berkala 24 jam.`,
      digitalSignature: `JCI-VERIFIED-HASH-${mrn}-COP`,
      created_at: new Date(Date.now() - 3600000 * i).toISOString(),
      date: new Date(Date.now() - 3600000 * i).toISOString().replace('T', ' ').substring(0, 16)
    });

    records.push({
      id: `rec-aop-${patientId}`,
      patientId: patientId,
      patient_id: patientId,
      mrn: mrn,
      patientName: fullName,
      doctor: deptObj.doctor,
      doctor_name: deptObj.doctor,
      moduleName: 'PENGKAJIAN AWAL (AOP)',
      chapter: 'AOP',
      title: 'Pengkajian Awal Medis & Keperawatan JCI',
      status: 'SIGNED_VERIFIED',
      subjective: `Pengkajian awal admisi poliklinik / rawat jalan untuk ${fullName}.`,
      objective: `Status Fisiologis: GCS 15 (E4V5M6), Compos Mentis. Risiko Jatuh: ${i % 4 === 0 ? 'HIGH' : 'LOW'}.`,
      assessment: `Pasien Terbuka Untuk Perawatan Terpadu. Alergi Obat: ${allergy.length > 0 ? allergy[0].agent : 'Tidak Ada'}.`,
      plan: `Penetapan DPJP Utama: ${deptObj.doctor}. Edukasi Pasien & Keluarga (JCI PFR).`,
      digitalSignature: `JCI-VERIFIED-HASH-${mrn}-AOP`,
      created_at: new Date(Date.now() - 3600000 * (i + 1)).toISOString(),
      date: new Date(Date.now() - 3600000 * (i + 1)).toISOString().replace('T', ' ').substring(0, 16)
    });

    records.push({
      id: `rec-mmu-${patientId}`,
      patientId: patientId,
      patient_id: patientId,
      mrn: mrn,
      patientName: fullName,
      doctor: deptObj.doctor,
      doctor_name: deptObj.doctor,
      moduleName: 'ORDER RESEP / CPOE (MMU)',
      chapter: 'MMU',
      title: 'Resep Elektronik & Rekonsiliasi Obat JCI',
      status: 'SIGNED_VERIFIED',
      subjective: 'E-Prescribing CPOE Order',
      objective: 'Rx: Paracetamol 500mg 3x1 (No. X), Vitamin C 500mg 1x1 (No. X), Antasida Doen 3x1 (No. X)',
      assessment: 'Rekonsiliasi Obat Terverifikasi Tanpa Interaksi Obat Berbahaya',
      plan: 'Dispensing via Depo Farmasi & Edukasi Aturan Pakai Obat oleh Apoteker.',
      digitalSignature: `JCI-VERIFIED-HASH-${mrn}-MMU`,
      created_at: new Date(Date.now() - 3600000 * (i + 2)).toISOString(),
      date: new Date(Date.now() - 3600000 * (i + 2)).toISOString().replace('T', ' ').substring(0, 16)
    });
  }

  return { patients, encounters, records };
}

const { patients: GENERATED_PATIENTS, encounters: GENERATED_ENCOUNTERS, records: GENERATED_RECORDS } = generate100Patients();

export const DEMO_PATIENTS = GENERATED_PATIENTS;
export const DEMO_ENCOUNTERS = GENERATED_ENCOUNTERS;
export const DEMO_RECORDS = GENERATED_RECORDS;
