# P0-2B WAVE 1B.1 — DOMAIN-BOUNDED UOW PILOT SELECTION REPORT

**Audit Date:** 2026-10-01  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Branch:** `feature/security-foundation-wave1a10`  
**Baseline:** `P0-2B-WAVE1B0T-R`  
**Classification:** `AUTHORITATIVE_AUDIT_REPORT`  
**Standard:** Enterprise HIS Quality Gate & Foundation Directive  

---

## 1. Executive Summary

This report establishes the empirical candidate evaluation and technical rationale for selecting the **first pilot domain** for Unit of Work (UoW) remediation under **P0-2B Wave 1B.1**.

### Current Baseline Metrics:
- **Total Production DB Call Sites:** 846
- **Production Request-Path DB Call Sites:** 845
- **Request-Path RLS-Table Call Sites:** 157
- **Request-Path DB Calls Outside UoW:** 843
- **Request-Path RLS Calls Outside UoW:** 156 (99.36% of RLS calls)
- **Tenant-Sensitive Writes Outside UoW:** 239
- **Request-Path Reads Outside UoW:** 604

In strict adherence to the **Wave 1B.1 Directive**, remediation must NOT attempt to refactor all 156 unsafe calls simultaneously. Instead, exactly **one bounded domain** is selected as an evidence-driven pilot to establish the authoritative pattern for tenant isolation, transaction rollback, commit semantics, connection cleanup, and pool hygiene.

---

## 2. Multi-Candidate Domain Evaluation

The following 11 candidate domains were extracted from the active AST inventory (`scratch/p02b_wave1a11_request_db_inventory.json`) and repository source code:

---

### Candidate 1: Emergency / Triage (IGD)
- **Domain:** `Emergency / IGD` (`triageApplication`)
- **Request-Path Files:**
  - `server/services/triageApplication.service.js` (Service & Queries)
  - `server/controllers/triage.controller.js` (Controller)
  - `server/routes/triage.routes.js` (Routes)
- **DB Call Sites:** 20 total
- **RLS-Table Calls:** 11 (5 writes, 6 reads)
- **Writes:** 5 (all tenant-sensitive: `triage_assessments`, `triage_sla_timers`, `encounters`, `universal_audit_logs`)
- **Reads:** 15 (6 touching RLS tables `encounters`, `master_patients`)
- **Transaction Boundaries:** 2 clear transaction blocks (`recordTriageAssessment`, `recordFirstPhysicianContact`) and 1 read query (`getTriageByEncounterId`)
- **Existing UoW Usage:** `0` (Manual `postgresPoolService.getPool().connect()` with raw `BEGIN`/`COMMIT`/`ROLLBACK` without tenant GUC injection)
- **Direct Pool Access:** Yes (`postgresPoolService.getPool()`, `pool.query()`)
- **Client.query Usage:** Yes (`client.query` on raw acquired connection)
- **Tenant-Sensitive Operations:**
  - Encounter row-locking & status transition (`SELECT * FROM encounters FOR UPDATE`, `UPDATE encounters`)
  - Triage assessment recording (`INSERT INTO triage_assessments`)
  - SLA timer lifecycle (`INSERT INTO triage_sla_timers`, `SELECT ... FOR UPDATE`, `UPDATE triage_sla_timers`)
  - Immutable audit trail (`INSERT INTO universal_audit_logs`)
  - Clinical detail read join (`triage_assessments` ⨝ `master_patients` ⨝ `encounters`)
- **Route / Controller / Service Relationships:** Clean, strictly layered 1:1:1 architecture: `triage.routes.js` ➔ `triage.controller.js` ➔ `triageApplication.service.js`
- **Test Coverage:** Existing clinical flow coverage in `server/services/emergencyUatJourney.service.js`
- **Known Clinical/Business Dependencies:** Emergency triage level determination (ATS 1–5 / ESI), response time SLA monitoring, encounter status sync

---

### Candidate 2: Nursing / CPPT
- **Domain:** `Nursing / CPPT` (`clinicalNotesApplication`)
- **Request-Path Files:** `server/services/clinicalNotesApplication.service.js`
- **DB Call Sites:** 35 total
- **RLS-Table Calls:** 15 (3 writes, 12 reads)
- **Writes:** 4 (3 touching RLS tables)
- **Reads:** 31 (12 touching RLS tables)
- **Transaction Boundaries:** Mixed SOAP note creation and multidisciplinary endorsement
- **Existing UoW Usage:** `0`
- **Direct Pool Access:** Yes
- **Client.query Usage:** Yes
- **Tenant-Sensitive Operations:** `cppt_entries`, `encounters`, `master_patients`
- **Route / Controller / Service Relationships:** Handled via clinical notes routing
- **Test Coverage:** Moderate
- **Known Clinical/Business Dependencies:** High dependency on SOAP signature hashes, nurse shift handovers, and DPJP verification

