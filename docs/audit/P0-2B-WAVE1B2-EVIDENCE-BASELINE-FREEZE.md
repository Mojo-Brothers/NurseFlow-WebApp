# P0-2B — WAVE 1B.2 EVIDENCE BASELINE FREEZE
## Pembekuan Evidensi Otoritatif Repositori Sebelum Keputusan Human Owner

---

## 1. EXECUTIVE EVIDENCE SUMMARY

Dokumen ini membekukan (*freezes*) seluruh bukti teknis, metrik terverifikasi, dan analisis arsitektur repositori `Mojo-Brothers/NurseFlow-WebApp` untuk mendukung pengambilan keputusan eksekutif (*Human Owner Decision*) dalam memilih domain kandidat Wave 1B.2.

Sesuai mandat tata kelola:
- **TIDAK ADA IMPLEMENTASI** yang dimulai pada tugas ini (`[FACT]`).
- **TIDAK ADA KANDIDAT YANG DIPILIH** (`[FACT]`).
- **TIDAK ADA REKOMENDASI / CONDITIONAL GUIDANCE / RANKING** yang diberikan (`[FACT]`).
- Status implementasi: **`WAVE 1B.2 IMPLEMENTATION = NOT STARTED`** (`[FACT]`).
- Status gerbang keamanan: **`APPLICATION SECURITY FOUNDATION: PARTIAL | STAGE 0: NO-GO | PRODUCTION: BLOCKED`** (`[FACT]`).

### Standar Klasifikasi Informasi
Untuk menjamin integritas pembuktian, seluruh informasi dalam dokumen ini diklasifikasikan ke dalam 4 kategori:
1. `[FACT]`: Data empiris langsung dari source code, berkas migrasi SQL, konfigurasi Git, atau hasil eksekusi runner pengujian.
2. `[DERIVED METRIC]`: Angka kuantitatif yang dihitung dari analisis statis atau penelusuran pohon sintaks abstrak (AST) terhadap kode sumber.
3. `[INTERPRETATION]`: Evaluasi teknis dan arsitektural independen auditor terhadap fakta-fakta yang ditemukan.
4. `[IMPLEMENTATION PREREQUISITE]`: Kebutuhan rekayasa perangkat lunak yang wajib dipenuhi apabila domain tertentu nantinya dipilih oleh Human Owner.

---

## 2. GIT BASELINE & COMMIT CORRECTION

`[FACT]` Audit integritas sebelumnya mengidentifikasi adanya salah ketik (*typographical error*) pada pencatatan base commit SHA di berkas laporan kesiapan sebelumnya (`4efa9368...`). Koreksi SHA aktual diverifikasi secara deterministik melalui Git catalog:

| Parameter Git | Nilai Otoritatif Aktual | Status Verifikasi | Sumber Bukti |
|---|---|:---:|---|
| **Base Evidence Commit** | `4efa9362d0e7bce28f541cfdee04caf0308dcdbb` | `[FACT]` VERIFIED | `git rev-parse HEAD~2` |
| **Audited Readiness Review Commit** | `9680fc99226f13f671b20b8409a62cbfac014cc3` | `[FACT]` VERIFIED | `git rev-parse HEAD~1` |
| **Audit Integrity Review Commit (HEAD)** | `e3d7b0abe6719fe270cafd61c62b5bc813ec1d46` | `[FACT]` VERIFIED | `git rev-parse HEAD` |
| **Active Branch** | `feature/security-foundation-wave1a10` | `[FACT]` VERIFIED | `git branch --show-current` |
| **Working Tree Status** | Clean (Nol berkas modifikasi lokal) | `[FACT]` VERIFIED | `git status --short` |

`[FACT]` Hasil eksekusi `git diff --name-only 4efa9362d0e7bce28f541cfdee04caf0308dcdbb 9680fc99226f13f671b20b8409a62cbfac014cc3`:
```text
docs/CHANGELOG_PERUBAHAN_HIS.md
docs/audit/P0-2B-WAVE1B2-ARCHITECTURE-DECISION-READINESS-REVIEW.md
```

`[FACT]` Hasil eksekusi `git diff --name-only 4efa9362d0e7bce28f541cfdee04caf0308dcdbb e3d7b0abe6719fe270cafd61c62b5bc813ec1d46`:
```text
docs/CHANGELOG_PERUBAHAN_HIS.md
docs/audit/P0-2B-WAVE1B2-ARCHITECTURE-DECISION-READINESS-REVIEW.md
docs/audit/P0-2B-WAVE1B2-AUDIT-INTEGRITY-REVIEW.md
scratch/p02b_wave1b2_audit_integrity_review.json
```

---

## 3. PRODUCTION / MIGRATION / TEST CHANGE VERIFICATION

`[FACT]` Audit memverifikasi seluruh perbedaan pohon direktori antara Base Commit (`4efa9362...`) dan HEAD Commit (`e3d7b0ab...`):

