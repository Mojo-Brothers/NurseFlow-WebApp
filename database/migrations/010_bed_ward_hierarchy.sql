-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 010: Bed & Ward Hierarchy Persistence
-- Standar: Permenkes No. 24/2022, JCI IPSG 1 & HL7 ADT Message Specifications
-- Features: Buildings, Floors, Wards, Rooms, Beds, Concurrency-Safe Occupancies & Transfers
-- ==============================================================================

-- ─── 1. MASTER BUILDINGS ───
CREATE TABLE IF NOT EXISTS master_buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    building_code VARCHAR(30) NOT NULL,
    building_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_building_tenant_code UNIQUE (tenant_id, building_code)
);

CREATE INDEX IF NOT EXISTS idx_buildings_tenant ON master_buildings(tenant_id);

-- ─── 2. MASTER FLOORS ───
CREATE TABLE IF NOT EXISTS master_floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    building_id UUID NOT NULL REFERENCES master_buildings(id) ON DELETE RESTRICT,
    floor_number INT NOT NULL,
    floor_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_floor_building_number UNIQUE (building_id, floor_number)
);

CREATE INDEX IF NOT EXISTS idx_floors_tenant ON master_floors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_floors_building ON master_floors(building_id);

-- ─── 3. MASTER WARDS ───
CREATE TABLE IF NOT EXISTS master_wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    floor_id UUID NOT NULL REFERENCES master_floors(id) ON DELETE RESTRICT,
    ward_code VARCHAR(30) NOT NULL,
    ward_name VARCHAR(100) NOT NULL,
    ward_class VARCHAR(30) NOT NULL CHECK (ward_class IN ('VVIP', 'VIP', 'KELAS_1', 'KELAS_2', 'KELAS_3', 'ICU', 'NICU', 'PICU', 'HCU', 'ISOLASI', 'IGD')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_ward_tenant_code UNIQUE (tenant_id, ward_code)
);

CREATE INDEX IF NOT EXISTS idx_wards_tenant ON master_wards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wards_floor ON master_wards(floor_id);

-- ─── 4. MASTER ROOMS ───
CREATE TABLE IF NOT EXISTS master_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    ward_id UUID NOT NULL REFERENCES master_wards(id) ON DELETE RESTRICT,
    room_number VARCHAR(30) NOT NULL,
    gender_type VARCHAR(10) DEFAULT 'ALL' CHECK (gender_type IN ('MALE', 'FEMALE', 'ISOLATION', 'ALL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_room_ward_number UNIQUE (ward_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_rooms_tenant ON master_rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rooms_ward ON master_rooms(ward_id);

-- ─── 5. MASTER BEDS (WITH OPTIMISTIC CONCURRENCY CONTROL) ───
CREATE TABLE IF NOT EXISTS master_beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    room_id UUID NOT NULL REFERENCES master_rooms(id) ON DELETE RESTRICT,
    bed_number VARCHAR(30) NOT NULL,
    bed_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' CHECK (bed_status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE', 'BLOCKED', 'ISOLATION')),
    daily_tariff DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (daily_tariff >= 0.00),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_bed_room_number UNIQUE (room_id, bed_number)
);

CREATE INDEX IF NOT EXISTS idx_beds_tenant ON master_beds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_beds_room ON master_beds(room_id);
CREATE INDEX IF NOT EXISTS idx_beds_tenant_status ON master_beds(tenant_id, bed_status);

-- ─── 6. BED OCCUPANCIES (MUTEX LOCK: 1 BED = 1 ACTIVE OCCUPANCY & 1 ENCOUNTER = 1 ACTIVE OCCUPANCY) ───
CREATE TABLE IF NOT EXISTS bed_occupancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    bed_id UUID NOT NULL REFERENCES master_beds(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    occupancy_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (occupancy_status IN ('ACTIVE', 'TRANSFERRED', 'DISCHARGED', 'CANCELLED', 'TEMPORARY_LEAVE')),
    discharge_type VARCHAR(50),
    admitting_doctor_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIAL UNIQUE INDEXES FOR BED MUTEX INTEGRITY
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_bed_occupancy ON bed_occupancies(tenant_id, bed_id) WHERE check_out_time IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_encounter_occupancy ON bed_occupancies(tenant_id, encounter_id) WHERE check_out_time IS NULL;

CREATE INDEX IF NOT EXISTS idx_occupancies_tenant ON bed_occupancies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_occupancies_patient ON bed_occupancies(patient_id);
CREATE INDEX IF NOT EXISTS idx_occupancies_encounter ON bed_occupancies(encounter_id);
CREATE INDEX IF NOT EXISTS idx_occupancies_bed ON bed_occupancies(bed_id);

-- ─── 7. BED TRANSFERS (IMMUTABLE AUDIT LOG OF ADT TRANSFERS) ───
CREATE TABLE IF NOT EXISTS bed_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    from_bed_id UUID NOT NULL REFERENCES master_beds(id) ON DELETE RESTRICT,
    to_bed_id UUID NOT NULL REFERENCES master_beds(id) ON DELETE RESTRICT,
    transfer_reason TEXT NOT NULL,
    transferred_by VARCHAR(100) NOT NULL,
    transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_bed_transfer_distinct CHECK (from_bed_id <> to_bed_id)
);

CREATE INDEX IF NOT EXISTS idx_transfers_tenant ON bed_transfers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfers_encounter ON bed_transfers(encounter_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_bed ON bed_transfers(from_bed_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_bed ON bed_transfers(to_bed_id);

-- ─── 8. PHYSICAL ROW-LEVEL SECURITY (RLS) FOR BED HIERARCHY ───
DO $$
DECLARE
    tbl TEXT;
    bed_tables TEXT[] := ARRAY[
        'master_buildings',
        'master_floors',
        'master_wards',
        'master_rooms',
        'master_beds',
        'bed_occupancies',
        'bed_transfers'
    ];
BEGIN
    FOREACH tbl IN ARRAY bed_tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING (tenant_id = current_app_tenant_id()) WITH CHECK (tenant_id = current_app_tenant_id());', tbl);
    END LOOP;
END $$;
