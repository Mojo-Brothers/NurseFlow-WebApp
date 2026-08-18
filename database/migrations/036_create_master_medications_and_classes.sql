-- ============================================================================
-- Migration 036: Master Medications & Medication Classes
-- Standards: ATC WHO, RxNorm, SNOMED CT, JCI IPSG 3
-- ============================================================================

CREATE TABLE IF NOT EXISTS master_medication_classes (
    id VARCHAR(36) PRIMARY KEY,
    class_code VARCHAR(30) NOT NULL UNIQUE,
    class_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS master_medications (
    id VARCHAR(36) PRIMARY KEY,
    generic_name VARCHAR(150) NOT NULL,
    brand_name VARCHAR(150) NOT NULL,
    atc_code VARCHAR(15) NOT NULL,
    rxnorm_code VARCHAR(20),
    kfa_code VARCHAR(20),
    dosage_form VARCHAR(30) NOT NULL,
    strength_amount DOUBLE PRECISION NOT NULL,
    strength_unit VARCHAR(20) NOT NULL,
    drug_class_code VARCHAR(30) NOT NULL,
    is_high_alert BOOLEAN NOT NULL DEFAULT FALSE,
    is_lasa BOOLEAN NOT NULL DEFAULT FALSE,
    is_narcotic BOOLEAN NOT NULL DEFAULT FALSE,
    pregnancy_category VARCHAR(5) CHECK (pregnancy_category IN ('A', 'B', 'C', 'D', 'X')),
    renal_adjustment_threshold_egfr DOUBLE PRECISION,
    pediatric_max_mg_per_kg DOUBLE PRECISION,
    record_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (record_status IN ('ACTIVE', 'AMENDED', 'VOIDED', 'ARCHIVED')),
    status_reason TEXT,
    version BIGINT NOT NULL DEFAULT 1,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (drug_class_code) REFERENCES master_medication_classes(class_code) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_med_atc ON master_medications(atc_code);
CREATE INDEX IF NOT EXISTS idx_med_class ON master_medications(drug_class_code);
CREATE INDEX IF NOT EXISTS idx_med_status ON master_medications(record_status);
