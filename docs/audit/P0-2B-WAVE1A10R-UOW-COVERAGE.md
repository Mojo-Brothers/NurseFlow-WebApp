# NURSEFLOW — P0-2B WAVE 1A.10R UNIT OF WORK COVERAGE AUDIT
## PRODUCTION REQUEST PATH & DIRECT DB ACCESS BYPASS RECONCILIATION

### 1. Architectural Scope
Wave 1A.10 implemented Option C Unit of Work in `server/db/unitOfWork.js`.
The implementation was audited against the Wave 1A.7 contract:
- **Pre-execution gate:** Fails closed if `tenantId` is missing or invalid UUID (`AUTHORITATIVE_TENANT_REQUIRED`) — **VERIFIED_FACT**
- **Transaction-scoped GUCs:** Sets `app.current_tenant_id` and `app.current_user_id` via `set_config(..., true)` (SET LOCAL) — **VERIFIED_FACT**
- **Three-tier hygiene:** Executes `DISCARD ALL` in finally block before client release — **VERIFIED_FACT**
- **Fatal socket handling:** Destroys connection on rollback failure — **VERIFIED_FACT**

### 2. Empirical AST Call-Site Inventory (Production Code Only)
Scanning strictly production code (`server/controllers/`, `server/services/`, `server/repositories/`, `server/modules/`, `server/routes/`):
- Total Production Files Scanned: **151**
- Direct `pool.connect()` Calls: **76**
- Direct `pool.query()` Calls: **22**
- Direct `client.query()` Calls: **629**
- Direct `getPool()` Calls: **115**
- **Total Direct DB Access Sites Bypassing UoW: 727**
- **Distinct Production Files with Direct DB Bypass: 28**

### 3. Integrated vs. Bypassed Request Paths
- **Integrated Request Path:**
  - `GET /api/v1/encounters` -> `encounter.controller.js` -> `encounterApplication.service.js` -> `withUnitOfWork` (Verified)
  - `GET /api/v1/encounters/:id` -> `withUnitOfWork` (Verified)
  - `POST /api/v1/encounters` -> `withUnitOfWork` (Verified)
  - `PATCH /api/v1/encounters/:id/status` -> `withUnitOfWork` (Verified)
- **Unmigrated Production Request Paths (28 files):**
  - `server/services/billing.service.js` (Bypasses UoW, calls direct `pool.query`)
  - `server/services/triageApplication.service.js` (Bypasses UoW, calls direct `pool.connect`)
  - `server/services/careCoordinationAndTimeline.service.js` (Bypasses UoW, calls direct `pool.connect`)
  - `server/services/medicationClosedLoop.service.js` (Bypasses UoW, calls direct `pool.connect`)
  - `server/services/diagnosticInterpretation.service.js` (Bypasses UoW, calls direct `pool.connect`)
  - `server/services/clinicalMonitoring.service.js` (Bypasses UoW, calls direct `pool.connect`)
  - `server/services/bloodBankEnterprise.service.js` (Bypasses UoW, calls direct `pool.connect`)
  - `server/services/perioperativeClosedLoop.service.js` (Bypasses UoW, calls direct `pool.connect`)
  - `server/services/patientFinancialAndRevenueCycle.service.js` (Bypasses UoW, calls direct `pool.connect`)
  - `server/services/clinicalCodingAndCasemix.service.js` (Bypasses UoW, calls direct `pool.connect`)
  - ...and 18 additional service/repository files.

### 4. Security Implication & Verdict
Because all 31 clinical tables now enforce default-deny RLS via `tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`:
Any unmigrated production path that queries these tables directly without `withUnitOfWork` will find `app.current_tenant_id` unset, evaluating the policy to `NULL` and returning **0 rows**.
While this prevents cross-tenant data leakage (fails closed), it introduces severe application functional degradation across all non-Encounter clinical domains.

```text
REQUEST-PATH UOW:
PARTIAL

PRODUCTION REQUEST DIRECT DB BYPASS:
727
```
