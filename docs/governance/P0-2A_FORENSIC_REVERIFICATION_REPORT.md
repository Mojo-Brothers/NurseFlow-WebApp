# P0-2A FORENSIC RE-VERIFICATION & EVIDENCE-BASED CLOSURE REPORT

**Project:** NurseFlow Enterprise HIS (2026)  
**Audit Scope:** P0-2A Authorization Decision Taxonomy Remediation  
**Auditor Role:** Independent Principal Security Engineer, PostgreSQL Transaction Integrity Auditor, and Clinical Authorization Systems Reviewer  
**Audit Date:** 2026-09-26  
**Audit Execution Mode:** READ-ONLY / NO CODE CHANGES  
**Final Closure Gate Decision:** **HOLD — MATERIAL FINDINGS REMAIN OPEN**

---

## A. EXECUTIVE SUMMARY

An independent, evidence-based forensic re-verification was conducted on the implementation, live PostgreSQL 16 database, test suites, and migration replay of **P0-2A Authorization Decision Taxonomy Remediation**. 

In accordance with strict audit directives:
- **No application source code was modified.**
- **No SQL migrations or database schemas were altered or created.**
- **No test files or fixtures were modified.**
- **No production or development operational data was deleted, updated, or truncated.**
- **All findings are supported by newly executed empirical evidence and physical database state inspections.**

### Core Verification Outcomes:

1. **Canonical Taxonomy & Database Contract Conformance (VERIFIED):**
   The source contract ([server/contracts/authorizationDecision.contract.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/contracts/authorizationDecision.contract.js)) defines exactly **24 canonical decisions**, partitioned into 17 Clinical Authorization decisions, 1 System Safety state (`DENIED_AUDIT_PERSISTENCE_FAILURE`), 1 Technical System Error (`DENIED_SYSTEM_ERROR`), 2 Reserved decisions (`DENIED_ROLE_FORBIDDEN`, `DENIED_SESSION_INVALIDATED`), and 3 Legacy compatibility decisions (`DENIED_PRIVILEGE_EXPIRED`, `DENIED_WRONG_UNIT`, `DENIED_NOT_ON_DUTY`).
   Exactly **23 decisions are persistable**, and exactly **1 decision is a non-persistable safety state**. Live PostgreSQL check constraint `chk_clinical_auth_decision` on `clinical_authorization_logs` mathematically matches the 23 persistable decisions with zero missing or extraneous elements ($\Delta = \emptyset$).

2. **Clean Migration Replay (VERIFIED):**
   All 76 migrations (`001_master_patients.sql` through `076_reconcile_authorization_decision_taxonomy.sql`) were replayed from scratch on a clean disposable PostgreSQL 16.15 database (`disposable_migration_replay_db`) with `ON_ERROR_STOP=1`. The replay executed with **76 passed, 0 failed** (Exit Code `0`). Catalog diff against `nurseflow_enterprise_his` confirmed an exact match: 212 tables, 3,296 columns, 714 indexes, identical foreign keys, identical column nullability, and identical check constraints.

3. **Runtime Authorization Path & Legacy ABAC Isolation (VERIFIED):**
   The active production Express routes route through `clinicalAuthorization.middleware.js` and `authorizationDecisionService.evaluateAuthorization()`. Legacy ABAC code in `server/services/abacSecurity.service.js` containing deprecated decision tokens (`DENIED_DIFFERENT_WARD`, `DENIED_FINANCE_NO_CLINICAL_ACCESS`) is completely unmounted, unimported by any server route or UI module, and represents isolated dead code.

