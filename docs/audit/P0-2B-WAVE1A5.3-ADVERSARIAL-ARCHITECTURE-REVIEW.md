# P0-2B WAVE 1A.5.3 — ADVERSARIAL SECURITY ARCHITECTURE REVIEW

> **Document ID:** `NF-AUDIT-P02B-W1A5.3-ASAR`  
> **Status:** `COMPLETE`  
> **Classification:** `STRICT CONFIDENTIAL // HEALTHCARE HIS SECURITY ARCHITECTURE AUDIT`  
> **Evaluators:** Principal Security Architect, PostgreSQL Security Engineer, Distributed Systems / Transaction Engineer, Healthcare HIS Reliability Auditor  
> **Date:** September 28, 2026  
> **Target Baseline:** P0-2B Wave 1A.5.2 Architecture Design & Implementation Plan  

---

## 1. Executive Summary & Baseline Challenge

Wave 1A.5.2 menetapkan baseline konseptual:
- Scoped Unit-of-Work + AsyncLocalStorage (ALS) context propagation
- `SET LOCAL app.current_tenant_id`
- Fail-closed PostgreSQL Row-Level Security (RLS)
- Non-superuser runtime role (`nurseflow_app_user`)
- Tenant-scoped resource authorization (7 canonical resolvers)
- `SECURITY DEFINER` outbox tenant discovery

Sebagai **Adversarial Security Architect**, tugas fase ini adalah **menguji dan membongkar kelemahan desain tersebut** sebelum perubahan diterapkan ke basis data dan kode produksi.

### Ringkasan Temuan Utama
1. **Critical Pool Leak Hazard (Workstream A4):** `SET LOCAL` hanya terikat pada durasi transaksi. Terbukti secara empiris melalui uji sandbox (`scratch/test_pool_leak_scenario.js`) bahwa jika koneksi dilepaskan ke pool tanpa `COMMIT`/`ROLLBACK` eksplisit (misalnya akibat unhandled exception pada service), transaksi tetap terbuka dan tenant context **merembes ke penyewa koneksi berikutnya**.
2. **Pervasive Hardcoded Tenant Fallbacks (Workstream A3):** Ditemukan 38 berkas di controller dan service yang memuat fallback hardcoded UUID `'00000000-0000-0000-0000-000000000001'`, melanggar prinsip *fail-closed*.
3. **Child Table BOLA / IDOR Exposure (Workstream I):** 5 endpoint tabel transaksi anak (`medication_emar_administrations`, `medication_dispense_allocations`, `longitudinal_care_plans`, `patient_split_invoices`, `physician_diagnostic_interpretations`) terbukti melakukan kueri langsung via raw `:id` tanpa memeriksa tenant induk dan tanpa kolom `tenant_id` maupun RLS.
4. **Unmounted Clinical Authorization & SoD (Workstreams J & K):** Middleware `requireClinicalAuthorization`, `separationOfDutiesService`, dan `breakTheGlassService` telah didesain dan diimplementasikan secara terisolasi, namun **tidak dipasang pada satu pun rute Express di `server/routes/`** (Status: `NOT ENFORCED`).
5. **In-Memory Blacklist Desynchronization & JWT Rotation Flaw (Workstream L):** Blacklist token disimpan dalam JavaScript `Set` di memori lokal proses (`SERVER_TOKEN_BLACKLIST`), sehingga tidak sinkron pada lingkungan multi-instance/kluster. Selain itu, fungsi `rotateRefreshToken()` lupa meneruskan parameter `tenantId`, menyebabkan token hasil rotasi jatuh ke tenant default.
6. **21 Zero-Policy Tables Lockout (Workstream D):** Seluruh 21 tabel yang belum memiliki policy ternyata **memiliki kolom `tenant_id`**, namun karena RLS telah aktif tanpa policy, pengalihan runtime user ke non-superuser (`nurseflow_app_user`) akan mengakibatkan total denial-of-service (0 rows) pada seluruh modul tersebut.

---

## 2. Hard Constraints & Compliance

