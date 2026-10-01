# P0-2B WAVE 1B.0S — SECURITY ROLLBACK & DOWN-MIGRATION GOVERNANCE FORENSICS

**Audit Date:** 2026-10-01  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Current Branch:** `feature/security-foundation-wave1a10`  
**Auditor:** Independent Security Auditor (Antigravity AI)  
**Audit Standard:** Read-Only Adversarial Forensic Analysis  

---

## 1. Executive Summary

This forensic report evaluates the reversibility, security safety, and catalog impact of down-migrations:
- `database/migrations/079_down_stage0_purge_legacy_policies_and_enforce_default_deny.sql`
- `database/migrations/080_down_stage0_runtime_privilege_hardening.sql`
- `database/migrations/081_down_stage0_policy_normalization.sql`

### Core Forensic Determination:
All three down-migrations are classified as **`SECURITY_WEAKENING_ROLLBACK`**. Executing any of these rollback scripts directly reinstates critical security vulnerabilities into the active database, including disabling Row Level Security, re-introducing fail-open `OR tenant_id IS NULL` clauses, granting unconstrained `TRUNCATE` privileges to the unprivileged application user, and recreating dual-GUC conflicts.

---

## 2. In-Depth Forensic Analysis of Down-Migrations

### 2.1 Migration `079_down` Forensics
- **File:** `database/migrations/079_down_stage0_purge_legacy_policies_and_enforce_default_deny.sql`
- **What state does it restore?** Pre-Migration 079 baseline.

#### Specific Destructive DDL Operations:
1. **Disables RLS on 26 Tables:**
   ```sql
   FOREACH tbl IN ARRAY zero_policy_tables || child_tables LOOP
     EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', tbl);
     EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl);
   END LOOP;
   ```
   **Vulnerability:** Completely strips database-level tenant isolation from 21 tables plus 5 clinical child tables (`longitudinal_care_plans`, `medication_emar_administrations`, `medication_dispense_allocations`, `patient_split_invoices`, `physician_diagnostic_interpretations`).
2. **Re-introduces Fail-Open `OR tenant_id IS NULL` Clauses:**
   ```sql
   CREATE POLICY tenant_isolation_orders ON clinical_orders
     AS PERMISSIVE FOR ALL TO public
     USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR tenant_id IS NULL)
     WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR tenant_id IS NULL);
   ```
   **Vulnerability:** Recreates the historical fail-open vulnerability on 5 core clinical tables (`clinical_orders`, `encounters`, `master_patients`, `safety_decision_registry`, `universal_audit_logs`), allowing records with NULL tenant IDs to be accessed across tenant boundaries.
- **Classification:** **`SECURITY_WEAKENING_ROLLBACK`**.

---

### 2.2 Migration `080_down` Forensics
- **File:** `database/migrations/080_down_stage0_runtime_privilege_hardening.sql`
- **What state does it restore?** Pre-Migration 080 unconstrained privilege baseline.

#### Specific Destructive DDL Operations:
```sql
DO $$
BEGIN
  GRANT TRUNCATE ON ALL TABLES IN SCHEMA public TO nurseflow_app_user;
  RAISE NOTICE 'Rollback 080: Re-granted TRUNCATE privilege...';
END $$;
```
- **Vulnerability:** Re-grants the `TRUNCATE` privilege across all public tables to `nurseflow_app_user`. In PostgreSQL, `TRUNCATE` bypasses Row Level Security, re-enabling instantaneous mass table erasure by an application-level identity.
- **Classification:** **`SECURITY_WEAKENING_ROLLBACK`**.

---

### 2.3 Migration `081_down` Forensics
- **File:** `database/migrations/081_down_stage0_policy_normalization.sql`
- **What state does it restore?** Pre-Migration 081 policy catalog baseline.

#### Specific Destructive DDL Operations:
1. **Re-creates Dual-GUC Conflict on OT and RAD:**
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
   **Vulnerability:** Recreates competing permissive policies evaluated with logical `OR` on `operating_theatres` and `radiology_orders`, causing non-deterministic tenant evaluation between `app.tenant_id` and `app.current_tenant_id`.
2. **Re-creates 20 Redundant Duplicate Policies:** Restores legacy `policy_*` duplicate permissive policies across 20 tables and redundant read/write policies on `master_inacbg_tariffs`.
- **Classification:** **`SECURITY_WEAKENING_ROLLBACK`**.

---

## 3. Rollback Governance Classification Matrix

| Migration Rollback | Disables RLS? | Restores Fail-Open? | Restores TRUNCATE? | Restores Dual-GUC? | Security Classification |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`079_down`** | **YES (26 tables)** | **YES (5 tables)** | No | No | **`SECURITY_WEAKENING_ROLLBACK`** |
| **`080_down`** | No | No | **YES (214 tables)** | No | **`SECURITY_WEAKENING_ROLLBACK`** |
| **`081_down`** | No | No | No | **YES (2 tables)** | **`SECURITY_WEAKENING_ROLLBACK`** |

---

## 4. Rollback Governance Directive

1. **PROHIBITION OF AUTOMATED ROLLBACK:** Automated deployment pipelines (CI/CD) and developers are strictly prohibited from executing `079_down`, `080_down`, or `081_down` against staging or production environments.
2. **SECURITY-SAFE ROLLBACK PRINCIPLE:** In an enterprise HIS, a rollback that restores a known security vulnerability cannot be treated as an acceptable rollback target. If an operational failure occurs in forward migrations, remediation must proceed via a **controlled forward fix**, never via an insecure reverse migration.