| Direktori Repositori | Batas Maksimum Izin Perubahan | Jumlah Baris Dimodifikasi | Status Kepatuhan |
|---|:---:|:---:|:---:|
| `server/` (Controllers, Services, Routes, Middlewares) | 0 baris | **0 baris** | `[FACT]` COMPLIANT |
| `database/migrations/` (DDL & SQL scripts) | 0 baris | **0 baris** | `[FACT]` COMPLIANT |
| `database/schema/` (Catalogs & Views) | 0 baris | **0 baris** | `[FACT]` COMPLIANT |
| `tests/` (Test suites & Fixtures) | 0 baris | **0 baris** | `[FACT]` COMPLIANT |
| `src/` (Frontend & Core Client) | 0 baris | **0 baris** | `[FACT]` COMPLIANT |

`[INTERPRETATION]` Repositori berada dalam kondisi *strictly read-only*. Seluruh perubahan dari commit dasar hingga saat ini hanya mencakup dokumentasi audit (`docs/audit/`), pencatatan riwayat audit (`docs/CHANGELOG_PERUBAHAN_HIS.md`), dan berkas JSON pembantu (`scratch/`).

---

## 4. CANONICAL REGRESSION EVIDENCE

`[FACT]` Pengujian regresi kanonik dijalankan pada lingkungan lokal tanpa modifikasi:
```bash
npx vitest run \
  tests/p02b_wave1b1_real_rls_integration.test.js \
  tests/triageVerticalSlice.test.js \
  tests/p02b_wave1b1_triage_uow.test.js \
  tests/verticalSlice04TriageDurability.test.js \
  tests/p02b_wave1b1_l1_controller_gate.test.js \
  tests/triageEngine.test.js
```

`[FACT]` Hasil eksekusi:
- **Test Files:** 6 passed (6)
- **Tests Total:** **81 passed (81)**
- **Waktu Eksekusi:** 7.62 detik

### Rincian Pembuktian Suite Pengujian Kanonik
1. `tests/p02b_wave1b1_real_rls_integration.test.js` (10 tests): `[FACT]` Menggunakan PostgreSQL riil untuk memvalidasi isolasi RLS tenant pada tabel `encounters` dan `triage_assessments`. Membuktikan bahwa transaksi dengan `app.current_tenant_id` terisolasi dan gagal secara default-deny jika konteks tenant dihilangkan.
2. `tests/triageVerticalSlice.test.js` (6 tests): `[FACT]` Memvalidasi siklus status encounter dan asesmen klinis triase IGD.
3. `tests/p02b_wave1b1_triage_uow.test.js` (39 tests): `[FACT]` Memvalidasi batasan Unit of Work, manajemen rollback, dan propagasi error pada `triageApplicationService`.
4. `tests/verticalSlice04TriageDurability.test.js` (8 tests): `[FACT]` Memvalidasi ketahanan event outbox dan audit trail triase di bawah kondisi chaos.
5. `tests/p02b_wave1b1_l1_controller_gate.test.js` (15 tests): `[FACT]` Memvalidasi bahwa gerbang L1 kontroler triase menolak request tanpa UUID tenant yang valid dengan HTTP 403 `TENANT_CONTEXT_REQUIRED`.
6. `tests/triageEngine.test.js` (3 tests): `[FACT]` Memvalidasi algoritma kalkulasi level triase ATS dan ESI.

`[INTERPRETATION]` **Batas Pembuktian Regresi Kanonik:**
- **Yang Dibuktikan:** Wave 1B.1 Triage UoW Pilot dan Encounter RLS Foundation berfungsi secara konsisten dan fail-closed.
- **Yang TIDAK Dibuktikan:** Pengujian ini **TIDAK MEMBUKTIKAN** bahwa Candidate A, B, C1, C2, atau D sudah aman. Pengujian ini tidak menyentuh 145 unsafe Stage-0 call sites pada domain-domain yang belum dimigrasi.

---

## 5. CANDIDATE A EVIDENCE (QUEUE / APPOINTMENTS)

- **Komponen Berkas:** `server/controllers/appointment.controller.js` dan `server/routes/appointment.routes.js`. `[FACT]` Tidak ada berkas service terpisah; seluruh kueri basis data dieksekusi langsung di kontroler.
- **Stage-0 Call Sites:** **3 Call Sites** (`[FACT]`):
  1. `CS 1` (L39): `SELECT ... FROM appointments a LEFT JOIN master_patients p ON a.patient_id = p.id` (`READ`).
  2. `CS 2` (L115): `SELECT id FROM master_patients WHERE tenant_id = $1 AND (id::text = $2 OR mrn = $2) LIMIT 1` (`WRITE` / Verification).
  3. `CS 3` (L123): `INSERT INTO master_patients (...) VALUES (...) ON CONFLICT (id) DO NOTHING` (`WRITE` / Auto-provisioning).
- **Rute Express:** **4 total** (`[FACT]`).
  - Active Stage-0 Routes: **2** (`GET /api/v1/appointments`, `POST /api/v1/appointments/book`).
  - Zero Stage-0 Routes: **2** (`POST /api/v1/appointments/check-in`, `POST /api/v1/appointments/cancel` hanya mengakses tabel non-Stage-0 `appointments` dan `queue_sequences`).
