-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 079
-- Stage 0 Security Foundation: Purge Fail-Open Policies & Enforce Restrictive Default-Deny RLS
-- Standards: ISO/IEC 27001 Multi-Tenancy Data Isolation, HIPAA Technical Safeguards
-- ==============================================================================

DO $$
DECLARE
  tbl text;
  -- 1. Tables replacing legacy fail-open policies + parent & child clinical tables
  core_tables text[] := ARRAY[
    'clinical_orders',
    'encounters',
    'master_patients',
    'safety_decision_registry',
    'universal_audit_logs',
    'longitudinal_care_plans',
    'medication_emar_administrations',
    'medication_dispense_allocations',
    'patient_split_invoices',
    'physician_diagnostic_interpretations'
  ];

  -- 2. The 21 zero-policy tables previously in blackout state
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

  all_tables text[];
BEGIN
  -- 1. Purge the 5 known legacy fail-open policies
  DROP POLICY IF EXISTS tenant_isolation_orders ON clinical_orders;
  DROP POLICY IF EXISTS tenant_isolation_encounters ON encounters;
  DROP POLICY IF EXISTS tenant_isolation_patients ON master_patients;
  DROP POLICY IF EXISTS tenant_safety_isolation_policy ON safety_decision_registry;
  DROP POLICY IF EXISTS tenant_audit_isolation_policy ON universal_audit_logs;
  RAISE NOTICE 'Migration 079: Purged 5 legacy fail-open policies successfully';

  all_tables := core_tables || zero_policy_tables;

  -- 2. Enforce strict RESTRICTIVE default-deny policies on all target tables
  FOREACH tbl IN ARRAY all_tables LOOP
    -- Ensure RLS is enabled and forced
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);

    -- Drop existing restrictive policy if already defined
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'tenant_isolation_' || tbl, tbl);

    -- Create PERMISSIVE default-deny policy enforcing authoritative tenant GUC context
    EXECUTE format('
      CREATE POLICY %I ON %I
        AS PERMISSIVE
        FOR ALL
        TO public
        USING (
          tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid
        )
        WITH CHECK (
          tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid
        )
    ', 'tenant_isolation_' || tbl, tbl);

    RAISE NOTICE 'Migration 079: Enforced default-deny RLS on %', tbl;
  END LOOP;
END $$;
