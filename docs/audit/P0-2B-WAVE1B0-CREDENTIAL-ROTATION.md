# P0-2B WAVE 1B.0 — CREDENTIAL STATUS & ROTATION GOVERNANCE SPECIFICATION

**Audit Date:** 2026-10-01  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Branch:** `feature/security-foundation-wave1a10`  
**Author:** Antigravity Autonomous Security Engineer  

---

## 1. Formal Credential Status Declaration

```text
EXPOSED CREDENTIAL CLASS:
PostgreSQL superuser credential

CURRENT STATUS:
EXPOSED / ROTATION REQUIRED

SOURCE STATUS:
CLEAN

HISTORY STATUS:
COMPROMISED

LIVE CREDENTIAL:
NOT VERIFIED AS ROTATED

ROTATION OWNER:
Infrastructure / DevOps / Database Administration Team (Operational Security)

REQUIRED ACTION:
revoke/rotate exposed credential and update secure runtime secret
```

---

## 2. Forensic Discovery & Containment

### 2.1 Historical Leak Analysis
During Wave 1A.10 and earlier commits, audit scratch files (specifically commit `7c0c169`) inadvertently captured environment variable dumps containing the live development PostgreSQL administrative password.
- **Git History Boundary:** In accordance with Section 1 Hard Boundary, git history has **NOT** been rewritten or force-pushed. Historical commit objects remain immutable to avoid repo divergence, preserving tamper-evident forensic history.
- **Historical Exposure:** **CONFIRMED COMPROMISED**.

### 2.2 Working Tree Artifact Sanitization
The artifact `scratch/wave1a10r_git_report.json` was located in the working tree containing historical credential dumps.
- **Remediation Action:** The artifact was sanitized. All raw secret strings were replaced with:
  ```json
  {
    "credential_present": true,
    "credential_value": "REDACTED"
  }
  ```
- **Live Secret Scan Verification:** An automated secret scanner script was executed across:
  - Source code (`src/**`)
  - Documentation (`docs/**`)
  - Scratch & evidence files (`scratch/**`)
  - JSON test fixtures & configs
  - Scripts (`scripts/**`)
  - CI workflows (`.github/**`)
  - Changelog (`docs/CHANGELOG_PERUBAHAN_HIS.md`)
- **Scan Result:** **CLEAN (0 live secrets found in tracked working tree)**.

---

## 3. Operational Rotation Protocol

Automated agents are strictly prohibited from inventing or improvising live database credential changes on development or production databases. Rotation must be executed through controlled administrative channels.

### 3.1 Step-by-Step Procedure for Operational Owner
1. **Administrative Access:**
   Log into the PostgreSQL host via Unix socket or local peer authentication as the operating system administrator.
2. **Execute Password Rotation:**
   ```sql
   -- Run as postgres superuser
   ALTER ROLE postgres WITH PASSWORD '<NEW_HIGH_ENTROPY_SECRET>';
   ```
3. **Runtime Service Role Separation Verification:**
   Ensure application connection strings never use `postgres`. The application runtime must connect exclusively as `nurseflow_app_user` with restricted privileges:
   ```sql
   ALTER ROLE nurseflow_app_user WITH PASSWORD '<NEW_APP_RUNTIME_SECRET>';
   ```
4. **Environment Secret Injection:**
   - Update `.env.local` or container secrets management (HashiCorp Vault, AWS Secrets Manager, Doppler).
   - Ensure permissions on local secret files are restricted (`chmod 600 .env.local`).
   - Never commit `.env.local` to git (enforced by `.gitignore`).
5. **Session Termination & Invalidation:**
   Terminate any lingering pooled connections authenticated under the old secret:
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE usename IN ('postgres', 'nurseflow_app_user') AND pid <> pg_backend_pid();
   ```
6. **Application Restart & Validation:**
   Restart the NurseFlow service and execute health probes to verify successful authentication under new secrets.

---

## 4. Architectural Safeguards

To prevent future secret leakage:
1. **Pre-commit Hooks:** `.githooks/` configured to reject commits matching regex patterns for high-entropy secrets and DB passwords.
2. **Scratch Folder Policy:** Directory `scratch/` added to `.gitignore` for transient audit files, ensuring local debug scripts never get staged to git.
3. **Zero-Secret Logging Policy:** Application and test loggers must strictly redact connection strings and auth headers prior to console or file emission.
