-- NurseFlow Enterprise HIS 2026 — Migration 019
-- Domain: Operating Theatre (Instalasi Bedah Sentral - IBS), WHO Surgical Safety Checklist & Anesthesia Sheet
-- Compliance: JCI IPSG 4 (Safe Surgery: Correct Patient, Correct Site, Correct Procedure), WHO Surgical Safety Standard

-- 1. Table: operating_theatres (Master Kamar Operasi / Theatre Rooms)
CREATE TABLE IF NOT EXISTS operating_theatres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    room_number VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'OK-01', 'OK-02'
    room_name VARCHAR(100) NOT NULL, -- 'Kamar Operasi 1 (Bedah Umum & Digestif)'
    theatre_type VARCHAR(50) NOT NULL DEFAULT 'MAJOR', -- MAJOR, MINOR, HYBRID, EMERGENCY_CITO
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, IN_USE, CLEANING_STERILIZATION, MAINTENANCE
    current_case_id UUID,
    equipment_profile JSONB DEFAULT '{}'::jsonb, -- Laparoscopy, C-Arm, Anesthesia Workstation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: surgical_cases (Jadwal & Pelaksanaan Tindakan Bedah)
CREATE TABLE IF NOT EXISTS surgical_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    booking_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'SURG-2026-0817-001'
    patient_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    patient_name VARCHAR(150) NOT NULL,
    encounter_id VARCHAR(50) NOT NULL,
    theatre_id UUID REFERENCES operating_theatres(id) ON DELETE SET NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    procedure_code VARCHAR(50) NOT NULL, -- e.g. 'ICD9-47.0' (Apendektomi)
    procedure_name VARCHAR(255) NOT NULL,
    surgical_urgency VARCHAR(20) NOT NULL DEFAULT 'ELECTIVE', -- ELECTIVE, URGENT, EMERGENCY_CITO
    primary_surgeon_id VARCHAR(50) NOT NULL,
    primary_surgeon_name VARCHAR(150) NOT NULL,
    anesthesiologist_id VARCHAR(50) NOT NULL,
    anesthesiologist_name VARCHAR(150) NOT NULL,
    scrub_nurse_name VARCHAR(150) NOT NULL,
    circulating_nurse_name VARCHAR(150) NOT NULL,
    anesthesia_type VARCHAR(50) NOT NULL DEFAULT 'GENERAL_ANESTHESIA', -- GENERAL_ANESTHESIA, SPINAL_EPIDURAL, REGIONAL_BLOCK, LOCAL_MAC
    asa_class VARCHAR(10) NOT NULL DEFAULT 'ASA_II', -- ASA_I, ASA_II, ASA_III, ASA_IV, ASA_V, ASA_E
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, PRE_OP_HOLDING, IN_THEATRE, ANESTHESIA_INDUCTION, SURGERY_IN_PROGRESS, POST_OP_PACU, COMPLETED, CANCELLED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: who_surgical_safety_checklists (JCI IPSG 4 - 3 Phase Checklist)
CREATE TABLE IF NOT EXISTS who_surgical_safety_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    surgical_case_id UUID NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    
    -- Phase 1: SIGN-IN (Before Induction of Anesthesia)
    sign_in_patient_identity_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    sign_in_surgical_site_marked BOOLEAN NOT NULL DEFAULT TRUE,
    sign_in_consent_verified BOOLEAN NOT NULL DEFAULT TRUE,
    sign_in_pulse_oximeter_attached BOOLEAN NOT NULL DEFAULT TRUE,
    sign_in_known_allergy_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    sign_in_difficult_airway_risk_assessed BOOLEAN NOT NULL DEFAULT TRUE,
    sign_in_blood_loss_risk_prepared BOOLEAN NOT NULL DEFAULT TRUE, -- >500ml or >7ml/kg in children
    sign_in_completed_at TIMESTAMPTZ,
    sign_in_verified_by_anesthesiologist VARCHAR(150),

    -- Phase 2: TIME-OUT (Before Skin Incision)
    time_out_team_introductions_done BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_patient_name_procedure_site_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_surgeon_critical_steps_briefed BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_anesthesia_concerns_reviewed BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_sterility_indicators_verified BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_antibiotic_prophylaxis_given_60min BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_essential_imaging_displayed BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_completed_at TIMESTAMPTZ,
    time_out_verified_by_primary_surgeon VARCHAR(150),

    -- Phase 3: SIGN-OUT (Before Patient Leaves Operating Room)
    sign_out_procedure_name_recorded BOOLEAN NOT NULL DEFAULT TRUE,
    sign_out_instrument_sponge_needle_count_correct BOOLEAN NOT NULL DEFAULT TRUE,
    sign_out_specimen_labeled_correctly BOOLEAN NOT NULL DEFAULT TRUE,
    sign_out_equipment_problems_addressed BOOLEAN NOT NULL DEFAULT TRUE,
    sign_out_postop_recovery_key_plan_briefed BOOLEAN NOT NULL DEFAULT TRUE,
    sign_out_completed_at TIMESTAMPTZ,
    sign_out_verified_by_circulating_nurse VARCHAR(150),

    -- Cryptographic Integrity & Ledger Seal
    checklist_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    digital_signature_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table: post_anesthesia_aldrete_scores (PACU Discharge Criteria)
CREATE TABLE IF NOT EXISTS post_anesthesia_aldrete_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    surgical_case_id UUID NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    activity_score INT NOT NULL, -- 0, 1, 2
    respiration_score INT NOT NULL, -- 0, 1, 2
    circulation_bp_score INT NOT NULL, -- 0, 1, 2
    consciousness_score INT NOT NULL, -- 0, 1, 2
    oxygen_saturation_score INT NOT NULL, -- 0, 1, 2
    total_score INT NOT NULL, -- max 10, >= 8 eligible for ward transfer
    eligible_for_discharge BOOLEAN NOT NULL DEFAULT FALSE,
    assessed_by VARCHAR(150) NOT NULL,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_surg_cases_theatre ON surgical_cases(theatre_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_surg_cases_patient ON surgical_cases(patient_mrn, scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_who_checklist_case ON who_surgical_safety_checklists(surgical_case_id);

-- PostgreSQL Row-Level Security (RLS)
ALTER TABLE operating_theatres ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE who_surgical_safety_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_anesthesia_aldrete_scores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY tenant_isolation_theatres ON operating_theatres
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY tenant_isolation_surgical_cases ON surgical_cases
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
