# P0-2B Wave 1A.11R — Runtime Database Role, Startup Guard & Identity Proof

**Document Identifier:** `SEC-AUD-P02B-W1A11R-RUNTIME-20261001`  
**Document Type:** Runtime Identity Forensic Proof, Startup Guard Inspection & Privilege Analysis  
**Author Role:** Independent Adversarial Security Auditor & Database Security Specialist  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Current Branch:** `feature/security-foundation-wave1a10`  
**Status:** **`ACTUAL RUNTIME ROLE = VERIFIED_FACT` | `STARTUP GUARD = VERIFIED_WITH_LIMITATION`**

---

## 1. Executive Summary

In Wave 1A.10R, runtime role security was compromised by two factors:
1. `server/db/postgresPool.js` contained an insecure fallback credential.
2. The application lacked a fail-closed startup role guard, allowing a process mistakenly configured with `postgres` superuser to silently bypass PostgreSQL Row-Level Security.

In Wave 1A.11, the engineering team removed hardcoded fallbacks and implemented `assertRuntimeDatabaseSafety(pool)` in `server/config/envValidator.js`, wiring it to `server/server.js` before `app.listen()`.

This independent audit executed read-only inspection of source code, AST, and live PostgreSQL catalogs to verify the actual runtime identity of the application connection pool.

---

## 2. Actual Runtime Database Identity Proof

To avoid inferring identity solely from configuration files (`.env.local`), a direct read-only query was executed using `server/db/postgresPool.js` (the identical connection pool module used by the Express application).

### Empirical Catalog Query Result:
```json
{
  "current_user": "nurseflow_app_user",
  "session_user": "nurseflow_app_user",
  "current_database": "nurseflow_enterprise_his",
  "rolsuper": false,
  "rolbypassrls": false,
  "rolcreaterole": false,
  "rolcreatedb": false
}
```

### Invariant Verification:
1. **`current_user === 'nurseflow_app_user'`**: Established. The connection pool authenticates under the dedicated least-privilege application role.
2. **`session_user === 'nurseflow_app_user'`**: Established. No role switching or session proxying to superuser occurs.
3. **`rolsuper === false`**: Established. The application role possesses zero superuser privileges.
4. **`rolbypassrls === false`**: Established. The application role CANNOT bypass PostgreSQL Row-Level Security.
5. **`rolcreaterole === false` & `rolcreatedb === false`**: Established. The role cannot create roles or databases.

**Runtime Identity Status:** **`VERIFIED_FACT`**

---

## 3. Startup Role Guard Forensic Inspection

The role guard was inspected across `server/config/envValidator.js` and `server/server.js`:

### 3.1 Dual-Tier Validation Logic (`server/config/envValidator.js`)
1. **Static Validation (`enforceEnvironmentGuard`):**
   - Asserts `env.POSTGRES_USER !== 'postgres'`.
   - Asserts `env.DATABASE_URL` does not contain `postgres:` or `postgres@`.
   - Rejects placeholder and weak secrets in production (`JWT_SECRET.length >= 32`).
2. **Runtime Physical Role Assertion (`assertRuntimeDatabaseSafety`):**
   ```javascript
   export async function assertRuntimeDatabaseSafety(targetPool) {
     const client = await targetPool.connect();
     try {
       const res = await client.query(`
         SELECT 
           current_user as current_user,
           session_user as session_user,
           r.rolsuper as rolsuper,
           r.rolbypassrls as rolbypassrls
         FROM pg_roles r 
         WHERE r.rolname = current_user;
       `);
       if (res.rows.length === 0) {
         throw new Error('FATAL_SECURITY_ERROR: Current database role not found in pg_roles catalog.');
       }
       const { current_user: roleName, rolsuper, rolbypassrls } = res.rows[0];
       if (roleName === 'postgres' || rolsuper || rolbypassrls) {
         const violation = `FATAL_SECURITY_VIOLATION: Application runtime cannot operate with superuser or bypassrls privileges. Detected role: ${roleName} (rolsuper=${rolsuper}, rolbypassrls=${rolbypassrls}). Halting process.`;
         console.error(`\n🚨 [RUNTIME ROLE GUARD] ${violation}\n`);
         throw new Error(violation);
       }
       return { safe: true, roleName, rolsuper, rolbypassrls };
     } finally {
       client.release();
     }
   }
   ```

