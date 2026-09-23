# NurseFlow Workflow Coverage Matrix
## Matriks Cakupan & Evaluasi Durabilitas 6 Perjalanan Pasien & Operasional Rumah Sakit (End-to-End Journeys)

> **Status Dokumen:** RATIFIED AUDIT BASELINE  
> **Klasifikasi:** Dokumen Tata Kelola Operasional Klinis (Clinical Governance)  
> **Tujuan:** Menguji dan membuktikan kelengkapan alur rumah sakit secara menyeluruh, membongkar rantai workflow yang putus (*broken links*), dan memverifikasi integritas persistensi data dari antarmuka pengguna hingga tabel fisik database.

---

## 1. Metodologi Penilaian Rantai Workflow

Setiap langkah dalam alur rumah sakit dievaluasi menggunakan status durabilitas berikut:
- **🟢 CONNECTED & PERSISTENT:** Rantai terhubung penuh dari UI -> API -> Database PostgreSQL riil dengan transaksi persisten.
- **🟣 CLIENT/FIRESTORE ONLY:** Alur ada di UI, namun data hanya tersimpan di Firebase Firestore atau LocalStorage, mengabaikan PostgreSQL.
- **🟡 BACKEND/DDL ONLY:** Skema database atau API telah dibuat, namun antarmuka pengguna belum terhubung atau rute API dorman.
- **🔴 BROKEN / DISCONNECTED:** Langkah workflow terputus; data dari langkah sebelumnya tidak mengalir ke langkah berikutnya tanpa intervensi manual.
- **⚫ MISSING:** Komponen tidak ditemukan sama sekali di seluruh lapisan sistem (UI, API, maupun Database).

---

## 2. Journey 1: Instalasi Gawat Darurat (IGD)

**Alur Pasien Gawat Darurat:**  
`Kedatangan Pasien` → `Triase Akut` → `Registrasi Cepat` → `Encounter IGD` → `Pengkajian Keperawatan` → `Pemeriksaan DPJP` → `Diagnosa Klinis` → `CPOE Cito (Lab/Rad)` → `Terapi Medikasi Akut` → `Observasi Ruang Resusitasi` → `Disposisi Pasien (Rawat Inap/Pulang/Rujuk)` → `Billing Pelayanan` → `Kepulangan / Transfer Bangsal`.

