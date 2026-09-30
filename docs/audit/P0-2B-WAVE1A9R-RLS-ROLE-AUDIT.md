# P0-2B Wave 1A.9R — Row Level Security (RLS) & Runtime Role Reconciliation Audit

**Document Identifier:** `SEC-AUD-P02B-W1A9R-RLS-ROLE-AUDIT-20260930`  
**Document Type:** Empirical RLS Policy & Database Role Security Audit  
**Author Roles:**
- PostgreSQL Security Engineer
- Principal Security Architect
- Application Security Auditor
- DevSecOps Engineer

**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Evaluation Date:** 2026-09-30  
**Audit Constraint:** **`STRICT READ-ONLY CATALOG AUDIT | ZERO PRIVILEGE / POLICY MUTATION`**  
**Executive Status:** **`LAB ROLE SECURITY: VERIFIED` | `APP RUNTIME SUPERUSER: PRESENT` | `LAB RLS: VERIFIED_IN_LAB` | `REPO RLS MIGRATION: NOT_VERIFIED`**

---

## 1. Executive Summary & Objective

In Wave 1A.9, four least-privilege roles (`nurseflow_app_user`, `nurseflow_worker`, `nurseflow_migration`, `nurseflow_reporting`) were provisioned in `nurseflow_security_lab`, and strict RESTRICTIVE default-deny policies were established on clinical parent and child tables.

The objective of **Wave 1A.9R** is to audit whether:
1. The application runtime has transitioned away from the PostgreSQL superuser.
2. The legacy fail-open RLS policies identified in Wave 1A.5/1A.8 have been purged from the repository and operational databases.
3. The lab RLS DDL has been formalized as executable repository migrations.

---

## 2. Runtime Role Reconciliation (Lab vs Application Runtime)

### 2.1 Laboratory Environment Attestation (`nurseflow_security_lab`)
Catalog query on `nurseflow_security_lab`:
```sql
SELECT rolname, rolsuper, rolbypassrls, rolcanlogin, rolcreaterole, rolcreatedb 
FROM pg_roles 
WHERE rolname IN ('nurseflow_app_user', 'nurseflow_worker', 'nurseflow_reporting', 'nurseflow_migration');
```
Result:
| Role Name | Superuser (`rolsuper`) | Bypass RLS (`rolbypassrls`) | Can Login (`rolcanlogin`) | Status in Lab |
| :--- | :---: | :---: | :---: | :---: |
| `nurseflow_app_user` | **false** | **false** | **true** | **VERIFIED (Least Privilege)** |
| `nurseflow_worker` | **false** | **false** | **true** | **VERIFIED (Worker Scoped)** |
| `nurseflow_reporting` | **false** | **false** | **true** | **VERIFIED (Read-Only)** |
| `nurseflow_migration` | **false** | **false** | **true** | **VERIFIED (DDL Owner)** |

Negative privilege tests confirmed that `nurseflow_app_user` cannot execute `CREATE ROLE`, `CREATE DATABASE`, `ALTER TABLE`, `DROP TABLE`, `ALTER ROLE`, or `CREATE EXTENSION` (`ERROR 42501`).

