# P0-2B — WAVE SELECTION READINESS AUDIT
## Candidate A / B / C / D — Factual Decision Support Matrix Before Wave 1B.2 Implementation

**Document Identifier:** `DOC-AUDIT-P02B-WAVE-SELECTION-READINESS-20261002`  
**Date:** 02 Oktober 2026  
**Classification:** Pre-Implementation Security Architecture & Readiness Audit  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Branch:** `feature/security-foundation-wave1a10`  
**Target Environment:** Local Security Lab (`nurseflow_security_lab` on PostgreSQL 16)  
**Production Invariant:** `nurseflow_enterprise_his` strictly untouched  
**Current Global Gate:**
```text
APPLICATION SECURITY FOUNDATION : PARTIAL
STAGE 0                         : NO-GO
PRODUCTION                      : BLOCKED
PILOT STATUS                    : Triage + Encounter UoW/RLS VERIFIED (81/81 PASS)
IMPLEMENTATION                  : NOT STARTED (AUDIT ONLY)
```

---

## 1. Git Baseline Verification

In strict compliance with audit governance, the working tree was verified prior to and throughout the audit:

```text
HEAD Commit:            5ea4ff33ea40cdbe4d08d0da0a28d1f9ffd5c7d2
HEAD Commit Subject:    audit(p02b): reconcile rls uow inventory evidence
Base Commit:            5ea4ff33ea40cdbe4d08d0da0a28d1f9ffd5c7d2
Active Branch:          feature/security-foundation-wave1a10
Working Tree Status:    Clean (0 uncommitted production changes)
Production Code Touch:  ZERO (0 controllers, 0 services, 0 routes, 0 migrations modified)
```

---

## 2. Separation of RLS Scopes: Database Universe vs Stage-0 Clinical Core

To prevent confusion between the complete database state and the Stage-0 backlog inventory, both scopes are explicitly separated and reconciled.

### A. Complete Database RLS Universe (PostgreSQL 16 Metadata)
*Source of Truth: PostgreSQL System Catalogs (`pg_class`, `pg_namespace`, `pg_policies`)*

- **Total Public RLS Tables:** Exactly **100 tables** in schema `public` have `relrowsecurity = true`.
- **Total Active Policies:** Exactly **100 active policies** in `pg_policies`.
- **Policy Standardization:** Under Migration `081_verify_and_consolidate_100_tables.sql`, every single RLS-enabled table in the public schema has exactly 1 standardized `tenant_isolation_*` policy enforcing:
  `(tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)`.
- **Complete List of 100 RLS Tables:**
  1. `anesthesia_records`
  2. `appointment_audit_logs`
  3. `appointments`
  4. `bed_occupancies`
  5. `bed_transfers`
  6. `billing_ledgers`
  7. `blood_bank_billing_reconciliations`
  8. `blood_bedside_dual_nurse_verifications`
  9. `blood_bedside_verifications`
  10. `blood_crossmatch_tests`
  11. `blood_donor_units`
  12. `blood_issue_records`
  13. `blood_storage_temperature_logs`
  14. `blood_transfusion_records`
  15. `bpjs_claim_disputes`
  16. `bpjs_claim_submissions`
  17. `bpjs_sep_records`
  18. `bpjs_vclaim_lifecycle_logs`
  19. `casemix_cases`
  20. `cdss_alerts`
  21. `clinical_authorization_logs`
  22. `clinical_observations`
  23. `clinical_orders`
  24. `clinical_privileges`
  25. `clinical_staff_profiles`
  26. `cppt_notes`
  27. `cssd_instrument_sets`
  28. `cssd_sterilization_cycles`
  29. `encounters`
  30. `enterprise_users`
  31. `episodes_of_care`
  32. `fhir_delivery_outbox`
  33. `hemovigilance_incident_investigations`
  34. `hospital_invoices`
  35. `icu_acuity_assessments`
  36. `inacbg_claims`
  37. `inacbg_grouping_results`
  38. `inventory_batches`
  39. `inventory_stock_movements`
  40. `laboratory_orders`
  41. `longitudinal_care_plans`
  42. `massive_transfusion_protocols`
  43. `master_beds`
  44. `master_buildings`
  45. `master_floors`
  46. `master_inacbg_tariffs`
  47. `master_patients`
  48. `master_rooms`
  49. `master_wards`
  50. `medical_device_implant_recalls`
  51. `medication_catalog`
  52. `medication_dispense_allocations`
  53. `medication_emar_administrations`
  54. `medication_orders`
  55. `on_call_schedules`
  56. `operating_room_schedules`
  57. `operating_rooms`
  58. `operating_theatres`
  59. `patient_allergies`
  60. `patient_billing_reconciliation`
  61. `patient_registrations`
  62. `patient_split_invoices`
  63. `pharmacy_controlled_substance_logs`
  64. `pharmacy_depots`
  65. `pharmacy_dispensing_orders`
  66. `pharmacy_inventory_batches`
  67. `pharmacy_warehouses`
  68. `physician_diagnostic_interpretations`
  69. `post_anesthesia_aldrete_scores`
  70. `post_op_handoffs`
  71. `prescription_dispense_records`
  72. `queue_sequences`
  73. `queue_tickets`
  74. `radiology_audit_log`
  75. `radiology_critical_finding_alerts`
  76. `radiology_instances`
  77. `radiology_orders`
  78. `radiology_reports`
  79. `radiology_series`
  80. `radiology_studies`
  81. `resuscitation_events`
  82. `safety_decision_registry`
  83. `shift_assignments`
  84. `soap_notes`
  85. `staff_credentials`
  86. `staff_rosters`
  87. `surgery_cases`
  88. `surgery_schedules`
  89. `surgical_billing_breakdown`
  90. `surgical_cases`
  91. `surgical_clinical_notes`
  92. `surgical_implants_tracking`
  93. `surgical_safety_checklists`
  94. `surgical_teams`
  95. `tenant_satusehat_credentials`
  96. `transfusion_reaction_logs`
  97. `triage_assessments`
  98. `triage_sla_timers`
  99. `universal_audit_logs`
  100. `who_surgical_safety_checklists`

### B. Stage-0 Clinical-Core RLS Inventory (Scanner Scope: 33 Tables)
*Source of Truth: Authoritative Inventory Scanner / Migration 079 + 080 + 081*

The Stage-0 scanner deliberately tracks **33 tables**:
- **10 Core Clinical Tables (Migration 079):** `encounters`, `master_patients`, `clinical_orders`, `medication_emar_administrations`, `medication_dispense_allocations`, `physician_diagnostic_interpretations`, `patient_split_invoices`, `universal_audit_logs`, `safety_decision_registry`, `longitudinal_care_plans`.
- **21 Zero-Policy / Blackout Protection Tables (Migration 079):** High-risk secondary tables requiring fail-closed isolation during Stage 0.
- **2 Triage Tables (Wave 1B.1 Addition):** `triage_assessments`, `triage_sla_timers`.

