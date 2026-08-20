-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 051: Universal CPOE Transaction Core
-- Sprint 5A / Step 1: Master Clinical Ordering Backbone & Durability Architecture
-- Standards: JCI 7th Edition (MMU.4, IPSG.1-2), HL7 v2 / FHIR ServiceRequest,
-- PostgreSQL 16 ACID Transactions, Idempotency Guard, Transactional Outbox.
-- ==============================================================================

-- 1. Enhance clinical_orders table with enterprise transaction fields
DO $$
BEGIN
    -- Idempotency key for duplicate prevention
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_orders' AND column_name = 'idempotency_key') THEN
        ALTER TABLE clinical_orders ADD COLUMN idempotency_key VARCHAR(64);
        ALTER TABLE clinical_orders ADD CONSTRAINT uq_clinical_orders_idempotency UNIQUE (idempotency_key);
    END IF;

    -- Optimistic concurrency version
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_orders' AND column_name = 'version') THEN
        ALTER TABLE clinical_orders ADD COLUMN version INT DEFAULT 1;
    END IF;

    -- Authenticated Doctor Requester Metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_orders' AND column_name = 'requester_id') THEN
        ALTER TABLE clinical_orders ADD COLUMN requester_id VARCHAR(100);
        ALTER TABLE clinical_orders ADD COLUMN requester_name VARCHAR(255);
        ALTER TABLE clinical_orders ADD COLUMN requester_role VARCHAR(100);
    END IF;

    -- Cancellation & Discontinuation Provenance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_orders' AND column_name = 'cancelled_by') THEN
        ALTER TABLE clinical_orders ADD COLUMN cancelled_by VARCHAR(100);
        ALTER TABLE clinical_orders ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE clinical_orders ADD COLUMN cancellation_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_orders' AND column_name = 'discontinued_by') THEN
        ALTER TABLE clinical_orders ADD COLUMN discontinued_by VARCHAR(100);
        ALTER TABLE clinical_orders ADD COLUMN discontinued_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE clinical_orders ADD COLUMN discontinuation_reason TEXT;
    END IF;

    -- Target Performer Department
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_orders' AND column_name = 'target_performer_dept') THEN
        ALTER TABLE clinical_orders ADD COLUMN target_performer_dept VARCHAR(50);
    END IF;

    -- Correlation / Distributed Trace ID
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_orders' AND column_name = 'correlation_id') THEN
        ALTER TABLE clinical_orders ADD COLUMN correlation_id VARCHAR(100);
    END IF;
END $$;

-- 2. Create Universal CPOE Order Items Table
CREATE TABLE IF NOT EXISTS cpoe_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES clinical_orders(id) ON DELETE CASCADE,
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('MEDICATION', 'LABORATORY', 'RADIOLOGY', 'PROCEDURE', 'NURSING_CARE', 'DIET')),
    catalog_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_specifications JSONB DEFAULT '{}',
    quantity DECIMAL(10,2) DEFAULT 1.00 CHECK (quantity > 0),
    unit VARCHAR(50),
    unit_price DECIMAL(15,2) DEFAULT 0.00 CHECK (unit_price >= 0),
    total_price DECIMAL(15,2) DEFAULT 0.00 CHECK (total_price >= 0),
    priority VARCHAR(20) DEFAULT 'ROUTINE' CHECK (priority IN ('ROUTINE', 'URGENT', 'CITO', 'STAT')),
    status VARCHAR(30) DEFAULT 'ORDERED' CHECK (status IN ('ORDERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISCONTINUED')),
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Clinical Domain Outbox for Transactional Outbox Pattern
CREATE TABLE IF NOT EXISTS clinical_domain_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_type VARCHAR(50) NOT NULL DEFAULT 'CPOE_ORDER',
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_payload JSONB NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_FLIGHT', 'PUBLISHED', 'FAILED', 'DEAD_LETTER_QUEUE')),
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 5,
    idempotency_key VARCHAR(64),
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_cpoe_items_order ON cpoe_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cpoe_items_type ON cpoe_order_items(item_type);
CREATE INDEX IF NOT EXISTS idx_cpoe_items_status ON cpoe_order_items(status);
CREATE INDEX IF NOT EXISTS idx_clinical_orders_idem ON clinical_orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_clinical_orders_enc ON clinical_orders(encounter_id);
CREATE INDEX IF NOT EXISTS idx_cpoe_outbox_dispatch ON clinical_domain_outbox(status, created_at);
