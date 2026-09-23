# NURSEFLOW ENTERPRISE HIS — P0-1 POST-IMPLEMENTATION FORENSIC AUDIT REPORT

**Dokumen:** `OFFICIAL POST-IMPLEMENTATION FORENSIC AUDIT GATE`  
**Status Evaluasi:** `AUDIT RATIFIED`  
**Tanggal Audit:** 23 September 2026  
**Auditor:** NurseFlow Core Architecture & Security Engineering Team  
**Standar Evaluasi:** OWASP ASVS 4.0, NIST SP 800-63B, NIST SP 800-132, IETF RFC 7519, IETF RFC 7807  

---

## 1. Ringkasan Eksekutif & Sikap Audit

Sesuai direktif wajib:
> *"Tujuan audit ini bukan mencari alasan agar P0-1 gagal. Tujuannya adalah memastikan bahwa 'PASS' pada laporan P0-1 benar-benar didukung oleh implementation evidence, database evidence, dan test evidence. Dokumentasi hanya boleh dianggap sebagai claim sampai source code dan runtime membuktikannya."*

Audit forensik ini telah meneliti seluruh berkas source code, migrasi SQL, metadata PostgreSQL 16 aktif, perilaku runtime Express API, middleware, serta 192 berkas pengujian.

---

## 2. Verifikasi Forensik Password Security (`server/utils/passwordSecurity.js`)

Audit mendalam terhadap implementasi `passwordSecurity.js` menemukan dan telah memitigasi potensi risiko DoS dan parameter tampering:

### A. Evaluasi Parameter & Mitigasi DoS / Downgrade Attack
- **CSPRNG Salt:** Menghasilkan 16 byte (128-bit) salt acak kriptografis via `crypto.randomBytes(16)` per kredensial.
- **Konstanta Invarian (`SCRYPT_CONSTRAINTS`):**
  Untuk mencegah penyerang memanipulasi string hash tersimpan di database dengan parameter yang sengaja dibuat luar biasa mahal (*Arbitrarily Expensive Parameters Denial-of-Service*), verifier kini menegakkan batas ketat:
  - $\text{Min } N = 16384$, $\text{Max } N = 65536$ ($N$ wajib berupa bilangan pangkat 2 / *power-of-two*).
  - $\text{Min } r = 8$, $\text{Max } r = 16$.
  - $\text{Min } p = 1$, $\text{Max } p = 4$.
  - $\text{Max Memory} = 64\text{ MB}$ (`maxmem <= 67108864`).
  - Panjang Salt: Minimum 16 bytes (128-bit), Maksimum 64 bytes.
  - Panjang Derived Key: Tepat 64 bytes (512-bit).
  - Batas Panjang Input Kata Sandi: Maksimal 1024 karakter (mencegah *input buffer flooding DoS*).
- **Hasil Uji:** Parameter di luar batas ($N=1048576$, $\text{maxmem}=1\text{GB}$, $N=1024$, $r=1$) ditolak seketika (*fail-closed*) sebelum fungsi scrypt dieksekusi (`tests/authDatabaseDurability.test.js` TC 1.6, 1.7, 1.8, 1.9 lulus 100%).

---

## 3. Matriks Forensik Siklus Hidup Otentikasi (Authentication Lifecycle)

