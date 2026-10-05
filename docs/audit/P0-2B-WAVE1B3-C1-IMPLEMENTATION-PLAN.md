# P0-2B WAVE 1B.3 — C1 (CPOE ORDERS & SAFETY) IMPLEMENTATION PLAN
## Master Architectural Blueprint & Adversarial Acceptance Contract

**Document ID:** `docs/audit/P0-2B-WAVE1B3-C1-IMPLEMENTATION-PLAN.md`  
**Date:** 2026-10-05  
**Governance Mode:** STRICT READ-ONLY IMPLEMENTATION PLANNING  
**Repository HEAD:** `149fb870289e75382612bd5a62412a8d4acd7430`  
**Active Branch:** `feature/security-foundation-wave1a10`  
**Target Domain:** Candidate C1 — Computerized Physician Order Entry (CPOE) Orders & Safety Authorization  
**Human Owner Decision:** C1 — ALREADY SELECTED (Authoritative)  
**Implementation Execution:** NOT STARTED (Strict Read-Only Blueprint)

---

## 1. Verified Baseline & Catalog Reconciliation

Pemeriksaan repositori dan basis data laboratorium `nurseflow_security_lab` (PostgreSQL 16) membuktikan baseline kanonik berikut:

### Repositori & Utang Keamanan:
- **Repository HEAD:** `149fb870289e75382612bd5a62412a8d4acd7430`
- **Active Branch:** `feature/security-foundation-wave1a10`
- **Working Tree:** `CLEAN` (0 uncommitted files)
- **Current System Remaining Stage-0 Debt:** **134 Call Sites** (setelah reduksi 11 CS pada Wave 1B.2 Candidate C2)
- **C1 Target Stage-0 Call Sites:** **16 Call Sites** (CS 59-71 pada `cpoeApplication.service.js`, CS 143-145 pada `safetyAuthorization.service.js`)
- **C1 Static AST DB Call Sites:** **25 titik pemanggilan** (6 Writes, 19 Reads)
- **C1 Active Stage-0 Routes:** **6 rute**
- **C1 Total Module Routes:** **9 rute**
- **Shared Call Site:** `CS 71` (`listOrders` pada `cpoeApplication.service.js:609`) dipanggil oleh 2 rute Express.
- **Combined Regression Baseline:** **129/129 PASS** (81/81 Canonical Baseline + 48/48 C2 Foundation).

### Canonical PostgreSQL 16 Catalog Evidence (`clinical_orders`):
Pemeriksaan sistem langsung melalui `pg_catalog.pg_constraint` pada basis data `nurseflow_security_lab`:
- **Inbound FK constraints:** **17 constraints**
- **Referring tables:** **15 tabel unik** (`[DISCREPANCY]` tercatat di bawah)
- **Outbound FK constraints:** **4 constraints** (`encounters.id`, `episodes_of_care.id`, `master_patients.id`, `tenant_organizations.id`)

```text
[DISCREPANCY — REFERRING TABLES COUNT: 15 vs 13]
Evidence: Prompt menyebutkan ekspektasi 13 referring tables. Namun kueri katalog pg_constraint membuktikan terdapat tepat 15 tabel unik yang merujuk ke clinical_orders:
  1. blood_crossmatch_tests
  2. cpoe_order_items
  3. diagnostic_result_notifications
  4. diagnostic_secondary_actions
  5. laboratory_orders
  6. laboratory_panic_alerts
  7. laboratory_test_results
  8. medication_dispense_allocations
  9. medication_emar_administrations
 10. medication_orders (memiliki 2 FK: cpoe_order_id, order_id)
 11. prescription_dispense_records
 12. radiology_critical_finding_alerts
 13. radiology_orders (memiliki 2 FK: cpoe_order_id, order_id)
 14. radiology_reports
 15. radiology_studies
Analisis Dampak: 17 constraint terbagi pada 15 tabel karena medication_orders dan radiology_orders masing-masing memiliki 2 FK ke clinical_orders. Diskrepansi ini tidak membatalkan rencana implementasi C1, melainkan memperkuat akurasi pemetaan dependensi relasional.
```

---

## 2. Exact C1 Execution Surface

