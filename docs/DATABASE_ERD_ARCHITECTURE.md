# 🗄️ Database Architecture & Entity Relationship Diagram (ERD)
## NurseFlow Enterprise HIS 2026

**Standard Compliance:** Joint Commission International (JCI 7th Edition), Permenkes No. 24/2022 (RME), SATUSEHAT HL7 FHIR R4  
**Database Engine:** PostgreSQL 16 Enterprise with Multi-Tenant Row Level Security (RLS)  
**ORM:** Prisma ORM 5.x with 15 Deterministic SQL Migrations

---

## 1. 📊 Master Clinical Core ERD (Mermaid Diagram)

```mermaid
erDiagram
    TENANT_ORGANIZATION ||--o{ PATIENT : "manages"
    TENANT_ORGANIZATION ||--o{ PRACTITIONER : "employs"
    TENANT_ORGANIZATION ||--o{ BED_LOCATION : "owns"
    
    PATIENT ||--o{ EPISODE_OF_CARE : "has"
    PATIENT ||--o{ PATIENT_ALLERGY : "has"
    PATIENT ||--o{ BLOOD_CROSSMATCH_TEST : "requests"
    
    EPISODE_OF_CARE ||--o{ ENCOUNTER : "contains"
    
    ENCOUNTER ||--o{ TRIAGE_RECORD : "initiates"
    ENCOUNTER ||--o{ SOAP_CPPT_NOTE : "documents"
    ENCOUNTER ||--o{ UNIVERSAL_ORDER : "places"
    ENCOUNTER ||--o{ INPATIENT_ADMISSION : "admits"
    ENCOUNTER ||--o{ ICU_ACUITY_RECORD : "monitors"
    ENCOUNTER ||--o{ SURGERY_BOOKING : "schedules"
    
    UNIVERSAL_ORDER ||--o{ ORDER_ITEM : "contains"
    UNIVERSAL_ORDER ||--o{ MEDICATION_DISPENSE : "fulfills"
    UNIVERSAL_ORDER ||--o{ BLOOD_TRANSFUSION_RECORD : "authorizes"
    
    PRACTITIONER ||--o{ CLINICAL_PRIVILEGE : "granted"
    PRACTITIONER ||--o{ SOAP_CPPT_NOTE : "authors"
    PRACTITIONER ||--o{ UNIVERSAL_ORDER : "prescribes"
    
    BED_LOCATION ||--o{ BED_ASSIGNMENT : "allocated_in"
    INPATIENT_ADMISSION ||--o{ BED_ASSIGNMENT : "occupies"

    PATIENT {
        uuid id PK
        uuid tenant_id FK
        varchar(30) mrn UK
        varchar(16) nik UK
        varchar(30) ihs_number
        varchar(255) full_name
        date birth_date
        varchar(10) gender
        varchar(5) blood_group
        varchar(5) rhesus
    }

    EPISODE_OF_CARE {
        uuid id PK
        uuid tenant_id FK
        uuid patient_id FK
        varchar(50) episode_number UK
        varchar(30) episode_type
        varchar(30) status
        timestamptz opened_at
        timestamptz closed_at
    }

    ENCOUNTER {
        uuid id PK
        uuid tenant_id FK
        uuid episode_id FK
        uuid patient_id FK
        varchar(50) encounter_number UK
        varchar(30) encounter_class
        varchar(30) current_status
        uuid attending_physician_id FK
        timestamptz period_start
        timestamptz period_end
    }

    TRIAGE_RECORD {
        uuid id PK
        uuid encounter_id FK
        int esi_level
        varchar(20) airway_status
        varchar(20) breathing_status
        int gcs_total
        int heart_rate
        int systolic_bp
        int spo2_percent
        timestamptz triaged_at
    }

    SOAP_CPPT_NOTE {
        uuid id PK
        uuid encounter_id FK
        uuid practitioner_id FK
        text subjective
        text objective
        text assessment
        text plan
        varchar(10) primary_icd10
        boolean is_digitally_signed
        timestamptz signed_at
    }

    UNIVERSAL_ORDER {
        uuid id PK
        uuid encounter_id FK
        uuid ordered_by_id FK
        varchar(50) order_number UK
        varchar(30) category
        varchar(20) priority
        varchar(30) status
        timestamptz ordered_at
    }

    BLOOD_CROSSMATCH_TEST {
        uuid id PK
        uuid patient_id FK
        uuid blood_unit_id FK
        varchar(30) overall_compatibility
        boolean is_verified
        timestamptz finalized_at
    }

    BLOOD_TRANSFUSION_RECORD {
        uuid id PK
        uuid encounter_id FK
        uuid blood_unit_id FK
        uuid crossmatch_id FK
        varchar(30) transfusion_status
        uuid dual_nurse_verified_by FK
        timestamptz started_at
    }
```

---

## 2. 🔐 Row Level Security (RLS) Multi-Tenant Policies
Setiap tabel master dan transaksional menerapkan constraint isolasi faskes berbasis `tenant_id`:
```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON patients
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```

---

## 3. 🛡️ Clinical Safety Invariants Enforced at Database Level
1. **No Incompatible Blood Transfusion:**
   `blood_transfusion_records` terikat secara foreign key ke `blood_crossmatch_tests` yang memiliki status `overall_compatibility = 'COMPATIBLE'`.
2. **Atomic Inventory Decrement (FEFO):**
   `CHECK (available_quantity >= 0)` memastikan stok farmasi tidak pernah bernilai negatif dalam kondisi lonjakan konkurensi.
3. **Immutable Audit Trail:**
   Tabel `audit_logs` dan `outbox_events` menerapkan append-only policy (*NO UPDATE / NO DELETE*).
