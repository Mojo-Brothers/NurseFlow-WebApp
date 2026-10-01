# P0-2B WAVE 1B.0 SECURITY CONTAINMENT BASELINE

**Audit Date:** 2026-10-01  
**Auditor:** Independent Security Auditor (Antigravity AI)  
**Standard:** Enterprise HIS Strict Security Containment  
**Target Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Current Branch:** `feature/security-foundation-wave1a10`  
**Git HEAD Commit:** `0fb2b9794cbdb08112bc795813351ec9fc380e22`  
**Previous Gate:** `P0-2B Wave 1A.11R.1 = STAGE 0 NO-GO`  

---

## 1. Baseline Identity & Environment Matrix

| Baseline Dimension | Measured Metric / State | Evidence Source | Security Status |
|---|---|---|---|
| **Git Branch** | `feature/security-foundation-wave1a10` | `git status` | Active Security Branch |
| **Git HEAD Commit** | `0fb2b9794cbdb08112bc795813351ec9fc380e22` | `git rev-parse HEAD` | Verified |
| **Target Database** | `nurseflow_enterprise_his` | `SELECT current_database()` | Active Development Instance |
| **Database Engine** | PostgreSQL 16.15 (Visual C++ 64-bit) | `SELECT version()` | Production Engine Class |
| **Database Size** | 39,722,007 bytes (~38 MB) | `pg_database_size()` | Verified |
| **Active Runtime Role** | `nurseflow_app_user` | `SELECT current_user, session_user` | Non-superuser |
| **Role Flags** | `rolsuper=false`, `rolbypassrls=false`, `rolcreaterole=false`, `rolcreatedb=false`, `rolcanlogin=true` | `pg_roles` | Least Privilege Role Level |
| **TRUNCATE Privilege Grants** | **212 public tables** | `information_schema.role_table_grants` | **CRITICAL CONTAINMENT ISSUE** |
| **Public Tables Total** | 214 tables | `information_schema.tables` | Catalog Baseline |
| **RLS-Enabled Tables** | 100 tables | `pg_class.relrowsecurity = true` | Verified |
| **FORCE RLS Tables** | 31 tables | `pg_class.relforcerowsecurity = true` | Verified (079 scope) |
| **Total Policy Records** | 123 policy entries | `pg_policies` | Catalog Baseline |
| **Tables with Policies** | 100 tables | `pg_policies` | Catalog Baseline |
| **Tables with Duplicate Policies**| **23 tables** | `pg_policies` | **CONTAINMENT DEFECT** |
| - Semantically Equivalent | 20 tables | Qual identical to `tenant_isolation_*` | Catalog Bloat |
| - Dual-GUC Conflict | 2 tables (`operating_theatres`, `radiology_orders`) | Uses `app.tenant_id` vs `app.current_tenant_id` | **CONTAINMENT DEFECT** |
| - Overlapping Commands | 1 table (`master_inacbg_tariffs`) | SELECT + INSERT + ALL | Redundant Overlap |
| **Working Tree Secret Leakage** | `scratch/wave1a10r_git_report.json` | Secret scan grep | **CONTAINMENT DEFECT** |
| **Reachable History Secrets** | Commits `4d0825c`, `ddbd748` | `git log` inspection | Exposed / Rotation Required |

---

## 2. Working Tree Inventory Before Containment

```text
Tracked modified files:
- docs/CHANGELOG_PERUBAHAN_HIS.md

Untracked audit files:
- docs/audit/P0-2B-WAVE1A11R-*.md (Wave 1A.11R reports)
- docs/audit/P0-2B-WAVE1A11R1.1-*.md (Wave 1A.11R.1 reports)
- scratch/p02b_wave1a11r1_evidence.json
```

---

## 3. Containment Workstream Objectives (Pre-UoW Scope)

1. **Workstream 1 (Privilege Hardening):**
   - Create Migration `080_stage0_runtime_privilege_hardening.sql` & down migration.
   - Revoke `TRUNCATE` from `nurseflow_app_user` across all 212 public tables.
   - Revoke default `TRUNCATE` privileges.
   - Maintain legitimate DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `REFERENCES`, `TRIGGER`).
2. **Workstream 2 (Secret Material Sanitization):**
   - Sanitize or purge `scratch/wave1a10r_git_report.json` so no plaintext secrets exist in working tree.
   - Run clean secret scan across repository.
   - Publish formal credential rotation specification `docs/audit/P0-2B-WAVE1B0-CREDENTIAL-ROTATION.md`.
3. **Workstream 3 (Policy Normalization):**
   - Create Migration `081_stage0_policy_normalization.sql` & down migration.
   - Eliminate dual-GUC permissive policies on `operating_theatres` and `radiology_orders`.
   - Purge 20 redundant `policy_*` duplicate permissive policies.
   - Purge overlapping read/write policies on `master_inacbg_tariffs`.
   - Achieve 100 tables with exactly 1 canonical policy referencing `app.current_tenant_id`.
4. **Workstream 4 (Regression & Verification):**
   - Author `tests/p02b_wave1b0_security_containment.test.js`.
   - Verify all privilege denials, DML preservation, policy isolation, and clean state.
   - Confirm 156 RLS/UoW bypasses remain explicitly documented as OPEN for Wave 1B domain migrations.
