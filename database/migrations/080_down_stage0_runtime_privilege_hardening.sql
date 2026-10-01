-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Rollback Migration 080
-- Stage 0 Security Containment: Rollback Runtime Privilege Hardening
-- GOVERNANCE WARNING: Re-granting TRUNCATE privilege restores an insecure state
-- where application role can bypass Row Level Security.
-- CLASSIFICATION: ROLLBACK_REQUIRES_CONTROLLED_SECURITY_REMEDIATION
-- ==============================================================================

DO $$
BEGIN
  -- Re-grant TRUNCATE on all tables in schema public to nurseflow_app_user (restores pre-080 catalog baseline)
  GRANT TRUNCATE ON ALL TABLES IN SCHEMA public TO nurseflow_app_user;

  RAISE NOTICE 'Rollback 080: Re-granted TRUNCATE privilege on public tables to nurseflow_app_user. WARNING: Catalog returned to unhardened privilege baseline.';
END $$;
