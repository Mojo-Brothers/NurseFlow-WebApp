# P0-2B Wave 1A.1 — Authorization Capability Closure Audit Report

**Document ID:** `DOC-P02B-W1A1-CLOSURE`  
**Date:** 2026-09-26  
**Auditor:** Principal Security Engineer & Clinical Authorization Systems Architect  
**Classification:** STRICT FORENSIC AUDIT (READ-ONLY)  
**Status:** **WAVE 1B = HARD HOLD**  

---

## 1. Executive Summary

This forensic audit evaluates the **18 capability gaps** identified during the Wave 1A baseline assessment of the **38 Tier 1 Critical Clinical Routes** in NurseFlow Enterprise HIS.

The objective of Wave 1A.1 is to definitively classify each gap as a genuine missing capability, duplicate, misclassified, or architectural dependency, and establish the prerequisites required before **Wave 1B (Route Middleware Mounting)** can safely proceed.

### Key Audit Findings Summary

| Audit Domain | Analyzed | Key Discovery / Classification | Impact on Wave 1B |
| :--- | :---: | :--- | :--- |
| **8 Missing Permissions** | 8 | **7 Genuinely Missing**, **1 Misclassified** (`BLOOD_BANK_WRITE` is Operational RBAC, not Clinical Privilege) | SSOT update required in `roles.js` |
| **SURGICAL_SAFETY_SIGN** | 1 | **Missing Role Mapping** (Defined in `CLINICAL_PERMISSIONS`, but mapped to 0 roles in `ROLE_PERMISSIONS_MATRIX`) | Role mapping required |
| **4 Resource Types** | 4 | **All 4 Lack SQL Resolvers** in `resourceAuthorization.service.js` (`SURGERY_CASE`, `BLOOD_UNIT`, `MEDICATION_ORDER`, `CLINICAL_NOTE`) | Resolver extension required |
| **BOLA / IDOR Exposure** | 17 | **15 Genuine BOLA Gaps** (Direct SQL without tenant check), **2 Partial Service Mitigations** | Severe risk of cross-tenant exposure |
| **Idempotency Semantics** | 30 | **18 Require Idempotency**, **10 Require Domain Protection**, **2 Do Not Require Idempotency** | Prevents duplicate orders & charges |
| **P0-2A Compatibility** | 7 components | Middleware & contracts are compatible; `resourceAuthorizationService` requires SQL resolvers | Extension required |

### Hard Stop Declaration
> [!CAUTION]
> **GATE VERDICT: WAVE 1B REMAINS ON HARD HOLD.**  
> Mounting `requireClinicalAuthorization` or activating enforcement on production routes without first closing the SSOT permission gaps, role matrix mappings, and tenant-isolated resource resolvers will cause systemic HTTP 403 authorization denials for legitimate clinical staff and severe operational hospital paralysis.

---

## 2. Forensic Audit of the 8 Missing Permissions

Each of the 8 permissions flagged in Wave 1A was individually investigated against source code, controllers, database models, clinical workflows, and Indonesian Hospital Accreditation Standards (KARS/Permenkes).

