# P0-2B Wave 1A.10R — Row Level Security (RLS) & Policy Architecture Audit

**Document Identifier:** `SEC-AUD-P02B-W1A10R-RLS-20260930`  
**Document Type:** Independent Adversarial Row Level Security & Catalog Policy Audit  
**Author Role:** Independent Adversarial Security Auditor  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Target Environment:** `nurseflow_enterprise_his` (PostgreSQL 16.15)  
**Date:** 2026-09-30  
**Status:** **`DATABASE RLS = VERIFIED_FACT` | `FAIL-OPEN POLICIES = PURGED` | `FAIL-CLOSED DEFAULT-DENY = ACTIVE`**

---

## 1. Executive Summary

Wave 1A.10 claimed:
```text
RLS = VERIFIED
```

An exhaustive catalog inspection was conducted across all 31 security-critical tables in `nurseflow_enterprise_his` (comprising 5 legacy fail-open tables, 5 child clinical tables, and 21 zero-policy blackout tables).

**Key Findings:**
1. **Universal RLS Enforcement:** All 31 tables have `rowsecurity = true` and `forcerowsecurity = true` actively set in `pg_tables` / `pg_class`. Table owners are bound by RLS.
2. **Purge of Fail-Open Vulnerabilities:** All 5 legacy fail-open expressions (`IS NULL`, fallback tenant ID, hardcoded UUIDs) have been dropped.
3. **Unified Policy Formula:** Every table enforces a single `AS PERMISSIVE` policy for `ALL` actions to `public`:
   ```sql
   USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
   WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
   ```
4. **Fail-Closed Default Deny:** If `app.current_tenant_id` is missing or empty, `NULLIF` evaluates to `NULL`. The comparison `tenant_id = NULL` evaluates to `UNKNOWN` (`FALSE`), resulting in 0 rows returned for reads and SQLSTATE `42501` for writes.

---

## 2. Comprehensive 31-Table Policy Catalog Matrix

The following table reflects empirical catalog inspection of `pg_policy`, `pg_class`, and `information_schema.columns`:

| # | Table Name | RLS Enabled | FORCE RLS | `tenant_id` NOT NULL | Policy Name | Mode | Cmd | Permissive Scope |
| :-: | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :--- |
| **Core Parent & Clinical Tables** |
| 1 | `clinical_orders` | YES | YES | YES | `tenant_isolation_clinical_orders` | PERMISSIVE | ALL | Strict GUC Match |
| 2 | `encounters` | YES | YES | YES | `tenant_isolation_encounters` | PERMISSIVE | ALL | Strict GUC Match |
| 3 | `master_patients` | YES | YES | YES | `tenant_isolation_master_patients` | PERMISSIVE | ALL | Strict GUC Match |
| 4 | `safety_decision_registry` | YES | YES | YES | `tenant_isolation_safety_decision_registry` | PERMISSIVE | ALL | Strict GUC Match |
| 5 | `universal_audit_logs` | YES | YES | YES | `tenant_isolation_universal_audit_logs` | PERMISSIVE | ALL | Strict GUC Match |
| **Child Clinical Tables** |
| 6 | `longitudinal_care_plans` | YES | YES | YES | `tenant_isolation_longitudinal_care_plans` | PERMISSIVE | ALL | Strict GUC Match |
| 7 | `medication_emar_administrations` | YES | YES | YES | `tenant_isolation_medication_emar_administrations`| PERMISSIVE | ALL | Strict GUC Match |
| 8 | `medication_dispense_allocations` | YES | YES | YES | `tenant_isolation_medication_dispense_allocations`| PERMISSIVE | ALL | Strict GUC Match |
| 9 | `patient_split_invoices` | YES | YES | YES | `tenant_isolation_patient_split_invoices` | PERMISSIVE | ALL | Strict GUC Match |
| 10 | `physician_diagnostic_interpretations` | YES | YES | YES | `tenant_isolation_physician_diagnostic_interpretations` | PERMISSIVE | ALL | Strict GUC Match |
| **21 Zero-Policy Blackout Tables Reconciled** |
| 11 | `blood_bank_billing_reconciliations` | YES | YES | YES | `tenant_isolation_blood_bank_billing_reconciliations` | PERMISSIVE | ALL | Strict GUC Match |
| 12 | `blood_bedside_dual_nurse_verifications` | YES | YES | YES | `tenant_isolation_blood_bedside_dual_nurse_verifications` | PERMISSIVE | ALL | Strict GUC Match |
| 13 | `bpjs_claim_disputes` | YES | YES | YES | `tenant_isolation_bpjs_claim_disputes` | PERMISSIVE | ALL | Strict GUC Match |
| 14 | `bpjs_claim_submissions` | YES | YES | YES | `tenant_isolation_bpjs_claim_submissions` | PERMISSIVE | ALL | Strict GUC Match |
| 15 | `bpjs_vclaim_lifecycle_logs` | YES | YES | YES | `tenant_isolation_bpjs_vclaim_lifecycle_logs` | PERMISSIVE | ALL | Strict GUC Match |
| 16 | `cssd_sterilization_cycles` | YES | YES | YES | `tenant_isolation_cssd_sterilization_cycles` | PERMISSIVE | ALL | Strict GUC Match |
| 17 | `hemovigilance_incident_investigations` | YES | YES | YES | `tenant_isolation_hemovigilance_incident_investigations`| PERMISSIVE | ALL | Strict GUC Match |
| 18 | `inacbg_grouping_results` | YES | YES | YES | `tenant_isolation_inacbg_grouping_results` | PERMISSIVE | ALL | Strict GUC Match |
| 19 | `master_inacbg_tariffs` | YES | YES | YES | `tenant_isolation_master_inacbg_tariffs` | PERMISSIVE | ALL | Strict GUC Match |
| 20 | `medical_device_implant_recalls` | YES | YES | YES | `tenant_isolation_medical_device_implant_recalls` | PERMISSIVE | ALL | Strict GUC Match |
| 21 | `patient_billing_reconciliation` | YES | YES | YES | `tenant_isolation_patient_billing_reconciliation` | PERMISSIVE | ALL | Strict GUC Match |
| 22 | `pharmacy_controlled_substance_logs` | YES | YES | YES | `tenant_isolation_pharmacy_controlled_substance_logs` | PERMISSIVE | ALL | Strict GUC Match |
| 23 | `pharmacy_depots` | YES | YES | YES | `tenant_isolation_pharmacy_depots` | PERMISSIVE | ALL | Strict GUC Match |
| 24 | `pharmacy_dispensing_orders` | YES | YES | YES | `tenant_isolation_pharmacy_dispensing_orders` | PERMISSIVE | ALL | Strict GUC Match |
| 25 | `post_anesthesia_aldrete_scores` | YES | YES | YES | `tenant_isolation_post_anesthesia_aldrete_scores` | PERMISSIVE | ALL | Strict GUC Match |
| 26 | `radiology_critical_finding_alerts` | YES | YES | YES | `tenant_isolation_radiology_critical_finding_alerts` | PERMISSIVE | ALL | Strict GUC Match |
| 27 | `radiology_instances` | YES | YES | YES | `tenant_isolation_radiology_instances` | PERMISSIVE | ALL | Strict GUC Match |
| 28 | `radiology_series` | YES | YES | YES | `tenant_isolation_radiology_series` | PERMISSIVE | ALL | Strict GUC Match |
| 29 | `surgical_clinical_notes` | YES | YES | YES | `tenant_isolation_surgical_clinical_notes` | PERMISSIVE | ALL | Strict GUC Match |
| 30 | `surgical_teams` | YES | YES | YES | `tenant_isolation_surgical_teams` | PERMISSIVE | ALL | Strict GUC Match |
| 31 | `who_surgical_safety_checklists` | YES | YES | YES | `tenant_isolation_who_surgical_safety_checklists` | PERMISSIVE | ALL | Strict GUC Match |

