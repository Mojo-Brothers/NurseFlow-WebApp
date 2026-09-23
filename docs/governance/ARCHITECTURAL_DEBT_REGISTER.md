# NURSEFLOW ENTERPRISE HIS — ARCHITECTURAL DEBT REGISTER
**Status Dokumen:** `OFFICIAL RISK & TECHNICAL DEBT REGISTER`  
**Tanggal Audit:** 23 September 2026  
**Penilaian Risiko:** High-Reliability Hospital Standard (JCI / Permenkes 24/2022)  

---

## 1. REKAPITULASI REGISTER HUTANG ARSITEKTUR

```
Total Hutang Arsitektural Teridentifikasi: 10 Item
- 🚨 TINGKAT RISIKO CRITICAL: 4 Item (Dapat memicu kegagalan sistemik / pelanggaran keamanan & keselamatan)
- ⚠️ TINGKAT RISIKO HIGH:     4 Item (Menyebabkan hilangnya data / isolasi modul)
- 🟡 TINGKAT RISIKO MEDIUM:   2 Item (Inkonsistensi performa / redundansi DDL)
```

---

## 2. DETAIL DAFTAR HUTANG ARSITEKTURAL (DEBT ENTRIES)

### DEBT-01: Autentikasi Backend Bypass Password & Injeksi Token Keras (Hardcoded Token)
* **Domain:** `DOMAIN 2: PEOPLE, IDENTITY & SECURITY`
* **Status:** 🟡 **PARTIALLY RESOLVED — Authentication Root Repaired (23 September 2026)**
  - *Sub-Scope Breakdown:*
    * **Authentication Mock Identity:** ✅ **RESOLVED** (Password scrypt dengan salt acak 128-bit unik, mitigasi user enumeration dummy hash, rate limiter per-IP, account lockout atomic)
    * **Canonical Identity Propagation:** ✅ **VERIFIED** (`auth_users.staff_id` terikat ke `master_staff` dan klaim identitas diinjeksikan ke JWT oleh server)
    * **Authorization / RBAC:** ⏳ **PENDING VERIFICATION** (ALLOW/DENY terbukti pada 7 role minimum; otorisasi menyeluruh antar-modul masih dalam verifikasi bertahap)
    * **Digital Signature:** ⭕ **OPEN** (Penerapan tanda tangan digital X.509/sertifikat elektronik belum diimplementasikan pada tahap P0-1)
    * **Non-Repudiation (Anti-Sangkalan Hukum):** ⭕ **OPEN** (Keabsahan pembuktian hukum dokumen medis formal BSrE/UU ITE belum dapat diklaim)
* **Tingkat Risiko:** ⚠️ **MEDIUM (Tereduksi dari CRITICAL)**
* **Bukti Fisik Penyelesaian:**
  - Forward Migration 073 ([`database/migrations/073_reconcile_auth_credentials.sql`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/database/migrations/073_reconcile_auth_credentials.sql)) menetapkan indeks integritas, pencabutan `ROLE_SUPER_ADMIN` dari identitas klinis `dr.siti.wijaya`, dan pembuatan akun terisolasi `admin.dev`.
  - Implementasi [`server/services/auth.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/auth.service.js) & [`server/utils/passwordSecurity.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/utils/passwordSecurity.js) memverifikasi kredensial menggunakan scrypt dengan parameter standar ($N=16384, r=8, p=1$), salt acak 128-bit unik per user, dan dummy timing mitigation.
  - Refaktor [`server/routes/auth.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/auth.routes.js) memproteksi login dengan rate limiter per-IP (10/min) dan mengembalikan respons RFC 7807 (`application/problem+json`).
  - Uji otomatis lulus 100%: 17 tests pada [`tests/authDatabaseDurability.test.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/authDatabaseDurability.test.js), 7 tests pada [`tests/authHttpRoutes.test.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/authHttpRoutes.test.js), dan 14 tests pada [`tests/rbacEndpointVerification.test.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/rbacEndpointVerification.test.js).
* **Catatan Tata Kelola:** Penutupan celah bypass ini membangun fondasi otentikasi database dan propagasi identitas aktor canonical yang kokoh (*Database-backed authentication and canonical actor identity foundation has been implemented and verified*). Aspek tanda tangan digital dan non-repudiasi legal akan diselesaikan pada tahap berikutnya.

