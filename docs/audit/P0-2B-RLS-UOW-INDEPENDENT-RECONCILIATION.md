# P0-2B — INDEPENDENT RLS/UOW INVENTORY RECONCILIATION

**Document Identifier:** `DOC-AUDIT-P02B-RLS-UOW-INDEPENDENT-RECON-20261002`  
**Date:** 02 Oktober 2026  
**Classification:** Independent Security Architecture Reconciliation  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Baseline Git Commit:** `887f0c50793dc1947ba6d84d1aa8f805e3464b08`  
**Target Environment:** Local Security Lab (`nurseflow_security_lab` on PostgreSQL 16)  
**Production Invariant:** `nurseflow_enterprise_his` strictly untouched  

---

## 1. Scope & Independent Verification Charter

This audit was conducted as an **independent cross-check** of the RLS/UoW backlog metrics established after the Wave 1B.1 Triage ratification. In accordance with the audit charter:
- **Zero Production Changes:** No routes, controllers, services, middleware, migrations, or database schemas were modified.
- **Independent Querying:** Metrics were cross-checked directly against the live PostgreSQL catalog (`pg_class`, `pg_policies`, `information_schema`), physical migration source code, and raw AST source traversals across `server/**/*.js`.
- **Zero Transcript Reliance:** No historical AI agent transcripts or conversational logs were used as sources of truth. All findings derive strictly from physical files and live database metadata.

---

## 2. Git Baseline Verification

Audit executed on a clean working tree from baseline commit:

```text
BASE HEAD: b193da463112d5d3d1a56c724f1637c76b26c1c0
CURRENT HEAD (with Backlog Inventory): 887f0c50793dc1947ba6d84d1aa8f805e3464b08
Branch: feature/security-foundation-wave1a10
Working Tree: Clean (0 uncommitted files)
```

---

## 3. RLS Table Source-of-Truth Reconciliation

A cross-check was executed across three independent authorities:

### A. Live PostgreSQL Database Catalog (`nurseflow_security_lab`)
Query executed:
```sql
SELECT n.nspname, c.relname, c.relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relrowsecurity = true AND n.nspname = 'public'
ORDER BY c.relname;
```
- **Result:** Exactly **100 tables** have `relrowsecurity = true` in the public schema.
- Active policies check: Exactly **100 tables** have active policies in `pg_policies`, each standardized under Migration 081 to exactly 1 canonical `tenant_isolation_*` policy.

### B. Migration Source Code (`database/migrations/*.sql`)
- **Result:** Migrations 009 through 024 and 032-035 progressively enabled RLS across clinical, financial, and operational subsystems. Migration 079 applied default-deny policies to 31 core and blackout tables. Migration 081 formally normalized and verified all **100 tables** in the public schema.

### C. Existing Inventory Scanner (`scratch/authoritative_db_inventory.mjs`)
- **Result:** The scanner's `RLS_TABLES` set contains **33 tables**:
  - 10 core tables from Migration 079
  - 21 zero-policy tables from Migration 079
  - 2 triage tables added during Wave 1B.1 (`triage_assessments`, `triage_sla_timers`)

### Comparison & Discrepancy Analysis:
```text
DB RLS TABLE COUNT:         100
SCANNER RLS TABLE COUNT:    33
MIGRATION RLS TABLE COUNT:  100
DIFFERENCES:
The scanner's RLS table set (33 tables) is a focused subset of the 100 RLS-enabled tables in PostgreSQL.
The 33 tables represent the Stage 0 Default-Deny clinical core prioritized during Wave 1A.10 / 1A.11.
The remaining 67 tables (e.g., appointments, laboratory_orders, medication_orders, radiology_orders, operating_theatres, surgical_cases) have RLS enabled and standardized under Migration 081, but were categorized under subsystem domains in earlier waves.
```

---

## 4. DB Call-Site Reconciliation (Independent Enumeration)

