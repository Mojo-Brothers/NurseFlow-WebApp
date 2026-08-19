-- ============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 035
-- FHIR Reliable Delivery Outbox & Dead Letter Queue (DLQ) Schema
-- Standards: Transactional Outbox Pattern, At-Least-Once Delivery + Idempotency,
-- Dependency Graph Ordering, PostgreSQL 16 Force RLS.
-- ============================================================================

CREATE TABLE IF NOT EXISTS fhir_delivery_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(64) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    parent_resource_type VARCHAR(50),
    parent_resource_id VARCHAR(100),
    dependency_depth INT NOT NULL DEFAULT 0,
    payload JSONB NOT NULL,
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' 
        CHECK (delivery_status IN ('PENDING', 'IN_FLIGHT', 'DELIVERED', 'RETRYING', 'DEAD_LETTER_QUEUE')),
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_error_code VARCHAR(50),
    last_error_message TEXT,
    last_error_classification VARCHAR(30) 
        CHECK (last_error_classification IN ('TRANSIENT', 'PERMANENT', 'NONE')),
    transmitted_satusehat_id VARCHAR(100),
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_fhir_outbox_tenant_idempotency UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_fhir_outbox_dispatch 
    ON fhir_delivery_outbox(tenant_id, delivery_status, next_retry_at, dependency_depth);

CREATE INDEX IF NOT EXISTS idx_fhir_outbox_parent 
    ON fhir_delivery_outbox(tenant_id, parent_resource_type, parent_resource_id, delivery_status);

-- Enable & Force Row-Level Security
ALTER TABLE fhir_delivery_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_delivery_outbox FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fhir_delivery_outbox_isolation_policy ON fhir_delivery_outbox;
CREATE POLICY fhir_delivery_outbox_isolation_policy ON fhir_delivery_outbox
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- Grant permissions to non-superuser application role
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nurseflow_app_user') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON fhir_delivery_outbox TO nurseflow_app_user;
    END IF;
END $$;
