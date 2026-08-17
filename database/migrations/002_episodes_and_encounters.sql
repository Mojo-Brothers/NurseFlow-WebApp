-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 002: Episodes of Care & Encounters
-- Standar: HL7 FHIR EpisodeOfCare & Encounter Resources
-- ==============================================================================

CREATE TABLE IF NOT EXISTS episodes_of_care (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    episode_type VARCHAR(50) NOT NULL CHECK (episode_type IN ('RAWAT_JALAN', 'RAWAT_INAP', 'GAWAT_DARURAT', 'HOME_CARE', 'TELEMEDIS')),
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'WAITLIST', 'ACTIVE', 'ONHOLD', 'FINISHED', 'CANCELLED')),
    primary_condition_icd10 VARCHAR(20),
    primary_condition_name TEXT,
    managing_department_id VARCHAR(50) NOT NULL,
    managing_department_name VARCHAR(100) NOT NULL,
    lead_dpjp_id VARCHAR(50) NOT NULL,
    lead_dpjp_name VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    general_consent_signed BOOLEAN DEFAULT FALSE,
    financial_consent_signed BOOLEAN DEFAULT FALSE,
    branch_id VARCHAR(30) NOT NULL DEFAULT 'BRN-JKT-PST',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_number VARCHAR(30) UNIQUE NOT NULL,
    episode_id UUID NOT NULL REFERENCES episodes_of_care(id),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    encounter_type VARCHAR(50) NOT NULL,
    encounter_class VARCHAR(20) NOT NULL CHECK (encounter_class IN ('AMB', 'EMER', 'IMP', 'VR')),
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'ARRIVED', 'TRIAGED', 'IN_PROGRESS', 'ON_HOLD', 'DISCHARGED', 'COMPLETED', 'CANCELLED', 'ENTERED_IN_ERROR')),
    primary_doctor_id VARCHAR(50) NOT NULL,
    primary_doctor_name VARCHAR(100) NOT NULL,
    service_room_id VARCHAR(50) NOT NULL,
    service_room_name VARCHAR(100) NOT NULL,
    bed_id VARCHAR(50),
    bed_number VARCHAR(20),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    discharge_disposition VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episodes_patient ON episodes_of_care(patient_id);
CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes_of_care(status);
CREATE INDEX IF NOT EXISTS idx_encounters_episode ON encounters(episode_id);
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_status ON encounters(status);
