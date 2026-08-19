-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 031: Wave 5 Financial Catalogs & Periodized Tariffs
-- Standards: Permenkes No. 3/2023 (Standar Tarif INA-CBG 6.0) & BPJS V-Claim 2.0
-- ==============================================================================

-- 1. Master INA-CBG Tariffs (Tarif INA-CBG 6.0 dengan Periodisasi Lengkap)
CREATE TABLE IF NOT EXISTS master_inacbg_tariffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES master_tenants(id) ON DELETE RESTRICT,
    inacbg_code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    hospital_class VARCHAR(10) NOT NULL CHECK(hospital_class IN ('A', 'B', 'C', 'D')),
    region_number INT NOT NULL CHECK(region_number BETWEEN 1 AND 5),
    severity_level INT NOT NULL CHECK(severity_level IN (1, 2, 3)),
    special_cmg_code VARCHAR(50),
    tariff_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    effective_date DATE NOT NULL,
    expired_date DATE NOT NULL,
    tariff_version VARCHAR(50) NOT NULL DEFAULT 'Permenkes No. 3 Tahun 2023',
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL,
    CONSTRAINT uq_inacbg_matrix_tariff UNIQUE(tenant_id, inacbg_code, hospital_class, region_number, severity_level, effective_date)
);
ALTER TABLE master_inacbg_tariffs ADD COLUMN IF NOT EXISTS region_number INT DEFAULT 1;
ALTER TABLE master_inacbg_tariffs ADD COLUMN IF NOT EXISTS effective_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE master_inacbg_tariffs ADD COLUMN IF NOT EXISTS expired_date DATE DEFAULT (CURRENT_DATE + INTERVAL '10 years');
ALTER TABLE master_inacbg_tariffs ADD COLUMN IF NOT EXISTS tariff_amount DECIMAL(14,2) DEFAULT 0.00;
ALTER TABLE master_inacbg_tariffs ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_inacbg_search ON master_inacbg_tariffs(inacbg_code, hospital_class);

-- 2. Master Insurances (Penjamin & Asuransi Kesehatan RS)
CREATE TABLE IF NOT EXISTS master_insurances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES master_tenants(id) ON DELETE RESTRICT,
    organization_id UUID NOT NULL REFERENCES master_organizations(id) ON DELETE CASCADE,
    payer_type_id UUID NOT NULL REFERENCES master_payer_types(id),
    payer_code VARCHAR(30) NOT NULL,
    payer_name VARCHAR(100) NOT NULL,
    satusehat_coverage_id VARCHAR(50),
    contract_start DATE NOT NULL,
    contract_end DATE NOT NULL,
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL,
    CONSTRAINT uq_tenant_insurance_payer UNIQUE(tenant_id, organization_id, payer_code)
);

CREATE INDEX IF NOT EXISTS idx_insurance_tenant ON master_insurances(tenant_id, organization_id);
