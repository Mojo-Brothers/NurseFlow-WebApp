# NURSEFLOW ENTERPRISE HIS — TRACEABILITY MATRIX
**Status Dokumen:** `LIFECYCLE TRACEABILITY REGISTER`  
**Tanggal Rilis:** 23 September 2026  
**Standar Evaluasi:** Rantai Keterikatan 11 Lapis (`REQ ➔ DOMAIN ➔ WORKFLOW ➔ FORM ➔ DB ➔ API ➔ UI ➔ AUTH ➔ AUDIT ➔ TEST ➔ INTEGRATION`)  

---

## 1. PEMETAAN RANTAI KETERIKATAN (END-TO-END TRACEABILITY)

Setiap kebutuhan bisnis rumah sakit wajib dapat ditelusuri secara utuh dari regulasi hingga pelaporan. Rantai yang putus di salah satu mata rantai ditandai dengan ⚠️ **BROKEN LINK** atau ❌ **MISSING**.

---

### TRACE-01: Registrasi Pasien & Pencegahan Duplikasi Identitas (EMPI)
* **Kebutuhan Bisnis:** Permenkes 24/2022 Pasal 14, JCI IPSG 1 (Identifikasi Pasien Unik Nasional berbasis NIK/Paspor).
* **Domain:** `DOMAIN 4: PATIENT FRONT OFFICE`
* **Workflow:** Pasien Datang $\rightarrow$ Cek NIK $\rightarrow$ Deteksi Duplikasi EMPI $\rightarrow$ Terbitkan MRN Baru $\rightarrow$ Buat Rekam Pasien.
* **Form:** `RegistrationDeskWorkspace.jsx` (Modal Pendaftaran Pasien Baru).
* **Database:** `master_patients` (kolom `mrn`, `nik`, `full_name`, `birth_date`, `is_active`).
* **API:** `POST /api/v1/patients` (`patientApplication.service.js`).
* **UI Component:** `src/modules/front_office/components/RegistrationDeskWorkspace.jsx`.
* **Authorization:** `ADMIN`, `SUPERVISOR`, `FRONT_DESK`.
* **Audit Trail:** Dicatat ke `universal_audit_logs` (`action: 'PATIENT_REGISTERED'`).
* **Automated Test:** `tests/verticalSlice01PatientDurability.test.js`.
* **Reporting:** Laporan Kunjungan & Registrasi Pasien (`EncounterSummaryPage.jsx`).
* **Interoperability:** Mapping FHIR `Patient` resource untuk SATUSEHAT.
* **Status Rantai:** 🟢 **TERTUTUP SEMPURNA (100% TRACEABLE)**.

---

### TRACE-02: Entri Order Medis Terpadu (Universal CPOE) & Pengamanan Resep
* **Kebutuhan Bisnis:** JCI MMU.4 (Prescription & Ordering Integrity), Permenkes 24/2022 (Resep Elektronik Berizin DPJP).
* **Domain:** `DOMAIN 7: UNIVERSAL CPOE & ORDER MANAGEMENT`
* **Workflow:** Dokter pilih obat/lab $\rightarrow$ Skrining CDSS Alergi & Interaksi $\rightarrow$ Jika konflik, tampilkan HardStopModal $\rightarrow$ Terbitkan SafetyDecision $\rightarrow$ Simpan CPOE $\rightarrow$ Transmisi ke Farmasi/Lab.
* **Form:** `UniversalOrderModal.jsx` / `OrdersWorkspace.jsx`.
* **Database:** `clinical_orders`, `cpoe_order_items`, `safety_decision_registry`.
* **API:** `POST /api/v1/orders/cpoe` (`cpoeApplication.service.js`).
* **UI Component:** `src/modules/clinical_core/components/UniversalOrderModal.jsx`.
* **Authorization:** `DOCTOR`, `SURGEON`, `ANESTHESIOLOGIST` (Didukung token otorisasi keselamatan).
* **Audit Trail:** WORM audit log dengan hash SHA-256 dan RFC 8785 JSON Canonicalization Scheme.
* **Automated Test:** `tests/phaseD23EAdversarialSafetyProof.test.js`, `tests/verticalSlice06AUniversalCpoeDurability.test.js`.
* **Reporting:** Daftar Pemeriksaan RJ / RI & Lembar Resep Farmasi.
* **Interoperability:** Mapping FHIR `ServiceRequest` & `MedicationRequest`.
* **Status Rantai:** 🟢 **TERTUTUP SEMPURNA (100% TRACEABLE)**.

---

