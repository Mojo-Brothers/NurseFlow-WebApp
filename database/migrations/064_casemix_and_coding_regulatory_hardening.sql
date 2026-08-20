-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 064: Casemix & Coding Regulatory Hardening
-- Sprint 5A / Step 9 (VS-12A): Dynamic Casemix Rulesets (Permenkes Versioning),
-- Historical Grouping Reproducibility, Master Terminology Governance,
-- Anti-Leading Evidence-Based CDI Queries, Multi-Payer Abstraction & False-Positive Controls.
-- Standards: Permenkes No. 3/2023, Permenkes No. 26/2021, JCI MOI / COP / FMS, PostgreSQL 16 ACID.
-- ==============================================================================

-- 1. Table: casemix_rulesets (Versioned Regulatory Rulesets for INA-CBG Grouping)
CREATE TABLE IF NOT EXISTS casemix_rulesets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruleset_code VARCHAR(50) UNIQUE NOT NULL,
    regulation_version VARCHAR(100) NOT NULL, -- e.g. 'Permenkes 3/2023', 'Permenkes 26/2021'
    grouping_algorithm_version VARCHAR(50) NOT NULL, -- e.g. 'INA-CBG 6.0', 'INA-CBG 5.2'
    tariff_version VARCHAR(50) NOT NULL,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_until TIMESTAMP WITH TIME ZONE,
    severity_multipliers JSONB NOT NULL DEFAULT '{"I": 1.0, "II": 1.25, "III": 1.5}'::jsonb,
    topup_rules JSONB NOT NULL DEFAULT '{"special_procedures": true, "special_prosthesis": true, "special_drugs": true, "subacute_chronic": true}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_casemix_rulesets_dates ON casemix_rulesets(effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_casemix_rulesets_active ON casemix_rulesets(is_active);

-- Seed Canonical Regulatory Rulesets
INSERT INTO casemix_rulesets (
    ruleset_code, regulation_version, grouping_algorithm_version, tariff_version,
    effective_from, effective_until, severity_multipliers, is_active
) VALUES 
(
    'RULESET-2021-V5',
    'Permenkes 26/2021',
    'INA-CBG 5.2',
    'TARIFF-2021-REGIONAL-1',
    '2021-01-01 00:00:00+07',
    '2023-01-23 23:59:59+07',
    '{"I": 1.0, "II": 1.20, "III": 1.40}'::jsonb,
    FALSE
),
(
    'RULESET-2023-V6',
    'Permenkes 3/2023',
    'INA-CBG 6.0',
    'TARIFF-2023-REGIONAL-1',
    '2023-01-24 00:00:00+07',
    NULL,
    '{"I": 1.0, "II": 1.25, "III": 1.50}'::jsonb,
    TRUE
)
ON CONFLICT (ruleset_code) DO NOTHING;

-- 2. Alter Table: clinical_documentation_queries (Evidence-Based CDI & Anti-Leading Provenance)
ALTER TABLE clinical_documentation_queries
ADD COLUMN IF NOT EXISTS clinical_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS source_document_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS coding_version_before INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS coding_version_after INT,
ADD COLUMN IF NOT EXISTS is_neutral_clarification BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. Alter Table: casemix_grouping_audits (Ruleset Linking & Historical Reproducibility)
ALTER TABLE casemix_grouping_audits
ADD COLUMN IF NOT EXISTS ruleset_id UUID REFERENCES casemix_rulesets(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS regulation_version VARCHAR(100) NOT NULL DEFAULT 'Permenkes 3/2023';

-- 4. Alter Table: revenue_integrity_cross_audits (False-Positive Control & Suppression Audit)
ALTER TABLE revenue_integrity_cross_audits
ADD COLUMN IF NOT EXISTS suppressed_false_positives JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS exemption_categories JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 5. Alter Table: electronic_claim_submissions (Multi-Payer Abstraction & Copay Balance)
ALTER TABLE electronic_claim_submissions
ADD COLUMN IF NOT EXISTS payer_adapter_type VARCHAR(50) NOT NULL DEFAULT 'BPJS_VCLAIM' CHECK (payer_adapter_type IN ('BPJS_VCLAIM', 'PRIVATE_INSURANCE_ADMEDIKA', 'CORPORATE_DIRECT', 'SELF_PAY_MANDIRI')),
ADD COLUMN IF NOT EXISTS copay_balance_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS resubmission_count INT NOT NULL DEFAULT 0;
