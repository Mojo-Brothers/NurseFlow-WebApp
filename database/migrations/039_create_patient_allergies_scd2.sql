-- ============================================================================
-- Migration 039: Relational Patient Allergies (SCD Type-2 with Auditability)
-- Standards: JCI IPSG 3, FHIR AllergyIntolerance, Permenkes No. 24/2022
-- ============================================================================

CREATE TABLE IF NOT EXISTS patient_allergies (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    allergen_type VARCHAR(20) NOT NULL CHECK (allergen_type IN ('MEDICATION', 'FOOD', 'ENVIRONMENTAL', 'LATEX')),
    allergen_code VARCHAR(50) NOT NULL,
    allergen_name VARCHAR(100) NOT NULL,
    reaction_description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('MILD', 'MODERATE', 'SEVERE_ANAPHYLAXIS')),
    verification_status VARCHAR(20) NOT NULL CHECK (verification_status IN ('SUSPECTED', 'CONFIRMED', 'REFUTED')),
    recorded_by_practitioner_id VARCHAR(36) NOT NULL,
    recorded_at BIGINT NOT NULL,
    record_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (record_status IN ('ACTIVE', 'AMENDED', 'VOIDED', 'ARCHIVED')),
    status_reason TEXT,
    parent_allergy_id VARCHAR(36),
    version BIGINT NOT NULL DEFAULT 1,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (parent_allergy_id) REFERENCES patient_allergies(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_patient_allergies ON patient_allergies(patient_id, record_status);
