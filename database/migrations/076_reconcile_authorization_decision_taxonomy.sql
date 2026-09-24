-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 076: Reconcile Authorization Decision Taxonomy
-- Standards: ISO 27001 Multi-Tenancy Isolation, JCI MOI / KARS & NIST SP 800-162 ABAC
-- Features: Synchronize clinical_authorization_logs.authorization_decision check constraint
--           with Canonical Decision Contract (including Break-The-Glass and Resource Decisions).
-- ==============================================================================

ALTER TABLE clinical_authorization_logs DROP CONSTRAINT IF EXISTS chk_clinical_auth_decision;

ALTER TABLE clinical_authorization_logs ADD CONSTRAINT chk_clinical_auth_decision 
    CHECK (authorization_decision IN (
        -- Canonical Clinical Authorization Grants
        'AUTHORIZED',
        'AUTHORIZED_BREAK_THE_GLASS',

        -- Context, Identity & Tenant Denials
        'DENIED_AUTHENTICATION_REQUIRED',
        'DENIED_TENANT_MISSING',
        'DENIED_TENANT_MISMATCH',
        'DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION',
        'DENIED_PERMISSION_MISSING',

        -- Licensure & Credential Denials (STR/SIP)
        'DENIED_CREDENTIAL_MISSING',
        'DENIED_CREDENTIAL_EXPIRED',
        'DENIED_CREDENTIAL_REVOKED',

        -- Clinical Privileging & Staff Status (SPK/RKK)
        'DENIED_STAFF_INACTIVE',
        'DENIED_NO_PRIVILEGE',
        'DENIED_PRIVILEGE_EXPIRED',
        'DENIED_WRONG_UNIT',
        'DENIED_NOT_ON_DUTY',

        -- Resource & Relationship Denials
        'DENIED_NOT_ATTENDING_PROVIDER',
        'DENIED_RESOURCE_NOT_FOUND',

        -- Dual-Control Separation of Duties (SoD)
        'DENIED_SEPARATION_OF_DUTIES',

        -- Break-The-Glass Protocol Denials
        'DENIED_BTG_UNAUTHORIZED',
        'DENIED_BTG_INVALID_REASON',

        -- Reserved Policy Decisions
        'DENIED_ROLE_FORBIDDEN',
        'DENIED_SESSION_INVALIDATED',

        -- System Errors Caught in Boundary
        'DENIED_SYSTEM_ERROR'
    ));