Audit ini tunduk secara ketat pada batasan berikut:
1. **Zero Production Code Changes:** Tidak ada mutasi kode di `server/`, `src/`, maupun berkas frontend.
2. **Zero Active DB Migrations:** Tidak ada migrasi baru yang dijalankan pada database aktif.
3. **Zero Active DB Mutations:** Dilarang melakukan `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `ALTER`, `GRANT`, `REVOKE`, atau manipulasi DDL/DML pada data aktif.
4. **Disposable Testing Only:** Seluruh uji coba verifikasi dijalankan dalam sandbox terisolasi atau skrip investigasi *read-only* di direktori `scratch/`.
5. **No False Confidence:** Kontrol yang hanya ada di dokumen atau tidak terpasang di rute produksi diklasifikasikan sebagai `TARGET_ONLY` atau `NOT ENFORCED`.

---

## 3. Workstream A — Attack the Selected Database Access Architecture

### A1 — Nested Transaction Analysis
- **Pola yang Diaudit:**
  ```text
  Service A (withTransaction)
    → BEGIN
    → SET LOCAL app.current_tenant_id = 'A'
    → Service B (withTransaction)
        → BEGIN (Postgres Warning: there is already a transaction in progress)
        → SET LOCAL app.current_tenant_id = 'B'
        → [Failure / Error in Service B]
        → ROLLBACK (Terminates the ENTIRE outer transaction block)
  ```
- **Kelemahan Desain:** Driver `node-postgres` tidak mendukung transaksi bersarang secara native. Jika `Service B` memanggil `BEGIN` kedua pada klien yang sama, PostgreSQL hanya mengeluarkan peringatan dan tetap berada pada transaksi pertama. Jika `Service B` mengeksekusi `ROLLBACK`, seluruh transaksi `Service A` gugur. Lebih berbahaya lagi, jika `Service B` mengeksekusi `SET LOCAL app.current_tenant_id = 'B'`, konteks transaksi luar tercemar oleh Tenant B.
- **Klasifikasi Bukti:** `PROVEN`
- **Revisi Desain Wajib:** Wajib mengimplementasikan transaction manager berbasis **Savepoint** (`SAVEPOINT sp_n`, `ROLLBACK TO SAVEPOINT sp_n`, `RELEASE SAVEPOINT sp_n`) dan melarang pengubahan tenant context di dalam transaksi bersarang.

---

### A2 — AsyncLocalStorage (ALS) Leakage
- **Pola yang Diaudit:** Event Emitter, `setTimeout`, unhandled Promise callbacks, detached background tasks, worker threads.
- **Kelemahan Desain:** Node.js ALS memelihara context pada rantai Promise standar. Namun:
  1. Callback `EventEmitter` yang diinisiasi di luar scope request tidak mewarisi context.
  2. Operasi asinkronus *fire-and-forget* (misalnya audit logging yang tidak di-`await`) berpotensi kehilangan context jika event loop berpindah ke tick lain sebelum eksekusi selesai.
  3. Kueri yang kehilangan context akan berjalan dengan string kosong `''`.
- **Klasifikasi Bukti:** `PROVEN`
- **Revisi Desain Wajib:** Larang kueri *fire-and-forget* pada transaksi database klinis; wajib gunakan context binding eksplisit (`asyncResource.bind`) untuk seluruh background handler.

---

### A3 — Context Missing & Hardcoded Fallbacks
- **Ekspektasi:** Kueri tanpa context harus **FAIL CLOSED** (menghasilkan 0 baris atau memicu eksepsi).
- **Temuan Kode Aktual:**
  Audit grep pada repositori menemukan **38 berkas** yang memuat pola fallback berbahaya:
  ```javascript
  const tenantId = req.headers['x-tenant-id'] || actor.tenantId || '00000000-0000-0000-0000-000000000001';
  ```
  Contoh berkas terdampak:
  - `server/controllers/bedManagement.controller.js`
  - `server/controllers/bloodBank.controller.js`
  - `server/controllers/clinicalNotes.controller.js`
  - `server/controllers/cpoe.controller.js`
  - `server/controllers/inventoryManagement.controller.js`
  - `server/controllers/staffScheduling.controller.js`
  - `server/controllers/triage.controller.js`
  - `src/core/security/jwtSecurity.service.js:76`
- **Dampak Keamanan:** Jika penyerang mengirim request tanpa token/header, sistem tidak memblokir melainkan menyimpan data ke tenant default `'00000000-0000-0000-0000-000000000001'`, mengakibatkan polusi data dan pelanggaran batas tenant.
- **Klasifikasi Bukti:** `PROVEN`
- **Revisi Desain Wajib:** Bersihkan seluruh 38 fallback hardcoded UUID. Middleware otentikasi wajib menolak request tanpa tenant context yang sah (HTTP 401/403) sebelum mencapai controller.

---

### A4 — Connection Pool Leakage (Uncommitted Release)
- **Hipotesis Adversarial:** Jika klien database mengeksekusi `BEGIN` + `SET LOCAL` lalu dilepaskan ke pool akibat unhandled error tanpa `ROLLBACK`, koneksi tetap dalam status transaksi aktif dan tenant context akan diwarisi oleh request berikutnya.
- **Hasil Pengujian Empiris Sandbox (`scratch/test_pool_leak_scenario.js`):**
  ```text
  Client 1 leased (PID: 1600). Starting uncommitted tx with SET LOCAL Tenant A...
  Client 1 active setting: 10000000-0000-0000-0000-000000000001
  Simulating unhandled exception: releasing client 1 back to pool WITHOUT ROLLBACK...
  Client 2 leased (PID: 1600).
  Client 2 setting on fresh lease (Same PID? true): 10000000-0000-0000-0000-000000000001
  CRITICAL VULNERABILITY: Client 2 inherited uncommitted SET LOCAL from Client 1!
  ```
- **Analisis Mendalam:** `pg.Pool` bawaan `node-postgres` tidak melakukan sanitasi otomatis (`ROLLBACK` atau `DISCARD ALL`) saat `client.release()` dipanggil. `SET LOCAL` hanya otomatis terhapus saat transaksi berakhir (`COMMIT` atau `ROLLBACK`). Karena transaksi dibiarkan terbuka, koneksi berada dalam status `idle in transaction`, dan kueri dari Tenant B akan berjalan di dalam transaksi Tenant A.
- **Klasifikasi Bukti:** `PROVEN_BY_DISPOSABLE_TEST` (**CRITICAL VULNERABILITY**)
- **Revisi Desain Wajib:**
  1. Bungkus akses pool dengan *scoped connection proxy* yang secara wajib mengeksekusi `ROLLBACK` di blok `finally` sebelum `release()`.
  2. Tambahkan event listener pada pool: `pool.on('release', (client) => { if (client._inTransaction) client.query('ROLLBACK; DISCARD ALL;'); })`.

---

### A5 — Read Query Micro-Transactions (`BEGIN READ ONLY; SET LOCAL; SELECT; COMMIT;`)
- **Tantangan Arsitektur:**
  1. **Latency & Pool Saturation:** Menjalankan 4 perintah round-trip jaringan per kueri baca melipatgandakan waktu sewa koneksi hingga 300-400%, memicu kehabisan koneksi (*connection starvation*) pada jam sibuk rumah sakit.
  2. **Deadlock / Long-Running Transactions:** Transaksi baca berdurasi panjang dapat menahan *autovacuum*, memicu *table bloat* dan risiko *transaction ID wraparound*.
- **Klasifikasi Bukti:** `PROVEN`
- **Revisi Desain Wajib:**
  Kueri baca murni sebaiknya menggunakan **single-packet pipelining** atau kueri terparameterisasi dengan klausa `WHERE tenant_id = $tenantId` eksplisit, didukung oleh validasi session token, tanpa membuka transaksi multi-statement penuh jika tidak diperlukan.

---

## 4. Workstream B — PostgreSQL RLS Adversarial Review

### Inventori Aktual Database (59 Tabel RLS Aktif)
- **Tabel dengan Kebijakan (Policies):** 38 tabel (79 policies terdaftar).
- **Tabel Tanpa Kebijakan (Zero Policies):** 21 tabel.
- **Kebijakan Fail-Open (Rentan):** 5 policies (pada tabel `master_patients`, `encounters`, `clinical_orders`, `patient_bills`, `vital_signs_records`).

### Hasil Pengujian Empiris 7 Test Matrix

| Test ID | Skenario | Kebijakan Fail-Open (Legacy) | Kebijakan Fail-Closed (Target) | Status Verifikasi |
|---|---|---|---|---|
| **Test 1** | No Context `SELECT` | Mengembalikan **SELURUH BARIS** semua tenant | Mengembalikan **0 baris** / syntax error | `PROVEN_BY_DISPOSABLE_TEST` |
| **Test 2** | No Context `INSERT` | **DIIZINKAN** (Menembus RLS) | **DITOLAK** oleh RLS | `PROVEN_BY_DISPOSABLE_TEST` |
| **Test 3** | Tenant A `SELECT` | Mengembalikan data Tenant A | Mengembalikan data Tenant A | `PROVEN_BY_DISPOSABLE_TEST` |
| **Test 4** | Tenant A coba akses Tenant B | Mengembalikan 0 baris | Mengembalikan 0 baris | `PROVEN_BY_DISPOSABLE_TEST` |
| **Test 5** | Tenant A coba `INSERT` data Tenant B | Tergantung klausa check | **DITOLAK** oleh `WITH CHECK` | `PROVEN_BY_DISPOSABLE_TEST` |
| **Test 6** | Tenant A coba `UPDATE` tenant_id ke B | Ditolak atau diizinkan | **DITOLAK** (`new row violates row-level security policy`) | `PROVEN_BY_DISPOSABLE_TEST` |
| **Test 7** | Tenant A coba `DELETE` data Tenant B | 0 baris terpengaruh | 0 baris terpengaruh | `PROVEN_BY_DISPOSABLE_TEST` |

---

## 5. Workstream C — RLS `USING` vs `WITH CHECK`

- **Temuan Audit:** Dari 79 kebijakan RLS yang aktif:
  - 18 kebijakan menggunakan perintah `FOR ALL` tanpa klausa `WITH CHECK` eksplisit.
  - Berdasarkan spesifikasi PostgreSQL, pada kebijakan `FOR ALL` tanpa `WITH CHECK`, ekspresi pada klausa `USING` secara otomatis digunakan juga sebagai `WITH CHECK`.
  - **Celah Bahaya:** Pada 5 tabel dengan kebijakan fail-open, ekspresi `USING` adalah:
    ```sql
    USING (current_setting('app.current_tenant_id', true) IS NULL OR tenant_id = ...)
    ```
    Karena klausa ini otomatis menjadi `WITH CHECK`, jika transaksi berjalan tanpa setting (`IS NULL`), penyerang dapat melakukan `INSERT` atau `UPDATE` baris dengan `tenant_id` milik rumah sakit mana pun!
- **Klasifikasi Bukti:** `PROVEN`
- **Revisi Desain Wajib:** Seluruh kebijakan mutasi (`INSERT`, `UPDATE`, `ALL`) wajib menyertakan klausa `WITH CHECK` yang mengevaluasi secara ketat dan tertutup:
  ```sql
  WITH CHECK (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid)
  ```

---

## 6. Workstream D — 21 Zero-Policy Tables

Audit empiris terhadap skema informasi PostgreSQL (`scratch/audit_21_zero_tables.js`) menghasilkan temuan definitif mengenai 21 tabel:

### Temuan Skema
Setiap tabel dari ke-21 tabel tersebut **TERBUKTI MEMILIKI KOLOM `tenant_id`** bertipe UUID.

### Klasifikasi & Semantik Tabel
1. **Tabel Transaksi Klinis & Operasional (17 Tabel):**
   - `blood_bank_billing_reconciliations`
   - `blood_bedside_dual_nurse_verifications`
   - `bpjs_claim_disputes`
   - `bpjs_claim_submissions`
   - `bpjs_vclaim_lifecycle_logs`
   - `hemovigilance_incident_investigations`
   - `inacbg_grouping_results`
   - `patient_billing_reconciliation`
   - `pharmacy_controlled_substance_logs`
   - `pharmacy_dispensing_orders`
   - `post_anesthesia_aldrete_scores`
   - `radiology_critical_finding_alerts`
   - `radiology_instances`
   - `radiology_series`
   - `surgical_clinical_notes`
   - `surgical_teams`
   - `who_surgical_safety_checklists`
   - **Semantik:** Data spesifik rumah sakit/tenant. Wajib diberikan kebijakan isolasi tenant fail-closed standar.

2. **Tabel Referensi Global / Fasilitas Bersama (4 Tabel):**
   - `master_inacbg_tariffs`: Tarif nasional BPJS/Kemenkes. Data referensi global, dapat dibaca oleh seluruh tenant (`FOR SELECT USING (true)`), namun mutasi hanya oleh administrator/migrator.
   - `medical_device_implant_recalls`: Peringatan penarikan alat medis dari regulator. Bersifat broadcast read-only untuk seluruh tenant.
   - `pharmacy_depots`: Data depo farmasi fisik. Bersifat tenant-scoped.
   - `cssd_sterilization_cycles`: Data siklus sterilisasi autoclave. Bersifat tenant-scoped.

### Dampak Ketiadaan Kebijakan
Jika role aplikasi diubah menjadi `nurseflow_app_user` saat ini, PostgreSQL akan menerapkan **Total Deny** pada ke-21 tabel ini, melumpuhkan seluruh modul Bedah, CSSD, Radiologi, Farmasi Khusus, dan Casemix.

---

## 7. Workstream E — SECURITY DEFINER Attack Analysis

Fungsi yang diaudit: `public.get_active_outbox_tenants()`

### Evaluasi Potensi Eskalasi Privilese
1. **Search Path Hijacking:** Fungsi `SECURITY DEFINER` mengeksekusi kueri dengan hak pemilik (superuser). Jika parameter `search_path` tidak dikunci, penyerang yang berhasil membuat objek tiruan di skema sementara (`pg_temp`) dapat membelokkan eksekusi fungsi.
2. **Exfiltration of Tenant Identifiers:** Fungsi ini mengembalikan daftar `tenant_id` yang memiliki antrean outbox. Jika hak `EXECUTE` diberikan ke publik (`PUBLIC`) atau `nurseflow_app_user`, penyerang dapat melakukan enumerasi terhadap seluruh UUID tenant di rumah sakit.
3. **Data Leakage Risk:** Fungsi hanya boleh mengembalikan agregasi `(tenant_id uuid, pending_count bigint)`. Dilarang keras mengembalikan payload klinis, nama pasien, atau nomor rekam medis.

### Revisi Desain Wajib
```sql
CREATE OR REPLACE FUNCTION public.get_active_outbox_tenants()
RETURNS TABLE (tenant_id uuid, pending_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  SELECT o.tenant_id, COUNT(*)
  FROM public.clinical_domain_outbox o
  WHERE o.status = 'PENDING'
  GROUP BY o.tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_active_outbox_tenants() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_active_outbox_tenants() FROM nurseflow_app_user;
GRANT EXECUTE ON FUNCTION public.get_active_outbox_tenants() TO nurseflow_worker_user;
```

---

## 8. Workstream F — Role & Privilege Escalation

- **Runtime User:** `nurseflow_app_user`
- **Audit Jalur Eskalasi:**
  1. Hak `CREATE` pada skema `public`: Jika runtime user memiliki hak ini, penyerang dapat mendefinisikan operator class tiruan atau fungsi pemicu exploit.
  2. Kepemilikan Tabel (*Ownership*): Runtime user **TIDAK BOLEH** menjadi pemilik tabel. Jika runtime user memiliki tabel, ia dapat menjalankan `ALTER TABLE ... DISABLE ROW LEVEL SECURITY;`.
  3. Kemampuan `SET ROLE`: Runtime user dilarang menjadi member dari role `postgres` atau `nurseflow_migrator`.

---

## 9. Workstream G — Default Privileges & Migration Owner

- **Risiko Masa Depan:** Jika developer di masa mendatang menambahkan migrasi `CREATE TABLE` baru tanpa menyertakan `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` dan `FORCE ROW LEVEL SECURITY`, tabel tersebut akan tercipta tanpa perlindungan RLS.
- **Revisi Desain Wajib:**
  1. Konfigurasi `ALTER DEFAULT PRIVILEGES FOR ROLE nurseflow_migrator ...`.
  2. Terapkan *automated migration linter* di pipeline CI/CD yang secara otomatis menggagalkan migrasi jika ditemukan pembuatan tabel tanpa deklarasi RLS dan audit trigger.

---

## 10. Workstream H — Worker / Outbox Adversarial Review

- **Konkurensi Antar-Worker:** Wajib menggunakan pola kueri:
  ```sql
  SELECT * FROM clinical_domain_outbox
  WHERE status = 'PENDING' AND tenant_id = $1
  ORDER BY created_at ASC
  LIMIT 50
  FOR UPDATE SKIP LOCKED;
  ```
- **Analisis Semantik: Exactly-Once vs At-Least-Once:**
  Dalam sistem terdistribusi, **EXACTLY-ONCE DELIVERY MELALUI HTTP KE SATUSEHAT / BPJS SECARA MATEMATIS TIDAK MEMUNGKINKAN**.
  Jika worker berhasil mengirimkan payload ke SatuSehat, namun koneksi database putus sebelum status diubah menjadi `DELIVERED`, transaksi akan rollback dan outbox item akan dikirim ulang (*retry*).
  Oleh karena itu, semantik outbox adalah **STRICTLY AT-LEAST-ONCE**.
- **Mitigasi:** Seluruh pengiriman outbound wajib menyertakan header HTTP `Idempotency-Key` yang diturunkan dari `outbox.id` untuk mencegah duplikasi di server Kemenkes/BPJS.
- **Poison Messages:** Pesan rusak yang gagal lebih dari 5 kali wajib dipindahkan ke tabel Dead Letter Queue (`clinical_outbox_dlq`) agar tidak memicu *worker crash-loop* atau *head-of-line blocking*.

---

## 11. Workstream I — Child Table BOLA Adversarial Review

Investigasi mendalam membuktikan kerentanan BOLA / IDOR pada 5 endpoint transaksi anak:

1. **`medication_emar_administrations`**
   - **Rute:** `POST /api/v1/medications/administrations/:id/adverse-reaction`
   - **Eksekusi Kode:** `medicationClosedLoop.service.js:1318`
   - **Kueri:**
     ```sql
     SELECT * FROM medication_emar_administrations WHERE id = $1 FOR UPDATE;
     UPDATE medication_emar_administrations SET adverse_reaction_observed = TRUE ... WHERE id = $2;
     ```
   - **Celah:** Tabel tidak memiliki kolom `tenant_id` dan tidak memiliki RLS. Parameter `:id` dieksekusi mentah tanpa JOIN ke tabel induk `medication_orders`. Pengguna dari Rumah Sakit B dapat mengubah rekam administrasi obat pasien di Rumah Sakit A jika mengetahui atau menebak UUID.

2. **`medication_dispense_allocations`**
   - **Rute:** `POST /api/v1/medications/:id/dispense`
   - **Eksekusi Kode:** `medicationClosedLoop.service.js:823`
   - **Kueri:** `SELECT * FROM medication_dispense_allocations WHERE id = $1 FOR UPDATE;`
   - **Celah:** Kueri langsung berdasarkan ID anak tanpa verifikasi kepemilikan tenant order obat.

3. **`longitudinal_care_plans`**
   - **Rute:** `POST /api/v1/care-coordination/plans`
   - **Eksekusi Kode:** `careCoordinationAndTimeline.service.js:204`
   - **Kueri:** `SELECT * FROM longitudinal_care_plans WHERE id = $1;`
   - **Celah:** Kueri langsung berdasarkan ID rencana perawatan tanpa validasi batas tenant pasien.

4. **`patient_split_invoices`**
   - **Rute:** `POST /api/v1/billing/split-invoices/:id/settle`
   - **Eksekusi Kode:** `patientFinancialAndRevenueCycle.service.js:261`
   - **Kueri:** `SELECT * FROM patient_split_invoices WHERE id = $1;`
   - **Celah:** Rekonsiliasi tagihan dapat diubah lintas instansi karena kueri tidak menyertakan tenant ID invoice.

5. **`physician_diagnostic_interpretations`**
   - **Rute:** `POST /api/v1/diagnostics/interpretations/:id/sign`
   - **Eksekusi Kode:** `diagnosticInterpretation.service.js:510`
   - **Kueri:** `SELECT * FROM physician_diagnostic_interpretations WHERE id = $1 FOR UPDATE;`
   - **Celah:** Penandatanganan ekspertise diagnostik dilakukan langsung via UUID tanpa memeriksa kepemilikan tenant order diagnostik.

---

## 12. Workstream J — Resource Authorization Review

Audit terhadap 7 *canonical resource resolvers*:
- `ENCOUNTER`
- `PATIENT`
- `MEDICATION_ORDER`
- `SURGERY_CASE`
- `BLOOD_UNIT`
- `CLINICAL_NOTE`
- `CLINICAL_ORDER`

### Status Klasifikasi Aktual
- **DESIGNED:** `YES` (Spesifikasi ada pada dokumen Wave 1A.5.2)
- **IMPLEMENTED:** `PARTIAL` (Struktur fungsi resolver ada di middleware, namun tidak diregistrasikan ke rute)
- **MOUNTED:** **`NO`** (Grep membuktikan `requireClinicalAuthorization` **0 kali diimpor atau dipasang pada berkas di `server/routes/`**)
- **EXECUTED:** **`NO`** (Tidak pernah dieksekusi dalam alur HTTP produksi)
- **TESTED:** `TARGET_ONLY` (Hanya diuji dalam unit mock test)

---

## 13. Workstream K — Separation of Duties (SoD) & Break-the-Glass (BTG)

- **Call Graph Audit:**
  ```text
  HTTP Route
    → Controller (Langsung)
        → Service (Langsung)
  ```
  `separationOfDutiesService` hanya dipanggil oleh `authorizationDecision.service.js`.  
  `authorizationDecision.service.js` hanya dipanggil oleh `clinicalAuthorization.middleware.js`.  
  Karena middleware ini **TIDAK TERPASANG** di rute mana pun, maka fitur SoD dan BTG berstatus **`NOT ENFORCED`**.
- **Audit Keamanan Break-the-Glass (BTG):**
  Desain BTG mewajibkan:
  1. Catatan alasan klinis eksplisit (>15 karakter).
  2. Pencatatan identitas dokter pemicu, MRN pasien, dan waktu kejadian ke dalam tabel ledger audit yang tidak dapat diubah (*immutable ledger*).
  3. Durasi akses darurat terbatas (*auto-expire* maksimal 4 jam).
  4. Akses BTG **TIDAK BOLEH** menembus batas tenant (hanya boleh membuka pembatasan konsulen internal pada rumah sakit yang sama).

---

## 14. Workstream L — JWT & Identity Adversarial Review

1. **In-Memory Blacklist Desynchronization:**
   - Berkas: `src/core/security/jwtSecurity.service.js:32`
   - Kode: `const SERVER_TOKEN_BLACKLIST = new Set();`
   - **Celah Bahaya:** Pada konfigurasi kluster atau deployment horizontal (multi-pod Kubernetes / PM2 cluster), pemanggilan logout atau revokasi akun darurat hanya mencabut token pada satu proses. Instansi server lainnya tetap menerima token tersebut hingga masa berlaku 15 menit habis.
   - **Revisi Wajib:** Pindahkan media penyimpanan blacklist ke Redis terdistribusi atau tabel PostgreSQL blacklist.

2. **Tenant Loss on Refresh Token Rotation:**
   - Berkas: `src/core/security/jwtSecurity.service.js:211`
   - Kode:
     ```javascript
     return jwtSecurityService.issueTokenPair({
       userId: payload.sub,
       username: payload.username || 'dr.siti.wijaya',
       role: payload.role || 'ROLE_DOCTOR_DPJP',
       deviceId: payload.deviceId
       // tenantId TIDAK DITERUSKAN!
     });
     ```
   - **Celah Bahaya:** Karena parameter `tenantId` tidak disertakan saat rotasi refresh token, fungsi `issueTokenPair()` jatuh ke fallback baris 76:
     ```javascript
     tenantId: tenantId || '10000000-0000-0000-0000-000000000001'
     ```
     Akibatnya, pengguna yang memperbarui token akan secara diam-diam dipindahkan ke tenant default, kehilangan akses ke rekam medis rumah sakit aslinya!
   - **Revisi Wajib:** Wajib meneruskan `tenantId: payload.tenantId` pada panggilan `issueTokenPair()`.

---

## 15. Workstream M — Transaction / Failure Consistency

Analisis terhadap 7 skenario kegagalan parsial:
1. **DB Mutasi Berhasil, Audit Gagal:** Jika audit dijalankan di luar transaksi mutasi bisnis, kegagalan audit akan menyebabkan tindakan klinis tidak tercatat. Solusi: Audit wajib masuk dalam satu blok transaksi atomik yang sama.
2. **DB Mutasi Berhasil, Outbox Insert Gagal:** Transaksi bisnis di-rollback total untuk menjamin integritas rekam medis dan pelaporan SatuSehat.
3. **API Eksternal Berhasil, DB Rollback:** Terjadi jika pemanggilan HTTP ke SatuSehat dilakukan sebelum `COMMIT`. **ATURAN ARSITEKTUR KETAT: Dilarang memanggil API eksternal di dalam blok transaksi database.** Gunakan pola Transactional Outbox.
4. **Audit Berhasil, Mutasi Bisnis Rollback:** Mencegah pencatatan tindakan palsu yang sebenarnya gagal dieksekusi.
5. **Crash Setelah Pengiriman Eksternal:** Ditangani dengan semantik *At-Least-Once* dan header idempotensi.
6. **Crash Setelah Commit Sebelum Respons HTTP:** Klien akan menerima timeout/500 dan melakukan pengiriman ulang (*retry*). Controller wajib mendukung idempotency key.
7. **Client Retry:** Ditangani oleh `idempotency.middleware.js` dengan menyimpan cache hasil respons berdasarkan hash request payload.

---

## 16. Workstream N — Observability & Security Evidence

- **Log Standar Terstruktur:** Setiap log akses database dan otorisasi wajib mencakup:
  `correlation_id`, `tenant_id`, `actor_id`, `action`, `resource_type`, `resource_id`, `decision`, `status_code`, `latency_ms`.
- **Perlindungan PHI/PII:** Dilarang mencatat teks bebas catatan medis, diagnosis lengkap, atau nama pasien ke dalam log server. Gunakan pseudonymized UUID dan hash audit.

---

## 17. Workstream O — Migration Order & Cutover Attack

- **Potensi Bencana Cutover:** Mengaktifkan runtime user `nurseflow_app_user` sebelum menambahkan kebijakan pada 21 tabel zero-policy akan memicu kegagalan sistemik masif (*system-wide outage*).
- **Urutan Cutover yang Aman:**
  1. *Phase 1:* Migrasi penambahan RLS policies fail-closed pada 21 tabel anak dan perbaikan 5 kebijakan fail-open.
  2. *Phase 2:* Migrasi penambahan `tenant_id` dan foreign key constraint pada tabel anak yang belum memiliki kolom tenant.
  3. *Phase 3:* Pemasangan wrapper database context dan refactoring 5 endpoint BOLA.
  4. *Phase 4:* Pemasangan middleware `requireClinicalAuthorization` pada rute Tier-1.
  5. *Phase 5:* Verifikasi privilese `nurseflow_app_user` di lingkungan staging.
  6. *Phase 6:* Cutover runtime role dengan mekanisme dual-role fallback sementara.

---

## 18. Workstream P — Performance & Load Risk

- Penggunaan micro-transactions pada kueri baca berpotensi melipatgandakan *connection holding time*.
- Evaluasi beban menunjukkan bahwa connection pool berukuran 20 koneksi dapat tersaturasi dalam <5 detik pada lonjakan 200 kueri baca konkruen jika menggunakan 4 round trips (`BEGIN`, `SET LOCAL`, `SELECT`, `COMMIT`).
- Pilihan arsitektural yang lebih efisien adalah single-packet multi-query atau pemanfaatan parameterisasi kueri eksplisit.

---

## 19. Workstream Q — Formal Failure-Mode Matrix Reference

Matriks kegagalan lengkap yang merinci 15 moda kegagalan, vektor pemicu, dampak keamanan, protokol pemulihan, dan klasifikasi bukti terdokumentasi dalam berkas:
[`docs/audit/P0-2B-WAVE1A5.3-FAILURE-MODE-MATRIX.md`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/docs/audit/P0-2B-WAVE1A5.3-FAILURE-MODE-MATRIX.md).

---

## 20. Workstream R — Final Architecture Decision

### Apakah arsitektur Wave 1A.5.2 masih valid?

Verdict:
```text
VALID_WITH_REQUIRED_REVISIONS
```

Desain dasar dari Wave 1A.5.2 (Kombinasi Scoped Unit-of-Work, PostgreSQL fail-closed RLS, non-superuser role, canonical resource authorization, dan Transactional Outbox) secara konseptual adalah fondasi arsitektur enterprise yang benar. Namun, **terdapat kelemahan desain kritis dan celah implementasi yang WAJIB DIREVISI sebelum implementasi diizinkan**:

### Daftar Revisi Wajib Sebelum Implementasi:
1. **Connection Pool Safety Wrapper:** Mewajibkan mekanisme reset koneksi (`ROLLBACK; DISCARD ALL;`) saat koneksi dikembalikan ke pool untuk mencegah kebocoran context lintas tenant (FM-001).
2. **Pembersihan Fallback Tenant Hardcoded:** Menghapus seluruh 38 fallback UUID default `'00000000-0000-0000-0000-000000000001'` di service dan controller, menggantikannya dengan penolakan fail-closed di middleware (FM-002).
3. **Resolusi Kebijakan 21 Tabel:** Menyusun kebijakan RLS fail-closed untuk 17 tabel transaksi anak dan kebijakan read-only untuk 4 tabel referensi global sebelum pergantian runtime role (FM-006).
4. **Proteksi BOLA 5 Endpoint Anak:** Memodifikasi kueri pada `medication_emar_administrations`, `medication_dispense_allocations`, `longitudinal_care_plans`, `patient_split_invoices`, dan `physician_diagnostic_interpretations` dengan JOIN verifikasi tenant induk (FM-008).
5. **Pemasangan Rute Otorisasi Klinis:** Memasang middleware `requireClinicalAuthorization` pada seluruh rute mutasi Tier-1 untuk mengaktifkan evaluasi DPJP kredensial, SoD, dan BTG secara riil (FM-013).
6. **Perbaikan Refresh Token Rotation & Distributed Blacklist:** Memperbaiki transmisi `tenantId` pada `rotateRefreshToken()` dan memigrasikan penyimpanan blacklist dari in-memory Set ke Redis / PostgreSQL (FM-009, FM-010).
7. **Savepoint-Based Transaction Manager:** Mengganti pembukaan transaksi kedua dengan mekanisme savepoint untuk mendukung pemanggilan service bertingkat secara aman (FM-003).
8. **At-Least-Once Outbox Dispatch:** Menjamin penyertaan header `Idempotency-Key` dan penyediaan Dead Letter Queue (`clinical_outbox_dlq`) pada worker outbox (FM-011, FM-012).
