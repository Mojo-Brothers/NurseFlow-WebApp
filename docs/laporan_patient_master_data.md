# 📋 Laporan Lengkap: Data Master Pasien NurseFlow HIS
**Sumber:** `patientMaster32Taxonomy.js` + `DummyDataManagementPage.jsx` + `demoData.js`
**Standar:** JCI Accreditation + SATUSEHAT FHIR Kemenkes RI
**Total Kategori:** 32 Master Data Categories

---

## 🔍 Ringkasan Eksekutif

Proyek NurseFlow telah mendefinisikan **32 kategori master data pasien** yang komprehensif, mencakup seluruh siklus hidup pasien dari registrasi hingga mortalitas. Data ini terbagi dalam **9 domain klinis utama**.

---

## 🗂️ 32 KATEGORI MASTER DATA PASIEN

### 🟦 DOMAIN 1: DEMOGRAFI & IDENTITAS

#### **#1. MASTER PASIEN (Patient Master)**
> Identitas, IHS, NIK, Paspor, KITAS, Biodata, Demografi, Alamat, Kontak, Keluarga

| Sub-Data | Detail |
|---|---|
| **Identitas** | MRN, IHS Number SATUSEHAT, NIK 16-Digit, Passport, KITAS, KITAP, National Identifier, Old MRN, External MRN, UUID |
| **Biodata** | Nama Lengkap, Alias, Preferred Name, Nama Sebelum Menikah, Gelar, Gender, Gender Identity, Pronoun, Tempat/Tgl Lahir, Usia Otomatis, Status Hidup |
| **Demografi** | Agama, Etnis, Ras, Suku, Bahasa Utama/Kedua, Interpreter Needed, Pendidikan, Pekerjaan, Pendapatan, Status Ekonomi |
| **Alamat** | KTP, Domisili, Tempat Kerja, Temporary, Mailing, GPS Coordinate, Latitude, Longitude |
| **Kontak & Wali** | HP, WA, Email, Telepon Rumah, Emergency Contact, Guardian, Power of Attorney |
| **Data Keluarga** | Nama Ayah, Ibu, Pasangan, Anak, Saudara, Family Tree Pedigree |
| **Dokumen Upload** | Scan KTP, KK, Paspor, KITAS, SIM, BPJS, Asuransi, NPWP, Foto Pasien |

**✅ Status di Proyek (`demoData.js`):**
```
id, name, mrn, nik, demographics{gender, dob, pob, religion, occupation, address},
baseline_profile, allergies[], safety_flags{}, insurance{}, status, createdAt
```
> ⚠️ **GAP:** Belum ada: alias, gelar, gender_identity, bahasa, etnis, GPS, emergency_contact, family_tree, upload dokumen

---

### 🟦 DOMAIN 2: KUNJUNGAN & EPISODE PELAYANAN

#### **#2. MASTER KUNJUNGAN (Visit & Encounter Master)**
> Nomor Visit, Episode, Admission, Discharge, Transfer, Readmission

| Sub-Data | Detail |
|---|---|
| Nomor Kunjungan | VIS-2026-XXXX |
| Episode of Care | Episode ID unik per episode |
| Admission | Jam/Tgl Masuk, Alasan, Jenis Rujukan |
| Discharge | Tgl Keluar, Cara Keluar, Keadaan Pulang |
| Transfer History | Internal Transfer, Bed Transfer, Unit Transfer |
| Readmission Alert | Indikator 30-Hari JCI |

#### **#3. MASTER RAWAT JALAN (Outpatient Master)**
> 35+ Poliklinik, Jadwal DPJP, Booking, Queue, Waiting Time

#### **#4. MASTER IGD (Emergency Department Master)**
> ATS 1-5, ESI, Trauma Score, NEWS 2, MEWS, CPR Record, Code Blue

#### **#5. MASTER RAWAT INAP (Inpatient & Bed Management)**
> Bed Grid A-101 s/d Z-999, ICU/NICU/PICU/HCU, Isolasi, Transfer, Kelas KRIS

---

