# P0-2B Wave 1A.10R — Test Reconciliation: Wave 1A.9 vs Wave 1A.10

**Document Identifier:** `SEC-AUD-P02B-W1A10R-TEST-RECONCILIATION-20260930`  
**Document Type:** Independent Adversarial Test Suite Reconciliation & Coverage Audit  
**Author Role:** Independent Adversarial Security Auditor  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Target Environment:** `nurseflow_enterprise_his` (PostgreSQL 16.15)  
**Date:** 2026-09-30  
**Status:** **`TEST RECONCILIATION = REDUCED_COVERAGE` | `1A.9: 16 TESTS` | `1A.10: 14 TESTS`**

---

## 1. Executive Summary

Wave 1A.10 reported:
```text
REGRESSION SUITE: 14/14 PASS
ALL CRITICAL CONTROLS VERIFIED
```
This follows Wave 1A.9's report of `16/16 PASS` across standardized test vectors `TEST-01` through `TEST-16`.

A line-by-line reconciliation was performed between the Wave 1A.9 test suite and the Wave 1A.10 regression suite (`tests/p02b_wave1a10_security_regression.test.js`).

**Key Findings:**
1. **Structural Shift in Testing Strategy:** Wave 1A.10 successfully expanded coverage to the Express HTTP layer for the Clinical Encounter domain (introducing 6 HTTP tests including healthchecks and cross-tenant route denials).
2. **Silent Coverage Reduction:** 5 critical security tests from Wave 1A.9 were **omitted or not re-implemented** in the Wave 1A.10 suite:
   - `TEST-06`: Zero-policy table access blackout prevention outside UoW.
   - `TEST-09`: Worker role (`nurseflow_worker`) non-superuser RLS isolation.
   - `TEST-14`: Automated migration rollback drill within the regression runner.
   - `TEST-15`: Invalid / forged UUID tenant claim rejection.
   - `TEST-16`: Full 213-table schema baseline checksum verification.
3. **Invalid Application Restore Test:** Test 14 claimed application restore verification, but never routed traffic to Express or booted Express against the restored database.

---

## 2. Granular 1-to-1 Test Mapping Matrix

| Wave 1A.9 Test Vector | Wave 1A.10 Equivalent Test | Result | Category | Technical Reason / Coverage Impact |
| :--- | :--- | :---: | :---: | :--- |
| **TEST-01:** Superuser RLS Bypass Prevention | **Test 1:** Runtime Application User Identity | `PASS` | `REIMPLEMENTED` | Verifies `nurseflow_app_user` catalog flags (`rolsuper=false`, `rolbypassrls=false`). |
| **TEST-02:** Cross-Tenant Direct PK Tampering | **Test 7 & 8:** Cross-Tenant Read & Mutation Denial | `PASS` | `REPLACED_HTTP` | Shifted from direct SQL UPDATE to HTTP route (`GET /encounters/:id`, `PATCH /encounters/:id/status`). |
| **TEST-03:** Cross-Tenant Encounter ID Spoofing | **Test 11:** Composite FK Enforcement | `PASS` | `REIMPLEMENTED` | Direct SQL insert on `longitudinal_care_plans` asserting SQLSTATE `23503`. |
| **TEST-04:** Missing Tenant Context Rejection | **Test 9:** Unauthenticated Access (No Bearer Token) | `PASS` | `REPLACED_HTTP` | Replaced unit-level `withUnitOfWork(null)` test with Express 401 HTTP middleware guard. |
| **TEST-05:** Child Table Orphan Injection | **Test 11:** Composite FK Enforcement | `PASS` | `MERGED` | Merged into composite foreign key enforcement test. |
| **TEST-06:** Zero-Policy Table Blackout Prevention | *None* | `OMITTED` | `NOT_REIMPLEMENTED` | **Coverage Drop:** No test queries zero-policy tables outside UoW to assert fail-closed behavior. |
| **TEST-07:** Connection Pool GUC State Leakage | **Test 12 & 13:** Pool Connection Reuse & DISCARD ALL | `PASS` | `REIMPLEMENTED` | Tests GUC clearance on commit and rollback; however, held same client instance. |
| **TEST-08:** Client Query Path UoW Enforcement | **Test 5 & 6:** Tenant A & B Own Data Access | `PASS` | `REPLACED_HTTP` | Tested via Express Encounter service endpoints under UoW. |
| **TEST-09:** Outbox Worker Context Isolation | *None* | `OMITTED` | `NOT_REIMPLEMENTED` | **Coverage Drop:** Role `nurseflow_worker` is never checked or tested in 1A.10 suite. |
| **TEST-10:** DDL Privilege Escalation Guard | **Test 2:** Privilege Escalation Guard (DROP TABLE) | `PASS` | `REIMPLEMENTED` | Verifies application user cannot execute `DROP TABLE encounters;`. |
| **TEST-11:** Emergency Clinical Override Auditing | **Test 12:** (Implicit via `app.current_user_id`) | `PASS` | `MERGED` | Injected in pool test; explicit audit log row verification omitted. |
| **TEST-12:** Database Disaster Recovery PITR | **Test 14:** Application Restore Smoke Test | `FAIL/INVALID` | `REIMPLEMENTED_INVALID` | Executed `pg_dump` and `pg_restore`, but **failed to boot or test Express** against restored DB. |
| **TEST-13:** Child Table Null/Orphan Integrity | *None* | `OMITTED` | `NOT_REIMPLEMENTED` | Verified in migration 078 script, but omitted from regression suite assertions. |
| **TEST-14:** FK Lock Contention & Rollback Drill | *None* | `OMITTED` | `NOT_REIMPLEMENTED` | Rollback script created (`scripts/rollback_stage0_migrations.js`) but **unexecuted** in test suite. |
| **TEST-15:** JWT Tenant Claim Tampering | *None* | `OMITTED` | `NOT_REIMPLEMENTED` | Unit test for invalid UUID handling was omitted from automated regression suite. |
| **TEST-16:** Schema Baseline Checksum Verification | *None* | `OMITTED` | `NOT_REIMPLEMENTED` | Table count / schema verification omitted from automated suite. |

