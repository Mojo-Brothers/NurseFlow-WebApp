# P0-2B — WAVE 1B.2 C2 DIAGNOSTICS IMPLEMENTATION PLAN
## Authoritative Technical Implementation Blueprint for Candidate C2 (Diagnostics)

---

## 1. EXECUTIVE SUMMARY & AUTHORITATIVE DECISION BASELINE

`[FACT]` **Human Owner Decision:**
Sesuai dengan keputusan otoritatif dari **Human Owner**, domain **Candidate C2 (Diagnostics)** telah dipilih secara resmi untuk memasuki fase perencanaan implementasi (*implementation planning*):

```text
Candidate Selected    : C2
Domain                : Diagnostics
Wave                  : P0-2B Wave 1B.2
Decision Status       : APPROVED TO PLAN
Implementation Status : NOT YET APPROVED / NOT STARTED
```

`[FACT]` **Mandat dan Batasan Dokumen:**
- Dokumen ini adalah **Blueprint Implementasi Teknis** (*Implementation Blueprint*) yang berfokus secara eksklusif pada Candidate C2.
- **TIDAK ADA PERUBAHAN KODE PRODUKSI** (`server/`, `src/`), migrasi (`database/migrations/`), skema (`database/schema/`), pengujian (`tests/`), maupun catatan perubahan (`docs/CHANGELOG_PERUBAHAN_HIS.md`) yang dilakukan pada tahap ini.
- Status gerbang keamanan repositori tetap terkunci: **`STAGE 0: NO-GO | PRODUCTION: BLOCKED | WAVE 1B.2: NOT STARTED`**.
- Status eksekusi implementasi: **`NOT YET APPROVED`** (menunggu persetujuan eksplisit Human Owner atas blueprint ini).

`[FACT]` **Locked Evidence Baseline (Candidate C2):**
- **Berkas Layanan Utama:** `server/services/diagnosticInterpretation.service.js`
- **Berkas Kontroler Utama:** `server/controllers/diagnosticInterpretation.controller.js`
- **Berkas Rute HTTP:** `server/routes/diagnosticInterpretation.routes.js`
- **Total Static AST DB Call Sites:** **38** (9 Writes, 29 Reads)
- **Stage-0 Unsafe Call Sites:** **11** (CS 72 hingga CS 82)
- **Rute HTTP Terdaftar:** **4 Rute** (3 Active Stage-0 Routes, 1 Zero Stage-0 Route)
- **Tabel Stage-0 yang Disentuh (4 Tabel):** `encounters`, `physician_diagnostic_interpretations`, `clinical_orders`, `universal_audit_logs`
- **Stage-0 Writes:** **3** | **Stage-0 Reads:** **8**
- **Pengujian Real PostgreSQL RLS Eksisting:** **0** (suite eksisting `verticalSlice09DiagnosticInterpretationDurability.test.js` adalah *mocked database persistence slice*)
- **Cacat C2 Terverifikasi (CS 82):** `server/services/diagnosticInterpretation.service.js:528` menghilangkan kolom `tenant_id` pada `INSERT INTO clinical_orders`. Status: `VERIFIED CURRENT DEFECT / NOT FIXED`.
- **Regresi Kanonik:** **81/81 PASS**.

---

## 2. ABSOLUTE SCOPE LOCK

Implementation Plan ini mengunci batasan pekerjaan teknis secara ketat:

### IN SCOPE (Eksklusif Candidate C2)
1. Perbaikan dan pengamanan modul layanan `server/services/diagnosticInterpretation.service.js`.
2. Pengamanan kontroler `server/controllers/diagnosticInterpretation.controller.js` dengan gerbang L1 fail-closed.
3. Remediasi seluruh **11 Stage-0 Unsafe Call Sites** (CS 72 hingga CS 82) ke dalam batas transaksi `withUnitOfWork`.
4. Remediasi cacat **CS 82**: penyertaan eksplisit kolom dan parameter `tenant_id` pada `INSERT INTO clinical_orders`.
5. Penegakan isolasi multi-tenant PostgreSQL RLS pada 4 tabel Stage-0 yang disentuh (`encounters`, `physician_diagnostic_interpretations`, `clinical_orders`, `universal_audit_logs`).
6. Penghapusan seluruh fallback *mock actor* dan penerimaan parameter tenant tanpa validasi pada alur request produksi C2.
7. Pembuktian atomisitas transaksi, rollback tanpa mutasi parsial, dan ketiadaan kebocoran konteks tenant (*zero tenant context bleed*) pada daur ulang koneksi (*connection reuse*).
8. Pembuatan suite pengujian integrasi Real PostgreSQL RLS baru untuk C2 (Skenario C2-RLS-01 hingga C2-RLS-09).
9. Pemeliharaan suite pengujian regresi kanonik baseline (81/81 PASS) dan suite pengujian durabilitas mock C2 eksisting (25/25 scenarios).
10. Penutupan evidensi kepatuhan (*evidence closure*).

### OUT OF SCOPE (Terlarang Dimodifikasi)
1. **Candidate A** (Queue / Appointments: `appointment.controller.js`, `appointmentQueue.service.js`).
2. **Candidate B** (Medication Closed-Loop: `medicationClosedLoop.service.js`).
3. **Candidate C1** (CPOE Orders & Safety: `cpoeApplication.service.js`, `safetyAuthorization.service.js`).
4. **Candidate D** (Master Patient: `patientApplication.service.js`, `patient.controller.js`).
5. Seluruh 134 unsafe Stage-0 call sites milik kandidat lain.
6. Seluruh 29 tabel Stage-0 lain yang tidak terkait langsung dengan domain diagnostik.
7. Penambahan fitur klinis baru atau ekspansi fungsionalitas bisnis.
8. Redesain antarmuka (UI/UX) atau berkas frontend (`src/`).
9. Redesain skema database atau penulisan migrasi DDL baru (skema database sudah menyediakan kolom `tenant_id UUID NOT NULL` pada `clinical_orders` sejak Migration 009).
10. Refactoring opportunistik atau penghapusan kode yang tidak aktif (*dormant code*).

---

## 3. CURRENT C2 EXECUTION MODEL (AS-IS RECONSTRUCTION)

