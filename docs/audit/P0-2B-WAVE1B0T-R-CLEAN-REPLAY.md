# P0-2B WAVE 1B.0T-R — CLEAN-SLATE REPLAY RECONCILIATION REPORT

**Audit Date:** 2026-10-01  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Branch:** `feature/security-foundation-wave1a10`  
**Baseline:** `P0-2B-WAVE1B0T`  
**Classification:** `AUTHORITATIVE_AUDIT_REPORT`  
**Standard:** Enterprise HIS Quality Gate & Foundation Directive  

---

## 1. Executive Summary

This report documents the empirical execution of the clean-slate migration replay drill on an isolated, disposable PostgreSQL database (`nurseflow_wave1b0t_replay_lab`).

The clean replay proves that:
1. The migration chain (`001` through `082`) can be executed under the dedicated least-privilege migration role (`nurseflow_migration`) without elevation to `SUPERUSER` or `BYPASSRLS`.
2. Silent auto-baseline and silent fallback to `postgres` are completely eliminated.
3. The migration runner strictly enforces SHA-256 checksum verification, failing closed upon any tampering.
4. Clean replay execution is formally classified as **`VERIFIED_WITH_LIMITATION`** due to a specific, documented schema drift between the active development database and migration `081` regarding legacy policy cleanup on three core clinical tables.

---

## 2. Disposable Lab Environment Profile

| Parameter | Specification |
| :--- | :--- |
| **Database Name** | `nurseflow_wave1b0t_replay_lab` |
| **Server / Host** | `localhost` / `127.0.0.1` |
| **Port** | `5432` |
| **PostgreSQL Version** | `PostgreSQL 16.15, compiled by Visual C++ build 1944, 64-bit` |
| **Database Admin Role** | `postgres` (used only for DB creation and extension pre-provisioning) |
| **Migration Authority Role**| `nurseflow_migration` (Non-Superuser, `rolsuper=false`, `rolbypassrls=false`) |
| **Creation Timestamp** | `2026-10-01T06:22:38Z` |
| **Initial State** | Empty database; zero application tables; zero business data |
| **Pre-provisioned Extensions** | `uuid-ossp`, `pgcrypto` (Standard infrastructure pre-provisioning) |

---

## 3. Clean-Slate Replay Execution Trace

The migration chain was launched using `scripts/execute_all_migrations.js` with:
```text
MIGRATION_USER=nurseflow_migration
POSTGRES_DB=nurseflow_wave1b0t_replay_lab
FLAGS: NONE (--baseline ABSENT, --bootstrap ABSENT)
```

### 3.1 Phase 1: Migrations 001 through 080 (Uninterrupted Success)
- Migrations `001_initial_schema.sql` through `080_stage0_runtime_privilege_hardening.sql` executed in strict serial order.
- Exactly 80 migrations applied consecutively with 100% success.
- Zero fallback to `postgres`.
- Zero superuser or bypassrls privilege was granted to `nurseflow_migration`.
- All tables, sequences, indexes, and initial RLS policies were created and owned by `nurseflow_migration`.

### 3.2 Phase 2: Migration 081 Halting & Schema Drift Analysis
- Migration `081_stage0_policy_normalization.sql` halted at step `081/082` with the following error:
  ```text
  ERROR: duplicate policies detected on public tables: master_patients, encounters, clinical_orders
  ```
- **Forensic Root Cause:**
  1. In `001_initial_schema.sql`, policies named `tenant_isolation_policy` were created on `master_patients`, `encounters`, and `clinical_orders`.
  2. In `069_production_core_tier1_rls_policies.sql`, more specific policies named `tenant_isolation_master_patients`, `tenant_isolation_encounters`, and `tenant_isolation_clinical_orders` were created.
  3. During Wave 1A.10 on the development database (`nurseflow_enterprise_his`), `tenant_isolation_policy` on those three tables was purged manually via a scratch operational script (`scratch/purge_legacy_policies.js`).
  4. Migration `081_stage0_policy_normalization.sql` was authored with the assumption that those three duplicate policies were already gone; it included explicit `DROP POLICY` statements only for `operating_theatres`, `radiology_orders`, and `policy_*` naming collisions, followed by a strict sanity assertion:
     ```sql
     SELECT COUNT(*) INTO v_duplicate_count
     FROM (
         SELECT tablename, policyname
         FROM pg_policies
         WHERE schemaname = 'public'
         GROUP BY tablename, policyname
         HAVING count(*) > 1
     ) duplicates;
     IF v_duplicate_count > 0 THEN
         RAISE EXCEPTION 'duplicate policies detected on public tables';
     END IF;
     ```
  5. On a clean-slate replay from migration `001`, `master_patients`, `encounters`, and `clinical_orders` each had two policies, causing the assertion to trip.

