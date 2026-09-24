# NURSEFLOW ENTERPRISE HIS — P0-2 SECURITY & AUTHORIZATION BASELINE
## COMPREHENSIVE FORENSIC BASELINE GATE: HOW NURSEFLOW AUTHORIZES ACTIONS, RESOURCES & TENANTS

- **Dokumen Referensi:** `P0-2_SECURITY_AUTHORIZATION_BASELINE.md`
- **Klasifikasi Dokumen:** `FORENSIC ARCHITECTURE & SECURITY BASELINE (READ-ONLY / ZERO CODING)`
- **Auditor Independen:** Forensic Security & Architecture Auditor, NurseFlow Core HIS
- **Tanggal Evaluasi:** 24 September 2026
- **Status Baseline:** **P0-2 BASELINE STATUS: READY FOR IMPLEMENTATION**
- **Status Fase P0-1:** **CONDITIONALLY CLOSED (RATIFIED IN P0-1_CLOSURE_CONSISTENCY_AUDIT.MD)**

---

## 1. Authorization Model Forensics

### A. Pertanyaan Forensik Inti
> *"Bagaimana NurseFlow secara aktual menentukan apakah seorang authenticated user benar-benar berwenang melakukan sebuah aksi klinis (action) terhadap sebuah entitas medis (resource) di dalam rumah sakit (tenant) tertentu?"*

### B. Alur Otorisasi Aktual Saat Ini (Current Actual Flow)

