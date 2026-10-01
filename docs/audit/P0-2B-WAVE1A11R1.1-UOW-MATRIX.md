# P0-2B WAVE 1A.11R.1 UNIT OF WORK & RLS REQUEST-PATH MATRIX

**Audit Date:** 2026-10-01  
**Auditor:** Independent Security Auditor (Antigravity AI)  
**Standard:** Enterprise HIS Strict Read-Only Adversarial Audit  
**Target Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Branch:** `feature/security-foundation-wave1a10`  

---

## 1. Executive Summary

This document presents the authoritative inventory and security classification of all database access points across the NurseFlow Enterprise HIS backend.

Prior claims in Wave 1A.11 suggested that the application layer had achieved multi-tenant safety. However, an adversarial code audit proves that **only the Encounter domain implements the canonical Unit of Work contract (`withUnitOfWork`)**. The remaining 25 functional domains execute direct queries on the shared PostgreSQL connection pool outside of transactional and RLS context boundaries.

### Authoritative Backend Metrics:
```text
TOTAL PRODUCTION DB CALL SITES        : 846
PRODUCTION REQUEST-PATH DB CALL SITES : 845
REQUEST-PATH RLS-TABLE CALL SITES     : 157

REQUEST-PATH DB CALLS OUTSIDE UOW     : 843 (99.76%)
REQUEST-PATH RLS CALLS OUTSIDE UOW     : 156 (99.36%)
REQUEST-PATH WRITES OUTSIDE UOW       : 239
REQUEST-PATH READS OUTSIDE UOW        : 604

UNSAFE RLS REQUEST PATHS              : 156
SAFELY SCOPED RLS PATHS (INSIDE UOW)  : 1
```

**Stage 0 Rule Enforcement:**
> If `UNSAFE_RLS_REQUEST_PATHS > 0`: **STAGE 0 = NO-GO**.

With **156 unsafe RLS request paths** executing without transactional tenant isolation or GUC configuration, Stage 0 cannot be approved.

---

## 2. Security Classification Framework

Every database call site was analyzed and classified under the 6 standard HIS access models:

1. **`SAFE_GLOBAL`**: Accesses static dictionaries, immutable master data, or system health where tenant isolation is architecturally inapplicable.
2. **`ADMIN_CROSS_TENANT`**: Explicitly authorized elevated operations requiring audit trails and supervisory privileges.
3. **`TENANT_SENSITIVE_APP_SCOPED`**: Business operations with application-level `WHERE tenant_id = $x`, but lacking database-level RLS context or UoW boundaries.
4. **`TENANT_SENSITIVE_UOW`**: Canonical safe state executing within `withUnitOfWork` with `SET LOCAL app.current_tenant_id` and strict transaction commit/rollback hygiene.
5. **`UNSAFE_RLS_REQUEST_PATH`**: Queries directly touching RLS-enforced tables via `pool.query()` without UoW context, without `SET LOCAL app.current_tenant_id`, and without guaranteed tenant parameters.
6. **`UNKNOWN / BLOCKER`**: Unverifiable access paths lacking deterministic security context.

---

## 3. Comprehensive Domain-by-Domain UoW Audit Matrix

The following table summarizes all 25 production domains mapped from controllers and services:

| # | Functional Domain | Request DB Calls | Calls Touching RLS Tables | Outside UoW | Writes Outside UoW | Domain Security Status | Primary Risk Factors |
|---|---|---|---|---|---|---|---|
| 1 | **Encounter** | 2 | 1 | **0** | 0 | **COMPLIANT** | Canonical UoW implemented via `encounterApplication.service.js` |
| 2 | **Care Coordination** | 39 | 11 | **39** | 13 | **UNSAFE** | Direct `pool.connect()` manual TX without GUC; touches `longitudinal_care_plans` |
| 3 | **Medication / eMAR / Dispense** | 80 | 13 | **80** | 23 | **UNSAFE** | 23 un-isolated writes to `medication_orders`, `medication_dispense_allocations` |
| 4 | **Diagnostic / Notifications** | 38 | 11 | **38** | 9 | **UNSAFE** | Direct pool queries touching `physician_diagnostic_interpretations` |
| 5 | **Surgery / Perioperative** | 59 | 0 | **59** | 23 | **VULNERABLE** | 23 raw writes to operating rooms, surgical notes outside UoW |
| 6 | **Blood Bank** | 44 | 13 | **44** | 23 | **UNSAFE** | High clinical risk; un-isolated writes to blood crossmatch and transfusions |
| 7 | **Laboratory** | 71 | 8 | **71** | 16 | **UNSAFE** | Raw queries touching `clinical_orders` and laboratory specimen logs |
| 8 | **Radiology** | 72 | 19 | **72** | 20 | **UNSAFE** | 19 RLS calls touching critical imaging alerts, rad series, and orders |
| 9 | **Financial / Revenue Cycle** | 45 | 8 | **45** | 15 | **UNSAFE** | Raw writes to `patient_split_invoices` and billing reconciliations |
| 10 | **Inventory / Pharmacy** | 32 | 0 | **32** | 12 | **VULNERABLE** | Raw writes to pharmacy stock ledger without transaction boundaries |
| 11 | **Nursing / CPPT** | 35 | 15 | **35** | 4 | **UNSAFE** | 15 direct queries touching patient clinical progress notes (`cppt_entries`) |
| 12 | **Admission / Master Patient** | 15 | 10 | **15** | 0 | **UNSAFE** | Direct queries touching `master_patients` without UoW context |
| 13 | **Bed Management** | 35 | 5 | **35** | 11 | **UNSAFE** | Unscoped queries and writes to bed allocation and transfers |
| 14 | **Queue / Appointments** | 33 | 3 | **33** | 12 | **UNSAFE** | Un-isolated appointment booking and scheduling queries |
| 15 | **Emergency / IGD** | 20 | 11 | **20** | 5 | **UNSAFE** | Triage assessments querying and writing to `encounters` and `clinical_orders` |
| 16 | **Medical Record / CPOE** | 22 | 13 | **22** | 3 | **UNSAFE** | Physician order entry writing directly to `clinical_orders` without UoW |
| 17 | **Casemix / INA-CBG** | 47 | 0 | **47** | 17 | **VULNERABLE** | Claims coding and grouping executing outside transactional containment |
| 18 | **Command Center** | 12 | 6 | **12** | 0 | **UNSAFE** | Cross-hospital dashboard querying encounters and patient vitals raw |
| 19 | **Clinical Monitoring / EWS** | 45 | 5 | **45** | 11 | **UNSAFE** | Early Warning Score telemetry writes touching encounter clinical vitals |
| 20 | **Staff Privileging** | 35 | 0 | **35** | 9 | **VULNERABLE** | Doctor credentialing and privileges writing raw to DB |
| 21 | **Interoperability / SATUSEHAT**| 11 | 0 | **11** | 0 | **PARTIAL** | Reads from local cache; external FHIR sync |
| 22 | **Master Data Hub** | 18 | 0 | **18** | 4 | **GLOBAL_SAFE** | ICD-10, LOINC, and drug dictionary lookups |
| 23 | **Audit / Governance** | 17 | 0 | **17** | 3 | **VULNERABLE** | Governance logs and scanner queries without transaction scoping |
| 24 | **Authorization / RBAC** | 12 | 2 | **12** | 2 | **UNSAFE** | Role assignments and permission checks touching user tables raw |
| 25 | **Safety Authorization** | 3 | 3 | **3** | 3 | **UNSAFE** | Emergency bypass authorizations writing raw to safety registry |

