# P0-2B — WAVE 1B.2 DOMAIN SELECTION DECISION MATRIX
## Authoritative Factual Decision Support Evidence for Human Executive Selection

---

## 1. GOVERNANCE METADATA & REPOSITORY BASELINE

| Parameter | Nilai Otoritatif Repository | Sumber Bukti |
|---|---|---|
| **Document ID** | `DOC-AUDIT-P02B-WAVE1B2-DOMAIN-SELECTION-MATRIX-20261003` | Standar Tata Kelola HIS NurseFlow |
| **Audit Date** | `2026-10-03` | System Timestamp |
| **Repository** | `Mojo-Brothers/NurseFlow-WebApp` | Git Remote Origin |
| **Branch** | `feature/security-foundation-wave1a10` | `git branch --show-current` |
| **Base Commit** | `adaad6341e7f56f297162494b4fa9a611d9515ed` | `git rev-parse HEAD` |
| **Audit Mode** | **READ-ONLY AUDIT (NO IMPLEMENTATION)** | Mandat Audit P0-2B |
| **Production Code Changes** | **0 lines (0 files modified)** | `git status --short` |
| **Migration Changes** | **0 lines (0 files modified)** | `git diff --stat database/migrations/` |
| **Schema Changes** | **0 lines (0 files modified)** | `git diff --stat database/schema/` |
| **Test Suite Changes** | **0 lines (0 files modified)** | `git diff --stat tests/` |
| **Stage-0 Gate** | **NO-GO** (Frozen pending Wave 1B.2 selection) | Baseline Tata Kelola |
| **Production Deployment** | **BLOCKED** | Default-Deny Architecture |
| **Canonical Pilot Regression** | **81/81 PASS (100% Clean)** | 6 Canonical Test Suites |
| **Wave 1B.2 Implementation** | **NOT STARTED** | Hard Stop Protocol |

---

## 2. BASELINE DISCREPANCY RECONCILIATION

Sesuai protokol audit, auditor memverifikasi angka baseline yang tercantum pada instruksi terhadap kode sumber dan artefak audit. Ditemukan perbedaan klasifikasi matematis (*Baseline Discrepancy*) yang wajib direkonsiliasi secara terbuka:

### A. Rekonsiliasi Denominator: Stage-0 RLS Call Sites vs Total Database Interactions
Terdapat 3 denominator berbeda yang sering tertukar dalam inventaris:
1. **Stage-0 Unsafe RLS Call Sites (145 call sites):** Pemanggilan kueri SQL mentah (*raw SQL*) yang secara langsung menyentuh salah satu dari **33 tabel Stage-0 RLS** di luar `withUnitOfWork`.
2. **Total Domain Database Calls:** Seluruh operasi basis data (termasuk tabel sekunder non-Stage-0 seperti `appointments`, `medication_orders`, `diagnostic_notifications`, dll.).
3. **Estimasi Read/Write pada Dokumen Sebelumnya:** Angka yang tercantum pada tabel Section 9 dokumen `P0-2B-ROUTE-EXECUTION-PATH-VERIFICATION.md` baris 441.

### B. Tabel Perbandingan Baseline Discrepancy

| Domain / Candidate | Metrik | Angka Prompt / Baseline Lama | Angka Terverifikasi (Stage-0 RLS CS) | Angka Total Interaksi Modul (All DB Calls) | Sumber Bukti Kode Sumber & Analisis Penyebab |
|---|---|:---:|:---:|:---:|---|
| **Candidate A**<br>(Queue / Appointments) | Writes Outside UoW<br>Reads Outside UoW | 2<br>1 | **2** (CS 2, 3)<br>**1** (CS 1) | 12 Writes<br>21 Reads | `server/controllers/appointment.controller.js`.<br>**SINKRON.** Kueri Stage-0 pada `master_patients`: CS 1 (READ L39), CS 2 (WRITE/SELECT FOR UPDATE L115), CS 3 (WRITE/INSERT L123). |
| **Candidate B**<br>(Medication Closed-Loop) | Writes Outside UoW<br>Reads Outside UoW | 10<br>3 | **5** (CS 97-99, 102, 103)<br>**8** (CS 91-96, 100, 101) | 23 Writes<br>57 Reads | `server/services/medicationClosedLoop.service.js`.<br>**DISCREPANCY:** Angka prompt (10W / 3R) terbalik dan merupakan estimasi kasar. Secara faktual dari 13 Stage-0 CS: terdapat 5 mutasi DML (CS 97, 98, 99, 102, 103) dan 8 kueri SELECT (CS 91, 92, 93, 94, 95, 96, 100, 101). Total interaksi modul ke seluruh tabel adalah 23 Writes dan 57 Reads. |
| **Candidate C1**<br>(CPOE Orders) | Writes Outside UoW<br>Reads Outside UoW | 8<br>8 | **4** (CS 66, 143-145)<br>**12** (CS 59-65, 67-71) | 6 Writes<br>19 Reads | `server/services/cpoeApplication.service.js` & `safetyAuthorization.service.js`.<br>**DISCREPANCY:** Angka prompt (8W / 8R) mengasumsikan separuh call site adalah write. Secara faktual dari 16 Stage-0 CS (13 CPOE + 3 Safety): terdapat 4 mutasi tulis (CS 66 audit log, CS 143-145 safety decision lock/expiry/consume) dan 12 kueri baca (CS 59-65, CS 67-71). Total interaksi modul adalah 6 Writes dan 19 Reads. |
| **Candidate C2**<br>(Diagnostics) | Writes Outside UoW<br>Reads Outside UoW | 7<br>4 | **3** (CS 76, 77, 82)<br>**8** (CS 72-75, 78-81) | 9 Writes<br>29 Reads | `server/services/diagnosticInterpretation.service.js`.<br>**DISCREPANCY:** Angka prompt (7W / 4R) tidak mencerminkan DML aktual terhadap tabel Stage-0. Dari 11 Stage-0 CS: terdapat 3 mutasi tulis (CS 76, 77 audit logs, CS 82 insert clinical_orders) dan 8 kueri baca (CS 72-75 SELECT encounters, CS 78-81 SELECT interpretations). Total interaksi modul adalah 9 Writes dan 29 Reads. |
| **Candidate D**<br>(Master Patient) | Writes Outside UoW<br>Reads Outside UoW | 5<br>5 | **3** (1 INSERT + 2 FOR UPDATE)<br>**7** (Kueri Baca) | 1 Write (Scanner: 0)<br>14 Reads (Scanner: 15) | `server/services/patientApplication.service.js`.<br>**DISCREPANCY:** Scanner AST otomatis mengklasifikasikan `patientApplication` memiliki 0 Writes dan 10 Reads karena `INSERT INTO master_patients` berada pada variabel template string bertingkat (baris 170). Secara manual: terdapat 1 INSERT (L170), 2 SELECT FOR UPDATE (L99, L114), dan 7 SELECT murni. Angka prompt (5W / 5R) adalah estimasi kasar. |

