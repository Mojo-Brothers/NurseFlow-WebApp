-- ============================================================================
-- Migration 038: Medication Interactions & Safe Substitution Alternatives
-- Standards: JCI IPSG 3, Lexicomp / Micromedex Interaction Matrix
-- ============================================================================

CREATE TABLE IF NOT EXISTS medication_interactions (
    id VARCHAR(36) PRIMARY KEY,
    drug_a_id UUID NOT NULL,
    drug_b_id UUID NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('FATAL_HARD_STOP', 'CRITICAL_HIGH', 'MODERATE', 'MINOR')),
    clinical_mechanism TEXT NOT NULL,
    clinical_effect TEXT NOT NULL,
    management_recommendation TEXT NOT NULL,
    evidence_source VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (drug_a_id) REFERENCES master_medications(id) ON DELETE CASCADE,
    FOREIGN KEY (drug_b_id) REFERENCES master_medications(id) ON DELETE CASCADE,
    UNIQUE (drug_a_id, drug_b_id)
);

CREATE INDEX IF NOT EXISTS idx_ddi_pair ON medication_interactions(drug_a_id, drug_b_id);

CREATE TABLE IF NOT EXISTS medication_alternatives (
    id VARCHAR(36) PRIMARY KEY,
    original_drug_id UUID NOT NULL,
    alternative_drug_id UUID NOT NULL,
    substitution_reason VARCHAR(50) NOT NULL CHECK (
        substitution_reason IN ('ALLERGY_SUBSTITUTE', 'RENAL_FRIENDLY', 'FORMULARY_EQUIVALENT', 'THERAPEUTIC_SUBSTITUTE')
    ),
    clinical_note TEXT,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (original_drug_id) REFERENCES master_medications(id) ON DELETE CASCADE,
    FOREIGN KEY (alternative_drug_id) REFERENCES master_medications(id) ON DELETE CASCADE,
    UNIQUE (original_drug_id, alternative_drug_id, substitution_reason)
);
