-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Stage 0 Migration 082
-- Migration ID: 082_stage0_canonical_tenant_context.sql
-- Phase: P0-2B Wave 1B.0T (Canonical Tenant Context & Migration Authority Hardening)
-- 
-- Objectives:
-- 1. Unify tenant-context resolution across catalog to canonical 'app.current_tenant_id'.
-- 2. Harden public.current_app_tenant_id() with STABLE, PARALLEL SAFE, SECURITY INVOKER.
-- 3. Lock search_path strictly to 'pg_catalog, public'.
-- 4. Fail-closed: return NULL on missing GUC, empty string, or malformed UUID.
-- 5. Zero hardcoded UUIDs, zero default tenants, zero fallback tenants.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.current_app_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN NULL;
    WHEN others THEN
        RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.current_app_tenant_id() IS 
'Canonical tenant context resolver for PostgreSQL RLS policies. Reads transaction-scoped app.current_tenant_id GUC. Fails closed to NULL on missing, empty, or invalid input.';
