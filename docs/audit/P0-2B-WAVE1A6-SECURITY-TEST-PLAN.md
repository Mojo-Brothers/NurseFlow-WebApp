# P0-2B Wave 1A.6 — Master Security Test Plan & Verification Matrix

**Document Identifier:** `SEC-PLAN-P02B-W1A6-TESTPLAN-20260930`  
**Document Type:** Adversarial Security Test Strategy & Acceptance Criteria  
**Author Roles:** Principal Security Architect, Application Security Engineer, PostgreSQL Security Engineer, HIS Clinical Safety Architect  
**Date:** 2026-09-30  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Current Baseline Commit:** `main` (`fd74e62`)  
**Status Directive:** **DESIGN & PLANNING ONLY | STRICTLY ZERO PRODUCTION CHANGES**  

---

## 1. Executive Summary & Test Methodology

This document defines the comprehensive adversarial security test plan required to validate the remediations designed across Wave 1A.6. 

The test strategy encompasses 16 distinct attack vectors and reliability failure modes. In accordance with clinical safety and data integrity standards, **every test case defines unambiguous preconditions, attack inputs, expected results, failure triggers, and empirical evidence artifacts**.

---

## 2. Master Test Suite Matrix (16 Security Vectors)

| Vector ID | Target Domain | Threat Vector | Primary Enforcement Layer | Severity |
| :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | Multi-Tenancy | Cross-Tenant Direct Resource Access | PostgreSQL RLS + Application Guard | CRITICAL |
| **TEST-02** | Patient Boundary | Cross-Patient Record Tampering | ABAC Resource Resolver + RLS | CRITICAL |
| **TEST-03** | Authorization | Unauthorized Role Route Access | `requireClinicalAuthorization` (ABAC/RBAC) | HIGH |
| **TEST-04** | Context Boundary | Missing Tenant Context in Request | `withUnitOfWork` Context Guard | CRITICAL |
| **TEST-05** | Identity | Invalid / Revoked Tenant Membership | JWT Auth Middleware + DB Membership Check | CRITICAL |
| **TEST-06** | Token Lifecycle | Refresh Token Tenant Continuity | JWT Service Rotation Protocol | CRITICAL |
| **TEST-07** | Database Security | RLS Default-Deny Prevention | PostgreSQL `CREATE POLICY` (21 Tables) | CRITICAL |
| **TEST-08** | Object Level Auth | Child-Table BOLA & Direct PK Hijack | Child-Table `tenant_id` + RLS Policies | CRITICAL |
| **TEST-09** | ACID Reliability | Transaction Rollback on Error | `withUnitOfWork` Exception Block | HIGH |
| **TEST-10** | ACID Reliability | Savepoint Rollback in Nested Operations | PostgreSQL `SAVEPOINT` / `ROLLBACK TO` | HIGH |
| **TEST-11** | Pool Safety | Pool Connection Reuse & GUC Reset | Three-Tier Pool Cleanup (`RESET`) | CRITICAL |
| **TEST-12** | Pool Reliability | Connection Destruction on Fatal Error | `client.release(true)` Socket Destruction | HIGH |
| **TEST-13** | Concurrency | Concurrent Multi-Tenant Pool Stress | PostgreSQL Isolated Sessions | CRITICAL |
| **TEST-14** | Clinical Governance | Clinical Authorization & BTG Override | `authorizationDecisionService` + BTG | CRITICAL |
| **TEST-15** | Compliance | Audit Event Integrity & Immutability | `clinical_audit_events` Append-Only | HIGH |
| **TEST-16** | Distributed Systems | Idempotent Order & Payment Retries | Idempotency Key Middleware + UoW | HIGH |

---

## 3. Detailed Specification for All 16 Test Vectors

### TEST-01: Cross-Tenant Direct Resource Access
- **Objective:** Verify that an authenticated user belonging to Tenant A cannot read, update, or delete clinical data belonging to Tenant B.
- **Preconditions:** Two distinct tenants (`tenant-alpha`, `tenant-bravo`) with active encounters and clinical notes in the database.
- **Input:** HTTP `GET /api/clinical-notes/:id` where `:id` belongs to `tenant-alpha`, but the request Bearer JWT was issued to a physician in `tenant-bravo`.
- **Expected Result:** HTTP `403 Forbidden` or `404 Not Found` (Problem Details RFC 7807); zero data leaked in response body; security alert logged.
- **Failure Condition:** HTTP `200 OK` or response payload containing `tenant-alpha` patient data.
- **Evidence Artifact:** `test_results/test01_cross_tenant_access.json`.
- **Exit Criteria:** 100% rejection across all 28 route modules.

