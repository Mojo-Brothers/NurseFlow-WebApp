# MASTER PROMPT — ENTERPRISE EMR RAWAT JALAN & RAWAT INAP
## NurseFlow — Ocean Teal Clinical Documentation System

Anda bertindak sebagai **Principal Healthcare UX Architect**, **Senior Clinical Informatics Specialist**, **Medical Record Specialist**, dan **Enterprise Full-Stack Engineer**.

Saya sedang **MENGEMBANGKAN** aplikasi HIS/EMR NurseFlow yang **SUDAH BERJALAN**, bukan membuat aplikasi baru dari nol.

Fokus pengembangan saat ini adalah:
1. EMR Rawat Jalan
2. EMR Rawat Inap
3. Clinical Documentation
4. Medical Record Forms
5. Patient Clinical Timeline
6. DPJP & PPA Management
7. Clinical Workflow
8. Electronic Medical Record Documentation

Saya SUDAH membuat sebagian formulir.

Tugas Anda adalah:
> **MELANJUTKAN DAN MENYEMPURNAKAN IMPLEMENTASI YANG SUDAH ADA** tanpa merusak struktur, desain, routing, komponen, data, dan fitur yang sudah bekerja. Jangan menganggap aplikasi ini kosong.

---

## 01. ATURAN UTAMA — JANGAN MERUSAK APLIKASI EXISTING

SEBELUM melakukan perubahan:
- Inspect seluruh struktur project
- Inspect routing
- Inspect component architecture
- Inspect existing EMR pages
- Inspect existing form components
- Inspect database/schema
- Inspect API/service layer
- Inspect state management
- Inspect validation
- Inspect existing design system
- Inspect existing reusable components

Identifikasi:
- Apa yang sudah tersedia
- Apa yang sudah berfungsi
- Apa yang setengah jadi
- Apa yang hanya UI mockup
- Apa yang belum tersedia

**PRINSIP PENTING**:
- JANGAN membuat duplicate component jika reusable component sudah tersedia.
- JANGAN membuat halaman baru jika halaman existing dapat dikembangkan.
- JANGAN mengganti framework.
- JANGAN mengganti design system.
- JANGAN mengganti warna utama aplikasi.
- JANGAN melakukan redesign total.
- JANGAN menghapus fitur existing hanya karena menurut Anda desainnya kurang bagus.
- Jika diperlukan perubahan besar pada architecture, lakukan secara incremental.

---

## 02. IDENTITAS VISUAL NURSEFLOW

Pertahankan identitas visual aplikasi:
**PRIMARY DESIGN LANGUAGE**: `OCEAN TEAL`

Karakter visual:
- Medical
- Clean
- Modern
- Calm
- Professional
- Premium
- Trustworthy
- Enterprise
- Clinical
- Highly readable

Gunakan Ocean Teal sebagai identitas utama.

Hindari desain:
- Terlalu colorful / neon
- Gaming style / childish
- Excessive gradients / glassmorphism berlebihan
- Shadow berlebihan
- Dashboard yang terlalu ramai

Prioritaskan:
- White surface
- Subtle gray background
- Ocean Teal accent
- Teal active state
- Clear typography & strong hierarchy
- Clinical readability

---

## 03. EMR BUKAN FORM BIASA

Jangan membuat formulir seperti: `Label Input Label Input Label Input` secara panjang tanpa struktur.
EMR harus terasa seperti **clinical workspace**.

Gunakan:
- Section / Subsection
- Clinical Card
- Smart Input & Segmented Control
- Checkbox Group & Radio Group
- Date/Time Picker & Searchable Select
- Autocomplete & Multi-select
- Numeric Input & Text Area
- Rich Clinical Note & Table
- Timeline & Clinical Summary
- Alert & Status Badge
- Decision Support
- Expandable / Collapsible Section

---

## 04. PRINSIP UX FORM

Form harus:
- **FAST**: Dokter/perawat dapat mengisi dengan cepat.
- **MINIMAL CLICK**: Kurangi jumlah klik.
- **KEYBOARD FRIENDLY**: Field dapat dinavigasi menggunakan keyboard.
- **CONTEXT AWARE**: Tampilkan field berdasarkan kondisi pasien.
- **PROGRESSIVE DISCLOSURE**: Jangan tampilkan semua field sekaligus (gunakan "More Details", "Advanced", atau "Additional Information").

---

## 05. JANGAN MEMBUAT FORMULIR TERLALU PANJANG

Gunakan grouping.
Contoh:

```
PATIENT ASSESSMENT
├── Chief Complaint
├── History of Present Illness
├── Review of Systems
├── Past Medical History
├── Medication
├── Allergy
├── Family History
└── Social History

PHYSICAL EXAMINATION
├── General
├── Vital Signs
├── Head
├── Neck
├── Chest
├── Cardiovascular
├── Abdomen
├── Extremities
└── Neurological
```
Dengan demikian user tidak melihat "tembok input".

---

## 06. HEADER EMR

