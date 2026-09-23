# NURSEFLOW ENTERPRISE HIS — P0-1 CHANGE BOUNDARY AUDIT REPORT

**Dokumen:** `OFFICIAL P0-1 CHANGE BOUNDARY AUDIT`  
**Status Evaluasi:** `AUDIT RATIFIED`  
**Tanggal Audit:** 23 September 2026  
**Auditor:** NurseFlow Core Architecture & Security Engineering Team  

---

## 1. Ringkasan Ruang Lingkup Perubahan P0-1

Audit batas perubahan (Change Boundary Audit) bertujuan mengidentifikasi secara deterministik seluruh berkas, skema basis data, dan konfigurasi yang disentuh selama fase pengerasan keamanan dan otentikasi P0-1.

### A. Berkas yang Diubah / Dibuat dalam Scope P0-1

| Kategori | Nama Berkas | Tipe Perubahan | Deskripsi Perubahan |
| :--- | :--- | :---: | :--- |
| **Database Migration** | [`database/migrations/073_reconcile_auth_credentials.sql`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/database/migrations/073_reconcile_auth_credentials.sql) | **NEW** | Migrasi forward-only: reconciles `auth_users`, `auth_roles`, `master_staff`, `master_practitioners`, dan menghapus hash statis dari skema |
| **Dev Tooling** | [`scripts/provision_dev_credentials.mjs`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/scripts/provision_dev_credentials.mjs) | **NEW** | Skrip provisioning kredensial lokal dev dengan salt 128-bit acak kriptografis unik per akun |
| **Security Utility** | [`server/utils/passwordSecurity.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/utils/passwordSecurity.js) | **NEW** | Modul kriptografi scrypt ($N=16384, r=8, p=1$), CSPRNG salt, constant-time comparison, batas invarian `SCRYPT_CONSTRAINTS` anti-DoS, dan anti user-enumeration |
| **Core Service** | [`server/services/auth.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/auth.service.js) | **NEW** | Layanan otentikasi server-authoritative berbasis PostgreSQL 16: atomic increment lockout 5x gagal, timing attack mitigation |
| **API Routing** | [`server/routes/auth.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/auth.routes.js) | **MODIFIED** | Integrasi middleware `rateLimiter(10, 60)`, respons standar RFC 7807 problem details, penolakan client-injected identity |
| **Security Service** | [`src/core/security/jwtSecurity.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/core/security/jwtSecurity.service.js) | **MODIFIED** | Penegakan algoritma HS256, verifikasi tanda tangan HMAC-SHA256 constant-time, rotasi refresh token (RTR), in-memory blacklist |
| **Security Service** | [`src/core/security/rbacGuard.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/core/security/rbacGuard.service.js) | **MODIFIED** | Menghilangkan celah fallback Super Admin pada role tidak dikenal |
| **Verification Test** | [`tests/authDatabaseDurability.test.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/authDatabaseDurability.test.js) | **NEW** | 21 pengujian ketahanan basis data: scrypt constraints, DoS mitigation, role mapping, atomic lockout, master staff profile |
| **Verification Test** | [`tests/authHttpRoutes.test.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/authHttpRoutes.test.js) | **NEW** | 7 pengujian rute HTTP: RFC 7807 responses, anti-enumeration, rate limit HTTP 429, lockout HTTP 423 |
| **Verification Test** | [`tests/rbacEndpointVerification.test.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/rbacEndpointVerification.test.js) | **NEW** | 14 pengujian ALLOW dan DENY pada 7 role profesional kesehatan di endpoint HTTP API nyata |
| **Governance Log** | [`docs/CHANGELOG_PERUBAHAN_HIS.md`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/docs/CHANGELOG_PERUBAHAN_HIS.md) | **MODIFIED** | Catatan resmi perubahan sistem HIS dalam Bahasa Indonesia |

---

## 2. Berkas di Luar Lingkup P0-1 (Pre-existing Uncommitted Changes)

Pemeriksaan `git status` mengidentifikasi sejumlah berkas UI/EMR yang telah dimodifikasi sebelum P0-1 dimulai (terkait fitur EMR sprint sebelumnya):
- `src/design-system/components/EnterpriseFooter.jsx`
- `src/layouts/MainLayout.jsx`
- `src/modules/clinical_core/components/DoctorSoapWorkspace.jsx`
- `src/modules/emr/components/CPPTWorkspace.jsx`
- `src/modules/emr/components/DokterDocumentAlertBanner.jsx`
- `src/modules/emr/pages/*` (CatatanAnestesi, CatatanTerintegrasi, DaftarPemeriksaanRi, dll.)
- `src/modules/emr/services/emrSupportingDocs.service.js`
- `src/routes/emr.routes.jsx`
- `tests/emrLegacyFeaturesParity.test.js`
- `docs/design_debt_baseline_2026.json`

**Catatan Forensik:** Seluruh berkas di atas tidak dimodifikasi oleh P0-1 dan dibiarkan utuh tanpa perubahan.

---

## 3. Evaluasi Objek Basis Data yang Berubah

Objek basis data PostgreSQL 16 yang disentuh oleh Migrasi 073:
1. **`auth_users`**:
   - Kolom `failed_login_attempts` direset menjadi 0 untuk akun baseline.
   - Kolom `password_hash` dimigrasikan menggunakan scrypt format.
   - Kolom `staff_id` diikatkan ke `master_staff.id`.
   - Menegakkan `auth_users_staff_id_key` (UNIQUE) dan `auth_users_staff_id_fkey` (FOREIGN KEY).
2. **`auth_roles`**:
   - Sinkronisasi role standar: `ROLE_DOCTOR_DPJP`, `ROLE_DOCTOR_EMERGENCY`, `ROLE_NURSE`, `ROLE_PHARMACIST`, `ROLE_LAB_ANALYST`, `ROLE_RADIOGRAPHER`, `ROLE_SUPER_ADMIN`.
3. **`auth_user_roles`**:
   - Pemisahan `ROLE_SUPER_ADMIN` dari `dr.siti.wijaya`.
   - Pengalokasian `ROLE_SUPER_ADMIN` secara eksklusif ke `admin.dev` (`d0000000-0000-0000-0000-000000000099`).

---

## 4. Evaluasi Artefak Scratch & Kebocoran Rahasia (Secrets Audit)

1. **Berkas Scratch:** Direktori `scratch/` berisi skrip analisis audit sementara (`audit_suite.mjs`, `run_runtime_security_audits.mjs`, `audit_secrets.mjs`, dll.) yang tidak dimasukkan ke dalam commit produksi dan akan dibersihkan.
2. **Penyimpanan Kredensial:**
   - Tidak ada kata sandi teks polos (*plaintext password*) yang disimpan dalam berkas migrasi `073_reconcile_auth_credentials.sql`.
   - Berkas `.env` dan `.env.local` terdaftar dalam `.gitignore` (`.env`, `.env.*`, `!.env.example`) dan tidak masuk ke dalam git repository.
   - Default fallback string `JWT_SECRET` pada `jwtSecurity.service.js` diakui sebagai **PRODUCTION RISK** yang wajib diisi oleh orchestrator rahasia (Secret Manager / Kubernetes Secret) di lingkungan produksi.
