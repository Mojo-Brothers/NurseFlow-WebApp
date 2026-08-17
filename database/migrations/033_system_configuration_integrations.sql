-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 033: System Configuration & Integration Gateway
-- Standards: DICOM 3.0 Network Node, SATUSEHAT DTO OAuth2 Gateway & JCI QPS Indicators
-- ==============================================================================

-- 1. DICOM Nodes (Konfigurasi Jaringan Fisik PACS — Dipisahkan dari Taksonomi Modalitas)
CREATE TABLE IF NOT EXISTS dicom_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES master_tenants(id) ON DELETE RESTRICT,
    facility_id UUID NOT NULL REFERENCES master_facilities(id) ON DELETE CASCADE,
    modality_id UUID NOT NULL REFERENCES master_modalities(id),
    ae_title VARCHAR(50) NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    dicom_port INT NOT NULL DEFAULT 104,
    status VARCHAR(30) NOT NULL DEFAULT 'ONLINE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL,
    CONSTRAINT uq_facility_ae_title UNIQUE(facility_id, ae_title)
);

-- 2. SATUSEHAT Integration Configs (Konfigurasi Gateway DTO Kemenkes RI)
CREATE TABLE IF NOT EXISTS satusehat_integration_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES master_tenants(id) ON DELETE RESTRICT,
    organization_id UUID NOT NULL REFERENCES master_organizations(id) ON DELETE CASCADE,
    auth_url TEXT NOT NULL DEFAULT 'https://api-satusehat.kemkes.go.id/oauth2/v1',
    base_fhir_url TEXT NOT NULL DEFAULT 'https://api-satusehat.kemkes.go.id/fhir-r4/v1',
    client_id VARCHAR(100) NOT NULL,
    client_secret_hash VARCHAR(255) NOT NULL,
    organization_ihs_id VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Master KPI Targets (Konfigurasi Target Sasaran Mutu Fasilitas)
CREATE TABLE IF NOT EXISTS master_kpi_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES master_facilities(id) ON DELETE CASCADE,
    kpi_code VARCHAR(50) NOT NULL,
    kpi_name VARCHAR(100) NOT NULL,
    target_value DECIMAL(8,2) NOT NULL,
    unit_of_measure VARCHAR(20) NOT NULL,
    benchmark_standard VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_facility_kpi UNIQUE(facility_id, kpi_code)
);

CREATE INDEX IF NOT EXISTS idx_dicom_node_facility ON dicom_nodes(facility_id);
CREATE INDEX IF NOT EXISTS idx_satusehat_org ON satusehat_integration_configs(organization_id);
