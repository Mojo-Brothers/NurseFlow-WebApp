# P0-2B — WAVE 1B.2 TECHNICAL DECISION ANALYSIS
## Factual, Comparative Decision-Support Analysis Across Candidates A, B, C1, C2, and D

---

## 1. PURPOSE

Dokumen ini menyajikan **Analisis Teknis Komparatif Otoritatif** (*Comparative Technical Decision Analysis*) terhadap lima kandidat domain Wave 1B.2:
- **Candidate A:** Queue / Appointments
- **Candidate B:** Medication Closed-Loop
- **Candidate C1:** CPOE Orders & Safety
- **Candidate C2:** Diagnostics
- **Candidate D:** Master Patient / Admission

`[FACT]` **Mandat dan Batasan Tugas:**
- Analisis ini disusun semata-mata sebagai instrumen pendukung keputusan (*decision-support artifact*) bagi **Human Owner**.
- Dokumen ini **TIDAK MEMILIH** kandidat mana pun (`Candidate selected: NOT SELECTED`).
- Dokumen ini **TIDAK MEREKOMENDASIKAN**, membuat peringkat (*ranking*), memberi skor (*scoring*), menentukan pemenang (*winner/loser*), atau memberikan arahan bersyarat (*conditional guidance* seperti *"Jika fokus pada X maka pilih Y"*).
- Status implementasi tetap tidak berubah: **`WAVE 1B.2 IMPLEMENTATION = NOT STARTED`**.
- Status keamanan operasional tetap membeku: **`STAGE 0: NO-GO | PRODUCTION: BLOCKED`**.

---

## 2. EVIDENCE BASELINE

`[FACT]` Baseline evidensi teknis dikunci secara deterministik berdasarkan artefak dan riwayat Git repositori:

| Parameter Baseline | Nilai Otoritatif Aktual | Status Verifikasi | Sumber Bukti |
|---|---|:---:|---|
| **Base Evidence Commit** | `4efa9362d0e7bce28f541cfdee04caf0308dcdbb` | `[FACT]` VERIFIED | `git rev-parse HEAD~3` |
| **Audited Readiness Review Commit** | `9680fc99226f13f671b20b8409a62cbfac014cc3` | `[FACT]` VERIFIED | `git rev-parse HEAD~2` |
| **Audit Integrity Review Commit** | `e3d7b0abe6719fe270cafd61c62b5bc813ec1d46` | `[FACT]` VERIFIED | `git rev-parse HEAD~1` |
| **Evidence Baseline Freeze Commit** | `a9fba667ce51010741c18da7b201d696a47ba09a` | `[FACT]` VERIFIED | `git rev-parse HEAD` |
| **Active Branch** | `feature/security-foundation-wave1a10` | `[FACT]` VERIFIED | `git branch --show-current` |
| **Working Tree Status** | Clean (0 baris modifikasi pada production/test/migration) | `[FACT]` VERIFIED | `git status --short` |
| **Production Code Changes** | **0 baris** | `[FACT]` VERIFIED | `git diff 4efa9362..HEAD -- server/ src/` |
| **Migration & Schema Changes** | **0 baris** | `[FACT]` VERIFIED | `git diff 4efa9362..HEAD -- database/` |
| **Test Suite Changes** | **0 baris** | `[FACT]` VERIFIED | `git diff 4efa9362..HEAD -- tests/` |
| **Changelog Changes** | **0 baris** | `[FACT]` VERIFIED | `git diff a9fba667..HEAD -- docs/CHANGELOG_PERUBAHAN_HIS.md` |
| **Canonical Regression Baseline** | **81/81 PASS (100% Clean, 8.33s)** | `[FACT]` VERIFIED | Vitest Runner (6 test files) |

`[FACT]` Rincian eksekusi suite pengujian regresi kanonik (81/81 PASS):
1. `tests/p02b_wave1b1_real_rls_integration.test.js`: 10 passed
2. `tests/triageVerticalSlice.test.js`: 6 passed
3. `tests/p02b_wave1b1_triage_uow.test.js`: 39 passed
4. `tests/verticalSlice04TriageDurability.test.js`: 8 passed
5. `tests/p02b_wave1b1_l1_controller_gate.test.js`: 15 passed
6. `tests/triageEngine.test.js`: 3 passed

---

## 3. DECISION CONSTRAINTS

Untuk menjamin objektivitas audit tanpa bias interpretasi, dokumen ini menerapkan batasan keputusan ketat:

1. **Aturan Netralitas Absolut:** Dilarang menggunakan istilah superlatif (*best, preferred, optimal, safest, easiest*) atau komparatif hierarkis ($A > B$, $A < B$, pemenang, urutan peringkat). Seluruh kandidat disajikan dalam bentuk data profil teknis mandiri.
2. **Ketiadaan Arahan Kondisional:** Dilarang menyajikan pola pengambilan keputusan berbasis prioritas subyektif (seperti *"Jika memprioritaskan A maka pilih B"*).
3. **Pelabelan Bukti Eksplisit:** Setiap poin informasi wajib dilabeli dengan kategori epistemik:
   - `[FACT]`: Fakta empiris yang dibuktikan langsung dari baris kode sumber, skema SQL, berkas konfigurasi, atau log runner.
   - `[DERIVED]`: Angka atau kesimpulan kuantitatif hasil perhitungan statis / traversal graf kode.
   - `[TECHNICAL IMPLICATION]`: Konsekuensi teknis mekanis dari keberadaan arsitektur saat ini terhadap sistem.
   - `[UNKNOWN]`: Aspek operasional atau konkurensi yang belum dapat dibuktikan tanpa eksekusi langsung.
   - `[IMPLEMENTATION PREREQUISITE]`: Pekerjaan teknis yang wajib diselesaikan jika kandidat terkait dipilih.
4. **Status Cacat CS 82:** Cacat pada CS 82 (`server/services/diagnosticInterpretation.service.js:528`) dicatat sebagai `VERIFIED CURRENT DEFECT / Implementation prerequisite for Candidate C2` dan **TIDAK DIPERBAIKI** dalam dokumen ini.

---

## 4. CANDIDATE A DOSSIER — QUEUE / APPOINTMENTS

### A. Lingkup & Batasan Fungsional
- `[FACT]` **Lingkup Bisnis:** Manajemen antrean poliklinik rawat jalan, reservasi jadwal dokter, validasi kuota antrean BPJS, dan pembatalan janji temu.
- `[FACT]` **Komponen Berkas:** `server/controllers/appointment.controller.js`, `server/routes/appointment.routes.js`.
- `[FACT]` **Abstraksi Service:** **TIDAK ADA**. Modul ini tidak memiliki berkas service terpisah (`appointment.service.js`); seluruh kueri database dan transaksi dieksekusi langsung di dalam berkas kontroler.

### B. Permukaan Stage-0 & Keterjangkauan HTTP
- `[FACT]` **Stage-0 Call Sites:** **3 Call Sites** (seluruhnya beroperasi pada tabel Stage-0 `master_patients`):
  1. `CS 1` (`server/controllers/appointment.controller.js:39`): `READ` pada `master_patients` via `LEFT JOIN master_patients p ON p.id = a.patient_id` dalam fungsi `getAppointments`. Status: `HTTP_REACHABLE` melalui `GET /api/v1/appointments`.
  2. `CS 2` (`server/controllers/appointment.controller.js:115`): `WRITE / LOCK` pada `master_patients` via `SELECT id FROM master_patients WHERE tenant_id = $1 AND (nik = $2 OR bpjs_card_number = $3) LIMIT 1 FOR UPDATE;` dalam fungsi `book`. Status: `HTTP_REACHABLE` melalui `POST /api/v1/appointments/book`.
  3. `CS 3` (`server/controllers/appointment.controller.js:123`): `WRITE / INSERT` pada `master_patients` via auto-provisioning pasien baru saat pemesanan janji temu. Status: `HTTP_REACHABLE` melalui `POST /api/v1/appointments/book`.
