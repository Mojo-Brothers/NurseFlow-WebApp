# P0-2B Wave 1A.5.4 — Final Architecture Decision

**Document Status:** Architecture Decision Record (ADR)  
**Date:** 2026-09-28  
**Scope:** Multi-Tenant Security Boundary & Transaction Lifecycle Architecture  
**Auditor Roles:** Principal Security Architect, PostgreSQL Security Engineer, Distributed Systems & Transaction Engineer  

---

## 1. Context & Architectural Problem

NurseFlow Enterprise HIS requires strict multi-tenant data isolation and auditable clinical transaction integrity across multiple hospital campuses. The system is transitioning from a development prototype (running as `postgres` superuser with client-side tenant filtering and hardcoded UUID fallbacks) to an enterprise-grade HIS running under a least-privilege database role (`nurseflow_app_user`) enforced by PostgreSQL Row-Level Security (RLS) and cryptographic access controls.

To guarantee that tenant context cannot leak across pooled database connections or concurrent asynchronous operations, the architecture must resolve:
1. How tenant context is passed from the HTTP/worker perimeter down to SQL execution.
2. How database transactions and PostgreSQL session variables (`SET LOCAL app.current_tenant_id`) are safely managed throughout the connection lifecycle.
3. How nested service calls, outbox workers, and asynchronous event chains interact without context corruption.

---

## 2. Comparative Analysis of Candidate Architectures

| Dimension | Option A: Explicit Context + Scoped Wrapper | Option B: Pure AsyncLocalStorage (ALS) Wrapper | Option C: Hybrid Architecture (Explicit UoW + Ambient ALS) |
|---|---|---|---|
| **High-Level Model** | Every service method explicitly takes `ctx` (`{ tenantId, actorId, client }`). DB wrapper sets `SET LOCAL` on client. | ALS implicitly stores tenant context per request. DB wrapper retrieves context from ALS and sets `SET LOCAL`. | Explicit Scoped Unit-of-Work (`uow.tenantId`) is the authoritative contract for business/DB calls; ALS provides ambient fallback for logging/tracing. |
| **Security** | **Extremely High.** No ambient state; impossible for helper to execute without declared tenant context. | **Medium.** Context can silently be lost in detached promises or background queues, triggering default-deny or fallback. | **Maximum.** Authoritative explicit parameter prevents context loss in workers; ambient ALS provides audit/correlation context. |
| **Correctness** | **Deterministic.** Context is visible in TypeScript/JSDoc signatures. Compile/lint-time verifiable. | **Fragile.** Hard to trace context flow; EventEmitter and decoupled queues lose context (proven in REV-04 audit). | **Deterministic & Robust.** Workers and queue processors explicitly provide tenant context; HTTP requests bind context at perimeter. |
| **Developer Ergonomics** | **Moderate.** Developers must pass `ctx` or `uow` through service and repository layers. | **High (Initial).** Clean signatures without passing parameters. "Magic" context. | **Balanced.** Explicit `uow` in business services; transparent database operations within the unit-of-work block. |
| **Migration Complexity** | **High.** Requires updating method signatures across all 27 services and repositories. | **Low.** Minimal signature changes needed; wrapper intercepts at pool level. | **Phased Moderate.** Stage 1: introduce Scoped UoW wrapper; Stage 2: refactor Tier-1 services; Stage 3: remaining services. |
| **Performance** | **Optimal.** Pipelined commands in UoW; zero ALS hook overhead; zero redundant transaction round-trips. | **Slight Overhead.** Node.js `async_hooks` tracking overhead on high-throughput microtasks. | **Optimal.** Pipelined `BEGIN READ ONLY; SET LOCAL; ...; COMMIT;` multi-statements reduce network latency by 30%. |
| **Failure Modes** | Missing `ctx` parameter causes immediate compile/runtime argument error (Fail-Fast). | Unbound callback in queue runs with `als.getStore() === undefined`, causing mysterious 401s or default fallbacks. | Fail-Fast on missing `uow`; pool interceptor guarantees `ROLLBACK; DISCARD ALL;` on dirty release. |
| **Observability** | Excellent: context explicitly logged in stack traces and query loggers. | Good: context available via ALS getter if not detached. | Outstanding: Correlation ID, Tenant ID, and Staff ID propagated through both loggers and SQL comments. |
| **Testability** | **Trivial.** Pass mock `{ tenantId: '...' }` directly to any service function in unit tests without setting up ALS scopes. | **Complex.** Every unit test must wrap execution in `als.run(...)`. | **Trivial & Flexible.** Direct unit testing with mock context; integration testing with real UoW transactions. |

---

## 3. Final Architecture Decision: Option C (Hybrid Architecture)

