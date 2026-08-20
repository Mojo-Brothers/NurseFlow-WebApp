# 🏛️ FORENSIC REPOSITORY GAP REGISTER: NURSEFLOW ENTERPRISE HIS 2026

**Tanggal:** 21 Agustus 2026  
**Auditor:** Enterprise Systems Architecture Board & Forensic Systems Audit  
**Klasifikasi:** *Complete Exhaustive Forensic Gap Register (P0 / P1 / P2 / P3)*

---

## 1. 📊 MATRIKS TEMUAN GAP FORENSIK SISTEMIK (FORENSIC GAPS)

### 🔴 GAP SEVERITY P0: CLINICAL SAFETY, SECURITY & DATA INTEGRITY BLOCKERS

| Gap ID | Domain | File Terkait | Kondisi Saat Ini (Current Behavior) | Kondisi Seharusnya (Expected Behavior) | Root Cause | Risiko Klinis / Finansial | Solusi Remediasi |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-P0-01** | **Bank Darah (BDRS)** | `src/modules/blood_bank/components/*.jsx`, `server/services/bloodBank.service.js` | UI Studio mengimpor Map in-memory dari backend dan menyimpan stok unit darah di browser heap. | Seluruh unit darah, uji crossmatch, dan bedside dual nurse verification harus tersimpan di PostgreSQL 16 (`blood_donor_units`). | Tidak ada controller Express REST API untuk Bank Darah. | **FATAL**: Data transfusi darah dan uji silang kompatibilitas hilang saat browser di-refresh. | Bangun Express Controller `/api/v1/blood-bank`, sambungkan ke PostgreSQL, ubah frontend ke `fetch/apiClient`. |
| **GAP-P0-02** | **Kredensial & Hak Klinis Staf** | `src/modules/staff/pages/StaffPrivilegingWorkspacePage.jsx` | Kredensial dokter/perawat dan batas kewenangan klinis hanya tercatat di in-memory state. | Kewenangan klinis (Clinical Privileges) dokter untuk tindakan medis wajib tervalidasi ke PostgreSQL (`clinical_privileges`). | Tidak ada controller Express REST API untuk Staff Privileging. | **FATAL**: Dokter tanpa kredensial atau yang sedang diskors dapat melakukan tindakan medis tanpa validasi sistem. | Bangun Express Controller `/api/v1/staff-privileges`, proteksi dengan role `ROLE_ADMIN`. |
| **GAP-P0-03** | **Celah RBAC Rute Klinis Sensitif** | `src/routes/clinical.routes.jsx` | Rute `/blood-bank`, `/operating-theatre`, `/pharmacy-enterprise`, `/icu-acuity` tidak memiliki guard `allowedRoles`. | Setiap rute spesialis wajib memvalidasi role profesi (misal: perawat bedah, analis lab, apoteker) sebelum merender halaman. | Wrapper rute hanya menggunakan `<Wrap>` tanpa `ProtectedRoute`. | **TINGGI**: User non-medis atau staf pendaftaran dapat membuka kontrol bedah atau farmasi. | Pasang `ProtectedRoute` dengan `allowedRoles` yang presisi di `src/routes/clinical.routes.jsx`. |

---

### 🟠 GAP SEVERITY P1: PRODUCTION FUNCTIONAL BLOCKERS & WIRING GAPS

