/**
 * patientMaster32Taxonomy.js
 * Comprehensive 32-Category Patient Master Data Taxonomy & Generator
 * Compliant with JCI SQE Standards & SATUSEHAT FHIR Specification.
 */

export const PATIENT_MASTER_32_CATEGORIES = [
  {
    id: '1_master_pasien',
    number: 1,
    title: '1. MASTER PASIEN (Patient Master)',
    desc: 'Identitas, IHS, NIK, Paspor, KITAS, Visa, Biodata, Demografi, Alamat KTP/Domisili, Kontak, Keluarga & File Identitas',
    category: 'Demografi & Identitas',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20',
    details: [
      'Identitas Pasien (MRN, IHS Number, NIK 16-Digit, Passport, KITAS, Visa, National Identifier, Old MRN, External MRN, UUID)',
      'Biodata (Nama Lengkap, Alias, Preferred Name, Nama Sebelum Menikah, Gelar, Gender, Gender Identity, Pronoun, Tempat/Tgl Lahir, Usia Otomatis, Status Hidup)',
      'Demografi (Agama, Etnis, Ras, Suku, Bahasa Utama/Kedua, Interpreter Needed, Pendidikan, Pekerjaan, Pendapatan, Status Ekonomi)',
      'Alamat Pasien (KTP, Domisili, Tempat Kerja, Temporary Address, Mailing Address, GPS Coordinate, Latitude, Longitude)',
      'Kontak & Wali (HP, WA, Email, Telepon Rumah, Emergency Contact, Guardian, Power of Attorney)',
      'Data Keluarga (Nama Ayah, Ibu, Pasangan, Anak, Saudara, Family Tree Pedigree)',
      'Dokumen Identitas Upload (Scan KTP, KK, Paspor, KITAS, SIM, BPJS, Asuransi, NPWP, Foto Pasien)'
    ]
  },
  {
    id: '2_master_kunjungan',
    number: 2,
    title: '2. MASTER KUNJUNGAN (Visit & Encounter Master)',
    desc: 'Nomor Visit, Episode Pelayanan, Admission, Discharge, Transfer, Encounter, Episode of Care, Readmission, Referral',
    category: 'Kunjungan & Episode',
    badgeColor: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
    details: [
      'Nomor Kunjungan (Visit Number VIS-2026-XXXX)',
      'Episode Pelayanan (Episode of Care ID)',
      'Status Admission (Jam/Tgl Masuk, Alasan Masuk, Jenis Rujukan)',
      'Status Discharge (Tgl Keluar, Cara Keluar, Keadaan Pulang)',
      'Riwayat Transfer (Internal Transfer, Bed Transfer, Unit Transfer)',
      'Readmission Alert (Indikator Readmission 30-Hari JCI)'
    ]
  },
  {
    id: '3_master_rawat_jalan',
    number: 3,
    title: '3. MASTER RAWAT JALAN (Outpatient Master)',
    desc: 'Semua Klinik Poli, Jadwal Praktik DPJP, Booking Online, Check In/Out, Queue Number, Waiting Time Analytics',
    category: 'Pelayanan Poliklinik',
    badgeColor: 'bg-[#007399]/10 text-[#007399] border border-[#007399]/20',
    details: [
      'Poli Spesialis & Subspesialis Purpose (35+ Poliklinik RS)',
      'Jadwal Dokter DPJP & Slot Kuota Janji Temu',
      'Booking Engine & Virtual Waiting Room Token',
      'Log Check-In & Check-Out Poliklinik',
      'Waktu Tunggu Pelayanan (Waiting Time Analytics Target < 30 Menit)'
    ]
  },
  {
    id: '4_master_igd',
    number: 4,
    title: '4. MASTER IGD (Emergency Department Master)',
    desc: 'Triase ATS/ESI, Trauma Score, NEWS, MEWS, CPR Record, Code Blue Trigger, Resusitasi',
    category: 'Gawat Darurat',
    badgeColor: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
    details: [
      'Australian Triage Scale (ATS 1-5) & Emergency Severity Index (ESI)',
      'Trauma Score (Revised Trauma Score RTS, GCS Score)',
      'Skor Peringatan Dini (NEWS 2 / MEWS Score)',
      'Log CPR (Cardiopulmonary Resuscitation Record) & Code Blue Timer',
      'Penanganan Zona Resusitasi & Red Zone Routing'
    ]
  },
  {
    id: '5_master_rawat_inap',
    number: 5,
    title: '5. MASTER RAWAT INAP (Inpatient & Bed Management Master)',
    desc: 'Bed Management Spasial, Transfer Bed, Ruang Isolasi, ICU, NICU, PICU, HCU, Bangsal VVIP/VIP/Kelas 1-3',
    category: 'Rawat Inap',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20',
    details: [
      'Peta Spasial Tempat Tidur (Bed Management Grid A-101 s/d Z-999)',
      'Status Kamar & Bangsal (Isolation Room, Negative Pressure, ICU, NICU, PICU, HCU)',
      'Prosedur Mutasi / Transfer Tempat Tidur (Bed Transfer History)',
      'Kelas Perawatan (VVIP, VIP, Kelas 1, Kelas 2, Kelas 3, KELAS KRIS BPJS)'
    ]
  },
  {
    id: '6_master_dokumen_medis',
    number: 6,
    title: '6. MASTER DOKUMEN MEDIS (Medical Documents Master)',
    desc: 'SOAP, CPPT, Resume Medis, Laporan Operasi, Anestesi, Informed Consent, Refusal, Surat Kontrol/Rujukan/Kematian/Lahir/Istirahat/Sehat',
    category: 'Rekam Medis Legap',
    badgeColor: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
    details: [
      'Catatan Perkembangan Pasien Terintegrasi (CPPT / SOAP Notes)',
      'Resume Medis Pulang (Discharge Summary & Medical Certificate)',
      'Laporan Operasi & Form Pra/Pasca Anestesi (Operative Report & Anesthesia Note)',
      'Informed Consent (Surat Persetujuan) & Informed Refusal (Surat Penolakan)',
      'Kumpulan Surat Keterangan (Surat Istirahat, Surat Sehat, Surat Lahir, Surat Kematian)'
    ]
  },
  {
    id: '7_master_keperawatan',
    number: 7,
    title: '7. MASTER KEPERAWATAN (Nursing & Clinical Assessment Master)',
    desc: 'Pengkajian Awal, Braden Scale, Morse Fall Risk, Norton, Pain Scale, Barthel ADL, Nutrition, Wound, Pressure Injury, EWS, Patient Education, Discharge Planning',
    category: 'Asuhan Keperawatan',
    badgeColor: 'bg-teal-500/10 text-teal-600 border border-teal-500/20',
    details: [
      'Skala Risiko Jatuh (Morse Fall Scale / Humpty Dumpty / Sydney)',
      'Skala Dekubitus & Luka Tekan (Braden Scale & Norton Scale Assessment)',
      'Skala Nyeri (NRS, VAS, FLACC, Wong-Baker FACES Pain Rating)',
      'Kemandirian Pasien (Barthel Index Activity of Daily Living ADL)',
      'Pengkajian Gizi (Nutritional Risk Screening NRS-2002 / MUST)',
      'Perencanaan Pemulangan (Discharge Planning & Patient Education)'
    ]
  },
  {
    id: '8_master_dokumen_penunjang',
    number: 8,
    title: '8. MASTER DOKUMEN PENUNJANG (Diagnostics & Laboratory Master)',
    desc: 'Radiologi, EKG, EEG, EMG, USG, MRI, CT, PET, Cathlab, Laboratorium Patologi Klinik, Mikrobiologi, Bank Darah',
    category: 'Penunjang Medis',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    details: [
      'Hasil Laboratorium Patologi Klinik (Darah Lengkap, Kimia Darah, Elektrolit)',
      'Hasil Mikrobiologi & Tes Resistensi Kepekaan Antibiotik (Kultur & Sensitivity)',
      'Hasil Bank Darah (Crossmatch, Golongan Darah, Permintaan Transfusi WB/PRC)',
      'Ekspertise Radiologi (X-Ray Thorax, CT Scan 128-Slice, MRI 3T, USG Doppler)',
      'Hasil Diagnostic Special (EKG 12-Lead, EEG Brain Wave, EMG, Cathlab Angiography)'
    ]
  },
  {
    id: '9_master_gambar',
    number: 9,
    title: '9. MASTER GAMBAR (Clinical Imaging & Multimedia Master)',
    desc: 'Xray, CT, MRI, Video Operasi Laparoskopi, Endoscopy, Ultrasound, Wound Photo, Burn Photo, Dental Photo',
    category: 'Arsip Gambar & Multimedia',
    badgeColor: 'bg-sky-500/10 text-sky-600 border border-sky-500/20',
    details: [
      'Foto Klinik (Wound Photo Foto Luka, Burn Photo Foto Luka Bakar, Skin Photo)',
      'Foto Dental Odontogram & Intraoral',
      'Video Prosedur Medis (Video Endoskopi, Video Laparoskopi Operasi)',
      'Citra Medis Format Spesifik (High-Res Radiograph, Ultrasound Image Frames)'
    ]
  },
  {
    id: '10_master_resep',
    number: 10,
    title: '10. MASTER RESEP (Pharmacy Prescription & MAR Master)',
    desc: 'Medication Order, Prescription, Dispensing, Administration, MAR, High Alert Drug, LASA, Controlled Drug, Medication Reconciliation',
    category: 'Farmasi & Medikasi',
    badgeColor: 'bg-violet-500/10 text-violet-600 border border-violet-500/20',
    details: [
      'Order Resep Elektronik (e-Prescribing & Medication Order)',
      'Dispensing Depo Farmasi & Verifikasi Dosis Apoteker',
      'Catatan Pemberian Obat (Medication Administration Record MAR)',
      'Kategori Risiko Obat (High Alert Drugs, LASA/NORUM, Controlled Narcotics)',
      'Rekonsiliasi Obat (Medication Reconciliation Pra & Pasca Inap)'
    ]
  },
  {
    id: '11_master_tindakan',
    number: 11,
    title: '11. MASTER TINDAKAN (Procedures & ICD-9-CM Master)',
    desc: 'Procedure, ICD9-CM, SNOMED CT, Operation, Minor Surgery, Major Surgery, Nursing Procedure, Therapy',
    category: 'Tindakan Klinis',
    badgeColor: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
    details: [
      'Kodifikasi Tindakan Medis (ICD-9-CM & SNOMED CT Procedure)',
      'Kategori Operasi Bedah (Minor Surgery, Major Surgery, Special Surgery)',
      'Tindakan Keperawatan Mandiri & Kolaboratif',
      'Terapi Medis & Intervensi Khusus'
    ]
  },
  {
    id: '12_master_diagnosis',
    number: 12,
    title: '12. MASTER DIAGNOSIS (Diagnoses & Problem List Master)',
    desc: 'ICD10, SNOMED CT, Problem List, Chronic Disease, Family Disease, Past History, Present Illness, Allergy, Adverse Reaction',
    category: 'Diagnosis & Alergi',
    badgeColor: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
    details: [
      'Kodifikasi Diagnosis Utama & Sekunder (ICD-10 Code & SNOMED CT)',
      'Daftar Masalah Kesehatan Aktif (Clinical Problem List)',
      'Riwayat Penyakit Kronis & Riwayat Penyakit Keluarga',
      'Riwayat Alergi Obat/Makanan & Adverse Drug Reaction Log'
    ]
  },
  {
    id: '13_master_vital_sign',
    number: 13,
    title: '13. MASTER VITAL SIGN (Vital Signs & Anthropometry Master)',
    desc: 'Temperature, Pulse, RR, BP, SpO2, Pain, Height, Weight, BMI, BSA, Head Circumference, Waist, Blood Sugar',
    category: 'Tanda Vital & Antropometri',
    badgeColor: 'bg-red-500/10 text-red-600 border border-red-500/20',
    details: [
      'Tanda Vital Utama (Suhu °C, Denyut Nadi bpm, RR breaths/min, Tekanan Darah mmHg, SpO2 %)',
      'Antropometri Pasien (Tinggi Badan cm, Berat Badan kg, BMI kg/m², BSA Body Surface Area m²)',
      'Antropometri Khusus (Lingkar Kepala Bayi cm, Lingkar Pinggang cm)',
      'Monitoring Gula Darah Sewaktu (GDS mg/dL & Skala Nyeri)'
    ]
  },
  {
    id: '14_master_asuransi',
    number: 14,
    title: '14. MASTER ASURANSI (Insurance & SEP Master)',
    desc: 'BPJS Kesehatan, Corporate, Private Insurance, Travel Insurance, Guarantee Letter, Claim, Coverage, SEP, INA-CBG',
    category: 'Penjaminan Asuransi',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    details: [
      'Verifikasi BPJS Kesehatan VClaim (No. Kartu, Hak Kelas, Status PBI/Non-PBI)',
      'Surat Eligibilitas Peserta (SEP BPJS Automatic Generation)',
      'Asuransi Swasta & Korporasi (Guarantee Letter / Surat Jaminan)',
      'Pengkodean INA-CBG Tarif Klaim Paket & Status Verifikasi Klaim'
    ]
  },
  {
    id: '15_master_billing',
    number: 15,
    title: '15. MASTER BILLING (Billing & Kasir Financial Master)',
    desc: 'Invoice, Payment, Refund, Deposit, Outstanding, Receivable, Cashier, Package, Discount',
    category: 'Keuangan & Kasir',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    details: [
      'Faktur Tagihan Medis (Medical Invoice & Rincian Transaksi)',
      'Metode Pembayaran (Cash, EDC, QRIS, Bank Transfer, Deposit Pasien)',
      'Piutang Pasien & Tagihan Penjamin Asuransi (Outstanding Receivable)',
      'Paket Pelayanan & Diskon Otorisasi Kasir'
    ]
  },
  {
    id: '16_master_appointment',
    number: 16,
    title: '16. MASTER APPOINTMENT (Appointment & Booking Master)',
    desc: 'Booking, Reschedule, Cancel, Reminder, Queue Number, Slot Availability',
    category: 'Janji Temu',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20',
    details: [
      'Booking Janji Temu Poliklinik & Telemedicine',
      'Riwayat Reschedule (Penjadwalan Ulang) & Pembatalan',
      'Pengiriman Pengingat Otomatis (WhatsApp & Email Reminder)',
      'Nomor Antrean Online & Estimasi Waktu Pelayanan'
    ]
  },
  {
    id: '17_master_telemedicine',
    number: 17,
    title: '17. MASTER TELEMEDICINE (Telemedicine & Virtual Consultation)',
    desc: 'Video Call Link, Chat Room Log, E-Prescription, Remote Consent, Recording Link',
    category: 'Konsultasi Virtual',
    badgeColor: 'bg-sky-500/10 text-sky-600 border border-sky-500/20',
    details: [
      'Link Enkripsi Video Call Konsultasi Virtual DPJP',
      'Log Percakapan Chat & Lampiran Berkas Medis',
      'Resep Elektronik Telemedis & Pengiriman Obat',
      'Remote Informed Consent Digital'
    ]
  },
  {
    id: '18_master_penelitian',
    number: 18,
    title: '18. MASTER PENELITIAN (Clinical Research & Biobank Master)',
    desc: 'Clinical Trial, Research Consent, Sample Collection, Biobank Specimen Registry',
    category: 'Riset & Biobank',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20',
    details: [
      'Persetujuan Keikutsertaan Penelitian (Research Consent Form)',
      'Registry Uji Klinis (Clinical Trial Protocol ID)',
      'Spesimen Biobank (Sampel Darah, Jaringan, DNA Repository Code)'
    ]
  },
  {
    id: '19_master_rehabilitasi',
    number: 19,
    title: '19. MASTER REHABILITASI (Rehabilitation & Therapy Master)',
    desc: 'Physiotherapy, Occupational Therapy, Speech Therapy, Psychology, Nutrition Assessment',
    category: 'Rehabilitasi Medik',
    badgeColor: 'bg-teal-500/10 text-teal-600 border border-teal-500/20',
    details: [
      'Layanan Fisioterapi (Program Latihan & Terapi Modalitas)',
      'Terapi Okupasi (Occupational Therapy Assessment)',
      'Terapi Wicara (Speech Therapy & Evaluasi Menelan)',
      'Konseling Psikologi Klinis & Asuhan Dietetik Nutrisi'
    ]
  },
  {
    id: '20_master_dialisis',
    number: 20,
    title: '20. MASTER DIALISIS (Dialysis & Kidney Care Master)',
    desc: 'Hemodialisis (HD), CAPD, Peritoneal Dialysis (PD), Adekuasi Kt/V, Ultrafiltrasi',
    category: 'Dialisis & Ginjal',
    badgeColor: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
    details: [
      'Sesi Hemodialisis (Laporan HD, Target Ultrafiltrasi, Dialiser Reuse)',
      'Kalkulasi Adekuasi Dialisis (Skor Kt/V & URR)',
      'Continuous Ambulatory Peritoneal Dialysis (CAPD Record)'
    ]
  },
  {
    id: '21_master_onkologi',
    number: 21,
    title: '21. MASTER ONKOLOGI (Oncology & Cancer Care Master)',
    desc: 'Chemotherapy Protocol, Radiotherapy, Cancer Registry, TNM Staging, Clinical Stage 1-4',
    category: 'Onkologi & Kanker',
    badgeColor: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
    details: [
      'Protokol Kemoterapi (Regimen Obat, Dosis BSA, Siklus Ke-N)',
      'Perencanaan Radioterapi (Target Radiasi & Fraksinasi)',
      'Staging Kanker TNM (Tumor, Node, Metastasis & Stage I-IV)',
      'Cancer Registry Nasional & Evaluasi Respons Terapi (RECIST)'
    ]
  },
  {
    id: '22_master_obgyn',
    number: 22,
    title: '22. MASTER OBGYN (Obstetrics & Gynecology Master)',
    desc: 'ANC, PNC, Delivery Record, Partograph, CTG Cardiotocography, Baby Record',
    category: 'Kebidanan & Kandungan',
    badgeColor: 'bg-pink-500/10 text-pink-600 border border-pink-500/20',
    details: [
      'Antenatal Care (ANC Buku KIA, HPHT, TP, Usia Kehamilan Gravida-Para-Abortus)',
      'Partograf Digital WHO (Kurva Pembukaan Serviks & Kontraksi)',
      'Hasil Rekaman Kardiotokografi (CTG Fetal Heart Rate)',
      'Catatan Persalinan & Keadaan Bayi Baru Lahir (APGAR Score)'
    ]
  },
  {
    id: '23_master_pediatri',
    number: 23,
    title: '23. MASTER PEDIATRI (Pediatrics & Child Health Master)',
    desc: 'Growth Chart WHO/CDC, Immunization Record, Development Screening, Neonatal, NICU',
    category: 'Kesehatan Anak',
    badgeColor: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
    details: [
      'Grafik Pertumbuhan Anak WHO (Z-Score TB/U, BB/U, BMI/U)',
      'Jadwal & Catatan Imunisasi Lengkap (IDAI Immunization Record)',
      'Skrining Tumbuh Kembang (KMSP / Denver II Development Test)',
      'Catatan Perawatan Neonatus & Perawatan Intensif NICU'
    ]
  },
  {
    id: '24_master_dental',
    number: 24,
    title: '24. MASTER DENTAL (Odontogram & Oral Health Master)',
    desc: 'Odontogram Digital 32 Gigi, Dental Xray, Orthodontic, Periodontal Charting',
    category: 'Kesehatan Gigi',
    badgeColor: 'bg-[#007399]/10 text-[#007399] border border-[#007399]/20',
    details: [
      'Odontogram Digital Interaktif (Status 32 Gigi Gigi Susu/Permanen)',
      'Hasil Foto Rontgen Gigi (Panoramik & Periapikal Dental X-Ray)',
      'Asesmen Periodontal & Perencanaan Perawatan Ortodonti'
    ]
  },
  {
    id: '25_master_mortality',
    number: 25,
    title: '25. MASTER MORTALITY (Mortality & Death Record Master)',
    desc: 'Death Record, Autopsy Report, Death Cause (MCOD/UCOD ICD-10), Death Certificate',
    category: 'Mortalitas',
    badgeColor: 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
    details: [
      'Surat Keterangan Kematian (Medical Death Certificate Form A/B)',
      'Penetapan Penyebab Kematian (Underlying & Immediate Cause of Death MCOD)',
      'Laporan Hasil Otopsi Medis Legalis'
    ]
  },
  {
    id: '26_master_audit',
    number: 26,
    title: '26. MASTER AUDIT (Audit Trail & Version History Master)',
    desc: 'Audit Log, Version Control, BSRE Digital Signature, Approval Flow, Revision History, Access Log',
    category: 'Audit & Kepatuhan',
    badgeColor: 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
    details: [
      'Log Audit Terperinci (Siapa, Kapan, Apa yang Berubah, Alamat IP)',
      'Versi Dokumen Rekam Medis (Revision History & Snapshot Document)',
      'Verifikasi Tanda Tangan Digital BSRE / E-Sign Kemenkominfo',
      'Log Akses Kerahasiaan Rekam Medis Pasien'
    ]
  },
  {
    id: '27_master_dokumen_digital',
    number: 27,
    title: '27. MASTER DOKUMEN DIGITAL (Digital Files & Formats Master)',
    desc: 'PDF, Word, Excel, Scan KTP/KK, DICOM, FHIR JSON, XML',
    category: 'Format File Digital',
    badgeColor: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
    details: [
      'Dokumen PDF Resmi (Surat Terverifikasi & Laporan Klinis)',
      'Berkas Pemindaian Digital (Scan KTP, KK, Paspor, BPJS)',
      'Dataset Struktur Data Medis (DICOM Radiologi, FHIR JSON SATUSEHAT, XML)'
    ]
  },
  {
    id: '28_master_device',
    number: 28,
    title: '28. MASTER DEVICE (Medical Devices & Asset Master)',
    desc: 'Ventilator, Bedside Monitor, Infusion Pump, ECG Machine, Asset Number, Kalibrasi, Maintenance',
    category: 'Perangkat Medis',
    badgeColor: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
    details: [
      'Perangkat Alkes Terhubung (Ventilator, Bedside Monitor, Infusion Pump)',
      'Nomor Aset Inventaris & Sertifikat Kalibrasi Terjadwal',
      'Integrasi IoT Vital Sign Auto-Capture'
    ]
  },
  {
    id: '29_master_satusehat',
    number: 29,
    title: '29. MASTER SATUSEHAT (SATUSEHAT FHIR Interoperability Master)',
    desc: 'FHIR Patient, Encounter, Observation, Procedure, Medication, DiagnosticReport, CarePlan, Condition, Immunization, DocumentReference',
    category: 'Interoperabilitas Kemenkes',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    details: [
      'FHIR Resource Patient & Encounter (Nomor IHS & ID Kunjungan Kemenkes)',
      'FHIR Observation (Vital Signs & Hasil Lab SATUSEHAT)',
      'FHIR Condition (Diagnosis ICD-10) & FHIR Procedure (ICD-9-CM)',
      'FHIR Medication, DiagnosticReport, CarePlan, & Immunization'
    ]
  },
  {
    id: '30_master_ai',
    number: 30,
    title: '30. MASTER AI (Clinical AI & Decision Support Master)',
    desc: 'Clinical Decision Support (CDSS), Drug Interaction Alert, Early Warning AI, Risk Prediction, Voice Medical Transcription, Medical Coding AI',
    category: 'Kecerdasan Buatan Medis',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20',
    details: [
      'Clinical Decision Support System (CDSS Rekomendasi Terapi DPJP)',
      'Deteksi Otomatis Interaksi Obat (Drug-Drug & Drug-Allergy Warning)',
      'Prediksi AI Keterburukan Kondisi Pasien (Early Warning AI Score)',
      'Transkripsi Suara Dikte Medis & Auto-Coding ICD-10 AI Assistant'
    ]
  },
  {
    id: '31_master_keamanan',
    number: 31,
    title: '31. MASTER KEAMANAN (Security, Privacy & HIPAA/JCI Master)',
    desc: 'Consent Privacy, HIPAA/JCI Compliance, Access Level, Break Glass Access, Encryption Key, MFA Status',
    category: 'Keamanan Data',
    badgeColor: 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
    details: [
      'Persetujuan Privasi Data Pasien (Data Privacy Consent)',
      'Kepatuhan JCI & HIPAA Security Standards',
      'Fitur Akses Darurat (Break-Glass Emergency Medical Access Log)',
      'Enkripsi Data AES-256 Bit & Status Autentikasi MFA Ganda'
    ]
  },
  {
    id: '32_master_file_pasien',
    number: 32,
    title: '32. MASTER FILE PASIEN (Repositori Dokumen Terpusat Ultimate)',
    desc: 'Repositori Terpusat Berkas Pasien: Dokumen Administratif (KTP, KK, Paspor, BPJS, SEP), Dokumen Medis (SOAP, CPPT, Lab, Rad, EKG, Laporan Operasi), & Berkas Multimedia (Foto Luka, Video Endoskopi, DICOM, PDF, DOCX, ZIP, FHIR JSON)',
    category: 'Repositori Terpusat',
    badgeColor: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
    details: [
      'Dokumen Administratif Lengkap (Scan KTP, KK, Paspor, KITAS/KITAP, BPJS, Asuransi, Surat Jaminan, Surat Rujukan, SEP, Kartu Berobat)',
      'Dokumen Medis Terpusat (Resume Medis PDF, SOAP, CPPT, Hasil Lab, Hasil Radiologi, EKG, EEG, EMG, Spirometri, Audiometri, Endoskopi, Patologi Anatomi, Patologi Klinik, Mikrobiologi, Bank Darah, Laporan Operasi, Laporan Anestesi, Informed Consent, Surat Penolakan, Surat Pulang, Surat Kontrol, Surat Kematian, Surat Kelahiran, Sertifikat Vaksin, Rekam Medis RS Lain)',
      'Berkas Multimedia & Format Spesifik (Foto Luka, Foto Kulit, Foto Gigi, Foto Retina, Video Endoskopi, Video Operasi, Rekaman Audio Konsultasi, File DICOM CT/MRI/USG/X-Ray, File PDF, DOCX, XLSX, ZIP, XML, FHIR JSON)'
    ]
  }
];