- **Total Interaksi DB Modul:** **33 interaksi** (`12 Writes`, `21 Reads`) (`[DERIVED METRIC]`).
- **Tabel Stage-0 Terlibat:** **1 tabel** (`master_patients`) (`[FACT]`).
- **Status Gerbang Tenant:** **FAIL-OPEN** (`[FACT]`). Menggunakan fallback hardcoded:
  `const tenantId = (req.user?.tenantId && isUUID(req.user.tenantId)) ? req.user.tenantId : DEFAULT_TENANT_ID;` (`DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'`).
- **Pengujian Eksisting:** **2 test suites** (`tests/appointmentQueue.test.js`, `tests/appointmentQueuePersistence.test.js`) (`[FACT]`). Keduanya menggunakan mock pool (*realRls = false*).

---

## 6. CANDIDATE B EVIDENCE (MEDICATION CLOSED-LOOP)

- **Komponen Berkas:** `server/services/medicationClosedLoop.service.js`, `server/controllers/medicationClosedLoop.controller.js`, `server/routes/medicationClosedLoop.routes.js`.
- **Stage-0 Call Sites:** **13 Call Sites** (`[FACT]`):
  - `CS 91-94` (L92, 93, 96, 99): 4 kueri `READ` pada `clinical_orders` (`generateMedicationOrdersFromCPOE`).
  - `CS 95` (L823): `READ` pada `medication_dispense_allocations` (`verifyBedsideAndAdminister`).
  - `CS 96` (L872): `READ` pada `medication_emar_administrations` (`verifyBedsideAndAdminister`).
  - `CS 97` (L1022): `WRITE` pada `clinical_orders` (update status ke `ADMINISTERED`).
  - `CS 98` (L1027): `WRITE` pada `medication_emar_administrations` (insert record administrasi).
  - `CS 99` (L1035): `WRITE` pada `universal_audit_logs`.
  - `CS 100-101` (L1312, 1313): 2 kueri `READ` dengan row-lock `FOR UPDATE` pada `medication_emar_administrations` (`documentAdverseReaction`).
  - `CS 102-103` (L1316, 1318): 2 kueri `WRITE` (update `medication_emar_administrations` dan insert `universal_audit_logs`).
- **Rute Express:** **8 total** (`[FACT]`).
  - Active Stage-0 Routes: **3** (`POST /prescribe`, `POST /:id/administer`, `POST /administrations/:id/adverse-reaction`).
  - Zero Stage-0 Routes: **5** (`/:id/pharmacist-review`, `/:id/dispense`, `/reconciliation/admission`, `/reconciliation/discharge`, `/:id/cancel` beroperasi pada tabel non-Stage-0).
- **Total Interaksi DB Modul:** **80 interaksi** (`23 Writes`, `57 Reads`) (`[DERIVED METRIC]`).
- **Tabel Stage-0 Terlibat:** **4 tabel** (`clinical_orders`, `medication_dispense_allocations`, `medication_emar_administrations`, `universal_audit_logs`) (`[FACT]`).
- **Status Gerbang Tenant:** **FAIL-OPEN** (`[FACT]`). Kontroler menggunakan mock actor default `USR-DOC-001` dan `USR-PHARM-01` tanpa atribut `tenantId`.
- **Pengujian Eksisting:** **8 test suites** (`tests/verticalSlice07MedicationDurability.test.js`, dll.) (`[FACT]`). Seluruhnya berbasis mock (*realRls = false*).

---

## 7. CANDIDATE C1 EVIDENCE (CPOE ORDERS & SAFETY)

- **Komponen Berkas:** `server/services/cpoeApplication.service.js`, `server/services/safetyAuthorization.service.js`, `server/controllers/cpoe.controller.js`, `server/routes/orders.routes.js`.
- **Stage-0 Call Sites:** **16 Call Sites** (`[FACT]`):
  - `CS 59-61` (L333, 334, 340): 3 kueri `READ` pada `encounters` dan `clinical_orders` (`createOrder`).
  - `CS 62-65` (L387, 388, 391, 393): 4 kueri `READ` dengan lock `FOR UPDATE` pada `clinical_orders` (`cancelOrder`).
  - `CS 66` (L472): 1 kueri `WRITE` pada `universal_audit_logs` (`cancelOrder`).
  - `CS 67-68` (L558, 559): 2 kueri `READ` pada `clinical_orders` (`getOrderById`).
  - `CS 69-70` (L581, 582): 2 kueri `READ` pada `clinical_orders` (`getOrdersByEncounterId`).
  - `CS 71` (L608): 1 kueri `READ` pada `clinical_orders` (`listOrders`). **SHARED CALL SITE** yang dipanggil oleh 2 rute Express.
  - `CS 143-145` (L192, 252, 344): 3 operasi `WRITE` pada `safety_decision_registry` (lock baris `FOR UPDATE`, evaluasi kadaluarsa, dan update status `CONSUMED`) di `safetyAuthorization.service.js`. Dipanggil transitif oleh `cancelOrder` (baris 401).
