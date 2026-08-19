-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 026: Wave 1 Spatial Master Hierarchy
-- Standards: JCI Facilities Management (FMS), KARS 2024 & SATUSEHAT Location FHIR R4
-- ==============================================================================

-- 1. Master Tenants (Holding / Corporate Group Level)
CREATE TABLE IF NOT EXISTS master_tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    corporate_tax_number VARCHAR(50),
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'ENTERPRISE',
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

-- 2. Master Organizations (Hospital Legal Entity)
CREATE TABLE IF NOT EXISTS master_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES master_tenants(id) ON DELETE RESTRICT,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hospital_type_id UUID NOT NULL REFERENCES master_hospital_types(id),
    satusehat_org_id VARCHAR(50) UNIQUE NOT NULL,
    kemenkes_hospital_code VARCHAR(30) UNIQUE NOT NULL,
    address_line TEXT NOT NULL,
    city_code VARCHAR(10) NOT NULL REFERENCES master_cities(code),
    postal_code VARCHAR(10) NOT NULL,
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

-- 3. Master Facilities (Campus / Site Level)
CREATE TABLE IF NOT EXISTS master_facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES master_organizations(id) ON DELETE CASCADE,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    fhir_location_id VARCHAR(50),
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

-- 4. Master Buildings (Gedung Perawatan)
CREATE TABLE IF NOT EXISTS master_buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES master_facilities(id) ON DELETE CASCADE,
    code VARCHAR(30) UNIQUE,
    name VARCHAR(100),
    total_floors INT NOT NULL DEFAULT 5,
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
ALTER TABLE master_buildings ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES master_facilities(id) ON DELETE CASCADE;
ALTER TABLE master_buildings ADD COLUMN IF NOT EXISTS code VARCHAR(30);
ALTER TABLE master_buildings ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE master_buildings ADD COLUMN IF NOT EXISTS total_floors INT NOT NULL DEFAULT 5;
ALTER TABLE master_buildings ADD COLUMN IF NOT EXISTS status status_enum NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE master_buildings ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE master_buildings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- 5. Master Floors (Lantai Gedung)
CREATE TABLE IF NOT EXISTS master_floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES master_buildings(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    name VARCHAR(100),
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
ALTER TABLE master_floors ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE master_floors ADD COLUMN IF NOT EXISTS status status_enum NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE master_floors ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE master_floors ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- 6. Master Wards (Bangsal Rawat Inap)
CREATE TABLE IF NOT EXISTS master_wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_id UUID NOT NULL REFERENCES master_floors(id) ON DELETE CASCADE,
    code VARCHAR(30),
    name VARCHAR(100),
    ward_class VARCHAR(50),
    gender_restriction VARCHAR(20) NOT NULL DEFAULT 'NONE',
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
ALTER TABLE master_wards ADD COLUMN IF NOT EXISTS code VARCHAR(30);
ALTER TABLE master_wards ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE master_wards ADD COLUMN IF NOT EXISTS ward_class VARCHAR(50);
ALTER TABLE master_wards ADD COLUMN IF NOT EXISTS gender_restriction VARCHAR(20) NOT NULL DEFAULT 'NONE';
ALTER TABLE master_wards ADD COLUMN IF NOT EXISTS status status_enum NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE master_wards ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE master_wards ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- 7. Master Room Types (Shared Global)
CREATE TABLE IF NOT EXISTS master_room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    bpjs_class_equivalent VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Master Rooms (Kamar Rawat Inap)
CREATE TABLE IF NOT EXISTS master_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id UUID NOT NULL REFERENCES master_wards(id) ON DELETE CASCADE,
    room_type_id UUID NOT NULL REFERENCES master_room_types(id),
    room_number VARCHAR(30) NOT NULL,
    has_negative_pressure BOOLEAN NOT NULL DEFAULT FALSE,
    has_central_oxygen BOOLEAN NOT NULL DEFAULT TRUE,
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL,
    CONSTRAINT uq_ward_room UNIQUE(ward_id, room_number)
);

-- 9. Master Bed Types (Shared Global)
CREATE TABLE IF NOT EXISTS master_bed_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_intensive BOOLEAN NOT NULL DEFAULT FALSE,
    is_isolation BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 10. Master Beds (Definisi Fisik Tempat Tidur — Tanpa Status Dinamis Transaksional)
CREATE TABLE IF NOT EXISTS master_beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES master_rooms(id) ON DELETE RESTRICT,
    bed_type_id UUID NOT NULL REFERENCES master_bed_types(id),
    bed_code VARCHAR(30) NOT NULL,
    fhir_bed_id VARCHAR(50),
    has_ventilator BOOLEAN NOT NULL DEFAULT FALSE,
    has_multiparameter_monitor BOOLEAN NOT NULL DEFAULT FALSE,
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL,
    CONSTRAINT uq_room_bed UNIQUE(room_id, bed_code)
);

-- Indexes for Spatial Hierarchy
CREATE INDEX IF NOT EXISTS idx_org_tenant ON master_organizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fac_org ON master_facilities(organization_id);
CREATE INDEX IF NOT EXISTS idx_bld_fac ON master_buildings(facility_id);
CREATE INDEX IF NOT EXISTS idx_flr_bld ON master_floors(building_id);
CREATE INDEX IF NOT EXISTS idx_wrd_flr ON master_wards(floor_id);
CREATE INDEX IF NOT EXISTS idx_rm_wrd ON master_rooms(ward_id);
CREATE INDEX IF NOT EXISTS idx_bd_rm ON master_beds(room_id);
