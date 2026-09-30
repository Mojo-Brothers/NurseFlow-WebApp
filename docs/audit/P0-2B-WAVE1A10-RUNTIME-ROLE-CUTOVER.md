# NURSEFLOW — P0-2B WAVE 1A.10 RUNTIME ROLE CUTOVER
## LEAST-PRIVILEGE APPLICATION RUNTIME ROLE IMPLEMENTATION

### 1. Superuser Elimination
The legacy configuration assumed `postgres` superuser privileges during application runtime. In Wave 1A.10, the runtime pool was cut over to:
`nurseflow_app_user`

### 2. Privilege Profile
Verified via catalog query on PostgreSQL:
```text
rolname:        nurseflow_app_user
rolsuper:       false
rolbypassrls:   false
rolcreaterole:  false
rolcreatedb:    false
```

### 3. Permissions Granted vs. Denied
- **Granted (Minimum Required):**
  - `CONNECT ON DATABASE nurseflow_enterprise_his`
  - `USAGE ON SCHEMA public`
  - `SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public`
  - `USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public`
- **Denied / Blocked (Privilege Escalation Protection):**
  - `DROP TABLE` -> Permission Denied (Verified by test)
  - `ALTER TABLE` -> Permission Denied
  - `CREATE ROLE` -> Permission Denied
  - `CREATE DATABASE` -> Permission Denied
  - `BYPASS RLS` -> Strictly blocked (subject to all RLS policies)

### 4. Configuration Updates
- Updated `.env.local`:
  - `POSTGRES_USER=nurseflow_app_user`
  - `DATABASE_URL=postgresql://nurseflow_app_user:...@localhost:5432/nurseflow_enterprise_his?schema=public`
- Updated `server/db/postgresPool.js`:
  - Default fallback user set to `nurseflow_app_user`.
- Secret hygiene: No credentials committed into version control; placeholders maintained in templates.
