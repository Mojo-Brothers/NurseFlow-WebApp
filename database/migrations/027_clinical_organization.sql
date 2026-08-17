-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 027: Wave 2 Clinical Organization
-- Standards: JCI Governance & Leadership (GLD), BPJS HFIS & SATUSEHAT HealthcareService
-- ==============================================================================

-- 1. Master Departments (Instalasi Fungsional RS)
CREATE TABLE IF NOT EXISTS master_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES master_facilities(id) ON DELETE CASCADE,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department_type VARCHAR(50) NOT NULL CHECK(department_type IN ('EMERGENCY', 'OUTPATIENT', 'INPATIENT', 'INTENSIVE', 'SURGICAL', 'DIAGNOSTIC', 'PHARMACY', 'BLOOD_BANK', 'ADMINISTRATION')),
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL
);

-- 2. Master Service Units (Unit Kerja Pelayanan)
CREATE TABLE IF NOT EXISTS master_service_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES master_departments(id) ON DELETE CASCADE,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL
);

-- 3. Master Clinics (Poliklinik Rawat Jalan & Unit Layanan Spesifik)
CREATE TABLE IF NOT EXISTS master_clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_unit_id UUID NOT NULL REFERENCES master_service_units(id) ON DELETE RESTRICT,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    bpjs_poli_code VARCHAR(20) NOT NULL,
    fhir_service_id VARCHAR(50),
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL
);

-- Indexes for Clinical Organization
CREATE INDEX IF NOT EXISTS idx_dept_fac ON master_departments(facility_id);
CREATE INDEX IF NOT EXISTS idx_srv_dept ON master_service_units(department_id);
CREATE INDEX IF NOT EXISTS idx_cln_srv ON master_clinics(service_unit_id);
CREATE INDEX IF NOT EXISTS idx_cln_bpjs ON master_clinics(bpjs_poli_code);