Setiap halaman EMR harus memiliki **Patient Context Header**.
Minimal:
`Patient Name` • `MRN` • `Age` • `Sex` • `DOB` • `Allergy` • `Blood Type` • `Encounter Visit Type` • `Department` • `Room/Bed` • `DPJP` • `Attending Team Status`

Contoh:
PATIENT: Robby Viory Fansya | MRN: MR-000123 | Male • 34 Years | DOB: 27 Nov 1991 | ALLERGY: NKDA | ENCOUNTER: Rawat Inap | ROOM: ICU 02 • Bed 04 | DPJP: dr. Example, Sp.PD

---

## 07. PATIENT SAFETY

Informasi critical harus selalu mudah terlihat.
Contoh:
- `ALLERGY: ⚠ Penicillin — Anaphylaxis`
- `FALL RISK HIGH`
- `ISOLATION AIRBORNE`
- `DNR ACTIVE`

Gunakan visual warning yang profesional. Jangan menggunakan warna merah untuk semua hal. Merah hanya untuk:
- Critical / Emergency
- Severe allergy
- Critical result
- Serious safety warning

---

## 08. ALUR WORKFLOW RAWAT JALAN

```
PATIENT REGISTRATION → QUEUE → VITAL SIGNS → TRIAGE / INITIAL ASSESSMENT → DOCTOR ASSESSMENT
  ↓
ANAMNESIS → PHYSICAL EXAMINATION → VITAL SIGNS → ASSESSMENT → DIAGNOSIS → PLAN
  ↓
ORDER (Laboratory | Radiology | Medication | Procedure | Consultation)
  ↓
TREATMENT → PRESCRIPTION → EDUCATION → FOLLOW UP → DISCHARGE / COMPLETE ENCOUNTER
```

---

## 09. ALUR WORKFLOW RAWAT INAP

```
ADMISSION → INITIAL ASSESSMENT → DPJP ASSIGNMENT → CARE TEAM → NURSING ASSESSMENT → MEDICAL ASSESSMENT
  ↓
DIAGNOSIS → CARE PLAN → DAILY CPPT
  ↓
ORDERS (Medication | Laboratory | Radiology | Procedure | Consultation | Diet)
  ↓
MEDICATION ADMINISTRATION → NURSING CARE → PROGRESS MONITORING → TRANSFER → PROCEDURE / SURGERY
  ↓
DAILY REASSESSMENT → DISCHARGE PLANNING → DISCHARGE SUMMARY → FOLLOW UP
```

---

## 10. DPJP HARUS MENJADI ENTITAS KLINIS

Jangan hanya menampilkan teks "DPJP: dr. X". DPJP harus memiliki:
- Practitioner ID & Doctor ID
- Employee ID
- Specialty & Subspecialty
- Department
- Assignment Date & Time
- End Date & Status
- Assignment Reason
- Previous DPJP & Replacement DPJP

Sistem harus dapat menampilkan **CURRENT DPJP** dan **DPJP HISTORY**.

---

## 11. PPA / CARE TEAM

Sediakan Care Team terintegrasi:
- DPJP & DPJP Pengganti
- Dokter Konsulen & Dokter Pelaksana
- Perawat Penanggung Jawab & Perawat Primer
- Bidan, Apoteker, Ahli Gizi, Fisioterapis, Psikolog, dll.

Setiap anggota memiliki: `Role`, `Practitioner`, `Profession`, `Department`, `Start Date`, `End Date`, `Status`.

---

## 12. FORMULIR KLINIS MODULAR

Kategori formulir:
- **GENERAL**: SOAP, CPPT, Progress Note, Medical Assessment, Physical Examination, Diagnosis, Care Plan.
- **NURSING**: Nursing Assessment, Nursing Diagnosis, Nursing Care Plan, Nursing Intervention, Nursing Evaluation, Nursing Handover, Fall Risk, Braden Scale, Pain Assessment.
- **MEDICAL**: Admission Note, Daily Progress Note, Consultation Note, Discharge Summary, Medical Resume.
- **PROCEDURE**: Procedure Note, Operative Report, Anesthesia Record, Post Procedure Note.
- **DIAGNOSTIC**: Laboratory Order, Radiology Order, Diagnostic Report.
- **MEDICATION**: Prescription, Medication Order, Medication Reconciliation, Medication Administration.
- **SPECIALTY**: Internal Medicine, Cardiology, Neurology, Surgery, Orthopedic, Pediatric, ObGyn, Ophthalmology, ENT, Dermatology, Psychiatry, Pulmonology, Urology, Oncology, Nephrology, Gastroenterology, Rehabilitation, Dental.

---

## 13. SMART FORM & CONDITIONAL LOGIC

Form harus mampu melakukan logic kondisional:
- Jika `Pregnant = YES` → tampilkan Gravida, Para, Abortus, LMP, EDD, Gestational Age, Pregnancy Risk.
- Jika `Allergy = YES` → tampilkan Substance, Reaction, Severity, Onset, Criticality.
- Jika `Pain = YES` → tampilkan Pain Score, Location, Character, Duration, Aggravating & Relieving Factors.

---

## 14. AUTO SAVE & STATE