- `[DERIVED]` **Rute HTTP Express:** **4 total rute**:
  - **Active Stage-0 Routes:** **2 rute** (`GET /api/v1/appointments`, `POST /api/v1/appointments/book`).
  - **Zero Stage-0 Routes:** **2 rute** (`POST /api/v1/appointments/check-in`, `POST /api/v1/appointments/cancel` hanya mengakses tabel `appointments` dan `queue_sequences` non-Stage-0).

### C. Keamanan Gerbang Kontroler (Ingress)
- `[FACT]` **Pengecekan `req.tenantId`:** **TIDAK ADA**. Kontroler tidak mengekstrak atau memverifikasi `req.tenantId`.
- `[FACT]` **Validasi UUID:** **TIDAK ADA**.
- `[FACT]` **Fallback Default Tenant:** **ADA**. `server/controllers/appointment.controller.js:12, 66` mendefinisikan konstanta hardcoded:
  ```javascript
  const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
  ```
  yang digunakan sebagai fallback jika tenant konteks tidak disediakan oleh request.
- `[FACT]` **Status Gerbang Kontroler:** **FAIL-OPEN**. Request tanpa header autentikasi atau identitas tenant tetap diproses menggunakan UUID tenant default.

### D. Arsitektur Transaksi & Konkurensi
- `[FACT]` **Titik Masuk Transaksi:** Fungsi `book` (`appointment.controller.js:91-170`).
- `[FACT]` **Kepemilikan Koneksi:** Membuka koneksi langsung melalui `const client = await pool.connect();` dan memanggil `await client.query('BEGIN');`, `COMMIT`, serta `ROLLBACK` secara manual di dalam blok `try/catch`.
- `[FACT]` **Penguncian Baris (`FOR UPDATE`):**
  - Kunci slot jadwal dokter pada `appointments` (baris 135).
  - Kunci idempotensi pada `appointments` (baris 96).
  - Kunci pasien pada `master_patients` (baris 115).
- `[FACT]` **Transaksi Lintas-Layanan:** **TIDAK ADA**.

### E. Kopling Datastore & Ketergantungan
- `[FACT]` **Tabel Stage-0 Terlibat:** `master_patients` (1 tabel).
- `[FACT]` **Tabel Non-Stage-0 Terlibat:** `appointments`, `queue_sequences`, `idempotency_keys`.
- `[DERIVED]` **Total Interaksi Basis Data Modul:** **33 interaksi** (12 Writes, 21 Reads).
- `[FACT]` **Tabel Bersama dengan Kandidat Lain:** `master_patients` (dipakai bersama dengan Candidate D).
- `[FACT]` **Shared Call Sites:** 0.

### F. Kematangan Pengujian & Kesenjangan Real PostgreSQL
- `[FACT]` **Suite Pengujian Eksisting:** **2 test suite** (`tests/appointmentQueue.test.js`, `tests/appointmentQueuePersistence.test.js`).
- `[FACT]` **Tipe Pengujian Eksisting:** Berbasis mock in-memory / stub database.
- `[FACT]` **Cakupan Real PostgreSQL RLS:** **0% (TIDAK ADA)**. Belum ada pengujian yang memverifikasi isolasi baris `master_patients` atau penolakan lintas-tenant di PostgreSQL aktual.

### G. Cacat & Prasyarat Implementasi
- `[FACT]` **Cacat Terverifikasi:**
  1. `A-PRE-1`: Fallback `DEFAULT_TENANT_ID` hardcoded (`appointment.controller.js:12, 66`) melanggar prinsip multi-tenant fail-closed.
  2. `A-PRE-2`: Ketiadaan lapisan service (*missing service abstraction*) menyebabkan logika bisnis dan DML database bercampur di level controller.
- `[IMPLEMENTATION PREREQUISITE]` Jika Candidate A dipilih:
  1. Pasang gerbang L1 `isValidUuid` fail-closed pada seluruh rute kontroler.
  2. Hapus total konstanta `DEFAULT_TENANT_ID`.
  3. Bungkus CS 1, CS 2, CS 3 ke dalam batas `withUnitOfWork`.
  4. Bangun suite pengujian Real PostgreSQL RLS untuk alur antrean dan reservasi pasien.

### H. Unknowns & Hal yang Memerlukan Verifikasi
- `[UNKNOWN]` Dampak terhadap klien API eksternal (misal: mesin kios antrean mandiri) apabila fallback `DEFAULT_TENANT_ID` dicabut dan mewajibkan token JWT bertenant valid.
- `[UNKNOWN]` Karakteristik penanganan timeout pada *slot mutex lock* dokter di bawah beban konkurensi tinggi pada connection pool PostgreSQL produksi.

---

## 5. CANDIDATE B DOSSIER — MEDICATION CLOSED-LOOP

### B. Lingkup & Batasan Fungsional
- `[FACT]` **Lingkup Bisnis:** Siklus tertutup pengelolaan obat rawat inap: peresepan obat, verifikasi farmasi, alokasi batch inventaris, verifikasi 5-Benar di tempat tidur (*bedside 5-rights verification* dengan dual-nurse barcode scan), pencatatan administrasi eMAR, dan pelaporan reaksi obat tidak diinginkan (*adverse drug reactions*).
- `[FACT]` **Komponen Berkas:** `server/controllers/medicationClosedLoop.controller.js`, `server/services/medicationClosedLoop.service.js`, `server/routes/medicationClosedLoop.routes.js`.

### B. Permukaan Stage-0 & Keterjangkauan HTTP
- `[FACT]` **Stage-0 Call Sites:** **13 Call Sites** (5 Writes, 8 Reads):
  - `CS 91-96, 100, 101`: 8 kueri `READ` pada `clinical_orders`, `medication_dispense_allocations`, dan `medication_emar_administrations`.
  - `CS 97-99, 102, 103`: 5 mutasi `WRITE` pada `clinical_orders` (update status), `medication_dispense_allocations` (alokasi batch), `medication_emar_administrations` (pencatatan eMAR), dan `universal_audit_logs`.
- `[DERIVED]` **Rute HTTP Express:** **8 total rute**:
  - **Active Stage-0 Routes:** **3 rute** (`POST /api/v1/medications/prescribe`, `POST /api/v1/medications/:id/administer`, `POST /api/v1/medications/administrations/:id/adverse-reaction`).
  - **Zero Stage-0 Routes:** **5 rute** (`GET /active`, `GET /history`, `GET /administrations/:id`, `GET /orders/:id/administrations`, `GET /summary` hanya membaca tabel `medication_orders` non-Stage-0 atau in-memory mock).

### C. Keamanan Gerbang Kontroler (Ingress)
- `[FACT]` **Pengecekan `req.tenantId`:** **TIDAK ADA**.
- `[FACT]` **Validasi UUID:** **TIDAK ADA**.
- `[FACT]` **Fallback Mock Actor:** **ADA**. `medicationClosedLoop.controller.js:20-24, 69-73` menggunakan fallback identitas mock:
  ```javascript
  const doctorId = req.user?.id || 'USR-DOC-001';
  const nurseId = req.user?.id || 'USR-NURSE-01';
  const pharmacistId = req.user?.id || 'USR-PHARM-01';
  ```
  tanpa mewajibkan atau memvalidasi parameter `tenantId`.
- `[FACT]` **Status Gerbang Kontroler:** **FAIL-OPEN**.

### D. Arsitektur Transaksi & Konkurensi
- `[FACT]` **Titik Masuk Transaksi:**
  - `verifyBedsideAndAdminister` (`medicationClosedLoop.service.js:823`).
  - `documentAdverseReaction` (`medicationClosedLoop.service.js:1022`).
  - `generateMedicationOrdersFromCPOE` (`medicationClosedLoop.service.js:461`).
- `[FACT]` **Kepemilikan Koneksi:** Membuka koneksi pool independen (`pool.connect()`) di level service.
- `[FACT]` **Penguncian Baris (`FOR UPDATE`):**
  - Kunci order pada `clinical_orders` (baris 99).
  - Kunci catatan administrasi pada `medication_emar_administrations` (baris 1312).
- `[FACT]` **Transaksi Lintas-Layanan:** **TIDAK ADA**. Logika multi-tabel berada dalam service yang sama.

