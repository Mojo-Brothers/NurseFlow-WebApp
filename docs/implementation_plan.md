# 🏥 NurseFlow Enterprise EMR — Implementation Plan
**Berdasarkan Master Prompt + Audit Codebase**
**Status:** Awaiting Approval | **Tanggal:** 08 Agustus 2026

---

## 📋 Ringkasan Audit Codebase Existing

### ✅ Yang Sudah Ada & Berfungsi

#### Routing & Layout
| Route | Komponen | Status |
|---|---|---|
| `/emr-rj` | `OutpatientEMR.jsx` (80KB) | ✅ Berfungsi penuh |
| `/emr-ri` | `OutpatientEMR.jsx` (shared) | ⚠️ Shared dengan RJ — perlu dipisah |
| `/emr` | `EMRPage.jsx` (45KB) | ✅ Berfungsi |
| `/surgery` | `SurgeryDashboard.jsx` | ✅ Berfungsi |
| `/triage` | `TriagePage` | ✅ Berfungsi |
| `/bed-management` | `BedManagementPage` | ✅ Berfungsi |

#### State Management (Zustand)
| Store | State | Status |
|---|---|---|
| `usePatientStore` | `patients, selectedPatientId` | ✅ Berfungsi |
| `useEncounterStore` | `activeEncounters, liveContext, selectedEncounterId` | ✅ Berfungsi |
| `useAuth` | `currentUser, role` | ✅ Berfungsi |

#### EMR Service Layer
| Service | Fungsi | Status |
|---|---|---|
| `saveSoapNote()` | SOAP dengan audit trail | ✅ Berfungsi |
| `saveClinicalRecord()` | Generic clinical record | ✅ Berfungsi |
| `getPatientRecords()` | Fetch rekam medis pasien | ✅ Berfungsi |
| `triggerBillingItem()` | Auto billing post-SOAP | ✅ Berfungsi |
| `triggerPharmacyOrder()` | Auto pharmacy order | ✅ Berfungsi |
| `triggerLabOrder()` | Auto lab order | ✅ Berfungsi |

#### 50 Form Komponen EMR (di `/emr/components/`)
| Komponen | Tipe | Status |
|---|---|---|
| `CPPTWorkspace.jsx` (25KB) | CPPT/SOAP workspace | ✅ Lengkap |
| `CPOEWorkspace.jsx` (44KB) | Order Entry (Medication/Lab/Rad) | ✅ Lengkap |
| `ClinicalModuleModal.jsx` (80KB) | Modal semua modul klinis | ✅ Lengkap |
| `PatientCarePanel.jsx` (56KB) | Panel perawatan pasien | ✅ Lengkap |
| `PatientSearchModal.jsx` (44KB) | Advanced patient search | ✅ Lengkap |
| `UgdAssessmentForm.jsx` (71KB) | Form asesmen IGD | ✅ Lengkap |
| `DigitalInformedConsent.jsx` (28KB) | Consent digital | ✅ Lengkap |
| `WHOLabourCareGuideForm.jsx` (24KB) | Partograf & persalinan | ✅ Lengkap |
| `BradenScaleForm.jsx` (22KB) | Braden scale dekubitus | ✅ Lengkap |
| `ICUAdmissionCriteriaForm.jsx` (25KB) | Kriteria masuk ICU | ✅ Lengkap |
| `SepsisSOFACriteriaForm.jsx` (14KB) | qSOFA screening | ✅ Lengkap |
| `PEWSForm.jsx` (15KB) | Pediatric EWS | ✅ Lengkap |
| `MEOWSForm.jsx` (20KB) | Obstetric EWS | ✅ Lengkap |
| `RestraintAssessmentForm.jsx` (16KB) | Asesmen restraint | ✅ Lengkap |
| `DischargeReadinessForm.jsx` (15KB) | Kesiapan pasien pulang | ✅ Lengkap |
| `SurgicalSafetyChecklistForm.jsx` (16KB) | WHO surgical safety | ✅ Lengkap |
| `BloodTransfusionForm.jsx` (14KB) | Transfusi darah | ✅ Lengkap |
| `MedicalCertificateCauseOfDeathForm.jsx` | Sertifikat kematian | ✅ Lengkap |
| `AldreteScoreForm.jsx` (21KB) | Aldrete recovery score | ✅ Lengkap |
| `ICUDischargeCriteriaForm.jsx` (14KB) | Kriteria keluar ICU | ✅ Lengkap |
| `TransferInternalForm.jsx` (12KB) | Transfer internal SBAR | ✅ Lengkap |
| `PatientEducationForm.jsx` (12KB) | Edukasi pasien | ✅ Lengkap |
| `InitialAssessment.jsx` (19KB) | Asesmen awal | ✅ Lengkap |
| `NutritionScreeningForm.jsx` (8KB) | Skrining gizi | ✅ Lengkap |
| `WHOChildAnthropometryForm.jsx` (17KB) | Antropometri anak | ✅ Lengkap |
| `BPOMMESOPharmacovigilanceForm.jsx` | Pelaporan MESO BPOM | ✅ Lengkap |
| `PreAnesthesiaAssessmentForm.jsx` | Pre-anestesi | ⚠️ Ringkas/partial |
| `MedicationReconciliationForm.jsx` | Rekonsiliasi obat | ⚠️ Ringkas/partial |
| `DNRForm.jsx` (7KB) | Do Not Resuscitate | ⚠️ Ringkas/partial |
| `PAPSForm.jsx` (13KB) | Surat AMA | ✅ Lengkap |
| `WHOHandHygieneAuditForm.jsx` | Audit cuci tangan | ✅ Lengkap |
| `SoapNoteModal.jsx` (15KB) | SOAP Note Modal | ✅ Lengkap |
| `AdvancedPatientSearchBar.jsx` (15KB) | Search bar advanced | ✅ Lengkap |
| `A4Layout.jsx` (19KB) | Print layout A4 | ✅ Lengkap |
| `EarlyWarningSystem.jsx` (8KB) | Early warning scores | ✅ Berfungsi |
| `LabAlertSystem.jsx` (11KB) | Lab alert critical | ✅ Berfungsi |
| `AISummaryBox.jsx` (9KB) | AI clinical summary | ✅ Berfungsi |
| `SignaturePadEndpoint.jsx` (11KB) | Digital signature pad | ✅ Berfungsi |

