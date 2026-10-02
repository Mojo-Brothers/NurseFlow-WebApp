# P0-2B — WAVE SELECTION READINESS AUDIT & FINAL FACTUAL RECONCILIATION
## Candidate A / B / C / D — Factual Decision Support Package Before Wave 1B.2 Implementation

**Document Identifier:** `DOC-AUDIT-P02B-WAVE-SELECTION-READINESS-20261002`  
**Date:** 02 Oktober 2026  
**Classification:** Pre-Implementation Security Architecture & Final Factual Reconciliation  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Branch:** `feature/security-foundation-wave1a10`  
**Base Commit:** `398b45a96ae234ff6406e232d987d6051c0ee47b`  
**Target Environment:** Local Security Lab (`nurseflow_security_lab` on PostgreSQL 16)  
**Production Invariant:** `nurseflow_enterprise_his` strictly untouched  
**Current Global Gate:**
```text
APPLICATION SECURITY FOUNDATION : PARTIAL
STAGE 0                         : NO-GO
PRODUCTION                      : BLOCKED
PILOT STATUS                    : Triage + Encounter UoW/RLS VERIFIED (81/81 PASS)
IMPLEMENTATION                  : NOT STARTED (AUDIT ONLY)
FINAL RECONCILIATION            : VERIFIED
```

---

## 1. Git Baseline Verification

In strict compliance with audit governance, the working tree was verified prior to and throughout the audit:

```text
HEAD Commit:            398b45a96ae234ff6406e232d987d6051c0ee47b
HEAD Commit Message:    audit(p02b): wave selection readiness matrix
Active Branch:          feature/security-foundation-wave1a10
Working Tree Status:    Clean (0 uncommitted production changes)
Production Code Touch:  ZERO (0 controllers, 0 services, 0 routes, 0 migrations modified)
Audit Output Files:
  - docs/audit/P0-2B-WAVE-SELECTION-READINESS.md
  - scratch/p02b_wave_selection_readiness.json
  - docs/CHANGELOG_PERUBAHAN_HIS.md
```

---

## 2. RLS Scope Reconciliation: 100 Database Universe vs 33 Stage-0 Clinical Core

To prevent conflation between the complete database state and the Stage-0 backlog inventory, both scopes are explicitly separated and reconciled.

### A. Complete Database RLS Universe (PostgreSQL 16 Metadata)
*Source of Truth: PostgreSQL System Catalogs (`pg_class`, `pg_namespace`, `pg_policies`)*

#### Catalog Metrics Summary Table
| Metric | Count | Catalog Verification Source |
|---|---|---|
| **RLS-enabled public tables** | **100** | `pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relrowsecurity = true` |
| **Public tables represented in pg_policies** | **100** | `SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'` |
| **Total policy rows** | **100** | `SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'` |
| **RLS tables with $ge$ 1 policy** | **100** | Tables matching between `pg_class` and `pg_policies` |
| **RLS tables without policy** | **0** | Zero orphaned RLS tables |

#### Policy Uniformity & Catalog Integrity
- **Command:** `ALL` across all 100 tables.
- **Roles:** `{public}` across all 100 tables.
- **Permissive:** `PERMISSIVE` across all 100 tables.
- **USING Expression:** `(tenant_id = current_app_tenant_id())` across all 100 tables.
- **WITH CHECK Expression:** `(tenant_id = current_app_tenant_id())` across all 100 tables.
- **Standardization Migration:** Migration `081_verify_and_consolidate_100_tables.sql` consolidated all policies into exactly 1 canonical policy per table.

> ⚠️ **CATALOG INTEGRITY NOTICE:**  
> **100 policies in the database catalog $
eq$ 100 secure tables in operation.**  
> The catalog metadata confirms that PostgreSQL RLS is enabled and policies exist on all 100 public tables. However, without application-level tenant context binding (`withUnitOfWork` setting `app.current_tenant_id`), direct connections or fail-closed queries will fail closed or remain vulnerable outside the Unit of Work. Catalog presence proves schema-level configuration only.

