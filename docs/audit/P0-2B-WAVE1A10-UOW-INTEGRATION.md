# NURSEFLOW — P0-2B WAVE 1A.10 UNIT OF WORK INTEGRATION
## AUTHORITATIVE UNIT OF WORK & APPLICATION REQUEST PATH INTEGRATION

### 1. Authoritative UoW Architecture (`server/db/unitOfWork.js`)
Implemented Option C Unit of Work contract:
```text
checkout socket from pool
       ↓
validate UUID tenantId (fail closed if missing/invalid: AUTHORITATIVE_TENANT_REQUIRED)
       ↓
BEGIN ISOLATION LEVEL [level]
       ↓
SELECT set_config('app.current_tenant_id', $1, true)  [SET LOCAL]
SELECT set_config('app.current_user_id', $1, true)    [SET LOCAL]
       ↓
execute domain operation callback(uowContext)
       ↓
COMMIT (or ROLLBACK on error)
       ↓
DISCARD ALL (Three-Tier socket hygiene)
       ↓
release socket (or destroy if fatal socket error)
```

### 2. Request Path Wiring
Integrated into Master Clinical Encounter path:
- **Routes:** `server/routes/encounters.routes.js`
- **Controller:** `server/controllers/encounter.controller.js`
  - Extracts server-originating `tenantId` and `actorId` from authenticated token/context.
  - Propagates authoritative `tenantContext` to application service.
  - Catches `AUTHORITATIVE_TENANT_REQUIRED` and returns 403 Forbidden with RFC 7807 problem details.
- **Service:** `server/services/encounterApplication.service.js`
  - `createEncounter`: All inserts (`episodes_of_care`, `encounters`, `universal_audit_logs`) wrapped in `withUnitOfWork`.
  - `transitionEncounterStatus`: Encounter lock (`SELECT ... FOR UPDATE`), status transition, and audit log executed in `withUnitOfWork`.
  - `getEncounters` & `getEncounterById`: Direct pool queries replaced with `withUnitOfWork` to activate PostgreSQL RLS tenant filtering.

### 3. Direct DB Access Inventory & Static Analysis
AST analysis executed across 454 files in repository (`scratch/ast_inventory_db_access.js`):
- `pool.connect()`: 167
- `pool.query()`: 204
- `client.query()`: 958
- `getPool()`: 149

**Classification Breakdown:**
- **REQUEST / CONTROLLER / SERVICE:** 751
- **TRANSACTION / UOW BOUNDARY:** 18
- **TEST HARNESS:** 333
- **ADMIN / MIGRATION SCRIPTS:** 227

**Exemption Matrix:**
- Test files (`tests/*`) and admin scripts (`scripts/*`) are exempt from production UoW routing as they operate in isolated test fixtures or administrative migration roles.
- For application HTTP request paths, Wave 1A.10 establishes the gold-standard UoW integration on core clinical encounters, with remaining domain services scheduled for systematic adoption across subsequent wave migrations.