### 2.2 Application Runtime Reality (`.env.local` & `server/db/postgresPool.js`)
Inspection of actual application configuration files:
- [`.env.local:L15-L16`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/.env.local#L15-L16):
  ```ini
  POSTGRES_DB=nurseflow_enterprise_his
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=[REDACTED_DEV_SUPERUSER_PASSWORD]
  ```
- [`server/db/postgresPool.js:L27-L36`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/db/postgresPool.js#L27-L36):
  ```javascript
  export const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '[REDACTED_DEV_SUPERUSER_PASSWORD]',
    ...
  });
  ```

**Finding:** The NurseFlow application runtime has **NOT** undergone role cutover. It still authenticates as the `postgres` superuser. Because `postgres` possesses `rolsuper = true` and `rolbypassrls = true`, PostgreSQL automatically disables RLS checks for all application queries.

---

## 3. Row Level Security & Fail-Open Policy Audit

### 3.1 Legacy Fail-Open Inventory in `nurseflow_enterprise_his`
An empirical catalog scan of `pg_policies` in `nurseflow_enterprise_his` identified **5 active fail-open policies**:

```text
1. Table: clinical_orders | Policy: tenant_isolation_orders
   QUAL: ((current_setting('app.current_tenant_id'::text, true) IS NULL) 
       OR (current_setting('app.current_tenant_id'::text, true) = ''::text) 
       OR (tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid))

2. Table: encounters | Policy: tenant_isolation_encounters
   QUAL: ((current_setting('app.current_tenant_id'::text, true) IS NULL) 
       OR (current_setting('app.current_tenant_id'::text, true) = ''::text) 
       OR (tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid))

3. Table: master_patients | Policy: tenant_isolation_patients
   QUAL: ((current_setting('app.current_tenant_id'::text, true) IS NULL) 
       OR (current_setting('app.current_tenant_id'::text, true) = ''::text) 
       OR (tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid))

4. Table: safety_decision_registry | Policy: tenant_safety_isolation_policy
   QUAL: ((tenant_id = current_app_tenant_id()) OR (tenant_id IS NULL) OR (current_app_tenant_id() IS NULL))

5. Table: universal_audit_logs | Policy: tenant_audit_isolation_policy
   QUAL: ((tenant_id = current_app_tenant_id()) OR (tenant_id IS NULL) OR (current_app_tenant_id() IS NULL))
```

### 3.2 Policy Purge Reconciliation (Section 14 Matrix)
In Wave 1A.9, [`scratch/purge_legacy_policies.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/scratch/purge_legacy_policies.js) dropped legacy policies on `master_patients`, `encounters`, and `longitudinal_care_plans` **exclusively within `nurseflow_security_lab`**.

| Architectural Metric | Quantitative Value | Evidence Source |
| :--- | :---: | :--- |
| **Legacy Fail-Open Policies Found Before** | **5 policies** | Catalog query on `nurseflow_enterprise_his` |
| **Removed in Disposable Lab** | **2 policies** (`encounters`, `master_patients`) | `scratch/purge_legacy_policies.js` execution logs |
| **Remaining Fail-Open in Development DB** | **5 policies** | Active in `nurseflow_enterprise_his` |
| **Represented in Repository Migration** | **NO** | `database/migrations/` has zero Stage 0 RLS files |
| **Application Deployment Path** | **NOT_VERIFIED** | No CI/CD or migration script executes policy purge |

---

## 4. Repository Migration File Audit

An inventory of [`database/migrations/`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/database/migrations/) revealed 76 migration scripts, ending at `076_reconcile_authorization_decision_taxonomy.sql`.

- **Stage 0 Migration SQL Added:** **0 files**.
- The DDL statements used in Wave 1A.9 (`implement_stage0_foundation.js`, `implement_and_test_composite_fks.js`, `purge_legacy_policies.js`) were executed via ad-hoc Node.js scripts and **never committed as versioned SQL migration files**.

---

## 5. Architectural Conclusion & Governance Status

```text
================================================================================
                    RLS & ROLE RECONCILIATION SUMMARY
================================================================================
LAB ROLE SECURITY:                   VERIFIED (Least-privilege functional in lab)
APP RUNTIME ROLE CUTOVER:            NOT_VERIFIED (Application still uses postgres)
APP RUNTIME SUPERUSER DEPENDENCY:    PRESENT
LAB RLS POLICIES:                    VERIFIED_IN_LAB (Default-deny verified)
REPOSITORY RLS IMPLEMENTATION:       NOT_VERIFIED (0 migration files in repo)
LEGACY FAIL-OPEN POLICIES IN DEV DB: 5 ACTIVE POLICIES
REPOSITORY READINESS:                NOT_READY
================================================================================
```

While the RLS and role models are verified to function properly within `nurseflow_security_lab`, the application codebase and repository migrations have not incorporated these changes. Formal SQL migration scripts must be authored and the application runtime role must be switched before Stage 0 can be declared ready for deployment.