### 2.1. Controllers
1. `server/controllers/cpoe.controller.js`:
   - `createOrder`: Ingress handler untuk penerbitan ordonansi medis CPOE master.
   - `cancelOrder`: Ingress handler untuk pembatalan order medicolegal dengan verifikasi Safety Decision.
   - `getOrderById`: Ingress handler detail order beserta item.
   - `getOrdersByEncounter`: Ingress handler pencarian order per encounter pasien.
   - `listOrders`: Ingress handler filter dan listing order (mengeksekusi shared call site CS 71).

### 2.2. Application & Safety Services
1. `server/services/cpoeApplication.service.js`:
   - Mengelola siklus hidup CPOE: invariant validation, idempotency lock, encounter status check, order header insertion, order items insertion, versioning, pembatalan status, audit logging, outbox event generation.
2. `server/services/safetyAuthorization.service.js`:
   - Otoritas verifikasi keselamatan dan otorisasi dua orang: `verifyAndConsumeTransactional(client, ...)` memverifikasi signature hash SHA-256 (RFC 8785 canonical JCS), row-level lock `FOR UPDATE` pada `safety_decision_registry`, mencegah replay token, dan mencatat waktu/aktor konsumsi secara atomik.

### 2.3. Infrastruktur Transaksi
1. `server/db/transactionManager.js`:
   - Wrapper transaksi legacy yang membuka raw connection `pool.connect()` tanpa penegakan GUC tenant RLS (`SET LOCAL app.current_tenant_id`). Wajib dieliminasi dari jalur eksekusi runtime C1.
2. `server/db/unitOfWork.js`:
   - Infrastruktur Unit of Work kanonik (`withUnitOfWork`). Mengatur validasi UUID fail-closed 403, injeksi `SET LOCAL` scoped GUC (`app.current_tenant_id`, `app.current_user_id`, `app.current_user_role`), siklus `BEGIN -> OPERATION -> COMMIT / ROLLBACK`, dan sanitasi koneksi 3-tier (`DISCARD ALL`).

### 2.4. Route Inventory & Klasifikasi
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

## 3. Transaction Architecture Map

Peta arsitektur transaksi C1 membuktikan bahwa migrasi dari `transactionManager.js` ke `withUnitOfWork` bukan sekadar penggantian nama, melainkan restrukturisasi kepemilikan koneksi, scoping GUC, dan batas rollback.

### 3.1. Workflow 1: Create Order (`POST /api/v1/orders/cpoe`)
```text
HTTP Request
  ↓
[Gate 1] L1 Fail-Closed Tenant Context Gate
         - req.tenantId diverifikasi UUID v4 via isValidUuid
         - Jika kosong/invalid: REJECT 403 TENANT_CONTEXT_REQUIRED
  ↓
[Gate 2] Actor Provenance Check
         - req.user wajib terotentikasi dari JWT (tanpa fallback USR-DOC-001)
  ↓
cpoeController.createOrder
  ↓
cpoeApplicationService.createOrder
  ↓
withUnitOfWork({ tenantId, actorId, userRole }, async (tx) => {
  │
  ├─ Connection Lifecycle:
  │  1. pool.connect() -> dedicated client checkout
  │  2. BEGIN ISOLATION LEVEL READ COMMITTED
  │  3. SET LOCAL app.current_tenant_id = $tenantId
  │  4. SET LOCAL app.current_user_id = $actorId
  │  5. SET LOCAL app.current_user_role = $userRole
  │
  ├─ Query 1 (CS 59): Idempotency Row Lock
  │  tx.query('SELECT * FROM clinical_orders WHERE idempotency_key = $1 FOR UPDATE;', [...])
  │  [Failure Point 1]: Idempotent hit -> return existing order tanpa re-insert.
  │
  ├─ Query 2: Lock & Validate Encounter Status
  │  tx.query('SELECT id, patient_id, episode_id, status, tenant_id FROM encounters WHERE id = $1 FOR UPDATE;', [...])
  │  [Failure Point 2]: Encounter tidak ditemukan / status terminal (DISCHARGED/CANCELLED) -> THROW 400/404.
  │
  ├─ Query 3 (CS 66): Insert Order Header
  │  tx.query('INSERT INTO clinical_orders (...) VALUES (...) RETURNING *;', [...])
  │  [Failure Point 3]: NOT NULL constraint / invalid foreign key -> THROW error.
  │
  ├─ Query 4 (Loop): Insert Order Items
  │  tx.query('INSERT INTO cpoe_order_items (...) VALUES (...);', [...])
  │  [Failure Point 4]: Invalid item quantity / price mismatch -> THROW error.
  │
  ├─ Query 5 (CS 60): Insert Immutable WORM Audit Log
  │  tx.query('INSERT INTO universal_audit_logs (...) VALUES (...);', [...])
  │  [Failure Point 5]: Audit generation failure -> THROW error.
  │
  ├─ Query 6: Enqueue Domain Event to Outbox
  │  tx.query('INSERT INTO clinical_domain_outbox (...) VALUES (...);', [...])
  │
  └─ Lifecycle Completion:
     - COMMIT
     - inTransaction = false
})
  ↓
Finally: DISCARD ALL executed -> client.release() kembali ke pool bersih
```

