# P0-2B Wave 1A.5.4 — Required Revision Closure Audit

**Audit Date:** 2026-09-28  
**Audit Scope:** Closure Audit of Wave 1A.5.3 Adversarial Review Findings (REV-01 through REV-08+)  
**Auditor Roles:** Principal Security Architect, PostgreSQL Security Engineer, Application Security Auditor, Distributed Systems & Transaction Engineer, Healthcare HIS Security & Reliability Auditor, Adversarial Architecture Reviewer  
**Production Changes:** FALSE  
**Current Security Foundation:** NOT_READY  
**Wave 1B Status:** HOLD  

---

## Executive Summary

Phase P0-2B Wave 1A.5.4 conducts an exhaustive, empirical closure audit against all findings and revisions proposed during the Wave 1A.5.3 adversarial review. In accordance with strict engineering protocols, **findings from Wave 1A.5.3 were not accepted blindly**. Every claim was reproduced on disposable PostgreSQL fixtures or verified against actual repository call graphs before determining its final validity and disposition.

### Key Audit Highlights:
1. **REV-01 (Pool Cleanup Safety):** `PROVEN_BY_DISPOSABLE_TEST`. `SET LOCAL` is 100% discarded upon normal `COMMIT` or `ROLLBACK`. However, when a client is released to the pool while a transaction is still active (`_inTransaction === true`), the connection retains the transaction and tenant context. PostgreSQL rejects `DISCARD ALL` inside an active transaction (`ERROR 25001`). Thus, the cleanup interceptor must issue `ROLLBACK;` first, followed by `DISCARD ALL;`.
2. **REV-02 (Hardcoded Fallback Inventory):** `PROVEN`. Scanned 170 occurrences across the codebase. Exactly **7 production `SECURITY_CRITICAL` fallbacks** exist in active controllers and services (`masterDataHub.controller.js`, `clinicalNotesApplication.service.js`, `cpoeApplication.service.js`, `medicationClosedLoop.service.js`, `triageApplication.service.js`). Furthermore, 5 of these service methods expose a cross-tenant substitution hazard (`targetTenantId = encounter.tenant_id || actor.tenantId`) without verifying actor-to-encounter tenant matching.
3. **REV-03 (Nested Transaction & SAVEPOINT):** `PROVEN_BY_DISPOSABLE_TEST`. PostgreSQL does not error on nested `BEGIN`, but ignores it with a warning; an inner `COMMIT` commits the outer transaction prematurely. `SAVEPOINT` provides clean sub-operation isolation and accurately reverts `SET LOCAL` upon `ROLLBACK TO SAVEPOINT`.
4. **REV-04 (AsyncLocalStorage Context):** `PROVEN_BY_DISPOSABLE_TEST`. ALS flawlessly propagates across async/await, `Promise.all`, and `AbortSignal`. However, ALS **completely loses context** in event-driven worker queues and background job dispatchers. Architectural decision: ALS cannot be the sole context bearer; explicit context in a Scoped Unit-of-Work is mandatory.
5. **REV-05 (21 Zero-Policy Tables):** `PROVEN`. All 21 tables identified in Wave 1A.5.3 have `tenant_id` present as a direct column (`DIRECT_TENANT`). RLS was enabled on them without any `CREATE POLICY` statements. Under non-superuser role `nurseflow_app_user`, PostgreSQL enforces **default-deny**, which would immediately brick perioperative, blood bank, pharmacy dispensing, and CSSD workflows.
6. **REV-06 (RLS USING vs WITH CHECK):** `REFUTED` (for standard `FOR ALL`) / `REVISE`. PostgreSQL engine semantics dictate that `FOR ALL USING (expression)` automatically applies the `USING` clause as the `WITH CHECK` expression on `INSERT` and `UPDATE`. Disposable testing confirmed that cross-tenant `INSERT` and `UPDATE` tampering are blocked. Explicit `WITH CHECK` is retained for clarity, but the claim of active vulnerability was refuted.
7. **REV-07 (SECURITY DEFINER Outbox Hardening):** `PROVEN_BY_DISPOSABLE_TEST`. PostgreSQL grants `EXECUTE` on new functions to `PUBLIC` by default. Hardened implementation requires explicit `REVOKE FROM PUBLIC`, `GRANT TO nurseflow_worker ONLY`, and `SET search_path = pg_catalog, public`.
8. **REV-08 (JWT rotateRefreshToken Tenant ID Loss):** `PROVEN`. `refreshPayload` completely omits `tenantId`. `rotateRefreshToken()` invokes `issueTokenPair()` without `tenantId`, causing `issueTokenPair()` to fall back to the default UUID (`10000000-0000-0000-0000-000000000001`). Users from secondary tenants silently switch to Tenant A upon their first token refresh.

