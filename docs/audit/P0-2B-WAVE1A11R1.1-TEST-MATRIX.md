# P0-2B WAVE 1A.11R.1 STANDARDIZED REGRESSION MATRIX AUDIT

**Audit Date:** 2026-10-01  
**Auditor:** Independent Security Auditor (Antigravity AI)  
**Standard:** Enterprise HIS Strict Read-Only Adversarial Audit  
**Target Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Test Suite Audited:** `tests/p02b_wave1a11_security_regression.test.js`  

---

## 1. Executive Summary

This audit establishes the evolutionary lineage and semantic integrity of the 16-test Master Security Regression Suite across Waves 1A.9, 1A.10, and 1A.11.

In Wave 1A.10, the regression matrix was degraded from 16 tests to 14 tests, dropping critical vectors covering zero-policy table blackout and connection pool GUC leakage. In Wave 1A.11, the suite was expanded back to 16 tests.

An adversarial review of the 16 tests in `tests/p02b_wave1a11_security_regression.test.js` confirms that all 16 tests execute and pass (`16/16 PASS`). However, two tests exhibit **semantic decoupling from active system reality**:
- **TEST-12 (Application Restore Verification):** Decoupled from active runtime execution; asserts solely on static JSON file existence (`STATIC EVIDENCE CHECK`).
- **TEST-14 (Rollback Execution):** Tests application-level transaction rollback within `withUnitOfWork`, rather than database schema/migration rollback.

---

## 2. Complete 16-Test Evolutionary Lineage Mapping

| Standard Test ID | Security Vector Covered | Wave 1A.9 Baseline | Wave 1A.10 State | Wave 1A.11 State | Semantic Parity Preserved? | Adversarial Finding & Limitations |
|---|---|---|---|---|---|---|
| **TEST-01** | Superuser RLS Bypass Prevention & Runtime Identity Guard | Present (Pass) | Present (Pass) | Present (Pass) | **YES** | Verifies `rolsuper=false`, `rolbypassrls=false` on active connection pool. |
| **TEST-02** | Cross-Tenant Direct Primary Key Tampering (HTTP) | Present (Pass) | Present (Pass) | Present (Pass) | **YES** | Sends Tenant B token requesting Tenant A encounter ID via HTTP. Fails closed with 404. |
| **TEST-03** | Cross-Tenant Encounter ID Spoofing / Reference Hijack (HTTP) | Present (Pass) | Present (Pass) | Present (Pass) | **YES** | Attempts to create consultation referencing foreign encounter. Fails closed with 404/500. |
| **TEST-04** | Missing Tenant Context Rejection (Fail Closed) | Present (Pass) | Present (Pass) | Present (Pass) | **YES** | Requests API without tenant claim. Correctly rejected with 401/403. |
| **TEST-05** | Child-Table BOLA & Composite Foreign Key Protection | Present (Pass) | Present (Pass) | Present (Pass) | **PARTIAL** | Verifies composite FK rejection on DB level. (HTTP layer tested separately in child suite). |
| **TEST-06** | Zero-Policy Table Access Blackout Prevention | Present (Pass) | **DROPPED** | **RESTORED** | **YES** | Verifies that the 21 previously un-policied tables have default-deny RLS enabled. |
| **TEST-07** | Connection Pool GUC State Leakage & Concurrent Reuse | Present (Pass) | **DROPPED** | **RESTORED** | **YES** | Tests sequential checkout and verifies `set_config` does not leak across pool clients. |
| **TEST-08** | Client Query Path UoW Enforcement | Present (Pass) | Present (Pass) | Present (Pass) | **LIMITED** | Verifies that `withUnitOfWork` enforces valid UUID tenantId. (Does not prevent outside-UoW calls). |
| **TEST-09** | Dedicated Worker Role Context & Privilege Isolation | Present (Pass) | Present (Pass) | Present (Pass) | **YES** | Verifies worker identity injection and privilege boundaries. |
| **TEST-10** | DDL Privilege Escalation Guard | Present (Pass) | Present (Pass) | Present (Pass) | **YES** | Confirms `nurseflow_app_user` cannot execute `DROP TABLE master_patients`. |
| **TEST-11** | Universal Audit Log Cryptographic Integrity | Present (Pass) | Present (Pass) | Present (Pass) | **YES** | Asserts 64-character SHA-256 digital signature hashes on audit entries. |
| **TEST-12** | Application Restore Verification (Empirical Evidence Binding) | Present (Pass) | Present (Pass) | Present (Pass) | **NO (SOFTENED)** | **STATIC EVIDENCE CHECK.** Reads `scratch/wave1a11_application_restore_evidence.json` from disk. |
| **TEST-13** | Clinical Entity Data Integrity (Orphan/Null Checks) | Present (Pass) | Present (Pass) | Present (Pass) | **YES** | Verifies 0 NULL `tenant_id` records in `master_patients`. |
| **TEST-14** | Transaction Rollback Execution & Failure Isolation | Present (Pass) | Present (Pass) | Present (Pass) | **PARTIAL** | Tests `withUnitOfWork` error rollback; does not test schema migration rollback. |
| **TEST-15** | JWT Tenant Claim Tampering & Anti-Spoofing Detection | Present (Pass) | Present (Pass) | Present (Pass) | **YES** | Verifies rejection of forged or signature-tampered JWT tokens. |
| **TEST-16** | Schema Migration Tracking & Checksum Tamper Detection | Present (Pass) | Present (Pass) | Present (Pass) | **YES** | Verifies `schema_migrations` tracking table integrity and hash consistency. |