#### UI Components Reusable (`/components/ui/`)
| Komponen | Status |
|---|---|
| `ClinicalCard.jsx` | ✅ Tersedia |
| `ClinicalAlertBanner.jsx` | ✅ Tersedia |
| `DataTable.jsx` | ✅ Tersedia |
| `StatusBadge.jsx` | ✅ Tersedia |
| `SegmentedTabs.jsx` | ✅ Tersedia |
| `FilterToolbar.jsx` | ✅ Tersedia |
| `OceanicTealLoadingSpinner.jsx` | ✅ Tersedia |
| `PillSearchBar.jsx` | ✅ Tersedia |
| `TablePagination.jsx` | ✅ Tersedia |
| `button, card, input, textarea, select, checkbox, radio-group` | ✅ Tersedia |

---

### ❌ Yang Belum Ada (Gap Analysis)

#### Form Klinis Kritis yang Hilang
| Form | Prioritas | Kategori |
|---|---|---|
| **DPJP Assignment Form** | 🔴 Sangat Tinggi | DPJP Management |
| **Care Team / PPA Management** | 🔴 Sangat Tinggi | Tim Asuhan |
| **Physical Examination Form** | 🔴 Sangat Tinggi | Asesmen Medis |
| **Medical History / Anamnesis** | 🔴 Sangat Tinggi | Asesmen Medis |
| **Inpatient Admission Note** | 🔴 Sangat Tinggi | Rawat Inap |
| **Daily Progress Note (CPPT Rawat Inap)** | 🔴 Sangat Tinggi | Rawat Inap |
| **Nursing Daily Assessment** | 🔴 Tinggi | Keperawatan |
| **Nursing Handover** | 🔴 Tinggi | Keperawatan |
| **Clinical Care Plan** | 🔴 Tinggi | Perencanaan |
| **Discharge Summary** | 🔴 Tinggi | Rawat Inap |
| **Consultation Request/Response** | 🟡 Sedang | Dokter Konsulen |
| **Referral Letter** | 🟡 Sedang | Rujukan |
| **Fluid Balance / I&O Chart** | 🟡 Sedang | ICU/Rawat Inap |
| **Medication Administration Record (MAR)** | 🟡 Sedang | Farmasi |
| **Wound Assessment Form** | 🟡 Sedang | Luka |
| **Surgical History Form** | 🟡 Sedang | Riwayat Bedah |
| **Advance Directive / DNR (lengkap)** | 🟡 Sedang | Legal |

