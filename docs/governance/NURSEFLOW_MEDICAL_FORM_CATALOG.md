# NurseFlow Medical Form Catalog & Form Engine Architecture
## Katalog Forensik Dokumentasi Klinis, Evaluasi Kematangan Form Engine, & Standar Tata Kelola Dokumen Medis Elektronik

> **Status Dokumen:** RATIFIED AUDIT BASELINE  
> **Klasifikasi:** Dokumen Tata Kelola Rekam Medis (Medical Records & Clinical Documentation Governance)  
> **Dasar Hukum & Standar:** Permenkes No. 24 Tahun 2022 tentang Rekam Medis, Standar Akreditasi Rumah Sakit (STARKES/KARS), Joint Commission International (JCI ACC/COP/MPO).

---

## 1. Analisis Kritis: Apakah NurseFlow Memiliki Medical Form Engine?

Berdasarkan hasil audit mendalam terhadap kode sumber:

### ⚠️ KESIMPULAN FORENSIK:
> **NurseFlow SAAT INI TIDAK MEMILIKI Form Engine Dinamis Sejati.**
> NurseFlow memiliki **42+ form medis statis yang di-hardcode secara terpisah sebagai komponen React individual (`.jsx`)**. 
> Walaupun terdapat komponen wrapper UI bernama [`ClinicalFormShell.jsx`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/modules/emr/components/ClinicalFormShell.jsx) yang menyediakan action bar dan indikator status dokumen, **tidak ada metadata engine terpusat, tidak ada skema definisi form di database, tidak ada versioning skema field dinamis, dan tidak ada enforcement tandatangan digital kriptografis yang mengunci baris data di PostgreSQL.**

### Anatomi Masalah Form Medis Saat Ini:
1. **Hardcoded Form Structure:** Setiap kali rumah sakit ingin mengubah 1 pertanyaan pada form (misal: menambahkan kolom skrining Covid-19 atau skrining TB), developer harus mengubah source code JSX, melakukan re-compile, dan re-deploy seluruh aplikasi frontend.
2. **Tri-Layer Persistence Disconnect:** Hampir seluruh form di direktori `src/modules/emr/components/` memanggil `saveClinicalRecord` pada `src/modules/emr/services/emr.service.js` yang mengirimkan data ke **Firebase Firestore**, bukan ke tabel-tabel PostgreSQL (`clinical_forms`, `emr_records`, `discharge_summaries`). Akibatnya, tabel rekam medis di PostgreSQL memiliki **0 baris data**.
3. **Ketiadaan Validasi Dependensi:** Form tidak memiliki evaluasi kondisional berbasis aturan klinis (*clinical conditional logic*) di tingkat database/API. Seluruh validasi hanya terjadi pada fungsi `onChange` lokal React.
4. **Ilusi Tandatangan Digital:** Tombol *"Tandatangani & Finalkan"* pada `ClinicalFormShell.jsx` hanya mengubah state lokal React (`formState = 'signed'`) tanpa menghasilkan hash kriptografis (SHA-256), tanpa sertifikat digital BSrE/Kemenkes, dan tanpa mengunci baris database secara permanen (*immutable row lock*).

---

## 2. Katalog 42+ Form Medis NurseFlow Berdasarkan Unit Pelayanan

Berikut adalah inventarisasi lengkap seluruh form dokumentasi klinis yang ditemukan dalam repository:

### A. Instalasi Gawat Darurat (IGD)
| Nama Form | File Komponen | Standar / Regulasi | Status Lifecycle & Persistensi | Kesenjangan Arsitektural |
| :--- | :--- | :--- | :---: | :--- |
| **Triase Cepat IGD** | `RapidTriageStudio.jsx` | ATS / ESI 5 Level | 🟣 Local/Firestore | Algoritma ATS berjalan di browser; tidak tersimpan di tabel `triage_assessments`. |
| **Pengkajian Medis Gawat Darurat** | `UgdAssessmentForm.jsx` | KARS PAP.1, ABCDE | 🟣 Firestore Only | Form mencakup Airway, Breathing, Circulation, tetapi data diarahkan ke Firestore. |
| **Pengkajian Awal Keperawatan IGD** | `InitialAssessment.jsx` | KARS PAP.1.1 | 🟣 Firestore Only | Mencakup skrining jatuh Morse dan NRS nyeri, belum terikat ke ID encounter PostgreSQL. |
| **Pemantauan Deteriorasi MEOWS/PEWS**| `MEOWSForm.jsx`, `PEWSForm.jsx` | Patient Safety Goal 6 | 🟣 State Memory | Perhitungan skor deteriorasi klinis ada, namun tidak memicu alarm ke perawat lain. |
| **Pulang Atas Permintaan Sendiri (PAPS)**| `PAPSForm.jsx` | UU Kesehatan, PMK 269 | 🟣 Form Shell | Surat pernyataan penolakan rawat/tindakan; belum terintegrasi ke tandatangan digital wali. |
| **Surat Keterangan Kematian (MCCD)**| `MedicalCertificateCauseOfDeathForm.jsx` | ICD-10 Coding Kematian | 🟣 Form Shell | Mencakup urutan penyebab langsung/antara/dasar kematian, belum terhubung ke Dukcapil/RMIK. |

### B. Poliklinik Rawat Jalan (Outpatient)
| Nama Form | File Komponen | Standar / Regulasi | Status Lifecycle & Persistensi | Kesenjangan Arsitektural |
| :--- | :--- | :--- | :---: | :--- |
| **Pengkajian Awal Rawat Jalan** | `PoliTriage.jsx` | KARS PAP.1 | 🟣 Firestore Only | Input keluhan utama dan riwayat penyakit; tidak tersambung ke rekam medis kunjungan lalu. |
| **Catatan Perkembangan Terintegrasi (CPPT/SOAP)** | `CPPTWorkspace.jsx`, `EmrCPPT.jsx` | JCI COP.2.2, KARS | 🟢 Terhubung Sebagian | Menulis ke tabel `soap_notes` PostgreSQL, tetapi validasi verifikasi DPJP belum terkunci. |
| **Surat Rujukan Eksternal/Internal**| `ReferralLetterForm.jsx` | BPJS / Permenkes | 🟣 Form Shell | Tidak terhubung ke integrasi rujukan online BPJS P-Care/V-Claim. |
| **Edukasi Pasien & Keluarga Terintegrasi**| `PatientEducationForm.jsx` | KARS MKE.1 - MKE.12 | 🟣 Form Shell | Form evaluasi pemahaman materi edukasi; bukti tandatangan pasien belum legal. |
| **Penetapan DPJP Utama** | `DPJPAssignmentForm.jsx` | KARS PMKP / PAP | 🟢 Terhubung Sebagian | Penugasan dokter penanggung jawab pelayanan ke pasien. |

