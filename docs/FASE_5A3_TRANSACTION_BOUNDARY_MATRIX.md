# 🏛️ MATRIKS BATAS TRANSAKSI ATOMIK (TRANSACTION BOUNDARY MATRIX)
## NurseFlow Enterprise Hospital Information System 2026 — FASE 5A.3
**Standar:** Joint Commission International (JCI), ISO/IEC 27001, PostgreSQL 16 ACID Transaction Integrity

---

## 📌 Ringkasan Prinsip & Invariant Transaksi

Setiap mutasi data bisnis di NurseFlow Enterprise HIS 2026 wajib berada di dalam satu batas komitmen atomik (*Atomic Commit Boundary*):

```text
HTTP REQUEST
     │
     ▼
BEGIN TRANSACTION (transactionManager.withTransaction)
     │
     ├── 1. Invariant & Row Locks (SELECT ... FOR UPDATE)
     ├── 2. Business State Mutation (INSERT / UPDATE)
     ├── 3. Universal WORM Audit Log (universal_audit_logs)
     ├── 4. Idempotency State Finalization (if supplied)
     └── 5. Domain Outbox Creation of Intent (clinical_domain_outbox)
     │
     ▼
COMMIT
     │
     ├── SUCCESS ──► Seluruh state committed serentak
     │
     └── FAILURE ──► ROLLBACK (Nol baris parsial tersimpan: Zero Partial Persistence)
```

---

## 📊 Matriks Batas Transaksi 10 Domain Kritis

