-- NurseFlow Enterprise HIS 2026 — Migration 024
-- Domain: Casemix & Revenue Cycle Center (Klaim Kolektif INA-CBG, Rekonsiliasi Kasir & BPJS V-Claim 2.0)
-- Standard: Permenkes No. 3/2023 (Standar Tarif Pelayanan Kesehatan dalam Penyelenggaraan JKN) & JCI MOI / FMS

-- 1. Table: casemix_cases
CREATE TABLE IF NOT EXISTS casemix_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    encounter_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    patient_name VARCHAR(150) NOT NULL,
    admission_date TIMESTAMPTZ NOT NULL,
    discharge_date TIMESTAMPTZ,
    length_of_stay_days INT NOT NULL DEFAULT 1,
    patient_payer_type VARCHAR(30) NOT NULL DEFAULT 'BPJS_KESEHATAN', -- 'BPJS_KESEHATAN', 'ASURANSI_SWASTA', 'MANDIRI_UMUM'
    bpjs_card_number VARCHAR(30),
    sep_number VARCHAR(50), -- Surat Eligibilitas Peserta (SEP)
    primary_icd10_code VARCHAR(20) NOT NULL,
    primary_icd10_description TEXT NOT NULL,
    secondary_icd10_codes JSONB DEFAULT '[]'::jsonb,
    icd9_procedure_codes JSONB DEFAULT '[]'::jsonb,
    case_status VARCHAR(30) NOT NULL DEFAULT 'IN_CODING', -- 'IN_CODING', 'READY_FOR_GROUPING', 'VERIFIED_INTERNAL', 'SUBMITTED_BPJS', 'APPROVED_PAID', 'DISPUTED'
    coder_staff_name VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: inacbg_grouping_results
CREATE TABLE IF NOT EXISTS inacbg_grouping_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    casemix_case_id UUID REFERENCES casemix_cases(id) ON DELETE CASCADE,
    cbg_code VARCHAR(20) NOT NULL, -- e.g., 'K-1-14-I', 'I-4-10-II'
    cbg_description TEXT NOT NULL,
    severity_level VARCHAR(10) NOT NULL DEFAULT 'I', -- 'I', 'II', 'III' (Tingkat Keparahan)
    tariff_standard_idr NUMERIC(15, 2) NOT NULL,
    hospital_class_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    tariff_final_idr NUMERIC(15, 2) NOT NULL,
    real_hospital_cost_idr NUMERIC(15, 2) NOT NULL,
    margin_profit_loss_idr NUMERIC(15, 2) NOT NULL, -- tariff_final_idr - real_hospital_cost_idr
    grouper_version VARCHAR(30) NOT NULL DEFAULT 'INA-CBG 6.0 (Permenkes 3/2023)',
    grouped_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: patient_billing_reconciliation
CREATE TABLE IF NOT EXISTS patient_billing_reconciliation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    encounter_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    consultation_charges_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    pharmacy_charges_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    laboratory_charges_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    radiology_charges_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    surgery_charges_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    blood_bank_charges_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    room_icu_charges_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_real_charges_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    reconciliation_status VARCHAR(30) NOT NULL DEFAULT 'BALANCED', -- 'BALANCED', 'DISCREPANCY_FOUND', 'LOCKED'
    audited_by_cashier VARCHAR(150),
    audited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table: bpjs_claim_submissions
CREATE TABLE IF NOT EXISTS bpjs_claim_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    casemix_case_id UUID REFERENCES casemix_cases(id) ON DELETE CASCADE,
    sep_number VARCHAR(50) NOT NULL,
    fsm_stage VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED', 'VERIFIED_OK', 'APPROVED_BPJS', 'DISPUTED', 'PAID'
    submission_batch_id VARCHAR(50),
    claim_amount_requested_idr NUMERIC(15, 2) NOT NULL,
    claim_amount_approved_idr NUMERIC(15, 2),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ
);

-- 5. Table: bpjs_claim_disputes
CREATE TABLE IF NOT EXISTS bpjs_claim_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    submission_id UUID REFERENCES bpjs_claim_submissions(id) ON DELETE CASCADE,
    sep_number VARCHAR(50) NOT NULL,
    dispute_code VARCHAR(50) NOT NULL, -- 'PENDING_RESUME_MEDIS', 'UNAPPROVED_SECONDARY_DIAGNOSIS', 'MISSING_SURGICAL_REPORT', 'DOSAGE_JUSTIFICATION_NEEDED'
    bpjs_verifier_note TEXT NOT NULL,
    dispute_status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'CLARIFICATION_SUBMITTED', 'RESOLVED_ACCEPTED', 'REJECTED_UNPAID'
    hospital_response_note TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_casemix_encounter ON casemix_cases(encounter_id, patient_mrn);
CREATE INDEX IF NOT EXISTS idx_casemix_status ON casemix_cases(case_status);
CREATE INDEX IF NOT EXISTS idx_inacbg_case ON inacbg_grouping_results(casemix_case_id);
CREATE INDEX IF NOT EXISTS idx_vclaim_sep ON bpjs_claim_submissions(sep_number, fsm_stage);
CREATE INDEX IF NOT EXISTS idx_dispute_status ON bpjs_claim_disputes(dispute_status);

-- Row-Level Security (RLS)
ALTER TABLE casemix_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE inacbg_grouping_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_billing_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpjs_claim_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpjs_claim_disputes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY tenant_isolation_casemix ON casemix_cases
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