- **Rute Express:** **9 total** (`[FACT]`).
  - Active Stage-0 Routes: **6** (`POST /cpoe`, `POST /cpoe/:id/cancel`, `GET /cpoe`, `GET /cpoe/:id`, `GET /cpoe/encounter/:encounterId`, `GET /`).
  - Zero Stage-0 Routes: **3** (`POST /prescription`, `/lab`, `/radiology` memanggil in-memory `ordersApiService`).
- **Total Interaksi DB Modul:** **25 interaksi** (`6 Writes`, `19 Reads`) (`[DERIVED METRIC]`).
- **Tabel Stage-0 Terlibat:** **3 tabel** (`clinical_orders`, `universal_audit_logs`, `safety_decision_registry`) (`[FACT]`).
- **Status Gerbang Tenant:** **FAIL-OPEN** (`[FACT]`). Kontroler menggunakan mock actor default `USR-DOC-001` tanpa tenant validation.
- **Karakteristik Transaksi:** `[FACT]` Transaksi pembatalan order melintasi batas modul: `cpoeApplication.service.js:401` meneruskan objek `client` PostgreSQL ke `safetyAuthorizationService.verifyAndConsumeTransactional`.
- **Pengujian Eksisting:** **3 test suites** (`tests/verticalSlice06AUniversalCpoeDurability.test.js`, dll.) (`[FACT]`). Seluruhnya berbasis mock (*realRls = false*).

---

## 8. CANDIDATE C2 EVIDENCE (DIAGNOSTICS)

- **Komponen Berkas:** `server/services/diagnosticInterpretation.service.js`, `server/controllers/diagnosticInterpretation.controller.js`, `server/routes/diagnosticInterpretation.routes.js`.
- **Stage-0 Call Sites:** **11 Call Sites** (`[FACT]`):
  - `CS 72-75` (L82, 83, 86, 89): 4 kueri `READ` dengan lock `FOR UPDATE` pada `encounters` (`publishDiagnosticNotification`).
  - `CS 76-77` (L416, 424): 2 operasi `WRITE` pada `universal_audit_logs` (`recordPhysicianInterpretation`).
  - `CS 78-81` (L504, 505, 508, 510): 4 kueri `READ` dengan lock `FOR UPDATE` pada `physician_diagnostic_interpretations` (`executeSecondaryClinicalAction`).
  - `CS 82` (L528): 1 kueri `WRITE` (`INSERT INTO clinical_orders`) pada `executeSecondaryClinicalAction`.
- **Rute Express:** **4 total** (`[FACT]`).
  - Active Stage-0 Routes: **3** (`POST /notifications`, `POST /notifications/:id/interpret`, `POST /interpretations/:id/actions`).
  - Zero Stage-0 Routes: **1** (`POST /notifications/:id/acknowledge` hanya memanipulasi `diagnostic_result_notifications` non-Stage-0).
- **Total Interaksi DB Modul:** **38 interaksi** (`9 Writes`, `29 Reads`) (`[DERIVED METRIC]`).
- **Tabel Stage-0 Terlibat:** **4 tabel** (`encounters`, `physician_diagnostic_interpretations`, `clinical_orders`, `universal_audit_logs`) (`[FACT]`).
- **Status Gerbang Tenant:** **FAIL-OPEN** (`[FACT]`). Kontroler menggunakan mock actor default `USR-LAB-01` tanpa validasi tenant.
- **Pengujian Eksisting:** **1 test suite** (`tests/verticalSlice09DiagnosticInterpretationDurability.test.js`) (`[FACT]`). Berbasis in-memory mock (*realRls = false*).

---

## 9. CANDIDATE D EVIDENCE (MASTER PATIENT / ADMISSION)

- **Komponen Berkas:** `server/services/patientApplication.service.js`, `server/controllers/patient.controller.js`, `server/routes/patients.routes.js`.
- **Stage-0 Call Sites:** **10 Call Sites** (`[FACT]`):
  - `CS 104-106` (L91-96): Pool connection & transaction initialization (`registerPatient`).
  - `CS 107` (L99): `WRITE` (Row lock) `SELECT ... FROM master_patients WHERE nik = $1 LIMIT 1 FOR UPDATE;`.
  - `CS 108` (L114): `WRITE` (Row lock) `SELECT ... FROM master_patients WHERE bpjs_card_number = $1 LIMIT 1 FOR UPDATE;`.
  - `CS 109-111` (L236-262): 3 kueri `READ` pada `master_patients` (`searchPatients`).
  - `CS 112-113` (L270-272): 2 kueri `READ` pada `master_patients` (`getPatientById`).
  - `L170`: 1 operasi `WRITE` (`INSERT INTO master_patients (...) RETURNING *;`).
- **Rute Express:** **3 total** (`[FACT]`).
  - Active Stage-0 Routes: **3 (100% aktif)** (`GET /api/v1/patients`, `GET /api/v1/patients/:id`, `POST /api/v1/patients`).
  - Zero Stage-0 Routes: **0**.
