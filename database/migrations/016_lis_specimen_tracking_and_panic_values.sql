-- NurseFlow Enterprise HIS 2026 — Migration 016
-- Domain: Laboratory Information System (LIS), Specimen Tracking & Critical Panic Value Alerts
-- Standard Compliance: JCI IPSG 2 (Effective Communication of Critical Results), LOINC, ISO 15189

CREATE TABLE IF NOT EXISTS laboratory_specimens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    encounter_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    specimen_barcode VARCHAR(50) UNIQUE NOT NULL,
    specimen_type VARCHAR(50) NOT NULL, -- EDTA_WHOLE_BLOOD, SERUM, CITRATE_PLASMA, HEPARIN_PLASMA, URINE_STERILE
    vacutainer_tube_color VARCHAR(30) NOT NULL, -- PURPLE_EDTA, YELLOW_SST, BLUE_CITRATE, RED_CLOT, GREEN_HEPARIN
    status VARCHAR(30) NOT NULL DEFAULT 'ORDERED', -- ORDERED, COLLECTED, IN_TRANSIT, RECEIVED_IN_LAB, ANALYZING, COMPLETED, REJECTED
    collection_site VARCHAR(100) DEFAULT 'Vena Cubiti',
    phlebotomist_name VARCHAR(100),
    collected_at TIMESTAMPTZ,
    received_by_lab_analyst VARCHAR(100),
    received_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS laboratory_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    specimen_id UUID NOT NULL REFERENCES laboratory_specimens(id) ON DELETE CASCADE,
    test_code VARCHAR(30) NOT NULL, -- LOINC Code (e.g. 57021-8 for CBC, 2524-7 for Lactate)
    test_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- HEMATOLOGY, CLINICAL_CHEMISTRY, BLOOD_GAS, IMMUNOLOGY, MICROBIOLOGY
    numeric_value NUMERIC(10, 3),
    text_value VARCHAR(255),
    unit VARCHAR(30) NOT NULL,
    reference_low NUMERIC(10, 3),
    reference_high NUMERIC(10, 3),
    panic_low NUMERIC(10, 3),
    panic_high NUMERIC(10, 3),
    is_abnormal BOOLEAN NOT NULL DEFAULT FALSE,
    is_critical_panic BOOLEAN NOT NULL DEFAULT FALSE,
    delta_flag VARCHAR(20) DEFAULT 'NONE', -- SIGNIFICANT_RISE, SIGNIFICANT_DROP, STABLE
    analyst_name VARCHAR(100) NOT NULL,
    pathologist_verified_by VARCHAR(100),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS laboratory_panic_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    result_id UUID NOT NULL REFERENCES laboratory_test_results(id) ON DELETE CASCADE,
    encounter_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    patient_mrn VARCHAR(30) NOT NULL,
    test_name VARCHAR(150) NOT NULL,
    panic_value_display VARCHAR(100) NOT NULL,
    clinical_threat TEXT NOT NULL, -- e.g. 'Aritmia Ventrikel Letal', 'Syok Septik Berat'
    status VARCHAR(30) NOT NULL DEFAULT 'REPORTED_TO_UNIT', -- REPORTED_TO_UNIT, ACKNOWLEDGED_READ_BACK, ESCALATED_DPJP
    reported_to_nurse_or_doctor VARCHAR(100),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_back_confirmed_by VARCHAR(100),
    read_back_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ultra-fast LIS query execution
CREATE INDEX IF NOT EXISTS idx_lab_specimens_barcode ON laboratory_specimens(specimen_barcode);
CREATE INDEX IF NOT EXISTS idx_lab_specimens_patient ON laboratory_specimens(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_lab_results_specimen ON laboratory_test_results(specimen_id);
CREATE INDEX IF NOT EXISTS idx_lab_panic_alerts_status ON laboratory_panic_alerts(status);