---

### Candidate 3: Care Coordination & Timeline
- **Domain:** `Care Coordination` (`careCoordinationAndTimeline`)
- **Request-Path Files:** `server/services/careCoordinationAndTimeline.service.js`
- **DB Call Sites:** 39 total
- **RLS-Table Calls:** 11 (4 writes, 7 reads)
- **Writes:** 13 (4 touching RLS)
- **Reads:** 26 (7 touching RLS)
- **Transaction Boundaries:** Longitudinal care plan and timeline event logging
- **Existing UoW Usage:** `0`
- **Direct Pool Access:** Yes
- **Client.query Usage:** Yes
- **Tenant-Sensitive Operations:** `longitudinal_care_plans`, `encounters`
- **Route / Controller / Service Relationships:** Cross-cutting across multiple services
- **Test Coverage:** Partial
- **Known Clinical/Business Dependencies:** Multi-departmental discharge planning and care pathways

---

### Candidate 4: Medication Closed-Loop
- **Domain:** `Medication` (`medicationClosedLoop`)
- **Request-Path Files:** `server/services/medicationClosedLoop.service.js`
- **DB Call Sites:** 80 total
- **RLS-Table Calls:** 13 (5 writes, 8 reads)
- **Writes:** 23 (5 touching RLS)
- **Reads:** 57 (8 touching RLS)
- **Transaction Boundaries:** Prescriptions, 5-Rights eMAR verification, dispense allocation
- **Existing UoW Usage:** `0`
- **Direct Pool Access:** Yes
- **Client.query Usage:** Yes
- **Tenant-Sensitive Operations:** `medication_orders`, `medication_dispense_allocations`, `medication_emar_administrations`
- **Route / Controller / Service Relationships:** Large, heavily interconnected service (58 KB)
- **Test Coverage:** Moderate
- **Known Clinical/Business Dependencies:** Complex pharmacy inventory deduction, narcotics double-signoff, high-risk medication alerts

---

### Candidate 5: Diagnostic Interpretation
- **Domain:** `Diagnostic` (`diagnosticInterpretation`)
- **Request-Path Files:** `server/services/diagnosticInterpretation.service.js`
- **DB Call Sites:** 38 total
- **RLS-Table Calls:** 11 (3 writes, 8 reads)
- **Writes:** 9 (3 touching RLS)
- **Reads:** 29 (8 touching RLS)
- **Transaction Boundaries:** Physician result interpretation and critical value sign-off
- **Existing UoW Usage:** `0`
- **Direct Pool Access:** Yes
- **Client.query Usage:** Yes
- **Tenant-Sensitive Operations:** `physician_diagnostic_interpretations`, `clinical_orders`
- **Route / Controller / Service Relationships:** Interacts with LIS/PACS engines
- **Test Coverage:** Moderate
- **Known Clinical/Business Dependencies:** Critical lab alert workflows, HL7/FHIR observation mapping

---

### Candidate 6: Perioperative & Surgery
- **Domain:** `Surgery` (`perioperativeClosedLoop`)
- **Request-Path Files:** `server/services/perioperativeClosedLoop.service.js`
- **DB Call Sites:** 59 total
- **RLS-Table Calls:** 0 (All surgical tables currently lack explicit RLS classification in the 31 core set)
- **Writes:** 23
- **Reads:** 36
- **Transaction Boundaries:** WHO surgical safety checklist, intraoperative anesthesia logs
- **Existing UoW Usage:** `0`
- **Direct Pool Access:** Yes
- **Client.query Usage:** Yes
- **Tenant-Sensitive Operations:** Surgical team sign-in/time-out/sign-out
- **Route / Controller / Service Relationships:** Dedicated surgical engine
- **Test Coverage:** Low
- **Known Clinical/Business Dependencies:** OT scheduling, sterile supply coordination

---

### Candidate 7: Blood Bank
- **Domain:** `Blood Bank` (`bloodBank`)
- **Request-Path Files:** `server/controllers/bloodBank.controller.js`
- **DB Call Sites:** 44 total
- **RLS-Table Calls:** 13 (8 writes, 5 reads)
- **Writes:** 23 (8 touching RLS)
- **Reads:** 21 (5 touching RLS)
- **Transaction Boundaries:** Crossmatch, dual nurse verification, bedside transfusion
- **Existing UoW Usage:** `0`
- **Direct Pool Access:** Yes
- **Client.query Usage:** Yes
- **Tenant-Sensitive Operations:** `blood_bedside_dual_nurse_verifications`, `blood_bank_billing_reconciliations`
- **Route / Controller / Service Relationships:** Controller houses database queries directly (no separate service layer)
- **Test Coverage:** Moderate
- **Known Clinical/Business Dependencies:** Blood product bag verification, adverse hemovigilance logging