- **Total Interaksi DB Modul:** **15 interaksi** (`1 Write`, `14 Reads/Locks`) (`[DERIVED METRIC]`).
- **Tabel Stage-0 Terlibat:** **1 tabel** (`master_patients`) (`[FACT]`).
- **Status Gerbang Tenant:** **FAIL-OPEN** (`[FACT]`). Kontroler `patient.controller.js` pada ketiga methodnya tidak mengekstrak atau memvalidasi `tenantId`.
- **Pengujian Eksisting:** **11 test suites** (`tests/verticalSlice01PatientDurability.test.js`, dll.) (`[FACT]`). Seluruhnya berbasis mock (*realRls = false*).

---

## 10. CONTROLLER L1 EVIDENCE

`[FACT]` Evaluasi kode sumber terhadap kelima kontroler kandidat:

| Candidate | Controller | req.tenantId extraction | UUID validation | Default tenant fallback | Mock actor fallback | Fail-closed gate | Evidence (Source Lines) |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| **A (Queue/Appt)** | `appointment.controller.js` | ❌ TIDAK | ❌ TIDAK | ✅ ADA (`DEFAULT_TENANT_ID`) | ❌ TIDAK | ❌ FAIL-OPEN | Baris 12, 66 |
| **B (Medication)** | `medicationClosedLoop.controller.js` | ❌ TIDAK | ❌ TIDAK | ❌ TIDAK | ✅ ADA (`USR-DOC-001`, `USR-PHARM-01`) | ❌ FAIL-OPEN | Baris 20–24, 69–73 |
| **C1 (CPOE Orders)** | `cpoe.controller.js` | ❌ TIDAK | ❌ TIDAK | ❌ TIDAK | ✅ ADA (`USR-DOC-001`) | ❌ FAIL-OPEN | Baris 18–22, 76–80 |
| **C2 (Diagnostics)** | `diagnosticInterpretation.controller.js` | ❌ TIDAK | ❌ TIDAK | ❌ TIDAK | ✅ ADA (`USR-LAB-01`) | ❌ FAIL-OPEN | Baris 21–25 |
| **D (Master Patient)** | `patient.controller.js` | ❌ TIDAK | ❌ TIDAK | ❌ TIDAK | ✅ ADA (`USR-REG-001` pada create; read mengabaikan tenant) | ❌ FAIL-OPEN | Baris 24, 62, 103–107 |

`[INTERPRETATION]` Tidak ada satu pun dari kelima kontroler yang saat ini menolak request yang tidak memiliki konteks tenant valid sebelum menyentuh basis data.

---

## 11. ROUTE EXECUTION-PATH EVIDENCE

- `[FACT]` **Definisi ACTIVE STAGE-0 ROUTE**: Endpoint HTTP Express terdaftar yang rantai eksekusi fungsinya mengeksekusi minimal satu kueri SQL langsung ke salah satu dari 33 tabel Stage-0 di luar Unit of Work.
- `[DERIVED METRIC]` **Total Routes dalam Domain Envelope**: **88 rute**.
- `[DERIVED METRIC]` **Active Stage-0 Routes**: **42 rute** (17 rute pada 5 kandidat ini + 25 rute pada modul Stage-0 lainnya).
- `[DERIVED METRIC]` **Zero Stage-0 Calls Routes**: **46 rute** (rute yang hanya mengakses tabel non-Stage-0 atau memproses data di dalam memori/mock).
- `[FACT]` **Shared Call Site CS 71**: `cpoeApplication.service.js:608` (`listOrders`) diakses oleh 2 rute Express: `GET /api/v1/orders/cpoe` dan `GET /api/v1/orders`.
- `[FACT]` **Unreachable Call Sites CS 141 & CS 142**: Berada di `server/services/resourceAuthorization.service.js:56-57`. Fungsi pemanggilnya hanya diimpor oleh `clinicalAuthorization.middleware.js`, yang tidak pernah dipasang pada router Express mana pun. Status: `UNREACHABLE_FROM_HTTP — RETAIN IN INVENTORY`.
- `[DERIVED METRIC]` **Konsistensi Graf Dua Arah**: 142 CS unik $\times 1$ rute + 1 CS terbagi (CS 71) $\times 2$ rute + 2 CS tak terjangkau $\times 0$ rute = **144 graf edges**.

---

## 12. TRANSACTION BOUNDARY EVIDENCE

`[FACT]` Dokumentasi faktual batasan transaksi per kandidat (tanpa peringkat kompleksitas):