---

## 3. Analysis of Semantic Patterns in Policy Expressions

A global regex and AST search across all policy expressions in the catalog confirmed:
1. **`IS NULL` Clause Search:** `ZERO matches`. No policy allows records where `tenant_id IS NULL`.
2. **Fallback Tenant Search:** `ZERO matches`. No fallback UUID or default tenant literal is embedded.
3. **Hardcoded UUID Search:** `ZERO matches`. All tenant matching is parameterized strictly through `current_setting('app.current_tenant_id', true)`.
4. **Semantics of `current_setting(..., true)`:**
   - Parameter `true` ensures that if `app.current_tenant_id` has not been set via `set_config` / `SET LOCAL`, PostgreSQL returns `NULL` instead of throwing an unhandled runtime error.
   - Wrapping with `NULLIF(..., '')` ensures an empty string is converted to SQL `NULL`.
   - Casting `::uuid` ensures strict type safety against the UUID `tenant_id` column.
   - Result: Fail-closed default-deny.

---

## 4. Manual Policy Mutation Reconciliation

### 4.1 Chronology of Events in Wave 1A.10
1. Prior to migration 079 execution, `encounters` and `master_patients` had policies configured as `AS RESTRICTIVE` from Wave 1A.9 experimentation.
2. In PostgreSQL, if ONLY restrictive policies exist on a relation with zero permissive policies, all operations are rejected by default.
3. The execution log documents:
   ```sql
   ALTER POLICY tenant_isolation_encounters ON encounters AS PERMISSIVE;
   ALTER POLICY tenant_isolation_master_patients ON master_patients AS PERMISSIVE;
   ```
4. Migration 079 was subsequently executed via script, dropping existing policies and creating `AS PERMISSIVE` policies across all 31 tables.

### 4.2 Impact on Attribution
- The final state in the catalog is identical to what `079_stage0_purge_legacy_policies_and_enforce_default_deny.sql` defines.
- However, the execution of manual `ALTER POLICY` statements against the primary development database proves that the migration pipeline was not executed in a purely clean, automated sequence.

---

## 5. Security Verdict & Classification

| Control | State in Database | Verification Method | Status |
| :--- | :--- | :--- | :---: |
| **RLS Enabled** | Active on all 31 tables | `pg_class.relrowsecurity = true` | `VERIFIED_FACT` |
| **FORCE RLS** | Active on all 31 tables | `pg_class.relforcerowsecurity = true` | `VERIFIED_FACT` |
| **Fail-Open Elimination** | Purged from all 31 tables | Catalog search on `pg_policy` | `VERIFIED_FACT` |
| **Default-Deny Semantics**| Fail-closed on empty GUC | Catalog expression inspection | `VERIFIED_FACT` |
| **Zero-Policy Tables** | 21/21 tables protected | Complete 21-table catalog scan | `VERIFIED_FACT` |
| **Pipeline Attribution** | Manual ALTER preceded 079 | Execution trace reconciliation | `VERIFIED_WITH_LIMITATION` |