An independent AST and source code traversal was executed across all production server files in `server/**/*.js`:

```text
========================================================================================
METRIC RECONCILIATION
========================================================================================
Metric                                   Reported Inventory  Independent Scan  Delta  Status
----------------------------------------------------------------------------------------
Total Production DB Call Sites           846                 846               0      VERIFIED
Request-Path DB Call Sites               845                 845               0      VERIFIED
Request-Path RLS Call Sites              157                 157               0      VERIFIED
Safe RLS DB Call Sites (Inside UoW)      12                  12                0      VERIFIED
Unsafe RLS DB Call Sites (Outside UoW)   145                 145               0      VERIFIED
Tenant-Sensitive Writes Outside UoW      234                 234               0      VERIFIED
Tenant-Sensitive Reads Outside UoW       589                 589               0      VERIFIED
Request-Path DB Calls Outside UoW        823                 823               0      VERIFIED
========================================================================================
```

- **Total Call Sites (846):** Every single query invocation point (`client.query`, `pool.query`, `pool.connect`, `getPool`) across all 30 production files was verified.
- **Request Path (845):** Exactly 1 call site is excluded from request traffic: line 100 in [`server/config/envValidator.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/config/envValidator.js) (`assertRuntimeDatabaseSafety`), which executes once upon server boot.
- **RLS Call Sites (157):** Exactly 157 call sites touch the 33 Stage 0 RLS tables on request paths.

---

## 5. Verification of `touches_rls_table`

Every RLS call site was verified against actual SQL text extracted from source code lines:

### Sample Evidence 1: Nursing / CPPT
- **File:** [`server/services/clinicalNotesApplication.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/clinicalNotesApplication.service.js)
- **Line:** 72
- **Call:** `pool.query(...)`
- **SQL:** `INSERT INTO surgical_clinical_notes (encounter_id, patient_id, ...) VALUES (...)`
- **Table:** `surgical_clinical_notes` (RLS: ENABLED)
- **Operation:** `INSERT` (WRITE)
- **UoW Status:** `OUTSIDE_UOW`

### Sample Evidence 2: Medication Closed-Loop
- **File:** [`server/services/medicationClosedLoop.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/medicationClosedLoop.service.js)
- **Line:** 310
- **Call:** `pool.query(...)`
- **SQL:** `INSERT INTO medication_emar_administrations (id, medication_order_id, encounter_id, patient_id, ...) VALUES (...)`
- **Table:** `medication_emar_administrations` (RLS: ENABLED)
- **Operation:** `INSERT` (WRITE)
- **UoW Status:** `OUTSIDE_UOW`

### Sample Evidence 3: Medical Record / CPOE
- **File:** [`server/services/cpoeApplication.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/cpoeApplication.service.js)
- **Line:** 88
- **Call:** `pool.query(...)`
- **SQL:** `INSERT INTO clinical_orders (encounter_id, patient_id, ...) VALUES (...)`
- **Table:** `clinical_orders` (RLS: ENABLED)
- **Operation:** `INSERT` (WRITE)
- **UoW Status:** `OUTSIDE_UOW`

---

## 6. UoW Classification Reconciliation

The audit verified the execution path for every UoW-wrapped method:
- Simply importing `unitOfWork.js` was **rejected** as evidence.
- Declaring a UoW registry was **rejected** as evidence.
- The actual function implementation was inspected to prove that queries execute through the `query` callback parameter provided by `withUnitOfWork`:
  ```javascript
  return await withUnitOfWork({ tenantId, ... }, async ({ query }) => {
    return await query(sql, params);
  });
  ```
- **Results:**
  - `encounterApplication.service.js`: 4 methods verified (`createEncounter`, `transitionEncounterStatus`, `getEncounters`, `getEncounterById`).
  - `triageApplication.service.js`: 3 methods verified (`recordTriageAssessment`, `recordFirstPhysicianContact`, `getTriageByEncounterId`).
  - All other 28 production services execute raw queries on `pool` or ad-hoc `client` connections outside `withUnitOfWork`.

