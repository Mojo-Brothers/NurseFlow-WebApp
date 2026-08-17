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

### 🟢 [17 AGUSTUS 2026] — ARCHITECTURE & UI ACTIVATION GATE 1D.7: LABORATORY INFORMATION SYSTEM (LIS) & SPECIMEN TRACKING

**Kategori:** `[MAJOR]` `[UI_ACTIVATION]` `[CLINICAL_VERTICAL_SLICE]` `[LIS_SPECIMEN_TRACKING]` `[CHAIN_OF_CUSTODY]` `[VACUTAINER_BARCODING]` `[PANIC_VALUE_JCI_IPSG2]` `[DELTA_CHECK]` `[LOINC]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 46 Suites / 196 Tests), Vite Build (`npm run build` PASS — 5.82s)  
**Komponen Terdampak:** `database/migrations/016_lis_specimen_tracking_and_panic_values.sql` (NEW), `server/services/lisPacsEngine.service.js` (MODIFIED), `src/modules/lab/pages/LabPage.jsx` (MODIFIED), `src/modules/lab/components/SpecimenAccessioningStudio.jsx` (NEW), `src/modules/lab/components/AnalyticalResultEntryStudio.jsx` (NEW), `src/modules/lab/components/PanicValueEscalationModal.jsx` (NEW), `src/modules/lab/components/LisCommandCenter.jsx` (NEW), `tests/lisSpecimenTrackingVerticalSlice.test.js` (NEW)

#### Detail Aktivasi LIS & Specimen Tracking Vertical Slice (Gate 1D.7):
1. **🧪 SPECIMEN CHAIN OF CUSTODY & BARCODING (`SpecimenAccessioningStudio.jsx`):**
   - Alur hidup spesimen lengkap: `ORDERED` &rarr; `COLLECTED` &rarr; `IN_TRANSIT` &rarr; `RECEIVED_IN_LAB` &rarr; `ANALYZING` &rarr; `VERIFIED` &rarr; `RELEASED`.
   - Pemilihan tabung vacutainer terstandar ISO 15189:
     - Tutup Ungu (K2/K3 EDTA) untuk Hematologi / Darah Lengkap.
     - Tutup Kuning (SST Gel Clot Activator) untuk Kimia Darah / Laktat / Serologi.
     - Tutup Biru (Natrium Sitrat 3.2%) untuk Koagulasi (PT/APTT/D-Dimer).
     - Tutup Hijau (Lithium Heparin) untuk Analisa Gas Darah (AGD).
   - Pelacakan suhu rantai dingin spesimen selama transit ($2^\circ\text{C} - 6^\circ\text{C}$).
2. **🔬 WORKSTATION ANALITIKAL & DELTA CHECK (`AnalyticalResultEntryStudio.jsx`):**
   - Penginputan multi-parameter berbasis kode LOINC standar internasional.
   - Deteksi otomatis Delta Check (peringatan lonjakan variansi hasil $> 50\%$ terhadap hasil lab pasien sebelumnya).
   - Validasi ganda dan tanda tangan digital Dokter Spesialis Patologi Klinik (Sp.PK) & Analis Medis.
3. **🚨 JCI IPSG 2 MANDATORY PANIC VALUE ESCALATION (`PanicValueEscalationModal.jsx`):**
   - Peringatan nilai kritis otomatis (*Hard Thresholds*): Laktat Darah $\ge 4.0\text{ mmol/L}$, Kalium $\le 2.8$ atau $\ge 6.2\text{ mmol/L}$, Glukosa $\le 45\text{ mg/dL}$, Trombosit $\le 20.000\text{ /uL}$, Troponin I $\ge 0.04\text{ ng/mL}$.
   - Dialog pelaporan wajib *Read-Back Confirmation* sesuai JCI IPSG 2 (mencatat nama dokter/perawat penerima telepon cito, jam lapor $\le 15\text{ menit}$, dan rekaman pembacaan ulang).
   - Auto-dispatch notifikasi prioritas tinggi ke `NotificationCenterModal` & DPJP context.
4. **🐘 DATABASE MIGRATION 016 (`016_lis_specimen_tracking_and_panic_values.sql`):**
   - Tabel `laboratory_specimens`, `laboratory_test_results`, dan `laboratory_panic_alerts` dengan indeks unik barcode dan relasi integritas referensial.
5. **🛡️ AUTOMATED REGRESSION & SAFETY TESTS (`tests/lisSpecimenTrackingVerticalSlice.test.js`):**
   - 6 pengujian otomatis memverifikasi pelabelan barcode, accessioning di lab, deteksi nilai kritis laktat/kalium, konfirmasi read-back JCI IPSG 2, dan delta check.

---

### 🟢 [17 AGUSTUS 2026] — UI ACTIVATION GATE 1E.5: NURSING CARE, FLUID BALANCE & EMAR WORKSPACE

**Kategori:** `[MAJOR]` `[UI_ACTIVATION]` `[CLINICAL_VERTICAL_SLICE]` `[NURSING_WORKSPACE]` `[EMAR_5_RIGHTS]` `[HIGH_ALERT_DUAL_CHECK]` `[FLUID_BALANCE_24H]` `[MORSE_FALL_SCALE]` `[ISBAR_HANDOVER]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 45 Suites / 190 Tests), Vite Build (`npm run build` PASS — 4.85s)  
**Komponen Terdampak:** `src/modules/nursing/pages/NursingWorkspacePage.jsx` (NEW), `src/modules/nursing/components/NursingCommandCenter.jsx` (NEW), `src/modules/nursing/components/EmarAdministrationStudio.jsx` (NEW), `src/modules/nursing/components/FluidBalanceSheet.jsx` (NEW), `src/modules/nursing/components/NursingAssessmentAndPlan.jsx` (NEW), `src/modules/nursing/services/nursingCareEngine.service.js` (NEW), `src/routes/clinical.routes.jsx` (MODIFIED), `tests/nursingEmarVerticalSlice.test.js` (NEW)

#### Detail Aktivasi Nursing Care & eMAR Workspace (Gate 1E.5):
1. **👩‍⚕️ INPATIENT BED GRID & NURSING COMMAND CENTER (`NursingCommandCenter.jsx`):**
   - Denah keterisian tempat tidur bangsal rawat inap (Bangsal Melati / Bangsal Mawar / ICU) dengan klasifikasi derajat ketergantungan pasien (*Minimal, Partial, Total Care*).
   - 4 Live KPI Metrik Keperawatan: Jadwal Obat Belum Diberikan (6 Dosis), Monitoring TTV Terlambat (2 Pasien), Pasien Risiko Jatuh Tinggi (3 Pasien &mdash; Gelang Kuning), dan Balans Cairan Kritis (2 Pasien).
   - Modul Timbang Terima / Handover Antar Shift terstruktur sesuai standar **ISBAR** (*Introduction, Situation, Background, Assessment, Recommendation*) dengan tanda tangan digital perawat primer & perawat saksi.
2. **💊 ELECTRONIC MEDICATION ADMINISTRATION RECORD (eMAR) STUDIO (`EmarAdministrationStudio.jsx`):**
   - **Verifikasi 5-Benar JCI IPSG 3:** Validasi ketat Benar Pasien, Benar Obat, Benar Dosis, Benar Rute, dan Benar Waktu sebelum obat diberikan.
   - **High-Alert Dual Nurse Verification (JCI IPSG 3.1):** Obat berkonsentrasi tinggi & berisiko tinggi (Insulin, Heparin, Kalium Klorida 7.46%) mewajibkan otorisasi ganda (Nama & PIN digital perawat saksi ke-2) dengan *hard blocker*.
   - Pelacakan status administrasi obat: `SCHEDULED`, `GIVEN`, `HELD` (dengan alasan klinis), dan `REFUSED`.
3. **💧 24-HOUR FLUID BALANCE & IWL TEMPERATURE CORRECTION (`FluidBalanceSheet.jsx`):**
   - Pencatatan sistematis Intake (Infus kristaloid, injeksi drip, minum oral, NGT, transfusi darah) vs Output (Urine, NGT drain, luka operasi, feses).
   - Kalkulasi otomatis *Insensible Water Loss (IWL)* dengan koreksi suhu febris: $\text{IWL} = 15\text{ ml/kgBB/24 jam} \times (1 + 0.10 \times \Delta T)$.
   - Indikator visual balans cairan netto (*Euvolemic, Overload Risk, Dehydration Risk*).
4. **⚠️ MORSE FALL SCALE & PPNI 3S NURSING CARE PLAN (`NursingAssessmentAndPlan.jsx`):**
   - Pengkajian Skrining Risiko Jatuh Dewasa (Morse Fall Scale). Skor $\ge 45$ otomatis memicu protokol keselamatan Gelang Kuning, segitiga peringatan jatuh, penguncian bed, dan side-rail ganda (JCI IPSG 6).
   - Penyusunan Rencana Asuhan Keperawatan Terstandar PPNI: Diagnosa Keperawatan (SDKI), Luaran (SLKI), dan Intervensi (SIKI).
5. **🛡️ AUTOMATED REGRESSION & NEGATIVE-PATH TESTS (`tests/nursingEmarVerticalSlice.test.js`):**
   - 5 pengujian otomatis memverifikasi penolakan ketidakcocokan 5-Benar, penolakan pemberian obat high-alert tanpa perawat saksi, formula balans cairan/IWL, skor Morse Fall Scale, dan pembuatan laporan ISBAR.

---

### 🟢 [17 AGUSTUS 2026] — ENTERPRISE ARCHITECTURE AUDIT, BUNDLE CHUNKING & FORMAL DOCS SUITE

**Kategori:** `[MAJOR]` `[ARCHITECTURAL_HARDENING]` `[BUNDLE_OPTIMIZATION]` `[NOTIFICATION_CENTER]` `[FORMAL_DOCUMENTATION]` `[JCI_COMPLIANCE]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 44 Suites / 185 Tests), Vite Build (`npm run build` PASS — Monolith Chunks Reduced to 322 kB / Gzip 79 kB)  
**Komponen Terdampak:** `vite.config.js` (MODIFIED), `src/routes/clinical.routes.jsx` (MODIFIED), `src/routes/emr.routes.jsx` (MODIFIED), `src/routes/admin.routes.jsx` (MODIFIED), `src/routes/pharmacy.routes.jsx` (MODIFIED), `src/routes/index.jsx` (MODIFIED), `src/components/ui/ClinicalLoadingSpinner.jsx` (NEW), `src/components/ui/NotificationCenterModal.jsx` (NEW), `src/core/stores/notification.store.js` (NEW), `src/components/ui/ClinicalContextRibbon.jsx` (MODIFIED), `server/controllers/patient.controller.js` (NEW), `server/routes/patients.routes.js` (MODIFIED), `README.md` (MODIFIED), `docs/DATABASE_ERD_ARCHITECTURE.md` (NEW), `docs/CLINICAL_SEQUENCE_DIAGRAMS.md` (NEW), `docs/USER_ROLE_MATRIX_RBAC.md` (NEW), `docs/DEPLOYMENT_ARCHITECTURE.md` (NEW)

#### Detail Audit & Hardening Arsitektur Enterprise:
1. **⚡ BUNDLE CODE-SPLITTING & LAZY LOADING OPTIMIZATION:**
   - Konfigurasi `manualChunks` di `vite.config.js` untuk memecah vendor libraries (`vendor-react`, `vendor-firebase`, `vendor-icons`, `vendor-i18n`, `vendor-state`, `vendor-toast`).
   - Seluruh rute aplikasi (`clinical`, `emr`, `admin`, `pharmacy`) dimuat asinkron via `React.lazy()` + `<Suspense>` dengan fallback `<ClinicalLoadingSpinner />`.
   - Ukuran bundle utama berhasil dipangkas dari **5.27 MB &rarr; 322 kB (gzip 79.3 kB)**.
2. **🔔 REAL-TIME CLINICAL NOTIFICATION CENTER:**
   - Implementasi `useNotificationStore` dan `NotificationCenterModal.jsx` terintegrasi langsung di `ClinicalContextRibbon.jsx`.
   - Mendukung 4 tingkatan notifikasi klinis real-time: Nilai Kritis Lab (Panic Value), Resep Obat Baru DPJP, Darah Siap Transfusi (BDRS), dan Bed ICU Siap Transfer dengan integrasi muat konteks pasien 1-klik.
3. **🏛️ FORMAL ENTERPRISE DOCUMENTATION SUITE:**
   - **ERD & Database Architecture (`docs/DATABASE_ERD_ARCHITECTURE.md`):** Diagram Mermaid relasi entitas, skema RLS multi-tenant, dan proteksi barrier PostgreSQL.
   - **Clinical Sequence Diagrams (`docs/CLINICAL_SEQUENCE_DIAGRAMS.md`):** Diagram alur Pasien &rarr; EMPI &rarr; Triase IGD &rarr; Konsultasi DPJP &rarr; CDSS &rarr; Transfusi BDRS.
   - **User Role Matrix & RBAC/ABAC (`docs/USER_ROLE_MATRIX_RBAC.md`):** Matriks kewenangan klinis 8 peran (Dokter, Perawat, Apoteker, Analis Lab, Radiografer, Kasir, Admin, Auditor) sesuai JCI & Permenkes 24/2022.
   - **High-Availability Deployment Topology (`docs/DEPLOYMENT_ARCHITECTURE.md`):** Arsitektur Kubernetes multi-pod, Nginx Ingress, PostgreSQL Primary-Replica, dan Redis Cluster.
4. **📚 ENTERPRISE README.MD:**
   - Dokumentasi komprehensif menampilkan standar kepatuhan (JCI, KARS, Permenkes 24/2022, SATUSEHAT), 4-tier architecture, modul aktif, dan panduan instalasi lokal.

---

### 🟢 [17 AGUSTUS 2026] — UI ACTIVATION GATE 1E.4: DOCTOR CONSULTATION & CLINICAL CORE WORKSPACE

**Kategori:** `[MAJOR]` `[UI_ACTIVATION]` `[CLINICAL_VERTICAL_SLICE]` `[DOCTOR_WORKSPACE]` `[CPPT_SOAP]` `[CDSS_SEPSIS_STEMI]` `[UNIVERSAL_ORDER_PANEL]` `[JCI_IPSG3]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 44 Suites / 185 Tests), Vite Build (`npm run build` PASS — 5.47s)  
**Komponen Terdampak:** `src/modules/clinical_core/pages/DoctorWorkspacePage.jsx` (NEW), `src/modules/clinical_core/components/DoctorCommandCenter.jsx` (NEW), `src/modules/clinical_core/components/DoctorSoapWorkspace.jsx` (NEW), `src/modules/clinical_core/components/ClinicalDecisionSupportCard.jsx` (NEW), `src/modules/clinical_core/components/UniversalOrderModal.jsx` (NEW), `src/modules/orders/services/universalOrderEngine.service.js` (MODIFIED), `src/modules/emr/services/cdssEngine.service.js` (MODIFIED), `src/modules/emr/services/soapEngine.service.js` (MODIFIED), `src/modules/emr/services/allergyEngine.service.js` (MODIFIED), `src/routes/clinical.routes.jsx` (MODIFIED), `tests/doctorWorkspaceVerticalSlice.test.js` (NEW)

#### Detail Aktivasi Doctor Consultation & Clinical Core Workspace (Gate 1E.4):
1. **👨‍⚕️ DOCTOR COMMAND CENTER (`DoctorCommandCenter.jsx`):**
   - Dashboard antrean kerja DPJP real-time dengan 4 metrik live: Menunggu Konsultasi (3 Pasien), Sedang Diperiksa (1 Pasien), Hasil Kritis / Panic Value Alert (Laktat 5.2 mmol/L), dan Order Menunggu Hasil (7 Order).
   - Tabel antrean pasien terintegrasi dengan penanda level triase (ESI 1-4), keluhan utama, waktu tunggu, dan tombol aksi langsung `Buka Konsultasi (SOAP)`.
2. **📝 CPPT / SOAP WORKSPACE TERINTEGRASI (`DoctorSoapWorkspace.jsx`):**
   - Formulir terstruktur sesuai Permenkes No. 24/2022 & JCI:
     - **S (Subjective):** Keluhan utama, Riwayat Penyakit Sekarang (RPS), Riwayat Penyakit Dahulu (RPD).
     - **O (Objective):** Auto-import tanda vital real-time dari Triase/eMAR (TD, HR, RR, Suhu, SpO2, GCS) dan catatan pemeriksaan fisik sistematis (Kepala/Leher, Thoraks Cor/Pulmo, Abdomen, Ekstremitas).
     - **A (Assessment):** Integrasi pencarian kode ICD-10 (misal `A90 Dengue`, `A41.9 Sepsis`, `I21.9 STEMI`, `K35.8 Apendisitis`) dan komorbiditas sekunder.
     - **P (Plan):** Instruksi non-farmakologis, rencana terapi, edukasi pasien, dan penentuan disposisi (Rawat Inap, Rawat Jalan, Transfer ICU, Operasi Cito, Rujuk).
   - Rail kanan terintegrasi visualisasi kronologis `PatientJourneyTimeline`.
3. **💡 CLINICAL DECISION SUPPORT SYSTEM (CDSS) PROTOCOL BUNDLE (`ClinicalDecisionSupportCard.jsx`):**
   - **Hour-1 Sepsis Bundle (Surviving Sepsis Campaign 2026):** Memicu rekomendasi otomatis (Kultur Darah sebelum antibiotik, Laktat serial, Antibiotik spektrum luas IV, Resusitasi kristaloid 30 mL/kgBB).
   - **ACS / STEMI Rapid Pathway (AHA / PERKI):** Rekomendasi EKG &le; 10 menit, DAPT Loading (Aspilet + Clopidogrel), Troponin I Cito, dan aktivasi Primary PCI.
   - **DHF Critical Phase Protocol (WHO):** Monitoring serial DL per 12 jam, hidrasi rumatan terukur, dan peringatan keras kontraindikasi NSAID/Aspirin.
4. **📦 UNIVERSAL ORDER PANEL & SAFETY BARRIERS (`UniversalOrderModal.jsx`):**
   - Penerbitan order klinis 6 kategori dalam 1 panel terpadu: Laboratorium, Radiologi, Farmasi / Resep Obat, Bank Darah (Transfusi), Kamar Operasi (IBS), dan Admisi Rawat Inap / ICU.
   - **Safety Barrier Alergi Obat (JCI IPSG 3):** Sistem memblokir resep obat kontraindikasi (misal Penisilin/Amoksisilin pada pasien alergi penisilin) dengan peringatan bahaya anafilaksis berat (*Hard Blocker*).
   - **Safety Barrier Bank Darah:** Verifikasi status uji kecocokan (*Crossmatch*) sebelum unit darah dikeluarkan.
5. **🛡️ 4-TIER ARCHITECTURE & NEGATIVE-PATH TESTS (`tests/doctorWorkspaceVerticalSlice.test.js`):**
   - 5 pengujian otomatis memverifikasi perekaman SOAP, deteksi alergi obat silang, evaluasi CDSS, pembuatan order lintas kategori, dan penolakan transisi status order ilegal.

---

