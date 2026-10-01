# P0-2B Wave 1A.11R — Application Disaster Recovery Restore Verification

**Document Identifier:** `SEC-AUD-P02B-W1A11R-RESTORE-20261001`  
**Document Type:** Disaster Recovery, Logical Archive & Express Application Restore Forensic Audit  
**Author Role:** Independent Adversarial Security Auditor & Database Reliability Engineer  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Current Branch:** `feature/security-foundation-wave1a10`  
**Status:** **`CRIT-02 REMEDIATED IN LAB` | `APPLICATION RESTORE = LAB_ONLY (VERIFIED_WITH_LIMITATION)`**

---

## 1. Executive Summary & Terminology Governance

In Wave 1A.10R, **CRIT-02** was established when audit inspection revealed that the Wave 1A.10 restore test had never booted or directed Express HTTP traffic to the restored database, relying solely on raw SQL queries in a test runner.

In Wave 1A.11, the engineering team executed `scratch/verify_real_application_restore.js`:
- Created an archive of `nurseflow_enterprise_his` using `pg_dump -Fc`.
- Restored into an isolated disposable test database `nurseflow_restored_app_test` via `pg_restore`.
- Spawned an independent Node.js process executing `node server/server.js` on port `5099` with `POSTGRES_DB=nurseflow_restored_app_test`.
- Issued HTTP requests over the live Express REST pipeline for healthchecks and multi-tenant queries.

### Absolute Terminology Standard:
- **`LOGICAL CUSTOM-FORMAT BACKUP`**: The archive was created using `pg_dump -Fc`. This is an object-level logical dump, NOT a physical block-level or file-system backup. It must never be termed physical backup.
- **`DATABASE RESTORE`**: Successful schema and row reconstitution via `pg_restore --clean --if-exists`.
- **`APPLICATION RESTORE`**: Booting the application gateway and validating operational functionality over the HTTP network layer against the restored database.

---

## 2. Forensic Trace of the Application Restore Harness

The audit inspected `scratch/verify_real_application_restore.js` and `scratch/wave1a11_application_restore_evidence.json`:

### 2.1 Drill Execution Steps:
1. **Archive Generation:**
   ```bash
   pg_dump -h localhost -p 5432 -U postgres -d nurseflow_enterprise_his -Fc -f scratch/dev_backup_app_restore.dump
   ```
   Archive size: ~3.08 MB (representing 214 tables, 5,104 encounters, 5,162 patients).
2. **Target Database Creation:**
   ```sql
   DROP DATABASE IF EXISTS nurseflow_restored_app_test;
   CREATE DATABASE nurseflow_restored_app_test;
   ```
3. **Archive Restoration:**
   ```bash
   pg_restore -h localhost -p 5432 -U postgres -d nurseflow_restored_app_test --clean --if-exists scratch/dev_backup_app_restore.dump
   ```
4. **Least-Privilege Permission Grant:**
   Granted `CONNECT`, `USAGE`, and standard table DML on `nurseflow_restored_app_test` to `nurseflow_app_user`.
5. **Express Process Spawn:**
   Spawned child process with environment:
   ```javascript
   serverEnv = {
     ...process.env,
     NODE_ENV: 'development',
     PORT: '5099',
     POSTGRES_DB: 'nurseflow_restored_app_test',
     POSTGRES_USER: 'nurseflow_app_user',
     POSTGRES_PASSWORD: appUserPassword,
     JWT_SECRET: sharedSecret
   };
   serverProcess = spawn('node', ['server/server.js'], { env: serverEnv });
   ```
6. **Startup Role Guard Verification:**
   On startup, `server/server.js` executed `assertRuntimeDatabaseSafety(pool)`. Because `POSTGRES_DB` was set to `nurseflow_restored_app_test`, `postgresPool.js` connected to the restored database, verified that `current_user` was `nurseflow_app_user` (`rolsuper=false`, `rolbypassrls=false`), and allowed Express to call `app.listen(5099)`.
7. **HTTP Request Traversal:**
   - `GET /health/live` -> 200 OK.
   - `GET /health/ready` -> 200 OK.
   - Tenant A (`dr_siti_restore`): `GET /api/v1/encounters?limit=10` -> Returned 10 records, 100% `tenant_id === Tenant A`.
   - Tenant B (`dr_budi_restore`): `GET /api/v1/encounters?limit=10` -> Returned 10 records, 100% `tenant_id === Tenant B`.
   - Cross-Tenant: Tenant A token querying Tenant B encounter -> Returned `404 Not Found`.
