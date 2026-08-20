-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 056: Medication Closed-Loop Durability & Patient Safety Core
-- Sprint 5A / Step 4: e-Prescribing, CDSS Safety Gates, Pharmacist MMU.4 Clinical Review,
-- FEFO Stock Allocation, Bedside Barcode 5-Rights Verification, eMAR Administration & Charge Capture.
-- Standards: JCI MMU / IPSG 3 (High-Alert / Dual-Signoff), ISO 22940, WHO 5-Rights, PostgreSQL 16 ACID.
-- ==============================================================================

-- 1. Enhance medication_orders with CPOE link, CDSS and Pharmacist Review fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'cpoe_order_id') THEN
        ALTER TABLE medication_orders ADD COLUMN cpoe_order_id UUID REFERENCES clinical_orders(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'cpoe_item_id') THEN
        ALTER TABLE medication_orders ADD COLUMN cpoe_item_id UUID REFERENCES cpoe_order_items(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'encounter_id') THEN
        ALTER TABLE medication_orders ADD COLUMN encounter_id UUID REFERENCES encounters(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'patient_id') THEN
        ALTER TABLE medication_orders ADD COLUMN patient_id UUID REFERENCES master_patients(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'dosage_quantity') THEN
        ALTER TABLE medication_orders ADD COLUMN dosage_quantity NUMERIC(10,2) DEFAULT 1.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'dosage_unit') THEN
        ALTER TABLE medication_orders ADD COLUMN dosage_unit VARCHAR(30) DEFAULT 'mg';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'scheduled_times') THEN
        ALTER TABLE medication_orders ADD COLUMN scheduled_times JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'is_prn') THEN
        ALTER TABLE medication_orders ADD COLUMN is_prn BOOLEAN DEFAULT FALSE;
        ALTER TABLE medication_orders ADD COLUMN prn_indication TEXT;
        ALTER TABLE medication_orders ADD COLUMN prn_min_interval_hours INT DEFAULT 4;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'cdss_screened') THEN
        ALTER TABLE medication_orders ADD COLUMN cdss_screened BOOLEAN DEFAULT FALSE;
        ALTER TABLE medication_orders ADD COLUMN cdss_override_reason TEXT;
        ALTER TABLE medication_orders ADD COLUMN cdss_overridden_by VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'pharmacist_review_status') THEN
        ALTER TABLE medication_orders ADD COLUMN pharmacist_review_status VARCHAR(30) DEFAULT 'PENDING_REVIEW';
        ALTER TABLE medication_orders ADD COLUMN pharmacist_review_notes TEXT;
        ALTER TABLE medication_orders ADD COLUMN reviewed_by_pharmacist_id VARCHAR(50);
        ALTER TABLE medication_orders ADD COLUMN reviewed_by_pharmacist_name VARCHAR(100);
        ALTER TABLE medication_orders ADD COLUMN reviewed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'dispense_status') THEN
        ALTER TABLE medication_orders ADD COLUMN dispense_status VARCHAR(30) DEFAULT 'NOT_DISPENSED';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'version') THEN
        ALTER TABLE medication_orders ADD COLUMN version INT DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_orders' AND column_name = 'created_at') THEN
        ALTER TABLE medication_orders ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE medication_orders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Table: medication_dispense_allocations (FEFO Physical Batch Lineage)
CREATE TABLE IF NOT EXISTS medication_dispense_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_order_id UUID NOT NULL REFERENCES medication_orders(id) ON DELETE RESTRICT,
    cpoe_order_id UUID REFERENCES clinical_orders(id),
    cpoe_item_id UUID REFERENCES cpoe_order_items(id),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    warehouse_id UUID NOT NULL REFERENCES pharmacy_warehouses(id),
    batch_id UUID NOT NULL REFERENCES inventory_batches(id),
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_dispensed INT NOT NULL CHECK (quantity_dispensed > 0),
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    dispensed_by_pharmacist_id VARCHAR(50) NOT NULL,
    dispensed_by_pharmacist_name VARCHAR(100) NOT NULL,
    dispense_barcode VARCHAR(100) UNIQUE NOT NULL,
    dispensed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'DISPENSED', -- DISPENSED, RETURNED, CANCELLED
    correlation_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disp_alloc_order ON medication_dispense_allocations(medication_order_id);
CREATE INDEX IF NOT EXISTS idx_disp_alloc_batch ON medication_dispense_allocations(batch_id);
CREATE INDEX IF NOT EXISTS idx_disp_alloc_barcode ON medication_dispense_allocations(dispense_barcode);

