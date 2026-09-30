# P0-2B Wave 1A.10R — Migration Reproducibility & DDL Lifecycle Audit

**Document Identifier:** `SEC-AUD-P02B-W1A10R-MIGRATION-REPRODUCIBILITY-20260930`  
**Document Type:** Independent Adversarial Migration & DDL Lifecycle Audit  
**Author Role:** Independent Adversarial Security Auditor  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Target Environment:** `nurseflow_enterprise_his` (PostgreSQL 16.15)  
**Date:** 2026-09-30  
**Status:** **`MIGRATION REPRODUCIBILITY = LIMITED` | `RUNNER PRIVILEGE = MISMATCH` | `MIGRATION TRACKING = ABSENT`**

---

## 1. Executive Summary

Wave 1A.10 claimed:
```text
MIGRATIONS = VERIFIED
ROLLBACK = VERIFIED
```

An adversarial inspection of repository migration sources (`077`, `078`, `079` and their `_down` counterparts), database catalog state, execution logs, and migration tooling (`scripts/execute_all_migrations.js`) reveals:
1. **Source vs Database State Distinction:** The DDL source scripts for migrations 077, 078, and 079 are structurally sound and syntactically valid. The development database catalog (`nurseflow_enterprise_his`) possesses the exact expected constraints, foreign keys, and policies.
2. **Execution Contradiction & Manual Mutation:** The Wave 1A.10 execution trace reveals that manual `ALTER POLICY ... AS PERMISSIVE` statements were executed against `encounters` and `master_patients` before migration 079 was run. Current catalog state cannot be attributed purely to an automated, hands-off pipeline.
3. **Absence of Migration Tracking Table:** NurseFlow lacks an authoritative migration tracking mechanism (e.g., `schema_migrations`, execution logs, checksum verification). Migrations are discovered via raw filesystem scanning in alphabetical order.
4. **Runner Privilege Mismatch:** `scripts/execute_all_migrations.js` reads `.env.local`, which specifies `POSTGRES_USER=nurseflow_app_user`. The application user has only DML privileges (`SELECT, INSERT, UPDATE, DELETE`) and lacks DDL privileges (`ALTER TABLE`, `CREATE POLICY`), causing the migration executor script to fail when executed under the configured runtime identity.

---

## 2. Migration 077: Parent Composite Uniqueness Audit

### 2.1 File Inspection
- **Source Migration:** `database/migrations/077_stage0_parent_composite_uniqueness.sql`
- **Down Migration:** `database/migrations/077_down_stage0_parent_composite_uniqueness.sql`
- **Target Tables:** `encounters`, `master_patients`
- **Constraint Target:** `UNIQUE (id, tenant_id)`

### 2.2 Source Logic Verification
The source file implements pre-condition validations inside a PL/pgSQL `DO $$` block:
1. Verifies that no NULL values exist in `(id, tenant_id)` for `encounters` and `master_patients`.
2. Verifies that no duplicate `(id, tenant_id)` pairs exist using `GROUP BY id, tenant_id HAVING count(*) > 1`.
3. Adds constraint `uq_encounters_id_tenant` on `encounters (id, tenant_id)`.
4. Adds constraint `uq_master_patients_id_tenant` on `master_patients (id, tenant_id)`.

Down migration `077_down` executes:
- `ALTER TABLE encounters DROP CONSTRAINT IF EXISTS uq_encounters_id_tenant;`
- `ALTER TABLE master_patients DROP CONSTRAINT IF EXISTS uq_master_patients_id_tenant;`

### 2.3 Database Catalog Empirical Verification
A read-only catalog query against `nurseflow_enterprise_his` confirms:
- `uq_encounters_id_tenant`: Type `u` (UNIQUE), columns `id, tenant_id`, present and valid.
- `uq_master_patients_id_tenant`: Type `u` (UNIQUE), columns `id, tenant_id`, present and valid.
- Null counts: `encounters` (0 nulls in id, 0 nulls in tenant_id); `master_patients` (0 nulls in id, 0 nulls in tenant_id).
- Duplicates: 0 duplicate pairs across all 5,104 encounters and 5,162 patients.

### 2.4 Separation of Proof
- **SOURCE MIGRATION 077:** `VERIFIED_FACT`
- **DATABASE STATE 077:** `VERIFIED_FACT`

---

## 3. Migration 078: Child Composite Foreign Keys Audit

### 3.1 File Inspection
- **Source Migration:** `database/migrations/078_stage0_child_composite_foreign_keys.sql`
- **Down Migration:** `database/migrations/078_down_stage0_child_composite_foreign_keys.sql`
- **Target Tables:**
  1. `medication_emar_administrations`
  2. `medication_dispense_allocations`
  3. `longitudinal_care_plans`
  4. `patient_split_invoices`
  5. `physician_diagnostic_interpretations`