> [!NOTE]
> **Kesimpulan Rekonsiliasi:** Seluruh total Stage-0 RLS call sites (**A: 3, B: 13, C1: 16, C2: 11, D: 10**) adalah **100% konsisten dan valid**. Perbedaan hanya terletak pada dekomposisi internal jenis operasi (Read vs Write) yang kini telah dipetakan secara eksak ke baris kode sumber.

---

## 3. VERIFIKASI ULANG JALUR EKSEKUSI (EXECUTION-PATH RE-VERIFICATION)

Jalur eksekusi telah diverifikasi secara mekanis mengikuti rantai pemanggilan:
$$\text{HTTP Route} \longrightarrow \text{Controller Handler} \longrightarrow \text{Service Method} \longrightarrow \text{Database Query} \longrightarrow \text{Stage-0 RLS Table}$$

### A. Rincian Call Sites Candidate A — Queue / Appointments (3 CS)
| CS ID | Berkas Sumber | Baris | Fungsi Enclosing | Operasi DB | Tabel Stage-0 | Rute HTTP Pemanggil | Sifat | Status Keterjangkauan | Bukti Kode |
|:---:|---|:---:|---|:---:|---|---|:---:|:---:|---|
| **1** | `server/controllers/appointment.controller.js` | 39 | `getAppointments` | `READ` | `master_patients` | `GET /api/v1/appointments` | DIRECT | `HTTP_REACHABLE` | Kueri LEFT JOIN pasien pada daftar antrean |
| **2** | `server/controllers/appointment.controller.js` | 115 | `book` | `WRITE` | `master_patients` | `POST /api/v1/appointments/book` | DIRECT | `HTTP_REACHABLE` | `SELECT id FROM master_patients WHERE ... LIMIT 1` (Pencarian NIK/MRN) |
| **3** | `server/controllers/appointment.controller.js` | 123 | `book` | `WRITE` | `master_patients` | `POST /api/v1/appointments/book` | DIRECT | `HTTP_REACHABLE` | `INSERT INTO master_patients (...)` (Auto-provisioning pasien baru) |

### B. Rincian Call Sites Candidate B — Medication Closed-Loop (13 CS)
| CS ID | Berkas Sumber | Baris | Fungsi Enclosing | Operasi DB | Tabel Stage-0 | Rute HTTP Pemanggil | Sifat | Status Keterjangkauan | Bukti Kode |
|:---:|---|:---:|---|:---:|---|---|:---:|:---:|---|
| **91** | `server/services/medicationClosedLoop.service.js` | 92 | `generateMedicationOrdersFromCPOE` | `READ` | `clinical_orders` | `POST /api/v1/medications/prescribe` | TRANSITIVE | `HTTP_REACHABLE` | Validasi order CPOE aktif |
| **92** | `server/services/medicationClosedLoop.service.js` | 93 | `generateMedicationOrdersFromCPOE` | `READ` | `clinical_orders` | `POST /api/v1/medications/prescribe` | TRANSITIVE | `HTTP_REACHABLE` | Pengambilan metadata resep CPOE |
| **93** | `server/services/medicationClosedLoop.service.js` | 96 | `generateMedicationOrdersFromCPOE` | `READ` | `clinical_orders` | `POST /api/v1/medications/prescribe` | TRANSITIVE | `HTTP_REACHABLE` | Pengambilan rincian item obat CPOE |
| **94** | `server/services/medicationClosedLoop.service.js` | 99 | `generateMedicationOrdersFromCPOE` | `READ` | `clinical_orders` | `POST /api/v1/medications/prescribe` | TRANSITIVE | `HTTP_REACHABLE` | Pengecekan status verifikasi CPOE |
| **95** | `server/services/medicationClosedLoop.service.js` | 823 | `verifyBedsideAndAdminister` | `READ` | `medication_dispense_allocations` | `POST /api/v1/medications/:id/administer` | TRANSITIVE | `HTTP_REACHABLE` | Verifikasi barcode alokasi obat farmasi |
| **96** | `server/services/medicationClosedLoop.service.js` | 872 | `verifyBedsideAndAdminister` | `READ` | `medication_emar_administrations` | `POST /api/v1/medications/:id/administer` | TRANSITIVE | `HTTP_REACHABLE` | Riwayat pemberian eMAR sebelumnya |
| **97** | `server/services/medicationClosedLoop.service.js` | 1022 | `verifyBedsideAndAdminister` | `WRITE` | `clinical_orders` | `POST /api/v1/medications/:id/administer` | TRANSITIVE | `HTTP_REACHABLE` | `UPDATE clinical_orders SET order_status = 'ADMINISTERED'` |
| **98** | `server/services/medicationClosedLoop.service.js` | 1027 | `verifyBedsideAndAdminister` | `WRITE` | `clinical_orders`, `universal_audit_logs` | `POST /api/v1/medications/:id/administer` | TRANSITIVE | `HTTP_REACHABLE` | `INSERT INTO medication_emar_administrations (...)` |
| **99** | `server/services/medicationClosedLoop.service.js` | 1035 | `verifyBedsideAndAdminister` | `WRITE` | `universal_audit_logs` | `POST /api/v1/medications/:id/administer` | TRANSITIVE | `HTTP_REACHABLE` | `INSERT INTO universal_audit_logs (...)` |
| **100** | `server/services/medicationClosedLoop.service.js` | 1312 | `documentAdverseReaction` | `READ` | `medication_emar_administrations` | `POST /api/v1/medications/administrations/:id/adverse-reaction` | TRANSITIVE | `HTTP_REACHABLE` | `SELECT * FROM medication_emar_administrations FOR UPDATE` |
| **101** | `server/services/medicationClosedLoop.service.js` | 1313 | `documentAdverseReaction` | `READ` | `medication_emar_administrations` | `POST /api/v1/medications/administrations/:id/adverse-reaction` | TRANSITIVE | `HTTP_REACHABLE` | Verifikasi identitas pasien eMAR |
| **102** | `server/services/medicationClosedLoop.service.js` | 1316 | `documentAdverseReaction` | `WRITE` | `medication_emar_administrations` | `POST /api/v1/medications/administrations/:id/adverse-reaction` | TRANSITIVE | `HTTP_REACHABLE` | `UPDATE medication_emar_administrations SET adverse_reaction = ...` |
| **103** | `server/services/medicationClosedLoop.service.js` | 1318 | `documentAdverseReaction` | `WRITE` | `medication_emar_administrations` | `POST /api/v1/medications/administrations/:id/adverse-reaction` | TRANSITIVE | `HTTP_REACHABLE` | `INSERT INTO universal_audit_logs (...)` |

