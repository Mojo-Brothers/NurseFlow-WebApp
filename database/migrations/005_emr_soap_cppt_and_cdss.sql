-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 005: EMR, SOAP, CPPT, Allergies & CDSS
-- Standar: JCI 7th Edition, SATUSEHAT HL7 FHIR Composition/Condition/Observation
-- ==============================================================================

CREATE TABLE IF NOT EXISTS soap_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES episodes_of_care(id),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    subjective TEXT NOT NULL,
    objective TEXT NOT NULL,
    assessment TEXT NOT NULL,
    plan TEXT NOT NULL,
    primary_icd10 VARCHAR(20) NOT NULL,
    primary_icd10_name TEXT NOT NULL,
    secondary_diagnoses JSONB DEFAULT '[]',
    procedures_icd9 JSONB DEFAULT '[]',
    physician_id VARCHAR(50) NOT NULL,
    physician_name VARCHAR(100) NOT NULL,
    is_signed BOOLEAN DEFAULT TRUE,
    signature_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cppt_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES episodes_of_care(id),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    professional_type VARCHAR(50) NOT NULL,
    author_id VARCHAR(50) NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    sbar_situation TEXT,
    sbar_background TEXT,
    sbar_assessment TEXT,
    sbar_recommendation TEXT,
    soap_notes TEXT,
    instruction_notes TEXT,
    dpjp_verified BOOLEAN DEFAULT FALSE,
    dpjp_verifier_name VARCHAR(100),
    dpjp_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_allergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    allergy_type VARCHAR(50) NOT NULL,
    allergen VARCHAR(255) NOT NULL,
    reaction TEXT,
    severity VARCHAR(50) NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'CONFIRMED',
    recorded_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    episode_id UUID NOT NULL REFERENCES episodes_of_care(id),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    observation_type VARCHAR(50) NOT NULL,
    loinc_code VARCHAR(50) NOT NULL,
    loinc_display VARCHAR(255) NOT NULL,
    observation_value VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    interpretation VARCHAR(30) DEFAULT 'NORMAL',
    observed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observer_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS cdss_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(30) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recommendation TEXT,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soap_encounter ON soap_notes(encounter_id);
CREATE INDEX IF NOT EXISTS idx_cppt_encounter ON cppt_notes(encounter_id);
CREATE INDEX IF NOT EXISTS idx_allergies_patient ON patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_observations_encounter ON clinical_observations(encounter_id);