| No | Tahap Alur IGD | UI Screen / Komponen | Backend API & Service | Tabel Database PostgreSQL | Status Rantai | Catatan & Analisis Kesenjangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | **Kedatangan & Triase** | `RapidTriageStudio.jsx`, `TriagePage.jsx` | `triage.service.js` (Client-side) | `triage_assessments`, `triage_records` | 🟣 CLIENT ONLY | Triase menggunakan algoritma ESI/ATS yang baik di UI, tetapi kalkulasi dan data tersimpan di LocalStorage/Firestore, belum masuk tabel PostgreSQL. |
| 2 | **Registrasi Cepat** | `PatientRegistrationModal.jsx` | `patient.service.js`, Express `/api/v1/patients` | `master_patients` (9 baris data) | 🟢 CONNECTED | Registrasi pasien baru dapat menyimpan ke PostgreSQL, namun pembuatan identitas darurat (*John Doe*) belum terstandarisasi. |
| 3 | **Pembuatan Encounter IGD** | `EncounterCreationModal.jsx` | `encounter.service.js`, `/api/v1/encounters` | `encounters` (10 baris data) | 🟢 CONNECTED | Encounter terbentuk, tetapi tidak memiliki database Foreign Key ke `master_patients`. |
| 4 | **Pengkajian Keperawatan** | `UgdAssessmentForm.jsx` | `emr.service.js` | `clinical_forms`, `clinical_assessments` (0 baris) | 🟣 CLIENT ONLY | Form asuhan gawat darurat lengkap di UI, tetapi memanggil `saveClinicalRecord` ke Firestore; tabel DB kosong. |
| 5 | **Pemeriksaan DPJP & Diagnosa** | `CPPTWorkspace.jsx`, `CatatanTerintegrasiPage.jsx` | `/api/v1/emr/soap`, `soapEngine.service.js` | `soap_notes` (8 baris) | 🟢 CONNECTED | SOAP tersimpan ke PostgreSQL, namun diagnosa ICD-10 ditulis sebagai string bebas tanpa validasi constraint ke master diagnosis. |
| 6 | **CPOE Cito (Lab & Radiologi)** | `UniversalOrderStudio.jsx`, `ordersApi.service.js` | Express `/api/v1/orders` | `clinical_orders` (4 baris), `laboratory_orders` (0 baris) | 🟡 PARTIAL | Order tercatat di tabel induk `clinical_orders`, tetapi tidak memecah ke sub-tabel `laboratory_orders` atau `radiology_orders`. |
| 7 | **Medikasi Akut & eMAR** | `EMARForm.jsx`, `MedicationOrderForm.jsx` | `pharmacyEngine.service.js` | `medication_orders` (0 baris), `emar_logs` (0 baris) | 🟣 CLIENT ONLY | Jadwal pemberian obat dihitung di frontend, namun riwayat pemberian injeksi perawat tidak persisten di PostgreSQL. |
| 8 | **Observasi Resusitasi** | `MEOWSForm.jsx`, `PEWSForm.jsx` | `clinicalDeteriorationEngine.service.js` | `vital_signs` (0 baris), `patient_observations` (0 baris) | 🟣 CLIENT ONLY | Skor EWS dihitung di client-side; pemantauan tanda vital berkala tidak tersimpan di database relasional. |
| 9 | **Disposisi (Keputusan Klinis)** | `DischargeReadinessForm.jsx`, `TransferInternalForm.jsx` | `bed.service.js` (Simulasi) | `admissions` (0 baris), `transfers` (0 baris) | 🔴 BROKEN | Perintah rawat inap dari IGD tidak otomatis memesan tempat tidur rawat inap di modul bangsal. Memerlukan input ulang. |
| 10 | **Billing & Kasir IGD** | `BillingWorkspace.jsx` | `billing.service.js` (Firestore) | `billing_invoices` (0 baris) | 🔴 BROKEN | Jasa tindakan gawat darurat dan obat IGD tidak otomatis ditarik menjadi invoice tagihan di PostgreSQL. |

---

## 3. Journey 2: Pelayanan Rawat Jalan (Poliklinik)

**Alur Pasien Rawat Jalan:**  
`Reservasi Perjanjian (Appointment)` → `Check-in Mandiri / Loket` → `Antrean Poliklinik` → `Triage / Tanda Vital Awal` → `Pemeriksaan Dokter Spesialis` → `Perumusan SOAP & Diagnosa ICD-10` → `Resep Elektronik & Order Diagnostik` → `Verifikasi & Dispensing Farmasi` → `Pembayaran Kasir` → `Surat Kontrol / Edukasi Pasien`.

| No | Tahap Alur Rawat Jalan | UI Screen / Komponen | Backend API & Service | Tabel Database PostgreSQL | Status Rantai | Catatan & Analisis Kesenjangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | **Appointment / Janji Temu** | `AppointmentBookingView.jsx` | Express `/api/v1/appointments` | `appointments` (0 baris) | 🟡 DORMANT | Form booking ada, tetapi integrasi ke jadwal dokter poliklinik masih menggunakan data statis/mock. |
| 2 | **Check-in & Antrean Poli** | `QueueDisplayWorkspace.jsx`, `QueueCallingBar.jsx` | `queue.service.js` (In-memory WebSocket) | `queue_tickets` (0 baris) | 🟣 CLIENT ONLY | Sistem antrean berjalan sangat baik secara visual dan realtime, tetapi nomor antrean hilang bila server di-restart. |
| 3 | **Tanda Vital Perawat Poli** | `InitialAssessment.jsx`, `PoliTriage.jsx` | `emr.service.js` | `patient_assessments` (0 baris) | 🟣 CLIENT ONLY | Tanda vital awal perawat tidak terhubung ke tabel `vital_signs` PostgreSQL. |
| 4 | **Pemeriksaan Dokter (SOAP)** | `CPPTWorkspace.jsx` | `/api/v1/emr/soap` | `soap_notes` (8 baris) | 🟢 CONNECTED | Berjalan baik, namun sinkronisasi catatan sebelumnya (*history EMR*) sering terputus jika encounter lama ditutup. |
| 5 | **Resep Elektronik (CPOE)** | `MedicationOrderForm.jsx` | `pharmacyEngine.service.js` | `prescriptions` (0 baris) | 🟣 CLIENT ONLY | Dokter dapat menyusun resep racikan/non-racikan di UI, tetapi data dialihkan ke Firestore, bukan ke PostgreSQL. |
| 6 | **Dispensing Obat Farmasi** | `PharmacyOrderVerificationWorkspace.jsx` | Express `/api/v1/pharmacy` | `pharmacy_prescriptions` (0 baris) | 🔴 BROKEN | Apoteker rawat jalan tidak dapat melihat resep yang diinput dokter jika dokter menyimpannya ke Firestore. Rantai data putus. |
| 7 | **Kasir & Pembayaran** | `PaymentProcessingModal.jsx`, `BillingSummaryCard.jsx` | `billing.service.js` | `cashier_receipts` (0 baris) | 🔴 BROKEN | Rincian tagihan obat dan konsultasi dokter poli tidak mengalir ke kasir secara terintegrasi. |
| 8 | **Rencana Kontrol & Edukasi** | `PatientEducationForm.jsx`, `ReferralLetterForm.jsx` | `emr.service.js` | `patient_education` (0 baris) | 🟣 CLIENT ONLY | Surat kontrol dan edukasi pasien tersimpan di client-side, belum menghasilkan jadwal otomatis di modul pendaftaran. |