### 3.2. Workflow 2: Cancel Order (`POST /api/v1/orders/cpoe/:id/cancel`)
```text
HTTP Request
  ↓
[Gate 1] L1 Fail-Closed Tenant Context Gate (403 if invalid tenantId)
  ↓
cpoeController.cancelOrder
  ↓
cpoeApplicationService.cancelOrder
  ↓
withUnitOfWork({ tenantId, actorId, userRole }, async (tx) => {
  │
  ├─ Connection Lifecycle: Single pooled client, BEGIN, SET LOCAL tenant/user/role
  │
  ├─ Query 1 (CS 61): Order Header Lock
  │  tx.query('SELECT * FROM clinical_orders WHERE id = $1 FOR UPDATE;', [orderId])
  │  [Failure Point 1]: Order not found / cross-tenant hidden by RLS -> THROW 404 ORDER_NOT_FOUND.
  │
  ├─ Query 2 (CS 144, CS 145b): Cross-Service Safety Decision Verification & Consumption
  │  safetyAuthorizationService.verifyAndConsumeTransactional(tx, { ... })
  │  │
  │  ├─ Menggunakan objek tx yang sama (Single Connection Discipline, Zero Second Socket)
  │  ├─ tx.query('SELECT ... FROM safety_decision_registry WHERE decision_id = $1 FOR UPDATE;')
  │  ├─ Status Checks: CONSUMED (409), REVOKED (403), EXPIRED (401), NOT_FOUND (404)
  │  ├─ Hash Check: RFC 8785 Canonical JSON command payload hash SHA-256 match
  │  └─ tx.query("UPDATE safety_decision_registry SET status = 'CONSUMED', consumed_at = NOW(), ... WHERE decision_id = $1;")
  │
  ├─ Query 3 (CS 62): Update Order Header Status
  │  tx.query("UPDATE clinical_orders SET status = 'CANCELLED', version = $newVersion, ... WHERE id = $orderId;")
  │
  ├─ Query 4: Update Order Items Status
  │  tx.query("UPDATE cpoe_order_items SET status = 'CANCELLED', ... WHERE order_id = $orderId;")
  │
  ├─ Query 5 (CS 63): Insert WORM Audit Log with Linked Safety Decision ID
  │  tx.query('INSERT INTO universal_audit_logs (..., decision_id, ...) VALUES (...);')
  │
  ├─ Query 6: Enqueue Cancellation Outbox Event
  │  tx.query('INSERT INTO clinical_domain_outbox (...) VALUES (...);')
  │
  └─ COMMIT
})
  ↓
Finally: DISCARD ALL -> client.release()
```

### 3.3. Verifikasi Koneksi Tersembunyi (Hidden Connections Audit)
Pemeriksaan menyeluruh pada seluruh jalur eksekusi C1:
- **`pool.query` tersembunyi:** Terdapat pada catch block idempotency fallback (`cpoeApplication.service.js:333-344`) dan method read (`getOrderById`, `getOrdersByEncounter`, `listOrders`). Pada Wave C1-B, fallback idempotency di dalam catch block akan diselaraskan agar tidak membuka kueri tanpa konteks tenant.
- **`pool.connect` kedua dalam transaksi:** **NOL (0)**. Baik `cpoeApplicationService` maupun `safetyAuthorizationService` menggunakan objek `tx` / `client` yang sama secara berurutan.
- **Transaksi tersarang (*Nested Transactions*):** **NOL (0)**. Tidak ada pernyataan `SAVEPOINT` atau `BEGIN` kedua.
- **Status:** **TIDAK ADA KONEKSI KEDUA TERSEMBUNYI DALAM TRANSAKSI ATOMIK**.

---

## 4. L1 Tenant Gate Implementation

