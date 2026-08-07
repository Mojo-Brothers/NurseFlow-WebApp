# ENTERPRISE SYSTEM ARCHITECTURE & DATABASE AUDIT REPORT
## EVALUASI PEMETAAN HARDCODED STRING KE ID ALFANUMERIK RELASIONAL
### Kode Dokumen: AUDIT-HIS-ID-2026 | Document Version: 1.0.0-AUDIT

---

> **DOKUMEN AUDIT ARSITEKTUR PERANGKAT LUNAK & SKEMA DATABASE**  
> **Target Audience:** System Architects, Lead Database Administrators, Backend Engineers, Compliance Auditors, Hospital IT Management.  
> **Scope Audit:** 27 Modul Operasional NurseFlow Enterprise HIS (Hardcoded Text Purge & ID Normalization).

---

## 1. EXECUTIVE SUMMARY & MATRIKS GAP ANALYSIS

Pemeriksaan arsitektur sistem dilakukan untuk mengidentifikasi kebocoran teks bebas (*hardcoded string*) dalam transaksi database relasional. Untuk menjamin integritas rekam medis abadi, kecepatan indeks kueri SQL, serta interoperabilitas API eksternal (SATUSEHAT, BPJS, BSrE), seluruh entitas wajib menggunakan **ID Alfanumerik Terstruktur** sebagai *Primary Key* (PK) dan *Foreign Key* (FK).

### Tabel Matriks Gap Analysis Audit Sistem (7 Domain Operasional):