---

## 7. The 12 Safe RLS Call Sites (Explicit Enumeration)

The 12 safe call sites were verified line-by-line in source code:

| # | Domain | File | Line | Function | Table(s) Touched | Operation | UoW Verification Proof |
|---|---|---|---|---|---|---|---|
| 1 | Encounter | `server/services/encounterApplication.service.js` | 61 | `generateNextEncounterNumber` | `encounters` | READ | Wave 1A.11 UoW Scoped (commit `0fb2b97`) |
| 2 | Emergency / Triage | `server/services/triageApplication.service.js` | 130 | `recordTriageAssessment` | `encounters` | READ (FOR UPDATE) | Wave 1B.1 withUnitOfWork callback (`tests/p02b_wave1b1_real_rls_integration.test.js`) |
| 3 | Emergency / Triage | `server/services/triageApplication.service.js` | 131 | `recordTriageAssessment` | `encounters` | READ | Wave 1B.1 withUnitOfWork callback |
| 4 | Emergency / Triage | `server/services/triageApplication.service.js` | 134 | `recordTriageAssessment` | `encounters` | READ | Wave 1B.1 withUnitOfWork callback |
| 5 | Emergency / Triage | `server/services/triageApplication.service.js` | 137 | `recordTriageAssessment` | `encounters` | READ | Wave 1B.1 withUnitOfWork callback |
| 6 | Emergency / Triage | `server/services/triageApplication.service.js` | 230 | `recordTriageAssessment` | `encounters` | WRITE (UPDATE) | Wave 1B.1 withUnitOfWork callback |
| 7 | Emergency / Triage | `server/services/triageApplication.service.js` | 250 | `recordTriageAssessment` | `universal_audit_logs` | WRITE (INSERT) | Wave 1B.1 withUnitOfWork callback |
| 8 | Emergency / Triage | `server/services/triageApplication.service.js` | 333 | `recordFirstPhysicianContact` | `encounters` | WRITE (UPDATE) | Wave 1B.1 withUnitOfWork callback |
| 9 | Emergency / Triage | `server/services/triageApplication.service.js` | 341 | `recordFirstPhysicianContact` | `encounters` | WRITE (UPDATE) | Wave 1B.1 withUnitOfWork callback |
| 10 | Emergency / Triage | `server/services/triageApplication.service.js` | 346 | `recordFirstPhysicianContact` | `encounters` | WRITE (UPDATE) | Wave 1B.1 withUnitOfWork callback |
| 11 | Emergency / Triage | `server/services/triageApplication.service.js` | 360 | `getTriageByEncounterId` | `triage_assessments, master_patients, encounters` | READ | Wave 1B.1 withUnitOfWork callback |
| 12 | Emergency / Triage | `server/services/triageApplication.service.js` | 370 | `getTriageByEncounterId` | `encounters` | READ | Wave 1B.1 withUnitOfWork callback |

**Determination:** Exactly 12 safe call sites are confirmed.

---

## 8. The 145 Unsafe RLS Call Sites

All 145 unsafe call sites were verified across 16 domains and recorded in machine-readable JSON:
- **File Artifact:** [`scratch/p02b_rls_uow_independent_reconciliation.json`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/scratch/p02b_rls_uow_independent_reconciliation.json) (under key `unsafe145CallSites`).
- **Domain Distribution:**
  - Radiology / PACS (`radiologyApplication`): **19**
  - Nursing / CPPT (`clinicalNotesApplication`): **15**
  - Medical Record / CPOE (`cpoeApplication`): **13**
  - Medication Closed-Loop (`medicationClosedLoop`): **13**
  - Blood Bank (`bloodBank`): **13**
  - Care Coordination & Timeline (`careCoordinationAndTimeline`): **11**
  - Diagnostic Interpretation (`diagnosticInterpretation`): **11**
  - Admission / Master Patient (`patientApplication`): **10**
  - Laboratory / LIS (`laboratoryApplication`): **8**
  - Patient Financial & Billing (`patientFinancialAndRevenueCycle`): **8**
  - Executive Command Center (`commandCenter`): **6**
  - Bed Management (`bedManagementApplication`): **5**
  - Clinical Monitoring / EWS (`clinicalMonitoring`): **5**
  - Queue / Appointments (`appointment`): **3**
  - Safety Decision Authorization (`safetyAuthorization`): **3**
  - Resource Authorization (`resourceAuthorization`): **2**
  - **Sum:** `19 + 15 + 13 + 13 + 13 + 11 + 11 + 10 + 8 + 8 + 6 + 5 + 5 + 3 + 3 + 2 = 145`.

