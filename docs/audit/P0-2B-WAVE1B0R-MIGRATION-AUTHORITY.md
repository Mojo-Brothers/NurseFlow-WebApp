# P0-2B WAVE 1B.0R — MIGRATION AUTHORITY & RUNNER FORENSIC AUDIT REPORT

**Audit Date:** 2026-10-01  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Current Branch:** `feature/security-foundation-wave1a10`  
**Auditor:** Independent Security Auditor (Antigravity AI)  
**Audit Standard:** Read-Only Adversarial Forensic Reconciliation  

---

## 1. Executive Summary

This forensic report analyzes the migration authority, runner semantics (`scripts/execute_all_migrations.js`), role boundaries, and schema tracking mechanisms in NurseFlow Enterprise HIS.

Prior audits identified ambiguity regarding whether migrations enforce strict least-privilege authority (`nurseflow_migration`), whether execution falls back to the `postgres` superuser, and whether the tracking mechanism guarantees clean-slate reproducibility.

---

## 2. Migration Runner Forensic Evaluation (`scripts/execute_all_migrations.js`)

### 2.1 Wave 1B.0 Runner Diff Analysis
```diff
--- scripts/execute_all_migrations.js (Pre-Wave 1B.0)
+++ scripts/execute_all_migrations.js (Wave 1B.0)
@@ -122,7 +122,7 @@
-    if (existing) {
+    if (existing && existing.status === 'APPLIED') {
       if (existing.checksum !== checksum) {
         console.warn(`  [${file}] ⚠️ CHECKSUM_MISMATCH...`);
       } else {
         console.log(`  [${file}] ... ⏭️ SKIPPED (Already applied)`);
       }
       skippedCount++;
       continue;
     }
+    if (existing && existing.status === 'FAILED') {
+      console.log(`  [${file}] ... 🔄 RETRYING (Previous attempt failed)`);
+    }
```
**Impact Assessment:** The modification is targeted and operational: migrations previously recorded with `status = 'FAILED'` are now retried rather than permanently and silently skipped.

---

### 2.2 Direct Answers to Core Migration Authority Invariants

#### A. Does migration runner still require `nurseflow_migration`?
**NO.** Inspection of lines 39–42 proves:
```javascript
const user = process.env.MIGRATION_USER || 
             process.env.POSTGRES_MIGRATION_USER || 
             process.env.POSTGRES_ADMIN_USER || 
             'postgres';
```
The runner accepts multiple environment variables and does not enforce `nurseflow_migration`.

#### B. Can it silently fallback to `postgres`?
**YES.** If none of `MIGRATION_USER`, `POSTGRES_MIGRATION_USER`, or `POSTGRES_ADMIN_USER` are set, it defaults unconditionally to `postgres` (line 42).

#### C. Can it silently fallback to `nurseflow_app_user`?
**NO.** The runner never defaults to `nurseflow_app_user` unless explicitly configured in environment variables.

#### D. Can environment variables cause unexpected role substitution?
**YES.** An operator setting `POSTGRES_ADMIN_USER` or `MIGRATION_USER` in `.env.local` alters the executing identity without sanity checks against role attributes.

#### E. Does it still verify checksums?
**YES.** Lines 122–127 compute the SHA-256 digest of the local file and compare it against `schema_migrations.checksum`.

#### F. Does it reject checksum mismatches?
**NO (DEFECT / LIMITATION).** Look at lines 126–132:
```javascript
if (existing.checksum !== checksum) {
  console.warn(`  [${file}] ⚠️ CHECKSUM_MISMATCH: Migration modified after application! Stored: ${existing.checksum.slice(0, 10)}..., Current: ${checksum.slice(0, 10)}...`);
} else {
  console.log(`  [${file}] ... ⏭️ SKIPPED (Already applied)`);
}
skippedCount++;
continue;
```
If a checksum mismatch is detected on an applied migration, the runner prints a `console.warn` but **skips the file and continues execution**. It does NOT halt execution, throw an error, or exit with non-zero. Checksum validation is therefore **advisory only, not enforced**.

#### G. Does it automatically baseline existing migrations?
**YES.** If `appliedMap.size === 0` and `publicTableCount > 50`, `shouldAutoBaseline` is set to `true`.

#### H. Is `shouldAutoBaseline` still present? What triggers it? What does it do? Can it hide missing migrations?
- **Present:** YES (line 102).
- **Trigger:** `(appliedMap.size === 0 && publicTableCount > 50) || isBaselineMode`.
- **What it does:** Inserts all migration files into `schema_migrations` with `status = 'APPLIED'` and `execution_time_ms = 0` without executing the underlying SQL DDL (lines 141–148).
- **Hiding Missing Migrations:** **YES.** If an existing database has > 50 tables, running the engine will baseline all migration files into `schema_migrations`. If any intermediate migration (e.g. 075, 079) was never actually run against that schema, auto-baseline marks it as applied, masking the omission.
- **Clean-Slate Replay Status:** **`NOT_VERIFIED`**. A clean, deterministic sequential replay from 001 to 081 against an empty PostgreSQL database has never been demonstrated in continuous integration.

---

## 3. Catalog Role Privilege & DDL Authority Analysis

A read-only catalog query against `pg_roles`, `pg_namespace`, and `pg_tables` reveals:

```json
[
  {
    "rolname": "nurseflow_app_user",
    "rolsuper": false,
    "rolbypassrls": false,
    "rolcreaterole": false,
    "rolcreatedb": false,
    "can_create_in_public_schema": false,
    "tables_owned": 0
  },
  {
    "rolname": "nurseflow_migration",
    "rolsuper": false,
    "rolbypassrls": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "can_create_in_public_schema": false,
    "tables_owned": 0
  },
  {
    "rolname": "postgres",
    "rolsuper": true,
    "rolbypassrls": true,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "can_create_in_public_schema": true,
    "tables_owned": 214
  }
]
```

### Can `nurseflow_app_user` execute DDL?
1. **Can it ALTER tables?** **NO.** In PostgreSQL, `ALTER TABLE` requires table ownership or superuser status. `nurseflow_app_user` owns 0 tables.
2. **Can it CREATE tables?** **NO.** `has_schema_privilege('nurseflow_app_user', 'public', 'CREATE')` evaluates to `false`.
3. **Can it DROP tables?** **NO.** `DROP TABLE` requires table ownership or superuser status.
4. **Can it CREATE EXTENSION?** **NO.** Requires superuser status (`rolsuper = false`).
5. **Can it CREATE ROLE?** **NO.** `rolcreaterole = false`.

### Authority Classification:
- `nurseflow_app_user` = **STRICT DML RUNTIME ROLE (LEAST PRIVILEGE PRESERVED)**
- Schema Authority = Currently tied to **`postgres` superuser** because `nurseflow_migration` lacks `CREATE` privilege on schema `public` and owns 0 tables.

---

## 4. Findings Summary

| Invariant | Operational State | Classification |
| :--- | :--- | :--- |
| **Runtime DDL Protection** | `nurseflow_app_user` cannot execute DDL, ALTER, CREATE, or DROP | **`VERIFIED_FACT`** |
| **Dedicated Migration Authority** | Migrations execute as `postgres` superuser fallback | **`VERIFIED_WITH_LIMITATION`** |
| **Checksum Enforcement** | Advisory warning only; does not halt or fail closed | **`OPEN (DEFECT)`** |
| **Auto-Baseline Mechanism** | Present; bypasses DDL execution on existing DBs | **`VERIFIED_WITH_LIMITATION`** |
| **Clean-Slate Replay** | Never demonstrated from 001 to 081 on empty DB | **`NOT_VERIFIED`** |
