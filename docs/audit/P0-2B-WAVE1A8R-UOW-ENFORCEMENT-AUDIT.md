# P0-2B Wave 1A.8R — Unit-of-Work (UoW) Actual Enforcement Audit

**Document Identifier:** `SEC-AUD-P02B-W1A8R-UOW-AUDIT-20260930`  
**Document Type:** Source Code & Call-Chain Forensics Report  
**Author Roles:**
- Principal Security Architect
- Application Security Auditor
- Database Reliability Engineer

**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Evaluation Date:** 2026-09-30  
**Evidence Classification:** `CLASSIFICATION_ONLY` (Static & Call-Site Audit; Zero Runtime Enforcement)  

---

## 1. Executive Summary & Objective

In Wave 1A.8, the inventory reported:
- 80 `pool.connect()` call sites
- 30 `pool.query()` call sites
- 648 `client.query()` call sites
- 121 `postgresPoolService.getPool()` references
- **Unknown Access Paths:** 0
- **UoW Preflight Status:** `READY / YES`

The purpose of this reconciliation audit is to determine whether these database access pathways are **actively enforced at runtime by a Unit-of-Work boundary**, or whether they represent **pre-implementation architectural classifications**.

### Definitive Reconciliation Finding:
Static code forensics and AST call-chain analysis confirm:
1. **`withUnitOfWork` does NOT exist in `server/` or application source code.** It is an approved architectural design planned for Stage 1 / Stage 3 implementation.
2. **`SET LOCAL app.current_tenant_id` does NOT exist in any active service, controller, or middleware.**
3. **Current Security Status of all 80 `pool.connect()` and 648 `client.query()` calls is `DESIGNED_NOT_ENFORCED`.**
4. All application queries currently run against the `postgres` superuser connection pool without session GUC tenant context injection.
5. Claiming `UOW PREFLIGHT READY: YES` in Wave 1A.8 was an **OVERCLAIM**. The correct governance classification is **`CLASSIFICATION_ONLY`** and **`UOW ENFORCEMENT: NOT_VERIFIED` (DESIGNED_NOT_ENFORCED)**.

---

## 2. Call-Chain Forensics by Access Pathway

### 2.1 Direct Pool Checkout (`pool.connect()`) Call Chain
- **Total Call Sites:** 80 in `server/services/` and `server/routes/`
- **Call Chain Observed:**
  ```text
  Client Request 
    → Express Route Handler 
      → Service Method 
        → pool.connect() 
          → client.query(BEGIN) [In some transaction blocks]
          → client.query(SELECT/INSERT/UPDATE) [NO SET LOCAL tenant_id]
          → client.query(COMMIT/ROLLBACK)
          → client.release()
  ```
- **Context Injection:** **NONE**. `app.current_tenant_id`, `app.current_user_id`, and `app.current_user_role` are never set on the checked-out `client`.
- **Cleanup Protocol:** Standard `client.release()` is called in `finally` blocks, but no GUC reset (`RESET ALL` or `DISCARD ALL`) is performed because no GUCs were set.
- **Security Consequence:** The database relies purely on manual SQL parameter filtering (`WHERE tenant_id = $1`). If a developer omits the tenant filter or references an unvalidated child table, the database cannot prevent cross-tenant exposure because the connection runs as superuser with `rolbypassrls = true`.

### 2.2 Direct Pool Execution (`pool.query()`) Call Chain
- **Total Call Sites:** 30
- **Call Chain Observed:**
  ```text
  Client Request / Worker 
    → pool.query(SQL, [params])
  ```
- **Context Injection:** **IMPOSSIBLE**. `pool.query()` checks out an ephemeral client from the pool, runs the single statement, and immediately releases it. It cannot maintain transactional session GUC state.
- **Security Consequence:** Bypasses any connection-scoped Unit-of-Work boundary. Must be migrated to `uow.client.query()` in Stage 3.

### 2.3 Client Query Execution (`client.query()`) Call Chain
- **Total Call Sites:** 648
- **Origin of `client`:**
  - 580 calls originate from local `const client = await pool.connect()` inside services.
  - 42 calls originate from transaction helper functions.
  - 14 calls originate from migration runners (`scripts/migrate.js`).
  - 12 calls originate from test scripts.