---

### DEBT-02: Defisit Kritis Foreign Key Constraint pada Basis Data PostgreSQL
* **Domain:** `DOMAIN 1, 4, 5, 7: RELATIONAL DATABASE FOUNDATION`
* **Tingkat Risiko:** 🚨 **CRITICAL**
* **Prioritas:** **P0 (Immediate)**
* **Bukti Fisik:**
  - Pemindaian 72 berkas migrasi di `database/migrations/`: Dari 211 tabel, **HANYA ADA 11 FOREIGN KEY CONSTRAINTS**.
  - Tabel utama `encounters` tidak memiliki foreign key ke `master_patients`.
  - Tabel `soap_notes` dan `clinical_orders` tidak memiliki foreign key ke `encounters`.
* **Dampak:**
  - Terjadinya data yatim (*orphan records*): Catatan rekam medis atau order CPOE dapat merujuk ke encounter/pasien yang sudah tidak ada.
  - Tidak ada jaminan konsistensi ACID referensial di tingkat basis data.
* **Akar Masalah:** Pengembang migrasi SQL membuat tabel secara modular dan terpisah tanpa mendefinisikan relasi `REFERENCES parent_table(id) ON DELETE RESTRICT`.
* **Solusi & Strategi Migrasi:**
  1. Buat migration baru (`068_enforce_relational_integrity.sql`).
  2. Tambahkan foreign key constraints secara bertahap (`ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... REFERENCES ... NOT VALID;` kemudian `VALIDATE CONSTRAINT`).
* **Dependensi:** Audit rekonsiliasi data yatim sebelum constraint divalidasi.

---

### DEBT-03: Ketiadaan Persistensi Transaksi Nyata pada Modul Kasir & Billing
* **Domain:** `DOMAIN 15: FINANCE & REVENUE CYCLE`
* **Tingkat Risiko:** 🚨 **CRITICAL**
* **Prioritas:** **P1 (Core Lifecycle)**
* **Bukti Fisik:**
  - Kueri fisik ke database PostgreSQL: Tabel `hospital_invoices`, `billing_ledgers`, `cashier_payment_transactions`, `cashier_shift_reconciliations`, `financial_adjustments_and_refunds` **SEMUANYA BERISI 0 BARIS (KOSONG)**.
  - Komponen [`src/modules/billing/pages/BillingPage.jsx`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/modules/billing/pages/BillingPage.jsx) melakukan penghitungan tarif di dalam state React tanpa pernah mengirimkan `POST /api/v1/billing/invoices` atau `POST /api/v1/patient-financial/payments` ke database.
* **Dampak:**
  - Rumah sakit tidak dapat melacak pendapatan riil, kas kasir, maupun piutang asuransi/BPJS.
  - Pasien yang dinyatakan pulang (*Discharged*) tidak meninggalkan jejak finansial di database.
* **Akar Masalah:** Modul billing hanya diselesaikan di lapisan presentasi (UI visual) tanpa menyambungkan event pelunasan ke service `patientFinancialAndRevenueCycle.service.js`.
* **Solusi & Strategi Migrasi:**
  1. Sambungkan form pembayaran kasir ke `apiClient.patientFinancial.generateSplitInvoice` dan `recordPayment`.
  2. Kunci status encounter menjadi `DISCHARGED` hanya jika billing invoice telah lunas (`SETTLED`) atau dijamin oleh penjamin resmi.
* **Dependensi:** DEBT-01 (Autentikasi Kasir) dan DEBT-02 (Relasi Encounter).

---

