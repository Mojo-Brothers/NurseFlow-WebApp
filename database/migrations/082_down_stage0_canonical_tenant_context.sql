-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Stage 0 Migration 082 Rollback
-- Migration ID: 082_down_stage0_canonical_tenant_context.sql
-- 
-- NOTICE: Reverting public.current_app_tenant_id() to read legacy 'app.tenant_id'
-- reintroduces the dual-GUC architectural split across the database catalog.
-- GOVERNANCE: ROLLBACK_REQUIRES_CONTROLLED_SECURITY_REMEDIATION.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.current_app_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;
END;
$$;
