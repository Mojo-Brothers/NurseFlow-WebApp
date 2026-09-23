# NurseFlow Root Remediation Execution Plan (Master Blueprint)
## Pemetaan Menyeluruh Akar Masalah, Ketergantungan Sistem, dan Rencana Eksekusi Berjenjang

> **Status Dokumen:** RATIFIED REMEDIATION EXECUTION PLAN  
> **Klasifikasi:** Rencana Eksekusi Arsitektur (Architecture Execution Plan)  
> **Target Utama:** Rekonstruksi Fondasi Identity, Relational Database Integrity, dan Closed-Loop Workflows.

---

## 1. Verifikasi Temuan Kritis Terhadap Sistem Riil (Live Verification)

Sebelum menetapkan rencana eksekusi, verifikasi fisik telah dijalankan langsung pada sistem aktif:
1. **Database PostgreSQL 16 (`127.0.0.1:5432`, `nurseflow_enterprise_his`):**
   - Ditemukan **210 tabel** pada skema `public`.
   - Tabel master klinis terisi data riil dalam jumlah signifikan:
     - `master_patients`: **4.859 baris**
     - `encounters`: **4.810 baris**
     - `soap_notes`: memiliki relasi Foreign Key ke `encounters`, `master_patients`, `episodes_of_care`, dan `tenant_organizations`.
   - **Tabel Identitas Sebenarnya:** Bukan `users` / `roles`, melainkan **`auth_users`** (4 baris), **`auth_roles`** (6 baris), dan **`auth_user_roles`** (4 baris).
   - Pengguna aktif di database:
     - `dr.siti.wijaya` (DPJP Penyakit Dalam)
     - `dr.budi.santoso` (Dokter Jaga IGD)
     - `ners.indah` (Perawat Kepala Bangsal)
     - `apt.dimas` (Apoteker Penanggung Jawab)
   - Peran kanonikal di database (`auth_roles`):
     - `ROLE_SUPER_ADMIN`
     - `ROLE_DOCTOR_DPJP`
     - `ROLE_NURSE`
     - `ROLE_PHARMACIST`
     - `ROLE_LAB_ANALYST`
     - `ROLE_RADIOGRAPHER`
