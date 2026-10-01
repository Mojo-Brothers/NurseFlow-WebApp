# P0-2B WAVE 1B.0S — MIGRATION AUTHORITY & RUNNER INTEGRITY FORENSIC AUDIT

**Audit Date:** 2026-10-01  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Current Branch:** `feature/security-foundation-wave1a10`  
**Git HEAD:** `0fb2b97`  
**Auditor:** Independent Security Auditor (Antigravity AI)  
**Audit Standard:** Read-Only Adversarial Forensic Analysis  

---

## 1. Executive Summary

This forensic report performs an in-depth code and catalog analysis of the NurseFlow migration execution pipeline, focusing on `scripts/execute_all_migrations.js`, runtime role fallback semantics, checksum enforcement mechanisms, and auto-baseline behavior.

### Critical Forensic Determinations:
1. **Migration Role Fallback to Superuser (`CRITICAL MIGRATION AUTHORITY RISK`):** The runner does not require `nurseflow_migration`. If environment variables are missing, it falls back to the `postgres` superuser.
2. **Checksum Mismatch Non-Enforcement (`CRITICAL OPEN`):** On checksum mismatch of an already applied migration, the runner logs `console.warn` and skips execution. It does **NOT** halt, throw an error, or exit non-zero.
3. **Auto-Baseline Schema Drift Hazard (`REPRODUCIBILITY RISK`):** If an existing database has > 50 public tables, running the engine records all migration files into `schema_migrations` with `status = 'APPLIED'` and `execution_time_ms = 0` without executing DDL.
4. **Clean-Slate Replay (`CLEAN_SLATE_REPLAY = NOT_VERIFIED`):** A clean sequential migration replay from 001 to 081 against an empty PostgreSQL database has never been demonstrated in continuous integration.

---

## 2. Migration Authority & Role Fallback Forensics

### 2.1 Code Path Trace (`scripts/execute_all_migrations.js`)
Inspection of lines 39–43 reveals the following role resolution hierarchy:
```javascript
const user = process.env.MIGRATION_USER || 
             process.env.POSTGRES_MIGRATION_USER || 
             process.env.POSTGRES_ADMIN_USER || 
             'postgres';
```
Corresponding password resolution (lines 44–49):
```javascript
const password = process.env.MIGRATION_PASSWORD || 
                 process.env.POSTGRES_MIGRATION_PASSWORD || 
                 process.env.POSTGRES_ADMIN_PASSWORD || 
                 process.env.POSTGRES_PASSWORD || 
                 '';
```

### 2.2 Answers to Specific Investigative Questions
- **A. Does it always use `nurseflow_migration`?** **NO.** `nurseflow_migration` is not hardcoded and is only used if specified in `MIGRATION_USER`.
- **B. Can it fallback to `postgres`?** **YES.** If none of the migration environment variables exist, line 42 evaluates to `'postgres'`.
- **C. Can it fallback to `nurseflow_app_user`?** **NO.** It does not check `DB_USER` or runtime application credentials.
- **D. Can it take the role from `DATABASE_URL`?** **NO.** The runner parses discrete environment variables (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`), not `DATABASE_URL`.
- **E. Can environment variables cause unexpected role substitution?** **YES.** Setting `POSTGRES_ADMIN_USER` or `MIGRATION_USER` substitutes the identity without verification against PostgreSQL catalog role attributes.

### 2.3 Catalog Authority Analysis
A catalog query on `pg_roles` and `pg_namespace` explains why the runner relies on `postgres`:
```json
[
  {
    "rolname": "nurseflow_migration",
    "rolsuper": false,
    "rolcreaterole": true,
    "rolcreatedb": true,
    "can_create_in_public_schema": false,
    "tables_owned": 0
  },
  {
    "rolname": "postgres",
    "rolsuper": true,
    "can_create_in_public_schema": true,
    "tables_owned": 214
  }
]
```
`nurseflow_migration` holds `rolcreaterole` and `rolcreatedb`, but **lacks `CREATE` on schema `public`** and **owns 0 tables**. If the runner connected as `nurseflow_migration`, DDL statements modifying existing tables would immediately fail. Thus, `nurseflow_migration` is **`DESIGN_ONLY`**, and operational schema authority currently rests entirely with the `postgres` superuser.

---

## 3. Auto-Baseline Forensics

### 3.1 Mechanism Trace
Lines 99–103 of `scripts/execute_all_migrations.js`:
```javascript
const tableCountRes = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';");
const publicTableCount = parseInt(tableCountRes.rows[0].count, 10);
const shouldAutoBaseline = (appliedMap.size === 0 && publicTableCount > 50) || isBaselineMode;
```
Lines 139–149:
```javascript
if (shouldAutoBaseline) {
  await client.query(`
    INSERT INTO schema_migrations (migration_id, checksum, applied_at, execution_time_ms, status)
    VALUES ($1, $2, clock_timestamp(), 0, 'APPLIED')
    ON CONFLICT (migration_id) DO UPDATE SET checksum = EXCLUDED.checksum;
  `, [file, checksum]);
  console.log(`  [${file}] ... 📌 BASELINED`);
  passedCount++;
  continue;
}
```

### 3.2 Evaluation Against Forensic Criteria
1. **Trigger:** `(appliedMap.size === 0 && publicTableCount > 50) || isBaselineMode`.
2. **Table Threshold:** Triggered whenever public tables exceed 50 and the tracking table is uninitialized.
3. **DDL Execution Bypassed:** Migration SQL is never parsed or sent to `psql`.
4. **Checksum Recording:** The SHA-256 hash of the local file is calculated and inserted.
5. **Schema Drift Masking:** If any migration was never executed on that physical database, auto-baseline marks it as `APPLIED`, masking schema omission.
- **Classification:** **`REPRODUCIBILITY RISK`**.

---

## 4. Checksum Enforcement Forensics

### 4.1 Lifecycle Trace
Lines 120–133:
```javascript
for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  const checksum = computeChecksum(filePath);
  const existing = appliedMap.get(file);

  if (existing && existing.status === 'APPLIED') {
    if (existing.checksum !== checksum) {
      console.warn(`  [${file}] ⚠️ CHECKSUM_MISMATCH: Migration modified after application! Stored: ${existing.checksum.slice(0, 10)}..., Current: ${checksum.slice(0, 10)}...`);
    } else {
      console.log(`  [${file}] ... ⏭️ SKIPPED (Already applied)`);
    }
    skippedCount++;
    continue;
  }
```

### 4.2 Behavior on Tampered Migration Files
- **Fail Closed:** **NO.**
- **Exit Code:** **0** (does not exit non-zero).
- **Subsequent Migrations Blocked:** **NO.** Execution proceeds to the next file in the loop.
- **Enforcement Status:** **Advisory Only.**
- **Classification:** **`CRITICAL OPEN`**.

---

## 5. Summary Table

| Invariant | Operational State | Security Classification |
| :--- | :--- | :--- |
| **Migration Role Fallback** | Falls back to `postgres` superuser when `MIGRATION_USER` is unset | **`CRITICAL MIGRATION AUTHORITY RISK`** |
| **Dedicated Migration User** | `nurseflow_migration` lacks schema `public` CREATE and table ownership | **`DESIGN_ONLY`** |
| **Checksum Validation** | Warns on stdout, does not fail closed, does not abort pipeline | **`CRITICAL OPEN`** |
| **Auto-Baseline Mechanism** | Present; bypasses DDL execution when public tables > 50 | **`REPRODUCIBILITY RISK`** |
| **Clean-Slate Replay** | Never proven on empty database | **`CLEAN_SLATE_REPLAY = NOT_VERIFIED`** |
