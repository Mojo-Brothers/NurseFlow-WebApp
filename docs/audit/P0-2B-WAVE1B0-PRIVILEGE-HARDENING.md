# P0-2B WAVE 1B.0 — RUNTIME PRIVILEGE HARDENING REPORT

**Audit Date:** 2026-10-01  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Branch:** `feature/security-foundation-wave1a10`  
**Migration ID:** `080_stage0_runtime_privilege_hardening.sql`  
**Author:** Antigravity Autonomous Security Engineer  

---

## 1. Executive Summary

During the P0-2B Wave 1A.11R.1 Adversarial Audit, an architectural privilege defect was verified in the active PostgreSQL runtime environment: the application runtime role `nurseflow_app_user` held the `TRUNCATE` privilege across 212 public tables. For an application database user handling electronic health records (EHR) and clinical encounters, possessing `TRUNCATE` constitutes an unacceptable blast-radius hazard, allowing instantaneous and unlogged mass erasure of clinical tables.

In Wave 1B.0, Migration `080_stage0_runtime_privilege_hardening.sql` was authored and executed. It systematically stripped the `TRUNCATE` grant across all existing and future public tables while strictly preserving legitimate DML operations (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `REFERENCES`, `TRIGGER`).

Post-migration catalog verification and automated destructive testing confirm:
- `TRUNCATE` grants for `nurseflow_app_user`: **0** (reduced from 212).
- Attempted `TRUNCATE` by runtime role: **FAILS CLOSED** with `SQLSTATE 42501 (permission denied)`.
- Legitimate DML operations: **100% PRESERVED** across all 214 application tables.

---

## 2. Root Cause & Catalog Forensics

### 2.1 Catalog Inspection Pre-Migration
Before altering privileges, a catalog inspection query against `pg_roles`, `pg_class`, and `information_schema.role_table_grants` was executed to determine the exact origin of the grant:

```sql
SELECT grantee, privilege_type, COUNT(*) 
FROM information_schema.role_table_grants 
WHERE grantee = 'nurseflow_app_user' 
GROUP BY grantee, privilege_type;
```

**Pre-Migration Grantee Distribution:**
| Privilege Type | Grant Count | Status |
| :--- | :--- | :--- |
| `SELECT` | 214 | Preserved |
| `INSERT` | 214 | Preserved |
| `UPDATE` | 214 | Preserved |
| `DELETE` | 214 | Preserved |
| `REFERENCES` | 214 | Preserved |
| `TRIGGER` | 214 | Preserved |
| `TRUNCATE` | **212** | **DEFECTIVE (HIGH RISK)** |

### 2.2 Derivation Mechanism
Inspection of `pg_class.relacl` confirmed that `TRUNCATE` was **not** inherited through role memberships (querying `pg_auth_members` returned 0 parent roles for `nurseflow_app_user`). Rather, it was directly granted at the table level (`nurseflow_app_user=arwdDxt/postgres`) via legacy bootstrap scripts executing:
```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nurseflow_app_user;
```
In PostgreSQL ACL notation, `D` denotes `TRUNCATE`. The role does not own the tables (all tables are owned by `postgres`), so stripping `TRUNCATE` does not conflict with table ownership semantics.

---

## 3. Migration Architecture & Implementation

### 3.1 Targeted Remediation (`080_stage0_runtime_privilege_hardening.sql`)
The migration strictly avoids indiscriminate `REVOKE ALL`. It revokes only `TRUNCATE` and locks down default privileges for any newly created tables:

```sql
-- Revoke TRUNCATE on all existing public tables
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM nurseflow_app_user;

-- Revoke TRUNCATE from default privileges for future tables created by postgres
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE ON TABLES FROM nurseflow_app_user;
```

### 3.2 Rollback Architecture & Security Governance (`080_down_stage0_runtime_privilege_hardening.sql`)
Per P0-2B Security Rule #9, a database rollback must not silently downgrade the system into a known insecure state. Restoring `TRUNCATE` on production clinical tables is a severe safety regression.

The down migration explicitly documents the security governance condition:
```sql
-- DOWN MIGRATION: 080_down_stage0_runtime_privilege_hardening.sql
-- NOTICE: Re-granting TRUNCATE to the runtime application user weakens security.
-- GOVERNANCE: ROLLBACK_REQUIRES_CONTROLLED_SECURITY_REMEDIATION.
GRANT TRUNCATE ON ALL TABLES IN SCHEMA public TO nurseflow_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT TRUNCATE ON TABLES TO nurseflow_app_user;
```

---

## 4. Verification Evidence

### 4.1 Post-Migration Catalog State
A direct runtime query against `information_schema.role_table_grants` on the active database `nurseflow_enterprise_his`:
```json
{
  "grantee": "nurseflow_app_user",
  "grants": {
    "SELECT": 214,
    "INSERT": 214,
    "UPDATE": 214,
    "DELETE": 214,
    "REFERENCES": 214,
    "TRIGGER": 214,
    "TRUNCATE": 0
  }
}
```

### 4.2 Destructive Behavior & Runtime DML Tests
Automated tests executed in `tests/p02b_wave1b0_security_containment.test.js`:
- **PRIV-01**: Runtime role is confirmed as non-superuser (`rolsuper = false`). -> **PASS**
- **PRIV-02**: Runtime role privileges confirmed: `rolbypassrls = false`, `rolcreaterole = false`, `rolcreatedb = false`. -> **PASS**
- **PRIV-03**: Destructive `TRUNCATE` test executed by `nurseflow_app_user` on protected table:
  - Error received: `error: permission denied for table <table_name>` (`code: '42501'`). -> **PASS**
- **PRIV-04**: Required `SELECT` queries function normally under RLS context. -> **PASS**
- **PRIV-05**: Required `INSERT` operations function normally. -> **PASS**
- **PRIV-06**: Required `UPDATE` operations function normally. -> **PASS**
- **PRIV-07**: Required `DELETE` operations function normally. -> **PASS**

---

## 5. Conclusion & Gate Status

`TRUNCATE` privilege is completely eradicated from `nurseflow_app_user`.
- **Status:** **CONTAINED & VERIFIED**
- **DML Integrity:** **UNCOMPROMISED**
