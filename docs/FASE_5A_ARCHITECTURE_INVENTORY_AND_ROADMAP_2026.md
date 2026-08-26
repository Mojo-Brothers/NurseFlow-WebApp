# FASE 5A — REST GATEWAY & POSTGRESQL SINGLE SOURCE OF TRUTH INVENTORY
**NurseFlow Enterprise Hospital Information System**
*Architectural Inventory, Transaction Boundaries, Concurrency Invariants & Roadmap — Phase 2026*

---

## 🏛️ 1. Executive Directive & Engineering Baseline

Berdasarkan keputusan **Architecture Board**:
* **Milestone Baseline:** 🟢 **Gate 0C Reality Baseline Established (LOCKED)**
* **Mandat Rekayasa Mutlak:**
  > ### 🛑 **NO NEW FEATURE WITHOUT REALITY PROOF**
  > Setiap modul, endpoint, dan perbaikan wajib melalui rantai pembuktian:
  > `Unit Test ──▶ Integration Test ──▶ PostgreSQL Reality ──▶ RBAC Negative Test ──▶ Real Browser ──▶ Cross-Persona Workflow ──▶ Audit Evidence ──▶ Regression ──▶ LOCK`

---

## 📋 2. Matriks 8 Workstream Fase 5A

Eksekusi Fase 5A dibagi menjadi 8 tahapan terstruktur yang dikerjakan secara berurutan (*sequential*):

```
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│  5A.1  │──▶│  5A.2  │──▶│  5A.3  │──▶│  5A.4  │──▶│  5A.5  │──▶│  5A.6  │──▶│  5A.7  │──▶│  5A.8  │
│  API   │   │DATABASE│   │TRANSACT│   │ CONCUR │   │ OUTBOX │   │ AUDIT  │   │  FHIR  │   │REALITY │
│CONTRACT│   │AUTHORIT│   │INTEGRIT│   │IDEMPOTE│   │CONSISTE│   │ TRACE  │   │CANONIC │   │REGRESS │
└────────┘   └────────┘   └────────┘   └────────┘   └────────┘   └────────┘   └────────┘   └────────┘
```

| Workstream | Fokus Utama | Target Deliverable & Acceptance Criteria |
| :--- | :--- | :--- |
| **5A.1 API Contract Normalization** | Standarisasi Respons REST API | 100% Endpoint mutasi menggunakan canonical format `{ data, meta }`, error `RFC 7807 Problem Details`, header `X-Correlation-ID`, dan `Idempotency-Key`. |
| **5A.2 Database Authority** | Eliminasi In-Memory Authoritative State | 0% Mock/fixture di production path. PostgreSQL 16 adalah satu-satunya sumber kebenaran mutlak. |
| **5A.3 Transaction Integrity** | Atomic Unit-of-Work Boundaries | Setiap mutasi multi-tabel dibungkus blok `BEGIN ... COMMIT` dengan rollback fail-stop saat terjadi kegagalan. |
| **5A.4 Concurrency & Idempotency** | Race Condition & Duplicate Prevention | Row-level locking (`FOR UPDATE`) pada stok ranjang/obat/darah, *optimistic locking* (`version`) pada rekam medis, dan proteksi duplicate request. |
| **5A.5 Outbox / Event Consistency** | Atomic Domain Event Publishing | Event domain masuk ke tabel `clinical_domain_outbox` dalam **transaksi database yang sama** (Zero Post-Commit Event Loss). |
| **5A.6 Audit & Distributed Tracing** | Provenance & Correlation Tracking | `X-Correlation-ID` terikat dari HTTP header, query SQL, hingga log audit WORM (`universal_audit_logs`). |
| **5A.7 FHIR / SATUSEHAT Canonical** | Standarisasi Interoperabilitas Eksternal | Pemetaan sumber daya FHIR R4 (Encounter, Condition, Observation, MedicationRequest) sebagai *projection contract* dari PostgreSQL. |
| **5A.8 Reality Regression** | Verifikasi End-to-End Multidimensi | Menjalankan 175 regression suites + verifikasi browser nyata 14 persona setelah setiap vertical slice diunifikasi. |

---

## 🗄️ 3. Inventaris Domain Klinis, Endpoint Mutasi, & Strategi Isolasi Transaksi