Berdasarkan penelusuran kode sumber aktual pada repositori, alur eksekusi Candidate C2 saat ini berjalan sebagai berikut:

```text
HTTP Request
   ↓
[Route] server/routes/diagnosticInterpretation.routes.js (authenticateJwt)
   ↓
[Controller] server/controllers/diagnosticInterpretation.controller.js
   ↓ (FAIL-OPEN: Mock actor fallback jika req.user kosong; req.tenantId TIDAK DIPERIKSA)
[Service] server/services/diagnosticInterpretation.service.js
   ↓ (RAW POOL: postgresPoolService.getPool().connect(); manual BEGIN / COMMIT / ROLLBACK)
[Database] PostgreSQL 16 (app.current_tenant_id GUC TIDAK PERNAH DISET)
   ↓
[Stage-0 Tables] encounters, physician_diagnostic_interpretations, clinical_orders, universal_audit_logs
```

### Rincian Profil 4 Rute HTTP Candidate C2 Saat Ini:

| No | Metode | Rute Express | Fungsi Kontroler | Fungsi Layanan | Call Sites Disentuh | Tabel Stage-0 | Operasi | Batas Transaksi Saat Ini | Sumber Konteks Tenant | Perilaku Fallback Saat Ini |
|:---:|:---:|---|---|---|:---:|---|:---:|---|---|---|
| 1 | `POST` | `/api/v1/diagnostics/notifications` | `publishNotification` | `publishDiagnosticNotification` | CS 72, 73, 74, 75 | `encounters` | READ (Lock) | Manual `BEGIN READ COMMITTED` | `TIDAK ADA` | `req.user` fallback ke mock `USR-LAB-01` (Fail-Open) |
| 2 | `POST` | `/api/v1/diagnostics/notifications/:id/acknowledge` | `acknowledgeNotification` | `acknowledgeDiagnosticNotification` | *None (Non-Stage-0)* | *None* | READ/WRITE | Manual `BEGIN READ COMMITTED` | `TIDAK ADA` | `req.user` fallback ke mock `DOC-DPJP-01` (Fail-Open) |
| 3 | `POST` | `/api/v1/diagnostics/notifications/:id/interpret` | `recordInterpretation` | `recordPhysicianInterpretation` | CS 76, 77 | `physician_diagnostic_interpretations`, `universal_audit_logs` | WRITE | Manual `BEGIN READ COMMITTED` | `TIDAK ADA` | `req.user` fallback ke mock `DOC-DPJP-01` (Fail-Open) |
| 4 | `POST` | `/api/v1/diagnostics/interpretations/:id/actions` | `executeSecondaryAction` | `executeSecondaryClinicalAction` | CS 78, 79, 80, 81, 82 | `physician_diagnostic_interpretations`, `clinical_orders` | READ, WRITE | Manual `BEGIN READ COMMITTED` | `TIDAK ADA` | `req.user` fallback ke mock `DOC-DPJP-01` (Fail-Open) |

---

## 4. C2 STAGE-0 CALL-SITE MANIFEST (11 CALL SITES)

Berikut adalah manifes lengkap ke-11 Stage-0 Unsafe Call Sites milik Candidate C2 yang diverifikasi dari baseline evidensi:

| CS ID | Berkas Sumber | Baris Aktual | Operasi SQL Statis | Tabel Stage-0 | R/W | HTTP Reachable | Rute Pemicu | Transaksi Saat Ini | Konteks Tenant Saat Ini | Target UoW Boundary |
|:---:|---|:---:|---|---|:---:|:---:|---|---|---|---|
| **CS 72** | `diagnosticInterpretation.service.js` | 82 | `pool.connect()` (Blok encounter) | `encounters` | READ | YES | `POST .../notifications` | Manual client checkout | `ABSENT` (GUC tidak diset) | `withUnitOfWork` |
| **CS 73** | `diagnosticInterpretation.service.js` | 83 | `client.connect()` socket acquisition | `encounters` | READ | YES | `POST .../notifications` | Manual client checkout | `ABSENT` (GUC tidak diset) | `withUnitOfWork` |
| **CS 74** | `diagnosticInterpretation.service.js` | 86 | `BEGIN ISOLATION LEVEL READ COMMITTED;` | `encounters` | READ | YES | `POST .../notifications` | Manual transaction start | `ABSENT` (GUC tidak diset) | `withUnitOfWork` |
| **CS 75** | `diagnosticInterpretation.service.js` | 89 | `SELECT * FROM encounters WHERE id = $1 FOR UPDATE;` | `encounters` | READ | YES | `POST .../notifications` | Manual row lock | `ABSENT` (GUC tidak diset) | `withUnitOfWork` |
| **CS 76** | `diagnosticInterpretation.service.js` | 416 | `UPDATE diagnostic_result_notifications` (Audit prep) | `universal_audit_logs` | WRITE | YES | `POST .../interpret` | Manual transaction block | `ABSENT` (GUC tidak diset) | `withUnitOfWork` |
| **CS 77** | `diagnosticInterpretation.service.js` | 424 | `INSERT INTO universal_audit_logs (...) VALUES (...);` | `universal_audit_logs` | WRITE | YES | `POST .../interpret` | Manual audit insert | `ABSENT` (GUC tidak diset) | `withUnitOfWork` |
| **CS 78** | `diagnosticInterpretation.service.js` | 504 | `pool.connect()` (Blok secondary action) | `physician_diagnostic_interpretations` | READ | YES | `POST .../actions` | Manual client checkout | `ABSENT` (GUC tidak diset) | `withUnitOfWork` |
| **CS 79** | `diagnosticInterpretation.service.js` | 505 | `client.connect()` socket acquisition | `physician_diagnostic_interpretations` | READ | YES | `POST .../actions` | Manual client checkout | `ABSENT` (GUC tidak diset) | `withUnitOfWork` |
| **CS 80** | `diagnosticInterpretation.service.js` | 508 | `BEGIN ISOLATION LEVEL READ COMMITTED;` | `physician_diagnostic_interpretations` | READ | YES | `POST .../actions` | Manual transaction start | `ABSENT` (GUC tidak diset) | `withUnitOfWork` |
| **CS 81** | `diagnosticInterpretation.service.js` | 510 | `SELECT * FROM physician_diagnostic_interpretations WHERE id = $1 FOR UPDATE;` | `physician_diagnostic_interpretations` | READ | YES | `POST .../actions` | Manual row lock | `ABSENT` (GUC tidak diset) | `withUnitOfWork` |
| **CS 82** | `diagnosticInterpretation.service.js` | 528 | `INSERT INTO clinical_orders (...) VALUES (...);` [OMITS `tenant_id`] | `clinical_orders` | WRITE | YES | `POST .../actions` | Manual DML insert | `DEFECTIVE` (Omits `tenant_id`) | `withUnitOfWork` + Explicit `tenant_id` |

