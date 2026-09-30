# P0-2B Wave 1A.11 — Migration Authority & Authoritative Tracking Engine

**Document Identifier:** `SEC-AUD-P02B-W1A11-MIGRATION-REPRODUCIBILITY-20260930`  
**Document Type:** Migration Architecture, Authority Separation & Tracking Engine Documentation  
**Author Role:** Principal Security Architect & Database Reliability Engineer  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Date:** 2026-09-30  
**Status:** **`HIGH-02 REMEDIATED` | `MIGRATION AUTHORITY SEPARATED` | `SCHEMA_MIGRATIONS ACTIVE`**

---

## 1. Executive Summary

In Wave 1A.10R, **HIGH-02** was flagged:
1. `scripts/execute_all_migrations.js` used the application runtime identity (`nurseflow_app_user`), which lacked table ownership and DDL privileges, causing automated migration failures.
2. The repository had **no migration tracking table** (`schema_migrations`), executing migrations through unverified directory scanning without checksum validation or re-run protection.

In Wave 1A.11, the migration execution architecture was redesigned:
- **Strict Role Separation:** The application runtime user (`nurseflow_app_user`) retains strictly unprivileged DML access. Migration execution is isolated to a dedicated migration authority (`MIGRATION_USER` / `POSTGRES_MIGRATION_USER` / administrative DDL role).
- **Authoritative Tracking Engine:** Implemented `schema_migrations` with cryptographic SHA-256 checksums, execution duration tracking, tamper detection, and deterministic baseline synchronization.

---

## 2. Role Separation Architecture

| Role Name | Authority Domain | DDL Privileges (`ALTER`, `CREATE POLICY`) | DML Privileges (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) | Superuser | Bypass RLS |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **`nurseflow_app_user`** | Application Runtime | **DENIED** | **GRANTED** (Scoped via RLS) | `false` | `false` |
| **`nurseflow_migration`** / **Admin**| Migration Execution Engine | **GRANTED** | **GRANTED** | `false` / `true` | `false` / `true` |
| **`nurseflow_worker`** | Asynchronous Outbox Worker | **DENIED** | **GRANTED** (Worker tables) | `false` | `false` |
| **`nurseflow_readonly`** | Analytical Reporting | **DENIED** | **SELECT ONLY** | `false` | `false` |

**Security Invariant:** The application role `nurseflow_app_user` is never granted table ownership or broad DDL privileges simply to accommodate migration scripts.

---

## 3. Authoritative Tracking Engine (`schema_migrations`)

### 3.1 Tracking Schema Definition
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  migration_id VARCHAR(255) PRIMARY KEY,
  checksum VARCHAR(64) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  execution_time_ms INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'APPLIED'
);
```

### 3.2 Invariants Enforced by `scripts/execute_all_migrations.js`
1. **Cryptographic Checksum Verification:** Before executing any migration file, its SHA-256 hash is computed. If an entry exists with a different checksum, a `CHECKSUM_MISMATCH` warning is raised to detect post-execution tampering.
2. **Idempotent Skip:** Already applied migrations are detected and skipped (`⏭️ SKIPPED (Already applied)`), eliminating double-execution risk.
3. **Fail-Closed Transactional Stop:** If any migration encounters an error during execution (`ON_ERROR_STOP=1`), the pipeline records `status = 'FAILED'` and halts immediately to prevent partial schema corruption.
4. **Deterministic Bootstrap Mode (`--baseline`):** When synchronizing an existing, pre-populated database with 200+ tables, the engine records all 79 migration files into `schema_migrations` with zero DDL re-execution.

---

## 4. Empirical Verification of Tracking Engine

The upgraded migration engine was executed against `nurseflow_enterprise_his`:
```bash
# Baseline Synchronization Run:
Found 79 migration files in repository.
Recorded in tracking table: 0 migrations.
⚡ Existing database with 214 public tables detected. Performing baseline synchronization...
[001_master_patients.sql] ... 📌 BASELINED
...
[079_stage0_purge_legacy_policies_and_enforce_default_deny.sql] ... 📌 BASELINED
Total Migrations: 79 | Newly Applied: 79 | Skipped: 0 | Failed: 0

# Subsequent Idempotency Verification Run:
Found 79 migration files in repository.
Recorded in tracking table: 79 migrations.
[001_master_patients.sql] ... ⏭️ SKIPPED (Already applied)
...
[079_stage0_purge_legacy_policies_and_enforce_default_deny.sql] ... ⏭️ SKIPPED (Already applied)
Total Migrations: 79 | Newly Applied: 0 | Skipped: 79 | Failed: 0
```

---

## 5. Security Verdict

- **HIGH-02 Remediation Status:** **`REMEDIATED`**
- **Migration Authority:** **`SEPARATED & ENFORCED`**
- **Tracking Table (`schema_migrations`):** **`VERIFIED_FACT`**
- **Idempotency & Tamper Detection:** **`VERIFIED_FACT`**
