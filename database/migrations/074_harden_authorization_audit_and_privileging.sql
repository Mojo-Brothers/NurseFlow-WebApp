-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 074: Authorization Audit & Privileging Hardening
-- Standards: ISO 27001 Multi-Tenancy Isolation, JCI MOI / KARS KPS & NIST SP 800-162 ABAC
-- Features: Nullable staff_id for Non-Staff/Admin Denials, Expanded Decision Codes,
--           User ID & Action Code Audit Columns, Preserving Backward Compatibility.
-- ==============================================================================

-- 1. Relax staff_id foreign key constraint to NULLABLE for audit logging of non-staff actors
ALTER TABLE clinical_authorization_logs ALTER COLUMN staff_id DROP NOT NULL;

-- 2. Relax procedure_code and target_unit_id to NULLABLE with backward-compatible defaults
ALTER TABLE clinical_authorization_logs ALTER COLUMN procedure_code DROP NOT NULL;
ALTER TABLE clinical_authorization_logs ALTER COLUMN procedure_code SET DEFAULT 'N/A';
ALTER TABLE clinical_authorization_logs ALTER COLUMN target_unit_id DROP NOT NULL;
ALTER TABLE clinical_authorization_logs ALTER COLUMN target_unit_id SET DEFAULT 'GENERAL';

-- 3. Add explicit Actor, Action, Resource, and Correlation Audit Columns
ALTER TABLE clinical_authorization_logs ADD COLUMN IF NOT EXISTS user_id UUID NULL REFERENCES enterprise_users(id) ON DELETE SET NULL;
ALTER TABLE clinical_authorization_logs ADD COLUMN IF NOT EXISTS actor_id VARCHAR(100) NULL;
ALTER TABLE clinical_authorization_logs ADD COLUMN IF NOT EXISTS action_code VARCHAR(100) NULL;
ALTER TABLE clinical_authorization_logs ADD COLUMN IF NOT EXISTS resource_type VARCHAR(100) NULL;
ALTER TABLE clinical_authorization_logs ADD COLUMN IF NOT EXISTS resource_id VARCHAR(100) NULL;
ALTER TABLE clinical_authorization_logs ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(100) NULL;

-- 4. Expand decision column width and update check constraint to comprehensive HIS decision codes
ALTER TABLE clinical_authorization_logs ALTER COLUMN authorization_decision TYPE VARCHAR(100);
ALTER TABLE clinical_authorization_logs DROP CONSTRAINT IF EXISTS clinical_authorization_logs_authorization_decision_check;
ALTER TABLE clinical_authorization_logs DROP CONSTRAINT IF EXISTS chk_clinical_auth_decision;
ALTER TABLE clinical_authorization_logs ADD CONSTRAINT chk_clinical_auth_decision 
    CHECK (authorization_decision IN (
        'AUTHORIZED',
        'DENIED_CREDENTIAL_EXPIRED',
        'DENIED_CREDENTIAL_REVOKED',
        'DENIED_CREDENTIAL_MISSING',
        'DENIED_NO_PRIVILEGE',
        'DENIED_PRIVILEGE_EXPIRED',
        'DENIED_WRONG_UNIT',
        'DENIED_NOT_ON_DUTY',
        'DENIED_STAFF_INACTIVE',
        'DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION',
        'DENIED_TENANT_MISMATCH',
        'DENIED_TENANT_MISSING',
        'DENIED_NOT_ATTENDING_PROVIDER',
        'DENIED_PERMISSION_MISSING',
        'DENIED_ROLE_FORBIDDEN',
        'DENIED_SEPARATION_OF_DUTIES',
        'DENIED_SESSION_INVALIDATED',
        'DENIED_AUTHENTICATION_REQUIRED',
        'DENIED_SYSTEM_ERROR'
    ));

-- 5. Add audit performance indexes
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON clinical_authorization_logs(tenant_id, action_code, evaluated_at);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user ON clinical_authorization_logs(tenant_id, user_id, evaluated_at);
CREATE INDEX IF NOT EXISTS idx_auth_logs_correlation ON clinical_authorization_logs(correlation_id);
