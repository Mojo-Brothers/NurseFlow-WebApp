-- NurseFlow Enterprise HIS 2026 — Migration 021
-- Domain: Surgical Revenue Cycle, Permanent Implant Tracking (UDI), Complete Surgical Team Roster & INA-CBG Grouper Bridge
-- Compliance: Permenkes Tarif INA-CBG BPJS, JCI IPSG 4, FDA/Kemenkes Medical Device UDI Tracking

-- 1. Table: surgical_implants_tracking (Permanent Medical Implants & UDI)
CREATE TABLE IF NOT EXISTS surgical_implants_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    surgical_case_id UUID NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    encounter_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    implant_name VARCHAR(150) NOT NULL, -- e.g. 'Synthes Titanium Distal Radius Plate 3.5mm'
    udi_barcode VARCHAR(100) UNIQUE NOT NULL, -- Unique Device Identifier (UDI)
    serial_number VARCHAR(100) NOT NULL,
    lot_number VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(150) NOT NULL, -- 'DePuy Synthes / Zimmer Biomet'
    expiration_date DATE NOT NULL,
    anatomical_location VARCHAR(100) NOT NULL, -- 'Radius Distal Sinistra'
    implanted_by_surgeon VARCHAR(150) NOT NULL,
    unit_cost_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    billing_status VARCHAR(20) NOT NULL DEFAULT 'BILLED', -- BILLED, INA_CBG_INCLUDED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: surgical_teams (Comprehensive Surgical Team Roster)
CREATE TABLE IF NOT EXISTS surgical_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    surgical_case_id UUID NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    staff_id VARCHAR(50) NOT NULL,
    staff_name VARCHAR(150) NOT NULL,
    role_in_surgery VARCHAR(50) NOT NULL, -- PRIMARY_SURGEON, ASSISTANT_SURGEON, ANESTHESIOLOGIST, ANESTHESIA_NURSE, SCRUB_NURSE, CIRCULATING_NURSE, PERFUSIONIST, RADIOGRAPHER, RESIDENT_TRAINEE
    license_str_number VARCHAR(50),
    attended_sign_in BOOLEAN NOT NULL DEFAULT TRUE,
    attended_time_out BOOLEAN NOT NULL DEFAULT TRUE,
    attended_sign_out BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: surgical_billing_breakdown (Itemized Charges & INA-CBG Financials)
CREATE TABLE IF NOT EXISTS surgical_billing_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    surgical_case_id UUID UNIQUE NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    encounter_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    operating_room_fee NUMERIC(15, 2) NOT NULL DEFAULT 2500000.00, -- Sewa Kamar Bedah & Sterilisasi
    surgeon_professional_fee NUMERIC(15, 2) NOT NULL DEFAULT 4500000.00, -- Jasa Operator Utama & Asisten
    anesthesia_professional_fee NUMERIC(15, 2) NOT NULL DEFAULT 2000000.00, -- Jasa Dokter Anestesi
    consumables_charge NUMERIC(15, 2) NOT NULL DEFAULT 1200000.00, -- Bahan Habis Pakai (Kassa, Benang, Drapes)
    anesthetic_drugs_charge NUMERIC(15, 2) NOT NULL DEFAULT 850000.00, -- Obat Anestesi (Propofol, Sevoflurane, Fentanyl)
    implants_charge NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- Implan Ortopedi / Mesh Hernia
    total_hospital_cost NUMERIC(15, 2) NOT NULL, -- Total Biaya Riil RS
    
    -- INA-CBG Grouper Mapping
    icd10_primary_diagnosis VARCHAR(20) NOT NULL, -- e.g. 'K35.8' (Acute Appendicitis)
    icd9cm_primary_procedure VARCHAR(20) NOT NULL, -- e.g. '47.0' (Appendectomy)
    inacbg_code VARCHAR(20) NOT NULL, -- e.g. 'K-1-14-I' (Prosedur Usus Buntu Ringan)
    inacbg_description VARCHAR(255) NOT NULL,
    inacbg_tariff NUMERIC(15, 2) NOT NULL, -- Tarif Paket Klaim BPJS
    hospital_margin NUMERIC(15, 2) NOT NULL, -- inacbg_tariff - total_hospital_cost
    claim_submission_status VARCHAR(30) NOT NULL DEFAULT 'READY_FOR_SUBMISSION', -- READY_FOR_SUBMISSION, SUBMITTED_VCLAIM, APPROVED_VERIFIER, DISPUTE
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_implants_case ON surgical_implants_tracking(surgical_case_id);
CREATE INDEX IF NOT EXISTS idx_implants_udi ON surgical_implants_tracking(udi_barcode);
CREATE INDEX IF NOT EXISTS idx_surg_teams_case ON surgical_teams(surgical_case_id);
CREATE INDEX IF NOT EXISTS idx_surg_billing_case ON surgical_billing_breakdown(surgical_case_id);

-- PostgreSQL Row-Level Security (RLS)
ALTER TABLE surgical_implants_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgical_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgical_billing_breakdown ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY tenant_isolation_implants ON surgical_implants_tracking
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY tenant_isolation_surg_billing ON surgical_billing_breakdown
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
