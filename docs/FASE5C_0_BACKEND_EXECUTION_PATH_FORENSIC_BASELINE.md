# 🔬 FASE 5C.0: BACKEND EXECUTION PATH FORENSIC BASELINE
## Inventaris Forensik Jalur Eksekusi Data Klinis (Command-by-Command Forensic Analysis)
**Tanggal Audit:** 20 Agustus 2026  
**Auditor Tim:** Enterprise HIS Architecture Board & CTO Technical Review  
**Klasifikasi:** Phase 5C.0 Master Forensic Baseline  
**Prinsip Utama:**  
- 🔒 **"Browser storage is not the system of record."**  
- 🔒 **"PostgreSQL is the Source of Truth."**  
- 🔒 **"Feature expansion is a distraction. No new CDSS, no new dashboards, no vanity tests."**  
- 🔒 **"Setiap clinical command harus memiliki jalur tunggal yang dapat ditelusuri dari aksi manusia sampai durable state PostgreSQL."**  

---

## 📊 1. MASTER BACKEND EXECUTION PATH FORENSIC MATRIX

Berikut adalah hasil audit forensik berbasis kode nyata per *clinical command* di seluruh lapisan NurseFlow:

| No | Clinical Command | UI Component & Event | Client Service / Handler | Client Local Storage | Real HTTP Call? | Express Controller & Route | Auth & Tenant Context | DB Transaction | PostgreSQL Table Target | Audit Event | Outbox Event | Current Source of Truth | Forensic Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: | :--- | :---: | :---: | :--- | :---: |
| **WAVE 1: PATIENT IDENTITY & ENCOUNTER** |
| 1.1 | **Register New Patient** | `RegistrationDeskWorkspace.jsx` (`onSubmit`) | `registrationEngineService.registerNewPatient` | `localStorage['nurseflow_patient_registrations']` | ❌ **NO** | `patientController.createPatient` (`POST /api/v1/patients`) | ❌ *Bypassed* | ❌ *None* | `001_master_patients.sql` (`patients`) | `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 1.2 | **Search Patient (MPI)** | `RegistrationDeskWorkspace.jsx` (`onChange`) | `patientRepository.findByMrn` | `localStorage['nurseflow_master_patients']` | ❌ **NO** | `patientController.getPatients` (`GET /api/v1/patients`) | ❌ *Bypassed* | ❌ *None* | `001_master_patients.sql` (`patients`) | ❌ *None* | ❌ *None* | `localStorage` | 🔴 **GAP** |
| 1.3 | **Merge Duplicate Patient** | `MasterDataHub.jsx` (`onMerge`) | `enterpriseMasterApiService.mergePatients` | `localStorage['nurseflow_master_patients']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `001_master_patients.sql` (`patient_merges`) | `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 1.4 | **Create Encounter** | `EncounterWorkspaceModal.jsx` (`onSubmit`) | `encounterEngineService.transitionEncounterStatus` | `localStorage['nurseflow_encounters']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `002_episodes_and_encounters.sql` (`encounters`)| `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 1.5 | **Admit to Inpatient Bed** | `BedManagementCenterPage.jsx` (`onAssignBed`)| `bedManagementService.assignBedToPatient` | `localStorage['nurseflow_beds']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `010_bed_ward_hierarchy.sql` (`bed_occupancies`) | `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 1.6 | **Transfer Patient Bed** | `BedManagementCenterPage.jsx` (`onTransfer`) | `bedManagementService.transferBed` | `localStorage['nurseflow_beds']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `010_bed_ward_hierarchy.sql` (`bed_transfers`) | `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 1.7 | **Discharge Patient (ADT)**| `EncounterSummaryPage.jsx` (`onDischarge`) | `encounterEngineService.dischargePatient` | `localStorage['nurseflow_encounters']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `002_episodes_and_encounters.sql` (`encounters`)| `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| **WAVE 2: EMERGENCY CLINICAL CORE** |
| 2.1 | **Submit Triage (ESI/ATS)** | `RapidTriageStudio.jsx` (`handleSubmitTriage`) | `triageEngineService.recordTriageAssessment` | `localStorage['nurseflow_emergency_triage_assessments']`| ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `004_triage_and_emergency.sql` (`triage_assessments`)| `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 2.2 | **Record Vital Signs** | `RapidTriageStudio.jsx` / `ClinicalObservationWorkspace.jsx`| `observationEngineService.recordVitals` | `localStorage['nurseflow_observations']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `005_emr_soap_cppt_and_cdss.sql` (`vitals`) | `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 2.3 | **Save Doctor SOAP Note** | `SoapWorkspace.jsx` (`handleSubmit`) | `soapEngineService.recordSoapNote` | `localStorage['nurseflow_soap_notes']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `005_emr_soap_cppt_and_cdss.sql` (`soap_notes`) | `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 2.4 | **Record CPPT Assessment** | `CPPTWorkspace.jsx` (`handleSubmit`) | `cpptEngineService.recordCpptEntry` | `localStorage['nurseflow_cppt_entries']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `005_emr_soap_cppt_and_cdss.sql` (`cppt_entries`)| `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 2.5 | **Create Care Plan** | `CarePlanWorkspace.jsx` (`handleSubmit`) | `carePlanService.recordCarePlan` | `localStorage['nurseflow_care_plans']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `005_emr_soap_cppt_and_cdss.sql` (`care_plans`) | `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| **WAVE 3: CLINICAL ORDERS (CPOE)** |
| 3.1 | **Create CPOE Order** | `OrderEntryWorkspace.jsx` (`handleSubmit`) | `universalOrderEngineService.createOrder` | `localStorage['nurseflow_clinical_orders']` | ❌ **NO** | `ordersController.createOrder` (`POST /api/v1/orders`) | ❌ *Bypassed* | ❌ *None* | `006_universal_orders.sql` (`clinical_orders`) | `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 3.2 | **Verify Clinical Order**| `OrdersWorkspace.jsx` (`onVerify`) | `universalOrderEngineService.transitionStatus` | `localStorage['nurseflow_clinical_orders']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `006_universal_orders.sql` (`clinical_orders`) | `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 3.3 | **Cancel Clinical Order**| `OrdersWorkspace.jsx` (`onCancel`) | `universalOrderEngineService.cancelOrder` | `localStorage['nurseflow_clinical_orders']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `006_universal_orders.sql` (`clinical_orders`) | `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| **WAVE 4: CLOSED-LOOP MEDICATION & PHARMACY** |
| 4.1 | **Pharmacy Review (MMU.4)**| `EnterprisePharmacyWorkspace.jsx` (`onVerify`) | `pharmacyVerificationService.verifyPrescription` | `localStorage['nurseflow_pharmacy_orders']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `006_universal_orders.sql` (`pharmacy_reviews`)| `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 4.2 | **FEFO Stock Dispense** | `EnterprisePharmacyWorkspace.jsx` (`onDispense`)| `fefoMultiDepotInventoryEngine.dispenseMedication` | `persistenceAdapter` (RAM Map + LocalStorage) | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `012_pharmacy_inventory_fefo.sql` (`inventory_batches`)| `persistenceAdapter` | Client Memory | `persistenceAdapter` | 🔴 **GAP** |
| 4.3 | **eMAR 5-Rights Admin** | `EmarAdministrationStudio.jsx` (`onAdminister`)| `pointOfCareFiveRightsValidator.validateAndAdminister`| `persistenceAdapter` (RAM Map + LocalStorage) | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `006_universal_orders.sql` (`medication_administrations`)| `persistenceAdapter` | Client Memory | `persistenceAdapter` | 🔴 **GAP** |
| 4.4 | **Cold Chain Excursion** | `EnterprisePharmacyWorkspace.jsx` (`onExcursion`) | `fefoMultiDepotInventoryEngine.recordColdChainExcursion`| `persistenceAdapter` (RAM Map + LocalStorage) | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `022_enterprise_pharmacy.sql` (`cold_chain_logs`)| `persistenceAdapter` | Client Memory | `persistenceAdapter` | 🔴 **GAP** |
| 4.5 | **Controlled Substance Log**| `EnterprisePharmacyWorkspace.jsx` (`onLogNarcotic`)| `fefoMultiDepotInventoryEngine.recordControlledSubstance`| `persistenceAdapter` (RAM Map + LocalStorage) | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `022_enterprise_pharmacy.sql` (`narcotics_ledger`)| `persistenceAdapter` | Client Memory | `persistenceAdapter` | 🔴 **GAP** |
| **WAVE 5: DIAGNOSTIC SERVICES (LIS & PACS)** |
| 5.1 | **Lab Specimen Accession** | `LabPage.jsx` (`onAccession`) | `lisSpecimenTrackingService.accessionSpecimen` | `localStorage['nurseflow_lab_specimens']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `016_lis_specimen_tracking.sql` (`lab_specimens`)| `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 5.2 | **Enter Lab Result** | `LabPage.jsx` (`onSaveResult`) | `lisSpecimenTrackingService.recordResult` | `localStorage['nurseflow_lab_results']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `016_lis_specimen_tracking.sql` (`lab_results`) | `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 5.3 | **Flag Lab Panic Value** | `LabPage.jsx` (`onTriggerPanic`) | `lisSpecimenTrackingService.triggerPanicValue` | `localStorage['nurseflow_lab_panics']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `016_lis_specimen_tracking.sql` (`panic_alerts`)| `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 5.4 | **Radiology DICOM Study** | `RadiologyWorkspacePage.jsx` (`onUploadDicom`)| `pacsDicomEngineService.ingestDicomStudy` | `localStorage['nurseflow_dicom_studies']` | ❌ **NO** | `dicomwebController.wadoRs` (`/dicomweb/studies`) | ❌ *Bypassed* | ❌ *None* | `017_pacs_radiology_dicom.sql` (`dicom_studies`)| `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 5.5 | **Save Radiologist Report**| `RadiologyWorkspacePage.jsx` (`onSaveReport`) | `pacsDicomEngineService.saveRadiologyReport` | `localStorage['nurseflow_radiology_reports']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `018_radiology_orders.sql` (`radiology_reports`)| `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| **WAVE 6: REVENUE CYCLE & EXTERNAL BRIDGING** |
| 6.1 | **Charge Capture (Billing)**| `BillingPage.jsx` (`onAddCharge`) | `surgicalRevenueCycleService.captureCharge` | `localStorage['nurseflow_billing_charges']` | ❌ **NO** | `billingController.createInvoice` (`POST /api/v1/billing`) | ❌ *Bypassed* | ❌ *None* | `007_billing_revenue_claims.sql` (`billing_items`)| `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 6.2 | **Ina-CBG Casemix Group** | `BillingPage.jsx` (`onGroupInaCbg`) | `surgicalRevenueCycleService.groupInaCbg` | `localStorage['nurseflow_inacbg_claims']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `024_revenue_cycle_casemix.sql` (`inacbg_claims`)| `localStorage` | Client Memory | `localStorage` | 🔴 **GAP** |
| 6.3 | **Generate BPJS SEP** | `RegistrationDeskWorkspace.jsx` (`onGenerateSep`)| `bpjsVClaimBridgeService.generateSep` | `localStorage['nurseflow_bpjs_seps']` | ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `003_front_office_and_queues.sql` (`bpjs_seps`)| `localStorage` | Sandbox HTTP | `localStorage` | 🔴 **GAP** |
| 6.4 | **SATUSEHAT FHIR R4 Bundle**| `SatusehatStudioPage.jsx` (`onTransmit`) | `satusehatFhirService.transmitBundle` | `localStorage['nurseflow_satusehat_outbox']`| ❌ **NO** | ❌ *Missing Route* | ❌ *None* | ❌ *None* | `035_fhir_reliable_delivery.sql` (`fhir_outbox`)| `localStorage` | Sandbox HTTP | `localStorage` | 🔴 **GAP** |

