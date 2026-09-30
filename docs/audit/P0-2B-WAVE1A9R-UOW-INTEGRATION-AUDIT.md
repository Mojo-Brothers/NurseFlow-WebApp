# P0-2B Wave 1A.9R — Unit of Work (UoW) Application Integration & Request-Path Audit

**Document Identifier:** `SEC-AUD-P02B-W1A9R-UOW-INTEGRATION-AUDIT-20260930`  
**Document Type:** Application Codebase Integration & Request-Pipeline Audit  
**Author Roles:**
- Application Security Auditor
- Principal Security Architect
- PostgreSQL Security Engineer
- Distributed Systems Engineer

**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Evaluation Date:** 2026-09-30  
**Audit Constraint:** **`STRICT READ-ONLY AST & STATIC CODE INSPECTION`**  
**Executive Status:** **`LAB UOW: VERIFIED_IN_LAB` | `APPLICATION REQUEST-PATH UOW: NOT_VERIFIED` | `UOW MIGRATION PROGRESS: 0 OF 80 (0%)`**

---

## 1. Executive Summary & Objective

In Wave 1A.9, the **Option C Unit of Work** pattern was successfully implemented and validated within test scripts (`implement_and_test_uow_rls.js` and `run_full_security_matrix.js`) against `nurseflow_security_lab`. The test confirmed that `withUnitOfWork` correctly rejects missing tenant contexts, sets `SET LOCAL app.current_tenant_id`, enforces transaction boundaries, and sanitizes connections upon release.

The objective of **Wave 1A.9R** is to answer Critical Question #4:
> **Is Unit of Work actually implemented and integrated into the NurseFlow application codebase, or does it exist solely inside disposable test harnesses?**

---

## 2. Static Codebase Search for `withUnitOfWork`

An exhaustive AST and static string search for `withUnitOfWork` was executed across the entire repository:

### Search Scope
- `server/` (controllers, routes, services, middleware, DB utilities)
- `src/` (client and shared libraries)
- `database/` (migrations, seeds)
- `scripts/` (operational tools)

### Observed Results
```text
Total occurrences of 'withUnitOfWork' in server/:    0
Total occurrences of 'withUnitOfWork' in src/:       0
Total occurrences of 'withUnitOfWork' in database/:  0
Total occurrences of 'withUnitOfWork' in scripts/:   0

Occurrences found exclusively in:
- docs/audit/*.md (Design specifications & audit documents)
- scratch/implement_and_test_uow_rls.js (Local lab test harness)
- scratch/run_full_security_matrix.js (Local lab test harness)
```

**Finding:** `withUnitOfWork` does **NOT** exist anywhere in the production or development application source code. It was implemented exclusively as an inline helper function in disposable test scripts.

---

## 3. Direct Pool Access Call Sites Re-Audit

In Wave 1A.8 and Wave 1A.8R, the codebase was inventoried for direct database access call sites. In Wave 1A.9R, a rigorous recount was executed to determine whether Wave 1A.9 migrated any application call sites to UoW:

| Database Access Pathway | Wave 1A.8 Baseline | Wave 1A.9R Ground Truth | Migrated to UoW | Architectural Risk |
| :--- | :---: | :---: | :---: | :--- |
| **`pool.connect()`** | 80 | **80** | **0 (0%)** | Connection checkout without tenant context binding |
| **`pool.query()`** | 30 | **30** | **0 (0%)** | Bare queries executed without transaction or tenant GUC |
| **`client.query()`** | 648 | **648** | **0 (0%)** | Raw query execution lacking UoW context guard |
| **`postgresPoolService.getPool()`** | 121 | **121** | **0 (0%)** | Direct pool retrieval across service layers |

**Finding:** The counts are **100% identical to the Wave 1A.8 baseline**. Not a single application route, controller, or service has been refactored to use `withUnitOfWork`.

---

## 4. Request-Pipeline Static Trace (Section 11 Proof)

A valid multi-tenant enterprise application requires an unbroken chain of custody from HTTP ingress to database execution:

```text
APPROVED SPECIFICATION (Target Architecture):
HTTP Ingress
  ↓
Authentication Middleware (JWT verification)
  ↓
Tenant Resolution Middleware (Extract & validate authoritative tenant UUID)
  ↓
withUnitOfWork({ tenantId, actorId }, async (uow) => {
  ↓
  BEGIN
  ↓
  SET LOCAL app.current_tenant_id = $1
  ↓
  Service / Repository Query (Scoped client)
  ↓
  COMMIT / ROLLBACK
})
  ↓
Connection Sanitization & Pool Release
```

### Actual Application Reality in `server/`:
Inspection of actual Express routes (e.g., [`server/routes/clinicalOrders.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/clinicalOrders.routes.js), [`server/routes/encounters.routes.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/encounters.routes.js)):
```javascript
// Actual operational pattern in server/:
router.get('/', authenticateJWT, async (req, res) => {
  const client = await pool.connect(); // Naked checkout
  try {
    // ZERO SET LOCAL app.current_tenant_id
    // ZERO withUnitOfWork wrapper
    const result = await client.query('SELECT * FROM clinical_orders WHERE ...');
    res.json(result.rows);
  } finally {
    client.release(); // Bare release without session sanitization
  }
});
```

Because naked checkouts bypass `withUnitOfWork`:
1. `app.current_tenant_id` is never set on the connection.
2. If RLS is enforced with default-deny, these endpoints will return **0 rows** or fail completely.
3. If RLS is bypassed (e.g., connecting as `postgres`), tenant filtering relies solely on ad-hoc `WHERE tenant_id = ...` clauses, leaving the system vulnerable to BOLA and developer oversight.

---

## 5. Architectural Conclusion & Status

```text
================================================================================
                    UOW INTEGRATION RECONCILIATION
================================================================================
UOW ENGINE CAPABILITY:               VERIFIED_IN_LAB (Option C mechanics sound)
APPLICATION REPOSITORY INTEGRATION:  NOT_IMPLEMENTED (0 files in server/)
REQUEST-PATH ENFORCEMENT:            NOT_VERIFIED (0 endpoints protected)
DIRECT CALL SITES MIGRATED:          0 OF 80 (0%)
APPLICATION RUNTIME READINESS:       NOT_READY
================================================================================
```

The Unit of Work pattern is mathematically and operationally proven in the lab, but **remains completely unintegrated into the application codebase**. Full application migration is mandatory during Stage 1 implementation before any production or clinical exposure can be authorized.