---

### Candidate 8: Laboratory
- **Domain:** `Laboratory` (`laboratoryApplication`)
- **Request-Path Files:** `server/services/laboratoryApplication.service.js`
- **DB Call Sites:** 71 total
- **RLS-Table Calls:** 8 (3 writes, 5 reads)
- **Writes:** 16 (3 touching RLS)
- **Reads:** 55 (5 touching RLS)
- **Transaction Boundaries:** Specimen accessioning, analyzer result validation, delta checks
- **Existing UoW Usage:** `0`
- **Direct Pool Access:** Yes
- **Client.query Usage:** Yes
- **Tenant-Sensitive Operations:** `clinical_orders`
- **Route / Controller / Service Relationships:** Large service (38 KB)
- **Test Coverage:** Low
- **Known Clinical/Business Dependencies:** LIS instrument integration, critical result escalations

---

### Candidate 9: Radiology
- **Domain:** `Radiology` (`radiologyApplication`)
- **Request-Path Files:** `server/services/radiologyApplication.service.js`
- **DB Call Sites:** 72 total
- **RLS-Table Calls:** 19 (5 writes, 14 reads)
- **Writes:** 20 (5 touching RLS)
- **Reads:** 52 (14 touching RLS)
- **Transaction Boundaries:** Worklist scheduling, DICOM study completion, radiologist reporting
- **Existing UoW Usage:** `0`
- **Direct Pool Access:** Yes
- **Client.query Usage:** Yes
- **Tenant-Sensitive Operations:** `clinical_orders`, `radiology_critical_finding_alerts`
- **Route / Controller / Service Relationships:** Large service (41 KB)
- **Test Coverage:** Low
- **Known Clinical/Business Dependencies:** PACS DICOM C-STORE, radiation dose tracking

---

### Candidate 10: Financial & Billing
- **Domain:** `Financial` (`patientFinancialAndRevenueCycle` & `billing.routes.js`)
- **Request-Path Files:**
  - `server/services/patientFinancialAndRevenueCycle.service.js` (42 calls)
  - `server/routes/billing.routes.js` (3 calls)
- **DB Call Sites:** 45 total
- **RLS-Table Calls:** 8 (2 writes, 6 reads)
- **Writes:** 15 (2 touching RLS)
- **Reads:** 30 (6 touching RLS)
- **Transaction Boundaries:** Invoice generation, payment receipting, BPJS claim reconciliation
- **Existing UoW Usage:** `0`
- **Direct Pool Access:** Yes
- **Client.query Usage:** Yes
- **Tenant-Sensitive Operations:** `patient_split_invoices`, `bpjs_claim_submissions`
- **Route / Controller / Service Relationships:** Fragmented across routes and service
- **Test Coverage:** Low
- **Known Clinical/Business Dependencies:** Tariff matrices, casemix grouping, BPJS VClaim API

---

### Candidate 11: Enterprise Inventory
- **Domain:** `Inventory` (`enterpriseInventory`)
- **Request-Path Files:** `server/controllers/enterpriseInventory.controller.js`
- **DB Call Sites:** 32 total
- **RLS-Table Calls:** 0 (Standard master catalog tables)
- **Writes:** 12
- **Reads:** 20
- **Transaction Boundaries:** Stock transfer, bin relocation, FIFO stock valuation
- **Existing UoW Usage:** `0`
- **Direct Pool Access:** Yes
- **Client.query Usage:** Yes
- **Tenant-Sensitive Operations:** None in the core RLS catalog
- **Route / Controller / Service Relationships:** Controller-based
- **Test Coverage:** Low
- **Known Clinical/Business Dependencies:** Ward stock requests, minimum reorder levels

---

## 3. Comparative Pilot Suitability Matrix