| Candidate | Transaction Boundary | Tables Touched | Row Locks (`FOR UPDATE`) | Cross-Service Transaction | Evidence |
|---|---|---|---|:---:|---|
| **A (Queue/Appt)** | `appointmentController.book` (transaksi lokal kontroler) | `appointments`, `idempotency_keys`, `master_patients` (Stage-0), `queue_sequences` | Kunci slot dokter pada `appointments` (L135); kunci idempotency pada `appointments` (L96) | **TIDAK (NO)** | `appointment.controller.js:91-170` |
| **B (Medication)** | `verifyBedsideAndAdminister`, `documentAdverseReaction`, `generateMedicationOrdersFromCPOE` (transaksi dalam service) | `clinical_orders` (Stage-0), `medication_dispense_allocations` (Stage-0), `medication_emar_administrations` (Stage-0), `universal_audit_logs` (Stage-0), `pharmacy_inventory_batches` | Kunci order pada `clinical_orders` (L99); kunci eMAR pada `medication_emar_administrations` (L1312) | **TIDAK (NO)** | `medicationClosedLoop.service.js:96, 461, 823, 1022, 1312` |
| **C1 (CPOE Orders)** | `createOrder` (via `transactionManager.withTransaction`), `cancelOrder` (transaksi lintas-layanan) | `encounters` (Stage-0), `clinical_orders` (Stage-0), `cpoe_order_items`, `universal_audit_logs` (Stage-0), `safety_decision_registry` (Stage-0) | Kunci encounter pada `encounters` (L151); kunci order pada `clinical_orders` (L393); kunci token pada `safety_decision_registry` (L192) | **YA (YES)** (`client` diteruskan ke `safetyAuthorizationService`) | `cpoeApplication.service.js:128, 391, 401` & `safetyAuthorization.service.js:190-250` |
| **C2 (Diagnostics)** | `publishDiagnosticNotification`, `executeSecondaryClinicalAction` (transaksi dalam service) | `encounters` (Stage-0), `physician_diagnostic_interpretations` (Stage-0), `diagnostic_result_notifications`, `clinical_orders` (Stage-0), `cpoe_order_items`, `universal_audit_logs` (Stage-0) | Kunci encounter pada `encounters` (L89); kunci interpretasi pada `physician_diagnostic_interpretations` (L510) | **TIDAK (NO)** | `diagnosticInterpretation.service.js:86, 508` |
| **D (Master Patient)** | `patientApplicationService.registerPatient` (transaksi dalam service) | `master_patients` (Stage-0), `universal_audit_logs` (Stage-0) | Kunci NIK pada `master_patients` (L100); kunci BPJS pada `master_patients` (L115); kunci sekuensial tahunan MRN pada `master_patients` (L35) | **TIDAK (NO)** | `patientApplication.service.js:96-200` |

---

## 13. C1 $\leftrightarrow$ C2 COUPLING EVIDENCE

`[FACT]` Evaluasi kopling antara Candidate C1 dan Candidate C2 diuji secara independen pada 3 dimensi terpisah:

### A. Dimensi 1: Direct Synchronous Service Coupling (Panggilan Sinkron Antar-Layanan)
- **TIDAK (NO)** (`[FACT]`).
- **Bukti Kode Sumber:** `server/services/cpoeApplication.service.js` tidak mengimpor atau memanggil `server/services/diagnosticInterpretation.service.js`. Sebaliknya, `diagnosticInterpretation.service.js` tidak mengimpor atau memanggil `cpoeApplication.service.js`.
- **Status:** **`NO DIRECT SYNCHRONOUS SERVICE COUPLING`** (`[FACT]`).

### B. Dimensi 2: Shared Datastore Mutation (Mutasi Datastore Bersama)
- **YA (YES)** (`[FACT]`).
- **Bukti Kode Sumber:** Kedua modul melakukan operasi penulisan (*write mutation*) secara independen ke tabel Stage-0 yang sama, yaitu `clinical_orders`. C1 mengelola siklus hidup order secara penuh; C2 menyisipkan baris baru ke `clinical_orders` pada baris 528 (CS 82).
- **Status:** **`SHARED DATASTORE MUTATION (clinical_orders)`** (`[FACT]`).

### C. Dimensi 3: Shared Transaction Boundary (Batasan Transaksi Bersama)
- **TIDAK (NO)** (`[FACT]`).
- **Bukti Kode Sumber:** Masing-masing modul membuka koneksi database (`pool.connect()`) sendiri dan mengelola siklus `BEGIN`/`COMMIT`/`ROLLBACK` sendiri tanpa berbagi objek transaksi atau client.
- **Status:** **`NO SHARED TRANSACTION BOUNDARY`** (`[FACT]`).

`[INTERPRETATION]` Menggabungkan ketiga dimensi di atas menjadi klaim blanket "100% DECOUPLED" adalah tidak akurat. Deskripsi teknis yang presisi adalah: **`No Direct Synchronous Service Coupling, No Shared Transaction Boundary, with Shared Datastore Mutation on clinical_orders`**.

---

## 14. CS82 EVIDENCE (`diagnosticInterpretation.service.js:528`)

`[FACT]` Pemeriksaan mendalam terhadap call site CS 82:
1. **Pernyataan SQL pada Baris 529-534:**
   ```sql
   INSERT INTO clinical_orders (
     id, encounter_id, patient_id, order_number,
     order_type, order_status, priority, ordering_doctor_id,
     ordering_doctor_name, ordering_doctor_role, notes,
     correlation_id, created_at
   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
   ```