### Persyaratan Gerbang Ingress:
1. Setiap rute aktif Stage-0 (`POST /cpoe`, `POST /cpoe/:id/cancel`, `GET /cpoe`, `GET /cpoe/:id`, `GET /cpoe/encounter/:encounterId`, `GET /orders`) **wajib melewati validasi fail-closed**.
2. Ekstraksi konteks tenant dari `req.tenantId` yang disahkan oleh middleware anti-spoofing (`tenantMiddleware.js`).
3. Validasi ketat format UUID v4 (`isValidUuid(tenantId)`).
4. Jika `tenantId` kosong, null, atau tidak berformat UUID:
   ```json
   {
     "success": false,
     "error": "TENANT_CONTEXT_REQUIRED",
     "message": "Tenant context is mandatory and must be a valid UUID.",
     "statusCode": 403
   }
   ```
5. **Zero Hardcoded Fallback:** Menghapus total fallback `00000000-0000-0000-0000-000000000001` pada `cpoeApplication.service.js:168`.

---

## 5. Actor Provenance Contract

Audit sumber identitas aktor pada controller C1 (`cpoe.controller.js:18-22, 76-80`):
- **Kondisi Eksisting:**
  ```javascript
  const actor = req.user || {
    userId: 'USR-DOC-001',
    username: 'dr_siti',
    role: 'ROLE_DOCTOR_DPJP'
  };
  ```
- **Klasifikasi Keamanan:** `UNSAFE MOCK FALLBACK`.
- **Target Perbaikan:**
  1. Identitas staf dokter wajib **`JWT-derived`** melalui `authenticateJwt`.
  2. Jika `req.user` tidak ada atau tidak valid, request ditolak langsung dengan status `401 UNAUTHORIZED`.
  3. Objek aktor harus memuat:
     - `userId`: `req.user.id || req.user.userId`
     - `username`: `req.user.username`
     - `role`: `req.user.role` (e.g. `ROLE_DOCTOR_DPJP`, `ROLE_DOCTOR_DUTY`)
     - `tenantId`: `req.tenantId`
  4. Pengesahan pembatalan order (`safetyDecision`) wajib mencatat aktor yang melakukan pembatalan dan aktor penandatangan safety token tanpa menggunakan identitas tiruan.

---

## 6. Real PostgreSQL RLS Acceptance Suite (Minimum 12 Scenarios)

Pengujian akan dibangun pada file baru `tests/p02b_wave1b3_c1_real_rls_integration.test.js` yang dieksekusi terhadap `nurseflow_security_lab` di bawah user `nurseflow_app_user` (`rolsuper=false`, `rolbypassrls=false`):

| Test ID | Skenario Pengujian | Hasil yang Diharapkan |
|---|---|---|
| **C1-RLS-01** | Own-tenant read: Tenant A membaca order CPOE miliknya | Mengembalikan data order Tenant A lengkap dengan status 200 |
| **C1-RLS-02** | Cross-tenant read: Tenant B mencoba membaca order Tenant A via ID | Mengembalikan 0 baris / 404 `ORDER_NOT_FOUND` (tersembunyi oleh RLS) |
| **C1-RLS-03** | Own-tenant write: Tenant A menerbitkan order CPOE baru di bawah UoW | Berhasil disimpan di `clinical_orders` dan `cpoe_order_items` dengan `tenant_id` Tenant A |
| **C1-RLS-04** | Cross-tenant write: Tenant A mencoba menyisipkan order dengan `tenant_id` Tenant B | Ditolak oleh PostgreSQL RLS dengan error code `42501 (insufficient_privilege)` |
| **C1-RLS-05** | Cross-tenant update: Tenant B mencoba mengubah order Tenant A | Mengembalikan 0 baris ter-update (RLS write isolation) |
| **C1-RLS-06** | Cross-tenant cancellation: Tenant B mencoba membatalkan order Tenant A | Gagal dengan 404 `ORDER_NOT_FOUND` (karena order Tenant A tidak tampak bagi Tenant B) |
| **C1-RLS-07** | Order-item tenant containment: Pembacaan item order dibatasi hanya jika order induk tampak | Kueri item milik Tenant A tidak dapat diakses saat sesi tenant B aktif |
| **C1-RLS-08** | Audit tenant containment: Log audit CPOE hanya terlihat oleh tenant pemilik | `SELECT * FROM universal_audit_logs` hanya memunculkan audit log milik tenant yang aktif |
| **C1-RLS-09** | Cross-tenant safety-token rejection: Token keselamatan Tenant A dipakai membatalkan order Tenant B | Ditolak oleh `safetyAuthorizationService` dengan 403 `SAFETY_DECISION_TENANT_MISMATCH` |
| **C1-RLS-10** | Missing tenant fails closed: Eksekusi UoW CPOE tanpa tenantId | Ditolak seketika oleh `withUnitOfWork` dengan error `AUTHORITATIVE_TENANT_REQUIRED` |
| **C1-RLS-11** | Invalid tenant fails closed: Eksekusi UoW CPOE dengan tenantId non-UUID | Ditolak seketika oleh pre-condition gate `isValidUuid` |
| **C1-RLS-12** | Connection reuse / GUC hygiene: Penggunaan ulang koneksi pool yang sama | Memverifikasi `client.processID === pg_backend_pid()`, mengeksekusi Tenant A, release ke pool, checkout kembali di backend PID yang sama untuk Tenant B, dan memastikan nol kebocoran setting GUC (`app.current_tenant_id`) |

