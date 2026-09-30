# P0-2B Wave 1A.8R — Disaster Recovery & Restore Verification Audit

**Document Identifier:** `SEC-AUD-P02B-W1A8R-DR-RESTORE-AUDIT-20260930`  
**Document Type:** Disaster Recovery, Backup Baseline, & Restore Forensics Report  
**Author Roles:**
- Database Reliability Engineer
- DevSecOps Engineer
- Principal Security Architect

**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Evaluation Date:** 2026-09-30  
**Evidence Classification:**
- Backup Schema Baseline: `VERIFIED_FACT`
- Backup Script Template: `DESIGN_ONLY`
- Disaster Recovery Drill: `SIMULATION_ONLY`
- Physical PostgreSQL Restore: `NOT_VERIFIED`

---

## 1. Executive Summary & Forensic Disclosure

In Wave 1A.8, the preflight review reported:
- `BACKUP-RESTORE VERIFIED: YES`
- Automated Backup Automation `scripts/backup_postgres_pitr.sh` validated.
- Automated DR Drill `scripts/verify_disaster_recovery_drill.js` executed (RTO 4.2 min, RPO 0 min, Data Loss 0 records).

A forensic audit of the underlying source code and operating environment reveals that **this claim combined physical baseline evidence with an in-memory application simulation, leading to an overclaim**:

1. **`scripts/verify_disaster_recovery_drill.js` is an IN-MEMORY JAVASCRIPT SIMULATION.**  
   Inspection of `server/services/disasterRecoveryDrill.service.js` demonstrates that it operates entirely on JavaScript arrays (`patients = []`, `auditTrail = []`, `inventory = []`) and calculates SHA-256 hashes of string logs in RAM. It **never interacts with PostgreSQL, does not execute `pg_restore`, does not replay PostgreSQL WAL segments, and does not restore any database files**.
2. **`scripts/backup_postgres_pitr.sh` is an UNEXECUTED LINUX SHELL TEMPLATE.**  
   The script contains Linux bash commands targeting `/var/backups/nurseflow/postgres`, PostgreSQL user `his_admin`, and calls `psql` / `pg_basebackup`. The audited workstation is a **Windows 64-bit machine running PostgreSQL 16.15 under user `postgres` at `C:/Program Files/PostgreSQL/16/data`**. This shell script has never been executed in this environment.
3. **Physical PostgreSQL Restore to an Isolated Target has NOT Been Executed.**  
   No `pg_restore` or directory extraction was performed against a secondary disposable database instance during this review.
4. **Physical Schema Baseline Checksum is VERIFIED.**  
   A direct dump of the live database schema was extracted via `pg_dump.exe --schema-only` from `nurseflow_enterprise_his` on `localhost:5432`.

### Mandatory Governance Reconciliation:
```text
BACKUP BASELINE: VERIFIED (Schema DDL snapshot exists)
BACKUP AUTOMATION SCRIPT: DESIGN_ONLY (Linux bash template)
DISASTER RECOVERY DRILL: SIMULATION_ONLY (In-memory JavaScript model)
PHYSICAL DATABASE RESTORE: NOT_VERIFIED
OBSERVED DRILL METRICS: OBSERVED_LOCAL_DRILL_METRIC (RTO 4.2m / RPO 1.1m from JS simulation, NOT a production guarantee)
```

---

## 2. In-Depth Audit of Disaster Recovery Artifacts

### 2.1 Inspection of `scripts/verify_disaster_recovery_drill.js`
The script imports `disasterRecoveryDrillService` from `server/services/disasterRecoveryDrill.service.js` and runs four sequential steps:
1. `generateBaselineSnapshot(1000, 2500)`: Creates an array of 1,000 patient objects in memory.
2. `generateStreamingWalDelta(baselineSnapshot, 500, 1200)`: Appends 500 patient objects and simulates WAL logs.
3. `executePitrReplayAndRestore(baselineSnapshot, liveStateBeforeCrash)`: Performs a JavaScript `JSON.parse(JSON.stringify(...))` deep copy.
4. `verify5ClinicalInvariants(...)`: Checks array lengths, set uniqueness, and SHA-256 chain equality.

**Engineering Evaluation:**
This service is a valuable architectural demonstration of HIS data invariants (MRN preservation, SEP BPJS uniqueness, non-negative pharmacy stock, audit hash chain integrity). However, it is **strictly an in-memory domain model simulation**. Calling this script does not test PostgreSQL engine recovery, disk corruption recovery, tablespace reconstruction, or WAL replay.

### 2.2 Inspection of `scripts/backup_postgres_pitr.sh`
The script defines:
```bash
BACKUP_ROOT="/var/backups/nurseflow/postgres"
WAL_ARCHIVE_DIR="$BACKUP_ROOT/wal_archive"
BASE_BACKUP_DIR="$BACKUP_ROOT/base_backups"
DB_NAME="nurseflow_enterprise_his"
DB_USER="his_admin"
pg_basebackup -h localhost -U "$DB_USER" -D "$BASE_BACKUP_DIR/base_backup_${TIMESTAMP}" -Ft -z -X stream -P
```

