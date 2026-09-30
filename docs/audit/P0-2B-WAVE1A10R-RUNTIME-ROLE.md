# P0-2B Wave 1A.10R — Database Runtime Role & Least Privilege Audit

**Document Identifier:** `SEC-AUD-P02B-W1A10R-RUNTIME-ROLE-20260930`  
**Document Type:** Independent Adversarial Role & Privilege Verification Report  
**Author Role:** Independent Adversarial Security Auditor  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Target Environment:** `nurseflow_enterprise_his` (PostgreSQL 16.15)  
**Date:** 2026-09-30  
**Status:** **`RUNTIME ROLE = VERIFIED_FACT` | `RUNTIME SUPERUSER = REMOVED_FROM_CONFIG` | `SUPERUSER STARTUP GUARD = MISSING`**

---

## 1. Executive Summary

Wave 1A.10 claimed:
```text
RUNTIME APP ROLE = VERIFIED
```

An adversarial inspection of PostgreSQL catalog tables (`pg_roles`, `pg_shadow`), application configuration files (`.env.local`, `server/db/postgresPool.js`), startup scripts (`server/server.js`, `server/config/envValidator.js`), and test suites confirms:
1. **Catalog Role Attributes:** `nurseflow_app_user` exists and strictly adheres to least-privilege principles: `rolsuper = false`, `rolbypassrls = false`, `rolcreaterole = false`, `rolcreatedb = false`.
2. **Pool Configuration Cutover:** `server/db/postgresPool.js` and `.env.local` have transitioned from `postgres` to `nurseflow_app_user`.
3. **Absence of Superuser Startup Guard:** Neither `server/server.js` nor `server/config/envValidator.js` validates that the connected database role is non-superuser. If an operator sets `POSTGRES_USER=postgres` in the environment, Express will silently connect as superuser, completely bypassing all RLS policies.
4. **Hardcoded Fallback Credentials:** `server/db/postgresPool.js` retains hardcoded fallback credentials (`nurseflow_app_user / [REDACTED_DEV_APP_PASSWORD]`), representing a configuration hygiene violation.

---

## 2. PostgreSQL Role Catalog Empirical Verification

Catalog inspection of active roles in `nurseflow_enterprise_his` produces the following verified attributes:

| Role Name | Superuser (`rolsuper`) | Bypass RLS (`rolbypassrls`) | Create Role (`rolcreaterole`) | Create DB (`rolcreatedb`) | Can Login (`rolcanlogin`) | Inherit (`rolinherit`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `nurseflow_app_user` | **false** | **false** | **false** | **false** | **true** | **true** |
| `nurseflow_worker` | **false** | **false** | **false** | **false** | **true** | **true** |
| `nurseflow_readonly` | **false** | **false** | **false** | **false** | **true** | **true** |
| `postgres` | **true** | **true** | **true** | **true** | **true** | **true** |

### Privilege Matrix on Schema `public`:
- **`nurseflow_app_user`:**
  - `CONNECT ON DATABASE nurseflow_enterprise_his` = `GRANTED`
  - `USAGE ON SCHEMA public` = `GRANTED`
  - `SELECT, INSERT, UPDATE, DELETE ON ALL TABLES` = `GRANTED`
  - `USAGE, SELECT, UPDATE ON ALL SEQUENCES` = `GRANTED`
  - `CREATE ON SCHEMA public` = `DENIED`
  - `DROP TABLE / ALTER TABLE` = `DENIED` (Verified: attempting `DROP TABLE encounters` produces SQLSTATE `42501`)

---

## 3. Configuration vs Actual Process Identity

### 3.1 Static Configuration Trace
1. **`.env.local` Inspection:**
   ```properties
   POSTGRES_USER=nurseflow_app_user
   # POSTGRES_PASSWORD redacted
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=nurseflow_enterprise_his
   ```
2. **`server/db/postgresPool.js` Inspection:**
   ```javascript
   export const pool = new Pool({
     user: process.env.POSTGRES_USER || 'nurseflow_app_user',
     password: process.env.POSTGRES_PASSWORD || '[REDACTED_DEV_APP_PASSWORD]',
     host: process.env.POSTGRES_HOST || 'localhost',
     port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
     database: process.env.POSTGRES_DB || 'nurseflow_enterprise_his',
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

### 3.2 Runtime Process Verification
When Express boots and executes database operations via `pool`:
- `current_user` evaluates to `nurseflow_app_user`.
- `session_user` evaluates to `nurseflow_app_user`.
- RLS policies on all 31 tables are actively enforced because `rolbypassrls = false` and `rolsuper = false`.

---

## 4. Superuser Dependency & Fallback Risk Analysis

### 4.1 Fallback Replacement
In prior waves (Wave 1A.8 and earlier), `server/db/postgresPool.js` defaulted to:
```javascript
user: process.env.POSTGRES_USER || 'postgres',
```
In Wave 1A.10, this default was updated to `nurseflow_app_user`.

### 4.2 Missing Startup Guard Defect
An adversarial review of `server/config/envValidator.js` was conducted. The validator checks:
- Required variable presence (`PORT`, `JWT_SECRET`, `DATABASE_URL`, `POSTGRES_PASSWORD`).
- Placeholder secret detection for `JWT_SECRET`.

**CRITICAL GAP:** The validator contains **zero checks** on `POSTGRES_USER` or runtime database privileges:
- It does **not** disallow `POSTGRES_USER=postgres`.
- It does **not** query `SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user` at startup to halt execution if superuser privileges are detected.
- If an environment misconfiguration provides superuser credentials, the application starts normally and silently operates without RLS enforcement.

---

## 5. Security Verdict & Classification

| Control | Claim | Independent Audit Result | Status |
| :--- | :--- | :--- | :---: |
| **Catalog App Role** | Least Privilege (`rolsuper=false`, `rolbypassrls=false`) | Verified via catalog query | `VERIFIED_FACT` |
| **Active Pool Connection** | Express connects as `nurseflow_app_user` | Verified via pool query | `VERIFIED_FACT` |
| **DDL Guard** | `nurseflow_app_user` cannot drop/alter tables | Verified (SQLSTATE `42501`) | `VERIFIED_FACT` |
| **Superuser Removal** | Superuser removed from default config & `.env.local` | Verified in `.env.local` and `postgresPool.js` | `VERIFIED_FACT` |
| **Superuser Startup Guard**| Application halts if superuser configured | Absent from `envValidator.js` | `NOT_VERIFIED` |
| **Credential Hygiene** | Zero plaintext fallback passwords in code | Present in `postgresPool.js` | `FAILED` |
