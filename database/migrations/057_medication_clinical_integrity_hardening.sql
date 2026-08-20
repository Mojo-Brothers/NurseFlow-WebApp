-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 057: Medication Clinical Integrity & Safety Hardening
-- Standards: JCI MMU.4 / IPSG 3, Cross-Reactivity Allergy, Dynamic DDI Engine,
-- Weight-Based & Cumulative Dosing, IV Infusion Safety, and Admission/Discharge Reconciliation.
-- ==============================================================================

-- 1. Table: master_drug_class_cross_reactivities (Cross-Reactivity & Ingredient Mapping)
CREATE TABLE IF NOT EXISTS master_drug_class_cross_reactivities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug_class_code VARCHAR(50) NOT NULL,
    drug_class_name VARCHAR(150) NOT NULL,
    cross_reactive_class_code VARCHAR(50) NOT NULL,
    cross_reactive_class_name VARCHAR(150) NOT NULL,
    risk_level VARCHAR(30) NOT NULL DEFAULT 'HIGH', -- HIGH, MODERATE, LOW
    clinical_rationale TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Cross-Reactivity
INSERT INTO master_drug_class_cross_reactivities 
(drug_class_code, drug_class_name, cross_reactive_class_code, cross_reactive_class_name, risk_level, clinical_rationale)
VALUES
('CLASS-PENICILLIN', 'Penicillin Beta-Lactam', 'CLASS-CEPHALOSPORIN', 'Cephalosporin 1st Gen', 'HIGH', 'Resiko cross-reactivity beta-lactam ring side-chain (hingga 10%)'),
('CLASS-SULFONAMIDE', 'Sulfonamide Antibiotics', 'CLASS-SULFONYLUREA', 'Sulfonylurea Oral Antidiabetics', 'MODERATE', 'Resiko hipersensitivitas silang sulfonamide moiety'),
('CLASS-NSAID', 'Non-Steroidal Anti-Inflammatory', 'CLASS-ASPIRIN', 'Salicylate / Aspirin', 'HIGH', 'Resiko cross-reactivity COX-1 bronchospasm / trias Widal')
ON CONFLICT DO NOTHING;

-- 2. Enhance master_medication_dose_ranges with Weight-based & Daily Cumulative bounds
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_medication_dose_ranges' AND column_name = 'mg_per_kg_max_dose') THEN
        ALTER TABLE master_medication_dose_ranges ADD COLUMN mg_per_kg_max_dose NUMERIC(8,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_medication_dose_ranges' AND column_name = 'max_daily_dose_mg_per_kg') THEN
        ALTER TABLE master_medication_dose_ranges ADD COLUMN max_daily_dose_mg_per_kg NUMERIC(8,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_medication_dose_ranges' AND column_name = 'drug_class_code') THEN
        ALTER TABLE master_medication_dose_ranges ADD COLUMN drug_class_code VARCHAR(50) DEFAULT 'CLASS-GENERAL';
    END IF;
END $$;

-- Update Master Dose Ranges with weight-based rules
UPDATE master_medication_dose_ranges SET mg_per_kg_max_dose = 15.00, max_daily_dose_mg_per_kg = 60.00, drug_class_code = 'CLASS-ANALGESIC' WHERE medication_code = 'MED-PARACETAMOL';
UPDATE master_medication_dose_ranges SET mg_per_kg_max_dose = 0.20, max_daily_dose_mg_per_kg = 1.00, drug_class_code = 'CLASS-OPIOID' WHERE medication_code = 'MED-MORPHINE-10';

-- 3. Enhance medication_orders & medication_emar_administrations for IV Infusion Safety
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'concentration_mg_ml') THEN
        ALTER TABLE medication_orders ADD COLUMN concentration_mg_ml NUMERIC(10,3);
        ALTER TABLE medication_orders ADD COLUMN infusion_rate_ml_hr NUMERIC(10,2);
        ALTER TABLE medication_orders ADD COLUMN infusion_volume_ml NUMERIC(10,2);
        ALTER TABLE medication_orders ADD COLUMN timing_type VARCHAR(30) DEFAULT 'ROUTINE'; -- ROUTINE, STAT, NOW, PRN, CONTINUOUS
        ALTER TABLE medication_orders ADD COLUMN clinical_indication_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_emar_administrations' AND column_name = 'verified_concentration_mg_ml') THEN
        ALTER TABLE medication_emar_administrations ADD COLUMN verified_concentration_mg_ml NUMERIC(10,3);
        ALTER TABLE medication_emar_administrations ADD COLUMN verified_infusion_rate_ml_hr NUMERIC(10,2);
        ALTER TABLE medication_emar_administrations ADD COLUMN verified_volume_ml NUMERIC(10,2);
    END IF;
END $$;

-- 4. Table: medication_reconciliations (Admission, Transfer & Discharge Medication Reconciliation)
CREATE TABLE IF NOT EXISTS medication_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    reconciliation_type VARCHAR(30) NOT NULL CHECK (reconciliation_type IN ('ADMISSION', 'TRANSFER', 'DISCHARGE')),
    source_medications JSONB NOT NULL DEFAULT '[]'::jsonb, -- Home medications or pre-transfer active list
    reconciled_medications JSONB NOT NULL DEFAULT '[]'::jsonb, -- Decisions: CONTINUE, DISCONTINUE, MODIFY, SUBSTITUTE
    discontinued_medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    discharge_instructions TEXT,
    reconciled_by_id VARCHAR(50) NOT NULL,
    reconciled_by_name VARCHAR(100) NOT NULL,
    reconciled_by_role VARCHAR(50) NOT NULL,
    reconciled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_encounter ON medication_reconciliations(encounter_id, reconciliation_type);
CREATE INDEX IF NOT EXISTS idx_reconciliation_patient ON medication_reconciliations(patient_id);