---

### TEST-02: Cross-Patient Record Tampering
- **Objective:** Prevent a care provider from updating clinical records or care plans of Patient X while bound to an encounter for Patient Y within the same tenant.
- **Preconditions:** Physician authenticated in `tenant-alpha`; Encounter 1 bound to Patient 1; Encounter 2 bound to Patient 2.
- **Input:** HTTP `PUT /api/care-plans/:planId` submitting `patientId = Patient 2` while `:planId` belongs to `Patient 1`.
- **Expected Result:** HTTP `400 Bad Request` or `403 Forbidden` (`RESOURCE_PATIENT_MISMATCH`); database update aborted.
- **Failure Condition:** Care plan re-linked to Patient 2 or partial update committed.
- **Evidence Artifact:** `test_results/test02_cross_patient_tamper.json`.
- **Exit Criteria:** Database verification query confirms zero alterations to `longitudinal_care_plans`.

---

### TEST-03: Unauthorized Role Route Access
- **Objective:** Ensure clinical roles without appropriate privileges cannot perform privileged operations (e.g., Billing Clerk prescribing medications).
- **Preconditions:** User authenticated with role `BILLING_CLERK` in `tenant-alpha`.
- **Input:** HTTP `POST /api/cpoe/orders` attempting to submit a fentanyl narcotic order.
- **Expected Result:** HTTP `403 Forbidden` (`INSUFFICIENT_CLINICAL_PRIVILEGE`); order rejected before reaching database.
- **Failure Condition:** HTTP `201 Created` or insertion into `clinical_orders`.
- **Evidence Artifact:** `test_results/test03_unauthorized_role.json`.
- **Exit Criteria:** Zero privileged route executions by unauthorized role.

---

### TEST-04: Missing Tenant Context in Request
- **Objective:** Ensure that any database operation invoked without an authoritative `tenantId` is immediately rejected by `withUnitOfWork`.
- **Preconditions:** Unit test environment with mock PostgreSQL pool.
- **Input:** Invoke `withUnitOfWork({ userId: 'USER-1', tenantId: null }, async (uow) => { ... })`.
- **Expected Result:** Synchronous throw of `SecurityException: AUTHORITATIVE_TENANT_REQUIRED`; zero connection acquired from pool.
- **Failure Condition:** Execution of SQL query with empty or undefined tenant setting.
- **Evidence Artifact:** `test_results/test04_missing_tenant_ctx.json`.
- **Exit Criteria:** Exception thrown and verified.

---

### TEST-05: Invalid / Revoked Tenant Membership
- **Objective:** Prevent access if a physician's privileges at Hospital Campus B have been revoked, even if their credentials remain valid at Hospital Campus A.
- **Preconditions:** Physician with membership in Tenant A active, but Tenant B status = `SUSPENDED` in `tenant_memberships`.
- **Input:** HTTP request presenting valid credentials requesting authentication into Tenant B.
- **Expected Result:** HTTP `403 Forbidden` (`TENANT_MEMBERSHIP_SUSPENDED`); zero JWT issued.
- **Failure Condition:** Successful login and issuance of token with `tenantId: Tenant B`.
- **Evidence Artifact:** `test_results/test05_revoked_membership.json`.
- **Exit Criteria:** Login blocked; audit event emitted.

---

### TEST-06: Refresh Token Tenant Continuity
- **Objective:** Verify that rotating an expired access token strictly preserves the satellite campus tenant identity without reverting to default headquarters.
- **Preconditions:** User logged into `tenant-bravo` (satellite campus); access token expired; refresh token valid.
- **Input:** HTTP `POST /api/auth/refresh` sending `refreshToken`.
- **Expected Result:** HTTP `200 OK` returning new `accessToken` containing `tenantId: 'tenant-bravo'`; new `refreshToken` also containing `tenantId: 'tenant-bravo'`.
- **Failure Condition:** New access token contains `'tenant-default-001'` or null tenant.
- **Evidence Artifact:** `test_results/test06_jwt_tenant_continuity.json`.
- **Exit Criteria:** Verified claim in decoded JWT payload.