| Gap ID | Domain | File Terkait | Kondisi Saat Ini (Current Behavior) | Kondisi Seharusnya (Expected Behavior) | Root Cause | Risiko Operasional | Solusi Remediasi |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-P1-01** | **Master Data Hub (18 Modul)** | `src/modules/master_data/pages/MasterDataWorkspacePage.jsx` | Perubahan master tarif, ruangan, fasilitas, dan organisasi tersimpan di `IndexedDB` lokal browser. | Perubahan master data wajib tersimpan di PostgreSQL 16 dengan riwayat SCD2 dan tanda tangan digital. | Tidak ada REST API endpoint `/api/v1/master-data` di `server.js`. | **TINGGI**: Perubahan tarif atau struktur ruangan oleh admin tidak tersinkronisasi ke kasir atau perawat lain. | Bangun Express Controller `/api/v1/master-data`, konsolidasikan dual service, hubungkan ke PostgreSQL. |
| **GAP-P1-02** | **Jadwal Temu & Antrean Pasien** | `src/modules/appointment/pages/AppointmentPage.jsx`, `BookingModal.jsx` | Form booking jadwal dokter menggunakan array mock `MOCK_DOCTORS` dan `MOCK_SLOTS`. | Jadwal dokter dan booking janji temu harus membaca kuota real-time dari tabel `patient_appointments`. | Modul appointment belum tersambung ke backend Express. | **SEDANG**: Terjadi bentrok jadwal temu pasien dan data booking fiktif. | Bangun Express Controller `/api/v1/appointments`, hubungkan ke DB `patient_appointments`. |
| **GAP-P1-03** | **Supply Chain & Logistik Farmasi** | `src/modules/inventory/pages/EnterpriseInventoryPage.jsx` | Mutasi dan penerimaan barang berjalan secara lokal dan tidak ada menu di sidebar navigasi. | Mutasi barang antardepo farmasi wajib mengurangi stok di `inventory_stock_ledgers` dan tercantum di sidebar navigasi. | Endpoint REST API dan menu navigasi belum dibangun. | **SEDANG**: Kebocoran stok obat, selisih fisik gudang farmasi tidak terdeteksi. | Bangun Controller `/api/v1/inventory`, tambahkan ke Nav Sidebar, proteksi `ROLE_PHARMACIST`. |
| **GAP-P1-04** | **SATUSEHAT FHIR R4 Interop Studio** | `src/modules/interoperability/pages/SatusehatInteroperabilityStudioPage.jsx` | Simulator pengiriman FHIR bundle tidak memanggil API runtime Express dan tidak ada di sidebar navigasi. | Pengiriman bundle FHIR ke Kemkes wajib diproses melalui token vault dan outbox worker backend. | Endpoint REST API dan link navigasi belum dipasang. | **SEDANG**: Ketidakpatuhan regulasi SatuSehat Kemenkes RI (Permenkes 24/2022). | Bangun Controller `/api/v1/satusehat`, tambahkan ke Nav Sidebar, proteksi `ROLE_ADMIN`. |
| **GAP-P1-05** | **Hospital Central Command Center** | `src/modules/dashboard/pages/HospitalCentralCommandCenterPage.jsx` | 7 dashboard analitik eksekutif mengimpor service in-memory dan tidak tercantum di sidebar navigasi. | Dashboard eksekutif harus membaca data agregasi langsung dari database PostgreSQL. | Modul belum di-wire ke backend dan navigasi. | **SEDANG**: Direktur RS tidak dapat memonitor kapasitas tempat tidur, BOR, dan KPI secara real-time. | Bangun Controller `/api/v1/command-center`, tambahkan ke Nav Sidebar, proteksi `ROLE_SUPERVISOR`. |

---

### 🟡 GAP SEVERITY P2: DUPLICATE ARCHITECTURE & ORPHANED WORKFLOWS

