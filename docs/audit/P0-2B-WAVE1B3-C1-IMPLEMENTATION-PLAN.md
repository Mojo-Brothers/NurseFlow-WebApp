# P0-2B WAVE 1B.3 — C1 (CPOE ORDERS & SAFETY) IMPLEMENTATION PLAN
## Master Architectural Blueprint & Adversarial Acceptance Contract (Amended)

**Document ID:** `docs/audit/P0-2B-WAVE1B3-C1-IMPLEMENTATION-PLAN.md`  
**Date:** 2026-10-05  
**Governance Mode:** STRICT READ-ONLY IMPLEMENTATION PLANNING CONTRACT  
**Repository HEAD Baseline:** `b1eceb84791f526c91e2e60f478219297433a27a`  
**Active Branch:** `feature/security-foundation-wave1a10`  
**Target Domain:** Candidate C1 — Computerized Physician Order Entry (CPOE) Orders & Safety Authorization  
**Human Owner Decision:** C1 — ALREADY SELECTED (Authoritative)  
**Implementation Status:** NOT STARTED (Strict Read-Only Blueprint)  
**Production Code Changes:** 0 baris  
**Migration / Schema Changes:** 0 baris  
**Test File Changes:** 0 baris  
**Frontend Changes:** 0 baris  

---

## 1. Verified Baseline & Catalog Reconciliation

Pemeriksaan repositori dan basis data laboratorium `nurseflow_security_lab` (PostgreSQL 16) membuktikan baseline kanonik berikut:

### 1.1. Status Repositori & Utang Keamanan
- **Current System Remaining Stage-0 Debt:** **134 Call Sites** (setelah reduksi 11 CS pada Wave 1B.2 Candidate C2).
- **C1 Target Stage-0 Call Sites:** **16 Call Sites** (CS 59-71 pada `cpoeApplication.service.js`, CS 143-145 pada `safetyAuthorization.service.js`).
- **C1 Static AST DB Call Sites:** **25 titik pemanggilan** (6 Writes, 19 Reads).
- **C1 Active Stage-0 Routes:** **6 rute Express**.
- **C1 Total Module Routes:** **9 rute Express**.
- **Shared Call Site:** `CS 71` (`listOrders` pada `cpoeApplication.service.js:609`) dipanggil oleh 2 rute Express (`/cpoe` dan `/orders`).
- **Combined System Regression Baseline:** **129/129 PASS** (81/81 Canonical Baseline + 48/48 C2 Foundation) — status: **EXECUTED & PASSED**.

### 1.2. Canonical PostgreSQL 16 Catalog Evidence (`clinical_orders` & `cpoe_order_items`)
Berdasarkan kueri sistem langsung pada `pg_catalog.pg_constraint` di basis data `nurseflow_security_lab`:

#### Outbound Foreign Keys dari `cpoe_order_items`:
- `cpoe_order_items_order_id_fkey`: `cpoe_order_items.order_id -> clinical_orders.id`
  - `confdeltype`: **`'c'`**
  - Delete Rule Katalog Riil: **`CASCADE`**

#### Outbound Foreign Keys dari `clinical_orders`:
- `clinical_orders_encounter_id_fkey`: `clinical_orders.encounter_id -> encounters.id` (`confdeltype = 'a'`, Rule = **`NO ACTION`**)
- `clinical_orders_episode_id_fkey`: `clinical_orders.episode_id -> episodes_of_care.id` (`confdeltype = 'a'`, Rule = **`NO ACTION`**)
- `clinical_orders_patient_id_fkey`: `clinical_orders.patient_id -> master_patients.id` (`confdeltype = 'a'`, Rule = **`NO ACTION`**)
- `clinical_orders_tenant_id_fkey`: `clinical_orders.tenant_id -> tenant_organizations.id` (`confdeltype = 'a'`, Rule = **`NO ACTION`**)