---

## 🔍 2. DIAGNOSIS FORENSIK MENDALAM

### 1. The Disconnected Reality (Jurang Arsitektur Nyata)
* **Backend Express Telah Memiliki Skeleton:** Di `server/routes/` terdapat routes untuk `auth`, `patients`, `orders`, `billing`, `cdss`, `dicomweb`, dan `medicationKnowledge`.
* **Tetapi Controller Backend Masih Memanggil Client-Side Repositories:** Sebagai contoh, `server/controllers/patient.controller.js` memanggil `patientRepository.loadAll()`. Di lingkungan Node.js di mana `window` tidak ada, repository tersebut mengembalikan array default `[]` karena tidak terhubung ke kueri SQL `postgresPool.query()`.
* **Frontend SPA Tidak Pernah Mengirim HTTP Request:** Seluruh komponen React di `src/modules/` langsung mengimpor service lokal (seperti `triageEngineService`, `soapEngineService`, `universalOrderEngineService`) yang mengeksekusi mutasi pada `localStorage` atau in-memory state.

### 2. Status Kepemilikan Data (*System of Record Ownership*)
* Saat ini **100% data transaksi klinis operasional yang diinput oleh pengguna di UI hidup di dalam browser storage (`localStorage` / in-memory Maps)**.
* **0% data transaksi klinis operasional tersimpan secara durable di tabel fisik PostgreSQL 16**.