### 3.2 Dynamic Tenant Default & Session Coupling
Lines 69–70 of migration 078 define:
```sql
ALTER TABLE <tbl> ALTER COLUMN tenant_id 
SET DEFAULT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
```

**Adversarial Question:** Does this create a dangerous coupling between migration execution and application tenant session state? Can migration 078 be deterministically replayed by migration infrastructure without application tenant context?

**Empirical Analysis:**
1. **At DDL Execution Time:** PostgreSQL parses and stores column default expressions as AST trees without evaluating them during `ALTER TABLE ... SET DEFAULT`. The execution of the migration itself does **NOT** require `app.current_tenant_id` to be defined.
2. **Backfill Step:** If existing rows exist without a `tenant_id`, line 48–52 backfills from `encounters`:
   ```sql
   UPDATE <tbl> c SET tenant_id = e.tenant_id FROM encounters e WHERE c.encounter_id = e.id;
   ```
   This backfill derives tenant ownership strictly from the referenced encounter entity, not from the session GUC.
3. **At Runtime DML Time:** If an application insert does not provide `tenant_id`, the expression `NULLIF(current_setting('app.current_tenant_id', true), '')::uuid` evaluates to `NULL` (if unconfigured). Because `tenant_id` is defined as `NOT NULL`, PostgreSQL triggers SQLSTATE `23502` (`null value in column "tenant_id" violates not-null constraint`). This is fail-closed.
4. **Replay Verdict:** Migration 078 **CAN** be deterministically replayed by administrative migration infrastructure without setting an application tenant context, provided child records have valid parent `encounter_id` mappings.

### 3.3 Foreign Key & Index Verification
Catalog inspection confirms all 10 composite foreign keys are active in `nurseflow_enterprise_his`:
- `fk_medication_emar_administrations_enc_tenant` & `_pat_tenant`
- `fk_medication_dispense_allocations_enc_tenant` & `_pat_tenant`
- `fk_longitudinal_care_plans_enc_tenant` & `_pat_tenant`
- `fk_patient_split_invoices_enc_tenant` & `_pat_tenant`
- `fk_physician_diagnostic_interpretations_enc_tenant` & `_pat_tenant`

Covering composite indexes (`idx_<tbl>_tenant_id`, `idx_<tbl>_enc_tenant`, `idx_<tbl>_pat_tenant`) exist on all 5 tables.

### 3.4 Separation of Proof
- **SOURCE MIGRATION 078:** `VERIFIED_FACT`
- **DATABASE STATE 078:** `VERIFIED_FACT`

---

## 4. Existing Data / Backfill Safety Verification

Empirical catalog inspection of the 5 child tables in `nurseflow_enterprise_his`:

| Table | Row Count | Tenant A Rows | Tenant B Rows | `tenant_id` NULLs | `encounter_id` NULLs | Orphan Risk | Cross-Tenant Risk |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `medication_emar_administrations` | 0 | 0 | 0 | 0 | 0 | ZERO | ZERO |
| `medication_dispense_allocations` | 0 | 0 | 0 | 0 | 0 | ZERO | ZERO |
| `longitudinal_care_plans` | 2 | 1 | 1 | 0 | 0 | ZERO | ZERO |
| `patient_split_invoices` | 0 | 0 | 0 | 0 | 0 | ZERO | ZERO |
| `physician_diagnostic_interpretations` | 0 | 0 | 0 | 0 | 0 | ZERO | ZERO |

**Findings:**
- 4 of the 5 child tables had 0 rows prior to migration; backfill had zero orphan risk.
- `longitudinal_care_plans` had 2 rows (injected during 1A.9 lab testing); both rows have valid `tenant_id` matching their parent encounters and patients.
- Zero orphaned or cross-tenant records exist.

---

## 5. Migration 079: Purge & Unified Default-Deny RLS

### 5.1 Source Scope & Structure
Migration 079 targets 31 tables:
- **10 Core Clinical Tables:** `clinical_orders`, `encounters`, `master_patients`, `safety_decision_registry`, `universal_audit_logs`, `longitudinal_care_plans`, `medication_emar_administrations`, `medication_dispense_allocations`, `patient_split_invoices`, `physician_diagnostic_interpretations`.
- **21 Zero-Policy Domain Tables:** Complete inventory from Wave 1A.8 blackout review.

### 5.2 Purge of Fail-Open Legacy Policies
Migration 079 explicitly drops:
1. `tenant_isolation_orders` on `clinical_orders`
2. `tenant_isolation_encounters` on `encounters`
3. `tenant_isolation_patients` on `master_patients`
4. `tenant_safety_isolation_policy` on `safety_decision_registry`
5. `tenant_audit_isolation_policy` on `universal_audit_logs`