#### Inbound Foreign Keys ke `clinical_orders`:
- **Total Inbound FK Constraints:** **17 constraints**
- **Total Unique Referring Tables:** **15 tabel unik**
- **Rincian Aturan Hapus Katalog Riil:**
  - **`CASCADE` (`'c'`):** **1 constraint** (`cpoe_order_items_order_id_fkey`)
  - **`RESTRICT` (`'r'`):** **1 constraint** (`prescription_dispense_records_order_id_fkey`)
  - **`NO ACTION` (`'a'`):** **15 constraints** (`blood_crossmatch_tests`, `diagnostic_result_notifications`, `diagnostic_secondary_actions`, `laboratory_orders`, `laboratory_panic_alerts`, `laboratory_test_results`, `medication_dispense_allocations`, `medication_emar_administrations`, `medication_orders` [2 FK], `radiology_critical_finding_alerts`, `radiology_orders` [2 FK], `radiology_reports`, `radiology_studies`)

```text
[DISCREPANCY — REFERRING TABLES COUNT: 15 vs 13]
Evidence: Prompt sebelumnya mengekspektasikan 13 referring tables. Kueri katalog pg_constraint membuktikan terdapat tepat 15 tabel unik yang merujuk ke clinical_orders.
Penyebab: Tabel medication_orders dan radiology_orders masing-masing memiliki 2 foreign key terpisah ke clinical_orders (cpoe_order_id dan order_id), sehingga 17 constraint terdistribusi pada 15 tabel.
Dampak: Tidak membatalkan rencana implementasi C1; menjadi referensi DDL kanonik.
```

---

## 2. Exact C1 Execution Surface

### 2.1. Controllers
- `server/controllers/cpoe.controller.js`:
  - `createOrder`: Handler penerbitan order CPOE.
  - `cancelOrder`: Handler pembatalan order medicolegal dengan verifikasi Safety Decision.
  - `getOrderById`: Handler detail order beserta item.
  - `getOrdersByEncounter`: Handler pencarian order per encounter.
  - `listOrders`: Handler query filter order (mengeksekusi shared call site CS 71).

### 2.2. Application & Safety Services
- `server/services/cpoeApplication.service.js`:
  - Mengelola logika bisnis ordonansi CPOE (validasi invariant, lock idempotency, verifikasi encounter, insert order & item, pembaruan status, pencatatan audit, outbox event).
- `server/services/safetyAuthorization.service.js`:
  - Otoritas verifikasi keselamatan: `verifyAndConsumeTransactional(client, ...)` memverifikasi signature hash SHA-256 (RFC 8785 canonical JCS), row-level lock `FOR UPDATE` pada `safety_decision_registry`, mencegah replay token, dan mencatat konsumsi secara atomik.

### 2.3. Route Inventory & Klasifikasi
File rute: `server/routes/orders.routes.js`:

| Rute HTTP | Handler Controller | Klasifikasi Rute | Call Sites Terlibat |
|---|---|:---:|:---:|
| `POST /api/v1/orders/cpoe` | `cpoeController.createOrder` | **Active Stage-0** | CS 59 (Idempotency lock), CS 60 (Audit), CS 66 (INSERT header) |
| `POST /api/v1/orders/cpoe/:id/cancel` | `cpoeController.cancelOrder` | **Active Stage-0** | CS 61 (Order lock), CS 62 (UPDATE status), CS 63 (Audit), CS 143-145 (Safety token) |
| `GET /api/v1/orders/cpoe` | `cpoeController.listOrders` | **Active Stage-0 (Shared CS 71)** | CS 71 (`SELECT * FROM clinical_orders`) |
| `GET /api/v1/orders/cpoe/:id` | `cpoeController.getOrderById` | **Active Stage-0** | CS 67, CS 68 (SELECT order & items) |
| `GET /api/v1/orders/cpoe/encounter/:encounterId` | `cpoeController.getOrdersByEncounter` | **Active Stage-0** | CS 69, CS 70 (SELECT by encounter) |
| `GET /api/v1/orders` | `cpoeController.listOrders` | **Active Stage-0 (Shared CS 71)** | CS 71 (Rute kompatibilitas backward) |
| `POST /api/v1/orders/prescription` | `ordersApiService.createPrescription` | **Non-Stage-0 (Zero DB)** | Layanan in-memory / mock |
| `POST /api/v1/orders/lab` | `ordersApiService.createLabOrder` | **Non-Stage-0 (Zero DB)** | Layanan in-memory / mock |
| `POST /api/v1/orders/radiology` | `ordersApiService.createRadiologyOrder` | **Non-Stage-0 (Zero DB)** | Layanan in-memory / mock |