### 2.1 `SURGICAL_PREOP_WRITE`
- **Route:** `POST /api/v1/perioperative/preop-evaluations` ([server/routes/perioperativeClosedLoop.routes.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/perioperativeClosedLoop.routes.js#L13))
- **Clinical Action:** Execution and documentation of pre-anesthesia evaluation (ASA Physical Status classification I-V, Mallampati airway assessment, fasting compliance, pre-anesthetic clearance).
- **Business Meaning:** Mandatory medicolegal risk clearance prior to surgical induction. An unauthorized entry could allow an unqualified provider to clear high-risk surgical patients.
- **Existing Equivalent:** None. Existing `EMR_WRITE` or general documentation permissions do not grant anesthetic risk clearance authority.
- **Is New Permission Required:** **YES**.
- **Current Role Able:** Any authenticated user (`authenticateJwt` only).
- **Expected Authorized Roles:** `ROLE_ANESTHESIOLOGIST`, `ROLE_DOCTOR_DPJP`.
- **Classification:** **Clinical Privilege** (Mandatory active SIP, specialized anesthesia credentials).
- **SoD Implication:** Anesthesia clearance cannot be overruled or signed by hospital administrative staff.
- **BTG Implication:** **YES**. Emergency trauma / crash laparotomy allows retroactive completion under life-saving BTG override.
- **Audit Requirement:** KARS PAB (Pelayanan Anestesi dan Bedah) standard compliance.
- **Audit Status:** **GENUINELY_MISSING**.

---

### 2.2 `SURGICAL_IMPLANT_RECORD`
- **Route:** `POST /api/v1/perioperative/implants` ([server/routes/perioperativeClosedLoop.routes.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/perioperativeClosedLoop.routes.js#L19))
- **Clinical Action:** Logging implantable medical devices, pacemakers, orthopedic hardware, intraocular lenses, or surgical mesh with UDI (Unique Device Identifier), batch/lot numbers, and anatomical placement.
- **Business Meaning:** Post-market vigilance and medical device traceability required by BPOM and Permenkes.
- **Existing Equivalent:** None.
- **Is New Permission Required:** **YES**.
- **Current Role Able:** Any authenticated user (`authenticateJwt` only).
- **Expected Authorized Roles:** `ROLE_DOCTOR_DPJP` (Surgeon), `ROLE_NURSE` (OR Scrub/Circulator Nurse).
- **Classification:** **Clinical Privilege / Dual Nursing Procedure**.
- **SoD Implication:** Two-person verification: scrub nurse scans UDI barcode; primary surgeon verifies anatomical placement.
- **BTG Implication:** **NO**. Medical device traceability must always be maintained; emergency bypass does not waive device tracking.
- **Audit Requirement:** National Medical Device Vigilance Registry, hospital tissue/implant tracking audit.
- **Audit Status:** **GENUINELY_MISSING**.

---

### 2.3 `SURGICAL_PACU_WRITE`
- **Route:** `POST /api/v1/perioperative/pacu-records` ([server/routes/perioperativeClosedLoop.routes.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/perioperativeClosedLoop.routes.js#L22))
- **Clinical Action:** Documentation of Post-Anesthesia Care Unit (PACU) recovery, vital signs time-series, Aldrete / Bromage / Steward score calculations, and discharge criteria.
- **Business Meaning:** Formal authorization to discharge a post-operative patient from PACU to the general inpatient ward or home.
- **Existing Equivalent:** None.
- **Is New Permission Required:** **YES**.
- **Current Role Able:** Any authenticated user (`authenticateJwt` only).
- **Expected Authorized Roles:** `ROLE_NURSE` (PACU Certified), `ROLE_ANESTHESIOLOGIST`.
- **Classification:** **Clinical Privilege** (PACU critical care nurse certification, active STR).
- **SoD Implication:** Discharging PACU nurse cannot be the ward receiving nurse (handover dual control).
- **BTG Implication:** **NO**. Aldrete score calculation cannot be bypassed.
- **Audit Requirement:** KARS PAB.7.3 compliance, perioperative recovery metrics.
- **Audit Status:** **GENUINELY_MISSING**.

---

### 2.4 `PERIOPERATIVE_ABORT`
- **Route:** `POST /api/v1/perioperative/cases/:id/abort` ([server/routes/perioperativeClosedLoop.routes.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/perioperativeClosedLoop.routes.js#L28))
- **Clinical Action:** Emergency intraoperative cancellation/termination of surgery due to acute cardiac arrest, malignant hyperthermia, uncontrolled hemorrhage, or sudden instability.
- **Business Meaning:** Halts surgical procedure, documents medicolegal rationale for premature termination, transitions patient to emergency resuscitation/ICU.
- **Existing Equivalent:** None. (`CPOE_ORDER_CANCEL` governs medication orders, not active surgical cases).
- **Is New Permission Required:** **YES**.
- **Current Role Able:** Any authenticated user (`authenticateJwt` only).
- **Expected Authorized Roles:** `ROLE_DOCTOR_DPJP` (Lead Surgeon), `ROLE_ANESTHESIOLOGIST`.
- **Classification:** **Clinical Privilege** (Surgical DPJP with active SIP).
- **SoD Implication:** Cannot be triggered by non-surgical staff, circulating nurse, or billing staff.
- **BTG Implication:** **YES**. Attending anesthesiologist may invoke abort under BTG if lead surgeon is incapacitated.
- **Audit Requirement:** Mandatory Root Cause Analysis / Audit Medik Komite Medis within 24 hours.
- **Audit Status:** **GENUINELY_MISSING**.

---

### 2.5 `PERIOPERATIVE_EMERGENCY`
- **Route:** `POST /api/v1/perioperative/cases/:id/emergency` ([server/routes/perioperativeClosedLoop.routes.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/perioperativeClosedLoop.routes.js#L31))
- **Clinical Action:** Operating Theatre emergency code activation (Code Blue OR, Massive Transfusion Protocol, emergency stat alert).
- **Business Meaning:** High-urgency alert state transitioning the surgical case to critical emergency resuscitation protocols and priority resource allocation.
- **Existing Equivalent:** None.
- **Is New Permission Required:** **YES**.
- **Current Role Able:** Any authenticated user (`authenticateJwt` only).
- **Expected Authorized Roles:** `ROLE_DOCTOR_DPJP`, `ROLE_ANESTHESIOLOGIST`, `ROLE_NURSE` (OR Nurse).
- **Classification:** **Clinical Privilege** with wide emergency trigger access.
- **SoD Implication:** **NONE**. Any surgical team member inside the OR must have immediate trigger authority.
- **BTG Implication:** **YES**. Inherent emergency override; incoming resuscitation team can access case under BTG.
- **Audit Requirement:** Critical Event Audit Log, Hospital Resuscitation Committee Audit.
- **Audit Status:** **GENUINELY_MISSING**.

---

### 2.6 `SURGICAL_SPECIMEN_RECORD`
- **Route:** `POST /api/v1/perioperative/cases/:id/specimens` ([server/routes/perioperativeClosedLoop.routes.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/perioperativeClosedLoop.routes.js#L34))
- **Clinical Action:** Surgical pathology specimen logging (frozen section, biopsy, organ resection), fixation time, container labeling, and chain-of-custody transfer.
- **Business Meaning:** Medicolegal custody verification ensuring surgical specimens reach Pathology Anatomy (PA) laboratory without loss, mislabeling, or delay.
- **Existing Equivalent:** None.
- **Is New Permission Required:** **YES**.
- **Current Role Able:** Any authenticated user (`authenticateJwt` only).
- **Expected Authorized Roles:** `ROLE_DOCTOR_DPJP`, `ROLE_NURSE` (OR Nurse).
- **Classification:** **Clinical Privilege** (Clinical and Nursing procedural action).
- **SoD Implication:** Dual sign-off: Surgeon documents anatomical origin, circulating nurse verifies container barcode.
- **BTG Implication:** **NO**.
- **Audit Requirement:** Laboratory Chain of Custody & ISO 15189 accreditation compliance.
- **Audit Status:** **GENUINELY_MISSING**.

---

### 2.7 `MED_ADVERSE_RECORD`
- **Route:** `POST /api/v1/medication/administrations/:id/adverse-reaction` ([server/routes/medicationClosedLoop.routes.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/medicationClosedLoop.routes.js#L32))
- **Clinical Action:** Pharmacovigilance documentation of adverse drug reaction (ADR), anaphylaxis, rash, or toxicity following medication administration.
- **Business Meaning:** Immediate clinical documentation to trigger allergy flagging in patient record, alert pharmacy, and notify national pharmacovigilance (MESO / BPOM).
- **Existing Equivalent:** None.
- **Is New Permission Required:** **YES**.
- **Current Role Able:** Any authenticated user (`authenticateJwt` only).
- **Expected Authorized Roles:** `ROLE_NURSE`, `ROLE_DOCTOR_DPJP`, `ROLE_PHARMACIST`.
- **Classification:** **Clinical Privilege** (Active clinical license STR/SIP).
- **SoD Implication:** Tamper-evident append-only record; cannot be deleted or modified by administering nurse.
- **BTG Implication:** **YES**. Any licensed clinician witnessing acute reaction must be allowed to record even if not primary care team.
- **Audit Requirement:** National Pharmacovigilance / MESO BPOM & KARS Patient Safety Incident (IKP).
- **Audit Status:** **GENUINELY_MISSING**.

---

### 2.8 `BLOOD_BANK_WRITE`
- **Route:** `POST /api/v1/blood-bank/units` ([server/routes/bloodBank.routes.js](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes/bloodBank.routes.js#L9))
- **Clinical Action:** Physical inventory intake of donor blood bags (whole blood, PRBC, FFP, platelets) from PMI or mobile donation drives into hospital blood bank storage.
- **Business Meaning:** Supply chain asset registration: enters bag barcode, ABO/Rh group, collection/expiry dates, and serology test status.
- **Existing Equivalent:** Route currently enforces `requireRole(['BLOOD_BANK_OFFICER', 'ADMIN', 'SUPERVISOR'])`. For clinical transfusion, permissions `TRANSFUSION_CROSSMATCH` and `TRANSFUSION_AUTHORIZE` already exist in `CLINICAL_PERMISSIONS`.
- **Is New Permission Required:** **NO** (as a clinical permission). Should be modeled as an ordinary operational RBAC permission: `BLOOD_BANK_INVENTORY_WRITE`.
- **Current Role Able:** `BLOOD_BANK_OFFICER`, `ADMIN`, `SUPERVISOR`.
- **Expected Authorized Roles:** `ROLE_BLOOD_BANK_OFFICER`, `ROLE_LAB_ANALYST`.
- **Classification:** **Ordinary RBAC Permission** (Laboratory Inventory Operational, NOT Clinical Privilege).
- **SoD Implication:** Intake officer cannot self-authorize unit quarantine release without second analyst verification.
- **BTG Implication:** **NO**. Blood inventory intake is a supply chain activity; no clinical emergency override semantics apply.
- **Audit Requirement:** Blood cold-chain custody & Permenkes 91/2015 BDRS standards.
- **Audit Status:** **MISCLASSIFIED**.

---

## 3. Forensic Analysis: `SURGICAL_SAFETY_SIGN`

### Context & Discovery
In Wave 1A, the route `POST /api/v1/perioperative/who-checklist` was noted as lacking authorization middleware. The conceptual permission `SURGICAL_SAFETY_SIGN` was audited to determine its exact status in the codebase.

### Evidence from Source Code
1. In [`src/shared/constants/roles.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/shared/constants/roles.js#L54):
   ```javascript
   // line 54
   SURGICAL_SAFETY_SIGN: 'SURGICAL_SAFETY_SIGN',
   ```
   `SURGICAL_SAFETY_SIGN` **already exists** in the `CLINICAL_PERMISSIONS` object definition!

2. In `ROLE_PERMISSIONS_MATRIX` within [`src/shared/constants/roles.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/shared/constants/roles.js#L180-L310):
   - `ROLE_DOCTOR_DPJP`: Does **NOT** contain `SURGICAL_SAFETY_SIGN`.
   - `ROLE_ANESTHESIOLOGIST`: Does **NOT** contain `SURGICAL_SAFETY_SIGN`.
   - `ROLE_NURSE`: Does **NOT** contain `SURGICAL_SAFETY_SIGN`.
   - Result: `SURGICAL_SAFETY_SIGN` is mapped to **ZERO** roles in the system.

### Classification Verdict
- **Status:** **MISSING ROLE MAPPING** (Category 4).
- **Root Cause:** The permission was architecturally envisioned and declared in the constant dictionary, but omitted when populating `ROLE_PERMISSIONS_MATRIX`.
- **Consequence of Premature Mounting:** If `requirePermission('SURGICAL_SAFETY_SIGN')` were mounted to `POST /who-checklist` today, **100% of surgical team members would be denied with HTTP 403 Forbidden**, paralyzing the operating theatre.
- **Remediation:** Map `SURGICAL_SAFETY_SIGN` to `ROLE_DOCTOR_DPJP`, `ROLE_ANESTHESIOLOGIST`, and `ROLE_NURSE` in `ROLE_PERMISSIONS_MATRIX` during Wave 1B configuration update.

---

## 4. Deep Audit of the 4 Resource Types

The 4 core clinical resources missing from `resourceAuthorization.service.js` were audited for database ownership, multi-tenancy, and relationship traceability:

| Resource Type | DB Table & Migration | Primary Key | Tenant Key | Patient Relationship | Encounter Relationship | Care Team Relationship | Resolver Status in P0-2A |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SURGERY_CASE** | `surgical_cases` (019) | `id` (UUID) | `tenant_id` (UUID) | Direct (`patient_id`) | Direct (`encounter_id`) | `primary_surgeon_id`, `anesthesiologist_id` | **P0-2A_EXTENSION_REQUIRED** |
| **BLOOD_UNIT** | `blood_donor_units` (013) | `id` (UUID) | `tenant_id` (UUID) | Conditional (`reserved_for_patient_id`) | Conditional (`reserved_for_encounter_id`) | Indirect via `encounters.primary_doctor_id` | **P0-2A_EXTENSION_REQUIRED** |
| **MEDICATION_ORDER** | `medication_orders` (056) | `id` (UUID) | `tenant_id` (UUID) | Direct (`patient_id`) | Direct (`encounter_id`) | `prescriber_id`, attending DPJP | **P0-2A_EXTENSION_REQUIRED** |
| **CLINICAL_NOTE** | `soap_notes` / `cppt_notes` (005) | `id` (UUID) | `tenant_id` (UUID) | Direct (`patient_id`) | Direct (`encounter_id`) | `doctor_id`, `created_by`, `verified_by` | **P0-2A_EXTENSION_REQUIRED** |

### Detailed Resource Assessments

1. **SURGERY_CASE (`surgical_cases`):**
   - **Direct patientId:** YES (`patient_id` column exists).
   - **Existing Resolver:** NO. `verifyResourceAccess` throws or denies because `SURGERY_CASE` is unhandled.
   - **Cross-Tenant Risk:** CRITICAL. Internal queries in `perioperativeClosedLoopService` use `WHERE id = $1` without filtering by `tenant_id`.
   - **Context Resolution:** Readily resolvable from `req.params.id`.

2. **BLOOD_UNIT (`blood_donor_units`):**
   - **Direct patientId:** Conditional. During inventory storage, `reserved_for_patient_id` is `NULL`. Once crossmatched for a patient, it stores the patient UUID.
   - **Existing Resolver:** NO.
   - **Cross-Tenant Risk:** HIGH. Unisolated inventory allows crossmatching units across tenant boundaries.
   - **Context Resolution:** Resolvable from `req.body.donorUnitId` or `req.params.id`.

3. **MEDICATION_ORDER (`medication_orders`):**
   - **Direct patientId:** YES (`patient_id` column exists).
   - **Existing Resolver:** INSUFFICIENT. `resourceAuthorizationService` has a resolver for `clinical_orders`, but NOT for `medication_orders` (created in Migration 056).
   - **Cross-Tenant Risk:** CRITICAL. Dispensing or administering orders by raw UUID can mutate patient records in another tenant.
   - **Context Resolution:** Resolvable from `req.params.id`.

4. **CLINICAL_NOTE (`soap_notes` & `cppt_notes`):**
   - **Direct patientId:** YES (`patient_id` column exists).
   - **Existing Resolver:** NO.
   - **Cross-Tenant Risk:** CRITICAL. Amending SOAP or verifying CPPT by UUID allows unauthorized doctors to edit notes of other hospitals.
   - **Context Resolution:** Resolvable from `req.params.id` or `req.params.encounterId`.

---

## 5. Actual Resource Authorization Graph

Based strictly on the database schema from migrations `001` through `056`, the verified entity relationship graph is:

```
Actor (User/Staff) [staff.id, tenant_id, role, sip, str]
  │
  ├── [belongs_to] ──► Tenant Organization [tenant_organizations.id]
  │                      │
  │                      ├── [tenant_isolation: tenant_id = $2]
  │                      ▼
  │                   Resources in Database:
  │                      ├── surgical_cases [id, tenant_id]
  │                      │     ├── patient_id ───────────────► master_patients [id]
  │                      │     ├── encounter_id ─────────────► encounters [id]
  │                      │     └── primary_surgeon_id ───────► staff [id] (Care Team)
  │                      │
  │                      ├── blood_donor_units [id, tenant_id]
  │                      │     ├── reserved_for_patient_id ──► master_patients [id] (Conditional)
  │                      │     └── reserved_for_encounter_id ─► encounters [id] (Conditional)
  │                      │
  │                      ├── medication_orders [id, tenant_id]
  │                      │     ├── patient_id ───────────────► master_patients [id]
  │                      │     ├── encounter_id ─────────────► encounters [id]
  │                      │     └── prescriber_id ────────────► staff [id] (Care Team)
  │                      │
  │                      └── soap_notes / cppt_notes [id, tenant_id]
  │                            ├── patient_id ───────────────► master_patients [id]
  │                            ├── encounter_id ─────────────► encounters [id]
  │                            └── doctor_id / created_by ───► staff [id] (Care Team)
  │                                                                 ▲
  └── [authorized_member_of] ───────────────────────────────────────┘
```

> [!NOTE]
> **RESOURCE_RELATIONSHIP_GAP in `blood_donor_units`:**  
> When a blood donor unit is in unallocated storage, `reserved_for_patient_id` and `reserved_for_encounter_id` are `NULL`. Therefore, care-team authorization cannot be evaluated for donor unit intake or storage inspection; it must rely strictly on Tenant Isolation and Operational RBAC (`BLOOD_BANK_OFFICER`).

---

## 6. Forensic BOLA / IDOR Analysis (17 Parameter Routes)

The 17 routes accepting path identifiers (`:id`, `:encounterId`) were audited from route entry through controller, service, and database queries:

| Route & File | Param | Target Table | Audit Classification | Execution Path Vulnerability Assessment |
| :--- | :--- | :--- | :--- | :--- |
| `POST /:id/pharmacist-review` (medication) | `:id` | `medication_orders` | **GENUINE_RESOURCE_AUTHZ_GAP** | Queries `WHERE id = $1` without tenant check. Cross-tenant order validation possible. |
| `POST /:id/dispense` (medication) | `:id` | `medication_orders` | **GENUINE_RESOURCE_AUTHZ_GAP** | Stock decrement triggered by raw order ID. Zero tenant filtering. |
| `POST /:id/administer` (medication) | `:id` | `medication_orders` | **GENUINE_RESOURCE_AUTHZ_GAP** | Service verifies patient barcode against order, but initial fetch has no tenant check. |
| `POST /administrations/:id/adverse-reaction` | `:id` | `medication_administrations` | **GENUINE_RESOURCE_AUTHZ_GAP** | Appends adverse reaction event to administration ID without tenant isolation. |
| `POST /:id/cancel` (medication) | `:id` | `medication_orders` | **GENUINE_RESOURCE_AUTHZ_GAP** | Cancels order by ID directly; no tenant verification. |
| `POST /cpoe/:id/cancel` (orders) | `:id` | `cpoe_orders` | **SERVICE_SCOPED_PARTIAL** | `safetyAuthorizationService` verifies expected patient/encounter, but route-level guard missing. |
| `GET /cpoe/:id` (orders) | `:id` | `clinical_orders` | **GENUINE_RESOURCE_AUTHZ_GAP** | Direct `SELECT WHERE id = $1`. Cross-tenant confidentiality leak. |
| `GET /cpoe/encounter/:encounterId` (orders) | `:encounterId` | `clinical_orders` | **GENUINE_RESOURCE_AUTHZ_GAP** | Direct `SELECT WHERE encounter_id = $1` without tenant scoping. |
| `POST /cases/:id/finalize` (perioperative) | `:id` | `surgical_cases` | **GENUINE_RESOURCE_AUTHZ_GAP** | `UPDATE surgical_cases SET status='COMPLETED' WHERE id=$1`. No tenant filter. |
| `POST /cases/:id/abort` (perioperative) | `:id` | `surgical_cases` | **GENUINE_RESOURCE_AUTHZ_GAP** | Aborts surgical procedure without verifying surgeon or tenant ownership. |
| `POST /cases/:id/emergency` (perioperative) | `:id` | `surgical_cases` | **GENUINE_RESOURCE_AUTHZ_GAP** | Triggers emergency OR alarm on arbitrary case ID. |
| `POST /cases/:id/specimens` (perioperative) | `:id` | `surgical_cases` | **GENUINE_RESOURCE_AUTHZ_GAP** | Appends specimen record to arbitrary case ID. |
| `GET /encounter/:encounterId` (triage) | `:encounterId` | `triage_assessments` | **GENUINE_RESOURCE_AUTHZ_GAP** | Reads triage data by encounterId without tenant isolation. |
| `POST /soap/:id/amend` (clinicalNotes) | `:id` | `soap_notes` | **GENUINE_RESOURCE_AUTHZ_GAP** | Amends medical note by ID without author/tenant validation. |
| `GET /soap/encounter/:encounterId` (notes) | `:encounterId` | `soap_notes` | **GENUINE_RESOURCE_AUTHZ_GAP** | Reads all SOAP notes for encounter without tenant scoping. |
| `PATCH /cppt/:id/verify` (clinicalNotes) | `:id` | `cppt_notes` | **GENUINE_RESOURCE_AUTHZ_GAP** | Verifies CPPT record without confirming DPJP credentials or tenant match. |
| `GET /cppt/encounter/:encounterId` (notes) | `:encounterId` | `cppt_notes` | **GENUINE_RESOURCE_AUTHZ_GAP** | Reads all CPPT notes for encounter without tenant scoping. |

**BOLA Audit Summary:**
- **15 Genuine BOLA Gaps:** Vulnerable at both route and database query layers.
- **2 Service-Scoped Mitigations:** (`POST /cpoe/:id/cancel` and `POST /:id/administer`) have partial domain validation in the service layer, but still require route-level clinical authorization.

---

## 7. Semantic Idempotency Audit (30 Mutating Routes)

All 30 mutating routes across Tier 1 (29 POST, 1 PATCH) were evaluated for operation semantics and side effects:

### 7.1 Routes Strictly Requiring Idempotency Middleware (18 Routes)
Network retries or double submission create catastrophic double billing, duplicate drug dispensing, redundant prescriptions, or corrupt surgical state:
1. `POST /api/v1/medication/prescribe` — Duplicate CPOE prescription.
2. `POST /api/v1/medication/:id/pharmacist-review` — Duplicate verification state transition.
3. `POST /api/v1/medication/:id/dispense` — Duplicate FEFO stock decrement (inventory corruption).
4. `POST /api/v1/medication/:id/administer` — Duplicate drug administration record (patient safety hazard).
5. `POST /api/v1/medication/:id/cancel` — Race condition on order cancellation.
6. `POST /api/v1/orders/cpoe` — Master CPOE creation (**ALREADY EQUIPPED**).
7. `POST /api/v1/orders/cpoe/:id/cancel` — Transactional order cancellation.
8. `POST /api/v1/orders/prescription` — Direct pharmacy prescription creation.
9. `POST /api/v1/orders/lab` — Direct LIS order creation with duplicate specimen barcodes.
10. `POST /api/v1/orders/radiology` — Direct RIS order creation with duplicate imaging slots.
11. `POST /api/v1/perioperative/preop-evaluations` — Pre-anesthetic evaluation duplicate record.
12. `POST /api/v1/perioperative/cases/:id/finalize` — Case completion and final billing lock.
13. `POST /api/v1/perioperative/cases/:id/abort` — Surgery cancellation transition.
14. `POST /api/v1/blood-bank/units` — Donor blood intake (duplicate bag barcodes).
15. `POST /api/v1/blood-bank/crossmatch` — Blood unit reservation and crossmatch allocation.
16. `POST /api/v1/blood-bank/transfusion/verify` — Bedside transfusion release verification.
17. `POST /api/v1/clinical-notes/soap` — Duplicate medical SOAP note creation.
18. `POST /api/v1/clinical-notes/cppt` — Duplicate CPPT integrated note creation.

### 7.2 Routes Requiring Domain-Specific Duplicate Protection (10 Routes)
State transitions and time-series records that must be protected by unique database constraints, natural keys, or optimistic locking rather than HTTP header tokens:
19. `POST /api/v1/medication/reconciliation/admission` — Naturally keyed to `encounter_id` + admission phase.
20. `POST /api/v1/medication/reconciliation/discharge` — Naturally keyed to `encounter_id` + discharge phase.
21. `POST /api/v1/perioperative/who-checklist` — State machine progression (sign-in -> time-out -> sign-out); unique constraint per phase.
22. `POST /api/v1/perioperative/implants` — Unique Device Identifier (UDI) / Serial number constraint.
23. `POST /api/v1/perioperative/pacu-records` — Sequential vital signs time-series for PACU stay.
24. `POST /api/v1/triage/assessments` — Keyed to `encounterId`; optimistic concurrency locking.
25. `POST /api/v1/triage/first-physician-contact` — Milestone event; one-time timestamp lock per encounter.
26. `POST /api/v1/clinical-notes/soap/:id/amend` — Append-only versioning requiring parent note version hash.
27. `PATCH /api/v1/clinical-notes/cppt/:id/verify` — One-time DPJP verification flag update.
28. `POST /api/v1/perioperative/cases/:id/specimens` — Pathology specimen container barcode uniqueness.

### 7.3 Routes That Do Not Require Idempotency (2 Routes)
Real-time emergency signaling or adverse event alerts where dropping a request due to an idempotency header collision is life-threatening:
29. `POST /api/v1/medication/administrations/:id/adverse-reaction` — Adverse drug reaction alert (must always accept report).
30. `POST /api/v1/perioperative/cases/:id/emergency` — Intraoperative Code Blue OR alarm (must never be rejected).

---

## 8. P0-2A Contract Compatibility Assessment

| P0-2A Subsystem | File Location | Compatibility Status | Required Action |
| :--- | :--- | :---: | :--- |
| **Decision Contract** | `server/contracts/authorizationDecision.contract.js` | **NO_P0-2A_CHANGE** | Pre-existing denial codes cover all failure modes. |
| **Clinical Auth Middleware** | `server/middlewares/clinicalAuthorization.middleware.js` | **NO_P0-2A_CHANGE** | Orchestration pipeline handles all required checks. |
| **Resource Authorization** | `server/services/resourceAuthorization.service.js` | **P0-2A_EXTENSION_REQUIRED** | Add SQL resolvers for `SURGERY_CASE`, `BLOOD_UNIT`, `MEDICATION_ORDER`, `CLINICAL_NOTE`. |
| **Role Matrix (SSOT)** | `src/shared/constants/roles.js` | **P0-2A_CONFIGURATION_REQUIRED** | Add 7 permissions, map `SURGICAL_SAFETY_SIGN` + 7 permissions in matrix. |
| **Separation of Duties** | `server/services/separationOfDuties.service.js` | **NO_P0-2A_CHANGE** | Rule engine ready for surgical and pharmacy dual control. |
| **Break The Glass** | `server/services/breakTheGlass.service.js` | **NO_P0-2A_CHANGE** | Emergency override ledger fully functional. |
| **Audit Registry** | `server/services/auditDecisionRegistry.js` | **NO_P0-2A_CHANGE** | Persistence schema ready. |

---

## 9. Required Changes Matrix

To achieve full authorization capability closure, the following changes are required:

1. **SSOT Permission & Role Updates (`roles.js`):**
   - Define: `SURGICAL_PREOP_WRITE`, `SURGICAL_IMPLANT_RECORD`, `SURGICAL_PACU_WRITE`, `PERIOPERATIVE_ABORT`, `PERIOPERATIVE_EMERGENCY`, `SURGICAL_SPECIMEN_RECORD`, `MED_ADVERSE_RECORD`.
   - Define: `BLOOD_BANK_INVENTORY_WRITE` (Ordinary RBAC).
   - Map `SURGICAL_SAFETY_SIGN` to `ROLE_DOCTOR_DPJP`, `ROLE_ANESTHESIOLOGIST`, `ROLE_NURSE`.
   - Map new permissions to their corresponding clinical roles in `ROLE_PERMISSIONS_MATRIX`.

2. **P0-2A Resource Resolver Extensions (`resourceAuthorization.service.js`):**
   - Implement SQL resolver for `SURGERY_CASE` (`surgical_cases`, verifying `tenant_id = $2`).
   - Implement SQL resolver for `BLOOD_UNIT` (`blood_donor_units`, verifying `tenant_id = $2`).
   - Implement SQL resolver for `MEDICATION_ORDER` (`medication_orders`, verifying `tenant_id = $2`).
   - Implement SQL resolver for `CLINICAL_NOTE` (`soap_notes` / `cppt_notes`, verifying `tenant_id = $2`).

3. **Controller & Service BOLA Hardening:**
   - Enforce `tenant_id = req.user.tenantId` on internal database queries in `medicationClosedLoopService`, `perioperativeClosedLoopService`, and `clinicalNotesService`.

4. **Idempotency Guard Deployment:**
   - Mount `idempotencyMiddleware` on the 18 critical mutating routes.

---

## 10. Dependency Ordering

Implementation MUST follow this strict dependency sequence:

```
Step 1: SSOT Configuration Update
  │     (Define 7 permissions, 1 inventory permission, and map SURGICAL_SAFETY_SIGN in roles.js)
  ▼
Step 2: P0-2A Resource Resolver Extensions
  │     (Implement tenant-isolated SQL resolvers in resourceAuthorization.service.js)
  ▼
Step 3: Controller & Service BOLA Hardening
  │     (Audit & enforce tenant_id scoping in service queries)
  ▼
Step 4: Idempotency Protection Deployment
  │     (Mount idempotencyMiddleware on the 18 identified routes)
  ▼
Step 5: Route Protection Mounting (Wave 1B)
  │     (Mount requireClinicalAuthorization on the 38 Tier 1 routes)
  ▼
Step 6: Forensic Integration & Regression Testing
        (Verify zero 403 regression for legitimate clinicians & 100% block of unauthorized cross-tenant calls)
```

---

## 11. Wave 1B Readiness Gate

### Readiness Checklist

| Readiness Criterion | Status | Evidence / Blocker |
| :--- | :---: | :--- |
| **Permission Semantics Proven** | **RESOLVED** | All 8 permissions audited and classified. |
| **Role Mappings Proven** | **BLOCKER** | `SURGICAL_SAFETY_SIGN` and 7 permissions unmapped in `ROLE_PERMISSIONS_MATRIX`. |
| **Resource Relationships Proven** | **RESOLVED** | Database graph verified across migrations 001-056. |
| **Tenant Isolation Proven** | **BLOCKER** | 4 SQL resolvers missing in `resourceAuthorizationService`; 15 routes vulnerable to BOLA. |
| **Care-Team Resolution Proven** | **RESOLVED** | Proven via `encounters` and `staff` schema. |
| **BTG Compatibility Proven** | **RESOLVED** | Emergency override pathways verified in P0-2A. |
| **SoD Compatibility Proven** | **RESOLVED** | Dual-control rules ready. |
| **Idempotency Semantics Determined**| **RESOLVED** | Categorized into 18 HTTP, 10 Domain, 2 Emergency. |

### Final Gate Verdict

# **GATE STATUS: HARD HOLD**

Wave 1B execution cannot begin until Steps 1 through 4 of the dependency order are formally implemented and independently verified in code.