---

## 3. Detailed Inspection of Softened Test Vectors

### TEST-12: The Static JSON Anti-Pattern
```javascript
// tests/p02b_wave1a11_security_regression.test.js: lines 416-432
// TEST-12: Application Restore Verification
const restoreEvidenceExists = fs.existsSync('scratch/wave1a11_application_restore_evidence.json');
let restoreVerified = false;
if (restoreEvidenceExists) {
  const data = JSON.parse(fs.readFileSync('scratch/wave1a11_application_restore_evidence.json', 'utf8'));
  restoreVerified = data.overallResult === 'APPLICATION_RESTORE_VERIFIED' && 
                    Boolean(data.steps?.crossTenantReadDenial?.denied);
}
recordTest('TEST-12', 'Application Restore Verification', 'Empirical restore test completed successfully', restoreVerified ? 'VERIFIED_FACT' : 'NOT_VERIFIED', restoreVerified);
```
**Adversarial Finding:**
- An automated test in a regression suite should actively test system behavior.
- TEST-12 asserts only on the presence of a pre-baked JSON artifact produced by a previous manual or lab script.
- If the target database was corrupted or restored improperly, TEST-12 would still report **PASS** as long as the JSON artifact remained on disk.
- **Classification:** **`STATIC EVIDENCE CHECK`**, not active security regression verification.

### TEST-14: Scope of Rollback Verification
TEST-14 executes a business transaction inside `withUnitOfWork` that intentionally throws an error, confirming that an uncommitted insert is rolled back:
```javascript
// TEST-14: Transaction Rollback Execution
await withUnitOfWork({ tenantId: TENANT_A }, async ({ client, query }) => {
  await query("INSERT INTO universal_audit_logs (...) VALUES (...)");
  throw new Error("INTENTIONAL_SIMULATED_FAILURE");
});
```
While this verifies that `withUnitOfWork` correctly issues `ROLLBACK` on application exceptions, it provides **zero evidence** regarding whether database schema migrations (e.g. `079_down`) can be rolled back safely without corrupting the production database.

---

## 4. Audit Conclusion & Regression Gate Status

1. Full parity of test count (16/16) has been restored relative to the Wave 1A.9 baseline.
2. The core security assertions covering runtime role privileges (TEST-01, TEST-10), HTTP cross-tenant tampering (TEST-02, TEST-03, TEST-04), connection pool sanitization (TEST-07), audit trail hashing (TEST-11), and JWT tampering (TEST-15) are **robust and actively proven**.
3. TEST-12 must be upgraded in Wave 1B to perform a live restore connectivity probe rather than static JSON reading.