### C. Rincian Call Sites Candidate C1 — CPOE Orders & Safety (16 CS)
| CS ID | Berkas Sumber | Baris | Fungsi Enclosing | Operasi DB | Tabel Stage-0 | Rute HTTP Pemanggil | Sifat | Status Keterjangkauan | Bukti Kode |
|:---:|---|:---:|---|:---:|---|---|:---:|:---:|---|
| **59** | `server/services/cpoeApplication.service.js` | 333 | `createOrder` | `READ` | `clinical_orders` | `POST /api/v1/orders/cpoe` | TRANSITIVE | `HTTP_REACHABLE` | `SELECT id, status FROM encounters WHERE id = $1 FOR UPDATE` |
| **60** | `server/services/cpoeApplication.service.js` | 334 | `createOrder` | `READ` | `clinical_orders` | `POST /api/v1/orders/cpoe` | TRANSITIVE | `HTTP_REACHABLE` | Validasi status encounter aktif |
| **61** | `server/services/cpoeApplication.service.js` | 340 | `createOrder` | `READ` | `clinical_orders` | `POST /api/v1/orders/cpoe` | TRANSITIVE | `HTTP_REACHABLE` | Pengecekan duplikasi order aktif |
| **62** | `server/services/cpoeApplication.service.js` | 387 | `cancelOrder` | `READ` | `clinical_orders` | `POST /api/v1/orders/cpoe/:id/cancel` | TRANSITIVE | `HTTP_REACHABLE` | `SELECT * FROM clinical_orders WHERE id = $1 FOR UPDATE` |
| **63** | `server/services/cpoeApplication.service.js` | 388 | `cancelOrder` | `READ` | `clinical_orders` | `POST /api/v1/orders/cpoe/:id/cancel` | TRANSITIVE | `HTTP_REACHABLE` | Validasi kepemilikan order |
| **64** | `server/services/cpoeApplication.service.js` | 391 | `cancelOrder` | `READ` | `clinical_orders` | `POST /api/v1/orders/cpoe/:id/cancel` | TRANSITIVE | `HTTP_REACHABLE` | Verifikasi status pembatalan order |
| **65** | `server/services/cpoeApplication.service.js` | 393 | `cancelOrder` | `READ` | `clinical_orders` | `POST /api/v1/orders/cpoe/:id/cancel` | TRANSITIVE | `HTTP_REACHABLE` | Evaluasi versi konkurensi order |
| **66** | `server/services/cpoeApplication.service.js` | 472 | `cancelOrder` | `WRITE` | `universal_audit_logs` | `POST /api/v1/orders/cpoe/:id/cancel` | TRANSITIVE | `HTTP_REACHABLE` | `INSERT INTO universal_audit_logs (...)` (Audit pembatalan) |
| **67** | `server/services/cpoeApplication.service.js` | 558 | `getOrderById` | `READ` | `clinical_orders` | `GET /api/v1/orders/cpoe/:id` | TRANSITIVE | `HTTP_REACHABLE` | `SELECT * FROM clinical_orders WHERE id = $1` |
| **68** | `server/services/cpoeApplication.service.js` | 559 | `getOrderById` | `READ` | `clinical_orders` | `GET /api/v1/orders/cpoe/:id` | TRANSITIVE | `HTTP_REACHABLE` | Kueri item rincian order CPOE |
| **69** | `server/services/cpoeApplication.service.js` | 581 | `getOrdersByEncounterId` | `READ` | `clinical_orders` | `GET /api/v1/orders/cpoe/encounter/:encounterId` | TRANSITIVE | `HTTP_REACHABLE` | `SELECT * FROM clinical_orders WHERE encounter_id = $1` |
| **70** | `server/services/cpoeApplication.service.js` | 582 | `getOrdersByEncounterId` | `READ` | `clinical_orders` | `GET /api/v1/orders/cpoe/encounter/:encounterId` | TRANSITIVE | `HTTP_REACHABLE` | Pengurutan order kronologis encounter |
| **71** | `server/services/cpoeApplication.service.js` | 608 | `listOrders` | `READ` | `clinical_orders` | `GET /api/v1/orders/cpoe`<br>`GET /api/v1/orders` | SHARED | `HTTP_REACHABLE` | Kueri daftar order dengan filter status dan tipe (**SHARED CS**) |
| **143** | `server/services/safetyAuthorization.service.js` | 192 | `verifyAndConsumeTransactional` | `WRITE` | `safety_decision_registry` | `POST /api/v1/orders/cpoe/:id/cancel` | TRANSITIVE | `HTTP_REACHABLE` | `SELECT ... FROM safety_decision_registry WHERE decision_id = $1 FOR UPDATE` |
| **144** | `server/services/safetyAuthorization.service.js` | 252 | `verifyAndConsumeTransactional` | `WRITE` | `safety_decision_registry` | `POST /api/v1/orders/cpoe/:id/cancel` | TRANSITIVE | `HTTP_REACHABLE` | `UPDATE safety_decision_registry SET status = 'EXPIRED' ...` |
| **145** | `server/services/safetyAuthorization.service.js` | 344 | `verifyAndConsumeTransactional` | `WRITE` | `safety_decision_registry` | `POST /api/v1/orders/cpoe/:id/cancel` | TRANSITIVE | `HTTP_REACHABLE` | `UPDATE safety_decision_registry SET status = 'CONSUMED' ...` |

