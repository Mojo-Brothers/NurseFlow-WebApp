# 🏛️ [FASE 5A-UI.3] MASTER UI ↔ API ↔ BACKEND OPERATIONAL MATRIX (2026)

**NurseFlow Enterprise Hospital Information System**  
**Standar Kepatuhan:** Joint Commission International (JCI 7th Edition), ISO/IEC 27001, RFC 7807, PostgreSQL 16 ACID  
**Status Evaluasi:** 🟢 **FULLY RE-WIRED & AUTHORITATIVE ACROSS ALL 30 DOMAINS**  

---

## 1. Matrix Pemetaan Komprehensif (30 Domain Rumah Sakit)

| No | Domain Rumah Sakit | UI Page / Studio Component | Tindakan UI (Action Button) | Handler Frontend | Canonical API Endpoint | Controller Backend | Application Service | PostgreSQL SSOT Table | Tipe Mutasi | Status Otoritatif |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | **Authentication** | `LoginPage.jsx` | Login Staff / Dokter | `handleLogin` | `POST /api/v1/auth/login` | `authController.login` | `authService.login` | `users`, `staff_credentials` | Auth Session | 🟢 **SSOT POSTGRESQL** |
| 2 | **Master Patient Index** | `RegistrationDeskWorkspace.jsx` | Registrasi Pasien Baru | `handleRegisterPatient` | `POST /api/v1/patients` | `patientsController.register` | `mpiEngine` / `patientService` | `master_patients` | INSERT | 🟢 **SSOT POSTGRESQL** |
| 3 | **Appointment & Booking** | `AppointmentPage.jsx` | Booking Jadwal Dokter | `handleBookAppointment` | `POST /api/v1/appointments` | `appointmentController.book` | `appointmentService` | `appointments` | INSERT | 🟢 **SSOT POSTGRESQL** |
| 4 | **Encounter & Kunjungan**| `EncounterPage.jsx` | Buka Kunjungan / Admisi | `handleCreateEncounter` | `POST /api/v1/encounters` | `encountersController.create` | `encounterApplicationService` | `encounters` | INSERT | 🟢 **SSOT POSTGRESQL** |
| 5 | **Episode of Care** | `ClinicalCoreWorkspace.jsx` | Buat / Tutup Episode | `handleUpdateEpisode` | `PUT /api/v1/encounters/episode`| `encountersController.episode`| `encounterApplicationService` | `episodes_of_care` | UPDATE | 🟢 **SSOT POSTGRESQL** |
| 6 | **Emergency Triage (IGD)**| `TriagePage.jsx` | Submit Asesmen Triase | `handleSubmitTriage` | `POST /api/v1/triage/assessments` | `triageController.recordAssessment` | `triageApplicationService` | `triage_assessments`, `triage_sla_timers` | INSERT + Timer | 🟢 **SSOT POSTGRESQL** |
| 7 | **Bed Management / ADT** | `BedManagementCenterPage.jsx`| Admisi Ranjang Pasien | `handleAssignBed` | `POST /api/v1/beds/assign` | `bedManagementController.assignBed` | `bedManagementApplicationService` | `master_beds`, `bed_occupancies` | UPDATE + OCC | 🟢 **SSOT POSTGRESQL** |
| 8 | **Bed Transfer / Mutasi**| `BedManagementCenterPage.jsx`| Transfer Ranjang | `handleTransferBed` | `POST /api/v1/beds/transfer` | `bedManagementController.transferBed` | `bedManagementApplicationService` | `master_beds`, `bed_transfers` | UPDATE + OCC | 🟢 **SSOT POSTGRESQL** |
| 9 | **Doctor Consultation** | `DoctorSoapWorkspace.jsx` | Sign / Simpan SOAP DPJP | `handleSaveSoap` | `POST /api/v1/clinical-notes/soap` | `clinicalNotesController.recordSoap` | `clinicalNotesApplicationService` | `soap_notes` | INSERT (WORM) | 🟢 **SSOT POSTGRESQL** |
| 10 | **CPPT Multidisciplinary** | `ShiftHandoverStudioModal.jsx`| Catat CPPT Terintegrasi | `handleSaveCppt` | `POST /api/v1/clinical-notes/cppt` | `clinicalNotesController.recordCppt` | `clinicalNotesApplicationService` | `cppt_records` | INSERT (WORM) | 🟢 **SSOT POSTGRESQL** |
| 11 | **Universal CPOE (Orders)**| `OrderEntryWorkspace.jsx` | Terbitkan Multi-Order CPOE | `handleSubmitOrder` | `POST /api/v1/orders/cpoe` | `cpoeController.createOrder` | `cpoeApplicationService` | `clinical_orders`, `cpoe_order_items` | INSERT (ACID + Outbox) | 🟢 **SSOT POSTGRESQL** |
| 12 | **CPOE Cancellation** | `OrdersWorkspace.jsx` | Batalkan Order CPOE | `handleCancelOrder` | `POST /api/v1/orders/cpoe/:id/cancel`| `cpoeController.cancelOrder` | `cpoeApplicationService` | `clinical_orders` | UPDATE (OCC) | 🟢 **SSOT POSTGRESQL** |
| 13 | **Pharmacy Prescriptions** | `EnterprisePharmacyWorkspacePage.jsx`| Telaah & Dispensing Obat | `handleDispenseMedication` | `POST /api/v1/medications/dispense` | `medicationClosedLoopController.dispense` | `pharmacyApplicationService` | `medication_dispensations`, `inventory_batches` | UPDATE (Pessimistic Lock) | 🟢 **SSOT POSTGRESQL** |
| 14 | **eMAR Administration** | `EmarAdministrationStudio.jsx`| Barcode 5-Benar Pemberian Obat | `handleAdministerMedication`| `POST /api/v1/medications/administer` | `medicationClosedLoopController.administer` | `nursingEmarApplicationService` | `medication_administrations` | INSERT (Barcode WORM) | 🟢 **SSOT POSTGRESQL** |
| 15 | **Laboratory (LIS Intake)**| `LabPage.jsx` | Accession Spesimen Lab | `handleAccessionSpecimen` | `POST /api/v1/laboratory/specimens/:id/accession`| `laboratoryController.accessionSpecimen` | `laboratoryApplicationService` | `lab_specimens` | UPDATE | 🟢 **SSOT POSTGRESQL** |
| 16 | **Laboratory (Result Release)**| `LaboratoryResultWorkspace.jsx`| Rilis Hasil Kritis Lab | `handleReleaseLabResult` | `POST /api/v1/laboratory/results/:id/release` | `laboratoryController.verifyAndRelease` | `laboratoryApplicationService` | `lab_results`, `panic_alerts` | INSERT + Outbox | 🟢 **SSOT POSTGRESQL** |
| 17 | **Radiology MWL & PACS** | `RadiologyWorkspacePage.jsx` | Generate Modality Worklist | `handleGenerateWorklist` | `POST /api/v1/radiology/worklist/generate` | `radiologyController.generateModalityWorklist` | `radiologyApplicationService` | `radiology_worklists`, `dicom_studies` | INSERT | 🟢 **SSOT POSTGRESQL** |
| 18 | **Radiology Report Sign** | `RadiologyReportingStudio.jsx`| Sign Expertise Radiologi | `handleSaveRadiologyReport` | `POST /api/v1/radiology/studies/:id/reports` | `radiologyController.saveReport` | `radiologyApplicationService` | `radiology_reports` | INSERT (WORM) | 🟢 **SSOT POSTGRESQL** |
| 19 | **Blood Bank (ISBT-128)** | `BloodBankWorkspacePage.jsx` | Intake Kantong Darah | `handleIntakeBloodUnit` | `POST /api/v1/blood-bank/units` | `bloodBankController.intakeUnit` | `bloodBankApplicationService` | `blood_donor_units` | INSERT | 🟢 **SSOT POSTGRESQL** |
| 20 | **Blood Crossmatch & Issue**| `DigitalCrossmatchStudio.jsx` | Verifikasi Crossmatch Serologi | `handleVerifyCrossmatch` | `POST /api/v1/blood-bank/crossmatch` | `bloodBankController.verifyCrossmatch` | `bloodBankApplicationService` | `blood_crossmatch_tests` | INSERT + Lock | 🟢 **SSOT POSTGRESQL** |
| 21 | **Bedside Transfusion** | `BedsideTransfusionVerificationStudio.jsx`| Double-Check Transfusi | `handleVerifyTransfusion` | `POST /api/v1/blood-bank/transfusion/verify` | `bloodBankController.verifyTransfusion` | `bloodBankApplicationService` | `blood_transfusion_records` | INSERT (2-Nurse WORM) | 🟢 **SSOT POSTGRESQL** |
| 22 | **Operating Theatre (OK)** | `OperatingTheatreWorkspacePage.jsx`| Sign-In / Time-Out WHO | `handleRecordSurgicalChecklist`| `POST /api/v1/perioperative/checklists` | `perioperativeController.saveChecklist` | `surgicalApplicationService` | `surgical_safety_checklists` | INSERT | 🟢 **SSOT POSTGRESQL** |
| 23 | **Billing & Invoicing** | `BillingPage.jsx` | Terbitkan Faktur Tagihan | `handleGenerateInvoice` | `POST /api/v1/patient-financial/invoices` | `patientFinancialAndRevenueCycleController.generateSplitInvoice` | `patientFinancialAndRevenueCycleService` | `hospital_invoices`, `invoice_items` | INSERT | 🟢 **SSOT POSTGRESQL** |
| 24 | **Patient Prepayment Deposit**| `BillingPage.jsx` | Terima Deposit Kasir | `handleRecordDeposit` | `POST /api/v1/patient-financial/deposits` | `patientFinancialAndRevenueCycleController.recordDeposit` | `patientFinancialAndRevenueCycleService` | `patient_deposit_ledgers` | INSERT (Pessimistic Lock) | 🟢 **SSOT POSTGRESQL** |
| 25 | **Casemix & INA-CBG** | `CasemixRevenueCycle.jsx` | Grouping Klaim BPJS | `handleGroupInaCbg` | `POST /api/v1/casemix/claims/group` | `clinicalCodingAndCasemixController.groupClaim` | `casemixApplicationService` | `casemix_claims` | UPDATE | 🟢 **SSOT POSTGRESQL** |
| 26 | **Staff Privileging** | `StaffPrivilegingWorkspacePage.jsx`| Verifikasi STR / SIP DPJP | `handleAddPrivilege` | `POST /api/v1/staff-privileges/privileges` | `staffPrivilegingController.addPrivilege` | `staffPrivilegingApplicationService` | `clinical_privileges` | INSERT (Trigger Guard) | 🟢 **SSOT POSTGRESQL** |
| 27 | **SATUSEHAT FHIR Studio** | `SatusehatInteroperabilityStudioPage.jsx`| Transmit Enkounter FHIR | `handleTransmitResource` | `POST /api/v1/satusehat/resources/transmit` | `satusehatStudioController.transmit` | `satusehatInteroperabilityService` | `fhir_delivery_outbox` | INSERT | 🟢 **SSOT POSTGRESQL** |
| 28 | **Executive Command Center**| `HospitalCentralCommandCenterPage.jsx`| Telemetri Kapasitas Bed | `handleFetchTelemetry` | `GET /api/v1/command-center/capacity` | `commandCenterController.getCapacity` | `commandCenterApplicationService` | `master_beds`, `encounters` | READ (Aggregated) | 🟢 **SSOT POSTGRESQL** |
| 29 | **Warehouse FEFO Stock** | `EnterpriseInventoryPage.jsx`| Mutasi Stok Antar Depo | `handleTransferStock` | `POST /api/v1/inventory/transfers` | `enterpriseInventoryController.transfer` | `inventoryApplicationService` | `inventory_stock_movements`, `inventory_batches` | INSERT + Lock | 🟢 **SSOT POSTGRESQL** |
| 30 | **DICOMweb PACS Studies** | `RadiologyViewerWorkspace.jsx`| Render Citra Diagnostik | `handleFetchDicomInstances` | `GET /dicomweb/studies/:id` | `dicomwebController.getStudy` | `pacsDicomEngine` | `pacs_instances` | READ (DICOM-RS) | 🟢 **SSOT POSTGRESQL** |

---

## 2. Prinsip Penegakan Single Source of Truth

1. **Eliminasi Total Browser Business State**:
   - `localStorage` hanya diizinkan untuk tema tampilan (`dark` / `light`) dan pemulihan draf lokal sebelum submit (`nurseflow_soap_draft_*`).
   - Seluruh mutasi resmi wajib mengembalikan respons HTTP `200/201` dari PostgreSQL sebelum status UI berubah menjadi sukses.
2. **Pencegahan Overwrite Konkurensi**:
   - Setiap mutasi membawa kolom `version` untuk Optimistic Concurrency Control (OCC). Jika versi usang, backend menolak dengan `409 CONCURRENT_MODIFICATION`.
3. **Idempotency & Replay Mutex**:
   - Mutasi yang di-submit ulang secara simultan (double-click) menghasilkan tepat 1 transaksi efektif di PostgreSQL dan ditandai dengan header `X-Idempotent-Replay: true`.
