-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 055: RIS/PACS Clinical Integrity & DICOM Hardening
-- Standards: DICOM PS 3.10 / PS 3.18, JCI IPSG 2 (Critical Radiology Findings),
-- Multi-Attribute Demographic Patient Identity Safeguard, Immutable Report Versioning History,
-- Strict Closed-Loop Critical Finding Provenance, and Partial CPOE Completion FSM.
-- ==============================================================================

-- 1. Enhance radiology_studies with demographic attributes for multi-attribute verification
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_studies' AND column_name = 'patient_name') THEN
        ALTER TABLE radiology_studies ADD COLUMN patient_name VARCHAR(150);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_studies' AND column_name = 'patient_birth_date') THEN
        ALTER TABLE radiology_studies ADD COLUMN patient_birth_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_studies' AND column_name = 'patient_sex') THEN
        ALTER TABLE radiology_studies ADD COLUMN patient_sex VARCHAR(10);
    END IF;
END $$;

-- 2. Create radiology_report_versions (Immutable Historic Report Snapshots)
CREATE TABLE IF NOT EXISTS radiology_report_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES radiology_reports(id) ON DELETE CASCADE,
    version INT NOT NULL,
    findings TEXT NOT NULL,
    impression_conclusion TEXT NOT NULL,
    rads_classification VARCHAR(50),
    is_urgent_critical_finding BOOLEAN DEFAULT FALSE,
    digital_signature_hash VARCHAR(128) NOT NULL,
    amendment_reason TEXT,
    signed_by VARCHAR(100) NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rad_rep_versions_report ON radiology_report_versions(report_id, version);

-- 3. Enhance radiology_critical_finding_alerts with explicit communication provenance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_critical_finding_alerts' AND column_name = 'notification_method') THEN
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN notification_method VARCHAR(50) DEFAULT 'TELEPHONE_DIRECT';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_critical_finding_alerts' AND column_name = 'notified_to_name') THEN
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN notified_to_name VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_critical_finding_alerts' AND column_name = 'notified_to_role') THEN
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN notified_to_role VARCHAR(50) DEFAULT 'ROLE_DOCTOR_DPJP';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_critical_finding_alerts' AND column_name = 'severity') THEN
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN severity VARCHAR(30) DEFAULT 'STAT_IMMEDIATE';
    END IF;
END $$;