---

## 3. Transaction Architecture: Current State vs Target

Untuk mencegah klaim keberhasilan prematur, arsitektur transaksi dipisahkan secara tegas antara **Current State** (kondisi repositori saat ini) dan **Target / Acceptance** (kontrak yang wajib dipenuhi saat implementasi).

### 3.1. CURRENT STATE (Fakta Kode Repositori Aktual)
1. **`createOrder` (`cpoeApplication.service.js:128`):**
   - Menggunakan modul lawas `transactionManager.withTransaction({ correlationId }, async (tx) => { ... })`.
   - `transactionManager.js` membuka koneksi via `pool.connect()` tanpa injeksi GUC tenant RLS (`SET LOCAL app.current_tenant_id`).
   - Objek `tx` membungkus `client.query`, `tx.audit`, dan `tx.outbox`.
   - **Cacat Recovery Idempotensi (L332-350):** Jika terjadi error pelanggaran unik `uq_clinical_orders_idempotency`, blok `catch` memanggil `postgresPoolService.getPool()` dan mengeksekusi `pool.query('SELECT * FROM clinical_orders WHERE idempotency_key = $1')` **tanpa pembatas tenant (unscoped pool query)**.
2. **`cancelOrder` (`cpoeApplication.service.js:387-547`):**
   - Membuka koneksi langsung via `pool.connect()` dan mengeksekusi manual `BEGIN ISOLATION LEVEL READ COMMITTED`.
   - Meneruskan objek `client` koneksi ke modul eksternal: `safetyAuthorizationService.verifyAndConsumeTransactional(client, ...)`.
   - Melakukan `COMMIT` dan `ROLLBACK` manual di dalam blok `try/catch`.
3. **Read Handlers (`getOrderById`, `getOrdersByEncounterId`, `listOrders`):**
   - Mengeksekusi kueri langsung via `pool.query(...)` tanpa pembatasan tenant context UoW.
4. **Synthetic Actor Fallback:**
   - Fallback `USR-DOC-001`, `dr_siti`, `DOC-SYSTEM-001`, `Dokter Pemeriksa`, `Dokter Pembatal`, dan fallback tenant `00000000-0000-0000-0000-000000000001` aktif di beberapa baris controller dan service.

### 3.2. TARGET / ACCEPTANCE (Kontrak Implementasi)
Seluruh mutasi dan pembacaan C1 wajib memenuhi kriteria transaksional berikut saat implementasi:

- **C1-TX-01 (Single Transaction Client):** Seluruh operasi di dalam alur mutasi (`createOrder` dan `cancelOrder`) wajib dieksekusi di bawah 1 (satu) klien transaksi yang disediakan oleh `withUnitOfWork`.
- **C1-TX-02 (Backend PID Consistency):** Memverifikasi bahwa `client.processID === pg_backend_pid()` konsisten selama seluruh siklus hidup transaksi.
- **C1-TX-03 (Zero Hidden Second Connect):** Tidak boleh ada pemanggilan `pool.connect()` kedua di dalam callback `withUnitOfWork`.
- **C1-TX-04 (No Unscoped Pool Query in Lifecycle / Recovery):** Tidak boleh ada pemanggilan `pool.query()` tanpa filter tenant di dalam siklus transaksi maupun alur error/idempotency recovery.
- **C1-TX-05 (Unified Client Sharing):** Pemanggilan `safetyAuthorizationService.verifyAndConsumeTransactional` wajib menggunakan objek klien transaksi UoW (`tx`) yang sama secara sekuensial.
- **C1-TX-06 (Single Owner Lifecycle):** Pernyataan `BEGIN`, `COMMIT`, dan `ROLLBACK` hanya boleh dikendalikan oleh pemilik transaksi (`withUnitOfWork`). Tidak boleh ada transaksi tersarang (*nested transaction*) atau `SAVEPOINT` liar.
- **C1-TX-07 (Post-Transaction Socket Hygiene):** Sanitasi koneksi 3-tier (`DISCARD ALL`) wajib dieksekusi sebelum soket dikembalikan ke pool, menjamin nol kebocoran setting GUC ke request berikutnya.

