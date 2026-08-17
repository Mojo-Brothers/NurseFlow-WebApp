-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 034: 2-Tier Lightweight Forensic Audit Engine
-- Standards: JCI Information Governance (MOI), ISO 27001 & Cryptographic Append-Only Chaining
-- ==============================================================================

-- 1. Audit Logs (Tier 1 — Fast Tabular Audit Engine)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES master_tenants(id) ON DELETE RESTRICT,
    entity_name VARCHAR(100) NOT NULL,
    entity_primary_key TEXT NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'OVERRIDE', 'LOGIN', 'LOGOUT', 'SECURITY_BREACH', 'BREAK_THE_GLASS')),
    performed_by_user_id UUID NULL REFERENCES auth_users(id),
    performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(50) NOT NULL,
    session_id VARCHAR(100) NULL,
    reason_for_action TEXT NULL,
    has_snapshot BOOLEAN NOT NULL DEFAULT FALSE,
    signature_hash CHAR(64) NOT NULL,
    previous_log_hash CHAR(64) NULL
);

-- 2. Audit Snapshots (Tier 2 — Detailed Delta JSONB Storage)
CREATE TABLE IF NOT EXISTS audit_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_log_id UUID UNIQUE NOT NULL REFERENCES audit_logs(id) ON DELETE CASCADE,
    before_snapshot JSONB NULL,
    after_snapshot JSONB NULL,
    diff_summary JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Strict Immutable Trigger for audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'JCI AUDIT INTEGRITY VIOLATION: audit_logs is strictly append-only and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_audit_logs ON audit_logs;
CREATE TRIGGER trg_immutable_audit_logs
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- Strict Immutable Trigger for audit_snapshots
DROP TRIGGER IF EXISTS trg_immutable_audit_snapshots ON audit_snapshots;
CREATE TRIGGER trg_immutable_audit_snapshots
BEFORE UPDATE OR DELETE ON audit_snapshots
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- High-Efficiency Audit Indexing
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_name, entity_primary_key);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id);
