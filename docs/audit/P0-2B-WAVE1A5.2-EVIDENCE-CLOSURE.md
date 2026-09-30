# P0-2B WAVE 1A.5.2 — EVIDENCE CLOSURE AUDIT REPORT
**NurseFlow Enterprise HIS 2026 — Forensic Security Boundary Verification**  
**Role:** Principal Security Architect + PostgreSQL Security Engineer + AppSec Auditor + HIS Reliability Engineer  
**Status Gate:** `EVIDENCE CLOSURE: COMPLETE` | `PRODUCTION CHANGES: FALSE` | `WAVE 1B: HOLD`

---

## 1. EXECUTIVE SUMMARY & EVIDENCE CLOSURE GATE

This document establishes the definitive forensic closure for all security findings, catalog discrepancies, and architectural ambiguities raised during Phase P0-2B (Waves 1A.4, 1A.5, and 1A.5.1).

Every finding has been independently verified against the actual repository codebase, AST references, and live PostgreSQL 16 system catalogs (`pg_class`, `pg_policy`, `pg_roles`, `pg_proc`, `information_schema.role_table_grants`) using strictly read-only audit procedures with zero database mutations.

```text
================================================================================
P0-2B WAVE 1A.5.2 EVIDENCE CLOSURE VERDICT
EVIDENCE CLOSURE:              COMPLETE
CURRENT SECURITY FOUNDATION:   NOT_READY
PRODUCTION CHANGES:            FALSE
WAVE 1B:                       HOLD
================================================================================
```

---

## 2. WORKSTREAM A — EVIDENCE CLOSURE MATRIX

