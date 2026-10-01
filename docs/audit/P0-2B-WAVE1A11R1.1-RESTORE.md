# P0-2B WAVE 1A.11R.1 APPLICATION RESTORE & DISASTER RECOVERY AUDIT

**Audit Date:** 2026-10-01  
**Auditor:** Independent Security Auditor (Antigravity AI)  
**Standard:** Enterprise HIS Strict Read-Only Adversarial Audit  
**Target Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Artifacts Audited:**  
- `scratch/verify_real_application_restore.js`  
- `scratch/wave1a11_application_restore_evidence.json`  
- `tests/p02b_wave1a11_security_regression.test.js` (TEST-12)  

---

## 1. Executive Summary

Wave 1A.11 claimed that "Application Restore" had been fully proven end-to-end, establishing that the Express application and native pool can cleanly bind to a restored database and serve isolated multi-tenant traffic.

This adversarial audit evaluates the evidence across three distinct architectural claims:
1. **Database Restore (`pg_dump` $\rightarrow$ `pg_restore`):** **`VERIFIED_FACT (LAB_ONLY)`**
2. **Application Restore (Express Process $\rightarrow$ Restored DB):** **`VERIFIED_WITH_LIMITATION (LAB_ONLY)`**
3. **Tenant Isolation After Restore:** **`PARTIAL_PROOF (LIMITED TO ENCOUNTERS)`**
4. **Automated Regression Binding:** **`STATIC EVIDENCE CHECK (DEFICIENT)`**

---

## 2. Laboratory Restore Execution Forensics

Inspection of `scratch/verify_real_application_restore.js` confirms the laboratory drill sequence:

### Sequence of Events:
1. **Database Export:**
   `pg_dump.exe -h localhost -p 5432 -U postgres -d nurseflow_enterprise_his -Fc -f "scratch/dev_backup_app_restore.dump"`
   - Output: Compressed logical custom archive created successfully.
2. **Target Provisioning:**
   `DROP DATABASE IF EXISTS nurseflow_restored_app_test; CREATE DATABASE nurseflow_restored_app_test;`
3. **Database Import:**
   `pg_restore.exe -h localhost -p 5432 -U postgres -d nurseflow_restored_app_test --clean --if-exists "scratch/dev_backup_app_restore.dump"`
   - Output: Restored all public schema tables, constraints, sequences, and catalog policies into `nurseflow_restored_app_test`.
4. **Permission Grants:**
   Targeted admin client granted CONNECT, USAGE, and CRUD permissions to `nurseflow_app_user`.
5. **Express Boot:**
   Spawned a child process running `node server/server.js` on ephemeral port 5099 with environment variables:
   ```javascript
   const serverEnv = {
     ...process.env,
     NODE_ENV: 'development',
     PORT: '5099',
     POSTGRES_DB: 'nurseflow_restored_app_test',
     POSTGRES_USER: 'nurseflow_app_user',
     POSTGRES_PASSWORD: appUserPassword,
     JWT_SECRET: sharedSecret
   };
   ```
6. **HTTP Verification:**
   - Queried `GET /health/live` and `GET /health/ready` $\rightarrow$ Status 200.
   - Queried `GET /api/v1/encounters` with Tenant A JWT $\rightarrow$ Returned 10 records matching Tenant A.
   - Queried `GET /api/v1/encounters` with Tenant B JWT $\rightarrow$ Returned 10 records matching Tenant B.
   - Queried `GET /api/v1/encounters/:encA` with Tenant B JWT $\rightarrow$ Returned 404 Not Found (BOLA denial).

---

## 3. Critical Limitations & Identity Gaps

While the laboratory drill executed smoothly, three major limitations prevent this from being classified as an unreserved pass:

### Gap 1: Express HTTP Layer Lacks Database Identity Reflection
The audit examined `server/services/healthCheck.service.js` to determine whether `/health/ready` or `/health/deep` empirically proves connection to `nurseflow_restored_app_test`:
```javascript
// server/services/healthCheck.service.js: lines 23-30
getReadyHealth: () => {
  return {
    status: 'READY',
    database: 'CONNECTED', // HARDCODED STRING!
    redis: 'CONNECTED',    // HARDCODED STRING!
    timestamp: new Date().toISOString()
  };
}
```
And in `getDeepHealth()`:
```javascript
database: {
  status: 'UP',
  engine: 'PostgreSQL 16',
  activeConnections: 12, // HARDCODED INT!
  maxPoolSize: 200,      // HARDCODED INT!
  poolUtilizationPct: 6.0 // HARDCODED FLOAT!
}
```
**Finding:** The observability endpoints return **hardcoded mock telemetry**! They do not execute `SELECT current_database()` or sample the live `pg.Pool`.
Consequently, an HTTP client cannot verify from health probes which physical database the Express gateway is communicating with.

### Gap 2: Potential Silent Fallback in Singleton Connection Pools
In `server/db/postgresPool.js`:
```javascript
const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  // ... populates process.env ...
}
export const pool = new Pool({
  // ...
  database: process.env.POSTGRES_DB || 'nurseflow_enterprise_his'
});
```
When `spawn()` passes `POSTGRES_DB: 'nurseflow_restored_app_test'`, `process.env.POSTGRES_DB` takes precedence. However, if any sub-service imports a direct connection or helper that initializes before environment parsing, it risks falling back to `nurseflow_enterprise_his`.

### Gap 3: Automated Regression TEST-12 is a Static Evidence Check
Inspection of `tests/p02b_wave1a11_security_regression.test.js` (lines 418-432):
```javascript
// TEST-12: Application Restore Verification
const restoreEvidenceExists = fs.existsSync('scratch/wave1a11_application_restore_evidence.json');
let restoreVerified = false;
if (restoreEvidenceExists) {
  const data = JSON.parse(fs.readFileSync('scratch/wave1a11_application_restore_evidence.json', 'utf8'));
  restoreVerified = data.overallResult === 'APPLICATION_RESTORE_VERIFIED' && 
                    Boolean(data.steps?.crossTenantReadDenial?.denied);
}
recordTest('TEST-12', 'Application Restore Verification', 'Empirical restore test completed successfully', ...);
```
**CRITICAL FINDING:**
- In the CI/automated regression suite, **TEST-12 does not run a restore drill**.
- It does not spawn Express or test any database connection.
- It simply asserts that the static JSON file `scratch/wave1a11_application_restore_evidence.json` exists on disk!
- **Classification:** **`STATIC EVIDENCE CHECK`**, not active application verification.

---

## 4. Separation of Architectural Claims

| Architectural Domain | Claim Evaluated | Verified Evidence | Status |
|---|---|---|---|
| **Database Restore** | PostgreSQL dump restores schema and data without error | `pg_dump` -Fc + `pg_restore` executed cleanly into lab target | **`VERIFIED_FACT (LAB_ONLY)`** |
| **Application Restore** | Express boots and binds pool to restored database target | Process spawned with `POSTGRES_DB` and responded to HTTP queries | **`VERIFIED_WITH_LIMITATION (LAB_ONLY)`** |
| **Post-Restore Isolation** | Restored RLS and UoW enforce multi-tenant separation | Encounters endpoint isolated Tenant A from Tenant B | **`PARTIAL_PROOF (Encounter domain only)`** |
| **Regression Coverage** | Automated test suite validates disaster recovery readiness | Test suite only reads static JSON artifact | **`STATIC EVIDENCE CHECK`** |

---

## 5. Audit Conclusion

The application restore drill demonstrated that the platform's database export and restore mechanisms function under lab conditions. However, the lack of live HTTP database reflection and the static nature of regression TEST-12 require this capability to be graded **`VERIFIED_WITH_LIMITATION`**.