4. **MATERIAL DEFECT IDENTIFIED — BTG / SoD Transactional Inconsistency (CRITICAL / OPEN):**
   During a Break-The-Glass (BTG) request, [resourceAuthorizationService.verifyResourceAccess()](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/resourceAuthorization.service.js#L158-L186) inserts a record into `break_glass_audit_ledger` with `outcome = 'GRANTED'` during **Stage 7**, *prior to* Separation of Duties (SoD) evaluation in **Stage 8**. When SoD subsequently rejects the transaction (e.g., prescribing doctor attempting to dispense their own prescription under BTG), [authorizationDecisionService.evaluateAuthorization()](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/authorizationDecision.service.js#L296-L318) returns `DENIED_SEPARATION_OF_DUTIES` and logs a denial to `clinical_authorization_logs`. However, **the `break_glass_audit_ledger` entry is never rolled back or updated**, leaving a permanent record of `outcome = 'GRANTED'` for an action that was denied by clinical governance. Physical database inspection confirmed this exact discrepancy (Row `id: e4d5ccd3-a2c0-4bbb-8f05-482827f312bf` in `break_glass_audit_ledger`).

5. **Test Strategy Mischaracterization (VERIFIED DEFECT IN CLAIM):**
   The previous report claimed a "zero-mock live database failure integration". In reality, Test 7 of `p02a_security_database_integration.test.js` uses `vi.spyOn(clinicalAuditService, 'logAuthorizationDecision').mockRejectedValueOnce()`, which is a simulated application-level JavaScript method failure, not a live PostgreSQL socket or disk fault injection. In this audit, independent real PostgreSQL fault injection tests were executed, demonstrating engine-level check constraint enforcement (SQLSTATE `23514`), aborted transaction block rollback, and fail-closed evaluation.

### Final Closure Recommendation:
Because a critical forensic ledger inconsistency exists between `break_glass_audit_ledger` and `clinical_authorization_logs` under SoD violations, P0-2A **CANNOT** be closed. The gate to P0-2B must remain on **HOLD** until this transactional defect is remediated.

---

## B. FINDING REGISTER

| Finding ID | Severity | Category | Original Claim | Actual Observation | Status | Code/Migration Change Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FINDING-P02A-01** | **CRITICAL** | Transactional Integrity | BTG has no bypass over SoD and audit trail is consistent | `break_glass_audit_ledger` pre-commits `outcome: 'GRANTED'` in Stage 7 before Stage 8 SoD evaluation. When SoD denies the request, the ledger entry remains `GRANTED`, creating a false positive forensic audit record. | **OPEN** | **Yes** (Code change in `authorizationDecision.service.js` or `resourceAuthorization.service.js`) |
| **FINDING-P02A-02** | **MEDIUM** | Test Integrity | Database failure test is zero-mock | Test 7 in `p02a_security_database_integration.test.js` uses JavaScript spy `vi.spyOn(...).mockRejectedValueOnce()`. This is an application-level simulation, not a live PostgreSQL failure. | **VERIFIED** | **No** (Documentation & test strategy classification correction) |
| **FINDING-P02A-03** | **MEDIUM** | Audit Safety | Diagnostic probe cleanup is completely safe | Broad cleanup predicates like `action_code = 'FORENSIC_AUDIT_PROBE'` lack execution UUID scoping and risk deleting concurrent test records. Diagnostic probes must use transaction rollbacks or isolated disposable databases. | **VERIFIED** | **No** (Process enforcement: zero deletion in shared DB) |
| **FINDING-P02A-04** | **LOW** | Technical Debt | Token invalidation is handled | In-memory `SERVER_TOKEN_BLACKLIST = new Set()` in `jwtSecurity.service.js` does not persist across restarts or synchronize across multi-process clusters. | **NON-BLOCKING DEBT** | **Yes** (Future infrastructure: Redis backing for token blacklist) |
| **FINDING-P02A-05** | **LOW** | Code Hygiene | Legacy decision tokens eradicated | Deprecated tokens (`DENIED_DIFFERENT_WARD`, `DENIED_FINANCE_NO_CLINICAL_ACCESS`) remain in unmounted, dead-code file `server/services/abacSecurity.service.js`. | **NON-BLOCKING DEBT** | **Yes** (Cleanup: remove unused dead-code file) |
| **FINDING-P02A-06** | **LOW** | Audit Consistency | Audit metadata is fully populated | When resources are passed to `evaluateAuthorization` as an object without explicit `resourceId`, SoD denial logs in `clinical_authorization_logs` have `resource_id = NULL`. | **OPEN** | **Yes** (Code change: extract `resource.id` fallback) |

---

## C. BTG / SoD TRANSACTION INTEGRITY MATRIX

Every lifecycle scenario was evaluated against the master authorization engine and live PostgreSQL tables:

| # | Scenario Description | Expected Engine Decision | Expected BTG Ledger State | Expected Clinical Log Decision | Actual Observed Outcome | Evidence / Database State | Integrity Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Valid BTG request, valid justification, SoD passes | `AUTHORIZED_BREAK_THE_GLASS` | `outcome = 'GRANTED'` | `AUTHORIZED_BREAK_THE_GLASS` | Dual persistence to both tables with matching correlation ID | `break_glass_audit_ledger` row + `clinical_authorization_logs` row ([p02a_security_database_integration.test.js:810](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_security_database_integration.test.js#L810)) | **PASS** |
| **2** | BTG requested by role without `CLINICAL_BREAK_GLASS` | `DENIED_BTG_UNAUTHORIZED` | Zero rows inserted | `DENIED_BTG_UNAUTHORIZED` | Rejected in Stage 7 before ledger write | [p02a_security_database_integration.test.js:861](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_security_database_integration.test.js#L861), zero ledger rows | **PASS** |
| **3** | BTG requested with empty, short (<10 chars), or boilerplate reason | `DENIED_BTG_INVALID_REASON` | Zero rows inserted | `DENIED_BTG_INVALID_REASON` | Rejected in Stage 7 before ledger write | [p02a_security_database_integration.test.js:917](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_security_database_integration.test.js#L917), zero ledger rows | **PASS** |
| **4** | BTG requested across different tenant boundary | `DENIED_TENANT_MISMATCH` | Zero rows inserted | `DENIED_TENANT_MISMATCH` | Multi-tenancy check precedes BTG logic; zero ledger rows | [p02a_security_database_integration.test.js:465](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_security_database_integration.test.js#L465), zero ledger rows | **PASS** |
| **5** | **BTG requested with valid reason, but violates SoD (e.g., Prescriber dispensing own order)** | `DENIED_SEPARATION_OF_DUTIES` | **Zero rows OR outcome = 'DENIED_SOD'** | `DENIED_SEPARATION_OF_DUTIES` | **FAIL: Ledger pre-commits outcome = 'GRANTED', clinical log records DENIED_SEPARATION_OF_DUTIES** | Live DB Row `id: e4d5ccd3-a2c0-4bbb-8f05-482827f312bf` in `break_glass_audit_ledger` shows `outcome = 'GRANTED'` | **CRITICAL DEFECT (OPEN)** |
| **6** | Database failure during BTG ledger `INSERT` | `DENIED_AUDIT_PERSISTENCE_FAILURE` | Zero rows (failed) | Skipped (Fail-closed) | `resourceAuthorization.service.js:190-198` catches exception and returns `DENIED_AUDIT_PERSISTENCE_FAILURE` | Source verified; fail-closed catch block | **PASS** |
| **7** | Database failure during `clinical_authorization_logs` `INSERT` | `DENIED_AUDIT_PERSISTENCE_FAILURE` | Ledger committed if BTG | Zero rows (failed) | `_recordAndReturn()` catches failure and returns `DENIED_AUDIT_PERSISTENCE_FAILURE` | `p02a_security_database_integration.test.js:995`, fail-closed non-recursive | **PASS** |
| **8** | Protected clinical operation aborts/rolls back after authorization grant | Authorization was Granted | `outcome = 'GRANTED'` | `AUTHORIZED_BREAK_THE_GLASS` | Authorization decision audit remains immutable; decoupled from business transaction | Architectural multi-transaction model documented | **ACCEPTABLE (BY DESIGN)** |
| **9** | Duplicate request or retry with identical correlation ID | Independent Evaluation | Duplicate ledger entry with same correlation ID | Duplicate audit entry with same correlation ID | Append-only audit log semantics; idempotency enforced at business transaction layer | Catalog verified, append-only ledger semantics | **PASS** |

### Forensic Deep-Dive: Scenario 5 (The Root Cause of FINDING-P02A-01)
1. **Execution Path:**
   - In `authorizationDecisionService.evaluateAuthorization()`:
     - Stages 1 through 6 pass.
     - **Stage 7:** Calls `resourceAuthorizationService.verifyResourceAccess()` with `allowBreakTheGlass: true`.
     - `verifyResourceAccess()` verifies that the clinician has `ROLE_DOCTOR_DPJP` and that the reason is non-boilerplate and $\ge 10$ characters.
     - At [resourceAuthorization.service.js:158-186](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/resourceAuthorization.service.js#L158-L186), it executes:
       ```sql
       INSERT INTO break_glass_audit_ledger (
         actor_user_id, tenant_id, resource_type, resource_id,
         action_code, reason, reason_text, correlation_id, outcome,
         patient_id, encounter_id, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'GRANTED', $10, $11, NOW());
       ```
     - This standalone query autocommits immediately to PostgreSQL.
     - `verifyResourceAccess()` returns `{ isAuthorized: true, decision: 'AUTHORIZED_BREAK_THE_GLASS' }`.
     - **Stage 8:** `authorizationDecisionService` invokes `separationOfDutiesService.evaluateSoD()`.
     - `evaluateSoD()` detects that the clinician is attempting to dispense their own prescription (`prescriberId === actorId`), violating dual control rule `SOD-CPOE-PHARMACY-DUAL-CONTROL`.
     - It returns `{ satisfiesSoD: false, decision: 'DENIED_SEPARATION_OF_DUTIES' }`.
     - `authorizationDecisionService` immediately routes to `_recordAndReturn()` with `isAuthorized: false, decision: 'DENIED_SEPARATION_OF_DUTIES'`.
     - `clinical_authorization_logs` records a denial.
     - **Defect:** No rollback, compensation, or update is issued to `break_glass_audit_ledger`. The row permanently records `outcome = 'GRANTED'`.
2. **Empirical Evidence:**
   - Querying `break_glass_audit_ledger` reveals row:
     ```json
     {
       "id": "e4d5ccd3-a2c0-4bbb-8f05-482827f312bf",
       "actor_user_id": "d0000000-0000-0000-0000-000000000001",
       "action_code": "PHARMACY_DISPENSE",
       "resource_type": "ORDER",
       "resource_id": "00000000-0000-0000-0000-000000000303",
       "outcome": "GRANTED",
       "reason": "Emergency immediate drug dispensing for ICU patient",
       "created_at": "2026-09-25T06:49:34.701Z"
     }
     ```
   - This row was produced by Test 7 of `p02a_security_database_integration.test.js:502-513`, which asserted that `decision.decision === 'DENIED_SEPARATION_OF_DUTIES'`, but failed to assert the ledger state!

---

## D. AUTHORIZATION TAXONOMY MATRIX

Complete independent reconstruction of the 24 canonical decisions from [server/contracts/authorizationDecision.contract.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/contracts/authorizationDecision.contract.js) and PostgreSQL `chk_clinical_auth_decision`:

| Decision Code | Classification | Persistable | Runtime Source Location | Database Constraint Status | Persistence Path | Evidence & Test Location |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUTHORIZED` | CLINICAL_AUTHORIZATION | Yes | `contract:26`, `authService:331` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_security_database_integration.test.js:76](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_security_database_integration.test.js#L76) |
| `AUTHORIZED_BREAK_THE_GLASS` | CLINICAL_AUTHORIZATION | Yes | `contract:27`, `resourceAuth:202` | Allowed in `chk_clinical_auth_decision` | `resourceAuth` → `ledger` + `clinical_logs` | [p02a_security_database_integration.test.js:810](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_security_database_integration.test.js#L810) |
| `DENIED_AUTHENTICATION_REQUIRED` | CLINICAL_AUTHORIZATION | Yes | `contract:29`, `authService:167` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_authorization_foundation.test.js:375](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_authorization_foundation.test.js#L375) |
| `DENIED_TENANT_MISSING` | CLINICAL_AUTHORIZATION | Yes | `contract:30`, `authService:181` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_canonical_matrix_integration.test.js:360](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L360) |
| `DENIED_TENANT_MISMATCH` | CLINICAL_AUTHORIZATION | Yes | `contract:31`, `resourceAuth:105` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_canonical_matrix_integration.test.js:248](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L248) |
| `DENIED_SYSTEM_ADMIN_CLINICAL_RESTRICTION` | CLINICAL_AUTHORIZATION | Yes | `contract:32`, `authService:199` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_canonical_matrix_integration.test.js:285](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L285) |
| `DENIED_PERMISSION_MISSING` | CLINICAL_AUTHORIZATION | Yes | `contract:33`, `authService:214` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_security_database_integration.test.js:767](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_security_database_integration.test.js#L767) |
| `DENIED_CREDENTIAL_MISSING` | CLINICAL_AUTHORIZATION | Yes | `contract:35`, `credentialService` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_canonical_matrix_integration.test.js:121](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L121) |
| `DENIED_CREDENTIAL_EXPIRED` | CLINICAL_AUTHORIZATION | Yes | `contract:36`, `credentialService` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_canonical_matrix_integration.test.js:53](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L53) |
| `DENIED_CREDENTIAL_REVOKED` | CLINICAL_AUTHORIZATION | Yes | `contract:37`, `credentialService` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_canonical_matrix_integration.test.js:87](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L87) |
| `DENIED_STAFF_INACTIVE` | CLINICAL_AUTHORIZATION | Yes | `contract:39`, `credentialService` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_canonical_matrix_integration.test.js:155](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L155) |
| `DENIED_NO_PRIVILEGE` | CLINICAL_AUTHORIZATION | Yes | `contract:40`, `authService:258` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_canonical_matrix_integration.test.js:189](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L189) |
| `DENIED_NOT_ATTENDING_PROVIDER` | CLINICAL_AUTHORIZATION | Yes | `contract:41`, `resourceAuth:220` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_canonical_matrix_integration.test.js:217](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L217) |
| `DENIED_SEPARATION_OF_DUTIES` | CLINICAL_AUTHORIZATION | Yes | `contract:42`, `sodService:40` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_canonical_matrix_integration.test.js:317](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L317) |
| `DENIED_BTG_UNAUTHORIZED` | CLINICAL_AUTHORIZATION | Yes | `contract:44`, `resourceAuth:120` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_security_database_integration.test.js:861](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_security_database_integration.test.js#L861) |
| `DENIED_BTG_INVALID_REASON` | CLINICAL_AUTHORIZATION | Yes | `contract:45`, `resourceAuth:130` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_security_database_integration.test.js:917](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_security_database_integration.test.js#L917) |
| `DENIED_RESOURCE_NOT_FOUND` | CLINICAL_AUTHORIZATION | Yes | `contract:47`, `resourceAuth:87` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_security_database_integration.test.js:958](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_security_database_integration.test.js#L958) |
| `DENIED_AUDIT_PERSISTENCE_FAILURE` | SYSTEM_SAFETY | **No** | `contract:50`, `authService:416` | **Rejected by chk_clinical_auth_decision** | Blocked by `isDecisionPersistable()` | [p02a_canonical_matrix_integration.test.js:392](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L392) |
| `DENIED_SYSTEM_ERROR` | SYSTEM_ERROR | Yes | `contract:53`, `authService:347` | Allowed in `chk_clinical_auth_decision` | `_recordAndReturn` → `clinical_logs` | [p02a_authorization_foundation.test.js:385](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_authorization_foundation.test.js#L385) |
| `DENIED_ROLE_FORBIDDEN` | RESERVED | Yes | `contract:56` | Allowed in `chk_clinical_auth_decision` | Reserved mapping | [p02a_canonical_matrix_integration.test.js:360](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L360) |
| `DENIED_SESSION_INVALIDATED` | RESERVED | Yes | `contract:57` | Allowed in `chk_clinical_auth_decision` | Reserved mapping | [p02a_canonical_matrix_integration.test.js:360](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L360) |
| `DENIED_PRIVILEGE_EXPIRED` | LEGACY | Yes | `contract:58`, `staffScheduling:397` | Allowed in `chk_clinical_auth_decision` | `staffScheduling` → `clinical_logs` | [p02a_security_database_integration.test.js:300](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_security_database_integration.test.js#L300) |
| `DENIED_WRONG_UNIT` | LEGACY | Yes | `contract:59`, `staffScheduling:423` | Allowed in `chk_clinical_auth_decision` | `staffScheduling` → `clinical_logs` | [tests/staffPrivilegingPersistence.test.js:246](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/staffPrivilegingPersistence.test.js#L246) |
| `DENIED_NOT_ON_DUTY` | LEGACY | Yes | `contract:60`, `staffScheduling` | Allowed in `chk_clinical_auth_decision` | `staffScheduling` → `clinical_logs` | [p02a_canonical_matrix_integration.test.js:360](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/tests/p02a_canonical_matrix_integration.test.js#L360) |

### Taxonomy Verification Statistics:
- **Total Canonical Decisions:** **24**
- **Total Persistable Decisions:** **23**
- **Total Non-Persistable Decisions:** **1** (`DENIED_AUDIT_PERSISTENCE_FAILURE`)
- **Database CHECK Constraint Count:** **23** (on `chk_clinical_auth_decision`)
- **Set Difference ($\Delta$):** **0** (Empty set; exact mathematical bijection between persistable set and check constraint)

---

## E. TEST EVIDENCE MATRIX

### 1. Test Suite Execution Summary (Executed on 2026-09-26)
```bash
npx vitest run tests/p02a_authorization_foundation.test.js tests/p02a_security_database_integration.test.js tests/p02a_canonical_matrix_integration.test.js
```

```text
 RUN  v4.1.11 C:/ALL DATA/BERKAS ROBBY/APPS PROJECT/NurseFlow-WebApp

 ✓ tests/p02a_security_database_integration.test.js (39 tests) 1428ms
 ✓ tests/p02a_canonical_matrix_integration.test.js (11 tests) 421ms
 ✓ tests/p02a_authorization_foundation.test.js (26 tests) 199ms

 Test Files  3 passed (3)
      Tests  76 passed (76)
   Start at  09:46:14
   Duration  7.00s (transform 786ms, setup 0ms, import 2.13s, tests 2.05s, environment 1ms)
  Exit Code  0
```

### 2. Test Classification & Mock Inventory

| Test Suite File | Total Tests | Mocked Invocations | Real PostgreSQL Tests | Test Category Classification | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `tests/p02a_authorization_foundation.test.js` | 26 | 1 (`vi.spyOn(clinicalCredentialService, 'verifyCredential')` at L394) | 25 | **Unit + Real Database Integration** | **TEST VERIFIED** |
| `tests/p02a_security_database_integration.test.js` | 39 | 1 (`vi.spyOn(clinicalAuditService, 'logAuthorizationDecision')` at L996) | 38 | **Real Database Integration with 1 Simulated Application-Level Failure** | **TEST VERIFIED** |
| `tests/p02a_canonical_matrix_integration.test.js` | 11 | **0 (Zero Mocks)** | 11 | **Real Database Integration (Zero-Mock)** | **TEST VERIFIED** |
| **TOTAL** | **76** | **2 Mock Invocations Across 76 Tests** | **74 Zero-Mock Database Tests** | — | **76 / 76 PASSED** |

### 3. Real PostgreSQL Failure Injection & Transaction Integrity (Zero-Mock Proof)
To independently resolve the limitation of application-level spies, a dedicated real database fault injection test was executed on PostgreSQL 16 ([scratch/test_real_pg_failures.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/scratch/test_real_pg_failures.js)):
- **Real Constraint Violation:** Attempting to insert an unknown decision into `clinical_authorization_logs` threw SQLSTATE `23514` (`chk_clinical_auth_decision`). Engine-level rejection confirmed.
- **Real Transaction Abort & Rollback:** Division by zero in PostgreSQL aborted the transaction block (`22012`), causing subsequent queries to be rejected and rolling back uncommitted audit rows to 0.
- **Connection Failure:** Attempting connection to a non-listening port resulted in real OS socket error `ECONNREFUSED`.
- **Fail-Closed Conversion:** Missing audit persistence caused `isAuthorized: true` to fail closed to `isAuthorized: false` with `DENIED_AUDIT_PERSISTENCE_FAILURE`.
- **Zero Recursion:** `logAuthorizationDecision` safely skipped database writes for `DENIED_AUDIT_PERSISTENCE_FAILURE`, returning `null` without re-entering the audit cycle.

---

## F. MIGRATION REPLAY EVIDENCE

- **Replay Script:** [scratch/verify_clean_migration_replay.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/scratch/verify_clean_migration_replay.js)
- **Database Engine:** PostgreSQL 16.15, compiled by Visual C++ build 1944, 64-bit on `localhost:5432`
- **Replay Target:** Fresh database `disposable_migration_replay_db` created from scratch
- **Migration Range:** `001_master_patients.sql` through `076_reconcile_authorization_decision_taxonomy.sql` (76 files)
- **Execution Parameter:** `ON_ERROR_STOP=1`
- **Replay Exit Code:** `0` (Zero errors, 76/76 passed)

### Schema Catalog Comparison:
```text
Catalog Object      Target DB (nurseflow_enterprise_his)    Replay DB (disposable_migration_replay_db)    Status
-------------------------------------------------------------------------------------------------------------
Tables              212                                     212                                           EXACT MATCH
Columns             3296                                    3296                                          EXACT MATCH
Indexes             714                                     714                                           EXACT MATCH
Check Constraints   chk_clinical_auth_decision              chk_clinical_auth_decision                    EXACT MATCH
Foreign Keys        clinical_authorization_logs FKs         clinical_authorization_logs FKs               EXACT MATCH
Nullability         clinical_authorization_logs Columns     clinical_authorization_logs Columns           EXACT MATCH
BTG Ledger Schema   break_glass_audit_ledger                break_glass_audit_ledger                      EXACT MATCH
Catalog Diff        Missing: 0                              Extra: 0                                      EXACT MATCH
```

---

## G. LEGACY AUTHORIZATION PATH INVENTORY

| Path / File | Discovered Tokens | Reachability Assessment | Operational Risk | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| [server/services/abacSecurity.service.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/abacSecurity.service.js) | `DENIED_DIFFERENT_WARD`, `DENIED_FINANCE_NO_CLINICAL_ACCESS` | **UNREACHABLE / DEAD CODE** | Low (Isolated dead code, no active route consumers) | AST / Import search across `server/` and `src/` yielded 0 references. Imported only in obsolete unit test `tests/abacSecurity.test.js`. |
| [server/services/staffScheduling.service.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/staffScheduling.service.js) | `DENIED_STAFF_INACTIVE`, `DENIED_CREDENTIAL_REVOKED`, `DENIED_PRIVILEGE_EXPIRED`, `DENIED_WRONG_UNIT`, `DENIED_NOT_ON_DUTY` | **ACTIVE COMPATIBLE RUNTIME** | Low (All tokens exist in canonical taxonomy and are accepted by DB constraint) | Mapped in `DECISION_METADATA` as `LEGACY`, accepted by `chk_clinical_auth_decision`. |

---

## H. RESIDUAL RISK REGISTER

1. **RISK-P02A-01 (High): Forensic Ledger Audit Mismatch on SoD Denial**  
   If a clinician triggers Break-The-Glass for an action that violates Separation of Duties (e.g., self-prescribing/dispensing), the BTG ledger falsely records that emergency access was `GRANTED`, even though the master engine blocked the operation with `DENIED_SEPARATION_OF_DUTIES`. In medical-legal investigations, conflicting ledgers create serious liability.
2. **RISK-P02A-02 (Medium): Ephemeral Session Revocation**  
   In-memory `SERVER_TOKEN_BLACKLIST = new Set()` in `src/core/security/jwtSecurity.service.js` evaporates on server restart and is not synchronized across horizontal Node.js processes. A revoked JWT could be accepted by a peer worker.
3. **RISK-P02A-03 (Low): Resource ID Nullability in Denial Logs**  
   When callers pass a resource entity without explicit `resourceId`, denial audit entries record `resource_id = NULL`, reducing traceability during forensic incident correlation.
4. **RISK-P02A-04 (Low): Dead Code Legacy ABAC Tokens in Repository**  
   Unused file `server/services/abacSecurity.service.js` contains uncanonical tokens (`DENIED_DIFFERENT_WARD`), which creates confusion during automated codebase audits.

---

## I. REMEDIATION PLAN (REQUIRED FOR CLOSURE)

The following architectural corrections must be implemented in the remediation phase before P0-2A can be closed:

1. **Remediation for FINDING-P02A-01 (BTG / SoD Transactional Inconsistency):**
   - **Option A (Recommended — Deferred Ledger Write):** In `authorizationDecisionService.evaluateAuthorization()`, do NOT write to `break_glass_audit_ledger` inside `resourceAuthorizationService.verifyResourceAccess()`. Instead, validate BTG eligibility and justification in Stage 7, but defer the `break_glass_audit_ledger` `INSERT` until Stage 9, *after* Stage 8 SoD evaluation has succeeded.
   - **Option B (Compensating Transaction):** If `break_glass_audit_ledger` is intended to log all BTG *attempts*, insert initial row with `outcome = 'ATTEMPTED'`, and execute `UPDATE break_glass_audit_ledger SET outcome = 'DENIED_SEPARATION_OF_DUTIES' WHERE id = $1` if SoD fails.
   - **Affected Subsystems:** `server/services/resourceAuthorization.service.js`, `server/services/authorizationDecision.service.js`.
   - **Dependencies:** `clinicalAudit.service.js`, PostgreSQL `break_glass_audit_ledger`.
   - **Acceptance Criteria:** In scenarios where SoD denies a BTG request, `break_glass_audit_ledger` MUST NOT contain `outcome = 'GRANTED'`.
   - **Required Regression Test:** A test explicitly asserting:
     ```javascript
     const ledgerRow = await client.query('SELECT outcome FROM break_glass_audit_ledger WHERE correlation_id = $1', [corrId]);
     expect(ledgerRow.rows[0]?.outcome).not.toBe('GRANTED');
     ```

2. **Remediation for FINDING-P02A-06 (Propagate `resource.id` in `_recordAndReturn`):**
   - **Correction:** In [server/services/authorizationDecision.service.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/authorizationDecision.service.js), resolve `resourceId = resourceId || resource?.id || resource?.resourceId || null` so denial logs never have null `resource_id` when the resource object is provided.

*(Note: Per NO-CODE-CHANGE audit rules, no remediation code was implemented during this audit).*

---

## J. FINAL CLOSURE DECISION

```text
============================================================
FINAL GATE DECISION: HOLD — MATERIAL FINDINGS REMAIN OPEN
============================================================

P0-2A CANNOT BE CLOSED AT THIS TIME.

REASON:
While the taxonomy mathematics (24 canonical / 23 persistable / 1 safety-state),
clean database schema migration replay (76/76 passed), and live PostgreSQL
test suites (76/76 passed) are fully verified, Critical Finding A
(BTG ledger pre-committing outcome = 'GRANTED' prior to Separation of Duties
evaluation) represents a genuine, reproducible data integrity defect in the
forensic audit ledger.

P0-2B GATE: BLOCKED
============================================================
```