### C. Ruang Rawat Inap (Inpatient Ward)
| Nama Form | File Komponen | Standar / Regulasi | Status Lifecycle & Persistensi | Kesenjangan Arsitektural |
| :--- | :--- | :--- | :---: | :--- |
| **Catatan Masuk Rawat Inap (Admisi)**| `AdmissionNoteForm.jsx` | KARS PAP.1 | 🟣 Firestore Only | Resume saat pasien pertama kali masuk ruangan rawat inap. |
| **Asuhan Keperawatan Harian (SDKI/SIKI)**| `NursingDailyAssessmentForm.jsx` | PPNI / Standar Profesi | 🟣 Firestore Only | Diagnosa keperawatan, luaran, dan intervensi belum tersimpan di tabel `nursing_care_plans`. |
| **Serah Terima Pasien Antar Shift (SBAR)**| `NursingHandoverForm.jsx` | Patient Safety Goal 2 | 🟣 Firestore Only | Menggunakan format SBAR (Situation, Background, Assessment, Recommendation). |
| **Skrining Risiko Dekubitus (Braden)**| `BradenScaleForm.jsx` | KARS SKP.6 | 🟣 Firestore Only | Skor persepsi sensori, kelembaban, aktivitas, mobilitas, nutrisi, friksi/gesekan. |
| **Evaluasi & Tata Laksana Nyeri** | `PainReassessmentForm.jsx` | KARS PAP.6 | 🟣 Firestore Only | Re-evaluasi 30 menit paska injeksi analgetik atau 1 jam paska oral. |
| **Skrining Kriteria Masuk / Keluar ICU**| `ICUAdmissionCriteriaForm.jsx`, `ICUDischargeCriteriaForm.jsx` | KARS PAP.3 | 🟣 Form Shell | Kriteria prioritas 1, 2, 3 masuk ICU dan kesiapan alih rawat ke ruang biasa. |
| **Kriteria Sepsis & Skoring SOFA** | `SepsisSOFACriteriaForm.jsx` | Sepsis-3 Guidelines | 🟣 Form Shell | PaO2/FiO2, trombosit, bilirubin, MAP, Glasgow Coma Scale, kreatinin serum. |
| **Perintah Jangan Diresusitasi (DNR)**| `DNRForm.jsx` | Etika Kedokteran, KARS | 🟣 Form Shell | Persetujuan penolakan RJP dari keluarga inti dan dokter; aspek legal belum terkunci. |
| **Resume Medis Pasien Pulang (Discharge Summary)**| `DischargeSummaryForm.jsx` | JCI ACC.4.2, PMK 269 | 🟣 Firestore Only | Format ringkasan pulang lengkap (diagnosa akhir, terapi pulang, kontrol); DB kosong. |

### D. Kamar Operasi & Anestesi (Surgical & Anesthesia)
| Nama Form | File Komponen | Standar / Regulasi | Status Lifecycle & Persistensi | Kesenjangan Arsitektural |
| :--- | :--- | :--- | :---: | :--- |
| **Asesmen Pra-Anestesi & Sedasi** | `PreAnesthesiaAssessmentForm.jsx` | KARS PAB.2, ASA Class | 🟣 Form Shell | Penentuan skor Mallampati, ASA I-V, riwayat puasa, rencana teknik anestesi. |
| **Informed Consent Tindakan Operasi**| `InformedConsentModal.jsx` | Permenkes 290/2008 | 🟣 Client Modal | Persetujuan/penolakan tindakan medis; belum mendukung biometric signature terenkripsi. |
| **Surgical Safety Checklist (WHO)** | `SurgicalSafetyChecklistForm.jsx` | WHO Guidelines 2009 | 🟣 Form Shell | 3 Fase: Sign In (sebelum induksi), Time Out (sebelum insisi), Sign Out (sebelum jahit). |
| **Pencatatan Anestesi Intra-Operatif**| `AimsAnesthesiaRecord.jsx` | Perdatin / AIMS Standard | 🟡 Arch Model | Lembar grafik tanda vital intra-bedah dan pemberian gas anestesi/narkotika. |
| **Pemantauan Pasca Anestesi (Aldrete)**| `AldreteScoreForm.jsx` | Aldrete Scoring System | 🟣 Form Shell | Kriteria kesiapan pindah dari ruang pemulihan PACU (Aktivitas, Respirasi, Sirkulasi, Kesadaran, Warna Kulit). |

