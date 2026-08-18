-- ============================================================================
-- Migration 040: Hospital Formulary & Antibiotic Stewardship Rules
-- Standards: JCI MMU.1, Permenkes 73/2016 (Standar Pelayanan Farmasi RS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS hospital_formulary (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    drug_id VARCHAR(36) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    formulary_tier VARCHAR(30) NOT NULL CHECK (
        formulary_tier IN ('GENERIK_NASIONAL', 'FORMULARIUM_RS', 'RESTRICTED_ANTIBIOTIC', 'NON_FORMULARIUM')
    ),
    approval_level_required VARCHAR(40) NOT NULL CHECK (
        approval_level_required IN ('NONE', 'DPJP_ONLY', 'KFT_APPROVAL_REQUIRED', 'INFECTIOUS_DISEASE_CONSULTANT')
    ),
    restricted_department_id VARCHAR(36),
    requires_pharmacist_approval BOOLEAN NOT NULL DEFAULT FALSE,
    max_prescribing_days INT NOT NULL DEFAULT 30,
    daily_defined_dose_unit VARCHAR(20),
    clinical_stewardship_guideline TEXT,
    record_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (record_status IN ('ACTIVE', 'AMENDED', 'VOIDED', 'ARCHIVED')),
    version BIGINT NOT NULL DEFAULT 1,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (drug_id) REFERENCES master_medications(id) ON DELETE RESTRICT,
    UNIQUE (organization_id, drug_id)
);

CREATE INDEX IF NOT EXISTS idx_formulary_lookup ON hospital_formulary(organization_id, is_active, formulary_tier);