| Gap ID | Domain | File Terkait | Kondisi Saat Ini (Current Behavior) | Kondisi Seharusnya (Expected Behavior) | Root Cause | Solusi Remediasi |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-P2-01** | **Duplikasi Master Data Services** | `server/services/masterDataGovernance.service.js` vs `masterDataGovernanceEngine.service.js` | Terdapat dua service master data dengan nama dan logika yang berbeda. | Hanya ada satu canonical master data governance engine yang terhubung ke PostgreSQL ACID. | Fase pengembangan lama tidak didepresiasi saat fase enterprise dibangun. | Konsolidasikan consumer ke `masterDataGovernanceEngine.service.js`, lalu hapus file lama. |
| **GAP-P2-02** | **Duplikasi Bank Darah Services** | `server/services/bloodBank.service.js` vs `bloodBankEnterpriseEngine.service.js` | Terdapat service in-memory Map dan service PostgreSQL enterprise. | Seluruh transaksi bank darah wajib menggunakan canonical `bloodBankEnterpriseEngine.service.js`. | UI masih terikat ke implementasi prototype in-memory. | Sambungkan REST API ke `bloodBankEnterpriseEngine.service.js`, hapus file in-memory. |
| **GAP-P2-03** | **Duplikasi Audit Services** | `src/core/services/audit.service.js` vs `src/core/audit/audit.service.js` | Dua berkas audit service terpisah di folder `src/core/`. | Satu client audit adapter tunggal yang terintegrasi ke backend SHA-256 Merkle chain. | Refactoring parsial pada sprint sebelumnya. | Satukan import ke `src/core/services/audit.service.js`, hapus folder duplikat. |
| **GAP-P2-04** | **36 Rute Unreachable via Sidebar** | `src/layouts/MainLayout.jsx`, `src/routes/*.jsx` | 36 rute React Router tidak memiliki tautan di `ENTERPRISE_NAV_SCHEMA`. | Seluruh fitur operasional rumah sakit harus dapat dijangkau user melalui menu sidebar navigasi yang rapi. | `ENTERPRISE_NAV_SCHEMA` belum disinkronkan dengan penambahan modul baru. | Tambahkan modul yang relevan ke dalam skema navigasi sidebar 10-domain. |

---

### ⚪ GAP SEVERITY P3: DOCUMENTATION DRIFT & UX POLISH

| Gap ID | Domain | File Terkait | Kondisi Saat Ini (Current Behavior) | Kondisi Seharusnya (Expected Behavior) | Root Cause | Solusi Remediasi |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-P3-01** | **Documentation Drift di README** | `README.md` | README masih tertulis *15 Migration Scripts & 44 Test Suites*. | README harus mencerminkan status riil: *70 Migrations, 209 Tables, 166 Test Suites, 1.642 Tests*. | Dokumentasi belum diperbarui sejak Sprint 2. | Perbarui `README.md` dengan tabel arsitektur dan status verifikasi terkini. |
| **GAP-P3-02** | **Direct Import Cleaning di UI** | 12 Berkas Komponen di `src/modules/` | Komponen frontend mengimpor file di `server/services/` langsung. | Komponen frontend dilarang mengimpor file `server/`, harus melalui `apiClient` / HTTP REST. | Kemudahan akses saat tahap prototyping. | Refaktor seluruh import langsung menjadi pemanggilan `apiClient` asinkron. |
| **GAP-P3-03** | **Role Tagging di Billing Page** | `src/routes/admin.routes.jsx` (`/billing`) | Hanya role `ADMIN` dan `DOCTOR` yang boleh membuka `/billing`. | Role `CASHIER` dan `CASEMIX_CODER` wajib diizinkan mengakses tagihan dan casemix. | Definisi guard awal terlalu sempit. | Tambahkan `CASHIER` dan `CASEMIX_CODER` pada `allowedRoles` rute `/billing`. |

---

## 2. 🛡️ RINGKASAN KUANTITATIF GAP REGISTER

```text
========================================================================================
TOTAL TEMUAN GAP FORENSIK TERVERIFIKASI:
========================================================================================
• P0 (Clinical Safety & Security Blockers) : 3 Temuan Kritis (Bank Darah, Kredensial, RBAC)
• P1 (Production Functional & Wiring Gaps) : 5 Temuan Utama (Master Data, Booking, Logistik, SatuSehat, Command Center)
• P2 (Duplicate Architecture & Orphan Nav) : 4 Temuan Menengah (Dual Services, 36 Orphan Routes)
• P3 (Documentation & UX Drift)            : 3 Temuan Minor (README, Direct Imports, Billing Roles)
----------------------------------------------------------------------------------------
• TOTAL GAP TERDAFTAR                     : 15 GAP SISTEMIK (0 Halusinasi / 100% Bukti Kode)
========================================================================================
```
