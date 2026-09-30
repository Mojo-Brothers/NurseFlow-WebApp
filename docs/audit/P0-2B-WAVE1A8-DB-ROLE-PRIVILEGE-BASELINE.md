# P0-2B Wave 1A.8 — Database Role, Privilege & RLS Baseline Audit

**Document Identifier:** `SEC-AUD-P02B-W1A8-ROLES-BASELINE-20260930`  
**Document Type:** Security Catalog & Runtime Privilege Baseline Audit  
**Author Roles:** PostgreSQL Security Engineer, Application Security Engineer, Principal Security Architect  
**Date:** 2026-09-30  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Status Directive:** **PREFLIGHT AUDIT ONLY | STRICTLY ZERO MODIFICATIONS**  

---

## 1. Executive Summary

This report establishes the baseline state of PostgreSQL database roles, object ownerships, Row Level Security (RLS) configurations, and application dependencies prior to executing Stage 0 remediation.

It serves as the definitive reference point for ensuring that the upcoming transition from superuser (`postgres`) to non-superuser (`nurseflow_app_user`) is executed with zero unintended privileges and zero application lockouts.

---

## 2. Database Role & Security Attributes Baseline

A non-destructive query against `pg_roles` and `pg_auth_members` reveals the exact current catalog state:

| Role Name | `rolcanlogin` | `rolsuper` | `rolbypassrls` | `rolcreaterole` | `rolcreatedb` | Role Membership | Current Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`postgres`** | **`true`** | **`true`** | **`true`** | `true` | `true` | None | **OVERPRIVILEGED.** Currently used by application (`DATABASE_USER=postgres`). Bypasses all RLS policies. |
| **`nurseflow_app_user`** | **`false`** | `false` | `false` | `false` | `false` | None | **UNUSABLE IN CURRENT STATE.** Role exists in catalog but login is disabled (`rolcanlogin = false`) and 0 table grants exist. |
| **`nurseflow_worker`** | **DOES NOT EXIST** | — | — | — | — | — | **MISSING.** Must be provisioned in Stage 0 for background outbox tasks. |
| **`nurseflow_migration`**| **DOES NOT EXIST** | — | — | — | — | — | **MISSING.** Must be provisioned in Stage 0 for DDL schema ownership. |
| **`nurseflow_reporting`**| **DOES NOT EXIST** | — | — | — | — | — | **MISSING.** To be provisioned for read-only reporting. |

---

## 3. Schema & Object Ownership Baseline

Introspection of `pg_namespace`, `pg_class`, and `pg_tables` in the `public` schema:

```
┌────────────────────────────────────────────────────────────────────────┐
│ DATABASE OBJECT OWNERSHIP SUMMARY (public schema)                      │
├────────────────────────────────────────────────────────────────────────┤
│ • Total Relations:           214 objects                               │
│ • Tables (c.relkind = 'r'):  213 tables, ALL owned by 'postgres'       │
│ • Sequences (relkind = 'S'): 1 sequence (outbox_events_id_seq) [owned] │
│ • Views (relkind = 'v'):     0 views                                   │
│ • Public Schema Owner:       'pg_database_owner'                       │
└────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Ownership Separation Requirement:**  
> Because all 213 tables are currently owned by `postgres`, table ownership will be transferred to `nurseflow_migration` during migration execution, ensuring that the runtime user (`nurseflow_app_user`) has zero ownership rights (cannot execute `ALTER TABLE`, `DROP TABLE`, or `TRUNCATE`).

---

## 4. Row Level Security (RLS) Baseline Inventory

An exhaustive catalog audit of `pg_class` and `pg_policy` across all 213 tables in `public`:

```
┌────────────────────────────────────────────────────────────────────────┐
│ RLS STATUS BREAKDOWN                                                   │
├────────────────────────────────────────────────────────────────────────┤
│ • Tables with RLS Enabled (relrowsecurity = true):       95 tables     │
│ • Tables with RLS Forced (relforcerowsecurity = true):   5 tables      │
│ • Tables with RLS Disabled (relrowsecurity = false):    118 tables     │
│ • Total Active Policies in pg_policy:                   79 policies   │
│ • Zero-Policy Tables with RLS Enabled:                  21 tables     │
└────────────────────────────────────────────────────────────────────────┘
```

### Critical Subsets:
1. **The 21 Zero-Policy RLS Tables:**  
   `blood_bank_billing_reconciliations`, `blood_bedside_dual_nurse_verifications`, `bpjs_claim_disputes`, `bpjs_claim_submissions`, `bpjs_vclaim_lifecycle_logs`, `cssd_sterilization_cycles`, `hemovigilance_incident_investigations`, `inacbg_grouping_results`, `master_inacbg_tariffs`, `medical_device_implant_recalls`, `patient_billing_reconciliation`, `pharmacy_controlled_substance_logs`, `pharmacy_depots`, `pharmacy_dispensing_orders`, `post_anesthesia_aldrete_scores`, `radiology_critical_finding_alerts`, `radiology_instances`, `radiology_series`, `surgical_clinical_notes`, `surgical_teams`, `who_surgical_safety_checklists`.
2. **The 5 Unprotected Child Tables (RLS Disabled, No `tenant_id`):**  
   `medication_emar_administrations`, `medication_dispense_allocations`, `longitudinal_care_plans`, `patient_split_invoices`, `physician_diagnostic_interpretations`.

---

## 5. Application Dependency Baseline & Matrix

An AST and text search across `server/` was conducted for superuser dependencies and session settings:

```
┌────────────────────────────────────────────────────────────────────────┐
│ APPLICATION DEPENDENCY AUDIT RESULTS                                   │
├────────────────────────────────────────────────────────────────────────┤
│ • 'postgres' user references:               .env.local, scripts/       │
│ • DATABASE_URL references:                  server/db/postgresPool.js  │
│ • Direct pool.connect() checkouts:          80 call sites              │
│ • Direct pool.query() calls:                30 call sites              │
│ • Active client.query() calls:              648 call sites             │
│ • current_setting('app.current_tenant_id'): 21 files (RLS & guards)    │
│ • SET LOCAL app.current_tenant_id:          2 files (middleware/uow)   │
└────────────────────────────────────────────────────────────────────────┘
```

### Application Component Dependency Matrix:

| Component Name | Database Access Pattern | Current DB Role | Required DB Role | Migration Required |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication Service** (`jwtSecurity.service.js`) | `client.query()` on `users`, `tenants` | `postgres` | `nurseflow_app_user` | Embed `tenantId` in refresh token |
| **Clinical Notes Repository** (`clinicalNotes.repository.js`) | Direct `pool.connect()` (8 sites) | `postgres` | `nurseflow_app_user` | Inject `uow.client`; remove pool checkout |
| **CPOE Orders Service** (`cpoeApplication.service.js`) | Direct `pool.connect()` (12 sites) | `postgres` | `nurseflow_app_user` | Inject `uow.client`; remove fallback |
| **eMAR Administration Service** (`medicationClosedLoop.service.js`)| `client.query()` on child tables | `postgres` | `nurseflow_app_user` | Child table schema migration + composite FK |
| **Triage Service** (`triageApplication.service.js`) | Direct `pool.connect()` (6 sites) | `postgres` | `nurseflow_app_user` | Eliminate fallback; wrap in UoW |
| **Billing & Payments Service** (`billing.service.js`) | Direct `pool.connect()` (10 sites) | `postgres` | `nurseflow_app_user` | Refactor split invoices to use `tenant_id` |
| **Outbox Dispatcher** (`outboxDispatcher.service.js`) | Direct `pool.query()` | `postgres` | `nurseflow_worker` | Switch to `process_outbox_batch()` function |
| **Database Migration Engine** (`execute_all_migrations.js`) | Direct `psql` CLI | `postgres` | `nurseflow_migration`| Dedicated migration runner role |

---

## 6. Runtime Role Preflight Checklist: `nurseflow_app_user`

The following security constraints MUST be proven on the staging role before cutover:

- [ ] **LOGIN:** Can connect via TCP loopback with vault password.
- [ ] **DML SELECT:** Can read authorized tenant rows across all 26 tables.
- [ ] **DML INSERT:** Can insert rows with `tenant_id = app.current_tenant_id`.
- [ ] **DML UPDATE:** Can update rows within active tenant.
- [ ] **DML DELETE:** Can delete rows within active tenant where permitted.
- [ ] **RLS ENFORCEMENT:** Cannot read or mutate rows with mismatched `tenant_id` (0 rows affected).
- [ ] **NOBYPASSRLS:** Query with `app.current_tenant_id` unset returns 0 rows (default-deny verified).
- [ ] **PROHIBITED DDL:** Attempt to execute `CREATE TABLE` returns `ERROR: 42501 permission denied`.
- [ ] **PROHIBITED ALTER:** Attempt to execute `ALTER TABLE` returns `ERROR: 42501 permission denied`.
- [ ] **PROHIBITED DROP:** Attempt to execute `DROP TABLE` returns `ERROR: 42501 permission denied`.
- [ ] **PROHIBITED TRUNCATE:** Attempt to execute `TRUNCATE` returns `ERROR: 42501 permission denied`.
- [ ] **PROHIBITED ROLE MUTATION:** Attempt to execute `ALTER ROLE` returns `ERROR: 42501 permission denied`.
- [ ] **WORKER ISOLATION:** Cannot execute worker privileged functions without explicit `GRANT EXECUTE`.
