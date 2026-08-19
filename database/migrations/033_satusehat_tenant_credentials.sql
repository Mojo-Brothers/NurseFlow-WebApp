-- ============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 033
-- Multi-Tenant SATUSEHAT OAuth2 Credentials & Token Vault Schema
-- Standards: OAuth 2.0 RFC 6749, NIST SP 800-57, Kemkes SATUSEHAT Security Architecture
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_satusehat_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenant_organizations(id) ON DELETE CASCADE,
    organization_id VARCHAR(50) NOT NULL,
    client_id VARCHAR(100) NOT NULL,
    client_secret_encrypted TEXT NOT NULL,
    secret_iv VARCHAR(32) NOT NULL,
    secret_auth_tag VARCHAR(32) NOT NULL,
    auth_base_url VARCHAR(255) NOT NULL DEFAULT 'https://api-satusehat-stg.dto.kemkes.go.id/oauth2/v1',
    fhir_base_url VARCHAR(255) NOT NULL DEFAULT 'https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1',
    environment VARCHAR(20) NOT NULL DEFAULT 'STAGING' CHECK (environment IN ('DEVELOPMENT', 'STAGING', 'PRODUCTION')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')),
    last_token_refresh_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satusehat_tenant_org ON tenant_satusehat_credentials(tenant_id, organization_id);