#### Complete List of 100 RLS Tables
`anesthesia_records`, `appointment_audit_logs`, `appointments`, `bed_occupancies`, `bed_transfers`, `billing_ledgers`, `blood_bank_billing_reconciliations`, `blood_bedside_dual_nurse_verifications`, `blood_bedside_verifications`, `blood_crossmatch_tests`, `blood_donor_units`, `blood_issue_records`, `blood_storage_temperature_logs`, `blood_transfusion_records`, `bpjs_claim_disputes`, `bpjs_claim_submissions`, `bpjs_sep_records`, `bpjs_vclaim_lifecycle_logs`, `casemix_cases`, `cdss_alerts`, `clinical_authorization_logs`, `clinical_observations`, `clinical_orders`, `clinical_privileges`, `clinical_staff_profiles`, `cppt_notes`, `cssd_instrument_sets`, `cssd_sterilization_cycles`, `encounters`, `enterprise_users`, `episodes_of_care`, `fhir_delivery_outbox`, `hemovigilance_incident_investigations`, `hospital_invoices`, `icu_acuity_assessments`, `inacbg_claims`, `inacbg_grouping_results`, `inventory_batches`, `inventory_stock_movements`, `laboratory_orders`, `longitudinal_care_plans`, `massive_transfusion_protocols`, `master_beds`, `master_buildings`, `master_floors`, `master_inacbg_tariffs`, `master_patients`, `master_rooms`, `master_wards`, `medical_device_implant_recalls`, `medication_catalog`, `medication_dispense_allocations`, `medication_emar_administrations`, `medication_orders`, `on_call_schedules`, `operating_room_schedules`, `operating_rooms`, `operating_theatres`, `patient_allergies`, `patient_billing_reconciliation`, `patient_registrations`, `patient_split_invoices`, `pharmacy_controlled_substance_logs`, `pharmacy_depots`, `pharmacy_dispensing_orders`, `pharmacy_inventory_batches`, `pharmacy_warehouses`, `physician_diagnostic_interpretations`, `post_anesthesia_aldrete_scores`, `post_op_handoffs`, `prescription_dispense_records`, `queue_sequences`, `queue_tickets`, `radiology_audit_log`, `radiology_critical_finding_alerts`, `radiology_instances`, `radiology_orders`, `radiology_reports`, `radiology_series`, `radiology_studies`, `resuscitation_events`, `safety_decision_registry`, `shift_assignments`, `soap_notes`, `staff_credentials`, `staff_rosters`, `surgery_cases`, `surgery_schedules`, `surgical_billing_breakdown`, `surgical_cases`, `surgical_clinical_notes`, `surgical_implants_tracking`, `surgical_safety_checklists`, `surgical_teams`, `tenant_satusehat_credentials`, `transfusion_reaction_logs`, `triage_assessments`, `triage_sla_timers`, `universal_audit_logs`, `who_surgical_safety_checklists`.

---

### B. Stage-0 Clinical-Core RLS Inventory (Scanner Scope: 33 Tables)
*Source of Truth: Stage-0 Inventory Scanner / Migration 079 + 080 + 081*

The Stage-0 scanner tracks exactly **33 tables**:
- **10 Core Clinical Tables (Migration 079):** `encounters`, `master_patients`, `clinical_orders`, `medication_emar_administrations`, `medication_dispense_allocations`, `physician_diagnostic_interpretations`, `patient_split_invoices`, `universal_audit_logs`, `safety_decision_registry`, `longitudinal_care_plans`.
- **21 Zero-Policy / Blackout Protection Tables (Migration 079):** High-risk secondary tables requiring fail-closed isolation during Stage 0.
- **2 Triage Tables (Wave 1B.1 Addition):** `triage_assessments`, `triage_sla_timers`.

#### Subset Integrity Mathematical Verification
- **Total Stage-0 Tables:** **33**
- **Total PostgreSQL Public RLS Tables:** **100**
- **Total Non-Stage-0 Subsystem Tables:** **67**
- **Stage-0 Proportion:** $33 / 100 = 33.0\%$
- **Non-Stage-0 Proportion:** $67 / 100 = 67.0\%$
- **Duplicate Check in Stage-0 Array:** **0 duplicates** (all 33 names unique).
- **Catalog Cross-Check:** All 33 tables physically exist in PostgreSQL 16 `pg_class` with `relrowsecurity = true`.
- **Determination:** The scanner's 33 tables represent a **strict, verified subset (33%)** of the complete 100-table database RLS universe.

