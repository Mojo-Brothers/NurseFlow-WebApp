-- ============================================================================
-- Migration 037: Medication Ingredients & Multi-Terminology Bridge
-- Standards: SNOMED CT, RxNorm, ATC, UNII, NDC, GTIN, KFA Kemenkes
-- ============================================================================

CREATE TABLE IF NOT EXISTS medication_ingredients (
    id VARCHAR(36) PRIMARY KEY,
    medication_id VARCHAR(36) NOT NULL,
    active_ingredient_name VARCHAR(150) NOT NULL,
    strength_amount DOUBLE PRECISION NOT NULL,
    strength_unit VARCHAR(20) NOT NULL,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (medication_id) REFERENCES master_medications(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medication_terminologies (
    id VARCHAR(36) PRIMARY KEY,
    medication_id VARCHAR(36) NOT NULL,
    terminology_system VARCHAR(30) NOT NULL CHECK (
        terminology_system IN ('SNOMED_CT', 'RXNORM', 'ATC', 'UNII', 'NDC', 'GTIN_BARCODE', 'KFA_KEMENKES')
    ),
    terminology_code VARCHAR(100) NOT NULL,
    terminology_display VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (medication_id) REFERENCES master_medications(id) ON DELETE CASCADE,
    UNIQUE (medication_id, terminology_system, terminology_code)
);

CREATE INDEX IF NOT EXISTS idx_med_terminologies_search ON medication_terminologies(terminology_system, terminology_code);