---

## 4. Idempotency Recovery Hardening

Alur penanganan idempotensi pada `createOrder` wajib dirombak total dari kondisi saat ini:

### 4.1. Audit Titik Rentan Saat Ini:
Pada `server/services/cpoeApplication.service.js:332-350`:
```javascript
// CURRENT VULNERABLE CODE:
if (idempotencyKey && (err.code === '23505' || err.message?.includes('uq_clinical_orders_idempotency'))) {
  const pool = postgresPoolService.getPool();
  const recoveredOrderRes = await pool.query(
    'SELECT * FROM clinical_orders WHERE idempotency_key = $1;',
    [idempotencyKey]
  );
  ...
```
*Kelemahan:* Kueri pemulihan di atas bersifat *tenant-blind*. Jika Tenant A dan Tenant B menggunakan idempotency key yang sama, Tenant A dapat memulihkan dan melihat order milik Tenant B.

### 4.2. Target Acceptance Criteria Idempotensi:
- **C1-IDEMPOTENCY-01:** Pengiriman ulang request dengan idempotency key yang sama pada tenant yang sama menghasilkan replay identik (`isIdempotentReplay: true`) tanpa menduplikasi baris order atau item.
- **C1-IDEMPOTENCY-02:** Pengiriman request dengan idempotency key yang sama dari Tenant B terhadap order Tenant A **tidak boleh dapat menemukan atau mengambil data Tenant A**; wajib ditolak atau diisolasi sesuai kebijakan integritas tenant.
- **C1-IDEMPOTENCY-03:** Alur error/idempotency recovery dilarang keras menggunakan `DEFAULT_TENANT_ID` atau kueri mentah `pool.query()` tanpa tenant scoping.
- **C1-IDEMPOTENCY-04:** Konteks tenant pada pemulihan idempotensi wajib bersumber secara otoritatif dari request context / UoW context (`app.current_tenant_id`).

---

## 5. Actor Provenance: Service-Level Contract

Audit komprehensif membuktikan keberadaan identitas sintetis/tiruan di level controller maupun service:

### 5.1. Audit Identitas Sintetis Eksisting:
1. `server/controllers/cpoe.controller.js:19, 77`: `userId: 'USR-DOC-001'` (Mock fallback)
2. `server/controllers/cpoe.controller.js:20, 78`: `username: 'dr_siti'` (Mock fallback)
3. `server/services/cpoeApplication.service.js:72`: `const requesterId = actor.userId || 'DOC-SYSTEM-001'` (Synthetic fallback)
4. `server/services/cpoeApplication.service.js:73`: `const requesterName = actor.fullName || actor.username || 'Dokter Pemeriksa'` (Synthetic fallback)
5. `server/services/cpoeApplication.service.js:168`: `const targetTenantId = encounter.tenant_id || actor.tenantId || '00000000-0000-0000-0000-000000000001'` (Hardcoded tenant fallback)
6. `server/services/cpoeApplication.service.js:386`: `const cancelledBy = actor.fullName || actor.username || 'Dokter Pembatal'` (Synthetic fallback)
7. `server/services/cpoeApplication.service.js:486`: `actor.userId || 'USR-DOC-001'` (Synthetic fallback)

### 5.2. Target Acceptance Criteria Actor Provenance:
- **C1-ACTOR-01:** Request tanpa aktor terotentikasi yang sah wajib gagal-tutup (*fail-closed*) dengan status `401 UNAUTHORIZED`.
- **C1-ACTOR-02:** Identitas aktor wajib 100% bersumber dari JWT token yang divalidasi (`req.user`) dan konteks keamanan request.
- **C1-ACTOR-03:** Menghapus seluruh fallback identitas sintetis (`USR-DOC-001`, `DOC-SYSTEM-001`, `dr_siti`, `Dokter Pemeriksa`, `Dokter Pembatal`) dan fallback tenant (`00000000-0000-0000-0000-000000000001`) dari seluruh lapisan runtime controller dan service.
- **C1-ACTOR-04:** Catatan audit (`universal_audit_logs`) wajib merekam identitas aktor otoritatif (`actor_id`, `actor_name`, `actor_role`) yang terotentikasi.
- **C1-ACTOR-05:** Aktor yang mengeksekusi pembatalan order wajib identik dengan aktor yang disahkan pada token keselamatan (`safetyDecision`), atau ditolak dengan error otorisasi.