*Catatan Rekonsiliasi Baris:* Baris kode di atas 100% identik dengan baseline beku pada `scratch/p02b_final_evidence_lock.json` dan `docs/audit/P0-2B-ROUTE-EXECUTION-PATH-VERIFICATION.md` (Zero line drift).

---

## 5. ACTIVE HTTP ROUTES VS ZERO STAGE-0 ROUTES

Candidate C2 memiliki 4 rute HTTP yang terdaftar pada `server/routes/diagnosticInterpretation.routes.js`. Pemisahan arsitektural yang ketat membuktikan:

1. **Active Stage-0 HTTP Routes (3 Rute):**
   - `POST /api/v1/diagnostics/notifications` (Mengeksekusi SQL terhadap `encounters`).
   - `POST /api/v1/diagnostics/notifications/:id/interpret` (Mengeksekusi SQL terhadap `physician_diagnostic_interpretations` dan `universal_audit_logs`).
   - `POST /api/v1/diagnostics/interpretations/:id/actions` (Mengeksekusi SQL terhadap `physician_diagnostic_interpretations` dan `clinical_orders`).
2. **Zero Stage-0 HTTP Routes (1 Rute):**
   - `POST /api/v1/diagnostics/notifications/:id/acknowledge` (Hanya mengeksekusi SQL terhadap tabel Non-Stage-0 `diagnostic_result_notifications`).
   - *Prinsip:* Walaupun rute ini tidak mengakses tabel Stage-0 secara langsung, gerbang fail-closed L1 tetap wajib diterapkan untuk mencegah eksekusi tanpa tenant konteks pada domain diagnostik.

---

## 6. TARGET ARCHITECTURE & FAIL-CLOSED TENANT GATE

### Target Execution Path
Seluruh request HTTP yang masuk ke domain Candidate C2 wajib melalui pipa keamanan berjenjang (*layered defense-in-depth*):

```text
HTTP Request
   ↓
[1] authenticateJwt Middleware (Ekstraksi Token JWT)
   ↓
[2] Fail-Closed L1 Controller Gate (Validasi req.tenantId && isValidUuid)
   │  ├── Absent / Invalid -> HTTP 403 TENANT_CONTEXT_REQUIRED (Eksekusi berhenti)
   │  └── Valid -> Lanjut ke lapisan domain
   ↓
[3] Authorization / Role Check (Pemeriksaan wewenang klinis aktor: LAB_TECH / DPJP)
   ↓
[4] Unit of Work Boundary (withUnitOfWork)
   │  ├── Akuisisi koneksi database dari pool
   │  ├── BEGIN ISOLATION LEVEL READ COMMITTED
   │  ├── SET LOCAL app.current_tenant_id = $1 (true)
   │  ├── SET LOCAL app.current_user_id = $2 (true)
   │  └── SET LOCAL app.current_user_role = $3 (true)
   ↓
[5] Service Domain Operation (diagnosticInterpretation.service.js)
   │  ├── Operasi DML / SELECT berjalan menggunakan client UoW
   │  └── CS 82 Remediated: INSERT INTO clinical_orders menyertakan tenant_id eksplisit
   ↓
[6] PostgreSQL 16 Row-Level Security Enforcement
   │  ├── RLS Policy memeriksa current_setting('app.current_tenant_id')
   │  ├── Row isolasi: hanya data tenant aktif yang terlihat
   │  └── WITH CHECK: insert/update ke tenant lain ditolak (SQLSTATE 44000)
   ↓
[7] Transaction Completion & Socket Hygiene
   │  ├── Sukses: COMMIT
   │  ├── Error : ROLLBACK (Zero partial mutations)
   │  └── Finally: DISCARD ALL dijalankan sebelum socket dilepas kembali ke pool
   ↓
HTTP Response 200 / 201 Canonical Envelope
```

### Larangan Mutlak (*Prohibited Ingress Patterns*):
- DILARANG menggunakan konstanta `DEFAULT_TENANT_ID`.
- DILARANG menggunakan `process.env.DEFAULT_TENANT_ID`.
- DILARANG menggunakan fallback *mock actor* (`USR-LAB-01`, `DOC-DPJP-01`) pada alur produksi.
- DILARANG melakukan substitusi identitas tenant secara implisit.
- DILARANG memproses request jika header atau klaim tenant hilang atau tidak valid.

---

## 7. TENANT CONTEXT CONTRACT

### A. Kontrak Resolusi Konteks Tenant
Kontroler `diagnosticInterpretation.controller.js` wajib mengekstrak dan memverifikasi konteks tenant pada awal setiap fungsi:
```javascript
const resolvedTenantId = req.tenantId || req.user?.tenantId;
if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'TENANT_CONTEXT_REQUIRED',
      message: 'Konteks tenant valid (UUID) wajib disertakan dalam request.'
    },
    meta: { requestId, correlationId, timestamp }
  });
}
```

### B. Spesifikasi Kontrak Error Repositori Standar
1. **Missing Tenant Context:**
   - HTTP Status: `403 Forbidden`
   - Error Code: `TENANT_CONTEXT_REQUIRED`
   - Sifat: Ditolak sebelum koneksi database diambil dari pool.
2. **Invalid UUID Format:**
   - HTTP Status: `403 Forbidden` (atau `400 Bad Request` bila diatur oleh validator skema, namun fail-closed 403 adalah standar kanonik Wave 1B.1).
   - Error Code: `TENANT_CONTEXT_REQUIRED`
