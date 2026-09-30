# P0-2B Wave 1A.10R — Backup, Database Restore & Application Restore Audit

**Document Identifier:** `SEC-AUD-P02B-W1A10R-RESTORE-20260930`  
**Document Type:** Independent Adversarial Disaster Recovery & Restore Verification Audit  
**Author Role:** Independent Adversarial Security Auditor  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Target Environment:** `nurseflow_enterprise_his` -> `nurseflow_restored_smoke` (PostgreSQL 16.15)  
**Date:** 2026-09-30  
**Status:** **`LOGICAL BACKUP = VERIFIED_FACT` | `DATABASE RESTORE = VERIFIED_FACT` | `APPLICATION RESTORE = NOT_VERIFIED` | `PHYSICAL BACKUP = NOT_APPLICABLE`**

---

## 1. Executive Summary

Wave 1A.10 reported:
```text
APPLICATION RESTORE = VERIFIED
```
and previously claimed "physical backup" parity.

An adversarial investigation was conducted into the backup mechanism, the restore target, and the test implementation in `tests/p02b_wave1a10_security_regression.test.js` (Test 14, lines 398–503).

### Key Adversarial Findings:
1. **Misclassification of Backup Type:** The backup was generated using `pg_dump -Fc`. In PostgreSQL architecture, this is a **Logical Custom-Format Archive**, not a Physical Backup (which requires filesystem snapshots, WAL archiving, or `pg_basebackup`).
2. **Database Restore Succeeded:** The logical archive was successfully restored into target database `nurseflow_restored_smoke` using `pg_restore --clean --if-exists`.
3. **Application Restore Claim Contradicted by Code:**
   - The Express application instance was booted at the start of the regression suite (lines 122–128) using the default `pool`, which was connected to `nurseflow_enterprise_his`.
   - Express was **never reconfigured, restarted, or pointed** to `nurseflow_restored_smoke`.
   - The test verified the restored database solely by instantiating a temporary, isolated Node.js `new pg.Pool({ database: 'nurseflow_restored_smoke' })` and executing raw SQL queries via `withUnitOfWork`.
   - **Zero HTTP requests were routed through Express to the restored database.**
   - Therefore, the claim that "Application Restore" was verified is **factually false and contradicted by the test code**.

---

## 2. Technical Classification: Logical vs Physical Backup

| Attribute | Observed Implementation | Proper Classification | Erroneous Claim |
| :--- | :--- | :--- | :--- |
| **Command** | `pg_dump -Fc -f scratch/dev_backup_smoke.dump` | **Logical Custom-Format Dump** | "Physical Binary Backup" |
| **Data Granularity** | SQL schema DDL + COPY data streams | **Logical Representation** | Block-level / File-level |
| **Point-in-Time** | Transaction snapshot at dump invocation | **Snapshot** | Continuous WAL / PITR |
| **Restore Tool** | `pg_restore -d nurseflow_restored_smoke` | **Catalog & Table Re-creation** | Block-level volume restore |

**Governance Verdict:**
- `LOGICAL CUSTOM-FORMAT BACKUP` = **`VERIFIED_FACT`**
- `PHYSICAL BACKUP` = **`NOT_APPLICABLE`** (Neither performed nor available in repository).

---

## 3. Dissection of Regression Test 14 (Lines 398–503)

The following execution trace from `tests/p02b_wave1a10_security_regression.test.js` reveals exactly what occurred:

```javascript
// Step 1: Dump production/dev DB
execSync(`${pgDumpPath} ... -d nurseflow_enterprise_his -Fc -f "${BACKUP_FILE}"`);

// Step 2: Create restore DB and restore archive
await adminPool.query(`CREATE DATABASE ${RESTORE_DB};`);
execSync(`${pgRestorePath} ... -d ${RESTORE_DB} --clean --if-exists "${BACKUP_FILE}"`);

// Step 3: Grant permissions to nurseflow_app_user
await restoredAdminPool.query(`GRANT CONNECT ON DATABASE ${RESTORE_DB} TO nurseflow_app_user; ...`);

// Step 4: Standalone direct pg.Pool connection (NOT Express!)
const restoredAppPool = new pg.Pool({
  user: 'nurseflow_app_user',
  password: '[REDACTED_DEV_APP_PASSWORD]',
  host: 'localhost',
  port: 5432,
  database: RESTORE_DB // nurseflow_restored_smoke
});

// Step 5: Direct SQL query via withUnitOfWork
const restoredCheck = await withUnitOfWork(restoredAppPool, { tenantId: TENANT_A }, async ({ query }) => {
  const encCount = await query('SELECT count(*) FROM encounters;');
  const patCount = await query('SELECT count(*) FROM master_patients;');
  return { encounters: encCount.rows[0].count, patients: patCount.rows[0].count };
});

await restoredAppPool.end();
```

### Critical Gap Analysis:
- **Express Process Status:** Express remained connected to `nurseflow_enterprise_his` on port 5098.
- **HTTP Routing:** No HTTP route (e.g., `GET /health/ready`, `GET /api/v1/encounters`) was tested against `nurseflow_restored_smoke`.
- **Runtime Pool Cutover:** There was no mechanism tested to re-point `server/db/postgresPool.js` to the restored database without restarting the Node.js process and modifying environment variables.
- **Conclusion:** While the PostgreSQL database restore was successful, the **Application Restore** was not executed.

---

## 4. Disaster Recovery Matrix

| Dimension | Target | Method | Observed Outcome | Audit Status |
| :--- | :--- | :--- | :--- | :---: |
| **Backup Archive** | `nurseflow_enterprise_his` | `pg_dump -Fc` | Valid custom-format dump created | `VERIFIED_FACT` |
| **Database Restore** | `nurseflow_restored_smoke` | `pg_restore` | All tables, indexes, constraints restored | `VERIFIED_FACT` |
| **Catalog Parity** | Restored DB vs Source DB | SQL count comparison | Row counts intact for Tenant A & B | `VERIFIED_FACT` |
| **Direct DB Verification**| Restored DB | Raw `pg.Pool` + UoW | Direct SQL returned expected tenant counts | `VERIFIED_FACT` |
| **Application Process Boot**| Restored DB | Express Gateway | **NEVER BOOTED against restored DB** | `CONTRADICTED` |
| **HTTP Request Traversal**| Restored DB | HTTP Client -> Gateway | **ZERO HTTP requests routed** | `NOT_VERIFIED` |
| **Physical Disaster Recovery**| Bare metal / Block storage | `pg_basebackup` / WAL | Not implemented or tested | `NOT_APPLICABLE` |

---

## 5. Security Verdict

Wave 1A.10's claim of `APPLICATION RESTORE = PASS` is downgraded to:
```text
DATABASE RESTORE = VERIFIED_FACT
APPLICATION RESTORE = NOT_VERIFIED
```