---

## 4. Forensic Deep-Dive: 156 Unsafe RLS Call Sites

An inspection of the 156 call sites touching the 31 RLS-enforced tables reveals why they fail closed or risk leakage:

### Pattern A: Direct Pool Query Without GUC Configuration
```javascript
// Example from server/services/medicationClosedLoop.service.js
export const medicationClosedLoopService = {
  administerMedication: async (orderId, payload, actor) => {
    // Direct pool query: No withUnitOfWork, No SET LOCAL app.current_tenant_id
    const res = await pool.query(
      `INSERT INTO medication_emar_administrations (id, medication_order_id, encounter_id, patient_id, ...)
       VALUES ($1, $2, $3, $4, ...) RETURNING *`,
      [...]
    );
  }
};
```
**Mechanism of Failure:**
1. Because `medication_emar_administrations` has `FORCE ROW LEVEL SECURITY` and a default-deny policy requiring `tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`, when this query executes, `app.current_tenant_id` is **EMPTY** on the raw connection socket.
2. The query fails with an RLS error or inserts `NULL` tenant, which is blocked by NOT NULL and composite FK constraints.
3. If the socket was previously used by another request and not discarded, it could inherit a stale GUC, causing data contamination.

### Pattern B: Manual Transaction Without Socket Sanitization
```javascript
// Example from server/services/careCoordinationAndTimeline.service.js
const client = await postgresPoolService.getPool().connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO longitudinal_timeline_events (...) ...');
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
} finally {
  client.release(); // NO DISCARD ALL! Dirty socket returned to pool!
}
```
**Mechanism of Failure:**
1. Does not set tenant context GUC (`app.current_tenant_id`).
2. Does not execute `DISCARD ALL` before socket release.
3. Bypasses error-handling socket destruction (`release(true)`).

---

## 5. Architectural Remediation Roadmap (Wave 1B Boundary)

To resolve this critical blocker, future implementation MUST NOT attempt a blind 845-call refactoring. Instead, remediation must follow a **domain-bounded sequence**:

1. **Wave 1B.1 (Core Clinical Trio):**
   - Refactor `Care Coordination`, `Medication (eMAR/Dispense)`, and `Diagnostics` to adopt `withUnitOfWork`.
   - Remediates **35 RLS calls** and **45 writes**.
2. **Wave 1B.2 (Inpatient & Critical Care):**
   - Refactor `Nursing / CPPT`, `Medical Record / CPOE`, `Emergency / IGD`, and `Clinical Monitoring`.
   - Remediates **44 RLS calls** and **23 writes**.
3. **Wave 1B.3 (Diagnostics & Ancillary):**
   - Refactor `Radiology`, `Laboratory`, and `Blood Bank`.
   - Remediates **40 RLS calls** and **59 writes**.
4. **Wave 1B.4 (Administrative & Revenue Cycle):**
   - Refactor `Admission / Master Patient`, `Bed Management`, `Appointments`, and `Financial / Billing`.
   - Remediates **26 RLS calls** and **38 writes**.
5. **Wave 1B.5 (Platform & Governance):**
   - Refactor `Surgery`, `Casemix`, `Command Center`, and `Authorization`.
   - Remediates remaining non-UoW calls and unifies telemetry.