3. **Masa Hidup Konteks Tenant (*Tenant Context Lifetime*):**
   - Konteks tenant diinjeksikan secara transaksi-lokal via `SET LOCAL` (`set_config('app.current_tenant_id', $1, true)`).
   - Nilai GUC otomatis terhapus saat transaksi berakhir (`COMMIT` atau `ROLLBACK`).
4. **Pembersihan Soket (*Socket Hygiene*):**
   - `withUnitOfWork` mengeksekusi `DISCARD ALL` pada blok `finally` sebelum soket dikembalikan ke pool, menjamin nol residu konteks (*zero bleed*) saat koneksi digunakan kembali oleh request dari tenant lain.

---

## 8. UNIT OF WORK DESIGN FOR C2 OPERATIONS

Seluruh 4 metode layanan pada `diagnosticInterpretation.service.js` akan dimigrasikan dari koneksi raw pool manual ke pembungkus `withUnitOfWork`:

### 1. `publishDiagnosticNotification`
- **Owner Transaksi:** `withUnitOfWork({ tenantId, actorId, userRole, isolationLevel: 'READ COMMITTED' })`
- **Unit Atomik:**
  1. Validasi & kunci baris `encounters` via `SELECT * FROM encounters WHERE id = $1 FOR UPDATE;` (CS 75).
  2. Insert notifikasi ke `diagnostic_result_notifications`.
  3. Insert kejadian ke `clinical_domain_outbox` (untuk dispatch notifikasi kritis).
- **Hasil:** Jika salah satu langkah gagal, seluruh mutasi dibatalkan secara atomik.

### 2. `acknowledgeDiagnosticNotification`
- **Owner Transaksi:** `withUnitOfWork({ tenantId, actorId, userRole, isolationLevel: 'READ COMMITTED' })`
- **Unit Atomik:**
  1. Kunci baris `diagnostic_result_notifications` via `FOR UPDATE`.
  2. Verifikasi read-back TBAK (JCI IPSG 2) untuk hasil kritis (`CRITICAL_PANIC`).
  3. Update status notifikasi menjadi `ACKNOWLEDGED`.

### 3. `recordPhysicianInterpretation`
- **Owner Transaksi:** `withUnitOfWork({ tenantId, actorId, userRole, isolationLevel: 'READ COMMITTED' })`
- **Unit Atomik:**
  1. Kunci baris `diagnostic_result_notifications` via `FOR UPDATE`.
  2. Perhitungan delta check longitudinal dan verifikasi alert.
  3. Insert sintesis klinis dokter ke `physician_diagnostic_interpretations` (Stage-0).
  4. Update status notifikasi menjadi `INTERPRETED`.
  5. Insert audit log ke `universal_audit_logs` (CS 77, Stage-0).
- **Atomisitas Audit:** Mutasi bisnis dan mutasi audit log dieksekusi di dalam **koneksi dan transaksi yang sama**.

### 4. `executeSecondaryClinicalAction`
- **Owner Transaksi:** `withUnitOfWork({ tenantId, actorId, userRole, isolationLevel: 'READ COMMITTED' })`
- **Unit Atomik:**
  1. Kunci baris `physician_diagnostic_interpretations` via `FOR UPDATE` (CS 81, Stage-0).
  2. Eksekusi remediated CS 82: `INSERT INTO clinical_orders` dengan menyertakan `tenant_id` (Stage-0).
  3. Insert tindakan sekunder ke `diagnostic_secondary_actions`.
  4. Update status notifikasi terkait menjadi `ACTION_TAKEN`.
- **Hasil:** Jika penerbitan order sekunder CPOE gagal, tindakan diagnostik sekunder otomatis dibatalkan (*clean rollback*).

---

## 9. CS 82 REMEDIATION PLAN (DIAGNOSTIC SECONDARY ORDERS)

Cacat CS 82 adalah cacat SQL DML terverifikasi yang saat ini menyebabkan kegagalan fatal pada server PostgreSQL riil.

### A. Jawaban Komprehensif atas 8 Pertanyaan Kunci Remediasi CS 82:

1. **Dari mana `tenant_id` berasal?**
   `tenant_id` berasal dari konteks request yang telah divalidasi oleh gerbang L1 kontroler (`req.tenantId` / `req.user.tenantId`).
2. **Bagaimana `tenant_id` masuk ke Unit of Work?**
   Kontroler meneruskan `tenantId` sebagai bagian dari opsi pemanggilan `withUnitOfWork({ tenantId, actorId, userRole }, callback)`.
3. **Bagaimana service menerima `tenant_id`?**
   Callback `withUnitOfWork` menyediakan objek `uowContext` yang berisi properti `tenantId` yang telah diverifikasi UUID-nya.