-- 3. Table: medication_emar_administrations (Bedside 5-Rights Verification & Clinical Administration Ledger)
CREATE TABLE IF NOT EXISTS medication_emar_administrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_order_id UUID NOT NULL REFERENCES medication_orders(id) ON DELETE RESTRICT,
    cpoe_order_id UUID REFERENCES clinical_orders(id),
    cpoe_item_id UUID REFERENCES cpoe_order_items(id),
    dispense_allocation_id UUID REFERENCES medication_dispense_allocations(id),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    scheduled_time TIMESTAMPTZ,
    administered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    administered_by_nurse_id VARCHAR(50) NOT NULL,
    administered_by_nurse_name VARCHAR(100) NOT NULL,
    witness_nurse_id VARCHAR(50),
    witness_nurse_name VARCHAR(100),
    dose_given NUMERIC(10,2) NOT NULL,
    dose_unit VARCHAR(30) NOT NULL,
    route_given VARCHAR(50) NOT NULL,
    scanned_patient_barcode VARCHAR(100) NOT NULL,
    scanned_medication_barcode VARCHAR(100) NOT NULL,
    five_rights_verified BOOLEAN NOT NULL DEFAULT TRUE,
    administration_status VARCHAR(30) NOT NULL DEFAULT 'GIVEN', -- GIVEN, REFUSED, HELD, MISSED, CANCELLED
    held_reason TEXT,
    clinical_notes TEXT,
    adverse_reaction_observed BOOLEAN NOT NULL DEFAULT FALSE,
    adverse_reaction_notes TEXT,
    charge_captured BOOLEAN NOT NULL DEFAULT FALSE,
    charge_id UUID,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emar_med_order ON medication_emar_administrations(medication_order_id);
CREATE INDEX IF NOT EXISTS idx_emar_encounter ON medication_emar_administrations(encounter_id, administered_at DESC);
CREATE INDEX IF NOT EXISTS idx_emar_patient ON medication_emar_administrations(patient_id);

-- 4. Table: master_medication_dose_ranges (CDSS Clinical Guard Rails)
CREATE TABLE IF NOT EXISTS master_medication_dose_ranges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_code VARCHAR(50) UNIQUE NOT NULL,
    medication_name VARCHAR(150) NOT NULL,
    min_single_dose NUMERIC(10,2) NOT NULL,
    max_single_dose NUMERIC(10,2) NOT NULL,
    max_daily_dose NUMERIC(10,2) NOT NULL,
    dose_unit VARCHAR(30) NOT NULL,
    allowed_routes JSONB NOT NULL DEFAULT '["ORAL"]'::jsonb,
    renal_clearance_cutoff_ml_min NUMERIC(6,2),
    max_dose_renal_impaired NUMERIC(10,2),
    is_high_alert BOOLEAN NOT NULL DEFAULT FALSE,
    is_narcotic BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Seed Initial Master Dose Ranges & Clinical Safety Limits
INSERT INTO master_medication_dose_ranges
(medication_code, medication_name, min_single_dose, max_single_dose, max_daily_dose, dose_unit, allowed_routes, renal_clearance_cutoff_ml_min, max_dose_renal_impaired, is_high_alert, is_narcotic)
VALUES
('MED-PARACETAMOL', 'Paracetamol 500mg Tab', 250.00, 1000.00, 4000.00, 'mg', '["ORAL", "RECTAL", "IV_INFUSION"]'::jsonb, 30.00, 2000.00, FALSE, FALSE),
('MED-MORPHINE-10', 'Morphine HCl 10mg/mL Ampul', 2.00, 15.00, 60.00, 'mg', '["IV_BOLUS", "SC", "IM", "IV_INFUSION"]'::jsonb, 30.00, 5.00, TRUE, TRUE),
('MED-POTASSIUM-746', 'KCl 7.46% (High Alert Electrolyte)', 10.00, 25.00, 100.00, 'mEq', '["IV_INFUSION"]'::jsonb, 30.00, 20.00, TRUE, FALSE),
('MED-GENTAMICIN-80', 'Gentamicin 80mg/2mL Vial', 40.00, 160.00, 320.00, 'mg', '["IV_INFUSION", "IM"]'::jsonb, 50.00, 80.00, FALSE, FALSE),
('MED-INSULIN-REG', 'Insulin Regular (Actrapid) 100IU/mL', 1.00, 20.00, 100.00, 'IU', '["SC", "IV_INFUSION"]'::jsonb, 15.00, 10.00, TRUE, FALSE)
ON CONFLICT (medication_code) DO NOTHING;
