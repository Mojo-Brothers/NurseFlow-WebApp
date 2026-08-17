-- NurseFlow Enterprise HIS 2026 — Migration 020
-- Domain: Operating Theatre Enterprise (IBS), Surgical Scheduling Engine, CSSD Instrument Tracking, AIMS Anesthesia Records & 5-Stage Surgical Documentation
-- Compliance: JCI IPSG 4 (Safe Surgery), JCI PCI (Infection Control & CSSD Sterilization), AIMS Intraoperative Anesthesia Standard

-- 1. Table: operating_room_schedules (Scheduling Engine with Overlap Guard)
CREATE TABLE IF NOT EXISTS operating_room_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    operating_room_id UUID NOT NULL REFERENCES operating_theatres(id) ON DELETE CASCADE,
    surgical_case_id UUID NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    surgery_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    estimated_duration_minutes INT NOT NULL,
    actual_duration_minutes INT,
    turnover_time_minutes INT NOT NULL DEFAULT 30,
    surgeon_id VARCHAR(50) NOT NULL,
    anesthesiologist_id VARCHAR(50) NOT NULL,
    booking_status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED', -- CONFIRMED, RESCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: cssd_sterilization_cycles (CSSD Autoclave & Sterility Tracking)
CREATE TABLE IF NOT EXISTS cssd_sterilization_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    autoclave_machine_id VARCHAR(50) NOT NULL, -- e.g. 'AUTOCLAVE-STEAM-01', 'PLASMA-STERILIZER-02'
    cycle_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'CYC-2026-0817-01'
    sterilization_method VARCHAR(50) NOT NULL DEFAULT 'STEAM_HIGH_PRESSURE', -- STEAM_HIGH_PRESSURE, ETHYLENE_OXIDE, HYDROGEN_PEROXIDE_PLASMA
    temperature_celsius NUMERIC(5, 2) NOT NULL DEFAULT 134.0,
    pressure_bar NUMERIC(4, 2) NOT NULL DEFAULT 2.1,
    exposure_duration_minutes INT NOT NULL DEFAULT 18,
    biological_indicator_status VARCHAR(20) NOT NULL DEFAULT 'PASSED', -- PASSED, FAILED, PENDING_CULTURE
    chemical_integrator_verified BOOLEAN NOT NULL DEFAULT TRUE,
    operator_technician_name VARCHAR(150) NOT NULL,
    cycle_started_at TIMESTAMPTZ NOT NULL,
    cycle_completed_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'RELEASED_FOR_USE', -- RELEASED_FOR_USE, QUARANTINED, REJECTED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: cssd_instrument_sets (Sets Bedah Steril & Tracking Barcode)
CREATE TABLE IF NOT EXISTS cssd_instrument_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    set_barcode VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'SET-LAP-001', 'SET-ORTHO-002'
    set_name VARCHAR(150) NOT NULL, -- 'Set Laparoskopi Mayor 4K', 'Set Bedah Ortopedi ORIF'
    sterilization_cycle_id UUID REFERENCES cssd_sterilization_cycles(id) ON DELETE SET NULL,
    item_count INT NOT NULL,
    sterilized_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL, -- Valid 30 days if double-pouched
    current_location VARCHAR(50) NOT NULL DEFAULT 'CSSD_STERILE_STORAGE', -- CSSD_STERILE_STORAGE, IN_TRANSIT, THEATRE_OK_01, DECONTAMINATION_WASHING
    assigned_surgical_case_id UUID REFERENCES surgical_cases(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'STERILE_READY', -- STERILE_READY, IN_USE, CONTAMINATED_USED, EXPIRED, QUARANTINED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table: anesthesia_records (Anesthesia Information Management System - AIMS)
CREATE TABLE IF NOT EXISTS anesthesia_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    surgical_case_id UUID UNIQUE NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    encounter_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    anesthesiologist_id VARCHAR(50) NOT NULL,
    anesthesiologist_name VARCHAR(150) NOT NULL,
    anesthesia_technique VARCHAR(50) NOT NULL, -- GENERAL_ENDOTRACHEAL, SPINAL_SUBARACHNOID, EPIDURAL_CONTINUOUS, PERIPHERAL_NERVE_BLOCK
    asa_physical_status VARCHAR(10) NOT NULL,
    mallampati_class VARCHAR(10) NOT NULL DEFAULT 'CLASS_I', -- CLASS_I, CLASS_II, CLASS_III, CLASS_IV
    airway_management_details TEXT, -- 'ETT No 7.5 Kingking, C-Mac Video Laryngoscope Grade 1'
    premedication_drugs JSONB DEFAULT '[]'::jsonb,
    induction_drugs JSONB DEFAULT '[]'::jsonb, -- e.g. Propofol 140mg, Fentanyl 150mcg, Rocuronium 50mg
    maintenance_gases_drugs JSONB DEFAULT '[]'::jsonb, -- e.g. Sevoflurane 2%, O2/N2O 50/50%
    intraoperative_vitals_trend JSONB DEFAULT '[]'::jsonb, -- Time series of BP, HR, SpO2, EtCO2 every 5-15 min
    total_crystalloid_ml INT NOT NULL DEFAULT 1000,
    total_colloid_ml INT NOT NULL DEFAULT 0,
    total_blood_transfused_ml INT NOT NULL DEFAULT 0,
    estimated_blood_loss_ml INT NOT NULL DEFAULT 150,
    total_urine_output_ml INT NOT NULL DEFAULT 200,
    extubation_status VARCHAR(50) DEFAULT 'EXTUBATED_IN_THEATRE', -- EXTUBATED_IN_THEATRE, INTUBATED_TO_ICU
    pacu_destination VARCHAR(50) NOT NULL DEFAULT 'PACU_RECOVERY', -- PACU_RECOVERY, ICU_VENTILATOR, WARD_DIRECT
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Table: surgical_clinical_notes (5-Stage Comprehensive Surgical Records)
CREATE TABLE IF NOT EXISTS surgical_clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    surgical_case_id UUID NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    encounter_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    note_type VARCHAR(50) NOT NULL, -- PREOPERATIVE_ASSESSMENT, OPERATIVE_REPORT, ANESTHESIA_NOTE, PACU_HANDOVER, POSTOPERATIVE_CARE_PLAN
    author_id VARCHAR(50) NOT NULL,
    author_name VARCHAR(150) NOT NULL,
    author_role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    findings_description TEXT,
    implant_serial_numbers JSONB DEFAULT '[]'::jsonb,
    complications_noted TEXT,
    digital_signature_hash VARCHAR(128) NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance & conflict detection
CREATE INDEX IF NOT EXISTS idx_sched_room_time ON operating_room_schedules(operating_room_id, surgery_date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_sched_surgeon_time ON operating_room_schedules(surgeon_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_sched_anesth_time ON operating_room_schedules(anesthesiologist_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_cssd_sets_status ON cssd_instrument_sets(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_surg_notes_case ON surgical_clinical_notes(surgical_case_id, note_type);

-- PostgreSQL Row-Level Security (RLS)
ALTER TABLE operating_room_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cssd_sterilization_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cssd_instrument_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE anesthesia_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgical_clinical_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY tenant_isolation_sched ON operating_room_schedules
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY tenant_isolation_cssd ON cssd_instrument_sets
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
