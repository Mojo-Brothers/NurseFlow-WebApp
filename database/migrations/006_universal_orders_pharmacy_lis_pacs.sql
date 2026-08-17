-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 006: Universal Orders, Pharmacy, LIS & PACS
-- Standar: HL7 v2, DICOM 3.0, LOINC, WHO Medication Safety
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinical_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    episode_id UUID NOT NULL REFERENCES episodes_of_care(id),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    ordered_by VARCHAR(100) NOT NULL,
    order_category VARCHAR(30) NOT NULL CHECK (order_category IN ('PHARMACY', 'LABORATORY', 'RADIOLOGY', 'PROCEDURE', 'DIET')),
    priority VARCHAR(20) DEFAULT 'ROUTINE' CHECK (priority IN ('ROUTINE', 'URGENT', 'CITO')),
    clinical_indication TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'ORDERED' CHECK (status IN ('DRAFT', 'ORDERED', 'VERIFIED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    is_cito BOOLEAN DEFAULT FALSE,
    order_items_count INT DEFAULT 1,
    total_estimated_amount DECIMAL(15,2) DEFAULT 0.00,
    history JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medication_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES clinical_orders(id),
    medication_code VARCHAR(50) NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    route VARCHAR(50) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    is_cito BOOLEAN DEFAULT FALSE,
    high_alert BOOLEAN DEFAULT FALSE,
    lasa_flag BOOLEAN DEFAULT FALSE,
    is_antibiotic BOOLEAN DEFAULT FALSE,
    review_status VARCHAR(30) DEFAULT 'PENDING',
    verified_by VARCHAR(100),
    dispensed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'PRESCRIBED'
);

CREATE TABLE IF NOT EXISTS laboratory_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES clinical_orders(id),
    loinc_code VARCHAR(50) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    specimen_type VARCHAR(50) NOT NULL,
    collected_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    validated_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    result_value TEXT,
    unit VARCHAR(50),
    reference_range TEXT,
    is_critical_panic BOOLEAN DEFAULT FALSE,
    delta_check_flag BOOLEAN DEFAULT FALSE,
    analyzer_instrument VARCHAR(100),
    unit_price DECIMAL(15,2) NOT NULL,
    result_status VARCHAR(30) DEFAULT 'ORDERED'
);

CREATE TABLE IF NOT EXISTS radiology_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES clinical_orders(id),
    modality VARCHAR(20) NOT NULL CHECK (modality IN ('CT', 'XR', 'US', 'MR', 'MG')),
    examination_name VARCHAR(255) NOT NULL,
    dicom_study_uid VARCHAR(255) NOT NULL,
    image_count INT DEFAULT 0,
    radiologist_report TEXT,
    radiologist_name VARCHAR(100),
    validated_at TIMESTAMP WITH TIME ZONE,
    unit_price DECIMAL(15,2) NOT NULL,
    result_status VARCHAR(30) DEFAULT 'ORDERED'
);

CREATE INDEX IF NOT EXISTS idx_orders_patient ON clinical_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON clinical_orders(status);
CREATE INDEX IF NOT EXISTS idx_med_orders_parent ON medication_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_parent ON laboratory_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_rad_orders_parent ON radiology_orders(order_id);