#### Subsystem Categorization of the Remaining 67 RLS Tables:
1. **Operating Theatre & Surgery (11 tables):** `surgery_cases`, `surgery_schedules`, `operating_rooms`, `operating_room_schedules`, `surgical_cases`, `surgical_clinical_notes`, `surgical_implants_tracking`, `surgical_safety_checklists`, `surgical_teams`, `post_op_handoffs`, `anesthesia_records`.
2. **Radiology & PACS (6 tables):** `radiology_orders`, `radiology_reports`, `radiology_studies`, `radiology_series`, `radiology_instances`, `radiology_audit_log`.
3. **Blood Bank & Transfusion (7 tables):** `blood_transfusion_records`, `blood_donor_units`, `blood_issue_records`, `blood_crossmatch_tests`, `blood_storage_temperature_logs`, `blood_bedside_verifications`, `transfusion_reaction_logs`.
4. **Facility & Bed Management (7 tables):** `bed_occupancies`, `bed_transfers`, `master_beds`, `master_rooms`, `master_wards`, `master_floors`, `master_buildings`.
5. **Appointments & Outpatient Queue (4 tables):** `appointments`, `appointment_audit_logs`, `queue_tickets`, `queue_sequences`.
6. **Billing, Claims & INA-CBG (4 tables):** `inacbg_claims`, `bpjs_sep_records`, `billing_ledgers`, `hospital_invoices`.
7. **Pharmacy Warehousing & Batches (9 tables):** `pharmacy_depots`, `pharmacy_warehouses`, `pharmacy_dispensing_orders`, `pharmacy_inventory_batches`, `medication_catalog`, `inventory_batches`, `inventory_stock_movements`, `prescription_dispense_records`, `medication_orders`.
8. **Clinical Documentation, Observations & Alerts (10 tables):** `laboratory_orders`, `clinical_observations`, `icu_acuity_assessments`, `resuscitation_events`, `cdss_alerts`, `patient_registrations`, `episodes_of_care`, `soap_notes`, `cppt_notes`, `patient_allergies`.
9. **Staff Privileging & Enterprise Administration (9 tables):** `enterprise_users`, `clinical_staff_profiles`, `clinical_privileges`, `staff_credentials`, `staff_rosters`, `shift_assignments`, `on_call_schedules`, `clinical_authorization_logs`, `tenant_satusehat_credentials`.

**Architectural Statement on Exclusion:**
> **Stage-0 Inventory Scope (33 tables) $\neq$ Complete Database RLS Universe (100 tables).**  
> The 67 non-Stage-0 tables have active RLS policies in PostgreSQL but were provisioned during vertical feature sprints (Migrations 009–024) and unified under Migration 081. They are intentionally partitioned into subsequent subsystem remediation waves. The Stage-0 inventory specifically isolates the default-deny emergency and clinical core.

---

## 3. Candidate A Audit: Nursing / CPPT (`clinicalNotesApplication`)

### Factual Metrics
- **Primary Service:** [`server/services/clinicalNotesApplication.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/clinicalNotesApplication.service.js)
- **Controller:** [`server/controllers/clinicalNotes.controller.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/controllers/clinicalNotes.controller.js)
- **Route File:** [`server/routes/clinicalNotes.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/clinicalNotes.routes.js) (Mount: `/api/v1/clinical-notes`)
- **HTTP Entry Points (6 Routes):**
  1. `POST /soap` — Record initial doctor/nurse SOAP note
  2. `POST /soap/:id/amend` — Add medicolegal addendum/amendment to existing SOAP note
  3. `GET /soap/encounter/:encounterId` — Fetch chronological SOAP notes for encounter
  4. `POST /cppt` — Record multidisciplinary CPPT clinical entry
  5. `PATCH /cppt/:id/verify` — DPJP (Attending Physician) review and verification stamp
  6. `GET /cppt/encounter/:encounterId` — Fetch integrated CPPT timeline for encounter
- **Service Methods (6):** `recordSoapNote`, `amendSoapNote`, `recordCpptEntry`, `verifyCpptEntry`, `getSoapNotesByEncounter`, `getCpptNotesByEncounter`.
- **Database Call Sites:**
  - **Total in Domain:** 35 call sites
  - **RLS Call Sites (Stage-0 tables):** 15
  - **Writes Outside UoW:** 4 writes (`soap_notes` INSERT, `soap_notes` amendment INSERT, `cppt_notes` INSERT, `cppt_notes` verification UPDATE)
  - **Reads Outside UoW:** 31 reads (including encounter validations and note history retrievals)
- **Tables Touched:**
  - `encounters` (RLS: YES)
  - `soap_notes` (RLS: YES)
  - `cppt_notes` (RLS: YES)
  - `universal_audit_logs` (RLS: YES)
- **Current Transaction Boundaries:**
  - Uses raw connection client from `postgresPoolService.getClient()`.
  - Executes explicit `BEGIN ISOLATION LEVEL READ COMMITTED;`, `COMMIT;`, and `ROLLBACK;` blocks.
  - Does NOT use `withUnitOfWork`; connection does not set `app.current_tenant_id` or execute `DISCARD ALL`.
- **Multi-Mutation Operations:**
  - `recordSoapNote`: Locks encounter (`FOR UPDATE`) $\rightarrow$ Inserts `soap_notes` $\rightarrow$ Inserts `universal_audit_logs`. (3 DB mutations in 1 transaction).
  - `amendSoapNote`: Locks original note (`FOR UPDATE`) $\rightarrow$ Inserts new amendment note $\rightarrow$ Inserts `universal_audit_logs`. (3 DB mutations in 1 transaction).
  - `recordCpptEntry`: Locks encounter (`FOR UPDATE`) $\rightarrow$ Inserts `cppt_notes` $\rightarrow$ Inserts `universal_audit_logs`. (3 DB mutations in 1 transaction).
  - `verifyCpptEntry`: Locks cppt (`FOR UPDATE`) $\rightarrow$ Updates `cppt_notes` with DPJP verification. (2 DB operations in 1 transaction).
- **Dependencies:**
  - *Audit Logging:* Direct SQL INSERT into `universal_audit_logs` within the same transaction.
  - *Authorization:* Role gates executed in controller (`ENTERPRISE_ROLES.DOCTOR_SPECIALIST`, `ENTERPRISE_ROLES.GENERAL_PRACTITIONER`, `ENTERPRISE_ROLES.NURSE`, etc.).
  - *Tenant Context:* Received via HTTP headers / body, but not propagated into PostgreSQL session settings.
- **Test Evidence:**
  - 1 test file: `tests/verticalSlice05SoapCpptDurability.test.js` (632 lines).
  - **Test Type:** 100% Vitest in-memory mocks (`mockDatabaseState`, `mockClient = { query: vi.fn(...) }`).
  - **Real-DB Evidence:** 0 tests running against PostgreSQL 16.
- **Likely Connection / UoW Conversion Points:**
  - Convert `getClient()` / manual `BEGIN` blocks to `withUnitOfWork({ tenantId, actorId }, async ({ query }) => ...)`.
  - Pass UoW query runner into `recordSoapNote`, `amendSoapNote`, `recordCpptEntry`, and `verifyCpptEntry`.

---

## 4. Candidate B Audit: Medication Closed-Loop (`medicationClosedLoop`)

### Factual Metrics
- **Primary Service:** [`server/services/medicationClosedLoop.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/medicationClosedLoop.service.js)
- **Controller:** [`server/controllers/medicationClosedLoop.controller.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/controllers/medicationClosedLoop.controller.js)
- **Route File:** [`server/routes/medicationClosedLoop.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/medicationClosedLoop.routes.js) (Mount: `/api/v1/medications`)
- **HTTP Entry Points (8 Routes):**
  1. `POST /prescribe` — Physician electronic prescription generation
  2. `POST /:id/pharmacist-review` — JCI MMU.4 clinical pharmacist verification
  3. `POST /:id/dispense` — Pharmacy warehouse FEFO batch allocation & stock deduction
  4. `POST /:id/administer` — Bedside 6-Rights nurse administration & eMAR recording
  5. `POST /reconciliation/admission` — Patient admission medication reconciliation
  6. `POST /reconciliation/discharge` — Patient discharge medication reconciliation
  7. `POST /administrations/:id/adverse-reaction` — Adverse drug reaction (ADR) event logging
  8. `POST /:id/cancel` — Medication order cancellation