---

## 4. Journey 3: Perawatan Rawat Inap (Inpatient Ward)

**Alur Pasien Rawat Inap:**  
`Admisi dari IGD/Poli` → `Alokasi Tempat Tidur (Bed Management)` → `Asesmen Awal Keperawatan (24 Jam)` → `CPPT Kolaboratif Harian (Dokter, Perawat, Gizi)` → `Pemberian Obat Terjadwal (eMAR)` → `Order Lab/Radiologi Berkala` → `Monitoring Risiko Jatuh & Dekubitus` → `Rencana Pemulangan (Discharge Planning)` → `Resume Medis Pasien Pulang (Discharge Summary)` → `Penyelesaian Billing & Kepulangan`.

| No | Tahap Alur Rawat Inap | UI Screen / Komponen | Backend API & Service | Tabel Database PostgreSQL | Status Rantai | Catatan & Analisis Kesenjangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | **Admisi & Alokasi Bed** | `BedManagementWorkspace.jsx`, `BedAssignmentModal.jsx` | `bed.service.js`, Express `/api/v1/beds` | `beds` (24 baris), `bed_occupancy_logs` (0 baris) | 🟢 CONNECTED | Denah bed dan status tempat tidur terdata di PostgreSQL, namun riwayat mutasi bed pasien tidak tercatat di occupancy logs. |
| 2 | **Asesmen Awal Keperawatan** | `NursingAssessmentAndPlan.jsx`, `AdmissionNoteForm.jsx` | `nursingCareEngine.service.js` | `nursing_assessments` (0 baris) | 🟣 CLIENT ONLY | Asuhan keperawatan SDKI/SLKI/SIKI berjalan di client, data klinis tidak tersimpan ke database PostgreSQL. |
| 3 | **CPPT Kolaboratif Harian** | `CPPTWorkspace.jsx`, `DPJPAssignmentForm.jsx` | `/api/v1/emr/cppt` | `soap_notes`, `cppt_entries` (0 baris) | 🟡 PARTIAL | Input CPPT berjalan, namun fitur verifikasi DPJP (*Read-back / SBAR*) belum mengunci entri secara digital di DB. |
| 4 | **Pemberian Obat (eMAR)** | `EMARForm.jsx` | `pharmacy.service.js` | `medication_administrations` (0 baris) | 🟣 CLIENT ONLY | Jadwal 6-benar obat dihitung per jam pemberian di UI, namun bukti eksekusi perawat tidak tersimpan di PostgreSQL. |
| 5 | **Skrining Risiko Pasien** | `BradenScaleForm.jsx`, `PainReassessmentForm.jsx` | `clinicalRiskStratifier.service.js` | `risk_assessments` (0 baris) | 🟣 CLIENT ONLY | Skor Braden (dekubitus) dan Morse (jatuh) hanya disimpan di state lokal; tidak memicu alert keselamatan di banner pasien. |
| 6 | **Discharge Planning & Summary**| `DischargeSummaryForm.jsx`, `DischargeReadinessForm.jsx` | `emr.service.js` | `discharge_summaries` (0 baris) | 🟣 CLIENT ONLY | Dokumen resume medis pasien pulang sangat lengkap, namun disimpan ke Firestore; tabel PostgreSQL `discharge_summaries` kosong. |
| 7 | **Pelepasan Bed & Final Billing**| `BillingWorkspace.jsx`, `BedStatusCard.jsx` | Express `/api/v1/billing` | `billing_invoices` (0 baris) | 🔴 BROKEN | Pemulangan pasien tidak memvalidasi status lunas dari kasir, dan tidak otomatis mengubah status bed menjadi `DIRTY/CLEANING`. |

