-- NurseFlow Enterprise HIS 2026 — Migration 018
-- Domain: Radiology Orders Lifecycle, DICOM Modality Worklist (MWL), EMR Timeline Integration & Immutable JCI Forensic Audit Trail
-- Compliance: JCI MOI / AOP.6, DICOM PS 3.18, WHO Critical Result Escalation Standard

-- 1. Table: radiology_orders (End-to-End Order & Scheduling FSM)
CREATE TABLE IF NOT EXISTS radiology_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    accession_number VARCHAR(50) UNIQUE,
    patient_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    patient_name VARCHAR(150) NOT NULL,
    encounter_id VARCHAR(50) NOT NULL,
    modality VARCHAR(10) NOT NULL, -- CR, DX, CT, MR, US, MG
    examination_code VARCHAR(50) NOT NULL, -- e.g. 'RAD-THORAX-PA', 'RAD-CT-BRAIN-NC'
    examination_name VARCHAR(255) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'ROUTINE', -- ROUTINE, URGENT, STAT_EMERGENCY
    ordering_physician_id VARCHAR(50) NOT NULL,
    ordering_physician_name VARCHAR(150) NOT NULL,
    clinical_indication TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ORDERED', -- ORDERED, SCHEDULED, PATIENT_ARRIVED, IN_PROGRESS, IMAGE_ACQUIRED, REPORT_PENDING, REPORT_FINALIZED, COMPLETED, ARCHIVED
    scheduled_at TIMESTAMPTZ,
    patient_arrived_at TIMESTAMPTZ,
    procedure_started_at TIMESTAMPTZ,
    image_acquired_at TIMESTAMPTZ,
    report_finalized_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    billing_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, BILLED, CLAIMED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: radiology_audit_log (Immutable Forensic Event Ledger)
CREATE TABLE IF NOT EXISTS radiology_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_id UUID REFERENCES radiology_orders(id) ON DELETE SET NULL,
    study_instance_uid VARCHAR(128),
    patient_mrn VARCHAR(30) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- ORDER_CREATED, STUDY_SCHEDULED, PATIENT_CHECKIN, IMAGE_UPLOADED, IMAGE_VIEWED, REPORT_DRAFTED, REPORT_SIGNED, CRITICAL_RESULT_SENT, READBACK_CONFIRMED, FHIR_EXPORTED
    actor_id VARCHAR(50) NOT NULL,
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    workstation_ip VARCHAR(50) NOT NULL DEFAULT '10.10.3.40',
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    correlation_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. High-Performance Query Indexes
CREATE INDEX IF NOT EXISTS idx_rad_orders_status ON radiology_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_rad_orders_patient ON radiology_orders(patient_mrn, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rad_orders_modality ON radiology_orders(modality, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_rad_audit_patient ON radiology_audit_log(patient_mrn, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rad_audit_event ON radiology_audit_log(event_type, created_at DESC);

-- 4. PostgreSQL Row-Level Security (RLS) Tenant Isolation
ALTER TABLE radiology_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_audit_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY tenant_isolation_rad_orders ON radiology_orders
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY tenant_isolation_rad_audit ON radiology_audit_log
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