### E. Farmasi & Pelayanan Obat
| Nama Form | File Komponen | Standar / Regulasi | Status Lifecycle & Persistensi | Kesenjangan Arsitektural |
| :--- | :--- | :--- | :---: | :--- |
| **Order Peresepan Elektronik (CPOE)** | `MedicationOrderForm.jsx` | KARS PKPO.4 | 🟣 Firestore Only | Input obat tunggal, racikan, aturan pakai, rute, dan instruksi khusus. |
| **Rekonsiliasi Obat Saat Admisi/Transfer**| `MedicationReconciliationForm.jsx` | JCI MPO.3.1 | 🟣 Form Shell | Perbandingan obat yang dibawa dari rumah dengan resep baru rawat inap. |
| **Lembar Administrasi Obat (eMAR)** | `EMARForm.jsx` | 7-Benar Obat | 🟣 Firestore Only | Verifikasi pemberian obat perawat per jam; belum terhubung ke scanner barcode gelang. |
| **Farmakovigilans Efek Samping (MESO)**| `BPOMMESOPharmacovigilanceForm.jsx` | Standar BPOM RI | 🟣 Form Shell | Form pelaporan insiden kejadian tidak diinginkan akibat obat (MESO Kuning). |

### F. Manajemen Risiko & Mutu Rumah Sakit
| Nama Form | File Komponen | Standar / Regulasi | Status Lifecycle & Persistensi | Kesenjangan Arsitektural |
| :--- | :--- | :--- | :---: | :--- |
| **Laporan Insiden Keselamatan Pasien (IKP)**| `IncidentReportForm.jsx` | KARS PMKP.9, KNKP | 🟣 Form Shell | Pelaporan KTD, KNC, KTC, KPC, dan Sentinel dalam 2x24 jam. |
| **Audit Kepatuhan Kebersihan Tangan**| `WHOHandHygieneAuditForm.jsx` | WHO 5 Moments | 🟣 Form Shell | Audit sampling kepatuhan cuci tangan petugas per ruangan/shift. |
| **Asesmen Restrain Fisik/Kimiawi** | `RestraintAssessmentForm.jsx` | JCI COP / KARS | 🟣 Form Shell | Evaluasi indikasi restrain, observasi sirkulasi ekstremitas per 2 jam. |

---

## 3. Desain Arsitektur Rekomendasi: Unified Medical Form Engine

Untuk menghentikan penulisan komponen statis yang membebani codebase dan rentan inkonsistensi data, NurseFlow harus mengadopsi **Enterprise Form Engine berbasis Skema Metadata**:

```
                       ┌───────────────────────────────────────────────┐
                       │           FORM TEMPLATE REGISTRY              │
                       │ (Schema Definitions, Versions, Field Rules)   │
                       └───────────────────────┬───────────────────────┘
                                               │
                                               ▼
┌──────────────────────┐        ┌───────────────────────────────┐        ┌──────────────────────┐
│   CLINICAL CONTEXT   │        │     DYNAMIC FORM RENDERER     │        │  SIGNATURE & LOCK    │
│ Encounter, Pasien,   ├───────►│  (Validasi Skema, Kolom       ├───────►│  Kriptografi SHA-256 │
│ DPJP, Unit Pelayanan │        │   Kondisional, Rules Engine)  │        │  Enforcement RDBMS   │
└──────────────────────┘        └──────────────┬────────────────┘        └──────────────────────┘
                                               │
                                               ▼
                                ┌───────────────────────────────┐
                                │     STANDARDIZED STORAGE      │
                                │  Tabel `clinical_documents`   │
                                │  + `clinical_document_amends` │
                                └───────────────────────────────┘
```

### 3.1. Siklus Hidup Dokumen Medis (Document State Machine)
Setiap dokumen klinis wajib mematuhi state machine hukum rekam medis:

```
 [ KOSONG / INITIATED ]
           │
           ▼
       [ DRAFT ] ◄──────────────────────────────────┐
           │                                        │ (Koreksi sebelum final)
           ▼                                        │
    [ IN_PROGRESS ] ────────────────────────────────┘
           │
           ▼
     [ COMPLETED ] (Semua field wajib terisi & lolos validasi klinis)
           │
           ▼
      [ SIGNED ]   (Ditandatangani secara digital oleh nakes berwenang)
           │
           ▼
      [ LOCKED ]   (Baris database terkunci, READ-ONLY mutlak secara RDBMS)
           │
           ▼ (Hanya jika ada revisi medis resmi)
     [ AMENDED ]   (Membuat versi revisi baru dengan riwayat alasan & audit trail)
```

