# P0-2B Wave 1A.11R — Security Regression Test Suite Reconciliation

**Document Identifier:** `SEC-AUD-P02B-W1A11R-TESTS-20261001`  
**Document Type:** Test Suite Reconciliation, Assertion Audit & Coverage Lineage Report  
**Author Role:** Independent Adversarial Security Auditor & Quality Assurance Specialist  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Current Branch:** `feature/security-foundation-wave1a10`  
**Status:** **`16/16 TESTS PASS EXECUTED` | `REGRESSION COVERAGE = VERIFIED_WITH_LIMITATION`**

---

## 1. Executive Summary

Wave 1A.10 reported 14 tests passing, omitting 5 critical vectors originally established in Wave 1A.9 (Worker isolation, zero-policy blackout, migration rollback, forged UUID claims, and schema checksum).

In Wave 1A.11, the engineering team expanded the master security regression runner (`tests/p02b_wave1a11_security_regression.test.js`) back to a full **16-test suite**, reporting `16/16 PASS`.

This independent audit conducted a line-by-line reconciliation across Wave 1A.9, Wave 1A.10, and Wave 1A.11 to determine whether the restored 16 tests represent genuine technical parity or merely superficial assertion replacements.

---

## 2. Granular Three-Wave Test Lineage Matrix

| Standard Vector | Wave 1A.9 (Original) | Wave 1A.10 (Reduced) | Wave 1A.11 (Restored) | Category in 1A.11 | Technical Assessment of 1A.11 Implementation |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TEST-01** | Superuser RLS Bypass | Test 1: App User Identity | TEST-01: App User Identity | `SAME` | Checks `pg_roles` for `nurseflow_app_user` flags (`rolsuper=false`, `rolbypassrls=false`). **`VALID`** |
| **TEST-02** | Cross-Tenant Direct PK | Test 7: HTTP GET foreign enc | TEST-02: HTTP GET foreign enc | `ENHANCED` | Real HTTP GET on foreign encounter ID (`404/403 Blocked`). **`VALID`** |
| **TEST-03** | Cross-Tenant ID Spoofing | Test 8: HTTP PATCH foreign enc | TEST-03: HTTP PATCH foreign enc | `ENHANCED` | Real HTTP PATCH status transition on foreign encounter (`404/403 Blocked`). **`VALID`** |
| **TEST-04** | Missing Tenant Context | Test 9: Unauthenticated HTTP | TEST-04: withUnitOfWork fails closed | `RE-IMPLEMENTED` | Direct unit assertion on `withUnitOfWork(null)` expecting `AUTHORITATIVE_TENANT_REQUIRED`. **`VALID`** |
| **TEST-05** | Child Orphan Injection | Test 11: Composite FK SQL | TEST-05: Composite FK SQL | `SAME` | Direct SQL insert on `longitudinal_care_plans` expecting PostgreSQL FK error `23503`. **`VALID`** |
| **TEST-06** | Zero-Policy Blackout | *Omitted* | TEST-06: Zero-Policy Blackout | `RE-IMPLEMENTED` | Queries `pg_class` & `pg_policies` to verify 0 tables have RLS enabled with 0 policies. **`VALID`** |
| **TEST-07** | Connection Pool GUC Leak | Test 12/13: Pool Reuse | TEST-07: Pool Reuse & DISCARD | `RE-IMPLEMENTED` | Single connection transaction and DISCARD ALL check; concurrent drill moved to scratch. **`PARTIAL`** |
| **TEST-08** | Client Query Path UoW | Test 5/6: Tenant A/B Data | TEST-08: Transaction Tenant GUC | `RE-IMPLEMENTED` | Asserts `app.current_tenant_id` matches Tenant A inside transaction. **`VALID`** |
| **TEST-09** | Outbox Worker Isolation | *Omitted* | TEST-09: Worker Role Context | `RE-IMPLEMENTED` | Checks `pg_roles` for `nurseflow_worker` (`rolsuper=false`, `rolbypassrls=false`). **`VALID`** |
| **TEST-10** | DDL Escalation Guard | Test 2: DROP TABLE Blocked | TEST-10: DROP TABLE Blocked | `SAME` | Runtime app user attempts `DROP TABLE master_patients`, asserts permission denied. **`VALID`** |
| **TEST-11** | Clinical Audit Integrity | Test 12 (Implicit) | TEST-11: Audit Signature Hashes | `RE-IMPLEMENTED` | Asserts `universal_audit_logs` records have valid 64-char SHA-256 signature hash. **`VALID`** |
| **TEST-12** | Database Restore PITR | Test 14 (Invalid Express) | TEST-12: Application Restore | `REPLACEMENT` | **CRITICAL LIMITATION:** Test reads pre-recorded static JSON file rather than running active drill! |
| **TEST-13** | Entity Data Integrity | *Omitted* | TEST-13: 0 NULL tenant records | `RE-IMPLEMENTED` | Queries `master_patients` asserting 0 records have `tenant_id IS NULL`. **`VALID`** |
| **TEST-14** | Migration Rollback Drill | *Omitted* | TEST-14: Transaction Rollback | `REPLACEMENT` | Replaced full migration rollback drill with a simple `withUnitOfWork` rollback assertion! |
| **TEST-15** | JWT Claim Tampering | *Omitted* | TEST-15: JWT Tenant Spoofing | `RE-IMPLEMENTED` | Sends HTTP request with Token A and conflicting `X-Tenant-ID` header; asserts 403 Forbidden. **`VALID`** |
| **TEST-16** | Schema Checksum Verify | *Omitted* | TEST-16: Migration Tracking | `REPLACEMENT` | Replaced 213-table schema catalog checksum with a count check on `schema_migrations` (>= 79). |