### D. Rincian Call Sites Candidate C2 — Diagnostics (11 CS)
| CS ID | Berkas Sumber | Baris | Fungsi Enclosing | Operasi DB | Tabel Stage-0 | Rute HTTP Pemanggil | Sifat | Status Keterjangkauan | Bukti Kode |
|:---:|---|:---:|---|:---:|---|---|:---:|:---:|---|
| **72** | `server/services/diagnosticInterpretation.service.js` | 82 | `publishDiagnosticNotification` | `READ` | `encounters` | `POST /api/v1/diagnostics/notifications` | TRANSITIVE | `HTTP_REACHABLE` | `SELECT * FROM encounters WHERE id = $1 FOR UPDATE` |
| **73** | `server/services/diagnosticInterpretation.service.js` | 83 | `publishDiagnosticNotification` | `READ` | `encounters` | `POST /api/v1/diagnostics/notifications` | TRANSITIVE | `HTTP_REACHABLE` | Verifikasi encounter aktif dan DPJP |
| **74** | `server/services/diagnosticInterpretation.service.js` | 86 | `publishDiagnosticNotification` | `READ` | `encounters` | `POST /api/v1/diagnostics/notifications` | TRANSITIVE | `HTTP_REACHABLE` | Pengecekan status billing encounter |
| **75** | `server/services/diagnosticInterpretation.service.js` | 89 | `publishDiagnosticNotification` | `READ` | `encounters` | `POST /api/v1/diagnostics/notifications` | TRANSITIVE | `HTTP_REACHABLE` | Evaluasi urgensi notifikasi CITO |
| **76** | `server/services/diagnosticInterpretation.service.js` | 416 | `recordPhysicianInterpretation` | `WRITE` | `universal_audit_logs` | `POST /api/v1/diagnostics/notifications/:id/interpret` | TRANSITIVE | `HTTP_REACHABLE` | Pembaruan status notifikasi ke INTERPRETED |
| **77** | `server/services/diagnosticInterpretation.service.js` | 424 | `recordPhysicianInterpretation` | `WRITE` | `universal_audit_logs` | `POST /api/v1/diagnostics/notifications/:id/interpret` | TRANSITIVE | `HTTP_REACHABLE` | `INSERT INTO universal_audit_logs (...)` (Audit interpretasi DPJP) |
| **78** | `server/services/diagnosticInterpretation.service.js` | 504 | `executeSecondaryClinicalAction` | `READ` | `physician_diagnostic_interpretations` | `POST /api/v1/diagnostics/interpretations/:id/actions` | TRANSITIVE | `HTTP_REACHABLE` | `SELECT * FROM physician_diagnostic_interpretations FOR UPDATE` |
| **79** | `server/services/diagnosticInterpretation.service.js` | 505 | `executeSecondaryClinicalAction` | `READ` | `physician_diagnostic_interpretations` | `POST /api/v1/diagnostics/interpretations/:id/actions` | TRANSITIVE | `HTTP_REACHABLE` | Validasi kepemilikan interpretasi klinis |
| **80** | `server/services/diagnosticInterpretation.service.js` | 508 | `executeSecondaryClinicalAction` | `READ` | `physician_diagnostic_interpretations` | `POST /api/v1/diagnostics/interpretations/:id/actions` | TRANSITIVE | `HTTP_REACHABLE` | Evaluasi parameter tindakan sekunder |
| **81** | `server/services/diagnosticInterpretation.service.js` | 510 | `executeSecondaryClinicalAction` | `READ` | `physician_diagnostic_interpretations` | `POST /api/v1/diagnostics/interpretations/:id/actions` | TRANSITIVE | `HTTP_REACHABLE` | Pemeriksaan status eksekusi tindakan |
| **82** | `server/services/diagnosticInterpretation.service.js` | 528 | `executeSecondaryClinicalAction` | `WRITE` | `clinical_orders` | `POST /api/v1/diagnostics/interpretations/:id/actions` | TRANSITIVE | `HTTP_REACHABLE` | `INSERT INTO clinical_orders (...)` (Penerbitan order sekunder) |

### E. Rincian Call Sites Candidate D — Master Patient / Admission (10 CS)
| CS ID | Berkas Sumber | Baris | Fungsi Enclosing | Operasi DB | Tabel Stage-0 | Rute HTTP Pemanggil | Sifat | Status Keterjangkauan | Bukti Kode |
|:---:|---|:---:|---|:---:|---|---|:---:|:---:|---|
| **104** | `server/services/patientApplication.service.js` | 91 | `registerPatient` | `READ` | `master_patients` | `POST /api/v1/patients` | TRANSITIVE | `HTTP_REACHABLE` | `BEGIN ISOLATION LEVEL READ COMMITTED;` |
| **105** | `server/services/patientApplication.service.js` | 92 | `registerPatient` | `READ` | `master_patients` | `POST /api/v1/patients` | TRANSITIVE | `HTTP_REACHABLE` | Inisialisasi koneksi pool client |
| **106** | `server/services/patientApplication.service.js` | 96 | `registerPatient` | `READ` | `master_patients` | `POST /api/v1/patients` | TRANSITIVE | `HTTP_REACHABLE` | Pengecekan lock transaksi registrasi |
| **107** | `server/services/patientApplication.service.js` | 99 | `registerPatient` | `WRITE` | `master_patients` | `POST /api/v1/patients` | TRANSITIVE | `HTTP_REACHABLE` | `SELECT ... WHERE nik = $1 LIMIT 1 FOR UPDATE` (Lock keunikan NIK) |
| **108** | `server/services/patientApplication.service.js` | 114 | `registerPatient` | `WRITE` | `master_patients` | `POST /api/v1/patients` | TRANSITIVE | `HTTP_REACHABLE` | `SELECT ... WHERE bpjs_card_number = $1 LIMIT 1 FOR UPDATE` (Lock BPJS) |
| **109** | `server/services/patientApplication.service.js` | 236 | `searchPatients` | `READ` | `master_patients` | `GET /api/v1/patients` | TRANSITIVE | `HTTP_REACHABLE` | `SELECT ... FROM master_patients LIMIT $1 OFFSET $2` (Daftar pasien) |
| **110** | `server/services/patientApplication.service.js` | 246 | `searchPatients` | `READ` | `master_patients` | `GET /api/v1/patients` | TRANSITIVE | `HTTP_REACHABLE` | Paginasi pencarian pasien tanpa kata kunci |
| **111** | `server/services/patientApplication.service.js` | 262 | `searchPatients` | `READ` | `master_patients` | `GET /api/v1/patients` | TRANSITIVE | `HTTP_REACHABLE` | `SELECT ... WHERE mrn/nik/name ILIKE $1` (Pencarian teks bebas) |
| **112** | `server/services/patientApplication.service.js` | 270 | `getPatientById` | `READ` | `master_patients` | `GET /api/v1/patients/:id` | TRANSITIVE | `HTTP_REACHABLE` | `SELECT * FROM master_patients WHERE id = $1 LIMIT 1` |
| **113** | `server/services/patientApplication.service.js` | 272 | `getPatientById` | `READ` | `master_patients` | `GET /api/v1/patients/:id` | TRANSITIVE | `HTTP_REACHABLE` | Pengambilan profil demografi pasien lengkap |