### E. Kopling Datastore & Ketergantungan
- `[FACT]` **Tabel Stage-0 Terlibat:** **4 tabel** (`clinical_orders`, `medication_dispense_allocations`, `medication_emar_administrations`, `universal_audit_logs`).
- `[FACT]` **Tabel Non-Stage-0 Terlibat:** `pharmacy_inventory_batches`, `medication_orders`, `patient_allergies`.
- `[DERIVED]` **Total Interaksi Basis Data Modul:** **80 interaksi** (23 Writes, 57 Reads).
- `[FACT]` **Tabel Bersama dengan Kandidat Lain:**
  - `clinical_orders` (dipakai bersama dengan C1 dan C2).
  - `universal_audit_logs` (dipakai bersama dengan C1, C2, dan D).
- `[FACT]` **Ketergantungan Foreign Key Khusus:** Menggunakan constraint FK komposit (`Migration 078: FOREIGN KEY (encounter_id, tenant_id) REFERENCES encounters(id, tenant_id)` dan `FOREIGN KEY (patient_id, tenant_id) REFERENCES master_patients(id, tenant_id)`).

### F. Kematangan Pengujian & Kesenjangan Real PostgreSQL
- `[FACT]` **Suite Pengujian Eksisting:** **8 test suite** (`tests/verticalSlice03MedicationSafetyDurability.test.js`, dll.).
- `[FACT]` **Tipe Pengujian Eksisting:** Berbasis mock in-memory.
- `[FACT]` **Cakupan Real PostgreSQL RLS:** **0% (TIDAK ADA)**. Belum ada pengujian yang memverifikasi eksekusi verifikasi obat di bawah RLS nyata.

### G. Cacat & Prasyarat Implementasi
- `[FACT]` **Cacat Terverifikasi:**
  1. `B-PRE-1`: Fallback identitas mock tanpa validasi konteks tenant pada kontroler.
- `[IMPLEMENTATION PREREQUISITE]` Jika Candidate B dipilih:
  1. Pasang gerbang L1 `isValidUuid` fail-closed pada seluruh 8 endpoint kontroler.
  2. Bungkus 13 Stage-0 Call Sites ke dalam transaksi `withUnitOfWork`.
  3. Verifikasi kompatibilitas constraint FK komposit (Migration 078) terhadap sesi RLS tenant.
  4. Bangun suite pengujian Real PostgreSQL RLS untuk alur verifikasi dual-nurse dan mutasi eMAR multi-tabel.

### H. Unknowns & Hal yang Memerlukan Verifikasi
- `[UNKNOWN]` Potensi urutan penguncian (*locking order*) yang dapat memicu deadlock antara verifikasi bedside barcode scanner dan alokasi stok batch farmasi pada lingkungan multi-user.
- `[UNKNOWN]` Interaksi antara kebijakan RLS default-deny dengan constraint FK komposit multi-kolom saat baris induk baru saja dibuat pada transaksi paralel.

---

## 6. CANDIDATE C1 DOSSIER — CPOE ORDERS & SAFETY

### A. Lingkup & Batasan Fungsional
- `[FACT]` **Lingkup Bisnis:** Entri instruksi medis dokter (*Computerized Physician Order Entry*), validasi kontraindikasi/alergi, alur otorisasi pembatalan order dua orang (*two-person cancellation dual control*), penerbitan token keamanan SHA-256, dan audit pembatalan pesanan klinis.
- `[FACT]` **Komponen Berkas:** `server/controllers/cpoe.controller.js`, `server/services/cpoeApplication.service.js`, `server/services/safetyAuthorization.service.js`, `server/routes/cpoe.routes.js`.

### B. Permukaan Stage-0 & Keterjangkauan HTTP
- `[FACT]` **Stage-0 Call Sites:** **16 Call Sites** (4 Writes, 12 Reads):
  - `CS 59-71`: 13 Call Sites pada `cpoeApplication.service.js` (kueri baca order, kunci `FOR UPDATE` pembatalan order, dan audit logging).
  - `CS 143-145`: 3 Call Sites pada `safetyAuthorization.service.js` (kunci `FOR UPDATE` token, verifikasi hash SHA-256, dan pembaruan status `CONSUMED` pada tabel Stage-0 `safety_decision_registry`).
- `[DERIVED]` **Rute HTTP Express:** **9 total rute**:
  - **Active Stage-0 Routes:** **6 rute** (`POST /api/v1/orders/cpoe`, `POST /api/v1/orders/cpoe/:id/cancel`, `GET /api/v1/orders/cpoe`, `GET /api/v1/orders/cpoe/:id`, `GET /api/v1/orders/cpoe/encounter/:encounterId`, `GET /api/v1/orders`).
  - **Zero Stage-0 Routes:** **3 rute** (`POST /prescription`, `/lab`, `/radiology` mendelegasikan pemrosesan ke modul in-memory `ordersApiService`).
- `[FACT]` **Shared Call Site CS 71 (`cpoeApplication.service.js:608`):**
  Fungsi `listOrders` dieksekusi oleh 2 rute Express terpisah:
  1. `GET /api/v1/orders/cpoe`
  2. `GET /api/v1/orders` (rute backward-compatibility)

### C. Keamanan Gerbang Kontroler (Ingress)
- `[FACT]` **Pengecekan `req.tenantId`:** **TIDAK ADA**.
- `[FACT]` **Validasi UUID:** **TIDAK ADA**.
- `[FACT]` **Fallback Mock Actor:** **ADA**. Kontroler menggunakan `req.user?.id || 'USR-DOC-001'` tanpa memverifikasi tenant ID.
- `[FACT]` **Status Gerbang Kontroler:** **FAIL-OPEN**.

### D. Arsitektur Transaksi & Konkurensi
- `[FACT]` **Titik Masuk Transaksi:**
  - `createOrder` (`cpoeApplication.service.js:128`): Menggunakan modul lawas `transactionManager.withTransaction`.
  - `cancelOrder` (`cpoeApplication.service.js:391`): Membuka transaksi lokal dan **meneruskan objek `client` database melintasi batas modul** ke `safetyAuthorizationService.verifyAndConsumeTransactional(client, ...)` (baris 401).
- `[FACT]` **Kepemilikan Koneksi:** Berbagi objek `pgClient` antar-layanan (*cross-service client sharing*) di dalam satu transaksi terpadu.
- `[FACT]` **Penguncian Baris (`FOR UPDATE`):**
  - Kunci encounter pada `encounters` (baris 151).
  - Kunci order pada `clinical_orders` (baris 393).
  - Kunci token keamanan pada `safety_decision_registry` (baris 192).
- `[FACT]` **Transaksi Lintas-Layanan:** **YA (TERBUKTI)**.

### E. Kopling Datastore & Ketergantungan
- `[FACT]` **Tabel Stage-0 Terlibat:** **3 tabel** (`clinical_orders`, `universal_audit_logs`, `safety_decision_registry`).
- `[FACT]` **Tabel Non-Stage-0 Terlibat:** `cpoe_order_items`, `cpoe_alerts`.
- `[DERIVED]` **Total Interaksi Basis Data Modul:** **25 interaksi** (6 Writes, 19 Reads).
- `[FACT]` **Tabel Bersama dengan Kandidat Lain:** `clinical_orders` (dengan B dan C2), `universal_audit_logs` (dengan B, C2, dan D).

### F. Kematangan Pengujian & Kesenjangan Real PostgreSQL
- `[FACT]` **Suite Pengujian Eksisting:** **3 test suite** (`tests/verticalSlice06AUniversalCpoeDurability.test.js`, dll.).
- `[FACT]` **Tipe Pengujian Eksisting:** Berbasis mock in-memory.
- `[FACT]` **Cakupan Real PostgreSQL RLS:** **0% (TIDAK ADA)**.

### G. Cacat & Prasyarat Implementasi
- `[FACT]` **Cacat Terverifikasi:**
  1. `C1-PRE-1`: Fallback identitas mock tanpa validasi tenant pada kontroler.
  2. `C1-PRE-2`: Ketergantungan pada modul legacy `transactionManager.js` yang tidak terintegrasi dengan Unit of Work kanonik.
