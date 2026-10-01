# P0-2B WAVE 1B.0T — SECURITY & CATALOG REGRESSION REPORT

**Audit Date:** 2026-10-01  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Branch:** `feature/security-foundation-wave1a10`  
**Authoritative Forensic Baseline:** `P0-2B-WAVE1B0S`  
**Classification:** `AUTHORITATIVE_REGRESSION_REPORT`  
**Standard:** Enterprise HIS Boundary & Regression Verification  

---

## 1. Executive Summary

This report delivers the comprehensive security and catalog regression analysis for **P0-2B Wave 1B.0T**.

The wave implemented two bounded foundation improvements:
1. Hardened migration authority (fail-closed credential enforcement, fatal checksums, disabled auto-baselining).
2. Unified tenant context in PostgreSQL catalog (`public.current_app_tenant_id()` now resolves `app.current_tenant_id`).

All security controls established in Wave 1A.10, 1A.11, and 1B.0 remain **100% intact with zero regressions**. The 156 unsafe RLS request paths outside Unit of Work (UoW) were strictly untouched and remain documented as open blockers.

---

## 2. Catalog Security Invariants (Pre vs Post Wave 1B.0T)

| Security Control | Baseline (Wave 1B.0S) | Post-Wave 1B.0T Reality | Delta / Impact | Status |
| :--- | :---: | :---: | :---: | :---: |
| **RLS-Enabled Tables** | 100 | **100** | 0 | **`PRESERVED`** |
| **Total Active Policies** | 100 | **100** | 0 | **`PRESERVED`** |
| **Zero-Policy RLS Tables** | 0 | **0** | 0 | **`PRESERVED`** |
| **Duplicate Policy Pairs** | 0 | **0** | 0 | **`PRESERVED`** |
| **Fail-Open (`IS NULL`) Policies** | 0 | **0** | 0 | **`PRESERVED`** |
| **TRUNCATE Grants (`app_user`)** | 0 | **0** | 0 | **`PRESERVED`** |
| **`rolsuper` (`app_user`)** | `false` | **`false`** | 0 | **`PRESERVED`** |
| **`rolbypassrls` (`app_user`)** | `false` | **`false`** | 0 | **`PRESERVED`** |
| **`rolcreaterole` (`app_user`)** | `false` | **`false`** | 0 | **`PRESERVED`** |
| **`rolcreatedb` (`app_user`)** | `false` | **`false`** | 0 | **`PRESERVED`** |
| **Catalog GUC Resolution** | Split (54 legacy vs 46 canonical) | **100 Canonical (`app.current_tenant_id`)** | +54 unified | **`HARDENED`** |
| **Migration Authority Fallback** | Fallback to `postgres` superuser | **Fail-closed (no fallback)** | Superuser fallback removed | **`HARDENED`** |
| **Migration Checksum Mismatch** | Advisory warning (`console.warn`) | **Fatal abort (`process.exit(1)`)** | Fatal enforcement | **`HARDENED`** |
| **Auto-Baseline Behavior** | Auto-triggered if tables > 50 | **Disabled (explicit CLI only)** | Implicit skipping removed | **`HARDENED`** |

---

## 3. Preserved Application Invariant Baseline (No UoW Migration)

Per Section 1, 18, and 26 of the directive, zero application call sites were altered:

| Metric Category | Authoritative Baseline | Wave 1B.0T Actual | Explanatory Rationale | Status |
| :--- | :---: | :---: | :--- | :---: |
| **Total Request DB Calls** | 845 | **845** | Zero controllers, services, or repositories modified. | **`OPEN_BLOCKER`** |
| **RLS Request Calls** | 157 | **157** | No domain UoW refactoring performed in this foundation wave. | **`OPEN_BLOCKER`** |
| **RLS Calls Outside UoW** | 156 (99.36%) | **156** | 156 naked pool calls remain outside transactional tenant context. | **`OPEN_BLOCKER`** |
| **Unsafe RLS Request Paths** | 156 | **156** | Strictly preserved as remaining blocker for Wave 1B domain migrations. | **`OPEN_BLOCKER`** |
| **Tenant-Sensitive Writes Outside UoW** | 239 | **239** | Untouched. Preserved for domain-by-domain UoW rollouts. | **`OPEN_BLOCKER`** |

---

## 4. Automated Regression Verification Suite Results

Three test suites were executed to verify complete absence of regressions:

1. **`tests/p02b_wave1b0_security_containment.test.js`**:
   - 18 / 18 tests passed (TRUNCATE denial, legitimate DML preservation, OT/RAD tenant isolation, policy normalization, secret hygiene, migration tracking).
2. **`tests/p02b_wave1b0t_migration_authority.test.js`**:
   - 7 / 7 tests passed (fail-closed on missing credentials, rejection of runtime user, fatal checksum mismatch, auto-baseline disablement, role separation).
3. **`tests/p02b_wave1b0t_canonical_guc.test.js`**:
   - 8 / 8 tests passed (Tenant A and B context resolution, null fail-closed, cross-tenant read blocking on real seeded records, session leakage prevention, connection pool re-use cleanliness, catalog decoupling from `app.tenant_id`).

**Total Automated Tests Executed:** 33  
**Total Passed:** 33 (100%)  
**Total Failed:** 0 (0%)  

---

## 5. Rollback Governance

- **Down Migrations Executed:** **0**. (`079_down`, `080_down`, `081_down`, `082_down` were NOT executed).
- **Classification:** Down migrations for 079, 080, 081, and 082 remain classified as **`SECURITY_WEAKENING_ROLLBACK`**.
- **Audit Rule:** Reverting any of these migrations without controlled architectural sign-off directly re-introduces known security vulnerabilities.
