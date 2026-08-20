# 🏛️ API WIRING MATRIX: NURSEFLOW ENTERPRISE HIS 2026

**Tanggal:** 21 Agustus 2026  
**Auditor:** Enterprise Systems Architecture Board & Backend Engineering  
**Prinsip Desain:** *"Zero Direct Frontend-to-Backend Imports. All browser interactions MUST traverse authenticated, rate-limited, and audited REST API endpoints."*

---

## 1. 📊 MATRIKS WIRING API BACKEND LENGKAP (EXPRESS REST ENDPOINTS)

| # | Domain Modul | Status Mounting di `server.js` | Endpoint Path di Express | Method | Controller Terhubung | Database Table Target | Status Wiring | Keterangan & Gap Analisis |
| :-: | :--- | :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| **01** | **Autentikasi & Sesi** | ✅ Mounted | `/api/v1/auth/login`, `/me`, `/logout` | `POST`, `GET` | `auth.controller.js` | `auth_users`, `auth_sessions` | 🟢 **WIRED** | Terhubung ke JWT & Zero-Trust Middleware. |
| **02** | **Pasien & Identitas** | ✅ Mounted | `/api/v1/patients`, `/search`, `/:id` | `POST`, `GET` | `patientApplication.controller.js` | `master_patients`, `patient_identifiers` | 🟢 **WIRED** | Terhubung ke EMPI Engine. |
| **03** | **Encounter & ADT** | ✅ Mounted | `/api/v1/encounters`, `/transition`, `/:id` | `POST`, `GET` | `encounterApplication.controller.js` | `encounters`, `episodes_of_care` | 🟢 **WIRED** | Terhubung ke CareStateEngine FSM. |
| **04** | **Tempat Tidur (Beds)** | ✅ Mounted | `/api/v1/beds`, `/assign`, `/transfer`, `/discharge`| `GET`, `POST` | `beds.controller.js` | `master_beds`, `bed_state_transitions` | 🟢 **WIRED** | Terhubung ke Bed Management FSM. |
| **05** | **Triase Gawat Darurat** | ✅ Mounted | `/api/v1/triage/assessments`, `/queue` | `POST`, `GET` | `triageApplication.controller.js` | `triage_assessments`, `emergency_queues` | 🟢 **WIRED** | Terhubung ke Kalkulator ATS/ESI. |
| **06** | **Catatan Klinis SOAP** | ✅ Mounted | `/api/v1/clinical-notes`, `/:id/amend` | `POST` | `clinicalNotes.controller.js` | `clinical_notes_soap`, `clinical_note_amendments` | 🟢 **WIRED** | Terhubung ke SHA-256 digital signature. |
| **07** | **Universal CPOE** | ✅ Mounted | `/api/v1/orders/cpoe`, `/:id/cancel` | `POST` | `orders.controller.js` | `universal_cpoe_orders`, `cpoe_order_items` | 🟢 **WIRED** | Terhubung ke Outbox Transaction Core. |
| **08** | **Laboratorium LIS** | ✅ Mounted | `/api/v1/laboratory/specimens/collect`, `/receive`, `/results`, `/verify` | `POST` | `laboratory.controller.js` | `laboratory_specimens`, `laboratory_test_results` | 🟢 **WIRED** | Terhubung ke Panic Value Alerts. |
| **09** | **Radiologi PACS** | ✅ Mounted | `/api/v1/radiology/studies`, `/interpret`, `/dicomweb/*` | `POST`, `GET` | `radiology.controller.js` | `radiology_study_orders`, `dicom_instances` | 🟢 **WIRED** | Terhubung ke DICOMweb WADO/QIDO parser. |
| **10** | **Farmasi & eMAR** | ✅ Mounted | `/api/v1/medications/dispense`, `/verify-5rights`, `/administer` | `POST` | `medicationClosedLoop.controller.js`| `medication_orders`, `emar_administration_events` | 🟢 **WIRED** | Terhubung ke 5-Benar Barcode Engine. |
| **11** | **Monitoring & MEWS** | ✅ Mounted | `/api/v1/monitoring/observations`, `/escalate`, `/rapid-response` | `POST` | `clinicalMonitoring.controller.js` | `clinical_vital_signs`, `deterioration_alerts` | 🟢 **WIRED** | Terhubung ke Algoritma NEWS2 / Code Blue. |
| **12** | **Hasil Diagnostik** | ✅ Mounted | `/api/v1/diagnostics/interpretations`, `/critical-results/acknowledge` | `POST` | `diagnosticInterpretation.controller.js` | `diagnostic_interpretations` | 🟢 **WIRED** | Terhubung ke Secondary Actions Escalation. |
| **13** | **Timeline & SBAR** | ✅ Mounted | `/api/v1/coordination/care-plans`, `/handovers`, `GET /timeline` | `POST`, `GET` | `careCoordinationAndTimeline.controller.js` | `multidisciplinary_care_plans`, `longitudinal_timeline_events` | 🟢 **WIRED** | Terhubung ke Unified Patient Timeline. |
| **14** | **Bedah Perioperatif**| ✅ Mounted | `/api/v1/perioperative/cases`, `/who-checklist`, `/implants`, `/aldrete` | `POST` | `perioperativeClosedLoop.controller.js`| `perioperative_cases`, `who_surgical_safety_checklists` | 🟢 **WIRED** | Terhubung ke WHO 3-Phase Checklist. |
| **15** | **Casemix & INA-CBG** | ✅ Mounted | `/api/v1/casemix/coding-records`, `/queries`, `/grouping`, `/cross-audit`, `/claims` | `POST` | `clinicalCodingAndCasemix.controller.js` | `casemix_rulesets`, `clinical_coding_records`, `casemix_grouping_audits` | 🟢 **WIRED** | Terhubung ke Permenkes 3/2023 Ruleset. |
| **16** | **Patient Financial** | ✅ Mounted | `/api/v1/patient-financial/deposits`, `/invoices`, `/payments`, `/adjustments`, `/shifts/reconcile`, `/ar` | `POST` | `patientFinancialAndRevenueCycle.controller.js` | `patient_deposit_ledgers`, `patient_split_invoices`, `cashier_payment_transactions` | 🟢 **WIRED** | Terhubung ke Multi-Payer Split Invoicing. |
| **17** | **Bank Darah (BDRS)** | 🔴 **UNMOUNTED** | `/api/v1/blood-bank/units`, `/crossmatch`, `/issue`, `/transfusion`, `/reaction` | `GET`, `POST` | 🔴 **Belum Ada Controller** | `blood_donor_units`, `blood_crossmatches`, `blood_issue_records` | 🔴 **MISSING REST API** | UI Studio mengimpor Map in-memory langsung. Wajib dibuat controller REST. |
| **18** | **Staff Privileging** | 🔴 **UNMOUNTED** | `/api/v1/staff-privileges/roster`, `/credentials`, `/privileges/verify` | `GET`, `POST` | 🔴 **Belum Ada Controller** | `master_staff`, `clinical_privileges`, `staff_rosters` | 🔴 **MISSING REST API** | UI mengimpor `staffSchedulingService` langsung. Wajib dibuat controller REST. |
| **19** | **Master Data Hub** | 🔴 **UNMOUNTED** | `/api/v1/master-data/tenants`, `/organizations`, `/locations`, `/tariffs`, `/catalogs` | `GET`, `POST`, `PUT` | 🔴 **Belum Ada Controller** | `master_tenants`, `master_organizations`, `master_locations` | 🔴 **MISSING REST API** | UI master data hanya membaca client store lokal. Wajib dibuat controller REST. |
| **20** | **Appointments** | 🔴 **UNMOUNTED** | `/api/v1/appointments`, `/schedules`, `/slots`, `/book` | `GET`, `POST` | 🔴 **Belum Ada Controller** | `patient_appointments`, `doctor_schedules` | 🔴 **MISSING REST API** | UI appointment menggunakan mock client store. Wajib dibuat controller REST. |
| **21** | **Inventory & Supply**| 🔴 **UNMOUNTED** | `/api/v1/inventory/stock`, `/movements`, `/batches`, `/material-requests` | `GET`, `POST` | 🔴 **Belum Ada Controller** | `inventory_stock_ledgers`, `inventory_batches` | 🔴 **MISSING REST API** | Halaman inventory belum memiliki controller backend. Wajib dibuat controller REST. |
| **22** | **SATUSEHAT Interop** | 🔴 **UNMOUNTED** | `/api/v1/satusehat/config`, `/bundle/validate`, `/transmit`, `/outbox/retry` | `GET`, `POST` | 🔴 **Belum Ada Controller** | `satusehat_integration_configs`, `fhir_delivery_outbox` | 🔴 **MISSING REST API** | UI simulator belum memanggil runtime API Express. Wajib dibuat controller REST. |
| **23** | **Command Center** | 🔴 **UNMOUNTED** | `/api/v1/command-center/metrics`, `/capacity`, `/financial-kpis`, `/emergency-status` | `GET` | 🔴 **Belum Ada Controller** | Cross-Domain Aggregations | 🔴 **MISSING REST API** | 7 studio command center mengimpor service in-memory. Wajib dibuat controller REST. |

---

## 2. 🛡️ RINGKASAN REKONSILIASI API (WIRING STATUS)

```text
========================================================================================
STATUS WIRING REST API NURSEFLOW 2026:
========================================================================================
• Total Domain Layanan Inti RS  : 23 Domain
• Domain Fully Wired ke REST API: 16 Domain (69.6%) 🟢
• Domain Missing REST Controller: 7 Domain (30.4%) 🔴
  (Bank Darah, Staff Privileges, Master Data, Appointments, Inventory, SATUSEHAT, Command Center)
========================================================================================
```