2. **Backend Express API Gateway:**
   - Server berjalan dan terhubung ke PostgreSQL melalui `server/db/postgresPool.js`.
   - **Celah Kritis (P0 Blocker):** File [`server/routes/auth.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/auth.routes.js) melakukan bypass total terhadap database `auth_users`. Login selalu sukses untuk nama pengguna apapun dan menerbitkan token statis untuk `dr.siti`.
3. **Frontend Client:**
   - Form rekam medis dan billing masih memanggil modul `emr.service.js` dan `billing.service.js` yang mengalirkan data ke Firebase Firestore atau LocalStorage.

---

## 2. Pemetaan Komprehensif: Finding → Root Cause → Remediation

| ID | Finding (Temuan Lapangan) | Root Cause (Akar Masalah) | Dependency (Ketergantungan) | Remediation (Tindakan Rekonstruksi) | Files Terkait | Database Impact | API Impact | UI Impact | Security & Audit Impact | Testing Strategy | Migration Strategy |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0-1** | **Mock Authentication Bypass:** Login backend tidak memeriksa password terhadap tabel database `auth_users`. | Rute `auth.routes.js` dibuat saat fase prototype UI tanpa menghubungkan ke tabel PostgreSQL. | Independent (Root of Trust) | Hubungkan `auth.routes.js` ke `auth_users` & `auth_roles`. Verifikasi password hash aman, terbitkan JWT riil berisi role DB. | `server/routes/auth.routes.js`, `server/services/auth.service.js` | Baca `auth_users`, `auth_roles`, `auth_user_roles`. | Endpoint `/api/v1/auth/login` validasi password riil, `/me` kembalikan data staf DB. | Form login frontend menampilkan error jika password salah. | Menghilangkan otentikasi palsu. Setiap audit log terikat user ID database yang sah. | Test login valid password, invalid password, locked account terhadap DB riil. | Forward migration 073 jika perlu menambah kolom salt/argon2 atau seed password dev. |
| **P0-2** | **Disparitas Role & RBAC Mismatch:** Frontend `roles.js`, backend `rbacMiddleware.js`, dan master seed memiliki variasi nama role berbeda. | Pengembangan bertahap membuat nama role tidak disinkronkan ke tabel `auth_roles`. | P0-1 (Identity) | Tetapkan `auth_roles` (`ROLE_*`) sebagai Single Source of Truth. Hapus alias hardcoded di `rbacMiddleware.js`. | `server/middlewares/rbacMiddleware.js`, `src/shared/constants/roles.js` | Standardisasi data `auth_roles` dan `auth_role_permissions`. | Penegakan izin berbasis DB role pada setiap router. | Menu navigasi frontend membaca role dari payload token JWT terverifikasi. | Penutupan celah privilege escalation. | Negative authorization tests (role A mengakses endpoint role B -> 403 Forbidden). | Sinkronisasi tabel `auth_roles` dan `auth_permissions`. |
| **P0-3** | **Relational Void pada Dokumen Klinis & Billing:** Beberapa tabel transaksi tidak memiliki constraint Foreign Key ke `master_patients` dan `encounters`. | Migrasi DDL lama berfokus pada fleksibilitas pembuatan tabel mandiri. | P0-1, P0-2 | Tambahkan constraint Foreign Key eksplisit (`REFERENCES master_patients(id)`, `REFERENCES encounters(id)`). | `database/migrations/` | Forward migration `073_reconcile_core_relationships.sql`. | API mengembalikan 400 Bad Request jika patient_id / encounter_id tidak valid di DB. | Form UI tidak dapat submit jika konteks pasien/kunjungan tidak valid. | Mencegah orphan clinical records dan asosiasi salah pasien. | Database constraint tests (insert data orphan ditolak RDBMS). | Forward safe migration dengan script pra-validasi data orphan. |
| **P1-1** | **Dual Persistence EMR (Firestore vs PostgreSQL):** Form klinis (`emr.service.js`) menulis ke Firestore, mengabaikan tabel PostgreSQL `soap_notes` / `clinical_forms`. | Arsitektur awal menggunakan Firebase, lalu PostgreSQL ditambahkan tanpa memutus jalur lama. | P0-1 s.d. P0-3 | Hapus dependensi Firestore pada `emr.service.js`. Arahkan seluruh penyimpanan form klinis ke Express backend API. | `src/modules/emr/services/emr.service.js`, `ClinicalFormShell.jsx` | Tabel `soap_notes`, `clinical_documents` menerima seluruh catatan EMR. | Endpoint `/api/v1/clinical-notes`, `/api/v1/emr/soap` menjadi jalur utama. | UI form menampilkan status tersimpan riil dari database relasional. | Data medis tersimpan di server berdaulat (on-premise/private cloud) sesuai Permenkes 24/2022. | End-to-end form persistence test ke PostgreSQL. | Migrasi data Firestore ke PostgreSQL (bila ada data penting). |
| **P1-2** | **Encounter State Machine Tidak Terkunci di Backend:** Status encounter dapat diubah secara bebas tanpa validasi aturan transisi alur klinis. | Logika alur hidup kunjungan pasien hanya diatur di komponen React modal. | P0-3, P1-1 | Bangun `encounterStateMachine.service.js` di backend yang memvalidasi setiap perubahan status (`ARRIVED` -> `TRIAGED` -> `IN_PROGRESS` -> `DISCHARGED`). | `server/services/encounterStateMachine.service.js`, `server/routes/encounters.routes.js` | Tabel `encounters`, `encounter_status_history`. | Endpoint `/api/v1/encounters/:id/transition` membatasi transisi ilegal. | UI tombol status disabled jika transisi tidak valid secara klinis. | Pasien pulang tidak dapat difinalisasi jika ada order CPOE atau tagihan belum selesai. | State machine transition matrix tests (happy path + invalid jumps). | Tambahkan tabel `encounter_status_history` via forward migration. |
| **P2-1** | **CPOE Disconnect (Resep & Order Penunjang Terputus):** Order dokter tersimpan di tabel induk `clinical_orders` tetapi tidak memecah ke farmasi/lab/rad. | Modul CPOE belum memiliki event dispatcher untuk memecah sub-order. | P1-2 | Bangun `universalOrderDispatcher.service.js` yang memecah order induk menjadi sub-tabel `medication_orders`, `laboratory_orders`, `radiology_orders` dalam 1 transaksi DB. | `server/services/universalOrderDispatcher.service.js`, `server/routes/orders.routes.js` | Tabel `clinical_orders`, `medication_orders`, `laboratory_orders`, `radiology_orders`. | Endpoint `/api/v1/orders` memproses atomic sub-orders. | Dashboard farmasi dan lab otomatis menerima notifikasi antrean order baru. | Closed-loop CPOE: Order dokter langsung terbaca di unit penunjang. | Atomic order transaction test (rollback semua jika satu sub-order gagal). | Menyelaraskan relasi FK sub-tabel order. |
| **P3-1** | **Inventory Leakage (Konsumsi Obat Tidak Memotong Stok Gudang):** Pemberian obat di modul rawat jalan/inap tidak memotong kartu stok di PostgreSQL. | Fungsi `deductStock` memanggil Firestore, sedangkan stok fisik berada di tabel `inventory_items` PostgreSQL. | P2-1 | Bangun `inventoryLedger.service.js` transaksional di backend dengan row-level locking (`SELECT ... FOR UPDATE`) untuk mutasi stok batch/lot. | `server/services/inventoryLedger.service.js`, `server/routes/enterpriseInventory.routes.js` | Tabel `inventory_items`, `stock_movements`, `stock_batches`. | Endpoint `/api/v1/inventory/deduct-dispense` dengan transaksi atomik. | Antarmuka farmasi menampilkan sisa stok fisik riil per batch/depo. | Mencegah selisih fisik obat dan kecurangan stok (fraud prevention). | Concurrency stress test pemotongan stok obat oleh multiple user. | Penambahan trigger saldo stok otomatis di PostgreSQL. |
| **P4-1** | **Revenue Leakage (Aktivitas Klinis Tanpa Charge Capture):** Tindakan dokter dan pemakaian BMHP tidak otomatis membuat invoice tagihan. | Modul billing terisolasi dan menunggu penagihan manual dari petugas kasir. | P2-1, P3-1 | Implementasikan *Automated Charge Capture Hook* pada setiap penyelesaian tindakan klinis dan dispensing farmasi ke tabel `billing_invoices`. | `server/services/chargeCapture.service.js`, `server/routes/billing.routes.js` | Tabel `billing_invoices`, `billing_items`. | Endpoint `/api/v1/billing/charges/capture` dipanggil otomatis secara internal. | Layar kasir langsung menampilkan rekapitulasi biaya lengkap saat pasien pulang. | Zero revenue leakage; mencegah tindakan medis tidak tertagih. | Verifikasi rantai: Order resep -> Dispense -> Invoice line item terbit di DB. | Pembuatan skema foreign key billing ke encounter. |

---

## 3. Identifikasi Blocker P0 Paling Kritis

Dari hasil pemetaan dependensi:
> **BLOCKER P0 UTAMA:**  
> **Ketiadaan Sistem Otentikasi & Identitas Berbasis Database Relasional Terpercaya (Authentication & Identity Root of Trust).**

### Mengapa ini adalah Blocker P0?
1. **Dasar Hukum & Tata Kelola Medis:** Sesuai Permenkes 24/2022 dan ISO 27001, setiap tindakan medis, penginputan resep, dan perubahan catatan klinis **WAJIB** terikat pada identitas pengguna (*practitioner identity*) yang sah, terverifikasi, dan memiliki kewenangan klinis (*clinical privileges*).
2. **Kerapuhan Sistem Saat Ini:** Karena `server/routes/auth.routes.js` menerbitkan token dokter palsu (`dr.siti`) untuk setiap permintaan login tanpa memeriksa password terhadap tabel `auth_users`, seluruh audit trail, otorisasi RBAC, dan integritas data klinis downstream menjadi **TIDAK DAPAT DIPERTANGGUNGJAWABKAN (NON-REPUDIATION VOID)**.
3. **Pondasi Tersedia di PostgreSQL:** PostgreSQL **SUDAH MEMILIKI** tabel `auth_users` (dengan akun `dr.siti.wijaya`, `dr.budi.santoso`, `ners.indah`, `apt.dimas`), tabel `auth_roles` (dengan role kanonikal `ROLE_DOCTOR_DPJP`, `ROLE_NURSE`, dll), dan relasi `auth_user_roles`. Yang hilang adalah **koneksi backend gateway API ke tabel-tabel ini**.

---

## 4. Pemilihan Vertical Slice Foundation Pertama: Slice P0-1

Sesuai perintah Step 5 Master Directive:
> **PILIH SATU VERTICAL SLICE FOUNDATION PALING KRITIS.**

Kita memilih:
### 🎯 **VERTICAL SLICE P0-1: Canonical Database-Backed Identity & Real PostgreSQL Authentication Engine**

### Batasan Ruang Lingkup (Scope Boundary):
1. **Database:**
   - Memanfaatkan tabel `auth_users`, `auth_roles`, `auth_user_roles`, `master_staff`, dan `clinical_staff_profiles` yang sudah ada di PostgreSQL.
   - Menambahkan forward migration `073_seed_dev_auth_credentials.sql` untuk memastikan akun-akun staf medis dev memiliki password hash terstandarisasi yang dapat diverifikasi secara deterministik oleh backend.
2. **Backend API (`server/`):**
   - Membuat service otentikasi riil: `server/services/auth.service.js` yang mengkueri `auth_users` dan memverifikasi kata sandi secara kriptografis menggunakan Node.js native `crypto.scrypt` / `crypto.timingSafeEqual` (atau bcrypt-compatible format).
   - Merefaktor [`server/routes/auth.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/auth.routes.js):
     - `POST /api/v1/auth/login`: Menerima `username` dan `password`, memverifikasi terhadap PostgreSQL, mengupdate `last_login_at` dan mereset `failed_login_attempts`. Jika password salah, mengembalikan HTTP 401 Unauthorized dengan detail RFC 7807 dan menambah `failed_login_attempts`.
     - `GET /api/v1/auth/me`: Mengembalikan data identitas lengkap dari database (nama staf, gelar, SIP/STR, unit kerja, peran kanonikal).
   - Memperbarui [`server/middlewares/authMiddleware.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/middlewares/authMiddleware.js) dan [`server/middlewares/rbacMiddleware.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/middlewares/rbacMiddleware.js) untuk mengekstrak dan memvalidasi role kanonikal langsung dari token JWT yang diterbitkan oleh database identity.
3. **Frontend Integration (`src/`):**
   - Menghubungkan form login frontend (`src/modules/auth/` atau komponen login terkait) ke endpoint riil `/api/v1/auth/login`.
   - Menguji bahwa login dengan kredensial salah menghasilkan notifikasi error yang tepat, dan login dengan kredensial dokter riil (`dr.siti.wijaya`) berhasil masuk dengan konteks profil dokter dari database.
4. **Verifikasi Pengujian Nyata:**
   - Membuat tes integrasi otomatis `tests/authDatabaseDurability.test.js` yang mengeksekusi panggilan login langsung terhadap server Express dan PostgreSQL 16 aktif (`127.0.0.1:5432`).
   - Tidak menggunakan *mock client*! Pengujian membuktikan query langsung ke tabel `auth_users` dan pencatatan audit log di database.
