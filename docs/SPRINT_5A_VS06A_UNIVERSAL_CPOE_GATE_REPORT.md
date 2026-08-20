# 🚪 SPRINT 5A / VERTICAL SLICE #06A: UNIVERSAL CPOE TRANSACTION CORE — FORMAL GATE REPORT

**Tanggal Laporan:** 20 Agustus 2026  
**Klasifikasi:** Formal Engineering Quality & Durability Gate  
**Modul/Fitur:** `VS-06A — Universal CPOE Transaction Core`  
**Otoritas Evaluasi:** Enterprise HIS Architecture Board & Clinical Safety Assurance  
**Status Gate:** 🟢 **PASSED & QUALIFIED (16/16 Chaos & Durability Tests Pass, Zero Regression)**

---

## 1. 📋 EXECUTIVE SUMMARY & OBJECTIVE

VS-06A adalah **Critical Dependency Unlocker** yang membangun fondasi tulang punggung transaksi order klinis (*Universal CPOE Ordering Backbone*) di atas PostgreSQL 16. Seluruh order (Laboratorium, Radiologi, Farmasi, Prosedur Medis) kini mengalir melalui satu pipeline transaksi atomik dengan jaminan idempotensi, penelusuran audit kriptografis SHA-256, dan *Transactional Outbox Pattern*.

```text
========================================================================================
STATUS EVIDENCE VERTICAL SLICE #06A:
========================================================================================
• Migration SQL Applied         : 051_universal_cpoe_transaction_core.sql (PostgreSQL 16)
• Public Database Tables Ready  : 170 Tables Verified
• Target Unit & Chaos Tests     : 16 / 16 TESTS PASS (100%)
• Cumulative Vertical Slices    : 64 / 64 TESTS PASS across VS-01 s.d. VS-06A
• Single Source of Truth        : PostgreSQL 16 (localStorage explicitly demoted)
• Transaction Boundary          : BEGIN ISOLATION LEVEL READ COMMITTED -> COMMIT
• Idempotency & Replay Guard    : Active (idempotency_key UNIQUE)
• Concurrency Control           : Active (expectedVersion vs version -> 409 Conflict)
• Cryptographic Audit Trail     : Active (SHA-256 Merkle-ready hash signature)
• Transactional Outbox          : Active (clinical_domain_outbox in same DB Tx)
========================================================================================
```

---

## 2. 🗂️ FILES CHANGED & ARTIFACTS INVENTORY