| Domain Audit | Entitas Data | Status Implementasi ID | Teks Hardcoded (Legacy / Insecure) | Solusi Normalisasi ID Alfanumerik (Enterprise Standard) | Status Compliance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Master Departemen** | `department_master` | ⚠️ Parsial | Value UI: `"IGD"`, `"Farmasi Utama"` | `DEPT-EMERGENCY`, `DEPT-PHAR-MAIN` | **REMEDIATION REQUIRED** |
| **1. Master Organisasi** | `organization_unit` | ⚠️ Parsial | Value UI: `"Lantai 2 Gedung A"` | `ORG-UNIT-GA-FL02` | **REMEDIATION REQUIRED** |
| **2. Data Pasien** | `patient_master` | ✅ Sesuai | N/A | NIK (`31710123...`) + MRN Abadi (`PAT-20260807-8A3F9B12`) | **COMPLIANT** |
| **2. Kunjungan / Admisi**| `visit_encounter` | ✅ Sesuai | N/A | Encounter ID (`VIS-20260807-01048`) | **COMPLIANT** |
| **2. Appointment** | `appointment_queue` | ⚠️ Parsial | `doctor_name: "dr. Alex"`, `time_slot: "09:00"` | `doctor_id: "DOC-CARDIO-0012"`, `slot_id: "SLOT-20260807-0900"`, `channel_id: "CH-MOBILE-APP"` | **REMEDIATION REQUIRED** |
| **3. Triase IGD** | `triage_session` | ⚠️ Parsial | `esi_color: "RED"`, `"YELLOW"` | `triage_color_id: "CLR-RED-ESI1"`, `news2_level_id: "RISK-NEWS2-HIGH"` | **REMEDIATION REQUIRED** |
| **3. EMR Diagnosis** | `emr_diagnosis` | ✅ Sesuai | Free text description | Normalized ICD-10 Code (`icd10_code: "I21.9"`) | **COMPLIANT** |
| **3. EMR Prosedur** | `emr_procedure` | ⚠️ Parsial | Text: `"Pasang Ring Jantung"` | Kode ICD-9 CM (`icd9_code: "36.06"`) + Service ID (`service_id: "SRV-CARD-0042"`) | **REMEDIATION REQUIRED** |
| **3. Tempat Tidur (Bed)** | `bed_management` | ⚠️ Parsial | Text: `"Bed 4 Ruang ICU"` | Bed ID (`bed_id: "BED-ICU-04"`) | **REMEDIATION REQUIRED** |
| **3. Operasi Bedah (ASC)**| `surgery_schedule` | ⚠️ Parsial | Text: `"Operasi Jam 10"` | Surgery ID (`surgery_id: "OPT-20260807-0008"`) | **REMEDIATION REQUIRED** |
| **3. Handover Shift (SBAR)**| `clinical_handover` | ⚠️ Parsial | Text: `"Serah Terima Pagi"` | Handover ID (`handover_id: "HND-20260807-0091"`) | **REMEDIATION REQUIRED** |
| **3. Lab Specimen (LIS)** | `lab_specimen` | ⚠️ Parsial | Text: `"Sampel Darah"` | Specimen Barcode ID (`specimen_id: "SMP-LAB-20260807-00142"`) | **REMEDIATION REQUIRED** |
| **3. PACS Accession** | `radiology_study` | ⚠️ Parsial | Text: `"Foto Thorax"` | Accession Number (`accession_id: "RAD-ACC-20260807-00812"`) | **REMEDIATION REQUIRED** |
| **4. Katalog Farmasi** | `inventory_item` | ⚠️ Parsial | Local Drug Name only | SATUSEHAT KFA Code (`kfa_code: "93001842"`) | **REMEDIATION REQUIRED** |
| **4. Tata Letak Gudang** | `warehouse_location` | ⚠️ Parsial | Location: `"Gudang Lantai 1"` | Warehouse ID (`wh_id: "WH-CENTRAL-01"`), Rack ID (`rack_id: "RK-FAR-A01-S02"`) | **REMEDIATION REQUIRED** |
| **4. Pelacakan FEFO** | `stock_batch_ledger` | ✅ Sesuai | N/A | Batch ID (`batch_id: "BATCH-ASP-202611"`) + Expiry Date | **COMPLIANT** |
| **5. Material Request** | `material_request` | ⚠️ Parsial | Origin: `"IGD"`, Dest: `"Gudang"` | Request ID (`request_id: "RQ-20260807-0042"`), `origin_wh_id`, `dest_wh_id` | **REMEDIATION REQUIRED** |
| **5. Transaksi Mutasi** | `stock_mutation` | ✅ Sesuai | N/A | Mutation ID (`MUT-20260807-0089`), Receive ID (`RCV-20260807-0012`) | **COMPLIANT** |
| **6. Struk Tarif Billing**| `billing_tariff` | ⚠️ Parsial | Text: `"Tarif VIP BPJS"` | Grouptariff ID (`tariff_group_id: "GRP-BPJS-01"`), Care Class ID (`care_class_id: "CLS-VIP"`) | **REMEDIATION REQUIRED** |
| **6. Pemecahan Jasa** | `billing_ledger_split`| ⚠️ Parsial | Single total amount string | Component Split IDs (`CMP-HOSPITAL`, `CMP-DOCTOR`, `CMP-PARAMEDIC`, `CMP-BHP`) | **REMEDIATION REQUIRED** |
| **6. Klaim INA-CBGs** | `inacbg_claim_file` | ⚠️ Parsial | Text: `"Klaim BPJS Agustus"`| Claim ID (`claim_id: "CLM-INACBG-20260807-0021"`) + SEP ID (`sep_id: "SEP-BPJS-20260807-008124"`) | **REMEDIATION REQUIRED** |
| **7. Otorisasi Medis** | `document_approval` | ⚠️ Parsial | Approver: `"Apt. Siska"` | Creator ID (`USR-PHAR-0081`), Approver ID (`USR-DOCTOR-0012`), e-Sign Signature ID (`SIG-BSRE-99824`) | **REMEDIATION REQUIRED** |
| **7. IoT Cold-Chain** | `iot_coldchain_log` | ⚠️ Parsial | Text: `"Kulkas Utama"` | Sensor ID (`device_id: "IOT-COLD-FAR-01"`) | **REMEDIATION REQUIRED** |
| **7. Keamanan M2M** | `system_integration` | ✅ Sesuai | Hardcoded static key in code | Environment Variables (`CLIENT_ID`, `CLIENT_SECRET`, OAuth2 Token) | **COMPLIANT** |

---

## 2. SKRIP NORMALISASI SKEMA DATABASE (SQL DDL TRANSFORMATIONS)

Berikut adalah skrip SQL DDL untuk mengubah kolom teks bebas menjadi kunci asing (*Foreign Key*) ber-ID alfanumerik yang terindeks secara presisi.

