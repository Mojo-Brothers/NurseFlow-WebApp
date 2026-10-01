# P0-2B WAVE 1B.0T — GUC CANONICALIZATION & TENANT CONTEXT HARDENING REPORT

**Audit Date:** 2026-10-01  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Branch:** `feature/security-foundation-wave1a10`  
**Classification:** `AUTHORITATIVE_SECURITY_AUDIT`  
**Standard:** ISO/IEC 27001 Multi-Tenancy Data Isolation & OWASP ASVS 4.0  

---

## 1. Executive Summary

In Wave 1B.0T, the database tenant context resolution was unified so that all Row-Level Security (RLS) policies across the entire PostgreSQL catalog evaluate one canonical transaction-scoped context:

```text
app.current_tenant_id
```

Prior to this wave, an architectural split existed across the 100 RLS-enabled tables:
- **46 tables** evaluated `app.current_tenant_id` directly in their policy expressions.
- **54 tables** evaluated the helper function `public.current_app_tenant_id()`, which read the legacy GUC `app.tenant_id`.

While the Unit of Work (`server/db/unitOfWork.js`) injected both GUCs simultaneously, any caller or test setting only `app.current_tenant_id` left the 54 tables un-isolated or inaccessible.

Through Migration `082_stage0_canonical_tenant_context.sql`, the resolver function `public.current_app_tenant_id()` was hardened to read strictly from `app.current_tenant_id`. As a result, 100% of all 100 RLS tables now resolve tenant identity from a single canonical GUC, completely decoupling the catalog from `app.tenant_id`.

---

## 2. Forensic Caller Inspection (The 54 Callers)

Before altering `current_app_tenant_id()`, a full catalog dependency analysis of all 54 callers was conducted:

### 2.1 Schema & Type Uniformity
- **Tenant Column Data Type:** 100% of all 54 tables use `tenant_id UUID NOT NULL`.
- **Policy Commands:** 100% of the 54 policies cover `cmd = ALL` (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- **Policy Qualification:** `(tenant_id = current_app_tenant_id())`.
- **With Check:** `(tenant_id = current_app_tenant_id())`.
- **Anomalies Found:** **0**. Zero non-standard qualifiers, zero custom exclusions.

### 2.2 Table Enumeration (Sample of 54 Tables)
1. `anesthesia_records`
2. `appointment_audit_logs`
3. `appointments` (contains 57 seeded records under Tenant A)
4. `bed_occupancies`
5. `bed_transfers`
6. `billing_ledgers`
7. `blood_bedside_verifications`
8. `blood_crossmatch_tests`
9. `blood_donor_units`
10. `blood_issue_records`
*(Full list across all 54 tables verified in catalog).*

---

## 3. Function Hardening Architecture (`current_app_tenant_id()`)

The hardened implementation deployed via Migration `082_stage0_canonical_tenant_context.sql` satisfies all security criteria:

```sql
CREATE OR REPLACE FUNCTION public.current_app_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN NULL;
    WHEN others THEN
        RETURN NULL;
END;
$$;
```

### Security Attribute Analysis:
1. **Volatility (`STABLE`):** The function does not modify database state and evaluates consistently within a statement for a given GUC setting, allowing the PostgreSQL query optimizer to evaluate it once per query plan.
2. **Parallel Safety (`PARALLEL SAFE`):** Safe for execution in parallel query workers.
3. **Privilege Mode (`SECURITY INVOKER`):** Executes with caller privileges, avoiding privilege escalation.
4. **Search Path Hardening (`SET search_path = pg_catalog, public`):** Immune to `search_path` hijacking attacks.
5. **Fail-Closed Null Behavior:**
   - When `app.current_tenant_id` is unset or empty string, `current_setting(..., true)` returns `NULL`. `NULLIF` turns `''` into `NULL`. The function returns `NULL`.
   - In SQL three-valued logic, `tenant_id = NULL` evaluates to `UNKNOWN` (treated as `FALSE` by RLS filters), blocking all rows.
6. **Invalid UUID Immunity:**
   - If an invalid string is set in the GUC, `::uuid` casting exception is caught by `WHEN invalid_text_representation THEN RETURN NULL;`, failing closed rather than crashing queries.
7. **Zero Default / Fallback Tenant:**
   - Absolutely no `COALESCE(..., default_uuid)`, no hardcoded tenant fallback, and zero fail-open clauses.

---

## 4. Preservation of Legacy Setter in Unit of Work

Per Section 13 and Section 16 of the P0-2B directive:
- In `server/db/unitOfWork.js`, line 65 and line 66:
  ```javascript
  await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId.trim()]);
  await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId.trim()]);
  ```
- **Retained for Compatibility:** `app.tenant_id` is temporarily retained in UoW to maintain compatibility with legacy tests or external services during the pre-UoW transition.
- **Catalog Decoupled:** As proven by test `GUC-08`, the database catalog and RLS policies **no longer consume** `app.tenant_id`.

---

## 5. Automated Test Suite Verification (`tests/p02b_wave1b0t_canonical_guc.test.js`)

All 8 tests in the canonical GUC suite were executed against live database `nurseflow_enterprise_his` using real seeded records (57 appointments):

| Test ID | Objective | Test Conditions | Actual Empirical Result | Verdict |
| :---: | :--- | :--- | :--- | :---: |
| **GUC-01** | Tenant A context resolution | Context = `TENANT_A` | GUC and function return `TENANT_A` | **`VERIFIED_FACT`** |
| **GUC-02** | Tenant B context resolution | Context = `TENANT_B` | GUC and function return `TENANT_B` | **`VERIFIED_FACT`** |
| **GUC-03** | Fail-closed on missing context | Context unset / empty | Returns `NULL`; 0 appointment rows | **`VERIFIED_FACT`** |
| **GUC-04** | Cross-tenant read blocking | Tenant A queries Tenant B record | 0 rows returned (blocked) | **`VERIFIED_FACT`** |
| **GUC-05** | Reverse cross-tenant read blocking | Tenant B queries Tenant A records | 57 appointments visible to A, 0 to B | **`VERIFIED_FACT`** |
| **GUC-06** | Session leakage prevention | Context inspected post-COMMIT | GUC reverts to NULL/empty; no leak | **`VERIFIED_FACT`** |
| **GUC-07** | Connection reuse safety | Pool client re-borrowed | Clean state; previous context absent | **`VERIFIED_FACT`** |
| **GUC-08** | Complete decoupling from `app.tenant_id` | Setting only `app.tenant_id` | Function returns NULL; 0 rows returned | **`VERIFIED_FACT`** |

---

## 6. Conclusion

- **Catalog GUC Uniformity:** 100% of 100 RLS tables now resolve via `app.current_tenant_id`.
- **Architectural GUC Split:** **`RESOLVED`**
- **Fail-Closed Default-Deny:** **`PRESERVED & VERIFIED`**
