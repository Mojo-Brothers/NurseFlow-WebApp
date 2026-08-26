# 🏛️ STANDAR HIERARKI PEROLEHAN KUNCI & PENCEGAHAN DEADLOCK
## NurseFlow Enterprise Hospital Information System 2026 — FASE 5A.4
**Standar:** Joint Commission International (JCI), PostgreSQL 16 Transactional Concurrency & ACID Integrity

---

## 📌 Prinsip Utama Pencegahan Deadlock

Deadlock pada PostgreSQL (`40P01`) terjadi ketika dua transaksi simultan mengakuisisi kunci baris (*row-level locks*) dengan urutan yang saling bersilangan:
- **Transaksi A**: Mengunci `Resource 1` $\rightarrow$ Mencoba mengunci `Resource 2`
- **Transaksi B**: Mengunci `Resource 2` $\rightarrow$ Mencoba mengunci `Resource 1`

Untuk mengeliminasi seluruh kemungkinan siklus penguncian (*lock cycles*), NurseFlow Enterprise HIS 2026 menetapkan **Hierarki Perolehan Kunci Kanonikal (*Canonical Lock Acquisition Hierarchy*)** yang wajib ditaati oleh seluruh service dan controller.

---

## 🏗️ Hierarki Perolehan Kunci Kanonikal (Canonical Lock Order)

Setiap transaksi yang memerlukan multi-table locking wajib memperoleh kunci dari tingkat tertinggi (Level 1) ke tingkat terendah (Level 7):

```text
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 1: Tenant Boundary (tenant_id)                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 2: Patient Master Root (master_patients)             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 3: Episode & Encounter Context (encounters)          │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 4: Primary Clinical Aggregate                        │
│  (clinical_orders, soap_notes, surgical_cases, cppt_notes)  │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 5: Shared Physical & Financial Resource              │
│  (master_beds, inventory_batches, blood_donor_units, ledgers│
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 6: Universal WORM Audit Trail (universal_audit_logs) │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 7: Domain Transactional Outbox                       │
│  (clinical_domain_outbox / fhir_delivery_outbox)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Matriks Kebijakan Penguncian Per Domain

| Domain | Metode Konkurensi | Target Penguncian | Kolom / Mekanisme | Penanganan Konflik |
| :--- | :--- | :--- | :--- | :--- |
| **CPOE Orders** | Pessimistic + Idempotency | `encounters`, `clinical_orders` | `SELECT id FROM encounters WHERE id = $1 FOR UPDATE` + `idempotency_key` unique lock | Deterministic Replay / 409 Conflict |
| **Clinical Notes (SOAP / CPPT)** | Optimistic Concurrency Control (OCC) | `soap_notes`, `cppt_notes` | `WHERE id = $1 AND version = $expectedVersion`, `version = version + 1` | HTTP 409 Conflict (`CONCURRENT_MODIFICATION`) |
| **ADT / Bed Management** | Pessimistic Locking | `master_beds`, `bed_assignments` | `SELECT * FROM master_beds WHERE id = $1 FOR UPDATE` | HTTP 409 Conflict (`BED_ALREADY_OCCUPIED`) |
| **Pharmacy FEFO & Dispense** | Pessimistic Batch Locking | `inventory_batches` | `SELECT * FROM inventory_batches WHERE id = $1 FOR UPDATE` | HTTP 400 (`INSUFFICIENT_BATCH_STOCK`) |
| **Blood Bank Allocation** | Pessimistic Unit Locking | `blood_donor_units` | `SELECT * FROM blood_donor_units WHERE id = $1 FOR UPDATE` | HTTP 409 (`BLOOD_UNIT_ALREADY_ALLOCATED`) |
| **Patient Deposit & Billing** | Pessimistic Ledger Locking | `patient_deposit_ledgers` | `SELECT * FROM patient_deposit_ledgers WHERE patient_id = $1 FOR UPDATE` | HTTP 400 (`INSUFFICIENT_DEPOSIT_BALANCE`) |
| **Idempotency Guard** | Row-Level Lock & Unique Index | `idempotency_records` | `INSERT ... ON CONFLICT (tenant_id, actor_id, operation, idempotency_key)` | Deterministic Cached Replay / 409 Payload Mismatch |

---

## 🚨 Anti-Pattern yang Dilarang Keras
1. **DILARANG** menggunakan *in-memory mutex* (`new Map()`, variable boolean) karena gagal total pada sistem multi-instance.
2. **DILARANG** melakukan penguncian terbalik (misal mengunci `master_beds` sebelum mengunci `encounters`).
3. **DILARANG** melakukan query `UPDATE` tanpa klausa `version` pada entitas klinis mutable (mencegah *lost update*).
