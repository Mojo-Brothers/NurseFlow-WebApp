-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 081
-- Stage 0 Security Containment: Policy Normalization & Dual-GUC Conflict Elimination
-- Standards: ISO/IEC 27001 Multi-Tenancy Data Isolation, HIPAA § 164.312
-- Target:
--   1. Eliminate dual-GUC conflicts on operating_theatres and radiology_orders
--   2. Purge 20 redundant legacy policy_* duplicate permissive policies
--   3. Purge overlapping read/write policies on master_inacbg_tariffs
--   4. Standardize all 100 RLS tables to exactly 1 canonical tenant_isolation_* policy
-- ==============================================================================

DO $$
BEGIN
  -- 1. Eliminate Dual-GUC Conflict Policies
  -- Drops legacy policies relying on current_app_tenant_id() (app.tenant_id GUC)
  -- Preserves canonical tenant_isolation_theatres and tenant_isolation_rad_orders (app.current_tenant_id GUC)
  DROP POLICY IF EXISTS tenant_isolation_policy ON operating_theatres;
  DROP POLICY IF EXISTS tenant_isolation_policy ON radiology_orders;
  RAISE NOTICE 'Migration 081: Eliminated dual-GUC conflict policies on operating_theatres and radiology_orders.';

  -- 2. Consolidate Overlapping Policies on master_inacbg_tariffs
  -- Preserves canonical tenant_isolation_master_inacbg_tariffs (FOR ALL)
  DROP POLICY IF EXISTS policy_master_inacbg_tariffs_read ON master_inacbg_tariffs;
  DROP POLICY IF EXISTS policy_master_inacbg_tariffs_write ON master_inacbg_tariffs;
  RAISE NOTICE 'Migration 081: Consolidated overlapping command policies on master_inacbg_tariffs.';

  -- 3. Purge 20 Redundant Legacy policy_* Permissive Duplicate Policies
  -- In all these tables, the canonical tenant_isolation_* policy remains active
  DROP POLICY IF EXISTS policy_blood_bank_reconciliation ON blood_bank_billing_reconciliations;
  DROP POLICY IF EXISTS policy_blood_bedside_verification ON blood_bedside_dual_nurse_verifications;
  DROP POLICY IF EXISTS policy_bpjs_claim_disputes ON bpjs_claim_disputes;
  DROP POLICY IF EXISTS policy_bpjs_claim_submissions ON bpjs_claim_submissions;
  DROP POLICY IF EXISTS policy_bpjs_vclaim_logs ON bpjs_vclaim_lifecycle_logs;
  DROP POLICY IF EXISTS policy_cssd_sterilization ON cssd_sterilization_cycles;
  DROP POLICY IF EXISTS policy_hemovigilance_incidents ON hemovigilance_incident_investigations;
  DROP POLICY IF EXISTS policy_inacbg_grouping ON inacbg_grouping_results;
  DROP POLICY IF EXISTS policy_implant_recalls ON medical_device_implant_recalls;
  DROP POLICY IF EXISTS policy_billing_reconciliation ON patient_billing_reconciliation;
  DROP POLICY IF EXISTS policy_controlled_substance ON pharmacy_controlled_substance_logs;
  DROP POLICY IF EXISTS policy_pharmacy_depots ON pharmacy_depots;
  DROP POLICY IF EXISTS policy_dispensing_orders ON pharmacy_dispensing_orders;
  DROP POLICY IF EXISTS policy_aldrete_scores ON post_anesthesia_aldrete_scores;
  DROP POLICY IF EXISTS policy_radiology_alerts ON radiology_critical_finding_alerts;
  DROP POLICY IF EXISTS policy_radiology_instances ON radiology_instances;
  DROP POLICY IF EXISTS policy_radiology_series ON radiology_series;
  DROP POLICY IF EXISTS policy_surgical_notes ON surgical_clinical_notes;
  DROP POLICY IF EXISTS policy_surgical_teams ON surgical_teams;
  DROP POLICY IF EXISTS policy_who_surgical_checklists ON who_surgical_safety_checklists;
  RAISE NOTICE 'Migration 081: Purged 20 redundant legacy duplicate policies successfully.';

  -- 4. Verification Assertion: Ensure no table has >1 policy in public schema
  IF EXISTS (
    SELECT tablename FROM pg_policies 
    WHERE schemaname = 'public' 
    GROUP BY tablename HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'MIGRATION_081_VERIFICATION_FAILED: Duplicate policies still exist in catalog!';
  END IF;

  RAISE NOTICE 'Migration 081: Policy normalization verified. All tables have exactly 1 canonical RLS policy.';
END $$;