---

## 9. Verification of the "153 Unsafe Entry Points" (Forensic Discrepancy Found)

The independent route audit evaluated all route definitions across `server/routes/*.routes.js` and `server/server.js`:

### Architectural Finding:
1. **Total HTTP Routes in Codebase:** Exactly **150 routes** across 28 route files (+ 5 health/observability endpoints in `server.js` = 155 total endpoints).
2. **Safe UoW Routes:** Exactly **7 routes** (`3 in triage.routes.js + 4 in encounters.routes.js`).
3. **Unsafe Routes Touching RLS Tables:** Exactly **88 routes** belong to route files whose controllers and services query or mutate RLS-enforced tables.
4. **Non-RLS Routes:** Exactly **55 routes** belong to route files whose services touch tables without RLS (e.g., Enterprise Inventory, Staff Privileging, Master Data Hub, Governance, INA-CBG grouper).

### Root Cause of the "153" Baseline Mismatch:
In Wave 1A.11, the inventory identified **156 unsafe RLS query call sites**. Due to a semantic conflation between AST query call sites and HTTP entry points, the metric was recorded as `UNSAFE_RLS_REQUEST_PATHS = 156`.
When Wave 1B.1 closed **3 Triage HTTP routes**, the metric was decremented by 3 (`156 - 3 = 153`), mixing an AST call site count with an HTTP route count.

### Official Reconciliation:
- **Reported Metric (Historical):** `153` (Derived synthetically as 156 baseline - 3 Triage routes).
- **Physical Source Reality:** Exactly **88 HTTP entry points** execute call chains that touch RLS-protected tables outside UoW.
- **Classification:** **`DISCREPANCY (CONFLATION_DISPROVEN)`**. The backlog contains 88 unsafe RLS HTTP entry points, not 153.

---

## 10. Tenant-Sensitive Writes Reconciliation

An audit was conducted across all 234 write call sites outside UoW:
- **Total Write Call Sites Outside UoW:** Exactly **234**.
- **Writes Touching Tables with RLS Enabled (100-table catalog):** Exactly **120**.
- **Writes Touching Tables with Explicit `tenant_id` Column (123-table catalog):** Exactly **127**.
- **Writes Touching Non-Tenant or Intermediate Operational Tables:** **107**.

### Determination:
- If "tenant-sensitive writes" is defined as *any write operation on user request paths outside UoW*: **234 is 100% VERIFIED**.
- If strictly narrowed to *writes touching tables with a `tenant_id` column or RLS*: **127 is VERIFIED**.

---

## 11. Domain Aggregation Reconciliation

The mathematical sum across all 30 components was verified:
```text
SUM(domain RLS calls)               = 157 (12 safe + 145 unsafe) = VERIFIED
SUM(domain unsafe RLS calls)        = 145 = VERIFIED
SUM(domain writes outside UoW)      = 234 = VERIFIED
SUM(domain reads outside UoW)       = 589 = VERIFIED
SUM(domain request calls outside)   = 823 = VERIFIED
SUM(domain total DB calls)          = 846 (823 outside + 22 UoW + 1 startup) = VERIFIED
```

---

