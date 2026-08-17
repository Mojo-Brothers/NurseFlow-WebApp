-- NurseFlow Enterprise HIS 2026 — Migration 023
-- Domain: Blood Bank (BDRS) Enterprise, Massive Transfusion Protocol (MTP), Bedside Dual Nurse Verification & Hemovigilance
-- Compliance: Permenkes 91/2015 (Standar Pelayanan Transfusi Darah), JCI IPSG 1 (Patient Identification & Bedside Verification), WHO Blood Safety Guidelines

-- 1. Table: massive_transfusion_protocols (MTP 1:1:1 Emergency Packaged Release)
CREATE TABLE IF NOT EXISTS massive_transfusion_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    encounter_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    patient_name VARCHAR(150) NOT NULL,
    trigger_clinical_indication VARCHAR(100) NOT NULL, -- 'HEMORRHAGIC_SHOCK', 'TRAUMA_MAJOR_RUPTURE', 'POSTPARTUM_HEMORRHAGE', 'SURGICAL_MASSIVE_BLEEDING'
    shock_index NUMERIC(4, 2) NOT NULL, -- Heart Rate / Systolic BP (> 1.0 = Severe Shock)
    estimated_blood_loss_ml INT NOT NULL,
    package_round INT NOT NULL DEFAULT 1, -- Round 1, Round 2, Round 3
    prc_units_count INT NOT NULL DEFAULT 4,
    ffp_units_count INT NOT NULL DEFAULT 4,
    tc_units_count INT NOT NULL DEFAULT 4,
    is_uncrossed_emergency_release BOOLEAN NOT NULL DEFAULT FALSE,
    authorizing_physician_name VARCHAR(150) NOT NULL,
    authorizing_physician_license VARCHAR(50) NOT NULL,
    activation_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, DEACTIVATED
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 2. Table: blood_bedside_dual_nurse_verifications (JCI IPSG 1 Bedside Verification)
CREATE TABLE IF NOT EXISTS blood_bedside_dual_nurse_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    unit_id VARCHAR(50) NOT NULL,
    unit_number VARCHAR(50) NOT NULL,
    encounter_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    patient_wristband_scanned BOOLEAN NOT NULL DEFAULT TRUE,
    blood_bag_barcode_scanned BOOLEAN NOT NULL DEFAULT TRUE,
    patient_blood_group VARCHAR(10) NOT NULL, -- 'A Rh+'
    donor_unit_blood_group VARCHAR(10) NOT NULL, -- 'A Rh+' or 'O Rh-'
    is_group_compatible BOOLEAN NOT NULL DEFAULT TRUE,
    crossmatch_id VARCHAR(50) NOT NULL,
    
    -- Pre-Transfusion Vitals
    pre_vital_bp VARCHAR(20) NOT NULL,
    pre_vital_hr INT NOT NULL,
    pre_vital_temp_celsius NUMERIC(4, 1) NOT NULL,
    pre_vital_spo2 INT NOT NULL,
    
    -- 15-Minute Observation Vitals
    obs15_vital_bp VARCHAR(20),
    obs15_vital_hr INT,
    obs15_vital_temp_celsius NUMERIC(4, 1),
    obs15_vital_spo2 INT,
    
    -- Dual Nurse Sign-Off
    primary_nurse_id VARCHAR(50) NOT NULL,
    primary_nurse_name VARCHAR(150) NOT NULL,
    secondary_nurse_id VARCHAR(50) NOT NULL,
    secondary_nurse_name VARCHAR(150) NOT NULL,
    dual_signature_hash VARCHAR(128) NOT NULL,
    transfusion_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transfusion_completed_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'TRANSFUSING_NORMAL', -- TRANSFUSING_NORMAL, COMPLETED, STOPPED_REACTION
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: hemovigilance_incident_investigations (Transfusion Reaction Management)
CREATE TABLE IF NOT EXISTS hemovigilance_incident_investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    verification_id UUID REFERENCES blood_bedside_dual_nurse_verifications(id) ON DELETE CASCADE,
    patient_mrn VARCHAR(30) NOT NULL,
    unit_number VARCHAR(50) NOT NULL,
    reaction_classification VARCHAR(50) NOT NULL, -- 'ACUTE_HEMOLYTIC', 'FEBRILE_NON_HEMOLYTIC', 'ALLERGIC_ANAPHYLAXIS', 'TRALI', 'TACO', 'BACTERIAL_CONTAMINATION'
    symptoms_observed TEXT NOT NULL, -- 'Demam menggigil >38.5C, dispneu, nyeri punggung bawah, hipotensi'
    minutes_into_transfusion INT NOT NULL,
    volume_infused_ml INT NOT NULL,
    emergency_stop_executed_at TIMESTAMPTZ NOT NULL,
    iv_flush_saline_administered BOOLEAN NOT NULL DEFAULT TRUE,
    emergency_medications_given TEXT, -- 'Inj. Diphenhydramine 50mg IV, Inj. Dexamethasone 10mg IV'
    post_transfusion_blood_sample_sent BOOLEAN NOT NULL DEFAULT TRUE,
    post_transfusion_urine_sample_sent BOOLEAN NOT NULL DEFAULT TRUE,
    bag_returned_to_bdrs BOOLEAN NOT NULL DEFAULT TRUE,
    reported_to_committee BOOLEAN NOT NULL DEFAULT TRUE,
    investigation_conclusion TEXT,
    reported_by_nurse VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table: blood_bank_billing_reconciliations (BPPD & Service Fees)
CREATE TABLE IF NOT EXISTS blood_bank_billing_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    encounter_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    unit_number VARCHAR(50) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    bppd_processing_fee_idr NUMERIC(15, 2) NOT NULL DEFAULT 360000.00, -- Standar Biaya Penggantian Pengolahan Darah PMI/BDRS
    crossmatch_testing_fee_idr NUMERIC(15, 2) NOT NULL DEFAULT 120000.00,
    transfusion_set_charge_idr NUMERIC(15, 2) NOT NULL DEFAULT 45000.00,
    total_charge_idr NUMERIC(15, 2) NOT NULL DEFAULT 525000.00,
    billing_status VARCHAR(20) NOT NULL DEFAULT 'BILLED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mtp_patient ON massive_transfusion_protocols(patient_mrn, activation_status);
CREATE INDEX IF NOT EXISTS idx_bedside_unit ON blood_bedside_dual_nurse_verifications(unit_number);
CREATE INDEX IF NOT EXISTS idx_hemo_patient ON hemovigilance_incident_investigations(patient_mrn);

-- Row-Level Security (RLS)
ALTER TABLE massive_transfusion_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_bedside_dual_nurse_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hemovigilance_incident_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_bank_billing_reconciliations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY tenant_isolation_mtp ON massive_transfusion_protocols
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