### 🟪 DOMAIN 3: REKAM MEDIS & DOKUMEN KLINIS

#### **#6. MASTER DOKUMEN MEDIS**
> SOAP, CPPT, Resume Medis, Laporan Operasi, Anestesi, Consent

| Dokumen | Keterangan |
|---|---|
| CPPT / SOAP | Catatan Perkembangan Pasien Terintegrasi |
| Resume Medis | Discharge Summary & Medical Certificate |
| Lap. Operasi | Operative Report & Anesthesia Note |
| Consent | Informed Consent & Informed Refusal |
| Surat Keterangan | Istirahat, Sehat, Lahir, Kematian |

#### **#7. MASTER KEPERAWATAN (Nursing Assessment)**
> Morse Fall, Braden, Norton, Pain Scale, Barthel ADL, NRS-2002, Discharge Planning

| Asesmen | Tool |
|---|---|
| Risiko Jatuh | Morse Fall Scale / Humpty Dumpty / Sydney |
| Dekubitus | Braden Scale & Norton Scale |
| Nyeri | NRS, VAS, FLACC, Wong-Baker FACES |
| Kemandirian ADL | Barthel Index |
| Nutrisi | NRS-2002 / MUST |
| Discharge Planning | Planning & Patient Education |

---

### 🟩 DOMAIN 4: PENUNJANG MEDIS & DIAGNOSTIK

#### **#8. MASTER DOKUMEN PENUNJANG (Diagnostics & Lab)**
> Lab PK, Mikrobiologi, Bank Darah, Radiologi, EKG, EEG, EMG, Cathlab

#### **#9. MASTER GAMBAR (Clinical Imaging & Multimedia)**
> X-Ray, CT, MRI, Video Laparoskopi, Endoscopy, USG, Wound Photo, Dental

---

### 🟨 DOMAIN 5: FARMASI & TINDAKAN MEDIS

#### **#10. MASTER RESEP (Pharmacy Prescription & MAR)**
> e-Prescribing, Dispensing, MAR, High Alert Drugs, LASA, Controlled, Rekonsiliasi

#### **#11. MASTER TINDAKAN (Procedures & ICD-9-CM)**
> ICD-9-CM, SNOMED CT, Operasi Minor/Mayor/Khusus, Tindakan Keperawatan

#### **#12. MASTER DIAGNOSIS (Diagnoses & Problem List)**
> ICD-10, SNOMED CT, Problem List, Penyakit Kronis, Alergi, ADR Log

---

### 🔴 DOMAIN 6: TANDA VITAL & MONITORING

#### **#13. MASTER VITAL SIGN (Vital Signs & Anthropometry)**

| Parameter | Satuan |
|---|---|
| Suhu | °C |
| Denyut Nadi | bpm |
| Frekuensi Napas | breaths/min |
| Tekanan Darah | mmHg |
| SpO2 | % |
| Tinggi Badan | cm |
| Berat Badan | kg |
| BMI | kg/m² |
| BSA | m² |
| Lingkar Kepala | cm (bayi) |
| Lingkar Pinggang | cm |
| GDS | mg/dL |
| Skala Nyeri | 0-10 NRS |

**✅ Status di Proyek (encounter `vitals`):**
```
bp: "120/80", hr: 72, temp: 36.5, rr: 18, spo2: 98, pain_scale: "3/10 (NRS)"
```
> ⚠️ **GAP:** Belum ada: TB, BB, BMI otomatis, BSA, lingkar kepala, GDS

---

### 💚 DOMAIN 7: PENJAMINAN & KEUANGAN

#### **#14. MASTER ASURANSI (Insurance & SEP)**
> BPJS VClaim, SEP Auto-Generate, Guarantee Letter, INA-CBG

#### **#15. MASTER BILLING (Billing & Kasir)**
> Invoice, Cash/EDC/QRIS, Piutang, Paket, Diskon

#### **#16. MASTER APPOINTMENT (Booking)**
> Booking Online, Reschedule, Cancel, WA Reminder, Queue Token

---