### DEBT-04: Penyimpanan Logistik Farmasi di LocalStorage & Otorisasi PIN Statis
* **Domain:** `DOMAIN 13: INVENTORY, LOGISTICS & SUPPLY CHAIN`
* **Tingkat Risiko:** 🚨 **CRITICAL**
* **Prioritas:** **P1 (Core Operational)**
* **Bukti Fisik:**
  - Berkas [`src/modules/inventory/components/MaterialRequestTab.jsx`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/modules/inventory/components/MaterialRequestTab.jsx#L230-L245):
    Daftar permintaan barang disimpan dan dimuat dari `localStorage.getItem('nurseflow_ro_list')`.
  - Berkas [`src/modules/inventory/components/MutasiBarangTab.jsx`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/modules/inventory/components/MutasiBarangTab.jsx#L295):
    Otorisasi tanda tangan elektronik diperiksa dengan string statis:
    `if (pin !== '123456' && pin !== '8888') ...`
* **Dampak:**
  - Data logistik obat terisolasi di browser individual petugas; gudang pusat tidak dapat melihat permintaan dari bangsal lain.
  - Pelanggaran keamanan: Siapapun dapat menyetujui mutasi obat dengan memasukkan PIN demo `123456`.
* **Akar Masalah:** Modul inventori dibangun menggunakan pola mockup offline client-side.
* **Solusi & Strategi Migrasi:**
  1. Hapus ketergantungan `localStorage['nurseflow_ro_list']`.
  2. Alihkan seluruh mutasi ke `POST /api/v1/inventory/transfer` dan `POST /api/v1/inventory/receive` yang menyimpan ke tabel `inventory_stock_movements`.
  3. Verifikasi PIN otorisasi ke tabel `staff_credentials` atau `clinical_staff_profiles`.
* **Dependensi:** DEBT-01 (Identitas Staf).

---

### DEBT-05: Penomoran Berkas Migrasi SQL Kembar (Duplicate Prefixes)
* **Domain:** `DATABASE MIGRATION ENGINE`
* **Tingkat Risiko:** ⚠️ **HIGH**
* **Prioritas:** **P0 (Structural)**
* **Bukti Fisik:**
  - Migrasi `031`, `032`, `033`, `034`, `035` memiliki dua berkas berbeda dengan awalan angka yang sama di `database/migrations/`.
  - Pada lingkungan CI/CD atau server Linux, urutan eksekusi antar berkas kembar ini tidak deterministik (bergantung pada urutan file system sorting).
* **Dampak:** Risiko kegagalan eksekusi migrasi pada instalasi server baru jika migrasi yang bergantung dieksekusi lebih awal dari tabel induknya.
* **Akar Masalah:** Kurangnya mekanisme penguncian nomor migrasi saat menggabungkan pull request paralel.
* **Solusi & Strategi Migrasi:**
  1. Renumbering berkas migrasi secara sekuensial (031a/031b atau 031-072 berurutan rapi).
* **Dependensi:** Tidak ada.

---

### DEBT-06: Duplikasi Pernyataan DDL Tabel (Redundant Table Definitions)
* **Domain:** `DATABASE DDL`
* **Tingkat Risiko:** ⚠️ **HIGH**
* **Prioritas:** **P1**
* **Bukti Fisik:**
  - 11 tabel didefinisikan 2 kali di berkas migrasi berbeda: `master_beds`, `master_rooms`, `master_wards`, `master_buildings`, `master_floors`, `master_medications`, `patient_allergies`, `operating_theatres`, `anesthesia_records`, `radiology_orders`, `master_inacbg_tariffs`.
* **Dampak:** Kebingungan skema referensi. Fitur baru pada migrasi kedua diabaikan oleh PostgreSQL karena klausa `IF NOT EXISTS`.
* **Akar Masalah:** Kurangnya katalog master tabel terpusat sebelum membuat migrasi baru.
* **Solusi & Strategi Migrasi:** Konsolidasi DDL menjadi berkas migrasi perbaikan yang mengeksekusi `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` untuk menyelaraskan kolom yang tertinggal.
* **Dependensi:** DEBT-05.

---

### DEBT-07: Hardcoded Demo Identifiers pada 15+ Formulir Klinis
* **Domain:** `DOMAIN 5 & 6: EMR & MEDICAL FORMS`
* **Tingkat Risiko:** ⚠️ **HIGH**
* **Prioritas:** **P1**
* **Bukti Fisik:**
  - Komponen `InitialAssessment.jsx`, `MEOWSForm.jsx`, `PEWSForm.jsx`, `SepsisSOFACriteriaForm.jsx`, `SurgicalSafetyChecklistForm.jsx`, dll.:
    ```javascript
    const isDewi = patient?.id === 'demo-patient-dewi' || patient?.mrn === '009944';
    patientId: patient?.id || 'demo-patient-dewi',
    encounterId: encounter?.id || 'ENC-DEMO-MOCK',
    ```
* **Dampak:** Formulir klinis mengasumsikan nama pasien dummy jika prop pasien tidak diteruskan secara sempurna, berisiko mencemari rekam medis pasien lain dengan data dummy.
* **Akar Masalah:** Form dibangun untuk lolos skenario demo presentasi tanpa validasi konteks klinis yang ketat (*fail-closed*).
* **Solusi & Strategi Migrasi:**
  1. Bungkus seluruh formulir klinis dengan `ClinicalContextGate.jsx`.
  2. Tolak rendering formulir (*fail-closed error boundary*) jika `patientId` atau `encounterId` tidak terdefinisi secara valid.
  3. Hapus seluruh pengecekan `isDewi` dan `'ENC-DEMO-MOCK'`.
* **Dependensi:** Integrasi `ClinicalContextProvider`.

---

### DEBT-08: Ketergantungan Pengujian Terhadap In-Memory Mocks (Simulation Illusion)
* **Domain:** `DOMAIN 16: QUALITY ASSURANCE & TESTING`
* **Tingkat Risiko:** ⚠️ **HIGH**
* **Prioritas:** **P2**
* **Bukti Fisik:**
  - Berkas `tests/verticalSlice01PatientDurability.test.js`, `tests/verticalSlice06AUniversalCpoeDurability.test.js`, dll.:
    Menggunakan `mockDatabaseState = { ... }` dan `mockClient = { query: vi.fn(...) }`.
* **Dampak:** Pengujian lulus 100% di terminal CI, tetapi tidak memberikan jaminan bahwa query SQL tersebut valid atau kompatibel dengan PostgreSQL 16 aktual.
* **Akar Masalah:** Upaya mempercepat durasi test di lingkungan tanpa instalasi PostgreSQL lokal.
* **Solusi & Strategi Migrasi:** Tambahkan test suite integrasi fisik yang dijalankan langsung terhadap instance PostgreSQL aktual (menggunakan database test khusus `nurseflow_test`).
* **Dependensi:** Lingkungan CI dengan database service container.

---

### DEBT-09: Ketiadaan Generic Medical Form Engine
* **Domain:** `DOMAIN 6: MEDICAL FORM ARCHITECTURE`
* **Tingkat Risiko:** 🟡 **MEDIUM**
* **Prioritas:** **P2**
* **Bukti Fisik:** Setiap formulir medis (Triase, SOAP, Asesmen Awal, Partograf, Anestesi, Kematian) dibuat sebagai berkas komponen React statis yang terpisah tanpa tabel penyimpanan skema di database (`form_templates`, `form_instances`, `form_amendments`).
* **Dampak:** Sulit menambah atau mengubah formulir asesmen medis baru sesuai regulasi Kemenkes tanpa melakukan rilis kode frontend ulang.
* **Akar Masalah:** Pendekatan *hardcoded components* versus *dynamic form engine*.
* **Solusi & Strategi Migrasi:** Bangun arsitektur Medical Form Engine berbasis JSON Schema yang mendukung versioning, tanda tangan digital, dan amandemen legal.
* **Dependensi:** DEBT-07.

---

### DEBT-10: Ketidaksesuaian Resolusi Hostname PostgreSQL pada Windows
* **Domain:** `DATABASE INFRASTRUCTURE`
* **Tingkat Risiko:** 🟡 **MEDIUM**
* **Prioritas:** **P0**
* **Bukti Fisik:** Berkas `server/db/postgresPool.js` menggunakan default `POSTGRES_HOST=localhost`. Pada Windows 11, Node.js mencoba menyambung ke `::1` (IPv6) yang menghasilkan `Connection timeout`.
* **Dampak:** Server Express dan skrip Node gagal tersambung ke PostgreSQL saat dijalankan secara lokal di mesin pengembang Windows.
* **Solusi & Strategi Migrasi:** Tetapkan default `POSTGRES_HOST=127.0.0.1` pada `.env.local` dan `server/db/postgresPool.js`.
* **Dependensi:** Tidak ada.