2. **Ketiadaan Kolom `tenant_id`:** `[FACT]` Dari 13 kolom yang dicantumkan, kolom `tenant_id` sama sekali tidak disertakan.
3. **Status Kolom `tenant_id` pada Skema:** `[FACT]` Berdasarkan `database/migrations/009_tenant_identity_foundation.sql:88`:
   `ALTER TABLE clinical_orders ALTER COLUMN tenant_id SET NOT NULL;`
4. **Status Nilai Default pada Skema:** `[FACT]` Berdasarkan `database/migrations/009_tenant_identity_foundation.sql:90`:
   `ALTER TABLE clinical_orders ALTER COLUMN tenant_id DROP DEFAULT;`
5. **Pemeriksaan Database Trigger:** `[FACT]` Analisis terhadap seluruh 65 berkas migrasi SQL membuktikan nol trigger `BEFORE INSERT` pada `clinical_orders` yang menginjeksi `tenant_id`.
6. **Eksekusi pada PostgreSQL Nyata:** `[FACT]` Jika statement ini dieksekusi pada instansi PostgreSQL nyata dengan skema Migration 009, query ini **PASTI GAGAL** dengan error `null value in column "tenant_id" of relation "clinical_orders" violates not-null constraint`.
7. **Penyebab Lolos pada Test Suite:** `[FACT]` Pengujian `tests/verticalSlice09DiagnosticInterpretationDurability.test.js` memalsukan eksekusi kueri dengan objek in-memory JavaScript (`mockDatabaseState`) yang tidak memeriksa batasan SQL `NOT NULL`.

- **Kesimpulan Status:** **`VERIFIED CURRENT DEFECT`** (`[FACT]`).
- **Status Penanganan:** **`Implementation prerequisite for Candidate C2`** (`[IMPLEMENTATION PREREQUISITE]`). Cacat ini dicatat sebagai prasyarat perbaikan jika Candidate C2 dipilih; **TIDAK DIPERBAIKI SEKARANG**.

---

## 15. MASTER_PATIENTS FOREIGN KEY EVIDENCE (CANDIDATE D)

`[FACT]` Traversal skema DDL di seluruh 65 berkas migrasi SQL (`database/migrations/*.sql`) membuktikan:
- **Total Constraint FK:** **65 foreign key constraints**.
- **Tabel Unik Perujuk:** **65 tabel unik** merujuk langsung ke `master_patients`.
- **Rincian Perilaku ON DELETE:**
  - `ON DELETE CASCADE`: **0 tabel**.
  - `ON DELETE RESTRICT`: **42 tabel**.
  - `ON DELETE NO ACTION (DEFAULT)`: **23 tabel**.
- **Foreign Key Komposit:** **1 constraint komposit** (Migration 078: `FOREIGN KEY (patient_id, tenant_id) REFERENCES master_patients(id, tenant_id)` pada 5 child tables).

`[DERIVED METRIC]` Tingkat ketergantungan relasional (*in-degree centrality*) tabel `master_patients` berjumlah 65, tertinggi di seluruh katalog basis data NurseFlow HIS.

`[INTERPRETATION]` Karena seluruh 65 foreign key menerapkan `RESTRICT` atau `NO ACTION`, baris pasien pada `master_patients` tidak dapat dihapus jika terdapat data turunan yang merujuk padanya. Tabel `master_patients` berfungsi sebagai **Direct FK Root / High-Degree Relational Hub** bagi model data klinis pasien.

---

## 16. SAFETY-PRINCIPLE REFERENCE MAPPING (JCI MAPPINGS)

`[INTERPRETATION]` Seluruh label akreditasi rumah sakit pada dokumen arsitektur NurseFlow diklasifikasikan sebagai **`Design Reference Mapping`** (atau **`Conceptual Safety Principle Mapping`**), bukan kepatuhan tersertifikasi:

- **JCI IPSG 1:** *Design Reference Mapping* untuk Master Patient Index & identifikasi pasien tunggal (Candidate D).
- **JCI IPSG 2:** *Design Reference Mapping* untuk pelaporan nilai kritis lab/rad dan protokol TBAK read-back (Candidate C2).
- **JCI IPSG 3:** *Design Reference Mapping* untuk pengelolaan obat high-alert dan verifikasi eMAR 5-Benar di tempat tidur (Candidate B).
- **JCI Care of Patients (COP):** *Design Reference Mapping* untuk mandat perintah medis dokter dan audit pembatalan dua orang (Candidate C1).
- **JCI Access to Care & Continuity (ACC):** *Design Reference Mapping* untuk alur antrean rawat jalan (Candidate A).

`[FACT]` Repositori ini adalah proyek independen dan **TIDAK MEMILIKI** sertifikat akreditasi resmi dari Joint Commission International, pengujian kepatuhan resmi pihak ketiga, atau sertifikasi kepatuhan regulator.

---

## 17. KNOWN EVIDENCE LIMITATIONS

