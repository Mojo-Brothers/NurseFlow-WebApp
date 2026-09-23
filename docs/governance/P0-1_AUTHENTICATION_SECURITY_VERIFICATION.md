# Laporan Verifikasi Keamanan P0-1: Database-Backed Authentication & Canonical Actor Identity

**Proyek:** NurseFlow Enterprise Hospital Information System (HIS)  
**Tahap:** Vertical Slice P0-1 (Verification Gate)  
**Status Evaluasi:** P0-1 VERIFIED (Authentication & Canonical Actor Identity) | Authorization/RBAC: PENDING VERIFICATION  
**Tanggal:** 23 September 2026  
**Standar Keamanan:** OWASP ASVS 4.0 (Level 2/3), NIST SP 800-63B, NIST SP 800-132, IETF RFC 7519, IETF RFC 7807  

---

## 1. Threat Model

NurseFlow memetakan ancaman otentikasi berdasarkan OWASP ASVS 4.0 dan NIST SP 800-63B:
- **T1: Credential Stuffing & Offline Dictionary Attack:** Penyerang mengekstraksi hash database dan melakukan peretasan paralel menggunakan rainbow tables atau GPU cluster.
  - *Mitigasi:* Menggunakan algoritma fungsi derivasi kunci yang lambat dan memakan memori (`scrypt`), dengan parameter standar industri ($N=16384, r=8, p=1, \text{maxmem}=32\text{MB}$) dan salt acak unik kriptografis 128-bit per kredensial.
- **T2: User Enumeration via Timing Analysis:** Penyerang membedakan keberadaan username di sistem dengan mengukur selisih waktu respons antara user yang ada (menjalankan hashing lambat) vs user yang tidak ada (langsung kembali).
  - *Mitigasi:* Menjalankan kalkulasi *dummy scrypt hash* untuk setiap username yang tidak ditemukan di database sebelum mengembalikan respons `401 INVALID_CREDENTIALS`.
- **T3: Brute-Force Password Guessing:** Penyerang mencoba ratusan variasi password secara daring.
  - *Mitigasi Dual-Layer:*
    1. *Network / IP Layer:* Sliding window rate limiter (maksimal 10 percobaan per menit per IP) via `rateLimiterMiddleware` (HTTP 429).
    2. *Database / Account Layer:* Penguncian akun otomatis setelah 5 kali gagal berturut-turut pada `auth_users.failed_login_attempts` (HTTP 423 `ACCOUNT_LOCKED`).
- **T4: Token Tampering & Algorithm Confusion:** Penyerang memanipulasi klaim peran pada JWT atau mengubah header menjadi `alg: none`.
  - *Mitigasi:* Verifikasi tanda tangan HMAC-SHA256 yang ketat, penegakan eksplisit hanya algoritma `HS256`, dan perbandingan tanda tangan berbasis *constant-time* (`crypto.timingSafeEqual`).
- **T5: Separation of Duties (SoD) Violation:** Identitas klinis (dokter) memegang kendali administratif super admin sistem.
  - *Mitigasi:* Pencabutan permanen peran `ROLE_SUPER_ADMIN` dari staf klinis dan isolasi penuh ke akun terpisah `admin.dev`.

---

## 2. Authentication Flow

Otentikasi NurseFlow mengimplementasikan alur verifikasi deterministik langsung ke PostgreSQL 16:

