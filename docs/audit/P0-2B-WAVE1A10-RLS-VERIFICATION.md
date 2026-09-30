# NURSEFLOW — P0-2B WAVE 1A.10 RLS VERIFICATION
## ROW LEVEL SECURITY & CHILD-TABLE BOLA VERIFICATION

### 1. Default-Deny RLS Policy Architecture
All 31 target clinical and administrative tables were configured with default-deny isolation policies enforcing:
```sql
CREATE POLICY tenant_isolation_[table] ON [table]
  AS PERMISSIVE FOR ALL TO public
  USING (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
  );
```

### 2. Behavioral Properties Verified
1. **Tenant Context Absent:**
   - Evaluates `NULLIF('', '')::uuid` -> `NULL`.
   - Query yields 0 rows (Fail Closed).
   - Verified via direct pool connection without UoW.
2. **Tenant A Context Active (`00000000-0000-0000-0000-000000000001`):**
   - Returns 5,068 encounters and 5,126 patients.
   - Zero rows from other tenants visible.
3. **Tenant B Context Active (`00000000-0000-0000-0000-000000000002`):**
   - Returns 36 encounters and 36 patients.
   - Zero rows from Tenant A visible.
4. **Tenant C Context Active (Unused Tenant):**
   - Returns 0 encounters and 0 patients.
5. **No Hardcoded Fallback:**
   - Zero hardcoded UUID defaults; missing tenant triggers immediate `AUTHORITATIVE_TENANT_REQUIRED`.

### 3. HTTP Application Traversal Results
- Authenticated Tenant A request to `GET /api/v1/encounters`: Returned strictly Tenant A records (HTTP 200).
- Authenticated Tenant B request to `GET /api/v1/encounters`: Returned strictly Tenant B records (HTTP 200).
- Tenant A request targeting Tenant B encounter ID: Returned HTTP 404 NOT FOUND (RLS hides row from Tenant A).
- Tenant A mutation attempt on Tenant B encounter (`PATCH /api/v1/encounters/:id/status`): Returned HTTP 404 NOT FOUND.
- Unauthenticated request: Returned HTTP 401 UNAUTHORIZED.

### 4. Child-Table BOLA & Composite Foreign Keys
- Tested on `longitudinal_care_plans`:
  - Query within Tenant A context strictly isolates Tenant A plans.
  - Cross-tenant foreign key linking attempt (Tenant A creating care plan referencing Tenant B encounter) triggered PostgreSQL error `23503` (`fk_longitudinal_care_plans_enc_tenant`), proving composite FK enforcement at the database kernel level.