---

## 3. Wave 1A.10 New Tests Introduced

The Wave 1A.10 suite added 4 tests that were not present in Wave 1A.9:
1. **`GET /health/live` (Test 3):** Asserts HTTP 200 on RFC 8617 liveness endpoint (`OBSERVABILITY`).
2. **`GET /health/ready` (Test 4):** Asserts HTTP 200 on readiness endpoint (`OBSERVABILITY`).
3. **`Tenant A Own Data Access (GET /api/v1/encounters)` (Test 5):** Asserts HTTP 200 and strict filtering of encounters to Tenant A.
4. **`Tenant B Own Data Access (GET /api/v1/encounters)` (Test 6):** Asserts HTTP 200 and strict filtering of encounters to Tenant B.

---

## 4. Adversarial Findings on Test Suite Assertions

### 4.1 Child BOLA Assertion
- **Claim:** `CHILD_BOLA = PASS`
- **Adversarial Inspection:** Lines 290–302 test RLS on `longitudinal_care_plans` via a raw SQL query inside `withUnitOfWork`. Lines 305–323 test composite foreign key enforcement via raw SQL `INSERT`.
- **Verdict:** There is **zero HTTP API coverage** for any child table (`longitudinal_care_plans`, `medication_emar_administrations`, etc.). The test verifies database-level RLS and FK constraints, but does not verify application-level BOLA defenses in Express controllers or routes.

### 4.2 Pool Same-Socket Reuse Assertion
- **Claim:** `SAME-SOCKET REUSE = VERIFIED`
- **Adversarial Inspection:** Lines 339–393 check out a single client `testClient = await pool.connect()`, execute a transaction, call `DISCARD ALL;`, and check `pg_backend_pid()`. Because the client was never released back into the pool and re-acquired by a competing worker, same-socket reuse across pool checkout cycles was **not tested**.

### 4.3 Application Restore Assertion
- **Claim:** `APPLICATION_RESTORE = PASS`
- **Adversarial Inspection:** Lines 451–470 create a standalone `pg.Pool` targeting `nurseflow_restored_smoke`. Express was neither restarted nor pointed to this database. No HTTP request was issued. The claim is contradicted by the test script.

---

## 5. Security Verdict

- **Test Suite Result:** 13 valid test assertions, 1 invalid assertion (Test 14).
- **Security Coverage Status:** `REDUCED / PARTIAL`.
- **Finding:** While HTTP integration for Encounters represents legitimate architectural progress, omitting worker role isolation, rollback execution, and invalid tenant claims in the automated regression suite constitutes an unacceptable regression in security test coverage.