---

## 7. Child Table RLS & Architectural Limitation

Pemeriksaan status RLS tabel C1 pada katalog basis data:

| Nama Tabel | Status `relrowsecurity` | Status `relforcerowsecurity` | Mekanisme Perlindungan Tenant | Klasifikasi Arsitektur |
|---|:---:|:---:|---|:---:|
| `clinical_orders` | **`true`** | **`true`** | PostgreSQL Native RLS (`tenant_isolation_clinical_orders`) | **FULL RLS ENFORCED** |
| `safety_decision_registry` | **`true`** | **`true`** | PostgreSQL Native RLS (`tenant_isolation_safety_decision_registry`) | **FULL RLS ENFORCED** |
| `universal_audit_logs` | **`true`** | **`true`** | PostgreSQL Native RLS (`tenant_isolation_universal_audit_logs`) | **FULL RLS ENFORCED** |
| `encounters` | **`true`** | **`true`** | PostgreSQL Native RLS (`tenant_isolation_encounters`) | **FULL RLS ENFORCED** |
| `cpoe_order_items` | **`false`** | **`false`** | Foreign Key ke `clinical_orders(id)` (`ON DELETE CASCADE`) + Application-level query filtering (`WHERE order_id = $1`) | **ACCEPTED ARCHITECTURAL LIMITATION** |

### Analisis Architectural Limitation `cpoe_order_items`:
- Skema `cpoe_order_items` **tidak memiliki kolom `tenant_id`**.
- Karena batasan fase ini adalah `MIGRATIONS = 0 EXPECTED`, tabel ini **tidak dapat diberikan kebijakan RLS kolom langsung tanpa DDL migration**.
- Perlindungan tenant untuk `cpoe_order_items` dijamin secara berlapis melalui:
  1. **Induk Ber-RLS:** Akses ke item selalu melalui induk `clinical_orders` yang dilindungi RLS aktif.
  2. **Integritas Referensial FK:** Item tidak dapat dibuat tanpa merujuk ke baris `clinical_orders` yang sah.
  3. **Unit of Work Boundary:** Seluruh mutasi item dilingkupi transaksi UoW yang sama dengan order header.

---

## 8. CS 71 Shared Call Site Protection Blueprint

Shared Call Site `CS 71` berlokasi di `server/services/cpoeApplication.service.js:609` dalam fungsi `listOrders`:
```text
GET /api/v1/orders/cpoe  ──┐
                           ├──> cpoeController.listOrders ──> cpoeApplicationService.listOrders ──> CS 71
GET /api/v1/orders       ──┘
```

### Rencana Pengamanan CS 71:
1. Kedua rute Express (`/api/v1/orders/cpoe` dan `/api/v1/orders`) wajib dipasangi middleware anti-spoof dan gerbang L1 fail-closed.
2. Parameter `req.tenantId` diekstraksi dan diteruskan ke method service: `cpoeApplicationService.listOrders(filters, tenantContext)`.
3. Kueri `SELECT * FROM clinical_orders` dieksekusi di bawah koneksi yang menyetel GUC tenant (`SET LOCAL app.current_tenant_id`) atau menyertakan klausul eksplisit `tenant_id = $tenantId`.
4. Suite pengujian wajib memverifikasi secara independen bahwa **tidak ada rute yang dapat membypass pengamanan CS 71**.

