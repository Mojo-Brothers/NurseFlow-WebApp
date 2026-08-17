-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 012: Pharmacy Multi-Warehouse, Inventory Ledger & FEFO
-- Standar: CDOB (Good Distribution Practice), JCI MMU (Medication Management & Use) & Kemenkes KFA
-- Features: Anti-Negative Stock, Strict FEFO Expiry Sorting, Immutable Stock Ledger & Multi-Depot
-- ==============================================================================

-- ─── 1. PHARMACY WAREHOUSES (GUDANG & DEPO FARMASI) ───
CREATE TABLE IF NOT EXISTS pharmacy_warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    warehouse_code VARCHAR(30) NOT NULL,
    warehouse_name VARCHAR(100) NOT NULL,
    warehouse_type VARCHAR(30) NOT NULL DEFAULT 'DEPO' 
        CHECK (warehouse_type IN ('MAIN_WAREHOUSE', 'CENTRAL_PHARMACY', 'INPATIENT_DEPO', 'OUTPATIENT_DEPO', 'EMERGENCY_DEPO', 'ICU_DEPO', 'OK_DEPO')),
    location_description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_warehouse_tenant_code UNIQUE (tenant_id, warehouse_code)
);

CREATE INDEX IF NOT EXISTS idx_warehouses_tenant ON pharmacy_warehouses(tenant_id);

-- ─── 2. MEDICATION CATALOG (MASTER FORMULARIUM OBAT & ALKES) ───
CREATE TABLE IF NOT EXISTS medication_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage_form VARCHAR(50) NOT NULL,
    strength VARCHAR(50),
    package_unit VARCHAR(30) NOT NULL,
    dispense_unit VARCHAR(30) NOT NULL,
    conversion_factor INT NOT NULL DEFAULT 1 CHECK (conversion_factor > 0),
    kfa_code VARCHAR(50),
    is_high_alert BOOLEAN NOT NULL DEFAULT FALSE,
    is_lasa BOOLEAN NOT NULL DEFAULT FALSE,
    is_narcotic BOOLEAN NOT NULL DEFAULT FALSE,
    is_psychotropic BOOLEAN NOT NULL DEFAULT FALSE,
    is_antibiotic BOOLEAN NOT NULL DEFAULT FALSE,
    min_stock_alert INT NOT NULL DEFAULT 10,
    max_stock_level INT NOT NULL DEFAULT 1000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_medication_tenant_code UNIQUE (tenant_id, item_code)
);

CREATE INDEX IF NOT EXISTS idx_med_catalog_tenant ON medication_catalog(tenant_id);
CREATE INDEX IF NOT EXISTS idx_med_catalog_kfa ON medication_catalog(kfa_code) WHERE kfa_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_med_catalog_high_alert ON medication_catalog(tenant_id, is_high_alert) WHERE is_high_alert = TRUE;

-- ─── 3. INVENTORY BATCHES (BATCH/LOT SALDO DENGAN EXPIRY & ANTI-NEGATIVE CONSTRAINT) ───
CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES pharmacy_warehouses(id) ON DELETE RESTRICT,
    medication_id UUID NOT NULL REFERENCES medication_catalog(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    initial_quantity INT NOT NULL CHECK (initial_quantity >= 0),
    available_quantity INT NOT NULL CHECK (available_quantity >= 0), -- DATABASE ANTI-NEGATIVE STOCK BARRIER
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    unit_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0.00),
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0.00),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_batch_warehouse_med UNIQUE (warehouse_id, medication_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_batches_tenant ON inventory_batches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_batches_fefo ON inventory_batches(warehouse_id, medication_id, expiry_date ASC, available_quantity) WHERE available_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_batches_medication ON inventory_batches(medication_id);

-- ─── 4. INVENTORY STOCK MOVEMENTS (IMMUTABLE STOCK LEDGER) ───
CREATE TABLE IF NOT EXISTS inventory_stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    movement_number VARCHAR(30) UNIQUE NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES pharmacy_warehouses(id) ON DELETE RESTRICT,
    medication_id UUID NOT NULL REFERENCES medication_catalog(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES inventory_batches(id) ON DELETE RESTRICT,
    movement_type VARCHAR(30) NOT NULL 
        CHECK (movement_type IN ('PURCHASE_RECEIPT', 'INTERNAL_TRANSFER_IN', 'INTERNAL_TRANSFER_OUT', 'PRESCRIPTION_DISPENSE', 'PATIENT_RETURN', 'EXPIRED_DISPOSAL', 'DAMAGED_WRITE_OFF', 'STOCK_OPNAME_ADJUSTMENT')),
    quantity_delta INT NOT NULL,
    balance_before INT NOT NULL CHECK (balance_before >= 0),
    balance_after INT NOT NULL CHECK (balance_after >= 0),
    unit_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    reference_doc_type VARCHAR(50),
    reference_doc_id VARCHAR(100),
    encounter_id UUID REFERENCES encounters(id),
    patient_id UUID REFERENCES master_patients(id),
    performed_by_id VARCHAR(50) NOT NULL,
    performed_by_name VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movements_tenant ON inventory_stock_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_movements_batch ON inventory_stock_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_movements_medication ON inventory_stock_movements(medication_id);
CREATE INDEX IF NOT EXISTS idx_movements_encounter ON inventory_stock_movements(encounter_id) WHERE encounter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movements_type_created ON inventory_stock_movements(tenant_id, movement_type, created_at);

-- ─── 5. PRESCRIPTION DISPENSE RECORDS (FEFO BATCH ALLOCATION DETAIL) ───
CREATE TABLE IF NOT EXISTS prescription_dispense_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    dispense_number VARCHAR(30) UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES clinical_orders(id) ON DELETE RESTRICT,
    medication_order_id UUID NOT NULL REFERENCES medication_orders(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES pharmacy_warehouses(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES inventory_batches(id) ON DELETE RESTRICT,
    quantity_dispensed INT NOT NULL CHECK (quantity_dispensed > 0),
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    pharmacist_id VARCHAR(50) NOT NULL,
    pharmacist_name VARCHAR(100) NOT NULL,
    verified_by_name VARCHAR(100),
    idempotency_key VARCHAR(100),
    dispensed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_dispense_idempotency ON prescription_dispense_records(tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dispense_tenant ON prescription_dispense_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dispense_order ON prescription_dispense_records(order_id);
CREATE INDEX IF NOT EXISTS idx_dispense_med_order ON prescription_dispense_records(medication_order_id);
CREATE INDEX IF NOT EXISTS idx_dispense_encounter ON prescription_dispense_records(encounter_id);
CREATE INDEX IF NOT EXISTS idx_dispense_batch ON prescription_dispense_records(batch_id);

-- ─── 6. PHYSICAL ROW-LEVEL SECURITY (RLS) FOR PHARMACY & INVENTORY ───
DO $$
DECLARE
    tbl TEXT;
    pharmacy_tables TEXT[] := ARRAY[
        'pharmacy_warehouses',
        'medication_catalog',
        'inventory_batches',
        'inventory_stock_movements',
        'prescription_dispense_records'
    ];
BEGIN
    FOREACH tbl IN ARRAY pharmacy_tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING (tenant_id = current_app_tenant_id()) WITH CHECK (tenant_id = current_app_tenant_id());', tbl);
    END LOOP;
END $$;