Based on empirical evidence gathered in Wave 1A.5.4 (specifically `scratch/p02b_wave1a5_4_rev04_als_test.js` showing that ALS loses context in queue processors and EventEmitters, and `scratch/p02b_wave1a5_4_rev01_pool_safety.js` proving connection transaction leak risks), **Option C (Hybrid Architecture)** is formally selected as the authoritative standard for NurseFlow Enterprise HIS.

### Core Architectural Pillars of Option C:

#### 1. Authoritative Explicit Scoped Unit-of-Work (Scoped UoW)
- Every transaction and database operation must execute within an explicit `ScopedUnitOfWork`:
  ```javascript
  await dbContext.withUnitOfWork({ tenantId, actor }, async (uow) => {
    // uow provides scoped query execution bound to tenantId
    await uow.query('SELECT ...');
  });
  ```
- Background workers (such as the FHIR outbox processor and integration dispatchers) instantiate an explicit UoW per tenant batch, completely immune to ALS detachment.

#### 2. Guaranteed Connection Lifecycle & Pool Interceptor
- The database wrapper guarantees that any leased client connection is enclosed in a strict `try / catch / finally` block:
  - If the callback succeeds: `COMMIT; client.release();`
  - If the callback fails: `ROLLBACK; client.release();`
- **Pool-Level Safety Net (PostgreSQL 16 Engine Hardened):**
  - An interceptor on `pool.on('release', async (client) => { ... })` checks `client._inTransaction`.
  - If a client is released dirty, the interceptor executes:
    ```sql
    ROLLBACK;
    DISCARD ALL;
    ```
  - If the rollback or cleanup fails, the connection is immediately terminated and removed from the pool via `client.release(true)`.

#### 3. Flat Transaction Depth & SAVEPOINT Model
- Inside a Scoped UoW:
  - Outer transactions issue `BEGIN; SET LOCAL app.current_tenant_id = $1;`.
  - Nested service calls reuse the existing transaction client if the tenant ID matches.
  - Sub-operations requiring failure isolation (e.g. attempting non-critical external notifications) explicitly use `uow.withSavepoint('sp_name', callback)` which executes `SAVEPOINT`, `RELEASE SAVEPOINT`, or `ROLLBACK TO SAVEPOINT`.
  - Cross-tenant context switching inside an active transaction is strictly forbidden and throws a `SecurityException`.

#### 4. Ambient ALS as Auxiliary Telemetry
- `AsyncLocalStorage` is maintained at the Express middleware layer solely for:
  - Distributed tracing (`correlationId`)
  - Structured application logging (`structuredLoggerService`)
  - Ambient diagnostic breadcrumbs
- ALS is **never** used as the sole authoritative proof of tenant identity for database writes.

---

## 4. Remediation Architecture for Required Revisions

1. **REV-01 (Pool Cleanup):** Implement two-tier cleanup: (1) `withTransaction` wrapper with guaranteed `ROLLBACK`, (2) `pool.on('release')` interceptor with `ROLLBACK` + `DISCARD ALL` + `client.release(true)` fallback.
2. **REV-02 (Fallback Elimination):** Eliminate all 7 production `|| DEFAULT_TENANT` fallbacks. Replace `targetTenantId = encounter.tenant_id || actor.tenantId` with strict assertion: `if (encounter.tenant_id !== actor.tenantId) throw new SecurityException('Cross-tenant resource access denied', 403)`.
3. **REV-03 (Nested Transactions):** Implement `depth` counter in `UnitOfWork`. Level 0 executes `BEGIN`; Level > 0 reuses connection without issuing redundant `BEGIN`. Savepoints are explicit via `uow.savepoint()`.
4. **REV-04 (ALS Strategy):** Enforce Option C Hybrid model across all service contracts.
5. **REV-05 (21 Zero-Policy Tables):** Generate migration adding standard tenant isolation policies (`FOR ALL USING (tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid)`) across all 21 tables prior to runtime role cutover.
6. **REV-06 (Policy Clarification):** Standardize all existing and new RLS policies with explicit `USING` and `WITH CHECK` clauses for complete defense-in-depth.
7. **REV-07 (Security Definer Hardening):** Outbox function must be defined with:
   - `REVOKE ALL ON FUNCTION get_active_outbox_tenants() FROM PUBLIC;`
   - `GRANT EXECUTE ON FUNCTION get_active_outbox_tenants() TO nurseflow_worker;`
   - `SET search_path = pg_catalog, public;`
8. **REV-08 (JWT Refresh Fix):** Modify `issueTokenPair()` to embed `tenantId` into `refreshPayload`. Modify `rotateRefreshToken()` to pass `tenantId: payload.tenantId` when invoking `issueTokenPair()`.