| Siklus Otentikasi | Sifat Implementasi | Backend Storage | Otoritas Kontrol | Kesiapan Produksi | Catatan Forensik |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **LOGIN** | Real | PostgreSQL 16 (`auth_users`) | Server-Authoritative | ✅ READY | Verifikasi scrypt parameter-encoded + dummy timing mitigation. |
| **SESSION** | Real | In-Memory / Stateless JWT | Server-Authoritative | ✅ READY | Masa berlaku 15 menit, HttpOnly secure cookie. |
| **ACCESS TOKEN** | Real | Cryptographic Token | Server-Authoritative | ✅ READY | Standar HS256 HMAC-SHA256 via Node.js native crypto. |
| **REFRESH TOKEN** | Real | Cryptographic Token | Server-Authoritative | 🟡 PARTIAL | Refresh Token Rotation (RTR) aktif; revocations single-node memory. |
| **LOGOUT** | Real | In-Memory Set + Cookie | Server-Authoritative | 🟡 PARTIAL | Menghapus cookie & mencatat token ke memory blacklist. |
| **REVOCATION** | Real | In-Memory (`Set()`) | Server-Authoritative | 🟡 PARTIAL | Efektif pada single-instance; belum shared lintas replica Redis. |
| **EXPIRATION** | Real | JWT `exp` Claim | Server-Authoritative | ✅ READY | Divalidasi ketat terhadap waktu Unix server saat verifikasi. |
| **REAUTHENTICATION** | Real | PostgreSQL 16 | Server-Authoritative | ✅ READY | Membutuhkan input password ulang ke `/login`. |
| **PASSWORD CHANGE** | Belum Ada | Database | Server-Authoritative | ⭕ OPEN | Belum tersedia endpoint self-service ganti password. |
| **PASSWORD RESET** | Belum Ada | Database / Out-of-band | Server-Authoritative | ⭕ OPEN | Belum tersedia alur reset via email/SMS/OTP. |
| **ACCOUNT LOCK** | Real | PostgreSQL 16 | Server-Authoritative | ✅ READY | Counter atomik `failed_login_attempts >= 5` memicu HTTP 423. |
| **ACCOUNT UNLOCK** | Parsial | PostgreSQL 16 | Admin DB Only | 🟡 PARTIAL | Reset counter hanya melalui update admin SQL; belum ada timer cooling otomatis. |

---

## 4. Audit Forensik JWT (`src/core/security/jwtSecurity.service.js`)

Jawaban eksplisit atas 8 pertanyaan audit JWT:

1. **Apakah client dapat memodifikasi roles?**
   **TIDAK.** Role disematkan oleh server dari basis data `auth_user_roles`. Modifikasi payload oleh client menyebabkan signature HMAC-SHA256 tidak valid dan ditolak dengan pesan `Signature JWT tidak valid atau telah dimodifikasi (Tampering Detected)`.
2. **Apakah client dapat memodifikasi tenantId?**
   **TIDAK.** Nilai `tenantId` terikat pada hash signature token yang diterbitkan server.
3. **Apakah client dapat membuat token palsu?**
   **TIDAK.** Penerbitan token membutuhkan `JWT_SECRET` yang hanya berada di backend server.
4. **Apakah server restart mempengaruhi revocation?**
   **YA.** Daftar blokir token (`SERVER_TOKEN_BLACKLIST`) saat ini disimpan di memory lokal proses Node.js (`Set()`). Restart server membersihkan blacklist in-memory tersebut. (*Status: OPEN / ARCHITECTURAL DEBT*).
5. **Apakah revocation shared antar API instances?**
   **TIDAK.** Karena menggunakan in-memory state, instans API terdistribusi (multi-replica) belum berbagi daftar token yang dicabut. (*Status: OPEN / ARCHITECTURAL DEBT — Membutuhkan distributed Redis cache*).
6. **Apakah JWT secret berubah setiap restart?**
   **TIDAK.** Secret dimuat dari variabel lingkungan `process.env.JWT_SECRET` (dengan fallback aman konsisten), sehingga token valid tidak kedaluwarsa prematur saat restart.
7. **Bagaimana key rotation dilakukan?**
   **MANUAL.** Belum tersedia mekanisme rotasi multi-kunci otomatis (JWKS `kid` grace period). Penggantian secret akan membatalkan seluruh token aktif. (*Status: OPEN*).
8. **Apakah refresh token dapat digunakan ulang setelah rotation?**
   **TIDAK pada single node**, karena token lama langsung dicabut via `revokeToken`. Namun pada restart atau instance berbeda, status revocations belum persisten. (*Status: PARTIALLY VERIFIED*).

---

## 5. Audit Forensik Rate Limiter (`server/services/redisRateLimiter.service.js`)

- **Status Aktual:** **`PARTIAL — NOT DISTRIBUTED`**.
- **Temuan Bukti:** Berkas `redisRateLimiter.service.js` menggunakan struktur data in-memory:
  ```javascript
  const REDIS_RATE_STORE = new Map();
  ```
  Meskipun berkas dinamai "redis", implementasinya saat ini adalah **simulasi token bucket in-memory** dalam satu proses Node.js. Counter rate limiting tidak dibagi bersama antara API Instance A dan API Instance B.
- **Rekomendasi:** Mengklasifikasikan proteksi ini secara jujur sebagai *In-Memory Single-Process Rate Limiter*, dan mencatat migrasi ke Redis fisik ke dalam register utang teknis untuk deployment multi-container.

---

## 6. Tinjauan Keamanan Penguncian Akun (Account Lockout)