---

## 🏗️ 3. ARSITEKTUR UNIFIKASI BACKEND (FASE 5C EXECUTION BLUEPRINT)

Untuk menutup jurang (*Reality Gap*) di atas secara permanen, arsitektur unifikasi akan dieksekusi melalui **6 Wave Terstruktur**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE UNIFIED CLINICAL DURABILITY PIPELINE                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                 [ React UI ]
                                      │
                         (Authenticated HTTP Request)
                                      ▼
                        [ Centralized HTTP API Client ]
                         (`src/core/api/httpClient.js`)
                                      │
                                (JWT / Context)
                                      ▼
                        [ Express REST API Gateway ]
                         (`server/routes/api/v1/`)
                                      │
                        (Auth & Permission Middleware)
                                      ▼
                         [ Domain Service Controller ]
                                      │
                        (Clinical Invariant Validator)
                                      ▼
                      [ BEGIN POSTGRESQL 16 TRANSACTION ]
                      ├── 1. Insert/Update Clinical Domain Table
                      ├── 2. Insert Append-Only Immutable Audit Log (SHA-256)
                      └── 3. Insert Transactional Outbox Event
                                      ▼
                                [ COMMIT TX ]
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
        [ Local-First IndexedDB Cache ]        [ Async Outbox Publisher ]
           (For Offline Resilience)            ├── SATUSEHAT FHIR R4 Bridge
                                               ├── BPJS VClaim Bridge
                                               └── PACS DICOM Dispatcher