`[FACT]` Batasan-batasan bukti yang diidentifikasi dalam audit:
1. **Ketiadaan Pengujian Real PostgreSQL RLS pada Kandidat:** Seluruh pengujian eksisting untuk Candidate A, B, C1, C2, dan D saat ini menggunakan mock (`vi.mock` atau objek database tiruan). Belum ada satu pun pengujian RLS nyata pada kelima kandidat tersebut sebelum wave remediated dijalankan.
2. **Ketiadaan Benchmark Rollback Kuantitatif:** Repositori tidak memiliki suite pengujian rollback otomatis atau formula matematis untuk mengukur durasi dan kegagalan rollback secara kuantitatif.
3. **Asimetri Cakupan Test Suite:** Jumlah berkas pengujian yang menyebutkan nama modul (misal: 11 file pada domain pasien) tidak sama dengan persentase cakupan uji (*test coverage*) terhadap call site Stage-0 terkait.
4. **Status Berkas Scratch:** Direktori `scratch/` diabaikan oleh Git (`.gitignore:64`), sehingga artefak JSON di dalamnya tidak terlacak di Git commit tree kecuali ditambahkan secara paksa (*force add*).

---

## 18. IMPLEMENTATION PREREQUISITES BY CANDIDATE

`[IMPLEMENTATION PREREQUISITE]` Hal-hal teknis yang wajib dilakukan apabila salah satu kandidat nantinya dipilih oleh Human Owner:

### Jika Candidate A (Queue / Appointments) Dipilih:
1. Mengimplementasikan gerbang fail-closed L1 (`isValidUuid`) pada `appointment.controller.js`.
2. Menghapus fallback hardcoded `DEFAULT_TENANT_ID`.
3. Membungkus CS 1, CS 2, CS 3 dengan `withUnitOfWork`.
4. Membangun suite pengujian Real PostgreSQL RLS untuk alur booking antrean.
5. Merekonsiliasi 2 test suite mock eksisting.

### Jika Candidate B (Medication Closed-Loop) Dipilih:
1. Mengimplementasikan gerbang fail-closed L1 pada seluruh 8 handler kontroler `medicationClosedLoop.controller.js`.
2. Membungkus 13 Stage-0 CS dengan `withUnitOfWork` pada transaksi multi-tabel (`clinical_orders`, dispense, eMAR, audit).
3. Membangun suite pengujian Real PostgreSQL RLS untuk alur verifikasi dual-nurse dan adverse reaction.
4. Merekonsiliasi 8 test suite mock eksisting.

### Jika Candidate C1 (CPOE Orders & Safety) Dipilih:
1. Mengimplementasikan gerbang fail-closed L1 pada 6 rute aktif di `cpoe.controller.js`.
2. Memigrasikan transaksi `cpoeApplication.service.js` dari modul legacy `transactionManager` ke `withUnitOfWork`.
3. Menyelaraskan `safetyAuthorization.service.js` (CS 143-145) agar mewarisi konteks `withUnitOfWork` dari caller.
4. Mengamankan shared call site CS 71 (melayani `/orders/cpoe` dan `/orders`).
5. Membangun suite pengujian Real PostgreSQL RLS untuk penerbitan dan pembatalan order CPOE.
6. Merekonsiliasi 3 test suite mock eksisting.

### Jika Candidate C2 (Diagnostics) Dipilih:
1. **Memperbaiki cacat DML CS 82** pada `diagnosticInterpretation.service.js:528` dengan menyertakan `tenant_id` pada `INSERT INTO clinical_orders`.
2. Mengimplementasikan gerbang fail-closed L1 pada 3 rute aktif di `diagnosticInterpretation.controller.js`.
3. Membungkus 11 Stage-0 CS dengan `withUnitOfWork`.
4. Membangun suite pengujian Real PostgreSQL RLS untuk alur pelaporan nilai kritis dan order sekunder.
5. Merekonsiliasi test suite mock eksisting (`tests/verticalSlice09*.test.js`).

### Jika Candidate D (Master Patient / Admission) Dipilih:
1. Mengimplementasikan gerbang fail-closed L1 pada seluruh 3 rute di `patient.controller.js`.
2. Meneruskan parameter `tenantId` ke method service `searchPatients`, `getPatientById`, dan `registerPatient`.
3. Membungkus 10 Stage-0 CS dengan `withUnitOfWork`.
4. Mengisolasi generator MRN sekuensial tahunan (`generateNextMrn`) di dalam batasan RLS tenant.
5. Menyertakan kolom `tenant_id` secara eksplisit pada kueri insert `master_patients` dan `universal_audit_logs`.
6. Membangun suite pengujian Real PostgreSQL RLS untuk alur MPI dan pendaftaran pasien baru.
7. Merekonsiliasi 11 test suite mock eksisting.

---

## 19. HUMAN OWNER DECISION

```text
HUMAN OWNER DECISION
--------------------

Candidate:
[NOT SELECTED]

Decision status:
PENDING HUMAN OWNER DECISION

Wave 1B.2 implementation:
NOT STARTED
```