---

## 9. Safety Authorization Lifecycle & Testing Contract

Fungsi `safetyAuthorizationService.verifyAndConsumeTransactional(tx, ...)` mengatur alur otorisasi berisiko tinggi. Minimum 8 skenario pengujian adversarial:

| Test ID | Skenario Safety Authorization | Hasil yang Diharapkan |
|---|---|---|
| **C1-SAFETY-01** | Valid token succeeds | Token status `ISSUED`, hash payload cocok, belum expired -> Status berubah `CONSUMED`, order dibatalkan |
| **C1-SAFETY-02** | Invalid token rejected | Decision ID palsu / tidak ada di database -> Ditolak 404 `SAFETY_DECISION_NOT_FOUND` |
| **C1-SAFETY-03** | Expired token rejected | Token dengan `expires_at < NOW()` -> Ditolak 401 `SAFETY_DECISION_EXPIRED`, status token diubah `EXPIRED` |
| **C1-SAFETY-04** | Consumed token cannot replay | Token berstatus `CONSUMED` digunakan kembali -> Ditolak 409 `SAFETY_DECISION_ALREADY_CONSUMED` |
| **C1-SAFETY-05** | Cross-tenant token rejection | Token diterbitkan untuk Tenant A tetapi dipakai membatalkan order Tenant B -> Ditolak 403 `SAFETY_DECISION_TENANT_MISMATCH` |
| **C1-SAFETY-06** | Unauthorized actor rejection | Aktor yang meminta pembatalan berbeda hak/identitas dengan spesifikasi otorisasi token -> Ditolak 403 `UNAUTHORIZED_CONSUMER` |
| **C1-SAFETY-07** | Atomic consumption & order mutation | Token `CONSUMED` dan order `CANCELLED` dikomit bersama dalam transaksi yang sama | State keduanya konsisten di basis data |
| **C1-SAFETY-08** | Rollback semantics proven | Error dipicu setelah konsumsi token tetapi sebelum commit transaksi -> Rollback membatalkan konsumsi token (status token kembali `ISSUED`, status order tetap `ORDERED`) |

---

## 10. Transaction Adversarial Failure Injection Tests

Pengujian injeksi kegagalan transaksional untuk membuktikan tidak ada mutasi parsial ilegal (*no forbidden partial state*):

| Titik Injeksi Kegagalan (Failure Injection Point) | Aksi yang Dibatalkan | Status Basis Data Pasca-Rollback |
|---|---|---|
| **FI-01:** Setelah `INSERT INTO clinical_orders` | Patahkan kueri sebelum item di-insert | Baris order header tidak ada di DB (Rollback bersih) |
| **FI-02:** Setelah `INSERT INTO cpoe_order_items` | Patahkan kueri sebelum audit log di-insert | Header dan seluruh item tidak ada di DB |
| **FI-03:** Sebelum `verifyAndConsumeTransactional` | Patahkan kueri saat memvalidasi status order | Order tidak dibatalkan, token tidak terpakai |
| **FI-04:** Setelah token status diubah `CONSUMED` | Patahkan kueri sebelum update status order | Token tetap `ISSUED` (tidak ter-consume), order tetap `ORDERED` |
| **FI-05:** Setelah update `status = 'CANCELLED'` | Patahkan kueri sebelum audit log pembatalan | Order tetap `ORDERED`, token tetap `ISSUED` |
| **FI-06:** Sebelum penulisan `universal_audit_logs` | Simulasikan error pembuatan hash audit | Seluruh mutasi pembatalan di-rollback |
| **FI-07:** Setelah audit sebelum outbox | Patahkan kueri penulisan outbox | Seluruh mutasi di-rollback bersih |
| **FI-08:** Tepat sebelum pernyataan `COMMIT` | Paksa koneksi database terputus / throw error | Basis data tidak memuat mutasi parsial apa pun |

---

## 11. Connection & UoW Adversarial Tests