### 🟢 [17 AGUSTUS 2026] — UI ACTIVATION GATE 1E.3: IGD TRIAGE & EMERGENCY CLINICAL VERTICAL SLICE

**Kategori:** `[MAJOR]` `[UI_ACTIVATION]` `[CLINICAL_VERTICAL_SLICE]` `[IGD_COMMAND_CENTER]` `[RAPID_ESI_TRIAGE]` `[RESUSCITATION_BOARD]` `[SLA_STOPWATCH]` `[WHO_ATS_ESI]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 43 Suites / 180 Tests), Vite Build (`npm run build` PASS — 5.58s)  
**Komponen Terdampak:** `src/modules/triage/components/IgdCommandCenter.jsx` (NEW), `src/modules/triage/components/RapidTriageStudio.jsx` (NEW), `src/modules/triage/components/ResuscitationBoardModal.jsx` (NEW), `src/modules/triage/pages/TriagePage.jsx` (MODIFIED), `src/modules/emergency/services/triageEngine.service.js` (MODIFIED), `src/modules/emergency/services/triageSlaEngine.service.js` (MODIFIED), `tests/triageVerticalSlice.test.js` (NEW)

#### Detail Aktivasi IGD Triage & Emergency Vertical Slice (Gate 1E.3):
1. **🏥 IGD COMMAND CENTER & LIVE BED MAP (`IgdCommandCenter.jsx`):**
   - Panel kendali gawat darurat terpadu dengan 4 metrik live: Pasien Kritis (ESI 1-2), Pasien Menunggu Dokter (ESI 3-5), Kapasitas Bed Terpakai, dan Rata-rata Waktu Tanggap.
   - Peta visual alokasi bed (Bed Resusitasi 1-2, Bed Akut A01-A04, Bed Observasi, Bed Isolasi) dengan indikator status (*VACANT*, *OCCUPIED*, *CLEANING*), MRN, nama pasien, dan durasi keterisian bed.
2. **⏱️ REAL-TIME SLA STOPWATCH & OVERDUE ESCALATION (`triageSlaEngine.service.js`):**
   - Stopwatch waktu tunggu respons dokter berbasis target ESI/ATS:
     - 🟢 *NORMAL* (Waktu respons &le; 70% batas).
     - 🟡 *APPROACHING SLA* (Sisa waktu &le; 30%).
     - 🔴 *SLA BREACH (OVERDUE)* (Waktu tanggap terlampaui &rarr; auto-escalate alert).
3. **⚡ RAPID ESI v4 INTAKE & ABCDE PRIMARY SURVEY (`RapidTriageStudio.jsx`):**
   - Survei Primer ABCDE (Airway, Breathing, Circulation, GCS Disability Eye/Verbal/Motor, Exposure).
   - Klasifikasi otomatis tingkat keparahan ESI 1 hingga 5 dengan ambang batas bahaya (*Danger Zone Auto-Escalation*): SpO2 &lt; 90%, HR &gt; 130, SBP &le; 80, GCS &le; 8 memicu kenaikan prioritas ke ESI 1/2 seketika.
4. **🚨 RESUSCITATION BOARD & CODE BLUE MANAGEMENT (`ResuscitationBoardModal.jsx`):**
   - Panel khusus pasien kritis ESI 1 (Henti Jantung / Nafas):
     - Timer Siklus CPR 2 Menit & Alarm pergantian kompresor dada.
     - Defibrillator Logger (200J Biphasic Shock counter) & Evaluasi Irama Jantung (VF/pVT vs Asystole/PEA).
     - Pencatatan dosis berkala Epinefrin 1mg IV per siklus.
     - Panggilan tim resusitasi (*Team Leader*, *Airway Operator*, *Compressor Nurse*) dan deklarasi capaian ROSC (*Return of Spontaneous Circulation*).
5. **🛡️ 4-TIER ARCHITECTURE & NEGATIVE-PATH TESTS (`tests/triageVerticalSlice.test.js`):**
   - 6 pengujian komprehensif memvalidasi akurasi ESI, invariant batas GCS (3-15), inisiasi stopwatch SLA, pencatatan kontak dokter pertama, serta transisi state encounter ke `TRIAGED`.

---

### 🟢 [17 AGUSTUS 2026] — UI ACTIVATION GATE 1E.2: PATIENT IDENTITY, EMPI & ENCOUNTER JOURNEY FOUNDATION

**Kategori:** `[MAJOR]` `[UI_ACTIVATION]` `[PATIENT_COMMAND_CENTER]` `[EMPI_DUPLICATE_PREVENTION]` `[PATIENT_JOURNEY_TIMELINE]` `[ENCOUNTER_WORKSPACE]` `[JCI_IPSG1]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 42 Suites / 174 Tests), Vite Build (`npm run build` PASS — 5.75s)  
**Komponen Terdampak:** `src/modules/patient/pages/PatientCommandCenterPage.jsx` (NEW), `src/modules/patient/components/GlobalPatientSearch.jsx` (NEW), `src/modules/patient/components/PatientIdentityCard.jsx` (NEW), `src/modules/patient/components/PatientJourneyTimeline.jsx` (NEW), `src/modules/patient/components/PatientRegistrationWithEmpiModal.jsx` (NEW), `src/modules/patient/components/EmergencyUnknownPatientModal.jsx` (NEW), `src/modules/encounter/components/EncounterWorkspaceModal.jsx` (NEW), `src/modules/encounter/encounter.store.js` (MODIFIED), `src/core/services/mpiEngine.service.js` (MODIFIED), `src/components/ui/ClinicalContextRibbon.jsx` (MODIFIED), `src/routes/clinical.routes.jsx` (MODIFIED), `tests/patientJourneyEmpi.test.js` (NEW)

#### Detail Aktivasi Patient Identity & Journey Center (Gate 1E.2):
1. **🔍 GLOBAL PATIENT SEARCH & PHI PROTECTION (`GlobalPatientSearch.jsx`):**
   - Pencarian multi-atribut real-time (No. RM, NIK, Nama, Tanggal Lahir, No. Kartu BPJS, Nomor Telepon).
   - Penyamaran data sensitif / PHI (*NIK Masking*: `************1234`) untuk kepatuhan perlindungan data pribadi pasien (Permenkes No. 24/2022).
2. **🛡️ ONE PATIENT → ONE MASTER IDENTITY EMPI GATEWAY (`PatientRegistrationWithEmpiModal.jsx`):**
   - Algoritma pencocokan kembar identitas (*Duplicate Identity Detection*) saat pendaftaran dengan skor kepercayaan (*Confidence Score*).
   - Dialog peringatan duplikasi EMPI interaktif yang memberikan pilihan tegas: `[Gunakan Pasien Eksisting]` atau `[Tetap Buat Pasien Baru dengan Justifikasi Audit Supervisor]`.
3. **🚨 EMERGENCY UNKNOWN PATIENT & LEGAL RECONCILIATION (`EmergencyUnknownPatientModal.jsx`):**
   - Pembuatan instan pasien darurat anonim (`Mr. / Mrs. X`) dengan pembukaan encounter triase IGD otomatis.
   - Fitur rekonsiliasi identitas post-hoc (*Merge Patient*) yang menggabungkan rekam medis anonim ke master pasien saat identitas asli ditemukan tanpa menghapus jejak encounter dan timeline klinis darurat (*100% Clinical Traceability*).
4. **📜 PATIENT JOURNEY TIMELINE (`PatientJourneyTimeline.jsx`):**
   - Visualisasi kronologis alur peristiwa klinis pasien: Registrasi &rarr; Triase IGD (ESI 2) &rarr; Asesmen Klinis DPJP &rarr; Order Cito Laboratorium & Radiologi &rarr; Crossmatch Bank Darah &rarr; Persiapan Kamar Operasi (IBS) &rarr; Admisi Bangsal / ICU.
5. **🏥 ENCOUNTER WORKSPACE & LIVE CONTEXT SYNC (`EncounterWorkspaceModal.jsx` & `ClinicalContextRibbon.jsx`):**
   - Pembukaan kunjungan / encounter baru (IGD, Rawat Jalan Poli, Rawat Inap, Kamar Operasi) dengan DPJP dan penjamin biaya.
   - Sinkronisasi instan konteks klinis aktif ke seluruh aplikasi melalui `ClinicalContextRibbon` (Nama, MRN, Triage Level, Status Alergi).

---

### 🟢 [17 AGUSTUS 2026] — UI ACTIVATION GATE 1E.1: CLINICAL APPLICATION SHELL & ROLE-BASED WORKSPACE FOUNDATION

**Kategori:** `[MAJOR]` `[UI_ACTIVATION]` `[APPLICATION_SHELL]` `[CLINICAL_CONTEXT_RIBBON]` `[ROLE_WORKSPACES]` `[VERTICAL_SLICE_UI]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 41 Suites / 169 Tests), Vite Build (`npm run build` PASS — 5.29s)  
**Komponen Terdampak:** `src/components/ui/ClinicalContextRibbon.jsx` (NEW), `src/modules/blood_bank/pages/BloodBankWorkspacePage.jsx` (NEW), `src/modules/critical_care/pages/IcuAcuityWorkspacePage.jsx` (NEW), `src/modules/staff/pages/StaffPrivilegingWorkspacePage.jsx` (NEW), `src/layouts/MainLayout.jsx` (MODIFIED), `src/routes/clinical.routes.jsx` (MODIFIED)

#### Detail Aktivasi UI Klinis Terpadu (Gate 1E.1):
1. **🏥 ENTERPRISE CLINICAL CONTEXT RIBBON (`ClinicalContextRibbon.jsx`):**
   - Menghadirkan pita konteks klinis real-time di bagian atas aplikasi yang menampilkan identitas faskes/tenant aktif, identitas klinisi dengan status verifikasi STR/SIP, indikator shift dinas aktif, live patient context banner (Nama, MRN, Triage Level, Alergi Warning), serta tombol trigger darurat *Code Blue* & *Code Red*.
2. **🧭 MODERN ROLE-BASED NAVIGATION SHELL (`MainLayout.jsx`):**
   - Merestrukturisasi navigasi sidebar menjadi 3 pilar operasional rumah sakit:
     - *Clinical Workspaces:* Doctor Workspace, Patient Master & EMPI, Appointments, Encounters, Triage & Emergency, Patient Care & Nursing, EMR Rawat Jalan / Inap.
     - *Unit Khusus & Persisted Domains:* Kamar Operasi (IBS), ICU & Acuity Scoring, Bank Darah (BDRS), Farmasi & Manajemen Inventori FEFO, Billing Kasir.
     - *Workforce & Governance:* Staff & Privileging Hub, Master Data Terpadu (18 Modul), Executive & Performance Suite.
3. **🩸 BLOOD BANK WORKSPACE UI (`BloodBankWorkspacePage.jsx`):**
   - Antarmuka operasional BDRS untuk pencatatan kantong darah, monitoring suhu chiller, uji silang serasi (Crossmatch Mayor/Minor) dengan feedback inkompatibilitas otomatis, serah terima ruangan, dan checklist bedside 7-poin.
4. **💜 ICU CLINICAL ACUITY WORKSPACE UI (`IcuAcuityWorkspacePage.jsx`):**
   - Kalkulator serial skor SOFA (Sepsis-3) berbasis 6 sistem organ dengan penyimpanan snapshot matematis 100% reproducible, kalkulator NEWS2 dengan peringatan eskalasi klinis otomatis, dan riwayat audit serial ICU.
5. **👨‍⚕️ STAFF CREDENTIALING & PRIVILEGING WORKSPACE UI (`StaffPrivilegingWorkspacePage.jsx`):**
   - Direktori tenaga medis, manajemen lisensi STR/SIP dengan *effective dating*, serta simulator evaluator 5-faktor otorisasi klinis real-time (validasi klinisi aktif, STR valid, cakupan RKK/SPK, dan status dinas/on-call).

---

### 🟢 [17 AGUSTUS 2026] — DATABASE HARDENING GATE 1D.6: CLINICAL STAFF SCHEDULING, CREDENTIALING & PRIVILEGING PERSISTENCE

**Kategori:** `[MAJOR]` `[STAFF_SCHEDULING]` `[CREDENTIALING]` `[CLINICAL_PRIVILEGING]` `[SPK_RKK]` `[AUTHORIZATION_ENGINE]` `[JCI_GLD]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 41 Suites / 169 Tests), `npx prisma validate` (PASS), `npx prisma format` (PASS) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `database/migrations/015_staff_roster_credentialing_privileging.sql` (NEW), `database/migration_runner.js` (MODIFIED), `prisma/schema.prisma` (MODIFIED), `server/services/staffScheduling.service.js` (MODIFIED), `tests/staffPrivilegingPersistence.test.js` (NEW)

#### Detail Arsitektur Otorisasi Klinis & Penjadwalan Staf (1D.6):
1. **👨‍⚕️ CLINICAL STAFF PROFILES (`clinical_staff_profiles`):**
   - Membuat model master klinisi berstandar JCI/KARS dengan klasifikasi spesialisasi, sub-spesialisasi, departemen induk, dan status kepegawaian.
2. **📜 CREDENTIALING & STR/SIP EFFECTIVE DATING (`staff_credentials`):**
   - Menghilangkan flag boolean primitif. Menggunakan model temporal *effective dating* (`valid_from`, `valid_until`, `verification_status`, `revoked_at`, `revocation_reason`) dengan constraint `CHECK (valid_until >= valid_from)` untuk menjamin audit historis lisensi pada titik waktu manapun (*point-in-time license validity*).
3. **🏛️ CLINICAL PRIVILEGES / SPK & RKK (`clinical_privileges`):**
   - Mengimplementasikan Surat Penugasan Klinis (SPK) & Rincian Kewenangan Klinis (RKK) berbasis Permenkes No. 755/2011 dan Komite Medik.
   - Menerapkan trigger PostgreSQL `trg_validate_privilege_prerequisites` yang memblokir pemberian kewenangan klinis jika klinisi tidak memiliki STR/SIP aktif dan terverifikasi pada tanggal mulai berlaku.
4. **📅 STAFF ROSTER & SHIFT ASSIGNMENT MUTEX (`shift_assignments` & `on_call_schedules`):**
   - Menegakkan Partial Unique Index `uq_staff_date_shift` (`WHERE assignment_status IN ('SCHEDULED', 'CHECKED_IN')`) pada level database untuk memblokir jadwal dinas ganda pada hari yang sama.
   - Menyimpan jadwal *on-call* dokter spesialis dengan SLA waktu respon darurat.
5. **🛡️ 5-FACTOR CLINICAL AUTHORIZATION ENGINE (`clinical_authorization_logs`):**
   - Membangun *Workforce Authorization Engine* yang memverifikasi 5 pilar keselamatan:
     1. Status keaktifan profil klinisi.
     2. Validitas STR/SIP pada waktu tindakan (tidak expired & tidak dicabut).
     3. Cakupan kewenangan klinis (SPK/RKK) terhadap kode prosedur dan unit/departemen terkait.
     4. Status kehadiran jaga (Shift aktif atau On-Call coverage pada tanggal/waktu tindakan).
     5. Isolasi data multi-tenant.
   - Merekam setiap evaluasi ke tabel audit `clinical_authorization_logs`.

---

### 🟢 [17 AGUSTUS 2026] — CLINICAL SAFETY VERIFICATION GATE 1D.5-V: 12 FATAL CLINICAL NEGATIVE-PATH BARRIERS VERIFIED

**Kategori:** `[MAJOR]` `[CLINICAL_SAFETY_VERIFICATION]` `[NEGATIVE_PATH_TESTING]` `[DATABASE_BARRIERS]` `[JCI_SAFETY]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 40 Suites / 158 Tests), `npx prisma validate` (PASS), `npx prisma format` (PASS) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `tests/clinicalSafetyVerification.test.js` (NEW), `server/services/operatingTheatre.service.js` (MODIFIED), `server/services/bloodBank.service.js` (MODIFIED), `server/services/criticalCare.service.js` (MODIFIED)

#### Detail Verifikasi 12 Skenario Fatal (Negative-Path Database Barrier):
1. **🚫 Operasi Tanpa Sign-In:** Ditolak database/service dengan error `SAFETY_VIOLATION: Procedure cannot start without verified WHO Sign-In and Time-Out`.
2. **🚫 Operasi Tanpa Time-Out:** Ditolak database/service sebelum insisi kulit diizinkan.
3. **🚫 Completion Tanpa Sign-Out:** Ditolak database/service sebelum penghitungan kassa/instrumen diverifikasi.
4. **🚫 Perubahan Identity Field Pasca Operasi Dimulai:** Trigger PostgreSQL `trg_enforce_surgery_case_safety` menolak mutasi `patient_id` / `operating_room_id`.
5. **🚫 Bentrok Dua Booking Kamar Operasi:** Partial Unique Index `uq_active_room_slot` menolak tabrakan waktu kamar operasi (`ROOM_COLLISION`).
6. **🚫 Modifikasi Skor ICU Terfinalisasi:** Trigger PostgreSQL `trg_protect_finalized_icu_acuity` menolak `UPDATE` pada asesmen SOFA/NEWS2 yang telah difinalisasi.
7. **🚫 Transfusi Crossmatch Inkompatibel:** Ditolak fatal oleh barrier kecocokan serologis.
8. **🚫 Transfusi Kantong Expired:** Ditolak mutlak oleh evaluasi waktu kedaluwarsa darah.
9. **🚫 Transfusi Kantong Milik Pasien Lain:** Ditolak oleh constraint kepemilikan reservasi (`reserved_for_patient_id <> patient_id`).
10. **🚫 Double Transfusi Kantong Sama:** Partial Unique Index `uq_active_blood_unit_transfusion` menolak duplikasi transfusi aktif.
11. **🚫 Penggunaan Kembali Kantong STOPPED_REACTION:** Ditolak dan dikarantina permanen karena insiden hemovigilans.
12. **🚫 Karantina Otomatis Temperature Excursion:** Penyimpangan suhu rantai dingin seketika memicu status unit menjadi `QUARANTINED`.

---

### 🟢 [17 AGUSTUS 2026] — DATABASE HARDENING GATE 1D.5: OPERATING THEATRE (IBS) & ICU ACUITY SCORING PERSISTENCE

**Kategori:** `[MAJOR]` `[OPERATING_THEATRE]` `[ICU_ACUITY]` `[WHO_SURGICAL_CHECKLIST]` `[PERSISTENCE_HARDENING]` `[SAFETY_TRIGGER]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 39 Suites / 146 Tests), `npx prisma validate` (PASS), `npx prisma format` (PASS) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `database/migrations/014_operating_theatre_and_icu_acuity.sql` (NEW), `database/migration_runner.js` (MODIFIED), `prisma/schema.prisma` (MODIFIED), `server/services/operatingTheatre.service.js` (MODIFIED), `server/services/criticalCare.service.js` (MODIFIED), `tests/operatingTheatrePersistence.test.js` (NEW)

