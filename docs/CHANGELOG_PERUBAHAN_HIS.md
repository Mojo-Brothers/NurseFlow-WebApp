# CATATAN PERUBAHAN & LOG UPDATE SISTEM HIS (CHANGELOG)
## NurseFlow Enterprise Hospital Information System

Dokumen ini adalah **catatan resmi riwayat perubahan dan update sistem HIS** (baik skala kecil, menengah, maupun besar) yang diperbarui secara berkesinambungan menggunakan **Bahasa Indonesia**.

---

## 📌 ATURAN PEMATUHAN CATATAN (LOGGING DIRECTIVE)
> 1. Setiap penambahan fitur, perubahan UI/UX, perbaikan bug (*fix*), refactoring, maupun pembaruan infrastruktur/dokumentasi **WAJIB** dicatat di dokumen ini.
> 2. Format pencatatan menggunakan urutan kronologis terbalik (paling baru di atas).
> 3. Kategori update:
>    - `[MAJOR]` Transformasi besar, pembuatan modul baru, atau restrukturisasi arsitektur.
>    - `[FEATURE]` Penambahan fitur klinis, form baru, atau alur kerja baru.
>    - `[ENHANCEMENT]` Peningkatan performa, optimasi UI/UX, perapihan komponen.
>    - `[FIX]` Perbaikan bug, penanganan exception, atau perbaikan kebocoran data/memori.
>    - `[DOCS]` Perubahan dokumentasi, SRS, atau panduan arsitektur.
>    - `[CHORE]` Pembersihan berkas, restrukturisasi folder, atau skrip pembantu.

---

## 📅 LOG RIWAYAT PERUBAHAN (CHRONOLOGICAL UPDATE LOG)

### 🟢 [09 AGUSTUS 2026] — Fix Patient Context Switcher & Search Modal Selection Override Bug

**Kategori:** `[FIX]` `[ENHANCEMENT]`  
**Status:** Completed  
**Komponen Terdampak:** `src/modules/emr/pages/OutpatientEMR.jsx`, `src/modules/emr/pages/InpatientEMR.jsx`, `src/modules/emr/components/PatientSearchModal.jsx`

