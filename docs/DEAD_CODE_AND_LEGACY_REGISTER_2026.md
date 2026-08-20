# 🏛️ DEAD CODE, ORPHAN, AND LEGACY REGISTER: NURSEFLOW ENTERPRISE HIS 2026

**Tanggal:** 21 Agustus 2026  
**Auditor:** Enterprise HIS Architecture Board & Quality Governance  
**Prinsip Kehati-hatian:** *"Dilarang menghapus berkas berdasarkan asumsi nama atau ketidakhadiran import sekilas. Klasifikasikan secara presisi berdasarkan bukti dependensi aktual."*

---

## 1. 📊 DAFTAR KLASIFIKASI KODE MATI, ORPHAN & LEGACY

| # | File / Artifact Path | Kategori Temuan | Bukti Dependensi & Consumer | Alasan Klasifikasi | Tindakan Rekomendasi | Tingkat Risiko Penghapusan |
| :-: | :--- | :---: | :--- | :--- | :--- | :---: |
| **01** | `server/services/atomicTransaction.service.js` | ⚫ **DEAD CODE** | **0 Callers** di `server/`, `src/`, maupun `tests/`. | File dibuat saat fase awal transaksi atomic, fungsinya telah digantikan sepenuhnya oleh `server/db/postgresPool.js` (`client.query('BEGIN')`). | Hapus file setelah audit forensik selesai. | 🟢 **SANGAT RENDAH (SAFE TO DELETE)** |
| **02** | `src/core/audit/audit.service.js` | ⚪ **DUPLICATE / SHADOW** | Dipanggil oleh `src/core/services/persistenceAdapter.service.js`. | Merupakan salinan parsial dari `src/core/services/audit.service.js`. | Alihkan import consumer ke `src/core/services/audit.service.js`, lalu hapus duplikasi ini. | 🟡 **SEDANG (MIGRASI IMPORT DULU)** |
| **03** | `server/services/masterDataGovernance.service.js` | ⚪ **DUPLICATE / LEGACY** | Dipanggil oleh `tests/masterDataGovernance.test.js`. | Versi in-memory sederhana (5.7 KB) yang menduplikasi `masterDataGovernanceEngine.service.js` (20.8 KB, PostgreSQL ACID). | Alihkan test ke `masterDataGovernanceEngine.service.js`, lalu hapus file ini. | 🟡 **SEDANG (MIGRASI TEST DULU)** |
| **04** | `server/services/bloodBank.service.js` | ⚪ **DUPLICATE / LEGACY** | Dipanggil oleh komponen UI `BloodInventoryColdChainStudio.jsx` dan `tests/bloodBank.test.js`. | Menyimpan unit darah dalam JavaScript `Map` in-memory. Versi PostgreSQL ACID sebenarnya adalah `bloodBankEnterpriseEngine.service.js`. | Alihkan UI dan test ke REST API `/api/v1/blood-bank`, lalu hapus file in-memory ini. | 🔴 **TINGGI (WAJIB BUAT REST API DULU)** |
| **05** | `src/routes/enterprise.routes.jsx` | 👻 **ORPHAN ROUTES** | Berisi rute `/credentials`, `/satusehat`, `/interoperability`. | Rute `/credentials` menduplikasi `/staff-privileges`. Rute `/satusehat` tidak muncul di sidebar navigasi. | Satukan rute ke `admin.routes.jsx`, masukkan ke sidebar navigasi. | 🟡 **SEDANG (KONSOLIDASI RUTE)** |
| **06** | `src/modules/integration/pages/GoLiveControlCenter.jsx` | 👻 **ORPHAN PAGE** | Didaftarkan di `/go-live-control` pada `emr.routes.jsx`, tetapi tidak ada link di sidebar navigasi. | Halaman pusat kesiapan go-live tersembunyi dari menu user. | Tambahkan link ke menu `ADMINISTRATION` di sidebar navigasi. | 🟢 **SANGAT RENDAH** |
| **07** | `src/modules/dashboard/pages/HospitalCentralCommandCenterPage.jsx` | 🧟 **ZOMBIE FEATURE** | Didaftarkan di `/command-center`, memiliki UI mewah (7 studio), tetapi mengimpor mock/service in-memory dan tidak ada link navigasi. | Tampak canggih di level kode, tetapi terputus dari ekosistem operasional. | Bangun REST API `/api/v1/command-center`, hubungkan ke PostgreSQL, tambahkan ke sidebar navigasi. | 🔴 **TINGGI (BUTUH SYSTEM WIRING)** |
| **08** | `src/modules/inventory/pages/EnterpriseInventoryPage.jsx` | 🧟 **ZOMBIE FEATURE** | Didaftarkan di `/inventory/*`, memiliki form mutasi dan penerimaan barang, tetapi tidak ada link navigasi dan belum ada REST API backend. | Data tersimpan lokal di browser user tanpa sinkronisasi ke server farmasi. | Bangun REST API `/api/v1/inventory`, tambahkan ke sidebar navigasi. | 🔴 **TINGGI (BUTUH SYSTEM WIRING)** |
| **09** | `src/modules/interoperability/pages/SatusehatInteroperabilityStudioPage.jsx` | 🧟 **ZOMBIE FEATURE** | Didaftarkan di `/satusehat`, memiliki builder FHIR bundle, tetapi tidak ada link navigasi dan belum ada endpoint runtime Express. | Simulator berjalan murni di browser tanpa persistence outbox PostgreSQL. | Bangun REST API `/api/v1/satusehat`, tambahkan ke sidebar navigasi. | 🔴 **TINGGI (BUTUH SYSTEM WIRING)** |
| **10** | `src/modules/appointment/components/BookingModal.jsx` | 🟣 **MOCK / DEMO DATA** | Menggunakan array `MOCK_DOCTORS` dan `MOCK_SLOTS` statis. | Pasien dan jadwal dokter tidak membaca tabel PostgreSQL `patient_appointments` atau `master_practitioners`. | Ganti mock data dengan fetch ke REST API `/api/v1/appointments`. | 🟡 **SEDANG** |

---

## 2. 🛡️ RINGKASAN KUANTITATIF ARTEFAK MATI & ZOMBIE

```text
========================================================================================
RINGKASAN TEMUAN ARTEFAK NON-CANONICAL:
========================================================================================
• Dead Code Murni (Zero Consumers)       : 1 Berkas (`atomicTransaction.service.js`)
• Duplicate / Shadow Services            : 3 Pasang Berkas (Audit, Master Data, Blood Bank)
• Orphan Pages / Routes                  : 36 Rute Unreachable via Sidebar Nav
• Zombie Features (UI Ada, Backend Putus): 3 Modul Besar (Command Center, Inventory, SATUSEHAT)
• Mock Data Hardcoded di UI              : 2 Berkas (Appointment Booking & Slots)
========================================================================================
```
