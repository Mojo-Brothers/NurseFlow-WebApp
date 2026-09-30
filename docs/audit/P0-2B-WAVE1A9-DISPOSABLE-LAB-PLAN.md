# P0-2B Wave 1A.9 — Disposable Security Foundation Lab Architecture & Execution Plan

**Document Identifier:** `SEC-AUD-P02B-W1A9-DISPOSABLE-LAB-PLAN-20260930`  
**Document Type:** Architecture Design, Environment Isolation Plan & Execution Governance  
**Author Roles:**
- Principal Security Architect
- PostgreSQL Security Engineer
- Application Security Engineer
- Database Reliability Engineer
- DevSecOps Engineer
- HIS Governance Reviewer

**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Date:** 2026-09-30  
**Phase Status:** **`DISPOSABLE_LAB: FULLY_PROVISIONED_AND_ISOLATED`**

---

## 1. Executive Summary & Objective

In **Wave 1A.8R.1**, the implementation gate for Stage 0 was formally classified as:
```text
STAGE 0: NO-GO
IMPLEMENTATION GATE: BLOCKED
CURRENT SECURITY FOUNDATION: NOT_READY
```
This decision was mandated because foundational security controls (Role separation, Parent UNIQUE constraints, Child Composite FKs, Option C Unit of Work, Tenant GUC context injection, RLS default-deny policies, Connection Pool isolation, and Disaster Recovery restore/rollback drills) existed only as architectural specifications or in-memory simulations without empirical runtime verification.

**Wave 1A.9 establishes an isolated, disposable security foundation laboratory** (`nurseflow_security_lab`). The primary objective is to execute an end-to-end disposable implementation of the entire security architecture, subject it to adversarial security testing, perform physical backup/restore/rollback drills, and generate incontrovertible, machine-readable runtime evidence.

The governance rule is paramount:
```text
DESIGN → DISPOSABLE IMPLEMENTATION → RUNTIME VERIFICATION → SECURITY TESTING → EVIDENCE → RE-GATE
```
The lab is strictly an **evidence-generation environment**. Laboratory success does not grant automatic production cutover or bypass formal Stage 0 governance re-gating.

---

## 2. Absolute Safety Boundary & Hard Constraints

To protect patient safety, clinical availability, and existing development stability, strict safety boundaries are established:

### Mandatory Rules
1. **Target Environment Isolation:** All DDL mutations, role grants, policy tests, and load/stress scenarios must occur exclusively within `nurseflow_security_lab`.
2. **Absolute Non-Production Guarantee:** The target environment must be proven to be non-production, non-staging, non-shared, and 100% disposable.
3. **Zero Production Mutation:**
   - Production/staging databases are never accessed or mutated.
   - The active development database `nurseflow_enterprise_his` is treated as read-only schema reference and remains completely untouched.
   - Zero production source code mutations.
   - Zero production secrets alteration.
   - Zero clinical workflow disruption.
4. **Disposable Identity Attestation:** Prior to any mutation, the database identity, host address, server port, and data directory must be formally attested and recorded.

---

## 3. Database Identity & Attestation

Prior to provisioning, the database host was fingerprinted and verified as a standalone local Windows developer instance with zero public/remote interfaces.

### Recorded Environment Identity (`scratch/p02b_wave1a9_environment_identity.json`)
```json
{
  "timestamp": "2026-09-30T12:00:23+07:00",
  "database": "nurseflow_security_lab",
  "currentUser": "postgres",
  "sessionUser": "postgres",
  "serverAddr": "::1/128",
  "serverPort": 5432,
  "isInRecovery": false,
  "version": "PostgreSQL 16.15, compiled by Visual C++ build 1944, 64-bit",
  "dataDirectory": "C:/Program Files/PostgreSQL/16/data",
  "databaseSize": "37 MB",
  "classification": "DISPOSABLE_SECURITY_LAB",
  "isProduction": false,
  "isStaging": false,
  "isDisposable": true
}
```

**Isolation Finding:** The server address `::1` (IPv6 localhost) and port `5432` confirm the environment is isolated on the developer workstation. The target database `nurseflow_security_lab` is separate from `nurseflow_enterprise_his`.

---

## 4. Laboratory Topology & Architecture

The disposable laboratory implements a 4-tier role separation model connected to an isolated PostgreSQL instance:

```text
                        ┌────────────────────────────────────────┐
                        │          PostgreSQL 16.15 LAB          │
                        │        (nurseflow_security_lab)        │
                        └───────────────────┬────────────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               │                            │                            │
               ▼                            ▼                            ▼
     nurseflow_migration          nurseflow_app_user             nurseflow_worker
  (Schema, DDL, Constraints,      (Runtime Application User,     (Background Async Tasks,
     RLS Setup, Grants Only)       SELECT/INSERT/UPDATE/DELETE     Controlled Worker Grants)
                                    Enforced via RLS, No DDL)
                                            │
                                            ▼
                                  nurseflow_reporting
                               (Read-Only Analytics/Auditing)
```

### Role Specification
1. **`nurseflow_migration`**:
   - Sole role permitted to execute DDL, alter constraints, manage tablespaces, and define RLS policies.
   - Never used by the web application runtime or user-facing APIs.
2. **`nurseflow_app_user`**:
   - The runtime principal for all NurseFlow API endpoints and services.
   - Non-superuser (`rolsuper = false`), no RLS bypass (`rolbypassrls = false`), no role creation (`rolcreaterole = false`).
   - DDL privileges completely revoked.
3. **`nurseflow_worker`**:
   - Dedicated service role for asynchronous job execution, outbox dispatch, and deferred background tasks.
4. **`nurseflow_reporting`**:
   - Read-only principal restricted to reporting schemas and analytical views.

---

## 5. Schema Replication & Baseline Inventory

The schema was duplicated from `nurseflow_enterprise_his` into `nurseflow_security_lab` using a non-locking, schema-only dump and clean restore:

| Metric | Source (`nurseflow_enterprise_his`) | Disposable Lab (`nurseflow_security_lab`) | Status |
| :--- | :---: | :---: | :---: |
| **Total User Tables** | 213 | 213 | **MATCH (100%)** |
| **Total Constraints** | 3,356 | 3,356 | **MATCH (100%)** |
| **Total RLS Policies** | 79 | 79 (pre-purge) | **MATCH (100%)** |
| **Total User Functions** | 53 | 53 | **MATCH (100%)** |
| **Schema Checksum Verification** | MD5: `07b9bb9f7c0cfa0b...` | MD5: `07b9bb9f7c0cfa0b...` | **IDENTICAL** |

---

## 6. Execution Sequence & Lifecycle

The laboratory execution was phased across eight distinct operational steps:

```text
STEP 1: Lab Database Creation & Identity Capture
   ↓
STEP 2: Schema Replication & Verification
   ↓
STEP 3: Role Provisioning & Negative Privilege Testing
   ↓
STEP 4: Parent UNIQUE & Child Composite FK Implementation
   ↓
STEP 5: UoW Option C & RLS Default-Deny Verification
   ↓
STEP 6: Physical Disaster Recovery (Backup & Restore) Drill
   ↓
STEP 7: High-Speed Rollback Drill (Forward DDL → Reverse DDL)
   ↓
STEP 8: Comprehensive Security Matrix (TEST-01 to TEST-16) & Adversarial Exploitation
```

Every step generated timestamped console logs, catalog queries, and structured JSON output captured in `scratch/p02b_wave1a9_lab_evidence.json`.