Berikut adalah inventaris komprehensif 14 domain inti HIS:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               FASE 5A DOMAIN MUTATION & CONCURRENCY INVENTORY MATRIX                                     │
├────┬────────────────────────┬────────────────────────────────────────┬────────────────────────────────┬──────────────────┤
│ No │ Clinical Domain        │ Primary Mutation Endpoints             │ PostgreSQL Authoritative Tables│ Isolation & Lock │
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 01 │ Master Patient (EMPI)  │ POST /api/v1/patients                  │ master_patients                │ READ COMMITTED   │
│    │                        │ PUT /api/v1/patients/:id               │ patient_identifiers            │ + Optimistic     │
│    │                        │ POST /api/v1/patients/merge            │ patient_merge_audit_logs       │ (version check)  │
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 02 │ Episode & Encounter    │ POST /api/v1/encounters                │ episodes_of_care               │ READ COMMITTED   │
│    │                        │ PATCH /api/v1/encounters/:id/status    │ encounters                     │ + Encounter FSM  │
│    │                        │ POST /api/v1/encounters/transfer       │ encounter_status_history       │ State Validator  │
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 03 │ Bed & Ward Management  │ POST /api/v1/beds/assign               │ master_beds                    │ FOR UPDATE       │
│    │                        │ POST /api/v1/beds/transfer             │ bed_assignments                │ (Pessimistic Bed │
│    │                        │ POST /api/v1/beds/release              │ master_wards, master_rooms     │ Row Lock)        │
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 04 │ Emergency & Triage     │ POST /api/v1/triage                    │ triage_assessments             │ READ COMMITTED   │
│    │                        │ PUT /api/v1/triage/:id/re-triage       │ triage_vital_signs, sla_timers │ + Rapid Ingest   │
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 05 │ Clinical Notes (SOAP)  │ POST /api/v1/clinical-notes/soap       │ soap_notes, cppt_notes         │ READ COMMITTED   │
│    │ & CPPT Multidisiplin   │ POST /api/v1/clinical-notes/cppt       │ clinical_authorizations        │ + Optimistic Ver │
│    │                        │ PATCH /api/v1/clinical-notes/verify    │ digital_signature_audit        │ + SHA-256 Hash   │
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 06 │ Universal CPOE Orders  │ POST /api/v1/orders/cpoe               │ clinical_orders                │ READ COMMITTED   │
│    │ (Rx, Lab, Rad, Tindakan│ PATCH /api/v1/orders/cpoe/:id/cancel   │ cpoe_order_items               │ + IdempotencyKey │
│    │                        │                                        │ clinical_domain_outbox         │ + Atomic Outbox  │
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 07 │ Farmasi & FEFO         │ POST /api/v1/medications/prescribe     │ medication_orders              │ FOR UPDATE       │
│    │ Closed-Loop Medication │ POST /api/v1/medications/dispense      │ inventory_batches              │ (Pessimistic     │
│    │ & Bedside eMAR 5-Benar │ POST /api/v1/medications/administer    │ emar_administrations           │ Batch Stock Lock)│
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 08 │ Laboratorium (LIS)     │ POST /api/v1/laboratory/specimens      │ lab_specimens                  │ READ COMMITTED   │
│    │ & Hasil Nilai Kritis   │ POST /api/v1/laboratory/results        │ lab_test_results               │ + Outbox Event   │
│    │                        │ POST /api/v1/laboratory/panic-values   │ lab_panic_escalations          │ PANIC_TRIGGERED  │
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 09 │ Radiologi (RIS / PACS) │ POST /api/v1/radiology/accession       │ radiology_studies              │ READ COMMITTED   │
│    │ & Diagnostic Ekspertise│ POST /api/v1/radiology/reports         │ radiology_reports              │ + WORM Sign      │
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 10 │ Bank Darah (BDRS)      │ POST /api/v1/blood-bank/units          │ blood_donor_units              │ FOR UPDATE       │
│    │ & Cold-Chain Transfusi │ POST /api/v1/blood-bank/crossmatch     │ blood_crossmatch_tests         │ (Pessimistic Bag │
│    │                        │ POST /api/v1/blood-bank/transfuse      │ blood_transfusion_records      │ Unit Lock)       │
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 11 │ Kamar Bedah (IBS)      │ POST /api/v1/perioperative/schedule    │ surgical_cases                 │ FOR UPDATE       │
│    │ & WHO Safety Checklist │ POST /api/v1/perioperative/who         │ who_surgical_checklists        │ (OR Room Lock)   │
│    │                        │ POST /api/v1/perioperative/pacu        │ pacu_recovery_scores           │ + Digital Sign   │
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 12 │ Casemix & Koding Medis │ POST /api/v1/casemix/coding            │ clinical_coding_records        │ READ COMMITTED   │
│    │ ICD-10 / INA-CBG       │ POST /api/v1/casemix/grouping          │ inacbg_grouping_results        │ + Audit Replay   │
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 13 │ Billing & Revenue Cycle│ POST /api/v1/patient-financial/deposits│ patient_deposit_ledgers        │ READ COMMITTED   │
│    │ (Deposit, Split Invoice│ POST /api/v1/patient-financial/invoices│ patient_split_invoices         │ + IdempotencyKey │
│    │  & Pelunasan Kasir)    │ POST /api/v1/patient-financial/payments│ cashier_payment_transactions   │ + NUMERIC(15,2)  │
├────┼────────────────────────┼────────────────────────────────────────┼────────────────────────────────┼──────────────────┤
│ 14 │ Master Data & Spatial  │ POST /api/v1/master-data/wards         │ master_wards                   │ READ COMMITTED   │
│    │ Governance             │ POST /api/v1/master-data/rooms         │ master_rooms, master_beds      │ + Admin Role     │
│    │                        │ POST /api/v1/staff-privileges          │ clinical_staff_profiles        │ + STR/SIP Trigger│
└────┴────────────────────────┴────────────────────────────────────────┴────────────────────────────────┴──────────────────┘
```

---

## 🔒 4. Detail Desain 3 Guardrail Kritis

### Guardrail 1: Transaction Isolation & Concurrency Control Model
* **Hindari `SERIALIZABLE` Global**: Penggunaan `SERIALIZABLE` membabi-buta pada sistem HIS dengan *high concurrency* (ratusan staf/detik) memicu *serialization failures* (`40001`) dan *retry storms*.
* **Strategi Terkalibrasi**:
  1. **Tingkat Transaksi Default**: `READ COMMITTED`.
  2. **Domain Rentan Perebutan Resource (Beds, Stock, Blood Units, OR Rooms)**: Menggunakan *Pessimistic Row-Level Locking* (`SELECT ... FOR UPDATE`).
  3. **Domain Rekam Medis (EMR/SOAP/CPPT)**: Menggunakan *Optimistic Concurrency Control* melalui kolom integer `version` (menolak update jika `version != expected_version`).

### Guardrail 2: Atomic Transactional Outbox (P0 Standard)
```
BEGIN ISOLATION LEVEL READ COMMITTED;
  │
  ├── 1. UPDATE master_beds / INSERT medication_orders / INSERT soap_notes
  ├── 2. INSERT INTO universal_audit_logs (...)
  ├── 3. INSERT INTO clinical_domain_outbox (
  │        id, aggregate_type, aggregate_id, event_type,
  │        event_payload, status, idempotency_key, correlation_id, created_at
  │      ) VALUES (
  │        $id, 'MEDICATION_ORDER', $medId, 'MEDICATION_PRESCRIBED',
  │        $payload, 'PENDING', $idempotencyKey, $correlationId, NOW()
  │      );
  │
COMMIT;  <-- SATU BATAS ATOMIK (ZERO POST-COMMIT EVENT LOSS)
```

### Guardrail 3: Idempotency Key Specification
* **Header Wajib**: `Idempotency-Key: <UUIDv4>` pada seluruh mutasi finansial, alokasi ranjang, resep obat, dan order CPOE.
* **Mekanisme**:
  * Request pertama: Membuka transaksi, memproses mutasi, menyimpan payload hasil dengan `idempotency_key` di tabel target.
  * Request duplikat (misal karena jaringan lambat atau klik ganda): Sistem membaca record yang sudah ada melalui `SELECT ... WHERE idempotency_key = $1`, mengembalikan data asli dengan flag `isIdempotentReplay: true` dan status `200 OK / 201 Created` tanpa mutasi ganda.

---

## 🚀 5. Urutan Eksekusi Workstream 5A.1

Sesuai rencana, pengerjaan dimulai dari **Workstream 5A.1: API Contract Normalization**:
1. Standarisasi struktur envelope JSON `{ success, data, meta }` dan `{ success, error: { code, message, details }, meta }`.
2. Penyelarasan header `X-Correlation-ID` dan `Idempotency-Key` pada seluruh router backend Express.
3. Integrasi error handling seragam berbasis `RFC 7807 Problem Details`.

---

**STATUS DOKUMEN: INVENTARIS ARSITEKTUR FASE 5A SELESAI & DISETUJUI.**
