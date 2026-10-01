# P0-2B WAVE 1B.0R — RLS POLICY FORENSIC RECONCILIATION REPORT

**Audit Date:** 2026-10-01  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Current Branch:** `feature/security-foundation-wave1a10`  
**Auditor:** Independent Security Auditor (Antigravity AI)  
**Audit Standard:** Read-Only Adversarial Forensic Reconciliation  

---

## 1. Executive Summary

This forensic report investigates the policy normalization performed in Migration `081_stage0_policy_normalization.sql`, auditing catalog state across all 100 RLS-enabled tables, verifying dual-GUC conflict elimination, and evaluating the database-wide tenant GUC context architecture.

---

## 2. Policy Catalog Inventory & Normalization Reconciliation

### 2.1 Post-Migration 081 Policy Metrics
A comprehensive query against `pg_policies` and `pg_class` confirms:
- **Total public tables:** 214
- **Tables with RLS enabled (`relrowsecurity = true`):** 100
- **Tables with Forced RLS (`relforcerowsecurity = true`):** 33
- **Total active RLS policies:** 100
- **Tables with multiple policies (>1):** **0**
- **Tables with zero policies:** 0 (among RLS tables)
- **Fail-open policies (`tenant_id IS NULL`):** **0**

---

### 2.2 Forensic Audit of Dropped Policies (Migration 081)

| Table Name | Dropped Policy Name | Cmd | Old Policy GUC Expression | Retained Canonical Policy | Semantic Impact |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `operating_theatres` | `tenant_isolation_policy` | ALL | `current_app_tenant_id()` (`app.tenant_id`) | `tenant_isolation_theatres` (`app.current_tenant_id`) | **Dual-GUC conflict eliminated**; single canonical context enforced. |
| `radiology_orders` | `tenant_isolation_policy` | ALL | `current_app_tenant_id()` (`app.tenant_id`) | `tenant_isolation_rad_orders` (`app.current_tenant_id`) | **Dual-GUC conflict eliminated**; single canonical context enforced. |
| `master_inacbg_tariffs` | `policy_master_inacbg_tariffs_read` | SELECT | `app.current_tenant_id` | `tenant_isolation_master_inacbg_tariffs` (FOR ALL) | **Redundancy eliminated**; ALL covers SELECT. |
| `master_inacbg_tariffs` | `policy_master_inacbg_tariffs_write` | INSERT | `app.current_tenant_id` | `tenant_isolation_master_inacbg_tariffs` (FOR ALL) | **Redundancy eliminated**; ALL covers INSERT. |
| 20 duplicate tables* | `policy_<tablename>` | ALL | `app.current_tenant_id` | `tenant_isolation_<tablename>` (FOR ALL) | **20 duplicate permissive pairs purged**; 1:1 table:policy achieved. |

*\*The 20 tables: `blood_bank_billing_reconciliations`, `blood_bedside_dual_nurse_verifications`, `bpjs_claim_disputes`, `bpjs_claim_submissions`, `bpjs_vclaim_lifecycle_logs`, `cssd_sterilization_cycles`, `hemovigilance_incident_investigations`, `inacbg_grouping_results`, `medical_device_implant_recalls`, `patient_billing_reconciliation`, `pharmacy_controlled_substance_logs`, `pharmacy_depots`, `pharmacy_dispensing_orders`, `post_anesthesia_aldrete_scores`, `radiology_critical_finding_alerts`, `radiology_instances`, `radiology_series`, `surgical_clinical_notes`, `surgical_teams`, `who_surgical_safety_checklists`.*

---

## 3. Critical Discovery: Database-Wide GUC Split (54 vs 46)

While the dual-GUC conflict on single individual tables was eliminated, a comprehensive AST query of all 100 policies reveals a **catalog-wide GUC split**:

```sql
SELECT qual, count(*) 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY qual;
```

### Expression Breakdown:
1. **54 Tables** utilize `current_app_tenant_id()`:
   ```sql
   (tenant_id = current_app_tenant_id())
   ```
   Inspection of `pg_proc` for `current_app_tenant_id()` reveals:
   ```sql
   CREATE OR REPLACE FUNCTION public.current_app_tenant_id()
    RETURNS uuid LANGUAGE plpgsql STABLE AS
   $function$
   BEGIN
       RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;
   END;
   $function$
   ```
   **This function explicitly queries `app.tenant_id`!**

2. **46 Tables** utilize explicit inline `app.current_tenant_id`:
   ```sql
   (tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)
   ```

### Why the System Does Not Break in UoW:
In `server/db/unitOfWork.js`, lines 65–66:
```javascript
await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId.trim()]);
await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId.trim()]);
```
`withUnitOfWork` injects **BOTH** GUC variables simultaneously on every transaction.

### Architectural Risk & Finding:
- The catalog is **NOT unified on a single GUC**.
- If an endpoint or worker only sets `app.current_tenant_id`, the 54 tables using `current_app_tenant_id()` evaluate to `NULL` (failing closed or blacking out).
- **Classification:** **`VERIFIED_WITH_LIMITATION`**. Canonical GUC unification remains an open architectural task.

---

## 4. Specific Verification: `operating_theatres` & `radiology_orders`

### 4.1 `operating_theatres`
- **Policy Count:** 1 (`tenant_isolation_theatres`)
- **Command:** `ALL` (Permissive)
- **Expression:** `(tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)`
- **Legacy Policy:** Purged.
- **Fail-Open Clause:** None.
- **Persistent Data Count:** 0 rows currently in dev DB.

### 4.2 `radiology_orders`
- **Policy Count:** 1 (`tenant_isolation_rad_orders`)
- **Command:** `ALL` (Permissive)
- **Expression:** `(tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)`
- **Legacy Policy:** Purged.
- **Fail-Open Clause:** None.
- **Persistent Data Count:** 0 rows currently in dev DB.

---

## 5. Down Migration Rollback Hazard (`081_down`)

Inspection of `081_down_stage0_policy_normalization.sql` reveals:
```sql
CREATE POLICY tenant_isolation_policy ON operating_theatres
  AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_app_tenant_id())
  WITH CHECK (tenant_id = current_app_tenant_id());

CREATE POLICY tenant_isolation_policy ON radiology_orders
  AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_app_tenant_id())
  WITH CHECK (tenant_id = current_app_tenant_id());
```
Executing this rollback migration **actively recreates the dual-GUC conflict** and restores the 20 redundant legacy policies.
- **Classification:** **`SECURITY_WEAKENING_ROLLBACK`**.

---

## 6. Verification Summary

| Security Property | Result | Classification |
| :--- | :--- | :--- |
| Single Policy per Table | 100 tables = 100 policies (0 duplicates) | **`VERIFIED_FACT`** |
| Zero Fail-Open Clauses | 0 policies with `tenant_id IS NULL` | **`VERIFIED_FACT`** |
| OT & RAD Dual-GUC Resolution | Dropped legacy `tenant_isolation_policy` | **`VERIFIED_FACT`** |
| Catalog GUC Homogeneity | 54 tables on `app.tenant_id`, 46 on `app.current_tenant_id` | **`VERIFIED_WITH_LIMITATION`** |
| Down Migration Safety | Recreates dual-GUC and duplicate policies | **`SECURITY_WEAKENING_ROLLBACK`** |
