# P0-2B Wave 1A.11R — Migration Authority, Tracking Engine & Rollback Verification

**Document Identifier:** `SEC-AUD-P02B-W1A11R-MIGRATION-20261001`  
**Document Type:** Migration Architecture, Authority Separation, Catalog Tracking & Rollback Audit  
**Author Role:** Independent Adversarial Security Auditor & Database Reliability Engineer  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Current Branch:** `feature/security-foundation-wave1a10`  
**Status:** **`HIGH-02 REMEDIATED (TRACKING VERIFIED)` | `REPRODUCIBILITY = LIMITED` | `ROLLBACK = LAB_ONLY`**

---

## 1. Executive Summary

In Wave 1A.10R, two severe migration weaknesses were flagged:
1. `scripts/execute_all_migrations.js` attempted to run under `nurseflow_app_user`, which lacked table ownership and DDL privileges.
2. The repository lacked an authoritative migration tracking table (`schema_migrations`), scanning raw `.sql` files without checksums or re-run protection.
3. In migration `079_down`, dropping policies without disabling RLS caused an unrecoverable default-deny blackout.

In Wave 1A.11, the engineering team overhauled the migration runner, created `schema_migrations`, separated migration credentials, and remediated `079_down`.

This independent audit verified the implementation and catalog state, finding:
- **`MIGRATION AUTHORITY SEPARATION = VERIFIED_FACT`**: Application runtime role (`nurseflow_app_user`) has strictly no DDL permissions; migration scripts require administrative or dedicated migration credentials.
- **`MIGRATION TRACKING ENGINE = VERIFIED_FACT`**: `schema_migrations` table exists with 79 recorded entries, SHA-256 hashes, execution times, and status flags.
- **`MIGRATION REPRODUCIBILITY = LIMITED`**: Clean-slate migration execution from 001 to 079 on an empty database was not demonstrated in Wave 1A.11; the existing development database was baselined without replay proof.
- **`ROLLBACK LIFECYCLE = LAB_ONLY`**: Rollback script `079_down` correctly disables RLS and removes FORCE RLS, achieving 100% parity in an isolated disposable lab, but has not been proven on primary databases.

---

## 2. Migration Role Separation & Privilege Matrix

Inspection of the PostgreSQL system catalogs (`pg_roles`, `pg_tables`, `information_schema.role_table_grants`) establishes the active privilege boundary:

| Database Role | Login Allowed | Superuser | Bypass RLS | DDL (`ALTER`, `DROP`, `CREATE POLICY`) | DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) | Table Ownership |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`nurseflow_app_user`** | `true` | `false` | `false` | **DENIED** | **GRANTED** (Subject to RLS) | `false` (0 tables owned) |
| **`nurseflow_migration`** | `true` | `false` | `false` | **GRANTED** (When granted role or admin) | **GRANTED** | `false` |
| **`nurseflow_worker`** | `true` | `false` | `false` | **DENIED** | **GRANTED** (Worker tables) | `false` |
| **`postgres`** (Admin) | `true` | `true` | `true` | **FULL DDL** | **FULL DML** | **Owner of all 214 tables** |

### Runner Credential Resolution (`scripts/execute_all_migrations.js`):
```javascript
const user = process.env.MIGRATION_USER || 
             process.env.POSTGRES_MIGRATION_USER || 
             process.env.POSTGRES_ADMIN_USER || 
             'postgres';
```
The runner explicitly decouples from `process.env.POSTGRES_USER` (`nurseflow_app_user`). The application runtime user cannot be used to run DDL migrations, preventing dangerous privilege escalation in the application container.

---

## 3. Authoritative Tracking Engine (`schema_migrations`)