### 🔵 DOMAIN 8: PELAYANAN KHUSUS

#### **#17. MASTER TELEMEDICINE** — Video Call, Chat Log, E-Prescription, Remote Consent
#### **#18. MASTER PENELITIAN** — Clinical Trial, Biobank, Spesimen DNA
#### **#19. MASTER REHABILITASI** — Fisioterapi, Okupasi, Speech Therapy, Psikologi, Dietetik
#### **#20. MASTER DIALISIS** — Hemodialisis, CAPD, Adekuasi Kt/V, Ultrafiltrasi
#### **#21. MASTER ONKOLOGI** — Kemoterapi, Radioterapi, TNM Staging, Cancer Registry, RECIST
#### **#22. MASTER OBGYN** — ANC, Partograf WHO, CTG, APGAR Score, Gravida-Para-Abortus
#### **#23. MASTER PEDIATRI** — Growth Chart WHO Z-Score, Imunisasi IDAI, Denver II, NICU
#### **#24. MASTER DENTAL** — Odontogram 32 Gigi, Dental X-Ray, Periodontal, Ortodonti
#### **#25. MASTER MORTALITY** — Sertifikat Kematian, MCOD/UCOD ICD-10, Autopsi

---

### ⚫ DOMAIN 9: TEKNOLOGI, KEAMANAN & INTEROPERABILITAS

#### **#26. MASTER AUDIT (Audit Trail)**
> Log Siapa/Kapan/Apa/IP, Revision History, BSRE E-Sign, Access Log

#### **#27. MASTER DOKUMEN DIGITAL**
> PDF, DOCX, DICOM, FHIR JSON, XML, Scan Identitas

#### **#28. MASTER DEVICE (Medical Devices & IoT)**
> Ventilator, Bedside Monitor, Infusion Pump, IoT Auto-Capture Vital Sign

#### **#29. MASTER SATUSEHAT (FHIR Interoperability)**
> FHIR Patient, Encounter, Observation, Condition, Procedure, Medication, DiagnosticReport, CarePlan, Immunization, DocumentReference

#### **#30. MASTER AI (Clinical AI & CDSS)**
> CDSS Rekomendasi, Drug Interaction Alert, Early Warning AI, Voice Transcription, Auto-Coding ICD-10

#### **#31. MASTER KEAMANAN (Security, Privacy & HIPAA/JCI)**
> Data Privacy Consent, Break-Glass Access, AES-256, MFA, HIPAA/JCI Compliance

#### **#32. MASTER FILE PASIEN (Repositori Terpusat Ultimate)**
> Semua berkas administratif + medis + multimedia terpusat dalam satu repositori

---

## 📊 Analisis GAP: Data Tersedia vs Data Didefinisikan

### ✅ Data yang SUDAH ADA di `demoData.js`
| Field | Path | Catatan |
|---|---|---|
| ID | `patient.id` | `demo-patient-N` |
| Nama Lengkap | `patient.name` | Dengan prefix (Ny./Tn./An.) |
| MRN | `patient.mrn` | 6 digit |
| NIK | `patient.nik` | 16 digit |
| Gender | `patient.demographics.gender` | F/M |
| Tanggal Lahir | `patient.demographics.dob` | ISO date |
| Tempat Lahir | `patient.demographics.pob` | Hardcoded "Bandung" |
| Agama | `patient.demographics.religion` | Hardcoded "Islam" |
| Pekerjaan | `patient.demographics.occupation` | 2 variasi |
| Alamat | `patient.demographics.address` | Hardcoded Bandung |
| Berat Badan | `patient.baseline_profile.value` | kg |
| Kronik Flag | `patient.baseline_profile.chronic_flag` | Boolean |
| Alergi | `patient.allergies[]` | {type, agent, reaction, severity} |
| Risiko Jatuh | `patient.safety_flags.fall_risk` | HIGH/MODERATE/LOW |
| Risiko Dekubitus | `patient.safety_flags.pressure_ulcer` | Hardcoded "LOW" |
| Isolasi | `patient.safety_flags.isolation` | Hardcoded "NONE" |
| Asuransi | `patient.insurance{type, no, name}` | BPJS/Mandiri |
| Status | `patient.status` | "ACTIVE" |