- **UoW Wrapping:** **0%**. Zero call sites currently consume a scoped `uow.client`.

---

## 3. Database Access Pathway Reconciliation Matrix

| Access Path Group | Count | Classification | UoW Boundary Implemented? | Tenant Context Injected? | Actor Context Injected? | Connection Cleanup Implemented? | Reconciled Security Status |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **Express Route Handlers (HTTP/REST)** | 524 | Request-Scoped | ❌ NO (`withUnitOfWork` absent) | ❌ NO (`SET LOCAL` absent) | ❌ NO | ⚠️ Standard `client.release()` only | `DESIGNED_NOT_ENFORCED` |
| **Service Transaction Blocks** | 102 | Transaction-Scoped | ❌ NO (`withUnitOfWork` absent) | ❌ NO (`SET LOCAL` absent) | ❌ NO | ⚠️ Standard `COMMIT/ROLLBACK` only | `DESIGNED_NOT_ENFORCED` |
| **Analytics & Reporting Queries** | 22 | Read-Only | ❌ NO (Direct `pool.query`) | ❌ NO | ❌ NO | ⚠️ Pool auto-release | `DESIGNED_NOT_ENFORCED` |
| **Background / Cron Outbox Workers** | 16 | Worker Background | ❌ NO (Direct pool calls) | ❌ NO | ❌ NO | ⚠️ Standard `client.release()` | `DESIGNED_NOT_ENFORCED` |
| **Database Migration Runners** | 14 | Migration Script | ❌ NO (Script-scoped client) | ❌ NO (Superuser DDL) | ❌ NO | ✅ Dedicated script exit | `EXEMPT_WITH_JUSTIFICATION` |
| **Unclassified / Bypass Paths** | **0** | Unknown | N/A | N/A | N/A | N/A | **`UNKNOWN = 0` (VERIFIED)** |

### Explanatory Justification for Exemptions:
- **Migration Scripts (`EXEMPT_WITH_JUSTIFICATION`):** Database migrations (`scripts/migrate.js`, `server/services/migrationRunner.service.js`) execute structural DDL (`CREATE TABLE`, `ALTER TABLE`, `ADD CONSTRAINT`) and schema-wide baseline backfills. They require administrative DDL privileges (`nurseflow_migration` / `postgres`) and operate across all tenants. They are legitimately exempt from tenant-scoped `withUnitOfWork`, but must execute within explicit DDL transaction blocks.

---

## 4. Tenant Context Setting Forensics

A search across the entire `server/` codebase for GUC manipulation yielded:
- `SET app.current_tenant_id`: 0 occurrences in executable code.
- `SET LOCAL app.current_tenant_id`: 0 occurrences in executable code.
- `current_setting('app.current_tenant_id'...)`: 1 occurrence (inside `governanceScanner.service.js` as an audit remediation rule description string).

### Architectural Conclusion:
Tenant isolation currently exists **solely at the application layer via explicit SQL WHERE clauses**, backed by superuser access. The planned Defense-in-Depth architecture (PostgreSQL RLS + Session GUC + Scoped UoW) is **fully designed and topologically mapped in Wave 1A.6/1A.7**, but is **completely absent from runtime execution**.

---

## 5. Reconciliation Governance Verdict

1. **UOW CLASSIFICATION:** **`CLASSIFICATION_ONLY`**  
   The classification of 80 connect, 30 pool.query, 648 client.query calls into operational categories is accurate and verified, but it is a static classification, not an enforcement proof.
2. **UNKNOWN CRITICAL DB PATHS:** **`0`**  
   Every database access pathway has been accounted for and mapped to its target Stage 1–3 remediation pattern.
3. **UOW ENFORCEMENT:** **`NOT_VERIFIED` (`DESIGNED_NOT_ENFORCED`)**  
   No Unit-of-Work boundary or tenant context injection is currently active in the application code.
4. **Stage 0 Implication:**  
   Stage 0 consists purely of database DDL (parent unique constraints, child tenant columns, foreign keys, covering indexes). It does **not require application UoW enforcement to be active**. UoW implementation is scheduled for **Stage 1 (Context Infrastructure) and Stage 3 (Service Refactoring)**. Therefore, this finding does not block Stage 0 staging execution, but must be formally recognized without overclaiming.