---

## 5. Journey 4: Pelayanan Kamar Bedah & Operasi (Surgical & Anesthesia)

**Alur Pasien Operasi:**  
`Penjadwalan Operasi` → `Asesmen Pra-Bedah & Pra-Anestesi` → `Informed Consent Tindakan` → `Transfer ke Kamar Operasi` → `Surgical Safety Checklist (Sign In, Time Out, Sign Out)` → `Dokumentasi Anestesi & Intra-Operatif` → `Pengelolaan Spesimen Patologi` → `Pemulihan di PACU / Skor Aldrete` → `Transfer Balik ke Bangsal / ICU`.

| No | Tahap Alur Bedah | UI Screen / Komponen | Backend API & Service | Tabel Database PostgreSQL | Status Rantai | Catatan & Analisis Kesenjangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | **Penjadwalan Kamar Operasi** | `SurgeryScheduleWorkspace.jsx` | `operatingTheatreEngine.service.js` | `surgical_bookings`, `operating_rooms` (0 baris) | 🟣 CLIENT ONLY | Jadwal kamar operasi diatur di UI dan state in-memory, belum menyimpan jadwal riil ke tabel PostgreSQL. |
| 2 | **Asesmen Pra-Anestesi & Consent**| `PreAnesthesiaAssessmentForm.jsx`, `InformedConsentModal.jsx` | `aimsAnesthesiaEngine.service.js` | `pre_anesthesia_records` (0 baris) | 🟣 CLIENT ONLY | Status fisik ASA dan persetujuan tindakan bedah tidak tersimpan di PostgreSQL. |
| 3 | **Surgical Safety Checklist (WHO)**| `SurgicalSafetyChecklistForm.jsx` | `surgery.service.js` | `surgical_safety_checklists` (0 baris) | 🟣 CLIENT ONLY | Tahapan 3-fase WHO (Sign In, Time Out, Sign Out) ada di form UI, namun tidak mengunci dimulainya insisi bedah. |
| 4 | **Pencatatan Anestesi & Insisi**| `AimsAnesthesiaRecord.jsx` | `aimsAnesthesiaEngine.service.js` | `anesthesia_records`, `surgical_reports` (0 baris) | 🟡 ARCH ONLY | Dokumentasi tanda vital intra-anestesi per 5 menit berjalan via simulasi interval timer client-side. |
| 5 | **Pengelolaan Spesimen PA** | `SpecimenTrackingModal.jsx` | `lis.service.js` | `surgical_specimens` (0 baris) | ⚫ MISSING | Tidak ada integrasi serah terima spesimen jaringan dari meja operasi ke laboratorium patologi anatomi. |
| 6 | **Ruang Pulih Sadar (PACU)** | `AldreteScoreForm.jsx` | `surgery.service.js` | `pacu_records` (0 baris) | 🟣 CLIENT ONLY | Skor pemulihan Aldrete dihitung di form, tetapi tidak membatasi kepindahan pasien ke ruangan sebelum skor >= 8 tercapai. |
| 7 | **Pengurangan BMHP Bedah & Kasa**| `SurgeryInventoryConsumablesTab.jsx` | `inventory.service.js` | `inventory_transactions` (0 baris) | 🔴 BROKEN | Penggunaan kassa, benang bedah, dan implan di kamar operasi tidak terhubung ke pemotongan stok gudang CSSD/Farmasi. |

---

## 6. Journey 5: Logistik, Inventori Farmasi & Rantai Pasok (Supply Chain)

