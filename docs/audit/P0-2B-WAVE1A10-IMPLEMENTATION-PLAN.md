# NURSEFLOW — P0-2B WAVE 1A.10 IMPLEMENTATION PLAN
## REPOSITORY SECURITY FOUNDATION IMPLEMENTATION

### 1. Context & Objective
Wave 1A.9/1A.9R proved the security foundation in an isolated disposable lab (`nurseflow_security_lab`). Wave 1A.10 transitions this validated architecture into **reproducible repository code and migrations** applied to the development environment (`nurseflow_enterprise_his`) under strict safety boundaries.

### 2. Execution Scope & Four Implementation Tracks
```text
Track A: Repository Database Migrations
  - Migration 077: Parent composite uniqueness (encounters, master_patients)
  - Migration 078: Child composite foreign keys & indexes (5 tables)
  - Migration 079: Purge 5 fail-open policies & enforce default-deny RLS (31 tables)
  - Rollback companion migrations (077_down, 078_down, 079_down) + runner script

Track B: Application Unit of Work (Option C)
  - server/db/unitOfWork.js: Authoritative transaction boundary, SET LOCAL context, DISCARD ALL hygiene
  - Application request path wiring: controller -> service -> UoW -> database
  - AST DB access inventory & exemption matrix

Track C: Runtime Role Separation
  - Cut over application pool runtime to least-privilege role: nurseflow_app_user
  - Stripped SUPERUSER, BYPASSRLS, CREATEROLE, CREATEDB
  - Updated .env.local and server/db/postgresPool.js defaults

Track D: Security Regression & Verification
  - Express HTTP server boot under nurseflow_app_user
  - End-to-end HTTP request traversal with authoritative JWT authentication
  - Cross-tenant RLS isolation & child-table BOLA proof
  - Connection pool reuse & socket hygiene verification
  - Application logical restore smoke test
```

### 3. Absolute Safety Boundary & Target Environment
- **Target DB:** `nurseflow_enterprise_his` (PostgreSQL 16, localhost:5432)
- **Lab DB:** `nurseflow_security_lab` (for pre-migration dry run and rollback drills)
- **Branch:** `feature/security-foundation-wave1a10`
- **Zero Touch:** Production, staging, and shared clusters are strictly untouched.
- **Data Safety Protocol:** Pre-migration baseline captured, post-migration verified, zero row loss guarantee.
