-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 061: Operating Theatre & Perioperative Closed Loop
-- Sprint 5A / Step 8: Surgical Booking, Pre-Op Anesthesia Evaluation, WHO 3-Phase Checklist,
-- Intraoperative AIMS & Implant UDI Traceability, PACU Aldrete Recovery & Closed-Loop Charge Capture.
-- Standards: JCI IPSG 4 (Safe Surgery), ASA (American Society of Anesthesiologists), WHO Safe Surgery, PostgreSQL 16 ACID.
-- ==============================================================================

-- 1. Table: perioperative_anesthesia_evaluations (Pre-Operative Assessment)
CREATE TABLE IF NOT EXISTS perioperative_anesthesia_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    evaluation_number VARCHAR(50) UNIQUE NOT NULL,
    asa_class VARCHAR(10) NOT NULL CHECK (asa_class IN ('ASA_I', 'ASA_II', 'ASA_III', 'ASA_IV', 'ASA_V', 'ASA_VI', 'ASA_E')),
    mallampati_score INT NOT NULL CHECK (mallampati_score BETWEEN 1 AND 4),
    airway_assessment VARCHAR(50) NOT NULL DEFAULT 'NORMAL' CHECK (airway_assessment IN ('NORMAL', 'POTENTIAL_DIFFICULT', 'DIFFICULT_AIRWAY')),
    npo_fasting_hours NUMERIC(4, 1) NOT NULL,
    known_allergies JSONB NOT NULL DEFAULT '[]'::jsonb,
    cardiopulmonary_clearance TEXT NOT NULL,
    anesthesia_plan VARCHAR(50) NOT NULL CHECK (anesthesia_plan IN ('GENERAL_ANESTHESIA', 'SPINAL_EPIDURAL', 'REGIONAL_NERVE_BLOCK', 'LOCAL_MAC', 'TOTAL_INTRAVENOUS')),
    informed_consent_verified BOOLEAN NOT NULL DEFAULT TRUE,
    evaluator_anesthesiologist_id VARCHAR(50) NOT NULL,
    evaluator_anesthesiologist_name VARCHAR(100) NOT NULL,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preop_eval_encounter ON perioperative_anesthesia_evaluations(encounter_id);
CREATE INDEX IF NOT EXISTS idx_preop_eval_patient ON perioperative_anesthesia_evaluations(patient_id);

-- 2. Table: who_safety_checklist_executions (JCI IPSG 4 - 3 Phase Checklist Execution)
CREATE TABLE IF NOT EXISTS who_safety_checklist_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgical_case_id UUID NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    checklist_number VARCHAR(50) UNIQUE NOT NULL,

    -- Phase 1: SIGN-IN (Before Induction of Anesthesia)
    sign_in_patient_identity_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    sign_in_site_marked BOOLEAN NOT NULL DEFAULT TRUE,
    sign_in_consent_verified BOOLEAN NOT NULL DEFAULT TRUE,
    sign_in_oximeter_functioning BOOLEAN NOT NULL DEFAULT TRUE,
    sign_in_allergy_checked BOOLEAN NOT NULL DEFAULT TRUE,
    sign_in_airway_risk_prepared BOOLEAN NOT NULL DEFAULT TRUE,
    sign_in_blood_loss_prepared BOOLEAN NOT NULL DEFAULT TRUE,
    sign_in_completed_at TIMESTAMP WITH TIME ZONE,
    sign_in_verifier_id VARCHAR(50),
    sign_in_verifier_name VARCHAR(100),

    -- Phase 2: TIME-OUT (Before Skin Incision)
    time_out_team_introductions BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_patient_name_procedure_site BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_surgeon_critical_steps BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_anesthesia_concerns BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_sterility_indicators_verified BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_antibiotic_prophylaxis_given BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_imaging_displayed BOOLEAN NOT NULL DEFAULT TRUE,
    time_out_completed_at TIMESTAMP WITH TIME ZONE,
    time_out_verifier_id VARCHAR(50),
    time_out_verifier_name VARCHAR(100),

    -- Phase 3: SIGN-OUT (Before Patient Leaves Operating Room)
    sign_out_procedure_recorded BOOLEAN NOT NULL DEFAULT TRUE,
    sign_out_counts_reconciled BOOLEAN NOT NULL DEFAULT TRUE,
    sign_out_specimen_labeled BOOLEAN NOT NULL DEFAULT TRUE,
    sign_out_equipment_issues_addressed BOOLEAN NOT NULL DEFAULT TRUE,
    sign_out_postop_recovery_plan TEXT NOT NULL,
    sign_out_completed_at TIMESTAMP WITH TIME ZONE,
    sign_out_verifier_id VARCHAR(50),
    sign_out_verifier_name VARCHAR(100),

    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'SIGN_IN_DONE', 'TIME_OUT_DONE', 'SIGN_OUT_COMPLETED', 'ABORTED')),
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_who_checklist_case ON who_safety_checklist_executions(surgical_case_id);
CREATE INDEX IF NOT EXISTS idx_who_checklist_encounter ON who_safety_checklist_executions(encounter_id);