- `[IMPLEMENTATION PREREQUISITE]` Jika Candidate C1 dipilih:
  1. Pasang gerbang L1 `isValidUuid` fail-closed pada 6 rute aktif kontroler.
  2. Gantikan `transactionManager.withTransaction` dengan `withUnitOfWork`.
  3. Pastikan `safetyAuthorization.service.js` (CS 143-145) mewarisi konteks `withUnitOfWork` dari caller tanpa membuka koneksi baru.
  4. Amankan shared call site CS 71 pada kedua rute (`/orders/cpoe` dan `/orders`).
  5. Bangun suite pengujian Real PostgreSQL RLS untuk penerbitan order, verifikasi hash SHA-256, dan konsumsi token pembatalan.

### H. Unknowns & Hal yang Memerlukan Verifikasi
- `[UNKNOWN]` Respon mekanisme verifikasi hash SHA-256 token jika terdapat perbedaan serialisasi JSON payload antara environment runtime Node.js dan database.
- `[UNKNOWN]` Dampak drift jam sistem (*clock skew*) antara server aplikasi dan database PostgreSQL terhadap evaluasi masa berlaku token keamanan (`expires_at`).

---

## 7. CANDIDATE C2 DOSSIER — DIAGNOSTICS

### A. Lingkup & Batasan Fungsional
- `[FACT]` **Lingkup Bisnis:** Penerbitan notifikasi hasil kritis laboratorium/radiologi, pencatatan interpretasi dokter spesialis penunjang, eksekusi protokol komunikasi kritis TBAK (*Tulis-Baca-Konfirmasi*), dan penerbitan instruksi klinis sekunder (*secondary clinical orders*).
- `[FACT]` **Komponen Berkas:** `server/controllers/diagnosticInterpretation.controller.js`, `server/services/diagnosticInterpretation.service.js`, `server/routes/diagnosticInterpretation.routes.js`.

### B. Permukaan Stage-0 & Keterjangkauan HTTP
- `[FACT]` **Stage-0 Call Sites:** **11 Call Sites** (3 Writes, 8 Reads):
  - `CS 72-75`: 4 kueri `READ` dengan kunci `FOR UPDATE` pada `encounters`.
  - `CS 76-77`: 2 mutasi `WRITE` pada `universal_audit_logs`.
  - `CS 78-81`: 4 kueri `READ` dengan kunci `FOR UPDATE` pada `physician_diagnostic_interpretations`.
  - `CS 82`: 1 mutasi `WRITE` (`INSERT INTO clinical_orders`).
- `[DERIVED]` **Rute HTTP Express:** **4 total rute**:
  - **Active Stage-0 Routes:** **3 rute** (`POST /api/v1/diagnostics/notifications`, `POST /api/v1/diagnostics/notifications/:id/interpret`, `POST /api/v1/diagnostics/interpretations/:id/actions`).
  - **Zero Stage-0 Routes:** **1 rute** (`POST /api/v1/diagnostics/notifications/:id/acknowledge` hanya memanipulasi tabel `diagnostic_result_notifications` non-Stage-0).

### C. Keamanan Gerbang Kontroler (Ingress)
- `[FACT]` **Pengecekan `req.tenantId`:** **TIDAK ADA**.
- `[FACT]` **Validasi UUID:** **TIDAK ADA**.
- `[FACT]` **Fallback Mock Actor:** **ADA**. Kontroler menggunakan fallback `USR-LAB-01` tanpa membaca header tenant.
- `[FACT]` **Status Gerbang Kontroler:** **FAIL-OPEN**.

### D. Arsitektur Transaksi & Konkurensi
- `[FACT]` **Titik Masuk Transaksi:**
  - `publishDiagnosticNotification` (`diagnosticInterpretation.service.js:86`).
  - `executeSecondaryClinicalAction` (`diagnosticInterpretation.service.js:508`).
- `[FACT]` **Kepemilikan Koneksi:** Membuka koneksi pool mandiri (`pool.connect()`) di level service.
- `[FACT]` **Penguncian Baris (`FOR UPDATE`):**
  - Kunci encounter pada `encounters` (baris 89).
  - Kunci interpretasi pada `physician_diagnostic_interpretations` (baris 510).
- `[FACT]` **Transaksi Lintas-Layanan:** **TIDAK ADA**.

### E. Kopling Datastore & Ketergantungan
- `[FACT]` **Tabel Stage-0 Terlibat:** **4 tabel** (`encounters`, `physician_diagnostic_interpretations`, `clinical_orders`, `universal_audit_logs`).
- `[FACT]` **Tabel Non-Stage-0 Terlibat:** `diagnostic_result_notifications`, `cpoe_order_items`.
- `[DERIVED]` **Total Interaksi Basis Data Modul:** **38 interaksi** (9 Writes, 29 Reads).
- `[FACT]` **Tabel Bersama dengan Kandidat Lain:** `clinical_orders` (dengan B dan C1), `universal_audit_logs` (dengan B, C1, dan D), `encounters` (dengan C1 dan fondasi triase).

### F. Kematangan Pengujian & Kesenjangan Real PostgreSQL
- `[FACT]` **Suite Pengujian Eksisting:** **1 test suite** (`tests/verticalSlice09DiagnosticInterpretationDurability.test.js`).
- `[FACT]` **Tipe Pengujian Eksisting:** Berbasis mock in-memory.
- `[FACT]` **Cakupan Real PostgreSQL RLS:** **0% (TIDAK ADA)**.

### G. Cacat & Prasyarat Implementasi (Khusus CS 82)
- `[FACT]` **Cacat Terverifikasi CS 82:**
  - **Lokasi Kode:** `server/services/diagnosticInterpretation.service.js:528-534`.
  - **Isi Pernyataan SQL:**
    ```sql
    INSERT INTO clinical_orders (
      id, encounter_id, patient_id, order_number,
      order_type, order_status, priority, ordering_doctor_id,
      ordering_doctor_name, ordering_doctor_role, notes,
      correlation_id, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
    ```
  - **Analisis Kegagalan DML:** Kolom `tenant_id` tidak disertakan dalam query. Berdasarkan skema otoritatif (`database/migrations/009_tenant_identity_foundation.sql:88-90`), kolom `clinical_orders.tenant_id` berstatus `NOT NULL` tanpa nilai `DEFAULT`. Tidak ada trigger `BEFORE INSERT` yang mengisinya.
  - **Status:** **`VERIFIED CURRENT DEFECT / Implementation prerequisite for Candidate C2`**. Operasi ini pasti gagal pada PostgreSQL nyata.
- `[IMPLEMENTATION PREREQUISITE]` Jika Candidate C2 dipilih:
  1. Perbaiki CS 82 dengan menambahkan kolom dan parameter `tenant_id` pada query insert `clinical_orders`.
  2. Pasang gerbang L1 `isValidUuid` fail-closed pada 3 rute aktif kontroler.
  3. Bungkus 11 Stage-0 Call Sites ke dalam transaksi `withUnitOfWork`.
  4. Bangun suite pengujian Real PostgreSQL RLS untuk alur nilai kritis dan verifikasi eksekusi order sekunder.

### H. Unknowns & Hal yang Memerlukan Verifikasi
- `[UNKNOWN]` Apakah fungsi `executeSecondaryClinicalAction` pernah berhasil dijalankan di lingkungan produksi PostgreSQL tanpa memicu constraint violation.
- `[UNKNOWN]` Perilaku siklus hidup notifikasi diagnostik apabila encounter pasien telah ditutup (*discharged*) sebelum dokter memberikan interpretasi.

---

## 8. CANDIDATE D DOSSIER — MASTER PATIENT / ADMISSION

### A. Lingkup & Batasan Fungsional
- `[FACT]` **Lingkup Bisnis:** Master Patient Index (MPI), pendaftaran pasien baru rawat jalan/inap/IGD, verifikasi keunikan identitas nasional (NIK) dan asuransi sosial (BPJS), serta pembangkitan nomor rekam medis (*Medical Record Number / MRN*) sekuensial tahunan.
- `[FACT]` **Komponen Berkas:** `server/controllers/patient.controller.js`, `server/services/patientApplication.service.js`, `server/routes/patients.routes.js`.

