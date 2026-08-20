-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 053: LIS Clinical Integrity & Semantic Hardening
-- Standards: JCI IPSG 2 (Closed-Loop Read-Back), ISO 15189, Clinical Rule Provenance,
-- Permenkes 24/2022, Temporal Reproducibility, Partial Order Completion FSM.
-- ==============================================================================

-- 1. Update clinical_orders status check constraint to include PARTIALLY_COMPLETED
ALTER TABLE clinical_orders DROP CONSTRAINT IF EXISTS clinical_orders_status_check;
ALTER TABLE clinical_orders ADD CONSTRAINT clinical_orders_status_check 
    CHECK (status IN ('DRAFT', 'ORDERED', 'VERIFIED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED', 'COMPLETED', 'CANCELLED', 'DISCONTINUED'));

-- 2. Enhance laboratory_test_results with semantic validation status and rule snapshot
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_test_results' AND column_name = 'applied_rule_version') THEN
        ALTER TABLE laboratory_test_results ADD COLUMN applied_rule_version INT DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_test_results' AND column_name = 'rule_snapshot') THEN
        ALTER TABLE laboratory_test_results ADD COLUMN rule_snapshot JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_test_results' AND column_name = 'technologist_verified_by') THEN
        ALTER TABLE laboratory_test_results ADD COLUMN technologist_verified_by VARCHAR(100);
        ALTER TABLE laboratory_test_results ADD COLUMN technologist_verified_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Enhance master_lab_critical_thresholds with temporal validity & specimen type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_lab_critical_thresholds' AND column_name = 'specimen_type') THEN
        ALTER TABLE master_lab_critical_thresholds ADD COLUMN specimen_type VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_lab_critical_thresholds' AND column_name = 'effective_from') THEN
        ALTER TABLE master_lab_critical_thresholds ADD COLUMN effective_from TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_lab_critical_thresholds' AND column_name = 'effective_to') THEN
        ALTER TABLE master_lab_critical_thresholds ADD COLUMN effective_to TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_lab_critical_thresholds' AND column_name = 'approved_by') THEN
        ALTER TABLE master_lab_critical_thresholds ADD COLUMN approved_by VARCHAR(100) DEFAULT 'Komite Medis & KPRS RS 2026';
    END IF;
END $$;

-- 4. Enhance laboratory_panic_alerts with explicit read-back evidence fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_panic_alerts' AND column_name = 'read_back_confirmation_text') THEN
        ALTER TABLE laboratory_panic_alerts ADD COLUMN read_back_confirmation_text TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_panic_alerts' AND column_name = 'clinical_instruction') THEN
        ALTER TABLE laboratory_panic_alerts ADD COLUMN clinical_instruction TEXT;
    END IF;
END $$;