---

## 6. Child Table RLS: Acceptance Criteria C1-CHILD-01..05

### 6.1. Kondisi Katalog Aktual:
- `cpoe_order_items`:
  - `relrowsecurity = false`
  - `relforcerowsecurity = false`
  - **TIDAK MEMILIKI KOLOM `tenant_id`**.
- Skema kolom: `id`, `order_id`, `item_type`, `catalog_code`, `item_name`, `item_specifications`, `quantity`, `unit`, `unit_price`, `total_price`, `priority`, `status`, `instructions`, `created_at`, `updated_at`.
- Relasi FK: `order_id REFERENCES clinical_orders(id) ON DELETE CASCADE` (`confdeltype = 'c'`).

> **PENEGASAN KEAMANAN:**  
> RLS PostgreSQL berlaku **strictly per-table**. Keberadaan RLS pada tabel induk `clinical_orders` **TIDAK OTOMATIS** menerapkan isolasi tenant pada operasi langsung terhadap `cpoe_order_items`.  
> Pelabelan "ACCEPTED ARCHITECTURAL LIMITATION" **DILARANG** sebelum lima kriteria berikut dapat dibuktikan secara empiris dalam pengujian adversarial.

### 6.2. Mandatory Acceptance Criteria C1-CHILD-01..05:
- **C1-CHILD-01:** Direct SELECT terhadap `cpoe_order_items` di bawah sesi Tenant A tidak boleh dapat membaca item milik Tenant B.
- **C1-CHILD-02:** Percobaan membaca item lintas-tenant melalui relasi order induk `clinical_orders` wajib menghasilkan 0 baris / ditolak (karena order induk tersembunyi oleh RLS).
- **C1-CHILD-03:** Audit seluruh kode produksi membuktikan tidak ada kueri aplikasi ke `cpoe_order_items` yang tidak memfilter `order_id` yang telah divalidasi oleh tenant RLS.
- **C1-CHILD-04:** Memastikan seluruh jalur akses aplikasi (*application-path access*) ke child table selalu memiliki predikat/JOIN parent-scoped yang terbukti aman dari kebocoran tenant.
- **C1-CHILD-05:** Mutasi (UPDATE/DELETE) langsung terhadap `cpoe_order_items` tidak boleh memungkinkan modifikasi atau penghapusan item milik tenant lain.

```text
KLASIFIKASI KONTRAK:
Jika kelima kriteria C1-CHILD-01..05 tidak dapat dibuktikan tanpa perubahan skema/migrasi:
STATUS               : BLOCKER
MIGRATION REQUIRED   : 0 (HARD CONSTRAINT)
TINDAKAN             : JANGAN mengubah skema atau menambahkan kolom tenant_id secara diam-diam.
                       Laporkan sebagai BLOCKER resmi kepada Human Owner.
```

---

## 7. CS 71 Shared Call Site Protection Blueprint

Shared Call Site `CS 71` berlokasi di `server/services/cpoeApplication.service.js:609` dalam fungsi `listOrders`:
```text
GET /api/v1/orders/cpoe  ──┐
                           ├──> cpoeController.listOrders ──> cpoeApplicationService.listOrders ──> CS 71
GET /api/v1/orders       ──┘
```