| No | Domain Klinis / Administratif | Tabel yang Dimutasi | Invariant Bisnis Kritis | Tingkat Isolasi | Strategi Locking | Kebutuhan Audit WORM (`universal_audit_logs`) | Kebutuhan Outbox (`clinical_domain_outbox`) | Skenario Rollback Proof |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Universal CPOE** | `clinical_orders`, `cpoe_order_items`, `idempotency_records` | Verifikasi encounter aktif, indikasi klinis lengkap, dokter DPJP terautentikasi | `READ COMMITTED` | Pessimistic Lock pada Encounter (`SELECT id FROM encounters WHERE id = $1 FOR UPDATE`) | `CREATE: CLINICAL_ORDER` (Signature SHA-256) | `CPOE_ORDER_PLACED` | Order item gagal / Audit gagal $\rightarrow$ 0 order rows, 0 audit rows |
| **2** | **Clinical Notes & CPPT** | `soap_notes`, `cppt_notes` | Validasi peran PPA, verifikasi DPJP 24 jam, optimistic concurrency version check | `READ COMMITTED` | Optimistic Concurrency Control (`version = version + 1 WHERE id = $1 AND version = $2`) | `CREATE: SOAP_NOTE`, `UPDATE: CPPT_VERIFICATION` | `CLINICAL_NOTE_RECORDED` | Version mismatch $\rightarrow$ Rollback CPPT & WORM audit |
| **3** | **ADT / Bed Management** | `master_beds`, `bed_assignments`, `encounters` | Anti-Double Booking (1 ranjang hanya boleh 1 pasien aktif), validasi ketersediaan ranjang | `READ COMMITTED` | Pessimistic Row Lock (`SELECT * FROM master_beds WHERE id = $1 FOR UPDATE`) | `UPDATE: BED_ASSIGNMENT` | `BED_OCCUPIED_EVENT`, `BED_CLEANED_EVENT` | Ranjang status `OCCUPIED` saat di-assign $\rightarrow$ Rollback penuh |
| **4** | **Closed-Loop Medication & FEFO** | `medication_dispense`, `inventory_batches`, `inventory_stock_movements` | Anti-Negative Stock, First-Expiry-First-Out (FEFO), pencocokan barcode 5R | `READ COMMITTED` | Strict Batch Lock (`SELECT * FROM inventory_batches WHERE id = $1 FOR UPDATE`) | `DISPENSE: MEDICATION_BATCH` | `MEDICATION_DISPENSED_EVENT`, `INVENTORY_DEPLETED_ALERT` | Stok batch tidak mencukupi $\rightarrow$ Rollback pemotongan stok & dispense |
| **5** | **Blood Bank Transfusion** | `blood_donor_units`, `blood_crossmatch_tests`, `blood_transfusion_records` | Kompatibilitas ABO/Rhesus mutlak, 2-nurse bedside verification | `READ COMMITTED` | Pessimistic Lock pada Unit Darah (`SELECT * FROM blood_donor_units WHERE id = $1 FOR UPDATE`) | `CREATE: BLOOD_TRANSFUSION_INTENT` | `BLOOD_UNIT_RESERVED_EVENT` | Crossmatch `INCOMPATIBLE` $\rightarrow$ Rollback reserva donor unit |
| **6** | **Operating Theatre & Pre-Op** | `surgical_cases`, `who_surgical_safety_checklists` | Kelengkapan Informed Consent, evaluasi anestesi ASA, WHO Sign-In/Time-Out/Sign-Out | `READ COMMITTED` | Case Lock (`SELECT * FROM surgical_cases WHERE id = $1 FOR UPDATE`) | `CREATE: SURGICAL_SAFETY_CHECKLIST` | `SURGERY_PHASE_COMMENCED_EVENT` | Consent belum ditandatangani $\rightarrow$ Rollback penjadwalan kamar bedah |
| **7** | **Diagnostic RIS / PACS** | `radiology_study_orders`, `radiology_reports` | Verifikasi radiografer pelaksana, otorisasi dokter Sp.Rad, PACS DICOM UID | `READ COMMITTED` | Order Lock (`SELECT * FROM radiology_study_orders WHERE id = $1 FOR UPDATE`) | `SIGN: RADIOLOGY_REPORT` | `DIAGNOSTIC_REPORT_FINALIZED` | Dokter pembaca belum tersertifikasi $\rightarrow$ Rollback report creation |
| **8** | **Laboratory LIS** | `lab_specimens`, `laboratory_results` | Integritas specimen barcode, critical value alerting (< threshold) | `READ COMMITTED` | Specimen Lock (`SELECT * FROM lab_specimens WHERE id = $1 FOR UPDATE`) | `VALIDATE: LAB_RESULT` | `CRITICAL_LAB_VALUE_ALERT` | Format nilai lab tidak valid $\rightarrow$ Rollback release hasil |
| **9** | **Emergency Triage & Acuity** | `encounters`, `triage_assessments` | Penentuan kategori ESI / ATS (1-5), deteksi kondisi ancaman jiwa (Acuity 1 & 2) | `READ COMMITTED` | Encounter Lock (`SELECT * FROM encounters WHERE id = $1 FOR UPDATE`) | `CREATE: TRIAGE_ASSESSMENT` | `PATIENT_TRIAGED_EVENT` | Encounter sudah discharge $\rightarrow$ Rollback triase |
| **10** | **Patient Financial & Billing** | `patient_deposit_ledgers`, `hospital_invoices` | Saldo deposit tidak boleh minus, verifikasi klaim BPJS / Asuransi | `READ COMMITTED` | Ledger Lock (`SELECT * FROM patient_deposit_ledgers WHERE patient_id = $1 FOR UPDATE`) | `CREDIT: PATIENT_DEPOSIT` | `PAYMENT_SETTLED_EVENT` | Saldo deposit < jumlah tagihan $\rightarrow$ Rollback payment ledger |

---

## 🛡️ Guardrails Disiplin Koneksi (Connection Discipline)

1. **Satu Koneksi Per Transaksi**:
   Objek `tx` membungkus satu `pg.Client` dedicated yang dialokasikan dari pool saat `withTransaction` dimulai, dan dilepaskan saat selesai di blok `finally`.
2. **Anti-Pool-Bypass**:
   Semua pemanggilan database di dalam fungsi transaksi wajib menggunakan `tx.query()`, `tx.audit()`, atau `tx.outbox()`. Dilarang menggunakan objek global `pool.query()`.
3. **Pemisahan Creation of Intent vs Delivery**:
   Penulisan ke `clinical_domain_outbox` terjadi di dalam transaksi atomik (`status = 'PENDING'`). Pengiriman ke webhook/broker eksternal dieksekusi secara asinkron oleh worker terpisah di Fase 5A.5.
