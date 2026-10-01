# P0-2B WAVE 1A.11R.1 MIGRATION AUTHORITY & REPRODUCIBILITY AUDIT

**Audit Date:** 2026-10-01  
**Auditor:** Independent Security Auditor (Antigravity AI)  
**Standard:** Enterprise HIS Strict Read-Only Adversarial Audit  
**Target Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Branch:** `feature/security-foundation-wave1a10`  

---

## 1. Executive Summary

This audit assesses the migration runner (`scripts/execute_all_migrations.js`), the migration catalog tracking table (`schema_migrations`), role separation, checksum tamper detection, and the critical question of **clean-slate migration reproducibility**.

| Audit Vector | Standard Requirement | Actual Empirical Finding | Status |
|---|---|---|---|
| Migration Execution Role | Dedicated DDL Authority (`nurseflow_migration`) | Configured to fallback: `MIGRATION_USER` -> `POSTGRES_MIGRATION_USER` -> `postgres` | `VERIFIED_WITH_LIMITATION` |
| Runtime App User DDL | Denied DDL on public tables | Runtime role `nurseflow_app_user` cannot create/alter tables | `VERIFIED_FACT` |
| Authoritative Tracking | Database table with checksums & timestamps | `schema_migrations` contains 79 records with SHA-256 hashes | `VERIFIED_FACT` |
| **Creation Mode** | Actual DDL Replay (001 -> 079) | **Baseline Insertion (`shouldAutoBaseline = true`)** | **VERIFIED_FACT (BASELINE)** |
| **Clean-Slate Replay** | Verified from empty DB on 001 -> 079 | **Never demonstrated; no replay evidence exists** | **NOT_VERIFIED** |
| Checksum Tamper Guard | Rejection or warning on modified SQL | Warning logged: `CHECKSUM_MISMATCH` | `VERIFIED_FACT` |
| Rollback Execution | Tested in active dev database | Tested exclusively on disposable test database | `LAB_ONLY` |

---

## 2. Tracking Table Architecture & Baseline Discovery

Inspection of the migration runner source code (`scripts/execute_all_migrations.js`, lines 99-146) conclusively answers the primary audit question regarding how the 79 migrations were tracked:

```javascript
// scripts/execute_all_migrations.js
const tableCountRes = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';");
const publicTableCount = parseInt(tableCountRes.rows[0].count, 10);
const shouldAutoBaseline = (appliedMap.size === 0 && publicTableCount > 50) || isBaselineMode;

if (shouldAutoBaseline) {
  // Record baseline entry without re-executing DDL against active database
  await client.query(`
    INSERT INTO schema_migrations (migration_id, checksum, applied_at, execution_time_ms, status)
    VALUES ($1, $2, clock_timestamp(), 0, 'APPLIED')
    ON CONFLICT (migration_id) DO UPDATE SET checksum = EXCLUDED.checksum;
  `, [file, checksum]);
  console.log(`  [${file}] ... 📌 BASELINED`);
  continue;
}
```

### Direct Evidence:
1. When Wave 1A.11 ran `scripts/execute_all_migrations.js`, the development database already contained 214 tables (`publicTableCount > 50`).
2. The migration engine entered `shouldAutoBaseline = true`.
3. It performed a synthetic metadata insertion into `schema_migrations` for all 79 migrations, setting `execution_time_ms = 0`.
4. **Conclusion:** The claim that 79 migrations were "replayed" is **FALSE**. The migrations were **BASELINED**.

---

## 3. Clean-Slate Bootstrap Feasibility Analysis

Can an empty database be bootstrapped from scratch using migrations `001` through `079`?

### Forensic Blockers Identified in Migration Scripts:
1. **Migration Sequence Coupling:**
   - Early migrations (e.g., `001_initial_schema.sql`, `010_rls_policies.sql`, `012_departments.sql`) create initial tables and legacy RLS policies.
   - Migration `077` and `078` expect specific table structures (`encounters`, `master_patients`, and 5 child tables) to already exist with specific foreign key topologies.
   - Migration `079` drops legacy policies by specific names (`tenant_isolation_orders`, `tenant_isolation_encounters`, `tenant_safety_isolation_policy`, etc.). If those legacy policies were not created by earlier migrations under those exact names, `DROP POLICY IF EXISTS` silently skips them, but subsequent `CREATE POLICY` creates duplicates if alternative policy names existed.
2. **Missing Seed Dependencies:**
   - Several migrations assume seed tenant IDs (`00000000-0000-0000-0000-00000001`) already exist in `tenants` or `hospitals`.