#### Detail Arsitektur Kamar Operasi (IBS) & ICU Acuity Scoring (1D.5):
1. **🏥 PEMISAHAN SURGERY SCHEDULE (BOOKING) VS SURGERY CASE (TINDAKAN RIIL):**
   - Membuat model fisik `operating_theatres`, `operating_rooms`, `surgery_schedules`, dan `surgery_cases`.
   - Menegakkan Partial Unique Index `uq_active_room_slot` (`WHERE booking_status IN ('BOOKED', 'CONFIRMED', 'IN_PROGRESS')`) pada level PostgreSQL untuk mencegah tabrakan pemesanan slot kamar operasi (*room slot mutex*).
2. **🛡️ STATE MACHINE & WHO SURGICAL SAFETY CHECKLIST (3 PHASES):**
   - Menegakkan alur state machine: `SCHEDULED -> PRE_OP_READY -> SIGN_IN_COMPLETED -> TIME_OUT_COMPLETED -> PROCEDURE_IN_PROGRESS -> SIGN_OUT_COMPLETED -> PROCEDURE_COMPLETED -> POST_OP_HANDOFF`.
   - Menerapkan trigger tingkat database `trg_enforce_surgery_case_safety`:
     - Prosedur operasi DITOLAK masuk ke status `PROCEDURE_IN_PROGRESS` jika WHO Sign-In dan Time-Out belum terkonfirmasi lengkap (`sign_in_confirmed = TRUE` & `time_out_confirmed = TRUE`).
     - Prosedur operasi DITOLAK masuk ke status `PROCEDURE_COMPLETED` jika WHO Sign-Out belum terverifikasi lengkap (`sign_out_confirmed = TRUE`).
     - Kolom identitas kunci (`patient_id`, `operating_room_id`, `lead_surgeon_id`) dikunci menjadi *immutable* segera setelah prosedur dimulai.
3. **💉 ANESTHESIA RECORDS & PACU ALDRETE RECOVERY HANDOFF:**
   - Menyimpan catatan anestesi terstruktur (`anesthesia_records`) dengan klasifikasi ASA, penilaian jalan napas (Mallampati & airway device), dan pemantauan intra-operatif.
   - Menyimpan serah-terima pasca-bedah (`post_op_handoffs`) berbasis skor pemulihan Aldrete (aktivitas, respirasi, sirkulasi, kesadaran, saturasi O2) dengan ambang batas pelepasan (*discharge readiness*).
4. **📊 ICU ACUITY RAW OBSERVATION SNAPSHOT & REPRODUCIBILITY (SOFA & NEWS2):**
   - **Kritis:** Tidak hanya menyimpan skor akhir! Tabel `icu_acuity_assessments` menyimpan snapshot parameter observasi mentah lengkap (`raw_scoring_inputs` JSONB) beserta versi algoritma (`algorithm_version: 'v1.0'`).
   - Algoritma scoring diverifikasi 100% *reproducible* dari snapshot data mentah untuk audit klinis dan riset informatika medis.
   - Menerapkan trigger `trg_protect_finalized_icu_acuity` yang melarang operasi `UPDATE` pada asesmen terfinalisasi (*Append-Only Immutable Scoring Stream*).
5. **🔐 TENANT ISOLATION & ROW LEVEL SECURITY (RLS):**
   - Mengaktifkan Row Level Security (RLS) pada seluruh 8 tabel baru (`operating_theatres`, `operating_rooms`, `surgery_schedules`, `surgery_cases`, `surgical_safety_checklists`, `anesthesia_records`, `post_op_handoffs`, `icu_acuity_assessments`).

---

### 🟢 [17 AGUSTUS 2026] — DATABASE HARDENING GATE 1D.4-H.1: BLOOD BANK SAFETY CLOSURE & COMPLETE TRANSFUSION TRACEABILITY CHAIN

**Kategori:** `[MAJOR]` `[CLINICAL_SAFETY_CLOSURE]` `[BLOOD_BANK]` `[IMMUTABLE_TRIGGER]` `[BLOOD_ISSUE]` `[BEDSIDE_VERIFICATION]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 38 Suites / 136 Tests), `npx prisma validate` (PASS), `npx prisma format` (PASS) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `database/migrations/013_blood_bank_bdrs_persistence.sql` (MODIFIED), `prisma/schema.prisma` (MODIFIED), `server/services/bloodBank.service.js` (MODIFIED), `tests/bloodBankPersistence.test.js` (MODIFIED)

#### Detail Penutupan Benteng Keselamatan & Rantai Lacak Balik Transfusi (1D.4-H.1):
1. **🔒 DATABASE IMMUTABILITY & UPDATE SAFETY TRIGGER (`BEFORE INSERT OR UPDATE`):**
   - Mengubah trigger `trg_enforce_transfusion_safety` menjadi `BEFORE INSERT OR UPDATE` dan melarang modifikasi hubungan inti (`patient_id`, `blood_unit_id`, `crossmatch_id`, `encounter_id`) pada record transfusi.
   - Menambahkan trigger `trg_protect_finalized_crossmatch` untuk mengunci keabadian hasil uji silang serasi setelah status `is_finalized = TRUE`.
2. **🎯 PARTIAL UNIQUE INDEX PADA TRANSFUSI AKTIF:**
   - Mengganti constraint kaku dengan Partial Unique Index `uq_active_blood_unit_transfusion` (`WHERE transfusion_status IN ('IN_PROGRESS', 'COMPLETED', 'STOPPED_REACTION')`), memungkinkan record transfusi yang dibatalkan sebelum darah dialirkan (`CANCELLED`) tidak mengunci kantong darah secara permanen.
3. **🌡️ PRODUCT-SPECIFIC COLD-CHAIN PROFILES:**
   - Menegakkan batas suhu penyimpanan spesifik per komponen: PRC & Whole Blood (2°C - 6°C), FFP & Cryo (-30°C - -18°C), Trombosit (20°C - 24°C dengan agitasi) dan karantina otomatis jika terjadi *temperature excursion*.
4. **📦 CUSTODY HANDOFF & ISSUE TRACKING (`blood_issue_records`):**
   - Membuat tabel persistensi serah-terima kantong darah dari petugas BDRS ke perawat ruangan lengkap dengan suhu saat pengeluaran (*temperature at issue*).
5. **📋 MANDATORY 7-POINT BEDSIDE VERIFICATION (`blood_bedside_verifications`):**
   - Membuat tabel verifikasi keselamatan di sisi tempat tidur dengan constraint database `CHECK` yang mewajibkan seluruh 7 poin (identitas, kantong, ABO, Rhesus, expired, crossmatch, consent) bernilai TRUE dan dilakukan oleh 2 perawat yang berbeda (`administered_by_nurse_id <> witnessed_by_nurse_id`).

---

### 🟢 [17 AGUSTUS 2026] — DATABASE HARDENING GATE 1D.4-H: BLOOD BANK (BDRS) CLINICAL SAFETY INVARIANTS & COLD-CHAIN HARDENING

**Kategori:** `[MAJOR]` `[CLINICAL_SAFETY_HARDENING]` `[BLOOD_BANK]` `[SAFETY_TRIGGER]` `[COLD_CHAIN_AUDIT]` `[CROSSMATCH_BARRIER]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 38 Suites / 136 Tests), `npx prisma validate` (PASS), `npx prisma format` (PASS) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `database/migrations/013_blood_bank_bdrs_persistence.sql` (MODIFIED), `prisma/schema.prisma` (MODIFIED), `server/services/bloodBank.service.js` (MODIFIED), `tests/bloodBankPersistence.test.js` (MODIFIED)

#### Detail Pengerasan Benteng Keselamatan Klinis Bank Darah (1D.4-H):
1. **🛡️ DATABASE CONSTRAINT TRIGGER (`fn_enforce_transfusion_safety`):**
   - Menambahkan trigger tingkat database pada tabel `blood_transfusion_records` yang mengevaluasi 5 kondisi fatal secara independen:
     - **Crossmatch Compatibility:** Memblokir transfusi jika `overall_compatibility <> 'COMPATIBLE'`.
     - **Expiry Barrier:** Memblokir transfusi jika `expiry_date <= CURRENT_TIMESTAMP`.
     - **Screening Status:** Memblokir transfusi jika `screening_status <> 'NON_REACTIVE'`.
     - **Reservation Ownership:** Memblokir transfusi jika unit darah direservasi untuk pasien lain (`reserved_for_patient_id <> NEW.patient_id`).
     - **Matching Integrity:** Memvalidasi kesesuaian unit darah dan pasien antara record crossmatch dan record transfusi.
2. **🌡️ COLD-CHAIN STORAGE TEMPERATURE AUDIT LOGS:**
   - Membuat tabel `blood_storage_temperature_logs` untuk mencatat riwayat pemantauan suhu kulkas BDRS secara berkala lengkap dengan durasi *temperature excursion* dan alarm trigger otomatis mengkarantina kantong darah jika suhu keluar dari rentang aman (2.0°C - 6.0°C).
3. **⚡ ATOMIC BLOOD UNIT RESERVATION WITH CONCURRENCY LOCK:**
   - Mengimplementasikan reservasi unit atomik dengan verifikasi versi (`version`) dan validasi status unit (`AVAILABLE` & `NON_REACTIVE` & `expiry_date > CURRENT_TIMESTAMP`).
4. **🔬 ANTIBODY SCREENING & PROTOKOL TRANSFUSI DUA PERAWAT:**
   - Memperluas skema crossmatch dengan parameter `antibody_screen` dan menegakkan verifikasi ganda perawat (*Administering Nurse* & *Witnessing Nurse*) di sisi tempat tidur sebelum transfusi dimulai.

---

### 🟢 [17 AGUSTUS 2026] — DATABASE HARDENING GATE 1D.4: BLOOD BANK (BDRS) UNITS & CROSSMATCH PERSISTENCE

**Kategori:** `[MAJOR]` `[DATABASE_HARDENING]` `[BLOOD_BANK]` `[CROSSMATCH]` `[HEMOVIGILANCE]` `[PATIENT_SAFETY]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 38 Suites / 136 Tests), `npx prisma validate` (PASS), `npx prisma format` (PASS) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `database/migrations/013_blood_bank_bdrs_persistence.sql` (NEW), `database/migration_runner.js` (MODIFIED), `prisma/schema.prisma` (MODIFIED), `tests/bloodBankPersistence.test.js` (NEW)

#### Detail Migrasi DDL & Pengerasan Keselamatan Transfusi Darah (BDRS):
1. **🩸 MASTER KANTONG DARAH & COLD CHAIN TRACKING (MIGRATION 013):**
   - Membuat tabel `blood_donor_units` (`WHOLE_BLOOD`, `PACKED_RED_CELLS`, `FRESH_FROZEN_PLASMA`, `THROMBOCYTE_CONCENTRATE`, `CRYOPRECIPITATE`) dengan data golongan darah ABO, Rhesus, volume, tanggal donasi/kadaluwarsa, suhu penyimpanan (°C), lokasi rak, dan status skrining.
2. **🔬 UJI SILANG SERASI (CROSSMATCH MAJOR & MINOR):**
   - Membuat tabel `blood_crossmatch_tests` yang mencatat hasil uji kompatibilitas serologi mayor, minor, auto-kontrol, dan status kecocokan global (`COMPATIBLE` / `INCOMPATIBLE`).
3. **🛡️ DATABASE TRANSFUSION SAFETY INVARIANTS:**
   - Menolak penerbitan dan transfusi darah jika hasil crossmatch `INCOMPATIBLE` atau kantong darah telah berstatus `EXPIRED`.
   - Mengunci unit darah yang telah direservasi untuk Pasien A agar tidak dapat digunakan oleh Pasien B.
   - Menjamin 1 kantong darah HANYA DAPAT ditransfusikan 1 KALI seumur hidup melalui constraint unik `UNIQUE(tenant_id, blood_unit_id)` pada tabel `blood_transfusion_records`.
4. **👩‍⚕️ DUAL NURSE VERIFICATION & HEMOVIGILANCE:**
   - Tabel `blood_transfusion_records` mewajibkan verifikasi dua perawat di sisi tempat tidur (*Administered by* & *Witnessed by*) serta pencatatan tanda vital awal, observasi kritis 15 menit, dan pasca-transfusi.
   - Membuat tabel `transfusion_reaction_logs` untuk pelaporan reaksi efek samping transfusi (alergi, febris, hemolitik, TRALI/TACO) ke BDRS/KPRS.
5. **🔒 PHYSICAL ROW-LEVEL SECURITY (RLS):**
   - Mengaktifkan RLS dan policy isolasi tenant pada seluruh 4 tabel bank darah BDRS.

---

### 🟢 [17 AGUSTUS 2026] — DATABASE HARDENING GATE 1D.3-H: PHARMACY CONCURRENCY, STRICT FEFO & IMMUTABLE LEDGER HARDENING

**Kategori:** `[MAJOR]` `[CONCURRENCY_HARDENING]` `[PHARMACY]` `[ATOMIC_DECREMENT]` `[IDEMPOTENCY]` `[AUDIT_RECONCILIATION]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 37 Suites / 126 Tests), `npx prisma validate` (PASS), `npx prisma format` (PASS) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `server/services/inventoryManagement.service.js` (MODIFIED), `tests/pharmacyInventoryPersistence.test.js` (MODIFIED)

#### Detail Pengerasan Concurrency & Audit Mutasi Persediaan Farmasi (1D.3-H):
1. **⚡ ATOMIC STOCK DECREMENT & OPTIMISTIC VERSION LOCKING:**
   - Mengimplementasikan pola pembaruan stok atomik dengan verifikasi versi (`UPDATE inventory_batches SET available_quantity = available_quantity - :qty, version = version + 1 WHERE id = :id AND available_quantity >= :qty AND version = :expected_version;`).
   - Menyediakan jaminan bahwa tabrakan konkurensi antar-apoteker ditangani secara aman dengan `affectedRows = 0` (Zero Ghost Stock).
2. **🛡️ STRICT FEFO QUERY-LEVEL EXPIRY FILTERING:**
   - Memastikan filter masa kadaluwarsa (`expiryDate > currentDate`) ditegakkan di level query/transaksi sebelum alokasi batch, sehingga obat kadaluwarsa otomatis terisolasi (*quarantine*).
3. **🔁 IDEMPOTENCY KEY SAFEGUARD:**
   - Menambahkan mekanisme idempotensi pada endpoint/service dispensing (`idempotencyKey`) untuk mencegah pemotongan stok ganda saat terjadi *network timeout* atau *client retry*.
4. **📊 LEDGER-TO-BALANCE MATHEMATICAL RECONCILIATION:**
   - Menyediakan metode audit rekonsiliasi otomatis (`reconcileBatchLedger`) yang membuktikan saldo `available_quantity` selalu sama persis dengan total delta mutasi pada `inventory_stock_movements`.
5. **🔄 TRANSACTIONAL ROLLBACK INTEGRITY:**
   - Menjamin bahwa jika penulisan jejak jurnal/ledger gagal, saldo dan versi batch otomatis di-rollback ke snapshot awal (*All-or-Nothing ACID semantics*).

---

### 🟢 [17 AGUSTUS 2026] — DATABASE HARDENING GATE 1D.3: PHARMACY MULTI-WAREHOUSE, INVENTORY LEDGER & FEFO BATCH PERSISTENCE

**Kategori:** `[MAJOR]` `[DATABASE_HARDENING]` `[PHARMACY]` `[INVENTORY_LEDGER]` `[FEFO_ALLOCATION]` `[ANTI_NEGATIVE_STOCK]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 37 Suites / 126 Tests), `npx prisma validate` (PASS), `npx prisma format` (PASS) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `database/migrations/012_pharmacy_inventory_fefo.sql` (NEW), `database/migration_runner.js` (MODIFIED), `prisma/schema.prisma` (MODIFIED), `tests/pharmacyInventoryPersistence.test.js` (NEW)

#### Detail Migrasi DDL & Pengerasan Farmasi, Inventori & Logistik Obat:
1. **🏥 MULTI-WAREHOUSE & DEPO FARMASI (MIGRATION 012):**
   - Membuat tabel `pharmacy_warehouses` (`MAIN_WAREHOUSE`, `CENTRAL_PHARMACY`, `INPATIENT_DEPO`, `OUTPATIENT_DEPO`, `EMERGENCY_DEPO`, `ICU_DEPO`, `OK_DEPO`) dengan isolasi `tenant_id NOT NULL`.
2. **💊 MASTER KATALOG FORMULARIUM & METADATA KLINIS:**
   - Membuat tabel `medication_catalog` dengan kode KFA Kemenkes, unit konversi (box ke tablet/vial), dan flag keselamatan pasien: `is_high_alert`, `is_lasa`, `is_narcotic`, `is_psychotropic`, `is_antibiotic`.
3. **🛡️ DATABASE-ENFORCED ANTI-NEGATIVE STOCK & FEFO BATCHING:**
   - Membuat tabel `inventory_batches` dengan constraint anti-minus mutlak: `CHECK (available_quantity >= 0)` dan kolom versioning optimistik (`version INT NOT NULL DEFAULT 1`).
   - Membuat index khusus FEFO: `(warehouse_id, medication_id, expiry_date ASC, available_quantity)` untuk pemanggilan batch obat dengan tanggal kadaluwarsa terdekat secara instan.
4. **📜 IMMUTABLE DOUBLE-ENTRY STOCK MOVEMENT LEDGER:**
   - Membuat tabel `inventory_stock_movements` untuk mencatat seluruh mutasi stok masuk, keluar, transfer depo, dispensing resep, retur, pemusnahan obat expired, dan penyesuaian stok opname secara append-only.
5. **💊 PRESCRIPTION DISPENSE RECORDS:**
   - Membuat tabel `prescription_dispense_records` yang mengalokasikan batch spesifik per item resep dokter ke encounter pasien.
6. **🔒 PHYSICAL ROW-LEVEL SECURITY (RLS):**
   - Mengaktifkan RLS dan policy isolasi tenant pada seluruh 5 tabel farmasi dan persediaan.

---

### 🟢 [17 AGUSTUS 2026] — DATABASE HARDENING GATE 1D.2: APPOINTMENT & OUTPATIENT QUEUE PERSISTENCE HARDENING

**Kategori:** `[MAJOR]` `[DATABASE_HARDENING]` `[APPOINTMENTS]` `[OUTPATIENT_QUEUES]` `[CONCURRENCY_GUARD]` `[BPJS_ANTREAN_V2]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 36 Suites / 116 Tests), `npx prisma validate` (PASS), `npx prisma format` (PASS) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `database/migrations/011_appointment_and_queue_persistence.sql` (NEW), `database/migration_runner.js` (MODIFIED), `prisma/schema.prisma` (MODIFIED), `tests/appointmentQueuePersistence.test.js` (NEW)

#### Detail Migrasi DDL & Pengerasan Persistence Janji Temu & Antrean Rawat Jalan:
1. **📅 APPOINTMENT PHYSICAL PERSISTENCE & ACTIVE SLOT MUTEX (MIGRATION 011):**
   - Membuat tabel relasional `appointments` dengan status komprehensif: `('BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW')`.
   - Mengimplementasikan Partial Unique Index `uq_active_doctor_slot`: `UNIQUE(tenant_id, doctor_id, appointment_date, slot_time) WHERE status IN ('BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION')`.
   - Menjamin bahwa slot yang dibatalkan (`CANCELLED` / `NO_SHOW`) dapat dipesan kembali secara instan oleh pasien lain tanpa melanggar constraint database.
