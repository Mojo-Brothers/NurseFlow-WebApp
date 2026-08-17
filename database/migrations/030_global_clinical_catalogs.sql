-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 030: Wave 5 Global Clinical Catalogs
-- Standards: JCI MMU (Medication Management), IPSG Safety, DICOM 3.0, LOINC & Permenkes 91/2015
-- ==============================================================================

-- 1. Master Allergens (Shared Global — Zat Alergen Berstandar SNOMED-CT / ATC)
CREATE TABLE IF NOT EXISTS master_allergens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    allergen_name VARCHAR(100) NOT NULL,
    snomed_ct_concept_id VARCHAR(50),
    atc_class_group VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Master Medications (Formularium Obat & BMHP Global RS)
CREATE TABLE IF NOT EXISTS master_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES master_tenants(id) ON DELETE RESTRICT,
    kfa_code VARCHAR(30) NOT NULL REFERENCES master_kfa(kfa_code),
    generic_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    dosage_form VARCHAR(50) NOT NULL,
    strength VARCHAR(50) NOT NULL,
    atc_code VARCHAR(30),
    is_fornas BOOLEAN NOT NULL DEFAULT TRUE,
    is_high_alert BOOLEAN NOT NULL DEFAULT FALSE,
    is_lasa BOOLEAN NOT NULL DEFAULT FALSE,
    renal_contraindication_egfr DECIMAL(5,2),
    unit_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL,
    CONSTRAINT uq_tenant_medication UNIQUE(tenant_id, kfa_code, brand_name)
);

-- 3. Medication Allergens (Junction Many-to-Many Zat Alergen vs Obat)
CREATE TABLE IF NOT EXISTS medication_allergens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_id UUID NOT NULL REFERENCES master_medications(id) ON DELETE CASCADE,
    allergen_id UUID NOT NULL REFERENCES master_allergens(id) ON DELETE RESTRICT,
    risk_level VARCHAR(50) NOT NULL DEFAULT 'HIGH_CROSS_REACTIVITY',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_medication_allergen UNIQUE(medication_id, allergen_id)
);

-- 4. Master Lab Tests (Katalog Uji Laboratorium Global)
CREATE TABLE IF NOT EXISTS master_lab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES master_tenants(id) ON DELETE RESTRICT,
    test_code VARCHAR(30) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    loinc_code VARCHAR(20) NOT NULL REFERENCES master_loinc(code),
    specimen_type VARCHAR(50) NOT NULL,
    standard_reference_range VARCHAR(100) NOT NULL,
    panic_critical_range VARCHAR(100) NOT NULL,
    unit_of_measure VARCHAR(20) NOT NULL,
    tariff DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL,
    CONSTRAINT uq_tenant_lab_test UNIQUE(tenant_id, test_code)
);

-- 5. Master Modalities (Shared Global Taksonomi DICOM)
CREATE TABLE IF NOT EXISTS master_modalities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modality_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    dicom_sop_class_uid VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Master Radiology Procedures (Katalog Pemeriksaan Radiologi Global)
CREATE TABLE IF NOT EXISTS master_radiology_procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES master_tenants(id) ON DELETE RESTRICT,
    modality_id UUID NOT NULL REFERENCES master_modalities(id),
    procedure_code VARCHAR(30) NOT NULL,
    procedure_name VARCHAR(255) NOT NULL,
    loinc_code VARCHAR(20) NULL REFERENCES master_loinc(code),
    tariff DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL,
    CONSTRAINT uq_tenant_radiology_procedure UNIQUE(tenant_id, procedure_code)
);

-- 7. Master Surgical Procedures (Katalog Tindakan Kamar Bedah Sentral)
CREATE TABLE IF NOT EXISTS master_surgical_procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES master_tenants(id) ON DELETE RESTRICT,
    surgery_category_id UUID NOT NULL REFERENCES master_surgery_categories(id),
    procedure_code VARCHAR(30) NOT NULL,
    procedure_name VARCHAR(255) NOT NULL,
    icd9cm_code VARCHAR(10) NOT NULL REFERENCES master_icd9cm(code),
    estimated_duration_minutes INT NOT NULL DEFAULT 60,
    base_tariff DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL,
    CONSTRAINT uq_tenant_surgical_procedure UNIQUE(tenant_id, procedure_code)
);

-- 8. Practitioner Procedure Privileges (Junction SPK & RKK Kewenangan Klinis Bedah)
CREATE TABLE IF NOT EXISTS practitioner_procedure_privileges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID NOT NULL REFERENCES master_practitioners(id) ON DELETE CASCADE,
    surgical_procedure_id UUID NOT NULL REFERENCES master_surgical_procedures(id) ON DELETE RESTRICT,
    privilege_level VARCHAR(30) NOT NULL CHECK(privilege_level IN ('MANDIRI', 'SUPERVISI', 'TIDAK_DIIZINKAN')),
    approved_by_staff_id UUID NULL REFERENCES master_staff(id),
    valid_until DATE NOT NULL,
    spk_document_number VARCHAR(100) NOT NULL,
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL,
    CONSTRAINT uq_practitioner_procedure_privilege UNIQUE(practitioner_id, surgical_procedure_id)
);

-- 9. Master Blood Products (Katalog Produk Darah BDRS Global)
CREATE TABLE IF NOT EXISTS master_blood_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES master_tenants(id) ON DELETE RESTRICT,
    product_code VARCHAR(30) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    blood_component_type VARCHAR(30) NOT NULL CHECK(blood_component_type IN ('WHOLE_BLOOD', 'PACKED_RED_CELLS', 'THROMBOCYTE_CONCENTRATE', 'FRESH_FROZEN_PLASMA', 'CRYOPRECIPITATE')),
    target_storage_temp_celsius DECIMAL(4,1) NOT NULL,
    shelf_life_days INT NOT NULL,
    tariff DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL,
    CONSTRAINT uq_tenant_blood_product UNIQUE(tenant_id, product_code)
);

-- Indexes for Global Clinical Catalogs
CREATE INDEX IF NOT EXISTS idx_medication_tenant ON master_medications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lab_tenant ON master_lab_tests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rad_tenant ON master_radiology_procedures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_surg_tenant ON master_surgical_procedures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blood_tenant ON master_blood_products(tenant_id);