---

## 1. Required Revision Register & Detailed Dispositions

| Revision | Finding Summary | Severity | Validation Method | Root Cause | Proposed Remediation | New Risks | Final Disposition |
|---|---|---|---|---|---|---|---|
| **REV-01** | `SET LOCAL` leaks across pool client leases | `CRITICAL` | `PROVEN_BY_DISPOSABLE_TEST` (`scratch/p02b_wave1a5_4_rev01_pool_safety.js`) | Client released to pool while transaction remains open (`_inTransaction === true`). `DISCARD ALL` fails inside open transaction (`25001`). | Central transaction wrapper with guaranteed `ROLLBACK` in `finally`, plus pool release hook: if `client._inTransaction`, issue `ROLLBACK; DISCARD ALL;`. On error, `client.release(true)`. | Connection churn if unhandled errors force client destroy. | **ACCEPT** |
| **REV-02** | 38+ files contain hardcoded fallback to default UUID | `CRITICAL` | `PROVEN` (`scratch/p02b_wave1a5_4_rev02_fallback_inventory.js`) | Legacy prototype convenience fallbacks (`|| '00000000-0000-0000-0000-000000000001'`). | Strip fallbacks from 7 production paths; strictly reject unauthenticated / untrusted requests; require explicit `ctx.tenantId`. | Potential 400 errors for legacy test callers if not updated. | **ACCEPT** |
| **REV-03** | Nested transactions collapse without SAVEPOINT | `HIGH` | `PROVEN_BY_DISPOSABLE_TEST` (`scratch/p02b_wave1a5_4_rev03_nested_tx.js`) | PostgreSQL ignores nested `BEGIN`; inner commit commits entire outer tx. | Scoped Unit-of-Work manages transaction depth: top-level creates `BEGIN`, nested calls reuse connection or create explicit `SAVEPOINT` for isolated sub-operations. | Savepoint bloat if abused in high-frequency loops. | **ACCEPT** |
| **REV-04** | ALS context propagation loses state across queues and detached promises | `HIGH` | `PROVEN_BY_DISPOSABLE_TEST` (`scratch/p02b_wave1a5_4_rev04_als_test.js`) | Background event queues and worker event loops decouple from async invocation tree. | Hybrid Context Architecture: Explicit tenant context (`ctx.tenantId`) is the first-class contract; ALS acts only as ambient safety net for tracing. | Developer forgetting to pass `ctx` in background jobs (mitigated by linter). | **REVISE** (Adopt Hybrid, not pure ALS) |
| **REV-05** | 21 tables have RLS enabled with 0 policies, causing total lockout under non-superuser | `CRITICAL` | `PROVEN_BY_DISPOSABLE_TEST` (`scratch/p02b_wave1a5_4_rev05_inventory.js`) | Migration enabled RLS but never executed `CREATE POLICY`. Superuser runtime hid this bug. | Create explicit tenant isolation policies (`FOR ALL USING (tenant_id = app.current_tenant_id)`) for all 21 tables before role cutover. | Migration script complexity; must be ordered before role switch. | **ACCEPT** |
| **REV-06** | Policies lacking `WITH CHECK` allow cross-tenant row updates | `MEDIUM` | `REFUTED` (Engine) / `REVISE` (Discipline) (`scratch/p02b_wave1a5_4_rev06_rls_check.js`) | Misunderstanding of PostgreSQL RLS engine semantics; `FOR ALL USING` automatically applies to `WITH CHECK`. | Standardize explicit `USING (...) WITH CHECK (...)` across all policies for defense-in-depth and clarity. | None; purely declarative hardening. | **REVISE** |
| **REV-07** | `SECURITY DEFINER` outbox function grants `PUBLIC` execute and risks object shadowing | `HIGH` | `PROVEN_BY_DISPOSABLE_TEST` (`scratch/p02b_wave1a5_4_rev07_security_definer.js`) | PostgreSQL default privileges grant `EXECUTE` on new functions to `PUBLIC`. | `REVOKE ALL FROM PUBLIC; GRANT EXECUTE TO nurseflow_worker; SET search_path = pg_catalog, public;` and schema-qualify all table queries. | None. | **ACCEPT** |
| **REV-08** | `rotateRefreshToken()` does not propagate `tenantId`, silently switching tenants | `CRITICAL` | `PROVEN` (`jwtSecurity.service.js:85-93, 211-216`) | `refreshPayload` omitted `tenantId`; `rotateRefreshToken()` omitted `tenantId` in `issueTokenPair()`. | Include `tenantId` in `refreshPayload`; pass `tenantId: payload.tenantId` in `rotateRefreshToken()`. | None; restores correct identity binding. | **ACCEPT** |