- **Service Methods (8):** `generateMedicationOrdersFromCPOE`, `pharmacistReviewOrder`, `dispenseMedicationFEFO`, `verifyBedsideAndAdminister`, `reconcileAdmissionMedications`, `reconcileDischargeMedications`, `documentAdverseReaction`, `cancelMedicationOrder`.
- **Database Call Sites:**
  - **Total in Domain:** 80 call sites
  - **RLS Call Sites (Stage-0 tables):** 13
  - **Writes Outside UoW:** 23 writes (the highest write surface in the clinical core)
  - **Reads Outside UoW:** 57 reads
- **Tables Touched (15 tables):**
  - `medication_orders` (RLS: YES)
  - `medication_dispense_allocations` (RLS: YES)
  - `medication_emar_administrations` (RLS: YES)
  - `medication_reconciliations`
  - `clinical_orders` (RLS: YES)
  - `cpoe_order_items`
  - `encounters` (RLS: YES)
  - `patient_allergies` (RLS: YES)
  - `master_drug_class_cross_reactivities`
  - `master_medication_dose_ranges`
  - `inventory_batches` (RLS: YES)
  - `inventory_stock_movements` (RLS: YES)
  - `pharmacy_warehouses` (RLS: YES)
  - `clinical_domain_outbox` (RLS: YES)
  - `universal_audit_logs` (RLS: YES)
- **Medication Order Lifecycle & Multi-Step Mutation Sequences:**
  - `dispenseMedicationFEFO` (7 DB steps):
    Reads medication order $\rightarrow$ Queries candidate `inventory_batches` by expiry date (FEFO) $\rightarrow$ Deducts batch stock $\rightarrow$ Inserts `inventory_stock_movements` $\rightarrow$ Inserts `medication_dispense_allocations` $\rightarrow$ Updates `medication_orders` status to `DISPENSED` $\rightarrow$ Emits outbox events.
  - `verifyBedsideAndAdminister` (14 DB steps):
    Reads medication order $\rightarrow$ Reads allocations $\rightarrow$ Checks past administrations $\rightarrow$ Inserts `medication_emar_administrations` $\rightarrow$ Updates `cpoe_order_items` status to `COMPLETED` $\rightarrow$ Queries sibling order items $\rightarrow$ Updates `clinical_orders` status $\rightarrow$ Emits two outbox events.
- **Dependencies:**
  - *Inventory:* Direct deduction on `inventory_batches` and audit trail in `inventory_stock_movements`.
  - *Allergy / Safety:* Queries `patient_allergies` and cross-reactivity tables prior to dispensing.
  - *Safety Decision Registry:* Indirectly referenced for high-alert drug override documentation.
  - *Transactional Outbox:* Dual INSERTs into `clinical_domain_outbox` for event-driven asynchronous processing.
  - *Idempotency:* Critical at bedside administration to avoid lethal duplicate doses.
- **Test Evidence:**
  - 12 test files (including `verticalSlice07MedicationDurability.test.js`, `nursingEmarVerticalSlice.test.js`, `sprint4B3ClosedLoopMedicationPlatform.test.js`).
  - **Test Type:** 100% Vitest in-memory mocks.
  - **Real-DB Evidence:** 0 tests running against PostgreSQL 16.
- **Rollback Requirements:** Extreme. A failure in outbox emission or order status update must roll back inventory batch stock deductions to avoid phantom inventory loss.

---

## 5. Candidate C Audit: CPOE + Diagnostic Interpretation

Candidate C bridges order creation with diagnostic findings. Both sub-domains are analyzed separately first, followed by coupling evidence.

### Sub-Domain C1: Medical Record / CPOE (`cpoeApplication`)
- **Primary Service:** [`server/services/cpoeApplication.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/cpoeApplication.service.js)
- **Controller:** [`server/controllers/cpoe.controller.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/controllers/cpoe.controller.js)
- **Route File:** [`server/routes/orders.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/orders.routes.js) (Mount: `/api/v1/orders`)
- **HTTP Entry Points (9 Routes):**
  `POST /cpoe`, `POST /cpoe/:id/cancel`, `GET /cpoe`, `GET /cpoe/:id`, `GET /cpoe/encounter/:encounterId`, `GET /`, `POST /prescription`, `POST /lab`, `POST /radiology`.
- **Database Call Sites:**
  - Total in Service: 21 call sites
  - RLS Call Sites: 13
  - Writes Outside UoW: 3
  - Reads Outside UoW: 19
- **Tables Touched:** `encounters`, `clinical_orders`, `cpoe_order_items`, `universal_audit_logs`, `clinical_domain_outbox`.
- **Note on Transaction Management:** `createOrder` uses `transactionManager.executeTransaction`, but other methods use ad-hoc pool queries outside UoW.

### Sub-Domain C2: Diagnostic Interpretation (`diagnosticInterpretation`)
- **Primary Service:** [`server/services/diagnosticInterpretation.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/diagnosticInterpretation.service.js)
- **Controller:** [`server/controllers/diagnosticInterpretation.controller.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/controllers/diagnosticInterpretation.controller.js)
- **Route File:** [`server/routes/diagnosticInterpretation.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/diagnosticInterpretation.routes.js) (Mount: `/api/v1/diagnostics`)
- **HTTP Entry Points (4 Routes):**
  `POST /notifications`, `POST /notifications/:id/acknowledge`, `POST /notifications/:id/interpret`, `POST /interpretations/:id/actions`.
- **Database Call Sites:**
  - Total in Domain: 38 call sites
  - RLS Call Sites: 11
  - Writes Outside UoW: 9
  - Reads Outside UoW: 29