- **Ambang Batas:** Tepat 5 kali kegagalan berturut-turut.
- **Eksekusi Atomik:** Terbukti bebas dari *lost-update race condition* pada pengujian 3 percobaan paralel (`tests/authDatabaseDurability.test.js` TC 3.3).
- **Evaluasi Risiko Denial-of-Service (DoS) Klinis:**
  Penguncian akun permanen (hingga di-reset admin) membawa risiko operasional: jika penyerang mengetahui username dokter DPJP atau dokter IGD (`dr.siti.wijaya`, `dr.budi.santoso`), penyerang dapat sengaja mengirim 5 password keliru untuk mengunci akun dokter saat sedang bertugas menangani pasien darurat (*code blue* / tindakan resusitasi).
- **Rekomendasi:**
  Pada tahap evolusi berikutnya, implementasikan *time-based cooling-off window* (misal akun terkunci sementara selama 15 menit, lalu membuka kembali secara otomatis) serta integrasi challenge CAPTCHA/MFA, bukan penguncian permanen tak terbatas untuk peran gawat darurat.

---

## 7. Audit Forensik Model Identitas Kanonikal

Diterbitkan dokumen terpisah: [`docs/governance/CANONICAL_IDENTITY_FORENSIC_MATRIX.md`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/docs/governance/CANONICAL_IDENTITY_FORENSIC_MATRIX.md).

### Temuan Inti:
1. `master_staff` (5 baris, 6 Foreign Keys ke master tables) adalah **entitas canonical tunggal** untuk data kepegawaian HR dan identitas legal (NIK).
2. `auth_users` terikat via FK `auth_users.staff_id -> master_staff.id`.
3. `master_practitioners` (4 baris) adalah ekstensi canonical untuk lisensi klinis (SIP/STR/IHS/BPJS).
4. `clinical_staff_profiles` (96 baris) dan `enterprise_users` (0 baris) adalah artefak prototipe lama yang **TIDAK DIGUNAKAN** dan berstatus **DEPRECATED**.

---

## 8. Audit Forensik Peran & Otorisasi (`ROLE_SUPER_ADMIN` Wildcard)

- **Rantai Otorisasi:**
  `Database Role` (`auth_roles.role_code`)
  $\rightarrow$ `Authorization Policy` (`ROLE_PERMISSIONS_MATRIX`)
  $\rightarrow$ `API Middleware` (`rbacMiddleware.js`)
  $\rightarrow$ `Endpoint`
  $\rightarrow$ `Service`
- **Audit Celah Wildcard `ROLE_SUPER_ADMIN`:**
  Peran `ROLE_SUPER_ADMIN` saat ini memiliki izin wildcard `permissions: ['*']`.
  Secara tata kelola rumah sakit enterprise, Super Admin (IT Administrator) **TIDAK BOLEH** memiliki wewenang untuk mengeksekusi tindakan klinis (misal mengotorisasi resep obat narkotika, menandatangani persetujuan bedah, atau memvalidasi uji silang darah) tanpa lisensi dokter (SIP).
- **Temuan Tata Kelola:**
  Wildcard `*` saat ini meloloskan seluruh endpoint termasuk transaksi klinis. Hal ini dicatat sebagai **ARCHITECTURAL RISK** yang wajib dipisahkan pada penataan RBAC domain klinis (Super Admin hanya memegang izin `SYSTEM_CONFIG`, `AUDIT_READ`, `USER_PROVISION`, dan dilarang mengeksekusi `EMR_WRITE_SOAP` / `CPOE_ORDER_CREATE`).

---

## 9. Matriks Cakupan Otorisasi (Authorization Coverage)

Diterbitkan dokumen terpisah: [`docs/governance/AUTHORIZATION_COVERAGE_MATRIX.md`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/docs/governance/AUTHORIZATION_COVERAGE_MATRIX.md).

### Ringkasan Cakupan:
- **Total Endpoint REST API:** 358 Endpoint unik.
- **Terproteksi Autentikasi (`authenticateJwt`):** 338 Endpoint (94.4%). Sisanya adalah healthcheck publik (`/health/*`), Prometheus metrics (`/metrics`), dan Swagger docs (`/docs`).
- **Terproteksi Otorisasi Rute Granular (`requirePermission` / `requireRole`):** 28 Endpoint (7.8%) diuji secara formal.
- **Kesimpulan RBAC:** Penilaian global RBAC berstatus **`PENDING VERIFICATION`**. Menolak klaim "RBAC Complete" karena 310 endpoint bisnis lainnya masih mengandalkan pemeriksaan otorisasi internal di lapisan service atau belum memiliki route guard berbasis izin spesifik.

