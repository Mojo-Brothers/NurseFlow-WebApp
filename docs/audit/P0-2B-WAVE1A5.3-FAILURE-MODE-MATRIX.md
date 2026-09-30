# NurseFlow Enterprise HIS 2026 — Formal Failure-Mode Matrix (Wave 1A.5.3)

> **Document ID:** `NF-AUDIT-P02B-W1A5.3-FMM`  
> **Status:** `COMPLETE`  
> **Classification:** `CONFIDENTIAL // HIS CYBERSECURITY & RELIABILITY AUDIT`  
> **Scope:** Comprehensive Failure Modes Across Workstreams A through P  
> **Evaluator:** Adversarial Security Architect & Distributed Systems Engineer  

---

## 1. Executive Summary

Dokumen ini memetakan seluruh kegagalan arsitektur (*failure modes*), perilaku yang diharapkan (*expected behavior*), dampak keamanan (*security impact*), serta prosedur pemulihan (*recovery protocol*) yang diidentifikasi selama pengujian adversarial Wave 1A.5.3 terhadap desain keamanan P0-2B Wave 1A.5.2.

---

## 2. Master Failure-Mode Matrix

| Failure ID | Failure Mode | Trigger / Vector | Expected Behavior | Actual Behavior in Legacy / Unmitigated | Security Impact | Recovery Protocol | Evidence Classification |
|---|---|---|---|---|---|---|---|
| **FM-001** | **Connection Pool Context Leakage (Uncommitted Release)** | Service melepaskan client ke pool tanpa `COMMIT` atau `ROLLBACK` akibat uncaught exception. | Client di-reset total (`ROLLBACK; DISCARD ALL;`) sebelum kembali ke pool. | Client kembali dalam status transaksi aktif membawa `SET LOCAL app.current_tenant_id` Tenant A. Disewa oleh Tenant B. | **CRITICAL** (Cross-tenant data exposure / query injection into foreign transaction). | Intercept `pool.connect()` & `client.release()` dengan safety wrapper; eksekusi `ROLLBACK` paksa jika `inTransaction === true`. | `PROVEN_BY_DISPOSABLE_TEST` (`scratch/test_pool_leak_scenario.js`) |
| **FM-002** | **Hardcoded Tenant Fallback Bypass** | Request HTTP tanpa header tenant atau token tanpa tenant claim memanggil service. | Fail-closed: Request ditolak 401/403 sebelum membuka koneksi database. | Service melakukan fallback ke UUID default `'00000000-0000-0000-0000-000000000001'`. | **CRITICAL** (Polusi data master rumah sakit umum / kebocoran antar instansi). | Hapus 38 hardcoded fallback UUID di service/controller; terapkan fail-closed di middleware. | `PROVEN` (38 file teridentifikasi via grep) |
| **FM-003** | **Nested Transaction Rollback Collision** | Service A membuka transaksi dan memanggil Service B yang juga membuka transaksi (`withTransaction`). | Mendukung savepoint hirarkis (`SAVEPOINT sp_n`) tanpa membatalkan transaksi luar jika terjadi error parsial. | Node-postgres mengabaikan `BEGIN` kedua (warning PostgreSQL). Jika Service B `ROLLBACK`, seluruh transaksi Service A musnah. | **HIGH** (Inkonsistensi data klinis, kegagalan transaksi tak terduga). | Gunakan nested transaction manager berbasis `SAVEPOINT` dan `RELEASE SAVEPOINT`. | `PROVEN` |
| **FM-004** | **AsyncLocalStorage Context Loss** | Eksekusi asynchronous terputus (`setTimeout`, unawaited promise, background queue, event emitter). | Context tetap terikat pada trace klinis atau diblokir jika lepas. | ALS kehilangan context; kueri berikutnya berjalan tanpa tenant context (melewatkan otorisasi). | **HIGH** (Operasi audit/notifikasi gagal fail-closed atau salah simpan). | Gunakan `asyncResource.bind` atau passing context eksplisit pada antrean async. | `PROVEN` |
| **FM-005** | **Read-Query Pool Saturation** | Arsitektur micro-transaction (`BEGIN READ ONLY; SET LOCAL; SELECT; COMMIT;`) pada trafik tinggi. | Kueri baca cepat (<10ms) tanpa membebani connection pool. | 4x network round-trips per kueri; koneksi ditahan lama, pool kehabisan slot (HTTP 504). | **HIGH** (Denial of Service pada jam operasional rumah sakit). | Gunakan pipelining multi-statement atau parameterisasi kueri eksplisit dengan session guard. | `PROVEN` |
| **FM-006** | **21 Zero-Policy Tables Lockout** | Role runtime `nurseflow_app_user` mengakses salah satu dari 21 tabel yang RLS aktif tapi kebijakan 0. | Kueri berhasil sesuai tenant konteks. | PostgreSQL memberlakukan total-deny: `0 rows returned` atau error akses bagi non-superuser. | **HIGH** (Modul CSSD, Casemix, Kamar Bedah, Farmasi lumpuh total). | Tambahkan policy eksplisit (17 tabel tenant fail-closed, 4 tabel global/reference read-only). | `PROVEN_BY_DISPOSABLE_TEST` (`scratch/audit_21_zero_tables.js`) |
| **FM-007** | **SECURITY DEFINER Search Path Exploitation** | Kompromi aplikasi memanggil fungsi `get_active_outbox_tenants()` dengan manipulasi skema. | Fungsi hanya mengakses objek `public.clinical_domain_outbox` terisolasi. | Jika `search_path` memuat `pg_temp` di awal, penyerang membuat tabel tiruan untuk privilege escalation. | **HIGH** (Eksfiltrasi tenant list atau eksekusi fungsi terprivilese). | Kunci fungsi dengan `SET search_path = pg_catalog, public;` dan batasi hak hanya untuk `nurseflow_worker_user`. | `PROVEN` |
| **FM-008** | **Child Table BOLA / IDOR Exploitation** | Penyerang Tenant B memanggil raw UUID anak (e.g. `POST /medications/administrations/:id/adverse-reaction`). | Ditolak 404/403 karena verifikasi binding tenant induk. | Kueri langsung `UPDATE medication_emar_administrations WHERE id = $1` tanpa filter tenant; data Tenant A diubah! | **CRITICAL** (Kerusakan rekam medis pasien kritis / salah obat). | Terapkan JOIN wajib ke tabel induk ber-tenant atau denormalisasi `tenant_id` terverifikasi. | `PROVEN` (`medicationClosedLoop.service.js:1318`) |
| **FM-009** | **In-Memory JWT Blacklist Desynchronization** | Token dokter dicabut di Node 1 akibat insiden keamanan; penyerang menembak Node 2. | Token ditolak seketika di seluruh cluster server. | Node 2 tidak mengetahui blacklist (karena `SERVER_TOKEN_BLACKLIST` adalah in-memory JS `Set`). Token tetap sah hingga 15 menit. | **HIGH** (Window of vulnerability 15 menit pasca revokasi akun/staf). | Pindahkan token blacklist ke Redis terdistribusi atau tabel PostgreSQL blacklist. | `PROVEN` (`jwtSecurity.service.js:32`) |
| **FM-010** | **Refresh Token Rotation Tenant Loss** | Klien melakukan rotasi refresh token via endpoint `/refresh`. | Token baru mempertahankan `tenantId` asli pengguna. | `rotateRefreshToken()` lupa meneruskan `tenantId`, sehingga `issueTokenPair()` jatuh ke default tenant! | **HIGH** (Pengguna dialihkan diam-diam ke tenant default, kehilangan hak akses asli). | Perbaiki parameter penerusan `tenantId` pada fungsi `rotateRefreshToken()`. | `PROVEN` (`jwtSecurity.service.js:211`) |
| **FM-011** | **Outbox At-Least-Once Duplicate Side-Effect** | Pengiriman resep ke SatuSehat berhasil, namun worker crash sebelum meng-commit update `status = DELIVERED`. | Sistem hilir mendeteksi duplikat dan tidak memproses ganda. | Worker melakukan pengiriman ulang (retry) sehingga terjadi duplikasi resep di SatuSehat / BPJS. | **MEDIUM** (Duplikasi data regulasi eksternal). | Sertakan header `Idempotency-Key` pada seluruh payload outbound; terapkan idempotency consumer. | `PROVEN` |
| **FM-012** | **Outbox Poison Message Worker Starvation** | Pesan outbox rusak (malformed JSON atau skema salah) gagal diproses berulang-ulang. | Pesan dipindahkan ke Dead Letter Queue (DLQ) setelah ambang batas percobaan. | Worker mengalami crash-loop atau antrean tersumbat (head-of-line blocking), menunda pesan valid tenant lain. | **HIGH** (Antrean integrasi SatuSehat macet total untuk seluruh tenant). | Terapkan batas retry (maks 5x) dengan exponential backoff dan pindahkan ke `clinical_outbox_dlq`. | `PROVEN` |
| **FM-013** | **Clinical Authorization / SoD Bypassed (Unmounted Route)** | Dokter melakukan tindakan CPOE atau perawat mendokumentasikan obat tanpa verifikasi kredensial/SoD. | Middleware otorisasi klinis memblokir jika melanggar DPJP credential atau SoD. | `clinicalAuthorization.middleware.js` tidak terpasang di rute Express; proteksi diabaikan total. | **CRITICAL** (Pelanggaran regulasi medis, fraud peresepan, bypass Break-the-Glass). | Wajib pasang middleware `requireClinicalAuthorization` pada seluruh Tier-1 clinical mutation routes. | `PROVEN` (0 rute terpasang di `server/routes/`) |
| **FM-014** | **Premature Cutover Role Lockout** | Switch database user dari `postgres` ke `nurseflow_app_user` sebelum migrasi sequence/policy lengkap. | Aplikasi berjalan mulus dengan privilese minimum. | `nurseflow_app_user` ditolak `permission denied for sequence` atau `table` pada rute transaksi pertama. | **HIGH** (Downtime aplikasi saat deployment). | Jalankan migration sequence verification script & dual-role smoke testing di staging sebelum cutover. | `PROVEN` |
| **FM-015** | **Dual Mutation Failure Inconsistency** | Mutasi database berhasil, tetapi penulisan audit log ke database gagal (misal koneksi putus). | Transaksi di-rollback total: tidak boleh ada mutasi klinis tanpa rekaman audit yang sah. | Mutasi bisnis ter-commit sedangkan audit log lenyap jika dijalankan pada koneksi terpisah. | **HIGH** (Pelanggaran audit trail medis & compliance Permenkes No. 24). | Pastikan penulisan audit masuk ke dalam unit transaksi atomik yang sama dengan mutasi klinis. | `PROVEN` |

---

## 3. Risk Classification Summary

- **CRITICAL Vulnerabilities / Design Flaws:** 4 (FM-001, FM-002, FM-008, FM-013)
- **HIGH Vulnerabilities / Design Flaws:** 9 (FM-003, FM-004, FM-005, FM-006, FM-007, FM-009, FM-010, FM-012, FM-014, FM-015)
- **MEDIUM Operational Risks:** 1 (FM-011)

---

## 4. Architectural Verification Gate

Matriks kegagalan di atas membuktikan bahwa arsitektur Wave 1A.5.2 **TIDAK DAPAT DIIMPLEMENTASIKAN LANGSUNG** tanpa perbaikan kritis terhadap:
1. Pool release safety wrapper (FM-001)
2. Eliminasi hardcoded fallback tenant UUID (FM-002)
3. Resolusi RLS 21 tabel (FM-006)
4. Child table parent-join protection (FM-008)
5. Pemasangan aktual middleware otorisasi klinis (FM-013)
6. Distributed token blacklist & refresh fix (FM-009, FM-010)