#### Subsystem Partitioning of the Remaining 67 RLS Tables:
1. **Operating Theatre & Surgery (11 tables):** `surgery_cases`, `surgery_schedules`, `operating_rooms`, `operating_room_schedules`, `surgical_cases`, `surgical_clinical_notes`, `surgical_implants_tracking`, `surgical_safety_checklists`, `surgical_teams`, `post_op_handoffs`, `anesthesia_records`.
2. **Radiology & PACS (6 tables):** `radiology_orders`, `radiology_reports`, `radiology_studies`, `radiology_series`, `radiology_instances`, `radiology_audit_log`.
3. **Blood Bank & Transfusion (7 tables):** `blood_transfusion_records`, `blood_donor_units`, `blood_issue_records`, `blood_crossmatch_tests`, `blood_storage_temperature_logs`, `blood_bedside_verifications`, `transfusion_reaction_logs`.
4. **Facility & Bed Management (7 tables):** `bed_occupancies`, `bed_transfers`, `master_beds`, `master_rooms`, `master_wards`, `master_floors`, `master_buildings`.
5. **Appointments & Outpatient Queue (4 tables):** `appointments`, `appointment_audit_logs`, `queue_tickets`, `queue_sequences`.
6. **Billing, Claims & INA-CBG (4 tables):** `inacbg_claims`, `bpjs_sep_records`, `billing_ledgers`, `hospital_invoices`.
7. **Pharmacy Warehousing & Batches (9 tables):** `pharmacy_depots`, `pharmacy_warehouses`, `pharmacy_dispensing_orders`, `pharmacy_inventory_batches`, `medication_catalog`, `inventory_batches`, `inventory_stock_movements`, `prescription_dispense_records`, `medication_orders`.
8. **Clinical Documentation, Observations & Alerts (10 tables):** `laboratory_orders`, `clinical_observations`, `icu_acuity_assessments`, `resuscitation_events`, `cdss_alerts`, `patient_registrations`, `episodes_of_care`, `soap_notes`, `cppt_notes`, `patient_allergies`.
9. **Staff Privileging & Enterprise Administration (9 tables):** `enterprise_users`, `clinical_staff_profiles`, `clinical_privileges`, `staff_credentials`, `staff_rosters`, `shift_assignments`, `on_call_schedules`, `clinical_authorization_logs`, `tenant_satusehat_credentials`.

---

## 3. Candidate A Reconciliation: Nursing / CPPT (`clinicalNotesApplication`)