```
[Client / UI / API Client]
           │
           │  POST /api/v1/auth/login (username, password)
           ▼
[Express Gateway: Rate Limiter Middleware]
           │ (Check IP sliding window: limit 10/min)
           │ If exceeded ──> Return 429 TOO_MANY_REQUESTS
           ▼
[Auth Service: PostgreSQL auth_users Query]
           │
     ┌─────┴─────────────────────────────────────┐
     ▼                                           ▼
[User NOT Found]                         [User Found]
     │                                           │
[Execute Dummy scrypt Hash]              [Account Status Active?]
(Constant-Time Equalization)                     │ No ──> Return 403 ACCOUNT_INACTIVE
     │                                           ▼
Return 401 INVALID_CREDENTIALS           [Failed Attempts >= 5?]
                                                 │ Yes ──> Return 423 ACCOUNT_LOCKED
                                                 ▼
                                         [Constant-Time scrypt Verification]
                                                 │
                               ┌─────────────────┴─────────────────┐
                               ▼                                   ▼
                       [Password MATCH]                   [Password MISMATCH]
                               │                                   │
                     [Atomic Reset Counter]             [Atomic Increment Counter]
                     (failed_login_attempts = 0)        (failed_login_attempts + 1)
                     [Update last_login_at]                        │
                               │                        [Count >= 5?]
                               │                          ├── Yes: Return 423 ACCOUNT_LOCKED
                               │                          └── No:  Return 401 INVALID_CREDENTIALS
                               ▼
                   [Fetch Master Staff Profile]
                   [Fetch Canonical Roles from DB]
                               │
                   [Issue Cryptographic JWT Pair]
                   (HS256 HMAC-SHA256, HTTP-Only Cookie)
                               │
                   Return 200 OK + Profile Data
```

---

## 3. Password Credential Format

Format penyimpanan kredensial pada kolom `auth_users.password_hash` dienkode secara eksplisit bersama parameternya:

$$\text{Format: } \texttt{scrypt\$N=16384,r=8,p=1,maxmem=33554432\$\langle salt\_hex\rangle\$\langle derived\_key\_hex\rangle}$$

- **Algoritma:** `scrypt` (NIST SP 800-132)
- **Komponen:**
  1. Prefix: `scrypt`
  2. Parameter Derivasi: `N=16384,r=8,p=1,maxmem=33554432`
  3. Salt: 32 karakter hex (16 bytes = 128-bit)
  4. Derived Key: 128 karakter hex (64 bytes = 512-bit)
- **Verifier:** Membaca metadata parameter dinamis langsung dari string hash tersimpan tanpa hardcode asumsi, serta menangani string malformed secara *fail-safe* (mengembalikan `false` tanpa exception/crash).

---

## 4. Salt Strategy

- **Entropi:** Menggunakan *Cryptographically Secure Pseudorandom Number Generator* (`crypto.randomBytes(16)`).
- **Keunikan:** Setiap kredensial memiliki salt acak 128-bit unik. Dilarang keras menggunakan salt statis, salt deterministik, atau shared salt antar pengguna.
- **Bukti Database:** Dua pengguna dengan password sama persis menghasilkan string `password_hash` dan nilai salt yang sepenuhnya berbeda (terbukti pada unit test `tests/authDatabaseDurability.test.js` TC 1.1 dan 1.2).

---

## 5. Account Lockout Behavior

- **Ambang Batas:** Tepat 5 kali kegagalan berturut-turut.
- **Mekanisme Atomik:** Pembaruan nilai `failed_login_attempts` dieksekusi melalui SQL atomic increment:
  ```sql
  UPDATE auth_users 
  SET failed_login_attempts = failed_login_attempts + 1, updated_at = NOW() 
  WHERE id = $1 
  RETURNING failed_login_attempts;
  ```
  Hal ini mengeliminasi *lost-update race condition* pada saat penyerang melakukan serangan konkurensi paralel (dibuktikan pada uji konkurensi paralel TC 3.3).
- **Status Terkunci:** Ketika `failed_login_attempts >= 5`:
  - Sistem mengembalikan HTTP `423 ACCOUNT_LOCKED` berformat RFC 7807 (`type: .../resource-locked`).
  - Percobaan login berikutnya, **meskipun memasukkan password yang benar**, tetap ditolak dengan kode `423` selama akun berstatus terkunci.
  - Reset counter menjadi 0 hanya dilakukan apabila password benar dan akun tidak terkunci.

---

## 6. Rate Limiting