Implementasikan: `Draft`, `Auto Save`, `Saved`, `Saving...`, `Unsaved Changes`.
Jika browser crash atau user berpindah halaman, draft tidak boleh hilang.

---

## 15. FORM VALIDATION

Validasi terdiri dari: Required, Optional, Conditional Required, Format Validation, Range Validation, Clinical Validation.
Contoh: SpO2 (0-100%), Heart Rate (20-250 bpm), Temperature (30-45°C). Validasi backend juga wajib.

---

## 16. CLINICAL DECISION SUPPORT (CDS)

Gunakan clinical warning ringan (contoh: BP 190/120 → High BP Warning, Potassium 2.4 → Critical Result). JANGAN membuat diagnosis otomatis atau menggantikan keputusan dokter.

---

## 17. CPPT TIMELINE & DOCUMENT VERSIONING

- Tampilan timeline kronologis terurut waktu.
- Versioning: Version 1, Version 2, Amendment. Tidak boleh menghapus historical record secara sembarangan.

---

## 18. DIGITAL SIGNATURE & AUDIT TRAIL

- Digital Signature: Author, Profession, Role, Timestamp, Verification Status.
- Status: `Draft`, `Pending Signature`, `Signed`, `Amended`, `Cancelled`.
- Audit Trail: Track Create, View, Update, Sign, Amend, Print, Download, Export, Delete, Cancel. Simpan User, Role, Timestamp, IP, Device, Action, Record ID, Old Value, New Value, Reason.

---

## 19. FORM LAYOUT & STICKY ACTION BAR

- Desktop-First Layout: Left (Patient Context/Navigation), Center (Clinical Form), Right (Clinical Summary/Timeline/Orders).
- Sticky Bottom Action Bar: `[Save Draft]`, `[Save & Continue]`, `[Sign & Finalize]`, `[Cancel]`. Untuk dokumen final: `[Print]`, `[Export PDF]`, `[Amend]`.

---

## 20. ERROR HANDLING & DATA MODEL

- Error harus actionable.
- Data Model konsisten: Patient, Encounter, Episode of Care, Practitioner, DPJP, PPA, Department, Location, Diagnosis, Order, Procedure, Document, Signature, Audit Trail.

---

## 21. SEARCH, QUICK ACCESS & RBAC

- Command System: Search Patient, Encounter, Document, Diagnosis, Medication, Order, Practitioner.
- RBAC: Akses berbasis role (Doctor, Nurse, Pharmacist, Radiologist, Medical Record, Admin). Backend authorization wajib.
- Privacy: VIP / Restricted / Sensitive Record / Break Glass.

---

## 22. METADATA & STRUKTUR DOKUMEN MEDIS (44 KATEGORI)

1. Dokumen Registrasi & Identifikasi
2. Dokumen Rawat Jalan
3. Dokumen IGD
4. Dokumen Rawat Inap
5. Dokumen DPJP & PPA
6. Dokumen Keperawatan
7. Dokumen Kebidanan
8. Dokumen Bayi / Neonatal
9. Dokumen Anestesi
10. Dokumen Operasi
11. Dokumen ICU / HCU
12. Dokumen Laboratorium
13. Dokumen Radiologi
14. Dokumen DICOM / Imaging
15. Dokumen Farmasi & Obat
16. Dokumen Transfusi
17. Dokumen Rehabilitasi
18. Dokumen Gizi
19. Dokumen Psikologi / Psikiatri
20. Dokumen Infeksi & IPC
21. Dokumen Luka
22. Dokumen Reproduksi / OBGYN
23. Dokumen Pediatri
24. Dokumen Dental
25. Dokumen Dialisis
26. Dokumen Onkologi
27. Dokumen Paliatif
28. Dokumen Consent & Legal
29. Dokumen Rujukan & Transfer
30. Dokumen Discharge
31. Dokumen Sertifikat
32. Dokumen Kematian
33. Dokumen Forensik
34. Dokumen Case Management
35. Dokumen Patient Safety
36. Dokumen Mutu & Klinis
37. Dokumen Medical Record External
38. Dokumen Pasien Digital
39. Dokumen Administrasi Pelayanan
40. Dokumen Khusus
41. Document Metadata (Document ID, Patient ID, MRN, Encounter ID, Version, Status, Author, Digital Signature)
42. Document Version & Amendment
43. Medical Record Audit
44. Document Relationship

---

## FINAL OBJECTIVE

Saya ingin NurseFlow menjadi:
> **A complete, scalable, clinically safe, auditable, user-friendly Enterprise EMR for Indonesian hospitals with international-grade UX and architecture.**

Fokus utama:
`PATIENT` → `ENCOUNTER` → `EPISODE` → `DPJP` → `PPA` → `DOCUMENT` → `ORDER` → `RESULT` → `TREATMENT` → `CARE PLAN` → `PROGRESS` → `DISCHARGE` → `LONGITUDINAL RECORD`

Setiap data harus mempunyai:
`WHO` → `WHAT` → `WHEN` → `WHERE` → `WHY` → `STATUS` → `SIGNATURE` → `AUDIT TRAIL`
