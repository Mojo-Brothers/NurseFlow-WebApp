-- NurseFlow Enterprise HIS 2026 — Migration 022
-- Domain: Enterprise Pharmacy & Multi-Depot FEFO Dispensing, Controlled Substances Traceability, Versioned INA-CBG & Medical Device Recall
-- Compliance: Permenkes 73/2016 (Standar Pelayanan Kefarmasian), JCI MMU (Medication Management & Use), BPJS V-Claim 2.0 Lifecycle

-- 1. Table: pharmacy_depots (Multi-Depot Satellite Network)
CREATE TABLE IF NOT EXISTS pharmacy_depots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    depot_code VARCHAR(50) UNIQUE NOT NULL, -- 'GUDANG_INDUK', 'DEPO_IGD', 'DEPO_RAWAT_INAP', 'DEPO_RAWAT_JALAN', 'DEPO_IBS', 'DEPO_ICU'
    depot_name VARCHAR(150) NOT NULL,
    location_description VARCHAR(255),
    is_controlled_substances_authorized BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: pharmacy_inventory_batches (Batch, Expiration & FEFO Prioritization)
CREATE TABLE IF NOT EXISTS pharmacy_inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    depot_id UUID NOT NULL REFERENCES pharmacy_depots(id) ON DELETE CASCADE,
    medication_code VARCHAR(50) NOT NULL, -- e.g. 'MED-CEFTRIAXONE-1G', 'MED-PROPOFOL-1%'
    medication_name VARCHAR(255) NOT NULL,
    dosage_form VARCHAR(50) NOT NULL, -- 'VIAL', 'AMPUL', 'TABLET', 'BOTOL', 'KOLF'
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL, -- Used for FEFO ordering
    current_stock INT NOT NULL DEFAULT 0,
    reorder_point INT NOT NULL DEFAULT 20,
    unit_cost_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    selling_price_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_high_alert BOOLEAN NOT NULL DEFAULT FALSE,
    is_narcotic_psychotropic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: pharmacy_dispensing_orders (Prescription Fulfillment & 7-Rights Verification)
CREATE TABLE IF NOT EXISTS pharmacy_dispensing_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    prescription_id VARCHAR(50) NOT NULL,
    encounter_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    patient_name VARCHAR(150) NOT NULL,
    depot_id UUID NOT NULL REFERENCES pharmacy_depots(id) ON DELETE RESTRICT,
    clinical_screening_passed BOOLEAN NOT NULL DEFAULT FALSE,
    allergy_interaction_checked BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by_pharmacist_id VARCHAR(50),
    verified_by_pharmacist_name VARCHAR(150),
    total_amount_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    dispensing_status VARCHAR(40) NOT NULL DEFAULT 'PENDING_VERIFICATION', -- PENDING_VERIFICATION, VERIFIED, PREPARING_FEFO, DISPENSED, COMPLETED, CANCELLED
    satusehat_medication_dispense_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table: pharmacy_controlled_substance_logs (Double Pharmacist Verification)
CREATE TABLE IF NOT EXISTS pharmacy_controlled_substance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    dispensing_order_id UUID NOT NULL REFERENCES pharmacy_dispensing_orders(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    quantity_dispensed INT NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    primary_pharmacist_id VARCHAR(50) NOT NULL,
    primary_pharmacist_name VARCHAR(150) NOT NULL,
    secondary_verifier_pharmacist_id VARCHAR(50) NOT NULL,
    secondary_verifier_pharmacist_name VARCHAR(150) NOT NULL,
    dual_signature_hash VARCHAR(128) NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Table: medical_device_implant_recalls (Implant & Device Safety Recall)
CREATE TABLE IF NOT EXISTS medical_device_implant_recalls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    manufacturer VARCHAR(150) NOT NULL,
    device_model VARCHAR(150) NOT NULL,
    lot_number_recalled VARCHAR(100) NOT NULL,
    recall_reason TEXT NOT NULL,
    recall_risk_level VARCHAR(20) NOT NULL DEFAULT 'CLASS_I_HIGH_RISK', -- CLASS_I_HIGH_RISK, CLASS_II_MODERATE, CLASS_III_LOW
    affected_patients_count INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE_INVESTIGATION', -- ACTIVE_INVESTIGATION, ALL_PATIENTS_NOTIFIED, CLINICAL_REVISION_COMPLETE, CLOSED
    initiated_by_officer VARCHAR(150) NOT NULL,
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 6. Table: master_inacbg_tariffs (Dynamic Versioned INA-CBG Tariffs)
CREATE TABLE IF NOT EXISTS master_inacbg_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    tariff_version VARCHAR(50) NOT NULL DEFAULT 'PERMENKES_3_2023',
    inacbg_code VARCHAR(20) NOT NULL,
    description VARCHAR(255) NOT NULL,
    severity_level VARCHAR(10) NOT NULL DEFAULT 'I', -- I, II, III
    hospital_class VARCHAR(10) NOT NULL DEFAULT 'B', -- A, B, C, D
    tariff_idr NUMERIC(15, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Table: bpjs_vclaim_lifecycle_logs (Complete 5-Stage V-Claim Lifecycle)
CREATE TABLE IF NOT EXISTS bpjs_vclaim_lifecycle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    no_sep VARCHAR(50) UNIQUE NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    claim_amount_requested NUMERIC(15, 2) NOT NULL,
    claim_amount_approved NUMERIC(15, 2),
    current_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, VERIFIED, APPROVED, PAID, DISPUTED
    bpjs_verifier_note TEXT,
    last_updated_by VARCHAR(150) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance & FEFO speed
CREATE INDEX IF NOT EXISTS idx_inv_depot_fefo ON pharmacy_inventory_batches(depot_id, medication_code, expiry_date, current_stock);
CREATE INDEX IF NOT EXISTS idx_disp_patient ON pharmacy_dispensing_orders(patient_mrn, dispensing_status);
CREATE INDEX IF NOT EXISTS idx_recall_lot ON medical_device_implant_recalls(lot_number_recalled);
CREATE INDEX IF NOT EXISTS idx_vclaim_sep ON bpjs_vclaim_lifecycle_logs(no_sep, current_status);

-- PostgreSQL Row-Level Security (RLS)
ALTER TABLE pharmacy_depots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_dispensing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_controlled_substance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_device_implant_recalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_inacbg_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpjs_vclaim_lifecycle_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY tenant_isolation_pharmacy ON pharmacy_inventory_batches
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