**Alur Rantai Pasok Rumah Sakit:**  
`Analisis Kebutuhan Depo (Demand)` → `Material Request (Permintaan Barang Bangsal)` → `Verifikasi & Persetujuan Kepala Farmasi` → `Purchase Request (PR)` → `Penerbitan Purchase Order (PO) ke Supplier` → `Penerimaan Barang (Goods Receipt) & Cek Fisik` → `Putaway & Pencatatan Batch/Expiry` → `Distribusi Stok ke Depo Pelayanan` → `Dispensing / Konsumsi Pasien` → `Rekonsiliasi Stok & Opname`.

| No | Tahap Alur Inventori | UI Screen / Komponen | Backend API & Service | Tabel Database PostgreSQL | Status Rantai | Catatan & Analisis Kesenjangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | **Master Obat, Alkes & Gudang** | `InventoryManagementWorkspace.jsx` | Express `/api/v1/inventory` | `inventory_items` (80 baris), `warehouses` (10 baris) | 🟢 CONNECTED | Master barang dan master gudang terdefinisi dan memiliki data di PostgreSQL. |
| 2 | **Material Request (Permintaan)**| `MaterialRequestTab.jsx` | `materialRequestEngine.service.js` | `material_requests` (0 baris) | 🟣 CLIENT ONLY | Form permintaan barang antar-unit ada, tetapi persetujuan dan transaksi pergerakannya tidak tercatat di DB. |
| 3 | **Purchase Order (PO) Supplier**| `ProcurementWorkspace.jsx` | `procurement.service.js` | `purchase_orders`, `po_items` (0 baris) | 🟡 DORMANT | Tabel DDL tersedia, namun pembuatan dan pencetakan PO ke supplier belum terhubung ke database aktif. |
| 4 | **Penerimaan Barang (Receiving)**| `GoodsReceiptModal.jsx` | Express `/api/v1/inventory/gr` | `goods_receipts`, `stock_batches` (0 baris) | 🟡 PARTIAL | Modul penerimaan barang tidak mengisikan lot/batch dan tanggal kedaluwarsa secara konsisten ke tabel batch. |
| 5 | **Mutasi Stok Antar Depo** | `StockTransferModal.jsx` | Express `/api/v1/inventory/transfer` | `stock_movements` (0 baris) | 🔴 BROKEN | Perpindahan obat dari Gudang Utama ke Depo Rawat Inap tidak mengubah saldo stok tabel secara atomik. |
| 6 | **Konsumsi & Potong Stok Pasien**| `PharmacyDispensingWorkspace.jsx` | `deductStock` di `inventory.service.js` | `inventory_transactions` (0 baris) | 🔴 BROKEN | Fungsi `deductStock` memanggil Firestore, sedangkan master stok berada di PostgreSQL. Terjadi disparitas data mutlak. |
| 7 | **Stock Opname & Penyesuaian**| `StockOpnameWorkspace.jsx` | Express `/api/v1/inventory/adjust` | `stock_adjustments` (0 baris) | 🟡 DORMANT | Selisih fisik vs sistem dicatat di antarmuka, tetapi penyesuaian tidak menerbitkan jurnal penyesuaian inventori. |

---

## 7. Journey 6: Keuangan & Siklus Pendapatan (Revenue Cycle Management)

**Alur Siklus Pendapatan Rumah Sakit:**  
`Aktivitas Pelayanan Klinis Terverifikasi` → `Pencatatan Biaya Otomatis (Automated Charge Capture)` → `Aplikasi Master Tarif Multi-Komponen` → `Pengelompokan Rincian Tagihan Encounter` → `Verifikasi Penjamin (BPJS/Asuransi/Pribadi)` → `Penyusunan Berkas Klaim INA-CBGs` → `Penerimaan Kasir & Pelunasan` → `Penutupan Transaksi (Closing Encounter)` → `Jurnal Akuntansi & Buku Besar`.