### B. Permukaan Stage-0 & Keterjangkauan HTTP
- `[FACT]` **Stage-0 Call Sites:** **10 Call Sites** (3 Writes/Locks, 7 Reads):
  - `CS 104-106`: Inisialisasi pool dan transaksi (`registerPatient`).
  - `CS 107` (L99): Row lock `SELECT ... FROM master_patients WHERE nik = $1 LIMIT 1 FOR UPDATE;`.
  - `CS 108` (L114): Row lock `SELECT ... FROM master_patients WHERE bpjs_card_number = $1 LIMIT 1 FOR UPDATE;`.
  - `CS 109-111`: 3 kueri `READ` pencarian pasien (`searchPatients`).
  - `CS 112-113`: 2 kueri `READ` detail pasien (`getPatientById`).
  - `L170`: Mutasi `WRITE` (`INSERT INTO master_patients (...) RETURNING *;`).
- `[DERIVED]` **Rute HTTP Express:** **3 total rute**:
  - **Active Stage-0 Routes:** **3 rute (100% aktif)** (`GET /api/v1/patients`, `GET /api/v1/patients/:id`, `POST /api/v1/patients`).
  - **Zero Stage-0 Routes:** **0 rute**.

### C. Keamanan Gerbang Kontroler (Ingress)
- `[FACT]` **Pengecekan `req.tenantId`:** **TIDAK ADA**.
- `[FACT]` **Validasi UUID:** **TIDAK ADA**.
- `[FACT]` **Pengabaian Tenant pada Read:** Kontroler `patient.controller.js:24, 62` sama sekali tidak meneruskan parameter `tenantId` ke method service `searchPatients` dan `getPatientById`.
- `[FACT]` **Fallback Mock Actor pada Create:** Baris 103-107 menggunakan fallback `USR-REG-001` tanpa validasi tenant.
- `[FACT]` **Status Gerbang Kontroler:** **FAIL-OPEN**.

### D. Arsitektur Transaksi & Konkurensi
- `[FACT]` **Titik Masuk Transaksi:** `registerPatient` (`patientApplication.service.js:96-200`).
- `[FACT]` **Kepemilikan Koneksi:** Membuka koneksi pool mandiri (`pool.connect()`) di dalam service.
- `[FACT]` **Penguncian Baris (`FOR UPDATE`):**
  - Kunci NIK pada `master_patients` (baris 100).
  - Kunci nomor kartu BPJS pada `master_patients` (baris 115).
  - Kunci sekuensial nomor rekam medis tahunan:
    ```sql
    SELECT mrn FROM master_patients WHERE mrn LIKE $1 ORDER BY mrn DESC LIMIT 1 FOR UPDATE;
    ```
    dalam fungsi `generateNextMrn(client)` (baris 35).
- `[FACT]` **Transaksi Lintas-Layanan:** **TIDAK ADA**.

### E. Kopling Datastore & Ketergantungan Relasional Global
- `[FACT]` **Tabel Stage-0 Terlibat:** `master_patients` (1 tabel).
- `[FACT]` **Tabel Non-Stage-0 Terlibat:** 0 (secara langsung di dalam modul).
- `[DERIVED]` **Total Interaksi Basis Data Modul:** **15 interaksi** (1 Write, 14 Reads/Locks).
- `[FACT]` **Ketergantungan Foreign Key Global (Central Parent Hub):**
  Traversal skema DDL di seluruh 65 berkas migrasi SQL membuktikan:
  - **65 foreign key constraints** dari **65 tabel unik** merujuk langsung ke kolom `master_patients(id)`.
  - **Aturan ON DELETE:** 42 tabel `RESTRICT`, 23 tabel `NO ACTION (DEFAULT)`, 0 tabel `CASCADE`.
  - Tabel `master_patients` adalah entitas induk akar (*root parent entity*) dari seluruh relasi data klinis pasien.

### F. Kematangan Pengujian & Kesenjangan Real PostgreSQL
- `[FACT]` **Suite Pengujian Eksisting:** **11 test suite** (`tests/verticalSlice01PatientDurability.test.js`, dll.).
- `[FACT]` **Tipe Pengujian Eksisting:** Berbasis mock in-memory.
- `[FACT]` **Cakupan Real PostgreSQL RLS:** **0% (TIDAK ADA)**.

### G. Cacat & Prasyarat Implementasi
- `[FACT]` **Cacat Terverifikasi:**
  1. `D-PRE-1`: Kontroler sepenuhnya mengabaikan tenant pada pencarian dan detail pasien; menggunakan fallback mock actor pada pendaftaran.
  2. `D-PRE-2`: Kueri pengecekan NIK/BPJS dan penyisipan data pasien tidak menyertakan klausul `tenant_id` secara eksplisit.
- `[IMPLEMENTATION PREREQUISITE]` Jika Candidate D dipilih:
  1. Pasang gerbang L1 `isValidUuid` fail-closed pada seluruh 3 rute kontroler.
  2. Teruskan parameter `tenantId` dari kontroler ke seluruh method service.
  3. Sertakan kolom `tenant_id` secara eksplisit pada kueri insert `master_patients` dan `universal_audit_logs`.
  4. Isolasi kueri penguncian generator MRN tahunan di bawah batasan tenant RLS.
  5. Bungkus 10 Stage-0 Call Sites ke dalam `withUnitOfWork`.
  6. Bangun suite pengujian Real PostgreSQL RLS untuk alur MPI, pendaftaran, dan deteksi duplikasi.

### H. Unknowns & Hal yang Memerlukan Verifikasi
- `[UNKNOWN]` Apakah batasan unik (*unique constraint*) NIK dan BPJS pada model bisnis rumah sakit dimaksudkan berlaku unik secara global (*cross-tenant*) atau unik per tenant rumah sakit.
- `[UNKNOWN]` Tingkat kontensi konkurensi pada generator nomor rekam medis tahunan (`generateNextMrn`) saat terjadi lonjakan pendaftaran pasien serentak pada pagi hari.

---

## 9. CROSS-CANDIDATE COMPARISON MATRIX

Tabel komparatif berikut menyajikan perbandingan faktual lintas-kandidat tanpa kolom peringkat (*rank*), skor (*score*), prioritas (*priority*), ataupun penentuan pemenang (*winner/loser*):