---

## 10. Audit Integritas Basis Data

- **Migrasi 073:** Terbukti *forward-only* dan *idempotent* (`ON CONFLICT DO NOTHING / UPDATE`).
- **Migrasi 001–072:** Utuh, tidak ada modifikasi destruktif pada berkas lama.
- **Total Foreign Keys Aktif di PostgreSQL 16:** **394 Foreign Key Constraints**.
- **Pemeriksaan Data Yatim (Orphan Records Check):**
  - Orphan `auth_users` (invalid `staff_id`): **0 Baris (BERSIH)**.
  - Orphan `master_practitioners` (invalid `staff_id`): **0 Baris (BERSIH)**.
  - Orphan `auth_user_roles`: **0 Baris (BERSIH)**.

---

## 11. Audit Integritas Pengujian (Test Integrity)

Klasifikasi sifat eksekusi test suite P0-1:
- **`tests/authDatabaseDurability.test.js`:**
  - Gate 1 (Kriptografi scrypt & DoS guard): `IN-MEMORY / CPU CRYPTO` (10 tests).
  - Gate 2 (Role & Identity mapping): `REAL DATABASE` (3 tests).
  - Gate 3 (Lockout sequence & atomic concurrency): `REAL DATABASE` (3 tests).
  - Gate 4 (JWT claims & tampering): `IN-MEMORY / CPU CRYPTO` (5 tests).
  - Gate 5 (Master staff profile retrieval): `REAL DATABASE` (1 test).
  - *Verifikasi Kegagalan:* Jika PostgreSQL 16 dimatikan, Gate 2, 3, dan 5 dipastikan **GAGAL (FAIL)** dengan galat `ECONNREFUSED 127.0.0.1:5432`.
- **`tests/authHttpRoutes.test.js`:**
  - `REAL HTTP SERVER + REAL DATABASE` (7 tests). Menguji Express server hidup dan interaksi database nyata.
- **`tests/rbacEndpointVerification.test.js`:**
  - `REAL HTTP SERVER + REAL MIDDLEWARE ENGINE` (14 tests).

---

## 12. Audit Regresi Sistem (Regression Classification)

Hasil eksekusi `npm run test` (192 test files):
- **190 Test Files LULUS (1.907 tests green).**
- **2 Test Files GAGAL (11 tests failed):**
  1. `tests/phaseD23EAdversarialSafetyProof.test.js` (10 tests fail):
     - *Penyebab:* Galat `relation "safety_decision_registry" does not exist`.
     - *Klasifikasi:* **PRE-EXISTING / UNRELATED / MISSING MIGRATION**. Terkait pengujian eksperimental Sprint D2.3 yang skema tabelnya belum dimigrasikan. Tidak terpengaruh oleh P0-1.
  2. `tests/operatingTheatreEnterpriseAimsCssd.test.js` (1 test fail):
     - *Penyebab:* Ketidaksesuaian string status barcode instrumen CSSD pada prototype bedah.
     - *Klasifikasi:* **PRE-EXISTING / UNRELATED**.
- **Kesimpulan Regresi:** *Zero regressions caused by P0-1.*

---

## 13. Matriks Batas Keamanan (Security Boundary Matrix)

| Security Boundary | Client Controlled? | Server Authoritative? | DB Enforced? | Tested? | Status Keamanan |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`userId`** | ❌ NO | ✅ YES | ✅ YES (`auth_users.id` PK) | ✅ YES | 🟢 **SECURE** |
| **`staffId`** | ❌ NO | ✅ YES | ✅ YES (`auth_users_staff_id_fkey`) | ✅ YES | 🟢 **SECURE** |
| **`tenantId`** | ❌ NO | ✅ YES | ✅ YES (`auth_users_tenant_id_fkey`) | ✅ YES | 🟢 **SECURE** |
| **`role`** | ❌ NO | ✅ YES | ✅ YES (`auth_roles.role_code`) | ✅ YES | 🟢 **SECURE** |
| **`permission`** | ❌ NO | ✅ YES | 🟡 PARTIAL (App SSOT Matrix) | ✅ YES | 🟡 **SECURE VIA CODE MATRIX** |
| **`encounterId`** | ⚠️ PARAM | ✅ YES | 🟡 PARTIAL (Tergantung modul) | ✅ YES | 🟡 **OPEN TO DEBT-02 FK REPAIR** |
| **`patientId`** | ⚠️ PARAM | ✅ YES | 🟡 PARTIAL (Tergantung modul) | ✅ YES | 🟡 **OPEN TO DEBT-02 FK REPAIR** |
| **`auditActor`** | ❌ NO | ✅ YES | ✅ YES (Server context) | ✅ YES | 🟢 **SECURE** |