### 3.1 Catalog Definition
The table is defined in PostgreSQL catalog:
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  migration_id VARCHAR(255) PRIMARY KEY,
  checksum VARCHAR(64) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  execution_time_ms INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'APPLIED'
);
```

### 3.2 Live Catalog Query Results
A direct read-only query against `nurseflow_enterprise_his` confirmed:
- Total Recorded Migrations: **79 entries**
- Minimum ID: `001_master_patients.sql`
- Maximum ID: `079_stage0_purge_legacy_policies_and_enforce_default_deny.sql`
- Checksum Format: Valid 64-character hexadecimal SHA-256 strings for every record.
- Status: 100% `APPLIED`.

Sample catalog records:
```json
[
  {
    "migration_id": "079_stage0_purge_legacy_policies_and_enforce_default_deny.sql",
    "checksum": "830d3deaf38312c02ba09e840bad89ac350b650242eaa36323c198d7b8b20ea5",
    "applied_at": "2026-09-30T08:25:59.019Z",
    "status": "APPLIED"
  },
  {
    "migration_id": "078_stage0_child_composite_foreign_keys.sql",
    "checksum": "7cd5502aeb9431d30cee4a15f27a67857cbea6105769b20ecd14a8b04f65ebcf",
    "applied_at": "2026-09-30T08:25:59.017Z",
    "status": "APPLIED"
  },
  {
    "migration_id": "077_stage0_parent_composite_uniqueness.sql",
    "checksum": "590e60bd3a54933c6a74fde4e14f46ff64ed6d3333ed8e979631bb2814ce9794",
    "applied_at": "2026-09-30T08:25:58.838Z",
    "status": "APPLIED"
  }
]
```

### 3.3 Engine Properties Verified
1. **Deterministic Ordering:** Uses `fs.readdirSync(...).sort()` to guarantee numeric file prefix sequence (`001` through `079`).
2. **Tamper Detection:** Before running any file, compares current file SHA-256 against stored hash, raising `CHECKSUM_MISMATCH` if modified.
3. **Idempotency:** Already applied files are detected in `appliedMap` and skipped (`⏭️ SKIPPED (Already applied)`).
4. **Partial Failure Behavior:** Employs `psql -v ON_ERROR_STOP=1`. If execution errors out, records `status = 'FAILED'` and issues `break` to halt the pipeline immediately.

---

## 4. Evaluation of Migration Reproducibility

**Critical Audit Question:**
> *Can a clean disposable database deterministically reproduce the repository state using the migration system without manual SQL?*

**Independent Audit Finding:** **`MIGRATION REPRODUCIBILITY = LIMITED`**

### Evidence & Rationale:
In `scripts/execute_all_migrations.js`:
```javascript
const tableCountRes = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';");
const publicTableCount = parseInt(tableCountRes.rows[0].count, 10);
const shouldAutoBaseline = (appliedMap.size === 0 && publicTableCount > 50) || isBaselineMode;
```
When Wave 1A.11 executed `execute_all_migrations.js` against `nurseflow_enterprise_his`, the database already had 214 tables. The script engaged `shouldAutoBaseline = true`, populating `schema_migrations` with 79 records **without executing the underlying DDL files (001 through 079)**.

While Wave 1A.8/1A.9 verified migrations 001 to 075 on a disposable lab, **an end-to-end clean-slate execution from 001 to 079 on an empty PostgreSQL database was never demonstrated in Wave 1A.11**.

Until an automated CI runner builds a completely fresh database from `001` to `079` without errors, migration reproducibility cannot be classified as `VERIFIED_FACT`. It is properly classified as **`LIMITED`**.

---

## 5. Migration 079 Rollback Lifecycle Verification

### 5.1 Defect Remediation in `079_down`
In Wave 1A.10R, `079_down` dropped policies but omitted disabling RLS, causing universal default-deny on 21 zero-policy tables.

In Wave 1A.11, `database/migrations/079_down_stage0_purge_legacy_policies_and_enforce_default_deny.sql` was remediated:
1. Drops unified default-deny policies from all 31 tables (`tenant_isolation_<tbl>`).
2. Explicitly executes `ALTER TABLE <tbl> NO FORCE ROW LEVEL SECURITY;` and `ALTER TABLE <tbl> DISABLE ROW LEVEL SECURITY;` across the 21 zero-policy tables and 5 child tables.
3. Restores the 5 baseline permissive policies on core clinical tables (`clinical_orders`, `encounters`, `master_patients`, `safety_decision_registry`, `universal_audit_logs`).

### 5.2 Lab Lifecycle Verification Drill
The script `scratch/verify_rollback_lifecycle.js` executed the complete cycle on disposable database `nurseflow_disposable_rollback_drill`:
```text
Baseline Pre-077 (0 Stage 0 constraints)
   ↓ Apply 077, 078, 079
Target Stage 0 (Parent UNIQUE + 10 Child FKs + 31 Default-Deny Policies)
   ↓ Apply 079_down, 078_down, 077_down
Baseline Restored (100% catalog parity, 0 remaining Stage 0 constraints, RLS disabled on unconstrained tables)
```

### 5.3 Classification: `LAB_ONLY`
Because the drill was executed only in an ephemeral database and dropped immediately (`DROP DATABASE nurseflow_disposable_rollback_drill;`), and has not been executed on the primary development environment or integrated into automated CI tests:
**ROLLBACK STATUS = `LAB_ONLY`**

---

## 6. Security Verdict

- **Migration Authority Separation:** **`VERIFIED_FACT`**
- **Migration Tracking (`schema_migrations`):** **`VERIFIED_FACT`**
- **Migration Reproducibility:** **`LIMITED`** (Replay on clean DB unproven in 1A.11)
- **Rollback Lifecycle:** **`LAB_ONLY`** (Proven in disposable harness only)
