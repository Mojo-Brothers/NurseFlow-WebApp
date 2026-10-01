# P0-2B WAVE 1A.11R.1 DEVELOPMENT DB POLICY CONTAMINATION AUDIT

**Audit Date:** 2026-10-01  
**Auditor:** Independent Security Auditor (Antigravity AI)  
**Standard:** Enterprise HIS Strict Read-Only Adversarial Audit  
**Target Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Branch:** `feature/security-foundation-wave1a10`  

---

## 1. Executive Summary

This audit performs an empirical catalog evaluation of `pg_policies` in the active development database `nurseflow_enterprise_his` to investigate the duplicate policy anomaly reported in Wave 1A.11R.

| Metric | Measured Value | Security Status |
|---|---|---|
| Total Public Tables | 214 | Baseline Catalog |
| RLS-Enabled Tables (`relrowsecurity = true`) | 100 | Verified |
| FORCE RLS Tables (`relforcerowsecurity = true`) | 31 | Verified (Migration 079 scope) |
| Tables with RLS Policies | 100 | Catalog Inventory |
| Tables with Exactly 1 Policy | 77 | Clean Isolation Baseline |
| **Tables with Duplicate / Multiple Policies** | **23** | **POLICY CONTAMINATION DETECTED** |
| - Semantically Equivalent Permissive | 20 | Harmless Redundancy (`A OR A = A`) |
| - Non-Equivalent / Dual-GUC Permissive | 3 | **Material Vulnerability Under Specific GUC Configurations** |

---

## 2. Root Cause Analysis of Policy Contamination

Why do 23 tables contain multiple policies?

### Migration 079 Script Anatomy:
In `database/migrations/079_stage0_purge_legacy_policies_and_enforce_default_deny.sql`, the policy replacement loop executes:
```sql
-- Drop existing restrictive policy if already defined
EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'tenant_isolation_' || tbl, tbl);

-- Create PERMISSIVE default-deny policy
EXECUTE format('
  CREATE POLICY %I ON %I
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid);
', 'tenant_isolation_' || tbl, tbl);
```

### The Blind Spot:
1. Prior to Migration 079 (in Wave 1A.10 and earlier migration scripts), policies had been created with alternative naming conventions:
   - `policy_<table>`
   - `policy_<table>_read` / `policy_<table>_write`
   - `tenant_isolation_policy`
2. Migration 079 explicitly dropped only `'tenant_isolation_' || tbl`.
3. It failed to drop preexisting policies named `policy_<table>` or `tenant_isolation_policy`.
4. As a result, both the older policies and the new Migration 079 policies remain active concurrently in `pg_policies`.

---

## 3. PostgreSQL Multi-Policy Semantics & Evaluation

In PostgreSQL 16:
> *"When multiple PERMISSIVE policies exist on a single table for a given command (e.g. ALL or SELECT), PostgreSQL combines them using **`OR`** boolean logic. A row is accessible if ANY permissive policy evaluates to TRUE."*

$$\text{Access Allowed} = \text{Policy}_1 \lor \text{Policy}_2$$

### Category 1: Semantically Equivalent Redundant Policies (20 Tables)
In 20 tables, both `policy_<tbl>` and `tenant_isolation_<tbl>` evaluate:
$$\text{Policy}_1: \text{tenant\_id} = \text{NULLIF}(\text{current\_setting}('app.current\_tenant\_id', \text{true}), '')::\text{uuid}$$
$$\text{Policy}_2: \text{tenant\_id} = \text{NULLIF}(\text{current\_setting}('app.current\_tenant\_id', \text{true}), '')::\text{uuid}$$

Since $A \lor A \equiv A$:
- If `app.current_tenant_id` is set to Tenant A: both policies allow Tenant A only.
- If `app.current_tenant_id` is unset: both policies evaluate to `tenant_id = NULL` (FALSE), blocking all rows.
- **Classification:** **HARMLESS REDUNDANCY**. These 20 duplicate policies do not weaken tenant isolation.

### Category 2: Dual-GUC Permissive Discrepancies (3 Tables)

Three tables exhibit divergent policy definitions:
1. `operating_theatres`
2. `radiology_orders`
3. `master_inacbg_tariffs`

#### Forensic Analysis of `operating_theatres` & `radiology_orders`:
- **Policy 1:** `tenant_isolation_policy`
  - Expression: `(tenant_id = current_app_tenant_id())`
- **Policy 2:** `tenant_isolation_theatres` (or `tenant_isolation_rad_orders`)
  - Expression: `(tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid)`

Inspection of the PostgreSQL function definition for `current_app_tenant_id()`:
```sql
CREATE OR REPLACE FUNCTION public.current_app_tenant_id()
RETURNS uuid LANGUAGE plpgsql STABLE AS $function$
BEGIN
    RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;
END;
$function$;
```

**CRITICAL FINDING:**
- `tenant_isolation_policy` reads GUC: **`app.tenant_id`**.
- `tenant_isolation_theatres` reads GUC: **`app.current_tenant_id`**.
- Because both policies are PERMISSIVE, PostgreSQL evaluates:
  $$\text{Access} = (\text{tenant\_id} = \text{app.tenant\_id}) \lor (\text{tenant\_id} = \text{app.current\_tenant\_id})$$
- If legacy code or an attacker sets `app.tenant_id = Tenant_A` and `app.current_tenant_id = Tenant_B`:
  **The session can query and manipulate rows belonging to BOTH Tenant A AND Tenant B!**