3. **No Automated Clean-Slate Pipeline:**
   - There is no automated CI script or disposable runner that drops the database, runs `001` through `079` sequentially, and validates schema parity against the active catalog.
4. **Authoritative Status:** **`NOT_VERIFIED`**.

---

## 4. Migration 077, 078, and 079 Detailed Catalog Analysis

### Migration 077: Parent Composite Uniqueness
- **Constraint 1:** `uq_encounters_id_tenant` on `encounters (id, tenant_id)`.
  - Catalog Status: Active in `pg_constraint`.
  - Type: `UNIQUE`.
  - Existing duplicates: 0.
  - NULL tenant_id: 0.
- **Constraint 2:** `uq_master_patients_id_tenant` on `master_patients (id, tenant_id)`.
  - Catalog Status: Active in `pg_constraint`.
  - Type: `UNIQUE`.
  - Existing duplicates: 0.
  - NULL tenant_id: 0.

### Migration 078: Child Composite Foreign Keys
Applies 10 composite foreign keys across 5 clinical child tables:
1. `longitudinal_care_plans`:
   - `fk_longitudinal_care_plans_enc_tenant`: `(encounter_id, tenant_id) REFERENCES encounters(id, tenant_id)`
   - `fk_longitudinal_care_plans_pat_tenant`: `(patient_id, tenant_id) REFERENCES master_patients(id, tenant_id)`
2. `medication_emar_administrations`:
   - `fk_medication_emar_administrations_enc_tenant`
   - `fk_medication_emar_administrations_pat_tenant`
3. `medication_dispense_allocations`:
   - `fk_medication_dispense_allocations_enc_tenant`
   - `fk_medication_dispense_allocations_pat_tenant`
4. `patient_split_invoices`:
   - `fk_patient_split_invoices_enc_tenant`
   - `fk_patient_split_invoices_pat_tenant`
5. `physician_diagnostic_interpretations`:
   - `fk_physician_diagnostic_interpretations_enc_tenant`
   - `fk_physician_diagnostic_interpretations_pat_tenant`

**Referential Integrity Verification:**
- Cross-tenant injection attempt (Tenant A encounter with Tenant B tenant_id): **BLOCKED by PostgreSQL Engine with SQLSTATE 23503 (`foreign_key_violation`)**.
- Orphan child rows in current catalog: **0**.

### Migration 079: Purge Legacy Policies & Enforce Default-Deny
- **Target Tables:** 31 tables (10 core/child tables + 21 zero-policy tables).
- **RLS Configuration:**
  - `relrowsecurity = true` (Row Level Security Enabled)
  - `relforcerowsecurity = true` (FORCE Row Level Security Enabled for table owners)
- **Policy Syntax:**
  ```sql
  CREATE POLICY tenant_isolation_<tbl> ON <tbl>
    AS PERMISSIVE FOR ALL TO public
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  ```
- **Fail-Open Elimination:** All 31 policies lack `OR tenant_id IS NULL`. When GUC `app.current_tenant_id` is unset, `NULLIF('', '')` yields `NULL`, resulting in `tenant_id = NULL` (`FALSE`), enforcing strict default-deny.

---

## 5. Rollback Migration Forensics (`079_down`)

Analysis of `database/migrations/079_down_stage0_purge_legacy_policies_and_enforce_default_deny.sql`:
1. Drops `tenant_isolation_<tbl>` from all 31 tables.
2. Disables RLS and removes `FORCE ROW LEVEL SECURITY` on 26 tables (21 zero-policy + 5 child tables).
3. **Re-introduces Legacy Fail-Open Policies:**
   ```sql
   CREATE POLICY tenant_isolation_encounters ON encounters
     AS PERMISSIVE FOR ALL TO public
     USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR tenant_id IS NULL)
     WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR tenant_id IS NULL);
   ```
4. **Security Assessment:** Executing `079_down` successfully rolls back the schema to pre-079 catalog state, but **re-exposes the application to the critical fail-open vulnerability (`OR tenant_id IS NULL`)** that Wave 1A.9 was commissioned to eliminate.
5. **Execution Scope:** Verified solely inside disposable laboratory database `nurseflow_disposable_rollback_drill`. Never executed against active development database (`LAB_ONLY`).

---

## 6. Findings & Blocker Summary

1. `schema_migrations` was established via **metadata baselining**, not actual replay.
2. Clean-slate reproducibility from an empty database is **`NOT_VERIFIED`**.
3. Foreign key constraints (077/078) and RLS default-deny policies (079) are active and mechanically sound in the PostgreSQL catalog.
4. Rollback capability exists but re-introduces fail-open policies on core clinical entities.