#### Arsitektur yang Hilang
| Komponen Arsitektur | Prioritas |
|---|---|
| **EMR Rawat Inap terpisah** (saat ini share dengan RJ) | 🔴 Sangat Tinggi |
| **Patient Clinical Timeline** (unified timeline) | 🔴 Sangat Tinggi |
| **DPJP & PPA Entity Management** | 🔴 Sangat Tinggi |
| **Clinical Context Ribbon Enhancement** | 🔴 Sangat Tinggi |
| **Auto-save (draft persistence)** | 🟡 Sedang |
| **Document versioning** | 🟡 Sedang |
| **Form state management** (Draft/Saved/Pending Sig) | 🟡 Sedang |

---

## ⚠️ User Review Required

> [!IMPORTANT]
> **EMR Rawat Inap saat ini menggunakan komponen yang sama dengan Rawat Jalan** (`OutpatientEMR.jsx`).
> Rencana ini akan membuat halaman EMR Rawat Inap yang **terpisah namun berbagi komponen reusable** yang sama.
> Ini adalah perubahan arsitektur terbesar yang memerlukan konfirmasi Anda.

> [!WARNING]
> **`OutpatientEMR.jsx` sudah 80KB.** File ini sangat besar dan menyulitkan pemeliharaan.
> Plan ini akan **tidak merestrukturisasi file ini secara destruktif**, melainkan hanya menambahkan fitur baru secara incremental.

> [!NOTE]
> **Urutan implementasi akan mengikuti prinsip "least disruption first".**
> Setiap fase hanya menambah, tidak menghapus atau mengubah yang sudah berfungsi.

---

## 🗺️ Rencana Implementasi 12 Fase

### FASE 1 — Reusable Architecture Foundation
**Tujuan:** Bangun fondasi komponen reusable yang akan digunakan semua form  
**Estimasi:** 1 sesi  
**Yang akan dibuat:**
- `ClinicalPatientHeader.jsx` — Enhanced patient context ribbon (DPJP, Penjamin, No. Kunjungan, Safety Flags lengkap)
- `ClinicalFormShell.jsx` — Shell wrapper untuk semua form klinis (dengan sticky action bar, form state, auto-save indicator)
- `ClinicalSection.jsx` — Section/subsection container untuk grouping field
- `ClinicalTimeline.jsx` — Unified timeline viewer

**Tidak ada yang diubah pada existing code.**

---

### FASE 2 — DPJP & Care Team Entity
**Tujuan:** DPJP bukan hanya teks, melainkan entitas klinis  
**Estimasi:** 1 sesi  
**Yang akan dibuat:**
- `DPJPAssignmentForm.jsx` — Form penugasan DPJP (Assignment, History, Handover)
- `CareTeamManager.jsx` — Manajemen Care Team & PPA (semua anggota tim)
- `dpjp.service.js` — Service layer untuk DPJP & PPA

---

### FASE 3 — Enhanced Patient Context Ribbon
**Tujuan:** Isi area kosong di header EMR (yang Anda tandai sebelumnya)  
**Estimasi:** Cepat (< 1 sesi)  
**Yang akan dimodifikasi:**
- `OutpatientEMR.jsx` — Tambah ke `col-span-8` kanan: No. Kunjungan, Dokter, Poli, Penjamin, Triage, Status

---

### FASE 4 — Anamnesis & Physical Examination
**Tujuan:** Form klinis medis fundamental yang belum ada  
**Estimasi:** 1 sesi  
**Yang akan dibuat:**
- `AnamnesisForm.jsx` — Chief Complaint, HPI, ROS, PMH, Surgical History, Family History, Social History
- `PhysicalExaminationForm.jsx` — Semua sistem organ, structured exam findings

---

### FASE 5 — EMR Rawat Inap (Halaman Terpisah)
**Tujuan:** Buat EMR Rawat Inap yang proper, terpisah dari RJ  
**Estimasi:** 2 sesi  
**Yang akan dibuat:**
- `InpatientEMR.jsx` — Halaman EMR RI baru, share komponen dengan RJ
- Sidebar Rawat Inap: Admission Note, Daily CPPT, Nursing Assessment, Care Plan, Discharge Summary
- Module groups berbeda dari RJ

**Yang akan dimodifikasi:**
- `App.jsx` — `/emr-ri` dialihkan ke `InpatientEMR.jsx`

---

### FASE 6 — Clinical Timeline (Unified)
**Tujuan:** Unified patient journey timeline  
**Estimasi:** 1 sesi  
**Yang akan dibuat:**
- `ClinicalTimeline.jsx` — Timeline semua aktivitas klinis (SOAP, nursing, lab, medication, procedure)
- Filter: All / Doctor / Nursing / Lab / Radiology / Medication / Procedure

---

