# P0-2B Wave 1A.11 — Remediation Baseline Snapshot

**Document Identifier:** `SEC-AUD-P02B-W1A11-BASELINE-20260930`  
**Document Type:** Pre-Remediation Baseline Snapshot & Environment Identity  
**Author Role:** Principal Security Architect & Adversarial Auditor  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Target Environment:** `nurseflow_enterprise_his` (PostgreSQL 16.15)  
**Date:** 2026-09-30  
**Status:** **`BASELINE CAPTURED` | `READ-ONLY SNAPSHOT RECORDED`**

---

## 1. Executive Summary

Prior to initiating remediation work on Critical Blockers (**CRIT-01** Secret Exposure and **CRIT-02** Application Restore) and High Blockers (**HIGH-01** Direct DB Call Sites, **HIGH-02** Migration Runner Privilege Mismatch, and **HIGH-03** Child Application BOLA), this baseline snapshot captures the complete repository, database, role, and configuration state without exposing credentials.

---

## 2. Git State & Branch Identity

- **Active Branch:** `feature/security-foundation-wave1a10`
- **Head Commit:** `fd74e62` (*feat(governance): implement NurseFlow Project Governance & Control Truth Layer and finalize P0-2A transactional remediation*)
- **Upstream Origin:** `origin/main` (synced at `fd74e62`)
- **Modified Tracked Files (6):**
  - `docs/CHANGELOG_PERUBAHAN_HIS.md` (Update logs for Waves 1A.10 and 1A.10R)
  - `scripts/execute_all_migrations.js` (Filter for excluding `_down` migrations)
  - `server/controllers/encounter.controller.js` (Tenant context propagation for Encounter domain)
  - `server/db/postgresPool.js` (Cutover to `nurseflow_app_user` with insecure fallback)
  - `server/db/transactionManager.js` (UoW delegator method and GUC injection)
  - `server/services/encounterApplication.service.js` (Refactored to `withUnitOfWork`)
- **Untracked Additions:**
  - Migrations: `077`, `078`, `079` and their respective `_down` SQL scripts.
  - Audit Artifacts: `P0-2B-WAVE1A10-*` and `P0-2B-WAVE1A10R-*`.
  - Scripts: `scripts/rollback_stage0_migrations.js`.
  - Tests: `tests/p02b_wave1a10_security_regression.test.js`.
  - Infrastructure: `server/db/unitOfWork.js`.

---

## 3. Database Identity & PostgreSQL Server Profile

Captured directly via SQL catalog inspection on `nurseflow_enterprise_his`:

| Parameter | Observed Value |
| :--- | :--- |
| **Database** | `nurseflow_enterprise_his` |
| **Server Address** | `::1` (localhost) |
| **Server Port** | `5432` |
| **PostgreSQL Version** | `PostgreSQL 16.15, compiled by Visual C++ build 1944, 64-bit` |
| **Data Directory** | `C:/Program Files/PostgreSQL/16/data` |
| **Session User** | `postgres` (inspection session) / `nurseflow_app_user` (runtime pool) |
| **Current User** | `postgres` (inspection session) / `nurseflow_app_user` (runtime pool) |

---

## 4. Database Role Inventory & Privilege Topology

Catalog inspection of `pg_roles` confirms the following role attributes:

| Role Name | Superuser (`rolsuper`) | Bypass RLS (`rolbypassrls`) | Create Role (`rolcreaterole`) | Create DB (`rolcreatedb`) | Can Login (`rolcanlogin`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `nurseflow_app_user` | **false** | **false** | **false** | **false** | **true** |
| `nurseflow_migration` | **false** | **false** | **true** | **true** | **true** |
| `nurseflow_worker` | **false** | **false** | **false** | **false** | **true** |
| `nurseflow_readonly` | **false** | **false** | **false** | **false** | **true** |
| `postgres` | **true** | **true** | **true** | **true** | **true** |

---

## 5. System Configuration vs Runtime Role Mapping

- **Application Runtime DB Role:** `nurseflow_app_user` (Configured in `.env.local` and `postgresPool.js`)
- **Application DB Configuration:** Host: `localhost`, Port: `5432`, DB: `nurseflow_enterprise_his`
- **Migration Execution Role (Current Defect HIGH-02):** `nurseflow_app_user` (Configured in `scripts/execute_all_migrations.js` via `.env.local`, causing DDL failure due to lack of table ownership)
- **Dedicated Worker Role:** `nurseflow_worker` (Defined in catalog; awaiting outbox integration)
- **Reporting Role:** `nurseflow_readonly` (Defined in catalog; read-only privileges)

---

## 6. Pre-Remediation Checkpoint Reference

This baseline is preserved in machine-readable JSON format at:
[`scratch/p02b_wave1a11_baseline.json`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/scratch/p02b_wave1a11_baseline.json)
