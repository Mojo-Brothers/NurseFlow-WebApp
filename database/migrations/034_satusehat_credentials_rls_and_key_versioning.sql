-- ============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 034
-- SATUSEHAT Credentials Row-Level Security (RLS) & Key Versioning
-- Standards: OAuth 2.0 RFC 6749, NIST SP 800-57, PostgreSQL 16 Force RLS
-- ============================================================================

ALTER TABLE tenant_satusehat_credentials
    ADD COLUMN IF NOT EXISTS key_version VARCHAR(20) NOT NULL DEFAULT 'V1';

-- Enable & Force Row-Level Security
ALTER TABLE tenant_satusehat_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_satusehat_credentials FORCE ROW LEVEL SECURITY;

-- Tenant Isolation Policy
DROP POLICY IF EXISTS tenant_satusehat_credentials_isolation_policy ON tenant_satusehat_credentials;
CREATE POLICY tenant_satusehat_credentials_isolation_policy ON tenant_satusehat_credentials
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- Grant permissions to non-superuser application role
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nurseflow_app_user') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_satusehat_credentials TO nurseflow_app_user;
    END IF;
END $$;