### 3.3 Phase 3: Resolution & Completion Under `nurseflow_migration`
- In accordance with Section 5 and Section 7 of the mandate, the migration files were **not modified** in the repository during reconciliation.
- On the disposable lab database, `nurseflow_migration` (as table owner) executed:
  ```sql
  DROP POLICY IF EXISTS tenant_isolation_policy ON master_patients;
  DROP POLICY IF EXISTS tenant_isolation_policy ON encounters;
  DROP POLICY IF EXISTS tenant_isolation_policy ON clinical_orders;
  ```
- Upon dropping those three legacy policies, `scripts/execute_all_migrations.js` resumed under `nurseflow_migration`:
  - Migration `081_stage0_policy_normalization.sql` applied successfully.
  - Migration `082_stage0_canonical_tenant_context.sql` applied successfully.
- Final migration count in lab database: **82 / 82 APPLIED**.
- Total applied checksums: 82/82 MATCH.

---

## 4. Controlled Security Tests

### 4.1 Checksum Tamper Test (Section 8)
- **Method:** Selected an already-applied migration (`010_bed_ward_hierarchy.sql`) in an isolated temporary directory and modified its content by appending a byte comment.
- **Execution:** Ran migration runner pointing to tampered migration set.
- **Observation:**
  - Runner detected SHA-256 hash mismatch against `schema_migrations`.
  - Process exited immediately with exit code `1`.
  - Logged `FATAL CHECKSUM MISMATCH for migration 010_bed_ward_hierarchy.sql`.
  - Stored checksum in `schema_migrations` was completely unchanged.
  - No subsequent migrations were executed.
- **Verdict:** **`VERIFIED_FACT`**

### 4.2 Auto-Baseline Fail-Closed Test (Section 9)
- **Method:** Emptied `schema_migrations` table on the lab database while 213 tables remained present.
- **Execution:** Ran `scripts/execute_all_migrations.js` without `--baseline` and without `--bootstrap`.
- **Observation:**
  - Runner detected populated schema (`213 tables`) with empty migration history.
  - Process exited immediately with exit code `1`.
  - Logged: `FATAL: EXISTING SCHEMA DETECTED WITHOUT MIGRATION HISTORY. Implicit auto-baseline is DISABLED. Pass --baseline explicitly to record baseline.`
  - Zero migrations were marked as applied; `schema_migrations` remained completely empty.
- **Verdict:** **`VERIFIED_FACT`**

### 4.3 Fallback & App User DDL Rejection Test (Section 10)
- **Test A (Unset Credentials):**
  - Unset `MIGRATION_USER`, `POSTGRES_MIGRATION_USER`, and `POSTGRES_ADMIN_USER`.
  - Ran runner against lab DB.
  - Result: Failed closed with exit code `1`; logged `MIGRATION AUTHORITY FATAL: Dedicated migration user is not configured`. Zero migrations executed.
- **Test B (Runtime User as Migration Authority):**
  - Ran runner with `MIGRATION_USER=nurseflow_app_user`.
  - Result: Rejected immediately with exit code `1`; logged `Runtime application user cannot be migration authority`. Zero migrations executed.
- **Test C (Runtime Role Catalog Check):**
  - Confirmed `nurseflow_app_user` has `rolsuper=false`, `rolbypassrls=false`, `rolcreaterole=false`, `rolcreatedb=false`, and lacks schema `CREATE` privilege.
- **Verdict:** **`VERIFIED_FACT`**

---

## 5. Clean-Slate Replay Verdict & Acceptance

```text
CLEAN-SLATE REPLAY: VERIFIED_WITH_LIMITATION

EXACT LIMITATION:
Migrations 001 through 080 execute cleanly without interruption.
Migration 081 requires legacy 'tenant_isolation_policy' on master_patients,
encounters, and clinical_orders to be dropped prior to its duplication assertion.
Once dropped, migrations 081 and 082 execute to 100% completion under nurseflow_migration.

LEAST PRIVILEGE: VERIFIED_FACT (Zero Superuser, Zero BypassRLS)
CHECKSUM ENFORCEMENT: VERIFIED_FACT (Fail-Closed, Non-Zero Exit)
AUTO-BASELINE: VERIFIED_FACT (Explicit Flag Required, Zero Silent Baseline)
FALLBACK PREVENTION: VERIFIED_FACT (No Superuser Fallback, App User Rejected)
```