-- 3. Table: pacu_recovery_records (Post-Anesthesia Care Unit Aldrete Scoring)
CREATE TABLE IF NOT EXISTS pacu_recovery_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgical_case_id UUID NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    arrival_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    discharge_time TIMESTAMP WITH TIME ZONE,

    -- Modified Aldrete Recovery Score Parameters (Each 0-2, Total 10)
    aldrete_consciousness INT NOT NULL CHECK (aldrete_consciousness BETWEEN 0 AND 2),
    aldrete_activity INT NOT NULL CHECK (aldrete_activity BETWEEN 0 AND 2),
    aldrete_respiration INT NOT NULL CHECK (aldrete_respiration BETWEEN 0 AND 2),
    aldrete_circulation INT NOT NULL CHECK (aldrete_circulation BETWEEN 0 AND 2),
    aldrete_o2_saturation INT NOT NULL CHECK (aldrete_o2_saturation BETWEEN 0 AND 2),
    total_aldrete_score INT NOT NULL CHECK (total_aldrete_score BETWEEN 0 AND 10),

    pain_vas_score INT NOT NULL DEFAULT 0 CHECK (pain_vas_score BETWEEN 0 AND 10),
    nausea_vomiting_status VARCHAR(30) NOT NULL DEFAULT 'NONE' CHECK (nausea_vomiting_status IN ('NONE', 'MILD', 'MODERATE', 'SEVERE')),
    surgical_wound_condition VARCHAR(50) NOT NULL DEFAULT 'DRY_INTACT' CHECK (surgical_wound_condition IN ('DRY_INTACT', 'MINIMAL_SEROUS', 'ACTIVE_BLEEDING')),
    vital_signs_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    discharge_readiness_status VARCHAR(30) NOT NULL DEFAULT 'MONITORING_PACU' CHECK (discharge_readiness_status IN ('MONITORING_PACU', 'READY_FOR_WARD_TRANSFER', 'ESCALATED_TO_ICU', 'TRANSFERRED')),
    discharge_destination VARCHAR(50) NOT NULL DEFAULT 'INPATIENT_WARD' CHECK (discharge_destination IN ('INPATIENT_WARD', 'ICU', 'DAY_SURGERY_HOME')),
    pacu_nurse_id VARCHAR(50) NOT NULL,
    pacu_nurse_name VARCHAR(100) NOT NULL,
    attending_anesthesiologist_id VARCHAR(50) NOT NULL,
    attending_anesthesiologist_name VARCHAR(100) NOT NULL,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pacu_case ON pacu_recovery_records(surgical_case_id);
CREATE INDEX IF NOT EXISTS idx_pacu_encounter ON pacu_recovery_records(encounter_id);

-- 4. Table: intraoperative_implant_ledgers (UDI Permanent Medical Devices)
CREATE TABLE IF NOT EXISTS intraoperative_implant_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgical_case_id UUID NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    implant_catalog_code VARCHAR(50) NOT NULL,
    implant_name VARCHAR(200) NOT NULL,
    udi_barcode VARCHAR(100) NOT NULL,
    serial_or_lot_number VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(150) NOT NULL,
    expiry_date DATE NOT NULL,
    anatomical_site VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_cost_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    surgeon_id VARCHAR(50) NOT NULL,
    surgeon_name VARCHAR(100) NOT NULL,
    scrub_nurse_id VARCHAR(50) NOT NULL,
    scrub_nurse_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'IMPLANTED' CHECK (status IN ('IMPLANTED', 'WASTED_CONTAMINATED', 'RETURNED_TO_DEPOT')),
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    implanted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_implant_case ON intraoperative_implant_ledgers(surgical_case_id);
CREATE INDEX IF NOT EXISTS idx_implant_udi ON intraoperative_implant_ledgers(udi_barcode);
CREATE INDEX IF NOT EXISTS idx_implant_encounter ON intraoperative_implant_ledgers(encounter_id);