## 12. Candidate A/B/C/D Factual Verification

The metrics reported for each candidate wave were verified against source code:

| Candidate | Claimed RLS Calls | Verified RLS | Claimed Writes Out | Verified Writes Out | Claimed Reads Out | Verified Reads Out | Claimed Routes | Verified Routes | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Candidate A (Nursing / CPPT)** | 15 | **15** | 4 | **4** | 31 | **31** | 6 | **6** | **VERIFIED** |
| **Candidate B (Medication Closed-Loop)** | 13 | **13** | 23 | **23** | 57 | **57** | 8 | **8** | **VERIFIED** |
| **Candidate C (CPOE + Diagnostics)** | 24 | **24** | 12 | **12** | 48 | **48** | 13 | **13** | **VERIFIED** |
| **Candidate D (Patient Financial)** | 8 | **8** | 15 | **15** | 27 | **27** | 6 | **6** | **VERIFIED** |

*Note: In accordance with the audit charter, no candidate is declared a "winner". All four candidates have their quantitative claims 100% verified against physical source code.*

---

## 13. Special Case Verification

1. **Transactional Outbox Worker (`outboxWorker.service.js`):**
   - Verified as an in-memory queue processor and event simulator. It performs no raw database pool queries on the request pipeline.
2. **Zero-Downtime Migration Runner (`migrationRunner.service.js`):**
   - Verified as an expand-contract DDL executor. Operates exclusively under maintenance/superuser contexts; zero request-path UoW debt.
3. **Startup Environment Validator (`envValidator.js`):**
   - Line 100 queries `pg_roles` once during boot via `assertRuntimeDatabaseSafety`. Verified as tooling-only; zero request-path debt.

---

## 14. Identified Discrepancies

1. **DISCREPANCY-01 [RLS Table Catalog]:**
   The scanner catalog contains 33 tables, whereas the PostgreSQL database and Migration 081 define 100 tables with RLS enabled. The 33 tables represent the Stage 0 Default-Deny clinical core, while the remaining 67 tables are subsystem-specific tables.
2. **DISCREPANCY-02 [Unsafe Entry Points Metric]:**
   The reported number `153` is a historical conflation (156 AST query sites minus 3 Triage routes). The actual physical source code contains **88 HTTP entry points** that touch RLS tables, out of 150 total API routes.
3. **DISCREPANCY-03 [Tenant-Sensitive Writes Scope]:**
   The 234 writes represent all write operations outside UoW across the 28 unmigrated request services. Exactly 127 of those writes touch tables containing a `tenant_id` column (and 120 touch active RLS tables).

---

## 15. Evidence Limitations

1. **Unrotated Credentials in Git History:** Commits `4d0825c` and `ddbd748` contain live superuser passwords that remain active on host machines until rotated by human operations.
2. **Real-DB Testing Scope:** Only Encounter and Triage have live PostgreSQL 16 RLS integration tests. Candidates A through D rely on unit and mock tests.

---

## 16. Final Determination & Regression Results

The 6 target regression suites were executed with zero modifications to production code:
```text
1. tests/p02b_wave1b1_triage_uow.test.js .............. 39/39 PASS
2. tests/p02b_wave1b1_l1_controller_gate.test.js ...... 15/15 PASS
3. tests/p02b_wave1b1_real_rls_integration.test.js .... 10/10 PASS
4. tests/triageVerticalSlice.test.js .................. 6/6 PASS
5. tests/verticalSlice04TriageDurability.test.js ....... 8/8 PASS
6. tests/triageEngine.test.js ......................... 3/3 PASS
Total: 81/81 PASS (100% Clean)
```

```text
========================================================================================
APPLICATION SECURITY FOUNDATION: PARTIAL
STAGE 0: NO-GO
PRODUCTION: BLOCKED
NEXT WAVE: HOLD — PENDING HUMAN SELECTION
EXECUTION: STOPPED
========================================================================================
```