---

### TEST-07: RLS Default-Deny Prevention on 21 Tables
- **Objective:** Prove that when connecting as non-superuser `nurseflow_app_user`, legitimate queries for authorized tenants succeed while cross-tenant queries return 0 rows.
- **Preconditions:** Stage 2 policies applied; database connection pool established as `nurseflow_app_user` (`NOBYPASSRLS`).
- **Input:** Execute `SELECT * FROM <table_name>` across all 21 tables under `app.current_tenant_id = 'tenant-alpha'`.
- **Expected Result:** Query executes cleanly; returns all rows where `tenant_id = 'tenant-alpha'`; returns 0 rows where `tenant_id = 'tenant-bravo'`; zero permission/syntax errors.
- **Failure Condition:** PostgreSQL `ERROR 42501` (permission denied) or cross-tenant rows returned.
- **Evidence Artifact:** `test_results/test07_rls_21_tables_success.json`.
- **Exit Criteria:** All 21 tables pass positive and negative checks.

---

### TEST-08: Child-Table BOLA & Direct PK Hijack
- **Objective:** Prove that direct primary key lookups (`WHERE id = $1`) on child tables are completely blocked when attempted across tenant boundaries.
- **Preconditions:** Stage 0 schema and RLS policies active on `medication_emar_administrations`, `medication_dispense_allocations`, `longitudinal_care_plans`, `patient_split_invoices`, `physician_diagnostic_interpretations`.
- **Input:** Connect as `nurseflow_app_user` under `tenant-bravo`. Execute `SELECT * FROM patient_split_invoices WHERE id = $1 FOR UPDATE` using an ID belonging to `tenant-alpha`.
- **Expected Result:** Query returns 0 rows; lock is NOT acquired; subsequent `UPDATE` affects 0 rows.
- **Failure Condition:** Row returned, locked, or modified.
- **Evidence Artifact:** `test_results/test08_child_table_bola_blocked.json`.
- **Exit Criteria:** All 5 child tables successfully reject cross-tenant access.

---

### TEST-09: Transaction Rollback on Error
- **Objective:** Verify that an unhandled exception inside `withUnitOfWork` triggers a complete database rollback and leaves no orphaned mutations.
- **Preconditions:** Clean staging database.
- **Input:** Execute `withUnitOfWork` mutating `clinical_notes`, then throw an unhandled error before commit.
- **Expected Result:** Transaction executes `ROLLBACK`; record does not exist in `clinical_notes`; connection is cleaned and returned to pool.
- **Failure Condition:** Record persisted in database despite thrown error.
- **Evidence Artifact:** `test_results/test09_transaction_rollback.json`.
- **Exit Criteria:** Direct SQL check confirms zero inserted rows.

---

### TEST-10: Savepoint Rollback in Nested Operations
- **Objective:** Verify that a failed sub-operation inside `uow.withSavepoint()` rolls back partial changes without aborting the outer transaction.
- **Preconditions:** Active `withUnitOfWork` transaction.
- **Input:** Outer transaction inserts Patient; inner savepoint attempts invalid order (throws error); outer catches error and commits.
- **Expected Result:** Outer patient record is committed; inner order record is rolled back; `app.current_tenant_id` remains intact.
- **Failure Condition:** Entire transaction fails or invalid order is committed.
- **Evidence Artifact:** `test_results/test10_savepoint_rollback.json`.
- **Exit Criteria:** Patient committed, order absent.

---

### TEST-11: Pool Connection Reuse & GUC Reset
- **Objective:** Ensure that when a pooled client is reused across different requests, session GUCs from the previous tenant are completely wiped.
- **Preconditions:** Single connection pool (`max: 1`).
- **Input:** Request 1 runs as `tenant-alpha` and completes. Request 2 runs on the same client WITHOUT setting session context, then queries `current_setting('app.current_tenant_id', true)`.
- **Expected Result:** Request 2 reads an empty/null string (`""` or `NULL`); zero leakage of `'tenant-alpha'`.
- **Failure Condition:** Request 2 reads `'tenant-alpha'` from session variable.
- **Evidence Artifact:** `test_results/test11_pool_guc_reset.json`.
- **Exit Criteria:** 100 iterations show zero GUC residual leakage.