2. **📋 IMMUTABLE RESCHEDULE & CANCELLATION AUDIT LOGS:**
   - Membuat tabel append-only `appointment_audit_logs` untuk melacak riwayat pemindahan jadwal (*reschedule*) dan pembatalan lengkap dengan actor, alasan, dan perbandingan tanggal/slot lama vs baru.
3. **🔢 ATOMIC DAILY QUEUE SEQUENCE COUNTERS:**
   - Membuat tabel `queue_sequences` dengan unique constraint `UNIQUE(tenant_id, pool_code, queue_date)` dan kolom versioning untuk menjamin nomor antrean harian poliklinik ter-generate secara sekuensial tanpa race condition.
4. **🔗 SINGLE SOURCE OF TRUTH (PATIENT JOURNEY CONTINUITY):**
   - Menghubungkan secara eksplisit `Appointment` &rarr; `PatientRegistration` &rarr; `Encounter` &rarr; `QueueTicket` via foreign key `appointment_id` di tabel antrean dan registrasi.
5. **🛡️ PHYSICAL ROW-LEVEL SECURITY (RLS):**
   - Mengaktifkan RLS dan policy isolasi tenant pada seluruh tabel appointment dan antrean.

---

### 🟢 [17 AGUSTUS 2026] — DATABASE HARDENING GATE 1D.1: BED & WARD HIERARCHY PHYSICAL PERSISTENCE & ADT CONCURRENCY

**Kategori:** `[MAJOR]` `[DATABASE_HARDENING]` `[BED_MANAGEMENT]` `[ADT_ENGINE]` `[POSTGRESQL_RLS]` `[CONCURRENCY_MUTEX]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 35 Suites / 108 Tests), `npx prisma validate` (PASS), `npx prisma format` (PASS) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `database/migrations/010_bed_ward_hierarchy.sql` (NEW), `database/migration_runner.js` (MODIFIED), `prisma/schema.prisma` (MODIFIED), `tests/bedWardPersistence.test.js` (NEW)

#### Detail Migrasi DDL & Pengerasan Integritas Tempat Tidur (Bed / ADT):
1. **🏥 PHYSICAL DDL HIRARKI RUANG & TEMPAT TIDUR (MIGRATION 010):**
   - Membuat tabel relasional fisik berjenjang: `master_buildings` &rarr; `master_floors` &rarr; `master_wards` &rarr; `master_rooms` &rarr; `master_beds`.
   - Setiap tabel memiliki foreign key ketat `ON DELETE RESTRICT` dan terikat langsung ke `tenant_id UUID NOT NULL REFERENCES tenant_organizations(id)`.
2. **🔒 BED MUTEX INTEGRITY & PARTIAL UNIQUE INDEXES:**
   - Mencegah *double-booking* tempat tidur dengan partial unique index: `UNIQUE(tenant_id, bed_id) WHERE check_out_time IS NULL`.
   - Mencegah satu encounter pasien menempati 2 ranjang bersamaan: `UNIQUE(tenant_id, encounter_id) WHERE check_out_time IS NULL`.
3. **⚡ OPTIMISTIC CONCURRENCY CONTROL & STATE MACHINE:**
   - Menambahkan kolom `version INT NOT NULL DEFAULT 1` pada `master_beds` untuk deteksi konflik konkuren saat dua petugas admisi memilih ranjang yang sama bersamaan.
   - Enforce status ranjang baku melalui database CHECK constraint: `('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE', 'BLOCKED', 'ISOLATION')`.
4. **📋 IMMUTABLE TRANSFER AUDIT TRAIL:**
   - Tabel `bed_transfers` mencatat jejak audit perpindahan ranjang pasien secara append-only, dengan constraint `CHECK (from_bed_id <> to_bed_id)`.
5. **🛡️ PHYSICAL ROW-LEVEL SECURITY (RLS):**
   - Mengaktifkan RLS dan policy isolasi tenant pada seluruh 7 tabel hirarki tempat tidur.

---

### 🟢 [17 AGUSTUS 2026] — DATABASE HARDENING GATE 1B & 1C: PRISMA RECONCILIATION & MULTI-TENANT IDENTITY FOUNDATION

**Kategori:** `[MAJOR]` `[DATABASE_HARDENING]` `[MULTI_TENANCY]` `[PRISMA_RECONCILIATION]` `[POSTGRESQL_RLS]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 34 Suites / 89 Tests), `npx prisma validate` (PASS), `npx prisma format` (PASS) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `database/migrations/009_tenant_identity_foundation.sql` (NEW), `database/migration_runner.js` (MODIFIED), `prisma/schema.prisma` (MODIFIED & RECONCILED), `tests/tenantFoundation.test.js` (NEW)

#### Detail Rekonsiliasi & Pengerasan Fondasi Multi-Tenant:
1. **🏛️ REKONSILIASI SEMANTIK PRISMA ↔ POSTGRESQL (GATE 1B):**
   - Menambahkan 10 model Prisma yang sebelumnya hanya ada di SQL DDL: `PatientRegistration`, `QueueTicket`, `BpjsSepRecord`, `TriageAssessment`, `TriageSlaTimer`, `ResuscitationEvent`, `CdssAlert`, `HospitalInvoice`, `InaCbgClaim`, `ProcessedEvent`.
   - Mengonfigurasi relasi dua arah (*inverse relations*) pada `Patient`, `EpisodeOfCare`, dan `Encounter`.
2. **🏢 CANONICAL TENANT & SUBSCRIPTION DOMAIN (GATE 1C):**
   - Membuat model DDL `tenant_organizations` (kode unik, jenis RS, kode faskes Kemenkes, status aktif/trial/suspended).
   - Membuat model DDL `tenant_subscriptions` (plan tier, batas `max_beds`, batas `max_users`, `features_enabled` JSONB, masa aktif).
   - Menginjeksi Root Tenant default (`TENANT-HOSPITAL-01`) untuk mencegah data *orphan*.
3. **🔑 TENANT-ID PROPAGATION & COMPOSITE MRN SCOPING:**
   - Menambahkan `tenant_id UUID REFERENCES tenant_organizations(id)` pada seluruh tabel tenant-owned.
   - Mengubah constraint MRN menjadi `UNIQUE(tenant_id, mrn)` sehingga satu nomor RM dapat digunakan pada faskes berbeda tanpa bentrok data.
   - Mengubah username & employeeId user menjadi unik per-tenant: `UNIQUE(tenant_id, username)`.
   - Menjaga NIK dan IHS Number tetap unik nasional (Global Canonical EMPI).
4. **🛡️ POSTGRESQL ROW-LEVEL SECURITY (RLS) SESSION HELPER:**
   - Menyiapkan fungsi helper `current_app_tenant_id()` berbasis session context `SET LOCAL app.tenant_id = '...'` di dalam transaksi database.
5. **🧪 TEST SUITE MULTI-TENANT ISOLATION:**
   - Menambahkan `tests/tenantFoundation.test.js` untuk menguji registrasi tenant, feature gating subscription, isolasi MRN per-tenant, penolakan akses lintas tenant (*Cross-Tenant Read/Write Denied*), dan penanganan tenant nonaktif/suspended.

---

### 🟢 [17 AGUSTUS 2026] — Implementasi MULTI-DEVICE DEVELOPMENT, SECRET MANAGEMENT & ENVIRONMENT HARDENING

**Kategori:** `[MAJOR]` `[DEVSECOPS]` `[SECRET_MANAGEMENT]` `[ENV_HARDENING]` `[DOCKER_SECURITY]` `[MULTI_DEVICE_BOOTSTRAP]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 32 Suites / 79 Tests), Secret Scanner (`npm run scan:secrets` PASS 674 files) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `.gitignore` (HARDENED), `.env.example` (STANDARDIZED), `.env` (UNTRACKED & PURGED), `docker-compose.yml` (HARDENED), `server/config/envValidator.js` (NEW), `server/utils/logSanitizer.js` (NEW), `scripts/setup.js` (NEW), `scripts/scan-secrets.js` (NEW), `docs/DEVELOPMENT.md` (NEW), `docs/SECURITY_SECRET_MANAGEMENT.md` (NEW), `tests/environmentValidation.test.js` (NEW), `tests/loggingRedaction.test.js` (NEW)

#### Detail Pengerasan Keamanan & Multi-Device:
1. **🛡️ UNTRACK & PURGE FILE `.env` DARI GIT:**
   - Menghapus tracking `.env` dari Git index dan memperketat `.gitignore` agar mengecualikan seluruh varian `.env*` (kecuali `.env.example`), private keys (`*.pem`, `*.key`), certificate (`*.crt`), dan service account credentials.
2. **⚙️ ENVIRONMENT VALIDATION & PRODUCTION GUARD (`envValidator.js`):**
   - Validasi ketat variabel environment pada waktu boot/runtime yang menolak fallback kredensial default (*Zero-Secret-Fallback*) dan mendeteksi kunci lemah pada mode produksi.
3. **🔍 AUTOMATED SECRET SCANNER (`scan-secrets.js`):**
   - Skrip pemindaian otomatis untuk mendeteksi kunci privat RSA/EC, AWS Access Keys, GitHub PAT, dan hardcoded connection string.
4. **🧙 DEVELOPER BOOTSTRAP WIZARD (`setup.js`):**
   - Memfasilitasi onboarding pengembang pada device baru (`npm run setup`) untuk membuat `.env.local` lokal tanpa menyalin file secret antar developer.
5. **🧹 SECURE LOG SANITIZER & PHI REDACTOR (`logSanitizer.js`):**
   - Masking otomatis untuk field sensitif (`password`, `token`, `authorization`, `apiKey`, `creditCard`) pada log aplikasi.

---

**Kategori:** `[MAJOR]` `[APPOINTMENT_QUEUE]` `[INACBG_CLAIMS]` `[FEFO_INVENTORY]` `[NOTIFICATION_ENGINE]` `[SAAS_SUBSCRIPTION]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 30 Suites / 74 Tests) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `server/services/appointmentQueue.service.js` (NEW), `server/services/claimInaCbg.service.js` (NEW), `server/services/inventoryManagement.service.js` (NEW), `server/services/notificationEngine.service.js` (NEW), `server/services/tenantSubscription.service.js` (NEW), `tests/appointmentQueue.test.js` (NEW), `tests/claimInaCbg.test.js` (NEW), `tests/inventoryManagement.test.js` (NEW), `tests/notificationEngine.test.js` (NEW), `tests/tenantSubscription.test.js` (NEW)

#### Detail Peningkatan Commercial & Operational SaaS:
1. **🎟️ APPOINTMENT & QUEUE ENGINE (`appointmentQueue.service.js`):**
   - Penjadwalan konsultasi dokter spesialis, penerbitan tiket antrean poli otomatis (*e.g. INT-001*), integrasi check-in mandiri, dan siklus status antrean.
2. **💰 BPJS E-KLAIM & INA-CBG GROUPING ENGINE (`claimInaCbg.service.js`):**
   - Kodifikasi ICD-10/ICD-9-CM grouping, kalkulasi tarif INA-CBGs (Severity I, II, III), serta analisis variansi biaya riil RS vs klaim BPJS (*Cost-Variance/Profitability Margin*).
3. **📦 PHARMACY PROCUREMENT & WAREHOUSE FEFO INVENTORY (`inventoryManagement.service.js`):**
   - Multi-gudang farmasi & depo, alokasi pengeluaran stok resep berdasarkan tanggal kadaluarsa terdekat (*First-Expired, First-Out / FEFO*), dan pemantauan batas stok minimum.
4. **🔔 MULTI-CHANNEL CLINICAL NOTIFICATION ENGINE (`notificationEngine.service.js`):**
   - Pengiriman notifikasi darurat nilai kritis lab (*Panic Value*), eskalasi triase merah IGD, dan panggilan poli melalui gateway WhatsApp, Email, SMS, dan sirene in-app.
5. **🏢 MULTI-TENANT SAAS SUBSCRIPTION & LICENSING (`tenantSubscription.service.js`):**
   - Manajemen paket berlangganan (*Starter Clinic, Professional Hospital, Enterprise Multi-Branch Network*), batas kapasitas tempat tidur/pengguna, dan *feature-flag gating*.

---

**Kategori:** `[MAJOR]` `[OPERATING_THEATRE]` `[CRITICAL_CARE_SOFA]` `[BLOOD_BANK_BDRS]` `[STAFF_SCHEDULING]` `[WORKFLOW_ORCHESTRATOR]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 25 Suites / 66 Tests) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `server/services/operatingTheatre.service.js` (NEW), `server/services/criticalCare.service.js` (NEW), `server/services/bloodBank.service.js` (NEW), `server/services/staffScheduling.service.js` (NEW), `server/services/clinicalWorkflowOrchestrator.service.js` (NEW), `tests/operatingTheatre.test.js` (NEW), `tests/criticalCare.test.js` (NEW), `tests/bloodBank.test.js` (NEW), `tests/staffScheduling.test.js` (NEW), `tests/workflowOrchestrator.test.js` (NEW)

#### Detail Peningkatan Bedah Sentral, ICU & Workflow:
1. **🏥 CENTRAL OPERATING THEATRE & WHO CHECKLIST (`operatingTheatre.service.js`):**
   - Penjadwalan operasi bedah sentral, verifikasi *WHO Surgical Safety Checklist (Sign In, Time Out, Sign Out)*, serta evaluasi pemulihan pasca-anestesi (*Aldrete Score* $\ge 9$).
2. **🫁 ICU & CRITICAL CARE SCORING (`criticalCare.service.js`):**
   - Mesin kalkulasi *Sequential Organ Failure Assessment (SOFA Score)* untuk stratifikasi risiko disfungsi multi-organ/sepsis serta pemantauan keseimbangan cairan 24 jam (*Fluid Balance*).
3. **🩸 BLOOD BANK (BDRS) & HEMOVIGILANCE (`bloodBank.service.js`):**
   - Matriks validasi kompatibilitas golongan darah ABO/Rh, penerbitan kantong darah hasil *Cross-Matching*, serta protokol keselamatan hemovigilans.
4. **📅 ENTERPRISE STAFF SCHEDULING & ROSTER (`staffScheduling.service.js`):**
   - Pengaturan shift jaga perawat dan dokter spesialis on-call dengan validasi pencegahan konflik jadwal otomatis.
5. **⚡ UNIVERSAL CLINICAL WORKFLOW ORCHESTRATOR (`clinicalWorkflowOrchestrator.service.js`):**
   - Orkestrasi transisi alur klinis berbasis *State Machine Formal* yang menggantikan percabangan logika hardcoded.

---

**Kategori:** `[MAJOR]` `[FHIR_R4_MAPPERS]` `[EMPI_DEDUPLICATION]` `[ABAC_SECURITY]` `[LIS_PACS_ENGINE]` `[MULTI_TENANT_SAAS]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 20 Suites / 55 Tests) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `server/integrations/fhir/*` (NEW: `patient.mapper.js`, `practitioner.mapper.js`, `observation.mapper.js`, `allergy.mapper.js`), `server/services/empiEngine.service.js` (NEW), `server/services/abacSecurity.service.js` (NEW), `server/services/lisPacsEngine.service.js` (NEW), `server/middlewares/tenantMiddleware.js` (NEW), `tests/fhirMappers.test.js` (NEW), `tests/empiEngine.test.js` (NEW), `tests/abacSecurity.test.js` (NEW), `tests/lisPacsEngine.test.js` (NEW)

#### Detail Peningkatan FHIR, EMPI & ABAC Security:
1. **🌐 SATUSEHAT FHIR R4 RESOURCE MAPPER LAYER (`server/integrations/fhir/`):**
   - Generator resource profil standar HL7 FHIR R4: `Patient` (NIK/MRN/BPJS), `Practitioner` (SIP/STR/IHS), `Observation` (LOINC Lab/Vitals), dan `AllergyIntolerance` (SNOMED CT).
2. **🧬 ENTERPRISE MASTER PATIENT INDEX (EMPI) DEDUPLICATION (`empiEngine.service.js`):**
   - Algoritma pencocokan hibrida (Deterministik NIK/BPJS + Probabilistik Fuzzy Levenshtein Distance $\ge 85\%$) untuk mendeteksi variasi nama duplikat serta mutasi penggabungan rekam medis (*Patient Merge/Link*).
3. **🛡️ ABAC & ROW-LEVEL SECURITY POLICY ENGINE (`abacSecurity.service.js`):**
   - Kontrol otorisasi berbasis atribut kontekstual (Penugasan DPJP utama, perawat ruangan/bangsal terkait, pencegahan akses catatan medis oleh staf kasir, dan mode darurat *Emergency Break-The-Glass* dengan bendera audit).
4. **🔬 TRUE LIS & RIS/PACS CLINICAL WORKFLOW (`lisPacsEngine.service.js`):**
   - Siklus barcode spesimen laboratorium, eskalasi notifikasi nilai kritis (*Panic Value Alert*), serta penjadwalan DICOM Study Instance UID untuk penampil radiologi.
5. **🏢 MULTI-TENANT SAAS ISOLATION (`tenantMiddleware.js`):**
   - Resolusi header `X-Tenant-ID` dan `X-Branch-ID` untuk isolasi multi-rumah sakit dalam satu platform terpusat.

---

**Kategori:** `[MAJOR]` `[MASTER_DATA]` `[EMAR_BCMA]` `[HOSPITAL_METRICS]` `[CI_CD_WORKFLOW]` `[JCI_PATIENT_SAFETY]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 16 Suites / 43 Tests) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `server/services/masterDataGovernance.service.js` (NEW), `server/services/eMarEngine.service.js` (NEW), `server/services/hospitalMetrics.service.js` (NEW), `.github/workflows/ci.yml` (NEW), `tests/masterDataGovernance.test.js` (NEW), `tests/eMarEngine.test.js` (NEW), `tests/hospitalMetrics.test.js` (NEW)

#### Detail Peningkatan Master Data Governance & eMAR:
1. **🏛️ MASTER DATA GOVERNANCE (`masterDataGovernance.service.js`):**
   - Katalog terpusat untuk Master Departemen/Instalasi, Poliklinik, Staf Medis (SIP/STR/IHS/BPJS), ICD-10, ICD-9-CM, LOINC, dan Formularium Obat Nasional dengan penanda LASA & High-Alert.
2. **💊 eMAR & 5-RIGHT BARCODE MEDICATION ADMINISTRATION (`eMarEngine.service.js`):**
   - Penegakan keselamatan pasien berstandar JCI IPSG 3 dengan verifikasi barcode 5-Benar (Benar Pasien, Obat, Dosis, Rute, Waktu) dan aturan wajib *Dual Sign-Off* oleh perawat saksi untuk obat kategori *High-Alert* (Insulin, Heparin, Kemoterapi).
3. **📈 HOSPITAL OPERATIONAL QUALITY INDICATORS (`hospitalMetrics.service.js`):**
   - Mesin kalkulasi indikator mutu pelayanan rawat inap Barber-Johnson (BOR, ALOS, TOI, BTO) serta kepatuhan respon *Door-to-Doctor SLA* Instalasi Gawat Darurat berdasarkan level keparahan ATS (P1-P5).
4. **⚙️ AUTOMATED CI/CD GITHUB ACTIONS PIPELINE (`.github/workflows/ci.yml`):**
   - Workflow otomasi validasi pull-request dan push: Checkout, Setup Node 20, Install Dependency (`npm ci`), Automated Vitest (43 Tests), Production Bundle Build (`npm run build`), dan Docker Container Build Verification.

---

**Kategori:** `[MAJOR]` `[ADT_ENGINE]` `[BED_MANAGEMENT]` `[OUTBOX_PATTERN]` `[CRYPTO_SECURITY]` `[BLOCKCHAIN_AUDIT]` `[HL7_FHIR]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 13 Suites / 35 Tests) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `prisma/schema.prisma` (UPGRADED), `server/services/adtEngine.service.js` (NEW), `server/services/outboxWorker.service.js` (NEW), `server/integrations/bpjsVclaimClient.js` (UPGRADED Node crypto HMAC), `tests/adtEngine.test.js` (NEW), `tests/outboxPattern.test.js` (NEW)

