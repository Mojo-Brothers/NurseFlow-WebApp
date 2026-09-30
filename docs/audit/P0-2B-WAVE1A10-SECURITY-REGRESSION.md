# NURSEFLOW — P0-2B WAVE 1A.10 SECURITY REGRESSION REPORT
## AUTOMATED REGRESSION SUITE EXECUTION & VERIFICATION

### 1. Suite Specification
- **Test File:** `tests/p02b_wave1a10_security_regression.test.js`
- **Runner:** Node.js ESM Harness with native HTTP client and pg pool
- **Environment:** Development (`nurseflow_enterprise_his`)
- **Runtime User:** `nurseflow_app_user` (Non-Superuser, Non-BypassRLS)

### 2. Execution Results Summary
```text
Total Tests Run: 14
Passed:          14
Failed:          0
Success Rate:    100%
```

### 3. Detailed Itemized Evidence
| Category | Test Name | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| `RUNTIME_ROLE` | Runtime Application User Identity | `nurseflow_app_user` (`rolsuper=false`, `rolbypassrls=false`) | Matches least-privilege role | **PASS** |
| `RUNTIME_ROLE` | Runtime Role Privilege Escalation Guard | DROP TABLE blocked by PostgreSQL | Permission Denied | **PASS** |
| `OBSERVABILITY` | `GET /health/live` | HTTP 200 OK | HTTP 200 OK | **PASS** |
| `OBSERVABILITY` | `GET /health/ready` | HTTP 200 OK | HTTP 200 OK | **PASS** |
| `APPLICATION_RLS` | Tenant A Own Data Access | HTTP 200 with strictly Tenant A encounters | 10/10 records match Tenant A | **PASS** |
| `APPLICATION_RLS` | Tenant B Own Data Access | HTTP 200 with strictly Tenant B encounters | 10/10 records match Tenant B | **PASS** |
| `CROSS_TENANT` | Cross-Tenant Read Denial (Tenant A -> Tenant B encounter) | HTTP 404 Not Found (RLS fail-closed) | HTTP 404 | **PASS** |
| `CROSS_TENANT` | Cross-Tenant Mutation Denial (Tenant A -> Tenant B PATCH) | HTTP 404 Not Found | HTTP 404 | **PASS** |
| `SECURITY_GUARD` | Unauthenticated Access (No Bearer Token) | HTTP 401 Unauthorized | HTTP 401 | **PASS** |
| `CHILD_BOLA` | Child Table RLS Isolation (`longitudinal_care_plans`) | Strictly matches active tenant | All records match Tenant A | **PASS** |
| `COMPOSITE_FK` | Composite Foreign Key Enforcement | Error 23503 on cross-tenant encounter link | Error 23503 (`fk_longitudinal_care_plans_enc_tenant`) | **PASS** |
| `POOL_ISOLATION` | Pool Connection Reuse & DISCARD ALL Hygiene (Commit) | PID reused with empty tenant/user context | Same PID, context cleared | **PASS** |
| `POOL_ISOLATION` | Pool Connection Hygiene (Rollback Phase) | Empty context after rollback | Context cleared | **PASS** |
| `APPLICATION_RESTORE` | Application Restore Smoke Test | Restored DB operational with intact RLS | Tenant A: 5068, Tenant B: 36 | **PASS** |

### 4. Machine-Readable Evidence
Full test execution log stored at `scratch/p02b_wave1a10_evidence.json`.
