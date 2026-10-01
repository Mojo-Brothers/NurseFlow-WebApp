# P0-2B WAVE 1B.0T — MIGRATION PRIVILEGE & AUTHORITY MATRIX

**Audit Date:** 2026-10-01  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Branch:** `feature/security-foundation-wave1a10`  
**Classification:** `AUTHORITATIVE_SECURITY_MATRIX`  
**Standard:** Enterprise HIS Least Privilege & DDL Governance  

---

## 1. Executive Summary

This document establishes the authoritative PostgreSQL privilege matrix governing database schema migrations for NurseFlow Enterprise HIS.

Prior to Wave 1B.0T, the database migration runner (`scripts/execute_all_migrations.js`) operated under an unsafe fallback to the `postgres` superuser whenever dedicated credentials were omitted. Concurrently, the dedicated migration role `nurseflow_migration` existed in the catalog as a `DESIGN_ONLY` placeholder possessing zero table grants, zero table ownerships, and no `CREATE` privilege on schema `public`.

Wave 1B.0T establishes explicit migration authority boundaries, enforces fail-closed credential validation, and defines the minimum required privilege surface for database migrations without granting dangerous cluster-level superuser or bypass attributes.

---

## 2. Catalog Role Inspection (`nurseflow_migration` vs `nurseflow_app_user`)

A direct forensic query of `pg_roles`, `pg_auth_members`, and schema privileges on the live database cluster (`nurseflow_enterprise_his`) yields:

| Attribute | `nurseflow_app_user` (Runtime DML) | `nurseflow_migration` (Migration Role) | `postgres` (Bootstrap / DBA) | HIS Architectural Requirement |
| :--- | :---: | :---: | :---: | :--- |
| `rolcanlogin` | `true` | `true` | `true` | Role can authenticate via TCP |
| `rolsuper` | **`false`** | **`false`** | `true` | Superuser forbidden for application & migration |
| `rolbypassrls` | **`false`** | **`false`** | `true` | Bypass RLS forbidden |
| `rolcreaterole` | **`false`** | `true` | `true` | Administrative privilege |
| `rolcreatedb` | **`false`** | `true` | `true` | Administrative privilege |
| Schema `public` USAGE | `true` | `true` | `true` | Required for namespace lookup |
| Schema `public` CREATE | **`false`** | **`false`** | `true` | Required for DDL object creation |
| Table Ownership (Public) | **0 tables** | **0 tables** | **214 tables** | Postgres currently owns all legacy tables |
| Table DML Grants | `SELECT, INSERT, UPDATE, DELETE` (214) | **0 grants** | `ALL` (Owner) | Application has DML; Migration has 0 DML |
| Table `TRUNCATE` Grants | **0 grants** (`REVOKED`) | **0 grants** | `ALL` (Owner) | TRUNCATE denied to runtime |

---

## 3. Migration Operation Privilege Matrix

Across the 82 repository migrations (001 through 082), the DDL operations and their PostgreSQL privilege requirements are mapped below:

| Migration Operation | Occurrences | Required PostgreSQL Privilege | Current `nurseflow_migration` State | Required Change | Blast Radius / Security Impact |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `CREATE TABLE` | 66 files | `CREATE` on schema `public` | `has_schema_privilege = false` | `GRANT CREATE ON SCHEMA public TO nurseflow_migration;` | **Controlled:** Permits creating new tables owned by `nurseflow_migration`. |
| `ALTER TABLE` | 41 files | Table Owner or Superuser | Owns 0 tables | Future ownership transfer or execution via designated migration authority | **Critical:** Must not grant SUPERUSER. Altering existing tables requires ownership alignment. |
| `CREATE INDEX` | 68 files | Table Owner or Superuser | Owns 0 tables | Requires table ownership | **Low:** Index creation does not bypass RLS or alter clinical permissions. |
| `DROP INDEX` | 1 file | Index Owner or Superuser | Owns 0 indexes | Requires index ownership | **Low:** Confined to specific index. |
| `CREATE FUNCTION` | 6 files | `CREATE` on schema `public` | `has_schema_privilege = false` | `GRANT CREATE ON SCHEMA public TO nurseflow_migration;` | **Medium:** Functions must enforce `SET search_path = pg_catalog, public`. |
| `CREATE TRIGGER` | 5 files | Table Owner or Superuser | Owns 0 tables | Requires table ownership | **Medium:** Triggers execute within table transactions. |
| `ENABLE / FORCE RLS`| 20 files | Table Owner or Superuser | Owns 0 tables | Requires table ownership | **Security Positive:** Enforces default-deny row security. |
| `CREATE / DROP POLICY`| 22 files | Table Owner or Superuser | Owns 0 tables | Requires table ownership | **Security Positive:** Configures tenant boundaries. |
| `CREATE EXTENSION` | 3 files | PostgreSQL `SUPERUSER` | `rolsuper = false` | **Exempt:** Pre-provisioned during database bootstrap by DBA | **Zero:** `pgcrypto` & `uuid-ossp` provisioned once; migrations use `IF NOT EXISTS`. |
| `DML Backfill` | 22 files | `INSERT`, `UPDATE` on tables | 0 table grants | Explicit DML grants or owner privileges | **High:** Clinical seed data must be tenant-isolated. |

---

## 4. Minimum Authority Architecture

Under the target HIS architecture:

```text
       postgres (Operational DBA / Cluster Bootstrap Authority)
          │  Pre-provisions DB, Extensions (pgcrypto, uuid-ossp),
          │  and creates baseline roles.
          ▼
   nurseflow_migration (Dedicated Schema & Migration Authority)
          │  rolsuper = false, rolbypassrls = false
          │  GRANT USAGE, CREATE ON SCHEMA public
          │  Owns newly provisioned tables, indexes, functions, triggers
          ▼
   nurseflow_app_user (Runtime Application User)
          │  rolsuper = false, rolbypassrls = false, NO DDL
          │  SELECT, INSERT, UPDATE, DELETE only
          │  TRUNCATE strictly DENIED (0 table grants)
          │  Subject to 100% RLS default-deny enforcement
```

### Table Ownership Governance Decision:
- **No Indiscriminate Ownership Transfer:** All 214 legacy tables currently owned by `postgres` were NOT subjected to a blind `ALTER TABLE ... OWNER TO nurseflow_migration;` in this wave.
- **Rationale:** A blind mass ownership transfer without audited dependency analysis risks breaking existing background tasks or reporting services. Ownership transfer will be executed per-domain as each domain is refactored into the Unit of Work (UoW) transaction boundary in Wave 1B.1+.

---

## 5. Verification Status

- **Matrix Status:** **`VERIFIED_FACT`**
- **Catalog Inspection:** **`VERIFIED_FACT`**
- **Role Separation:** **`VERIFIED_FACT`** (`nurseflow_app_user` ≠ `nurseflow_migration` ≠ `postgres`)
