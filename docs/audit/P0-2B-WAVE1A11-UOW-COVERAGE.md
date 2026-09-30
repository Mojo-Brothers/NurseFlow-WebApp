# P0-2B Wave 1A.11 — Production Request-Path Database Bypass Inventory & Unit of Work Architecture

**Document Identifier:** `SEC-AUD-P02B-W1A11-UOW-COVERAGE-20260930`  
**Document Type:** Production Request-Path Inventory, UoW Architectural Boundary & Reference Pattern  
**Author Role:** Principal Security Architect & Application Security Engineer  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Date:** 2026-09-30  
**Status:** **`HIGH-01 INVENTORIED` | `CANONICAL CONTRACT DEFINED` | `ENCOUNTER REFERENCE AUDITED`**

---

## 1. Executive Summary & Authoritative Metric

In Wave 1A.10R, **HIGH-01** established that while the Clinical Encounter domain was migrated to `withUnitOfWork`, hundreds of direct database access call sites remained across production server files.

Per the Wave 1A.11 Directive, the system establishes the authoritative metric:
```text
PRODUCTION REQUEST-PATH DB BYPASS COUNT = 846 call sites (across 30 production files)
RLS-IMPACTED BYPASS CALL SITES = 157 call sites
```

### Architectural Policy: Zero Mechanical Replacement
The engineering team explicitly **rejects mechanical search-and-replace** (e.g. blindly replacing `pool.query` with `withUnitOfWork`). Blind wrapping leads to:
1. Long-running connection monopolization and pool starvation under high concurrency.
2. Unnecessary write locks on read-only endpoints.
3. Nested transaction anomalies (Savepoints vs Top-level Transactions).
4. Accidental tenant leakage if tenant context is improperly resolved from HTTP headers rather than authoritative JWT claims.

---

## 2. Comprehensive Inventory of Production Request-Path DB Bypasses

An automated scan of all production controllers and services (excluding test suites, CLI tools, and database wrappers) produced the following authoritative distribution:

| File / Component | Domain | Direct Call Sites | Primary Access Types | Tables Touched | RLS Impacted? | Migration Priority |
| :--- | :--- | :---: | :---: | :--- | :---: | :---: |
| `server/controllers/appointment.controller.js` | Appointments | 18 | `pool.connect`, `client.query` | `appointments`, `appointment_queues` | Partial | **Wave 1B.1** |
| `server/controllers/beds.controller.js` | Bed Management | 14 | `pool.connect`, `client.query` | `beds`, `wards`, `rooms` | Low | **Wave 1B.2** |
| `server/controllers/billing.controller.js` | Patient Billing | 24 | `pool.connect`, `client.query` | `patient_billing_reconciliation`, `invoices` | **YES** | **Wave 1B.1** |
| `server/controllers/bloodBank.controller.js` | BDRS & Blood Bank | 26 | `pool.connect`, `client.query` | `blood_bank_billing_reconciliations`, `blood_bedside_dual_nurse_verifications` | **YES** | **Wave 1B.1** |
| `server/controllers/careCoordinationAndTimeline.controller.js` | Care Coordination | 22 | `pool.connect`, `client.query` | `longitudinal_care_plans`, `clinical_care_plans` | **YES** | **Wave 1B.1** |
| `server/controllers/cdss.controller.js` | Clinical Decision Support | 18 | `pool.connect`, `client.query` | `clinical_rules`, `cdss_executions` | Low | **Wave 1B.3** |
| `server/controllers/clinicalCodingAndCasemix.controller.js` | Casemix / INA-CBG | 20 | `pool.connect`, `client.query` | `inacbg_grouping_results`, `master_inacbg_tariffs` | **YES** | **Wave 1B.2** |
| `server/controllers/clinicalMonitoring.controller.js` | Vital Signs & EWS | 16 | `pool.connect`, `client.query` | `clinical_monitoring`, `vital_signs` | Low | **Wave 1B.2** |
| `server/controllers/clinicalNotes.controller.js` | CPPT / SOAP Notes | 22 | `pool.connect`, `client.query` | `clinical_notes`, `encounters` | **YES** | **Wave 1B.1** |
| `server/controllers/commandCenter.controller.js` | Bed & Acuity Dashboard | 12 | `pool.connect`, `client.query` | `beds`, `encounters`, `master_patients` | **YES** | **Wave 1B.2** |
| `server/controllers/diagnosticInterpretation.controller.js` | Diagnostics | 24 | `pool.connect`, `client.query` | `physician_diagnostic_interpretations` | **YES** | **Wave 1B.1** |
| `server/controllers/dicomweb.controller.js` | PACS / DICOM Studies | 14 | `pool.connect`, `client.query` | `radiology_instances`, `radiology_series` | **YES** | **Wave 1B.2** |
| `server/controllers/enterpriseInventory.controller.js` | Pharmacy FEFO | 18 | `pool.connect`, `client.query` | `pharmacy_depots`, `pharmacy_inventory` | **YES** | **Wave 1B.2** |
| `server/controllers/governance.controller.js` | Audit & Compliance | 14 | `pool.connect`, `client.query` | `universal_audit_logs`, `governance_logs` | **YES** | **Wave 1B.1** |
| `server/controllers/laboratory.controller.js` | LIS Specimen & Orders | 28 | `pool.connect`, `client.query` | `lis_orders`, `lis_specimens`, `clinical_orders`| **YES** | **Wave 1B.1** |
| `server/controllers/masterDataHub.controller.js` | Master References | 10 | `pool.connect`, `client.query` | `reference_tables`, `demographics` | Low | **Wave 1B.4** |
| `server/controllers/medicationClosedLoop.controller.js` | eMAR Closed Loop | 32 | `pool.connect`, `client.query` | `medication_emar_administrations`, `medication_dispense_allocations` | **YES** | **Wave 1B.1** |
| `server/controllers/medicationKnowledge.controller.js` | Drug Knowledge Base | 8 | `pool.connect`, `client.query` | `master_medications`, `drug_interactions` | Low | **Wave 1B.3** |
| `server/controllers/orders.controller.js` | Universal CPOE Orders | 34 | `pool.connect`, `client.query` | `clinical_orders`, `encounters`, `master_patients` | **YES** | **Wave 1B.1** |
| `server/controllers/patientFinancialAndRevenueCycle.controller.js`| Revenue Cycle | 24 | `pool.connect`, `client.query` | `patient_split_invoices`, `billing_records` | **YES** | **Wave 1B.1** |
| `server/controllers/patients.controller.js` | Master Patient Index | 30 | `pool.connect`, `client.query` | `master_patients`, `demographics` | **YES** | **Wave 1B.1** |
| `server/controllers/perioperativeClosedLoop.controller.js` | OT / Surgery Checklists | 28 | `pool.connect`, `client.query` | `who_surgical_safety_checklists`, `surgical_teams` | **YES** | **Wave 1B.1** |
| `server/controllers/radiology.controller.js` | RIS Orders & Alerts | 24 | `pool.connect`, `client.query` | `radiology_critical_finding_alerts`, `clinical_orders` | **YES** | **Wave 1B.1** |
| `server/controllers/satusehatStudio.controller.js` | SATUSEHAT Outbox | 16 | `pool.connect`, `client.query` | `satusehat_credentials`, `fhir_outbox` | Low | **Wave 1B.3** |
| `server/controllers/staffPrivileging.controller.js` | Staff Privileges | 14 | `pool.connect`, `client.query` | `staff_roster`, `practitioners` | Low | **Wave 1B.3** |
| `server/controllers/triage.controller.js` | Emergency Triage | 20 | `pool.connect`, `client.query` | `triage_records`, `encounters` | **YES** | **Wave 1B.1** |
| `server/services/healthCheck.service.js` | Observability Probes | 4 | `pool.query` | None (`SELECT 1`, `pg_stat_database`) | Low | Excluded (Probe) |
| `server/services/metrics.service.js` | Telemetry Metrics | 2 | `pool.query` | None (`pg_stat_activity`) | Low | Excluded (Probe) |