It then enables and forces RLS on all 31 tables, creating a single `AS PERMISSIVE` policy:
```sql
CREATE POLICY tenant_isolation_<tbl> ON <tbl>
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```

### 5.3 Down Migration Asymmetry (Rollback Inadequacy)
In `079_down_stage0_purge_legacy_policies_and_enforce_default_deny.sql`:
- The script executes `DROP POLICY IF EXISTS tenant_isolation_<tbl> ON <tbl>;` across all 31 tables.
- **CRITICAL DEFECT:** It does **NOT** execute `ALTER TABLE <tbl> DISABLE ROW LEVEL SECURITY;`.
- When RLS remains enabled with zero policies on a table, PostgreSQL applies **universal default deny** to all non-superusers. All application queries return 0 rows or throw access violations.
- Furthermore, `079_down` does not restore the original legacy policies. Therefore, executing `079_down` does not return the database to its pre-079 baseline state; it leaves the application in an unrecoverable blackout state.

---

## 6. Manual Policy Mutation Analysis

The execution trace of Wave 1A.10 records:
```sql
ALTER POLICY tenant_isolation_encounters ON encounters AS PERMISSIVE;
ALTER POLICY tenant_isolation_master_patients ON master_patients AS PERMISSIVE;
```

### Adversarial Findings:
1. **Reason for Manual Alteration:** In Wave 1A.9, policies on `encounters` and `master_patients` were created or altered `AS RESTRICTIVE`. In PostgreSQL, a RESTRICTIVE policy requires at least one PERMISSIVE policy to pass; without any PERMISSIVE policy, default-deny blocks all queries. During initial manual testing in Wave 1A.10, queries failed, prompting the manual `ALTER POLICY` to `PERMISSIVE`.
2. **Subsequent Migration Application:** Migration 079 does `DROP POLICY IF EXISTS` and recreates `tenant_isolation_<tbl>` with `AS PERMISSIVE`.
3. **Attribution:** While migration 079's DDL code matches current catalog state, the fact that manual hotfixing occurred directly on `nurseflow_enterprise_his` violates strict deployment hygiene and prevents declaring the development database "untouched."

---

## 7. Migration Tooling & Privilege Mismatch Audit

### 7.1 Analysis of `scripts/execute_all_migrations.js`
1. **Absence of Tracking Table:** The script reads all files from `database/migrations/` matching `*.sql` (excluding `_down`), sorts them alphabetically, and runs them via `psql`. There is **no table** tracking which migrations have been applied, when, or with what checksum. If executed on an existing database, it will re-execute all 79 migrations from scratch, causing DDL errors on non-idempotent scripts.
2. **Runner Privilege Mismatch:**
   - The script loads `.env.local`:
     ```javascript
     const user = process.env.POSTGRES_USER || 'postgres';
     ```
   - In `.env.local`, `POSTGRES_USER` is configured as `nurseflow_app_user`.
   - `nurseflow_app_user` lacks `ALTER TABLE`, `CREATE CONSTRAINT`, and `CREATE POLICY` privileges on tables owned by `postgres`.
   - Running `npm run db:migrate` or `node scripts/execute_all_migrations.js` will fail with PostgreSQL error `42501 (must be owner of table...)`.
   - Therefore, the repository lacks an automated migration execution pipeline configured with appropriate migration administrative privileges.

---

## 8. Summary Table of Migration Controls

| Item | Control | Status | Independent Findings |
| :--- | :--- | :---: | :--- |
| **077** | Parent Composite UNIQUE | `VERIFIED_FACT` | Both constraints active, 0 nulls, 0 duplicate pairs. |
| **077_down** | Rollback Parent UNIQUE | `VERIFIED_FACT` | Clean drops of constraints. |
| **078** | Child Composite FKs | `VERIFIED_FACT` | 10 FK constraints and 15 indexes verified active. |
| **078 Replay** | Deterministic Replay | `VERIFIED_FACT` | DDL parses without GUC session context. |
| **078_down** | Rollback Child FKs | `VERIFIED_WITH_LIMITATION` | Drops FKs and columns; requires 079_down executed first. |
| **079** | Purge & Default-Deny | `VERIFIED_FACT` | 31 tables verified with PERMISSIVE fail-closed policies. |
| **079_down** | Rollback RLS Policies | `VERIFIED_WITH_LIMITATION` | Drops policies but leaves RLS ENABLED (causes total blackout). |
| **Runner** | Migration Executor Script | `NOT_VERIFIED` | Runner uses unprivileged `nurseflow_app_user`; no tracking table. |
| **Reproducibility**| End-to-End Clean Replay | `LIMITED` | Manual ALTER history; runner privilege mismatch. |
