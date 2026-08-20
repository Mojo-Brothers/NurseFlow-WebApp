-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 058: Clinical Monitoring, EWS & Deterioration Response
-- Sprint 5A / Step 5: Vital Signs Observation, NEWS2 / PEWS / MEOWS Scoring Engine,
-- ISBAR Escalation, Rapid Response Team (RRT) & Code Blue, Closed-Loop Reassessment.
-- Standards: Royal College of Physicians (NEWS2 2017), JCI IPSG 2 / COP, AHA ACLS 2025, PostgreSQL 16 ACID.
-- ==============================================================================

-- 1. Table: clinical_vital_sign_observations (EWS Vital Signs Ledger)
CREATE TABLE IF NOT EXISTS clinical_vital_sign_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    observed_by_id VARCHAR(50) NOT NULL,
    observed_by_name VARCHAR(100) NOT NULL,
    observed_by_role VARCHAR(50) NOT NULL,
    heart_rate_bpm INT NOT NULL CHECK (heart_rate_bpm BETWEEN 10 AND 350),
    systolic_bp_mmhg INT NOT NULL CHECK (systolic_bp_mmhg BETWEEN 20 AND 350),
    diastolic_bp_mmhg INT NOT NULL CHECK (diastolic_bp_mmhg BETWEEN 10 AND 250),
    respiratory_rate_bpm INT NOT NULL CHECK (respiratory_rate_bpm BETWEEN 2 AND 100),
    spo2_percent NUMERIC(5,2) NOT NULL CHECK (spo2_percent BETWEEN 30.00 AND 100.00),
    spo2_scale_type VARCHAR(20) NOT NULL DEFAULT 'SCALE_1' CHECK (spo2_scale_type IN ('SCALE_1', 'SCALE_2')),
    supplemental_oxygen BOOLEAN NOT NULL DEFAULT FALSE,
    oxygen_flow_rate_lpm NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    body_temperature_celsius NUMERIC(4,2) NOT NULL CHECK (body_temperature_celsius BETWEEN 25.00 AND 46.00),
    consciousness_avpu VARCHAR(20) NOT NULL DEFAULT 'ALERT' CHECK (consciousness_avpu IN ('ALERT', 'VOICE', 'PAIN', 'UNRESPONSIVE', 'NEW_CONFUSION')),
    gcs_score INT CHECK (gcs_score BETWEEN 3 AND 15),
    capillary_refill_seconds INT DEFAULT 2,
    clinical_notes TEXT,
    scoring_system VARCHAR(20) NOT NULL DEFAULT 'NEWS2' CHECK (scoring_system IN ('NEWS2', 'PEWS', 'MEOWS')),
    calculated_score INT NOT NULL CHECK (calculated_score >= 0),
    single_extreme_score_3 BOOLEAN NOT NULL DEFAULT FALSE,
    risk_level VARCHAR(30) NOT NULL CHECK (risk_level IN ('LOW', 'LOW_MEDIUM', 'MEDIUM', 'HIGH', 'CRITICAL')),
    recommended_action TEXT NOT NULL,
    recommended_monitoring_frequency VARCHAR(50) NOT NULL,
    escalation_required BOOLEAN NOT NULL DEFAULT FALSE,
    escalation_status VARCHAR(30) NOT NULL DEFAULT 'NOT_ESCALATED' CHECK (escalation_status IN ('NOT_ESCALATED', 'ESCALATED', 'ACKNOWLEDGED', 'RESOLVED')),
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vitals_encounter ON clinical_vital_sign_observations(encounter_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_vitals_patient ON clinical_vital_sign_observations(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_risk ON clinical_vital_sign_observations(risk_level) WHERE risk_level IN ('HIGH', 'CRITICAL');

-- 2. Table: clinical_deterioration_escalations (ISBAR Communication & Provenance)
CREATE TABLE IF NOT EXISTS clinical_deterioration_escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    observation_id UUID NOT NULL REFERENCES clinical_vital_sign_observations(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    escalation_level VARCHAR(30) NOT NULL CHECK (escalation_level IN ('WARD_NURSE', 'ATTENDING_PHYSICIAN_DPJP', 'RAPID_RESPONSE_TEAM', 'CODE_BLUE_CARDIAC_ARREST')),
    isbar_payload JSONB NOT NULL,
    notified_to_id VARCHAR(50) NOT NULL,
    notified_to_name VARCHAR(100) NOT NULL,
    notified_to_role VARCHAR(50) NOT NULL,
    notification_method VARCHAR(30) NOT NULL DEFAULT 'HOSPITAL_PAGE' CHECK (notification_method IN ('HOSPITAL_PAGE', 'DIRECT_CALL', 'EMERGENCY_SIREN_BROADCAST', 'BEDSIDE_ALARM')),
    escalated_by_id VARCHAR(50) NOT NULL,
    escalated_by_name VARCHAR(100) NOT NULL,
    escalated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by_id VARCHAR(50),
    acknowledged_by_name VARCHAR(100),
    read_back_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    physician_instruction TEXT,
    target_response_window_minutes INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_ACKNOWLEDGMENT' CHECK (status IN ('PENDING_ACKNOWLEDGMENT', 'ACKNOWLEDGED', 'DISPATCHED', 'COMPLETED', 'CANCELLED')),
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalation_obs ON clinical_deterioration_escalations(observation_id);
CREATE INDEX IF NOT EXISTS idx_escalation_encounter ON clinical_deterioration_escalations(encounter_id, escalated_at DESC);

-- 3. Table: rapid_response_code_blue_events (RRT / Code Blue Resuscitation Ledger)
CREATE TABLE IF NOT EXISTS rapid_response_code_blue_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escalation_id UUID REFERENCES clinical_deterioration_escalations(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('RAPID_RESPONSE', 'CODE_BLUE_ARREST', 'MEDICAL_EMERGENCY')),
    location_ward_room VARCHAR(100) NOT NULL,
    team_leader_id VARCHAR(50) NOT NULL,
    team_leader_name VARCHAR(100) NOT NULL,
    team_leader_role VARCHAR(50) NOT NULL,
    team_members JSONB NOT NULL DEFAULT '[]'::jsonb,
    arrival_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    initial_rhythm VARCHAR(50) CHECK (initial_rhythm IN ('VF_VT_SHOCKABLE', 'ASYSTOLE', 'PEA', 'SEVERE_BRADYCARDIA', 'NORMAL_SINUS')),
    interventions_performed JSONB NOT NULL DEFAULT '[]'::jsonb,
    outcome VARCHAR(50) NOT NULL CHECK (outcome IN ('ROSC_ACHIEVED', 'TRANSFERRED_TO_ICU', 'STABILIZED_IN_WARD', 'DECEASED', 'UNRESOLVED')),
    event_summary TEXT NOT NULL,
    post_event_reassessment_id UUID,
    charge_id UUID,
    charge_captured BOOLEAN NOT NULL DEFAULT FALSE,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rrt_encounter ON rapid_response_code_blue_events(encounter_id, completed_at DESC);

-- 4. Table: clinical_reassessments (Mandatory Closed-Loop Reassessment)
CREATE TABLE IF NOT EXISTS clinical_reassessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initial_observation_id UUID NOT NULL REFERENCES clinical_vital_sign_observations(id),
    event_id UUID REFERENCES rapid_response_code_blue_events(id),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    reassessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reassessed_by_id VARCHAR(50) NOT NULL,
    reassessed_by_name VARCHAR(100) NOT NULL,
    pre_score INT NOT NULL,
    post_score INT NOT NULL,
    score_delta INT NOT NULL,
    recovery_trajectory VARCHAR(30) NOT NULL CHECK (recovery_trajectory IN ('IMPROVING', 'STABLE', 'DETERIORATING', 'TRANSFERRED_TO_ICU')),
    reassessment_notes TEXT NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reassessment_init ON clinical_reassessments(initial_observation_id);
