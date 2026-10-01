-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Rollback Migration 081
-- Stage 0 Security Containment: Rollback Policy Normalization
-- GOVERNANCE WARNING: Rolling back this migration re-creates duplicate permissive
-- policies and re-introduces the dual-GUC conflict on operating_theatres and radiology_orders.
-- CLASSIFICATION: ROLLBACK_REQUIRES_CONTROLLED_SECURITY_REMEDIATION
-- ==============================================================================

DO $$
BEGIN
  -- 1. Restore Dual-GUC Conflict Policies (re-attaches current_app_tenant_id())
  CREATE POLICY tenant_isolation_policy ON operating_theatres
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = current_app_tenant_id())
    WITH CHECK (tenant_id = current_app_tenant_id());

  CREATE POLICY tenant_isolation_policy ON radiology_orders
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = current_app_tenant_id())
    WITH CHECK (tenant_id = current_app_tenant_id());

  -- 2. Restore Overlapping Policies on master_inacbg_tariffs
  CREATE POLICY policy_master_inacbg_tariffs_read ON master_inacbg_tariffs
    AS PERMISSIVE FOR SELECT TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_master_inacbg_tariffs_write ON master_inacbg_tariffs
    AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  -- 3. Restore 20 Redundant policy_* Policies
  CREATE POLICY policy_blood_bank_reconciliation ON blood_bank_billing_reconciliations
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_blood_bedside_verification ON blood_bedside_dual_nurse_verifications
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_bpjs_claim_disputes ON bpjs_claim_disputes
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_bpjs_claim_submissions ON bpjs_claim_submissions
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_bpjs_vclaim_logs ON bpjs_vclaim_lifecycle_logs
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_cssd_sterilization ON cssd_sterilization_cycles
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_hemovigilance_incidents ON hemovigilance_incident_investigations
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_inacbg_grouping ON inacbg_grouping_results
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_implant_recalls ON medical_device_implant_recalls
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_billing_reconciliation ON patient_billing_reconciliation
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_controlled_substance ON pharmacy_controlled_substance_logs
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_pharmacy_depots ON pharmacy_depots
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_dispensing_orders ON pharmacy_dispensing_orders
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_aldrete_scores ON post_anesthesia_aldrete_scores
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_radiology_alerts ON radiology_critical_finding_alerts
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_radiology_instances ON radiology_instances
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_radiology_series ON radiology_series
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_surgical_notes ON surgical_clinical_notes
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_surgical_teams ON surgical_teams
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  CREATE POLICY policy_who_surgical_checklists ON who_surgical_safety_checklists
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

  RAISE NOTICE 'Rollback 081: Restored legacy duplicate policies. WARNING: Dual-GUC and duplicate catalog state restored.';
END $$;
