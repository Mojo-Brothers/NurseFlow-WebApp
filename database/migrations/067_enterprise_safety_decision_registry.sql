-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 067: Enterprise Safety Decision Registry & Native E5-F Audit Linkage
-- Standards: JCI 7th Edition (MMU.4, IPSG.1-2), NIST SP 800-92, RFC 8785 JSON Canonicalization
-- ==============================================================================

-- 1. Safety Decision Registry Table (Distributed Single-Use Protection & Tamper Resistance)
CREATE TABLE IF NOT EXISTS safety_decision_registry (
    decision_id VARCHAR(100) PRIMARY KEY,
    tenant_id UUID REFERENCES tenant_organizations(id),
    patient_id VARCHAR(100) NOT NULL,
    encounter_id VARCHAR(100),
    actor_id VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    risk_type VARCHAR(50) NOT NULL,
    justification TEXT NOT NULL CHECK (char_length(justification) >= 5),
    command_hash VARCHAR(64) NOT NULL,
    correlation_id VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'CONSUMED', 'REVOKED', 'EXPIRED')),
    consumed_at TIMESTAMP WITH TIME ZONE,
    consumed_by_actor_id VARCHAR(100),
    consumed_in_tx_id BIGINT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_dec_lookup ON safety_decision_registry(decision_id, status);
CREATE INDEX IF NOT EXISTS idx_safety_dec_patient ON safety_decision_registry(patient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_safety_dec_actor ON safety_decision_registry(actor_id);
CREATE INDEX IF NOT EXISTS idx_safety_dec_correlation ON safety_decision_registry(correlation_id);
CREATE INDEX IF NOT EXISTS idx_safety_dec_tenant ON safety_decision_registry(tenant_id);

-- Enable RLS for Multi-Tenant Isolation
ALTER TABLE safety_decision_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_safety_isolation_policy ON safety_decision_registry;
CREATE POLICY tenant_safety_isolation_policy ON safety_decision_registry
FOR ALL
USING (tenant_id = current_app_tenant_id() OR tenant_id IS NULL OR current_app_tenant_id() IS NULL)
WITH CHECK (tenant_id = current_app_tenant_id() OR current_app_tenant_id() IS NULL);

-- 2. First-Class Physical Audit Columns on Universal Audit Logs
ALTER TABLE universal_audit_logs 
  ADD COLUMN IF NOT EXISTS decision_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_audit_decision_id ON universal_audit_logs(decision_id);
CREATE INDEX IF NOT EXISTS idx_audit_correlation_id ON universal_audit_logs(correlation_id);