```

---

## 📋 4. DEPENDENCY & EXECUTION SEQUENCING (WAVE 1 s.d. WAVE 6)

1. **Wave 1 — Patient Identity & Encounter (P0 Foundation):**
   - Wire `RegistrationDeskWorkspace` $\rightarrow$ `POST /api/v1/patients` $\rightarrow$ `patients` SQL Table.
   - Wire `EncounterWorkspaceModal` $\rightarrow$ `POST /api/v1/encounters` $\rightarrow$ `encounters` SQL Table.
   - Wire `BedManagementCenter` $\rightarrow$ `POST /api/v1/beds/assign` $\rightarrow$ `bed_occupancies` SQL Table.
2. **Wave 2 — Emergency Clinical Core (P0 Clinical):**
   - Wire `RapidTriageStudio` $\rightarrow$ `POST /api/v1/emergency/triage` $\rightarrow$ `triage_assessments` SQL Table.
   - Wire `SoapWorkspace` $\rightarrow$ `POST /api/v1/emr/soap` $\rightarrow$ `soap_notes` SQL Table.
   - Wire `CPPTWorkspace` $\rightarrow$ `POST /api/v1/emr/cppt` $\rightarrow$ `cppt_entries` SQL Table.
3. **Wave 3 — Clinical Orders (CPOE) (P0 Orders):**
   - Wire `OrderEntryWorkspace` $\rightarrow$ `POST /api/v1/orders` $\rightarrow$ `clinical_orders` SQL Table.
4. **Wave 4 — Closed-Loop Medication & Pharmacy (P0 Safety):**
   - Wire `EnterprisePharmacyWorkspace` $\rightarrow$ `POST /api/v1/pharmacy/dispense` $\rightarrow$ `inventory_batches` SQL Table.
   - Wire `EmarAdministrationStudio` $\rightarrow$ `POST /api/v1/nursing/emar` $\rightarrow$ `medication_administrations` SQL Table.
5. **Wave 5 — Diagnostic Services (LIS & PACS) (P1 Diagnostics):**
   - Wire `LabPage` $\rightarrow$ `POST /api/v1/lab/results` $\rightarrow$ `lab_results` SQL Table.
   - Wire `RadiologyWorkspacePage` $\rightarrow$ `POST /api/v1/radiology/reports` $\rightarrow$ `radiology_reports` SQL Table.
6. **Wave 6 — Revenue & External Gateways (P1 Business):**
   - Wire `BillingPage` $\rightarrow$ `POST /api/v1/billing/charges` $\rightarrow$ `billing_items` SQL Table.
   - Wire SATUSEHAT/BPJS Outbox Processor $\rightarrow$ `POST /api/v1/integrations/outbox/drain`.

---

## 🔒 5. CLINICAL DURABILITY GATE CONTRACT

Setiap endpoint backend dalam Fase 5C wajib mematuhi kontrak durabilitas:

$$\text{HTTP 200 OK} \iff \left( \text{PostgreSQL INSERT} \land \text{Audit Log SHA-256} \land \text{Outbox Event} \land \text{COMMIT TX} \right)$$

Jika salah satu komponen gagal, transaksi database wajib di-`ROLLBACK` dan mengembalikan kode status HTTP `500 INTERNAL_SERVER_ERROR` atau `400 BAD_REQUEST`, sehingga UI tidak akan pernah menampilkan pesan sukses palsu (*anti-phantom success*).