### Acceptance Criteria CS 71:
- **C1-CS71-01:** Akses via rute kanonik `GET /api/v1/orders/cpoe` wajib melewati gerbang L1 fail-closed 403 jika tenant tidak valid.
- **C1-CS71-02:** Akses via rute kompatibilitas `GET /api/v1/orders` wajib melewati gerbang L1 fail-closed 403 yang identik.
- **C1-CS71-03:** Kueri `SELECT * FROM clinical_orders` di dalam `listOrders` wajib dieksekusi di bawah konteks koneksi yang menyetel GUC tenant (`SET LOCAL app.current_tenant_id`) sehingga RLS PostgreSQL secara aktif menyaring hasil kueri.
- **C1-CS71-04:** Nol celah bypass: Memverifikasi bahwa tidak ada rute yang dapat mengeksekusi `listOrders` tanpa konteks tenant yang sah.

---

## 8. Safety Authorization Testing Contract (C1-SAFETY-01..08)

Fungsi `safetyAuthorizationService.verifyAndConsumeTransactional(tx, ...)` mengatur alur otorisasi keselamatan medicolegal:

| Test ID | Skenario Safety Authorization | Hasil yang Diharapkan | Status Kontrak |
|---|---|---|:---:|
| **C1-SAFETY-01** | Valid token succeeds | Token status `ISSUED`, hash cocok, belum expired $\to$ status berubah `CONSUMED`, order dibatalkan | **DEFINED** |
| **C1-SAFETY-02** | Invalid token rejected | Decision ID palsu / tidak ada di database $\to$ Ditolak 404 `SAFETY_DECISION_NOT_FOUND` | **DEFINED** |
| **C1-SAFETY-03** | Expired token rejected | Token dengan `expires_at < NOW()` $\to$ Ditolak 401 `SAFETY_DECISION_EXPIRED` | **DEFINED** |
| **C1-SAFETY-04** | Consumed token cannot replay | Token berstatus `CONSUMED` digunakan kembali $\to$ Ditolak 409 `SAFETY_DECISION_ALREADY_CONSUMED` | **DEFINED** |
| **C1-SAFETY-05** | Cross-tenant token rejection | Token Tenant A dipakai membatalkan order Tenant B $\to$ Ditolak 403 `SAFETY_DECISION_TENANT_MISMATCH` | **DEFINED** |
| **C1-SAFETY-06** | Unauthorized actor rejection | Aktor pembatal berbeda hak dengan otorisasi token $\to$ Ditolak 403 `UNAUTHORIZED_CONSUMER` | **DEFINED** |
| **C1-SAFETY-07** | Atomic consumption & order mutation | Token `CONSUMED` dan order `CANCELLED` dikomit bersama dalam transaksi yang sama | **DEFINED** |
| **C1-SAFETY-08** | Rollback semantics proven | Error dipicu setelah konsumsi token $\to$ Rollback membatalkan konsumsi token (status token kembali `ISSUED`, status order tetap `ORDERED`) | **DEFINED** |

---

## 9. Transaction Adversarial Failure Injection Tests (FI-01..08)

Pengujian kegagalan untuk membuktikan tidak ada mutasi parsial (*zero partial state*):

| Test ID | Titik Injeksi Kegagalan (Failure Injection Point) | Aksi yang Dibatalkan | Status Basis Data Pasca-Rollback |
|---|---|---|---|
| **FI-01** | Setelah `INSERT INTO clinical_orders` | Patahkan kueri sebelum item di-insert | Header order tidak ada di DB (Rollback bersih) |
| **FI-02** | Setelah `INSERT INTO cpoe_order_items` | Patahkan kueri sebelum audit log di-insert | Header dan seluruh item tidak ada di DB |
| **FI-03** | Sebelum `verifyAndConsumeTransactional` | Patahkan kueri saat memvalidasi status order | Order tidak dibatalkan, token tidak terpakai |
| **FI-04** | Setelah token status diubah `CONSUMED` | Patahkan kueri sebelum update status order | Token tetap `ISSUED`, order tetap `ORDERED` |
| **FI-05** | Setelah update `status = 'CANCELLED'` | Patahkan kueri sebelum audit log pembatalan | Order tetap `ORDERED`, token tetap `ISSUED` |
| **FI-06** | Sebelum penulisan `universal_audit_logs` | Simulasikan error pembuatan hash audit | Seluruh mutasi pembatalan di-rollback bersih |
| **FI-07** | Setelah audit sebelum outbox | Patahkan kueri penulisan outbox | Seluruh mutasi di-rollback bersih |
| **FI-08** | Tepat sebelum pernyataan `COMMIT` | Paksa koneksi database terputus / throw error | Basis data tidak memuat mutasi parsial apa pun |