---

## 3. Forensic Examination of Test Assertions

### 3.1 TEST-12 (Application Restore Verification): Static Evidence Binding
Lines 417–432:
```javascript
const restoreEvidenceExists = fs.existsSync('scratch/wave1a11_application_restore_evidence.json');
let restoreVerified = false;
if (restoreEvidenceExists) {
  const data = JSON.parse(fs.readFileSync('scratch/wave1a11_application_restore_evidence.json', 'utf8'));
  restoreVerified = data.overallResult === 'APPLICATION_RESTORE_VERIFIED' && Boolean(data.steps?.crossTenantReadDenial?.denied);
}
recordTest('TEST-12', 'Application Restore Verification...', 'Empirical restore test completed successfully', ...);
```
- **Adversarial Assessment:** This test does not execute any backup, restore, process spawning, or HTTP requests. It is a static assertion that a JSON artifact exists on the file system. If a subsequent code commit breaks application restore, this test will continue to report `PASS`.
- **Verdict:** **`STATIC_EVIDENCE_BINDING (NOT AN ACTIVE TEST)`**

### 3.2 TEST-14 (Rollback Execution): Shift from Migration to Unit Rollback
In Wave 1A.9, TEST-14 was designed as an automated migration rollback drill (`079_down`). In Wave 1A.11:
```javascript
await withUnitOfWork(pool, { tenantId: TENANT_A }, async ({ query }) => {
  await query("INSERT INTO master_patients ... VALUES (...);");
  throw new Error('INTENTIONAL_ERROR_FOR_ROLLBACK_TEST');
});
```
- **Adversarial Assessment:** This tests that `withUnitOfWork` issues `ROLLBACK` when an error is thrown. While valid as a Unit of Work test, it is NOT an automated verification of database migration rollbacks. Migration rollback parity remains verified only in an isolated scratch harness (`scratch/verify_rollback_lifecycle.js`).
- **Verdict:** **`VALID UNIT TEST / NOT A MIGRATION ROLLBACK DRILL`**

### 3.3 TEST-16 (Schema Migration Tracking vs Checksum):
In Wave 1A.9, TEST-16 computed a SHA-256 hash across all 213 table definitions in the PostgreSQL catalog to detect uncommitted drift. In Wave 1A.11:
```javascript
const migRes = await migClient.query("SELECT count(*) FROM schema_migrations WHERE status = 'APPLIED' AND checksum IS NOT NULL;");
const migrationsTrackedCount = parseInt(migRes.rows[0].count, 10);
const migrationTrackingValid = migrationsTrackedCount >= 79;
```
- **Adversarial Assessment:** This verifies that `schema_migrations` contains at least 79 records. It does not inspect table catalog drift or duplicate policies.
- **Verdict:** **`VALID TRACKING CHECK / NARROWER THAN FULL CATALOG CHECKSUM`**

---

## 4. Security Verdict

- **Automated Runner Output:** **`16/16 PASS`** (Verified via code inspection and test execution).
- **Substantive Security Coverage:** 13 tests execute live assertions; 1 test binds to static JSON (TEST-12); 2 tests have narrower assertion scopes than Wave 1A.9 (TEST-14, TEST-16).
- **Classification:** **`REGRESSION COVERAGE = VERIFIED_WITH_LIMITATION`**
- **Wave 1B Recommendation:** Re-implement an active restore check and full catalog drift hashing within the automated CI runner.