**Engineering Evaluation:**
This script represents a production-grade Linux deployment recipe for `pg_basebackup` with WAL streaming. However:
- It requires a POSIX environment and cannot execute natively on Windows without WSL or bash emulation.
- User `his_admin` does not exist in the local PostgreSQL instance (only `postgres` and `nurseflow_app_user` exist).
- Directory `/var/backups` does not exist on the local filesystem.
Therefore, the script is classified as **`DESIGN_ONLY`**.

---

## 3. Physical Schema DDL Baseline Forensics

### 3.1 Live Database Introspection
The physical schema was dumped using local Windows binaries:
```cmd
"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -d nurseflow_enterprise_his --schema-only --no-owner --no-privileges
```
- **Total Lines Generated:** 15,268 lines
- **Total Size:** 562.56 KB (576,063 bytes)
- **Objects Captured:** 213 tables, 1 sequence, 79 policies, 53 functions, triggers, and foreign keys.

### 3.2 PostgreSQL 16 Ephemeral Token Discovery (`\restrict` / `\unrestrict`)
During re-verification of the schema hash in Wave 1A.8R, a hash difference was detected between successive invocations:
- `calculate_schema_checksum.js` in Wave 1A.8 recorded: `9840668d1fef1699f84c81afa20aa2c8e84a710ef61cccf1e47246aaccd6b5e7`.
- A fresh dump invocation produced: `a64d5e3b6bb2e39749f621f3a023e8439eb0a7126f31abbea5b202ef9dd467f9`.

A forensic line-by-line diff between consecutive dumps revealed the exact root cause:
```text
Diff at line 5:
Run 1: \restrict p0Wewnm3ts3bo3853haScAfPtYvtPSHivNcGH0DuzSeIotjLfCiNfjsMYNVzLcI
Run 2: \restrict uomflWzZZy2Omq9Ft9zCHFHYM00M5u6IJDLysDZZY28OzRccp1kc7E3bPMnwoYF
Diff at line 15266:
Run 1: \unrestrict p0Wewnm3ts3bo3853haScAfPtYvtPSHivNcGH0DuzSeIotjLfCiNfjsMYNVzLcI
Run 2: \unrestrict uomflWzZZy2Omq9Ft9zCHFHYM00M5u6IJDLysDZZY28OzRccp1kc7E3bPMnwoYF
```

**Technical Explanation:**
In PostgreSQL 16 and later, `pg_dump` injects an ephemeral session security boundary using `\restrict <random_session_key>` at the start of the dump and `\unrestrict <random_session_key>` at the end of the dump. This prevents untrusted SQL execution during restore. Because this session key is generated randomly on every dump execution, a naive SHA-256 hash across the raw dump text will change on every execution even when the database schema has zero changes.

**Normalization Proof:**
When the two ephemeral lines (`\restrict` and `\unrestrict`) and informational comments (`--`) are excluded, the underlying DDL across all 213 tables is **100% identical and deterministic**.
- Normalized DDL Lines: 10,672 lines
- The physical schema has experienced **ZERO DDL mutations** between Wave 1A.8 and Wave 1A.8R.

---

## 4. Reconciled Status & Impact on Stage 0 Authorization

### 4.1 Status Reclassification

| Component | Wave 1A.8 Claim | Wave 1A.8R Reconciled Status | Reconciliation Justification |
| :--- | :--- | :--- | :--- |
| **Backup Baseline** | Verified | **`VERIFIED_FACT`** | Physical SQL schema baseline dump exists and is forensically analyzed. |
| **Backup Automation** | Validated | **`DESIGN_ONLY`** | Bash script template for Linux production; unexecuted on local Windows host. |
| **Disaster Recovery Drill** | Executed / Verified | **`SIMULATION_ONLY`** | In-memory JavaScript domain model simulation; does not execute PostgreSQL restore. |
| **Physical DB Restore** | Implied Verified ("BACKUP-RESTORE VERIFIED: YES") | **`NOT_VERIFIED`** | No physical restore to a disposable PostgreSQL database instance was performed. |
| **RTO / RPO Metrics** | System Performance Claim | **`OBSERVED_LOCAL_DRILL_METRIC`** | 4.2m RTO and 1.1m RPO reflect JS simulation speed, not physical database restoration time. |

### 4.2 Stage 0 Governance Determination
Does `RESTORE: NOT_VERIFIED` block Stage 0 authorization on staging?
- **NO.** Per Section 17 of the Wave 1A.8R directive:
  > "Jika actual restore belum diverifikasi, status harus tetap dicatat sebagai limitation dan Stage 0 authorization tidak boleh menyamarkan hal tersebut."
- Stage 0 consists of adding non-destructive constraints (`UNIQUE`, composite `FK`) and backfilling empty/local tables on an isolated staging database.
- A physical schema backup baseline exists, and rollback DDL is documented for every planned operation.
- **Mandatory Limitation Notice:** Authorization of Stage 0 for staging is granted with the explicit limitation that physical database restoration remains `NOT_VERIFIED` and must be validated through an actual physical restore drill on staging prior to any production consideration.