| No | Tahap Siklus Pendapatan | UI Screen / Komponen | Backend API & Service | Tabel Database PostgreSQL | Status Rantai | Catatan & Analisis Kesenjangan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | **Master Tarif Rumah Sakit** | `TariffManagementWorkspace.jsx` | Express `/api/v1/tariffs` | `tariffs` (20 baris), `tariff_components` (0 baris) | 🟢 CONNECTED | Tarif dasar terdata di PostgreSQL, namun rincian komponen (jasa medis, sewa alat, jasa RS) belum terpecah di DB. |
| 2 | **Charge Capture Otomatis** | `ClinicalActionExecutor.jsx` | `triggerBillingItem` di `emr.service.js` | `billing_items` (0 baris) | 🔴 BROKEN | Tindakan dokter menambah tagihan hardcoded Rp 150.000 ke Firestore; tabel `billing_items` PostgreSQL tetap 0 baris. |
| 3 | **Penagihan Obat ke Billing** | `PharmacyOrderVerificationWorkspace.jsx` | `billing.service.js` | `billing_items` (0 baris) | 🔴 BROKEN | Harga obat dari resep tidak mengalir secara otomatis ke tagihan encounter pasien di database PostgreSQL. |
| 4 | **Pemisahan Penjamin (Split-Bill)**| `BillingSummaryCard.jsx` | `payment.service.js` | `billing_invoices` (0 baris) | 🟣 CLIENT ONLY | Pemisahan plafon BPJS vs biaya selisih mandiri dihitung via rumus di komponen React, bukan dari server. |
| 5 | **Klaim INA-CBGs & Casemix** | `CasemixClaimModal.jsx`, `InacbgGroupingCard.jsx` | Express `/api/v1/billing/inacbg` | `casemix_claims`, `inacbg_groupings` (0 baris) | 🟡 DORMANT | Integrasi grouping kode INA-CBGs berbasis diagnosis ICD-10 dan prosedur belum tersambung ke E-Klaim Kemenkes. |
| 6 | **Penerimaan Kasir & Kuitansi** | `PaymentProcessingModal.jsx` | Express `/api/v1/billing/pay` | `cashier_payments` (0 baris) | 🔴 BROKEN | Penerimaan uang fisik/non-tunai di kasir tidak mengunci tagihan di database dan tidak menghasilkan nomor kuitansi resmi. |
| 7 | **Jurnal Akuntansi & Pelaporan**| `FinancialReportWorkspace.jsx` | `accounting.service.js` | `general_ledger_entries` (0 baris) | ⚫ MISSING | Tidak ada integrasi pembuatan ayat jurnal akuntansi dari transaksi kasir ke modul buku besar keuangan RS. |

---

## 8. Ringkasan Diagnostik Kesenjangan Rantai Sistem

```
Total Titik Kritis Perjalanan Rumah Sakit yang Diaudit: 45 Titik Kritis
  - 🟢 CONNECTED & PERSISTENT :  7 Titik (15.5%)
  - 🟣 CLIENT / FIRESTORE ONLY: 19 Titik (42.2%)
  - 🟡 BACKEND / DDL DORMANT   :  8 Titik (17.8%)
  - 🔴 BROKEN / DISCONNECTED   :  9 Titik (20.0%)
  - ⚫ MISSING                 :  2 Titik ( 4.5%)
```

### Kesimpulan Investigasi Forensik:
1. **Titik Terputus Paling Kritis (High Clinical & Financial Hazard):**
   - Rantai antara **Order Dokter (CPOE)** dan **Dispensing Farmasi/eMAR Perawat**: Dokter menginput resep ke Firestore, sementara modul farmasi dan inventori sebagian mengacu ke PostgreSQL. Resep berpotensi tidak terbaca oleh apoteker.
   - Rantai antara **Pelayanan Klinis** dan **Charge Capture Billing**: Pendapatan rumah sakit mengalami *revenue leakage* total karena transaksi klinis tidak memicu pembuatan record pada tabel `billing_invoices` dan `billing_items`.
   - Rantai antara **Triase IGD** dan **Pemesanan Rawat Inap**: Keputusan rawat inap dari dokter IGD tidak memicu reservasi otomatis pada tabel `beds` di modul bangsal.

2. **Arah Perbaikan Wajib (Stage 1 s.d. Stage 7):**
   - Menghilangkan sepenuhnya jembatan Firestore pada `emr.service.js`, `billing.service.js`, dan `inventory.service.js`.
   - Memastikan setiap titik interaksi klinis terhubung ke backend Express API yang menulis langsung ke database PostgreSQL di dalam blok transaksi atomik (`BEGIN ... COMMIT`).
