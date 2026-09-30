# NURSEFLOW GOVERNANCE DASHBOARD — EVIDENCE SOURCES SPECIFICATION

> **Document ID:** `NF-GOV-EVIDENCE-SOURCES-001`  
> **Status:** `RATIFIED`  
> **Classification:** `ENTERPRISE HIS AUDIT & EVIDENCE CATALOG`  
> **Author:** Governance Auditor & Forensic Analyst  
> **Date:** September 28, 2026  

---

## 1. Evidence Hierarchy & Trust Levels

Dashboard NurseFlow menggunakan sistem klasifikasi bukti bertingkat untuk menjamin bahwa seluruh klaim status diverifikasi secara objektif:

1. **Level 1 — DIRECT Physical Execution Proof (Highest Trust):**
   - Hasil uji otomatis yang lulus (`tests/*.test.js`).
   - Eksekusi sandbox terisolasi (`scratch/test_pool_leak_scenario.js`).
   - Scan katalog sistem PostgreSQL (`pg_policy`, `pg_roles`, `information_schema`).

2. **Level 2 — DERIVED Structural Repository Evidence:**
   - Scan rute Express (`server/routes/*.js`) untuk mendeteksi keberadaan middleware.
   - Perhitungan kueri mentah (`client.query`) pada `server/services/*.js`.
   - Hitungan berkas migrasi pada `database/migrations/*.sql`.

3. **Level 3 — DOCUMENTED Signed Audit Reports:**
   - Dokumen formal pada `docs/audit/` yang ditandatangani oleh Security Auditor.
   - Dokumen baseline otorisasi pada `docs/governance/`.

4. **Level 4 — MANUAL / UNVERIFIED (Lowest Trust):**
   - Catatan rapat atau komentar kode yang belum didukung oleh kode fisik atau pengujian.

---

## 2. Master Evidence Catalog

| Evidence ID | Sumber Repositori | Klaim / Fakta Fisik | Tingkat Kepercayaan |
|---|---|---|---|
| **EV-POOL-01** | `scratch/test_pool_leak_scenario.js:16-37` | Uncommitted client release retains `SET LOCAL app.current_tenant_id` for next client lease. | **DIRECT (Level 1)** |
| **EV-RLS-01** | `scratch/audit_21_zero_tables.js:1-80` | All 21 tables contain `tenant_id`, but 0 policies are defined in `pg_policy`. | **DIRECT (Level 1)** |
| **EV-RLS-02** | `database/migrations/032_postgresql_rls_and_pki_lifecycle.sql` | 5 tables evaluate `USING (current_setting IS NULL OR tenant_id = ...)`, allowing unauthenticated leak. | **DERIVED (Level 2)** |
| **EV-BOLA-01** | `server/services/medicationClosedLoop.service.js:1318` | `SELECT * FROM medication_emar_administrations WHERE id = $1 FOR UPDATE` lacks tenant check. | **DERIVED (Level 2)** |
| **EV-AUTH-01** | `scratch/tier1_exact_inventory.json` | 0 of 38 Tier-1 routes mount `requireClinicalAuthorization`. | **DIRECT (Level 1)** |
| **EV-ROLE-01** | `pg_roles` & `information_schema.role_table_grants` | `nurseflow_app_user` cannot login and has TRUNCATE on 212 tables; runtime runs as superuser `postgres`. | **DIRECT (Level 1)** |
| **EV-FALLBACK-01**| 38 files in `server/controllers/` | Fallback to hardcoded UUID `00000000-0000-0000-0000-000000000001` bypasses fail-closed isolation. | **DERIVED (Level 2)** |
| **EV-JWT-01** | `src/core/security/jwtSecurity.service.js:32` | In-memory JS Set `SERVER_TOKEN_BLACKLIST` is not synchronized across multi-node cluster. | **DERIVED (Level 2)** |
| **EV-JWT-02** | `src/core/security/jwtSecurity.service.js:211` | `rotateRefreshToken()` omits `tenantId`, falling back to default tenant. | **DERIVED (Level 2)** |