```sql
-- =============================================================================
-- 1. MODUL MASTER DEPARTEMEN & ORGANISASI
-- =============================================================================
CREATE TABLE master_organization (
    org_id VARCHAR(32) PRIMARY KEY, -- e.g., 'ORG-RS-MAIN-01'
    org_name VARCHAR(128) NOT NULL,
    org_type VARCHAR(32) NOT NULL  -- 'HOSPITAL', 'CLINIC', 'BRANCH'
);

CREATE TABLE master_department (
    dept_id VARCHAR(32) PRIMARY KEY, -- e.g., 'DEPT-EMERGENCY', 'DEPT-PHAR-MAIN'
    org_id VARCHAR(32) NOT NULL REFERENCES master_organization(org_id),
    dept_code VARCHAR(16) NOT NULL UNIQUE,
    dept_name VARCHAR(128) NOT NULL
);

-- =============================================================================
-- 2. MODUL ADMISI, PASIEN & APPOINTMENT
-- =============================================================================
CREATE TABLE appointment_queue (
    appointment_id VARCHAR(32) PRIMARY KEY, -- e.g., 'APT-20260807-0012'
    patient_id VARCHAR(32) NOT NULL,        -- e.g., 'PAT-20260807-8A3F9B12'
    doctor_id VARCHAR(32) NOT NULL,         -- Foreign Key ke Dokter: 'DOC-CARDIO-0012'
    slot_id VARCHAR(32) NOT NULL,           -- Time Slot ID: 'SLOT-20260807-0900'
    channel_id VARCHAR(16) NOT NULL,        -- 'CH-MOBILE-APP', 'CH-WEB', 'CH-KIOSK'
    dept_id VARCHAR(32) NOT NULL REFERENCES master_department(dept_id),
    status VARCHAR(16) NOT NULL DEFAULT 'BOOKED'
);

-- =============================================================================
-- 3. MODUL KLINIS, EMR & TRIASE IGD
-- =============================================================================
CREATE TABLE master_triage_color (
    color_id VARCHAR(16) PRIMARY KEY, -- 'CLR-RED-ESI1', 'CLR-ORG-ESI2', 'CLR-YEL-ESI3'
    esi_level SMALLINT NOT NULL UNIQUE,
    color_hex VARCHAR(7) NOT NULL,
    description VARCHAR(64) NOT NULL
);

CREATE TABLE emr_procedure (
    procedure_event_id VARCHAR(32) PRIMARY KEY, -- 'PRC-20260807-0041'
    visit_id VARCHAR(32) NOT NULL,              -- 'VIS-20260807-01048'
    icd9_code VARCHAR(16) NOT NULL,             -- '36.06' (ICD-9 CM)
    service_id VARCHAR(32) NOT NULL,            -- Master Service ID: 'SRV-CARD-0042'
    performed_by_doctor_id VARCHAR(32) NOT NULL
);

-- =============================================================================
-- 4. MODUL LOGISTIK, GUDANG & FARMASI (KFA & FEFO)
-- =============================================================================
CREATE TABLE master_warehouse_rack (
    rack_id VARCHAR(32) PRIMARY KEY,   -- 'RK-FAR-A01-S02'
    warehouse_id VARCHAR(32) NOT NULL, -- 'WH-CENTRAL-01'
    rack_code VARCHAR(16) NOT NULL,
    shelf_level VARCHAR(8) NOT NULL
);

CREATE TABLE inventory_item (
    item_id VARCHAR(32) PRIMARY KEY,   -- 'MAT-MED-0412'
    kfa_code VARCHAR(32) NOT NULL,     -- Kode KFA SATUSEHAT: '93001842'
    item_name VARCHAR(256) NOT NULL,
    unit_code VARCHAR(16) NOT NULL     -- 'TAB', 'VIAL', 'AMP'
);

-- =============================================================================
-- 5. MODUL TRANSAKSI MUTASI LOGISTIK
-- =============================================================================
CREATE TABLE material_request (
    request_id VARCHAR(32) PRIMARY KEY,   -- 'RQ-20260807-0042'
    origin_wh_id VARCHAR(32) NOT NULL,    -- 'WH-FAR-IGD'
    dest_wh_id VARCHAR(32) NOT NULL,      -- 'WH-FAR-MAIN'
    requested_by_user_id VARCHAR(32) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'SUBMITTED'
);

-- =============================================================================
-- 6. MODUL FINANSIAL & BILLING ENGINE
-- =============================================================================
CREATE TABLE billing_ledger_split (
    split_id VARCHAR(32) PRIMARY KEY,     -- 'SPL-20260807-0081'
    billing_id VARCHAR(32) NOT NULL,      -- 'BIL-20260807-004812'
    tariff_group_id VARCHAR(32) NOT NULL, -- 'GRP-BPJS-01', 'GRP-CASH-COMMER'
    care_class_id VARCHAR(16) NOT NULL,   -- 'CLS-VVIP', 'CLS-VIP', 'CLS-01'
    component_id VARCHAR(16) NOT NULL,    -- 'CMP-HOSPITAL', 'CMP-DOCTOR', 'CMP-PARAMEDIC', 'CMP-BHP'
    amount NUMERIC(15, 2) NOT NULL
);
```

---

## 3. TRANSFORMASI PAYLOAD API JSON (BEFORE VS AFTER)

Berikut adalah contoh perbedaan struktur payload API sebelum audit (*legacy string*) dan sesudah normalisasi (*relational ID*):

### Domain 1: Dropdown Departemen & Organisasi

#### ❌ BEFORE (Legacy Hardcoded Text Payload):
```json
{
  "department_name": "Gudang Farmasi IGD",
  "location_building": "Gedung A Lantai 1",
  "status": "Active"
}
```