1. **UoW-CONN-01 (Single Socket Proof):** Memverifikasi bahwa seluruh operasi dalam `createOrder` dan `cancelOrder` hanya menggunakan tepat 1 socket koneksi klien database.
2. **UoW-CONN-02 (Zero Second Connect):** Memastikan `pool.connect()` tidak pernah dipanggil kedua kali di dalam callback UoW.
3. **UoW-CONN-03 (No Nested Transaction):** Memastikan tidak ada pernyataan `BEGIN` kedua yang memicu error PostgreSQL 25001 (`active sql transaction`).
4. **UoW-CONN-04 (GUC Scoping Isolation):** Memverifikasi bahwa GUC yang disetel dengan `SET LOCAL` otomatis hilang saat transaksi di-commit atau di-rollback.

---

## 12. Concurrency Race Condition Tests

1. **C1-RACE-01 (Double Cancellation Race):** Dua request pembatalan simultan mengeksekusi order yang sama dengan dua token berbeda.  
   *Hasil Ekspektasi:* Kunci baris `SELECT ... FOR UPDATE` memastikan hanya satu request yang berhasil membatalkan order; request kedua ditolak dengan `400 ORDER_ALREADY_CANCELLED` atau `409 CONCURRENCY_CONFLICT`.
2. **C1-RACE-02 (Double Token Consumption Race):** Dua proses konkuren mencoba mengonsumsi token safety decision yang sama secara bersamaan.  
   *Hasil Ekspektasi:* Kunci baris `SELECT ... FOR UPDATE` pada `safety_decision_registry` menjamin tepat 1 proses yang sukses mengonsumsi token; proses kedua ditolak dengan `409 SAFETY_DECISION_ALREADY_CONSUMED`.
3. **C1-RACE-03 (Concurrent Order Version Mutation):** Dua dokter mencoba memperbarui versi order CPOE secara konkuren.  
   *Hasil Ekspektasi:* Pengecekan `version = expectedVersion` menolak pembaruan paralel yang berkonflik, mencegah insiden *lost update*.

---

## 13. Phased Implementation Wave Structure

Implementasi Candidate C1 wajib dieksekusi secara bertahap melalui 5 sub-gelombang:

```text
C1-A (L1 Security Gate)
  ↓
C1-B (UoW & Transaction Boundary)
  ↓
C1-C (CPOE PostgreSQL RLS Enforcement)
  ↓
C1-D (Safety Decision Lifecycle Hardening)
  ↓
C1-E (Adversarial Closure & Full Regression)
```

### Kriteria Penerimaan Sub-Gelombang:
- **Phase C1-A — L1 Security Gate:**
  - Gerbang `isValidUuid` fail-closed 403 dipasang pada 6 rute aktif Stage-0.
  - Mock actor fallback dihapus; wajib JWT-authenticated.
  - Deliverable: Suite pengujian L1 controller gate (`tests/p02b_wave1b3_c1_l1_controller_gate.test.js`) 100% PASS.
- **Phase C1-B — UoW & Transaction Boundary:**
  - Mengeliminasi `transactionManager.js` dari `createOrder`.
  - Membungkus `createOrder` dan `cancelOrder` ke dalam `withUnitOfWork`.
  - Mengamankan shared call site CS 71 pada kedua rute.
  - Membuktikan zero second connection.
- **Phase C1-C — CPOE PostgreSQL RLS Enforcement:**
  - Mengintegrasikan isolasi tenant pada tabel `clinical_orders`.
  - Menguji isolasi kueri item `cpoe_order_items` via order header.
  - Deliverable: Suite pengujian Real PostgreSQL RLS 12 skenario (C1-RLS-01 s.d. C1-RLS-12).
- **Phase C1-D — Safety Decision Lifecycle Hardening:**
  - Penyelarasan `verifyAndConsumeTransactional` di bawah konteks UoW.
  - Deliverable: Suite pengujian Safety Authorization 8 skenario (C1-SAFETY-01 s.d. C1-SAFETY-08).
- **Phase C1-E — Adversarial Closure:**
  - Eksekusi failure injection (FI-01 s.d. FI-08), connection reuse strict PID test, dan concurrency race tests (C1-RACE-01 s.d. C1-RACE-03).
  - Regresi kanonik lengkap: **129/129 PASS** tanpa degradasi.

---

## 14. Hard No-Go Conditions

Proses implementasi wajib **SEKETIKA BERHENTI (ABORT/NO-GO)** jika salah satu kondisi berikut terjadi:
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
15. Diperlukan migrasi DDL baru yang belum disetujui secara tertulis oleh Human Owner.

---

## 15. Scope Guard