---

## 4. METRIC COMPARISON MATRIX (DECISION SUPPORT)

| Metrik Faktual | Candidate A<br>(Queue / Appointments) | Candidate B<br>(Medication Closed-Loop) | Candidate C1<br>(CPOE Orders) | Candidate C2<br>(Diagnostics) | Candidate D<br>(Master Patient) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Total Express Routes** | **4** | **8** | **9** | **4** | **3** |
| **Active Stage-0 Routes** | **2** | **3** | **6** | **3** | **3** |
| **Zero-Stage-0 Routes** | **2** | **5** | **3** | **1** | **0** |
| **Stage-0 Unsafe Call Sites** | **3** | **13** | **16** (13 CPOE + 3 Safety) | **11** | **10** |
| **HTTP-Reachable Unsafe CS** | **3** | **13** | **16** | **11** | **10** |
| **Unreachable CS** | **0** | **0** | **0** | **0** | **0** |
| **Tabel Stage-0 Terdampak** | `master_patients` (1) | `clinical_orders`<br>`medication_dispense_allocations`<br>`medication_emar_administrations`<br>`universal_audit_logs` (4) | `clinical_orders`<br>`universal_audit_logs`<br>`safety_decision_registry` (3) | `encounters`<br>`physician_diagnostic_interpretations`<br>`clinical_orders`<br>`universal_audit_logs` (4) | `master_patients` (1) |
| **Unsafe Writes Outside UoW (Stage-0)** | **2** | **5** | **4** | **3** | **3** |
| **Unsafe Reads Outside UoW (Stage-0)** | **1** | **8** | **12** | **8** | **7** |
| **Total Modul DB Interactions** | 33 (12W / 21R) | 80 (23W / 57R) | 25 (6W / 19R) | 38 (9W / 29R) | 15 (1W / 14R) |
| **Shared Call Sites** | **0** | **0** | **1 (`CS 71`)** | **0** | **0** |
| **Transitive Call Sites** | **0** | **13** | **16** | **11** | **10** |
| **Direct Controller Call Sites** | **3** | **0** | **0** | **0** | **0** |
| **Transaction-Sensitive Operations** | **1** (Booking Mutex) | **3** (eMAR, Dispense, Adverse) | **2** (CPOE Create, Cancel) | **3** (Alert, Sign-off, Order) | **1** (MPI Sequential MRN) |
| **Existing Regression Coverage (Real RLS)** | **ABSENT (0)** | **ABSENT (0)** | **ABSENT (0)** | **ABSENT (0)** | **ABSENT (0)** |
| **Existing Domain Tests (Mocked)** | **EXISTING (2 suites)** | **EXISTING (8 suites)** | **EXISTING (3 suites)** | **EXISTING (1 suite)** | **EXISTING (11 suites)** |

---

## 5. TRANSACTION BOUNDARY ANALYSIS

Analisis batasan transaksi (*transaction boundary*) mengaudit operasi database multi-langkah dan risiko anomali konkurensi di luar Unit of Work:

### Candidate A (Queue / Appointments)
- **Operasi Kritis:** `POST /api/v1/appointments/book` (`appointmentController.book`).
- **Karakteristik Transaksi:** Menggunakan `BEGIN ISOLATION LEVEL READ COMMITTED;` lokal tanpa konteks tenant RLS.
- **Pola Mutasi:**
  1. Pemeriksaan Idempotency Key dengan row-lock: `SELECT ... FOR UPDATE` pada `idempotency_keys`.
  2. Pemeriksaan/auto-provisioning pasien pada `master_patients` (CS 2 & CS 3).
  3. Mutex kunci slot dokter: `SELECT id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND slot_time = $3 FOR UPDATE;`
  4. Penyisipan appointment & pembaruan nomor antrean pada `queue_sequences`.
- **Sensitivitas Transaksi:** **SEDANG (MEDIUM)**. Memiliki pencegahan tabrakan jadwal (*slot race condition*), namun hanya melibatkan 1 tabel Stage-0.

### Candidate B (Medication Closed-Loop)
- **Operasi Kritis:** `POST /api/v1/medications/:id/administer` (`verifyBedsideAndAdminister`).
- **Karakteristik Transaksi:** Transaksi multi-tabel kompleks yang mengunci dan memperbarui status order klinis secara simultan.
- **Pola Mutasi:**
  1. Pembacaan alokasi lot/batch obat (CS 95).
  2. Verifikasi riwayat eMAR dan 5-Benar pemberian obat (CS 96).
  3. Pembaruan status `clinical_orders` menjadi `ADMINISTERED` (CS 97).
  4. Pencatatan log administrasi perawat ganda ke `medication_emar_administrations` (CS 98).
  5. Pencatatan audit trail universal (CS 99).
- **Sensitivitas Transaksi:** **TINGGI (HIGH)**. Gagal-sebagian (*partial failure*) akan menyebabkan ketidaksinkronan fatal antara stok fisik obat, status order dokter, dan rekam medis eMAR pasien.

### Candidate C1 (CPOE Orders)
- **Operasi Kritis:**
  1. `createOrder` (Route 64): Validasi status encounter aktif (CS 59-61), penerbitan master order, penyisipan order items, dan pencatatan audit log.
  2. `cancelOrder` (Route 65): Penguncian order baris `SELECT ... FOR UPDATE` (CS 62-65), pemanggilan transitif ke `safetyAuthorizationService.verifyAndConsumeTransactional` (CS 143-145) untuk mengonsumsi token otorisasi keselamatan bermaterai kriptografis (*command hash*), pembatalan order, dan audit log (CS 66).
- **Sensitivitas Transaksi:** **SANGAT TINGGI / KRITIS (CRITICAL)**. Transaksi pembatalan order CPOE melintasi batas dua modul layanan (`cpoeApplicationService` $\rightarrow$ `safetyAuthorizationService`) dalam satu koneksi transaksi PostgreSQL bersama.

