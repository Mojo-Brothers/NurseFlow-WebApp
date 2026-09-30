# P0-2B Wave 1A.8 — Baseline Security Test Matrix (TEST-01 to TEST-16)

**Document Identifier:** `SEC-TEST-P02B-W1A8-BASELINE-20260930`  
**Document Type:** Pre-Remediation Baseline Security Verification Matrix  
**Author Roles:** Application Security Engineer, PostgreSQL Security Engineer, Principal Security Architect  
**Date:** 2026-09-30  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Status Directive:** **PRE-IMPLEMENTATION BASELINE | ZERO PRODUCTION CHANGES**  

---

## 1. Executive Summary

This matrix establishes the empirical baseline state for all 16 security test vectors prior to executing Stage 0 remediation. 

It defines the exact current vulnerability behavior versus the required target security result, providing the non-negotiable benchmark against which post-remediation verification on staging will be evaluated.

---

## 2. Pre-Remediation Baseline Test Matrix (TEST-01 to TEST-16)

| Test ID | Environment | Target Actor | Target Tenant | Target Resource | Expected Post-Remediation Result | Current Baseline Result (Pre-Remediation) | Empirical Evidence | Baseline Status | Blocker Class |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | Staging / Local | Doctor B | `tenant-bravo` | Clinical Note (`tenant-alpha`) | HTTP 403 Forbidden / 404 Not Found (RFC 7807) | **VULNERABLE:** Controller permits cross-tenant read or falls back to `'tenant-default-001'` | `masterDataHub.controller.js:130`, `clinicalNotesApplication.service.js:96` | 🔴 **FAIL (OPEN)** | **BLOCKER** |
| **TEST-02** | Staging / Local | Doctor A | `tenant-alpha` | Care Plan (Patient 1 vs 2) | HTTP 400 Bad Request (`RESOURCE_PATIENT_MISMATCH`) | **VULNERABLE:** Service permits re-linking care plan to different patient without verification | `scratch/test_child_table_bola_repro.js:Step 4` | 🔴 **FAIL (OPEN)** | **BLOCKER** |
| **TEST-03** | Staging / Local | Billing Clerk | `tenant-alpha` | CPOE Narcotic Prescription | HTTP 403 Forbidden (`INSUFFICIENT_CLINICAL_PRIVILEGE`)| **VULNERABLE:** Route mounts basic JWT only; `requireClinicalAuthorization` unmounted | `scratch/tier1_candidate_routes.json` (0 mounted) | 🔴 **FAIL (OPEN)** | **BLOCKER** |
| **TEST-04** | Staging / Local | System Caller | `null` / empty | `withUnitOfWork` Invocation | Synchronous throw `AUTHORITATIVE_TENANT_REQUIRED` | **VULNERABLE:** Direct pool calls execute queries with empty tenant session GUC | `scratch/db_access_pathways.json` (80 direct calls) | 🔴 **FAIL (OPEN)** | **BLOCKER** |
| **TEST-05** | Staging / Local | Suspended Doctor | `tenant-bravo` | Auth Login / Token Exchange | HTTP 403 Forbidden (`TENANT_MEMBERSHIP_SUSPENDED`) | **VULNERABLE:** Auth validates password only; skips active tenant membership query | `auth.service.js:login` | 🔴 **FAIL (OPEN)** | **BLOCKER** |
| **TEST-06** | Staging / Local | Multi-Campus MD | `tenant-bravo` | JWT Refresh Token Rotation | New access token maintains `tenantId: 'tenant-bravo'` | **VULNERABLE:** Refresh token omits tenantId; silently reverts to headquarters | `jwtSecurity.service.js:211-216` | 🔴 **FAIL (OPEN)** | **BLOCKER** |
| **TEST-07** | Staging / Local | `nurseflow_app_user`| `tenant-alpha` | 21 Zero-Policy RLS Tables | Non-superuser queries succeed for authorized tenant | **CRITICAL LOCKOUT:** Role cannot login (`rolcanlogin = false`); 0 policies cause total blackout | `pg_roles` & `scratch/audit_rls_21_tables_live.js` | 🔴 **FAIL (OPEN)** | **BLOCKER** |
| **TEST-08** | Staging / Local | Attacker | `tenant-bravo` | 5 Child Tables (eMAR, Invoices) | Direct PK query (`WHERE id = $1`) returns 0 rows | **CRITICAL BOLA:** Direct PK reads, updates, and deletes succeed across tenants | `scratch/test_child_table_bola_repro.js` | 🔴 **FAIL (OPEN)** | **BLOCKER** |
| **TEST-09** | Staging / Local | Business Service | `tenant-alpha` | Mid-Transaction Error | Transaction completely rolled back; 0 orphan rows | **PARTIALLY UNMANAGED:** Direct `pool.connect()` call sites have ad-hoc error handling | `server/repositories/` scan (80 unmanaged sites) | 🟡 **UNVERIFIED** | **BLOCKER** |
| **TEST-10** | Staging / Local | Nested Service | `tenant-alpha` | Savepoint Sub-Rollback | Sub-transaction rolls back; outer transaction commits | **NOT IMPLEMENTED:** Legacy code uses flat transactions or crashes on nested BEGIN | Wave 1A.5.4 REV-03 audit | 🟡 **UNVERIFIED** | **BLOCKER** |
| **TEST-11** | Staging / Local | Pooled Client | `tenant-alpha -> B`| Reused DB Connection | Residual session GUC is completely empty / reset | **HAZARDOUS:** Connection returned with active session GUC if unhandled exception | Wave 1A.5.4 REV-01 audit | 🔴 **FAIL (OPEN)** | **BLOCKER** |
| **TEST-12** | Staging / Local | Poisoned Socket | `tenant-alpha` | Socket Broken / Fatal Error | Client destroyed via `client.release(true)` | **INDETERMINATE:** Driver may attempt to reuse poisoned client if release flag unset | Node-postgres driver analysis | 🟡 **UNVERIFIED** | **HIGH** |
| **TEST-13** | Staging / Local | 50 Virtual Users | Multi-Tenant | 10,000 Concurrent Queries | 100% tenant data isolation; 0 cross-tenant leaks | **UNTESTED UNDER NON-SUPERUSER:** Baseline concurrency run only as superuser | Wave 1A.5.4 perf benchmark | 🟡 **UNVERIFIED** | **BLOCKER** |
| **TEST-14** | Staging / Local | External Doctor | `tenant-alpha` | Break-The-Glass Emergency | Access granted; immutable audit log created | **UNMOUNTED:** `requireClinicalAuthorization` unmounted on all 38 routes | `server/routes/` audit (0 of 38 mounted) | 🔴 **FAIL (OPEN)** | **BLOCKER** |
| **TEST-15** | Staging / Local | `nurseflow_app_user`| `tenant-alpha` | `clinical_audit_events` | PostgreSQL `ERROR: 42501` on UPDATE / DELETE | **UNVERIFIED:** `nurseflow_app_user` currently has zero table grants | `scratch/audit_db_baseline_deep.js` | 🟡 **UNVERIFIED** | **HIGH** |
| **TEST-16** | Staging / Local | Client App | `tenant-alpha` | Resent Billing Payment | Exactly 1 database payment row created | **FUNCTIONAL IN CODE:** Idempotency middleware exists, but requires UoW binding | `server/middlewares/idempotency.middleware.js` | 🟢 **PASSING IN DEV**| **NON-BLOCKER** |

---

## 3. Baseline Summary & Gate Implications

- **Total Security Test Vectors:** 16
- **Currently Passing in Dev:** 1 (TEST-16)
- **Currently Failing / Verified Open:** 9 (TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08, TEST-11, TEST-14)
- **Currently Unverified / Staging Pending:** 6 (TEST-09, TEST-10, TEST-12, TEST-13, TEST-15)
- **Blocker Status:** The 9 failing and 6 unverified tests establish why **Stage 0 must be executed strictly on staging**, and why the **Implementation Gate remains BLOCKED for production**.
