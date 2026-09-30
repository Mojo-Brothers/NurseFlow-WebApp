-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Rollback Migration 079
-- Stage 0 Security Foundation: Rollback Default-Deny RLS Policies
-- Fixes MED-04: Prevents unrecoverable RLS blackout state on rollback
-- ==============================================================================

DO $$
DECLARE
  tbl text;
  -- The 21 tables that had no RLS policies prior to migration 079
  zero_policy_tables text[] := ARRAY[
    'blood_bank_billing_reconciliations',
    'blood_bedside_dual_nurse_verifications',
    'bpjs_claim_disputes',
    'bpjs_claim_submissions',
    'bpjs_vclaim_lifecycle_logs',
    'cssd_sterilization_cycles',
    'hemovigilance_incident_investigations',
    'inacbg_grouping_results',
    'master_inacbg_tariffs',
    'medical_device_implant_recalls',
    'patient_billing_reconciliation',
    'pharmacy_controlled_substance_logs',
    'pharmacy_depots',
    'pharmacy_dispensing_orders',
    'post_anesthesia_aldrete_scores',
    'radiology_critical_finding_alerts',
    'radiology_instances',
    'radiology_series',
    'surgical_clinical_notes',
    'surgical_teams',
    'who_surgical_safety_checklists'
  ];

  -- The 5 child clinical tables introduced in Wave 1A.9 / migration 078
  child_tables text[] := ARRAY[
    'longitudinal_care_plans',
    'medication_emar_administrations',
    'medication_dispense_allocations',
    'patient_split_invoices',
    'physician_diagnostic_interpretations'
  ];

  -- The 5 core clinical tables that had legacy policies prior to migration 079
  core_tables text[] := ARRAY[
    'clinical_orders',
    'encounters',
    'master_patients',
    'safety_decision_registry',
    'universal_audit_logs'
  ];

  all_tables text[];
BEGIN
  all_tables := core_tables || child_tables || zero_policy_tables;

  -- 1. Drop the unified default-deny policies from all 31 tables
  FOREACH tbl IN ARRAY all_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'tenant_isolation_' || tbl, tbl);
  END LOOP;

  -- 2. Disable RLS and remove FORCE RLS on the 21 zero-policy tables and 5 child tables
  -- This restores them to their pre-079 unconstrained baseline and avoids default-deny blackout
  FOREACH tbl IN ARRAY zero_policy_tables || child_tables LOOP
    EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl);
    RAISE NOTICE 'Rollback 079: Disabled RLS and removed FORCE RLS on %', tbl;
  END LOOP;

  -- 3. Restore the 5 pre-079 baseline policies on core clinical tables
  -- clinical_orders
  EXECUTE '
    CREATE POLICY tenant_isolation_orders ON clinical_orders
      AS PERMISSIVE FOR ALL TO public
      USING (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid OR tenant_id IS NULL)
      WITH CHECK (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid OR tenant_id IS NULL);
  ';

  -- encounters
  EXECUTE '
    CREATE POLICY tenant_isolation_encounters ON encounters
      AS PERMISSIVE FOR ALL TO public
      USING (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid OR tenant_id IS NULL)
      WITH CHECK (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid OR tenant_id IS NULL);
  ';

  -- master_patients
  EXECUTE '
    CREATE POLICY tenant_isolation_patients ON master_patients
      AS PERMISSIVE FOR ALL TO public
      USING (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid OR tenant_id IS NULL)
      WITH CHECK (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid OR tenant_id IS NULL);
  ';

  -- safety_decision_registry
  EXECUTE '
    CREATE POLICY tenant_safety_isolation_policy ON safety_decision_registry
      AS PERMISSIVE FOR ALL TO public
      USING (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid OR tenant_id IS NULL)
      WITH CHECK (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid OR tenant_id IS NULL);
  ';

  -- universal_audit_logs
  EXECUTE '
    CREATE POLICY tenant_audit_isolation_policy ON universal_audit_logs
      AS PERMISSIVE FOR ALL TO public
      USING (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid OR tenant_id IS NULL)
      WITH CHECK (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid OR tenant_id IS NULL);
  ';

  RAISE NOTICE 'Rollback 079: Restored pre-079 baseline policies on core tables successfully.';
END $$;