#### Detail Peningkatan ADT, Bed Management & Outbox:
1. **🏥 ADT STATE MACHINE & BED MANAGEMENT (`adtEngine.service.js`):**
   - Transisi siklus rawat inap lengkap berstandar HL7 (A01 Admit Pasien, A02 Transfer Antar Ruangan/Bed, A03 Discharge & Pengalihan Status Bed ke *Cleaning*).
2. **🏢 HIERARKI RUANG INAP POSTGRESQL PRISMA (`prisma/schema.prisma`):**
   - Pemodelan relational bertingkat: `Building` &rarr; `Floor` &rarr; `Ward` &rarr; `Room` &rarr; `Bed` dengan entitas pelacak `BedOccupancy` dan `BedTransfer`.
3. **📦 TRANSACTIONAL OUTBOX PATTERN (`outboxWorker.service.js`):**
   - Mekanisme penjamin konsistensi data *dual-write* antara database PostgreSQL dengan SATUSEHAT / BPJS melalui tabel outbox dan background publisher worker dengan *Dead Letter Queue (DLQ)*.
4. **🔐 CRYPTOGRAPHIC HMAC-SHA256 & BLOCKCHAIN AUDIT LOG:**
   - Implementasi tanda tangan digital Trust Mark resmi berbasis modul bawaan Node.js `crypto.createHmac` dan audit trail *event sourcing* dengan `eventHash` dan `previousHash`.

---

