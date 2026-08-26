-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 066: Enterprise Idempotency Records
-- FASE 5A.1: Idempotency & Replay Protection Infrastructure
-- Standards: ISO/IEC 27001, JCI IPSG, RFC 7231, PostgreSQL 16 ACID
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS idempotency_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    actor_id VARCHAR(100) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    request_hash VARCHAR(64) NOT NULL, -- SHA-256 of JSON request body
    response_status INT NOT NULL,
    response_body JSONB NOT NULL,
    resource_id VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 HOURS'),
    CONSTRAINT uq_idempotency_tenant_actor_op_key UNIQUE (tenant_id, actor_id, operation, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_lookup 
ON idempotency_records(tenant_id, actor_id, operation, idempotency_key);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires 
ON idempotency_records(expires_at);