- **Tables Touched:** `encounters`, `diagnostic_result_notifications`, `physician_diagnostic_interpretations`, `diagnostic_secondary_actions`, `longitudinal_delta_checks`, `clinical_orders`, `cpoe_order_items`, `clinical_domain_outbox`.

### Combined Candidate C Totals
- **Total DB Call Sites:** 60
- **RLS Call Sites (Stage-0):** 24
- **Writes Outside UoW:** 12
- **Reads Outside UoW:** 48
- **HTTP Entry Points:** 13

### Factual Coupling & Bounded Slice Analysis
- **Shared Tables:** Both touch `clinical_orders`, `cpoe_order_items`, `encounters`, and `clinical_domain_outbox`.
- **Shared Services:** Both interface with `safetyAuthorizationService`. CPOE checks safety rules during order creation; Diagnostic Interpretation triggers secondary clinical actions that call back into order creation (`INSERT INTO clinical_orders`).
- **Transactional Decoupling:**
  - In everyday clinical practice, CPOE order placement occurs at time $T_0$, whereas diagnostic result interpretation occurs hours or days later at $T_1$.
  - There is **no synchronous database transaction** spanning order placement and diagnostic interpretation.
  - The link is purely asynchronous via foreign keys (`order_id`) and notification dispatch.
- **Factual Scope Conclusion:**
  - Candidate C can either be executed as **one unified wave** (13 routes, 24 RLS calls) OR cleanly split into **two discrete bounded slices**:
    - **Slice C1 (CPOE Core):** 9 routes, 13 RLS calls, 3 writes.
    - **Slice C2 (Diagnostic Results & Interpretation):** 4 routes, 11 RLS calls, 9 writes.

---

## 6. Candidate D Audit: Patient Financial & Billing (`patientFinancialAndRevenueCycle`)

### Factual Metrics
- **Primary Service:** [`server/services/patientFinancialAndRevenueCycle.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/patientFinancialAndRevenueCycle.service.js)
- **Controller:** [`server/controllers/patientFinancialAndRevenueCycle.controller.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/controllers/patientFinancialAndRevenueCycle.controller.js)
- **Route Files:**
  - [`server/routes/patientFinancialAndRevenueCycle.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/patientFinancialAndRevenueCycle.routes.js) (Mount: `/api/v1/patient-financial`) — 6 routes
  - [`server/routes/billing.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/billing.routes.js) (Mount: `/api/v1/billing`) — 1 route
- **HTTP Entry Points (7 Routes):**
  1. `POST /deposits` — Record patient pre-admission / surgical deposit
  2. `POST /invoices` — Generate multi-payer split invoice (BPJS vs Personal)
  3. `POST /payments` — Record cashier point-of-sale payment transaction
  4. `POST /adjustments` — Execute supervisor-approved financial adjustment/refund
  5. `POST /shifts/reconcile` — Cashier shift end-of-day balance reconciliation
  6. `POST /ar` — Accounts receivable aging ledger update
  7. `GET /ledger/:episodeId` — Retrieve patient billing ledger
- **Service Methods (6):** `recordPatientDeposit`, `generatePatientSplitInvoice`, `recordCashierPayment`, `executeFinancialAdjustmentOrRefund`, `reconcileCashierShift`, `manageAccountsReceivableAging`.
- **Database Call Sites:**
  - **Total in Domain:** 45 call sites (42 in service + 3 in billing controller/service)
  - **RLS Call Sites (Stage-0 tables):** 8 (`patient_split_invoices`)
  - **Writes Outside UoW:** 15 writes
  - **Reads Outside UoW:** 30 reads
- **Tables Touched:**
  - `patient_deposit_ledgers`
  - `patient_split_invoices` (RLS: YES)
  - `cashier_payment_transactions`
  - `financial_adjustments_and_refunds`
  - `cashier_shift_reconciliations`
  - `accounts_receivable_aging_ledgers`
  - `encounters` (RLS: YES)
  - `clinical_domain_outbox` (RLS: YES)
- **Financial Transaction Boundaries:**
  - `generatePatientSplitInvoice` checks available deposits in `patient_deposit_ledgers`, applies deposit offsets, and creates split invoice records in `patient_split_invoices` while emitting outbox events.
  - `recordCashierPayment` locks the invoice, updates paid balance, inserts payment transaction ledger, and emits outbox events.
- **Dependencies:**
  - *Ledgers:* Strictly dependent on internal double-entry financial ledger tables.
  - *Audit / Outbox:* Writes all state transitions to `clinical_domain_outbox`.
  - *Authorization:* Requires Finance / Cashier roles and supervisor elevation for refunds.
  - *Idempotency:* Very high requirement to prevent duplicate payment processing or duplicate invoice billing.
- **Test Evidence:**
  - 5 test files (`verticalSlice13PatientFinancialRevenueCycleDurability.test.js`, `billingEngine.test.js`, `casemixRevenueCycleVerticalSlice.test.js`, `s10DischargeBillingSettlementReconciliation.test.js`, `surgicalRevenueCycleInaCbg.test.js`).
  - **Test Type:** 100% Vitest in-memory mocks.
  - **Real-DB Evidence:** 0 tests running against PostgreSQL 16.

---

## 7. Transaction Boundary Map

The following table delineates the exact transaction characteristics of representative business operations across all four candidates:

| Business Operation | Candidate | Total DB Calls | Reads | Writes | RLS Tables Touched | Current Transaction State | Audit Mechanism | Authorization Gate | Idempotency Requirement | Transaction Pattern | Atomic Rollback Required |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `recordSoapNote` | A | 5 | 1 | 2 | `encounters`, `soap_notes`, `universal_audit_logs` | Raw Client `BEGIN`/`COMMIT` | Direct `universal_audit_logs` INSERT | Role check (Doctor, GP) | None | Read $\rightarrow$ Validate $\rightarrow$ Write $\rightarrow$ Audit | **YES** |
| `amendSoapNote` | A | 5 | 1 | 2 | `soap_notes`, `universal_audit_logs` | Raw Client `BEGIN`/`COMMIT` | Direct `universal_audit_logs` INSERT | Role check (Author only) | None | Read $\rightarrow$ Validate $\rightarrow$ Write $\rightarrow$ Audit | **YES** |
| `recordCpptEntry` | A | 5 | 1 | 2 | `encounters`, `cppt_notes`, `universal_audit_logs` | Raw Client `BEGIN`/`COMMIT` | Direct `universal_audit_logs` INSERT | Role check (Multidisciplinary) | None | Read $\rightarrow$ Validate $\rightarrow$ Write $\rightarrow$ Audit | **YES** |
| `verifyCpptEntry` | A | 4 | 1 | 1 | `cppt_notes` | Raw Client `BEGIN`/`COMMIT` | Embedded in note update | DPJP Verification check | None | Read $\rightarrow$ Validate $\rightarrow$ Write | **YES** |
| `getSoapNotesByEncounter` | A | 1 | 1 | 0 | `soap_notes` | Raw `pool.query` (None) | None | Authenticated user | N/A (Read-only) | Read-only | **NO** |
| `getCpptNotesByEncounter` | A | 1 | 1 | 0 | `cppt_notes` | Raw `pool.query` (None) | None | Authenticated user | N/A (Read-only) | Read-only | **NO** |
| `generateMedicationOrdersFromCPOE` | B | 8 | 2 | 4 | `clinical_orders`, `cpoe_order_items`, `medication_orders` | Raw Client `BEGIN`/`COMMIT` | `clinical_domain_outbox` | Doctor role | Idempotency key check | Read $\rightarrow$ Validate $\rightarrow$ Multi-Write $\rightarrow$ Outbox | **YES** |
| `pharmacistReviewOrder` | B | 5 | 1 | 2 | `medication_orders` | Raw Client `BEGIN`/`COMMIT` | `clinical_domain_outbox` | Pharmacist role (MMU.4) | None | Read $\rightarrow$ Validate $\rightarrow$ Write $\rightarrow$ Outbox | **YES** |
| `dispenseMedicationFEFO` | B | 7 | 2 | 3 | `medication_orders`, `medication_dispense_allocations`, `inventory_batches`, `inventory_stock_movements` | Raw Client `BEGIN`/`COMMIT` | Stock ledger + Outbox | Pharmacy staff | Allocation token | Read $\rightarrow$ Validate $\rightarrow$ Inventory Mutation $\rightarrow$ Multi-Write | **YES** |
| `verifyBedsideAndAdminister` | B | 14 | 4 | 6 | `medication_orders`, `medication_dispense_allocations`, `medication_emar_administrations`, `clinical_orders`, `cpoe_order_items` | Raw Client `BEGIN`/`COMMIT` | eMAR record + Outbox | Nurse + Dual-signoff | High (Double-dose prevention) | Read $\rightarrow$ Validate $\rightarrow$ Multi-Write $\rightarrow$ Order Update $\rightarrow$ Outbox | **YES** |
| `cancelMedicationOrder` | B | 6 | 1 | 2 | `medication_orders` | Raw Client `BEGIN`/`COMMIT` | `clinical_domain_outbox` | Prescriber / Pharmacist | None | Read $\rightarrow$ Validate $\rightarrow$ Write $\rightarrow$ Outbox | **YES** |
| `createOrder` (CPOE) | C | 7 | 3 | 2 | `encounters`, `clinical_orders`, `cpoe_order_items` | `transactionManager.executeTransaction` | Outbox dispatch | `safetyAuthorizationService` | `idempotency_key` on order | Read $\rightarrow$ Validate $\rightarrow$ Safety Decision $\rightarrow$ Multi-Write | **YES** |
| `cancelOrder` (CPOE) | C | 8 | 1 | 4 | `clinical_orders`, `cpoe_order_items`, `universal_audit_logs` | Raw Client `BEGIN`/`COMMIT` | Audit log + Outbox | Prescribing Doctor | None | Read $\rightarrow$ Validate $\rightarrow$ Multi-Write $\rightarrow$ Audit | **YES** |
| `publishDiagnosticNotification` | C | 6 | 1 | 2 | `encounters`, `diagnostic_result_notifications` | Raw Client `BEGIN`/`COMMIT` | Outbox event | Diagnostic technician | None | Read $\rightarrow$ Validate $\rightarrow$ Write $\rightarrow$ Outbox | **YES** |
| `recordPhysicianInterpretation` | C | 9 | 1 | 4 | `physician_diagnostic_interpretations`, `diagnostic_result_notifications` | Raw Client `BEGIN`/`COMMIT` | Outbox event | Doctor Specialist | None | Read $\rightarrow$ Validate $\rightarrow$ Multi-Write $\rightarrow$ Delta Check $\rightarrow$ Outbox | **YES** |
| `executeSecondaryClinicalAction` | C | 9 | 1 | 4 | `clinical_orders`, `cpoe_order_items`, `diagnostic_result_notifications` | Raw Client `BEGIN`/`COMMIT` | Outbox event | Attending Physician | Action token | Read $\rightarrow$ Validate $\rightarrow$ Order Write $\rightarrow$ Outbox | **YES** |
| `recordPatientDeposit` | D | 5 | 0 | 2 | `patient_deposit_ledgers` | Raw Client `BEGIN`/`COMMIT` | Outbox event | Cashier role | Receipt reference | Write $\rightarrow$ Financial Ledger $\rightarrow$ Outbox | **YES** |
| `generatePatientSplitInvoice` | D | 7 | 1 | 3 | `patient_deposit_ledgers`, `patient_split_invoices` | Raw Client `BEGIN`/`COMMIT` | Outbox event | Billing Officer | Invoice number | Read $\rightarrow$ Validate $\rightarrow$ Financial Mutation $\rightarrow$ Outbox | **YES** |
| `recordCashierPayment` | D | 7 | 1 | 3 | `patient_split_invoices`, `cashier_payment_transactions` | Raw Client `BEGIN`/`COMMIT` | Outbox event | Cashier role | Payment reference | Read $\rightarrow$ Validate $\rightarrow$ Financial Mutation $\rightarrow$ Outbox | **YES** |
| `executeFinancialAdjustmentOrRefund` | D | 7 | 1 | 3 | `patient_split_invoices`, `financial_adjustments_and_refunds` | Raw Client `BEGIN`/`COMMIT` | Outbox event | Finance Supervisor | Approval token | Read $\rightarrow$ Validate $\rightarrow$ Financial Mutation $\rightarrow$ Outbox | **YES** |

---

## 8. Shared Service Dependency Graph

The following graph maps services and databases across candidates, explicitly tagging shared cross-candidate dependencies versus candidate-local components:

```text
Candidate A (Nursing / CPPT)
  ↓
  clinicalNotesApplication.service.js
  ├── [SHARED] postgresPoolService (encounters, soap_notes, cppt_notes)
  └── [SHARED] universal_audit_logs (Universal Audit Trail)

Candidate B (Medication Closed-Loop)
  ↓
  medicationClosedLoop.service.js
  ├── [SHARED] postgresPoolService (encounters, clinical_orders, medication_orders)
  ├── [SHARED] safetyAuthorization.service.js (patient_allergies, cross_reactivity)
  ├── [SHARED] clinical_domain_outbox (Transactional Outbox Worker)
  ├── [SHARED] universal_audit_logs (Universal Audit Trail)
  └── [LOCAL TO PHARMACY] enterpriseInventory (inventory_batches, inventory_stock_movements)

Candidate C (CPOE & Diagnostic Interpretation)
  ↓
  cpoeApplication.service.js & diagnosticInterpretation.service.js
  ├── [SHARED] transactionManager (clinical_orders, cpoe_order_items)
  ├── [SHARED] safetyAuthorization.service.js (safety_decision_registry)
  ├── [SHARED] clinical_domain_outbox (Transactional Outbox Worker)
  ├── [SHARED] universal_audit_logs (Universal Audit Trail)
  └── [LOCAL TO DIAGNOSTICS] diagnostic_result_notifications & physician_diagnostic_interpretations

Candidate D (Patient Financial & Revenue Cycle)
  ↓
  patientFinancialAndRevenueCycle.service.js
  ├── [SHARED] postgresPoolService (encounters, patient_split_invoices)
  ├── [SHARED] careCoordinationAndTimeline.service.js (longitudinal timeline events)
  ├── [SHARED] clinical_domain_outbox (Transactional Outbox Worker)
  └── [LOCAL TO BILLING] patient_deposit_ledgers & cashier_payment_transactions
```