| Komponen | File Path | Peran & Tanggung Jawab Arsitektur |
| :--- | :--- | :--- |
| **SQL Migration** | [`database/migrations/051_universal_cpoe_transaction_core.sql`](file:///c:/Users/Mojo/NurseFlow-WebApp/database/migrations/051_universal_cpoe_transaction_core.sql) | Menambahkan kolom `idempotency_key`, `version`, `requester_id`, `requester_role`, `cancellation_reason`, tabel `cpoe_order_items`, tabel `clinical_domain_outbox`, dan index performa tinggi. |
| **Application Service** | [`server/services/cpoeApplication.service.js`](file:///c:/Users/Mojo/NurseFlow-WebApp/server/services/cpoeApplication.service.js) | Unit of Work Transaksi ACID, validasi status encounter, ekstraksi author JWT server-side, idempotency guard, optimistic concurrency versioning, audit SHA-256, dan outbox staging. |
| **REST Controller** | [`server/controllers/cpoe.controller.js`](file:///c:/Users/Mojo/NurseFlow-WebApp/server/controllers/cpoe.controller.js) | Canonical JSON response envelope (`{ success, data, meta }`), request tracing (`x-request-id`, `x-correlation-id`), dan error mapping. |
| **REST Router** | [`server/routes/orders.routes.js`](file:///c:/Users/Mojo/NurseFlow-WebApp/server/routes/orders.routes.js) | Wiring endpoint `/api/v1/orders/cpoe/*` dengan middleware `authenticateJwt` dan RBAC permission guard (`CPOE_ORDER_CREATE`, `CPOE_ORDER_READ`, `CPOE_ORDER_CANCEL`). |
| **RBAC Matrix** | [`src/shared/constants/roles.js`](file:///c:/Users/Mojo/NurseFlow-WebApp/src/shared/constants/roles.js) | Mendaftarkan permission `CPOE_ORDER_CREATE`, `CPOE_ORDER_READ`, `CPOE_ORDER_CANCEL` untuk dokter DPJP, IGD, dan peran penunjang. |
| **Durability Tests** | [`tests/verticalSlice06AUniversalCpoeDurability.test.js`](file:///c:/Users/Mojo/NurseFlow-WebApp/tests/verticalSlice06AUniversalCpoeDurability.test.js) | 16 skenario pengujian durabilitas ACID, idempotensi, crash rollback, outbox, optimisic locking, dan rekonsiliasi database state. |

---

## 3. 🏗️ TRANSACTION BOUNDARIES & DATA PIPELINE

```text
[ CLIENT REQUEST ]
POST /api/v1/orders/cpoe
Headers: Authorization (JWT), X-Request-ID, X-Correlation-ID
Body: { encounterId, orderCategory, priority, clinicalIndication, items, idempotencyKey }
       │
       ▼
[ EXPRESS MIDDLEWARE ]
authenticateJwt ➔ requirePermission('CPOE_ORDER_CREATE') ➔ Extract Actor Context
       │
       ▼
[ CPOE APPLICATION SERVICE (UNIT OF WORK) ]
       │
       ├── 1. BEGIN ISOLATION LEVEL READ COMMITTED;
       ├── 2. IF idempotencyKey EXISTS ➔ Return Committed Order (Idempotent Replay)
       ├── 3. SELECT encounters WHERE id = $1 FOR UPDATE (Enforce Active State)
       ├── 4. INSERT INTO clinical_orders (...) RETURNING *;
       ├── 5. INSERT INTO cpoe_order_items (...) [Loop all items];
       ├── 6. Generate Cryptographic SHA-256 Audit Signature;
       ├── 7. INSERT INTO universal_audit_logs (...);
       ├── 8. INSERT INTO clinical_domain_outbox (...);
       └── 9. COMMIT;
       │
       ▼
[ CANONICAL JSON RESPONSE ]
HTTP 201 Created
{
  "success": true,
  "data": { ...orderAggregate, items: [...] },
  "meta": { "orderId", "orderNumber", "auditSignature", "outboxEventId", "requestId", "correlationId", "timestamp" }
}
```

---

## 4. 🧨 EVALUASI FORMAL 16 CHAOS & DURABILITY TEST CASES (EVIDENCE RECONCILIATION)

| Test ID | Skenario Pengujian Durabilitas & Chaos | Hasil Pengujian & Bukti Teknis Lapangan | Status |
| :---: | :--- | :--- | :---: |
| **TC-01** | **Atomic Multi-Item CPOE Order Persistence** | Order multi-item (Lab, Rad, Meds) tersimpan atomik ke `clinical_orders` & `cpoe_order_items` bersama audit trail dan outbox event dalam 1 transaksi PostgreSQL. | 🟢 **PASS** |
| **TC-02** | **Idempotency Guard (Duplicate Submission)** | Re-submit dengan `idempotency_key` yang sama mengembalikan order yang sudah committed (`isIdempotentReplay = true`) tanpa menduplikasi baris di PostgreSQL. | 🟢 **PASS** |
| **TC-03** | **localStorage Wipe & Refresh Immunity** | Client storage di-wipe total (`localStorage.clear()`), data order & items tetap utuh 100% saat di-fetch dari PostgreSQL via server service. | 🟢 **PASS** |
| **TC-04** | **Discharged/Terminal Encounter Lock** | Pembuatan CPOE pada pasien berstatus `DISCHARGED`/`CANCELLED` ditolak keras (`ENCOUNTER_TERMINAL_STATE`), database 0 mutasi. | 🟢 **PASS** |
| **TC-05** | **Unauthorized Role Privilege Escalation** | Role non-dokter (`ROLE_CASHIER` / unauthorized actor) diblokir seketika (`FORBIDDEN_CPOE_ROLE`, HTTP 403) sebelum menyentuh database. | 🟢 **PASS** |
| **TC-06** | **Empty Order Items Invariant** | Request CPOE tanpa item (`items: []`) ditolak seketika (`EMPTY_ORDER_ITEMS`, HTTP 400). | 🟢 **PASS** |
| **TC-07** | **Order Cancellation with Medicolegal Rationale** | Pembatalan order mewajibkan alasan $\ge 5$ karakter, meng-update status seluruh item anak, menaikkan `version`, dan mencatat audit log + outbox event pembatalan. | 🟢 **PASS** |
| **TC-08** | **Atomic Rollback on Mid-Transaction DB Failure** | Injeksi kegagalan disk saat insert audit log memicu rollback total: terverifikasi **0 orphan rows** di `clinical_orders` dan `cpoe_order_items`. | 🟢 **PASS** |
| **TC-09** | **Cryptographic SHA-256 Audit Signature** | Signature audit terbukti menghasilkan hash SHA-256 heksadesimal 64 karakter valid yang mengikat dokter, pasien, order, dan timestamp server. | 🟢 **PASS** |
| **TC-10** | **4-Dimensional State Reconciliation Proof** | Rekonsiliasi 4 dimensi (*Business State + Database State + Audit State + Outbox State*) terbukti konsisten 100% tanpa diskrepansi (*0 discrepancy*). | 🟢 **PASS** |
| **TC-11** | **Express Controller Create Response Envelope** | Endpoint `POST /api/v1/orders/cpoe` mengembalikan canonical envelope `{ success: true, data, meta: { requestId, correlationId, auditSignature, outboxEventId } }`. | 🟢 **PASS** |
| **TC-12** | **Express Controller Cancel Response Envelope** | Endpoint `POST /api/v1/orders/cpoe/:id/cancel` mengembalikan response envelope standar dengan status 200 dan data order ter-update. | 🟢 **PASS** |
| **TC-13** | **Controller Read Aggregate Authorization & Fetch** | Endpoint `GET /api/v1/orders/cpoe/:id` & `GET /.../encounter/:id` dilindungi guard `CPOE_ORDER_READ` dan mengembalikan agregat order lengkap dengan item array. | 🟢 **PASS** |
| **TC-14** | **Distributed Correlation ID Tracing** | Nilai `x-correlation-id` terpropagasi konsisten di header order, audit log, dan event payload outbox untuk penelusuran APM end-to-end. | 🟢 **PASS** |
| **TC-15** | **Zero Orphan Rows on Outbox Stage Partition** | Pemutusan koneksi di tahap outbox memicu rollback menyeluruh dengan 0 baris tertinggal di database (*Zero Partial Write*). | 🟢 **PASS** |
| **TC-16** | **Optimistic Concurrency Conflict (Version Mismatch)** | Pembatalan dengan `expectedVersion` kadaluarsa (misal version=999) ditolak dengan `HTTP 409 CONCURRENCY_CONFLICT` untuk mencegah overwrite data paralel. | 🟢 **PASS** |

---

## 5. 🔍 REKONSILIASI DATABASE STATE (4-DIMENSIONAL AUDIT PROOF)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ HASIL REKONSILIASI 4 DIMENSI DATA (TC-10 VERIFIED):                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Business State  : Order Status = ORDERED, Total = Rp 225.000, Items Count = 2       │
│ 2. Database State  : clinical_orders (1 Row, Version = 1), cpoe_order_items (2 Rows)  │
│ 3. Audit State     : universal_audit_logs (1 Row, Action = CREATE, Hash Match)         │
│ 4. Outbox State    : clinical_domain_outbox (1 Row, Status = PENDING, Payload Match)   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ DISKREPANSI DATA: 0 (ZERO DISCREPANCY • 100% RECONCILED • ACID COMPLIANT)               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. ⚠️ SISA RISIKO TEKNIS & REKOMENDASI TAHAP BERIKUTNYA

1. **Consumer Modul Penunjang (Lab, Rad, Farmasi):**
   - *Status:* VS-06A telah menyediakan gerbang order universal. Modul LIS (VS-06B), RIS/PACS (VS-06C), dan Farmasi (VS-07) siap dibangun sebagai consumer langsung dari tabel `cpoe_order_items` dan `clinical_domain_outbox`.
2. **Outbox Poller / Relay Worker:**
   - *Rekomendasi:* Background worker untuk membaca `clinical_domain_outbox` dan meneruskannya ke WebSocket / EventBus dapat diaktifkan saat modul consumer (LIS/RIS/Farmasi) mulai mendengarkan event.

---

## 7. 🏁 KESIMPULAN & GATE APPROVAL

```text
========================================================================================
GATE VERDICT: 🟢 VS-06A UNIVERSAL CPOE TRANSACTION CORE QUALIFIED
========================================================================================
Kriteria Penerimaan:
[x] NO DATA LOSS
[x] NO DUPLICATE TRANSACTION
[x] NO SILENT FAILURE
[x] FULL AUDIT TRACE
[x] POSTGRESQL = SINGLE SOURCE OF TRUTH
========================================================================================
Status: SIAP DILANJUTKAN KE STEP 2 (VS-06B: LABORATORY ORDER VERTICAL SLICE).
========================================================================================
```