8. **Teardown & Cleanup:**
   - Terminated child process (`serverProcess.kill()`).
   - Executed `DROP DATABASE IF EXISTS nurseflow_restored_app_test;`.

---

## 3. Independent Audit Findings & Limitations

While the drill represents significant engineering progress over Wave 1A.10, this independent audit identifies three critical limitations:

### 3.1 Limitation 1: Lack of Runtime Database Identity Reflection Over HTTP
In `scratch/verify_real_application_restore.js`, the assertion that Express was querying `nurseflow_restored_app_test` relies on Node's `process.env` inheritance within `server/db/postgresPool.js`.
The Express server has no HTTP diagnostic endpoint returning the physical `current_database()` (inspection of `healthCheck.service.js` revealed `/health/deep` returns static/mock diagnostic objects).
Furthermore, the harness did not insert a distinct canary record into `nurseflow_restored_app_test` prior to the HTTP GET to prove incontrovertibly that Express was reading from the restored database rather than `nurseflow_enterprise_his`.

### 3.2 Limitation 2: Regression Suite TEST-12 is Static Evidence Binding
In `tests/p02b_wave1a11_security_regression.test.js`, lines 417–432:
```javascript
const restoreEvidenceExists = fs.existsSync('scratch/wave1a11_application_restore_evidence.json');
let restoreVerified = false;
if (restoreEvidenceExists) {
  const data = JSON.parse(fs.readFileSync('scratch/wave1a11_application_restore_evidence.json', 'utf8'));
  restoreVerified = data.overallResult === 'APPLICATION_RESTORE_VERIFIED' && Boolean(data.steps?.crossTenantReadDenial?.denied);
}
recordTest('TEST-12', 'Application Restore Verification...', 'Empirical restore test completed successfully', ...);
```
Test 12 in the automated test runner **does not execute an application restore drill**. It merely verifies that a static JSON evidence file exists on disk. If the database environment changes or migrations are added, TEST-12 continues to pass blindly based on historical JSON.

### 3.3 Limitation 3: Disposable Lab Environment Only
The restore drill was performed entirely within an ephemeral local scratch database (`nurseflow_restored_app_test`) that was dropped immediately. It has never been tested in staging, a containerized CI runner, or an automated disaster recovery pipeline.

---

## 4. Verification Matrix

| Dimension | Invariant | Verified Reality | Status |
| :--- | :--- | :--- | :---: |
| **Backup Format** | Logical custom format (`pg_dump -Fc`) | Archive generated at `scratch/dev_backup_app_restore.dump` | **`VERIFIED_FACT`** |
| **Target Database** | Isolated disposable database | `nurseflow_restored_app_test` on `localhost:5432` | **`VERIFIED_FACT`** |
| **Database Restore** | Replay via `pg_restore` | All tables and rows reconstituted cleanly | **`VERIFIED_FACT`** |
| **Express Process** | Separate OS process | Spawned via `child_process.spawn('node', ['server/server.js'])` | **`VERIFIED_FACT`** |
| **Application Port** | Ephemeral non-colliding port | Port 5099 bound and listened | **`VERIFIED_FACT`** |
| **Runtime Identity** | Least-privilege role | `nurseflow_app_user` validated by `assertRuntimeDatabaseSafety` | **`VERIFIED_FACT`** |
| **Tenant Isolation** | HTTP traversal via UoW | Tenant A 200, Tenant B 200, Cross-tenant 404 | **`VERIFIED_FACT`** |
| **HTTP DB Reflection**| Endpoint asserts connected DB name | Not present (Relies on process env inheritance) | **`LIMITATION`** |
| **Regression Binding**| Active test execution in test runner | Test 12 reads static JSON file | **`LIMITATION`** |
| **Target Lifecycle** | Ephemeral disposable lab only | Dropped after test (`DROP DATABASE`) | **`LAB_ONLY`** |

---

## 5. Security Verdict

- **CRIT-02 Remediation Status:** **`REMEDIATED IN LAB`**
- **Disaster Recovery Archive Classification:** **`LOGICAL CUSTOM-FORMAT BACKUP`**
- **Database Restore Status:** **`VERIFIED_FACT`**
- **Application Restore Status:** **`LAB_ONLY (VERIFIED_WITH_LIMITATION)`**
- **Mandate for Wave 1B:** Implement an active canary-based application restore check in CI and provide an authenticated admin diagnostic endpoint reflecting physical `current_database()`.
