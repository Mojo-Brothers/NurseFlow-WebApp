-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 080
-- Stage 0 Security Containment: Runtime Application Role Privilege Hardening
-- Standards: ISO/IEC 27001 Principle of Least Privilege, HIPAA § 164.312
-- Target: Revoke unconstrained TRUNCATE privileges from nurseflow_app_user
-- ==============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- 1. Revoke TRUNCATE on all existing tables in schema public from nurseflow_app_user
  -- Preserves SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER permissions.
  REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM nurseflow_app_user;

  -- 2. Ensure future tables created by postgres/migration role do not grant TRUNCATE
  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE ON TABLES FROM nurseflow_app_user;

  RAISE NOTICE 'Migration 080: Successfully revoked TRUNCATE privilege on all public tables from nurseflow_app_user.';
END $$;
