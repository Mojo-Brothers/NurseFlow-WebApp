-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 014: Operating Theatre (IBS) & ICU Acuity Scoring Persistence
-- Standar: WHO Guidelines for Safe Surgery, JCI IPSG 4, Sepsis-3 (SOFA) & APACHE II Protocols
-- Features: Surgery Schedule vs Case Separation, 3-Phase WHO Safety Checklist, Anesthesia, PACU Handoff & Versioned ICU Acuity Snapshots
-- ==============================================================================

-- ─── 1. OPERATING THEATRES & OPERATING ROOMS ───
CREATE TABLE IF NOT EXISTS operating_theatres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    theatre_code VARCHAR(30) NOT NULL,
    theatre_name VARCHAR(100) NOT NULL,
    floor_id UUID REFERENCES master_floors(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_theatre_tenant_code UNIQUE (tenant_id, theatre_code)
);

CREATE INDEX IF NOT EXISTS idx_theatres_tenant ON operating_theatres(tenant_id);

CREATE TABLE IF NOT EXISTS operating_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    theatre_id UUID NOT NULL REFERENCES operating_theatres(id) ON DELETE RESTRICT,
    room_number VARCHAR(30) NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    room_type VARCHAR(50) NOT NULL DEFAULT 'MAJOR' 
        CHECK (room_type IN ('MAJOR', 'MINOR', 'EMERGENCY', 'LAMINAR_AIRFLOW', 'HYBRID_OR', 'ENDOSCOPY')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_op_room_number UNIQUE (theatre_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_op_rooms_tenant ON operating_rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_op_rooms_theatre ON operating_rooms(theatre_id);

-- ─── 2. SURGERY SCHEDULES (BOOKING & RESOURCE RESERVATION) ───
CREATE TABLE IF NOT EXISTS surgery_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    booking_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    episode_id UUID NOT NULL REFERENCES episodes_of_care(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    operating_room_id UUID NOT NULL REFERENCES operating_rooms(id) ON DELETE RESTRICT,
    lead_surgeon_id VARCHAR(50) NOT NULL,
    lead_surgeon_name VARCHAR(100) NOT NULL,
    anesthesiologist_id VARCHAR(50),
    anesthesiologist_name VARCHAR(100),
    scheduled_date DATE NOT NULL,
    slot_time VARCHAR(20) NOT NULL,
    estimated_duration_minutes INT NOT NULL DEFAULT 120 CHECK (estimated_duration_minutes > 0),
    procedure_name VARCHAR(255) NOT NULL,
    icd9_cm_code VARCHAR(30),
    surgery_type VARCHAR(30) NOT NULL DEFAULT 'ELECTIVE' 
        CHECK (surgery_type IN ('ELECTIVE', 'EMERGENCY', 'URGENT', 'ONE_DAY_CARE')),
    booking_status VARCHAR(30) NOT NULL DEFAULT 'BOOKED' 
        CHECK (booking_status IN ('BOOKED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
    cancellation_reason TEXT,
    rescheduled_from_id UUID REFERENCES surgery_schedules(id) ON DELETE RESTRICT,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIAL UNIQUE INDEX: Mencegah tabrakan pemesanan slot aktif pada kamar operasi yang sama
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_room_slot 
ON surgery_schedules(tenant_id, operating_room_id, scheduled_date, slot_time) 
WHERE booking_status IN ('BOOKED', 'CONFIRMED', 'IN_PROGRESS');

CREATE INDEX IF NOT EXISTS idx_surg_sched_tenant ON surgery_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_surg_sched_patient ON surgery_schedules(patient_id);
CREATE INDEX IF NOT EXISTS idx_surg_sched_room ON surgery_schedules(operating_room_id);
CREATE INDEX IF NOT EXISTS idx_surg_sched_date ON surgery_schedules(scheduled_date);

-- ─── 3. SURGERY CASES (TINDAKAN KLINIS RIIL & STATE MACHINE) ───
CREATE TABLE IF NOT EXISTS surgery_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    case_number VARCHAR(30) UNIQUE NOT NULL,
    schedule_id UUID REFERENCES surgery_schedules(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    episode_id UUID NOT NULL REFERENCES episodes_of_care(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    operating_room_id UUID NOT NULL REFERENCES operating_rooms(id) ON DELETE RESTRICT,
    lead_surgeon_id VARCHAR(50) NOT NULL,
    lead_surgeon_name VARCHAR(100) NOT NULL,
    anesthesiologist_id VARCHAR(50),
    anesthesiologist_name VARCHAR(100),
    surgical_nurse_id VARCHAR(50),
    surgical_nurse_name VARCHAR(100),
    circulating_nurse_id VARCHAR(50),
    circulating_nurse_name VARCHAR(100),
    procedure_name VARCHAR(255) NOT NULL,
    surgical_status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED' 
        CHECK (surgical_status IN ('SCHEDULED', 'PRE_OP_READY', 'SIGN_IN_COMPLETED', 'TIME_OUT_COMPLETED', 'PROCEDURE_IN_PROGRESS', 'SIGN_OUT_COMPLETED', 'PROCEDURE_COMPLETED', 'POST_OP_HANDOFF', 'CANCELLED')),
    procedure_started_at TIMESTAMP WITH TIME ZONE,
    procedure_completed_at TIMESTAMP WITH TIME ZONE,
    pre_op_diagnosis TEXT,
    post_op_diagnosis TEXT,
    surgical_technique_notes TEXT,
    implant_used_notes TEXT,
    specimen_sent_to_pa BOOLEAN NOT NULL DEFAULT FALSE,
    blood_loss_ml INT DEFAULT 0 CHECK (blood_loss_ml >= 0),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surg_cases_tenant ON surgery_cases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_surg_cases_patient ON surgery_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_surg_cases_encounter ON surgery_cases(encounter_id);
CREATE INDEX IF NOT EXISTS idx_surg_cases_room ON surgery_cases(operating_room_id);
CREATE INDEX IF NOT EXISTS idx_surg_cases_status ON surgery_cases(tenant_id, surgical_status);

-- ─── 4. SURGICAL SAFETY CHECKLISTS (WHO 3 PHASES PERSISTENCE) ───
CREATE TABLE IF NOT EXISTS surgical_safety_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    surgery_case_id UUID UNIQUE NOT NULL REFERENCES surgery_cases(id) ON DELETE RESTRICT,
    
    -- Phase 1: Sign In (Before Induction)
    sign_in_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    sign_in_patient_identity_site_verified BOOLEAN NOT NULL DEFAULT FALSE,
    sign_in_site_marked BOOLEAN NOT NULL DEFAULT FALSE,
    sign_in_anesthesia_safety_check_completed BOOLEAN NOT NULL DEFAULT FALSE,
    sign_in_pulse_oximeter_functioning BOOLEAN NOT NULL DEFAULT FALSE,
    sign_in_known_allergy_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    sign_in_difficult_airway_aspiration_risk BOOLEAN NOT NULL DEFAULT FALSE,
    sign_in_blood_loss_risk_prepared BOOLEAN NOT NULL DEFAULT FALSE,
    sign_in_completed_at TIMESTAMP WITH TIME ZONE,
    sign_in_verified_by_nurse VARCHAR(100),
    sign_in_anesthesiologist_name VARCHAR(100),

    -- Phase 2: Time Out (Before Skin Incision)
    time_out_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    time_out_all_team_members_introduced BOOLEAN NOT NULL DEFAULT FALSE,
    time_out_patient_name_procedure_site_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    time_out_antibiotic_prophylaxis_given_within_60min BOOLEAN NOT NULL DEFAULT FALSE,
    time_out_anticipated_critical_events_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    time_out_sterility_indicator_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    time_out_imaging_displayed_if_essential BOOLEAN NOT NULL DEFAULT FALSE,
    time_out_completed_at TIMESTAMP WITH TIME ZONE,
    time_out_verified_by_nurse VARCHAR(100),
    time_out_surgeon_name VARCHAR(100),

    -- Phase 3: Sign Out (Before Patient Leaves Operating Room)
    sign_out_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    sign_out_nurse_verbally_confirms_procedure BOOLEAN NOT NULL DEFAULT FALSE,
    sign_out_instrument_sponge_needle_counts_correct BOOLEAN NOT NULL DEFAULT FALSE,
    sign_out_specimen_labelled_correctly BOOLEAN NOT NULL DEFAULT FALSE,
    sign_out_equipment_problems_addressed BOOLEAN NOT NULL DEFAULT FALSE,
    sign_out_postop_concerns_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    sign_out_completed_at TIMESTAMP WITH TIME ZONE,
    sign_out_verified_by_nurse VARCHAR(100),

    is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
    finalized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_tenant ON surgical_safety_checklists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_checklist_case ON surgical_safety_checklists(surgery_case_id);

-- ─── 5. ANESTHESIA RECORDS ───
CREATE TABLE IF NOT EXISTS anesthesia_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    surgery_case_id UUID UNIQUE NOT NULL REFERENCES surgery_cases(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    anesthesia_type VARCHAR(50) NOT NULL 
        CHECK (anesthesia_type IN ('GENERAL_ANESTHESIA', 'SPINAL_SUBARACHNOID', 'EPIDURAL', 'COMBINED_SPINAL_EPIDURAL', 'BRACHIAL_PLEXUS_BLOCK', 'PERIPHERAL_NERVE_BLOCK', 'MONITORED_ANESTHESIA_CARE', 'LOCAL_INFILTRATION')),
    asa_classification VARCHAR(10) NOT NULL 
        CHECK (asa_classification IN ('ASA_I', 'ASA_II', 'ASA_III', 'ASA_IV', 'ASA_V', 'ASA_VI', 'ASA_I_E', 'ASA_II_E', 'ASA_III_E', 'ASA_IV_E', 'ASA_V_E')),
    mallampati_score VARCHAR(10) CHECK (mallampati_score IN ('CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IV')),
    airway_device VARCHAR(50),
    anesthesia_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    anesthesia_ended_at TIMESTAMP WITH TIME ZONE,
    anesthesiologist_id VARCHAR(50) NOT NULL,
    anesthesiologist_name VARCHAR(100) NOT NULL,
    anesthesia_nurse_name VARCHAR(100),
    pre_medications JSONB,
    maintenance_agents JSONB,
    intraop_vitals_summary JSONB,
    extubation_time TIMESTAMP WITH TIME ZONE,
    is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anesthesia_tenant ON anesthesia_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_anesthesia_case ON anesthesia_records(surgery_case_id);
CREATE INDEX IF NOT EXISTS idx_anesthesia_patient ON anesthesia_records(patient_id);

-- ─── 6. POST-OP HANDOFFS & PACU ALDRETE RECOVERY ───
CREATE TABLE IF NOT EXISTS post_op_handoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    surgery_case_id UUID UNIQUE NOT NULL REFERENCES surgery_cases(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    pacu_arrival_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    pacu_discharge_time TIMESTAMP WITH TIME ZONE,
    aldrete_activity_score INT NOT NULL CHECK (aldrete_activity_score BETWEEN 0 AND 2),
    aldrete_respiration_score INT NOT NULL CHECK (aldrete_respiration_score BETWEEN 0 AND 2),
    aldrete_circulation_score INT NOT NULL CHECK (aldrete_circulation_score BETWEEN 0 AND 2),
    aldrete_consciousness_score INT NOT NULL CHECK (aldrete_consciousness_score BETWEEN 0 AND 2),
    aldrete_o2_saturation_score INT NOT NULL CHECK (aldrete_o2_saturation_score BETWEEN 0 AND 2),
    total_aldrete_score INT NOT NULL CHECK (total_aldrete_score BETWEEN 0 AND 10),
    transfer_destination VARCHAR(50) NOT NULL 
        CHECK (transfer_destination IN ('INPATIENT_WARD', 'ICU', 'ICCU', 'NICU', 'PICU', 'DAY_SURGERY_DISCHARGE', 'MORTUARY')),
    handed_over_by_pacu_nurse VARCHAR(100) NOT NULL,
    received_by_ward_nurse VARCHAR(100),
    is_ready_for_discharge BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_postop_tenant ON post_op_handoffs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_postop_case ON post_op_handoffs(surgery_case_id);

-- ─── 7. ICU ACUITY ASSESSMENTS (VERSIONED SNAPSHOT OF RAW SCORING OBSERVATIONS) ───
CREATE TABLE IF NOT EXISTS icu_acuity_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    assessment_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    episode_id UUID NOT NULL REFERENCES episodes_of_care(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    scoring_system VARCHAR(30) NOT NULL 
        CHECK (scoring_system IN ('SOFA', 'APACHE_II', 'NEWS2', 'GCS', 'PIM3', 'PRISM_III')),
    algorithm_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    raw_scoring_inputs JSONB NOT NULL, -- IMMUTABLE SNAPSHOT PARAMETER MENTAH
    calculated_score INT NOT NULL,
    calculated_subscores JSONB,
    risk_stratification VARCHAR(50) NOT NULL,
    escalation_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    escalation_action_notes TEXT,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    assessed_by_id VARCHAR(50) NOT NULL,
    assessed_by_name VARCHAR(100) NOT NULL,
    is_finalized BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_icu_acuity_tenant ON icu_acuity_assessments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_icu_acuity_patient ON icu_acuity_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_icu_acuity_encounter ON icu_acuity_assessments(encounter_id);
CREATE INDEX IF NOT EXISTS idx_icu_acuity_system_time ON icu_acuity_assessments(tenant_id, scoring_system, assessed_at);

-- ─── 8. DATABASE SAFETY TRIGGERS ───

-- A. Safety Trigger on Surgery Case Lifecycle & WHO Checklist Enforcement
CREATE OR REPLACE FUNCTION fn_enforce_surgery_case_safety() 
RETURNS TRIGGER AS $$
DECLARE
    v_chk surgical_safety_checklists%ROWTYPE;
BEGIN
    -- Immutability on Core Identity Fields once procedure starts
    IF TG_OP = 'UPDATE' THEN
        IF OLD.surgical_status IN ('PROCEDURE_IN_PROGRESS', 'SIGN_OUT_COMPLETED', 'PROCEDURE_COMPLETED', 'POST_OP_HANDOFF') THEN
            IF (OLD.patient_id <> NEW.patient_id OR 
                OLD.operating_room_id <> NEW.operating_room_id OR 
                OLD.lead_surgeon_id <> NEW.lead_surgeon_id) THEN
                RAISE EXCEPTION 'SAFETY_VIOLATION: Patient, operating room, and lead surgeon identity are strictly immutable once procedure has started!';
            END IF;
        END IF;

        -- Barrier: Procedure cannot start without verified WHO Sign-In and Time-Out
        IF NEW.surgical_status = 'PROCEDURE_IN_PROGRESS' AND OLD.surgical_status <> 'PROCEDURE_IN_PROGRESS' THEN
            SELECT * INTO v_chk FROM surgical_safety_checklists WHERE surgery_case_id = NEW.id;
            IF NOT FOUND OR v_chk.sign_in_confirmed = FALSE OR v_chk.time_out_confirmed = FALSE THEN
                RAISE EXCEPTION 'SAFETY_VIOLATION: Surgical procedure CANNOT start without verified WHO Sign-In and Time-Out!';
            END IF;
        END IF;

        -- Barrier: Procedure cannot complete without verified WHO Sign-Out
        IF NEW.surgical_status = 'PROCEDURE_COMPLETED' AND OLD.surgical_status <> 'PROCEDURE_COMPLETED' THEN
            SELECT * INTO v_chk FROM surgical_safety_checklists WHERE surgery_case_id = NEW.id;
            IF NOT FOUND OR v_chk.sign_out_confirmed = FALSE THEN
                RAISE EXCEPTION 'SAFETY_VIOLATION: Surgical procedure CANNOT be completed without verified WHO Sign-Out!';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_surgery_case_safety ON surgery_cases;
CREATE TRIGGER trg_enforce_surgery_case_safety
BEFORE UPDATE ON surgery_cases
FOR EACH ROW EXECUTE FUNCTION fn_enforce_surgery_case_safety();

-- B. Immutability Trigger on Finalized ICU Acuity Assessments
CREATE OR REPLACE FUNCTION fn_protect_finalized_icu_acuity() 
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_finalized = TRUE THEN
        RAISE EXCEPTION 'IMMUTABILITY_VIOLATION: Finalized ICU Acuity Assessment records are append-only and cannot be updated. Create a new assessment instead!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_finalized_icu_acuity ON icu_acuity_assessments;
CREATE TRIGGER trg_protect_finalized_icu_acuity
BEFORE UPDATE ON icu_acuity_assessments
FOR EACH ROW EXECUTE FUNCTION fn_protect_finalized_icu_acuity();

-- ─── 9. PHYSICAL ROW-LEVEL SECURITY (RLS) FOR OPERATING THEATRE & ICU DOMAIN ───
DO $$
DECLARE
    tbl TEXT;
    or_tables TEXT[] := ARRAY[
        'operating_theatres',
        'operating_rooms',
        'surgery_schedules',
        'surgery_cases',
        'surgical_safety_checklists',
        'anesthesia_records',
        'post_op_handoffs',
        'icu_acuity_assessments'
    ];
BEGIN
    FOREACH tbl IN ARRAY or_tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING (tenant_id = current_app_tenant_id()) WITH CHECK (tenant_id = current_app_tenant_id());', tbl);
    END LOOP;
END $$;