### TRACE-03: Triase Kegawatdaruratan (Emergency Triage ATS)
* **Kebutuhan Bisnis:** Kemenkes RI Standar Akreditasi Rumah Sakit (STARKES) Akses & Kontinuitas Pelayanan (AKP 1.1).
* **Domain:** `DOMAIN 4 & 5: EMERGENCY CARE`
* **Workflow:** Pasien Tiba di IGD $\rightarrow$ Penilaian Kegawatan Visual & TTV $\rightarrow$ Penetapan ATS 1-5 $\rightarrow$ SLA Timer Berjalan $\rightarrow$ Alokasi Zona Resusitasi / P1 / P2 / P3.
* **Form:** Form Cepat Triase (`TriagePage.jsx`).
* **Database:** `triage_assessments`, `triage_sla_timers`.
* **API:** `POST /api/v1/triage` (`triageApplication.service.js`).
* **UI Component:** `src/modules/triage/pages/TriagePage.jsx`, `IgdCommandCenter.jsx`.
* **Authorization:** `NURSE`, `DOCTOR`.
* **Audit Trail:** Dicatat ke `universal_audit_logs`.
* **Automated Test:** `tests/verticalSlice04TriageDurability.test.js`.
* **Reporting:** Dashboard Laporan Bulanan UGD (`LaporanBulananUgdPage.jsx`).
* **Interoperability:** Mapping FHIR `Encounter` (class: `EMER`).
* **Status Rantai:** 🟢 **TERTUTUP SEMPURNA (100% TRACEABLE)**.

---

### TRACE-04: Transfusi Darah & Verifikasi Sisi Ranjang (Bedside Dual-Nurse)
* **Kebutuhan Bisnis:** Permenkes 91/2015 (Standar Pelayanan Transfusi Darah), JCI IPSG 1 (Pencegahan Reaksi Hemolitik ABO).
* **Domain:** `DOMAIN 11: BLOOD BANK & TRANSFUSION SAFETY`
* **Workflow:** Dokter order darah $\rightarrow$ Bank Darah crossmatch $\rightarrow$ Darah tiba di bangsal $\rightarrow$ Verifikasi 2 Perawat (Barcode Kantong + Barcode Pasien) $\rightarrow$ Monitoring TTV pre/intra/post transfusi.
* **Form:** `BedsideTransfusionVerificationStudio.jsx`.
* **Database:** `blood_donor_units`, `blood_crossmatch_tests`, `blood_transfusion_records`, `blood_bedside_verifications`.
* **API:** `POST /api/v1/blood-bank/transfusion/verify` (`bloodBank.routes.js`).
* **UI Component:** `src/modules/blood_bank/components/BedsideTransfusionVerificationStudio.jsx`.
* **Authorization:** `NURSE`, `DOCTOR`, `BLOOD_BANK_OFFICER`.
* **Audit Trail:** Log verifikasi barcode dan nama kedua perawat tersimpan di `blood_bedside_verifications`.
* **Automated Test:** `tests/phaseC2ClinicalSafetyE2EValidation.test.js`.
* **Reporting:** Rekapitulasi transfusi di Rekam Medis Terintegrasi.
* **Interoperability:** Log reaksi transfusi ke komite mutu / hemovigilans.
* **Status Rantai:** 🟢 **TERTUTUP SEMPURNA (100% TRACEABLE)**.

---

### TRACE-05: Permintaan Barang & Mutasi Farmasi (Material Request & RO)
* **Kebutuhan Bisnis:** ISO 9001:2015 Supply Chain, Akreditasi RS Pengelolaan Obat & Alkes (PKPO).
* **Domain:** `DOMAIN 13: INVENTORY & LOGISTICS`
* **Workflow:** Bangsal buat RO $\rightarrow$ Kepala Unit tanda tangan $\rightarrow$ Gudang validasi $\rightarrow$ Pengeluaran stok batch FEFO $\rightarrow$ Penerimaan bangsal $\rightarrow$ Kartu stok terupdate.
* **Form:** `MaterialRequestTab.jsx`.
* **Database:** `inventory_batches`, `inventory_stock_movements`.
* **API:** ⚠️ **BROKEN LINK**: Backend memiliki `inventoryManagement.service.js` dan endpoint `/api/v1/inventory/transfer`, namun...
* **UI Component:** ⚠️ **BROKEN LINK**: `MaterialRequestTab.jsx` membaca dan menulis ke `localStorage['nurseflow_ro_list']` dan `localStorage['material_request_*']`.
* **Authorization:** ⚠️ **BROKEN LINK**: Meminta PIN otorisasi yang di-hardcode ke string statis `'123456'`.
* **Audit Trail:** ❌ **MISSING**: Tidak ada log audit PostgreSQL untuk mutasi lokal ini.
* **Automated Test:** `tests/inventoryManagement.test.js` (Hanya menguji backend service terisolasi).
* **Reporting:** Tab Kartu Stok di UI.
* **Interoperability:** Tidak ada.
* **Status Rantai:** 🟠 **PARTIAL / TECHNICAL DEBT (UI-DB DISCONNECTED)**.

---