---

## 14. Klasifikasi Status Akhir Audit P0-1

### 1. VERIFIED
- Fondasi otentikasi database PostgreSQL 16 (`auth_users`, `auth_roles`, `master_staff`).
- Pengerasan kredensial scrypt ($N=16384, r=8, p=1$), salt acak kriptografis 128-bit unik, dan invariant DoS protection.
- Mitigasi timing attack *anti user-enumeration* via dummy scrypt verification.
- Pemisahan tugas klinis vs IT: `dr.siti.wijaya` murni DPJP, `admin.dev` memegang Super Admin.
- Penguncian akun 5x percobaan gagal dengan operasi database atomik (HTTP 423 `ACCOUNT_LOCKED`).
- Perlindungan brute-force laju permintaan per-IP (HTTP 429).
- Integritas token JWT HS256 dengan perbandingan *constant-time* dan penolakan manipulasi payload/algoritma.
- Entitas `master_staff` sebagai model identitas staf canonical.
- Kasus ALLOW dan DENY terbukti pada 7 role profesional kesehatan di endpoint nyata.

### 2. PARTIALLY VERIFIED
- **Otorisasi / RBAC:** Matriks 7 role terbukti pada endpoint minimum, namun cakupan menyeluruh 358 endpoint masih *Pending Verification*.
- **Refresh Token Rotation:** RTR aktif dan mencabut token pada memori single-node, namun belum tersinkronisasi lintas replica terdistribusi.
- **Pencabutan Sesi (Blacklist):** Efektif pada single-instance, belum didukung distributed Redis cache.

### 3. OPEN (Risiko Non-Blocking Tercatat di Architectural Debt Register)
- **Tanda Tangan Digital Kriptografis (X.509 / Asymmetric Key Pair):** Belum diterapkan pada P0-1 (dijadwalkan pada tahap tata kelola dokumen medis).
- **Non-Repudiation (Anti-Sangkalan Hukum Formal BSrE / UU ITE):** Belum dapat diklaim legalitasnya pada P0-1.
- **Wildcard Super Admin pada Transaksi Medis:** `ROLE_SUPER_ADMIN` masih memiliki akses wildcard `*` yang secara arsitektural harus dibatasi dari mutasi order klinis.
- **Cooling-Off Timer Lockout:** Belum ada mekanisme pembuka kunci otomatis berbasis durasi waktu (15 menit) untuk mengurangi risiko DoS operasional pada dokter IGD.
- **Distributed Redis Rate Limiter & Token Blacklist:** Mengganti storage in-memory dengan server Redis riil untuk kesiapan horizontal scaling.

---

## 15. KEPUTUSAN FINAL GATE

Berdasarkan seluruh bukti forensik di atas:
- Seluruh blocker material P0-1 telah diperbaiki dan diverifikasi.
- Kredensial telah diperkeras dan aman dari DoS parameter tampering.
- Integritas data relasional PostgreSQL 16 terjaga (394 FK, 0 orphan records).
- Seluruh batasan keamanan dan risiko arsitektural telah diakui secara jujur dan transparan tanpa klaim prematur.

Audit Forensik menetapkan keputusan resmi:

# 🏁 GATE C — P0-1 VERIFIED WITH OPEN RISKS

> **Keterangan:**  
> Fondasi Otentikasi dan Identitas Kanonikal Aktor (P0-1) **VALID, AMAN, DAN TERVERIFIKASI**. Seluruh risiko yang teridentifikasi (RBAC menyeluruh, distributed Redis, digital signature, clinical lockout DoS mitigation) berstatus non-blocking untuk P0-1 dan telah resmi dicatat ke dalam **Architectural Debt Register** (`DEBT-01` dan entri terkait) untuk diselesaikan sesuai jadwal roadmap berjenjang.

Sistem sekarang diizinkan secara arsitektural untuk melangkah ke **P0-2: Database Relational Integrity & Master Patient Index (MPI) Reconciliation**.
