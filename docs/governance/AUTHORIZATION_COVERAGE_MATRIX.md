# NURSEFLOW ENTERPRISE HIS — AUTHORIZATION COVERAGE MATRIX

**Status Dokumen:** `FORENSIC AUTHORIZATION INVENTORY`  
**Tanggal Audit:** 23 September 2026  
**Total Endpoint Teridentifikasi:** 142 Endpoint  

---

## 1. RINGKASAN CAKUPAN OTORISASI

- **Total Endpoints:** 142
- **Protected by Authentication (`authenticateJwt`):** 129 (90.8%)
- **Protected by Route-Level Authorization (`requirePermission` / `requireRole`):** 0 (0.0%)
- **Tested in P0-1 Verification Gate:** 0 endpoints
- **RBAC Global Status:** ⏳ **PENDING VERIFICATION** (Hanya 0 endpoint memiliki route-level guard formal; sisa endpoint mengandalkan service-level guard atau belum terproteksi granular).

---

## 2. INVENTARISASI DETAIL ENDPOINT

| Domain | Method | Endpoint | Authentication | Authorization | Required Permission/Role | Tested in P0-1? | Evidence |
| :--- | :---: | :--- | :---: | :---: | :--- | :---: | :--- |
| Observability & System Infrastructure | `GET` | `/health/live` | ❌ Public / Unprotected | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Observability & System Infrastructure | `GET` | `/health/ready` | ❌ Public / Unprotected | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Observability & System Infrastructure | `GET` | `/health/deep` | ❌ Public / Unprotected | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Observability & System Infrastructure | `GET` | `/metrics` | ❌ Public / Unprotected | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Observability & System Infrastructure | `GET` | `/docs` | ❌ Public / Unprotected | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/login` | ❌ Public / Unprotected | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/refresh` | ❌ Public / Unprotected | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/logout` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/me` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/:id` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `PATCH` | `/:id/status` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/assign` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/transfer` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/discharge` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/assessments` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/first-physician-contact` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Encounter & ADT | `GET` | `/encounter/:encounterId` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Clinical Documentation (EMR) | `POST` | `/soap` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Clinical Documentation (EMR) | `POST` | `/soap/:id/amend` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Encounter & ADT | `GET` | `/soap/encounter/:encounterId` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Clinical Documentation (EMR) | `POST` | `/cppt` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Clinical Documentation (EMR) | `PATCH` | `/cppt/:id/verify` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Encounter & ADT | `GET` | `/cppt/encounter/:encounterId` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| CPOE & Universal Orders | `POST` | `/cpoe` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| CPOE & Universal Orders | `POST` | `/cpoe/:id/cancel` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| CPOE & Universal Orders | `GET` | `/cpoe` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| CPOE & Universal Orders | `GET` | `/cpoe/:id` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Encounter & ADT | `GET` | `/cpoe/encounter/:encounterId` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/prescription` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Laboratory Information System (LIS) | `POST` | `/lab` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Radiology & PACS (RIS) | `POST` | `/radiology` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/ledger/:episodeId` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/specimens/generate` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/specimens/:id/collect` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/specimens/:id/accession` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/specimens/:id/results` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/results/:id/release` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/panic-alerts/:id/acknowledge` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/panic-alerts/:id/escalate` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| CPOE & Universal Orders | `GET` | `/orders/:orderId/specimens` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/worklist/generate` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/studies/acquire` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/studies/:id/reports` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/reports/:id/amend` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/critical-alerts/:id/acknowledge` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/critical-alerts/:id/escalate` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| CPOE & Universal Orders | `GET` | `/orders/:orderId/studies` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/prescribe` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/:id/pharmacist-review` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/:id/dispense` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/:id/administer` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/reconciliation/admission` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/reconciliation/discharge` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/administrations/:id/adverse-reaction` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/:id/cancel` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/observations` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/observations/:id/escalate` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/escalations/:id/acknowledge` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/rapid-response` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/observations/:id/reassess` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/notifications` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/notifications/:id/acknowledge` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/notifications/:id/interpret` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/interpretations/:id/actions` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Encounter & ADT | `GET` | `/encounters/:encounterId/timeline` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/care-plans` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/handovers` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/handovers/:id/acknowledge` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/discharge-summaries` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/preop-evaluations` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/who-checklist` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/implants` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Perioperative & Surgery | `POST` | `/pacu-records` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/cases/:id/finalize` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/cases/:id/abort` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/cases/:id/emergency` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/cases/:id/specimens` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Casemix & Clinical Coding | `POST` | `/coding-records` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/queries` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/queries/:id/respond` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Encounter & ADT | `POST` | `/encounters/:id/grouping` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Encounter & ADT | `POST` | `/encounters/:id/cross-audit` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/claims` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/deposits` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/invoices` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/payments` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/adjustments` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/shifts/reconcile` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/ar` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/units` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/units` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/crossmatch` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/transfusion/verify` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Staff Privileging & Rostering | `GET` | `/staff` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Staff Privileging & Rostering | `POST` | `/staff` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/credentials` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Staff Privileging & Rostering | `POST` | `/privileges` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/verify` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/:entityType` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/:entityType/:id` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/:entityType` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `PUT` | `/:entityType/:id` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/book` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/check-in` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/cancel` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/stock` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/receive` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/movements` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/logs` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/token` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/validate` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/transmit` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/capacity` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/emergency` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Finance, Billing & Cashier | `GET` | `/financial` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/safety` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/alerts` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Pharmacy & eMAR | `GET` | `/medications` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Pharmacy & eMAR | `GET` | `/medications/:id` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Pharmacy & eMAR | `POST` | `/medications` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Pharmacy & eMAR | `PUT` | `/medications/:id` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Pharmacy & eMAR | `PATCH` | `/medications/:id/archive` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Pharmacy & eMAR | `DELETE` | `/medications/:id` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/terminologies/search` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Patient Registry & Demographics | `GET` | `/patients/:patientId/allergies` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Patient Registry & Demographics | `POST` | `/patients/:patientId/allergies` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Patient Registry & Demographics | `PATCH` | `/patients/:patientId/allergies/:allergyId` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/formulary` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/formulary` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `PATCH` | `/formulary/:id` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Clinical Decision Support (CDSS) | `POST` | `/cdss/evaluate` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Clinical Decision Support (CDSS) | `POST` | `/cdss/executions/record` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Clinical Decision Support (CDSS) | `GET` | `/cdss/executions/:encounterId` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| Clinical Decision Support (CDSS) | `POST` | `/cdss/replay/:executionId` | ✅ Bearer JWT | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/worklist` | ❌ Public / Unprotected | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| CPOE & Universal Orders | `GET` | `/orders` | ❌ Public / Unprotected | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/studies` | ❌ Public / Unprotected | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/studies/:studyInstanceUid/metadata` | ❌ Public / Unprotected | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `GET` | `/studies/:studyInstanceUid/series/:seriesInstanceUid/instances/:sopInstanceUid/rendered` | ❌ Public / Unprotected | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
| General REST Core | `POST` | `/studies` | ❌ Public / Unprotected | ⚠️ None (Service-Only / Open) | `-` | ⏳ NO (Pending) | - |