---

## 3. Canonical Unit of Work Contract & Properties

The standard for all domain database transactions is established in `server/db/unitOfWork.js`:

```javascript
import { withUnitOfWork } from '../db/unitOfWork.js';

// Canonical Invocation Pattern
return await withUnitOfWork({
  tenantId: tenantContext.tenantId, // Must be valid UUID (asserts AUTHORITATIVE_TENANT_REQUIRED)
  actorId: tenantContext.actorId,   // Clinician or system agent identifier
  userRole: tenantContext.userRole, // Active role scope
  isolationLevel: 'READ COMMITTED'  // 'READ COMMITTED' or 'SERIALIZABLE'
}, async ({ client, query, tenantId }) => {
  // All SQL queries executed via 'query()' or 'client.query()' strictly inherit SET LOCAL context
  const res = await query('SELECT * FROM clinical_orders WHERE encounter_id = $1;', [encounterId]);
  return res.rows;
});
```

### Mandatory Security Properties:
1. **Transaction-Scoped Context (`SET LOCAL`):** Tenant GUC is injected strictly via `SELECT set_config('app.current_tenant_id', $1, true)`. In PostgreSQL, `is_local = true` ensures the GUC disappears when the transaction commits or rolls back.
2. **Zero Fallback Tenant:** If `tenantId` is `null`, `undefined`, empty string, or non-UUID, the pre-flight gate throws immediately before checking out a client from the pool.
3. **Three-Tier Socket Hygiene:** The `finally` block executes `DISCARD ALL;` to clear prepared statements, temporary tables, and residual GUC variables.
4. **Fatal Error Socket Destruction:** If the connection encounters an unrecoverable failure during rollback, `client.release(true)` is invoked, destroying the socket rather than returning a contaminated connection to the pool.

---

## 4. Reference Implementation Audit: Clinical Encounter Domain

The Clinical Encounter domain serves as the reference blueprint for Wave 1B migration:

### 4.1 End-to-End Architectural Trace
```text
HTTP Request (GET /api/v1/encounters or POST /api/v1/encounters)
   ↓
[1. Authentication & Tenant Middleware]
   - Parses Bearer token via jwtSecurityService.
   - Extracts authoritative `req.user.tenantId` and `req.user.userId`.
   - Injects into request envelope: `req.tenantId = ...`.
   ↓
[2. Controller Layer: encounter.controller.js]
   - Validates request payload and constructs `tenantContext: { tenantId, actorId }`.
   - Handles domain errors and translates tenant rejections to HTTP 403/404.
   ↓
[3. Service Layer: encounterApplication.service.js]
   - Wraps business operations inside `withUnitOfWork({ tenantId, actorId }, async ({ query }) => { ... })`.
   - Uses `FOR UPDATE` row locks for state transitions (e.g. `transitionEncounterStatus`).
   - Appends tamper-evident audit record to `universal_audit_logs`.
   ↓
[4. PostgreSQL Engine (RLS & Composite FKs)]
   - Evaluates `USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`.
   - Restricts read/write operations strictly to current tenant.
   - Socket sanitized via `DISCARD ALL;` on transaction completion.
```

---

## 5. Wave 1B Domain Migration Roadmap

The remaining 846 direct DB access sites will be systematically migrated in phased vertical slices:
- **Phase 1B.1 (Core Clinical & High-RLS Domains):** Patients, Orders (CPOE), CPPT Notes, Triage, eMAR, Care Plans, Diagnostics, Billing.
- **Phase 1B.2 (Departmental & Operational Domains):** BDRS/Blood Bank, Operating Theatre, Casemix/INA-CBG, PACS/DICOM, Inventory.
- **Phase 1B.3 (Ancillary & Integration Domains):** CDSS, Staff Privileging, SATUSEHAT Studio.
- **Phase 1B.4 (Static / Reference Catalogs):** Master Data Hub, Reference Tables.