---

## 10. Concurrency Race Condition Tests (C1-RACE-01..03)

- **C1-RACE-01 (Double Cancellation Race):** Dua request pembatalan simultan mengeksekusi order yang sama dengan dua token berbeda. Kunci baris `FOR UPDATE` memastikan hanya satu request yang berhasil; request kedua ditolak dengan `400 ORDER_ALREADY_CANCELLED` atau `409 CONCURRENCY_CONFLICT`.
- **C1-RACE-02 (Double Token Consumption Race):** Dua proses konkuren mencoba mengonsumsi token safety decision yang sama secara bersamaan. Kunci baris `FOR UPDATE` menjamin tepat 1 proses yang sukses mengonsumsi token; proses kedua ditolak `409 SAFETY_DECISION_ALREADY_CONSUMED`.
- **C1-RACE-03 (Concurrent Order Version Mutation):** Dua proses mencoba memperbarui versi order CPOE secara konkuren. Pengecekan versi menolak update paralel yang berkonflik, mencegah insiden *lost update*.

---

## 11. Real PostgreSQL RLS Acceptance Suite (C1-RLS-01..12)

Pengujian akan dibangun pada file `tests/p02b_wave1b3_c1_real_rls_integration.test.js` terhadap `nurseflow_security_lab` di bawah user `nurseflow_app_user`:

| Test ID | Skenario Pengujian RLS | Status Kontrak |
|---|---|:---:|
| **C1-RLS-01** | Own-tenant read: Tenant A membaca order CPOE miliknya (status 200) | **DEFINED** |
| **C1-RLS-02** | Cross-tenant read: Tenant B membaca order Tenant A via ID (404 / 0 baris) | **DEFINED** |
| **C1-RLS-03** | Own-tenant write: Tenant A menerbitkan order baru di bawah UoW | **DEFINED** |
| **C1-RLS-04** | Cross-tenant write: Tenant A menyisipkan order dengan `tenant_id` Tenant B (Error 42501) | **DEFINED** |
| **C1-RLS-05** | Cross-tenant update: Tenant B mencoba mengupdate order Tenant A (0 baris ter-update) | **DEFINED** |
| **C1-RLS-06** | Cross-tenant cancellation: Tenant B membatalkan order Tenant A (404 ORDER_NOT_FOUND) | **DEFINED** |
| **C1-RLS-07** | Order-item tenant containment: Verifikasi isolasi item via kueri induk | **DEFINED** |
| **C1-RLS-08** | Audit tenant containment: Log audit CPOE terisolasi strictly per-tenant | **DEFINED** |
| **C1-RLS-09** | Cross-tenant safety-token rejection: Token Tenant A ditolak membatalkan order Tenant B | **DEFINED** |
| **C1-RLS-10** | Missing tenant fails closed: UoW CPOE tanpa tenantId ditolak (AUTHORITATIVE_TENANT_REQUIRED) | **DEFINED** |
| **C1-RLS-11** | Invalid tenant fails closed: UoW CPOE dengan tenantId non-UUID ditolak | **DEFINED** |
| **C1-RLS-12** | Connection reuse strict PID: `client.processID === pg_backend_pid()`, Tenant A $\to$ release $\to$ same backend PID $\to$ GUC cleared $\to$ Tenant B | **DEFINED** |

---

## 12. Phased Implementation Structure

Implementasi Candidate C1 wajib dieksekusi secara bertahap:

```text
Phase C1-A : L1 Security Gate (6 rute aktif Stage-0 fail-closed 403, eliminasi mock actor)
Phase C1-B : UoW & Transaction Boundary (eliminasi transactionManager.js, CS 71, idempotency recovery)
Phase C1-C : CPOE PostgreSQL RLS Enforcement (C1-RLS-01..12, C1-CHILD-01..05)
Phase C1-D : Safety Decision Lifecycle Hardening (C1-SAFETY-01..08)
Phase C1-E : Adversarial Closure & Full Regression (FI-01..08, RACE-01..03, 129/129 regression)
```

