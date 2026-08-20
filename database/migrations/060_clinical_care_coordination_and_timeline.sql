-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 060: Clinical Care Coordination & Longitudinal Patient Timeline
-- Sprint 5A / Step 7: Unified Longitudinal Timeline Reconstruction, Causal Event Lineage,
-- Inter-Disciplinary Care Plan (ICP), SBAR Shift Handover, and JCI Medical Discharge Resume.
-- Standards: JCI COP / IPSG 2, ISO 13606, HL7 FHIR CarePlan / Composition, PostgreSQL 16 ACID.
-- ==============================================================================

-- 1. Table: longitudinal_care_plans (Inter-Disciplinary Care Plan / Asuhan Terpadu)
CREATE TABLE IF NOT EXISTS longitudinal_care_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    care_plan_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED')),
    problem_list JSONB NOT NULL DEFAULT '[]'::jsonb,
    goals JSONB NOT NULL DEFAULT '[]'::jsonb,
    interventions JSONB NOT NULL DEFAULT '[]'::jsonb,
    lead_dpjp_id VARCHAR(50) NOT NULL,
    lead_dpjp_name VARCHAR(100) NOT NULL,
    multi_disciplinary_contributors JSONB NOT NULL DEFAULT '[]'::jsonb,
    version INT NOT NULL DEFAULT 1,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_careplan_encounter ON longitudinal_care_plans(encounter_id);
CREATE INDEX IF NOT EXISTS idx_careplan_patient ON longitudinal_care_plans(patient_id);

-- 2. Table: clinical_handovers (SBAR Shift Handover & Transition of Care)
CREATE TABLE IF NOT EXISTS clinical_handovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    handover_number VARCHAR(50) UNIQUE NOT NULL,
    shift_name VARCHAR(50) NOT NULL CHECK (shift_name IN ('PAGI_KE_SORE', 'SORE_KE_MALAM', 'MALAM_KE_PAGI', 'TRANSFER_UNIT')),
    department_id VARCHAR(50) NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    outgoing_practitioner_id VARCHAR(50) NOT NULL,
    outgoing_practitioner_name VARCHAR(100) NOT NULL,
    outgoing_practitioner_role VARCHAR(50) NOT NULL,
    incoming_practitioner_id VARCHAR(50) NOT NULL,
    incoming_practitioner_name VARCHAR(100) NOT NULL,
    incoming_practitioner_role VARCHAR(50) NOT NULL,
    sbar_situation TEXT NOT NULL,
    sbar_background TEXT NOT NULL,
    sbar_assessment TEXT NOT NULL,
    sbar_recommendation TEXT NOT NULL,
    high_risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    pending_diagnostic_orders JSONB NOT NULL DEFAULT '[]'::jsonb,
    vital_signs_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    handover_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    handover_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_ACKNOWLEDGMENT' CHECK (handover_status IN ('PENDING_ACKNOWLEDGMENT', 'COMPLETED', 'CANCELLED')),
    digital_signature_outgoing VARCHAR(128) NOT NULL,
    digital_signature_incoming VARCHAR(128),
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_handover_encounter ON clinical_handovers(encounter_id, handover_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_handover_patient ON clinical_handovers(patient_id);

-- 3. Table: clinical_discharge_summaries (Ringkasan Pulang Medis JCI)
CREATE TABLE IF NOT EXISTS clinical_discharge_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID UNIQUE NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    summary_number VARCHAR(50) UNIQUE NOT NULL,
    admission_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    discharge_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    admission_diagnosis_icd10 VARCHAR(20) NOT NULL,
    admission_diagnosis_name TEXT NOT NULL,
    discharge_diagnosis_icd10 VARCHAR(20) NOT NULL,
    discharge_diagnosis_name TEXT NOT NULL,
    secondary_diagnoses JSONB NOT NULL DEFAULT '[]'::jsonb,
    procedures_performed JSONB NOT NULL DEFAULT '[]'::jsonb,
    hospital_course_summary TEXT NOT NULL,
    significant_diagnostic_findings TEXT NOT NULL,
    discharge_condition VARCHAR(50) NOT NULL CHECK (discharge_condition IN ('SEMBUH', 'PERBAIKAN', 'BELUM_SEMBUH', 'RUJUK', 'PULANG_PAKSA', 'MENINGGAL')),
    discharge_vital_signs JSONB NOT NULL DEFAULT '{}'::jsonb,
    discharge_medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    follow_up_instructions TEXT NOT NULL,
    emergency_warning_signs TEXT NOT NULL,
    discharging_dpjp_id VARCHAR(50) NOT NULL,
    discharging_dpjp_name VARCHAR(100) NOT NULL,
    digital_signature_hash VARCHAR(128) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'LOCKED' CHECK (status IN ('DRAFT', 'LOCKED', 'AMENDED')),
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disc_summary_encounter ON clinical_discharge_summaries(encounter_id);
CREATE INDEX IF NOT EXISTS idx_disc_summary_patient ON clinical_discharge_summaries(patient_id);

-- 4. Table: longitudinal_timeline_events (Unified Longitudinal Event Index & Causal Lineage)
CREATE TABLE IF NOT EXISTS longitudinal_timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    event_category VARCHAR(50) NOT NULL,
    event_title VARCHAR(200) NOT NULL,
    event_summary TEXT NOT NULL,
    domain_source_table VARCHAR(100) NOT NULL,
    domain_source_id UUID NOT NULL,
    parent_event_id UUID REFERENCES longitudinal_timeline_events(id),
    actor_id VARCHAR(50) NOT NULL,
    actor_name VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    clinical_severity VARCHAR(30) NOT NULL DEFAULT 'INFO' CHECK (clinical_severity IN ('INFO', 'WARNING', 'URGENT', 'CRITICAL_PANIC')),
    digital_signature_hash VARCHAR(128),
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_encounter ON longitudinal_timeline_events(encounter_id, event_timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_timeline_patient ON longitudinal_timeline_events(patient_id, event_timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_timeline_parent ON longitudinal_timeline_events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_category ON longitudinal_timeline_events(event_category);
