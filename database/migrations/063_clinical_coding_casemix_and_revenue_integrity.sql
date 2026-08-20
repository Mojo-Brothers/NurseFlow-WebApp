-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 063: Clinical Coding, Casemix & Revenue Integrity
-- Sprint 5A / Step 9: Clinical Documentation Improvement (CDI), ICD-10/ICD-9-CM Multi-Version Coding,
-- Physician Query Clarification Loop, INA-CBG Permenkes 3/2023 Grouping & Revenue Leakage Cross-Audit.
-- Standards: Permenkes No. 3/2023, JCI MOI / COP / FMS, ICD-10 2019, ICD-9-CM, PostgreSQL 16 ACID.
-- ==============================================================================

-- 1. Table: clinical_coding_records (SCD2 Versioned Clinical Coding Ledger)
CREATE TABLE IF NOT EXISTS clinical_coding_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    coding_number VARCHAR(50) NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    principal_icd10_code VARCHAR(20) NOT NULL,
    principal_icd10_desc TEXT NOT NULL,
    secondary_diagnoses JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ icd10, desc, poa: 'Y'|'N'|'U'|'W', is_cc: bool, is_mcc: bool }]
    procedure_codes JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ icd9, desc, surgical_case_id, sequence: 1 }]
    coder_id VARCHAR(50) NOT NULL,
    coder_name VARCHAR(100) NOT NULL,
    coding_status VARCHAR(30) NOT NULL DEFAULT 'CODED' CHECK (coding_status IN ('DRAFT', 'CODED', 'QUERY_PENDING', 'FINALIZED', 'SUPERSEDED')),
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coding_encounter ON clinical_coding_records(encounter_id);
CREATE INDEX IF NOT EXISTS idx_coding_patient ON clinical_coding_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_coding_active ON clinical_coding_records(encounter_id, is_active);

-- 2. Table: clinical_documentation_queries (Physician-Coder Query / CDI Loop)
CREATE TABLE IF NOT EXISTS clinical_documentation_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coding_record_id UUID NOT NULL REFERENCES clinical_coding_records(id) ON DELETE CASCADE,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    query_number VARCHAR(50) UNIQUE NOT NULL,
    query_type VARCHAR(50) NOT NULL CHECK (query_type IN (
        'SPECIFICITY_CLARIFICATION', 'CONFLICTING_DOCUMENTATION',
        'POA_VERIFICATION', 'UNCODED_PROCEDURE', 'DIAGNOSTIC_CONFIRMATION'
    )),
    query_text TEXT NOT NULL,
    coder_id VARCHAR(50) NOT NULL,
    coder_name VARCHAR(100) NOT NULL,
    target_physician_id VARCHAR(50) NOT NULL,
    target_physician_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ANSWERED', 'RESOLVED', 'ESCALATED')),
    physician_response_text TEXT,
    answered_at TIMESTAMP WITH TIME ZONE,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cdi_query_coding ON clinical_documentation_queries(coding_record_id);
CREATE INDEX IF NOT EXISTS idx_cdi_query_physician ON clinical_documentation_queries(target_physician_id, status);

-- 3. Table: casemix_grouping_audits (Permenkes 3/2023 INA-CBG Grouping Ledger)
CREATE TABLE IF NOT EXISTS casemix_grouping_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coding_record_id UUID NOT NULL REFERENCES clinical_coding_records(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    grouping_number VARCHAR(50) UNIQUE NOT NULL,
    grouper_version VARCHAR(50) NOT NULL DEFAULT 'INA-CBG 6.0 (Permenkes 3/2023)',
    mdc_code VARCHAR(20) NOT NULL,
    inacbg_code VARCHAR(20) NOT NULL,
    inacbg_description TEXT NOT NULL,
    severity_level VARCHAR(10) NOT NULL DEFAULT 'I' CHECK (severity_level IN ('I', 'II', 'III')),
    base_tariff_idr NUMERIC(15, 2) NOT NULL,
    special_procedures_topup_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    special_prosthesis_topup_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    special_drugs_topup_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    final_claim_tariff_idr NUMERIC(15, 2) NOT NULL,
    real_hospital_cost_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cost_variance_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- final_claim_tariff_idr - real_hospital_cost_idr
    grouped_by_id VARCHAR(50) NOT NULL,
    grouped_by_name VARCHAR(100) NOT NULL,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    grouped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_casemix_audit_encounter ON casemix_grouping_audits(encounter_id);
CREATE INDEX IF NOT EXISTS idx_casemix_audit_code ON casemix_grouping_audits(inacbg_code);

-- 4. Table: revenue_integrity_cross_audits (Leakage Protection & Cross-Domain Audit)
CREATE TABLE IF NOT EXISTS revenue_integrity_cross_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    audit_number VARCHAR(50) UNIQUE NOT NULL,
    audit_status VARCHAR(50) NOT NULL DEFAULT 'CLEAN_NO_LEAKAGE' CHECK (audit_status IN (
        'CLEAN_NO_LEAKAGE', 'UNCODED_CLINICAL_EVENT', 'UNBILLED_DELIVERED_ITEM',
        'DISCREPANCY_DETECTED', 'RECONCILED_RESOLVED'
    )),
    clinical_events_count INT NOT NULL DEFAULT 0,
    coded_diagnoses_count INT NOT NULL DEFAULT 0,
    coded_procedures_count INT NOT NULL DEFAULT 0,
    billed_items_count INT NOT NULL DEFAULT 0,
    identified_leakages JSONB NOT NULL DEFAULT '[]'::jsonb,
    audited_by_id VARCHAR(50) NOT NULL,
    audited_by_name VARCHAR(100) NOT NULL,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    audited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rev_audit_encounter ON revenue_integrity_cross_audits(encounter_id);

-- 5. Table: electronic_claim_submissions (BPJS / Payer Claim Lifecycle FSM)
CREATE TABLE IF NOT EXISTS electronic_claim_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grouping_audit_id UUID NOT NULL REFERENCES casemix_grouping_audits(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    submission_number VARCHAR(50) UNIQUE NOT NULL,
    sep_number VARCHAR(50) NOT NULL,
    bpjs_card_number VARCHAR(30) NOT NULL,
    payer_type VARCHAR(30) NOT NULL DEFAULT 'BPJS_KESEHATAN' CHECK (payer_type IN ('BPJS_KESEHATAN', 'ASURANSI_SWASTA', 'MANDIRI_UMUM', 'KEMENKES_COVID_JAMPERSAL')),
    claim_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (claim_status IN (
        'DRAFT', 'VALIDATED', 'GROUPED', 'SUBMITTED', 'ACCEPTED', 'PAID', 'DISPUTED', 'RESUBMITTED', 'CANCELLED'
    )),
    dispute_reason TEXT,
    claimed_amount_idr NUMERIC(15, 2) NOT NULL,
    approved_amount_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    disputed_amount_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    submitter_id VARCHAR(50) NOT NULL,
    submitter_name VARCHAR(100) NOT NULL,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    submitted_at TIMESTAMP WITH TIME ZONE,
    adjudicated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_encounter ON electronic_claim_submissions(encounter_id);
CREATE INDEX IF NOT EXISTS idx_claim_sep ON electronic_claim_submissions(sep_number);
CREATE INDEX IF NOT EXISTS idx_claim_status ON electronic_claim_submissions(claim_status);
