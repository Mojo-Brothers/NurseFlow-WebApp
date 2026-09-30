# P0-2B Wave 1A.11 — Real Application Restore & Disaster Recovery Verification

**Document Identifier:** `SEC-AUD-P02B-W1A11-APPLICATION-RESTORE-20260930`  
**Document Type:** Disaster Recovery, Logical Archive & Express HTTP Traversal Audit  
**Author Role:** Principal Security Architect & Database Reliability Engineer  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Date:** 2026-09-30  
**Status:** **`CRIT-02 REMEDIATED` | `APPLICATION RESTORE = VERIFIED_FACT` | `HTTP TRAVERSAL = PASS`**

---

## 1. Executive Summary

In Wave 1A.10R, **CRIT-02** was confirmed:
- Wave 1A.10 claimed `APPLICATION_RESTORE = PASS`, but test code inspection revealed that Express was **never pointed to, booted against, or tested with HTTP requests targeting** the restored database. Testing was performed strictly via standalone Node.js `pg.Pool` raw SQL queries.

In Wave 1A.11, an end-to-end, empirical application restore drill was executed (`scratch/verify_real_application_restore.js`):
1. Created a logical custom-format backup (`pg_dump -Fc`) of `nurseflow_enterprise_his`.
2. Created target disposable database `nurseflow_restored_app_test` and restored the archive using `pg_restore`.
3. Granted least-privilege permissions to `nurseflow_app_user`.
4. Spawned an independent Express server process on ephemeral port `5099` targeting `nurseflow_restored_app_test`.
5. The application validated runtime least-privilege role identity via `assertRuntimeDatabaseSafety` and successfully booted.
6. Real HTTP client requests were issued through Express routes, controllers, services, and Unit of Work, proving operational health, Tenant A data retrieval, Tenant B data retrieval, and cross-tenant access denial (404 Not Found).

---

## 2. Real Application Restore Execution Trace

### 2.1 Step-by-Step Procedure
```text
==============================================================================
NURSEFLOW P0-2B WAVE 1A.11 — REAL APPLICATION RESTORE VERIFICATION
==============================================================================

1. Creating logical custom-format backup (pg_dump -Fc)...
   ✅ Dump created successfully at: scratch/dev_backup_app_restore.dump
2. Preparing target database: nurseflow_restored_app_test
   ✅ Target database created.
3. Restoring archive using pg_restore...
   ✅ pg_restore completed successfully.
4. Configuring permissions for nurseflow_app_user on restored database...
   ✅ Permissions granted to nurseflow_app_user.
5. Spawning real Express server process on port 5099 targeting [nurseflow_restored_app_test]...
   ✅ Express server booted successfully on http://localhost:5099

6. Testing Observability & Readiness via HTTP...
   Live: 200, Ready: 200 -> PASS

7. Generating tokens and querying restored application...
   Tenant A Encounters: 200 (10 records, strictly Tenant A: true)
   Tenant B Encounters: 200 (10 records, strictly Tenant B: true)
   Cross-Tenant Read (Tenant A -> Tenant B id): Status 404 -> DENIED (PASS)

==============================================================================
REAL APPLICATION RESTORE VERIFICATION: ✅ VERIFIED_FACT
==============================================================================

🛑 Terminated ephemeral Express server process.
🧹 Dropped restored test database: nurseflow_restored_app_test
```

---

## 3. Required Evidence Matrix

| Evidence Dimension | Required Invariant | Observed Evidence | Result |
| :--- | :--- | :--- | :---: |
| **RESTORED_DB_IDENTITY** | Standalone target database | `nurseflow_restored_app_test` on `localhost:5432` | `PASS` |
| **EXPRESS_BOOT_SUCCESS** | Express boots and listens on target DB | Booted on port 5099 with `POSTGRES_DB=nurseflow_restored_app_test` | `PASS` |
| **RUNTIME_ROLE** | Least-privilege `nurseflow_app_user` | Validated by `assertRuntimeDatabaseSafety` on startup | `PASS` |
| **TENANT_A_HTTP_RESULT** | HTTP 200 with strictly Tenant A data | 10 records returned; 100% `tenant_id === Tenant A` | `PASS` |
| **TENANT_B_HTTP_RESULT** | HTTP 200 with strictly Tenant B data | 10 records returned; 100% `tenant_id === Tenant B` | `PASS` |
| **CROSS_TENANT_DENIAL** | Cross-tenant access denied via HTTP | `GET /api/v1/encounters/:tenantB_id` returned `404 NOT FOUND` | `PASS` |

---

## 4. Architectural Comparison: 1A.10 vs 1A.11

| Dimension | Wave 1A.10 (Invalid Claim) | Wave 1A.11 (Empirical Truth) |
| :--- | :--- | :--- |
| **Express Process Target** | `nurseflow_enterprise_his` (Never cut over) | `nurseflow_restored_app_test` (Process spawned with env) |
| **Verification Method** | Standalone `pg.Pool` raw SQL | Real HTTP requests to `http://localhost:5099` |
| **Code Path Traversed** | `test script -> SQL` | `HTTP -> Express -> Middleware -> Controller -> Service -> UoW -> DB` |
| **RLS Verification** | Direct SQL query | HTTP endpoint with JWT claims propagation |
| **Disaster Recovery Status** | **`NOT_VERIFIED`** | **`VERIFIED_FACT`** |

---

## 5. Security Verdict

- **CRIT-02 Remediation Status:** **`REMEDIATED`**
- **Disaster Recovery Classification:** **`LOGICAL CUSTOM-FORMAT RESTORE (VERIFIED)`**
- **Application Restore Status:** **`VERIFIED_FACT`**