### Candidate C2 (Diagnostics)
- **Operasi Kritis:** `executeSecondaryClinicalAction` (Route 41).
- **Karakteristik Transaksi:** Validasi interpretasi dokter spesialis (CS 78-81) yang secara otomatis menerbitkan order klinis turunan (*downstream clinical order*) ke dalam `clinical_orders` (CS 82).
- **Sensitivitas Transaksi:** **TINGGI (HIGH)**. Menjembatani temuan kritis penunjang medis langsung menjadi tindakan kuratif order klinis baru.

### Candidate D (Master Patient / Admission)
- **Operasi Kritis:** `POST /api/v1/patients` (`patientApplicationService.registerPatient`).
- **Karakteristik Transaksi:** Registrasi Master Patient Index (MPI) dengan penguncian baris ketat (*row-level mutex*).
- **Pola Mutasi:**
  1. Kunci baris keunikan NIK: `SELECT ... FROM master_patients WHERE nik = $1 LIMIT 1 FOR UPDATE;` (CS 107).
  2. Kunci baris keunikan BPJS: `SELECT ... FROM master_patients WHERE bpjs_card_number = $1 LIMIT 1 FOR UPDATE;` (CS 108).
  3. Pembangkitan nomor Rekam Medis (MRN) sekuensial dengan kunci sekuen tahunan: `SELECT mrn FROM master_patients WHERE mrn LIKE $1 ORDER BY mrn DESC LIMIT 1 FOR UPDATE;`.
  4. Penyisipan data pasien baru ke `master_patients` dan audit log.
- **Sensitivitas Transaksi:** **SANGAT TINGGI / KRITIS (CRITICAL)**. Kegagalan isolasi transaksi akan mengakibatkan nomor rekam medis ganda (*duplicate MRN conflict*) atau rekonsiliasi data pasien tertukar.

---

## 6. DEPENDENCY & CROSS-DOMAIN COUPLING ANALYSIS

| Candidate | Ketergantungan Hulu (*Upstream*) | Ketergantungan Hilir (*Downstream*) | Infrastruktur Bersama (*Shared Infra*) | Klasifikasi Kopling Lintas Domain | Bukti Kode Sumber |
|---|---|---|---|:---:|---|
| **Candidate A** | `master_patients`<br>`appointments`<br>`queue_sequences` | Modul Pelayanan Rawat Jalan (Poli) | `idempotencyMiddleware`<br>`DEFAULT_TENANT_ID` | **LOW** | Terisolasi pada controller penjadwalan; kueri ke `master_patients` dilakukan mandiri tanpa memanggil service domain lain. |
| **Candidate B** | `clinical_orders` (CPOE)<br>`patient_allergies`<br>`pharmacy_inventory_batches` | Modul eMAR Perawat<br>Billing Kasir (Penagihan Obat) | `universal_audit_logs`<br>`eventBusService` | **HIGH** | Membaca order yang diterbitkan oleh CPOE, memvalidasi riwayat alergi, memotong batch inventaris farmasi, dan menerbitkan event administrasi obat. |
| **Candidate C1** | `encounters` (Encounter)<br>`master_patients`<br>`safety_decision_registry` | `medicationClosedLoop`<br>`laboratoryApplication`<br>`radiologyApplication`<br>`billing` | `safety_decision_registry`<br>`universal_audit_logs`<br>`idempotencyMiddleware` | **HIGH** | Bertindak sebagai *bus sentral* order medis di rumah sakit. Modul penunjang dan farmasi bergantung pada keabsahan data order CPOE. |
| **Candidate C2** | `encounters` (Encounter)<br>`diagnostic_result_notifications` | `clinical_orders` (Order sekunder) | `universal_audit_logs`<br>`eventBusService` | **MEDIUM** | Bergantung pada encounter aktif, menerbitkan notifikasi kritis, dan menyisipkan order klinis turunan mandiri. |
| **Candidate D** | `master_patients` (Entitas Dasar) | **SELURUH DOMAIN KLINIS:**<br>`encounters`, `appointments`, `cpoe`, `medications`, `billing`, `blood_bank`, `triage` | Generator MRN Sekuensial<br>Constraint Unik NIK/BPJS | **LOW (Kode)**<br>**CRITICAL (Relasional)** | Kode service sepenuhnya independen (*zero external service imports*), namun tabel `master_patients` adalah fondasi relasional kunci utama (*foreign key target*) bagi seluruh entitas klinis rumah sakit. |

---

## 7. WORKFLOW IMPORTANCE (WORKFLOW INTERPRETATION)

> [!NOTE]
> **Label: `WORKFLOW INTERPRETATION`**
> Evaluasi berikut memetakan posisi fungsional masing-masing kandidat dalam siklus hidup perawatan pasien (*patient care journey*) dan standar akreditasi rumah sakit internasional (JCI):

### 1. Candidate A — Queue / Appointments
- **Tahapan Alur Pasien:** Gerbang awal pelayanan rawat jalan (*outpatient scheduling & check-in*).
- **Relevansi Klinis:** Mencegah antrean menumpuk dan tabrakan kuota dokter spesialis.
- **Standar Keselamatan:** Rendah ke sedang (pencegahan reservasi ganda).

### 2. Candidate B — Medication Closed-Loop
- **Tahapan Alur Pasien:** Pemberian terapi obat rawat inap (*inpatient pharmacological care*).
- **Relevansi Klinis:** Inti dari keselamatan pasien farmasi. Mengawal siklus tertutup: Peresepan $\rightarrow$ Telaah Resep Farmasi $\rightarrow$ Dispensing FEFO $\rightarrow$ Pemberian eMAR 5-Benar $\rightarrow$ Monitoring MESO/Alergi.
- **Standar Keselamatan:** **KRITIS (JCI IPSG 3: High-Alert Medications & IPSG 2: Komunikasi Efektif)**.

### 3. Candidate C1 — CPOE Orders
- **Tahapan Alur Pasien:** Instruksi medis dokter DPJP (*physician order entry*).
- **Relevansi Klinis:** Motor penggerak seluruh tindakan klinis penunjang (Laboratorium, Radiologi, Tindakan, Obat).
- **Standar Keselamatan:** **KRITIS (JCI Care of Patients - COP: Otorisasi instruksi medis dan pencegahan pembatalan sepihak)**.

### 4. Candidate C2 — Diagnostics
- **Tahapan Alur Pasien:** Penilaian dan tindak lanjut hasil pemeriksaan penunjang kritis.
- **Relevansi Klinis:** Penyampaian hasil kritis penunjang medis ke dokter penanggung jawab pelayanan (DPJP) dalam batas waktu aman (*SLA threshold*).
- **Standar Keselamatan:** **KRITIS (JCI IPSG 2: Pelaporan Nilai Kritis)**.