### Factual Metrics & Denominators
- **Total DB Call Sites in Domain:** **35**
- **Stage-0 RLS DB Call Sites:** **15** (all outside UoW)
- **Safe RLS DB Call Sites:** **0**
- **Writes Outside UoW:** **4**
- **Reads & Controls Outside UoW:** **31**
- **HTTP Entry Points:** **6 routes** (in [`server/routes/clinicalNotes.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/clinicalNotes.routes.js))

### Denominator Reconciliation (Why RLS $
eq$ Total DB Calls)
The metrics are not mutually exclusive and must not be conflated:
1. **Operation Type Denominator (Total = 35):**
   - **Writes (4):** INSERT into `soap_notes`, INSERT into `soap_notes` amendment, INSERT into `cppt_notes`, UPDATE on `cppt_notes` verification.
   - **Reads & Controls (31):** SELECT queries (`encounters` verification, `soap_notes` lookup, `cppt_notes` lookup, note history), pool connection acquisitions (`getPool`, `pool.connect`), and manual transaction controls (`BEGIN`, `COMMIT`, `ROLLBACK`).
   - Formula: $\text{Writes (4)} + \text{Reads & Controls (31)} = \mathbf{35\text{ Total Call Sites}}$.
2. **Table Classification Denominator (Stage-0 RLS = 15):**
   - Of the 35 total calls, exactly **15 call sites** touch tables within the 33 Stage-0 clinical core (`encounters`, `master_patients`, `universal_audit_logs`).
   - The remaining 20 call sites touch non-Stage-0 tables (`soap_notes`, `cppt_notes`) or are connection/transaction primitives.
   - Therefore, $\mathbf{15\text{ RLS Calls}} \neq \mathbf{35\text{ Total DB Calls}}$.

---

## 4. Candidate D Reconciliation: Patient Financial & Billing

### Reconciliation Summary Table
| Metric | Previous Inventory | Current Deep Audit | Delta | Source of Delta | Factual Reason |
|---|---|---|---|---|---|
| **HTTP Entry Points** | **6** | **7** | **+1** | [`server/routes/billing.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/billing.routes.js) | `billing.routes.js` defines inline route `GET /api/v1/billing/ledger/:episodeId` |
| **Writes Outside UoW** | **15** | **15** | **0** | [`server/services/patientFinancialAndRevenueCycle.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/patientFinancialAndRevenueCycle.service.js) | Both scopes have identical write mutations |
| **Reads Outside UoW** | **27** | **30** | **+3** | [`server/routes/billing.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/billing.routes.js) | `billing.routes.js` executes 1 `getPool()` + 2 SELECT queries |
| **RLS Calls (Stage-0)**| **8** | **8** | **0** | [`server/services/patientFinancialAndRevenueCycle.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/patientFinancialAndRevenueCycle.service.js) | `hospital_invoices` and `patient_deposit_ledgers` are outside Stage-0 core |
| **Total DB Call Sites**| **42** | **45** | **+3** | [`server/routes/billing.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/billing.routes.js) | $42\text{ (Service)} + 3\text{ (Billing Route)} = 45$ |

### Explicit Scope Definition & Denominator Breakdown
1. **Core Service Scope (Strictly `patientFinancialAndRevenueCycle.service.js`):**
   - **Entry Points:** 6 routes (in `patientFinancialAndRevenueCycle.routes.js`)
   - **Writes:** 15 writes
   - **Reads & Controls:** 27 calls (6 connection acquisitions + 18 `BEGIN`/`COMMIT`/`ROLLBACK` controls + 3 SELECT queries)
   - **Total DB Calls:** $15 + 27 = \mathbf{42\text{ calls}}$
   - **Stage-0 RLS Calls:** 8 (touching `patient_split_invoices`)
2. **Expanded Domain Scope (Service + `billing.routes.js`):**
   - **Entry Points:** 7 routes (6 in financial routes + 1 in `billing.routes.js`)
   - **Writes:** 15 writes (+0)
   - **Reads & Controls:** 30 calls (+3: lines 12, 13, 14 of `billing.routes.js`)
   - **Total DB Calls:** $42 + 3 = \mathbf{45\text{ calls}}$
   - **Stage-0 RLS Calls:** 8 (+0, since `hospital_invoices` is among the 67 subsystem tables)

Both scopes are documented. The primary service core has **27 reads / 6 entry points / 42 calls**, and the expanded billing domain has **30 reads / 7 entry points / 45 calls**.

---

## 5. Candidate C Structure & Coupling Reconciliation

Candidate C is explicitly structured into two functional sub-domains:

```text
Candidate C
 ├── C1 CPOE Core (cpoeApplication.service.js | orders.routes.js)
 └── C2 Diagnostic Interpretation (diagnosticInterpretation.service.js | diagnosticInterpretation.routes.js)
```

### Factual Metrics by Sub-Domain
| Sub-Domain | Service File | Route File | HTTP Routes | RLS Calls | Writes Out | Reads Out | Total Calls |
|---|---|---|---|---|---|---|---|
| **C1: CPOE Core** | `cpoeApplication.service.js` | `orders.routes.js` | 9 | 13 | 3 | 19 | 22 |
| **C2: Diagnostic Interpretation** | `diagnosticInterpretation.service.js` | `diagnosticInterpretation.routes.js` | 4 | 11 | 9 | 29 | 38 |
| **Combined Candidate C** | *(Both services)* | *(Both route files)* | **13** | **24** | **12** | **48** | **60** |

### Coupling & Transaction Boundary Analysis
- **Synchronous Transaction Coupling:** **NONE (0 shared synchronous transactions).**  
  CPOE order creation (`createOrder`) and Diagnostic Interpretation (`recordPhysicianInterpretation`) execute in entirely separate, non-overlapping database transactions at different points in time.
- **Shared Tables:** `clinical_orders`, `cpoe_order_items`, `encounters`, `clinical_domain_outbox`, `universal_audit_logs`.
- **Shared Services:** Both interface with `safetyAuthorizationService` and `postgresPoolService`.
- **Asynchronous Coupling:** Diagnostic result notifications reference the upstream `clinical_orders.id` via foreign key. When an attending physician takes secondary clinical action on an abnormal result, a new clinical order is placed.
- **Outbox Dependency:** Both sub-domains emit domain events to `clinical_domain_outbox` for decoupled asynchronous processing.
- **Scope Statement:** Factual evidence proves C1 and C2 can technically execute as one combined wave (13 routes) or as two independent bounded slices (C1: 9 routes, C2: 4 routes). Neither architecture is prescribed; only factual characteristics are reported.

---

## 6. Standardized Transaction Complexity Terminology

All complexity ratings are defined strictly by mutation volume, dependent read count, locking requirements, and rollback surface. **They are not evaluative scores, quality metrics, or recommendations.**

- **Candidate A — LOW:**  
  Transaction scope consists of 1-2 dependent reads (`encounters` / `soap_notes` `FOR UPDATE`), 1 primary note mutation (`soap_notes` or `cppt_notes`), and 1 audit mutation (`universal_audit_logs`) within a single database transaction, with no external inventory or ledger locking.
- **Candidate B — HIGH:**  
  Transaction scope encompasses multi-step mutations across 5+ tables (`medication_orders`, `inventory_batches`, `inventory_stock_movements`, `medication_dispense_allocations`, `medication_emar_administrations`, `clinical_domain_outbox`), requiring pessimistic locking (`FOR UPDATE`) on inventory batches, FEFO allocation logic, order status updates, and multi-table rollback coordination.
- **Candidate C — MEDIUM:**  
  Transaction scope in C1 consists of order header and multi-item row mutations with outbox emission; in C2 consists of notification status updates, diagnostic interpretation insertion, delta checks, and optional secondary order generation, with rollback surfaces bounded within clinical orders and diagnostic tables.
- **Candidate D — MEDIUM:**  
  Transaction scope consists of split-invoice generation with deposit ledger drawdown validation, payment transaction recording, or cashier shift reconciliation, requiring double-entry ledger balance verification and rollback coordination between deposit ledgers and invoice balances.

---

## 7. Test Evidence Validation: Mock vs Real DB

An audit of all candidate test files confirms the strict absence of real database evidence outside the ratified Triage/Encounter pilot:

| Candidate | Test Files Inspected | Mock Only (`vi.fn`) | Pure In-Memory Unit | Real PostgreSQL 16 Evidence | Real RLS Multi-Tenant Evidence |
|---|---|---|---|---|---|
| **Candidate A** | 1 file | 1 | 0 | **0 tests** | **0 tests** |
| **Candidate B** | 12 files | 1 | 11 | **0 tests** | **0 tests** |
| **Candidate C** | 3 files | 2 | 1 | **0 tests** | **0 tests** |
| **Candidate D** | 5 files | 1 | 4 | **0 tests** | **0 tests** |

**Factual Verification:**
The statement **`A = 0 real DB, B = 0 real DB, C = 0 real DB, D = 0 real DB`** is **100% VERIFIED**. All durability test suites in Candidates A, B, C, and D mock out PostgreSQL client connections or test pure in-memory logic. None execute real queries against PostgreSQL 16 or verify RLS isolation policies.

---

## 8. Neutral Decision Matrix

| Dimension | Candidate A (Nursing / CPPT) | Candidate B (Medication Closed-Loop) | Candidate C (CPOE + Diagnostics) | Candidate D (Patient Financial) |
|---|---|---|---|---|
| **RLS Call Sites (Stage-0)** | 15 | 13 | 24 (13 CPOE + 11 Diag) | 8 |
| **Writes Outside UoW** | 4 | 23 | 12 (3 CPOE + 9 Diag) | 15 |
| **Reads Outside UoW** | 31 | 57 | 48 (19 CPOE + 29 Diag) | 27 (Service) / 30 (Expanded) |
| **HTTP Entry Points** | 6 | 8 | 13 (9 CPOE + 4 Diag) | 6 (Service) / 7 (Expanded) |
| **Total DB Call Sites** | 35 | 80 | 60 | 42 (Service) / 45 (Expanded) |
| **Tables Touched** | 4 | 15 | 10 | 8 |
| **Shared Services** | Encounters, Universal Audit | Inventory, Safety Auth, Outbox, CPOE Orders, Encounters | Safety Auth, Transaction Manager, Outbox, Universal Audit, Encounters | Care Coordination, Outbox, Encounters |
| **Transaction Complexity** | LOW | HIGH | MEDIUM | MEDIUM |
| **Cross-Domain Coupling** | LOW | HIGH | MEDIUM | LOW |
| **Clinical Impact** | HIGH | HIGH | HIGH | LOW |
| **Financial Impact** | MEDIUM | HIGH | MEDIUM | HIGH |
| **Patient-Safety Dependency** | DIRECT | DIRECT | DIRECT | NONE |
| **Existing Unit Tests** | 1 test file (100% Mock) | 12 test files (100% Mock/Unit) | 3 test files (100% Mock/Unit) | 5 test files (100% Mock/Unit) |
| **Real-DB Evidence** | 0 tests | 0 tests | 0 tests | 0 tests |
| **Rollback Requirements** | Single-note + audit rollback | Multi-table inventory batch + order + eMAR rollback | Order + items or interpretation + notification rollback | Split invoice + deposit ledger double-entry rollback |
| **Concurrency Requirements** | Optimistic concurrency on amendment | Strict pessimistic lock (`FOR UPDATE`) on inventory batches | Idempotency lock on order submission | Pessimistic lock on patient deposit ledger |

---

## 9. Verification & Regression Results

The 6 canonical regression suites covering the ratified Triage and Encounter pilot were executed without modifications to production code:

```text
1. tests/p02b_wave1b1_triage_uow.test.js .............. 39/39 PASS
2. tests/p02b_wave1b1_l1_controller_gate.test.js ...... 15/15 PASS
3. tests/p02b_wave1b1_real_rls_integration.test.js .... 10/10 PASS
4. tests/triageVerticalSlice.test.js .................. 6/6 PASS
5. tests/verticalSlice04TriageDurability.test.js ....... 8/8 PASS
6. tests/triageEngine.test.js ......................... 3/3 PASS
Total: 81/81 PASS (100% Clean)
```

---

## 10. Final Authoritative Evidence Table

| Metric | Verified Value | Evidence Source |
|---|---|---|
| **Production DB call sites** | **846** | AST query/connection scan across all 30 production files in `server/**/*.js` |
| **Request-path DB calls** | **845** | Line 100 `server/config/envValidator.js` (`pg_roles` startup check) excluded |
| **PostgreSQL RLS universe** | **100 tables** | `pg_class` public tables with `relrowsecurity = true` and active `pg_policies` |
| **Stage-0 RLS tables** | **33 tables** | Authoritative scanner catalog (Migration 079 Core + Zero-Policy + Triage) |
| **Stage-0 RLS call sites** | **157** | Lexical AST query matching on 33 Stage-0 tables across request pipeline |
| **Safe RLS call sites** | **12** | 1 in Encounter (`line 61`) + 11 in Triage (`lines 130, 131, 134, 137, 230, 250, 333, 341, 346, 360, 370`) |
| **Unsafe RLS call sites** | **145** | 157 request-path RLS calls minus 12 safe UoW-scoped calls |
| **Unsafe HTTP entry points** | **88 routes** | Physical route definition audit across all 150 API endpoints (historical 153 refuted) |
| **Writes outside UoW** | **234** | Total INSERT/UPDATE/DELETE AST nodes outside UoW (127 on tenant-id tables) |
| **Reads outside UoW** | **589** | Total SELECT and connection/tx control nodes outside UoW on request paths |
| **Candidate A RLS calls** | **15** | `clinicalNotesApplication.service.js` queries touching `encounters`, `master_patients`, `universal_audit_logs` |
| **Candidate B RLS calls** | **13** | `medicationClosedLoop.service.js` queries touching Stage-0 medication/order tables |
| **Candidate C RLS calls** | **24** | 13 in `cpoeApplication.service.js` + 11 in `diagnosticInterpretation.service.js` |
| **Candidate D RLS calls** | **8** | `patientFinancialAndRevenueCycle.service.js` queries touching `patient_split_invoices` |
| **Candidate A real-DB evidence**| **0 tests** | Source test audit: `verticalSlice05SoapCpptDurability.test.js` is 100% mock |
| **Candidate B real-DB evidence**| **0 tests** | Source test audit: 12 test files are 100% mock/in-memory unit |
| **Candidate C real-DB evidence**| **0 tests** | Source test audit: 3 test files are 100% mock/in-memory unit |
| **Candidate D real-DB evidence**| **0 tests** | Source test audit: 5 test files are 100% mock/in-memory unit |
| **Target Pilot Regression** | **81/81 PASS** | Vitest execution of the 6 canonical Triage/Encounter test suites |

---

## 11. Final Architectural Status

```text
========================================================================================
APPLICATION SECURITY FOUNDATION : PARTIAL

STAGE 0                         : NO-GO

PRODUCTION                      : BLOCKED

CURRENT PILOT:
Encounter + Triage UoW/RLS = VERIFIED

GLOBAL RLS/UOW REMEDIATION:
NOT COMPLETE

NEXT WAVE:
HOLD — PENDING HUMAN SELECTION

IMPLEMENTATION:
NOT STARTED

FINAL RECONCILIATION:
VERIFIED
========================================================================================
```