- While `server/db/unitOfWork.js` currently sets both GUCs to the same value, any caller setting only one GUC or setting conflicting GUCs will bypass single-tenant containment.

#### Forensic Analysis of `master_inacbg_tariffs`:
- `policy_master_inacbg_tariffs_read`: `SELECT` only on `app.current_tenant_id`.
- `policy_master_inacbg_tariffs_write`: `INSERT` with `WITH CHECK` on `app.current_tenant_id`.
- `tenant_isolation_master_inacbg_tariffs`: `ALL` on `app.current_tenant_id`.
- **Classification:** Redundant overlap across specific and generic command types.

---

## 4. Comprehensive Inventory of the 23 Affected Tables

| # | Table Name | Existing Policy Names | Permissive? | Roles | Commands | Semantic Risk Assessment |
|---|---|---|---|---|---|---|
| 1 | `blood_bank_billing_reconciliations` | `policy_blood_bank_billing_reconciliations`, `tenant_isolation_blood_bank_billing_reconciliations` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 2 | `blood_bedside_dual_nurse_verifications` | `policy_blood_bedside_dual_nurse_verifications`, `tenant_isolation_blood_bedside_dual_nurse_verifications` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 3 | `bpjs_claim_disputes` | `policy_bpjs_claim_disputes`, `tenant_isolation_bpjs_claim_disputes` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 4 | `bpjs_claim_submissions` | `policy_bpjs_claim_submissions`, `tenant_isolation_bpjs_claim_submissions` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 5 | `bpjs_vclaim_lifecycle_logs` | `policy_bpjs_vclaim_lifecycle_logs`, `tenant_isolation_bpjs_vclaim_lifecycle_logs` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 6 | `cssd_sterilization_cycles` | `policy_cssd_sterilization_cycles`, `tenant_isolation_cssd_sterilization_cycles` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 7 | `hemovigilance_incident_investigations` | `policy_hemovigilance_incident_investigations`, `tenant_isolation_hemovigilance_incident_investigations` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 8 | `inacbg_grouping_results` | `policy_inacbg_grouping_results`, `tenant_isolation_inacbg_grouping_results` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 9 | `master_inacbg_tariffs` | `policy_master_inacbg_tariffs_read`, `policy_master_inacbg_tariffs_write`, `tenant_isolation_master_inacbg_tariffs` | PERMISSIVE | public | SELECT, INSERT, ALL | Overlapping Commands |
| 10 | `medical_device_implant_recalls` | `policy_medical_device_implant_recalls`, `tenant_isolation_medical_device_implant_recalls` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 11 | `operating_theatres` | `tenant_isolation_policy`, `tenant_isolation_theatres` | PERMISSIVE | public | ALL | **Dual-GUC Conflict (`app.tenant_id` vs `app.current_tenant_id`)** |
| 12 | `patient_billing_reconciliation` | `policy_patient_billing_reconciliation`, `tenant_isolation_patient_billing_reconciliation` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 13 | `pharmacy_controlled_substance_logs` | `policy_pharmacy_controlled_substance_logs`, `tenant_isolation_pharmacy_controlled_substance_logs` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 14 | `pharmacy_depots` | `policy_pharmacy_depots`, `tenant_isolation_pharmacy_depots` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 15 | `pharmacy_dispensing_orders` | `policy_pharmacy_dispensing_orders`, `tenant_isolation_pharmacy_dispensing_orders` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 16 | `post_anesthesia_aldrete_scores` | `policy_post_anesthesia_aldrete_scores`, `tenant_isolation_post_anesthesia_aldrete_scores` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 17 | `radiology_critical_finding_alerts` | `policy_radiology_critical_finding_alerts`, `tenant_isolation_radiology_critical_finding_alerts` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 18 | `radiology_instances` | `policy_radiology_instances`, `tenant_isolation_radiology_instances` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 19 | `radiology_orders` | `tenant_isolation_policy`, `tenant_isolation_rad_orders` | PERMISSIVE | public | ALL | **Dual-GUC Conflict (`app.tenant_id` vs `app.current_tenant_id`)** |
| 20 | `radiology_series` | `policy_radiology_series`, `tenant_isolation_radiology_series` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 21 | `surgical_clinical_notes` | `policy_surgical_clinical_notes`, `tenant_isolation_surgical_clinical_notes` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 22 | `surgical_teams` | `policy_surgical_teams`, `tenant_isolation_surgical_teams` | PERMISSIVE | public | ALL | Harmless Redundancy |
| 23 | `who_surgical_safety_checklists` | `policy_who_surgical_safety_checklists`, `tenant_isolation_who_surgical_safety_checklists` | PERMISSIVE | public | ALL | Harmless Redundancy |

---

## 5. Audit Conclusion & Recommended Purge Migration (Future Wave)

1. The existence of 23 duplicate policy pairs is **VERIFIED_FACT**.
2. For 20 of the tables, the duplicate policies are semantically identical and do not weaken tenant isolation.
3. For 2 tables (`operating_theatres` and `radiology_orders`), the presence of legacy `tenant_isolation_policy` relying on `current_app_tenant_id()` creates a latent dual-GUC vulnerability when combined via `OR`.
4. In a future implementation wave, a dedicated cleanup migration must purge all legacy `policy_*` and `current_app_tenant_id()` policies to restore single-policy catalog hygiene.
