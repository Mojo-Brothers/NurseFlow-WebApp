-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 004: Emergency, Triage ATS & SLA
-- Standar: Australasian Triage Scale (ATS), ESI v4, KARS PMKP
-- ==============================================================================

CREATE TABLE IF NOT EXISTS triage_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES episodes_of_care(id),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    triage_method VARCHAR(20) NOT NULL DEFAULT 'ATS',
    triage_level VARCHAR(30) NOT NULL,
    ats_level INT CHECK (ats_level BETWEEN 1 AND 5),
    esi_level INT CHECK (esi_level BETWEEN 1 AND 5),
    chief_complaint TEXT NOT NULL,
    airway_status VARCHAR(30) NOT NULL,
    breathing_status VARCHAR(30) NOT NULL,
    circulation_status VARCHAR(30) NOT NULL,
    disability_status VARCHAR(30) NOT NULL,
    exposure_notes TEXT,
    vitals_payload JSONB NOT NULL,
    is_trauma BOOLEAN DEFAULT FALSE,
    is_cito BOOLEAN DEFAULT FALSE,
    target_response_minutes INT NOT NULL,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assessed_by VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS triage_sla_timers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    triage_level VARCHAR(30) NOT NULL,
    target_response_minutes INT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    first_physician_contact_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    elapsed_seconds INT DEFAULT 0,
    is_overdue BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'RUNNING'
);

CREATE TABLE IF NOT EXISTS resuscitation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    event_type VARCHAR(50) NOT NULL,
    dose_or_joules VARCHAR(100),
    performer_name VARCHAR(100) NOT NULL,
    notes TEXT,
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_triage_encounter ON triage_assessments(encounter_id);
CREATE INDEX IF NOT EXISTS idx_sla_encounter ON triage_sla_timers(encounter_id);