| Dimensi Evaluasi | Candidate A<br>(Queue / Appt) | Candidate B<br>(Medication) | Candidate C1<br>(CPOE Orders) | Candidate C2<br>(Diagnostics) | Candidate D<br>(Master Patient) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Stage-0 Unsafe Call Sites** | 3 (`[FACT]`) | 13 (`[FACT]`) | 16 (`[FACT]`) | 11 (`[FACT]`) | 10 (`[FACT]`) |
| **Total Express Routes** | 4 (`[FACT]`) | 8 (`[FACT]`) | 9 (`[FACT]`) | 4 (`[FACT]`) | 3 (`[FACT]`) |
| **Active Stage-0 Routes** | 2 (`[DERIVED]`) | 3 (`[DERIVED]`) | 6 (`[DERIVED]`) | 3 (`[DERIVED]`) | 3 (100%) (`[DERIVED]`) |
| **Zero Stage-0 Routes** | 2 (`[DERIVED]`) | 5 (`[DERIVED]`) | 3 (`[DERIVED]`) | 1 (`[DERIVED]`) | 0 (`[DERIVED]`) |
| **Stage-0 Tables Touched** | 1 (`master_patients`) | 4 (`clinical_orders`, dispense, eMAR, audit) | 3 (`clinical_orders`, audit, safety) | 4 (`encounters`, interpret, orders, audit) | 1 (`master_patients`) |
| **DML Writes pada Stage-0** | 2 (`[FACT]`) | 5 (`[FACT]`) | 4 (`[FACT]`) | 3 (`[FACT]`) | 3 (`[FACT]`) |
| **Kueri Reads pada Stage-0** | 1 (`[FACT]`) | 8 (`[FACT]`) | 12 (`[FACT]`) | 8 (`[FACT]`) | 7 (`[FACT]`) |
| **Total Interaksi DB Modul** | 33 (12W / 21R) | 80 (23W / 57R) | 25 (6W / 19R) | 38 (9W / 29R) | 15 (1W / 14R) |
| **Status Gerbang L1 Saat Ini** | FAIL-OPEN (`[FACT]`) | FAIL-OPEN (`[FACT]`) | FAIL-OPEN (`[FACT]`) | FAIL-OPEN (`[FACT]`) | FAIL-OPEN (`[FACT]`) |
| **Mekanisme Fallback Saat Ini** | `DEFAULT_TENANT_ID` hardcoded | Fallback Mock Actor | Fallback Mock Actor | Fallback Mock Actor | Fallback Actor / Omit Param |
| **Kebutuhan Lapisan Service** | Perlu dibuat / refactor | Sudah ada berkas service | Sudah ada berkas service | Sudah ada berkas service | Sudah ada berkas service |
| **Penggunaan Legacy Tx Mgr** | Tidak (`[FACT]`) | Tidak (`[FACT]`) | Ya (`transactionManager.js`) | Tidak (`[FACT]`) | Tidak (`[FACT]`) |
| **Transaksi Lintas-Layanan** | Tidak (`[FACT]`) | Tidak (`[FACT]`) | Ya (oper `client` ke Safety) | Tidak (`[FACT]`) | Tidak (`[FACT]`) |
| **Shared Call Sites** | 0 (`[FACT]`) | 0 (`[FACT]`) | 1 (CS 71 pada 2 rute) | 0 (`[FACT]`) | 0 (`[FACT]`) |
| **Mutasi Tabel Bersama** | `master_patients` (dengan D) | `clinical_orders` (dengan C1, C2) | `clinical_orders` (dengan B, C2) | `clinical_orders` (dengan B, C1) | `master_patients` (dengan A) |
| **Relational In-Degree FK Hub** | Rendah (Child) | Sedang (Child & Parent) | Sedang (Child & Parent) | Sedang (Child & Parent) | **Tinggi (65 Child Tables)** |
| **Suite Pengujian Eksisting** | 2 mock suites | 8 mock suites | 3 mock suites | 1 mock suite | 11 mock suites |
| **Pengujian Real PG RLS Eksisting** | 0 (`[FACT]`) | 0 (`[FACT]`) | 0 (`[FACT]`) | 0 (`[FACT]`) | 0 (`[FACT]`) |
| **Cacat SQL DML Terverifikasi** | Tidak ada cacat sintaks | Tidak ada cacat sintaks | Tidak ada cacat sintaks | **CS 82 (omisi `tenant_id`)** | Tidak ada cacat sintaks |
| **Prasyarat Utama Remediasi** | Hapus fallback default tenant | Validasi alokasi inventaris & eMAR | Transisi dari legacy tx manager | Perbaiki query DML CS 82 | Isolasi kueri kunci MRN tahunan |

---

## 10. CRITICAL PATH INVENTORY

Inventaris jalur kritis merinci pekerjaan teknis konkret yang wajib diselesaikan agar masing-masing kandidat dapat dinyatakan tuntas (*completed*):

### Candidate A — Queue / Appointments
- **Required security gate:** Pasang validasi `isValidUuid` fail-closed pada fungsi `getAppointments` dan `book` di `server/controllers/appointment.controller.js` yang menolak request tanpa UUID tenant valid dengan HTTP 403 `TENANT_CONTEXT_REQUIRED`. Hapus konstanta `DEFAULT_TENANT_ID`.
- **Required UoW migration:** Bungkus interaksi database kontroler (CS 1, CS 2, CS 3) ke dalam callback `withUnitOfWork`.
- **Required database work:** Tidak ada modifikasi skema DDL (kebijakan RLS pada `master_patients` telah aktif).
- **Required transaction work:** Migrasikan transaksi lokal `book` (`pool.connect()`, `BEGIN`, `COMMIT`, `ROLLBACK`) agar berjalan sepenuhnya di bawah kontrol `withUnitOfWork`.
- **Required regression tests:** Jalankan 81/81 pengujian regresi kanonik; perbarui 2 test suite mock antrean.
- **Required real PostgreSQL tests:** Bangun suite pengujian Real PostgreSQL RLS untuk membuktikan isolasi data pasien saat reservasi antrean dan penolakan akses lintas-tenant.
- **Known prerequisite defects:** Fallback hardcoded `DEFAULT_TENANT_ID` pada `appointment.controller.js:12, 66`.
- **Completion evidence required:** 100% dari 3 Stage-0 CS dieksekusi di bawah `withUnitOfWork`; 0 panggilan unsafe tersisa; suite real PostgreSQL RLS lulus; canonical regression 81/81 lulus.

### Candidate B — Medication Closed-Loop
- **Required security gate:** Pasang validasi `isValidUuid` fail-closed pada seluruh 8 rute di `server/controllers/medicationClosedLoop.controller.js`; hapus fallback mock actor `USR-DOC-001` dan `USR-PHARM-01`.
- **Required UoW migration:** Bungkus seluruh 13 Stage-0 Call Sites di `server/services/medicationClosedLoop.service.js` ke dalam `withUnitOfWork`.
- **Required database work:** Verifikasi keselarasan constraint FK komposit (Migration 078) terhadap sesi GUC RLS tenant aktif.
- **Required transaction work:** Refaktor transaksi multi-tabel pada `verifyBedsideAndAdminister`, `documentAdverseReaction`, dan `generateMedicationOrdersFromCPOE` ke dalam `withUnitOfWork`.
- **Required regression tests:** Jalankan 81/81 pengujian regresi kanonik; perbarui 8 test suite mock pengobatan.
- **Required real PostgreSQL tests:** Bangun suite pengujian Real PostgreSQL RLS untuk alur verifikasi dual-nurse di tempat tidur dan mutasi eMAR.
- **Known prerequisite defects:** Fallback mock actor tanpa validasi konteks tenant pada kontroler.
- **Completion evidence required:** 100% dari 13 Stage-0 CS dieksekusi di bawah `withUnitOfWork`; 0 panggilan unsafe tersisa; suite real PostgreSQL RLS lulus; canonical regression 81/81 lulus.

### Candidate C1 — CPOE Orders & Safety
- **Required security gate:** Pasang validasi `isValidUuid` fail-closed pada 6 rute aktif di `server/controllers/cpoe.controller.js`; hapus fallback mock actor `USR-DOC-001`.
- **Required UoW migration:** Gantikan modul lawas `transactionManager.withTransaction` dengan `withUnitOfWork` di `server/services/cpoeApplication.service.js`. Propagasikan konteks UoW ke `server/services/safetyAuthorization.service.js` (CS 143-145).
- **Required database work:** Tidak ada modifikasi skema DDL.
- **Required transaction work:** Pertahankan pewarisan koneksi/klien transaksional antara `cpoeApplicationService.cancelOrder` dan `safetyAuthorizationService.verifyAndConsumeTransactional` di bawah satu batasan `withUnitOfWork`; amankan shared call site CS 71.
- **Required regression tests:** Jalankan 81/81 pengujian regresi kanonik; perbarui 3 test suite mock CPOE.
- **Required real PostgreSQL tests:** Bangun suite pengujian Real PostgreSQL RLS untuk pembuatan order medis dan alur verifikasi token pembatalan dua orang.
- **Known prerequisite defects:** Ketergantungan pada `transactionManager.js` legacy; fallback mock actor pada kontroler.
- **Completion evidence required:** 100% dari 16 Stage-0 CS (CS 59-71, CS 143-145) dieksekusi di bawah `withUnitOfWork`; CS 71 terisolasi aman pada kedua rute; suite real PostgreSQL RLS lulus; canonical regression 81/81 lulus.