---

## 9. Clinical & Business Blast Radius

Each classification is backed by factual observations without assigning evaluative scores:

| Candidate | Dimension | Rating | Factual Rationale |
|---|---|---|---|
| **Candidate A** | Clinical Impact | **HIGH** | Serves as the official primary clinical documentation, doctor SOAP progress notes, and nurse CPPT handover communications. |
| | Financial Impact | **MEDIUM** | Directly supports diagnostic coding, medical justification, and health insurance claims; missing notes delay billing. |
| | Patient-Safety Dependency | **DIRECT** | Essential for interprofessional clinical continuity, critical care handover, and treatment progression. |
| | Cross-Domain Coupling | **LOW** | Self-contained clinical documentation footprint; touches encounters and notes tables with zero external service imports. |
| | Transaction Complexity | **LOW** | Single-note insertions and amendments paired with atomic audit log inserts. |
| | Rollback Complexity | **LOW** | Clean single-operation rollbacks; no inventory or asynchronous outbox event coordination. |
| **Candidate B** | Clinical Impact | **HIGH** | Directly dispenses and administers active pharmacotherapies to hospitalized patients. |
| | Financial Impact | **HIGH** | Directly manages physical pharmacy stock assets, high-cost pharmaceuticals, and dispensing billing allocations. |
| | Patient-Safety Dependency | **DIRECT** | Governed by JCI MMU.4 and IPSG.3; guards against lethal drug-drug interactions, severe allergies, and dosing errors. |
| | Cross-Domain Coupling | **HIGH** | Tightly binds CPOE orders, pharmacy inventory batches, eMAR nursing administrations, and safety decisions. |
| | Transaction Complexity | **HIGH** | Multi-step mutations combining FEFO inventory batch deductions, stock ledger journals, eMAR logging, and outbox dispatches. |
| | Rollback Complexity | **HIGH** | Requires coordinated rollbacks across inventory batches, clinical order items, and transactional outboxes to prevent ghost stock. |
| **Candidate C** | Clinical Impact | **HIGH** | Core electronic order entry (CPOE) and physician interpretation of critical laboratory and radiological diagnostic results. |
| | Financial Impact | **MEDIUM** | Diagnostic orders directly trigger billable clinical service tariffs and items. |
| | Patient-Safety Dependency | **DIRECT** | Early detection of critical diagnostic findings (e.g. panic lab values, acute radiological emergencies) prevents diagnostic delays. |
| | Cross-Domain Coupling | **MEDIUM** | Couplings exist between CPOE and downstream diagnostics, as well as shared safety decision validation. |
| | Transaction Complexity | **MEDIUM** | Order placements with multiple line items and outbox events; interpretation sign-off with delta checks. |
| | Rollback Complexity | **MEDIUM** | Multi-row order cancellations and notification state rollbacks. |
| **Candidate D** | Clinical Impact | **LOW** | Operates primarily in post-clinical administrative and financial settlement workflows. |
| | Financial Impact | **HIGH** | Direct responsibility for hospital revenue cycle, cash deposits, split invoicing, payment receipts, and AR aging ledgers. |
| | Patient-Safety Dependency | **NONE** | Financial ledger entries have no direct influence over acute patient physiological safety. |
| | Cross-Domain Coupling | **LOW** | Decoupled from clinical execution; touches encounters for episode context and care coordination for timeline entries. |
| | Transaction Complexity | **MEDIUM** | Multi-payer split invoicing, deposit drawdown balance validation, and cashier shift balance reconciliation. |
| | Rollback Complexity | **MEDIUM** | Strict double-entry accounting rollback required to prevent financial imbalances. |

---

## 10. Test Readiness: Mock vs Real-DB Evidence

An audit of the test suite reveals a substantial evidence gap across all four candidates:

| Candidate | Existing Unit / Integration Test Files | Mock Coverage | Real PostgreSQL 16 Evidence | RLS Multi-Tenant Evidence | Missing Test Categories |
|---|---|---|---|---|---|
| **Candidate A** | 1 file (`verticalSlice05SoapCpptDurability.test.js`) | 100% Mock (`vi.fn()`) | **0 tests** | **0 tests** | Real-DB RLS isolation, Cross-tenant note access denial, GUC leakage on connection reuse, Atomic rollback test |
| **Candidate B** | 12 files (`verticalSlice07MedicationDurability.test.js`, `nursingEmarVerticalSlice.test.js`, etc.) | 100% Mock (`vi.fn()`) | **0 tests** | **0 tests** | Real-DB FEFO stock batch concurrency, Real RLS cross-tenant medication read/write, Multi-step atomic rollback with real DB |
| **Candidate C** | 3 files (`verticalSlice06AUniversalCpoeDurability.test.js`, `verticalSlice09DiagnosticInterpretationDurability.test.js`, `cpoeCdssEndToEndIntegration.test.js`) | 100% Mock (`vi.fn()`) | **0 tests** | **0 tests** | Real-DB CPOE order creation under RLS, Cross-tenant diagnostic notification leak prevention, Atomic rollback of secondary clinical actions |
| **Candidate D** | 5 files (`verticalSlice13PatientFinancialRevenueCycleDurability.test.js`, `billingEngine.test.js`, etc.) | 100% Mock (`vi.fn()`) | **0 tests** | **0 tests** | Real-DB split invoice RLS isolation, Real-DB cashier payment rollback on ledger constraint violation, AR aging cross-tenant leakage |

**Key Evidence Finding:**
> Outside of the ratified Encounter and Triage pilot (which has 10/10 passing real PostgreSQL 16 integration tests in `tests/p02b_wave1b1_real_rls_integration.test.js`), **NONE of the four candidates currently possess any real PostgreSQL or RLS test evidence**. All existing durability suites run against in-memory JavaScript arrays.

---

## 11. Real-DB Testability Requirements per Candidate

To achieve the same `REAL_DB_VERIFIED` standard established by Wave 1B.1, any candidate selected for Wave 1B.2 must satisfy the following minimum test matrix against `nurseflow_security_lab`:

1. **E1. Tenant Read Isolation:** Tenant A authenticated actor cannot read records belonging to Tenant B (returns 0 rows / null).
2. **E2. Tenant Write Isolation:** Tenant A authenticated actor attempting direct SQL or API write to Tenant B entities is blocked by PostgreSQL RLS (error `42501` or application fail-closed `404/403`).
3. **E3. Atomic Multi-Row Commit:** Multi-table mutation sequences commit atomically, verified by re-querying the database under proper tenant context.
4. **E4. Clean Atomic Rollback:** Injected constraint violation or mid-transaction exception results in zero partial state left in any affected table.
5. **E5. Connection Pool GUC Sanitization:** Consecutive requests executed on the same physical PostgreSQL connection do not leak `app.current_tenant_id` (`SET LOCAL` + `DISCARD ALL` contract).
6. **E6. Domain-Specific Concurrency Integrity:**
   - *Candidate A:* Optimistic locking on note amendments.
   - *Candidate B:* Pessimistic `FOR UPDATE` locking on inventory batches during FEFO allocation to prevent stock overselling.
   - *Candidate C:* Idempotency key lock on CPOE order submission.
   - *Candidate D:* Pessimistic lock on patient deposit ledger to prevent double drawdown.

---

## 12. Cross-Candidate Dependencies

| Dependency Domain | Candidate A | Candidate B | Candidate C | Candidate D | Shared Across Candidates? |
|---|---|---|---|---|---|
| **`encounters` (Core Clinical Encounter)** | **YES** | **YES** | **YES** | **YES** | **YES** (Universal foundation) |
| **`universal_audit_logs` (Audit Trail)** | **YES** | **YES** | **YES** | **YES** | **YES** (Universal audit requirement) |
| **`clinical_domain_outbox` (Outbox Dispatch)** | **NO** | **YES** | **YES** | **YES** | **YES** (Standard asynchronous event dispatch) |
| **`clinical_orders` (CPOE Orders)** | **NO** | **YES** | **YES** | **NO** | **PARTIAL** (Candidate B updates medication order status; Candidate C creates and interprets orders) |
| **`inventory_batches` (Stock Ledgers)** | **NO** | **YES** | **NO** | **NO** | **NO** (Local to Pharmacy and Enterprise Inventory) |
| **`safety_decision_registry` (Safety Engine)** | **NO** | **YES** | **YES** | **NO** | **PARTIAL** (Candidate B logs allergy overrides; Candidate C validates order safety) |
| **`patient_deposit_ledgers` (Financial Ledgers)**| **NO** | **NO** | **NO** | **YES** | **NO** (Local to Patient Financial & Billing) |
| **`diagnostic_result_notifications`** | **NO** | **NO** | **YES** | **NO** | **NO** (Local to Diagnostic Interpretation) |

---

## 13. Candidate Fact Sheets

### CANDIDATE A
- **Domain:** Nursing / CPPT (`clinicalNotesApplication`)
- **RLS calls:** 15
- **Writes:** 4 outside UoW
- **Reads:** 31 outside UoW
- **Entry points:** 6 HTTP routes
- **Tables:** `encounters`, `soap_notes`, `cppt_notes`, `universal_audit_logs`
- **Services:** `clinicalNotesApplication.service.js`
- **Shared services:** `postgresPoolService`, `universal_audit_logs`
- **Transaction complexity:** LOW
- **Cross-domain coupling:** LOW
- **Clinical impact:** HIGH
- **Financial impact:** MEDIUM
- **Patient-safety dependency:** DIRECT
- **Existing test coverage:** 1 test file (100% Mock)
- **Real-DB coverage:** 0% (Zero real PostgreSQL tests)
- **Major evidence gaps:** Absence of real-DB multi-tenant RLS tests for `soap_notes` and `cppt_notes`.
- **Potential implementation boundaries:** Self-contained within `clinicalNotes.routes.js`, `clinicalNotes.controller.js`, and `clinicalNotesApplication.service.js`.

### CANDIDATE B
- **Domain:** Medication Closed-Loop (`medicationClosedLoop`)
- **RLS calls:** 13
- **Writes:** 23 outside UoW
- **Reads:** 57 outside UoW
- **Entry points:** 8 HTTP routes
- **Tables:** `medication_orders`, `medication_dispense_allocations`, `medication_emar_administrations`, `medication_reconciliations`, `clinical_orders`, `cpoe_order_items`, `encounters`, `patient_allergies`, `master_drug_class_cross_reactivities`, `master_medication_dose_ranges`, `inventory_batches`, `inventory_stock_movements`, `pharmacy_warehouses`, `clinical_domain_outbox`, `universal_audit_logs`
- **Services:** `medicationClosedLoop.service.js`
- **Shared services:** `safetyAuthorization.service.js`, `enterpriseInventory`, `clinical_domain_outbox`
- **Transaction complexity:** HIGH
- **Cross-domain coupling:** HIGH
- **Clinical impact:** HIGH
- **Financial impact:** HIGH
- **Patient-safety dependency:** DIRECT
- **Existing test coverage:** 12 test files (100% Mock)
- **Real-DB coverage:** 0% (Zero real PostgreSQL tests)
- **Major evidence gaps:** Absence of real-DB inventory batch allocation and eMAR administration RLS tests.
- **Potential implementation boundaries:** Encompasses pharmacy dispensing, warehouse stock deduction, bedside administration, and outbox emission.

### CANDIDATE C
- **Domain:** Medical Record / CPOE + Diagnostic Interpretation (`cpoeApplication` + `diagnosticInterpretation`)
- **RLS calls:** 24 (13 in CPOE, 11 in Diagnostics)
- **Writes:** 12 outside UoW (3 in CPOE, 9 in Diagnostics)
- **Reads:** 48 outside UoW (19 in CPOE, 29 in Diagnostics)
- **Entry points:** 13 HTTP routes (9 in CPOE, 4 in Diagnostics)
- **Tables:** `clinical_orders`, `cpoe_order_items`, `encounters`, `diagnostic_result_notifications`, `physician_diagnostic_interpretations`, `diagnostic_secondary_actions`, `longitudinal_delta_checks`, `safety_decision_registry`, `clinical_domain_outbox`, `universal_audit_logs`
- **Services:** `cpoeApplication.service.js`, `diagnosticInterpretation.service.js`
- **Shared services:** `safetyAuthorization.service.js`, `transactionManager`, `clinical_domain_outbox`
- **Transaction complexity:** MEDIUM
- **Cross-domain coupling:** MEDIUM
- **Clinical impact:** HIGH
- **Financial impact:** MEDIUM
- **Patient-safety dependency:** DIRECT
- **Existing test coverage:** 3 test files (100% Mock)
- **Real-DB coverage:** 0% (Zero real PostgreSQL tests)
- **Major evidence gaps:** Absence of real-DB order placement and diagnostic notification RLS tests.
- **Potential implementation boundaries:** Can be implemented as a combined 13-route wave or partitioned into discrete slices: C1 (CPOE) and C2 (Diagnostics).