- **Database Migrations:** **0 (NOL) MIGRATIONS EXPECTED**.
- **Frontend Source Code:** **0 (NOL) FRONTEND CHANGES EXPECTED**.
- **Aturan Pembatasan:** Jika selama implementasi ditemukan kebutuhan perubahan skema atau frontend, implementor dilarang melanjutkan dan wajib meminta persetujuan tertulis resmi dari Human Owner.

---

## 16. Required Verification Test Matrix

| Kategori Pengujian | Target File Pengujian | Jumlah Minimum Kasus Uji | Ekspektasi |
|---|---|:---:|:---:|
| **C1 L1 Controller Gate** | `tests/p02b_wave1b3_c1_l1_controller_gate.test.js` | Seluruh 6 rute aktif Stage-0 | 100% Fail-Closed 403 |
| **Real PostgreSQL RLS** | `tests/p02b_wave1b3_c1_real_rls_integration.test.js` | 12 skenario (RLS-01 s.d. RLS-12) | 100% Row Isolation |
| **Safety Authorization** | `tests/p02b_wave1b3_c1_safety_authorization.test.js` | 8 skenario (SAFETY-01 s.d. SAFETY-08) | Zero Replay, Zero Mismatch |
| **Failure Injection** | Diintegrasikan dalam suite RLS/UoW | 8 skenario (FI-01 s.d. FI-08) | 100% Clean Rollback |
| **CS 71 Shared Route Tests** | Diintegrasikan dalam suite L1 Gate | 2 rute (`/cpoe` dan `/orders`) | Zero Bypass |
| **Connection Reuse Strict PID** | Diintegrasikan dalam suite Real RLS | 1 skenario ketat (C1-RLS-12) | `processID === backend_pid` |
| **Concurrency Race Tests** | Diintegrasikan dalam suite Safety/RLS | 3 skenario (RACE-01 s.d. RACE-03) | Zero Lost Update |
| **Existing C1 Durability** | `tests/verticalSlice06AUniversalCpoeDurability.test.js` | Terverifikasi eksis | 100% Preserved |
| **Canonical Baseline Suite** | 6 suite kanonik Wave 1B.1 | 81 pengujian | 81/81 PASS |
| **C2 Foundation Suite** | 3 suite kanonik Wave 1B.2 | 48 pengujian | 48/48 PASS |
| **Combined System Regression** | Seluruh 9 suite aktif | 129 pengujian | **129/129 PASS** |

---

## 17. Definition of Done (DoD)

Candidate C1 hanya dapat dinyatakan **CLOSED** apabila seluruh kriteria berikut terpenuhi secara tuntas:
1. Tepat **16 Stage-0 Unsafe Call Sites** berhasil diamankan di bawah `withUnitOfWork`.
2. Seluruh **6 rute aktif Stage-0** terbukti gagal-tutup (fail-closed 403) pada header/token tidak valid.
3. Kedua rute yang mengeksekusi **shared call site CS 71** terbukti terlindungi penuh.
4. Zero mock/default tenant atau mock actor pada jalur eksekusi runtime.
5. Seluruh mutasi tulis dieksekusi di bawah satu pemilik transaksi (`withUnitOfWork`).
6. Terbukti tidak ada koneksi database kedua yang tersembunyi.
7. Suite Real PostgreSQL RLS 12 skenario lulus 100% di basis data `nurseflow_security_lab`.
8. Suite Safety Authorization 8 skenario lulus 100%.
9. Pengujian kegagalan dan rollback lulus tanpa mutasi parsial.
10. Pengujian reuse koneksi membuktikan socket backend yang sama bersih dari kebocoran GUC.
11. Pengujian konkurensi membuktikan ketahanan terhadap *race condition*.
12. Integritas audit log WORM terverifikasi konsisten dengan mutasi yang dikomit.
13. Suite durability eksisting tetap lulus 100%.
14. Seluruh 129 pengujian regresi gabungan tetap hijau (129/129 PASS).
15. Nol migrasi basis data dan nol perubahan frontend.
16. Keterbatasan RLS tabel anak (`cpoe_order_items`) terdokumentasi resmi sebagai *Accepted Architectural Limitation*.

---

```text
============================================================
C1 IMPLEMENTATION PLAN STATUS
============================================================

HUMAN OWNER DECISION:
C1 — ALREADY SELECTED

PLAN:
CREATED

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
BLOCKED UNTIL PLAN REVIEW

============================================================
STOP — DO NOT IMPLEMENT
============================================================
```