---

## 13. Hard No-Go Conditions

Implementasi wajib **SEKETIKA BERHENTI (ABORT / NO-GO)** jika salah satu kondisi berikut terjadi:
1. Kueri baca lintas-tenant (*cross-tenant read*) berhasil melihat order tenant lain.
2. Kueri tulis lintas-tenant (*cross-tenant write*) berhasil menyisipkan order ke tenant lain.
3. Upaya pemalsuan header tenant (*tenant spoofing*) lolos dari gerbang controller.
4. Request tanpa tenant ID mencapai lapisan database PostgreSQL.
5. Request dengan tenant ID non-UUID mencapai lapisan database PostgreSQL.
6. Mock actor atau fallback `DEFAULT_TENANT_ID` masih aktif pada jalur eksekusi runtime.
7. Ditemukan koneksi socket kedua yang terbuka di dalam transaksi atomik UoW.
8. Rollback transaksi menyisakan mutasi parsial pada basis data (*forbidden partial state*).
9. Token keselamatan (*Safety Decision*) dapat digunakan lebih dari satu kali (*replay*).
10. Token keselamatan milik Tenant A dapat mengotorisasi pembatalan order milik Tenant B.
11. Ditemukan jalur bypass pada shared call site CS 71.
12. Catatan audit mengklaim status yang ternyata tidak berhasil di-commit ke basis data.
13. Setting GUC bocor ke transaksi berikutnya pada socket koneksi yang di-reuse.
14. Salah satu dari 129 pengujian regresi eksisting mengalami kegagalan (*broken regression*).
15. Isolasi `cpoe_order_items` (C1-CHILD-01..05) gagal dibuktikan tanpa migrasi skema.
16. Diperlukan migrasi DDL baru yang belum disetujui secara tertulis oleh Human Owner.

---

## 14. Baseline Regression Verification Evidence

Perintah eksekusi aktual:
```bash
npx vitest run \
  tests/p02b_wave1b1_real_rls_integration.test.js \
  tests/triageVerticalSlice.test.js \
  tests/p02b_wave1b1_triage_uow.test.js \
  tests/verticalSlice04TriageDurability.test.js \
  tests/p02b_wave1b1_l1_controller_gate.test.js \
  tests/triageEngine.test.js \
  tests/p02b_wave1b2_c2_real_rls_integration.test.js \
  tests/p02b_wave1b2_c2_l1_controller_gate.test.js \
  tests/verticalSlice09DiagnosticInterpretationDurability.test.js
```

Hasil eksekusi aktual (Captured):
```text
Test Files  9 passed (9)
     Tests  129 passed (129)
  Start at  15:19:18
  Duration  10.36s (transform 2.45s, setup 0ms, import 4.51s, tests 1.16s, environment 2ms)
```
Status: **129/129 PASS (100% GREEN, ZERO DEGRADATION)**.

---

```text
============================================================
C1 IMPLEMENTATION PLAN STATUS
============================================================

HUMAN OWNER DECISION:
C1 — ALREADY SELECTED

PLAN:
AMENDED

IMPLEMENTATION:
NOT STARTED

CURRENT STAGE-0:
134

C1 TARGET:
16

C1 ACTIVE STAGE-0 ROUTES:
6

C1 STATIC DB CALLS:
25

PRIMARY RISK:
TRANSACTIONAL INTEGRITY

SECONDARY RISKS:
TENANT ISOLATION
SAFETY AUTHORIZATION
CS71 SHARED EXECUTION PATH
CHILD TABLE ISOLATION
IDEMPOTENCY RECOVERY

REAL POSTGRESQL EVIDENCE:
REQUIRED

ADVERSARIAL TESTING:
REQUIRED

MIGRATION:
0 EXPECTED

FRONTEND:
0 EXPECTED

REGRESSION:
129/129 REQUIRED

IMPLEMENTATION:
BLOCKED UNTIL HUMAN OWNER APPROVAL

============================================================
STOP — DO NOT IMPLEMENT
============================================================
```