---

## 2. Hardcoded Tenant Fallback Inventory (REV-02 Audit)

The exhaustive scan across `server/`, `src/`, and `tests/` categorized 170 instances of UUID patterns and fallbacks:
- **Total Scanned Occurrences:** 170
- **Test Fixtures (Safe):** 63 (`tests/` directory and mock setups)
- **False Positives (Safe):** 49 (Database migration seeds, initial campus seeds, test constants)
- **Security-Relevant Method Signatures (Pending Refactor):** 51 (Methods with default parameter `tenantId = ...`)
- **Security-Critical Production Paths (Active Hazard):** Exactly 7 instances across 5 files:
  1. `server/controllers/masterDataHub.controller.js:130`: `req.headers['x-tenant-id'] || actor.tenantId || '00000000-0000-0000-0000-000000000001'`
  2. `server/services/clinicalNotesApplication.service.js:96`: `encounter.tenant_id || actor.tenantId || '00000000-0000-0000-0000-000000000001'`
  3. `server/services/clinicalNotesApplication.service.js:235`: `encounter.tenant_id || actor.tenantId || '00000000-0000-0000-0000-000000000001'`
  4. `server/services/clinicalNotesApplication.service.js:373`: `encounter.tenant_id || actor.tenantId || '00000000-0000-0000-0000-000000000001'`
  5. `server/services/cpoeApplication.service.js:168`: `encounter.tenant_id || actor.tenantId || '00000000-0000-0000-0000-000000000001'`
  6. `server/services/medicationClosedLoop.service.js:332`: `encounter.tenant_id || actor.tenantId || '00000000-0000-0000-0000-000000000001'`
  7. `server/services/triageApplication.service.js:160`: `encounter.tenant_id || actor.tenantId || '00000000-0000-0000-0000-000000000001'`

### Critical Vulnerability Insight:
In items 2–7, the code uses `targetTenantId = encounter.tenant_id || actor.tenantId`. If an authenticated actor from Tenant A submits an `encounter_id` belonging to Tenant B, the code blindly sets `targetTenantId = Tenant B` without verifying whether `actor.tenantId === encounter.tenant_id`! This allows an attacker to write notes, orders, and triage data into another hospital's tenant partition.

---

## 3. The 21 Zero-Policy Tables Audit (REV-05)

Every single one of the 21 zero-policy tables was inspected for its schema definition, column list, and foreign key relations.

| # | Table Name | `tenant_id` Column? | Foreign Keys | Classification | Required Policy Model |
|---|---|---|---|---|---|
| 1 | `blood_bank_billing_reconciliations` | YES | None | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 2 | `blood_bedside_dual_nurse_verifications` | YES | None | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 3 | `bpjs_claim_disputes` | YES | `submission_id` -> `bpjs_claim_submissions` | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 4 | `bpjs_claim_submissions` | YES | `casemix_case_id` -> `casemix_cases` | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 5 | `bpjs_vclaim_lifecycle_logs` | YES | None | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 6 | `cssd_sterilization_cycles` | YES | None | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 7 | `hemovigilance_incident_investigations` | YES | `verification_id` -> `blood_bedside_dual_nurse_verifications` | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 8 | `inacbg_grouping_results` | YES | `casemix_case_id` -> `casemix_cases` | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 9 | `master_inacbg_tariffs` | YES | None | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 10 | `medical_device_implant_recalls` | YES | None | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 11 | `patient_billing_reconciliation` | YES | None | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 12 | `pharmacy_controlled_substance_logs` | YES | `dispensing_order_id` -> `pharmacy_dispensing_orders` | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 13 | `pharmacy_depots` | YES | None | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 14 | `pharmacy_dispensing_orders` | YES | `depot_id` -> `pharmacy_depots` | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 15 | `post_anesthesia_aldrete_scores` | YES | `surgical_case_id` -> `surgical_cases` | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 16 | `radiology_critical_finding_alerts` | YES | `report_id`, `cpoe_order_id`, `cpoe_item_id` | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 17 | `radiology_instances` | YES | `series_id` -> `radiology_series` | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 18 | `radiology_series` | YES | `study_id` -> `radiology_studies` | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 19 | `surgical_clinical_notes` | YES | `surgical_case_id` -> `surgical_cases` | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 20 | `surgical_teams` | YES | `surgical_case_id` -> `surgical_cases` | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |
| 21 | `who_surgical_safety_checklists` | YES | `surgical_case_id` -> `surgical_cases` | `DIRECT_TENANT` | `FOR ALL USING (tenant_id = app.current_tenant_id)` |