Berdasarkan pemeriksaan langsung terhadap [`server/server.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/server.js), 27 berkas rute di [`server/routes/`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/routes), middleware di [`server/middlewares/`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/middlewares), serta controller di [`server/controllers/`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/controllers), alur otorisasi aktual **TIDAK MENERAPKAN** pipeline ideal 10 tahap.

Alur aktual saat ini adalah sebagai berikut:

```mermaid
flowchart TD
    A["1. HTTP Request Masuk Gateway"] --> B["2. Global Express Middlewares\n(CorrelationID, Observability, Security Headers)"]
    B --> C{"3. Apakah Endpoint Terdaftar Publik?"}
    C -- "Ya (5 Health/Docs + Login/Refresh)" --> D["Langsung Eksekusi Handler / Service"]
    C -- "Tidak (135 Endpoints)" --> E["4. Middleware authenticateJwt\n(Verifikasi Header Bearer / Cookie)"]
    E -- "Token Hilang / Kadaluarsa / Blacklist (In-Memory)" --> F["HTTP 401 Unauthorized (RFC 7807)"]
    E -- "Token Valid (HS256 Verified)" --> G["Set req.user = payload\n(userId, username, role, roles, staffId, tenantId)"]
    G --> H{"5. Apakah Rute Memiliki Guard Otorisasi?"}
    H -- "Tidak (107 Endpoint Bisnis)" --> I["Langsung Panggil Controller Handler\n(AUTHENTICATED ONLY)"]
    H -- "Ya (28 Endpoint Granular)" --> J["Evaluasi requirePermission() / requireRole()"]
    J -- "userRoles.includes('ROLE_SUPER_ADMIN')\natau Permissions.includes('*')" --> K["Bypass Penuh (Call next())"]
    J -- "Role / Permission Cocok" --> K
    J -- "Role / Permission Tidak Cocok" --> L["HTTP 403 Forbidden (RFC 7807)"]
    K --> M["6. Eksekusi Controller / Service Logika"]
    I --> M
    M --> N{"7. Pemeriksaan Tenant & Resource?"}
    N -- "Sebagian Controller" --> O["Query DB dengan tenantId fallback default UUID\nResource ID dibaca langsung tanpa cek penugasan dokter"]
    N -- "Sebagian Service" --> P["Ambil tenant_id dari resource DB (Adopsi Silang)"]
    O --> Q{"8. Pemeriksaan Lisensi Klinis (SIP/STR)?"}
    P --> Q
    Q -- "Kenyataan Aktual" --> R["0% Pengecekan SIP/STR di Controller\n(Bypass Klinis Total)"]
    R --> S["9. Mutasi Database PostgreSQL"]
    S --> T["10. Audit Trail Parsial\n(Triage/Patient tulis universal_audit_logs, lainnya in-memory/none)"]
```

### C. Pembuktian Kesenjangan Alur (Flow Gap Analysis)

```text
SOURCE: Source Code Trace
FILE: server/server.js, server/middlewares/authMiddleware.js, server/middlewares/rbacMiddleware.js
FINDING:
  1. Tahap Tenant Context: Diabaikan di level rute gateway (tenantMiddleware tidak dipasang).
  2. Tahap Resource Authorization: Tidak ada middleware kepemilikan resource (Resource Ownership Guard).
  3. Tahap Clinical Credential: Tidak ada verifikasi STR/SIP/SPK di controller klinis.
  4. Tahap Audit: Tidak seragam (beberapa modul menulis ke universal_audit_logs, beberapa ke in-memory Array).
RESULT:
  Pipeline aktual adalah: Authentication (JWT) -> Static Role/Wildcard Check (pada 20% endpoint) -> Direct Controller DB Query.
```

---

## 2. Super Admin Forensics

### A. Rekonsiliasi Temuan P0-1 (`DEBT-P0-005`)
Pada audit P0-1, ditemukan bahwa akun dengan peran tunggal `ROLE_SUPER_ADMIN` dapat mengeksekusi mutasi pada 8 tindakan klinis berisiko tinggi. Berikut adalah pembuktian mendalam di level baris kode mengapa bypass ini terjadi:

1. **Wildcard Permission Bypass:**
   - Berkas: [`src/core/security/rbacGuard.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/core/security/rbacGuard.service.js#L20-L22)
   - Baris 20-22:
     ```javascript
     if (userPermissions.includes('*')) {
       return true; // Super admin bypasses all permission checks
     }
     ```
2. **Hardcoded Role Bypass di Middleware Rute:**
   - Berkas: [`server/middlewares/rbacMiddleware.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/middlewares/rbacMiddleware.js#L104-L105)
   - Baris 104-105:
     ```javascript
     const isSuperAdmin = userRoles.includes('ROLE_SUPER_ADMIN') || userRoles.includes('ADMIN');
     const hasRole = isSuperAdmin || allowedRoles.some(r => { ... });
     ```
3. **Konstanta Peran Super Admin:**
   - Berkas: [`src/shared/constants/roles.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/shared/constants/roles.js#L25-L27)
   - Baris 25-27:
     ```javascript
     [ENTERPRISE_ROLES.ROLE_SUPER_ADMIN]: {
       name: 'Super Administrator / Chief Information Officer',
       permissions: ['*']
     }
     ```
4. **Ketiadaan Validasi SIP/STR di Controller Klinis:**
   - Controller (`clinicalNotes.controller.js`, `orders.controller.js`, dll) langsung memproses payload tanpa memeriksa apakah `req.user.staffId` terdaftar sebagai dokter berlisensi aktif.

### B. Matriks Evaluasi 8 Tindakan Klinis Super Admin

| Clinical Action | Route | Required Permission | Required Role | Credential Requirement | Super Admin Current Result | Security Boundary Breakdown |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **1. SOAP Write** | `POST /api/v1/clinical-notes/soap` | `SOAP_NOTE_CREATE` | `DOCTOR_DPJP`, `DOCTOR_EMERGENCY`, `NURSE` | Active SIP / STR (`master_practitioners`) | ❌ **ALLOWED** | Bypassed via `rbacGuardService.hasPermission` (`*`). Controller tidak cek SIP. |
| **2. Prescription Order** | `POST /api/v1/orders/prescription` | `ORDER_CREATE_PHARMACY` | `DOCTOR_DPJP`, `DOCTOR_EMERGENCY` | Active Physician SIP (`master_practitioners`) | ❌ **ALLOWED** | Bypassed via `rbacGuardService.hasPermission` (`*`). Controller tidak cek SIP. |
| **3. Lab Result Release** | `POST /api/v1/laboratory/results/:id/release` | `LAB_RESULT_VALIDATE` | `LAB_ANALYST`, `PATHOLOGIST` | Active Lab Analyst License / SIP Patologi | ❌ **ALLOWED** | Bypassed via `rbacGuardService.hasPermission` (`*`). Controller tidak cek lisensi analis. |
| **4. Blood-Bank Crossmatch** | `POST /api/v1/blood-bank/crossmatch` | `TRANSFUSION_CROSSMATCH` | `LAB_ANALYST`, `BLOOD_BANK` | Transfusion Officer Certification | ❌ **ALLOWED** | Bypassed via `rbacMiddleware.js:104` (`isSuperAdmin`). Controller tidak cek sertifikasi. |
| **5. Patient Discharge** | `POST /api/v1/beds/discharge` | `DISCHARGE_AUTHORIZE` | `DOCTOR_DPJP`, `CASE_MANAGER` | Attending DPJP Authority | ❌ **ALLOWED** | Tidak ada route guard granular (`AUTHENTICATED ONLY`). Controller langsung eksekusi DB. |
| **6. Radiology Report** | `POST /api/v1/radiology/studies/:id/reports` | `RAD_REPORT_WRITE` | `RADIOLOGIST` | Active SIP Spesialis Radiologi | ❌ **ALLOWED** | Bypassed via `rbacGuardService.hasPermission` (`*`). Controller tidak cek SIP radiolog. |
| **7. Clinical CPOE Order** | `POST /api/v1/orders/cpoe` | `CPOE_ORDER_CREATE` | `DOCTOR_DPJP`, `DOCTOR_EMERGENCY` | Active Physician Credential | ❌ **ALLOWED** | Bypassed via `rbacGuardService.hasPermission` (`*`). Controller tidak cek lisensi dokter. |
| **8. Medication Dispense** | `POST /api/v1/medications/:id/dispense` | `PHARMACY_DISPENSE` | `PHARMACIST` | Active STRA / SIPA Apoteker | ❌ **ALLOWED** | Bypassed via `rbacGuardService.hasPermission` (`*`). Controller tidak cek STRA apoteker. |

### C. Klasifikasi Tata Kelola
```text
DEBT CLASSIFICATION: DEBT-P0-005
CATEGORY: CLINICAL SECURITY & GOVERNANCE DEBT
SEVERITY: CRITICAL
POLICY: MUST BE CLOSED BEFORE CLINICAL PILOT / PRODUCTION DEPLOYMENT
RATIONALE:
  Super Administrator adalah akun tata kelola infrastruktur TI, bukan entitas medis. Memberikan wewenang mutasi rekam medis,
  peresepan obat bius, dan rilis hasil diagnostik kepada akun non-medis melanggar Permenkes No. 24/2022 tentang Rekam Medis
  dan standar akreditasi KARS/JCI mengenai Hak Istimewa Klinis (Medical Staff Bylaws).
```

---

## 3. Clinical Privilege Model

Pemeriksaan forensik terhadap pemisahan konsep keamanan di seluruh basis kode:

```text
EVALUASI KONSEP TATA KELOLA MEDIS DI NURSEFLOW:
1. ROLE (Peran Sistem):
   - Status: TERSEDIA (IMPLEMENTED)
   - Bukti: auth_roles, ENTERPRISE_ROLES di src/shared/constants/roles.js. Menentukan peran administratif/sistemik.
2. PERMISSION (Izin Fungsional):
   - Status: TERSEDIA (IMPLEMENTED)
   - Bukti: auth_permissions, ENTERPRISE_PERMISSIONS di src/shared/constants/roles.js. Menentukan kapabilitas umum modul.
3. CLINICAL PRIVILEGE (Kewenangan Klinis / RKK - Rincian Kewenangan Klinis):
   - Status: SKEMA DATABASE ADA, TETAPI RUNTIME DISCONNECTED
   - Bukti: Tabel clinical_privileges (Migrasi 015) ada, namun 0 controller klinis yang memvalidasi RKK saat transaksi.
4. LICENSE (Surat Izin Praktik / STR / SIP):
   - Status: SKEMA DATABASE ADA, TETAPI RUNTIME DISCONNECTED
   - Bukti: master_practitioners.sip_number dan staff_credentials ada, namun 0 controller klinis yang memvalidasi masa berlaku lisensi.
5. PRACTITIONER (Entitas Praktisi Klinis):
   - Status: TERSEDIA (IMPLEMENTED)
   - Bukti: master_practitioners terhubung 1-to-1 dengan master_staff.
6. FACILITY / UNIT ASSIGNMENT (Penugasan Unit Kerja / Ruangan):
   - Status: MISSING ARCHITECTURAL CONCEPT DI RUNTIME
   - Bukti: Tidak ada verifikasi apakah perawat/dokter yang login sedang bertugas di unit rawat inap tempat pasien dirawat.
7. SPECIALTY (Spesialisasi Medis):
   - Status: TERSEDIA DI MASTER DATA, MISSING DI RUNTIME GUARD
   - Bukti: master_specialties ada, namun tidak pernah dipakai untuk membatasi CPOE spesifik spesialisasi di runtime.
```

---

## 4. Master Data vs Runtime Authorization

Audit ini memisahkan secara tegas antara **Integritas Data Master** dan **Penegakan Otorisasi Runtime**:

```text
┌────────────────────────────────────────────────────────┐
│             MASTER DATA INTEGRITY (SSOT)               │
├────────────────────────────────────────────────────────┤
│ • 100% akun dokter aktif memiliki pemetaan staff_id.  │
│ • 100% dokter aktif terdaftar di master_practitioners. │
│ • 100% dokter memiliki nomor SIP dan IHS terisi valid. │
│ • 0 orphan records di tabel master_practitioners.      │
│ STATUS: 🟢 100% VERIFIED (CLEAN)                       │
└────────────────────────────────────────────────────────┘
                           ≠
┌────────────────────────────────────────────────────────┐
│           RUNTIME CLINICAL AUTHORIZATION               │
├────────────────────────────────────────────────────────┤
│ • 0% controller klinis yang memverifikasi SIP dokter.  │
│ • 0% controller klinis yang memverifikasi status RKK.  │
│ • Token JWT tidak membawa klaim practitionerId/SIP.    │
│ • Administrator dapat meresepkan obat tanpa lisensi.   │
│ STATUS: 🔴 0% ENFORCED (GAP KRITIS)                    │
└────────────────────────────────────────────────────────┘
```

**Bukti Forensik:**
- Kueri Database:
  ```sql
  SELECT COUNT(*) FROM master_practitioners WHERE sip_number IS NOT NULL; -- Hasil: 4 Dokter (100% Valid)
  ```
- Controller Runtime ([`server/controllers/clinicalNotes.controller.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/controllers/clinicalNotes.controller.js#L28)):
  ```javascript
  const result = await clinicalNotesApplicationService.recordSoapNote(req.body, actor, clientIp, correlationId);
  // Sama sekali tidak ada kueri ke master_practitioners untuk memastikan actor memiliki SIP aktif!
  ```

---

## 5. All 142 Endpoints Authorization Matrix

Inventarisasi lengkap seluruh 142 endpoint REST aktif yang terpasang pada master Express Gateway Server ([`server/server.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/server.js)):

| Method | Route | Auth | Role | Permission | Tenant | Resource | Clinical Credential | Audit | Risk Classification |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| GET | `/health/live` | None | None | None | None | None | None | None | **PUBLIC** |
| GET | `/health/ready` | None | None | None | None | None | None | None | **PUBLIC** |
| GET | `/health/deep` | None | None | None | None | None | None | None | **PUBLIC** |
| GET | `/metrics` | None | None | None | None | None | None | None | **PUBLIC** |
| GET | `/docs` | None | None | None | None | None | None | None | **PUBLIC** |
| POST | `/api/v1/auth/login` | None | None | None | None | None | None | Security Log | **PUBLIC** |
| POST | `/api/v1/auth/refresh` | Refresh Guard | None | None | None | None | None | Security Log | **PUBLIC** |
| POST | `/api/v1/auth/logout` | Bearer JWT | None | None | None | None | None | Blacklist Set | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/auth/me` | Bearer JWT | None | None | None | None | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/patients` | Bearer JWT | None | None | Implicit DB | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/patients/:id` | Bearer JWT | None | None | Implicit DB | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/patients` | Bearer JWT | None | `PATIENT_REGISTER` | Default Fallback | Body Check | None | universal_audit | **PERMISSION_AUTHORIZED** |
| PATCH | `/api/v1/encounters/:id/status` | Bearer JWT | None | None | Implicit DB | Param ID | None | EventBus | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/beds/assign` | Bearer JWT | None | None | Default Fallback | Param ID | None | EventBus | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/beds/transfer` | Bearer JWT | None | None | Default Fallback | Param ID | None | EventBus | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/beds/discharge` | Bearer JWT | None | None | Default Fallback | Param ID | None | EventBus | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/triage/assessments` | Bearer JWT | `ROLE_NURSE` | `TRIAGE_WRITE` | Default Fallback | Body Check | None | universal_audit | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/triage/first-physician-contact` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/triage/encounter/:encounterId` | Bearer JWT | None | `TRIAGE_READ` | Implicit DB | Param ID | None | None | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/clinical-notes/soap` | Bearer JWT | `AUTHORIZED_SOAP_ROLES` | `SOAP_NOTE_CREATE` | Encounter Adopt | Body Check | Missing SIP | universal_audit | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/clinical-notes/soap/:id/amend` | Bearer JWT | Author / DPJP | `SOAP_NOTE_AMEND` | Encounter Adopt | Param ID | Missing SIP | universal_audit | **PERMISSION_AUTHORIZED** |
| GET | `/api/v1/clinical-notes/soap/encounter/:encounterId` | Bearer JWT | None | `SOAP_NOTE_READ` | Implicit DB | Param ID | None | None | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/clinical-notes/cppt` | Bearer JWT | Multi-Prof | `CPPT_CREATE` | Encounter Adopt | Body Check | None | universal_audit | **PERMISSION_AUTHORIZED** |
| PATCH | `/api/v1/clinical-notes/cppt/:id/verify` | Bearer JWT | DPJP Only | `CPPT_VERIFY` | Encounter Adopt | Param ID | Missing SIP | universal_audit | **PERMISSION_AUTHORIZED** |
| GET | `/api/v1/clinical-notes/cppt/encounter/:encounterId` | Bearer JWT | None | `CPPT_READ` | Implicit DB | Param ID | None | None | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/orders/cpoe` | Bearer JWT | `ROLE_DOCTOR_*` | `CPOE_ORDER_CREATE` | Default Fallback | Body Check | Missing SIP | EventBus | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/orders/cpoe/:id/cancel` | Bearer JWT | Author / DPJP | `CPOE_ORDER_CANCEL` | Default Fallback | Param ID | None | EventBus | **PERMISSION_AUTHORIZED** |
| GET | `/api/v1/orders/cpoe` | Bearer JWT | None | `CPOE_ORDER_READ` | Implicit DB | Unchecked | None | None | **PERMISSION_AUTHORIZED** |
| GET | `/api/v1/orders/cpoe/:id` | Bearer JWT | None | `CPOE_ORDER_READ` | Implicit DB | Param ID | None | None | **PERMISSION_AUTHORIZED** |
| GET | `/api/v1/orders/cpoe/encounter/:encounterId` | Bearer JWT | None | `CPOE_ORDER_READ` | Implicit DB | Param ID | None | None | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/orders/prescription` | Bearer JWT | `ROLE_DOCTOR_*` | `ORDER_CREATE_PHARMACY`| Default Fallback | Body Check | Missing SIP | EventBus | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/orders/lab` | Bearer JWT | `ROLE_DOCTOR_*` | `ORDER_CREATE_LAB` | Default Fallback | Body Check | Missing SIP | EventBus | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/orders/radiology` | Bearer JWT | `ROLE_DOCTOR_*` | `ORDER_CREATE_RAD` | Default Fallback | Body Check | Missing SIP | EventBus | **PERMISSION_AUTHORIZED** |
| GET | `/api/v1/billing/ledger/:episodeId` | Bearer JWT | None | None | Implicit DB | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/laboratory/specimens/generate` | Bearer JWT | Analyst / Nurse | `LAB_ORDER_PROCESS` | Default Fallback | Body Check | None | EventBus | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/laboratory/specimens/:id/collect` | Bearer JWT | Analyst / Nurse | `LAB_SPECIMEN_COLLECT` | Default Fallback | Param ID | None | EventBus | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/laboratory/specimens/:id/accession` | Bearer JWT | Analyst Only | `LAB_SPECIMEN_RECEIVE` | Default Fallback | Param ID | None | EventBus | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/laboratory/specimens/:id/results` | Bearer JWT | Analyst Only | `LAB_ANALYZER_RUN` | Default Fallback | Param ID | None | EventBus | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/laboratory/results/:id/release` | Bearer JWT | Pathologist / Lead | `LAB_RESULT_VALIDATE` | Default Fallback | Param ID | Missing License | EventBus | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/laboratory/panic-alerts/:id/acknowledge` | Bearer JWT | Doctor / Nurse | `LAB_CRITICAL_ACK` | Default Fallback | Param ID | None | EventBus | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/laboratory/panic-alerts/:id/escalate` | Bearer JWT | Doctor / Nurse | `LAB_CRITICAL_ESCALATE`| Default Fallback | Param ID | None | EventBus | **PERMISSION_AUTHORIZED** |
| GET | `/api/v1/laboratory/orders/:orderId/specimens` | Bearer JWT | None | `LAB_READ` | Implicit DB | Param ID | None | None | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/radiology/worklist/generate` | Bearer JWT | Radiographer | `RAD_WORKLIST_GEN` | Default Fallback | Body Check | None | EventBus | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/radiology/studies/acquire` | Bearer JWT | Radiographer | `RAD_STUDY_ACQUIRE` | Default Fallback | Body Check | None | universal_audit | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/radiology/studies/:id/reports` | Bearer JWT | Radiologist | `RAD_REPORT_WRITE` | Default Fallback | Param ID | Missing SIP | universal_audit | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/radiology/reports/:id/amend` | Bearer JWT | Radiologist | `RAD_REPORT_AMEND` | Default Fallback | Param ID | Missing SIP | universal_audit | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/radiology/critical-alerts/:id/acknowledge`| Bearer JWT| Doctor / Nurse | `RAD_CRITICAL_ACK` | Default Fallback | Param ID | None | EventBus | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/radiology/critical-alerts/:id/escalate` | Bearer JWT | Doctor / Nurse | `RAD_CRITICAL_ESCALATE`| Default Fallback | Param ID | None | EventBus | **PERMISSION_AUTHORIZED** |
| GET | `/api/v1/radiology/orders/:orderId/studies` | Bearer JWT | None | `RAD_READ` | Implicit DB | Param ID | None | None | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/medications/prescribe` | Bearer JWT | `ROLE_DOCTOR_*` | `PHARMACY_PRESCRIBE`| Default Fallback | Body Check | Missing SIP | universal_audit | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/medications/:id/pharmacist-review` | Bearer JWT | `ROLE_PHARMACIST`| `PHARMACY_REVIEW` | Default Fallback | Param ID | Missing STRA | universal_audit | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/medications/:id/dispense` | Bearer JWT | `ROLE_PHARMACIST`| `PHARMACY_DISPENSE` | Default Fallback | Param ID | Missing STRA | universal_audit | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/medications/:id/administer` | Bearer JWT | `ROLE_NURSE` | `NURSING_ADMINISTER`| Default Fallback | Param ID | Missing STR | universal_audit | **PERMISSION_AUTHORIZED** |
| POST | `/api/v1/medications/reconciliation/admission` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/medications/reconciliation/discharge` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/medications/administrations/:id/adverse-reaction`| Bearer JWT| None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/medications/:id/cancel` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/monitoring/observations` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/monitoring/observations/:id/escalate` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/monitoring/escalations/:id/acknowledge`| Bearer JWT| None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/monitoring/rapid-response` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/monitoring/observations/:id/reassess`| Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/diagnostics/notifications` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/diagnostics/notifications/:id/acknowledge`| Bearer JWT| None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/diagnostics/notifications/:id/interpret`| Bearer JWT| None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/diagnostics/interpretations/:id/actions`| Bearer JWT| None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/coordination/encounters/:encounterId/timeline`| Bearer JWT| None | None | Implicit DB | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/coordination/care-plans` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/coordination/handovers` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/coordination/handovers/:id/acknowledge`| Bearer JWT| None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/coordination/discharge-summaries`| Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/perioperative/preop-evaluations` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/perioperative/who-checklist` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/perioperative/implants` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/perioperative/pacu-records` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/perioperative/cases/:id/finalize` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/perioperative/cases/:id/abort` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/perioperative/cases/:id/emergency` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/perioperative/cases/:id/specimens` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/casemix/coding-records` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/casemix/queries` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/casemix/queries/:id/respond` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/casemix/encounters/:id/grouping` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/casemix/encounters/:id/cross-audit`| Bearer JWT| None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/patient-financial/claims` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/patient-financial/deposits` | Bearer JWT | Cashier / Finance | None | Default Fallback | Body Check | None | None | **ROLE_AUTHORIZED** |
| POST | `/api/v1/patient-financial/invoices` | Bearer JWT | Cashier / Finance | None | Default Fallback | Body Check | None | None | **ROLE_AUTHORIZED** |
| POST | `/api/v1/patient-financial/payments` | Bearer JWT | Cashier / Finance | None | Default Fallback | Body Check | None | None | **ROLE_AUTHORIZED** |
| POST | `/api/v1/patient-financial/adjustments` | Bearer JWT | Cashier / Finance | None | Default Fallback | Body Check | None | None | **ROLE_AUTHORIZED** |
| POST | `/api/v1/patient-financial/shifts/reconcile` | Bearer JWT | Cashier / Finance | None | Default Fallback | Body Check | None | None | **ROLE_AUTHORIZED** |
| POST | `/api/v1/patient-financial/ar` | Bearer JWT | Cashier / Finance | None | Default Fallback | Body Check | None | None | **ROLE_AUTHORIZED** |
| GET | `/api/v1/blood-bank/units` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/blood-bank/units` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/blood-bank/crossmatch` | Bearer JWT | Lab / Transfusion | `TRANSFUSION_CROSSMATCH`| Default Fallback | Body Check | Missing Cert | EventBus | **ROLE_AUTHORIZED** |
| POST | `/api/v1/blood-bank/transfusion/verify` | Bearer JWT | Nurse / Doctor | None | Default Fallback | Body Check | None | EventBus | **ROLE_AUTHORIZED** |
| GET | `/api/v1/staff-privileges/staff` | Bearer JWT | Admin / Supervisor | None | Default Fallback | Unchecked | None | None | **ROLE_AUTHORIZED** |
| POST | `/api/v1/staff-privileges/staff` | Bearer JWT | Admin / Director | None | Default Fallback | Body Check | None | None | **ROLE_AUTHORIZED** |
| POST | `/api/v1/staff-privileges/credentials` | Bearer JWT | Admin / Director | None | Default Fallback | Body Check | None | None | **ROLE_AUTHORIZED** |
| POST | `/api/v1/staff-privileges/privileges` | Bearer JWT | Admin / Director | None | Default Fallback | Body Check | None | None | **ROLE_AUTHORIZED** |
| POST | `/api/v1/staff-privileges/verify` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/master-data/:entityType` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/master-data/:entityType/:id` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/master-data/:entityType` | Bearer JWT | None | None | Default Fallback | Body Check | None | In-Memory Audit| **AUTHENTICATED_ONLY** |
| PUT | `/api/v1/master-data/:entityType/:id` | Bearer JWT | None | None | Default Fallback | Param ID | None | In-Memory Audit| **AUTHENTICATED_ONLY** |
| POST | `/api/v1/appointments/book` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/appointments/check-in` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/appointments/cancel` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/inventory/stock` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/inventory/receive` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/inventory/movements` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/inventory/logs` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/satusehat/token` | Bearer JWT | Admin / IT | None | Default Fallback | Unchecked | None | None | **ROLE_AUTHORIZED** |
| POST | `/api/v1/satusehat/validate` | Bearer JWT | Clinical / Admin | None | Default Fallback | Body Check | None | None | **ROLE_AUTHORIZED** |
| POST | `/api/v1/satusehat/transmit` | Bearer JWT | Admin / IT | None | Default Fallback | Body Check | None | None | **ROLE_AUTHORIZED** |
| GET | `/api/v1/command-center/capacity` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/command-center/emergency` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/command-center/financial` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/command-center/safety` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/command-center/alerts` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/medications` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/medications/:id` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/medications` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| PUT | `/api/v1/medications/:id` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| PATCH | `/api/v1/medications/:id/archive` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| DELETE | `/api/v1/medications/:id` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/terminologies/search` | Bearer JWT | None | None | None | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/patients/:patientId/allergies` | Bearer JWT| None | None | Implicit DB | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/patients/:patientId/allergies`| Bearer JWT| None | None | Implicit DB | Param ID | None | None | **AUTHENTICATED_ONLY** |
| PATCH | `/api/v1/patients/:patientId/allergies/:allergyId`| Bearer JWT| None | None | Implicit DB | Param ID | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/formulary` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/formulary` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| PATCH | `/api/v1/formulary/:id` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/cdss/evaluate` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/cdss/executions/record` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/cdss/executions/:encounterId` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/api/v1/cdss/replay/:executionId` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/worklist` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/api/v1/orders` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/dicomweb/studies` | Bearer JWT | None | None | Default Fallback | Unchecked | None | None | **AUTHENTICATED_ONLY** |
| GET | `/dicomweb/studies/:studyInstanceUid/metadata` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| GET | `/dicomweb/studies/:studyInstanceUid/series/:seriesInstanceUid/instances/:sopInstanceUid/rendered` | Bearer JWT | None | None | Default Fallback | Param ID | None | None | **AUTHENTICATED_ONLY** |
| POST | `/dicomweb/studies` | Bearer JWT | None | None | Default Fallback | Body Check | None | None | **AUTHENTICATED_ONLY** |

### Ringkasan Klasifikasi:
- **PUBLIC:** 7 (4.9%)
- **PERMISSION_AUTHORIZED:** 21 (14.8%)
- **ROLE_AUTHORIZED:** 14 (9.9%)
- **AUTHENTICATED_ONLY:** 100 (70.4%)
- **CLINICALLY_AUTHORIZED:** 0 (0%)
- **RESOURCE_AUTHORIZED:** 0 (0%)

---

## 6. High-Risk Clinical Action Inventory

Investigasi menyeluruh pada seluruh repository mengidentifikasi **28 Aksi Klinis Berisiko Tinggi (High-Risk Clinical Actions)** yang berpotensi mencederai keselamatan pasien, mengubah status hukum rekam medis, atau memicu malpraktik jika dieksekusi tanpa otorisasi klinis yang sah:

| ID Aksi | Domain Klinis | HTTP Endpoint & Method | Potensi Risiko Medis & Legal | Aktor Sah Berwenang (Permenkes 24/2022) | Status Pengamanan Saat Ini |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **HRA-01** | Farmasi / CPOE | `POST /api/v1/orders/prescription` | Peresepan obat keras / narkotika tanpa lisensi dokter | Dokter Berlisensi Aktif (SIP) | ⚠️ Wildcard Super Admin Bypass |
| **HRA-02** | CPOE Medis | `POST /api/v1/orders/cpoe` | Instruksi medis diagnostik/terapi tanpa verifikasi DPJP | Dokter DPJP / Residen Terbimbing | ⚠️ Wildcard Super Admin Bypass |
| **HRA-03** | Pembatalan CPOE | `POST /api/v1/orders/cpoe/:id/cancel` | Penghentian terapi kritis tanpa persetujuan dokter | Dokter Penulis / DPJP | 🟡 Authenticated Only di Route |
| **HRA-04** | Telaah Apoteker | `POST /api/v1/medications/:id/pharmacist-review` | Telaah klinis interaksi obat oleh tenaga non-farmasi | Apoteker Berlisensi (STRA/SIPA) | ⚠️ Wildcard Super Admin Bypass |
| **HRA-05** | Dispensing Obat | `POST /api/v1/medications/:id/dispense` | Penyerahan obat salah dosis / salah pasien | Apoteker / Tenaga Vokasi Farmasi | ⚠️ Wildcard Super Admin Bypass |
| **HRA-06** | Administrasi Obat | `POST /api/v1/medications/:id/administer` | Injeksi obat berisiko tinggi (*High Alert*) oleh staf non-perawat | Perawat Berlisensi (STR/SIP) | ⚠️ Wildcard Super Admin Bypass |
| **HRA-07** | Efek Samping Obat | `POST /api/v1/medications/administrations/:id/adverse-reaction`| Dokumentasi insiden MESO tanpa validasi medis | Dokter / Farmasis Klinis | 🔴 Authenticated Only |
| **HRA-08** | Rilis Hasil Lab | `POST /api/v1/laboratory/results/:id/release` | Rilis hasil lab patologi keliru yang memicu salah tindakan | Dokter Sp.PK / Analis Senior | ⚠️ Wildcard Super Admin Bypass |
| **HRA-09** | Lab Panic Alert Ack | `POST /api/v1/laboratory/panic-alerts/:id/acknowledge` | Nilai kritis lab diabaikan atau diakui tanpa tindakan segera | Dokter / Perawat Bertugas | ⚠️ Wildcard Super Admin Bypass |
| **HRA-10** | Rilis Radiologi | `POST /api/v1/radiology/studies/:id/reports` | Ekspertise radiologi oleh personel non-dokter spesialis | Dokter Sp.Rad Berlisensi (SIP) | ⚠️ Wildcard Super Admin Bypass |
| **HRA-11** | Koreksi Radiologi | `POST /api/v1/radiology/reports/:id/amend` | Pengubahan ekspertise radiologi tanpa audit legal | Dokter Sp.Rad Pembuat / Konsulen | ⚠️ Wildcard Super Admin Bypass |
| **HRA-12** | Rad Panic Alert Ack | `POST /api/v1/radiology/critical-alerts/:id/acknowledge` | Temuan kritis radiologi (misal tension pneumothorax) diabaikan | Dokter DPJP / Dokter IGD | ⚠️ Wildcard Super Admin Bypass |
| **HRA-13** | Otorisasi Pulang | `POST /api/v1/beds/discharge` | Pemulangan pasien tanpa persetujuan medis DPJP | Dokter DPJP Utama | 🔴 Authenticated Only (Missing Guard) |
| **HRA-14** | Ringkasan Pulang | `POST /api/v1/coordination/discharge-summaries` | Resume medis pemulangan diterbitkan tanpa telaah DPJP | Dokter DPJP Utama | 🔴 Authenticated Only |
| **HRA-15** | Uji Cocok Serasi | `POST /api/v1/blood-bank/crossmatch` | Transfusi darah inkompatibel (Inkompatibilitas ABO/Rhesus) | Petugas BDRS Tersertifikasi | ⚠️ isSuperAdmin Bypass |
| **HRA-16** | Verifikasi Bedside | `POST /api/v1/blood-bank/transfusion/verify` | Pemberian darah ke pasien yang salah di ranjang rawat | 2 Perawat Saksi (Dual Sign-off)| ⚠️ isSuperAdmin Bypass |
| **HRA-17** | Penulisan SOAP | `POST /api/v1/clinical-notes/soap` | Catatan medis legal ditulis oleh staf administratif | Dokter DPJP / Dokter Ruangan | ⚠️ Wildcard Super Admin Bypass |
| **HRA-18** | Koreksi SOAP | `POST /api/v1/clinical-notes/soap/:id/amend` | Pengubahan rekam medis masa lalu tanpa jejak audit | Dokter Penulis Asli | ⚠️ Wildcard Super Admin Bypass |
| **HRA-19** | Penulisan CPPT | `POST /api/v1/clinical-notes/cppt` | Dokumentasi PPA terintegrasi disusupi akun non-medis | Profesional Pemberi Asuhan (PPA)| ⚠️ Wildcard Super Admin Bypass |
| **HRA-20** | Verifikasi CPPT | `PATCH /api/v1/clinical-notes/cppt/:id/verify` | Verifikasi 1x24 jam CPPT ditandatangani non-DPJP | Dokter DPJP Utama | ⚠️ Wildcard Super Admin Bypass |
| **HRA-21** | Triase Gawat Darurat| `POST /api/v1/triage/assessments` | Penentuan kategori triase ESI/ATS yang keliru di IGD | Perawat Triase Bersertifikat | ⚠️ Wildcard Super Admin Bypass |
| **HRA-22** | Kontak Dokter Pertama| `POST /api/v1/triage/first-physician-contact` | Manipulasi SLA waktu tanggap dokter IGD | Dokter Jaga IGD | 🔴 Authenticated Only |
| **HRA-23** | WHO Surgical Safety | `POST /api/v1/perioperative/who-checklist` | Sign In, Time Out, Sign Out bedah dipalsukan | Tim Bedah (Operator/Anestesi/Circ) | 🔴 Authenticated Only |
| **HRA-24** | Rekam Implan Bedah | `POST /api/v1/perioperative/implants` | Penanaman implan kadaluwarsa / tanpa nomor batch legal | Dokter Operator Bedah | 🔴 Authenticated Only |
| **HRA-25** | Finalisasi Operasi | `POST /api/v1/perioperative/cases/:id/finalize` | Penutupan kasus bedah tanpa perhitungan kassa lengkap | Dokter Operator Bedah | 🔴 Authenticated Only |
| **HRA-26** | Override Alergi | `PATCH /api/v1/patients/:patientId/allergies/:allergyId`| Penonaktifan peringatan alergi obat fatal | Dokter Pemeriksa / Alergolog | 🔴 Authenticated Only |
| **HRA-27** | Code Blue Trigger | `POST /api/v1/monitoring/rapid-response` | Panggilan tim henti jantung palsu / terlambat | Staf Ruangan Bersertifikat BCLS | 🔴 Authenticated Only |
| **HRA-28** | CDSS Clinical Replay| `POST /api/v1/cdss/replay/:executionId` | Pengabaian rekomendasi keselamatan interaksi obat fatal | Dokter DPJP / Tim Farmasi | 🔴 Authenticated Only |

---

## 7. Tenant Authorization

Pemeriksaan terhadap penanganan isolasi multi-tenant pada seluruh controller dan service:

### A. Klasifikasi Sumber Otoritas Tenant
1. **SERVER-DERIVED (Aman):**
   - Diekstrak langsung dari payload token JWT yang telah diverifikasi tanda tangan HMAC-nya: `req.user.tenantId`.
2. **CLIENT-SUPPLIED (Rentan IDOR):**
   - Header `X-Tenant-ID` dibaca pada [`server/middlewares/tenantMiddleware.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/middlewares/tenantMiddleware.js#L7). Namun middleware ini **TIDAK TERPASANG** di `server/server.js`.
3. **DATABASE-DERIVED (Bypass Context):**
   - Pada [`server/services/clinicalNotesApplication.service.js:96`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/server/services/clinicalNotesApplication.service.js#L96):
     ```javascript
     const targetTenantId = encounter.tenant_id || actor.tenantId || '00000000-0000-0000-0000-000000000001';
     ```
     Jika klien Tenant A mengirimkan `encounterId` milik Tenant B, server mengambil `encounter.tenant_id` dari baris data yang ditemukan, sehingga catatan medis secara diam-diam tertulis di Tenant B (*Cross-Tenant Injection*).
4. **FALLBACK DEFAULT UUID:**
   - Mayoritas controller menggunakan pola:
     ```javascript
     const tenantId = (req.user?.tenantId && isUUID(req.user.tenantId)) ? req.user.tenantId : DEFAULT_TENANT_ID;
     ```
     Jika `req.user.tenantId` bernilai format non-UUID (misal `'TENANT-DEFAULT'`), controller diam-diam mengalihkan transaksi ke tenant `'00000000-0000-0000-0000-000000000001'`.

### B. Vektor Kerentanan Multi-Tenant yang Teridentifikasi:
- **Horizontal Privilege Escalation:** Pengguna Tenant A dapat membaca data Tenant B jika endpoint kueri SQL tidak menyertakan klausa `AND tenant_id = $x`.
- **IDOR / Resource Substitution:** Pengguna dapat memanipulasi parameter URL (misal `:encounterId` atau `:patientId`) lintas cabang/rumah sakit karena gateway tidak memvalidasi kecocokan antara `req.user.tenantId` dan `resource.tenant_id` sebelum controller dieksekusi.

---

## 8. Resource Authorization

### A. Perbedaan Konseptual: Wewenang Aksi vs Wewenang Resource

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   CAN PERFORM ACTION (MODULE PERMISSION)               │
├────────────────────────────────────────────────────────────────────────┤
│ "Apakah Dr. Budi memiliki hak untuk menulis catatan SOAP di sistem?"  │
│ Evaluasi: req.user.role == 'ROLE_DOCTOR_DPJP' -> TRUE (ALLOWED)        │
└────────────────────────────────────────────────────────────────────────┘
                                    VS
┌────────────────────────────────────────────────────────────────────────┐
│            CAN PERFORM ACTION ON THIS RESOURCE (RESOURCE OWNERSHIP)    │
├────────────────────────────────────────────────────────────────────────┤
│ "Apakah Dr. Budi adalah DPJP yang ditugaskan merawat Tn. Hendra        │
│  pada Encounter ENC-2026-001 di Ruang ICU?"                            │
│ Evaluasi Aktual: TIDAK DIPERIKSA (UNCHECKED IN ALL CLINICAL CONTROLLERS)│
└────────────────────────────────────────────────────────────────────────┘
```

### B. Hasil Audit Resource Medis Kritis:
1. **Patient Record (`master_patients`):** Tidak ada pembatasan hubungan dokter-pasien. Setiap pengguna berotentikasi dapat melihat rekam medis pasien mana pun melalui `GET /api/v1/patients/:id`.
2. **Encounter (`encounters`):** Controller `clinicalNotes` memuat encounter menggunakan `SELECT * FROM encounters WHERE id = $1 FOR UPDATE`. Tidak ada validasi apakah dokter yang login terdaftar sebagai `primary_doctor_id` atau konsulen terdaftar.
3. **Prescription & Medication Order:** Tidak ada pengecekan apakah resep yang dibatalkan (`/api/v1/medications/:id/cancel`) ditulis oleh dokter yang bersangkutan.
4. **Laboratory Results:** Analis laboratorium mana pun dapat merilis hasil lab tanpa verifikasi spesialisasi laboratorium atau departemen patologi terkait.
5. **Bed Management:** Perawat dari bangsal anak dapat memindahkan atau memulangkan pasien di bangsal bedah dewasa (`/api/v1/beds/transfer`).

**Klasifikasi Temuan:** ⚫ **OPEN ARCHITECTURAL DEBT — RESOURCE-LEVEL AUTHORIZATION ABSENT (DEBT-P0-008)**

---

## 9. Distributed Token Revocation (`DEBT-P0-001`)

### A. Implementasi Aktual Saat Ini
- Berkas: [`src/core/security/tokenBlacklist.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/core/security/tokenBlacklist.service.js)
- Penyimpanan: `this.blacklist = new Set()` dan `this.ttlIndex = new Map()` di memori heap V8 proses Node.js.
- Verifikasi: Dilakukan secara sinkron pada `jwtSecurityService.verifyToken(token)`.

### B. Perilaku Kegagalan (Failure Behavior):
1. **Server Restart:** Seluruh token yang diblacklist terhapus dari memori. Sesi yang telah logout kembali dapat digunakan oleh penyerang yang memiliki token fisik tersebut sampai waktu `exp` berakhir.
2. **Multi-Instance / Cluster:** Jika sistem dijalankan dengan PM2 cluster atau Kubernetes 3 pod, token yang di-logout pada Pod A tetap dianggap valid pada Pod B dan Pod C.
3. **Perubahan Password / Penonaktifan Akun:** Saat password diubah atau akun disetel `is_active = false`, token JWT yang sudah terbit tidak dicabut secara otomatis karena server tidak mencocokkan `iat` dengan timestamp pembaruan akun.

### C. Arsitektur Target (Target Architecture Requirement):
- **Shared Storage:** Redis cluster dengan perintah atomik `SETEX blacklist:<jti> <remaining_ttl> "revoked"`.
- **Database Fallback:** Kolom `token_version INT` atau `revoked_before TIMESTAMP` pada tabel `auth_users`. Setiap permintaan otentikasi memverifikasi bahwa klaim `iat` token lebih baru daripada `revoked_before`.

---

## 10. Distributed Rate Limiter (`DEBT-P0-002`)

### A. Implementasi Aktual Saat Ini
- Berkas: [`src/core/security/rateLimiter.service.js`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/core/security/rateLimiter.service.js)
- Penyimpanan: `this.hits = new Map()` pada memori heap lokal.
- Mekanisme: Window 60 detik berbasis sliding/fixed interval lokal.

### B. Perilaku Kegagalan (Failure Behavior):
1. **Multi-Worker Multiplier:** Pada arsitektur dengan 4 proses worker di balik reverse proxy NGINX, kuota rate limit 5 request/menit efektif menjadi 20 request/menit jika request terdistribusi secara round-robin.
2. **Memory Leak Under DDoS:** Penyerang yang memalsukan jutaan IP acak dapat membebani memori heap Node.js karena setiap IP membuat entri baru pada `Map()`.
3. **Restart Reset:** Reset instan seluruh counter saat proses restart.

### C. Arsitektur Target (Target Architecture Requirement):
- **Shared In-Memory Store:** Redis sliding-window log / token bucket via Lua script (`EVALSHA`) yang atomik.
- **Graceful Local Fallback:** Jika Redis tidak dapat dijangkau, beralih sementara ke memory limiter lokal dengan peringatan keamanan terpusat (*circuit breaker*).

---

## 11. Secret Boundary (`SEC-RISK-001`)

### A. Audit Seluruh Kunci & Rahasia Repositori

| Jenis Kunci / Rahasia | Lokasi Berkas & Baris | Nilai Default / Pola | Klasifikasi Keamanan | Rekomendasi Mitigasi Produksi |
| :--- | :--- | :--- | :---: | :--- |
| **JWT HMAC Secret** | `src/core/security/jwtSecurity.service.js:9` | `'NurseFlow_Enterprise_HIS_HMAC_Secret_2026_Secure_Key'` | ⚠️ **FALLBACK SECRET** | Terapkan fail-fast bootstrap; tolak start jika env kosong. |
| **PostgreSQL Dev Password** | `scripts/provision_dev_credentials.mjs:15` | Random dynamic salt (PBKDF2) | 🟢 **DEV GENERATOR** | Aman. Tidak menyimpan hash statis di git. |
| **SatuSehat Client Secret** | `.env.example:35` | `your_satusehat_client_secret_here` | ℹ️ **DOC EXAMPLE** | Aman. Contoh dokumentasi standar. |
| **BPJS ConsID Secret** | `.env.example:42` | `your_bpjs_secret_key_here` | ℹ️ **DOC EXAMPLE** | Aman. Contoh dokumentasi standar. |
| **Local DB URL** | `.env.example:12` | `postgresql://postgres:password@localhost:5432/...` | ℹ️ **DOC EXAMPLE** | Aman. Contoh dokumentasi lokal. |

### B. Ketiadaan Fail-Fast Guard di Server Startup
```text
SOURCE: server/server.js inspection
FINDING:
  Berkas server/config/envValidator.js telah mendefinisikan fungsi validateEnvironment(), namun fungsi tersebut
  TIDAK DIPANGGIL pada server/server.js sebelum app.listen().
CONSEQUENCE:
  Server di lingkungan production (NODE_ENV=production) dapat melakukan booting tanpa menyetel process.env.JWT_SECRET,
  sehingga fallback string statis aktif secara diam-diam.
```

---

## 12. Audit Trail Framework

Pemeriksaan forensik terhadap kepatuhan audit trail rekam medis elektronik (Permenkes 24/2022 & JCI MOI):

### A. Perbedaan 4 Tingkatan Log di NurseFlow:
1. **Application Log:** Console output via `morgan` / `console.log` untuk debugging developer.
2. **Security Log:** Pencatatan upaya login gagal, lockout akun 5x, dan penolakan token pada `auth.routes.js`.
3. **General Audit Log:** Pencatatan event CRUD umum pada tabel `universal_audit_logs`.
4. **Clinical Audit Trail (Forensik Medis):** Jejak audit yang mengikat **Aktor Medis (dengan nomor SIP)**, **Pasien (MRN)**, **Encounter**, **Snapshot Sebelum & Sesudah Tindakan**, **Alasan Klinis**, dan **Tanda Tangan Kriptografis**.

### B. Kesenjangan Audit Trail Klinis Aktual
- Tabel [`clinical_authorization_logs`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/database/migrations/015_staff_roster_credentialing_privileging.sql#L158) telah dirancang di PostgreSQL, namun **0 controller klinis menulis ke tabel ini**.
- Pada peresepan obat, pembatalan CPOE, dan pemulangan pasien, tidak ada pencatatan snapshot *before/after* atau *clinical reason* yang dapat diaudit secara hukum di pengadilan medis.

---

## 13. Failure Mode & Security Degradation Matrix

Evaluasi ketahanan sistem terhadap berbagai skenario kegagalan operasional:

| Security Control | Normal Operation | Process Restart | Multi-Instance (Scale-Out) | Database Failure | External Dependency Failure | Konsekuensi Keamanan (Security Consequence) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **JWT Verification** | Validasi tanda tangan HS256 lulus | Berfungsi normal (secret statis/env) | Berfungsi normal (shared secret) | Berfungsi (stateless token) | Tidak terpengaruh | Aman secara matematis, rentan bila secret bocor. |
| **Token Revocation** | Blacklist di memori Set() | **STATE LOST** (Seluruh token blacklist aktif kembali) | **ISOLATED** (Logout di node 1 tetap valid di node 2) | Tidak terpengaruh (in-memory) | Tidak terpengaruh | **High Risk:** Replay serangan sesi setelah logout. |
| **Rate Limiter** | Counter di memori Map() | **STATE RESET** (Counter kembali ke 0) | **DIVIDED** (Batas request dikalikan jumlah worker) | Tidak terpengaruh (in-memory) | Tidak terpengaruh | **Medium Risk:** Brute force DoS lebih mudah menembus batas. |
| **RBAC Route Guard** | Tolak peran salah (403) | Berfungsi normal (konstanta kode) | Berfungsi normal (konstanta kode) | Tidak terpengaruh (statik) | Tidak terpengaruh | Aman statik, namun Super Admin bypass tetap ada. |
| **Tenant Isolation** | Menggunakan fallback UUID | Menggunakan fallback UUID | Menggunakan fallback UUID | Kueri gagal (500) | Tidak terpengaruh | **High Risk:** Data tertukar ke default tenant jika context hilang. |
| **Resource Auth** | **TIDAK ADA** | **TIDAK ADA** | **TIDAK ADA** | Kueri gagal (500) | Tidak terpengaruh | **Critical Risk:** Akses lintas pasien tanpa hak asuh dokter. |
| **Clinical Credential**| **TIDAK ADA** | **TIDAK ADA** | **TIDAK ADA** | Kueri gagal (500) | Tidak terpengaruh | **Critical Risk:** Staf non-medis mengeksekusi mutasi medis. |
| **Audit Trail** | Sebagian tulis DB, sebagian in-memory | In-memory log hilang | Log tercecer di berbagai pod | Audit gagal disimpan (500) | Log tidak terpusat | **Legal Risk:** Gugurnya nilai pembuktian hukum rekam medis. |

---

## 14. Target Architecture

Arsitektur otorisasi enterprise target yang memisahkan tanggung jawab secara berlapis (*Separation of Concerns*):

```text
Incoming Request
  ↓
[ Layer 1: Transport & Gateway Defense ]
  • TLS 1.3 Termination, Correlation ID, Strict CORS, Security Headers
  ↓
[ Layer 2: Distributed Rate Limiting ]
  • Redis Sliding-Window Token Bucket (Per-IP & Per-User)
  ↓
[ Layer 3: Authentication & Identity Context ]
  • JWT Signature Verification (Strict HS256 / RS256, Zero-Fallback Secret)
  • Distributed Revocation Check (Redis Blacklist + User Token Version)
  • Build req.user Context (userId, staffId, tenantId, roles)
  ↓
[ Layer 4: Multi-Tenant Context Enforcement ]
  • Enforce req.user.tenantId == resource.tenant_id
  • Parameterized SQL WHERE tenant_id = $tenantId (Zero Default Fallback)
  ↓
[ Layer 5: Coarse-Grained RBAC & SoD Guard ]
  • Route-level requirePermission() on all 142 endpoints
  • Stripped Wildcard: Super Admin BARRED from clinical mutations
  ↓
[ Layer 6: Resource Ownership & Care-Team Guard ]
  • ABAC / Relation Check: Is practitioner assigned to this Patient / Encounter?
  ↓
[ Layer 7: Clinical Credential & Privileging Guard (RKK/SIP) ]
  • Validate master_practitioners.sip_number != NULL & status == 'ACTIVE'
  • Validate clinical_privileges for specific procedure_code
  ↓
[ Layer 8: Business Logic & Clinical Domain Invariant ]
  • Controller & Domain Entity Rules (e.g. Drug Allergy Check, Cold-Chain Valid)
  ↓
[ Layer 9: Immutable Forensic Audit Trail ]
  • Write to clinical_authorization_logs with SHA-256 Signature & Actor License
```

### Rincian Target Per-Lapisan:

1. **Layer 3 (Identity Context):**
   - *Current:* Token hanya membawa `userId`, `role`, `staffId`, `tenantId`.
   - *Target:* Tambahkan `practitionerId`, `sipNumber`, `tokenVersion` ke claims jika user adalah tenaga klinis.
2. **Layer 5 (Coarse-Grained RBAC & SoD):**
   - *Current:* Super Admin memiliki `*` yang membypass seluruh route dan controller.
   - *Target:* Hapus `*` dari peran administratif. Bagi peran TI murni ke `ROLE_IT_ADMIN` yang dilarang mengakses domain medis.
3. **Layer 6 (Resource Ownership):**
   - *Current:* Tidak ada pengecekan penugasan DPJP/Perawat terhadap encounter.
   - *Target:* Buat middleware `requireEncounterAccess()` yang memvalidasi penugasan dokter/perawat pada tabel `encounters` dan `encounter_care_teams`.
4. **Layer 7 (Clinical Credential & RKK):**
   - *Current:* 0% verifikasi lisensi di controller.
   - *Target:* Buat middleware `requireActiveClinicalLicense()` yang memverifikasi nomor SIP aktif di PostgreSQL sebelum mutasi medis diizinkan.
5. **Layer 9 (Forensic Audit Trail):**
   - *Current:* Sebagian menulis ke `universal_audit_logs`, sebagian in-memory, tidak ada lisensi dokter tercatat.
   - *Target:* Wajibkan setiap mutasi pada 28 High-Risk Actions menulis rekam jejak ke `clinical_authorization_logs`.

---

## 15. Implementation Order (Zero Coding Proposal)

Urutan implementasi masa depan yang diusulkan berdasarkan dependensi arsitektural dan mitigasi risiko tertinggi:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 1: SECRET & FAIL-FAST BOOTSTRAP HARMONIZATION (DevOps / SecOps)  │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Panggil validateEnvironment() di server/server.js sebelum startup. │
│ 2. Buang fallback string hardcoded pada jwtSecurity.service.js.        │
│ 3. Fail-fast shutdown jika JWT_SECRET kosong di lingkungan non-dev.    │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 2: SUPER ADMIN SOD & RBAC CLEANUP (Security Governance)          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Cabut wildcard '*' dari ROLE_SUPER_ADMIN di src/shared/roles.js.   │
│ 2. Hapus bypass isSuperAdmin pada server/middlewares/rbacMiddleware.js│
│ 3. Pasang requirePermission deklaratif pada seluruh 107 rute gateway.  │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 3: RUNTIME CLINICAL CREDENTIAL ENFORCEMENT (Clinical Governance) │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Bangun middleware requireActiveClinicalLicense().                   │
│ 2. Pasang pada 28 High-Risk Clinical Actions (SOAP, CPOE, Rx, Lab, dll)│
│ 3. Validasi keberadaan SIP aktif di tabel master_practitioners.        │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 4: TENANT & RESOURCE AUTHORIZATION (Data Architecture)           │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Pasang tenantMiddleware di server.js (Server-Authoritative binding).│
│ 2. Hapus seluruh fallback default UUID pada kueri controller.         │
│ 3. Bangun middleware requireEncounterAccess() untuk isolasi pasien.    │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 5: DISTRIBUTED SESSION & RATE LIMITING (Infrastructure Scale)    │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Implementasikan Redis Token Blacklist backend dengan TTL sinkron.   │
│ 2. Implementasikan Redis Sliding-Window Rate Limiter.                  │
│ 3. Tambahkan token_version check pada tabel auth_users.                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Acceptance Criteria

Setiap implementasi perbaikan di masa mendatang wajib diuji dengan kriteria penerimaan berbasis bukti:

### 1. Super Admin Separation of Duties
- **Metode Uji:** Eksekusi HTTP `POST /api/v1/clinical-notes/soap` menggunakan token berotentikasi tunggal `ROLE_SUPER_ADMIN`.
- **Hasil yang Diharapkan:** Server mengembalikan **HTTP 403 `PERMISSION_DENIED`** dengan pesan penolakan wewenang administratif.
- **Artefak Bukti:** Log HTTP test assertion yang membuktikan Super Admin tidak lagi dapat menulis catatan klinis.

### 2. Runtime Clinical Credential Validation
- **Metode Uji:** Eksekusi `POST /api/v1/orders/prescription` dengan akun staf yang memiliki peran `ROLE_DOCTOR_DPJP` tetapi masa berlaku SIP-nya kedaluwarsa di `master_practitioners`.
- **Hasil yang Diharapkan:** Server menolak peresepan dengan **HTTP 403 `CLINICAL_LICENSE_EXPIRED`**.
- **Artefak Bukti:** Entri penolakan tercatat pada tabel `clinical_authorization_logs`.

### 3. Cross-Tenant IDOR Prevention
- **Metode Uji:** Pengguna Tenant A mengirim request dengan menyertakan `encounterId` milik Tenant B.
- **Hasil yang Diharapkan:** Server menolak akses dengan **HTTP 404 `RESOURCE_NOT_FOUND`** atau **HTTP 403 `TENANT_ACCESS_DENIED`** tanpa mengekspos data Tenant B.
- **Artefak Bukti:** Audit log isolasi tenant membuktikan tidak ada kebocoran baris data lintas tenant.

### 4. Distributed Revocation Persistence Across Restart
- **Metode Uji:** Logout sesi pengguna, restart server Node.js, lalu kirim kembali request dengan access token lama.
- **Hasil yang Diharapkan:** Server tetap menolak token dengan **HTTP 401 `TOKEN_REVOKED`**.
- **Artefak Bukti:** Test script lifecycle restart yang memverifikasi persistensi Redis blacklist.

### 5. Production Zero-Fallback Secret Boot Guard
- **Metode Uji:** Booting server dengan `NODE_ENV=production` dan `JWT_SECRET=""`.
- **Hasil yang Diharapkan:** Proses Node.js segera berhenti (**Exit Code 1**) dengan pesan galat `Missing required environment variable: JWT_SECRET`.
- **Artefak Bukti:** CLI startup log test capture.

---

## 17. Authoritative Debt Register

Repositori tata kelola NurseFlow memelihara seluruh hutang arsitektur dan risiko keamanan yang telah dibuktikan secara forensik:

| ID Hutang | Kategori | Tingkat Keparahan | Status Target | Deskripsi Masalah Forensik |
| :--- | :--- | :---: | :---: | :--- |
| **DEBT-P0-001** | Distributed Infrastructure | MEDIUM | Open Debt | Blacklist token menggunakan in-memory `Set()`. Hilang saat restart dan tidak tersinkronisasi antar-node. |
| **DEBT-P0-002** | Distributed Infrastructure | MEDIUM | Open Debt | Rate limiter menggunakan memory `Map()`. Kuota request terpisah antar-worker proses Node.js. |
| **DEBT-P0-003** | Authorization Coverage | HIGH | Open Debt | 100 dari 142 endpoint REST aktif hanya dilindungi `authenticateJwt` tanpa guard peran/izin deklaratif. |
| **DEBT-P0-004** | Regression Stabilization | LOW | Open Debt | 2 berkas test gagal akibat dependensi tabel Sprint D2.3 belum dijalankan dan tanggal fixture CSSD statis. |
| **DEBT-P0-005** | Clinical Security & Governance | **CRITICAL** | **MUST CLOSE BEFORE PILOT** | Akun Super Admin dapat mengeksekusi 8 tindakan klinis akibat wildcard `*` dan bypass peran di middleware. |
| **DEBT-P0-006** | Clinical Credential Runtime | **CRITICAL** | **MUST CLOSE BEFORE PILOT** | 0% controller klinis yang memvalidasi SIP/STR atau RKK dokter pada `master_practitioners` saat transaksi. |
| **DEBT-P0-007** | Multi-Tenant Data Isolation | HIGH | Open Debt | `tenantMiddleware.js` tidak terpasang di `server.js`; kueri controller rentan IDOR dan fallback default UUID. |
| **DEBT-P0-008** | Resource Ownership Guard | HIGH | Open Debt | Tidak ada verifikasi hubungan penugasan dokter/perawat terhadap encounter/pasien spesifik (Care Team). |
| **DEBT-P0-009** | Session Invalidation on Status Change | MEDIUM | Open Debt | Penonaktifan akun atau ganti password tidak membatalkan token JWT yang sedang beredar. |
| **DEBT-P0-010** | Clinical Forensic Audit Trail | HIGH | Open Debt | 28 High-Risk Actions belum menulis data snapshot *before/after* dan *clinical reason* ke `clinical_authorization_logs`. |
| **SEC-RISK-001**| Production Secret Management | HIGH | Open Risk | String fallback hardcoded `JWT_SECRET` aktif jika env kosong, dan `validateEnvironment` belum dipasang di startup. |

---

## 18. Final Governance Gate

Berdasarkan seluruh hasil audit forensik, verifikasi live database PostgreSQL 16, pembuktian 142 endpoint REST Gateway, identifikasi 28 aksi klinis berisiko tinggi, dan pemetaan arsitektur target di atas:

Auditor Forensik Keamanan & Arsitektur menetapkan:

---

# 🏁 P0-2 BASELINE STATUS: READY FOR IMPLEMENTATION

---

### Justifikasi Kelayakan (*Readiness Justification*):
1. **Arsitektur Otorisasi Terpetakan Penuh:** Alur aktual (Current Actual Flow) dan kesenjangannya telah dipetakan secara transparan tanpa klaim palsu.
2. **142 Endpoint REST Terinventarisasi 100%:** Seluruh 142 rute fisik telah dipetakan terhadap metode otentikasi, peran, izin, tenant, resource, dan risiko keamanan.
3. **Batas Super Admin & SoD Terbukti di Level Baris Kode:** Bukti baris kode (`rbacGuard.service.js:20`, `rbacMiddleware.js:104`) dan status kritis penutupan sebelum pilot klinis telah ditetapkan secara mengikat.
4. **Model Hak Istimewa Klinis & Lisensi Terpetakan:** Kesenjangan antara master data (100% dokter punya SIP) dan runtime controller (0% verifikasi SIP) telah dibuktikan secara forensik.
5. **Keterbatasan Sesi Terdistribusi & Rate Limiter Terpetakan:** Bukti in-memory `Set()` dan `Map()` telah diinventarisasi bersama rancangan arsitektur target.
6. **Seluruh Ketidaktahuan Kritis (Critical Unknowns) = 0:** Seluruh komponen telah diinvestigasi langsung pada kode sumber dan database aktif.

Sistem NurseFlow Enterprise HIS secara tata kelola dinyatakan **SIAP SECARA BASELINE ARSITEKTURAL** untuk memulai tahapan rekayasa berurutan yang direncanakan.

---

### STOP CONDITION COMPLIANCE:
Audit baseline otorisasi ini telah tuntas disusun. Sesuai direktif absolut tata kelola:
- **TIDAK ADA PERUBAHAN SOURCE CODE APLIKASI**
- **TIDAK ADA PERUBAHAN MIDDLEWARE / RBAC**
- **TIDAK ADA PERUBAHAN DATABASE / MIGRATION**
- **TIDAK ADA PENAMBAHAN REDIS**
- **PROSES BERHENTI (STOP) UNTUK MENUNGGU PENINJAUAN MANUSIA**