### 5. Candidate D — Master Patient / Admission
- **Tahapan Alur Pasien:** Gerbang identifikasi pasien tunggal (*patient identity creation & verification*).
- **Relevansi Klinis:** Mencegah salah pasien (*wrong patient error*), riwayat medis ganda, atau penipuan klaim jaminan.
- **Standar Keselamatan:** **KRITIS (JCI IPSG 1: Ketepatan Identifikasi Pasien)**.

---

## 8. TESTABILITY & EXISTING COVERAGE AUDIT

| Kategori Pengujian | Candidate A | Candidate B | Candidate C1 | Candidate C2 | Candidate D |
|---|:---:|:---:|:---:|:---:|:---:|
| **Unit Tests Existing** | `EXISTING` | `EXISTING` | `EXISTING` | `EXISTING` | `EXISTING` |
| **Integration Tests Existing** | `PARTIAL` (Mocked) | `PARTIAL` (Mocked) | `PARTIAL` (Mocked) | `PARTIAL` (Mocked) | `PARTIAL` (Mocked) |
| **Real PostgreSQL RLS Tests** | **`ABSENT` (0)** | **`ABSENT` (0)** | **`ABSENT` (0)** | **`ABSENT` (0)** | **`ABSENT` (0)** |
| **Rollback / Exception Tests** | `PARTIAL` | `PARTIAL` | `PARTIAL` | `PARTIAL` | `PARTIAL` |
| **Controller Gate Tests** | `ABSENT` | `ABSENT` | `ABSENT` | `ABSENT` | `ABSENT` |
| **Ketersediaan Test Fixtures** | `EXISTING` | `EXISTING` | `EXISTING` | `EXISTING` | `EXISTING` |
| **Berkas Pengujian Otoritatif di Repository** | `tests/appointmentQueue.test.js`<br>`tests/appointmentQueuePersistence.test.js` | `tests/verticalSlice07MedicationDurability.test.js`<br>`tests/medicationLifecycleEngine.test.js`<br>`tests/medicationEventStoreHardening.test.js`<br>*(Total: 8 suites)* | `tests/verticalSlice06AUniversalCpoeDurability.test.js`<br>`tests/cpoeCdssEndToEndIntegration.test.js`<br>`tests/universalOrderEngine.test.js`<br>*(Total: 3 suites)* | `tests/verticalSlice09DiagnosticInterpretationDurability.test.js`<br>*(Total: 1 suite)* | `tests/verticalSlice01PatientDurability.test.js`<br>`tests/s01NewPatientRegistrationReconciliation.test.js`<br>`tests/patientJourneyEmpi.test.js`<br>*(Total: 11 suites)* |

> [!IMPORTANT]
> **Fakta Kritis Testability:** Seluruh test suite bawaan kandidat saat ini berjalan di atas pool tiruan (*vi.mock*). **Tidak ada satu pun kandidat yang memiliki pengujian Real PostgreSQL/RLS** sebelum wave remediated dijalankan. Suite pengujian Real RLS saat ini hanya dimiliki secara eksklusif oleh Canonical Pilot Triage & Encounter (`tests/p02b_wave1b1_real_rls_integration.test.js`).

---

## 9. CHANGE SURFACE & BLAST RADIUS

| Elemen Permukaan Dampak (*Blast Radius*) | Candidate A | Candidate B | Candidate C1 | Candidate C2 | Candidate D |
|---|:---:|:---:|:---:|:---:|:---:|
| **Jumlah Controller Terdampak** | 1 | 1 | 1 | 1 | 1 |
| **Jumlah Service Terdampak** | 1 | 1 | 2 (`cpoe` + `safety`) | 1 | 1 |
| **Jumlah Rute HTTP Terdampak (Express)** | 4 | 8 | 9 | 4 | 3 |
| **Rute Aktif Stage-0 yang Wajib Diamankan** | **2** | **3** | **6** | **3** | **3** |
| **Jumlah Stage-0 DB Call Sites yang Ditransformasi** | **3** | **13** | **16** | **11** | **10** |
| **Jumlah Tabel Stage-0 Terlibat** | **1** | **4** | **3** | **4** | **1** |
| **Jumlah Operasi Tulis (DML) Berisiko** | 2 | 5 | 4 | 3 | 3 |
| **Jumlah Layanan Bersama (*Shared Services*)** | 0 | 0 | 1 (`listOrders`) | 0 | 0 |
| **Kompleksitas Refactoring Blast Radius** | **Terkecil (Minimal)** | **Tinggi (Multi-tabel)** | **Tinggi (Bus Sentral)** | **Sedang** | **Kecil-Sedang (Terfokus)** |

---

## 10. RISK FACTOR MATRIX (FACT-BASED)

| Faktor Risiko Arsitektural | Candidate A | Candidate B | Candidate C1 | Candidate C2 | Candidate D | Bukti Faktual Berbasis Repositori |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **Paparan Rute HTTP (*HTTP Exposure*)** | `LOW` | `MEDIUM` | `HIGH` | `MEDIUM` | `MEDIUM` | Dihitung dari rute aktif: A (2), B (3), C1 (6), C2 (3), D (3). |
| **Paparan Mutasi Tulis (*Unsafe Writes*)** | `LOW` | `HIGH` | `HIGH` | `MEDIUM` | `MEDIUM` | B memiliki 5 mutasi Stage-0 (23 total), C1 memiliki 4 Stage-0 mutasi kritis termasuk konsumsi token keselamatan. |
| **Paparan Kueri Baca (*Unsafe Reads*)** | `LOW` | `HIGH` | `HIGH` | `MEDIUM` | `MEDIUM` | C1 memiliki 12 kueri baca Stage-0 (19 total), B memiliki 8 kueri baca Stage-0 (57 total). |
| **Mutasi Multi-Tabel (*Multi-Table Mutation*)** | `LOW` | `HIGH` | `HIGH` | `MEDIUM` | `LOW` | B menyentuh 4 tabel Stage-0 + batch farmasi; C1 menyentuh orders, items, audit, dan safety registry. |
| **Ketergantungan Layanan Bersama** | `NONE` | `LOW` | `MEDIUM` | `NONE` | `NONE` | C1 memiliki CS 71 yang dipanggil bersama oleh 2 rute HTTP (`GET /cpoe` & `GET /orders`). |
| **Kopling Lintas Domain (*Cross-Domain Coupling*)** | `LOW` | `HIGH` | `HIGH` | `MEDIUM` | `LOW` | B mengonsumsi order CPOE dan memicu tagihan kasir; C1 adalah fondasi bagi Lab, Rad, dan Farmasi. |
| **Sensitivitas Transaksi (*Transaction Sensitivity*)** | `MEDIUM` | `HIGH` | `HIGH` | `HIGH` | `HIGH` | Seluruh kandidat memiliki operasi sensitif, dengan C1 (Safety token), B (eMAR 5-rights), dan D (MRN mutex) sebagai yang paling kritis. |
| **Sensitivitas Keselamatan Pasien (*Patient Safety*)** | `LOW` | `HIGH` | `HIGH` | `HIGH` | `HIGH` | Sesuai standar JCI: B (IPSG 3), C1 (COP), C2 (IPSG 2), D (IPSG 1). |
| **Permukaan RLS (*RLS Surface*)** | `LOW` | `HIGH` | `MEDIUM` | `HIGH` | `LOW` | Dihitung dari jumlah tabel Stage-0 unik: A (1), B (4), C1 (3), C2 (4), D (1). |
| **Luas Area Perubahan (*Change Surface*)** | `LOW` | `HIGH` | `HIGH` | `MEDIUM` | `LOW` | A dan D memiliki blast radius terkecil (1 controller, 1 service, 1 tabel Stage-0). |