### TRACE-06: Billing Kasir & Pelunasan Pasien Pulang
* **Kebutuhan Bisnis:** Akuntabilitas Keuangan RS, Penutupan Administrasi Pasien Pulang (Discharge Billing Settlement).
* **Domain:** `DOMAIN 15: FINANCE & REVENUE CYCLE`
* **Workflow:** Pasien dinyatakan pulang $\rightarrow$ Kasir tarik rekap tindakan/obat $\rightarrow$ Formulir split invoice (BPJS vs Selisih Pasien) $\rightarrow$ Pasien bayar $\rightarrow$ Terbitkan kwitansi $\rightarrow$ Update status encounter menjadi `DISCHARGED`.
* **Form:** `BillingPage.jsx`.
* **Database:** ⚠️ **BROKEN LINK**: Tabel `hospital_invoices`, `billing_ledgers`, `cashier_payment_transactions` memiliki **0 baris data** di PostgreSQL!
* **API:** Backend memiliki `patientFinancialAndRevenueCycle.service.js`, namun tidak dipanggil secara mutatif oleh kasir frontend.
* **UI Component:** `src/modules/billing/pages/BillingPage.jsx` (Menampilkan kalkulasi tarif di memori).
* **Authorization:** `CASHIER`, `FINANCE`, `ADMIN`.
* **Audit Trail:** ❌ **MISSING**: Bukti pembayaran tidak tersimpan di database permanen.
* **Automated Test:** `tests/s10DischargeBillingSettlementReconciliation.test.js` (Hanya menguji mock memory).
* **Reporting:** Kwitansi cetak layar simulasi.
* **Interoperability:** Sinkronisasi piutang ke GL accounting tidak ada.
* **Status Rantai:** 🔴 **MISSING PERSISTENCE (UI SAJA / NO DB DATA)**.

---

### TRACE-07: Interoperabilitas SATUSEHAT (Kemenkes RI FHIR R4)
* **Kebutuhan Bisnis:** Permenkes 24/2022 tentang Kewajiban Integrasi RME ke Platform SATUSEHAT.
* **Domain:** `DOMAIN 16: INTEROPERABILITAS & GOVERNANCE`
* **Workflow:** Tindakan klinis selesai $\rightarrow$ Domain outbox menangkap event $\rightarrow$ Worker mapping ke FHIR R4 (Encounter, Condition, Observation, Procedure) $\rightarrow$ Ambil OAuth token Kemenkes $\rightarrow$ Kirim ke API SATUSEHAT $\rightarrow$ Catat respons ID FHIR ke database.
* **Form:** `SatusehatInteroperabilityStudioPage.jsx`.
* **Database:** `tenant_satusehat_credentials`, `fhir_delivery_outbox`, `clinical_domain_outbox`.
* **API:** `POST /api/v1/satusehat/transmit`, `GET /api/v1/satusehat/logs`.
* **UI Component:** `src/modules/interoperability/pages/SatusehatInteroperabilityStudioPage.jsx`.
* **Authorization:** `ADMIN`, `IT_ADMIN`.
* **Audit Trail:** Tersimpan di `universal_audit_logs`.
* **Automated Test:** `tests/satusehatConformanceAndChaosEngine.test.js`, `tests/sprint3P6SatusehatLiveIntegration.test.js`.
* **Reporting:** Studio dashboard interaktif dengan validasi struktur JSON FHIR.
* **Interoperability:** SATUSEHAT Sandbox API.
* **Status Rantai:** 🔵 **IMPLEMENTED BUT INTEGRATION INCOMPLETE (Perlu Live Credentials Rumah Sakit)**.

---

### TRACE-08: Autentikasi Pengguna & Penegakan Peran Medis (RBAC)
* **Kebutuhan Bisnis:** JCI MOI (Manajemen Komunikasi & Informasi), Standar Perlindungan Data Pribadi (UU PDP).
* **Domain:** `DOMAIN 2: PEOPLE, IDENTITY & ROLES`
* **Workflow:** Staf masukkan kredensial $\rightarrow$ Verifikasi password hash bcrypt $\rightarrow$ Periksa status STR/SIP $\rightarrow$ Terbitkan session/JWT dengan daftar hak akses $\rightarrow$ Muat workspace sesuai peran.
* **Form:** `LoginPage.jsx`.
* **Database:** ⚠️ **BROKEN LINK**: Tabel `auth_users` hanya berisi 4 baris, `auth_permissions` kosong.
* **API:** ⚠️ **BROKEN LINK**: `server/routes/auth.routes.js` mengabaikan password dan mengembalikan role DPJP untuk semua akun.
* **UI Component:** `src/modules/auth/auth.store.js` (Menyimpan sesi ke `localStorage['nurseflow_auth_session']`).
* **Authorization:** ⚫ **UNSAFE**: Siapapun dapat berganti peran melalui pemilih persona tanpa verifikasi kredensial.
* **Audit Trail:** ❌ **MISSING**: Login/logout tidak dicatat ke log PostgreSQL yang otentik.
* **Automated Test:** `tests/rbac.test.js`.
* **Reporting:** Tidak ada.
* **Interoperability:** Tidak ada.
* **Status Rantai:** ⚫ **DUPLICATED / CONFLICTING / UNSAFE**.