### 3.2. Struktur Skema Database Form Terpadu (PostgreSQL)

```sql
-- 1. Master Definisi Template Form Medis
CREATE TABLE clinical_form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL,             -- Contoh: 'FORM_DISCHARGE_SUMMARY'
    name VARCHAR(255) NOT NULL,                    -- 'Resume Medis Pasien Pulang'
    department_id UUID,                            -- Terikat ke departemen tertentu atau NULL (Universal)
    profession_scope VARCHAR(32) NOT NULL,         -- 'DOCTOR', 'NURSE', 'PHARMACIST', 'ALL'
    encounter_type VARCHAR(32) NOT NULL,           -- 'INPATIENT', 'OUTPATIENT', 'EMERGENCY', 'ALL'
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    schema_definition JSONB NOT NULL,              -- Struktur field, type, validations, options
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Transaksi Dokumen Rekam Medis Terisi
CREATE TABLE clinical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES clinical_form_templates(id),
    template_version INTEGER NOT NULL,
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    document_status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', 
    -- 'DRAFT', 'IN_PROGRESS', 'COMPLETED', 'SIGNED', 'LOCKED', 'AMENDED', 'CANCELLED'
    form_data JSONB NOT NULL,                      -- Payload jawaban form
    author_user_id UUID NOT NULL REFERENCES users(id),
    author_role VARCHAR(64) NOT NULL,
    signed_by_user_id UUID REFERENCES users(id),
    signed_at TIMESTAMPTZ,
    signature_hash VARCHAR(256),                   -- Hash SHA-256 data + timestamp + user cert
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Riwayat Amandemen Dokumen Rekam Medis (Legal Audit Trail)
CREATE TABLE clinical_document_amendments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_document_id UUID NOT NULL REFERENCES clinical_documents(id),
    amendment_number INTEGER NOT NULL,
    reason_for_amendment TEXT NOT NULL,            -- Wajib diisi alasan klinis koreksi
    previous_form_data JSONB NOT NULL,
    amended_form_data JSONB NOT NULL,
    amended_by_user_id UUID NOT NULL REFERENCES users(id),
    amended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signature_hash VARCHAR(256) NOT NULL
);

-- Indeks Kinerja
CREATE INDEX idx_clinical_docs_encounter ON clinical_documents(encounter_id);
CREATE INDEX idx_clinical_docs_patient ON clinical_documents(patient_id);
CREATE INDEX idx_clinical_docs_status ON clinical_documents(document_status);
```

---

## 4. Rencana Transisi & Migrasi (Stage 4)

1. **Fase 1: Abstraksi Penyimpanan (`emrStorageAdapter.js`)**
   - Mengalihkan fungsi simpan di `ClinicalFormShell.jsx` dari Firebase Firestore ke backend Express endpoint `/api/v1/emr/documents`.
2. **Fase 2: Template Seeding untuk Form Kritis P1**
   - Memasukkan skema JSON untuk 4 form paling vital ke tabel `clinical_form_templates`:
     - `FORM_TRIAGE_UGD` (Triase IGD)
     - `FORM_INITIAL_ASSESSMENT` (Asesmen Awal Medis/Keperawatan)
     - `FORM_CPPT_SOAP` (Catatan Perkembangan Terintegrasi)
     - `FORM_DISCHARGE_SUMMARY` (Resume Medis Pasien Pulang)
3. **Fase 3: Penguncian Database & Penandatanganan Kriptografis**
   - Menambahkan PostgreSQL trigger `trg_prevent_locked_document_update` yang secara mutlak menolak query `UPDATE` atau `DELETE` pada baris `clinical_documents` yang memiliki status `LOCKED = TRUE`.
   - Modifikasi hanya dapat dilakukan melalui prosedur tersimpan `fn_create_document_amendment()`.