### Candidate C2 — Diagnostics
- **Required security gate:** Pasang validasi `isValidUuid` fail-closed pada 3 rute aktif di `server/controllers/diagnosticInterpretation.controller.js`; hapus fallback mock actor `USR-LAB-01`.
- **Required UoW migration:** Bungkus seluruh 11 Stage-0 Call Sites di `server/services/diagnosticInterpretation.service.js` ke dalam `withUnitOfWork`.
- **Required database work:** **Perbaiki cacat DML CS 82** pada baris 528-534 dengan menyertakan kolom dan parameter `tenant_id` pada query `INSERT INTO clinical_orders`.
- **Required transaction work:** Migrasikan transaksi `publishDiagnosticNotification` dan `executeSecondaryClinicalAction` ke dalam `withUnitOfWork`.
- **Required regression tests:** Jalankan 81/81 pengujian regresi kanonik; perbarui test suite mock diagnostik.
- **Required real PostgreSQL tests:** Bangun suite pengujian Real PostgreSQL RLS untuk notifikasi nilai kritis dan eksekusi order sekunder (membuktikan fix CS 82 pada PostgreSQL nyata).
- **Known prerequisite defects:** CS 82 omisi kolom `tenant_id` pada insert `clinical_orders`; fallback mock actor pada kontroler.
- **Completion evidence required:** Cacat CS 82 diperbaiki dan diverifikasi lolos batasan NOT NULL PostgreSQL; 100% dari 11 Stage-0 CS dieksekusi di bawah `withUnitOfWork`; suite real PostgreSQL RLS lulus; canonical regression 81/81 lulus.

### Candidate D — Master Patient / Admission
- **Required security gate:** Pasang validasi `isValidUuid` fail-closed pada seluruh 3 rute di `server/controllers/patient.controller.js`; hapus fallback mock actor `USR-REG-001`.
- **Required UoW migration:** Teruskan parameter `tenantId` dari kontroler ke method `searchPatients`, `getPatientById`, dan `registerPatient`; bungkus 10 Stage-0 Call Sites di `server/services/patientApplication.service.js` ke dalam `withUnitOfWork`.
- **Required database work:** Sertakan kolom `tenant_id` secara eksplisit pada query dan parameter insert `master_patients`; sertakan filter tenant pada kueri row lock NIK dan BPJS.
- **Required transaction work:** Migrasikan transaksi `registerPatient` ke dalam `withUnitOfWork`; isolasi kueri penguncian sekuensial nomor rekam medis tahunan (`generateNextMrn`) ke dalam lingkup tenant terkait.
- **Required regression tests:** Jalankan 81/81 pengujian regresi kanonik; perbarui 11 test suite mock pasien.
- **Required real PostgreSQL tests:** Bangun suite pengujian Real PostgreSQL RLS untuk membuktikan isolasi pencarian MPI, registrasi pasien, dan penomoran MRN sekuensial antar-tenant.
- **Known prerequisite defects:** Kontroler mengabaikan `tenantId` pada pencarian; kueri DML pasien tidak menyertakan kolom tenant eksplisit.
- **Completion evidence required:** 100% dari 10 Stage-0 CS dieksekusi di bawah `withUnitOfWork`; seluruh operasi `master_patients` terlindung RLS fail-closed; suite real PostgreSQL RLS lulus; canonical regression 81/81 lulus.

---

## 11. DEFINITION OF DONE PER CANDIDATE

Kriteria penyelesaian faktual (*Definition of Done*) berbasis baseline arsitektur untuk setiap kandidat:

### Definition of Done — Candidate A
1. Seluruh 3 Stage-0 Call Sites (CS 1, CS 2, CS 3) beroperasi 100% di dalam batasan `withUnitOfWork` dengan GUC `app.current_tenant_id` tersetel.
2. Kontroler `appointment.controller.js` menolak request tanpa UUID tenant valid dengan HTTP 403 `TENANT_CONTEXT_REQUIRED`.
3. Fallback `DEFAULT_TENANT_ID` terhapus sepenuhnya dari kode sumber.
4. Pengujian integrasi Real PostgreSQL RLS lulus pembuktian isolasi tenant dan penolakan tulis lintas-tenant.
5. Suite pengujian regresi kanonik tetap lulus 81/81 tanpa kegagalan.
6. Nol unsafe Stage-0 call site tersisa pada domain appointment.
7. Rantai bukti rute $\rightarrow$ kontroler $\rightarrow$ basis data diperbarui pada dokumentasi audit.

### Definition of Done — Candidate B
1. Seluruh 13 Stage-0 Call Sites (CS 91-103) beroperasi 100% di dalam batasan `withUnitOfWork` dengan GUC `app.current_tenant_id` tersetel.
2. Kontroler `medicationClosedLoop.controller.js` menerapkan gerbang L1 fail-closed pada seluruh 8 rute.
3. Fallback mock actor (`USR-DOC-001`, `USR-PHARM-01`) tanpa validasi tenant terhapus sepenuhnya.
4. Integritas constraint FK komposit (Migration 078) terbukti valid di bawah transaksi RLS PostgreSQL riil.
5. Pengujian integrasi Real PostgreSQL RLS lulus pembuktian alur dual-nurse bedside administration dan pelaporan adverse reaction.
6. Suite pengujian regresi kanonik tetap lulus 81/81 tanpa kegagalan.
7. Nol unsafe Stage-0 call site tersisa pada domain medication.

### Definition of Done — Candidate C1
1. Seluruh 16 Stage-0 Call Sites (CS 59-71, CS 143-145) beroperasi 100% di dalam batasan `withUnitOfWork` dengan GUC `app.current_tenant_id` tersetel.
2. Kontroler `cpoe.controller.js` menerapkan gerbang L1 fail-closed pada seluruh 6 rute aktif.
3. Ketergantungan pada modul lawas `transactionManager.js` dihilangkan dan digantikan secara penuh oleh `withUnitOfWork`.
4. Pewarisan konteks transaksi lintas-layanan ke `safetyAuthorizationService` terbukti berjalan aman di bawah satu Unit of Work.
5. Shared call site CS 71 terbukti aman dan terisolasi pada kedua rute (`/orders/cpoe` dan `/orders`).
6. Pengujian integrasi Real PostgreSQL RLS lulus pembuktian siklus order CPOE dan konsumsi token pembatalan.
7. Suite pengujian regresi kanonik tetap lulus 81/81 tanpa kegagalan.
8. Nol unsafe Stage-0 call site tersisa pada domain CPOE.

### Definition of Done — Candidate C2
1. Cacat CS 82 terbukti diperbaiki dengan penyertaan kolom dan parameter `tenant_id` pada `INSERT INTO clinical_orders`.
2. Seluruh 11 Stage-0 Call Sites (CS 72-82) beroperasi 100% di dalam batasan `withUnitOfWork` dengan GUC `app.current_tenant_id` tersetel.
3. Kontroler `diagnosticInterpretation.controller.js` menerapkan gerbang L1 fail-closed pada seluruh 3 rute aktif.
4. Pengujian integrasi Real PostgreSQL RLS lulus pembuktian penerbitan nilai kritis dan eksekusi order sekunder terhadap skema PostgreSQL riil.
5. Suite pengujian regresi kanonik tetap lulus 81/81 tanpa kegagalan.
6. Nol unsafe Stage-0 call site tersisa pada domain diagnostics.

### Definition of Done — Candidate D
1. Seluruh 10 Stage-0 Call Sites (CS 104-113, L170) beroperasi 100% di dalam batasan `withUnitOfWork` dengan GUC `app.current_tenant_id` tersetel.
2. Kontroler `patient.controller.js` menerapkan gerbang L1 fail-closed pada seluruh 3 rute HTTP.
3. Parameter `tenantId` diteruskan secara konsisten ke method `searchPatients`, `getPatientById`, dan `registerPatient`.
4. Kolom `tenant_id` disertakan secara eksplisit pada kueri dan parameter insert `master_patients`.
5. Kueri penguncian generator MRN tahunan terbukti terisolasi secara mandiri per tenant.
6. Pengujian integrasi Real PostgreSQL RLS lulus pembuktian isolasi data MPI, registrasi pasien, dan deteksi duplikasi.
7. Suite pengujian regresi kanonik tetap lulus 81/81 tanpa kegagalan.
8. Nol unsafe Stage-0 call site tersisa pada domain master patient.

---

## 12. KNOWN VS UNKNOWN

Klasifikasi aspek teknis yang sudah terbukti (*Known*), belum terbukti (*Unknown*), dan memerlukan verifikasi saat implementasi (*Needs Verification During Implementation*):