**Finding:** All 21 tables already contain `tenant_id uuid NOT NULL`. The omission was strictly the `CREATE POLICY` statements in legacy migrations.

---

## 4. Resource Resolvers & Clinical Authorization Audit

Section 17 verification matrix for the 7 clinical resource resolvers:

| Resource Resolver | Designed? | Implemented in Service? | Mounted on Route? | Executed in Runtime? | Tested in Production? |
|---|---|---|---|---|---|
| **ENCOUNTER** | YES | YES (`resourceAuthorization.service.js:61`) | NO (0/38 Tier-1 routes) | NO | Unit/Contract Only |
| **PATIENT** | YES | YES (`resourceAuthorization.service.js:63`) | NO (0/38 Tier-1 routes) | NO | Unit/Contract Only |
| **ORDER (Universal)** | YES | YES (`resourceAuthorization.service.js:65`) | NO (0/38 Tier-1 routes) | NO | Unit/Contract Only |
| **SURGERY_CASE** | YES | NO (Missing SQL lookup query) | NO | NO | NO |
| **BLOOD_UNIT** | YES | NO (Missing SQL lookup query) | NO | NO | NO |
| **MEDICATION_ORDER** | YES | NO (Missing SQL lookup query) | NO | NO | NO |
| **CLINICAL_NOTE** | YES | NO (Missing SQL lookup query) | NO | NO | NO |

**Verdict:** The resource authorization framework is partially implemented at the service level, but completely detached from the HTTP perimeter. **Zero routes mount `requireClinicalAuthorization`.**

---

## 5. Child Table BOLA Revalidation

Exhaustive code analysis confirmed that 5 critical child tables are queried by raw primary key without tenant qualification:
1. `medication_emar_administrations` (`medicationClosedLoop.service.js:1318`): `SELECT * FROM medication_emar_administrations WHERE id = $1 FOR UPDATE;`
2. `medication_dispense_allocations` (`medicationClosedLoop.service.js:823`): `SELECT * FROM medication_dispense_allocations WHERE id = $1 FOR UPDATE;`
3. `longitudinal_care_plans` (`careCoordinationAndTimeline.service.js:204`): `SELECT * FROM longitudinal_care_plans WHERE id = $1;`
4. `patient_split_invoices` (`patientFinancialAndRevenueCycle.service.js:261, 374`): `SELECT * FROM patient_split_invoices WHERE id = $1;`
5. `physician_diagnostic_interpretations` (`diagnosticInterpretation.service.js:510`): `SELECT * FROM physician_diagnostic_interpretations WHERE id = $1 FOR UPDATE;`

**Risk Analysis:** Under current superuser runtime execution, PostgreSQL RLS is bypassed. Any authenticated doctor or nurse who knows or guesses a UUID in another hospital can query, modify, and lock records across tenants.

---

## 6. Performance Read-Path Benchmark (Section 20)

Benchmarked on local PostgreSQL 16 over 100 iterations per strategy (`scratch/p02b_wave1a5_4_rev20_perf_benchmark.js`):
- **Strategy 1 (Baseline SELECT with explicit WHERE):** 0.784 ms/op (1,275 ops/sec)
- **Strategy 2 (4 Sequential Round-Trips: BEGIN, SET LOCAL, SELECT, COMMIT):** 1.141 ms/op (876 ops/sec) — **45.5% slowdown**
- **Strategy 3 (Pipelined Multi-Statement in single wire packet):** 0.542 ms/op (1,843 ops/sec) — **30.8% faster than baseline**

**Architectural Takeaway:** Performing 4 separate asynchronous `client.query()` round trips over a real TCP network adds 3–5 ms of latency per read operation. The central database wrapper must use **pipelined commands** or reuse the active Unit-of-Work transaction rather than initiating naive 4-step micro-transactions.