| Candidate Domain | Bounded Surface (Files) | Total DB Calls | RLS Call Sites | Writes / Reads | Cross-Domain Risk | Testable Request Paths | Pilot Readiness Verdict |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Emergency / Triage** | **1 Service, 1 Controller, 1 Route** | **20** | **11** | **5 / 15** | **LOW (Self-contained)** | **YES (Complete Express Route)** | **`STRONGLY RECOMMENDED PILOT`** |
| **Nursing / CPPT** | 1 Service, 1 Route | 35 | 15 | 4 / 31 | MEDIUM (Multi-specialty handoffs) | YES | Viable secondary candidate |
| **Care Coordination** | 1 Service, multiple integrations | 39 | 11 | 13 / 26 | HIGH (Timeline & pathways) | PARTIAL | High coupling risk |
| **Medication Closed-Loop** | 1 Massive Service (58 KB) | 80 | 13 | 23 / 57 | HIGH (eMAR + Depots + Formulary) | YES | Too broad for initial pilot |
| **Diagnostic** | 1 Service (23 KB) | 38 | 11 | 9 / 29 | MEDIUM (LIS/PACS listeners) | PARTIAL | External engine dependencies |
| **Surgery** | 1 Service (44 KB) | 59 | 0 | 23 / 36 | MEDIUM (Checklists & OT state) | NO | Zero core RLS call sites |
| **Blood Bank** | 1 Controller (No service) | 44 | 13 | 23 / 21 | MEDIUM (Architectural debt in controller)| PARTIAL | Architecture requires refactor |
| **Laboratory** | 1 Large Service (38 KB) | 71 | 8 | 16 / 55 | HIGH (Analyzer pipelines) | PARTIAL | Too broad for initial pilot |
| **Radiology** | 1 Large Service (41 KB) | 72 | 19 | 20 / 52 | HIGH (PACS / DICOM) | PARTIAL | Too broad for initial pilot |
| **Financial / Billing** | 1 Service, 1 Route | 45 | 8 | 15 / 30 | HIGH (Tariff & BPJS claims) | PARTIAL | Multi-system financial coupling |
| **Inventory** | 1 Controller | 32 | 0 | 12 / 20 | LOW | NO | Zero core RLS call sites |

---

## 4. Technical Pilot Selection Verdict

### Selected Pilot Domain: **Emergency / Triage (`triageApplication`)**

### Technical Rationale:
1. **Bounded Dependency Surface:**
   - Architecture follows clean layered boundaries: `server/routes/triage.routes.js` ➔ `server/controllers/triage.controller.js` ➔ `server/services/triageApplication.service.js`.
   - All 20 database calls in the domain are localized within `server/services/triageApplication.service.js`.
   - Zero cascading modifications to external domains required.
2. **Empirical Proof Capability:**
   - Possesses both high-risk write operations (`INSERT INTO triage_assessments`, `INSERT INTO triage_sla_timers`, `UPDATE encounters`, `INSERT INTO universal_audit_logs`) and clinical detail read operations (`getTriageByEncounterId`).
   - Every operation is explicitly bound to tenant isolation boundaries.
3. **Deterministic Transaction Boundaries:**
   - `recordTriageAssessment`: Executes multi-table atomic write with row-locking (`SELECT ... FOR UPDATE`).
   - `recordFirstPhysicianContact`: Executes conditional SLA timer termination and encounter state transition.
   - `getTriageByEncounterId`: Executes multi-table join across `triage_assessments`, `master_patients`, and `encounters`.
4. **Verifiable Test Paths:**
   - Can be comprehensively proven against real seeded database records (e.g., Tenant A encounters) without synthetic mocks.
   - Transaction commit, forced rollback, socket sanitization (`DISCARD ALL`), and pool isolation can be verified directly.
5. **Exact Remediation Impact:**
   - Remediates **11 unsafe RLS call sites** (reducing global unsafe paths from `156` to `145`).
   - Remediates **5 tenant-sensitive writes outside UoW** (reducing global writes from `239` to `234`).
   - Remediates **20 total request-path DB calls** into authoritative `withUnitOfWork` blocks.

---

## 5. Implementation Directives for Pilot

1. **UoW Migration:** Refactor `server/services/triageApplication.service.js` to utilize `withUnitOfWork` from `server/db/unitOfWork.js`.
2. **Eliminate Hardcoded Fallbacks:** Remove `actor.tenantId || '00000000-0000-0000-0000-000000000001'` fallback; enforce strict fail-closed validation of `tenantId` from authenticated actor context.
3. **Transaction Context:** All queries must execute via `uowContext.client` or `uowContext.query` inside the transaction with transaction-local `app.current_tenant_id`.
4. **Preserve Clinical Logic:** Do not modify ATS 1–5 / ESI classification algorithms, SLA calculation rules, or clinical validation constraints.
5. **Verification Suite:** Create `tests/p02b_wave1b1_triage_uow.test.js` validating:
   - Tenant A read & write isolation.
   - Cross-tenant denial.
   - Missing tenant fail-closed.
   - Atomic commit & rollback integrity.
   - Connection hygiene and pool isolation.