### Candidate A — Queue / Appointments
- **KNOWN (`[FACT]`):**
  - Memiliki tepat 3 Stage-0 Call Sites pada tabel `master_patients`.
  - Memiliki 4 rute Express, di mana 2 rute aktif Stage-0 dan 2 rute zero Stage-0.
  - Memiliki fallback hardcoded `DEFAULT_TENANT_ID`.
  - Seluruh logika transaksi berada langsung di kontroler tanpa abstraksi service.
- **UNKNOWN (`[UNKNOWN]`):**
  - Apakah ada klien eksternal integrasi (seperti mesin kiosk antrean RS) yang saat ini bergantung pada fallback `DEFAULT_TENANT_ID` tanpa menyertakan autentikasi header.
  - Durasi dan perilaku *lock wait timeout* pada slot jadwal dokter saat terjadi persaingan pemesanan kuota antrean tinggi.
- **NEEDS VERIFICATION DURING IMPLEMENTATION (`[TECHNICAL IMPLICATION]`):**
  - Evaluasi apakah sebaiknya dibuat service terpisah `appointmentApplication.service.js` atau cukup membungkus panggilan database langsung di controller.
  - Verifikasi bahwa rute check-in dan cancel tetap 100% bebas dari pemanggilan tabel Stage-0 setelah refactoring.

### Candidate B — Medication Closed-Loop
- **KNOWN (`[FACT]`):**
  - Memiliki 13 Stage-0 Call Sites yang tersebar pada 4 tabel Stage-0.
  - Memiliki 8 rute Express, di mana 3 rute aktif Stage-0 dan 5 rute zero Stage-0.
  - Mengelola transaksi multi-tabel kompleks yang melibatkan farmasi, eMAR, dan audit.
  - Memiliki constraint FK komposit (Migration 078) ke `encounters` dan `master_patients`.
  - Menggunakan fallback mock actor pada kontroler.
- **UNKNOWN (`[UNKNOWN]`):**
  - Potensi siklus deadlock konkurensi antara penguncian baris `clinical_orders` dan `medication_emar_administrations` saat perawat memindai barcode obat di bangsal bersamaan dengan apoteker memverifikasi batch di farmasi.
  - Perilaku constraint FK komposit di bawah RLS default-deny jika transaksi parent belum sepenuhnya committed.
- **NEEDS VERIFICATION DURING IMPLEMENTATION (`[TECHNICAL IMPLICATION]`):**
  - Verifikasi urutan eksekusi row lock (`FOR UPDATE`) di seluruh method transaksi agar konsisten dan bebas deadlock.
  - Verifikasi kompatibilitas struktur payload tanda tangan digital dual-nurse terhadap audit trail klinis.

### Candidate C1 — CPOE Orders & Safety
- **KNOWN (`[FACT]`):**
  - Memiliki 16 Stage-0 Call Sites pada 3 tabel Stage-0.
  - Memiliki 9 rute Express, di mana 6 rute aktif Stage-0 dan 3 rute zero Stage-0.
  - Memiliki shared call site CS 71 yang dipanggil oleh 2 rute Express terpisah.
  - Mengoper objek `client` database melintasi batas service ke `safetyAuthorization.service.js`.
  - Bergantung pada modul legacy `transactionManager.js`.
- **UNKNOWN (`[UNKNOWN]`):**
  - Perilaku verifikasi hash SHA-256 token jika terdapat variasi urutan key pada serialisasi JSON payload antar-versi runtime.
  - Toleransi drift jam sistem (*clock skew*) antara server API dan server database saat mengevaluasi kadaluarsa token keamanan.
- **NEEDS VERIFICATION DURING IMPLEMENTATION (`[TECHNICAL IMPLICATION]`):**
  - Verifikasi bahwa konteks `withUnitOfWork` dapat diteruskan secara seamless ke `safetyAuthorizationService` tanpa memicu pembuatan transaksi nested yang tidak didukung.
  - Verifikasi bahwa perbaikan pada shared call site CS 71 melayani rute `/orders/cpoe` dan rute legacy `/orders` dengan benar.

### Candidate C2 — Diagnostics
- **KNOWN (`[FACT]`):**
  - Memiliki 11 Stage-0 Call Sites pada 4 tabel Stage-0.
  - Memiliki 4 rute Express, di mana 3 rute aktif Stage-0 dan 1 rute zero Stage-0.
  - Call site CS 82 memiliki cacat nyata (*verified defect*): omisi kolom `tenant_id` pada `INSERT INTO clinical_orders` yang berstatus `NOT NULL` tanpa default.
  - Tidak memiliki kopling sinkron langsung dengan Candidate C1 (0 import), namun berbagi mutasi datastore pada `clinical_orders`.
- **UNKNOWN (`[UNKNOWN]`):**
  - Apakah fungsi `executeSecondaryClinicalAction` pernah berhasil dijalankan di PostgreSQL riil tanpa melempar error constraint.
  - Nilai prioritas dan korelasi ID default yang diharapkan oleh modul penerima order sekunder.
- **NEEDS VERIFICATION DURING IMPLEMENTATION (`[TECHNICAL IMPLICATION]`):**
  - Verifikasi daftar kolom dan tipe parameter SQL untuk perbaikan CS 82.
  - Verifikasi transisi status notifikasi hasil kritis setelah order sekunder berhasil diterbitkan.

### Candidate D — Master Patient / Admission
- **KNOWN (`[FACT]`):**
  - Memiliki 10 Stage-0 Call Sites pada tabel `master_patients`.
  - Memiliki 3 rute Express, seluruhnya aktif Stage-0 (100% aktif).
  - Tabel `master_patients` dirujuk oleh 65 tabel unik melalui Foreign Key constraints (42 RESTRICT, 23 NO ACTION).
  - Kontroler saat ini mengabaikan parameter tenant pada pencarian dan detail pasien.
  - Fungsi `registerPatient` mengunci baris NIK, BPJS, dan sekuensial nomor rekam medis tahunan.
- **UNKNOWN (`[UNKNOWN]`):**
  - Apakah keunikan NIK dan kartu BPJS secara regulasi HIS nasional diharapkan unik global lintas seluruh rumah sakit atau unik per tenant rumah sakit.
  - Tingkat antrean konkurensi pada generator MRN tahunan saat jam sibuk pendaftaran pasien baru.
- **NEEDS VERIFICATION DURING IMPLEMENTATION (`[TECHNICAL IMPLICATION]`):**
  - Verifikasi definisi unique constraint NIK/BPJS di skema database (apakah mencakup kolom `tenant_id`).
  - Verifikasi bahwa seluruh 65 foreign key anak tidak terganggu integritas referensialnya saat baris pasien dibuat di bawah isolasi RLS.

---

## 13. EVIDENCE LIMITATIONS

`[FACT]` Batasan-batasan evidensi yang wajib dipertimbangkan oleh Human Owner:

1. **Ketiadaan Pengujian Real PostgreSQL RLS pada Kandidat:**
   Seluruh suite pengujian eksisting untuk Candidate A, B, C1, C2, dan D saat ini berjalan di atas mock in-memory (`vi.mock` atau stub database). Belum ada satu pun pengujian RLS nyata pada kelima kandidat tersebut sebelum wave remediated diimplementasikan.
2. **Ketiadaan Benchmark Rollback Kuantitatif:**
   Repositori tidak memiliki automated test runner atau formula empiris untuk mengukur durasi dan probabilitas kegagalan rollback secara kuantitatif.
3. **Asimetri Jumlah Berkas Pengujian:**
   Jumlah berkas pengujian (misal: 11 file pada domain pasien vs 1 file pada diagnostik) merefleksikan riwayat penulisan test mock sebelumnya, bukan persentase cakupan uji (*test coverage*) terhadap call site Stage-0 terkait.
4. **Status Berkas Scratch:**
   Direktori `scratch/` berstatus diabaikan oleh Git (`.gitignore:64`), sehingga artefak JSON di dalamnya hanya terlacak jika ditambahkan secara paksa (*force add*).

---

## 14. HUMAN DECISION INPUT

Human Owner may now select one candidate based on the evidence presented in this report.

Candidate selected:
NOT SELECTED

Wave 1B.2 implementation:
NOT STARTED

---