#### Detail Perbaikan:
* **`[ROOT CAUSE FIX 1]` Eliminasi Hardcoded Patient Override Effect:** Menghapus efek `useEffect` di [OutpatientEMR.jsx](file:///c:/Users/Mojo/NurseFlow-WebApp/src/modules/emr/pages/OutpatientEMR.jsx) yang sebelumnya memaksa memanggil `selectPatient('demo-patient-dewi')` setiap kali daftar pasien di-fetch, sehingga menimpa (*override*) pilihan pasien yang diklik pengguna di modal/bar pencarian.
* **`[ROOT CAUSE FIX 2]` Pemetaan Parameter `onSelect` Modal Pencarian:** Memperbaiki handler `onSelect` di [OutpatientEMR.jsx](file:///c:/Users/Mojo/NurseFlow-WebApp/src/modules/emr/pages/OutpatientEMR.jsx#L1371) dan [InpatientEMR.jsx](file:///c:/Users/Mojo/NurseFlow-WebApp/src/modules/emr/pages/InpatientEMR.jsx#L443) agar mampu menangani parameter string ID (`item.patientId`) maupun objek pasien (`selected.id` / `selected.patientId`) sehingga `selectPatient(targetId)` tidak lagi memanggil `undefined`.
* **`[ENHANCEMENT]` Dukungan Polimorfik `PatientSearchModal.jsx`:** Memperbarui callback `onSelect` agar melewatkan `(patientId, encounterId, item)` secara aman untuk seluruh konsumen modul EMR.

---

### 🟢 [09 AGUSTUS 2026] — Integration of Clinical Dashboard & Analytics Seeder to Dummy Data Management Hub

**Kategori:** `[FEATURE]` `[ENHANCEMENT]`  
**Status:** Completed & Integrated  
**Komponen Terdampak:** `src/modules/admin/pages/DummyDataManagementPage.jsx`, `src/modules/dashboard/services/dashboard.service.js`, `src/core/services/analytics.service.js`

#### Detail Pembaruan:
* **`[FEATURE]` Otomatisasi Seeder Live Clinical Dashboard:** Mengintegrasikan pembuatan dokumen Firestore `system_metrics/main_facility`, `triage_logs`, `audit_logs`, `encounters` (status `ACTIVE`), dan `beds` langsung ke dalam fungsi eksekusi *Smart Multi-Inject Generator* di [DummyDataManagementPage.jsx](file:///c:/Users/Mojo/NurseFlow-WebApp/src/modules/admin/pages/DummyDataManagementPage.jsx).
* **`[ADDED]` Dedicated Action Button di Admin Hub:** Menambahkan tombol terdedikasi `Inject Clinical Dashboard & Analytics` warna ungu di header Admin Master Data Hub untuk injeksi cepat metrik dashboard & antrean triase real-time tanpa perlu membuka `DashboardPage`.
* **`[ENHANCEMENT]` Sinkronisasi Dual-Layer (Firestore + LocalStorage):** Menjamin bahwa Live Dashboard, Executive Analytics, dan fallback mode offline menerima pembaruan data metrik makro (BOR %, Ventilator, ESI Level 1-3) dan riwayat triase secara simultan.

---

### 🟢 [09 AGUSTUS 2026] — Fix Patient Detail Side Inspector & Admin Generator Property Mapping

**Kategori:** `[FIX]` `[ENHANCEMENT]`  
**Status:** Completed  
**Komponen Terdampak:** `src/modules/emr/components/PatientDetailDrawerModal.jsx`, `src/modules/admin/pages/DummyDataManagementPage.jsx`, `src/core/demoData.js`

#### Detail Perbaikan:
* **`[ROOT CAUSE FIX]` Penyesuaian Jalur Properti Data Pasien:** Generator Dummy Admin menyimpan alamat dan kontak pada skema `domicile_address.full_address`, `ktp_address.full_address`, `domicile_address.city`, `domicile_address.province`, dan `primary_phone`. `PatientDetailDrawerModal.jsx` kini secara komprehensif membaca seluruh skema tersebut.
* **`[ENHANCEMENT]` Inisialisasi Top-Level Fields:** Menambahkan properti top-level `phone`, `address`, `city`, `province`, `emergency_name`, `emergency_phone` pada objek pasien baru di `DummyDataManagementPage.jsx` dan `demoData.js` untuk kompatibilitas 100% antar-modul.
* **`[ENHANCEMENT]` Export Demo Data Terhubung:** Meng-export 100 data demo pasien tergenerasi (`DEMO_PATIENTS`) untuk cadangan offline di `demoData.js`.

---

### 🟢 [09 AGUSTUS 2026] — Synchronize Remote & Enterprise EMR Phase 1-8 Rollout

**Kategori:** `[MAJOR]` `[FEATURE]` `[DOCS]`  
**Status:** Successfully Deployed & Integrated to `main`  
**Git Commit Hash:** `305a3dd` (Fast-forwarded from `55f68a9`)

#### 1. Transformasi Enterprise EMR (Fase 1–8 JCI Accredited)
* **`[ADDED]` Modul Workspace Rekam Medis (EMR Pages):**
  * `src/modules/emr/pages/InpatientEMR.jsx` — Halaman rekam medis rawat inap terdedikasi berstandar JCI dengan sidebar modul terstruktur (Admisi, CPPT, Keperawatan, Care Plan, Discharge).
  * `src/modules/emr/pages/OutpatientEMR.jsx` — Pembaruan workspace rawat jalan dengan integrasi cepat untuk form klinis terpadu.
* **`[ADDED]` Form & Komponen Klinis Dokter / Paramedis:**
  * `src/modules/emr/components/AnamnesisForm.jsx` — Form Anamnesis terintegrasi (Keluhan Utama, RPS, RPD, RPK, Alergi).
  * `src/modules/emr/components/PhysicalExaminationForm.jsx` — Form Pemeriksaan Fisik Lengkap (Head-to-Toe, Tanda Vital, Systemic Review).
  * `src/modules/emr/components/AdmissionNoteForm.jsx` — Catatan Masuk Rawat Inap (Inpatient Admission Note).
  * `src/modules/emr/components/DischargeSummaryForm.jsx` — Resume Medis Pasien Pulang (JCI ACC.4.2 Compliance).
  * `src/modules/emr/components/DPJPAssignmentForm.jsx` — Form Penetapan Dokter DPJP Utama & DPJP Pendamping/Tambahan.
  * `src/modules/emr/components/NursingDailyAssessmentForm.jsx` — Asesmen Keperawatan Harian & Skala Risiko Phlebitis VIP.
  * `src/modules/emr/components/NursingHandoverForm.jsx` — Serah Terima Keperawatan Shift SBAR (JCI IPSG.2).
  * `src/modules/emr/components/ConsultationRequestForm.jsx` & `ConsultationResponseForm.jsx` — Permintaan & Jawaban Konsultasi Dokter Spesialis (JCI COP.2.1).
  * `src/modules/emr/components/ReferralLetterForm.jsx` — Surat Rujukan Keluar RS (JCI ACC.3.1).
* **`[ADDED]` Shell Form & Timeline Rekam Medis:**
  * `src/modules/emr/components/ClinicalFormShell.jsx` — Shell form klinis terpadu dilengkapi indikator autosave real-time dan mekanisme konfirmasi validasi.
  * `src/modules/emr/components/ClinicalTimeline.jsx` — Timeline perjalanan klinis pasien lintas profesi dengan filter kategori inter-profesional.

#### 2. Master Data Pasien & Taksonomi 32 Atribut
* **`[ADDED]` Standardisasi Master Data Pasien:**
  * `src/modules/admin/services/patientMaster32Taxonomy.js` — Implementasi taksonomi 32 atribut data induk pasien untuk menjamin validitas identitas pasien dan interoperabilitas registrasi-EMR.

#### 3. Restrukturisasi Dokumentasi & Direktori `docs/`
* **`[CHORE]` Pengorganisasian Berkas Dokumentasi:**
  * Seluruh dokumen arsitektur, audit database, dan panduan operasional dipindahkan dari root repositori ke folder `docs/`:
    * `docs/ENTERPRISE_HIS_DATABASE_AUDIT.md`
    * `docs/HISTORICAL_PATCH_NOTES_CHANGELOG.md`
    * `docs/MASTER_ENTERPRISE_HIS_SRS_ARCHITECTURE.md`
    * `docs/MASTER_USER_DIRECTIVES.md`
    * `docs/NURSEFLOW_CORE_PROTOCOL.md`
    * `docs/NURSEFLOW_DESIGN_RULES.md`
    * `docs/NURSEFLOW_OPERATIONAL_MANUAL_2026.md`
  * Berkas pelacak baru dibuat di folder `docs/`:
    * `docs/master_prompt_enterprise_emr.md` — Pengarah Master EMR Enterprise.
    * `docs/laporan_patient_master_data.md` — Laporan analisis data induk pasien.
    * `docs/implementation_plan.md`, `docs/task.md`, `docs/walkthrough.md`, `docs/workflow_patch.md`.
    * `docs/CHANGELOG_PERUBAHAN_HIS.md` — Catatan resmi riwayat perubahan ini.

---

### 🟢 [08 AGUSTUS 2026] — UI/UX Overhaul System & Oceanic Teal Theme Standard

**Kategori:** `[ENHANCEMENT]` `[FEATURE]`  
**Git Commit Hash:** `c8fc706`

#### Ringkasan Update:
* Standarisasi Palet Warna Oceanic Teal (`#007399`) di seluruh modul NurseFlow HIS.
* Pembaruan Modal Pencarian Pasien Terpadu (*Unified Patient Search Modal*).
* Pembaruan komponen modul administrasi & kasir billing.

---

*(Catatan update berikutnya akan terus ditambahkan di bagian atas log ini secara kronologis)*