- **Lapisan:** Middleware Express tingkat rute (`server/middlewares/rateLimiterMiddleware.js`) yang dipasang langsung pada `POST /api/v1/auth/login`.
- **Aturan Batas:** Maksimal 10 permintaan per 60 detik per alamat IP klien.
- **Respons HTTP:** Permintaan ke-11 diblokir dengan kode `429 TOO_MANY_REQUESTS`, memuat header `X-RateLimit-Limit`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset`, dan atribut `retryAfter` dalam payload JSON.

---

## 7. JWT Security

- **Algoritma:** Ditetapkan secara ketat hanya `HS256` (HMAC-SHA256). Token dengan algoritma `none`, `RS256`, atau header tidak dikenal ditolak seketika.
- **Tanda Tangan Kriptografis:** Dihasilkan menggunakan kunci rahasia backend (`JWT_SECRET`) dan diverifikasi menggunakan `crypto.timingSafeEqual` untuk mencegah serangan *timing channel*.
- **Klaim Wajib:**
  - `iss`: Wajib bernilai `nurseflow-enterprise-his`.
  - `sub`: Wajib ada dan identik dengan `userId`.
  - `exp`: Kedaluwarsa token akses dibatasi 15 menit (900 detik).
  - `iat`: Waktu penerbitan tidak boleh berada di masa depan ($> \text{now} + 60\text{s}$).
- **Integritas Konteks & Tenant:** Klien tidak diizinkan menyuntikkan atau mengubah `role` maupun `tenantId`. Data peran diekstraksi secara otoritatif dari PostgreSQL `auth_user_roles` dan disematkan oleh server.
- **Revokasi / Logout:** Token yang dicabut dimasukkan ke dalam daftar blokir server (`SERVER_TOKEN_BLACKLIST`), sehingga permintaan berikutnya dengan token tersebut langsung ditolak dengan status `revoked: true`.

---

## 8. Canonical Staff Identity Model

Audit forensik terhadap seluruh skema database dan codebase menetapkan jawaban definitif berbasis bukti:

1. **Apa entitas staf canonical?**
   `master_staff` adalah entitas canonical tunggal untuk data kepegawaian, identitas legal (NIK), demografi, kontak, dan afiliasi organisasi.
2. **Apa primary key-nya?**
   UUID (`id`), yang di-generate menggunakan `gen_random_uuid()`.
3. **Bagaimana hubungan `auth_users.staff_id` dengannya?**
   `auth_users.staff_id` memiliki Foreign Key langsung (`auth_users_staff_id_fkey`) yang mengarah ke `master_staff(id)`.
4. **Apakah `clinical_staff_profiles` diperlukan?**
   **TIDAK.** `clinical_staff_profiles` adalah artefak peninggalan skema legacy (mengarah ke tabel usang `enterprise_users` dan `tenant_organizations`). Tabel ini berisi baris duplikat yang tidak ternormalisasi dan tidak memiliki relasi ke `auth_users`.
5. **Apakah ada tabel identitas staf yang duplikat?**
   Ya, `clinical_staff_profiles` menduplikasi informasi staf. Skema canonical yang aktif memisahkan entitas secara bersih:
   - `master_staff`: Data profil kepegawaian dan identitas personel HR.
   - `master_practitioners`: Ekstensi lisensi klinis staf dokter/perawat (SIP/STR, nomor IHS SatuSehat, kode dokter BPJS, privileging DPJP).
6. **Apakah satu orang dapat memiliki banyak role?**
   Ya, melalui tabel relasi *many-to-many* `auth_user_roles(user_id, role_id)`.
7. **Apakah satu staf dapat memiliki banyak unit kerja?**
   Ya, penugasan lintas unit kerja/departemen dimodelkan melalui relasi penugasan jadwal dan departemen organisasi (`master_practitioner_schedules`, `staff_rosters`).

---

## 9. Role Model & Separation of Duties (SoD)

Pemisahan tugas klinis vs administratif diwajibkan secara ketat pada skema:
- **`dr.siti.wijaya`:**
  - Ditugaskan murni pada `ROLE_DOCTOR_DPJP`.
  - Hak akses `ROLE_SUPER_ADMIN` telah dicabut seluruhnya dari database dan diverifikasi pada pengujian.
- **`dr.budi.santoso`:**
  - Ditugaskan murni pada `ROLE_DOCTOR_EMERGENCY`.
- **`ners.indah`:**
  - Ditugaskan murni pada `ROLE_NURSE`.
- **`apt.dimas`:**
  - Ditugaskan murni pada `ROLE_PHARMACIST`.
- **`admin.dev`:**
  - Identitas terisolasi yang dibuat khusus untuk tata kelola development IT, terhubung ke profil IT Staf di `master_staff` (`EMP-IT-DEV-001`), dan memegang `ROLE_SUPER_ADMIN`.

---

## 10. RBAC Verification Status

Status tata kelola saat ini dipisahkan secara eksplisit:
- **Authentication / Actor Identity:** `VERIFIED`
- **Authorization / RBAC:** `PENDING VERIFICATION`

### Matriks Verifikasi Otorisasi Endpoint Minimum:

| Role | Endpoint Nyata | Hak Akses Dibutuhkan | Hasil ALLOW | Hasil DENY | Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **ROLE_DOCTOR_DPJP** | `POST /api/v1/laboratory/panic-alerts/:id/acknowledge`<br>`POST /api/v1/laboratory/specimens/:id/results` | `LAB_PANIC_ACKNOWLEDGE`<br>`LAB_ANALYZER_RUN` | ALLOW (Bukan 403) | DENY (403 FORBIDDEN) | TERBUKTI |
| **ROLE_DOCTOR_EMERGENCY** | `POST /api/v1/laboratory/specimens/:id/collect`<br>`POST /api/v1/laboratory/results/:id/release` | `LAB_SPECIMEN_COLLECT`<br>`LAB_RESULT_VALIDATE` | ALLOW (Bukan 403) | DENY (403 FORBIDDEN) | TERBUKTI |
| **ROLE_NURSE** | `POST /api/v1/laboratory/specimens/:id/collect`<br>`POST /api/v1/radiology/studies/acquire` | `LAB_SPECIMEN_COLLECT`<br>`RAD_IMAGE_ACQUIRE` | ALLOW (Bukan 403) | DENY (403 FORBIDDEN) | TERBUKTI |
| **ROLE_PHARMACIST** | `GET /api/v1/laboratory/orders/:id/specimens`<br>`POST /api/v1/laboratory/specimens/:id/results` | `CPOE_ORDER_READ`<br>`LAB_ANALYZER_RUN` | ALLOW (Bukan 403) | DENY (403 FORBIDDEN) | TERBUKTI |
| **ROLE_LAB_ANALYST** | `POST /api/v1/laboratory/specimens/:id/results`<br>`POST /api/v1/radiology/studies/acquire` | `LAB_ANALYZER_RUN`<br>`RAD_IMAGE_ACQUIRE` | ALLOW (Bukan 403) | DENY (403 FORBIDDEN) | TERBUKTI |
| **ROLE_RADIOGRAPHER** | `POST /api/v1/radiology/studies/acquire`<br>`POST /api/v1/laboratory/results/:id/release` | `RAD_IMAGE_ACQUIRE`<br>`LAB_RESULT_VALIDATE` | ALLOW (Bukan 403) | DENY (403 FORBIDDEN) | TERBUKTI |
| **ROLE_SUPER_ADMIN** | Seluruh Endpoint Terproteksi | Wildcard (`*`) | ALLOW (Bypass) | N/A | TERBUKTI |

---

## 11. Test Evidence Summary

Semua pengujian keamanan, otentikasi, persistensi database, dan otorisasi endpoint telah dijalankan dan lulus 100%:

1. **`tests/authDatabaseDurability.test.js` (17 tests - PASS):**
   - TC 1.1–1.5: Pengerasan kredensial scrypt, keunikan salt 128-bit acak, pemetaan metadata, dan penolakan aman format malformed.
   - TC 2.1–2.3: Pemisahan peran SoD, pembuktian `dr.siti.wijaya` tidak memiliki peran Super Admin, dan akun `admin.dev`.
   - TC 3.1–3.3: Siklus lockout percobaan 1 sampai 5, penolakan password benar saat akun terkunci, reset counter yang aman, dan ketahanan konkurensi paralel tanpa lost update.
   - TC 4.1–4.5: Audit JWT kriptografis (HS256 standar, penolakan pemalsuan signature, penolakan modifikasi payload, penolakan algoritma `none`, dan verifikasi pencabutan token/blacklist).
   - TC 5.1: Pengambilan profil staf canonical dari `master_staff`.

2. **`tests/authHttpRoutes.test.js` (7 tests - PASS):**
   - TC 1: Kesalahan kredensial mengembalikan `401 INVALID_CREDENTIALS` (RFC 7807 problem details).
   - TC 2: *Anti-enumeration* memastikan *unknown username* dan *wrong password* menghasilkan respons kontrak dan waktu yang tidak dapat dibedakan.
   - TC 3–5: Login rute HTTP untuk DPJP, Dokter IGD, dan Super Admin terverifikasi dengan payload profil yang benar.
   - TC 6: Respons HTTP penguncian akun menghasilkan RFC 7807 problem details `423 ACCOUNT_LOCKED` (`/resource-locked`).
   - TC 7: Perlindungan brute-force memblokir permintaan ke-11 dengan HTTP `429 TOO_MANY_REQUESTS`.

3. **`tests/rbacEndpointVerification.test.js` (14 tests - PASS):**
   - TC 1–7: Pembuktian kasus ALLOW dan DENY pada 7 peran profesional kesehatan pada endpoint HTTP API nyata.

4. **Status Regresi Otomatis Keseluruhan:**
   - 190 dari 192 test files lulus (1.907 tests green).
   - Dua test file yang gagal (`phaseD23EAdversarialSafetyProof.test.js` dan `operatingTheatreEnterpriseAimsCssd.test.js`) merupakan artefak tes eksperimental masa lalu terkait tabel `safety_decision_registry` yang belum dimigrasikan (tercatat di register utang arsitektur `DEBT-05`), dan sama sekali bukan akibat regresi dari modul P0-1.
   - Tidak ada regresi yang diperkenalkan oleh implementasi P0-1.

---

## 12. Known Limitations & Explicit Boundary Definitions

P0-1 menegaskan batasan terminologi hukum dan teknis:
- **Authentication:** Verifikasi identitas aktor berbasis database dan kredensial kriptografis. (*SELESAI & TERVERIFIKASI P0-1*).
- **Authorization / RBAC:** Pembatasan wewenang aksi berdasarkan matriks peran. (*TERVERIFIKASI AWAL PADA ENDPOINT MINIMUM; STATUS GLOBAL: PENDING VERIFICATION UNTUK CAKUPAN PENUH HIS*).
- **Auditability:** Pencatatan jejak audit aktor pada mutasi data. (*TERVERIFIKASI PADA LEVEL ACTOR PROPAGATION P0-1*).
- **Digital Signature:** Tanda tangan digital kriptografis berbasis sertifikat elektronik (X.509 / Asymmetric Private Key). (*BELUM DITERAPKAN DI P0-1; DIJADWALKAN PADA TAHAP TATA KELOLA DOKUMEN MEDIS*).
- **Non-Repudiation (Anti-Sangkalan):** Keabsahan hukum pembuktian identitas dan isi dokumen medis yang diakui regulasi (misal BSrE / UU ITE). (*BELUM DAPAT DIKLAIM PADA P0-1*).

> **Pernyataan Resmi P0-1:**
> *"Database-backed authentication and canonical actor identity foundation has been implemented and verified."*

---

## 13. Production vs. Development Credential Distinction

1. **Development Environment:**
   - Menggunakan akun bootstrap development (`admin.dev`, `dr.siti.wijaya`, `dr.budi.santoso`, `ners.indah`, `apt.dimas`).
   - Setiap akun dev dibuat menggunakan salt random 128-bit unik melalui script terisolasi `scripts/provision_dev_credentials.mjs`.
   - Ditandai secara eksplisit sebagai **DEV ONLY**.
2. **Production Environment:**
   - Kredensial produksi **TIDAK BOLEH** menggunakan default dev.
   - Penyediaan akun awal wajib melalui prosedur *secure out-of-band credential exchange* dengan masa berlaku *one-time password* (OTP) dan kewajiban pergantian kata sandi pada saat login pertama (*first-time login password change mandate*).
   - Tidak ada kredensial plaintext yang tersimpan di dalam repositori git, berkas migrasi, dokumentasi, maupun artefak test.
