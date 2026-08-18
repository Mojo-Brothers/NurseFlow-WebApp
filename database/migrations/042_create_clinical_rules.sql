-- ============================================================================
-- Migration 042: Versioned Clinical Rules Header
-- Standards: JCI IPSG 3, Medicolegal Reproducibility & Temporal Versioning
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinical_rules (
    id VARCHAR(36) PRIMARY KEY,
    rule_code VARCHAR(50) NOT NULL,
    rule_version INT NOT NULL DEFAULT 1,
    rule_type VARCHAR(30) NOT NULL CHECK (
        rule_type IN ('DRUG_ALLERGY', 'DRUG_DRUG_INTERACTION', 'DUPLICATE_THERAPY', 'PEDIATRIC_DOSE', 'RENAL_ADJUSTMENT', 'SEPSIS_BUNDLE')
    ),
    severity VARCHAR(20) NOT NULL CHECK (
        severity IN ('FATAL_HARD_STOP', 'CRITICAL_WARNING', 'ADVISORY_INFO')
    ),
    alert_title VARCHAR(150) NOT NULL,
    alert_message TEXT NOT NULL,
    clinical_recommendation TEXT NOT NULL,
    primary_entity_code VARCHAR(50) NOT NULL,
    secondary_entity_code VARCHAR(50),
    effective_from BIGINT NOT NULL,
    effective_until BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE (rule_code, rule_version)
);

CREATE INDEX IF NOT EXISTS idx_rules_temporal_lookup ON clinical_rules(rule_type, is_active, effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_rules_primary_entity ON clinical_rules(primary_entity_code, is_active);