### 3.2 Server Wiring & Startup Execution (`server/server.js`)
Lines 133–145:
```javascript
if (process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].includes('server'))) {
  enforceEnvironmentGuard(process.env);
  assertRuntimeDatabaseSafety(pool)
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[NurseFlow API Gateway] Listening on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Fatal startup failure:', err.message);
      process.exit(1);
    });
}
```

### Forensic Guard Audit:
- **Does startup call the guard?** **YES.** Line 135 explicitly invokes `assertRuntimeDatabaseSafety(pool)`.
- **Does it execute before serving requests?** **YES.** `app.listen()` is nested within the `.then()` handler of `assertRuntimeDatabaseSafety`. Requests cannot be accepted before the role assertion succeeds.
- **Does it inspect actual current_user?** **YES.** Queries `pg_roles` where `r.rolname = current_user`.
- **Does it inspect rolsuper?** **YES.** Evaluates `r.rolsuper`.
- **Does it inspect rolbypassrls?** **YES.** Evaluates `r.rolbypassrls`.
- **Does it fail closed?** **YES.** Throws an error caught by `.catch()`, which executes `process.exit(1)`.
- **Can an alternate initialization path bypass it?** **YES (LIMITATION):**
  If `server/server.js` is imported programmatically (e.g. `import app from './server/server.js'`) by a custom script or test harness without `process.argv[1]` including `server.js` or `server`, `app.listen()` is not called and `assertRuntimeDatabaseSafety` is skipped. If that external script binds `app.listen()`, the guard is bypassed.

**Startup Role Guard Status:** **`VERIFIED_WITH_LIMITATION`**

---

## 4. Table Ownership & Privilege Boundaries

PostgreSQL catalog inspection of table ownership on critical relations (`encounters`, `master_patients`, child tables):

```text
Table Name                            | Table Owner  | RLS Enabled | FORCE RLS Enabled
--------------------------------------------------------------------------------------
encounters                            | postgres     | true        | true
master_patients                       | postgres     | true        | true
longitudinal_care_plans               | postgres     | true        | true
medication_emar_administrations       | postgres     | true        | true
medication_dispense_allocations       | postgres     | true        | true
patient_split_invoices                | postgres     | true        | true
physician_diagnostic_interpretations  | postgres     | true        | true
schema_migrations                     | postgres     | false       | false
```

### Risk Assessment of Table Ownership by `postgres`:
- In PostgreSQL security architecture, table owners possess implicit DDL rights and bypass RLS unless `FORCE ROW LEVEL SECURITY` is enabled.
- However, the application process executes as `nurseflow_app_user`.
- Because `nurseflow_app_user` is **not the owner** and is **not a superuser**, owner privileges do not apply to application sessions.
- Furthermore, all 7 critical tables have `FORCE ROW LEVEL SECURITY = true` (`relforcerowsecurity = true`), ensuring that even owner sessions are constrained by RLS unless holding `rolbypassrls`.
- Table ownership by `postgres` does **not** create an application-level bypass vulnerability.

---

## 5. Security Verdict

- **Actual Database Role:** **`nurseflow_app_user`** (Least privilege confirmed)
- **Superuser Bypasses:** **`REMOVED`**
- **Startup Role Guard:** **`VERIFIED_WITH_LIMITATION`** (Production CLI entrypoint protected; direct programmatic imports unconstrained)
- **Table Ownership Boundary:** **`VERIFIED_FACT`** (FORCE RLS active; app user holds no owner privileges)
