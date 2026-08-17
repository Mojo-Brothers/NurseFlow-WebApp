-- NurseFlow Enterprise HIS 2026 — Migration 017
-- Domain: PACS & Radiology Information System (RIS), DICOMweb, Modality Worklist (MWL) & Structured Reports
-- Standard Compliance: DICOM PS 3.10 / PS 3.18 (WADO-RS, QIDO-RS, STOW-RS), JCI IPSG 2 (Critical Radiology Findings), HL7 v2.5.1 ORM/ORU

CREATE TABLE IF NOT EXISTS radiology_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    encounter_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    study_instance_uid VARCHAR(128) UNIQUE NOT NULL,
    accession_number VARCHAR(50) UNIQUE NOT NULL,
    modality VARCHAR(10) NOT NULL, -- CR, DX, CT, MR, US, MG, NM
    body_part_examined VARCHAR(50) NOT NULL, -- CHEST, BRAIN, ABDOMEN, SPINE, EXTREMITY
    study_description VARCHAR(255) NOT NULL,
    patient_position VARCHAR(20) DEFAULT 'AP', -- AP, PA, LATERAL, AXIAL
    study_date DATE NOT NULL DEFAULT CURRENT_DATE,
    study_time TIME NOT NULL DEFAULT CURRENT_TIME,
    referring_physician VARCHAR(100) NOT NULL,
    performing_technologist VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACQUIRED', -- SCHEDULED, IN_PROGRESS, ACQUIRED, REPORTED, VERIFIED
    wado_rs_endpoint VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS radiology_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    study_id UUID NOT NULL REFERENCES radiology_studies(id) ON DELETE CASCADE,
    series_instance_uid VARCHAR(128) UNIQUE NOT NULL,
    series_number INT NOT NULL DEFAULT 1,
    modality VARCHAR(10) NOT NULL,
    series_description VARCHAR(255),
    slice_thickness_mm NUMERIC(6, 2) DEFAULT 1.0,
    kvp NUMERIC(6, 2) DEFAULT 120.0,
    xray_tube_current_ma NUMERIC(6, 2) DEFAULT 250.0,
    num_instances INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS radiology_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    series_id UUID NOT NULL REFERENCES radiology_series(id) ON DELETE CASCADE,
    sop_instance_uid VARCHAR(128) UNIQUE NOT NULL,
    sop_class_uid VARCHAR(64) NOT NULL DEFAULT '1.2.840.10008.5.1.4.1.1.1', -- Digital X-Ray Image Storage
    instance_number INT NOT NULL DEFAULT 1,
    image_rows INT NOT NULL DEFAULT 512,
    image_columns INT NOT NULL DEFAULT 512,
    window_center NUMERIC(8, 2) NOT NULL DEFAULT 40, -- WL
    window_width NUMERIC(8, 2) NOT NULL DEFAULT 350, -- WW
    pixel_spacing VARCHAR(50) DEFAULT '0.5\\0.5',
    storage_uri TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS radiology_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    study_id UUID NOT NULL REFERENCES radiology_studies(id) ON DELETE CASCADE,
    encounter_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    radiologist_id VARCHAR(50) NOT NULL,
    radiologist_name VARCHAR(100) NOT NULL,
    clinical_history TEXT,
    technique_description TEXT,
    findings TEXT NOT NULL,
    impression_conclusion TEXT NOT NULL,
    rads_classification VARCHAR(50), -- BI-RADS 1-6, Lung-RADS, LI-RADS
    is_urgent_critical_finding BOOLEAN NOT NULL DEFAULT FALSE,
    critical_threat_summary TEXT, -- e.g. 'Pneumotoraks Desak Kanan', 'Perdarahan Intrakranial Akut'
    status VARCHAR(30) NOT NULL DEFAULT 'FINALIZED', -- DRAFT, PRELIMINARY, FINALIZED, AMENDED
    digital_signature_hash VARCHAR(128) NOT NULL,
    workstation_ip VARCHAR(50) DEFAULT '10.10.3.40',
    actor_role VARCHAR(50) DEFAULT 'RADIOLOGIST',
    correlation_id VARCHAR(64),
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS radiology_critical_finding_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    report_id UUID NOT NULL REFERENCES radiology_reports(id) ON DELETE CASCADE,
    study_instance_uid VARCHAR(128) NOT NULL,
    encounter_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    critical_finding_type VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_READ_BACK', -- PENDING_READ_BACK, ACKNOWLEDGED_READ_BACK, ESCALATED_DPJP
    reported_to_clinician VARCHAR(100),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_back_confirmed_by VARCHAR(100),
    read_back_at TIMESTAMPTZ,
    read_back_statement TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning-fast DICOMweb queries
CREATE INDEX IF NOT EXISTS idx_rad_studies_patient ON radiology_studies(patient_id, study_date);
CREATE INDEX IF NOT EXISTS idx_rad_studies_uid ON radiology_studies(study_instance_uid);
CREATE INDEX IF NOT EXISTS idx_rad_studies_accession ON radiology_studies(accession_number);
CREATE INDEX IF NOT EXISTS idx_rad_reports_study ON radiology_reports(study_id);
CREATE INDEX IF NOT EXISTS idx_rad_critical_alerts ON radiology_critical_finding_alerts(status);

-- PostgreSQL Row-Level Security (RLS) Tenant Isolation Policies
ALTER TABLE radiology_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_critical_finding_alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY tenant_isolation_rad_studies ON radiology_studies
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY tenant_isolation_rad_reports ON radiology_reports
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