### ✅ Data ENCOUNTER yang SUDAH ADA
| Field | Path | Catatan |
|---|---|---|
| No. Kunjungan | `encounter.id` | ENC-RJ-2026-XXX |
| Tipe Kunjungan | `encounter.type` | OUTPATIENT/INPATIENT/EMERGENCY |
| Departemen/Poli | `encounter.department` | Nama poli lengkap |
| Nama Dokter | `encounter.doctor_name` | Dengan gelar spesialis |
| Email Dokter | `encounter.doctor_email` | |
| Penjamin | `encounter.guarantor` | Nama asuransi |
| Tgl Masuk | `encounter.admitted_at` | Timestamp |
| Status Encounter | `encounter.status` | IN_TREATMENT/PROSES_PULANG/DISCHARGED |
| Level Triage | `encounter.triage_level` | RED/YELLOW/GREEN |
| Skor Triage | `encounter.triage_score` | P1/P2/P3 |
| Tekanan Darah | `encounter.vitals.bp` | "120/80" |
| Detak Jantung | `encounter.vitals.hr` | bpm |
| Suhu | `encounter.vitals.temp` | °C |
| Frekuensi Napas | `encounter.vitals.rr` | breaths/min |
| SpO2 | `encounter.vitals.spo2` | % |
| Skala Nyeri | `encounter.vitals.pain_scale` | NRS |
| Keluhan Utama | `encounter.chief_complaint` | Teks naratif |

---

### ❌ Data yang BELUM ADA (GAP Signifikan)

| Kategori | Field yang Hilang | Prioritas |
|---|---|---|
| **Identitas** | IHS Number, Alias, Gelar, Gender Identity, Status Pernikahan, Golongan Darah | 🔴 Tinggi |
| **Demografi** | Etnis/Suku, Bahasa, Interpreter flag, Pendidikan, Status Ekonomi | 🟡 Sedang |
| **Kontak** | Emergency Contact (nama+HP+relasi), Email, No. WA | 🔴 Tinggi |
| **Alamat** | Alamat domisili terpisah, GPS Coordinate | 🟡 Sedang |
| **Keluarga** | Nama Ayah, Ibu, Pasangan, Anak | 🟡 Sedang |
| **Vital Sign** | Tinggi Badan, BMI otomatis, Lingkar Kepala, GDS | 🔴 Tinggi |
| **Safety Flag** | Isolasi (detail tipe), Pressure Ulcer (level detail) | 🔴 Tinggi |
| **Asuransi** | No. SEP, Hak Kelas BPJS, Tgl Berlaku, No. VA | 🔴 Tinggi |
| **Kunjungan** | Cara Keluar, Kondisi Pulang, Readmission flag | 🟡 Sedang |
| **SATUSEHAT** | IHS ID, Encounter ID FHIR, Sync Status | 🔴 Tinggi |

---

## 📌 Rekomendasi

### Prioritas 1 — Segera Tambahkan ke `demoData.js`
1. `ihs_number` — untuk integrasi SATUSEHAT
2. `blood_type` — golongan darah (A+/B+/AB+/O+)
3. `marital_status` — status pernikahan
4. `emergency_contact: { name, phone, relation }` — kontak darurat
5. `vitals.height` + `vitals.weight` + `vitals.bmi` — dalam encounter
6. `insurance.bpjs_class` — kelas BPJS (1/2/3)
7. `demographics.ethnicity` — suku/etnis

### Prioritas 2 — Perlu Schema Extension
1. Pisahkan `vitals` ke collection tersendiri per timestamp
2. Tambah `allergies.severity_level` yang lebih granular
3. Tambah `safety_flags.isolation_type` (Contact/Droplet/Airborne)

### Prioritas 3 — Nice to Have
1. `family_history` — riwayat penyakit keluarga
2. `language_preference` — bahasa pilihan pasien
3. `gps_coordinate` — koordinat alamat