### FINDING-1A51-01: Raw Client Query Bypass of Central DB Wrapper
- **Actual File(s) & Line(s):** 27 service files in `server/services/*.service.js` (e.g., [`medicationClosedLoop.service.js:93`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/medicationClosedLoop.service.js#L93), [`radiologyApplication.service.js:82`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/radiologyApplication.service.js#L82), [`perioperativeClosedLoop.service.js:73`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/perioperativeClosedLoop.service.js#L73)).
- **Complete Request Path:** HTTP Request -> Express Route -> Controller -> Service Method -> `const client = await pool.connect()` -> `await client.query('BEGIN')` -> Raw `client.query(...)` -> `await client.query('COMMIT')` -> `client.release()`.
- **Database Abstraction:** Direct `pg.Pool.connect()` leasing unmanaged `pg.Client` instances.
- **Actor Identity & Tenant Context:** Context exists solely on `req.tenantId` in Node.js memory. **Zero context is passed to the leased client.** No `SET LOCAL app.current_tenant_id` is executed.
- **Enforcement Running Today:** None at DB layer; connection executes as superuser `postgres`.
- **Supporting Evidence:** AST search confirmed **645 occurrences of `client.query`** across 27 services and **36 manual `BEGIN` statements**. `postgresPoolService.query` is called 0 times in `medicationClosedLoop`, `perioperativeClosedLoop`, and `patientFinancialAndRevenueCycle`.
- **Counter-Evidence:** Wave 1A.5 claimed 98.5% of DB access could be transparently wrapped by intercepting `postgresPoolService.query`. This claim is **REFUTED**.
- **Status:** **`PROVEN`**.
- **Impact & Bounds:** Wrapping `postgresPoolService.query` with `AsyncLocalStorage` covers 0% of mutating transactions. All 27 service files require explicit refactoring to use a scoped Unit of Work.

---

### FINDING-1A51-02: Cross-Tenant Outbox Discovery Block Under Fail-Closed RLS
- **Actual File(s) & Line(s):** [`database/migrations/035_satusehat_integration_core.sql:48`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/database/migrations/035_satusehat_integration_core.sql#L48). Table: `fhir_delivery_outbox`.
- **Active RLS Policy:**
  ```sql
  CREATE POLICY fhir_delivery_outbox_isolation_policy ON fhir_delivery_outbox
      FOR ALL
      USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);
  ```
- **Discovery Query Tested:**
  ```sql
  SELECT tenant_id FROM fhir_delivery_outbox WHERE delivery_status = 'PENDING';
  ```
- **Actor Identity & Execution Role:** Executed under `nurseflow_app_user` with zero tenant context.
- **Empirical Result:** **0 rows returned** (while 5 pending rows exist when viewed as superuser `postgres`).
- **Logical Defect:** Under non-superuser execution with fail-closed RLS, a cross-tenant background worker cannot discover which tenants have pending outbox events without already knowing which tenant context to set.
- **Counter-Evidence:** In-memory array simulation in `outboxWorker.service.js` masks this bug in dev mode.
- **Status:** **`PROVEN`**.
- **Impact & Bounds:** Background worker Model B cannot operate without a non-RLS discovery mechanism or a `SECURITY DEFINER` discovery procedure.

---

### FINDING-1A51-03: Proven Fail-Open Policies on 5 Core Clinical Tables
- **Actual File(s) & Line(s):** [`database/migrations/032_multi_tenant_core_schema.sql:120-175`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/database/migrations/032_multi_tenant_core_schema.sql#L120-L175).
- **Affected Tables:** `master_patients`, `encounters`, `clinical_orders`, `safety_decision_registry`, `universal_audit_logs`.
- **Physical Policy Expression in pg_catalog:**
  ```sql
  ((current_setting('app.current_tenant_id'::text, true) IS NULL) 
   OR (current_setting('app.current_tenant_id'::text, true) = ''::text) 
   OR (tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid))
  ```
- **Empirical Execution Results under `SET ROLE nurseflow_app_user` without Tenant Context:**
  - `SELECT count(*) FROM master_patients;` -> Returned **5,160 rows** (FAIL-OPEN).
  - `INSERT INTO master_patients (...)` -> **ALLOWED** (FAIL-OPEN).
  - `SELECT count(*) FROM encounters;` -> Returned **5,102 rows** (FAIL-OPEN).
  - `INSERT INTO encounters (...)` -> **ALLOWED** (FAIL-OPEN).
  - `SELECT count(*) FROM clinical_orders;` -> Returned **2,416 rows** (FAIL-OPEN).
  - `INSERT INTO clinical_orders (...)` -> **ALLOWED** (FAIL-OPEN).
  - `safety_decision_registry`: Policy condition `OR current_app_tenant_id() IS NULL` evaluates to `TRUE`.
  - `universal_audit_logs`: Returned **677 rows**; blind `INSERT` without context succeeded.
- **Status:** **`PROVEN`**.
- **Impact & Bounds:** Today, any query executed without setting `app.current_tenant_id` leaks all patients, encounters, orders, and audit logs.

---

### FINDING-1A51-04: Runtime Role `nurseflow_app_user` Incapacity & Over-Privilege
- **Catalog Source:** `pg_roles`, `information_schema.role_table_grants`.
- **Attributes in Catalog:**
  - `rolsuper`: `false`
  - `rolbypassrls`: `false`
  - `rolcanlogin`: **`false`** (Cannot connect; connection strings using this role fail immediately).
- **Table Privileges:**
  - `SELECT, INSERT, UPDATE, DELETE`: Granted on 212 tables.
  - `TRUNCATE, REFERENCES, TRIGGER`: Granted on **212 tables**.
- **Public Schema Create:** `has_schema_privilege('nurseflow_app_user', 'public', 'CREATE')` is `false`.
- **Default ACLs:** `pg_default_acl` contains **0 entries**. Newly created tables inherit zero grants for this role.
- **Status:** **`PROVEN`**.
- **Impact & Bounds:** The role cannot be activated in production without granting `LOGIN`, revoking `TRUNCATE/REFERENCES/TRIGGER`, and configuring `ALTER DEFAULT PRIVILEGES`.

---

### FINDING-1A51-05: Zero Mount of `requireClinicalAuthorization` Across Tier-1 Routes
- **Actual File(s) & Line(s):** All 27 router files in `server/routes/*.routes.js`.
- **Audit Metric:** Out of 38 Tier-1 critical mutation routes:
  - Mounted with `requireClinicalAuthorization`: **0 (0.0%)**.
  - Protected only by legacy RBAC (`requirePermission` / `requireRole`): **27 (71.1%)**.
  - Protected only by raw `authenticateJwt` (Zero permission/role check): **11 (28.9%)**.
- **Status:** **`PROVEN`**.
- **Impact & Bounds:** Separation of Duties (SoD) and Break-the-Glass (BTG) exist only in unit test suites and are completely dormant in production request handling.

---

### FINDING-1A51-06: Direct Cross-Tenant Child Table Exposure Audit

We audited the five child tables to verify whether cross-tenant access is actually achievable through the application:

#### 1. `medication_emar_administrations`
- **Route:** `POST /api/v1/medications/administrations/:id/adverse-reaction` ([`medicationClosedLoop.routes.js:32`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/medicationClosedLoop.routes.js#L32)).
- **Middleware:** `authenticateJwt` only. No role/permission check.
- **Controller:** [`medicationClosedLoopController.documentAdverseReaction`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/controllers/medicationClosedLoop.controller.js#L334).
- **Service & SQL:** [`medicationClosedLoopService.documentAdverseReaction`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/medicationClosedLoop.service.js#L1318):
  ```sql
  SELECT * FROM medication_emar_administrations WHERE id = $1 FOR UPDATE;
  UPDATE medication_emar_administrations SET adverse_reaction_observed = TRUE, adverse_reaction_notes = $1 WHERE id = $2;
  ```
- **Parent Table:** `medication_orders` via `medication_order_id`.
- **Parent Join / Tenant Verification:** **NONE.**
- **Exploitation Assessment:** **PROVEN CROSS-TENANT MUTATION POSSIBLE.** A user authenticated in Hospital B who sends the UUID of an administration from Hospital A will successfully mutate the administration record and enqueue a clinical outbox event.

#### 2. `medication_dispense_allocations`
- **Route:** `POST /api/v1/medications/:id/administer` ([`medicationClosedLoop.routes.js:23`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/medicationClosedLoop.routes.js#L23)).
- **Middleware:** `authenticateJwt`, `requirePermission('MEDICATION_ADMINISTER')`.
- **Service & SQL:** [`medicationClosedLoopService.administerBedside`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/medicationClosedLoop.service.js#L823):
  ```sql
  SELECT * FROM medication_orders WHERE id = $1 FOR UPDATE;
  SELECT * FROM medication_dispense_allocations WHERE id = $1 FOR UPDATE;
  ```
- **Parent Table:** `medication_orders`.
- **Parent Join / Tenant Verification:** Verifies scanned barcode against `med.patient_id` and `alloc.dispense_barcode`, but **never verifies that `med.tenant_id === actor.tenantId`** or that `alloc.medication_order_id === med.id`.
- **Exploitation Assessment:** **PROVEN CROSS-TENANT MUTATION POSSIBLE** if barcodes are matched or known.

#### 3. `longitudinal_care_plans`
- **Route:** `POST /api/v1/care-coordination/care-plans` ([`careCoordinationAndTimeline.routes.js:16`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/careCoordinationAndTimeline.routes.js#L16)).
- **Middleware:** `authenticateJwt` only.
- **Service & SQL:** [`careCoordinationAndTimelineService.createOrUpdateCarePlan`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/careCoordinationAndTimeline.service.js#L204):
  ```sql
  SELECT * FROM longitudinal_care_plans WHERE id = $1;
  UPDATE longitudinal_care_plans SET title = $1 ... WHERE id = $8;
  ```
- **Parent Table:** `encounters` via `encounter_id`.
- **Parent Join / Tenant Verification:** **NONE.** Does not verify actor tenant match.
- **Exploitation Assessment:** **PROVEN CROSS-TENANT MUTATION POSSIBLE.** Actor in Tenant B can overwrite care plans in Tenant A.

#### 4. `patient_split_invoices`
- **Route:** `POST /api/v1/revenue-cycle/payments` ([`patientFinancialAndRevenueCycle.routes.js:22`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/patientFinancialAndRevenueCycle.routes.js#L22)).
- **Middleware:** `authenticateJwt`, `requireRole(financialRoles)`.
- **Service & SQL:** [`patientFinancialAndRevenueCycleService.recordPayment`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/patientFinancialAndRevenueCycle.service.js#L261):
  ```sql
  SELECT * FROM patient_split_invoices WHERE id = $1;
  UPDATE patient_split_invoices SET paid_amount_idr = $1, invoice_status = $2 WHERE id = $3;
  ```
- **Parent Table:** `encounters`.
- **Parent Join / Tenant Verification:** **NONE.**
- **Exploitation Assessment:** **PROVEN CROSS-TENANT FINANCIAL SETTLEMENT POSSIBLE.**

#### 5. `physician_diagnostic_interpretations`
- **Route:** `POST /api/v1/diagnostic-interpretations/interpretations/:id/actions` ([`diagnosticInterpretation.routes.js:22`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/diagnosticInterpretation.routes.js#L22)).
- **Middleware:** `authenticateJwt` only.
- **Service & SQL:** [`diagnosticInterpretationService.executeSecondaryAction`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/diagnosticInterpretation.service.js#L510):
  ```sql
  SELECT * FROM physician_diagnostic_interpretations WHERE id = $1 FOR UPDATE;
  INSERT INTO clinical_orders (...) VALUES (...);
  ```
- **Parent Table:** `encounters`.
- **Parent Join / Tenant Verification:** **NONE.**
- **Exploitation Assessment:** **PROVEN CROSS-TENANT ORDER INJECTION POSSIBLE.** Actor in Tenant B can trigger real clinical orders in Tenant A.

---

### FINDING-1A51-07: 21 Tables with RLS Enabled but Zero Policies (Total Deny Hazard)
- **Catalog Source:** `pg_class.relrowsecurity = true` AND `(SELECT count(*) FROM pg_policy WHERE polrelid = c.oid) = 0`.
- **Affected Tables (21):**
  `blood_bank_billing_reconciliations`, `blood_bedside_dual_nurse_verifications`, `bpjs_claim_disputes`, `bpjs_claim_submissions`, `bpjs_vclaim_lifecycle_logs`, `cssd_sterilization_cycles`, `hemovigilance_incident_investigations`, `inacbg_grouping_results`, `master_inacbg_tariffs`, `medical_device_implant_recalls`, `patient_billing_reconciliation`, `pharmacy_controlled_substance_logs`, `pharmacy_depots`, `pharmacy_dispensing_orders`, `post_anesthesia_aldrete_scores`, `radiology_critical_finding_alerts`, `radiology_instances`, `radiology_series`, `surgical_clinical_notes`, `surgical_teams`, `who_surgical_safety_checklists`.
- **Status:** **`PROVEN`**.
- **Impact & Bounds:** When the application transitions from `postgres` to `nurseflow_app_user`, all operations on these 21 tables will be **completely blocked** (0 rows returned on SELECT, permission denied on INSERT/UPDATE) because PostgreSQL enforces default-deny on RLS-enabled tables lacking policies.

---

## 3. WORKSTREAM D — COMPREHENSIVE RLS POLICY MATRIX

### Catalog Distribution:
- **Total Tables in Public Schema:** 212
- **Tables with RLS Enabled:** 95
- **Tables with RLS Disabled:** 117 (Reference tables, master taxonomies, and unmigrated child tables)
- **Total Policies Active in `pg_policies`:** 79
- **Policy Variable Breakdown:**
  - 18 policies directly reference `app.current_tenant_id`
  - 61 policies call helper function `current_app_tenant_id()`
  - Helper definition in catalog: `RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;`

### Critical Policy Divergence Analysis:
The database currently possesses an internal split: 61 policies read `app.tenant_id` while 18 policies read `app.current_tenant_id`. Setting only one variable leaves the other set of policies completely unauthenticated.

---

## 4. WORKSTREAM F — IDENTITY & RESOURCE BINDING AUDIT

| Component | Implemented & Enforced Today | Target Architecture | Gap Classification |
| :--- | :---: | :---: | :--- |
| **JWT Signature** | YES (HMAC-SHA256, constant-time) | Same | **ENFORCED** |
| **JWT Expiration** | YES (15 min access, 7 day refresh) | Same | **ENFORCED** |
| **JWT Issuer** | YES (`nurseflow-enterprise-his`) | Same | **ENFORCED** |
| **JWT Audience (`aud`)** | NO (Omitted in claims) | Add `aud: 'nurseflow-api'` | **PARTIAL** |
| **Token Revocation** | In-memory `Set()` on single node | Redis distributed blacklist or DB table | **VULNERABLE (Lost on restart)** |
| **Tenant Membership Recheck** | NO (15-min blind trust) | Session validation on critical actions | **ABSENT** |
| **Resource Resolvers** | NO (Mounted on 0 routes) | 7 clinical entity resolvers | **DESIGNED_ONLY** |
| **Separation of Duties** | NO (Mounted on 0 routes) | Stage 8 evaluation in auth pipeline | **DESIGNED_ONLY** |
| **Break-The-Glass** | NO (Mounted on 0 routes) | Stage 7 emergency bypass | **DESIGNED_ONLY** |

---

## 5. EVIDENCE CLOSURE CONCLUSION

All ambiguities from Wave 1A.5 and 1A.5.1 are conclusively closed with catalog and codebase proofs:
1. The application currently has **zero runtime RLS enforcement** because it connects as `postgres`.
2. The target role `nurseflow_app_user` **cannot log in** (`rolcanlogin: false`).
3. Core tables are **actively fail-open**.
4. Child endpoints are **actively vulnerable to cross-tenant tampering**.
5. Outbox discovery under fail-closed RLS **fails without architectural enhancement**.

```text
EVIDENCE CLOSURE: COMPLETE
```