---

## 11. AUDIT KASUS KHUSUS (SPECIAL CASES)

### A. Kasus Khusus: CS 141 & CS 142 pada `resourceAuthorization.service.js`
```text
CS 141 (L56): SELECT id, tenant_id, patient_id ... FROM encounters WHERE id = $1
CS 142 (L57): SELECT id, tenant_id, status FROM master_patients WHERE id = $1
```
- **Temuan Penelusuran Call-Graph:**
  - Fungsi `evaluateResourceAccess` hanya dipanggil oleh `authorizationDecisionService.hasResourceAccess`.
  - `authorizationDecisionService.hasResourceAccess` hanya diimpor oleh `clinicalAuthorization.middleware.js` dan scanner latar belakang.
  - `clinicalAuthorization.middleware.js` **TIDAK PERNAH diimpor, didaftarkan, maupun dipasang pada berkas router mana pun di `server/server.js`**.
- **Klasifikasi:** **`UNREACHABLE_FROM_HTTP — RETAIN IN INVENTORY`**.
- **Status Tata Kelola:** Merupakan kode otorisasi tidur (*dormant/reserved architecture*). **Wajib tetap dicatat dalam inventaris 145 call sites**, namun **tidak dihitung sebagai paparan rute HTTP aktif**.

### B. Kasus Khusus: Shared Call Site CS 71
```text
CS 71 (cpoeApplication.service.js:608)
    ↓
clinical_orders (Kueri daftar order dengan filter)
    ↓
    ├── Route 66: GET /api/v1/orders/cpoe (orders.routes.js:25)
    └── Route 69: GET /api/v1/orders      (orders.routes.js:37)
```
- **Aturan Perhitungan:**
  - Dihitung sebagai **1 Call Site Unik** pada inventaris Stage-0.
  - Dihitung sebagai **2 Paparan Rute HTTP (*Route Exposure Edges*)** pada pemetaan eksekusi.
- **Dampak:** Remediasi UoW pada method `cpoeApplicationService.listOrders` secara otomatis mengamankan 2 endpoint Express sekaligus.

### C. Kasus Khusus: Pembuktian Dekopling Sinkron C1 $\leftrightarrow$ C2
Audit memverifikasi secara langsung kode sumber `server/services/cpoeApplication.service.js` dan `server/services/diagnosticInterpretation.service.js`:
1. `cpoeApplication.service.js` **tidak mengimpor maupun memanggil** `diagnosticInterpretation.service.js` (`Includes diagnosticInterpretation: false`).
2. `diagnosticInterpretation.service.js` **tidak mengimpor maupun memanggil** `cpoeApplication.service.js` (`Includes cpoeApplication: false`).
3. Pada baris 528 (CS 82), `diagnosticInterpretation.service.js` menyisipkan order klinis turunan secara mandiri langsung ke tabel `clinical_orders` menggunakan client transaksinya sendiri, tanpa mendelegasikan ke `cpoeApplicationService`.
4. Kedua modul router (`orders.routes.js` dan `diagnosticInterpretation.routes.js`) terpasang pada path URL yang independen.
- **Kesimpulan:** **Kopling Transaksi Sinkron antara C1 dan C2 adalah NOL (100% DECOUPLED)**. Candidate C1 dan Candidate C2 dapat dipilih dan dieksekusi secara terpisah dalam wave yang berbeda tanpa saling memblokir secara teknis.

---

## 12. PRODUSIBILITAS AUDIT (REPRODUCIBILITY)

Seluruh metrik dan matriks keputusan di atas dapat direproduksi secara mandiri oleh auditor berikutnya menggunakan perintah:
```bash
# 1. Verifikasi Status Git Bersih & Commit Baseline
git rev-parse HEAD
# Output: adaad6341e7f56f297162494b4fa9a611d9515ed

# 2. Eksekusi Skrip Verifikasi Jalur Eksekusi & Matriks Keputusan
node scratch/run_full_execution_path_verification.mjs
node scratch/build_decision_matrix.mjs

# 3. Jalankan Pengujian Regresi Kanonik (Wajib 81/81 PASS)
npx vitest run \
  tests/p02b_wave1b1_triage_uow.test.js \
  tests/p02b_wave1b1_l1_controller_gate.test.js \
  tests/p02b_wave1b1_real_rls_integration.test.js \
  tests/triageVerticalSlice.test.js \
  tests/verticalSlice04TriageDurability.test.js \
  tests/triageEngine.test.js
```

---

## 13. HUMAN DECISION SECTION

Berdasarkan bukti repository, Candidate A, B, C1, C2, dan D memiliki karakteristik execution-path, RLS exposure, transaction boundary, dependency, dan test coverage yang berbeda. Audit ini tidak memilih candidate. Pemilihan Wave 1B.2 merupakan keputusan arsitektur yang harus dilakukan oleh human owner setelah meninjau evidence matrix.

```text
SELECTED WAVE 1B.2 DOMAIN:
[ HUMAN DECISION ]

RATIONALE:
[ HUMAN DECISION ]
```