#### ✅ AFTER (Normalized Relational ID Payload):
```json
{
  "dept_id": "DEPT-PHAR-EMERGENCY",
  "org_id": "ORG-RS-MAIN-01",
  "location_rack_id": "RK-FAR-A01-S02",
  "status_id": "ST-ACTIVE"
}
```

---

### Domain 2: Modul Patient Appointment

#### ❌ BEFORE (Legacy Hardcoded Text Payload):
```json
{
  "patient_name": "Budi Santoso",
  "doctor_name": "dr. Alexander Sp.JP",
  "poliklinik": "Poli Jantung",
  "booking_time": "Jam 9 Pagi",
  "channel": "Mobile Application"
}
```

#### ✅ AFTER (Normalized Relational ID Payload):
```json
{
  "patient_id": "PAT-20260807-8A3F9B12",
  "doctor_id": "DOC-CARDIO-0012",
  "dept_id": "DEPT-POLI-CARDIO",
  "slot_id": "SLOT-20260807-0900",
  "channel_id": "CH-MOBILE-APP"
}
```

---

### Domain 3: Triase IGD & Rekam Medis (EMR)

#### ❌ BEFORE (Legacy Hardcoded Text Payload):
```json
{
  "triage_priority": "Merah / Resusitasi",
  "diagnosis_text": "Infark Miokard Akut",
  "procedure_text": "Pemasangan Ring Stent Jantung"
}
```

#### ✅ AFTER (Normalized Relational ID Payload):
```json
{
  "triage_color_id": "CLR-RED-ESI1",
  "news2_risk_id": "RISK-NEWS2-HIGH",
  "icd10_code": "I21.9",
  "icd9_code": "36.06",
  "service_id": "SRV-CARD-0042"
}
```

---

### Domain 4: Logistik, Farmasi (KFA) & FEFO

#### ❌ BEFORE (Legacy Hardcoded Text Payload):
```json
{
  "drug_name": "Paracetamol 500mg Tablet",
  "warehouse_name": "Gudang Obat Utama",
  "batch_info": "Batch Bulan Ini Expired Tahun Depan"
}
```

#### ✅ AFTER (Normalized Relational ID Payload):
```json
{
  "item_id": "MAT-MED-0412",
  "kfa_code": "93001842",
  "warehouse_id": "WH-CENTRAL-01",
  "rack_id": "RK-FAR-A01-S02",
  "batch_id": "BATCH-ASP-202611",
  "expiry_date": "2027-11-30"
}
```

---

### Domain 5: Material Request & Outbound Mutasi

#### ❌ BEFORE (Legacy Hardcoded Text Payload):
```json
{
  "request_type": "Permintaan Cairan Infus",
  "from_unit": "Ruang Keperawatan IGD",
  "to_unit": "Gudang Farmasi Pusat"
}
```

#### ✅ AFTER (Normalized Relational ID Payload):
```json
{
  "request_id": "RQ-20260807-0042",
  "mutation_id": "MUT-20260807-0089",
  "origin_wh_id": "WH-FAR-IGD",
  "dest_wh_id": "WH-FAR-MAIN"
}
```

---

### Domain 6: Finansial & Kasir Billing Engine

#### ❌ BEFORE (Legacy Hardcoded Text Payload):
```json
{
  "patient_class": "Kelas VIP",
  "payer_name": "BPJS Kesehatan",
  "total_charge": 5000000
}
```

#### ✅ AFTER (Normalized Relational ID Payload):
```json
{
  "billing_id": "BIL-20260807-004812",
  "tariff_group_id": "GRP-BPJS-01",
  "care_class_id": "CLS-VIP",
  "splits": [
    { "component_id": "CMP-HOSPITAL", "amount": 1750000.00 },
    { "component_id": "CMP-DOCTOR", "amount": 2250000.00 },
    { "component_id": "CMP-PARAMEDIC", "amount": 500000.00 },
    { "component_id": "CMP-BHP", "amount": 500000.00 }
  ]
}
```

---

### Domain 7: Keamanan Otorisasi & M2M Authentication

#### ❌ BEFORE (Legacy Hardcoded Text Payload):
```json
{
  "signed_by": "Apt. Siska",
  "approved_by": "dr. Alexander",
  "api_key": "static_secret_key_12345"
}
```

#### ✅ AFTER (Normalized Relational ID Payload):
```json
{
  "creator_user_id": "USR-PHAR-0081",
  "approver_user_id": "USR-DOCTOR-0012",
  "esign_signature_id": "SIG-BSRE-99824",
  "auth_type": "OAUTH2_CLIENT_CREDENTIALS",
  "client_id_env": "HIS_M2M_CLIENT_ID"
}
```

---

> **AKHIR DOKUMEN ENTERPRISE SYSTEM ARCHITECTURE & DATABASE AUDIT**  
> *NurseFlow Enterprise Architecture Board - 2026*