### FASE 7 — Inpatient Forms (Admission + Daily)
**Tujuan:** Form khas rawat inap  
**Estimasi:** 1-2 sesi  
**Yang akan dibuat:**
- `AdmissionNoteForm.jsx` — Catatan awal rawat inap
- `InpatientDailyProgressForm.jsx` — CPPT harian rawat inap
- `NursingDailyAssessmentForm.jsx` — Asesmen keperawatan harian
- `NursingHandoverForm.jsx` — Handover keperawatan (SBAR)
- `ClinicalCarePlanForm.jsx` — Rencana asuhan terintegrasi
- `DischargeSummaryForm.jsx` — Resume medis keluar

---

### FASE 8 — Consultation & Referral
**Tujuan:** Alur konsultasi dan rujukan  
**Estimasi:** 1 sesi  
**Yang akan dibuat:**
- `ConsultationRequestForm.jsx` — Permintaan konsultasi
- `ConsultationResponseForm.jsx` — Jawaban konsulen
- `ReferralLetterForm.jsx` — Surat rujukan keluar

---

### FASE 9 — Document Management & Versioning
**Tujuan:** Setiap dokumen memiliki version, status, dan signature yang proper  
**Estimasi:** 1 sesi  
**Yang akan dibuat:**
- `DocumentVersionPanel.jsx` — Panel versi dokumen
- `DocumentStatusBadge.jsx` — Status badge (Draft/Signed/Amended)
- Enhancement pada `emr.service.js` — tambah versioning fields

---

### FASE 10 — Auto-save & Form State
**Tujuan:** Draft tidak hilang, user tahu status form  
**Estimasi:** 1 sesi  
**Yang akan dibuat:**
- `useFormAutoSave.js` — Custom hook untuk auto-save ke localStorage
- `FormStateIndicator.jsx` — UI indikator (Saving... / Saved 10:42:31 / Unsaved Changes)

---

### FASE 11 — Clinical Validation & Safety
**Tujuan:** Validasi klinis (range, conditional, clinical safety alerts)  
**Estimasi:** 1 sesi  
**Yang akan dibuat:**
- `useClinicalValidation.js` — Hook validasi klinis
- `ClinicalSafetyAlert.jsx` — Alert warning (BP tinggi, nilai kritis, drug-allergy)
- Range validation: SpO2 0-100%, HR 20-250bpm, Temp 30-45°C, dll

---

### FASE 12 — UX Polish & Print
**Tujuan:** Polish keseluruhan UX dan print layout  
**Estimasi:** 1 sesi  
**Yang akan dikerjakan:**
- Keyboard navigation antar field
- Print-ready layout untuk semua form kritis
- Responsive refinement (Desktop/Laptop/Tablet)

---

## 📐 Prinsip Implementasi (NON-NEGOTIABLE)

1. ✅ **Tidak merusak yang sudah ada** — Tambah saja, jangan ganti
2. ✅ **Ocean Teal tetap identitas utama** — Tidak ubah color system
3. ✅ **Reusable first** — Satu komponen, banyak penggunaan
4. ✅ **Incremental** — Satu fase, satu PR, satu tes
5. ✅ **Patient Safety first** — Allergy & safety flags selalu visible
6. ✅ **Form adalah clinical workspace** — Bukan form biasa
7. ✅ **Setiap form punya WHO/WHAT/WHEN/WHERE/STATUS/SIGNATURE**

---

## 🚀 Rekomendasi Urutan Mulai

Saya rekomendasikan mulai dari **Fase 3** (paling cepat, langsung terlihat hasilnya — melengkapi area kosong di header EMR yang Anda tandai tadi), lalu **Fase 1** (fondasi), lalu **Fase 2** (DPJP), lalu **Fase 5** (EMR Rawat Inap terpisah).

---

## 🤔 Open Questions

1. **Apakah EMR Rawat Inap harus benar-benar halaman baru, atau cukup mode berbeda di `OutpatientEMR.jsx`?**
   - Rekomendasi saya: Halaman baru, lebih scalable.

2. **Mulai dari fase mana yang paling mendesak untuk Anda?**
   - Rekomendasi saya: Fase 3 → 1 → 2 → 5

3. **Apakah DPJP perlu terintegrasi dengan data staf dari `StaffManagementPage`?**
   - Ini akan memengaruhi arsitektur `dpjp.service.js`

4. **Auto-save: apakah simpan ke localStorage saja, atau perlu simpan ke Firestore sebagai draft?**
   - Rekomendasi: localStorage dulu (lebih cepat, tidak perlu koneksi)