---

### TEST-12: Connection Destruction on Fatal Error
- **Objective:** Ensure that if a connection encounters a network break or fatal driver error, it is destroyed via `client.release(true)` rather than returned to the pool.
- **Preconditions:** Active client acquired from pool.
- **Input:** Inject `client.__poisoned = true` and call cleanup routine.
- **Expected Result:** Client socket destroyed (`client.release(true)`); pool size decreases and spawns fresh healthy socket.
- **Failure Condition:** Poisoned client returned to pool, causing subsequent queries to fail.
- **Evidence Artifact:** `test_results/test12_connection_destruction.json`.
- **Exit Criteria:** Pool diagnostics confirm replacement of dead client.

---

### TEST-13: Concurrent Multi-Tenant Pool Stress
- **Objective:** Verify tenant isolation under heavy concurrent load.
- **Preconditions:** Pool configured with 10 connections.
- **Input:** 50 concurrent requests alternating between 5 distinct tenants performing rapid reads and writes via `withUnitOfWork`.
- **Expected Result:** 100% of queries return data matching their own tenant; exactly 0 cross-tenant records returned; zero pool deadlocks.
- **Failure Condition:** Any response containing data from a different tenant.
- **Evidence Artifact:** `test_results/test13_concurrent_stress.json`.
- **Exit Criteria:** 0 cross-tenant anomalies across 10,000 requests.

---

### TEST-14: Clinical Authorization & Break-The-Glass (BTG) Override
- **Objective:** Validate that emergency Break-The-Glass allows access to an encounter outside the care team while logging an immutable audit record.
- **Preconditions:** Doctor NOT assigned to Patient Care Team.
- **Input:** Request with header `X-Break-The-Glass: true` and `X-Break-The-Glass-Reason: Emergency resuscitation`.
- **Expected Result:** HTTP `200 OK`; audit record inserted into `clinical_audit_events` with `action = 'BREAK_THE_GLASS_OVERRIDE'`.
- **Failure Condition:** Request denied despite emergency flag, or request allowed without audit record.
- **Evidence Artifact:** `test_results/test14_clinical_btg_override.json`.
- **Exit Criteria:** Access granted and verified in audit table.

---

### TEST-15: Audit Event Integrity & Immutability
- **Objective:** Verify that `clinical_audit_events` cannot be modified or deleted by `nurseflow_app_user`.
- **Preconditions:** Connection established as `nurseflow_app_user`.
- **Input:** Execute `UPDATE clinical_audit_events SET action = 'ALTERED'` or `DELETE FROM clinical_audit_events`.
- **Expected Result:** PostgreSQL `ERROR 42501: permission denied for table clinical_audit_events`.
- **Failure Condition:** Successful update or deletion of audit record.
- **Evidence Artifact:** `test_results/test15_audit_immutability.json`.
- **Exit Criteria:** DML operations rejected.

---

### TEST-16: Idempotent Order & Payment Retries
- **Objective:** Verify that resending a medication order or billing payment with the same `Idempotency-Key` does not create duplicate database rows.
- **Preconditions:** Idempotency middleware active.
- **Input:** Send identical HTTP `POST /api/billing/payments` request twice within 10 seconds with `Idempotency-Key: PAY-12345`.
- **Expected Result:** Request 1 returns `201 Created` and inserts payment; Request 2 returns cached `201 Created`; database contains exactly 1 payment record.
- **Failure Condition:** Two payment rows inserted or duplicate charge captured.
- **Evidence Artifact:** `test_results/test16_idempotency_retry.json`.
- **Exit Criteria:** Table count query verifies single insertion.

---

## 4. Test Execution Governance & Sign-Off

The 16 test vectors defined above form the mandatory qualification gate for **Wave 1A.7 (Staging Execution & Verification)**. 

No request to transition the Implementation Gate to `READY_FOR_IMPLEMENTATION_REVIEW` may be approved unless all 16 test vectors produce automated passing artifacts.
