# P0-2B WAVE 1B.0S — DOMAIN ENGINEERING & MIGRATION READINESS MATRIX

**Audit Date:** 2026-10-01  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Current Branch:** `feature/security-foundation-wave1a10`  
**Auditor:** Independent Security Auditor (Antigravity AI)  
**Audit Standard:** Read-Only Adversarial Forensic Analysis  

---

## 1. Executive Summary

This document establishes the multi-dimensional engineering and security matrix across the top 10 clinical and operational domains in NurseFlow Enterprise HIS.

In accordance with Section 17 of the P0-2B Wave 1B.0S Directive, this evaluation explicitly **avoids declaring arbitrary "winners", "best", or "worst" candidates**. Instead, it maps:
1. **Security Exposure:** The degree of multi-tenant vulnerability (RLS exposure, BOLA risk, un-isolated writes).
2. **Clinical Criticality:** Patient safety and regulatory blast radius.
3. **Engineering Complexity:** Cross-domain dependencies, transaction structure, and testing prerequisites.

---

## 2. Multi-Dimensional Domain Evaluation Matrix

| Domain Name | RLS Exposure | Patient-Safety Sensitivity | Cross-Domain Dependency | Transaction Complexity | Authorization Complexity | BOLA Exposure | Seeded-Data Availability | Test Coverage | Rollback Complexity | Blast Radius | UoW Migration Complexity |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Emergency / Triage** | HIGH | HIGH | HIGH | MEDIUM | MEDIUM | HIGH | HIGH | MEDIUM | MEDIUM | HIGH | MEDIUM |
| **2. Medication** | HIGH | HIGH | HIGH | HIGH | HIGH | HIGH | MEDIUM | MEDIUM | HIGH | HIGH | HIGH |
| **3. Nursing / CPPT** | HIGH | HIGH | MEDIUM | LOW | MEDIUM | HIGH | HIGH | LOW | LOW | MEDIUM | LOW |
| **4. Care Coordination** | HIGH | HIGH | HIGH | MEDIUM | MEDIUM | MEDIUM | HIGH | HIGH | MEDIUM | MEDIUM | MEDIUM |
| **5. Diagnostic / Lab** | HIGH | HIGH | HIGH | HIGH | MEDIUM | HIGH | MEDIUM | LOW | HIGH | HIGH | HIGH |
| **6. Radiology** | HIGH | HIGH | HIGH | HIGH | MEDIUM | HIGH | LOW | MEDIUM | MEDIUM | HIGH | HIGH |
| **7. Surgery / Perioperative**| HIGH | HIGH | HIGH | HIGH | HIGH | HIGH | LOW | LOW | HIGH | HIGH | HIGH |
| **8. Blood Bank** | HIGH | HIGH | HIGH | HIGH | HIGH | HIGH | LOW | LOW | HIGH | HIGH | HIGH |
| **9. Inventory** | MEDIUM | MEDIUM | HIGH | HIGH | MEDIUM | MEDIUM | LOW | LOW | HIGH | MEDIUM | MEDIUM |
| **10. Financial** | HIGH | LOW | HIGH | HIGH | MEDIUM | HIGH | MEDIUM | MEDIUM | HIGH | HIGH | HIGH |

---

## 3. Dimension-by-Domain Engineering Analysis

### 3.1 Emergency / Triage
- **Operational Metrics:** 20 request DB calls, 11 touching RLS tables, 5 writes outside UoW.
- **Engineering Profile:** Entry portal for acute patient encounters. Feeds encounters into Bed Management, CPPT, and CPOE. High seeded data availability because base encounters exist in dev DB. Moderate transaction complexity centered on triage score calculations and encounter lifecycle transitions.

### 3.2 Medication
- **Operational Metrics:** 80 request DB calls, 13 touching RLS tables, 23 writes outside UoW.
- **Engineering Profile:** High clinical severity (five rights of medication administration, LASA, high-alert narcotics). High transaction complexity involving stock reservation, dual-nurse verification, and eMAR timestamping. Significant rollback complexity if dispense records must be voided.

### 3.3 Nursing / CPPT
- **Operational Metrics:** 35 request DB calls, 15 touching RLS tables, 4 writes outside UoW.
- **Engineering Profile:** High RLS exposure across progress notes (`cppt_entries`) and vital signs. Low transaction complexity due to append-only note structures with immutable timestamps. Low UoW migration complexity, making it well-suited for early architectural standardization.

### 3.4 Care Coordination
- **Operational Metrics:** 39 request DB calls, 11 touching RLS tables, 13 writes outside UoW.
- **Engineering Profile:** Coordinates multidisciplinary care plans (`longitudinal_care_plans`). Highest test coverage among child domains due to Wave 1A.11 BOLA test suite. Good seeded data availability. Moderate transaction and migration complexity.

### 3.5 Diagnostic / Lab
- **Operational Metrics:** 71 request DB calls, 8 touching RLS tables, 16 writes outside UoW.
- **Engineering Profile:** LIS integration, specimen accessioning, and panic value alert dispatch. High transaction complexity involving order status updates, specimen tracking, and critical alert logs. Low automated test coverage currently.

### 3.6 Radiology
- **Operational Metrics:** 72 request DB calls, 19 touching RLS tables, 20 writes outside UoW.
- **Engineering Profile:** Highest single-domain RLS call count (19 calls touching `radiology_orders`, `radiology_critical_finding_alerts`, `radiology_instances`, `radiology_series`). High blast radius due to DICOM imaging links. Currently has 0 persistent rows in dev DB, requiring fixture seeding before migration.

### 3.7 Surgery / Perioperative
- **Operational Metrics:** 59 request DB calls, touches 7 RLS tables via child entities, 23 writes outside UoW.
- **Engineering Profile:** High clinical governance (WHO surgical checklist, anesthesia time-out, recovery aldrete scores). Complex multi-table transactions spanning OT booking, surgical team rosters, and post-op handoffs.

### 3.8 Blood Bank
- **Operational Metrics:** 44 request DB calls, 13 touching RLS tables, 23 writes outside UoW.
- **Engineering Profile:** Extreme clinical risk (ABO/Rh incompatibility, transfusion reactions). High authorization complexity requiring dual-nurse bedside verification. Complex multi-phase transaction lifecycles from crossmatch reservation to release.

### 3.9 Inventory
- **Operational Metrics:** 32 request DB calls, 12 writes outside UoW.
- **Engineering Profile:** Medium direct RLS exposure, but high cross-domain dependency with pharmacy and finance. High transaction complexity managing FIFO/FEFO batch ledgers and warehouse transfers.

### 3.10 Financial
- **Operational Metrics:** 45 request DB calls, 8 touching RLS tables, 15 writes outside UoW.
- **Engineering Profile:** Consumes billing line items from all clinical domains. Low immediate patient-safety sensitivity, but high regulatory and audit exposure. Complex split-invoice and BPJS INA-CBG grouping logic.

---

## 4. Conclusion & Workstream Guidance

No single domain can be isolated as an easy "quick win" without addressing its cross-domain dependencies. Domain-by-domain UoW migration must proceed in structured, dependency-aware clusters rather than ad-hoc controller modifications.
