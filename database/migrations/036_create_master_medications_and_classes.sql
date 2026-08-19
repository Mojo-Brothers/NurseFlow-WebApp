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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generic_name VARCHAR(150) NOT NULL,
    brand_name VARCHAR(150) NOT NULL,
    atc_code VARCHAR(15),
    rxnorm_code VARCHAR(20),
    kfa_code VARCHAR(20),
    dosage_form VARCHAR(30),
    strength_amount DOUBLE PRECISION,
    strength_unit VARCHAR(20),
    drug_class_code VARCHAR(30),
    is_high_alert BOOLEAN NOT NULL DEFAULT FALSE,
    is_lasa BOOLEAN NOT NULL DEFAULT FALSE,
    is_narcotic BOOLEAN NOT NULL DEFAULT FALSE,
    pregnancy_category VARCHAR(5),
    renal_adjustment_threshold_egfr DOUBLE PRECISION,
    pediatric_max_mg_per_kg DOUBLE PRECISION,
    record_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    status_reason TEXT,
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE master_medications ADD COLUMN IF NOT EXISTS rxnorm_code VARCHAR(20);
ALTER TABLE master_medications ADD COLUMN IF NOT EXISTS drug_class_code VARCHAR(30);
ALTER TABLE master_medications ADD COLUMN IF NOT EXISTS strength_amount DOUBLE PRECISION;
ALTER TABLE master_medications ADD COLUMN IF NOT EXISTS strength_unit VARCHAR(20);
ALTER TABLE master_medications ADD COLUMN IF NOT EXISTS is_narcotic BOOLEAN DEFAULT FALSE;
ALTER TABLE master_medications ADD COLUMN IF NOT EXISTS pregnancy_category VARCHAR(5);
ALTER TABLE master_medications ADD COLUMN IF NOT EXISTS renal_adjustment_threshold_egfr DOUBLE PRECISION;
ALTER TABLE master_medications ADD COLUMN IF NOT EXISTS pediatric_max_mg_per_kg DOUBLE PRECISION;
ALTER TABLE master_medications ADD COLUMN IF NOT EXISTS record_status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE master_medications ADD COLUMN IF NOT EXISTS status_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_med_atc ON master_medications(atc_code);
CREATE INDEX IF NOT EXISTS idx_med_class ON master_medications(drug_class_code);
CREATE INDEX IF NOT EXISTS idx_med_status ON master_medications(record_status);