**Kategori:** `[MAJOR]` `[OPENAPI_SWAGGER]` `[WEBSOCKET_BROKER]` `[ATOMIC_TRANSACTION]` `[DB_SEEDER]` `[E2E_TESTING]` `[PITR_BACKUP]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 11 Suites / 29 Tests) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `server/docs/openapi.json` (NEW), `server/realtime/clinicalWebSocket.js` (NEW), `server/services/atomicTransaction.service.js` (NEW), `database/seeders/master_seed.js` (NEW), `database/migration_runner.js` (NEW), `scripts/backup_postgres_pitr.sh` (NEW), `tests/e2ePatientJourney.test.js` (NEW), `server/server.js` (MODIFIED)

#### Detail Peningkatan Production Hardening:
1. **📖 OPENAPI 3.0 & SWAGGER SPECIFICATION (`/docs`):**
   - Dokumentasi antarmuka standar internasional OpenAPI 3.0 untuk seluruh rute endpoint otentikasi, master pasien, CPOE order, dan penagihan kasir.
2. **⚡ CLINICAL WEBSOCKET & PUB/SUB BROKER (`clinicalWebSocket.js`):**
   - Menghilangkan beban polling frontend dengan sistem push real-time untuk channel IGD Triage, Nurse Station, Farmasi, dan Panic Value Laboratorium.
3. **🛡️ ATOMIC TRANSACTION COORDINATOR (`atomicTransaction.service.js`):**
   - Semantik ACID multi-domain yang menjamin transaksi pendaftaran, pembuatan encounter, dan inisialisasi billing commit secara utuh atau rollback otomatis jika terjadi kegagalan sistem.
4. **🏥 MASTER CLINICAL SEEDER & MIGRATION RUNNER (`master_seed.js` & `migration_runner.js`):**
   - Master data kredensial staf medis (DPJP, Emergency, Nurse, Farmasis, Kasir), katalog ICD-10, LOINC, dan tarif pelayanan rumah sakit.
5. **🧪 MULTI-STEP E2E PATIENT JOURNEY TEST SUITE (`e2ePatientJourney.test.js`):**
   - Pengujian terintegrasi simulasi alur riil rumah sakit dari admisi, triase ATS, order CPOE, skrining CDSS alergi/ginjal, hingga pelunasan invoice billing.

---

**Kategori:** `[MAJOR]` `[BACKEND_API]` `[PRISMA_ORM]` `[SATUSEHAT_FHIR]` `[BPJS_VCLAIM]` `[API_SECURITY]` `[OBSERVABILITY]` `[INTEGRATION_TESTS]`  
**Status:** Completed & Verified via Vitest (`npm test` PASS 10 Suites / 25 Tests) & Build (`npm run build` PASS)  
**Komponen Terdampak:** `prisma/schema.prisma` (NEW), `server/server.js` (NEW), `server/middlewares/authMiddleware.js` (NEW), `server/middlewares/rbacMiddleware.js` (NEW), `server/routes/auth.routes.js` (NEW), `server/routes/patients.routes.js` (NEW), `server/routes/orders.routes.js` (NEW), `server/routes/billing.routes.js` (NEW), `server/integrations/satusehatClient.js` (NEW), `server/integrations/bpjsVclaimClient.js` (NEW), `tests/satusehatIntegration.test.js` (NEW), `tests/bpjsVclaimIntegration.test.js` (NEW), `tests/authentication.test.js` (NEW), `tests/rbac.test.js` (NEW), `tests/billingEngine.test.js` (NEW), `tests/cdssEngine.test.js` (NEW), `tests/encounterFsm.test.js` (NEW), `src/routes/*` (MODULARIZED), `src/App.jsx` (REFACTORED <60L)

#### Detail Peningkatan Backend & Foundation Hardening:
1. **🖥️ DEDICATED REST API GATEWAY SERVER (`server/`):**
   - REST API Engine dengan CORS, Rate Limiter, Correlation ID Interceptor, dan route group `/api/v1/auth`, `/api/v1/patients`, `/api/v1/orders`, `/api/v1/billing`.
2. **📐 POSTGRESQL PRISMA ORM SCHEMA (`prisma/schema.prisma`):**
   - Skema ORM terpadu untuk Master Patient, EpisodeOfCare, Encounter, SOAP, CPPT, Observations, Universal Orders, Pharmacy, LIS, PACS, Billing Ledger, hingga Audit Trail.
3. **🇮🇩 BRIDGING RESMI SATUSEHAT & BPJS VCLAIM 2.0:**
   - `server/integrations/satusehatClient.js`: FHIR R4 Encounter & Observation bundle builder.
   - `server/integrations/bpjsVclaimClient.js`: Header autentikasi HMAC-SHA256 timestamp & SEP creation payload builder.
4. **📊 OBSERVABILITY & HEALTHCHECKS (`/health/live`, `/health/ready`, `/metrics`):**
   - Endpoint status kesiapan layanan dan Prometheus metrics standard.

---

**Kategori:** `[MAJOR]` `[TECHNICAL_DEBT]` `[DATABASE_MIGRATION]` `[REPOSITORY_PATTERN]` `[RBAC_SECURITY]` `[BILLING_ENGINE]` `[UNIT_TESTS]` `[CI_CD_DOCKER]`  
**Status:** Completed & Verified via Build (`npm run build` PASS)  
**Komponen Terdampak:** `database/migrations/001_master_patients.sql` (NEW), `database/migrations/002_episodes_and_encounters.sql` (NEW), `database/migrations/003_front_office_and_queues.sql` (NEW), `database/migrations/004_triage_and_emergency.sql` (NEW), `database/migrations/005_emr_soap_cppt_and_cdss.sql` (NEW), `database/migrations/006_universal_orders_pharmacy_lis_pacs.sql` (NEW), `database/migrations/007_billing_revenue_and_claims.sql` (NEW), `database/migrations/008_audit_trail_and_security.sql` (NEW), `src/core/repositories/baseRepository.js` (NEW), `src/core/repositories/patientRepository.js` (NEW), `src/core/repositories/billingRepository.js` (NEW), `src/core/security/rbacGuard.service.js` (NEW), `src/core/security/enterpriseAuth.service.js` (NEW), `src/core/security/PermissionGate.jsx` (NEW), `src/modules/billing/services/billingEngine.service.js` (NEW), `src/shared/sharedQueueFacade.service.js` (NEW), `src/shared/sharedGovernanceFacade.service.js` (NEW), `tests/triageEngine.test.js` (NEW), `tests/allergyEngine.test.js` (NEW), `tests/universalOrderEngine.test.js` (NEW), `.github/workflows/ci.yml` (NEW), `Dockerfile` (NEW), `docker-compose.yml` (NEW), `nginx.conf` (NEW)

#### Detail Peningkatan Sprint 5.5 Enterprise Hardening:
1. **🗄️ POSTGRESQL PRODUCTION MIGRATIONS (`database/migrations/`):**
   - 8 berkas migrasi SQL lengkap dari *001 s/d 008* yang mencakup seluruh skema relational database: Pasien, Episode, Encounter, Antrean, BPJS SEP, Triase, SOAP, CPPT, Alergi, Universal Orders, Billing Ledger, Invoice, hingga Trigger Immutability Audit Trail JCI.
2. **🏛️ REPOSITORY PATTERN LAYER (`src/core/repositories/`):**
   - Pemisahan bersih antara Application/Service Layer dengan Persistence Storage melalui `BaseRepository`, `patientRepository`, dan `billingRepository`.
3. **🔐 ENTERPRISE AUTHENTICATION & RBAC SECURITY (`src/core/security/`):**
   - Matriks perizinan 8 peran tenaga medis (Doctor, Nurse, Pharmacist, Lab, Radiographer, Cashier, Registration, Super Admin) dengan `PermissionGate` dan simulasi JWT session expiration.
4. **💰 BILLING ENGINE & REVENUE CYCLE MANAGEMENT (`billingEngine.service.js`):**
   - Agregasi charge ledger ke invoice resmi, kalkulator tarif INA-CBGs & analisa varians klaim, serta multi-payment settlement.
5. **🧪 TEST AUTOMATION SUITES (`tests/`):**
   - Unit tests untuk mesin klinis kritis: `triageEngine`, `allergyEngine`, dan `universalOrderEngine`.
6. **🚀 DEVOPS, CI/CD PIPELINE & CONTAINERIZATION:**
   - Multi-stage `Dockerfile` dengan Nginx Alpine, konfigurasi `docker-compose.yml` (PostgreSQL 16 & Redis 7), serta pipeline GitHub Actions `.github/workflows/ci.yml`.

---

**Kategori:** `[MAJOR]` `[UNIVERSAL_ORDERS]` `[CPOE]` `[PHARMACY_ERESEP]` `[LIS]` `[PACS_DICOM]` `[LOINC]` `[MEDICATION_REVIEW]` `[BILLING_EVENT_BUS]`  
**Status:** Completed & Verified via Build (`npm run build` PASS)  
**Komponen Terdampak:** `src/modules/orders/types/orders.types.ts` (NEW), `src/modules/orders/services/universalOrderEngine.service.js` (NEW), `src/modules/orders/services/medicationReviewEngine.service.js` (NEW), `src/modules/orders/services/pharmacyEngine.service.js` (NEW), `src/modules/orders/services/laboratoryEngine.service.js` (NEW), `src/modules/orders/services/radiologyEngine.service.js` (NEW), `src/modules/orders/services/lisBridge.service.js` (NEW), `src/modules/orders/services/pacsBridge.service.js` (NEW), `src/modules/orders/services/medicationInteractionEngine.service.js` (NEW), `src/modules/orders/services/orderCatalogEngine.service.js` (NEW), `src/modules/orders/services/ordersApi.service.js` (NEW), `src/modules/orders/store/orders.store.js` (NEW), `src/modules/orders/components/OrdersWorkspace.jsx` (NEW), `src/modules/orders/components/OrderEntryWorkspace.jsx` (NEW), `src/modules/orders/components/PharmacyWorkspace.jsx` (NEW), `src/modules/orders/components/MedicationReviewWorkspace.jsx` (NEW), `src/modules/orders/components/LaboratoryWorkspace.jsx` (NEW), `src/modules/orders/components/LaboratoryResultWorkspace.jsx` (NEW), `src/modules/orders/components/RadiologyWorkspace.jsx` (NEW), `src/modules/orders/components/RadiologyViewerWorkspace.jsx` (NEW), `src/modules/orders/components/OrderTimelineWorkspace.jsx` (NEW), `src/App.jsx` (MODIFIED)

#### Detail Peningkatan Sprint 5 Universal Order, Farmasi, LIS & PACS:
1. **📦 UNIVERSAL ORDER ENGINE FSM (`universalOrderEngine.service.js`):**
   - Finite State Machine ketat: `DRAFT` &rarr; `ORDERED` &rarr; `VERIFIED` &rarr; `IN_PROGRESS` &rarr; `COMPLETED` (dengan penolakan transisi ilegal).
   - Pengaturan prioritas order: `ROUTINE`, `URGENT`, dan `CITO`.
2. **💊 PHARMACY E-PRESCRIPTION & CLINICAL REVIEW (`pharmacyEngine.service.js` & `medicationReviewEngine.service.js`):**
   - Alur: E-Resep &rarr; Telaah 7 Benar Farmasis (Administratif, Farmasetik, Klinis) &rarr; Dispensing & Penyerahan Obat.
   - Peringatan *High-Alert Medications* (Double-Check), *LASA*, *Antibiotic Stewardship*, dan kalkulator dosis pediatrik/penyesuaian ginjal.
3. **🧪 LABORATORY INFORMATION SYSTEM / LIS (`laboratoryEngine.service.js` & `lisBridge.service.js`):**
   - Alur spesimen: *Order &rarr; Sampling Barcode &rarr; Penerimaan Lab &rarr; Auto-Analyzer Run &rarr; Validasi Dokter Sp.PK &rarr; Rilis Hasil*.
   - Deteksi otomatis Nilai Kritis (*Panic Value*) & Delta Check dengan kodefikasi terstandarisasi **LOINC**.
4. **🩻 RADIOLOGY INFORMATION SYSTEM & PACS VIEWER (`radiologyEngine.service.js` & `pacsBridge.service.js`):**
   - Pembuatan **DICOM Study Instance UID** terstandarisasi ISO (*1.2.840.113619...*).
   - Web PACS DICOM Viewer simulator & ekspertise terstruktur Dokter Spesialis Radiologi (JCI GLD Ready).
5. **⚡ DECOUPLED BILLING INTEGRATION VIA EVENT BUS:**
   - Farmasi, Laboratorium, dan Radiologi **dilarang menulis langsung ke Billing**. Seluruh pembebanan biaya dipicu melalui canonical domain event **`SERVICE_CHARGED`** ke Universal Event Bus yang diproyeksikan secara atomik ke Billing Ledger.

---

**Kategori:** `[MAJOR]` `[CORE_EMR]` `[SOAP_ENGINE]` `[CPPT_MULTIDISIPLIN]` `[ALLERGY_REGISTRY]` `[CDSS]` `[ICD10]` `[LOINC]` `[LONGITUDINAL_TIMELINE]`  
**Status:** Completed & Verified via Build (`npm run build` PASS)  
**Komponen Terdampak:** `src/modules/emr/types/emr.types.ts` (NEW), `src/modules/emr/services/soapEngine.service.js` (NEW), `src/modules/emr/services/cpptEngine.service.js` (NEW), `src/modules/emr/services/allergyEngine.service.js` (NEW), `src/modules/emr/services/observationEngine.service.js` (NEW), `src/modules/emr/services/diagnosisEngine.service.js` (NEW), `src/modules/emr/services/carePlanEngine.service.js` (NEW), `src/modules/emr/services/cdssEngine.service.js` (NEW), `src/modules/emr/services/emrTimelineEngine.service.js` (NEW), `src/modules/emr/services/emrApi.service.js` (NEW), `src/modules/emr/store/emr.store.js` (NEW), `src/modules/emr/components/AllergyWorkspace.jsx` (NEW), `src/modules/emr/components/CdssAlertCenter.jsx` (NEW), `src/modules/emr/components/ClinicalObservationWorkspace.jsx` (NEW), `src/modules/emr/components/DiagnosisWorkspace.jsx` (NEW), `src/modules/emr/components/CarePlanWorkspace.jsx` (NEW), `src/modules/emr/components/CpptWorkspace.jsx` (NEW), `src/modules/emr/components/SoapWorkspace.jsx` (NEW), `src/modules/emr/components/LongitudinalTimeline.jsx` (NEW), `src/modules/emr/components/EmrWorkspace.jsx` (NEW), `src/App.jsx` (MODIFIED)

#### Detail Peningkatan Sprint 4 Rawat Jalan & Core EMR:
1. **📋 STRUCTURED SOAP ENGINE (`soapEngine.service.js`):**
   - Dokumentasi medis terstruktur (Subjective, Objective, Assessment, Plan) berorientasi *Clinical Decision Making*.
   - Integrasi langsung dengan resource **SATUSEHAT HL7 FHIR Composition** dan tanda tangan elektronik dokter DPJP.
2. **👥 CPPT MULTIDISIPLIN TERINTEGRASI (`cpptEngine.service.js`):**
   - Dokumentasi catatan perkembangan pasien terintegrasi untuk seluruh Profesional Pemberi Asuhan (PPA): Dokter DPJP, Dokter Jaga, Perawat, Apoteker Klinis, Dietisien Gizi, dan Fisioterapis dengan verifikasi DPJP 24 jam.
3. **🛡️ JCI IPSG 3 ALLERGY REGISTRY & CROSS-SENSITIVITY (`allergyEngine.service.js`):**
   - Registry komprehensif alergi obat, makanan, lingkungan, dan lateks medis.
   - Algoritma pencegahan alergi silang (*cross-reactivity*) antara penisilin dan sefalosporin generasi awal.
4. **🧠 CLINICAL DECISION SUPPORT SYSTEM / CDSS (`cdssEngine.service.js`):**
   - Skrining keamanan peresepan obat instan: Kontraindikasi fungsi ginjal (eGFR < 30 mL/min & Metformin/NSAID), Interaksi Obat Mayor (Simvastatin + Amlodipine), dan Peringatan Duplikasi Terapi.
5. **📜 LONGITUDINAL MEDICAL RECORD TIMELINE (`emrTimelineEngine.service.js`):**
   - Tampilan alur perjalanan klinis pasien lintas episode, menyatukan seluruh riwayat SOAP, CPPT, Observasi LOINC, Diagnosis ICD-10/SNOMED, dan Rencana Asuhan (Care Plan).

---

**Kategori:** `[MAJOR]` `[EMERGENCY]` `[TRIAGE_ATS]` `[SLA_STOPWATCH]` `[FAST_TRACK_PROTOCOL]` `[RESUSCITATION]` `[CODE_BLUE]` `[PMKP]`  
**Status:** Completed & Verified via Build (`npm run build` PASS)  
**Komponen Terdampak:** `src/modules/emergency/types/emergency.types.ts` (NEW), `src/modules/emergency/services/triageEngine.service.js` (NEW), `src/modules/emergency/services/triageSlaEngine.service.js` (NEW), `src/modules/emergency/services/emergencyProtocolEngine.service.js` (NEW), `src/modules/emergency/services/emergencyWorkflowEngine.service.js` (NEW), `src/modules/emergency/services/emergencyAlertEngine.service.js` (NEW), `src/modules/emergency/services/emergencyApi.service.js` (NEW), `src/modules/emergency/store/emergency.store.js` (NEW), `src/modules/emergency/components/EmergencyProtocolModal.jsx` (NEW), `src/modules/emergency/components/ResuscitationWorkspace.jsx` (NEW), `src/modules/emergency/components/SlaTimerDashboard.jsx` (NEW), `src/modules/emergency/components/TriageAssessmentWorkspace.jsx` (NEW), `src/modules/emergency/components/EmergencyPatientTracker.jsx` (NEW), `src/modules/emergency/components/EmergencyWorkspace.jsx` (NEW), `src/App.jsx` (MODIFIED)

#### Detail Peningkatan Sprint 3 Emergency & Triage System:
1. **🚨 TRIAGE ATS & ESI v4 ASSESSMENT (`triageEngine.service.js`):**
   - Klasifikasi keparahan klinis terstandarisasi: `P1_RESUSCITATION` (Merah - 0m), `P2_EMERGENT` (Oranye - 10m), `P3_URGENT` (Kuning - 30m), `P4_SEMI_URGENT` (Hijau - 60m), `P5_NON_URGENT` (Biru - 120m).
   - Pengkajian sistematis **ABCDE** (Airway, Breathing, Circulation, Disability AVPU, Exposure) dan kalkulator GCS otomatis.
2. **⏱️ LIVE STOPWATCH SLA TIMER & PMKP MONITORING (`triageSlaEngine.service.js`):**
   - Stopwatch waktu tanggap dokter IGD seketika dengan deteksi keterlambatan (*overdue breach alarm*).
   - Agregasi indikator mutu **KARS PMKP** (Persentase kepatuhan respon klinis gawat darurat target &ge; 90%).
3. **⚡ 1-KLIK FAST-TRACK PROTOCOL ORDER SETS (`emergencyProtocolEngine.service.js`):**
   - Paket order otomatis: **STEMI Code** (Door-to-Balloon < 90m), **Code Stroke Akut** (Door-to-Needle < 60m), **Surviving Sepsis Hour-1 Bundle**, dan **Aktivasi Tim Trauma Mayor (ATLS)**.
   - Mengotomasi penembakan canonical event `SERVICE_CHARGED` ke Billing Ledger untuk setiap item obat dan diagnostik Cito.
4. **🫀 RESUSCITATION WORKFLOW & CODE BLUE SIREN (`emergencyWorkflowEngine.service.js` & `emergencyAlertEngine.service.js`):**
   - Pencatatan timeline ACLS instan (Siklus CPR 2 menit, Defibrilasi Shock, Epinefrin IV, Intubasi ETT, Bolus Cairan & ROSC).
   - Sirine darurat audio-visual dan siaran suara Code Blue terpusat.

---

**Kategori:** `[MAJOR]` `[FRONT_OFFICE]` `[REGISTRATION]` `[QUEUE]` `[VOICE_SYNTHESIS]` `[BPJS_BRIDGING]` `[OUTBOX_PATTERN]` `[JCI_IPSG1]`  
**Status:** Completed & Verified via Build (`npm run build` PASS)  
**Komponen Terdampak:** `src/modules/front_office/types/frontOffice.types.ts` (NEW), `src/modules/front_office/services/outboxPublisher.service.js` (NEW), `src/modules/front_office/services/registrationEngine.service.js` (NEW), `src/modules/front_office/services/queueManagementEngine.service.js` (NEW), `src/modules/front_office/services/bpjsVClaimBridge.service.js` (NEW), `src/modules/front_office/services/bpjsAntreanBridge.service.js` (NEW), `src/modules/front_office/services/frontOfficeApi.service.js` (NEW), `src/modules/front_office/store/frontOffice.store.js` (NEW), `src/modules/front_office/components/PatientWristbandPrintPreview.jsx` (NEW), `src/modules/front_office/components/BpjsBridgingControlModal.jsx` (NEW), `src/modules/front_office/components/MultiQueueDisplayBoard.jsx` (NEW), `src/modules/front_office/components/RegistrationDeskWorkspace.jsx` (NEW), `src/App.jsx` (MODIFIED)

#### Detail Peningkatan Sprint 2 Front Office & Access Engine:
1. **📦 TRANSACTIONAL OUTBOX PATTERN (`outboxPublisher.service.js`):**
   - Penutupan celah *Dual-Write Problem* melalui penampungan event pada `outbox_events` yang diproses secara asinkron dengan garansi *at-least-once delivery* dan deduplikasi `processed_events`.
2. **📋 REGISTRATION ENGINE & GENERAL CONSENT (`registrationEngine.service.js`):**
   - Pendaftaran Pasien Baru & Pasien Lama (One Patient One Identity).
   - Validasi wajib persetujuan *General Consent* dan *Financial Consent* sebelum Episode of Care diterbitkan.
   - Orkestrasi otomatis Sprint 1 Backbone: Terbit Episode of Care &rarr; Terbit Encounter Layanan &rarr; Terbit Tiket Antrean Poli dalam 1 kali klik.
   - Kepatuhan **JCI IPSG 1**: Pencetakan Gelang Identitas Pasien (Barcode 2D dengan Dua Pengidentifikasi: MRN + NIK/Tanggal Lahir).
3. **📢 MULTI-QUEUE & VOICE SYNTHESIZER ENGINE (`queueManagementEngine.service.js`):**
   - Penomoran multi-pool (Loket `A-xxx`, Poli `B-xxx`, Anak `C-xxx`, IGD `E-xxx`, Farmasi `F-xxx`, Lab `L-xxx`, Rad `R-xxx`).
   - Panggilan audio berbasis **Web Speech API** bahasa Indonesia (*"Nomor Antrean A-001, Silakan menuju ke Loket 1"*).
   - Antrean prioritas untuk pasien Geriatri (>60 thn), Disabilitas, dan Balita.
4. **🛡️ BPJS V-CLAIM 2.0 & ANTREAN MOBILE JKN BRIDGING:**
   - Verifikasi status kepesertaan & hak kelas peserta BPJS dengan Retry & Fallback Policy (`ONLINE` &rarr; `QUEUE` &rarr; `RETRY` &rarr; `MANUAL`).
   - Pengecekan nomor rujukan Faskes 1 dan penerbitan nomor SEP resmi (`0115R0010826V00xxxx`).
   - Sinkronisasi Task ID 1 s/d 7 Mobile JKN secara otomatis.

---

**Kategori:** `[MAJOR]` `[CORE_ARCHITECTURE]` `[CLINICAL]` `[WORKFLOW]` `[APPOINTMENT]` `[EVENT_SOURCING]` `[BILLING_LEDGER]`  
**Status:** Completed & Verified via Build (`npm run build` PASS)  
**Komponen Terdampak:** `src/modules/clinical_core/services/episodeOfCareEngine.service.js` (NEW), `src/modules/clinical_core/services/encounterEngine.service.js` (NEW), `src/modules/clinical_core/services/clinicalWorkflowEngine.service.js` (NEW), `src/modules/clinical_core/services/appointmentEngine.service.js` (NEW), `src/modules/clinical_core/services/universalEventContract.service.js` (NEW), `src/modules/clinical_core/services/clinicalCoreApi.service.js` (NEW), `src/modules/clinical_core/clinicalCore.store.js` (NEW), `src/modules/clinical_core/components/ClinicalCoreWorkspace.jsx` (NEW), `src/App.jsx` (MODIFIED)

#### Detail Peningkatan Sprint 1 Core Clinical Backbone:
1. **🏥 EPISODE OF CARE ENGINE (`episodeOfCareEngine.service.js`):**
   - Agregat utama siklus perawatan: `EMERGENCY`, `OUTPATIENT`, `INPATIENT`, `SURGERY`, `CHRONIC`, `HOMECARE`, `TELEMEDICINE`.
   - Manajemen transisi status: `PLANNED` &rarr; `ACTIVE` &rarr; `ON_HOLD` &rarr; `TRANSFERRED` &rarr; `DISCHARGED` &rarr; `CLOSED`.
   - Pohon hierarki parent-child episode & pengikatan multi-encounter.
2. **🔄 ENCOUNTER FINITE STATE MACHINE (`encounterEngine.service.js`):**
   - State machine 9 status: `PLANNED` &rarr; `ARRIVED` &rarr; `TRIAGED` &rarr; `WAITING` &rarr; `IN_PROGRESS` &rarr; `ON_HOLD` &rarr; `COMPLETED` &rarr; `DISCHARGED` &rarr; `CLOSED`.
   - Validasi transisi ketat & klasifikasi HL7 (`EMER`, `AMB`, `IMP`, `SS`, `HH`, `VR`).
3. **⚙️ REUSABLE CLINICAL WORKFLOW ENGINE (`clinicalWorkflowEngine.service.js`):**
   - Pipeline terstandarisasi: Alur IGD (Triage &rarr; Resuscitation &rarr; Observation &rarr; Admission), Alur Poli (Check-In &rarr; Consultation &rarr; Completed), dan Alur Ranap (Admission &rarr; Bed Assigned &rarr; Treatment &rarr; Discharge).
4. **📅 APPOINTMENT & DOCTOR SCHEDULE ENGINE (`appointmentEngine.service.js`):**
   - Generator slot waktu dokter (15/20 menit), manajemen kuota online/on-site, dan deteksi konflik ganda (*double booking & patient overlap*).
5. **⚡ EVENT-DRIVEN BILLING LEDGER (`universalEventContract.service.js`):**
   - Pemisahan penulisan billing langsung. Modul Farmasi/Lab/Rad mempublikasikan event canonical `SERVICE_CHARGED` yang secara otomatis diproyeksikan ke Billing Ledger agregator.

---

**Kategori:** `[MAJOR]` `[EVENT_SOURCING]` `[QUEUE]` `[RULES]` `[DATA_GOVERNANCE]` `[INTEROPERABILITY]`  
**Status:** Completed & Verified via Build (`npm run build` PASS)  
**Komponen Terdampak:** `src/modules/master_data/services/clinicalEventBus.service.js` (NEW), `src/modules/master_data/services/notificationEngine.service.js` (NEW), `src/modules/master_data/services/queueManagement.service.js` (NEW), `src/modules/master_data/services/businessRuleEngine.service.js` (NEW), `src/modules/master_data/services/kpiCalculation.service.js` (NEW), `src/modules/master_data/services/dataRetention.service.js` (NEW), `src/modules/master_data/services/universalAuditTrail.service.js` (NEW), `src/modules/master_data/data/enterpriseMasterSchemas.js`, `src/modules/master_data/data/enterpriseMasterSeed.js`, `src/modules/master_data/services/enterpriseMasterApi.service.js`, `src/modules/master_data/services/enterpriseFhirMapper.service.js`, `src/modules/master_data/components/domains/PatientMasterWorkspace.jsx`, `src/modules/master_data/components/domains/FacilityHierarchyWorkspace.jsx`, `src/modules/master_data/components/domains/ClinicalMasterWorkspace.jsx`, `src/modules/master_data/data/permissionsRegistry.js`

#### Detail Peningkatan Revisi 5 Master Data Enterprise:
1. **🧬 CLINICAL EVENT SOURCING (`clinicalEventBus.service.js`):**
   - Publikasi domain event imutabel (`clinical_events`) untuk setiap mutasi klinis: `TRIAGE_ASSIGNED`, `ENCOUNTER_CREATED`, `BED_TRANSFERRED`, `BED_CLEANING_STARTED`, `BED_CLEANING_COMPLETED`, `DISCHARGE_AUTHORIZED`, `MEDICATION_PRESCRIBED`, `DPJP_CHANGED`, `QUEUE_TICKET_CREATED`, `QUEUE_TICKET_CALLED`.
2. **🎫 QUEUE MANAGEMENT ENGINE (`queueManagement.service.js`):**
   - Penomoran antrean otomatis multi-loket/poli (`queue_tickets`) dengan pelacakan status (`WAITING`, `CALLED`, `SERVING`, `SKIPPED`, `COMPLETED`).
3. **🚨 NOTIFICATION & SLA ESCALATION ENGINE (`notificationEngine.service.js`):**
   - Engine notifikasi multi-kanal (In-App, WhatsApp, Email) dan pemicu eskalasi otomatis keterlambatan respon waktu triase ATS/ESI (P1 > 0m, P2 > 10m, P3 > 30m, P4 > 60m, P5 > 120m).
4. **⚙️ DYNAMIC BUSINESS RULES ENGINE (`businessRuleEngine.service.js`):**
   - Evaluator aturan dinamis: Skrining dosis Pediatrik (< 12 Thn), Prioritas Geriatrik (> 60 Thn), Surcharge Hari Libur (+20%), Surcharge Tindakan Cito (+25%), dan Pemetaan Paket INA-CBGs BPJS.
5. **📊 CLINICAL KPI SNAPSHOTS (`kpiCalculation.service.js`):**
   - Pembuatan dan penyimpanan snapshot periodik indikator rawat inap (BOR, ALOS, TOI, BTO, Waktu Tunggu IGD).
6. **🗄️ DATA RETENTION & ARCHIVING (`dataRetention.service.js`):**
   - Pengaturan siklus hidup data medis sesuai Permenkes No. 24/2022: Rekam Medis (Aktif 10 Thn, Arsip 25 Thn) dan Audit Trail (Aktif 5 Thn, Arsip 10 Thn).
7. **🌐 INTEROPERABILITAS FHIR R4 EXPANSION:**
   - Tambahan 5 resource FHIR baru: `toFhirTask()`, `toFhirAppointment()`, `toFhirCommunication()`, `toFhirAuditEvent()`, dan `toFhirProvenance()`.

---

**Kategori:** `[MAJOR]` `[ARCHITECTURE]` `[CLINICAL]` `[PHARMACY]` `[SECURITY]` `[INTEROPERABILITY]`  
**Status:** Completed & Verified via Build (`npm run build` PASS)  
**Komponen Terdampak:** `src/modules/master_data/services/episodeOfCare.service.js` (NEW), `src/modules/master_data/services/encounter.service.js` (NEW), `src/modules/master_data/services/admissionTransferDischarge.service.js` (NEW), `src/modules/master_data/services/bedManagement.service.js` (NEW), `src/modules/master_data/services/pharmacyInventory.service.js` (NEW), `src/modules/master_data/services/medicationSafety.service.js` (NEW), `src/modules/master_data/services/tariffVersioning.service.js` (NEW), `src/modules/master_data/services/securityContext.service.js` (NEW), `src/modules/master_data/data/enterpriseMasterSchemas.js`, `src/modules/master_data/data/enterpriseMasterSeed.js`, `src/modules/master_data/services/enterpriseMasterApi.service.js`, `src/modules/master_data/services/enterpriseFhirMapper.service.js`, `src/modules/master_data/components/domains/PatientMasterWorkspace.jsx`, `src/modules/master_data/components/domains/FacilityHierarchyWorkspace.jsx`, `src/modules/master_data/components/domains/ClinicalMasterWorkspace.jsx`, `src/modules/master_data/data/permissionsRegistry.js`, `src/modules/master_data/services/enterpriseAuditEngine.service.js`

#### Detail Peningkatan Revisi 4 Master Data Enterprise:
1. **🏥 ALUR PERAWATAN & STATE MACHINE ENCOUNTER:**
   - Standarisasi `ref_episode_types` (EMERGENCY, AMBULATORY, INPATIENT, DAYCARE, ICU, SURGERY, HOME_CARE) dengan dukungan hierarki parent-child episode.
   - State machine `encounters` dengan validasi transisi baku (`PLANNED` &rarr; `ARRIVED` &rarr; `TRIAGED` &rarr; `WAITING` &rarr; `IN_PROGRESS` &rarr; `ON_HOLD` &rarr; `COMPLETED`) serta proteksi penolakan transisi ilegal.
2. **🛏️ ORKESTRASI ADT & INDIKATOR EFISIENSI RAWAT INAP:**
   - Layanan ADT terpadu: `admissions`, `transfers`, `discharges` yang mengotomasi perubahan status bed dan pencatatan jejak audit.
   - Dashboard & kalkulator indikator efisiensi rawat inap resmi KARS/Depkes: **BOR (Bed Occupancy Rate %)**, **ALOS (Average Length of Stay)**, **TOI (Turnover Interval)**, dan **BTO (Bed Turnover)** serta pelacak durasi sterilisasi tempat tidur (`bed_cleaning_logs`).
3. **💊 KESELAMATAN OBAT FARMASI (LASA & DDI CHECKER):**
   - Engine deteksi obat *Look-Alike Sound-Alike* (`medication_lasa`) dengan format *Tall Man Lettering*.
   - Deteksi interaksi obat klinis bertingkat (*Major, Moderate, Minor*) dengan rekomendasi klinis DPJP.
   - Kalkulator konversi satuan multi-level farmasi (`BOX` &rarr; `STRIP` &rarr; `BLISTER` &rarr; `TABLET` / `VIAL` &rarr; `AMPULE` &rarr; `ML`).
4. **🛡️ MULTI-BRANCH ISOLATION (RLS) & TOKEN SECURITY:**
   - Penerapan *Row-Level Security (RLS)* berbasis penugasan cabang (`user_branch_assignments`) untuk isolasi data otomatis.
   - Manajemen pembatalan token JWT (`revoked_tokens`) dan deteksi *concurrent login session*.
5. **🌐 SATUSEHAT INTEROPERABILITAS:**
   - Penyempurnaan mapping FHIR R4: `toFhirEpisodeOfCare()`, `toFhirEncounter()` 9-status mapping, `toFhirMedication()` KFA, dan `toFhirCoverage()`.

---

**Kategori:** `[MAJOR]` `[ENHANCEMENT]` `[CLINICAL]` `[PHARMACY]` `[BILLING]` `[INTEROPERABILITY]`  
**Status:** Completed & Verified via Build (`npm run build` PASS)  
**Komponen Terdampak:** `src/modules/master_data/services/mrnMergeEngine.service.js` (NEW), `src/modules/master_data/data/enterpriseMasterSchemas.js`, `src/modules/master_data/data/enterpriseMasterSeed.js`, `src/modules/master_data/services/enterpriseFhirMapper.service.js`, `src/modules/master_data/services/enterpriseMasterApi.service.js`, `src/modules/master_data/data/permissionsRegistry.js`, `src/modules/master_data/components/domains/ReferenceDataWorkspace.jsx`, `src/modules/master_data/components/domains/FacilityHierarchyWorkspace.jsx`, `src/modules/master_data/components/domains/PatientMasterWorkspace.jsx`, `src/modules/master_data/components/domains/ClinicalMasterWorkspace.jsx`

#### Detail Peningkatan Revisi 2 Master Data Enterprise:
1. **🚨 REFERENCE DATA EXPANSION (IGD, Encounter & Farmasi):**
   - Penambahan tabel master referensi: `ref_triage_scales` (Skala Triase ATS/ESI P1 s/d P5 dengan warna dan target respon respon waktu), `ref_encounter_types` (Klasifikasi Kunjungan: EMERGENCY, AMBULATORY, INPATIENT, SURGERY), `ref_medication_routes` (Rute Obat KFA: Oral, IV Bolus, IV Drip, IM, SC, Inhalasi, Topikal), `ref_dose_units` (Satuan Dosis UCUM: mg, g, mcg, mL, IU, tab), dan `ref_discharge_dispositions` (Cara Keluar Pasien).
2. **🏥 PERLUASAN SKEMA KLINIS & BILLING:**
   - **Formularium Obat (`master_medicines`):** Penambahan relasi `dose_unit_id`, `default_route_id`, penanda `is_antibiotic`, `is_narcotic`, dan kodifikasi resmi `kfa_code` Kemenkes RI.
   - **Tarif Terpadu (`master_tariffs`):** Penambahan pemetaan kode `ina_cbg_code`, persentase tindakan emergensi `cito_percentage`, penanda paket tindakan `is_package`, dan skema aturan penyesuaian tarif dinamis `tariff_price_rules`.
   - **Manajemen Tempat Tidur (`master_beds`):** Penambahan status spesifik `BED_DISINFECTING` (Sterilisasi Kamar) dan `BED_MAINTENANCE_LOCK` (Karantina Pemeliharaan Alkes/Fasilitas) lengkap dengan filter $O_2$ sentral dan ventilator.
3. **🧬 ENGINE REKONSILIASI MRN GANDA (`mrnMergeEngine.service.js`):**
   - Transaksi penggabungan rekam medis duplikat aman berstandar JCI dengan validasi integritas referensial, pengalihan riwayat alergi, penonaktifan MRN asal, dan pencatatan jejak audit mutasi.
4. **🌐 INTEROPERABILITAS SATUSEHAT FHIR R4:**
   - Implementasi mapper `toFhirEncounter()` (`EMER`, `AMB`, `IMP`), validasi relasi spasial `toFhirLocationHierarchy()` (`Bed -> Room -> Ward -> Building` via `partOf.reference`), dan standardisasi `toFhirMedication()` sistem KFA Kemenkes.
5. **🛡️ RBAC & SECURITY PERMISSIONS:**
   - Penambahan izin hak akses granular: `TRIAGE:ASSIGN`, `BED:DISINFECT_RELEASE`, `MEDICINE:HIGH_ALERT_OVERRIDE`, dan `PATIENT:MRN_MERGE_EXECUTE`.

---

### 🟢 [17 AGUSTUS 2026] — Refactoring Total Arsitektur Master Data Enterprise HIS 2026 (9 Core Domains, JCI Event Sourcing, ABAC & SATUSEHAT FHIR R4)

**Kategori:** `[MAJOR]` `[ARCHITECTURE]` `[SECURITY]` `[CLINICAL]` `[INTEROPERABILITY]`  
**Status:** Completed & Verified via Build (`npm run build` PASS)  
**Komponen Terdampak:** `src/modules/master_data/pages/MasterDataWorkspacePage.jsx`, `src/modules/master_data/masterData.store.js`, `src/modules/master_data/data/enterpriseMasterSchemas.js`, `src/modules/master_data/data/enterpriseMasterSeed.js`, `src/modules/master_data/data/permissionsRegistry.js`, `src/modules/master_data/services/enterpriseMasterApi.service.js`, `src/modules/master_data/services/enterpriseAuditEngine.service.js`, `src/modules/master_data/services/enterpriseFhirMapper.service.js`, `src/modules/master_data/components/domains/ReferenceDataWorkspace.jsx`, `src/modules/master_data/components/domains/OrganizationWorkspace.jsx`, `src/modules/master_data/components/domains/HumanResourceWorkspace.jsx`, `src/modules/master_data/components/domains/FacilityHierarchyWorkspace.jsx`, `src/modules/master_data/components/domains/PatientMasterWorkspace.jsx`, `src/modules/master_data/components/domains/ClinicalMasterWorkspace.jsx`, `src/modules/master_data/components/domains/SecurityRbacWorkspace.jsx`, `src/modules/master_data/components/domains/AuditTrailWorkspace.jsx`, `src/modules/master_data/components/domains/IntegrationWorkspace.jsx`, `src/modules/master_data/components/MasterDataTable.jsx`, `src/modules/master_data/components/MasterDataDetailDrawer.jsx`, `src/modules/master_data/components/MasterDataFilterBar.jsx`, `src/modules/master_data/components/MasterDataStatsBar.jsx`

#### Detail Transformasi Arsitektur Enterprise HIS 2026:
* **`[9 CORE ENTERPRISE DOMAINS]` Rekonstruksi Penuh Arsitektur Domain Terdistribusi:**
  1. **📚 REFERENCE DATA (16 Kamus Standar & Wilayah Kemendagri):** Relasi *UUID Foreign Key* terstruktur untuk: *Agama, Pendidikan, Pekerjaan, Status Pernikahan, Jenis Kelamin, Golongan Darah, Provinsi, Kota/Kabupaten, Kecamatan, Kelurahan, Kelas Ruangan, Shift Kerja, Kategori Pemeriksaan, Jenis Penjamin, Service Lines, dan Spesialisasi Medis*.
  2. **🏛️ ORGANIZATION (Tata Kelola Korporat & Multi-Branch):** Pemodelan struktur organisasi induk rumah sakit (*hospitals*), multi-cabang regional (*branches*), instalasi/departemen (*departments*), unit kerja fungsional (*units*), jabatan struktural (*positions*), dan pusat pembiayaan (*cost_centers*).
  3. **👨‍⚕️ HUMAN RESOURCE (SDM Terpadu Medis & Non-Medis):** Manajemen SDM organik (*employees*), kredensialing dokter DPJP (SIP, STR, spesialisasi, clinical privilege), perawat (jenjang klinis PK I s/d PK V terverifikasi), *clinical privileges matrix versioning*, dan roster jadwal praktik.
  4. **🏢 FACILITY (Hierarki Fasilitas 6 Tingkat):** Pemodelan fisik spasial: `Rumah Sakit` &rarr; `Gedung` &rarr; `Lantai` &rarr; `Bangsal (Ward)` &rarr; `Ruangan (Room)` &rarr; `Kelas Perawatan` &rarr; `Tempat Tidur (Bed)` dengan matriks ketersediaan real-time (*Available, Occupied, Cleaning, Reserved*), kesiapan Oksigen Sentral ($O_2$), ventilator, dan kalkulasi BOR.
  5. **👤 PATIENT 360 (One Patient = One Master Identity):** Arsitektur multi-tabel ternormalisasi (*patients, patient_identifiers, patient_addresses, patient_contacts, patient_guardians, patient_emergency_contacts, patient_documents, patient_allergies JCI, patient_merge_history, guarantors, insurances, episodes_of_care, encounters*). Dilengkapi fitur verifikasi NIK KTP, IHS SATUSEHAT, dan instrumen *MRN Merger Tool*.
  6. **🩺 CLINICAL CATALOG & MULTI-COMPONENT TARIFFS:** Katalog poliklinik (*clinics*), diagnosa ICD-10 WHO (*diagnoses*), prosedur bedah ICD-9-CM (*procedures*), parameter lab & panel (*laboratory_tests, lab_panels, specimen_types*), radiologi (*radiology_examinations, rad_modalities*), formularium obat FEFO (*medicines*), alkes elektromedis dengan pelacak kalibrasi IPSRS (*medical_devices*), serta sistem tarif multi-komponen transparan (*Jasa Dokter, Jasa RS, Jasa Perawat, Obat/BHP, Administrasi*) dan paket tindakan (*tariff_packages*).
  7. **🛡️ SECURITY (Enterprise RBAC + ABAC):** Manajemen akun pengguna (*users*), peran hierarki Tier 1-4 (*roles*), perizinan granular (*permissions*), relasi user-roles (*user_roles*), kebijakan atribut (*attribute_policies* berbasis role/dept/unit/shift/branch), sesi aktif (*sessions*), riwayat login (*login_history*), dan token rotation.
  8. **🔍 AUDIT (JCI Event Sourcing & JSONB Diff):** Mesin jejak audit imutabel (*audit_logs, audit_events, audit_snapshots, audit_diffs*) yang mencatat event lifecycle (`entity_created`, `entity_updated`, `entity_deleted`, `entity_restored`, `entity_imported`, `entity_exported`, `entity_merged`), aktor (*user_id/email*), IP address, perangkat, browser, timestamp, serta delta snapshot diff (*old_value vs new_value*).
  9. **🌐 INTEGRATION & INTEROPERABILITY:** Hub konektivitas Kemenkes SATUSEHAT FHIR R4, BPJS Kesehatan (V-Claim & Antrean), HL7 v2/v3 Message Bus, DICOM PACS Server, dan External API Registry.

* **`[SATUSEHAT FHIR R4 COMPLIANCE]` Interoperabilitas Penuh Kemenkes RI:**
  - Konverter skema otomatis untuk 12+ resource FHIR R4: `Patient`, `Practitioner`, `Organization`, `HealthcareService`, `Location`, `Condition`, `Procedure`, `ObservationDefinition`, `ImagingStudy`, `Medication`, dan `Coverage`.

---

### 🟢 [17 AGUSTUS 2026] — Implementasi Arsitektur Fondasi Modul Master Data Enterprise (18 Sub-Modul JCI / SATUSEHAT / KARS)

**Kategori:** `[MAJOR]` `[FEATURE]` `[ARCHITECTURE]` `[SECURITY]` `[GOVERNANCE]`  
**Status:** Completed & Verified via Build (`npm run build` PASS)  
**Komponen Terdampak:** `src/modules/master_data/pages/MasterDataWorkspacePage.jsx`, `src/modules/master_data/masterData.store.js`, `src/modules/master_data/services/masterDataApi.service.js`, `src/modules/master_data/services/masterDataExport.service.js`, `src/modules/master_data/services/masterDataImport.service.js`, `src/modules/master_data/data/masterDataSchemas.js`, `src/modules/master_data/data/masterDataSeed.js`, `src/modules/master_data/data/permissionsRegistry.js`, `src/modules/master_data/components/MasterDataTable.jsx`, `src/modules/master_data/components/MasterDataFilterBar.jsx`, `src/modules/master_data/components/MasterDataFormModal.jsx`, `src/modules/master_data/components/MasterDataDetailDrawer.jsx`, `src/modules/master_data/components/MasterDataStatsBar.jsx`, `src/modules/master_data/components/MasterDataImportModal.jsx`, `src/modules/master_data/components/submodules/RbacMatrixModal.jsx`, `src/App.jsx`, `src/layouts/MainLayout.jsx`

#### Detail Pembaruan & Transformasi Arsitektur:
* **`[MASTER DATA 18 SUB-MODUL]` Cakupan Entitas Rumah Sakit Lengkap & Single Source of Truth:**
  1. **Master Pasien (`patients`):** Manajemen identitas unik pasien, integrasi NIK, No. BPJS, riwayat alergi keselamatan pasien JCI, data demografi, kontak darurat, status operasional, dan SATUSEHAT IHS bridge.
  2. **Master Dokter (`doctors`):** Manajemen identitas DPJP, nomor SIP/STR terverifikasi, spesialisasi, sub-spesialisasi klinis, email rumah sakit, dan status praktik.
  3. **Master Perawat (`nurses`):** Manajemen perawat pelaksana & head nurse, jenjang klinis (PK I s/d PK V), nomor STR, kredensialing, dan unit kerja.
  4. **Master Pegawai (`employees`):** Manajemen seluruh SDM non-medis & medis struktural, NIP, jabatan, departemen, dan unit operasional.
  5. **Master Poli / Klinik (`clinics`):** Manajemen poliklinik rawat jalan, gedung, lantai, pemetaan dokter, dan jadwal.
  6. **Master Ruangan & Bangsal (`rooms`):** Manajemen struktur fisik IGD, ICU, OK, VK, Isolasi, dan Bangsal Perawatan (Paviliun Anggrek, Mawar, dll).
  7. **Master Tempat Tidur (`beds`):** Manajemen ketersediaan real-time (*Available, Occupied, Reserved, Cleaning, Maintenance*), kelas perawatan (*VVIP, VIP, Kelas 1-3, ICU, Isolasi*).
  8. **Master Diagnosa ICD-10 (`diagnoses`):** Katalog ICD-10 WHO versi resmi, bab/kategori, flagging penyakit kronis, dan deskripsi bilingual.
  9. **Master Tindakan ICD-9-CM (`procedures`):** Katalog tindakan medis/bedah ICD-9-CM, estimasi durasi operasi, dan kategori spesialisasi.
  10. **Master Obat (`medicines`):** Manajemen formularium RS/BPJS, sediaan, harga satuan, stok minimum, dan keselamatan obat *High-Alert & LASA*.
  11. **Master Alat Kesehatan (`medical_devices`):** Manajemen alkes elektromedis/life-support, pemantauan masa berlaku kalibrasi IPSL, dan lokasi unit.
  12. **Master Laboratorium (`laboratory_tests`):** Parameter pemeriksaan patologi/klinis, nilai rujukan gender/usia, satuan baku, dan tarif.
  13. **Master Radiologi (`radiology_examinations`):** Eksaminasi imaging (X-Ray, CT Scan, MRI, USG), instruksi persiapan pasien, modalitas, dan tarif.
  14. **Master Tarif Layanan (`tariffs`):** Rincian biaya berbasis komponen (Jasa Dokter, Jasa RS, Jasa Perawat, BHP) dan kelas perawatan.
  15. **Master Penjamin Biaya (`guarantors`):** Integrasi penjamin BPJS Kesehatan, asuransi swasta, instansi perusahaan, dan mandiri/cash.
  16. **Master Asuransi (`insurances`):** Manajemen polis kerjasama korporasi, nomor PKS, masa berlaku kontrak, dan co-pay rate.
  17. **Master Jadwal Dokter (`doctor_schedules`):** Manajemen jadwal praktik per poli/hari, jam layanan, alokasi kuota pasien, dan dokter pengganti.
  18. **Master Hak Akses & RBAC (`roles` & `permissions`):** 12 Role Rumah Sakit Terstandarisasi, 60+ permission granular per modul, dan matriks hak akses visual.

* **`[ENTERPRISE STANDARDS]` Fondasi Sistem & Keamanan Data:**
  - **Soft Delete Only (`is_deleted`, `deleted_at`, `deleted_by`):** Menjamin kepatuhan regulasi rekam medis tanpa penghapusan permanen tidak sengaja.
  - **Restore Engine:** Fitur pemulihan entitas terhapus dari Tempat Sampah secara individual maupun *batch restore*.
  - **JCI-Grade Immutable Audit Trail:** Pencatatan otomatis *delta snapshot (before vs after)*, user ID, timestamp server, dan modul asal.
  - **REST API Layer (`/api/v1/master/...`):** Standardisasi endpoint CRUD, batch upsert, dan sinkronisasi hybrid Firestore + offline local persistence.
  - **Ekspor & Impor:** Ekspor Excel (CSV UTF-8 BOM) yang langsung kompatibel dengan Microsoft Excel tanpa merusak karakter, Cetak Dokumen PDF Resmi ber-kops RS, dan Impor File CSV/JSON dengan validasi duplikasi kode/nama sebelum di-commit.
  - **SATUSEHAT & HL7 FHIR R4 Preview:** Live inspector payload FHIR R4 (*Patient, Practitioner, Location, Condition, Procedure, Medication, dll*) untuk kesiapan interoperabilitas Kemenkes RI.
  - **Modern 2026 UI/UX:** Tata letak 5 kluster navigasi (SDM, Fasilitas, Klinis, Farmasi, Tata Kelola), status switcher tab, dynamic search bar, selection ribbon, drawer detail multi-tab, dan visual status bed.

---

### 🟢 [09 AGUSTUS 2026] — 100% Completion of 39 Information Architecture Sub-Modules in Enterprise Pharmacy Platform

**Kategori:** `[MAJOR]` `[FEATURE]` `[COMPLIANCE]` `[CLINICAL-PHARMACY]`  
**Status:** Completed & Verified via Build  
**Komponen Terdampak:** `src/modules/pharmacy/pages/PharmacyPage.jsx`, `src/modules/pharmacy/components/MedicationMasterWorkspace.jsx`, `src/modules/pharmacy/components/SpecializedPharmacyWorkspace.jsx`, `src/modules/pharmacy/components/PharmacySafetyInterventionWorkspace.jsx`, `src/modules/pharmacy/components/PharmacyIntegrationsReportsWorkspace.jsx`

#### Detail Perbaikan:
* **`[IA FULL COMPLIANCE]` Penuntasan 100% 39 Sub-Modul Pohon Arsitektur Informasi Farmasi:**
  1. **Medication Master & Formulary Workspace (`MedicationMasterWorkspace.jsx`):** Penanganan *Medication Master, Formularium RS, Clinical Protocol, High Alert Medication, LASA Medication, & Controlled Drug Class*.
  2. **Specialized Pharmacy & Cleanroom Workspace (`SpecializedPharmacyWorkspace.jsx`):** Penanganan *Emergency Pharmacy, ICU Pharmacy, Operating Room Pharmacy, IV Admixture Steril, Compounding Racikan, Chemotherapy Protocols, & Therapeutic Drug Monitoring (TDM)*.
  3. **Safety, ADR MESO & Error RCA Workspace (`PharmacySafetyInterventionWorkspace.jsx`):** Penanganan *Drug Interaction, Allergy & Contraindication Check, Adverse Drug Reaction (ADR MESO BPOM), Medication Error Reporting, Medication Return, Medication Substitution, & Pharmacist Intervention Notes*.
  4. **Cross-Module Integrations & Audit Workspace (`PharmacyIntegrationsReportsWorkspace.jsx`):** Penanganan *Pharmacy Inventory Integration (FEFO), Pharmacy Procurement Integration (PO Alert), Pharmacy Billing Integration (BPJS/Payer), Pharmacy Reports Export, & Immutable Audit Trail System*.
  5. **Integrasi Navigasi Rapat Terpusat:** Menghubungkan seluruh 39 nodus IA ke dalam bilah navigasi terintegrasi di `/pharmacy`.

---

### 🟢 [09 AGUSTUS 2026] — Central Enterprise Hospital Pharmacy Platform (NurseFlow HIS 2026)

**Kategori:** `[MAJOR]` `[FEATURE]` `[ARCHITECTURE]` `[CLINICAL-PHARMACY]` `[SAFETY]`  
**Status:** Completed & Verified via Build  
**Komponen Terdampak:** `src/modules/pharmacy/pages/PharmacyPage.jsx`, `src/modules/pharmacy/components/PharmacyDashboardWorkspace.jsx`, `src/modules/pharmacy/components/PharmacistVerificationWorkspace.jsx`, `src/modules/pharmacy/components/MedicationReconciliationWorkspace.jsx`, `src/modules/pharmacy/components/ControlledDrugsWorkspace.jsx`, `src/modules/pharmacy/components/AntibioticStewardshipWorkspace.jsx`

#### Detail Perbaikan:
* **`[ENTERPRISE PHARMACY PLATFORM]` Platform Pengelolaan Medikasi Klinis & Operasional Berstandar JCI:**
  1. **Pengembangan Pharmacy Dashboard Operasional & Safety (`PharmacyDashboardWorkspace.jsx`):** Menampilkan KPI Prescriptions Queue, High Alert Meds, Peringatan LASA (Tall Man), Alergi Obat, Narkotika/Psikotropika, Antibiotic Stewardship, dan Rekonsiliasi Obat.
  2. **Pengembangan Pharmacist Verification Workspace (`PharmacistVerificationWorkspace.jsx`):** Verifikasi keselamatan klinis apoteker mencakup 12 Parameter (*Right Patient, Medication, Dosage, Route, Frequency, Allergy Check, Drug Interactions, Renal Function eGFR, High Alert Double-Check*) dan Generator **Etiket Obat Digital (Dispensing Thermal Label)**.
  3. **Pengembangan Medication Reconciliation Engine (`MedicationReconciliationWorkspace.jsx`):** Lembar komparasi obat pra-admisi vs obat bangsal saat Admisi 24 Jam Pertama, Transfer Bangsal/ICU, dan Pemulangan Pasien (*Discharge Summary*).
  4. **Pengembangan Controlled Drugs & Witness Attestation (`ControlledDrugsWorkspace.jsx`):** Pengelolaan brankas narkotika/psikotropika dengan otentikasi saksi ganda (*Double-Sign Witness Log*) dan pencatatan sisa sediaan (*Waste Log*).
  5. **Pengembangan Antibiotic Stewardship Program / PPRA (`AntibioticStewardshipWorkspace.jsx`):** Penatalaksanaan penggunaan antibiotik spektrum luas terintegrasi dengan hasil kultur mikrobiologi & intervensi de-eskalasi terapi.
  6. **Penyelarasan Visual Identity Ocean Teal:** Mengadopsi bahasa desain **Ocean Teal NurseFlow** (Professional, Clinical, Clean, Premium Enterprise).

---

### 🟢 [09 AGUSTUS 2026] — 100% Completion of 48 Information Architecture Sub-Modules in Central Inventory Engine

**Kategori:** `[MAJOR]` `[FEATURE]` `[COMPLIANCE]` `[ARCHITECTURE]`  
**Status:** Completed & Verified via Build  
**Komponen Terdampak:** `src/modules/inventory/pages/EnterpriseInventoryPage.jsx`, `src/modules/inventory/components/ExpiryManagementWorkspace.jsx`, `src/modules/inventory/components/QuarantineRecallWorkspace.jsx`, `src/modules/inventory/components/ImplantConsignmentWorkspace.jsx`, `src/modules/inventory/components/ProcurementSupplierWorkspace.jsx`, `src/modules/inventory/components/InventoryValuationReportsWorkspace.jsx`

#### Detail Perbaikan:
* **`[IA FULL COMPLIANCE]` Penuntasan 100% 48 Sub-Modul Pohon Arsitektur Informasi Inventaris:**
  1. **Expiry & FEFO Control Workspace (`ExpiryManagementWorkspace.jsx`):** Penanganan khusus *Expiry Management, Expired Stock, FEFO Priority Dispatch Engine, & Pemusnahan Stok ED*.
  2. **Quarantine & Recall Reverse Traceability Workspace (`QuarantineRecallWorkspace.jsx`):** Penanganan khusus *Quarantine, Damaged Stock, Batch Recall, & Reverse Traceability* (Menjawab: "Di mana batch ini sekarang?" & "Pasien siapa yang pernah menggunakannya?").
  3. **Surgical & Implant Consignment Workspace (`ImplantConsignmentWorkspace.jsx`):** Penanganan *Surgical Inventory, Implant Inventory, UDI Barcode Tracking, Consignment Stock Supplier, & Penautan ke Prosedur OK/Pasien*.
  4. **Procurement & Supplier Integration Workspace (`ProcurementSupplierWorkspace.jsx`):** Penanganan *Supplier Master Vendor, Purchase Requisition, Purchase Order (PO), Goods Receiving, Quality Control (QC), & Auto-Replenishment*.
  5. **Valuasi HPP & Audit Trail Workspace (`InventoryValuationReportsWorkspace.jsx`):** Penanganan *Inventory Costing (FIFO/Moving Average), Valuasi Persediaan IDR, Laporan Logistik Export, & Immutable Audit Trail System*.
  6. **Integrasi Navigasi Rapat Terpusat:** Menghubungkan seluruh 48 nodus IA ke dalam bilah navigasi terintegrasi di `/inventory`.

---

### 🟢 [09 AGUSTUS 2026] — Central Enterprise Hospital Inventory Management Engine (NurseFlow HIS 2026)

**Kategori:** `[MAJOR]` `[FEATURE]` `[ARCHITECTURE]` `[SUPPLY-CHAIN]` `[UI/UX]`  
**Status:** Completed & Verified via Build  
**Komponen Terdampak:** `src/modules/inventory/pages/EnterpriseInventoryPage.jsx`, `src/modules/inventory/components/CentralInventoryDashboard.jsx`, `src/modules/inventory/components/ItemMasterWorkspace.jsx`, `src/modules/inventory/components/WarehouseLocationWorkspace.jsx`

#### Detail Perbaikan:
* **`[CENTRAL INVENTORY ENGINE]` Arsitektur & Dashboard Pengelolaan Persediaan Medis & Logistik Terpusat:**
  1. **Pengembangan Central Inventory Dashboard Operasional (`CentralInventoryDashboard.jsx`):** Menampilkan 12 KPI Card Interaktif (Total Item Master, Total Stok Fisik, Valuasi Aset HPP IDR, Low Stock Warning, Out of Stock, Near Expiry & FEFO Control, Expired, Stock Quarantine, Damaged Stock, Pending Material Requests, In Transit Mutations, dan Opname Adjustments).
  2. **Pengembangan Enterprise Item Master Workspace (`ItemMasterWorkspace.jsx`):** Lembar katalog master persediaan medis, BMHP, alkes, implan, reagen lab, linen, dan logistik umum dilengkapi filter SKU/Barcode, parameter Min/Max/Reorder Point, konversi satuan (UOM), kontrol expiry/FEFO, dan modal penambahan item.
  3. **Pengembangan Hirarki Gudang & Lokasi Fisik (`WarehouseLocationWorkspace.jsx`):** Pemetaan hirarki gudang fisik rumah sakit (`Hospital` ➔ `Warehouse` ➔ `Storage Area` ➔ `Rack` ➔ `Shelf` ➔ `Bin`) dengan pemantauan suhu/kelembaban area dan peta lokasi bin fisik.
  4. **Penyelarasan Visual Identity Ocean Teal:** Mengadopsi bahasa desain **Ocean Teal NurseFlow** (Professional, Clinical, Clean, Premium Enterprise) pada 10 sub-modul navigasi terpusat di `/inventory`.

---

### 🟢 [09 AGUSTUS 2026] — Comprehensive JCI Clinical Form Audit & 100% Form Handler Guarantee

**Kategori:** `[AUDIT]` `[FEATURE]` `[COMPLIANCE]`  
**Status:** Completed & Verified via Build  
**Komponen Terdampak:** `src/modules/emr/pages/InpatientEMR.jsx`, `src/modules/emr/pages/OutpatientEMR.jsx`

#### Detail Perbaikan:
* **`[AUDIT & INTEGRATION]` Garansi 100% Kelengkapan & Pengaksesan Form Medis JCI:**
  * Melakukan audit mendalam terhadap seluruh 27+ formulir spesialis klinis pada modul **Rawat Jalan (`OutpatientEMR.jsx`)** dan **Rawat Inap (`InpatientEMR.jsx`)**.
  * Menautkan komponen form handler lengkap pada `InpatientEMR.jsx` untuk modul-modul spesifik: `SafetyDashboard` (EWS & Morse Fall Risk), `PatientCarePanel` (Tim PPA), `SurgicalSafetyChecklistForm` (WHO Bedah), `AldreteScoreForm` (PACU), `ICUDischargeCriteriaForm` (Keluar ICU), `DigitalInformedConsent`, dan `PatientEducationForm`.
  * Memastikan **0% unhandled module fallback**, sehingga setiap tombol modul klinis di sidebar langsung membuka formulir medis interaktif yang sesuai standar JCI & Permenkes RI.

---

### 🟢 [09 AGUSTUS 2026] — UI Density & Design Scale Refactoring of Outpatient EMR (Matching Inpatient Crisp Aesthetics)

**Kategori:** `[ENHANCEMENT]` `[UI/UX]` `[DESIGN-SYSTEM]`  
**Status:** Completed & Verified via Build  
**Komponen Terdampak:** `src/modules/emr/pages/OutpatientEMR.jsx`

#### Detail Perbaikan:
* **`[UI DENSITY REFACTORING]` Penyelarasan Skala Visual & Tipografi Rawat Jalan ke Standar Rawat Inap:**
  1. **Eradikasi Elemen Oversized (Anti Zoomed-In):** Menghapus layout `min-h-[76px]`, font raksasa `text-xl`, serta ikon latar belakang raksasa `size={100}` ber-opacity rendah yang membuat tampilan Rawat Jalan terlihat membengkak/ter-zoom pada tangkapan layar.
  2. **Penerapan Grid 4-Kartu Presisi (Matching Inpatient):** Mengubah tampilan `renderDashboardOverview` di [OutpatientEMR.jsx](file:///c:/Users/Mojo/NurseFlow-WebApp/src/modules/emr/pages/OutpatientEMR.jsx#L235) menggunakan sistem *Compact 4-Card Overview Grid* yang rapat, krisp, dan berestetika tinggi (Vitals & Live NEWS2 Indicator, Tim Asuhan PPA Poli, Safety Flags, dan Quick Command Action Hub).
  3. **Standardisasi Tipografi Header & Context Ribbon:** Menyelaraskan ukuran font header, badge `RAWAT JALAN (OUTPATIENT)`, nama pasien (`text-lg font-black`), serta tombol peluncur **Side Inspector 👁️** agar identik secara visual dengan modul Rawat Inap.

---

### 🟢 [09 AGUSTUS 2026] — Complete Unification & Standardization of Outpatient & Inpatient Clinical Dashboards

**Kategori:** `[MAJOR]` `[FEATURE]` `[ARCHITECTURE]` `[UI/UX]`  
**Status:** Completed & Verified via Build  
**Komponen Terdampak:** `src/modules/emr/pages/InpatientEMR.jsx`, `src/modules/emr/pages/OutpatientEMR.jsx`, `src/modules/emr/components/PatientDetailDrawerModal.jsx`

#### Detail Perbaikan:
* **`[ARCHITECTURAL UNIFICATION]` Penggabungan Komponen & Fitur Unggulan Rajal & Ranap:**
  1. **Unified Enterprise Context Header**: Menyelaraskan top ribbon context di Rawat Jalan dan Rawat Inap, menggabungkan Avatar Pasien, Badges Alergi/Penjamin/JCI, Indikator Bangsal/Kamar/Bed/LOS, serta tombol peluncur **Side Inspector 👁️ (`PatientDetailDrawerModal`)** untuk 21 kategori data master pasien.
  2. **Unified 4-Card Dashboard Overview Grid**:
     * 🫀 *Card 1: Tanda Vital & Live NEWS2 Indicator* (BP, HR, Suhu, SpO2, & Kalkulasi Skor EWS NEWS2 Live Risk Badge).
     * 👨‍⚕️ *Card 2: DPJP & Tim Asuhan Multidisiplin (PPA)* (DPJP Utama, Perawat Shift, Apoteker Klinik, Dietisien).
     * 🛡️ *Card 3: Clinical Safety Flags & Risk Assessments* (Alergi Obat/Makanan, Skala Morse Fall Risk, Braden Pressure Ulcer Risk, Status Isolasi).
     * ⚡ *Card 4: Quick Command Action Hub* (Akses Cepat 1-Klik membuka Lembar Kerja SOAP Harian/Poli, CPOE Resep, Handover SBAR, Informed Consent, & Resume Pulang).
  3. **Unified Berkas Rekam Medis Sah & Terverifikasi**: Menyelaraskan kontainer rekam medis terverifikasi lengkap dengan bilah pencarian real-time, filter kategori modul, lisensi tanda tangan digital, modal preview dokumen (`previewRecord`), serta tombol pengaksesan formulir.

---

### 🟢 [09 AGUSTUS 2026] — Implementation of Verified Medical Records Section & Preview Modal in Inpatient EMR

**Kategori:** `[FIX]` `[FEATURE]` `[UI/UX]`  
**Status:** Completed & Verified via Build  
**Komponen Terdampak:** `src/modules/emr/pages/InpatientEMR.jsx`

#### Detail Perbaikan:
* **`[ROOT CAUSE FIX]` Penambahan Komponen "BERKAS REKAM MEDIS PASIEN TERISI & SAH" di Inpatient EMR:** Memperbaiki halaman [InpatientEMR.jsx](file:///c:/Users/Mojo/NurseFlow-WebApp/src/modules/emr/pages/InpatientEMR.jsx#L249) yang sebelumnya belum merender kontainer daftar berkas rekam medis di bawah kartu *Quick Overview Cards*.
* **`[FEATURE]` Fitur Pencarian, Filter Kategori, & Modal Preview Dokumen:** Menambahkan bilah pencarian real-time, dropdown filter kategori formulir, kartu ringkasan dokumen berlisensi digital, serta modal pratinjau dokumen terperinci (`previewRecord`) untuk melihat detail SOAP, TTV, Diagnosa, dan instruksi DPJP episode Rajal maupun Ranap secara lengkap.

---

### 🟢 [09 AGUSTUS 2026] — Chronological Patient Journey Integration (Rajal Awal ➔ SPRI Transfer ➔ Admisi Ranap)

**Kategori:** `[FEATURE]` `[ENHANCEMENT]` `[WORKFLOW]`  
**Status:** Completed & Verified via Build  
**Komponen Terdampak:** `src/core/demoData.js`, `src/modules/emr/services/emr.service.js`, `src/modules/admin/pages/DummyDataManagementPage.jsx`

#### Detail Perbaikan:
* **`[WORKFLOW REDESIGN]` Generasi Rantai Rekam Medis Kronologis Multisekuens:** Memperbarui generator [demoData.js](file:///c:/Users/Mojo/NurseFlow-WebApp/src/core/demoData.js#L190) untuk secara otomatis memproduksi **6-Fase Berkas Rekam Medis Berurutan** bagi setiap pasien:
  1. 📄 **Fase 1 (Poli Rajal Awal - 3 Hari Lalu):** `PENGKAJIAN AWAL MEDIS (RJ)` oleh DPJP Poli.
  2. 📝 **Fase 2 (Poli Rajal Awal - 3 Hari Lalu):** `SOAP NOTES (CPPT)` Konsultasi Poli.
  3. 📑 **Fase 3 (Admisi Transfer - 2 Hari Lalu):** `SURAT PERINTAH RAWAT INAP (SPRI / TRANSFER SBAR)` Rujukan Poli ke Bangsal.
  4. 🏢 **Fase 4 (Bangsal Ranap - 1 Hari Lalu):** `CATATAN ADMISI RAWAT INAP` Asesmen 24 Jam Bangsal.
  5. ✍️ **Fase 5 (Bangsal Ranap - Hari Ini):** `SOAP NOTES (CPPT HARIAN)` Visite DPJP & Asuhan Keperawatan.
  6. 💊 **Fase 6 (Bangsal Ranap - Hari Ini):** `ORDER RESEP / CPOE (MMU)` & eMAR Medikasi Bangsal.
* **`[BENEFIT]` Garansi Kontinuitas Rekam Medis:** Memastikan bahwa begitu user membuka EMR Rawat Inap di `/emr-ri`, riwayat awal pengkajian dan catatan SOAP dari Poliklinik/UGD sebelumnya **100% tampil secara utuh dan kronologis**.

---

### 🟢 [09 AGUSTUS 2026] — Fix WebApp Blank Screen Crash (ReferenceError Fix)

**Kategori:** `[FIX]` `[HOTFIX]`  
**Status:** Resolved & Verified via Production Build  
**Komponen Terdampak:** `src/core/demoData.js`

#### Detail Perbaikan:
* **`[ROOT CAUSE FIX]` Deklarasi Array `records`:** Mendeklarasikan `const records = []` pada fungsi generator `generate100Patients()` di [demoData.js](file:///c:/Users/Mojo/NurseFlow-WebApp/src/core/demoData.js#L85). Sebelumnya, variabel yang belum terdefinisi memicu `ReferenceError: records is not defined` saat pengaktifan aplikasi yang menghentikan eksekusi bundle React dan menyebabkan layar putih (*blank page*).
* **`[VERIFICATION]` Pengujian Build:** Verifikasi eksekusi via `npm run build` sukses 100% tanpa error kompilasi.

---

### 🟢 [09 AGUSTUS 2026] — Pre-Populated JCI EMR Medical Records Generation & Service Query Optimization

**Kategori:** `[FEATURE]` `[FIX]` `[ENHANCEMENT]`  
**Status:** Completed  
**Komponen Terdampak:** `src/core/demoData.js`, `src/modules/emr/services/emr.service.js`, `src/modules/admin/pages/DummyDataManagementPage.jsx`

#### Detail Perbaikan:
* **`[ROOT CAUSE FIX]` Generasi Rekam Medis Klinis Otomatis (`DEMO_RECORDS`):** Mengisi generator [demoData.js](file:///c:/Users/Mojo/NurseFlow-WebApp/src/core/demoData.js) dengan 300+ formulir rekam medis sah dan terverifikasi digital (Catatan CPPT/SOAP, Asesmen Awal AOP, Resep Obat MMU/CPOE) untuk 100 pasien demo sehingga daftar dokumen klinis di EMR Dashboard langsung terisi lengkap.
* **`[ENHANCEMENT]` Multi-Source Query Layer (`getPatientRecords`):** Mengoptimalkan fungsi [emr.service.js](file:///c:/Users/Mojo/NurseFlow-WebApp/src/modules/emr/services/emr.service.js#L288) untuk mengombinasikan dokumen Firestore `medical_records`, `localStorage` master cache, dan `DEMO_RECORDS` berdasar ID Pasien maupun No. RM dengan deduplikasi kunci aman.
* **`[FEATURE]` Seeder Rekam Medis Admin Generator:** Memperbarui [DummyDataManagementPage.jsx](file:///c:/Users/Mojo/NurseFlow-WebApp/src/modules/admin/pages/DummyDataManagementPage.jsx) agar proses injeksi data batch dan seeder dashboard secara otomatis menautkan `patientId` dan `mrn` ke koleksi Firestore `medical_records` dan `localStorage`.

---

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