4. **Bagaimana pernyataan `INSERT` menggunakan `tenant_id`?**
   Pernyataan SQL diubah secara eksplisit untuk menyertakan kolom `tenant_id` dalam daftar kolom dan menambahkan `$2` dalam daftar parameter:
   ```javascript
   // TARGET REMEDIATED SQL (Baris 528):
   await client.query(`
     INSERT INTO clinical_orders (
       id, tenant_id, encounter_id, patient_id, order_number,
       order_type, order_status, priority, ordering_doctor_id,
       ordering_doctor_name, ordering_doctor_role, notes,
       correlation_id, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
   `, [
     generatedCpoeOrderId,
     tenantId, // <--- EXPLICIT REMEDIATION
     interp.encounter_id,
     interp.patient_id,
     orderNumber,
     cpoePayload.orderType || 'PHARMACY',
     'ORDERED',
     cpoePayload.priority || 'CITO',
     actorId,
     actorName,
     actor.role || 'ROLE_DOCTOR_DPJP',
     actionSummary,
     correlationId,
     serverTimestamp
   ]);
   ```
5. **Bagaimana PostgreSQL RLS memvalidasinya?**
   PostgreSQL RLS mengevaluasi policy `tenant_isolation_clinical_orders` pada klausa `WITH CHECK`:
   ```sql
   (tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)
   ```
   Karena parameter `$2` bernilai sama persis dengan `app.current_tenant_id` yang diset oleh UoW, evaluasi menghasilkan `TRUE`, dan operasi insert diizinkan.
6. **Pengujian apa yang membuktikannya?**
   Pengujian integrasi Real PostgreSQL `Test C2-RLS-05` mengeksekusi `executeSecondaryClinicalAction` terhadap tabel riil PostgreSQL dan memverifikasi baris terbentuk dengan `tenant_id` yang valid tanpa melempar error `NOT NULL`.
7. **Pengujian apa yang membuktikan penolakan lintas-tenant (*cross-tenant rejection*)?**
   Pengujian integrasi Real PostgreSQL `Test C2-RLS-04` mencoba menyuntikkan `tenant_id` milik Tenant B saat sesi UoW aktif di Tenant A; PostgreSQL RLS menolak mutasi dengan `SQLSTATE 44000`.
8. **Solusi yang DILARANG Keras:**
   - DILARANG menambahkan UUID hardcoded.
   - DILARANG menambahkan `DEFAULT_TENANT_ID`.
   - DILARANG menambahkan nilai `DEFAULT` pada skema database tabel `clinical_orders`.
   - DILARANG melonggarkan batasan `NOT NULL`.
   - DILARANG mendisable atau membypass RLS (`FORCE ROW LEVEL SECURITY` wajib dihormati).

---

## 10. RLS TARGET DESIGN FOR C2 STAGE-0 TABLES

Berikut adalah spesifikasi konfigurasi RLS target pada 4 tabel Stage-0 yang diakses oleh Candidate C2:

| Tabel Stage-0 | Status RLS Saat Ini | Nama Policy RLS | Kolom Tenant | Predikat USING (`qual`) | Predikat `WITH CHECK` | Konteks Transaksi Wajib |
|---|---|---|---|---|---|---|
| **`encounters`** | ENABLED & FORCED | `tenant_isolation_encounters` | `tenant_id` | `tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid` | `tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid` | `withUnitOfWork` (`app.current_tenant_id` tersetel) |
| **`physician_diagnostic_interpretations`** | ENABLED & FORCED | `tenant_isolation_physician_diagnostic_interpretations` | `tenant_id` | `tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid` | `tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid` | `withUnitOfWork` (`app.current_tenant_id` tersetel) |
| **`clinical_orders`** | ENABLED & FORCED | `tenant_isolation_clinical_orders` | `tenant_id` | `tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid` | `tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid` | `withUnitOfWork` (`app.current_tenant_id` tersetel) |
| **`universal_audit_logs`** | ENABLED & FORCED | `tenant_isolation_universal_audit_logs` | `tenant_id` | `tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid` | `tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid` | `withUnitOfWork` (`app.current_tenant_id` tersetel) |

---

## 11. REAL POSTGRESQL TEST PLAN (9 SCENARIOS)

Karena baseline evidensi mencatat **Real PostgreSQL RLS Tests = 0** pada Candidate C2, implementation plan ini mewajibkan pembuatan suite pengujian integrasi baru (`tests/p02b_wave1b2_c2_real_rls_integration.test.js`) yang berjalan langsung di atas instance PostgreSQL riil (bukan mock in-memory):

### Skenario 1: `C2-RLS-01` — Tenant A Read Own Data
- **Deskripsi:** Tenant A menerbitkan notifikasi dan mencatat interpretasi klinis. Kueri verifikasi membaca tabel `encounters` dan `physician_diagnostic_interpretations` milik Tenant A.
- **Bukti yang Diharapkan:** Kueri mengembalikan baris data Tenant A; `rows.length > 0`; kolom `tenant_id` cocok dengan UUID Tenant A.

### Skenario 2: `C2-RLS-02` — Tenant A Cannot Read Tenant B Data
- **Deskripsi:** Tenant A mencoba menjalankan kueri terhadap ID encounter atau ID interpretasi yang dibuat oleh Tenant B.
- **Bukti yang Diharapkan:** PostgreSQL RLS secara transparan menyaring baris data Tenant B; kueri mengembalikan `rows.length === 0`; service melempar error `ENCOUNTER_NOT_FOUND` / `INTERPRETATION_NOT_FOUND` (404); tidak ada data bocor lintas tenant.

### Skenario 3: `C2-RLS-03` — Tenant A Write Own Data
- **Deskripsi:** Tenant A mengeksekusi operasi `publishNotification`, `recordInterpretation`, dan `executeSecondaryAction` dengan konteks tenant yang sah.
- **Bukti yang Diharapkan:** Seluruh operasi DML berhasil; baris baru terbentuk pada `universal_audit_logs`, `physician_diagnostic_interpretations`, dan `clinical_orders` dengan `tenant_id` Tenant A.

### Skenario 4: `C2-RLS-04` — Tenant A Cannot Write Tenant B Record
- **Deskripsi:** Tenant A mencoba menerbitkan order sekunder atau audit log dengan menyuntikkan `tenant_id` milik Tenant B saat sesi aktif berada pada Tenant A.
- **Bukti yang Diharapkan:** PostgreSQL RLS menolak mutasi dengan `SQLSTATE 44000` (*new row violates row-level security policy*); transaksi dibatalkan.

### Skenario 5: `C2-RLS-05` — CS82 Remediated Downstream Order Insert
- **Deskripsi:** Eksekusi `executeSecondaryClinicalAction` menerbitkan order sekunder downstream ke tabel `clinical_orders`.
- **Bukti yang Diharapkan:** `INSERT INTO clinical_orders` berhasil tanpa error constraint `NOT NULL` (SQLSTATE 23502); baris order sekunder tercatat di database dengan `tenant_id` Tenant A.

### Skenario 6: `C2-RLS-06` — Transaction Rollback on Failure
- **Deskripsi:** Simulasi kegagalan paksa (misal: payload tidak valid pada tahap akhir secondary action) setelah order klinis diterbitkan.
- **Bukti yang Diharapkan:** PostgreSQL mengeksekusi `ROLLBACK`; tidak ada baris parsial yang tertinggal di `clinical_orders`, `diagnostic_secondary_actions`, maupun `universal_audit_logs`.

### Skenario 7: `C2-RLS-07` — Connection Reuse Cleanliness
- **Deskripsi:** Soket koneksi yang digunakan oleh Request Tenant A dikembalikan ke pool, lalu disewakan kembali untuk Request Tenant B.
- **Bukti yang Diharapkan:** Request Tenant B tidak dapat mengakses data Tenant A; eksekusi `DISCARD ALL` menjamin GUC `app.current_tenant_id` bersih dan terisolasi.

### Skenario 8: `C2-RLS-08` — Missing Tenant Context Rejection
- **Deskripsi:** Request HTTP dikirim ke endpoint C2 tanpa menyertakan header `x-tenant-id` atau token tanpa klaim tenant.
- **Bukti yang Diharapkan:** Gerbang L1 kontroler mengembalikan HTTP `403 Forbidden` dengan kode `TENANT_CONTEXT_REQUIRED`; nol kueri database yang dieksekusi.

### Skenario 9: `C2-RLS-09` — Invalid Tenant Context Rejection
- **Deskripsi:** Request HTTP dikirim dengan format tenant ID tidak valid (misal: string `'invalid-tenant-123'`).
- **Bukti yang Diharapkan:** Gerbang L1 kontroler menolak request dengan HTTP `403 Forbidden` (`TENANT_CONTEXT_REQUIRED`); nol kueri database yang dieksekusi.

---

## 12. CONTROLLER GATE REDESIGN

### Perbandingan Gerbang Masuk Kontroler C2:

```text
+---------------------------------------------------------------------------------------------------+
| KONTROLER ENTRY GATE COMPARISON                                                                   |
+---------------------------------------------------------------------------------------------------+
| KONDISI SAAT INI (FAIL-OPEN):                                                                     |
|   const actor = req.user || {                                                                     |
|     userId: 'DOC-DPJP-01',                                                                        |
|     username: 'dr_siti',                                                                          |
|     role: 'ROLE_DOCTOR_DPJP'                                                                      |
|   };                                                                                              |
|   // req.tenantId TIDAK DIPERIKSA -> Request tanpa tenant tetap diproses -> FAIL-OPEN             |
+---------------------------------------------------------------------------------------------------+
| TARGET KONDISI (FAIL-CLOSED):                                                                     |
|   const resolvedTenantId = req.tenantId || req.user?.tenantId;                                    |
|   if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {                                      |
|     return res.status(403).json({                                                                 |
|       success: false,                                                                             |
|       error: {                                                                                    |
|         code: 'TENANT_CONTEXT_REQUIRED',                                                          |
|         message: 'Konteks tenant valid (UUID) wajib disertakan dalam request.'                    |
|       },                                                                                          |
|       meta: { requestId, correlationId, timestamp }                                               |
|     });                                                                                           |
|   }                                                                                               |
|   // Fallback mock actor dihapus; tenantId wajib diteruskan ke service -> FAIL-CLOSED            |
+---------------------------------------------------------------------------------------------------+
```

---

## 13. AUTHORIZATION VS TENANT ISOLATION

Kedua kontrol keamanan ini wajib ditegakkan secara terpisah dan independen:

1. **Otorisasi Klinis (*Authorization / Capability Check*):**
   - Menjawab: *"Apakah dokter/petugas ini memiliki peran yang diizinkan untuk menerbitkan interpretasi atau order tindakan sekunder?"*
   - Ditegakkan pada lapisan aplikasi: Middleware JWT dan pemeriksaan role (`ROLE_DOCTOR_DPJP`, `ROLE_LAB_TECHNICIAN`).
2. **Isolasi Tenant (*Tenant Isolation Boundary*):**
   - Menjawab: *"Apakah request ini beroperasi strictly di dalam data silo rumah sakit/tenant yang berhak?"*
   - Ditegakkan pada dua lapisan: Gerbang L1 Kontroler (pencegahan dini) dan PostgreSQL Row-Level Security (penegakan mutlak di tingkat database kernel).
- **Prinsip:** Otorisasi yang valid TIDAK PERNAH boleh membypass isolasi tenant, dan isolasi tenant TIDAK PERNAH menggantikan pemeriksaan otorisasi klinis.

---

## 14. AUDIT TRAIL & TRANSACTION ATOMICITY

Modul diagnostik mencatat mutasi audit klinis kritis:
1. **Penerbitan Notifikasi:** Publikasi alert nilai kritis ke outbox (`clinical_domain_outbox`).
2. **Konfirmasi Read-Back TBAK:** Pencatatan stempel waktu dan identitas verifikator pada tabel `diagnostic_result_notifications`.
3. **Interpretasi Dokter:** Pencatatan tanda tangan digital SHA-256 dan pembuatan log audit pada `universal_audit_logs`.
4. **Tindakan Sekunder:** Pencatatan ID order CPOE downstream pada `diagnostic_secondary_actions`.

`[FACT]` **Mandat Atomisitas:**
Mutasi bisnis (misal: pembuatan interpretasi atau order sekunder) dan mutasi log audit (`universal_audit_logs`) **WAJIB** berada di dalam transaksi database atomik yang sama. Jika pencatatan log audit gagal, seluruh mutasi klinis wajib di-rollback, menjamin ketiadaan mutasi klinis tanpa jejak audit (*zero unaudited clinical actions*).

---

## 15. REGRESSION STRATEGY & TEST PYRAMID

### Piramida Pengujian Multi-Lapis (7 Lapisan):

```text
       [Layer 7] Full Canonical Regression (81/81 PASS Baseline)
                        ▲
       [Layer 6] Transaction Rollback & Connection Reuse Verification
                        ▲
       [Layer 5] Cross-Tenant Security & Policy Denial Verification
                        ▲
       [Layer 4] Real PostgreSQL RLS Integration Suite (C2-RLS-01..09)
                        ▲
       [Layer 3] Controller Fail-Closed HTTP Gate Suite (Unit)
                        ▲
       [Layer 2] Mocked Persistence Durability Suite (verticalSlice09: 25 Scenarios)
                        ▲
       [Layer 1] Pure Domain Logic & Clinical Calculation Unit Tests
```

### Rincian Peran Masing-Masing Lapisan:
- **Layer 1 & 2:** Memvalidasi kalkulasi delta check, validasi aturan JCI IPSG 2, dan transisi state machine di memori. *Bukan bukti penegakan PostgreSQL RLS.*
- **Layer 3:** Memvalidasi bahwa controller menolak request tanpa tenant context (HTTP 403) sebelum memanggil service.
- **Layer 4 & 5:** Membuktikan isolasi multi-tenant riil, penolakan akses silang tenant, dan penegakan RLS di kernel PostgreSQL.
- **Layer 6:** Membuktikan pembersihan socket koneksi pool (`DISCARD ALL`) dan kebersihan atomisitas rollback.
- **Layer 7:** Memverifikasi bahwa seluruh baseline regresi sistem (81/81 test) tetap lulus 100% tanpa regresi.

---

## 16. IMPLEMENTATION ORDER (PHASE C2-01 TO PHASE C2-10)

Pelaksanaan implementasi (setelah plan disetujui Human Owner) akan mengikuti 10 fase berurutan yang terisolasi:

```text
Phase C2-01: Freeze Current Evidence & Environment Verification
Phase C2-02: Implement Fail-Closed L1 Controller Gate & Unit Tests
Phase C2-03: Establish Unit of Work (withUnitOfWork) in Diagnostic Service
Phase C2-04: Remediate CS 82 (clinical_orders INSERT with explicit tenant_id)
Phase C2-05: Migrate C2 Stage-0 Database Operations to UoW & Atomic Audit
Phase C2-06: Create & Execute Real PostgreSQL RLS Integration Tests (C2-RLS-01..05)
Phase C2-07: Verify Rollback Atomicity & Connection Reuse (C2-RLS-06..07)
Phase C2-08: Verify All 4 HTTP Routes (3 Active Stage-0 + 1 Zero Stage-0) End-to-End
Phase C2-09: Run Full Canonical Regression Suite (Verify 81/81 PASS Preserved)
Phase C2-10: Generate Final C2 Security Closure Evidence & Audit Report
```

---

## 17. STOP CONDITIONS

Proses implementasi **WAJIB DIHENTIKAN SEGERA** jika salah satu kondisi berikut terdeteksi:

1. Ditemukan Stage-0 call site tambahan di luar 11 call site terdaftar yang tidak terdokumentasi.
2. Ditemukan rute HTTP C2 baru yang tidak tercatat dalam baseline.
3. Terjadi bypass gerbang konteks tenant pada kontroler atau service.
4. Terjadi penggunaan `DEFAULT_TENANT_ID` atau mock actor pada alur produksi.
5. Kueri lintas-tenant (*cross-tenant read*) berhasil melihat data tenant lain.
6. Mutasi lintas-tenant (*cross-tenant write*) berhasil lolos dari RLS policy.
7. Terjadi kebocoran konteks tenant (*tenant context bleed*) pada koneksi daur ulang.
8. Rollback gagal mengembalikan kondisi database ke status awal (mutasi parsial tersisa).
9. CS 82 tidak dapat diperbaiki tanpa mengubah skema tabel lain.
10. Terjadi kegagalan pada suite pengujian regresi kanonik (kurang dari 81/81 PASS).
11. Terjadi perubahan file di luar lingkup yang diizinkan (*forbidden scope violation*).

---

## 18. FILE CHANGE MANIFEST & FORBIDDEN SCOPE

### Planned File Changes (Saat Implementasi Diizinkan):

| Berkas | Tipe | Tujuan Perubahan | Rencana Perubahan | Wajib? | Fase |
|---|---|---|---|:---:|:---:|
| `server/controllers/diagnosticInterpretation.controller.js` | Production Code | Penegakan gerbang L1 fail-closed | Validasi `req.tenantId` dengan `isValidUuid`; return 403 `TENANT_CONTEXT_REQUIRED`; hapus fallback mock actor | YES | Phase C2-02 |
| `server/services/diagnosticInterpretation.service.js` | Production Code | Migrasi UoW & Remediasi CS 82 | Impor `withUnitOfWork`; bungkus transaksi; tambahkan `tenant_id` pada line 528 kueri `clinical_orders` | YES | Phase C2-03..05 |
| `tests/p02b_wave1b2_c2_l1_controller_gate.test.js` | Test Code | Pengujian unit gerbang kontroler | Pengujian unit penolakan HTTP 403 pada missing/invalid tenant di seluruh 4 rute | YES | Phase C2-02 |
| `tests/p02b_wave1b2_c2_real_rls_integration.test.js` | Test Code | Pengujian integrasi PostgreSQL RLS | Pengujian skenario C2-RLS-01 hingga C2-RLS-09 pada PostgreSQL riil | YES | Phase C2-06..08 |
| `docs/audit/P0-2B-WAVE1B2-C2-IMPLEMENTATION-PLAN.md` | Documentation | Blueprint implementasi | Pembuatan dokumen rencana implementasi | YES | Phase C2-01 |
| `scratch/p02b_wave1b2_c2_implementation_plan.json` | Documentation | Pendamping mesin blueprint | Pembuatan berkas JSON companion | YES | Phase C2-01 |

`[FACT]` **Ketiadaan Migrasi Database:**
Nol berkas migrasi database yang direncanakan. Skema database PostgreSQL yang ada saat ini sudah memiliki kolom `tenant_id UUID NOT NULL` pada tabel `clinical_orders` (Migration 009) dan `physician_diagnostic_interpretations` (Migration 078).

### FORBIDDEN SCOPE LIST (DILARANG KERAS DIUBAH):
- `server/controllers/appointment.controller.js` (Candidate A)
- `server/services/appointmentQueue.service.js` (Candidate A)
- `server/services/medicationClosedLoop.service.js` (Candidate B)
- `server/services/cpoeApplication.service.js` (Candidate C1)
- `server/services/safetyAuthorization.service.js` (Candidate C1)
- `server/services/patientApplication.service.js` (Candidate D)
- `server/controllers/patient.controller.js` (Candidate D)
- Seluruh direktori `database/migrations/` (0 migrasi)
- Seluruh direktori `database/schema/`
- Seluruh direktori `src/` (frontend)
- `docs/CHANGELOG_PERUBAHAN_HIS.md` (hanya diperbarui saat rilis implementasi riil selesai)

---

## 19. RISK REGISTER

Setiap risiko diidentifikasi secara faktual berdasarkan bukti kode sumber tanpa menggunakan pelabelan kualitatif subjektif:

| Risk ID | Kondisi yang Diamati | Bukti Repositori | Potensi Kegagalan | Metode Deteksi | Mitigasi yang Direncanakan | Verifikasi |
|---|---|---|---|---|---|---|
| **R-C2-01** | CS 82 menghilangkan kolom `tenant_id` pada `INSERT INTO clinical_orders` | `diagnosticInterpretation.service.js:528` | Pelanggaran constraint `NOT NULL` (SQLSTATE 23502) pada PostgreSQL riil | Eksekusi kueri langsung terhadap PostgreSQL | Sertakan kolom dan parameter `tenant_id` yang dibind dari UoW context | Test `C2-RLS-05` lulus pada PostgreSQL riil |
| **R-C2-02** | Kontroler melakukan fallback ke mock actor saat `req.user` tidak ada | `diagnosticInterpretation.controller.js:21, 72, 127, 180` | Fail-open ingress: request tanpa autentikasi dapat memicu eksekusi Stage-0 | Pengujian kontroler tanpa token/tenant | Terapkan gerbang L1 fail-closed sebelum pemanggilan service | Test `C2-RLS-08` dan `C2-RLS-09` menghasilkan HTTP 403 |
| **R-C2-03** | Service melakukan checkout koneksi pool secara manual (`pool.connect()`) | `diagnosticInterpretation.service.js:82, 504` | Kebocoran soket jika terjadi exception tak tertangkap; kegagalan `DISCARD ALL` | Analisis lifecycle pool koneksi | Migrasikan 100% interaksi database ke `withUnitOfWork` | Test `C2-RLS-07` membuktikan zero bleed pada reuse soket |
| **R-C2-04** | Penyisipan log audit dilakukan di blok `try` tanpa jaminan transaksi tunggal | `diagnosticInterpretation.service.js:424` | Mutasi bisnis tersimpan tetapi log audit gagal ditulis (inkonsistensi jejak audit) | Pengujian injeksi kegagalan audit | Satukan mutasi interpretasi dan log audit ke dalam satu `withUnitOfWork` | Test `C2-RLS-06` membuktikan rollback atomik interpretasi & audit |

---

## 20. DEFINITION OF DONE (COMPLETION CRITERIA)

Implementasi Candidate C2 Wave 1B.2 hanya dapat dinyatakan selesai secara resmi jika seluruh kriteria berikut terpenuhi:

- [ ] Gerbang masuk kontroler C2 terbukti 100% fail-closed pada seluruh 4 rute (HTTP 403 `TENANT_CONTEXT_REQUIRED` pada missing/invalid tenant).
- [ ] Seluruh fallback `DEFAULT_TENANT_ID`, mock actor, atau implicit tenant terbukti dihapus dari alur request produksi C2.
- [ ] Konteks tenant UUID yang terverifikasi terbukti diteruskan ke `withUnitOfWork` untuk seluruh interaksi database Stage-0.
- [ ] Seluruh 11 Stage-0 Unsafe Call Sites (CS 72 hingga CS 82) terbukti beroperasi di dalam batasan `withUnitOfWork`.
- [ ] Cacat CS 82 terbukti diperbaiki dengan penyertaan eksplisit kolom dan parameter `tenant_id` pada `INSERT INTO clinical_orders`.
- [ ] Suite pengujian integrasi Real PostgreSQL RLS baru dibuat dan lulus 100% (Skenario C2-RLS-01 hingga C2-RLS-09).
- [ ] Isolasi Tenant A terbukti pada tabel `encounters`, `physician_diagnostic_interpretations`, `clinical_orders`, dan `universal_audit_logs`.
- [ ] Upaya pembacaan lintas-tenant terbukti mengembalikan 0 baris (HTTP 404).
- [ ] Upaya penulisan lintas-tenant terbukti ditolak oleh PostgreSQL RLS (SQLSTATE 44000).
- [ ] Atomisitas rollback terbukti: kegagalan transaksi tidak menyisakan mutasi parsial.
- [ ] Daur ulang soket koneksi pool terbukti bersih dari kebocoran konteks tenant (`DISCARD ALL`).
- [ ] Seluruh 3 rute aktif Stage-0 dan 1 rute zero Stage-0 terverifikasi end-to-end.
- [ ] Suite pengujian durabilitas mock C2 eksisting (`verticalSlice09`) tetap lulus 25/25 skenario.
- [ ] Suite pengujian regresi kanonik baseline tetap lulus 81/81 PASS (100% clean).
- [ ] Nol baris perubahan pada Candidate A, B, C1, atau D.
- [ ] Seluruh artefak evidensi penutupan dihasilkan dan diverifikasi oleh audit final.

---

## 21. HUMAN OWNER REVIEW GATE

```text
====================================================================================================
                        C2 IMPLEMENTATION PLAN REVIEW GATE
====================================================================================================
Candidate Selected            : C2 (Diagnostics)
Planning Status               : COMPLETE / READY FOR HUMAN OWNER REVIEW
Implementation Status         : NOT YET APPROVED / NOT STARTED
Production Code Changes       : 0 baris
Database Migration Changes    : 0 baris
Test Code Changes             : 0 baris
Changelog Changes             : 0 baris
Scope Locked                  : YES (100% C2 Diagnostics Bounded)
CS82 Remediation Defined      : YES (Explicit tenant_id in clinical_orders INSERT)
Real PostgreSQL Test Plan     : YES (9 Scenarios: C2-RLS-01 to C2-RLS-09)
Machine-Readable Companion    : scratch/p02b_wave1b2_c2_implementation_plan.json
====================================================================================================
```

Blueprint implementasi teknis untuk Candidate C2 ini telah selesai disusun, terkunci, dan siap ditinjau oleh **Human Owner**. Implementasi kode produksi **TIDAK AKAN DIMULAI** sebelum Human Owner memberikan persetujuan eksplisit terhadap blueprint ini.