### CANDIDATE D
- **Domain:** Patient Financial & Revenue Cycle (`patientFinancialAndRevenueCycle`)
- **RLS calls:** 8
- **Writes:** 15 outside UoW
- **Reads:** 30 outside UoW (27 in service + 3 in billing)
- **Entry points:** 7 HTTP routes (6 in financial, 1 in billing)
- **Tables:** `patient_deposit_ledgers`, `patient_split_invoices`, `cashier_payment_transactions`, `financial_adjustments_and_refunds`, `cashier_shift_reconciliations`, `accounts_receivable_aging_ledgers`, `encounters`, `clinical_domain_outbox`
- **Services:** `patientFinancialAndRevenueCycle.service.js`
- **Shared services:** `careCoordinationAndTimeline.service.js`, `clinical_domain_outbox`
- **Transaction complexity:** MEDIUM
- **Cross-domain coupling:** LOW
- **Clinical impact:** LOW
- **Financial impact:** HIGH
- **Patient-safety dependency:** NONE
- **Existing test coverage:** 5 test files (100% Mock)
- **Real-DB coverage:** 0% (Zero real PostgreSQL tests)
- **Major evidence gaps:** Absence of real-DB split invoice and deposit ledger RLS tests.
- **Potential implementation boundaries:** Encompasses patient deposits, split invoices, cashier payments, financial adjustments, and AR aging ledgers.

---

## 14. Non-Ranking Factual Observations

In accordance with Section 14 of the audit mandate, **no evaluative rankings, scores, or recommendations are generated**. The following factual observations are noted:

1. **Write Footprint Observation:**
   Candidate B contains **23 write call sites outside UoW**, representing the largest database write surface among the candidates. Candidate A contains **4 writes outside UoW**, representing the smallest write surface.
2. **Coupling Observation:**
   Candidate B requires coordination across multiple distinct functional domains: prescribing (CPOE), pharmaceutical stock management (`inventory_batches`), and nursing administration (`medication_emar_administrations`). Candidates A and D operate within relatively bounded domain files.
3. **Partitionability Observation:**
   Candidate C comprises two distinct functional areas (CPOE and Diagnostic Interpretation) that are currently linked through shared tables (`clinical_orders`), but operate at different stages of the patient care timeline.
4. **Safety Criticality Observation:**
   Candidates A, B, and C have a **DIRECT** patient-safety dependency, as they document or execute acute bedside patient care interventions. Candidate D operates in financial settlement with **NONE** directly impacting physiological patient safety.
5. **Real-DB Evidence Observation:**
   Across all four candidates, existing test suites rely **100% on Vitest in-memory mocks**. None of the candidate domains possess live PostgreSQL 16 or RLS verification tests in the repository.

---

## 15. Neutral Decision Matrix

The following decision-support matrix compares all four candidates strictly across objective technical dimensions, without ranking or scoring:

| Technical Dimension | Candidate A (Nursing / CPPT) | Candidate B (Medication Closed-Loop) | Candidate C (CPOE + Diagnostics) | Candidate D (Patient Financial) |
|---|---|---|---|---|
| **RLS Call Sites (Stage-0)** | 15 | 13 | 24 (13 CPOE + 11 Diag) | 8 |
| **Writes Outside UoW** | 4 | 23 | 12 (3 CPOE + 9 Diag) | 15 |
| **Reads Outside UoW** | 31 | 57 | 48 (19 CPOE + 29 Diag) | 30 |
| **HTTP Entry Points** | 6 | 8 | 13 (9 CPOE + 4 Diag) | 7 (6 financial + 1 billing) |
| **Tables Touched** | 4 | 15 | 10 | 8 |
| **Shared Services** | Encounters, Universal Audit | Inventory, Safety Auth, Outbox, CPOE Orders, Encounters | Safety Auth, Transaction Manager, Outbox, Universal Audit, Encounters | Care Coordination, Outbox, Encounters |
| **Transaction Complexity** | LOW (Single note insert + audit) | HIGH (Multi-step order + FEFO inventory + eMAR + outbox) | MEDIUM (Order + items + outbox / Interpretation + delta checks) | MEDIUM (Split invoice + deposit balance + shift reconciliation) |
| **Cross-Domain Coupling** | LOW (Self-contained clinical notes) | HIGH (Binds Pharmacy, Inventory, Nursing eMAR, and CPOE) | MEDIUM (Binds CPOE with Lab/Radiology notification lifecycle) | LOW (Administrative finance; decoupled from clinical mutations) |
| **Clinical Impact** | HIGH (Core clinical documentation & handover) | HIGH (Active drug delivery to patients) | HIGH (Diagnostic order entry and findings interpretation) | LOW (Financial settlement post-care) |
| **Financial Impact** | MEDIUM (Supports coding & claims) | HIGH (Medication stock cost and billing lines) | MEDIUM (Diagnostic tariff line items) | HIGH (Hospital revenue, cashier cash, AR aging) |
| **Patient-Safety Dependency** | DIRECT (Clinical notes & allergy/condition awareness) | DIRECT (Bedside 6-rights, high-alert drug verification) | DIRECT (Critical diagnostic findings & follow-up actions) | NONE (Post-clinical financial transactions) |
| **Existing Unit Tests** | 1 test file (100% Mock) | 12 test files (100% Mock) | 3 test files (100% Mock) | 5 test files (100% Mock) |
| **Real-DB Evidence** | 0 tests (NO Real-DB Evidence) | 0 tests (NO Real-DB Evidence) | 0 tests (NO Real-DB Evidence) | 0 tests (NO Real-DB Evidence) |
| **Missing Evidence** | Real PostgreSQL 16 RLS tests for `soap_notes` & `cppt_notes` | Real PostgreSQL 16 RLS tests for `medication_orders` & eMAR with batch stock | Real PostgreSQL 16 RLS tests for `clinical_orders` & interpretations | Real PostgreSQL 16 RLS tests for `patient_split_invoices` & deposit ledger |
| **Rollback Requirements** | Atomic rollback of note insert if audit log fails | Atomic rollback of inventory batch deduction, order status, and eMAR record | Atomic rollback of order and order items or diagnostic interpretation and notifications | Atomic rollback of split invoice and deposit ledger balance adjustments |
| **Concurrency Requirements** | Optimistic concurrency on note amendment | Strict pessimistic lock (`FOR UPDATE`) on inventory batches to prevent stock overselling | Idempotency lock on order placement to prevent double submission | Pessimistic lock on patient deposit ledger to prevent double drawdown |

---

## 16. Verification & Regression Results

The 6 canonical regression test suites covering the ratified Triage and Encounter pilot were executed:

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

## 17. Final Architectural Status

```text
========================================================================================
APPLICATION SECURITY FOUNDATION : PARTIAL
STAGE 0                         : NO-GO
PRODUCTION                      : BLOCKED
CURRENT PILOT                   : Encounter + Triage UoW/RLS = VERIFIED
GLOBAL RLS/UOW REMEDIATION      : NOT COMPLETE
NEXT WAVE                       : HOLD — PENDING HUMAN SELECTION
IMPLEMENTATION                  : NOT STARTED
========================================================================================
```
